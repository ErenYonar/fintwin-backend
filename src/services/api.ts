// src/services/api.ts
/**
 * FinTwin API istemcisi.
 * Tüm isteklere JWT token otomatik eklenir.
 *  "sürekli client-server iletişimi yerine" →
 * bu client sadece sync zamanı çalışır, ara isteklerde local DB kullanılır.
 */

import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Ortam değişkeni veya hardcode (prod'da .env kullan) ──────────────────────
export const BASE_URL = 'https://fintwin-backend.onrender.com';
//  Emülatör: Android→10.0.2.2, iOS→localhost
//  Gerçek cihaz: bilgisayarınızın LAN IP'si (ör. http://192.168.1.X:8000)

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: token ekle ──────────────────────────────────────────
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('fintwin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: 401 → logout ───────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('fintwin_token');
      await AsyncStorage.removeItem('fintwin_user');
      // Router reset burada yapılmaz, store observer halleder
    }
    return Promise.reject(error);
  }
);

export default api;


// ── Typed API fonksiyonları ───────────────────────────────────────────────────

export const AuthAPI = {
  register: (data: RegisterPayload) => api.post('/auth/register', data),
  login:    (email: string, lang = 'TR') => api.post('/auth/login', { email, lang }),
  verifyOtp:(email: string, code: string) => api.post('/auth/verify-otp', { email, code }),
  resendOtp:(email: string, lang = 'TR') => api.post('/auth/resend-otp', { email, lang }),
};

export const UserAPI = {
  getMe:       () => api.get('/users/me'),
  updateMe:    (data: Partial<UserProfile>) => api.put('/users/me', data),
  deleteMe:    () => api.delete('/users/me'),
  sendFeedback:(mesaj: string, dil = 'TR') => api.post('/users/feedback', { mesaj, dil }),
};

export const TransactionAPI = {
  list:    (params?: Record<string, string | number>) => api.get('/transactions/', { params }),
  create:  (data: TransactionCreate) => api.post('/transactions/', data),
  update:  (id: number, data: Partial<TransactionCreate>) => api.put(`/transactions/${id}`, data),
  delete:  (id: number) => api.delete(`/transactions/${id}`),
  deleteAll: () => api.delete('/transactions/'),
  sync:    (payload: SyncPayload) => api.post('/transactions/sync', payload),
};

export const AnalyticsAPI = {
  summary:    () => api.get('/analytics/summary'),
  categories: (tip = 'Gider') => api.get('/analytics/categories', { params: { tip } }),
  trends:     () => api.get('/analytics/trends'),
  monthly:    (months = 6) => api.get('/analytics/monthly', { params: { months } }),
};

export const ExchangeAPI = {
  rates: () => api.get('/exchange/rates'),
};

export const StatementAPI = {
  list:   () => api.get('/statements/'),
  upload: (formData: FormData) =>
    api.post('/statements/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id: number) => api.delete(`/statements/${id}`),
};


// ── Tipler ────────────────────────────────────────────────────────────────────

export interface RegisterPayload {
  email: string; yas: string; cinsiyet: string;
  sehir: string; meslek: string; gics_l3: string; lang: string;
}

export interface UserProfile {
  id: number; mail_hash: string; yas: string; cinsiyet: string;
  sehir: string; meslek: string; gics_l3: string;
  kayit_tarihi: string; is_verified: boolean; role: string; lang: string;
}

export interface TransactionCreate {
  tarih: string; kategori: string; detay: string;
  tutar: number; tutar_orijinal: number; para_birimi: string;
  tip: 'Gelir' | 'Gider'; logo?: string; local_id?: string;
}

export interface Transaction extends TransactionCreate {
  id: number; sync_status: string; created_at: string; updated_at: string;
}

export interface SyncPayload {
  device_id: string;
  transactions: TransactionCreate[];
  last_sync?: string;
}
