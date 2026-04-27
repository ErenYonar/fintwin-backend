// src/store/useStore.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

import {
  AuthAPI, UserAPI, TransactionAPI,
  Transaction, TransactionCreate, UserProfile,
} from '../services/api';
import {
  getAllTransactions, addTransaction, updateTransaction,
  deleteTransaction, clearAllLocal, setCurrentUser, saveFeedback,
} from '../services/localDb';
import { getExchangeRates, ExchangeRates } from '../services/exchangeService';
import { applyTheme } from '../utils/theme';

interface SyncState {
  isSyncing: boolean; lastSync: string | null;
  pendingCount: number; isOnline: boolean;
}

interface Analytics {
  gelir: number; gider: number; net: number;
  finansal_skor: number; tasarruf_orani: number;
}

interface AppStore {
  token:         string | null;
  user:          UserProfile | null;
  isLoggedIn:    boolean;
  transactions:  Transaction[];
  exchangeRates: Record<string, number>;
  ratesMeta:     { lastUpdated: string; source: string } | null;
  analytics:     Analytics | null;
  trends:        any[];
  lang:          'TR' | 'EN';
  themeMode:     'dark' | 'light';
  isLoading:     boolean;
  syncState:     SyncState;

  login:             (email: string, lang: string) => Promise<void>;
  verifyOtp:         (email: string, code: string) => Promise<void>;
  register:          (data: any) => Promise<void>;
  logout:            () => Promise<void>;
  loadTransactions:  () => Promise<void>;
  addTx:             (data: TransactionCreate) => Promise<void>;
  updateTx:          (local_id: string, data: Partial<TransactionCreate>) => Promise<void>;
  deleteTx:          (local_id: string) => Promise<void>;
  syncWithServer:    () => Promise<void>;
  scheduleSync:      () => void;
  loadExchangeRates: (forceRefresh?: boolean) => Promise<void>;
  loadAnalytics:     () => Promise<void>;
  setLang:           (lang: 'TR' | 'EN') => void;
  setThemeMode:      (mode: 'dark' | 'light') => void;
  deleteAccount:     () => Promise<void>;
  sendFeedback:      (message: string) => Promise<void>;
}

function calcAnalytics(txs: Transaction[]): Analytics {
  const gelir = txs.filter(t => t.tip === 'Gelir').reduce((s, t) => s + t.tutar, 0);
  const gider = txs.filter(t => t.tip === 'Gider').reduce((s, t) => s + t.tutar, 0);
  const net   = gelir - gider;
  const score = gelir > 0
    ? Math.min(95, Math.max(5, Math.round(((gelir - gider) / gelir) * 100 + 30)))
    : 0;
  return { gelir, gider, net, finansal_skor: score, tasarruf_orani: gelir > 0 ? (net / gelir) * 100 : 0 };
}

function getUserKey(user: UserProfile | null): string {
  if (!user) return 'default';
  return user.mail_hash || String(user.id) || 'default';
}

