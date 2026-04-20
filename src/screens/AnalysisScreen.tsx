// src/screens/AnalysisScreen.tsx
import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Dimensions, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { G, Path, Circle, Rect, Text as SvgText, Line } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../store/useStore';
import { Card, SectionHeader, EmptyState } from '../components/UI';
import RecentTransactionsWidget from '../components/RecentTransactionsWidget';
import AccountActionsWidget from '../components/AccountActionsWidget';
import { useColors, Colors, Spacing, Radius, Shadow } from '../utils/theme';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigation } from '@react-navigation/native';

const SCREEN_W   = Dimensions.get('window').width;
const CHART_W    = SCREEN_W - Spacing.lg * 2 - Spacing.lg * 2; // full card width
const CAT_COLORS = [
  '#6366F1','#10B981','#EF4444','#F59E0B',
  '#8B5CF6','#06B6D4','#EC4899','#84CC16',
  '#F97316','#64748B','#14B8A6','#A855F7',
];

const CAT_ICONS: Record<string, string> = {
  'Abonelik':'📺','Fatura':'📄','Kira/Aidat':'🏠','Kredi/Borç':'🏦',
  'Eğitim':'📚','Personel':'👤','Yeme-İçme':'🍽️','Ulaşım':'🚗',
  'Alışveriş':'🛍️','Sağlık':'💊','Eğlence':'🎮','Diğer':'📌',
  'Subscription':'📺','Bill':'📄','Rent/HOA':'🏠','Loan/Debt':'🏦',
  'Education':'📚','Staff':'👤','Food & Dining':'🍽️','Transport':'🚗',
  'Shopping':'🛍️','Health':'💊','Entertainment':'🎮','Other':'📌',
};

// ── Yardımcı: pasta dilimi path hesapla ──────────────────────────────────────
function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, start: number, end: number): string {
  const s   = polarToCartesian(cx, cy, r, start);
  const e   = polarToCartesian(cx, cy, r, end);
  const big = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${big} 1 ${e.x} ${e.y} Z`;
}

// ── Pasta Grafik ─────────────────────────────────────────────────────────────
interface PieItem { label: string; value: number; color: string; pct: number }

function DonutChart({ items, total }: { items: PieItem[]; total: number }) {
  const Colors = useColors();
  const styles = make_styles(Colors);
  const size  = CHART_W * 0.55;
  const cx    = size / 2;
  const cy    = size / 2;
  const R     = size * 0.42;
  const rInner = R * 0.55;

  let angle = 0;
  const slices = items.slice(0, 8).map((item, i) => {
    const sweep = (item.value / total) * 360;
    const path  = arcPath(cx, cy, R, angle, angle + sweep - 0.5);
    angle += sweep;
    return { ...item, path, color: CAT_COLORS[i % CAT_COLORS.length] };
  });

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Svg width={size} height={size}>
        {slices.map((s, i) => (
          <Path key={i} d={s.path} fill={s.color} />
        ))}
        {/* İç daire — donut */}
        <Circle cx={cx} cy={cy} r={rInner} fill={Colors.bgCard} />
        <SvgText
          x={cx} y={cy - 8} textAnchor="middle"
          fontSize={13} fontWeight="800" fill={Colors.text}
        >
          {items.length}
        </SvgText>
        <SvgText
          x={cx} y={cy + 10} textAnchor="middle"
          fontSize={9} fill={Colors.textMuted}
        >
          kategori
        </SvgText>
      </Svg>

      {/* Legend */}
      <View style={{ flex: 1, gap: 5 }}>
        {slices.map((s, i) => (
          <View key={i} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: s.color }]} />
            <Text style={styles.legendLabel} numberOfLines={1}>{s.label}</Text>
            <Text style={styles.legendPct}>%{s.pct.toFixed(0)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Bar Grafik (Aylık) ────────────────────────────────────────────────────────
interface MonthBar { label: string; gelir: number; gider: number }

function MonthlyBarChart({ data, lang }: { data: MonthBar[]; lang: string }) {
  if (data.length === 0) return null;
  const H       = 180;
  const W       = CHART_W - 8;
  const padL    = 8;
  const padB    = 28;
  const chartH  = H - padB;
  const maxVal  = Math.max(...data.flatMap(d => [d.gelir, d.gider]), 1);
  const barW    = Math.floor((W - padL) / (data.length * 2 + data.length + 1));

  return (
    <Svg width={W} height={H}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
        const y = chartH - chartH * f;
        return (
          <G key={i}>
            <Line x1={padL} y1={y} x2={W} y2={y} stroke={Colors.border} strokeWidth={1} />
          </G>
        );
      })}

      {data.map((d, i) => {
        const slotW  = (W - padL) / data.length;
        const x0     = padL + i * slotW + slotW * 0.1;
        const bW     = slotW * 0.38;
        const gelirH = d.gelir > 0 ? (d.gelir / maxVal) * chartH : 0;
        const giderH = d.gider > 0 ? (d.gider / maxVal) * chartH : 0;

        return (
          <G key={i}>
            {/* Gelir bar */}
            <Rect
              x={x0} y={chartH - gelirH} width={bW} height={Math.max(gelirH, 1)}
              fill={Colors.success} rx={3}
            />
            {/* Gider bar */}
            <Rect
              x={x0 + bW + 2} y={chartH - giderH} width={bW} height={Math.max(giderH, 1)}
              fill={Colors.danger} rx={3}
            />
            {/* Ay etiketi */}
            <SvgText
              x={x0 + bW} y={H - 6} textAnchor="middle"
              fontSize={9} fill={Colors.textMuted}
            >
              {d.label}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

// ── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ pct, color }: { pct: number; color: string }) {
  const Colors = useColors();
  const styles = make_styles(Colors);
  const clamp = Math.min(Math.max(pct, 0), 100);
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${clamp}%` as any, backgroundColor: color }]} />
    </View>
  );
}

