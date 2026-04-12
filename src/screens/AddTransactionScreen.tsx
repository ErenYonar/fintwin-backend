// src/screens/AddTransactionScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

import { useStore } from '../store/useStore';
import { Button, Input, Card, Divider } from '../components/UI';
import { Colors, Spacing, Radius, Typography } from '../utils/theme';
import { useTranslation, KATEGORI_EN_TO_TR } from '../hooks/useTranslation';

// ── Tip tanımı ────────────────────────────────────────────────────────────────
interface PresetItem {
  label: string;
  price: number;
}

// ── Preset verisi ─────────────────────────────────────────────────────────────
// Her kategori için { TR: PresetItem[], EN: PresetItem[] }
const PRESET_DATA: Record<string, { TR: PresetItem[]; EN: PresetItem[] }> = {
  // ── ABONELİK / Subscription ─────────────────────────────────────────────
  'Abonelik': {
    TR: [
      { label: 'Netflix (Temel)',              price: 99.99 },
      { label: 'Netflix (Standart)',           price: 199.99 },
      { label: 'Netflix (Premium)',            price: 349.99 },
      { label: 'Spotify (Bireysel)',           price: 59.99 },
      { label: 'Spotify (Duo)',                price: 79.99 },
      { label: 'Spotify (Aile)',               price: 99.99 },
      { label: 'YouTube Premium (Bireysel)',   price: 79.99 },
      { label: 'YouTube Premium (Aile)',       price: 149.99 },
      { label: 'Disney+ (Standart)',           price: 134.99 },
      { label: 'Disney+ (Premium)',            price: 269.99 },
      { label: 'Amazon Prime',                 price: 39.00 },
      { label: 'BluTV (Standart)',             price: 109.90 },
      { label: 'BluTV (Süper)',                price: 219.90 },
      { label: 'Exxen',                        price: 119.90 },
      { label: 'Exxen + Spor',                 price: 399.90 },
      { label: 'beIN Connect',                 price: 449.00 },
      { label: 'TOD (Spor Extra)',             price: 399.00 },
      { label: 'S Sport Plus',                 price: 274.90 },
      { label: 'Gain',                         price: 99.90 },
      { label: 'Mubi',                         price: 69.90 },
      { label: 'Apple TV+',                    price: 64.99 },
      { label: 'Apple Music (Bireysel)',       price: 34.99 },
      { label: 'Apple Music (Aile)',           price: 59.99 },
      { label: 'Apple One (Bireysel)',         price: 84.99 },
      { label: 'iCloud+ (50GB)',               price: 12.99 },
      { label: 'iCloud+ (200GB)',              price: 39.99 },
      { label: 'iCloud+ (2TB)',                price: 129.99 },
      { label: 'Google One (100GB)',           price: 29.99 },
      { label: 'Google One (200GB)',           price: 44.99 },
      { label: 'Google One (2TB)',             price: 149.99 },
      { label: 'ChatGPT Plus',                 price: 769.00 },
      { label: 'Claude Pro',                   price: 769.00 },
      { label: 'Duolingo Plus',               price: 419.99 },
      { label: 'Strava Premium',              price: 119.99 },
      { label: 'Calm',                         price: 399.99 },
      { label: 'Headspace',                    price: 299.99 },
      { label: 'MacFit',                       price: 1990.00 },
      { label: 'Fitpass',                      price: 999.00 },
      { label: 'PlayStation Plus (Essential)', price: 239.00 },
      { label: 'PlayStation Plus (Extra)',     price: 419.00 },
      { label: 'Xbox Game Pass Core',          price: 199.00 },
      { label: 'Xbox Game Pass Ultimate',      price: 449.00 },
      { label: 'LinkedIn Premium',             price: 1199.00 },
      { label: 'Canva Pro',                    price: 154.99 },
      { label: 'Microsoft 365 (Kişisel)',      price: 104.99 },
      { label: 'Microsoft 365 (Aile)',         price: 154.99 },
      { label: 'Notion Plus',                  price: 384.00 },
    ],
    EN: [
      { label: 'Netflix (Basic)',              price: 99.99 },
      { label: 'Netflix (Standard)',           price: 199.99 },
      { label: 'Netflix (Premium)',            price: 349.99 },
      { label: 'Spotify (Individual)',         price: 59.99 },
      { label: 'Spotify (Duo)',                price: 79.99 },
      { label: 'Spotify (Family)',             price: 99.99 },
      { label: 'YouTube Premium (Individual)', price: 79.99 },
      { label: 'YouTube Premium (Family)',     price: 149.99 },
      { label: 'Disney+ (Standard)',           price: 134.99 },
      { label: 'Disney+ (Premium)',            price: 269.99 },
      { label: 'Amazon Prime',                 price: 39.00 },
      { label: 'BluTV (Standard)',             price: 109.90 },
      { label: 'BluTV (Super)',                price: 219.90 },
      { label: 'Exxen',                        price: 119.90 },
      { label: 'Exxen + Sports',              price: 399.90 },
      { label: 'beIN Connect',                 price: 449.00 },
      { label: 'TOD (Sports Extra)',           price: 399.00 },
      { label: 'S Sport Plus',                 price: 274.90 },
      { label: 'Gain',                         price: 99.90 },
      { label: 'Mubi',                         price: 69.90 },
      { label: 'Apple TV+',                    price: 64.99 },
      { label: 'Apple Music (Individual)',     price: 34.99 },
      { label: 'Apple Music (Family)',         price: 59.99 },
      { label: 'Apple One (Individual)',       price: 84.99 },
      { label: 'iCloud+ (50GB)',               price: 12.99 },
      { label: 'iCloud+ (200GB)',              price: 39.99 },
      { label: 'iCloud+ (2TB)',                price: 129.99 },
      { label: 'Google One (100GB)',           price: 29.99 },
      { label: 'Google One (200GB)',           price: 44.99 },
      { label: 'Google One (2TB)',             price: 149.99 },
      { label: 'ChatGPT Plus',                 price: 769.00 },
      { label: 'Claude Pro',                   price: 769.00 },
      { label: 'Duolingo Plus',               price: 419.99 },
      { label: 'Strava Premium',              price: 119.99 },
      { label: 'Calm',                         price: 399.99 },
      { label: 'Headspace',                    price: 299.99 },
      { label: 'MacFit',                       price: 1990.00 },
      { label: 'Fitpass',                      price: 999.00 },
      { label: 'PlayStation Plus (Essential)', price: 239.00 },
      { label: 'PlayStation Plus (Extra)',     price: 419.00 },
      { label: 'Xbox Game Pass Core',          price: 199.00 },
      { label: 'Xbox Game Pass Ultimate',      price: 449.00 },
      { label: 'LinkedIn Premium',             price: 1199.00 },
      { label: 'Canva Pro',                    price: 154.99 },
      { label: 'Microsoft 365 (Personal)',     price: 104.99 },
      { label: 'Microsoft 365 (Family)',       price: 154.99 },
      { label: 'Notion Plus',                  price: 384.00 },
    ],
  },

  // ── FATURA / Bill ────────────────────────────────────────────────────────
  'Fatura': {
    TR: [
      { label: 'Elektrik',           price: 800.0 },
      { label: 'Su',                 price: 350.0 },
      { label: 'Doğalgaz',           price: 1500.0 },
      { label: 'İnternet',           price: 500.0 },
      { label: 'Cep Telefonu',       price: 400.0 },
      { label: 'Kasko',              price: 2500.0 },
      { label: 'Trafik Sigortası',   price: 400.0 },
      { label: 'Sağlık Sigortası',   price: 3500.0 },
      { label: 'DASK',               price: 150.0 },
    ],
    EN: [
      { label: 'Electricity',                    price: 800.0 },
      { label: 'Water',                          price: 350.0 },
      { label: 'Natural Gas',                    price: 1500.0 },
      { label: 'Internet',                       price: 500.0 },
      { label: 'Mobile Phone',                   price: 400.0 },
      { label: 'Car Insurance (Comprehensive)',  price: 2500.0 },
      { label: 'Car Insurance (Liability)',      price: 400.0 },
      { label: 'Health Insurance',               price: 3500.0 },
      { label: 'Earthquake Insurance',           price: 150.0 },
    ],
  },

  // ── KİRA/AİDAT / Rent/HOA ───────────────────────────────────────────────
  'Kira/Aidat': {
    TR: [
      { label: 'Kira',              price: 25000.0 },
      { label: 'Aidat',             price: 2500.0 },
      { label: 'Site Aidatı',       price: 3000.0 },
      { label: 'Apartman Aidatı',   price: 1500.0 },
      { label: 'İşyeri Kirası',     price: 50000.0 },
      { label: 'Depo/Garaj Kirası', price: 5000.0 },
    ],
    EN: [
      { label: 'Rent',                    price: 25000.0 },
      { label: 'HOA Fee',                 price: 2500.0 },
      { label: 'Community Fee',           price: 3000.0 },
      { label: 'Building Fee',            price: 1500.0 },
      { label: 'Commercial Rent',         price: 50000.0 },
      { label: 'Storage / Garage Rent',   price: 5000.0 },
    ],
  },

  // ── KREDİ/BORÇ / Loan/Debt ──────────────────────────────────────────────
  'Kredi/Borç': {
    TR: [
      { label: 'Konut Kredisi',        price: 25000.0 },
      { label: 'Araç Kredisi',         price: 15000.0 },
      { label: 'İhtiyaç Kredisi',      price: 8000.0 },
      { label: 'Kredi Kartı (Asgari)', price: 3000.0 },
      { label: 'Kredi Kartı (Tam)',    price: 15000.0 },
      { label: 'Öğrenim Kredisi (KYK)',price: 2000.0 },
      { label: 'Bireysel Borç',        price: 5000.0 },
      { label: 'Taksit',               price: 2000.0 },
    ],
    EN: [
      { label: 'Mortgage',                   price: 25000.0 },
      { label: 'Auto Loan',                  price: 15000.0 },
      { label: 'Personal Loan',              price: 8000.0 },
      { label: 'Credit Card (Minimum)',      price: 3000.0 },
      { label: 'Credit Card (Full)',         price: 15000.0 },
      { label: 'Student Loan',               price: 2000.0 },
      { label: 'Personal Debt',              price: 5000.0 },
      { label: 'Installment',                price: 2000.0 },
    ],
  },

  // ── EĞİTİM / Education ──────────────────────────────────────────────────
  'Eğitim': {
    TR: [
      { label: 'Özel Okul (Aylık)',      price: 35000.0 },
      { label: 'Kreş/Anaokulu',          price: 15000.0 },
      { label: 'Üniversite Harç',        price: 5000.0 },
      { label: 'Yüksek Lisans/Doktora',  price: 15000.0 },
      { label: 'Dil Kursu',              price: 8000.0 },
      { label: 'Etüt/Dershane',          price: 8000.0 },
      { label: 'Özel Ders',              price: 3000.0 },
      { label: 'Online Kurs (Udemy vb.)',price: 500.0 },
      { label: 'Sertifika Programı',     price: 5000.0 },
      { label: 'Okul Servisi',           price: 4000.0 },
      { label: 'Yurt/Pansiyon',          price: 8000.0 },
      { label: 'Müzik/Sanat Dersi',      price: 2000.0 },
      { label: 'Spor Kursu',             price: 1500.0 },
      { label: 'Hobi Kursu',             price: 2000.0 },
      { label: 'Kitap/Kırtasiye',        price: 500.0 },
    ],
    EN: [
      { label: 'Private School (Monthly)',    price: 35000.0 },
      { label: 'Daycare / Preschool',         price: 15000.0 },
      { label: 'University Tuition',          price: 5000.0 },
      { label: 'Graduate / PhD Program',      price: 15000.0 },
      { label: 'Language Course',             price: 8000.0 },
      { label: 'Tutoring / Prep School',      price: 8000.0 },
      { label: 'Private Lessons',             price: 3000.0 },
      { label: 'Online Course (Udemy etc.)',   price: 500.0 },
      { label: 'Certificate Program',         price: 5000.0 },
      { label: 'School Bus',                  price: 4000.0 },
      { label: 'Dormitory / Boarding',        price: 8000.0 },
      { label: 'Music / Art Classes',         price: 2000.0 },
      { label: 'Sports Classes',              price: 1500.0 },
      { label: 'Hobby Classes',               price: 2000.0 },
      { label: 'Books / Stationery',          price: 500.0 },
    ],
  },

  // ── PERSONEL / Staff ────────────────────────────────────────────────────
  'Personel': {
    TR: [
      { label: 'Şoför',                   price: 28000.0 },
      { label: 'Temizlikçi (Yarım Gün)',  price: 14000.0 },
      { label: 'Temizlikçi (Tam Gün)',    price: 28000.0 },
      { label: 'Bakıcı',                  price: 28000.0 },
      { label: 'Bahçıvan (Yarım Gün)',    price: 14000.0 },
      { label: 'Bahçıvan (Tam Gün)',      price: 28000.0 },
      { label: 'Eğitmen',                 price: 28000.0 },
      { label: 'Aşçı',                    price: 28000.0 },
      { label: 'Güvenlik',                price: 28000.0 },
      { label: 'Diğer Personel',          price: 28000.0 },
    ],
    EN: [
      { label: 'Driver',                      price: 28000.0 },
      { label: 'Housekeeper (Part-time)',      price: 14000.0 },
      { label: 'Housekeeper (Full-time)',      price: 28000.0 },
      { label: 'Caregiver',                    price: 28000.0 },
      { label: 'Gardener (Part-time)',         price: 14000.0 },
      { label: 'Gardener (Full-time)',         price: 28000.0 },
      { label: 'Tutor / Instructor',           price: 28000.0 },
      { label: 'Cook / Chef',                  price: 28000.0 },
      { label: 'Security Guard',               price: 28000.0 },
      { label: 'Other Staff',                  price: 28000.0 },
    ],
  },
};

