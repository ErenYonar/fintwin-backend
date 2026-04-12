// src/screens/RegisterScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { Button, Input, Card } from '../components/UI';
import { Colors, Spacing, Radius, Shadow } from '../utils/theme';
import { useTranslation, MESLEK_EN_TO_TR, GICS_EN_TO_TR, CINSIYET_EN_TO_TR } from '../hooks/useTranslation';
import { AuthAPI } from '../services/api';

const ILLER = [
  'Adana','Adıyaman','Afyonkarahisar','Ağrı','Amasya','Ankara','Antalya','Artvin',
  'Aydın','Balıkesir','Bilecik','Bingöl','Bitlis','Bolu','Burdur','Bursa','Çanakkale',
  'Çankırı','Çorum','Denizli','Diyarbakır','Edirne','Elazığ','Erzincan','Erzurum',
  'Eskişehir','Gaziantep','Giresun','Gümüşhane','Hakkari','Hatay','Isparta','Mersin',
  'İstanbul','İzmir','Kars','Kastamonu','Kayseri','Kırklareli','Kırşehir','Kocaeli',
  'Konya','Kütahya','Malatya','Manisa','Kahramanmaraş','Mardin','Muğla','Muş',
  'Nevşehir','Niğde','Ordu','Rize','Sakarya','Samsun','Siirt','Sinop','Sivas',
  'Tekirdağ','Tokat','Trabzon','Tunceli','Şanlıurfa','Uşak','Van','Yozgat','Zonguldak',
  'Aksaray','Bayburt','Karaman','Kırıkkale','Batman','Şırnak','Bartın','Ardahan',
  'Iğdır','Yalova','Karabük','Kilis','Osmaniye','Düzce','Diğer',
];

const MESLEKLER_TR = [
  'Mühendis (Yazılım)','Mühendis (Elektrik-Elektronik)','Mühendis (Makine)',
  'Mühendis (İnşaat)','Mühendis (Kimya)','Mühendis (Diğer)',
  'Veri Bilimci / Analist','Sistem/Ağ Uzmanı','Siber Güvenlik Uzmanı','UX/UI Tasarımcı',
  'Doktor / Hekim','Diş Hekimi','Eczacı','Hemşire / Sağlık Görevlisi',
  'Fizyoterapist','Psikolog / Psikiyatrist','Veteriner',
  'Öğrenci','Öğretmen (İlk/Ortaöğretim)','Akademisyen / Öğretim Üyesi','Eğitim Danışmanı',
  'Bankacı / Finans Uzmanı','Muhasebeci / Mali Müşavir','Sigortacı',
  'Avukat','Hakim / Savcı','Finans Analisti','Yatırım Danışmanı',
  'Girişimci / İş İnsanı','Üst Düzey Yönetici (C-Level)','Orta Düzey Yönetici',
  'İnsan Kaynakları Uzmanı','Pazarlama / Reklam Uzmanı','Satış Temsilcisi','Proje Yöneticisi',
  'Serbest Meslek (Freelancer)','Grafik Tasarımcı','İçerik Üreticisi / Yayıncı',
  'Gazeteci / Yazar','Fotoğrafçı / Kameraman','Mimar',
  'Kamu Görevlisi','Asker / Subay','Polis / Güvenlik Görevlisi',
  'Sosyal Hizmet Uzmanı','Diplomat / Bürokrat',
  'Esnaf / Küçük İşletme Sahibi','Restoran / Kafe İşletmecisi',
  'Turizm & Otelcilik Çalışanı','Lojistik / Ulaşım Çalışanı','Tarım / Çiftçi',
  'Emekli','İşsiz / İş Arayan','Diğer',
];

const MESLEKLER_EN = [
  'Software Engineer','Electrical Engineer','Mechanical Engineer',
  'Civil Engineer','Chemical Engineer','Other Engineer',
  'Data Scientist / Analyst','Systems / Network Engineer','Cybersecurity Specialist','UX/UI Designer',
  'Doctor / Physician','Dentist','Pharmacist','Nurse / Healthcare Worker',
  'Physiotherapist','Psychologist / Psychiatrist','Veterinarian',
  'Student','Teacher (K-12)','Academic / Professor','Education Consultant',
  'Banker / Finance Specialist','Accountant / Financial Advisor','Insurance Specialist',
  'Lawyer','Judge / Prosecutor','Financial Analyst','Investment Advisor',
  'Entrepreneur / Business Person','C-Level Executive','Mid-Level Manager',
  'HR Specialist','Marketing / Advertising Specialist','Sales Representative','Project Manager',
  'Freelancer','Graphic Designer','Content Creator / Streamer',
  'Journalist / Writer','Photographer / Videographer','Architect',
  'Civil Servant','Military Officer','Police / Security Officer',
  'Social Worker','Diplomat / Bureaucrat',
  'Small Business Owner','Restaurant / Café Owner',
  'Tourism & Hospitality Worker','Logistics / Transport Worker','Farmer / Agricultural Worker',
  'Retired','Unemployed / Job Seeker','Other',
];

