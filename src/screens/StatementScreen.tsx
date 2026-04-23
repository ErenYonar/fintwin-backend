// src/screens/StatementScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../store/useStore';
import RecentTransactionsWidget from '../components/RecentTransactionsWidget';
import AccountActionsWidget from '../components/AccountActionsWidget';
import { useColors, Colors, Radius, Spacing, Shadow } from '../utils/theme';
import { BASE_URL } from '../services/api';

// ── Tipler ────────────────────────────────────────────────────────────────────
interface ParsedRow {
  tarih: string;
  aciklama: string;
  tutar: number;
}

interface LocalStatement {
  id: string;
  dosya_adi: string;
  tarih: string;
  islemler: ParsedRow[];
}

const getStorageKey = (user: any) => `fintwin_statements_${user?.mail_hash || 'default'}`;

// ── Python'daki parse mantığının JS karşılığı ─────────────────────────────────
// Atlanacak anahtar kelimeler
const SKIP_KEYWORDS = [
  'TESEKKUR','TEŞEKKÜR','ODEME','ÖDEME','DEVIR','DEVİR',
  'KKDF','BSMV','TOPLAM','GENEL','IADE','İADE',
  'EKSTRE','HESAP OZETI','HESAP ÖZETİ','KART NO',
  'GECIKME','GECİKME','AZAMI','KREDILENDIRILEN','KREDİLENDİRİLEN',
  'FAIZ','FAİZ','LIMIT','LİMİT','DONEM BORCU','DÖNEM BORCU',
  'MINIMUM','MİNİMUM','BIR SONRAKI','BİR SONRAKİ',
  'BONUS','INDIRIM','İNDİRİM','KART NUMARASI',
  'SAYFA','IMAJ','ZARF','MUSTERI','MÜŞTERİ','KAMPANYA',
];

// TL tutarını float'a çevir: TL.1.312,66 → 1312.66
function parseTL(raw: string): number {
  try {
    let s = raw.replace('TL.', '').replace(',-', '').trim();
    s = s.replace(/^\.+|\.+$/g, '').replace(/^,+|,+$/g, '').trim();
    if (!s) return 0;
    if (s.includes(',')) {
      const lastComma = s.lastIndexOf(',');
      const intPart = s.substring(0, lastComma).replace(/\./g, '');
      let decPart = s.substring(lastComma + 1).substring(0, 2).padEnd(2, '0');
      if (!/^\d+$/.test(decPart)) decPart = '00';
      return parseFloat(intPart + '.' + decPart);
    } else {
      return parseFloat(s.replace(/\./g, ''));
    }
  } catch { return 0; }
}

// PDF metnini satır satır parse et — Python regex mantığı
function parsePdfText(text: string): ParsedRow[] {
  const tarihRe = /\b(\d{2}[/.]\d{2}[/.]\d{4})\b/;
  const tutarRe = /TL\.([\d][\d.]*(?:,[\d]{1,2})?(?:,-)?)/g;

  const rows: ParsedRow[] = [];
  const lines = text.split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Tarih içermeli
    const tarihMatch = tarihRe.exec(line);
    if (!tarihMatch) continue;

    const lineUpper = line.toUpperCase();

    // Negatif işlemleri atla (ödemeler)
    if (line.includes('-TL.')) continue;

    // Anahtar kelime filtresi
    if (SKIP_KEYWORDS.some(kw => lineUpper.includes(kw))) continue;

    // Tutarları bul
    const tutarMatches = [...line.matchAll(new RegExp(tutarRe.source, 'g'))];
    if (!tutarMatches.length) continue;

    let tutarVal = 0;
    for (const m of tutarMatches) {
      const v = parseTL(m[0]);
      if (v > 0 && v <= 99999.99) { tutarVal = v; break; }
    }
    if (!tutarVal) continue;

    // Açıklama: tarih ve tutarları temizle
    let acik = line
      .replace(tarihRe, '')
      .replace(new RegExp(tutarRe.source, 'g'), '')
      .replace(/^\d{2}\/\d{2}\s*/, '')
      .replace(/\s+/g, ' ')
      .replace(/\bTL\.\d[\d,.]*\b/g, '')
      .trim();

    if (acik.length < 2) acik = 'Ekstre İşlemi';

    rows.push({ tarih: tarihMatch[1], aciklama: acik, tutar: Math.round(tutarVal * 100) / 100 });
  }

  // Mükerrer kaldır
  const seen = new Map<string, number>();
  const final: ParsedRow[] = [];
  for (const r of rows) {
    const k = `${r.tarih}|${r.tutar}|${r.aciklama}`;
    const cnt = seen.get(k) || 0;
    const total = rows.filter(x => `${x.tarih}|${x.tutar}|${x.aciklama}` === k).length;
    if (cnt < total) { seen.set(k, cnt + 1); final.push(r); }
  }
  return final;
}