// TR kategori adından PRESET_DATA anahtarına map (EN kategoriler için)
const KATEGORI_TR_KEY: Record<string, string> = {
  'Subscription': 'Abonelik',
  'Bill':         'Fatura',
  'Rent/HOA':     'Kira/Aidat',
  'Loan/Debt':    'Kredi/Borç',
  'Education':    'Eğitim',
  'Staff':        'Personel',
};

// ── Sabit listeler ────────────────────────────────────────────────────────────
const GELIR_KAYNAKLARI_TR = ['Maaş','Emekli Maaşı','SGK/SSK Maaşı','Freelance','Kira Geliri','Yatırım Geliri','Ek İş','Prim/Bonus','Diğer'];
const GELIR_KAYNAKLARI_EN = ['Salary','Pension','Social Security','Freelance','Rental Income','Investment','Side Job','Bonus/Premium','Other'];
const KATEGORILER_TR = ['Abonelik','Fatura','Kira/Aidat','Kredi/Borç','Eğitim','Personel','Yeme-İçme','Ulaşım','Alışveriş','Sağlık','Eğlence','Diğer'];
const KATEGORILER_EN = ['Subscription','Bill','Rent/HOA','Loan/Debt','Education','Staff','Food & Dining','Transport','Shopping','Health','Entertainment','Other'];
const CURRENCIES = ['TL', 'USD', 'EUR', 'GBP'];