const GICS_TR = [
  'Yazılım & Teknoloji','Fintech / Ödeme Sistemleri','Yapay Zeka & Veri',
  'E-Ticaret','Oyun & Dijital Medya','Siber Güvenlik','Telekomünikasyon',
  'Sağlık Hizmetleri','İlaç & Biyoteknoloji','Eğitim Hizmetleri','Özel Eğitim & Kurs',
  'Bankacılık','Sigortacılık','Yatırım & Sermaye','Muhasebe & Denetim',
  'Perakende','Gıda & İçecek','Lüks Tüketim','Otomotiv','Tekstil & Moda',
  'Üretim & Sanayi','Enerji (Geleneksel)','Yenilenebilir Enerji',
  'İnşaat & Altyapı','Savunma & Havacılık',
  'Gayrimenkul','Turizm & Otelcilik','Lojistik & Taşımacılık',
  'Tarım & Gıda Üretimi','Kamu & Sosyal Hizmetler','Medya & Reklam','Diğer',
];

const GICS_EN = [
  'Software & Technology','Fintech / Payment Systems','Artificial Intelligence & Data',
  'E-Commerce','Gaming & Digital Media','Cybersecurity','Telecommunications',
  'Healthcare Services','Pharmaceuticals & Biotechnology','Education Services','Private Education & Courses',
  'Banking','Insurance','Investment & Capital','Accounting & Auditing',
  'Retail','Food & Beverage','Luxury Goods','Automotive','Textile & Fashion',
  'Manufacturing & Industry','Energy (Traditional)','Renewable Energy',
  'Construction & Infrastructure','Defense & Aerospace',
  'Real Estate','Tourism & Hospitality','Logistics & Transportation',
  'Agriculture & Food Production','Public & Social Services','Media & Advertising','Other',
];

const YASLAR = Array.from({ length: 63 }, (_, i) => String(i + 18));
const CINSIYETLER_TR = ['Kadın','Erkek','Belirtmek İstemiyorum'];
const CINSIYETLER_EN = ['Female','Male','Prefer not to say'];

const KVKK_TR = [
  { baslik: '🔐 FinTwin KVKK Aydınlatma Metni', icerik: 'Son Güncelleme: Ocak 2025 | Sürüm 2.0\n\nVeri Sorumlusu: FinTwin Kişisel Finans Uygulaması\nİletişim: privacy@fintwin.app\nHukuki Dayanak: 6698 Sayılı KVKK Madde 10 — Veri Sorumlusunun Aydınlatma Yükümlülüğü' },
  { baslik: '📱 Bölüm 1: Toplanan Veriler', icerik: '• E-posta adresi (SHA-256 hash olarak işlenir, orijinal saklanmaz)\n• Demografik bilgiler (yaş, cinsiyet, şehir, meslek, sektör)\n• Finansal işlem verileri (kategoriler, tutarlar, tarihler)\n• Cihaz tipi ve OS (yalnızca arayüz optimizasyonu için)\n• Şehir düzeyinde konum (gönüllü olarak, kayıt sırasında)' },
  { baslik: '🔒 Bölüm 2: Veri Güvenliği (KVKK Md. 12)', icerik: '• E-postanız SHA-256 ile şifrelenir; orijinal adres hiçbir zaman saklanmaz\n• Tüm finansal veriler cihazınızda şifreli JSON formatında saklanır\n• OTP kodları 6 haneli, 5 dakika geçerli ve tek kullanımlıktır\n• Şifresiz giriş sistemi ile kimlik bilgisi hırsızlığı riski sıfırlanır\n• Tüm iletişim TLS 1.3 şifreleme ile korunur' },
  { baslik: '⚖️ Bölüm 3: Hukuki Dayanak (KVKK Md. 5)', icerik: '• Açık Rıza (Md. 5/1): Kayıt, demografik veri, OTP doğrulama\n• Sözleşmenin İfası (Md. 5/2-c): Finans takip hizmetinin sunulması\n• Meşru Menfaat (Md. 5/2-f): Güvenlik ve hizmet geliştirme\n• Kanuni Yükümlülük (Md. 5/2-ç): Yasal zorunluluk halinde bildirim' },
  { baslik: '🌍 Bölüm 4: Üçüncü Taraflar', icerik: 'FinTwin, kişisel verilerinizi ticari amaçlarla SATMAZ, kiralamaz veya paylaşmaz.\n\nSınırlı paylaşım:\n• SMTP sağlayıcısı: Yalnızca OTP iletimi için\n• Döviz kuru API\'leri: Anonim istekler, kişisel veri iletilmez\n• Yasal zorunluluk: Mahkeme kararı veya düzenleyici kurum talebi' },
  { baslik: '📅 Bölüm 5: Saklama Süreleri (KVKK Md. 7)', icerik: '• Aktif hesap: Hesabınız var olduğu sürece\n• Hesap silme sonrası: Tüm veriler 24 saat içinde kalıcı olarak silinir\n• OTP kodları: Oluşturulmasından 5 dakika sonra otomatik silinir' },
  { baslik: '✅ Bölüm 6: Haklarınız (KVKK Md. 11)', icerik: '• Bilgi Talep: Hakkınızda işlenen verilerin kopyasını talep edebilirsiniz\n• Düzeltme: Hatalı verileri Hesap Ayarları\'ndan güncelleyebilirsiniz\n• Silme: Ayarlar → Hesabı Sil ile tüm verilerinizi silebilirsiniz\n• Veri Taşınabilirliği: JSON formatında veri talep edebilirsiniz\n• Rızayı Geri Alma: İstediğiniz zaman onayınızı geri alabilirsiniz\n• Şikayet: Kişisel Verileri Koruma Kurumu\'na başvurabilirsiniz\n\n📧 privacy@fintwin.app | En geç 30 gün içinde yanıt verilir' },
];

