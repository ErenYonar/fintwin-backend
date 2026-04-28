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
import { useColors, Colors, Spacing, Radius, Shadow } from '../utils/theme';
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
  { baslik: '🔐 1. Veri Sorumlusu ve Gizlilik Taahhüdü', icerik: 'FinTwin ("Uygulama"), kullanıcı gizliliğini temel alan bir mimariyle geliştirilmiştir. Uygulama, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") ve ilgili mevzuata tam uyum sağlamayı taahhüt eder.\n\nFinTwin, e-posta adresinizi sisteme girdiği anda SHA-256 kriptografik hash yöntemiyle maskeler; bu sayede gerçek kimliğiniz sunucularımızda hiçbir zaman "açık veri" olarak yer almaz.' },
  { baslik: '📋 2. İşlenen Kişisel Veriler', icerik: 'Uygulamayı kullanırken aşağıdaki verileriniz, tamamen gönüllülük esasına dayalı olarak toplanmaktadır:\n\n• Kimlik ve İletişim: E-posta adresinin kriptografik özeti (hash), yaş aralığı, cinsiyet beyanı.\n• Mesleki Bilgiler: Meslek grubu ve sektör (GICS L3 standardında).\n• Finansal Veriler: Gelir kaynakları, harcama kalemleri, bütçe kayıtları ve finansal skor sonuçları.\n• Teknik ve Güvenlik: OTP doğrulama kayıtları, cihaz modeli, işletim sistemi versiyonu ve uygulama içi kullanım logları.' },
  { baslik: '⚖️ 3. Veri İşleme Amaçları ve Hukuki Sebepler', icerik: 'Verileriniz; KVKK Madde 5/2 kapsamında "bir sözleşmenin kurulması veya ifası" ve "veri sorumlusunun meşru menfaatleri" hukuki sebeplerine dayanarak şu amaçlarla işlenir:\n\n• Kişiselleştirilmiş finansal analiz ve "Finansal Koç" tavsiyeleri sunmak.\n• Kullanıcının harcama alışkanlıklarına göre finansal skor hesaplaması yapmak.\n• E-posta doğrulaması yoluyla hesap güvenliğini sağlamak.\n• Uygulama hatalarını tespit etmek ve kullanıcı arayüzünü optimize etmek.' },
  { baslik: '🌍 4. Veri Aktarımı ve Üçüncü Taraflar', icerik: 'FinTwin, verilerinizi ticari amaçlarla üçüncü şahıslara kesinlikle satmaz veya kiralamaz. Veri aktarımı sadece şu sınırlı durumlarda gerçekleşir:\n\n• Hizmet Sağlayıcılar: OTP kodlarının iletimi için kullanılan e-posta servis sağlayıcıları.\n• Yasal Zorunluluk: Yetkili adli veya idari merciler tarafından usulüne uygun bir talep gelmesi halinde.' },
  { baslik: '⚠️ 5. Hukuki Sorumluluk Reddi', icerik: '• Yatırım Tavsiyesi Değildir: Uygulama tarafından üretilen skorlar, analizler ve "Koç" önerileri tamamen algoritmik olup; 6362 sayılı Sermaye Piyasası Kanunu kapsamında yatırım danışmanlığı teşkil etmez.\n\n• Bağlayıcılık: Kullanıcı, uygulamadaki verilere dayanarak aldığı finansal kararların tüm sorumluluğunun kendisine ait olduğunu kabul eder. FinTwin, hatalı veri girişi veya piyasa dalgalanmaları nedeniyle oluşabilecek hiçbir maddi zarardan sorumlu tutulamaz.' },
  { baslik: '🗑️ 6. Veri Saklama ve Unutulma Hakkı', icerik: 'Kişisel verileriniz, üyeliğiniz süresince saklanır. Ayarlar bölümünden "Hesabı Sil" komutu verildiğinde; finansal kayıtlarınız, demografik bilgileriniz ve e-posta hash kayıtlarınız 24 saat içerisinde sunucularımızdan kalıcı, geri döndürülemez ve fiziksel olarak silinir.' },
  { baslik: '✅ 7. İlgili Kişinin Hakları ve İletişim', icerik: 'KVKK Madde 11 uyarınca verileriniz hakkında bilgi alma, düzeltme ve silme haklarına sahipsiniz.\n\n📧 Talepleriniz için: fintwin@gmail.com' },
];

