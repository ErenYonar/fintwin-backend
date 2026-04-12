// src/store/useStore.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

import {
  AuthAPI, UserAPI,
  Transaction, TransactionCreate, UserProfile,
} from '../services/api';
import {
  getAllTransactions, addTransaction, updateTransaction,
  deleteTransaction, clearAllLocal, setCurrentUser, saveFeedback,
} from '../services/localDb';
import { getExchangeRates, ExchangeRates } from '../services/exchangeService';

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
    const txs = await getAllTransactions();
    set({ transactions: txs, analytics: calcAnalytics(txs) });
    get().loadExchangeRates();
  },

  register: async (data) => {
    await AuthAPI.register(data);
  },

  logout: async () => {
    // 1. Önce state'i temizle — navigation hemen AuthStack'e geçer
    set({
      token: null, user: null, isLoggedIn: false,
      transactions: [], analytics: null, trends: [],
    });
    // 2. Sadece session bilgilerini temizle — işlem verileri DB'de KORUNUR
    try {
      await AsyncStorage.multiRemove(['fintwin_token', 'fintwin_user']);
    } catch (e) { console.warn('AsyncStorage clear:', e); }
    // NOT: clearAllLocal() kasıtlı olarak ÇAĞIRILMIYOR
    // Kullanıcı tekrar giriş yapınca verileri user_key ile geri yüklenir
    setCurrentUser('default');
  },

  loadTransactions: async () => {
    try {
      const txs = await getAllTransactions();
      set({ transactions: txs, analytics: calcAnalytics(txs) });
    } catch (e) { console.warn('[Store] loadTransactions:', e); }
  },

  addTx: async (data) => {
    await addTransaction({ ...data, local_id: uuidv4() });
    const txs = await getAllTransactions();
    set({ transactions: txs, analytics: calcAnalytics(txs) });
  },

  updateTx: async (local_id, data) => {
    await updateTransaction(local_id, data);
    const txs = await getAllTransactions();
    set({ transactions: txs, analytics: calcAnalytics(txs) });
  },

  deleteTx: async (local_id) => {
    await deleteTransaction(local_id);
    const txs = await getAllTransactions();
    set({ transactions: txs, analytics: calcAnalytics(txs) });
  },

  syncWithServer: async () => {},
  scheduleSync: () => {},

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

  deleteAccount: async () => {
    try { await UserAPI.deleteMe(); } catch { /* ignore */ }
    await get().logout();
  },

  sendFeedback: async (message: string) => {
    const { lang } = get();
    try {
      await saveFeedback(message, lang);
    } catch (e) { console.warn('[Store] sendFeedback:', e); throw e; }
  },
}));

// ── Session restore ───────────────────────────────────────────────────────────
export async function restoreSession() {
  try {
    const [token, userStr, lang] = await Promise.all([
      AsyncStorage.getItem('fintwin_token'),
      AsyncStorage.getItem('fintwin_user'),
      AsyncStorage.getItem('fintwin_lang'),
    ]);

    if (token && userStr) {
      const user = JSON.parse(userStr) as UserProfile;
      setCurrentUser(getUserKey(user));
      useStore.setState({
        token, user, isLoggedIn: true,
        lang: (lang as 'TR' | 'EN') || user.lang || 'TR',
      });
      const txs = await getAllTransactions();
      useStore.setState({ transactions: txs, analytics: calcAnalytics(txs) });
      useStore.getState().loadExchangeRates();
    }
  } catch (e) {
    console.error('[restoreSession]:', e);
  }
}