// ── Finansal Skor Halkası ─────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const size  = 100;
  const cx    = size / 2;
  const cy    = size / 2;
  const R     = 38;
  const circ  = 2 * Math.PI * R;
  const dash  = (score / 100) * circ;
  const color = score >= 70 ? Colors.success : score >= 45 ? Colors.warning : Colors.danger;

  return (
    <Svg width={size} height={size}>
      <Circle cx={cx} cy={cy} r={R} stroke="#F1F5F9" strokeWidth={10} fill="none" />
      <Circle
        cx={cx} cy={cy} r={R}
        stroke={color} strokeWidth={10} fill="none"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <SvgText x={cx} y={cy - 5} textAnchor="middle" fontSize={18} fontWeight="800" fill={color}>
        {score}
      </SvgText>
      <SvgText x={cx} y={cy + 12} textAnchor="middle" fontSize={8} fill={Colors.textMuted}>
        /100
      </SvgText>
    </Svg>
  );
}

// ── Ana Ekran ─────────────────────────────────────────────────────────────────
export default function AnalysisScreen() {
  const Colors = useColors();
  const styles = make_styles(Colors);
  const { t, lang } = useTranslation();
  const navigation  = useNavigation<any>();
  const { transactions, analytics, user } = useStore();

  // Kategori bazlı gider özeti — transactions değişince otomatik yenilenir
  const catData = useMemo(() => {
    const giderTxs = transactions.filter(tx => tx.tip === 'Gider');
    const map: Record<string, number> = {};
    giderTxs.forEach(tx => { map[tx.kategori] = (map[tx.kategori] || 0) + tx.tutar; });
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value, color: '', pct: total > 0 ? (value / total) * 100 : 0 }));
  }, [transactions]);

  // Aylık gelir/gider (son 6 ay)
  const monthlyData = useMemo((): MonthBar[] => {
    const now   = new Date();
    const months: MonthBar[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthTxs = transactions.filter(tx => tx.tarih.startsWith(key));
      const gelir = monthTxs.filter(tx => tx.tip === 'Gelir').reduce((s, tx) => s + tx.tutar, 0);
      const gider = monthTxs.filter(tx => tx.tip === 'Gider').reduce((s, tx) => s + tx.tutar, 0);
      months.push({
        label: lang === 'TR'
          ? ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'][d.getMonth()]
          : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()],
        gelir, gider,
      });
    }
    return months;
  }, [transactions, lang]);

  const noData = !analytics || (analytics.gelir === 0 && analytics.gider === 0);
  const giderToplam = analytics?.gider || 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Başlık ── */}
        <View style={styles.headerGrad}>
          <Text style={styles.headerEmoji}>📊</Text>
          <Text style={styles.headerTitle}>{lang === 'TR' ? 'Finansal Analiz' : 'Financial Analysis'}</Text>
          <Text style={styles.headerSub}>
            {lang === 'TR'
              ? `${transactions.length} işlem kayıtlı`
              : `${transactions.length} transactions recorded`}
          </Text>
        </View>

        {noData ? (
          <View style={{ padding: Spacing.lg }}>
            <EmptyState
              emoji="📊"
              title={t.no_data}
              subtitle={lang === 'TR' ? 'Gelir veya gider ekleyince analiz burada görünür.' : 'Add income or expenses to see analysis.'}
            />
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => navigation.navigate('AddTransaction', { type: 'Gider' })}
            >
              <Text style={styles.addBtnText}>
                {lang === 'TR' ? '+ İşlem Ekle' : '+ Add Transaction'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.content}>

            {/* ── Özet Kartları ── */}
            <View style={styles.summaryRow}>
              {[
                { label: lang === 'TR' ? 'Gelir'   : 'Income',  val: analytics!.gelir, color: Colors.success, icon: '💚' },
                { label: lang === 'TR' ? 'Gider'   : 'Expense', val: analytics!.gider, color: Colors.danger,  icon: '🔴' },
                { label: 'Net', val: analytics!.net, color: analytics!.net >= 0 ? Colors.primary : Colors.danger, icon: analytics!.net >= 0 ? '📈' : '📉' },
              ].map(item => (
                <View key={item.label} style={[styles.summaryCard, { borderTopColor: item.color }]}>
                  <Text style={styles.summaryIcon}>{item.icon}</Text>
                  <Text style={styles.summaryLabel}>{item.label}</Text>
                  <Text style={[styles.summaryValue, { color: item.color }]}>
                    {Math.abs(item.val).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}₺
                  </Text>
                </View>
              ))}
            </View>

            {/* ── Finansal Skor + Tasarruf ── */}
            <Card>
              <SectionHeader title={lang === 'TR' ? '🎯 Finansal Skor' : '🎯 Financial Score'} />
              <View style={styles.scoreRow}>
                <ScoreRing score={analytics!.finansal_skor} />
                <View style={styles.scoreStats}>
                  {[
                    {
                      label: lang === 'TR' ? 'Harcama Oranı' : 'Spending Ratio',
                      pct: analytics!.gelir > 0 ? (analytics!.gider / analytics!.gelir) * 100 : 0,
                      color: (analytics!.gider / Math.max(analytics!.gelir, 1)) > 0.9 ? Colors.danger : Colors.primary,
                    },
                    {
                      label: lang === 'TR' ? 'Tasarruf Oranı' : 'Savings Rate',
                      pct: Math.max(analytics!.tasarruf_orani, 0),
                      color: Colors.success,
                    },
                  ].map(item => (
                    <View key={item.label} style={{ marginBottom: 10 }}>
                      <View style={styles.progressLabelRow}>
                        <Text style={styles.progressLabel}>{item.label}</Text>
                        <Text style={[styles.progressPct, { color: item.color }]}>%{item.pct.toFixed(0)}</Text>
                      </View>
                      <ProgressBar pct={item.pct} color={item.color} />
                    </View>
                  ))}
                  {/* Yıllık tasarruf tahmini */}
                  {analytics!.net > 0 && (
                    <View style={styles.savingsTip}>
                      <Text style={styles.savingsTipText}>
                        💰 {lang === 'TR'
                          ? `Yılda ≈ ${(analytics!.net * 12).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}₺ biriktirebilirsiniz`
                          : `You can save ≈ ${(analytics!.net * 12).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}₺/year`}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </Card>

            {/* ── Gider Dağılımı (Donut) ── */}
            {catData.length > 0 && (
              <Card>
                <SectionHeader title={lang === 'TR' ? '🍩 Gider Dağılımı' : '🍩 Expense Breakdown'} />
                <DonutChart items={catData} total={giderToplam} />
              </Card>
            )}

            {/* ── Aylık Karşılaştırma (Bar) ── */}
            <Card>
              <SectionHeader title={lang === 'TR' ? '📅 Aylık Karşılaştırma' : '📅 Monthly Comparison'} />
              <View style={styles.barLegend}>
                <View style={styles.barLegendItem}>
                  <View style={[styles.barLegendDot, { backgroundColor: Colors.success }]} />
                  <Text style={styles.barLegendText}>{lang === 'TR' ? 'Gelir' : 'Income'}</Text>
                </View>
                <View style={styles.barLegendItem}>
                  <View style={[styles.barLegendDot, { backgroundColor: Colors.danger }]} />
                  <Text style={styles.barLegendText}>{lang === 'TR' ? 'Gider' : 'Expense'}</Text>
                </View>
              </View>
              <MonthlyBarChart data={monthlyData} lang={lang} />
              {/* Veri yoksa ipucu */}
              {monthlyData.every(m => m.gelir === 0 && m.gider === 0) && (
                <Text style={styles.noMonthData}>
                  {lang === 'TR' ? 'İşlem eklenince grafik dolacak.' : 'Chart fills as you add transactions.'}
                </Text>
              )}
            </Card>

            {/* ── Kategori Detayı ── */}
            {catData.length > 0 && (
              <Card>
                <SectionHeader title={lang === 'TR' ? '📋 Kategori Detayı' : '📋 Category Detail'} />
                <View style={styles.catList}>
                  {catData.map((c, i) => {
                    const color = CAT_COLORS[i % CAT_COLORS.length];
                    return (
                      <View key={i} style={styles.catRow}>
                        <View style={[styles.catColorBar, { backgroundColor: color }]} />
                        <Text style={styles.catIcon}>{CAT_ICONS[c.label] || '📌'}</Text>
                        <View style={{ flex: 1 }}>
                          <View style={styles.catLabelRow}>
                            <Text style={styles.catLabel} numberOfLines={1}>{c.label}</Text>
                            <Text style={styles.catAmount}>
                              {c.value.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}₺
                            </Text>
                          </View>
                          <View style={styles.catProgressTrack}>
                            <View style={[styles.catProgressFill, { width: `${c.pct}%` as any, backgroundColor: color }]} />
                          </View>
                          <Text style={styles.catPct}>%{c.pct.toFixed(1)}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </Card>
            )}

            {/* ── En Büyük Harcamalar ── */}
            {transactions.filter(tx => tx.tip === 'Gider').length > 0 && (
              <Card>
                <SectionHeader title={lang === 'TR' ? '💸 En Yüksek İşlemler' : '💸 Top Transactions'} />
                {transactions
                  .filter(tx => tx.tip === 'Gider')
                  .sort((a, b) => b.tutar - a.tutar)
                  .slice(0, 5)
                  .map((tx, i) => (
                    <View key={i} style={styles.topTxRow}>
                      <View style={[styles.topTxRank, { backgroundColor: i === 0 ? 'rgba(251,191,36,0.2)' : Colors.bgElevated }]}>
                        <Text style={styles.topTxRankText}>{i + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.topTxDesc} numberOfLines={1}>{tx.detay || tx.kategori}</Text>
                        <Text style={styles.topTxMeta}>{tx.kategori} · {tx.tarih}</Text>
                      </View>
                      <Text style={styles.topTxAmount}>
                        {tx.tutar.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}₺
                      </Text>
                    </View>
                  ))
                }
              </Card>
            )}

          </View>
        )}

        <View style={{ paddingHorizontal: Spacing.lg }}>
          <RecentTransactionsWidget lang={lang} />
          <AccountActionsWidget lang={lang} />
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const make_styles = (C: any) => StyleSheet.create({
  safe:    { flex: 1, backgroundColor: C.bg },
  scroll:  { flex: 1, backgroundColor: C.bg },
  content: { padding: Spacing.lg, gap: Spacing.sm },

  // ── Header ──────────────────────────────────────────────────────────────
  headerGrad: {
    paddingTop: 20, paddingBottom: 24, paddingHorizontal: 24,
    backgroundColor: C.bg,
  },
  headerCircle1: { width: 0, height: 0 },
  headerCircle2: { width: 0, height: 0 },
  headerEmoji: { fontSize: 30, marginBottom: 6 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: C.text, letterSpacing: -0.5 },
  headerSub:   { fontSize: 13, color: C.textMuted, marginTop: 4 },

  // ── Özet ────────────────────────────────────────────────────────────────
  summaryRow: { flexDirection: 'row', gap: Spacing.sm },
  summaryCard: {
    flex: 1, backgroundColor: C.bgCard, borderRadius: Radius.lg,
    padding: Spacing.md, borderTopWidth: 3, alignItems: 'center',
    ...Shadow.sm,
  },
  summaryIcon:  { fontSize: 18, marginBottom: 2 },
  summaryLabel: { fontSize: 10, color: C.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryValue: { fontSize: 14, fontWeight: '900', marginTop: 4 },

  // ── Skor ────────────────────────────────────────────────────────────────
  scoreRow:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  scoreStats:     { flex: 1 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressLabel:  { fontSize: 12, color: C.textMuted, fontWeight: '600' },
  progressPct:    { fontSize: 12, fontWeight: '800' },
  progressTrack:  { height: 8, backgroundColor: C.bgElevated, borderRadius: 4, overflow: 'hidden' },
  progressFill:   { height: 8, borderRadius: 4 },
  savingsTip:     { backgroundColor: 'rgba(52,211,153,0.12)', borderRadius: Radius.sm, padding: Spacing.sm, marginTop: 4, borderWidth: 1, borderColor: 'rgba(52,211,153,0.25)' },
  savingsTipText: { fontSize: 11, color: C.success, fontWeight: '700' },

  // ── Donut Legend ─────────────────────────────────────────────────────────
  legendRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:   { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { flex: 1, fontSize: 11, color: C.text, fontWeight: '600' },
  legendPct:   { fontSize: 11, color: C.textMuted, fontWeight: '700' },

  // ── Bar Legend ────────────────────────────────────────────────────────────
  barLegend:     { flexDirection: 'row', gap: 16, marginBottom: 12 },
  barLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  barLegendDot:  { width: 10, height: 10, borderRadius: 3 },
  barLegendText: { fontSize: 11, color: C.textMuted, fontWeight: '600' },
  noMonthData:   { fontSize: 12, color: C.textLight, textAlign: 'center', paddingVertical: 8 },

  // ── Kategori List ─────────────────────────────────────────────────────────
  catList:         { gap: 10 },
  catRow:          { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catColorBar:     { width: 4, height: 36, borderRadius: 2 },
  catIcon:         { fontSize: 20, width: 28 },
  catLabelRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  catLabel:        { fontSize: 12, fontWeight: '700', color: C.text, flex: 1 },
  catAmount:       { fontSize: 12, fontWeight: '900', color: C.primary },
  catPct:          { fontSize: 10, color: C.textMuted, marginTop: 2 },
  catProgressTrack:{ height: 5, backgroundColor: C.bgElevated, borderRadius: 3, overflow: 'hidden' },
  catProgressFill: { height: 5, borderRadius: 3 },

  // ── Top İşlemler ──────────────────────────────────────────────────────────
  topTxRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  topTxRank:     { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  topTxRankText: { fontSize: 12, fontWeight: '800', color: C.text },
  topTxDesc:     { fontSize: 13, fontWeight: '700', color: C.text },
  topTxMeta:     { fontSize: 11, color: C.textMuted, marginTop: 1 },
  topTxAmount:   { fontSize: 14, fontWeight: '900', color: C.danger },

  // ── Ekle butonu ───────────────────────────────────────────────────────────
  addBtn: {
    backgroundColor: C.primary, borderRadius: Radius.lg,
    paddingVertical: 14, alignItems: 'center', marginTop: 12,
  },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