// ── Analiz fonksiyonları ──────────────────────────────────────────────────────
function getTop5(islemler: ParsedRow[]) {
  return [...islemler].filter(i => i.tutar > 0).sort((a, b) => b.tutar - a.tutar).slice(0, 5);
}

function getMostRepeated(islemler: ParsedRow[]) {
  const counts: Record<string, { count: number; toplam: number }> = {};
  islemler.forEach(i => {
    const key = i.aciklama.substring(0, 28).trim().toUpperCase();
    if (!counts[key]) counts[key] = { count: 0, toplam: 0 };
    counts[key].count += 1;
    counts[key].toplam += i.tutar;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([aciklama, data]) => ({ aciklama, ...data }));
}

const MEDALS = ['🥇', '🥈', '🥉', '4.', '5.'];

// ── Ana Ekran ─────────────────────────────────────────────────────────────────
export default function StatementScreen() {
  const Colors = useColors();
  const styles = make_styles(Colors);
  const lang  = useStore(s => s.lang);
  const token = useStore(s => s.token);
  const user  = useStore(s => s.user);
  const STORAGE_KEY = getStorageKey(user);
  const L = lang === 'TR';
  const [statements, setStatements] = useState<LocalStatement[]>([]);
  const [uploading, setUploading]   = useState(false);
  const [selected,  setSelected]    = useState<LocalStatement | null>(null);

  useEffect(() => { loadStatements(); }, [user]);

  const loadStatements = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setStatements(JSON.parse(raw));
    } catch { }
  };

  const saveStatements = async (data: LocalStatement[]) => {
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { }
  };

  const uploadPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf', copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets[0];
      setUploading(true);

      // Backend'e multipart/form-data olarak gönder — pdfplumber ile parse eder
      const formData = new FormData();
      formData.append('file', {
        uri:  file.uri,
        name: file.name,
        type: 'application/pdf',
      } as any);

      const response = await fetch(`${BASE_URL}/statements/upload`, {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        body:    formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.detail || `HTTP ${response.status}`);
      }

      const data = await response.json();

      // Backend: { id, dosya_isim, parsed_rows: [{tarih, aciklama, tutar}] }
      const parsed: ParsedRow[] = (data.parsed_rows || []).map((r: any) => ({
        tarih:    r.tarih    || '',
        aciklama: r.aciklama || '',
        tutar:    Number(r.tutar) || 0,
      }));

      if (parsed.length === 0) {
        Alert.alert(
          L ? 'Uyarı' : 'Warning',
          L ? 'Ekstrede işlem bulunamadı. Türk bankası ekstresi olduğundan emin olun.' : 'No transactions found. Make sure it is a Turkish bank statement.'
        );
        return;
      }

      const newStatement: LocalStatement = {
        id:        data.id ? String(data.id) : Date.now().toString(),
        dosya_adi: file.name,
        tarih:     new Date().toISOString().split('T')[0],
        islemler:  parsed,
      };

      const updated = [...statements, newStatement];
      setStatements(updated);
      await saveStatements(updated);

      Alert.alert(
        L ? '✅ Başarılı' : '✅ Success',
        L ? `${parsed.length} işlem bulundu.` : `${parsed.length} transactions found.`
      );
    } catch (e: any) {
      console.error('PDF upload error:', e);
      Alert.alert(
        L ? 'Hata' : 'Error',
        L ? `PDF yüklenemedi: ${e?.message || 'Bilinmeyen hata'}` : `Could not upload PDF: ${e?.message || 'Unknown error'}`
      );
    } finally { setUploading(false); }
  };

  const deleteStatement = (id: string) => {
    Alert.alert(
      L ? 'Sil' : 'Delete',
      L ? 'Bu ekstreyi silmek istiyor musunuz?' : 'Delete this statement?',
      [
        { text: L ? 'İptal' : 'Cancel', style: 'cancel' },
        {
          text: L ? 'Sil' : 'Delete', style: 'destructive',
          onPress: async () => {
            const updated = statements.filter(s => s.id !== id);
            setStatements(updated);
            await saveStatements(updated);
            if (selected?.id === id) setSelected(null);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* ── DARK HEADER ── */}
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>📊</Text>
          <Text style={styles.headerTitle}>
            {L ? 'Kredi Kartı Ekstresi' : 'Credit Card Statement'}
          </Text>
          <Text style={styles.headerSub}>
            {L ? 'PDF ekstrenizi yükleyin, otomatik analiz edin' : 'Upload your PDF statement and analyze automatically'}
          </Text>

          {statements.length > 0 && (
            <View style={styles.headerStatRow}>
              <View style={styles.headerStatBox}>
                <Text style={styles.headerStatValue}>{statements.length}</Text>
                <Text style={styles.headerStatLabel}>{L ? 'Ekstre' : 'Statement'}</Text>
              </View>
              <View style={styles.headerStatDivider} />
              <View style={styles.headerStatBox}>
                <Text style={styles.headerStatValue}>
                  {statements.reduce((s, x) => s + x.islemler.length, 0)}
                </Text>
                <Text style={styles.headerStatLabel}>{L ? 'İşlem' : 'Transaction'}</Text>
              </View>
              <View style={styles.headerStatDivider} />
              <View style={styles.headerStatBox}>
                <Text style={styles.headerStatValue}>
                  {statements
                    .reduce((s, x) => s + x.islemler.reduce((a, b) => a + b.tutar, 0), 0)
                    .toLocaleString('tr-TR', { maximumFractionDigits: 0 })}₺
                </Text>
                <Text style={styles.headerStatLabel}>{L ? 'Toplam' : 'Total'}</Text>
              </View>
            </View>
          )}
        </View>

        {/* ── UPLOAD BUTONU ── */}
        <TouchableOpacity style={styles.uploadBtn} onPress={uploadPDF} disabled={uploading}>
          {uploading
            ? <ActivityIndicator color="#fff" />
            : <>
                <Text style={styles.uploadIcon}>📎</Text>
                <Text style={styles.uploadText}>{L ? 'PDF Ekstre Yükle' : 'Upload PDF Statement'}</Text>
              </>
          }
        </TouchableOpacity>

        {/* ── EKSTRE LİSTESİ ── */}
        {statements.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📄</Text>
            <Text style={styles.emptyText}>{L ? 'Henüz ekstre yüklenmedi' : 'No statements uploaded yet'}</Text>
            <Text style={styles.emptyHint}>{L ? 'Yukarıdaki butona basarak başlayın' : 'Tap the button above to get started'}</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>{L ? 'Yüklenen Ekstreler' : 'Uploaded Statements'}</Text>
            {statements.map(s => {
              const toplamTutar = s.islemler.reduce((a, b) => a + b.tutar, 0);
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.statementCard, selected?.id === s.id && styles.statementCardActive]}
                  onPress={() => setSelected(selected?.id === s.id ? null : s)}
                  activeOpacity={0.8}
                >
                  <View style={styles.statementRow}>
                    <View style={styles.statementIconBox}>
                      <Text style={{ fontSize: 22 }}>🧾</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.statementName} numberOfLines={1}>{s.dosya_adi}</Text>
                      <Text style={styles.statementMeta}>
                        {s.tarih} · {s.islemler.length} {L ? 'işlem' : 'transactions'}
                      </Text>
                    </View>
                    <View style={styles.statementRight}>
                      <Text style={styles.statementAmount}>
                        {toplamTutar.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}₺
                      </Text>
                      <TouchableOpacity onPress={() => deleteStatement(s.id)}>
                        <Text style={{ fontSize: 16 }}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {selected?.id === s.id ? (
                    <View style={styles.selectedChip}>
                      <Text style={styles.selectedChipText}>
                        {L ? '▼ Analiz aşağıda gösteriliyor' : '▼ Analysis shown below'}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.tapHint}>
                      <Text style={styles.tapHintText}>
                        {L ? '👆 Analizi görmek için dokun' : '👆 Tap to see analysis'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {/* ── ANALİZ BÖLÜMÜ ── */}
        {selected && selected.islemler.length > 0 && (() => {
          const toplamTutar = selected.islemler.reduce((a, b) => a + b.tutar, 0);
          const ortalamaIslem = toplamTutar / selected.islemler.length;
          const top5    = getTop5(selected.islemler);
          const repeated = getMostRepeated(selected.islemler);

          return (
            <>
              {/* Özet Banner */}
              <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.summaryBanner}>
                <View style={styles.summaryBannerTop}>
                  <Text style={styles.summaryBannerEmoji}>🔍</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.summaryBannerTitle}>
                      {L ? 'Ekstre Analizi Hazır!' : 'Statement Analysis Ready!'}
                    </Text>
                    <Text style={styles.summaryBannerSub}>
                      {L
                        ? `${selected.islemler.length} işlem incelendi`
                        : `${selected.islemler.length} transactions analyzed`}
                    </Text>
                  </View>
                </View>

                <View style={styles.summaryTotalBox}>
                  <Text style={styles.summaryTotalLabel}>
                    {L ? 'TOPLAM HARCAMA' : 'TOTAL SPENDING'}
                  </Text>
                  <Text style={styles.summaryTotalValue}>
                    {toplamTutar.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}₺
                  </Text>
                  <Text style={styles.summaryTotalAvg}>
                    {L
                      ? `≈ ${ortalamaIslem.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}₺ / işlem ortalaması`
                      : `≈ ${ortalamaIslem.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}₺ avg per transaction`}
                  </Text>
                </View>

                <View style={styles.summaryBoxRow}>
                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryBoxIcon}>💸</Text>
                    <Text style={styles.summaryBoxTitle}>{L ? 'EN YÜKSEK İLK 5' : 'TOP 5 HIGHEST'}</Text>
                    <Text style={styles.summaryBoxDesc}>
                      {L ? 'Tek seferde en çok nereye para gittiğini gösterir.' : 'Where most money went at once.'}
                    </Text>
                  </View>
                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryBoxIcon}>🔁</Text>
                    <Text style={styles.summaryBoxTitle}>{L ? 'EN SIK TEKRAR EDEN' : 'MOST REPEATED'}</Text>
                    <Text style={styles.summaryBoxDesc}>
                      {L ? 'Alışkanlıklarınız burada gizli!' : 'Your habits are hidden here!'}
                    </Text>
                  </View>
                </View>
              </LinearGradient>

              {/* Analiz Kartları */}
              <View style={styles.analysisStack}>

                {/* Kart 1: En Yüksek İlk 5 */}
                <View style={styles.analysisCard}>
                  <View style={styles.analysisCardHeader}>
                    <Text style={styles.analysisCardIcon}>💸</Text>
                    <Text style={styles.analysisCardTitle}>
                      {L ? 'En Yüksek Tutarlı İlk 5' : 'Top 5 Highest Amounts'}
                    </Text>
                  </View>
                  {top5.map((item, i) => (
                    <View key={i} style={styles.listRow}>
                      <Text style={styles.medal}>{MEDALS[i]}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.listDesc} numberOfLines={2}>{item.aciklama}</Text>
                        <Text style={styles.listDate}>{item.tarih}</Text>
                      </View>
                      <Text style={styles.listAmount}>
                        {item.tutar.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}₺
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Kart 2: En Sık Tekrar Eden İlk 5 */}
                <View style={styles.analysisCard}>
                  <View style={styles.analysisCardHeader}>
                    <Text style={styles.analysisCardIcon}>🔁</Text>
                    <Text style={styles.analysisCardTitle}>
                      {L ? 'En Sık Tekrar Eden İlk 5' : 'Top 5 Most Repeated'}
                    </Text>
                  </View>
                  {repeated.map((item, i) => (
                    <View key={i} style={styles.listRow}>
                      <Text style={styles.medal}>{MEDALS[i]}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.listDesc} numberOfLines={2}>{item.aciklama}</Text>
                        <Text style={styles.listDate}>
                          {item.count} {L ? 'kez · ' : 'times · '}
                          {item.toplam.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}₺ {L ? 'toplam' : 'total'}
                        </Text>
                      </View>
                      <View style={styles.repeatBadge}>
                        <Text style={styles.repeatText}>×{item.count}</Text>
                      </View>
                    </View>
                  ))}
                </View>

              </View>
            </>
          );
        })()}

        {/* ── WİDGETLAR ── */}
        <View style={{ paddingHorizontal: 16 }}>
          <RecentTransactionsWidget lang={lang} />
          <AccountActionsWidget lang={lang} />
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const make_styles = (C: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  header: { paddingTop: 20, paddingBottom: 24, paddingHorizontal: 24, backgroundColor: C.bg },
  headerCircle1: { width: 0, height: 0 },
  headerCircle2: { width: 0, height: 0 },
  headerEmoji:   { fontSize: 32, marginBottom: 8 },
  headerTitle:   { fontSize: 24, fontWeight: '900', color: C.text, letterSpacing: -0.5 },
  headerSub:     { fontSize: 13, color: C.textMuted, marginTop: 4, marginBottom: 18 },
  headerStatRow: { flexDirection: 'row', backgroundColor: C.bgElevated, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  headerStatBox:     { flex: 1, alignItems: 'center' },
  headerStatValue:   { fontSize: 18, fontWeight: '900', color: C.text },
  headerStatLabel:   { fontSize: 11, color: C.textMuted, marginTop: 2, fontWeight: '600' },
  headerStatDivider: { width: 1, height: 32, backgroundColor: C.border },

  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.primary, borderRadius: 16, padding: 16, margin: 16,
    shadowColor: C.primary, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  uploadIcon: { fontSize: 18 },
  uploadText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  emptyBox:  { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '700', color: C.textMuted, marginBottom: 6 },
  emptyHint: { fontSize: 13, color: C.textLight, textAlign: 'center' },

  sectionTitle: { fontSize: 15, fontWeight: '800', color: C.text, marginBottom: 10, paddingHorizontal: 16, letterSpacing: 0.2 },

  statementCard: { backgroundColor: C.bgCard, borderRadius: 16, padding: 14, marginBottom: 10, marginHorizontal: 16, borderWidth: 2, borderColor: C.border, ...Shadow.sm },
  statementCardActive: { borderColor: C.primary, backgroundColor: C.bgElevated },
  statementRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statementIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(124,110,250,0.15)', alignItems: 'center', justifyContent: 'center' },
  statementName:   { fontSize: 14, fontWeight: '700', color: C.text },
  statementMeta:   { fontSize: 12, color: C.textMuted, marginTop: 3 },
  statementRight:  { alignItems: 'flex-end', gap: 6 },
  statementAmount: { fontSize: 15, fontWeight: '900', color: C.primary },
  selectedChip:    { marginTop: 10, backgroundColor: 'rgba(124,110,250,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(124,110,250,0.3)' },
  selectedChipText:{ fontSize: 11, color: C.primary, fontWeight: '700' },
  tapHint:         { marginTop: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start', borderWidth: 1, borderColor: C.border },
  tapHintText:     { fontSize: 11, color: C.textMuted, fontWeight: '600' },

  summaryBanner:     { margin: 16, borderRadius: 20, padding: 20, overflow: 'hidden' },
  summaryBannerTop:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  summaryBannerEmoji:{ fontSize: 32 },
  summaryBannerTitle:{ fontSize: 18, fontWeight: '900', color: '#fff' },
  summaryBannerSub:  { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  summaryTotalBox:   { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 16, marginBottom: 14, alignItems: 'center' },
  summaryTotalLabel: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '700', letterSpacing: 0.5 },
  summaryTotalValue: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -1, marginVertical: 4 },
  summaryTotalAvg:   { fontSize: 11, color: 'rgba(255,255,255,0.65)' },
  summaryBoxRow:     { flexDirection: 'row', gap: 10 },
  summaryBox:        { flex: 1, backgroundColor: 'rgba(255,255,255,0.13)', borderRadius: 12, padding: 12 },
  summaryBoxIcon:    { fontSize: 20, marginBottom: 6 },
  summaryBoxTitle:   { fontSize: 11, fontWeight: '900', color: '#fff', marginBottom: 4, letterSpacing: 0.3 },
  summaryBoxDesc:    { fontSize: 11, color: 'rgba(255,255,255,0.8)', lineHeight: 15 },

  analysisStack: { marginHorizontal: 16, marginBottom: 16, gap: 12 },
  analysisCard:  { backgroundColor: C.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, ...Shadow.sm },
  analysisCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  analysisCardIcon:   { fontSize: 16 },
  analysisCardTitle:  { fontSize: 13, fontWeight: '900', color: C.text, flex: 1, letterSpacing: 0.2 },

  listRow:    { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border, gap: 6 },
  medal:      { fontSize: 16, marginTop: 1, minWidth: 26 },
  listDesc:   { fontSize: 12, fontWeight: '600', color: C.text, lineHeight: 16 },
  listDate:   { fontSize: 10, color: C.textMuted, marginTop: 2 },
  listAmount: { fontSize: 13, fontWeight: '800', color: C.danger },
  repeatBadge:{ backgroundColor: 'rgba(52,211,153,0.15)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, minWidth: 36, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(52,211,153,0.3)' },
  repeatText: { fontSize: 12, fontWeight: '900', color: C.success },
});
