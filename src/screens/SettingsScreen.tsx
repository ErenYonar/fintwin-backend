// src/screens/SettingsScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, TextInput, LayoutAnimation,
  UIManager, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../store/useStore';
import { Card, Divider, SectionHeader } from '../components/UI';
import RecentTransactionsWidget from '../components/RecentTransactionsWidget';
import AccountActionsWidget from '../components/AccountActionsWidget';
import { Colors, Spacing, Radius, Shadow } from '../utils/theme';
import { useTranslation } from '../hooks/useTranslation';
import { formatRateTimestamp } from '../services/exchangeService';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

// ── Döviz kur renkleri ────────────────────────────────────────────────────────
const RATE_CONFIG = {
  USD: { flag: '🇺🇸', nameTR: 'Amerikan Doları',  nameEN: 'US Dollar',      colors: ['#1E1B4B', '#2D2A6E'] as [string,string] },
  EUR: { flag: '🇪🇺', nameTR: 'Euro',              nameEN: 'Euro',           colors: ['#064E3B', '#065F46'] as [string,string] },
  GBP: { flag: '🇬🇧', nameTR: 'İngiliz Sterlini', nameEN: 'British Pound',  colors: ['#451A03', '#78350F'] as [string,string] },
} as const;

// ── Fiyat listeleri (AddTransactionScreen ile aynı veri) ─────────────────────
const PRICE_LISTS_TR = [
  {
    key: 'abonelik', icon: '📺', label: 'Abonelik Fiyatları',
    items: [
      { name: 'Netflix (Temel)',              price: 99.99 },
      { name: 'Netflix (Standart)',           price: 199.99 },
      { name: 'Netflix (Premium)',            price: 349.99 },
      { name: 'Spotify (Bireysel)',           price: 59.99 },
      { name: 'Spotify (Duo)',                price: 79.99 },
      { name: 'Spotify (Aile)',               price: 99.99 },
      { name: 'YouTube Premium (Bireysel)',   price: 79.99 },
      { name: 'YouTube Premium (Aile)',       price: 149.99 },
      { name: 'Disney+ (Standart)',           price: 134.99 },
      { name: 'Disney+ (Premium)',            price: 269.99 },
      { name: 'Amazon Prime',                 price: 39.00 },
      { name: 'BluTV (Standart)',             price: 109.90 },
      { name: 'BluTV (Süper)',                price: 219.90 },
      { name: 'Exxen',                        price: 119.90 },
      { name: 'Exxen + Spor',                 price: 399.90 },
      { name: 'beIN Connect',                 price: 449.00 },
      { name: 'S Sport Plus',                 price: 274.90 },
      { name: 'Apple TV+',                    price: 64.99 },
      { name: 'Apple Music (Bireysel)',       price: 34.99 },
      { name: 'iCloud+ (50GB)',               price: 12.99 },
      { name: 'iCloud+ (200GB)',              price: 39.99 },
      { name: 'iCloud+ (2TB)',                price: 129.99 },
      { name: 'ChatGPT Plus',                 price: 769.00 },
      { name: 'Claude Pro',                   price: 769.00 },
      { name: 'Microsoft 365 (Kişisel)',      price: 104.99 },
      { name: 'LinkedIn Premium',             price: 1199.00 },
      { name: 'PlayStation Plus (Essential)', price: 239.00 },
      { name: 'Xbox Game Pass Ultimate',      price: 449.00 },
      { name: 'MacFit',                       price: 1990.00 },
      { name: 'Fitpass',                      price: 999.00 },
    ],
  },
  {
    key: 'fatura', icon: '📄', label: 'Faturalar',
    items: [
      { name: 'Elektrik',         price: 800.0 },
      { name: 'Su',               price: 350.0 },
      { name: 'Doğalgaz',         price: 1500.0 },
      { name: 'İnternet',         price: 500.0 },
      { name: 'Cep Telefonu',     price: 400.0 },
      { name: 'Kasko',            price: 2500.0 },
      { name: 'Trafik Sigortası', price: 400.0 },
      { name: 'Sağlık Sigortası', price: 3500.0 },
      { name: 'DASK',             price: 150.0 },
    ],
  },
  {
    key: 'kira', icon: '🏠', label: 'Kira/Aidat',
    items: [
      { name: 'Kira',              price: 25000.0 },
      { name: 'Aidat',             price: 2500.0 },
      { name: 'Site Aidatı',       price: 3000.0 },
      { name: 'Apartman Aidatı',   price: 1500.0 },
      { name: 'İşyeri Kirası',     price: 50000.0 },
      { name: 'Depo/Garaj Kirası', price: 5000.0 },
    ],
  },
  {
    key: 'kredi', icon: '🏦', label: 'Kredi/Borç',
    items: [
      { name: 'Konut Kredisi',         price: 25000.0 },
      { name: 'Araç Kredisi',          price: 15000.0 },
      { name: 'İhtiyaç Kredisi',       price: 8000.0 },
      { name: 'Kredi Kartı (Asgari)',  price: 3000.0 },
      { name: 'Kredi Kartı (Tam)',     price: 15000.0 },
      { name: 'Öğrenim Kredisi (KYK)', price: 2000.0 },
      { name: 'Taksit',                price: 2000.0 },
    ],
  },
  {
    key: 'personel', icon: '👤', label: 'Personel Fiyatları',
    items: [
      { name: 'Şoför',                  price: 28000.0 },
      { name: 'Temizlikçi (Yarım Gün)', price: 14000.0 },
      { name: 'Temizlikçi (Tam Gün)',   price: 28000.0 },
      { name: 'Bakıcı',                 price: 28000.0 },
      { name: 'Bahçıvan (Yarım Gün)',   price: 14000.0 },
      { name: 'Aşçı',                   price: 28000.0 },
      { name: 'Güvenlik',               price: 28000.0 },
    ],
  },
  {
    key: 'egitim', icon: '📚', label: 'Eğitim Fiyatları',
    items: [
      { name: 'Özel Okul (Aylık)',       price: 35000.0 },
      { name: 'Kreş/Anaokulu',           price: 15000.0 },
      { name: 'Üniversite Harç',         price: 5000.0 },
      { name: 'Yüksek Lisans/Doktora',   price: 15000.0 },
      { name: 'Dil Kursu',               price: 8000.0 },
      { name: 'Etüt/Dershane',           price: 8000.0 },
      { name: 'Özel Ders',               price: 3000.0 },
      { name: 'Online Kurs (Udemy vb.)', price: 500.0 },
      { name: 'Sertifika Programı',      price: 5000.0 },
      { name: 'Okul Servisi',            price: 4000.0 },
      { name: 'Yurt/Pansiyon',           price: 8000.0 },
    ],
  },
];

