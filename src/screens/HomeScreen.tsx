// src/screens/HomeScreen.tsx
import React, { useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { SyncBanner } from '../components/UI';
import TrendAlerts from '../components/TrendAlerts';
import RecentTransactionsWidget from '../components/RecentTransactionsWidget';
import AccountActionsWidget from '../components/AccountActionsWidget';
import AdBanner from '../components/AdBanner';
import { useColors, Colors, Spacing, Radius, Shadow } from '../utils/theme';
import { useTranslation } from '../hooks/useTranslation';

export default function HomeScreen() {
  const Colors = useColors();
  const themeMode = useStore(s => s.themeMode);
  const styles = make_styles(Colors);
  const { t, lang } = useTranslation();
  const navigation   = useNavigation<any>();
  const { analytics, trends, syncState, loadTransactions, loadExchangeRates } = useStore();
  const L = lang === 'TR';

  useEffect(() => {
    loadTransactions();
    loadExchangeRates();
  }, []);

  const onRefresh = useCallback(async () => {
    await loadTransactions();
  }, []);

  const gelir = analytics?.gelir || 0;
  const gider = analytics?.gider || 0;
  const net   = analytics?.net   || 0;
  const score = analytics?.finansal_skor || 0;
  const pct   = gelir > 0 ? Math.min((gider / gelir) * 100, 100) : 0;
  const pctColor = pct > 90 ? Colors.danger : pct > 70 ? Colors.warning : pct > 50 ? Colors.primary : Colors.success;

  const scoreColor  = score >= 70 ? Colors.success : score >= 45 ? Colors.warning : Colors.danger;
  const scoreStatus = score >= 80
    ? (L ? '🌟 Mükemmel' : '🌟 Excellent')
    : score >= 60
    ? (L ? '👍 İyi'       : '👍 Good')
    : score >= 40
    ? (L ? '😐 Orta'      : '😐 Fair')
    : (L ? '😟 Zayıf'     : '😟 Weak');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>FinTwin</Text>
            <Text style={styles.headerSub}>{t.app_subtitle}</Text>
          </View>
          <TouchableOpacity
            style={styles.accountBtn}
            onPress={() => navigation.navigate('Account')}
          >
            <Text style={{ fontSize: 20 }}>👤</Text>
          </TouchableOpacity>
        </View>

        <SyncBanner syncing={syncState.isSyncing} offline={!syncState.isOnline} />

        {analytics && (
          <>
            {/* ── Gelir / Gider kartları ── */}
            <View style={styles.metricsRow}>
              {/* Gelir */}
              <LinearGradient colors={themeMode === 'light' ? ['#D1FAE5','#A7F3D0'] : ['#064E3B','#065F46']} style={styles.metricCard}>
                <View style={styles.metricIconBox}>
                  <Text style={{ fontSize: 20 }}>💰</Text>
                </View>
                <Text style={styles.metricLabel}>{L ? 'GELİR' : 'INCOME'}</Text>
                <Text style={[styles.metricValue, { color: Colors.success }]}>
                  {gelir.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}₺
                </Text>
              </LinearGradient>

              {/* Gider */}
              <LinearGradient colors={themeMode === 'light' ? ['#FFE4E6','#FECDD3'] : ['#450A0A','#7F1D1D']} style={styles.metricCard}>
                <View style={styles.metricIconBox}>
                  <Text style={{ fontSize: 20 }}>💸</Text>
                </View>
                <Text style={styles.metricLabel}>{L ? 'GİDER' : 'EXPENSE'}</Text>
                <Text style={[styles.metricValue, { color: Colors.danger }]}>
                  {gider.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}₺
                </Text>
              </LinearGradient>
            </View>

            {/* ── Net / Skor ── */}
            <View style={styles.metricsRow}>
              {/* Net */}
              <LinearGradient
                colors={net >= 0 ? (themeMode === 'light' ? ['#EDE9FE','#DDD6FE'] : ['#1E1B4B','#312E81']) : (themeMode === 'light' ? ['#FFE4E6','#FECDD3'] : ['#450A0A','#7F1D1D'])}
                style={styles.metricCard}
              >
                <View style={styles.metricIconBox}>
                  <Text style={{ fontSize: 20 }}>{net >= 0 ? '📈' : '📉'}</Text>
                </View>
                <Text style={[styles.metricLabel, themeMode==='light' && {color: net>=0 ? '#3730A3' : '#7F1D1D'}]}>NET</Text>
                <Text style={[styles.metricValue, { color: net >= 0 ? Colors.primary : Colors.danger }]}>
                  {net >= 0 ? '+' : ''}{net.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}₺
                </Text>
              </LinearGradient>

              {/* Skor */}
              <LinearGradient colors={[Colors.bgCard, Colors.bgElevated]} style={[styles.metricCard, { alignItems: 'center' }]}>
                <Text style={styles.metricLabel}>{L ? 'FİN. SKOR' : 'FIN. SCORE'}</Text>
                <Text style={[styles.scoreNum, { color: scoreColor }]}>{score}</Text>
                <View style={[styles.scoreBadge, { borderColor: scoreColor }]}>
                  <Text style={[styles.scoreBadgeText, { color: scoreColor }]}>{scoreStatus}</Text>
                </View>
              </LinearGradient>
            </View>

            {/* ── Harcama oranı ── */}
            {gelir > 0 && (
              <View style={styles.progressCard}>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.progressLabel}>
                    {L ? 'Harcama Oranı' : 'Spending Ratio'}
                  </Text>
                  <Text style={[styles.progressPct, { color: pctColor }]}>
                    %{pct.toFixed(0)}
                  </Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: pctColor }]} />
                </View>
              </View>
            )}
          </>
        )}

        {trends.length > 0 && <TrendAlerts trends={trends} lang={lang} />}

        {/* ── Hızlı Ekle ── */}
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={[styles.quickBtn, styles.quickIncome]}
            onPress={() => navigation.navigate('AddTransaction', { type: 'Gelir' })}
            activeOpacity={0.8}
          >
            <Text style={styles.quickBtnIcon}>＋</Text>
            <Text style={[styles.quickBtnText, { color: Colors.success }]}>
              {L ? 'Gelir Ekle' : 'Add Income'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickBtn, styles.quickExpense]}
            onPress={() => navigation.navigate('AddTransaction', { type: 'Gider' })}
            activeOpacity={0.8}
          >
            <Text style={styles.quickBtnIcon}>＋</Text>
            <Text style={[styles.quickBtnText, { color: Colors.danger }]}>
              {L ? 'Gider Ekle' : 'Add Expense'}
            </Text>
          </TouchableOpacity>
        </View>

        <AdBanner konum="home" lang={lang} />
        <RecentTransactionsWidget lang={lang} />
        <AccountActionsWidget lang={lang} />
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const make_styles = (C: any) => StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1, paddingHorizontal: Spacing.lg },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.lg, marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: 28, fontWeight: '900', color: C.primary,
    letterSpacing: -0.5,
  },
  headerSub: { fontSize: 13, color: C.textMuted, marginTop: 2 },
  accountBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.bgElevated,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border,
    ...Shadow.sm,
  },

  // ── Metrik kartlar ───────────────────────────────────────────────────────
  metricsRow:   { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  metricCard: {
    flex: 1, borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: C.border,
    ...Shadow.sm,
  },
  metricIconBox: { marginBottom: 6 },
  metricLabel: {
    fontSize: 10, fontWeight: '700', color: C.textMuted,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4,
  },
  metricValue: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },

  // ── Skor ────────────────────────────────────────────────────────────────
  scoreNum:       { fontSize: 34, fontWeight: '900', letterSpacing: -1, marginVertical: 4 },
  scoreBadge:     { borderWidth: 1.5, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  scoreBadgeText: { fontSize: 11, fontWeight: '700' },

  // ── Progress ─────────────────────────────────────────────────────────────
  progressCard: {
    backgroundColor: C.bgCard, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: C.border,
  },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel:    { fontSize: 13, color: C.textMuted, fontWeight: '600' },
  progressPct:      { fontSize: 14, fontWeight: '800' },
  progressTrack:    { height: 8, backgroundColor: C.bgElevated, borderRadius: 4, overflow: 'hidden' },
  progressFill:     { height: 8, borderRadius: 4 },

  // ── Hızlı ekle ───────────────────────────────────────────────────────────
  quickRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  quickBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: Radius.lg, paddingVertical: 14,
    borderWidth: 1.5,
  },
  quickIncome:  { backgroundColor: 'rgba(52,211,153,0.08)', borderColor: 'rgba(52,211,153,0.3)' },
  quickExpense: { backgroundColor: 'rgba(248,113,113,0.08)', borderColor: 'rgba(248,113,113,0.3)' },
  quickBtnIcon: { fontSize: 18, fontWeight: '700', color: C.textMuted },
  quickBtnText: { fontSize: 13, fontWeight: '700' },
});