// ── Yardımcı: kategori için preset listesi getir ───────────────────────────
function getPresets(kategori: string, lang: 'TR' | 'EN'): PresetItem[] {
  // EN ise TR anahtarına çevir
  const key = lang === 'EN' ? (KATEGORI_TR_KEY[kategori] ?? kategori) : kategori;
  return PRESET_DATA[key]?.[lang] ?? [];
}

// ── SubCategoryModal ──────────────────────────────────────────────────────────
interface SubCategoryModalProps {
  visible: boolean;
  items: PresetItem[];
  selected: string;
  lang: 'TR' | 'EN';
  onSelect: (item: PresetItem) => void;
  onClose: () => void;
}

function SubCategoryModal({ visible, items, selected, lang, onSelect, onClose }: SubCategoryModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose} />
      <View style={styles.modalSheet}>
        <View style={styles.modalHandle} />
        <Text style={styles.modalTitle}>
          {lang === 'TR' ? 'Alt Seçenek' : 'Select Option'}
        </Text>
        <FlatList
          data={items}
          keyExtractor={item => item.label}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.modalItem, selected === item.label && styles.modalItemActive]}
              onPress={() => { onSelect(item); onClose(); }}
            >
              <Text style={[styles.modalItemLabel, selected === item.label && styles.modalItemLabelActive]}>
                {item.label}
              </Text>
              <Text style={[styles.modalItemPrice, selected === item.label && styles.modalItemPriceActive]}>
                {item.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}₺
              </Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.modalSep} />}
          style={{ maxHeight: 420 }}
        />
        <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
          <Text style={styles.modalCloseBtnText}>
            {lang === 'TR' ? 'Manuel Giriş' : 'Enter Manually'}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ── Ana Ekran ─────────────────────────────────────────────────────────────────