export const useStore = create<AppStore>((set, get) => ({
  token: null, user: null, isLoggedIn: false,
  transactions: [],
  exchangeRates: { TL: 1, USD: 38.5, EUR: 41.5, GBP: 49.0 },
  ratesMeta: null, analytics: null, trends: [],
  lang: 'TR', isLoading: false,
  themeMode: 'dark' as 'dark' | 'light',
  syncState: { isSyncing: false, lastSync: null, pendingCount: 0, isOnline: true },

  login: async (email, lang) => {
    await AuthAPI.login(email, lang);
  },

  verifyOtp: async (email, code) => {
    const { data } = await AuthAPI.verifyOtp(email, code);
    const { access_token, user } = data;
    await AsyncStorage.setItem('fintwin_token', access_token);
    await AsyncStorage.setItem('fintwin_user', JSON.stringify(user));
    setCurrentUser(getUserKey(user));
    set({ token: access_token, user, isLoggedIn: true, lang: user.lang || 'TR' });
    
    // Local işlemleri yükle
    const localTxs = await getAllTransactions();
    set({ transactions: localTxs, analytics: calcAnalytics(localTxs) });
    
    // Backend ile sync et
    get().syncWithServer();
    get().loadExchangeRates();
  },

  register: async (data) => {
    await AuthAPI.register(data);
  },

  logout: async () => {
    set({
      token: null, user: null, isLoggedIn: false,
      transactions: [], analytics: null, trends: [],
    });
    try {
      await AsyncStorage.multiRemove(['fintwin_token', 'fintwin_user']);
    } catch (e) { console.warn('AsyncStorage clear:', e); }
    setCurrentUser('default');
  },

  loadTransactions: async () => {
    try {
      const txs = await getAllTransactions();
      set({ transactions: txs, analytics: calcAnalytics(txs) });
    } catch (e) { console.warn('[Store] loadTransactions:', e); }
  },

  addTx: async (data) => {
    const local_id = uuidv4();
    // 1. Local'e kaydet
    await addTransaction({ ...data, local_id });
    const txs = await getAllTransactions();
    set({ transactions: txs, analytics: calcAnalytics(txs) });
    
    // 2. Backend'e gönder
    const { token } = get();
    if (token) {
      try {
        await TransactionAPI.create({ ...data, local_id });
      } catch (e) {
        console.warn('[Store] addTx backend sync failed:', e);
      }
    }
  },

  updateTx: async (local_id, data) => {
    await updateTransaction(local_id, data);
    const txs = await getAllTransactions();
    set({ transactions: txs, analytics: calcAnalytics(txs) });
    
    // Backend'de id bul ve güncelle
    const { token } = get();
    if (token) {
      try {
        const tx = txs.find(t => t.local_id === local_id);
        if (tx?.id) {
          await TransactionAPI.update(tx.id, data);
        }
      } catch (e) {
        console.warn('[Store] updateTx backend sync failed:', e);
      }
    }
  },

  deleteTx: async (local_id) => {
    const { transactions, token } = get();
    const tx = transactions.find(t => t.local_id === local_id);
    
    await deleteTransaction(local_id);
    const txs = await getAllTransactions();
    set({ transactions: txs, analytics: calcAnalytics(txs) });
    
    // Backend'den sil
    if (token && tx?.id) {
      try {
        await TransactionAPI.delete(tx.id);
      } catch (e) {
        console.warn('[Store] deleteTx backend sync failed:', e);
      }
    }
  },

  syncWithServer: async () => {
    const { token, syncState } = get();
    if (!token || syncState.isSyncing) return;
    
    set({ syncState: { ...syncState, isSyncing: true } });
    
    try {
      const localTxs = await getAllTransactions();
      const now = new Date().toISOString();
      
      // 1. Local işlemleri backend'e gönder
      const payload = {
        device_id: 'mobile',
        transactions: localTxs.map(tx => ({
          tarih: tx.tarih,
          kategori: tx.kategori,
          detay: tx.detay,
          tutar: tx.tutar,
          tutar_orijinal: tx.tutar_orijinal,
          para_birimi: tx.para_birimi,
          tip: tx.tip,
          logo: tx.logo,
          local_id: tx.local_id,
        })),
        last_sync: syncState.lastSync || undefined,
      };
      
      const syncResult = await TransactionAPI.sync(payload);
      
      // 2. Backend'den gelen işlemleri local'e kaydet
      if (syncResult?.data?.server_transactions?.length > 0) {
        const serverTxs = syncResult.data.server_transactions;
        for (const tx of serverTxs) {
          // Zaten local'de var mı kontrol et (local_id ile)
          const exists = localTxs.find(l => l.local_id === tx.local_id);
          if (!exists && tx.local_id) {
            await addTransaction({
              tarih: tx.tarih,
              kategori: tx.kategori,
              detay: tx.detay,
              tutar: tx.tutar,
              tutar_orijinal: tx.tutar_orijinal,
              para_birimi: tx.para_birimi,
              tip: tx.tip,
              logo: tx.logo,
              local_id: tx.local_id,
            });
          }
        }
      }

      // 3. Local işlemleri yeniden yükle
      const updatedTxs = await getAllTransactions();
      set({
        transactions: updatedTxs,
        analytics: calcAnalytics(updatedTxs),
        syncState: {
          isSyncing: false,
          lastSync: now,
          pendingCount: 0,
          isOnline: true,
        }
      });
      
      await AsyncStorage.setItem('fintwin_last_sync', now);
    } catch (e) {
      console.warn('[Store] syncWithServer failed:', e);
      set({ syncState: { ...get().syncState, isSyncing: false, isOnline: false } });
    }
  },

  scheduleSync: () => {
    // Her 5 dakikada bir sync
    setInterval(() => {
      get().syncWithServer();
    }, 5 * 60 * 1000);
  },

  loadAnalytics: async () => {
    set({ analytics: calcAnalytics(get().transactions) });
  },

  loadExchangeRates: async (forceRefresh = false) => {
    try {
      const result: ExchangeRates = await getExchangeRates(forceRefresh);
      set({
        exchangeRates: { TL: result.TL, USD: result.USD, EUR: result.EUR, GBP: result.GBP },
        ratesMeta: { lastUpdated: result.lastUpdated, source: result.source },
      });
    } catch (e) { console.warn('[Store] loadExchangeRates:', e); }
  },

  setLang: (lang) => {
    set({ lang });
    AsyncStorage.setItem('fintwin_lang', lang);
  },

  setThemeMode: (mode) => {
    set({ themeMode: mode });
    applyTheme(mode);
    AsyncStorage.setItem('fintwin_theme', mode);
  },

  deleteAccount: async () => {
    try { await UserAPI.deleteMe(); } catch { /* ignore */ }
    // Local SQLite'daki tüm verileri de sil
    try { await clearAllLocal(); } catch { /* ignore */ }
    await get().logout();
  },

  sendFeedback: async (message: string) => {
    const { lang, token } = get();
    try {
      await saveFeedback(message, lang);
      if (token) {
        await UserAPI.sendFeedback(message, lang);
      }
    } catch (e) { console.warn('[Store] sendFeedback:', e); throw e; }
  },
}));

// ── Session restore ───────────────────────────────────────────────────────────
export async function restoreSession() {
  try {
    const [token, userStr, lang, theme, lastSync] = await Promise.all([
      AsyncStorage.getItem('fintwin_token'),
      AsyncStorage.getItem('fintwin_user'),
      AsyncStorage.getItem('fintwin_lang'),
      AsyncStorage.getItem('fintwin_theme'),
      AsyncStorage.getItem('fintwin_last_sync'),
    ]);

    const themeMode = (theme === 'light' ? 'light' : 'dark') as 'dark' | 'light';
    applyTheme(themeMode);
    useStore.setState({ themeMode });

    if (token && userStr) {
      const user = JSON.parse(userStr) as UserProfile;
      setCurrentUser(getUserKey(user));
      useStore.setState({
        token, user, isLoggedIn: true,
        lang: (lang as 'TR' | 'EN') || user.lang || 'TR',
        syncState: {
          isSyncing: false,
          lastSync: lastSync || null,
          pendingCount: 0,
          isOnline: true,
        }
      });
      const txs = await getAllTransactions();
      useStore.setState({ transactions: txs, analytics: calcAnalytics(txs) });
      useStore.getState().loadExchangeRates();
      // Uygulama açılınca sync yap
      useStore.getState().syncWithServer();
    }
  } catch (e) {
    console.error('[restoreSession]:', e);
  }
}
