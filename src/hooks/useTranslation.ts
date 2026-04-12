// src/hooks/useTranslation.ts
import { useStore } from '../store/useStore';

const TR = {
  app_title: '🏦 FinTwin',
  app_subtitle: 'Kişisel Finans Asistanın',
  login_title: '👋 Tekrar hoş geldin!',
  login_caption: 'E-posta adresinle giriş yap.',
  login_email_placeholder: 'ornek@email.com',
  login_btn: 'Giriş Yap',
  login_not_found: 'Bu e-posta kayıtlı değil.',
  register_title: '🌟 Yeni Hesap Oluştur',
  register_btn: 'Kayıt Ol ve Başla',
  otp_title: '📧 E-posta Doğrulama',
  otp_caption: 'E-postanıza 6 haneli kod gönderdik.',
  otp_input_placeholder: '6 haneli kod',
  otp_verify_btn: 'Doğrula ve Devam Et',
  otp_resend_btn: 'Kodu Yeniden Gönder',
  otp_wrong: '❌ Hatalı kod.',
  otp_expired: '⏰ Kodun süresi doldu.',
  nav_home: 'Ana Sayfa',
  nav_income: 'Gelir / Gider',
  nav_analysis: 'Analiz',
  nav_coach: 'Koç',
  nav_settings: 'Ayarlar',
  metric_income: 'Gelir',
  metric_expense: 'Gider',
  metric_net: 'Net',
  metric_score: 'FİN. SKOR',
  add_income: '+ Gelir Ekle',
  add_expense: '+ Gider Ekle',
  save: 'Kaydet',
  cancel: 'İptal',
  delete: 'Sil',
  edit: 'Düzenle',
  amount: 'Tutar',
  description: 'Açıklama',
  date: 'Tarih',
  category: 'Kategori',
  currency: 'Para Birimi',
  source: 'Gelir Kaynağı',
  no_data: 'Analiz için veri girin.',
  coach_empty: 'Gelir ve gider ekleyince öneriler burada belirecek.',
  syncing: 'Senkronize ediliyor...',
  sync_done: 'Senkronizasyon tamamlandı',
  offline: 'Çevrimdışı – veriler kaydedildi',
  account_title: 'Hesap Ayarları',
  logout: 'Çıkış Yap',
  delete_account: 'Hesabı Sil',
  delete_account_confirm: 'Tüm verileriniz kalıcı olarak silinecek. Emin misiniz?',
  select_placeholder: '— Seçin —',
  age: 'Yaş',
  gender: 'Cinsiyet',
  city: 'Şehir',
  job: 'Meslek',
  sector: 'Sektör',
  success: 'Başarılı',
  error: 'Hata',
  statement_title: 'Ekstre Analizi',
  upload_pdf: 'PDF Yükle',
  analyzing: 'Analiz ediliyor...',
};

const EN: typeof TR = {
  app_title: '🏦 FinTwin',
  app_subtitle: 'Your Personal Finance Assistant',
  login_title: '👋 Welcome back!',
  login_caption: 'Sign in with your email address.',
  login_email_placeholder: 'example@email.com',
  login_btn: 'Sign In',
  login_not_found: 'This email is not registered.',
  register_title: '🌟 Create New Account',
  register_btn: 'Sign Up & Get Started',
  otp_title: '📧 Email Verification',
  otp_caption: 'We sent a 6-digit code to your email.',
  otp_input_placeholder: '6-digit code',
  otp_verify_btn: 'Verify & Continue',
  otp_resend_btn: 'Resend Code',
  otp_wrong: '❌ Incorrect code.',
  otp_expired: '⏰ Code has expired.',
  nav_home: 'Home',
  nav_income: 'Income / Expense',
  nav_analysis: 'Analysis',
  nav_coach: 'Coach',
  nav_settings: 'Settings',
  metric_income: 'Income',
  metric_expense: 'Expense',
  metric_net: 'Net',
  metric_score: 'FIN. SCORE',
  add_income: '+ Add Income',
  add_expense: '+ Add Expense',
  save: 'Save',
  cancel: 'Cancel',
  delete: 'Delete',
  edit: 'Edit',
  amount: 'Amount',
  description: 'Description',
  date: 'Date',
  category: 'Category',
  currency: 'Currency',
  source: 'Income Source',
  no_data: 'Add data to view analysis.',
  coach_empty: 'Add income and expenses to see recommendations.',
  syncing: 'Syncing...',
  sync_done: 'Sync complete',
  offline: 'Offline – data saved locally',
  account_title: 'Account Settings',
  logout: 'Sign Out',
  delete_account: 'Delete Account',
  delete_account_confirm: 'All your data will be permanently deleted. Are you sure?',
  select_placeholder: '— Select —',
  age: 'Age',
  gender: 'Gender',
  city: 'City',
  job: 'Occupation',
  sector: 'Sector',
  success: 'Success',
  error: 'Error',
  statement_title: 'Statement Analysis',
  upload_pdf: 'Upload PDF',
  analyzing: 'Analyzing...',
};

