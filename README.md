# FinTwin v2.0 – Mobil Uygulama

Streamlit web uygulamasından **FastAPI backend + React Native (Expo)** mimarisine geçiş.

---

## 🏗️ Mimari

```
┌─────────────────────┐     REST API      ┌─────────────────────┐
│  React Native Expo  │ ◄──────────────► │   FastAPI Backend   │
│  (iOS + Android)    │                   │   (Python 3.11+)    │
│                     │                   │                     │
│  • Expo SQLite      │   Sync (batch)    │   • SQLite (WAL)    │
│  • Zustand store    │ ──────────────►   │   • JWT Auth        │
│  • Offline-first    │                   │   • OTP Email       │
│  • 5 dk sync        │ ◄──────────────   │   • TCMB Kur API   │
└─────────────────────┘                   └─────────────────────┘
```

**Patronun istekleri nasıl karşılandı:**
| İstek | Çözüm |
|-------|-------|
| Python altyapısını koru | FastAPI + aiosqlite, tüm iş mantığı aynı |
| Mobil ön yüz | React Native (Expo) – iOS + Android |
| Native uygulama | Tam native, WebView yok |
| Offline & caching | expo-sqlite local DB, Zustand önbellek |
| Local DB + bulut sync | SQLite local + `/transactions/sync` endpoint |
| Sürekli bağlantı yok | Sadece sync zamanı istek, offline çalışıyor |

---

## 🚀 Kurulum

### 1) Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

pip install -r requirements.txt

# Ortam değişkenleri (.env dosyası oluşturun)
export FINTWIN_SMTP_USER="gmail_adresiniz@gmail.com"
export FINTWIN_SMTP_PASS="gmail_uygulama_sifresi"
export FINTWIN_SECRET_KEY="uzun-rastgele-secret-key"
export FINTWIN_DB_PATH="fintwin.db"

# Sunucuyu başlatın
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API dokümantasyonu: http://localhost:8000/docs

### 2) Mobil (React Native + Expo)

```bash
cd mobile
npm install

# Android emülatör için IP ayarla (src/services/api.ts)
# Android emülatör: 10.0.2.2:8000 (varsayılan)
# iOS simülatör:    localhost:8000
# Gerçek cihaz:     192.168.X.X:8000 (bilgisayarın LAN IP'si)

npx expo start
# Çıkan QR kodu Expo Go ile taratın
# veya 'a' Android, 'i' iOS için
```

---

## 📁 Proje Yapısı

```
fintwin_project/
├── backend/
│   ├── main.py                      # FastAPI entry point
│   ├── requirements.txt
│   └── app/
│       ├── core/
│       │   ├── database.py          # SQLite + tablolar
│       │   └── security.py          # JWT, hash, OTP config
│       ├── models/
│       │   └── schemas.py           # Pydantic modeller
│       ├── routers/
│       │   ├── auth.py              # Kayıt, giriş, OTP
│       │   ├── transactions.py      # CRUD + sync endpoint
│       │   ├── analytics.py         # Skor, trend, özet
│       │   ├── exchange.py          # TCMB döviz kurları
│       │   ├── users.py             # Profil, feedback, sil
│       │   └── statements.py        # PDF ekstre analizi
│       └── services/
│           ├── email_service.py     # OTP mail gönderimi
│           └── exchange_service.py  # TCMB + fallback kurlar
│
└── mobile/
    ├── App.tsx                      # Expo giriş
    ├── app.json                     # Expo config
    ├── package.json
    └── src/
        ├── navigation/
        │   └── AppNavigator.tsx     # Stack + Tab navigasyon
        ├── screens/
        │   ├── LoginScreen.tsx
        │   ├── RegisterScreen.tsx
        │   ├── OTPScreen.tsx
        │   ├── HomeScreen.tsx       # Dashboard
        │   ├── AddTransactionScreen.tsx
        │   ├── TransactionsScreen.tsx
        │   ├── AnalysisScreen.tsx   # Grafikler
        │   ├── CoachScreen.tsx      # AI önerileri
        │   ├── SettingsScreen.tsx
        │   └── AccountScreen.tsx
        ├── components/
        │   ├── UI.tsx               # Button, Card, Input vb.
        │   ├── TransactionItem.tsx
        │   └── TrendAlerts.tsx
        ├── services/
        │   ├── api.ts               # Axios + typed API
        │   └── localDb.ts           # SQLite offline DB
        ├── store/
        │   └── useStore.ts          # Zustand global state
        ├── hooks/
        │   └── useTranslation.ts    # TR/EN i18n
        └── utils/
            └── theme.ts             # Renkler, spacing, tipografi
```

---

## 🔌 API Endpoint'leri

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/auth/register` | Yeni kayıt |
| POST | `/auth/login` | Giriş (OTP tetikler) |
| POST | `/auth/verify-otp` | OTP doğrulama → JWT |
| POST | `/auth/resend-otp` | OTP yenile |
| GET  | `/users/me` | Profil bilgileri |
| PUT  | `/users/me` | Profil güncelle |
| DELETE | `/users/me` | Hesap sil (KVKK) |
| GET  | `/transactions/` | İşlem listesi |
| POST | `/transactions/` | Yeni işlem |
| PUT  | `/transactions/{id}` | Güncelle |
| DELETE | `/transactions/{id}` | Sil (soft) |
| **POST** | **`/transactions/sync`** | **Offline-first sync** |
| GET  | `/analytics/summary` | Gelir/gider/skor |
| GET  | `/analytics/categories` | Kategori dağılımı |
| GET  | `/analytics/trends` | Trend uyarıları |
| GET  | `/analytics/monthly` | Aylık grafik verisi |
| GET  | `/exchange/rates` | Döviz kurları |
| POST | `/statements/upload` | PDF ekstre yükle |
| GET  | `/statements/` | Ekstre listesi |

---

## 🔄 Offline-First Sync Protokolü

```
Mobile                           Server
  │                                │
  │──── Yeni işlem ekle ────────►  │ (local SQLite'a yaz, sync_status='pending')
  │                                │
  │  [5 dk. sonra veya açılışta]   │
  │──── POST /transactions/sync ►  │
  │     {device_id, transactions,  │
  │      last_sync}                │
  │                                │ ── local_id ile mükerrer kontrolü
  │                                │ ── sunucuya yaz
  │◄─── {synced, server_txs} ────  │
  │                                │
  │  Server'dan gelen yeni kayıtları│
  │  locale upsert et              │
```

---

## 🌐 Gerçek Cihazda Test

```bash
# 1. Bilgisayarın IP'sini öğren
ipconfig  # Windows
ifconfig  # Mac/Linux

# 2. src/services/api.ts içinde BASE_URL'i güncelle
export const BASE_URL = 'http://192.168.1.X:8000';

# 3. Backend'i 0.0.0.0'da başlat (zaten öyle)
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 4. Telefon ve bilgisayarın aynı Wi-Fi'de olduğundan emin ol
```

---

## 📱 Production Build

```bash
# EAS Build ile (Expo Application Services)
npm install -g eas-cli
eas login
eas build --platform android  # .apk veya .aab
eas build --platform ios      # .ipa
```