const KVKK_EN = [
  { baslik: '🔐 1. Data Controller and Security Standards', icerik: 'FinTwin ("Application") is designed with a "Privacy-by-Design" approach. We process personal data in compliance with global standards, including GDPR and local data protection laws.\n\nUpon registration, your email address is immediately obfuscated using a SHA-256 cryptographic hash, ensuring that your plain-text identity is never stored on our infrastructure.' },
  { baslik: '📋 2. Categories of Processed Data', icerik: 'By interacting with the app, we collect the following data points provided voluntarily:\n\n• Identity & Contact: Cryptographic hash of the email address, age group, and gender.\n• Professional Data: Occupation and industry (GICS L3 standards).\n• Financial Records: Income sources, expense categories, budget logs, and financial score results.\n• Technical Metadata: OTP verification logs, device model, OS version, and performance diagnostics.' },
  { baslik: '⚖️ 3. Purposes of Data Processing', icerik: 'Data is processed based on "Contractual Necessity" and "Legitimate Interests" for:\n\n• Providing personalized financial analytics and "Financial Coach" suggestions.\n• Calculating the user\'s Financial Health Score based on input metrics.\n• Ensuring account security via email-based verification (OTP).\n• Debugging and improving overall application performance.' },
  { baslik: '🌍 4. Data Sharing and Third Parties', icerik: 'FinTwin does not sell or rent your personal or financial data to third parties. Data sharing is limited to:\n\n• Service Providers: SMTP providers used solely for delivering verification emails.\n• Legal Obligations: Disclosure to authorized government or judicial bodies only when required by law.' },
  { baslik: '⚠️ 5. Comprehensive Legal Disclaimer', icerik: '• Not Financial Advice: All financial scores, "Coach" recommendations, and trend analyses are algorithmic. They do not constitute professional investment, tax, or legal advice.\n\n• No Liability: The user assumes full responsibility for any financial decisions made based on app content. FinTwin is not liable for financial losses, inaccuracies in user-entered data, or market volatility.' },
  { baslik: '🗑️ 6. Data Retention and Right to be Forgotten', icerik: 'In accordance with global privacy laws, you have full control over your data. Upon selecting "Delete Account" in the settings, all your financial records, demographic data, and your unique hash will be permanently, irreversibly, and physically purged from our systems within 24 hours.' },
  { baslik: '✅ 7. User Rights and Contact Information', icerik: 'Under data protection regulations, you have the right to access, rectify, or erase your data.\n\n📧 For any inquiries, please contact: fintwin@gmail.com' },
];

function Dropdown({ label, options, value, onSelect, placeholder }: {
  label: string; options: string[]; value: string;
  onSelect: (v: string) => void; placeholder?: string;
}) {
  const Colors = useColors();
  const [visible, setVisible] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.textMuted, marginBottom: 6 }}>{label}</Text>
      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.bgInput, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13 }}
        onPress={() => setVisible(true)}
      >
        <Text style={{ fontSize: 15, color: value ? Colors.text : Colors.textLight, flex: 1 }}>
          {value || placeholder || '— Seçin —'}
        </Text>
        <Text style={{ fontSize: 11, color: Colors.textMuted }}>▼</Text>
      </TouchableOpacity>
      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 }} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={{ backgroundColor: Colors.bgCard, borderRadius: 16, maxHeight: 420, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.text, padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border }}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: item === value ? 'rgba(99,102,241,0.1)' : 'transparent' }}
                  onPress={() => { onSelect(item); setVisible(false); }}
                >
                  <Text style={{ fontSize: 15, color: item === value ? Colors.primary : Colors.text, fontWeight: item === value ? '700' : '400' }}>{item}</Text>
                  {item === value && <Text style={{ fontSize: 16, color: Colors.primary }}>✓</Text>}
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
  const Colors = useColors();
  const sections = lang === 'TR' ? KVKK_TR : KVKK_EN;
  const title    = lang === 'TR' ? '📋 KVKK Aydınlatma Metni' : '📋 Privacy Notice';
  const closeText= lang === 'TR' ? 'Okudum, Kapat' : "I've Read, Close";
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={km.overlay}>
        <View style={[km.container, { backgroundColor: Colors.bg }]}>
          <LinearGradient colors={['#6366F1', '#8B5CF6']} style={km.header}>
            <Text style={km.headerTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={km.closeBtn}>
              <Text style={km.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </LinearGradient>
          <ScrollView style={km.scroll}>
            {sections.map((s, i) => (
              <View key={i} style={[km.section, { backgroundColor: Colors.bgCard, borderColor: Colors.border }]}>
                <Text style={[km.sectionTitle, { color: Colors.text }]}>{s.baslik}</Text>
                <Text style={[km.sectionBody, { color: Colors.textMuted }]}>{s.icerik}</Text>
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
  const Colors = useColors();
  const styles = make_styles(Colors);
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

const make_styles = (C: any) => StyleSheet.create({
  kvkkRow:         { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, gap: 10 },
  checkboxBox:     { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: C.border, backgroundColor: C.bgElevated, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  checkboxChecked: { backgroundColor: C.primary, borderColor: C.primary },
  kvkkText:        { flex: 1, fontSize: 13, color: C.textMuted, lineHeight: 20 },
  kvkkLink:        { color: C.primary, fontWeight: '700', textDecorationLine: 'underline' },
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
  container:    { backgroundColor: Colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', flex: 1, borderTopWidth: 1, borderColor: Colors.border },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  headerTitle:  { fontSize: 16, fontWeight: '800', color: '#fff', flex: 1 },
  closeBtn:     { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  scroll:       { padding: 20, flex: 1 },
  section:      { backgroundColor: Colors.bgElevated, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#1E1B4B', marginBottom: 8 },
  sectionBody:  { fontSize: 13, color: '#374151', lineHeight: 20 },
  footer:       { backgroundColor: Colors.primary, margin: 16, borderRadius: 14, padding: 16, alignItems: 'center' },
  footerText:   { color: '#fff', fontSize: 15, fontWeight: '800' },
});