export default function AddTransactionScreen() {
  const { t, lang } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { type, tx: editTx } = route.params || {};
  const isEdit = !!editTx;
  const tipBase: 'Gelir' | 'Gider' = type || (editTx?.tip) || 'Gelir';

  const { addTx, updateTx, exchangeRates } = useStore();

  // Form state
  const [tip, setTip]               = useState<'Gelir' | 'Gider'>(tipBase);
  const [kategori, setKategori]     = useState(editTx?.kategori || (tip === 'Gelir' ? (lang === 'TR' ? GELIR_KAYNAKLARI_TR[0] : GELIR_KAYNAKLARI_EN[0]) : (lang === 'TR' ? KATEGORILER_TR[0] : KATEGORILER_EN[0])));
  const [altSecim, setAltSecim]     = useState<string>('');
  const [detay, setDetay]           = useState(editTx?.detay || '');
  const [tutar, setTutar]           = useState(editTx ? String(editTx.tutar_orijinal) : '');
  const [paraBirimi, setParaBirimi] = useState(editTx?.para_birimi || 'TL');
  const [tarih, setTarih]           = useState(editTx?.tarih || new Date().toISOString().split('T')[0]);
  const [loading, setLoading]       = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const kategoriler = tip === 'Gelir'
    ? (lang === 'TR' ? GELIR_KAYNAKLARI_TR : GELIR_KAYNAKLARI_EN)
    : (lang === 'TR' ? KATEGORILER_TR : KATEGORILER_EN);

  // Aktif presetler
  const presets = tip === 'Gider' ? getPresets(kategori, lang as 'TR' | 'EN') : [];
  const hasPreset = presets.length > 0;

  // Kategori değişince alt seçimi sıfırla
  useEffect(() => {
    setAltSecim('');
  }, [kategori, tip]);

  const tutarSayi = parseFloat(tutar) || 0;
  const kur       = exchangeRates[paraBirimi] || 1;
  const tutarTL   = tutarSayi * kur;

  // Alt seçenek seçilince tutar ve detay otomatik doldur
  const handlePresetSelect = (item: PresetItem) => {
    setAltSecim(item.label);
    setTutar(String(item.price));
    setDetay(item.label);
  };

  // Kategori değişince tip toggle
  const handleKategoriChange = (k: string) => {
    setKategori(k);
  };

  const handleTipChange = (tp: 'Gelir' | 'Gider') => {
    setTip(tp);
    setKategori(tp === 'Gelir'
      ? (lang === 'TR' ? GELIR_KAYNAKLARI_TR[0] : GELIR_KAYNAKLARI_EN[0])
      : (lang === 'TR' ? KATEGORILER_TR[0] : KATEGORILER_EN[0]));
    setAltSecim('');
    setTutar('');
    setDetay('');
  };

  const handleSave = async () => {
    if (tutarSayi <= 0) {
      Alert.alert(t.error, lang === 'TR' ? 'Geçerli bir tutar girin.' : 'Enter a valid amount.');
      return;
    }
    const finalDetay = detay.trim() || altSecim || kategori;
    // EN modda seçilen kategori DB'ye her zaman TR olarak kaydedilir
    const kategoriDB = lang === 'EN' ? (KATEGORI_EN_TO_TR[kategori] || kategori) : kategori;
    setLoading(true);
    try {
      const data = {
        tarih, kategori: kategoriDB,
        detay: finalDetay,
        tutar: tutarTL,
        tutar_orijinal: tutarSayi,
        para_birimi: paraBirimi,
        tip,
        logo: undefined,
      };
      if (isEdit) {
        await updateTx(editTx.local_id || String(editTx.id), data);
      } else {
        await addTx(data);
      }
      navigation.goBack();
    } catch (err: any) {
      console.log('ADD TX ERROR FULL:', err);
      console.log('ADD TX ERROR MESSAGE:', err?.message);
      console.log('ADD TX ERROR RESPONSE:', err?.response?.data);
      console.log('ADD TX ERROR STATUS:', err?.response?.status);
      console.log('ADD TX ERROR STACK:', err?.stack);
      Alert.alert(
        t.error,
        err?.response?.data?.detail ||
        err?.message ||
        (lang === 'TR' ? 'İşlem kaydedilemedi.' : 'Could not save transaction.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Başlık */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backBtn}>← {t.cancel}</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {isEdit ? (lang === 'TR' ? '✏️ Düzenle' : '✏️ Edit') : (tip === 'Gelir' ? t.add_income : t.add_expense)}
            </Text>
          </View>

          {/* Tip toggle (sadece yeni kayıtta) */}
          {!isEdit && (
            <View style={styles.tipToggle}>
              {(['Gelir', 'Gider'] as const).map(tp => (
                <TouchableOpacity
                  key={tp}
                  style={[styles.tipBtn, tip === tp && (tp === 'Gelir' ? styles.tipIncome : styles.tipExpense)]}
                  onPress={() => handleTipChange(tp)}
                >
                  <Text style={[styles.tipBtnText, tip === tp && { color: '#fff', fontWeight: '800' }]}>
                    {tp === 'Gelir' ? '💰 ' + (lang === 'TR' ? 'Gelir' : 'Income') : '💸 ' + (lang === 'TR' ? 'Gider' : 'Expense')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Card>
            {/* Kategori */}
            <Text style={styles.fieldLabel}>{tip === 'Gelir' ? t.source : t.category}</Text>
            <View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {kategoriler.map(k => (
                  <TouchableOpacity
                    key={k}
                    style={[styles.chip, kategori === k && styles.chipActive]}
                    onPress={() => handleKategoriChange(k)}
                  >
                    <Text style={[styles.chipText, kategori === k && styles.chipTextActive]}>{k}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles.swipeHint}>
                {lang === 'TR' ? '← kaydır →' : '← swipe →'}
              </Text>
            </View>

            {/* Alt Seçenek (sadece preset olan gider kategorilerinde) */}
            {tip === 'Gider' && hasPreset && (
              <>
                <Divider />
                <Text style={styles.fieldLabel}>
                  {lang === 'TR' ? 'Alt Seçenek' : 'Sub-option'}
                </Text>
                <TouchableOpacity
                  style={styles.presetSelector}
                  onPress={() => setModalVisible(true)}
                  activeOpacity={0.75}
                >
                  <View style={styles.presetSelectorInner}>
                    <Text style={altSecim ? styles.presetSelectorValue : styles.presetSelectorPlaceholder}>
                      {altSecim || (lang === 'TR' ? `${kategori} seçin veya manuel girin...` : `Choose ${kategori} or enter manually...`)}
                    </Text>
                    {altSecim && (
                      <Text style={styles.presetSelectorPrice}>
                        {parseFloat(tutar).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}₺
                      </Text>
                    )}
                  </View>
                  <Text style={styles.presetSelectorArrow}>▼</Text>
                </TouchableOpacity>
                {altSecim !== '' && (
                  <TouchableOpacity
                    onPress={() => { setAltSecim(''); setTutar(''); setDetay(''); }}
                    style={styles.clearPreset}
                  >
                    <Text style={styles.clearPresetText}>
                      {lang === 'TR' ? '✕ Seçimi temizle' : '✕ Clear selection'}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            <Divider />

            {/* Tutar + Para Birimi */}
            <Text style={styles.fieldLabel}>{t.amount}</Text>
            <View style={styles.amountRow}>
              <View style={styles.currencyPicker}>
                {CURRENCIES.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.currBtn, paraBirimi === c && styles.currBtnActive]}
                    onPress={() => setParaBirimi(c)}
                  >
                    <Text style={[styles.currBtnText, paraBirimi === c && { color: Colors.primary, fontWeight: '700' }]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Input
                value={tutar}
                onChangeText={text => {
                  setTutar(text);
                  // Manuel tutar girince alt seçim label'ını koru ama fiyat bağını kopar
                }}
                placeholder="0"
                keyboardType="numeric"
                style={{ flex: 1, marginBottom: 0 }}
              />
            </View>
            {paraBirimi !== 'TL' && tutarSayi > 0 && (
              <Text style={styles.tlCaption}>
                ≈ {tutarTL.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}₺ (kur: {kur})
              </Text>
            )}

            <Divider />

            {/* Açıklama */}
            <Input
              label={t.description}
              value={detay}
              onChangeText={setDetay}
              placeholder={altSecim || kategori}
            />

            {/* Tarih */}
            <Input
              label={t.date}
              value={tarih}
              onChangeText={setTarih}
              placeholder="YYYY-MM-DD"
            />
          </Card>

          {/* Büyük tutar gösterge */}
          {tutarSayi > 0 && (
            <View style={[styles.amountPreview, { backgroundColor: tip === 'Gelir' ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)', borderWidth: 1, borderColor: tip === 'Gelir' ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)' }]}>
              <Text style={[styles.amountPreviewText, { color: tip === 'Gelir' ? Colors.success : Colors.danger }]}>
                {tip === 'Gelir' ? '+' : '-'}{tutarTL.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}₺
              </Text>
            </View>
          )}

          <Button
            title={isEdit ? t.save : (tip === 'Gelir' ? t.add_income : t.add_expense)}
            onPress={handleSave}
            loading={loading}
            fullWidth
          />

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Alt Seçenek Modal */}
      <SubCategoryModal
        visible={modalVisible}
        items={presets}
        selected={altSecim}
        lang={lang as 'TR' | 'EN'}
        onSelect={handlePresetSelect}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.bg },
  scroll:      { flex: 1, padding: Spacing.lg },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  backBtn:     { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  headerTitle: { ...Typography.h3 },

  // Tip toggle
  tipToggle:  { flexDirection: 'row', backgroundColor: Colors.bgElevated, borderRadius: Radius.lg, padding: 4, marginBottom: Spacing.md, gap: 4, borderWidth: 1, borderColor: Colors.border },
  tipBtn:     { flex: 1, paddingVertical: 12, borderRadius: Radius.md, alignItems: 'center' },
  tipIncome:  { backgroundColor: 'rgba(52,211,153,0.2)', borderWidth: 1, borderColor: Colors.success },
  tipExpense: { backgroundColor: 'rgba(248,113,113,0.2)', borderWidth: 1, borderColor: Colors.danger },
  tipBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  chipScroll: { marginBottom: 4 },
  swipeHint:  { fontSize: 10, color: Colors.textMuted, textAlign: 'center', marginBottom: Spacing.md, letterSpacing: 1 },
  scrollHintRight: { width: 0, height: 0 },
  scrollHintArrow: { width: 0, height: 0 },
  chip:       { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.bgElevated, marginRight: 8, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText:   { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  chipTextActive: { color: '#fff' },

  // Preset selector
  presetSelector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 6,
    backgroundColor: 'rgba(124,110,250,0.08)',
  },
  presetSelectorInner:       { flex: 1 },
  presetSelectorPlaceholder: { fontSize: 14, color: Colors.textMuted, fontStyle: 'italic' },
  presetSelectorValue:       { fontSize: 14, color: Colors.text, fontWeight: '700' },
  presetSelectorPrice:       { fontSize: 12, color: Colors.primary, fontWeight: '600', marginTop: 2 },
  presetSelectorArrow:       { fontSize: 12, color: Colors.primary, marginLeft: 8 },
  clearPreset:               { alignSelf: 'flex-start', marginBottom: Spacing.xs },
  clearPresetText:           { fontSize: 12, color: Colors.danger, fontWeight: '600' },

  // Tutar
  amountRow:      { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: Spacing.xs },
  currencyPicker: { flexDirection: 'column', gap: 4 },
  currBtn:        { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border },
  currBtnActive:  { backgroundColor: 'rgba(124,110,250,0.2)', borderColor: Colors.primary },
  currBtnText:    { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  tlCaption:      { fontSize: 12, color: Colors.primary, fontWeight: '600', marginBottom: Spacing.sm },
  amountPreview:  { borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.md },
  amountPreviewText: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },

  // Modal
  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12,
    borderTopWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, elevation: 16,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border,
    alignSelf: 'center', marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16, fontWeight: '800', color: Colors.text,
    marginBottom: 12, textAlign: 'center',
  },
  modalItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 4,
  },
  modalItemActive:       { backgroundColor: 'rgba(124,110,250,0.15)', borderRadius: 10, paddingHorizontal: 10, marginHorizontal: -6 },
  modalItemLabel:        { fontSize: 14, fontWeight: '600', color: Colors.text, flex: 1 },
  modalItemLabelActive:  { color: Colors.primary },
  modalItemPrice:        { fontSize: 14, fontWeight: '700', color: Colors.textMuted, marginLeft: 12 },
  modalItemPriceActive:  { color: Colors.primary },
  modalSep:              { height: 1, backgroundColor: Colors.border },
  modalCloseBtn: {
    marginTop: 16, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md, paddingVertical: 12, alignItems: 'center',
    backgroundColor: Colors.bgElevated,
  },
  modalCloseBtnText: { fontSize: 14, fontWeight: '700', color: Colors.textMuted },
});