// ── Meslek TR ↔ EN ────────────────────────────────────────────────────────────
export const MESLEK_TR_TO_EN: Record<string, string> = {
  'Mühendis (Yazılım)': 'Software Engineer',
  'Mühendis (Elektrik-Elektronik)': 'Electrical Engineer',
  'Mühendis (Makine)': 'Mechanical Engineer',
  'Mühendis (İnşaat)': 'Civil Engineer',
  'Mühendis (Kimya)': 'Chemical Engineer',
  'Mühendis (Diğer)': 'Other Engineer',
  'Veri Bilimci / Analist': 'Data Scientist / Analyst',
  'Sistem/Ağ Uzmanı': 'Systems / Network Engineer',
  'Siber Güvenlik Uzmanı': 'Cybersecurity Specialist',
  'UX/UI Tasarımcı': 'UX/UI Designer',
  'Doktor / Hekim': 'Doctor / Physician',
  'Diş Hekimi': 'Dentist',
  'Eczacı': 'Pharmacist',
  'Hemşire / Sağlık Görevlisi': 'Nurse / Healthcare Worker',
  'Fizyoterapist': 'Physiotherapist',
  'Psikolog / Psikiyatrist': 'Psychologist / Psychiatrist',
  'Veteriner': 'Veterinarian',
  'Öğrenci': 'Student',
  'Öğretmen (İlk/Ortaöğretim)': 'Teacher (K-12)',
  'Akademisyen / Öğretim Üyesi': 'Academic / Professor',
  'Eğitim Danışmanı': 'Education Consultant',
  'Bankacı / Finans Uzmanı': 'Banker / Finance Specialist',
  'Muhasebeci / Mali Müşavir': 'Accountant / Financial Advisor',
  'Sigortacı': 'Insurance Specialist',
  'Avukat': 'Lawyer',
  'Hakim / Savcı': 'Judge / Prosecutor',
  'Finans Analisti': 'Financial Analyst',
  'Yatırım Danışmanı': 'Investment Advisor',
  'Girişimci / İş İnsanı': 'Entrepreneur / Business Person',
  'Üst Düzey Yönetici (C-Level)': 'C-Level Executive',
  'Orta Düzey Yönetici': 'Mid-Level Manager',
  'İnsan Kaynakları Uzmanı': 'HR Specialist',
  'Pazarlama / Reklam Uzmanı': 'Marketing / Advertising Specialist',
  'Satış Temsilcisi': 'Sales Representative',
  'Proje Yöneticisi': 'Project Manager',
  'Serbest Meslek (Freelancer)': 'Freelancer',
  'Grafik Tasarımcı': 'Graphic Designer',
  'İçerik Üreticisi / Yayıncı': 'Content Creator / Streamer',
  'Gazeteci / Yazar': 'Journalist / Writer',
  'Fotoğrafçı / Kameraman': 'Photographer / Videographer',
  'Mimar': 'Architect',
  'Kamu Görevlisi': 'Civil Servant',
  'Asker / Subay': 'Military Officer',
  'Polis / Güvenlik Görevlisi': 'Police / Security Officer',
  'Sosyal Hizmet Uzmanı': 'Social Worker',
  'Diplomat / Bürokrat': 'Diplomat / Bureaucrat',
  'Esnaf / Küçük İşletme Sahibi': 'Small Business Owner',
  'Restoran / Kafe İşletmecisi': 'Restaurant / Café Owner',
  'Turizm & Otelcilik Çalışanı': 'Tourism & Hospitality Worker',
  'Lojistik / Ulaşım Çalışanı': 'Logistics / Transport Worker',
  'Tarım / Çiftçi': 'Farmer / Agricultural Worker',
  'Emekli': 'Retired',
  'İşsiz / İş Arayan': 'Unemployed / Job Seeker',
  'Diğer': 'Other',
};

export const MESLEK_EN_TO_TR: Record<string, string> = Object.fromEntries(
  Object.entries(MESLEK_TR_TO_EN).map(([k, v]) => [v, k])
);

