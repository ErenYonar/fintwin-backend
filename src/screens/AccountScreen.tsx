// src/screens/AccountScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../store/useStore';
import { Button, Card, Divider } from '../components/UI';
import { useColors, Colors, Spacing, Radius, Shadow } from '../utils/theme';
import { useTranslation, MESLEK_TR_TO_EN, MESLEK_EN_TO_TR, GICS_TR_TO_EN, GICS_EN_TO_TR, CINSIYET_TR_TO_EN, CINSIYET_EN_TO_TR } from '../hooks/useTranslation';
import { UserAPI } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Listeler ──────────────────────────────────────────────────────────────────
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

// ── Dropdown bileşeni ─────────────────────────────────────────────────────────
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
        onPress={() => setVisible(true)} activeOpacity={0.8}
      >
        <Text style={{ fontSize: 15, color: value ? Colors.text : Colors.textLight, flex: 1 }}>
          {value || placeholder || '— Select —'}
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

function ProfileRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  const Colors = useColors();
  const styles = make_styles(Colors);
  return (
    <View style={styles.profileRow}>
      <View style={styles.profileRowIcon}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.profileRowLabel}>{label}</Text>
        <Text style={styles.profileRowValue}>{value || '—'}</Text>
      </View>
    </View>
  );
}