const PRICE_LISTS_EN = [
  {
    key: 'abonelik', icon: '📺', label: 'Subscription Prices',
    items: [
      { name: 'Netflix (Basic)',              price: 99.99 },
      { name: 'Netflix (Standard)',           price: 199.99 },
      { name: 'Netflix (Premium)',            price: 349.99 },
      { name: 'Spotify (Individual)',         price: 59.99 },
      { name: 'Spotify (Family)',             price: 99.99 },
      { name: 'YouTube Premium (Individual)', price: 79.99 },
      { name: 'Disney+ (Standard)',           price: 134.99 },
      { name: 'Amazon Prime',                 price: 39.00 },
      { name: 'Apple TV+',                    price: 64.99 },
      { name: 'ChatGPT Plus',                 price: 769.00 },
      { name: 'Microsoft 365 (Personal)',     price: 104.99 },
      { name: 'LinkedIn Premium',             price: 1199.00 },
      { name: 'PlayStation Plus (Essential)', price: 239.00 },
      { name: 'Xbox Game Pass Ultimate',      price: 449.00 },
    ],
  },
  {
    key: 'fatura', icon: '📄', label: 'Bills',
    items: [
      { name: 'Electricity',                   price: 800.0 },
      { name: 'Water',                         price: 350.0 },
      { name: 'Natural Gas',                   price: 1500.0 },
      { name: 'Internet',                      price: 500.0 },
      { name: 'Mobile Phone',                  price: 400.0 },
      { name: 'Car Insurance (Comprehensive)', price: 2500.0 },
      { name: 'Health Insurance',              price: 3500.0 },
    ],
  },
  {
    key: 'kira', icon: '🏠', label: 'Rent/HOA',
    items: [
      { name: 'Rent',                  price: 25000.0 },
      { name: 'HOA Fee',               price: 2500.0 },
      { name: 'Commercial Rent',       price: 50000.0 },
      { name: 'Storage / Garage Rent', price: 5000.0 },
    ],
  },
  {
    key: 'kredi', icon: '🏦', label: 'Loan/Debt',
    items: [
      { name: 'Mortgage',              price: 25000.0 },
      { name: 'Auto Loan',             price: 15000.0 },
      { name: 'Personal Loan',         price: 8000.0 },
      { name: 'Credit Card (Minimum)', price: 3000.0 },
      { name: 'Student Loan',          price: 2000.0 },
    ],
  },
  {
    key: 'personel', icon: '👤', label: 'Staff Prices',
    items: [
      { name: 'Driver',                     price: 28000.0 },
      { name: 'Housekeeper (Part-time)',     price: 14000.0 },
      { name: 'Housekeeper (Full-time)',     price: 28000.0 },
      { name: 'Caregiver',                  price: 28000.0 },
      { name: 'Cook / Chef',                price: 28000.0 },
    ],
  },
  {
    key: 'egitim', icon: '📚', label: 'Education Prices',
    items: [
      { name: 'Private School (Monthly)', price: 35000.0 },
      { name: 'Daycare / Preschool',      price: 15000.0 },
      { name: 'University Tuition',       price: 5000.0 },
      { name: 'Language Course',          price: 8000.0 },
      { name: 'Online Course (Udemy)',    price: 500.0 },
      { name: 'Dormitory / Boarding',     price: 8000.0 },
    ],
  },
];