const KVKK_EN = [
  { baslik: '🔐 FinTwin Privacy Notice & GDPR/KVKK Disclosure', icerik: 'Last Updated: January 2025 | Version 2.0\n\nData Controller: FinTwin Personal Finance Application\nContact: privacy@fintwin.app\nLegal Basis: GDPR Article 6(1)(a) — Consent | KVKK Article 5/1' },
  { baslik: '📱 Section 1: Data We Collect', icerik: '• Email address (processed as SHA-256 hash, original never stored)\n• Demographic info (age, gender, city, profession, sector)\n• Financial transaction data (categories, amounts, dates)\n• Device type and OS (for UI optimization only)\n• City-level location (voluntarily provided at registration)' },
  { baslik: '🔒 Section 2: Data Security (GDPR Art. 32)', icerik: '• Your email is hashed with SHA-256; original address never stored\n• All financial data stored locally in encrypted JSON format\n• OTP codes are 6-digit, valid 5 minutes, single-use only\n• Password-free login eliminates credential theft risk\n• All communication protected by TLS 1.3 encryption' },
  { baslik: '⚖️ Section 3: Legal Basis (GDPR Art. 6 / KVKK Art. 5)', icerik: '• Consent (Art. 6(1)(a)): Registration, demographic data, OTP\n• Contract Performance (Art. 6(1)(b)): Providing the finance service\n• Legitimate Interest (Art. 6(1)(f)): Security and improvement\n• Legal Obligation (Art. 6(1)(c)): Notification when required by law' },
  { baslik: '🌍 Section 4: Third Parties', icerik: 'FinTwin does NOT sell, rent, or share your personal data.\n\nLimited sharing:\n• SMTP provider: Only for OTP delivery\n• Exchange rate APIs: Anonymous requests, no personal data\n• Legal obligation: Court order or regulatory authority request' },
  { baslik: '📅 Section 5: Data Retention (GDPR Art. 5(1)(e))', icerik: '• Active account: Retained while your account exists\n• After deletion: All data permanently deleted within 24 hours\n• OTP codes: Automatically purged 5 minutes after creation' },
  { baslik: '✅ Section 6: Your Rights (GDPR Art. 15-22)', icerik: '• Right to Access: Request a copy of data we process about you\n• Right to Rectification: Update incorrect data in Account Settings\n• Right to Erasure: Delete your account via Settings → Delete Account\n• Data Portability: Request your data in JSON format\n• Withdraw Consent: Withdraw at any time\n• Right to Complain: File with your national Data Protection Authority\n\n📧 privacy@fintwin.app | Response within 30 days as required by GDPR' },
];

