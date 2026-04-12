# 📱 FinTwin APK Build Rehberi
## Adım adım Android APK oluşturma ve telefona kurma

---

## ✅ Ön Koşullar

Bilgisayarında şunların kurulu olması gerekiyor:
- **Node.js** (v18+) → https://nodejs.org
- **Git** → https://git-scm.com

Java veya Android Studio'ya **gerek yok** — EAS bulutta build alır.

---

## 🔧 ADIM 1 — Expo Hesabı Aç (Ücretsiz)

1. Tarayıcıda **https://expo.dev** adresine git
2. "Sign Up" butonuna tıkla
3. E-posta ile ücretsiz hesap oluştur
4. E-postanı doğrula

---

## 🔧 ADIM 2 — Bilgisayarda Kurulumlar

Komut satırını (Terminal / CMD) aç ve sırayla çalıştır:

```bash
# EAS CLI'ı global olarak kur
npm install -g eas-cli

# Expo CLI'ı kur
npm install -g expo-cli

# Versiyon kontrol (çıktı görünüyorsa kuruldu)
eas --version
expo --version
```

---

## 🔧 ADIM 3 — Projeyi Hazırla

```bash
# Proje klasörüne git (zip'i çıkardığın yere göre değiştir)
cd fintwin_project/mobile

# Bağımlılıkları kur
npm install
```

---

## 🔧 ADIM 4 — Expo'ya Giriş Yap

```bash
eas login
# E-posta ve şifreni gir (expo.dev'deki hesap)
```

---

## 🔧 ADIM 5 — Projeyi Expo'ya Bağla

```bash
eas init
# "Would you like to create a project..." → YES
# Proje adı: fintwin (veya istediğin bir ad)
```

Bu komut `app.json` içine otomatik `projectId` ekler.

---

## 🔧 ADIM 6 — APK Build Al

```bash
# Preview APK (telefona direkt kurulabilir .apk dosyası)
eas build --platform android --profile preview
```

Ekranda şunları soracak:

```
? Generate a new Android Keystore? › Yes
```
→ **Yes** seç (imza anahtarı oluşturur, EAS'da güvenle saklar)

Sonra şunu göreceksin:
```
✔ Build queued...
Build URL: https://expo.dev/accounts/KULLANICI_ADIN/builds/xxxx
```

---

## ⏱️ ADIM 7 — Build Bitmesini Bekle

Build **5-15 dakika** sürer. İki yoldan takip edebilirsin:

**Yol A – Terminalde bekle:**
```
[expo] Building... ████████░░ 60%
[expo] Build completed!
[expo] APK: https://expo.dev/artifacts/xxxxxx/app-preview.apk
```

**Yol B – Tarayıcıdan takip et:**
- https://expo.dev → sol menü "Builds" → son build'e tıkla
- Yeşil "Build finished" yazısı görününce hazır

---

## 📲 ADIM 8 — APK'yı İndir ve Telefona Kur

### APK'yı İndir:
Build sayfasında **"Download APK"** butonuna tıkla → `app-preview.apk` inecek

### Telefona Kur:

**Android telefon:**
1. APK dosyasını telefona kopyala (USB / Google Drive / WhatsApp kendine gönder)
2. Dosya yöneticisinden APK'ya tıkla
3. "Bilinmeyen kaynaklardan yüklemeye izin ver" çıkarsa → **İzin Ver**
4. Kur → Aç

**Alternatif — QR ile direkt indir:**
Build sayfasındaki QR kodunu telefon kamerasıyla tarat → direkt indirir

---

## 🌐 ADIM 9 — Backend'i Telefona Bağla

Telefon uygulaması internetteki bir backend'e bağlanması gerekiyor.

### Seçenek A — Yerel Test (Aynı Wi-Fi)
```bash
# Bilgisayarının IP adresini öğren:
# Windows:
ipconfig
# Mac/Linux:
ifconfig | grep "inet "

# Çıkan IP (ör: 192.168.1.45) → mobile/src/services/api.ts içinde:
export const BASE_URL = 'http://192.168.1.45:8000';

# Backend'i başlat:
cd fintwin_project/backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```
Telefon ve bilgisayar **aynı Wi-Fi**'de olmalı.

### Seçenek B — Ücretsiz Tünel (ngrok)
Telefon farklı ağda olsa da çalışır:

```bash
# ngrok kur: https://ngrok.com/download
ngrok http 8000
# Çıkan URL (ör: https://abc123.ngrok.io) → api.ts'e yaz
export const BASE_URL = 'https://abc123.ngrok.io';
```
Sonra APK'yı yeniden build al.

### Seçenek C — Ücretsiz Bulut (Render.com)
Kalıcı çözüm için backend'i ücretsiz yayınla:
1. https://render.com → "New Web Service"
2. GitHub'a push et, Render bağla
3. Build komutu: `pip install -r requirements.txt`
4. Start komutu: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Verilen URL'yi `BASE_URL` olarak kullan (https://...)

---

## 🔁 Yeni APK Build (Güncelleme Sonrası)

Kod değiştirip yeniden APK almak için:

```bash
eas build --platform android --profile preview
```

---

## ❓ Sık Karşılaşılan Sorunlar

| Sorun | Çözüm |
|-------|-------|
| `eas: command not found` | `npm install -g eas-cli` tekrar çalıştır |
| Build sırası uzun | Ücretsiz hesap kuyruğu → sabırla bekle (max 30 dk) |
| Telefona kurulamıyor | Ayarlar → Güvenlik → Bilinmeyen kaynaklar → Aç |
| API bağlanamıyor | Telefon ve PC aynı Wi-Fi'de mi? `BASE_URL` doğru mu? |
| `npm install` hata | `node --version` v18+ olmalı |

---

## 📋 Özet — Hızlı Referans

```
1. expo.dev'de hesap aç
2. npm install -g eas-cli
3. cd mobile && npm install
4. eas login
5. eas init
6. eas build --platform android --profile preview
7. Build bitmesini bekle (5-15 dk)
8. APK indir → telefona kur
9. Backend'i başlat → BASE_URL ayarla
```

---

## 🎯 Test için Hızlı Yol (Expo Go)

APK build almadan önce Expo Go ile test edebilirsin:

```bash
cd mobile
npx expo start
```

Telefonuna **Expo Go** uygulamasını indir (Play Store), çıkan QR'ı tarat → uygulama hemen açılır. APK olmadan hızlı test için idealdir.