export default function AccountScreen() {
  const Colors = useColors();
  const styles = make_styles(Colors);
  const { lang }    = useTranslation();
  const navigation  = useNavigation<any>();
  const { user, logout, deleteAccount } = useStore();
  const L = lang === 'TR';

  const [editing,  setEditing]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [yas,      setYas]      = useState(user?.yas      || '');
  const [cinsiyet, setCinsiyet] = useState(user?.cinsiyet || '');
  const [sehir,    setSehir]    = useState(user?.sehir    || '');
  const [meslek,   setMeslek]   = useState(user?.meslek   || '');
  const [gics,     setGics]     = useState(user?.gics_l3  || '');

  if (!user) return null;

  // Profil görüntüleme: DB'deki TR değerini mevcut dile çevir
  const profileFields = [
    { icon: '🎂', label: L ? 'Yaş'     : 'Age',        value: user.yas || '—' },
    { icon: '🧬', label: L ? 'Cinsiyet': 'Gender',     value: L ? (user.cinsiyet || '—') : (CINSIYET_TR_TO_EN[user.cinsiyet || ''] || user.cinsiyet || '—') },
    { icon: '📍', label: L ? 'Şehir'   : 'City',       value: user.sehir || '—' },
    { icon: '💼', label: L ? 'Meslek'  : 'Occupation', value: L ? (user.meslek || '—') : (MESLEK_TR_TO_EN[user.meslek || ''] || user.meslek || '—') },
    { icon: '🏢', label: L ? 'Sektör'  : 'Sector',     value: L ? (user.gics_l3 || '—') : (GICS_TR_TO_EN[user.gics_l3 || ''] || user.gics_l3 || '—') },
  ];

  // Düzenlemeye başlarken mevcut dile göre dönüştür
  const startEditing = () => {
    setYas(user.yas || '');
    setCinsiyet(L ? (user.cinsiyet || '') : (CINSIYET_TR_TO_EN[user.cinsiyet || ''] || user.cinsiyet || ''));
    setSehir(user.sehir || '');
    setMeslek(L ? (user.meslek || '') : (MESLEK_TR_TO_EN[user.meslek || ''] || user.meslek || ''));
    setGics(L ? (user.gics_l3 || '') : (GICS_TR_TO_EN[user.gics_l3 || ''] || user.gics_l3 || ''));
    setEditing(true);
  };

  // Kaydetmeden önce her zaman TR'ye çevir (DB'de TR sakla)
  const handleSave = async () => {
    if (!yas || !cinsiyet || !sehir || !meslek || !gics) {
      Alert.alert(
        L ? 'Eksik Bilgi' : 'Missing Info',
        L ? 'Lütfen tüm alanları doldurun.' : 'Please fill in all fields.'
      );
      return;
    }
    const cinsiyetDB = L ? cinsiyet : (CINSIYET_EN_TO_TR[cinsiyet] || cinsiyet);
    const meslekDB   = L ? meslek   : (MESLEK_EN_TO_TR[meslek]     || meslek);
    const gicsDB     = L ? gics     : (GICS_EN_TO_TR[gics]         || gics);

    setSaving(true);
    try {
      await UserAPI.updateMe({ yas, cinsiyet: cinsiyetDB, sehir, meslek: meslekDB, gics_l3: gicsDB });
      const newUser = { ...user, yas, cinsiyet: cinsiyetDB, sehir, meslek: meslekDB, gics_l3: gicsDB };
      await AsyncStorage.setItem('fintwin_user', JSON.stringify(newUser));
      useStore.setState({ user: newUser });
      setEditing(false);
      Alert.alert(
        L ? '✅ Güncellendi' : '✅ Updated',
        L ? 'Bilgileriniz başarıyla güncellendi.' : 'Your information has been updated.'
      );
    } catch (e) {
      Alert.alert(
        L ? 'Hata' : 'Error',
        L ? 'Güncellenemedi. Lütfen tekrar deneyin.' : 'Could not update. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setYas(user.yas || '');
    setCinsiyet(user.cinsiyet || '');
    setSehir(user.sehir || '');
    setMeslek(user.meslek || '');
    setGics(user.gics_l3 || '');
    setEditing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      L ? 'Çıkış Yap' : 'Sign Out',
      L ? 'Çıkış yapmak istiyor musunuz?' : 'Do you want to sign out?',
      [
        { text: L ? 'İptal' : 'Cancel', style: 'cancel' },
        { text: L ? 'Çıkış' : 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      L ? 'Hesabı Sil' : 'Delete Account',
      L ? 'Tüm verileriniz kalıcı olarak silinecek. Emin misiniz?' : 'All your data will be permanently deleted. Are you sure?',
      [
        { text: L ? 'İptal' : 'Cancel', style: 'cancel' },
        { text: L ? 'Sil' : 'Delete', style: 'destructive', onPress: async () => { await deleteAccount(); } },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Geri Butonu ── */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← {L ? 'Geri' : 'Back'}</Text>
        </TouchableOpacity>

        {/* ── Header ── */}
        <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.headerGrad}>
          <View style={styles.headerCircle1} />
          <View style={styles.headerCircle2} />
          <View style={styles.avatarBox}>
            <Text style={styles.avatarEmoji}>👤</Text>
          </View>
          <Text style={styles.headerName}>FinTwin</Text>
          <Text style={styles.headerSub}>{L ? 'Hesap Ayarları' : 'Account Settings'}</Text>
        </LinearGradient>

        {/* ── Profil Bilgileri ── */}
        <Card>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              {L ? '👤 Profil Bilgileri' : '👤 Profile Info'}
            </Text>
            {!editing && (
              <TouchableOpacity style={styles.editBtn} onPress={startEditing} activeOpacity={0.8}>
                <Text style={styles.editBtnText}>{L ? '✏️ Düzenle' : '✏️ Edit'}</Text>
              </TouchableOpacity>
            )}
          </View>

          {!editing ? (
            <View style={styles.profileList}>
              {profileFields.map((f, i) => (
                <ProfileRow key={i} icon={f.icon} label={f.label} value={f.value} />
              ))}
            </View>
          ) : (
            <View>
              <Text style={styles.editHint}>
                {L
                  ? 'ℹ️ Bilgilerinizi güncelleyin. Değişiklikler hemen kaydedilir.'
                  : 'ℹ️ Update your information. Changes are saved immediately.'}
              </Text>

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
                label={L ? '🏢 Sektör' : '🏢 Sector'}
                options={L ? GICS_TR : GICS_EN}
                value={gics}
                onSelect={setGics}
                placeholder={L ? '— Seçin —' : '— Select —'}
              />

              <View style={styles.editActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelEdit} activeOpacity={0.8}>
                  <Text style={styles.cancelBtnText}>{L ? 'İptal' : 'Cancel'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                  onPress={handleSave}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  {saving
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={styles.saveBtnText}>{L ? '💾 Kaydet' : '💾 Save'}</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Card>

        <Divider />

        {/* ── Çıkış Yap ── */}
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.8}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            gap: 8, paddingVertical: 15, borderRadius: Radius.lg, marginBottom: 12,
            backgroundColor: Colors.bgCard,
            borderWidth: 1.5, borderColor: Colors.border,
          }}
        >
          <Text style={{ fontSize: 18 }}>🚪</Text>
          <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.text }}>
            {L ? 'Çıkış Yap' : 'Sign Out'}
          </Text>
        </TouchableOpacity>

        {/* ── Tehlikeli Bölge ── */}
        <View style={{
          borderRadius: Radius.xl, borderWidth: 1.5,
          borderColor: 'rgba(239,68,68,0.25)',
          backgroundColor: Colors.bgCard,
          padding: Spacing.lg, marginBottom: Spacing.sm,
          overflow: 'hidden',
        }}>
          {/* Üst kırmızı şerit */}
          <View style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 4,
            backgroundColor: Colors.danger,
          }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, marginBottom: 8 }}>
            <Text style={{ fontSize: 18 }}>⚠️</Text>
            <Text style={{ fontSize: 15, fontWeight: '800', color: Colors.danger }}>
              {L ? 'Tehlikeli Bölge' : 'Danger Zone'}
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: Colors.textMuted, lineHeight: 20, marginBottom: 16 }}>
            {L
              ? 'Hesabınızı sildiğinizde tüm verileriniz kalıcı olarak silinir ve geri alınamaz.'
              : 'Deleting your account will permanently remove all your data and cannot be undone.'}
          </Text>
          <TouchableOpacity
            onPress={handleDeleteAccount}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              gap: 8, paddingVertical: 14, borderRadius: Radius.lg,
              backgroundColor: Colors.danger,
            }}
          >
            <Text style={{ fontSize: 16 }}>🗑️</Text>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff' }}>
              {L ? 'Hesabı Kalıcı Olarak Sil' : 'Delete Account Permanently'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const make_styles = (C: any) => StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1, padding: Spacing.lg },

  backBtn:  { marginBottom: Spacing.sm },
  backText: { fontSize: 14, color: C.primary, fontWeight: '600' },

  headerGrad: {
    borderRadius: Radius.xl, padding: Spacing.xl,
    marginBottom: Spacing.lg, overflow: 'hidden', alignItems: 'center',
    ...Shadow.lg,
  },
  headerCircle1: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.05)', top: -40, right: -40,
  },
  headerCircle2: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)', bottom: -20, left: -20,
  },
  avatarBox: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarEmoji:  { fontSize: 36 },
  headerName:   { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 4 },
  headerSub:    { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  headerDate:   { fontSize: 11, color: 'rgba(255,255,255,0.5)' },

  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  sectionTitle:     { fontSize: 16, fontWeight: '800', color: C.text },
  editBtn: {
    backgroundColor: 'rgba(124,110,250,0.15)', borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1.5, borderColor: 'rgba(124,110,250,0.4)',
  },
  editBtnText: { fontSize: 13, fontWeight: '700', color: C.primary },

  profileList: { gap: 2 },
  profileRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  profileRowIcon: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: C.bgElevated,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  profileRowLabel: { fontSize: 11, color: C.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  profileRowValue: { fontSize: 14, color: C.text, fontWeight: '700', marginTop: 1 },

  editHint: {
    fontSize: 12, color: C.textMuted, marginBottom: Spacing.md,
    backgroundColor: 'rgba(124,110,250,0.1)', borderRadius: Radius.sm,
    padding: Spacing.sm, lineHeight: 18,
    borderWidth: 1, borderColor: 'rgba(124,110,250,0.2)',
  },
  editActions: { flexDirection: 'row', gap: 10, marginTop: Spacing.sm },
  cancelBtn: {
    flex: 1, paddingVertical: 13, borderRadius: Radius.lg,
    backgroundColor: C.bgElevated, alignItems: 'center',
    borderWidth: 1.5, borderColor: C.border,
  },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: C.textMuted },
  saveBtn: {
    flex: 2, paddingVertical: 13, borderRadius: Radius.lg,
    backgroundColor: C.primary, alignItems: 'center',
    ...Shadow.md,
  },
  saveBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },

  dangerCard:  { borderWidth: 1.5, borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.05)', borderRadius: 16, padding: 4 },
  dangerTitle: { fontSize: 15, fontWeight: '800', color: C.danger, marginBottom: 8 },
  dangerText:  { fontSize: 13, color: C.textMuted, marginBottom: Spacing.md, lineHeight: 20 },
});

const dd = StyleSheet.create({
  container:        { marginBottom: 14 },
  label:            { fontSize: 13, fontWeight: '600', color: Colors.textMuted, marginBottom: 6 },
  selector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.bgInput, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
  },
  selectorText:     { fontSize: 15, color: Colors.text, flex: 1 },
  arrow:            { fontSize: 11, color: Colors.textMuted },
  overlay:          { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 },
  modal:            { backgroundColor: Colors.bgCard, borderRadius: 16, maxHeight: 420, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  modalTitle:       { fontSize: 16, fontWeight: '700', color: Colors.text, padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  option:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: Colors.border },
  optionActive:     { backgroundColor: 'rgba(124,110,250,0.15)' },
  optionText:       { fontSize: 15, color: Colors.text },
  optionTextActive: { color: Colors.primary, fontWeight: '700' },
  check:            { fontSize: 16, color: Colors.primary },
});