function Dropdown({ label, options, value, onSelect, placeholder }: {
  label: string; options: string[]; value: string;
  onSelect: (v: string) => void; placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={dd.container}>
      <Text style={dd.label}>{label}</Text>
      <TouchableOpacity style={dd.selector} onPress={() => setVisible(true)}>
        <Text style={[dd.selectorText, !value && { color: Colors.textLight }]}>
          {value || placeholder || '— Select —'}
        </Text>
        <Text style={dd.arrow}>▼</Text>
      </TouchableOpacity>
      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity style={dd.overlay} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={dd.modal}>
            <Text style={dd.modalTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[dd.option, item === value && dd.optionActive]}
                  onPress={() => { onSelect(item); setVisible(false); }}
                >
                  <Text style={[dd.optionText, item === value && dd.optionTextActive]}>{item}</Text>
                  {item === value && <Text style={dd.check}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function KVKKModal({ visible, onClose, lang }: { visible: boolean; onClose: () => void; lang: string }) {
  const sections = lang === 'TR' ? KVKK_TR : KVKK_EN;
  const title    = lang === 'TR' ? '📋 KVKK Aydınlatma Metni' : '📋 Privacy Notice';
  const closeText= lang === 'TR' ? 'Okudum, Kapat' : "I've Read, Close";
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={km.overlay}>
        <View style={km.container}>
          <LinearGradient colors={['#6366F1', '#8B5CF6']} style={km.header}>
            <Text style={km.headerTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={km.closeBtn}>
              <Text style={km.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </LinearGradient>
          <ScrollView style={km.scroll}>
            {sections.map((s, i) => (
              <View key={i} style={km.section}>
                <Text style={km.sectionTitle}>{s.baslik}</Text>
                <Text style={km.sectionBody}>{s.icerik}</Text>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity style={km.footer} onPress={onClose}>
            <Text style={km.footerText}>{closeText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function RegisterScreen() {
  const { lang } = useTranslation();
  const navigation = useNavigation<any>();
  const L = lang === 'TR';

  const [email,     setEmail]     = useState('');
  const [yas,       setYas]       = useState('');
  const [cinsiyet,  setCinsiyet]  = useState('');
  const [sehir,     setSehir]     = useState('');
  const [meslek,    setMeslek]    = useState('');
  const [gics,      setGics]      = useState('');
  const [kvkk,      setKvkk]      = useState(false);
  const [kvkkModal, setKvkkModal] = useState(false);
  const [loading,   setLoading]   = useState(false);

  const handleRegister = async () => {
    if (!email.trim() || !yas || !cinsiyet || !sehir || !meslek || !gics) {
      Alert.alert(
        L ? 'Eksik Bilgi' : 'Missing Info',
        L ? 'Lütfen tüm alanları doldurun.' : 'Please fill in all fields.'
      );
      return;
    }
    if (!kvkk) {
      Alert.alert(
        L ? 'Onay Gerekli' : 'Consent Required',
        L ? 'Devam etmek için KVKK metnini onaylayın.' : 'Please accept the Privacy Notice to continue.'
      );
      return;
    }
    // EN modda seçilen değerleri DB için her zaman TR olarak kaydet
    const cinsiyetDB = L ? cinsiyet : (CINSIYET_EN_TO_TR[cinsiyet] || cinsiyet);
    const meslekDB   = L ? meslek   : (MESLEK_EN_TO_TR[meslek]     || meslek);
    const gicsDB     = L ? gics     : (GICS_EN_TO_TR[gics]         || gics);

    setLoading(true);
    try {
      await AuthAPI.register({
        email: email.trim().toLowerCase(),
        yas,
        cinsiyet: cinsiyetDB,
        sehir,
        meslek: meslekDB,
        gics_l3: gicsDB,
        lang,
      });
      navigation.navigate('OTP', { email: email.trim().toLowerCase(), lang });
    } catch (e: any) {
      Alert.alert(
        L ? 'Hata' : 'Error',
        e?.response?.data?.detail || (L ? 'Kayıt başarısız.' : 'Registration failed.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

          <Text style={{ fontSize: 26, fontWeight: '900', color: Colors.text, marginBottom: 4 }}>
            {L ? '🌟 Yeni Hesap Oluştur' : '🌟 Create New Account'}
          </Text>
          <Text style={{ fontSize: 14, color: Colors.textMuted, marginBottom: Spacing.lg }}>
            {L ? 'Bilgilerini girerek başla.' : 'Enter your details to get started.'}
          </Text>

          <Card>
            <Input
              label={L ? '📧 E-posta' : '📧 Email'}
              value={email}
              onChangeText={setEmail}
              placeholder="example@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Dropdown
                  label={L ? '🎂 Yaş' : '🎂 Age'}
                  options={YASLAR}
                  value={yas}
                  onSelect={setYas}
                  placeholder={L ? '— Seçin —' : '— Select —'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Dropdown
                  label={L ? '🧬 Cinsiyet' : '🧬 Gender'}
                  options={L ? CINSIYETLER_TR : CINSIYETLER_EN}
                  value={cinsiyet}
                  onSelect={setCinsiyet}
                  placeholder={L ? '— Seçin —' : '— Select —'}
                />
              </View>
            </View>

            <Dropdown
              label={L ? '📍 Şehir' : '📍 City'}
              options={ILLER}
              value={sehir}
              onSelect={setSehir}
              placeholder={L ? '— Seçin —' : '— Select —'}
            />

            <Dropdown
              label={L ? '💼 Meslek' : '💼 Occupation'}
              options={L ? MESLEKLER_TR : MESLEKLER_EN}
              value={meslek}
              onSelect={setMeslek}
              placeholder={L ? '— Seçin —' : '— Select —'}
            />

            <Dropdown
              label={L ? '🏢 Sektör (GICS)' : '🏢 Sector (GICS)'}
              options={L ? GICS_TR : GICS_EN}
              value={gics}
              onSelect={setGics}
              placeholder={L ? '— Seçin —' : '— Select —'}
            />

            <View style={styles.kvkkRow}>
              <TouchableOpacity onPress={() => setKvkk(!kvkk)}>
                <View style={[styles.checkboxBox, kvkk && styles.checkboxChecked]}>
                  {kvkk && <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>✓</Text>}
                </View>
              </TouchableOpacity>
              <Text style={styles.kvkkText}>
                {L
                  ? 'KVKK Aydınlatma Metnini okudum ve kişisel verilerimin işlenmesine onay veriyorum.'
                  : 'I have read the Privacy Notice and consent to processing of my personal data.'}
                {'  '}
                <Text style={styles.kvkkLink} onPress={() => setKvkkModal(true)}>
                  {L ? '📋 Metni Oku' : '📋 Read Notice'}
                </Text>
              </Text>
            </View>

            <Button
              title={L ? 'Hesap Oluştur' : 'Create Account'}
              onPress={handleRegister}
              loading={loading}
              fullWidth
            />
          </Card>

          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: Colors.primary, fontWeight: '600' }}>
              ← {L ? 'Giriş Yap' : 'Sign In'}
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
      <KVKKModal visible={kvkkModal} onClose={() => setKvkkModal(false)} lang={lang} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  kvkkRow:         { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, gap: 10 },
  checkboxBox:     { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.bgElevated, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  kvkkText:        { flex: 1, fontSize: 13, color: Colors.textMuted, lineHeight: 20 },
  kvkkLink:        { color: Colors.primary, fontWeight: '700', textDecorationLine: 'underline' },
});

const dd = StyleSheet.create({
  container:        { marginBottom: 14 },
  label:            { fontSize: 13, fontWeight: '600', color: Colors.textMuted, marginBottom: 6 },
  selector:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.bgInput, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13 },
  selectorText:     { fontSize: 15, color: Colors.text, flex: 1 },
  arrow:            { fontSize: 11, color: Colors.textMuted },
  overlay:          { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  modal:            { backgroundColor: Colors.bgCard, borderRadius: 16, maxHeight: 400, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  modalTitle:       { fontSize: 16, fontWeight: '700', color: Colors.text, padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  option:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: Colors.border },
  optionActive:     { backgroundColor: 'rgba(124,110,250,0.15)' },
  optionText:       { fontSize: 15, color: Colors.text },
  optionTextActive: { color: Colors.primary, fontWeight: '700' },
  check:            { fontSize: 16, color: Colors.primary },
});

const km = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container:    { backgroundColor: Colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', borderTopWidth: 1, borderColor: Colors.border },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  headerTitle:  { fontSize: 16, fontWeight: '800', color: '#fff', flex: 1 },
  closeBtn:     { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  scroll:       { padding: 20 },
  section:      { backgroundColor: Colors.bgElevated, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#1E1B4B', marginBottom: 8 },
  sectionBody:  { fontSize: 13, color: '#374151', lineHeight: 20 },
  footer:       { backgroundColor: Colors.primary, margin: 16, borderRadius: 14, padding: 16, alignItems: 'center' },
  footerText:   { color: '#fff', fontSize: 15, fontWeight: '800' },
});