// ── Genişletilebilir Fiyat Listesi Bileşeni ───────────────────────────────────
function PriceListSection({ lang }: { lang: string }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const lists = lang === 'TR' ? PRICE_LISTS_TR : PRICE_LISTS_EN;
  const L = lang === 'TR';

  const toggle = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenKey(prev => prev === key ? null : key);
  };

  return (
    <View style={plStyles.container}>
      <Text style={plStyles.sectionTitle}>
        {L ? '📋 Fiyat Listeleri' : '📋 Price Lists'}
      </Text>
      <Text style={plStyles.sectionHint}>
        {L
          ? 'Gider eklerken otomatik uygulanan referans fiyatlar'
          : 'Reference prices auto-applied when adding expenses'}
      </Text>

      {lists.map(list => (
        <View key={list.key} style={plStyles.group}>
          <TouchableOpacity
            style={plStyles.groupHeader}
            onPress={() => toggle(list.key)}
            activeOpacity={0.8}
          >
            <View style={plStyles.groupLeft}>
              <Text style={plStyles.groupIcon}>{list.icon}</Text>
              <Text style={plStyles.groupLabel}>{list.label}</Text>
              <View style={plStyles.countBadge}>
                <Text style={plStyles.countBadgeText}>{list.items.length}</Text>
              </View>
            </View>
            <Text style={[plStyles.arrow, openKey === list.key && plStyles.arrowOpen]}>›</Text>
          </TouchableOpacity>

          {openKey === list.key && (
            <View style={plStyles.itemList}>
              {list.items.map((item, i) => (
                <View
                  key={i}
                  style={[plStyles.item, i === list.items.length - 1 && { borderBottomWidth: 0 }]}
                >
                  <Text style={plStyles.itemName}>{item.name}</Text>
                  <Text style={plStyles.itemPrice}>
                    {item.price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}₺
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

// ── Feedback Bileşeni ─────────────────────────────────────────────────────────
function FeedbackSection({ lang, onSend }: { lang: string; onSend: (msg: string) => Promise<void> }) {
  const [text, setText]       = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);
  const L = lang === 'TR';

  const handleSend = async () => {
    if (!text.trim()) {
      Alert.alert(L ? 'Boş Mesaj' : 'Empty Message', L ? 'Lütfen bir şeyler yazın.' : 'Please write something.');
      return;
    }
    setSending(true);
    try {
      await onSend(text.trim());
      setText('');
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch {
      Alert.alert(L ? 'Hata' : 'Error', L ? 'Gönderilemedi.' : 'Could not send.');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={fbStyles.container}>
      <Text style={fbStyles.title}>
        {L ? '💬 Öneri & Geri Bildirim' : '💬 Feedback & Suggestions'}
      </Text>
      <Text style={fbStyles.hint}>
        {L
          ? 'Görüş ve önerileriniz uygulamayı geliştirmemize yardımcı olur.'
          : 'Your feedback helps us improve the app.'}
      </Text>

      <TextInput
        style={fbStyles.input}
        value={text}
        onChangeText={setText}
        placeholder={L
          ? 'Öneri, şikayet veya isteklerinizi yazın...'
          : 'Write your suggestion, complaint or request...'}
        placeholderTextColor={Colors.textLight}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        editable={!sending}
      />

      {sent ? (
        <View style={fbStyles.sentBox}>
          <Text style={fbStyles.sentText}>
            ✅ {L ? 'Gönderildi! Teşekkürler.' : 'Sent! Thank you.'}
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[fbStyles.sendBtn, sending && { opacity: 0.7 }]}
          onPress={handleSend}
          disabled={sending}
          activeOpacity={0.8}
        >
          {sending
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={fbStyles.sendBtnText}>
                {L ? '📤 Gönder' : '📤 Send'}
              </Text>
          }
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Ana Ekran ─────────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const { lang } = useTranslation();
  const { exchangeRates, ratesMeta, setLang, loadExchangeRates, sendFeedback } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const L = lang === 'TR';

  const handleRefreshRates = async () => {
    setRefreshing(true);
    try {
      await loadExchangeRates(true);
      Alert.alert(
        L ? '✅ Güncellendi' : '✅ Updated',
        `${L ? 'Kaynak: ' : 'Source: '}${ratesMeta?.source || 'TCMB'}`
      );
    } catch {
      Alert.alert(L ? 'Hata' : 'Error', L ? 'Kurlar güncellenemedi.' : 'Could not update rates.');
    } finally {
      setRefreshing(false);
    }
  };

  const isFallback = ratesMeta?.source === 'fallback';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.pageTitle}>{L ? '⚙️ Ayarlar' : '⚙️ Settings'}</Text>

        {/* ── Dil ── */}
        <Card>
          <SectionHeader title={L ? '🌐 Dil / Language' : '🌐 Language'} />
          <View style={styles.langRow}>
            {(['TR', 'EN'] as const).map(l => (
              <TouchableOpacity
                key={l}
                style={[styles.langBtn, lang === l && styles.langBtnActive]}
                onPress={() => setLang(l)}
                activeOpacity={0.8}
              >
                <Text style={styles.langBtnFlag}>{l === 'TR' ? '🇹🇷' : '🇬🇧'}</Text>
                <Text style={[styles.langBtnText, lang === l && styles.langBtnTextActive]}>
                  {l === 'TR' ? 'Türkçe' : 'English'}
                </Text>
                {lang === l && <Text style={styles.langBtnCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* ── Döviz Kurları ── */}
        <View style={styles.ratesCard}>
          <View style={styles.ratesHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.ratesTitle}>{L ? '💱 Döviz Kurları' : '💱 Exchange Rates'}</Text>
              <Text style={[styles.ratesSubtitle, isFallback && { color: Colors.warning }]}>
                {isFallback
                  ? (L ? '⚠️ Tahmini değerler (internet yok)' : '⚠️ Estimated (no internet)')
                  : ratesMeta?.lastUpdated
                    ? (L ? 'Güncellendi: ' : 'Updated: ') + formatRateTimestamp(ratesMeta.lastUpdated, lang as 'TR'|'EN')
                    : (L ? 'Yükleniyor...' : 'Loading...')
                }
              </Text>
              {ratesMeta?.source && !isFallback && (
                <Text style={styles.ratesSource}>{L ? 'Kaynak: ' : 'Source: '}{ratesMeta.source}</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={handleRefreshRates}
              disabled={refreshing}
              activeOpacity={0.75}
            >
              {refreshing
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.refreshBtnText}>{L ? '🔄 Güncelle' : '🔄 Refresh'}</Text>
              }
            </TouchableOpacity>
          </View>

          <Divider />

          <View style={styles.rateCardsRow}>
            {(Object.keys(RATE_CONFIG) as Array<keyof typeof RATE_CONFIG>).map(cur => {
              const cfg   = RATE_CONFIG[cur];
              const value = exchangeRates[cur];
              return (
                <LinearGradient key={cur} colors={cfg.colors} style={styles.rateCard}>
                  <Text style={styles.rateFlag}>{cfg.flag}</Text>
                  <Text style={styles.rateCur}>{cur}</Text>
                  <Text style={styles.rateCurName} numberOfLines={2}>
                    {L ? cfg.nameTR : cfg.nameEN}
                  </Text>
                  <View style={styles.rateValueRow}>
                    <Text style={styles.rateValue}>
                      {value
                        ? value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : '—'}
                    </Text>
                    <Text style={styles.rateTLLabel}>₺</Text>
                  </View>
                  <Text style={styles.ratePerLabel}>1 {cur} =</Text>
                </LinearGradient>
              );
            })}
          </View>

          <View style={styles.converterHint}>
            <Text style={styles.converterHintText}>
              {L
                ? 'İşlem eklerken yabancı para birimi seçersen kur otomatik uygulanır.'
                : 'When adding a transaction in foreign currency, the rate is applied automatically.'}
            </Text>
          </View>
        </View>

        {/* ── Fiyat Listeleri ── */}
        <PriceListSection lang={lang} />

        {/* ── Geri Bildirim ── */}
        <FeedbackSection lang={lang} onSend={sendFeedback} />

        <RecentTransactionsWidget lang={lang} />
        <AccountActionsWidget lang={lang} />
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Ana Stiller ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.bg },
  scroll:    { flex: 1, padding: Spacing.lg },
  pageTitle: { fontSize: 24, fontWeight: '900', color: Colors.text, marginBottom: Spacing.lg },

  langRow:           { flexDirection: 'row', gap: Spacing.sm },
  langBtn:           { flex: 1, paddingVertical: 14, borderRadius: Radius.md, backgroundColor: Colors.bgElevated, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  langBtnActive:     { backgroundColor: Colors.primary },
  langBtnFlag:       { fontSize: 18 },
  langBtnText:       { fontSize: 14, fontWeight: '700', color: Colors.textMuted },
  langBtnTextActive: { color: '#fff' },
  langBtnCheck:      { fontSize: 14, color: '#fff', fontWeight: '900' },

  ratesCard:      { backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.sm, ...Shadow.sm },
  ratesHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  ratesTitle:     { fontSize: 16, fontWeight: '800', color: Colors.text },
  ratesSubtitle:  { fontSize: 11, color: Colors.textMuted, marginTop: 3 },
  ratesSource:    { fontSize: 10, color: Colors.textLight, marginTop: 1 },
  refreshBtn:     { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 10, ...Shadow.md },
  refreshBtnText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  rateCardsRow:   { flexDirection: 'row', gap: 8, marginBottom: Spacing.md },
  rateCard:       { flex: 1, borderRadius: Radius.lg, padding: 12, alignItems: 'center' },
  rateFlag:       { fontSize: 22, marginBottom: 4 },
  rateCur:        { fontSize: 14, fontWeight: '900', color: '#fff' },
  rateCurName:    { fontSize: 9, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 6, lineHeight: 12 },
  rateValueRow:   { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  rateValue:      { fontSize: 18, fontWeight: '900', color: '#fff' },
  rateTLLabel:    { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '700', marginBottom: 2 },
  ratePerLabel:   { fontSize: 9, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  converterHint:     { backgroundColor: 'rgba(124,110,250,0.1)', borderRadius: Radius.md, padding: Spacing.sm, borderWidth: 1, borderColor: 'rgba(124,110,250,0.2)' },
  converterHintText: { fontSize: 11, color: Colors.primary, fontWeight: '600', lineHeight: 16 },
});

// ── Fiyat Listesi Stilleri ────────────────────────────────────────────────────
const plStyles = StyleSheet.create({
  container:    { backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.sm, ...Shadow.sm },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  sectionHint:  { fontSize: 11, color: Colors.textMuted, marginBottom: Spacing.md, lineHeight: 16 },
  group:        { borderRadius: Radius.lg, overflow: 'hidden', marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  groupHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, backgroundColor: Colors.bgElevated },
  groupLeft:    { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  groupIcon:    { fontSize: 20 },
  groupLabel:   { fontSize: 14, fontWeight: '700', color: Colors.text },
  countBadge:   { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  countBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  arrow:        { fontSize: 20, color: Colors.textMuted, fontWeight: '700', transform: [{ rotate: '0deg' }] },
  arrowOpen:    { transform: [{ rotate: '90deg' }] },
  itemList:     { backgroundColor: Colors.bgCard },
  item:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  itemName:     { fontSize: 13, color: Colors.text, fontWeight: '500', flex: 1 },
  itemPrice:    { fontSize: 13, fontWeight: '800', color: Colors.primary },
});

// ── Feedback Stilleri ─────────────────────────────────────────────────────────
const fbStyles = StyleSheet.create({
  container: { backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.sm, ...Shadow.sm },
  title:     { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  hint:      { fontSize: 11, color: Colors.textMuted, marginBottom: Spacing.md, lineHeight: 16 },
  input:     {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.lg,
    padding: Spacing.md, fontSize: 14, color: Colors.text,
    minHeight: 100, backgroundColor: Colors.bgInput, marginBottom: Spacing.md,
  },
  sendBtn:     { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center', ...Shadow.md },
  sendBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  sentBox:     { backgroundColor: 'rgba(52,211,153,0.15)', borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(52,211,153,0.3)' },
  sentText:    { fontSize: 14, fontWeight: '800', color: Colors.success },
});