// ── Sektör TR ↔ EN ────────────────────────────────────────────────────────────
export const GICS_TR_TO_EN: Record<string, string> = {
  'Yazılım & Teknoloji': 'Software & Technology',
  'Fintech / Ödeme Sistemleri': 'Fintech / Payment Systems',
  'Yapay Zeka & Veri': 'Artificial Intelligence & Data',
  'E-Ticaret': 'E-Commerce',
  'Oyun & Dijital Medya': 'Gaming & Digital Media',
  'Siber Güvenlik': 'Cybersecurity',
  'Telekomünikasyon': 'Telecommunications',
  'Sağlık Hizmetleri': 'Healthcare Services',
  'İlaç & Biyoteknoloji': 'Pharmaceuticals & Biotechnology',
  'Eğitim Hizmetleri': 'Education Services',
  'Özel Eğitim & Kurs': 'Private Education & Courses',
  'Bankacılık': 'Banking',
  'Sigortacılık': 'Insurance',
  'Yatırım & Sermaye': 'Investment & Capital',
  'Muhasebe & Denetim': 'Accounting & Auditing',
  'Perakende': 'Retail',
  'Gıda & İçecek': 'Food & Beverage',
  'Lüks Tüketim': 'Luxury Goods',
  'Otomotiv': 'Automotive',
  'Tekstil & Moda': 'Textile & Fashion',
  'Üretim & Sanayi': 'Manufacturing & Industry',
  'Enerji (Geleneksel)': 'Energy (Traditional)',
  'Yenilenebilir Enerji': 'Renewable Energy',
  'İnşaat & Altyapı': 'Construction & Infrastructure',
  'Savunma & Havacılık': 'Defense & Aerospace',
  'Gayrimenkul': 'Real Estate',
  'Turizm & Otelcilik': 'Tourism & Hospitality',
  'Lojistik & Taşımacılık': 'Logistics & Transportation',
  'Tarım & Gıda Üretimi': 'Agriculture & Food Production',
  'Kamu & Sosyal Hizmetler': 'Public & Social Services',
  'Medya & Reklam': 'Media & Advertising',
  'Diğer': 'Other',
};

export const GICS_EN_TO_TR: Record<string, string> = Object.fromEntries(
  Object.entries(GICS_TR_TO_EN).map(([k, v]) => [v, k])
);

// ── Cinsiyet TR ↔ EN ──────────────────────────────────────────────────────────
export const CINSIYET_TR_TO_EN: Record<string, string> = {
  'Kadın': 'Female',
  'Erkek': 'Male',
  'Belirtmek İstemiyorum': 'Prefer not to say',
};

export const CINSIYET_EN_TO_TR: Record<string, string> = Object.fromEntries(
  Object.entries(CINSIYET_TR_TO_EN).map(([k, v]) => [v, k])
);

// ── Kategori TR ↔ EN ──────────────────────────────────────────────────────────
export const KATEGORI_TR_TO_EN: Record<string, string> = {
  'Maaş': 'Salary',
  'Emekli Maaşı': 'Pension',
  'SGK/SSK Maaşı': 'Social Security',
  'Freelance': 'Freelance',
  'Kira Geliri': 'Rental Income',
  'Yatırım Geliri': 'Investment Income',
  'Ek İş': 'Side Job',
  'Prim/Bonus': 'Bonus/Premium',
  'Diğer Gelir': 'Other Income',
  'Abonelik': 'Subscription',
  'Fatura': 'Bill',
  'Kira/Aidat': 'Rent/HOA',
  'Kredi/Borç': 'Loan/Debt',
  'Eğitim': 'Education',
  'Personel': 'Staff',
  'Yeme-İçme': 'Food & Dining',
  'Ulaşım': 'Transport',
  'Alışveriş': 'Shopping',
  'Sağlık': 'Health',
  'Eğlence': 'Entertainment',
  'Diğer': 'Other',
};

export const KATEGORI_EN_TO_TR: Record<string, string> = Object.fromEntries(
  Object.entries(KATEGORI_TR_TO_EN).map(([k, v]) => [v, k])
);

export function translateKategori(value: string | undefined, lang: string): string {
  if (!value) return '';
  if (lang === 'TR') return value;
  return KATEGORI_TR_TO_EN[value] || value;
}

export function translateMeslek(value: string | undefined, lang: string): string {
  if (!value) return '—';
  if (lang === 'TR') return value;
  return MESLEK_TR_TO_EN[value] || value;
}

export function translateGics(value: string | undefined, lang: string): string {
  if (!value) return '—';
  if (lang === 'TR') return value;
  return GICS_TR_TO_EN[value] || value;
}

export function translateCinsiyet(value: string | undefined, lang: string): string {
  if (!value) return '—';
  if (lang === 'TR') return value;
  return CINSIYET_TR_TO_EN[value] || value;
}

export function useTranslation() {
  const lang = useStore(s => s.lang);
  const t = lang === 'EN' ? EN : TR;
  return { t, lang };
}

export type TranslationKeys = keyof typeof TR;
