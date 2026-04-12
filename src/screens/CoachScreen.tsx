// src/screens/CoachScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { Card, ScoreCard, EmptyState } from '../components/UI';
import RecentTransactionsWidget from '../components/RecentTransactionsWidget';
import AccountActionsWidget from '../components/AccountActionsWidget';
import { Colors, Spacing, Radius } from '../utils/theme';
import { useTranslation } from '../hooks/useTranslation';

interface Advice { emoji: string; type: 'danger'|'warning'|'success'|'primary'; title: string; text: string; }

function buildAdvices(analytics: any, transactions: any[], lang: string, meslek: string): Advice[] {
  const advices: Advice[] = [];
  if (!analytics || analytics.gelir === 0) return advices;
  const { gelir, gider } = analytics;
  const oran = (gider / gelir) * 100;

  if (oran > 100)     advices.push({ emoji: '!', type: 'danger',  title: lang==='TR' ? 'Butce Acigi!'     : 'Budget Deficit!',    text: lang==='TR' ? `Gelirinizden ${(gider-gelir).toFixed(0)}TL fazla harcadiniz.` : `Overspent by ${(gider-gelir).toFixed(0)}TL.` });
  else if (oran > 90) advices.push({ emoji: '~', type: 'warning', title: lang==='TR' ? 'Harcama Yuksek'  : 'High Spending',      text: lang==='TR' ? `Gelirinizin %${oran.toFixed(0)}'ini harciyorsunuz.` : `Spending ${oran.toFixed(0)}% of income.` });
  else if (oran > 70) advices.push({ emoji: '+', type: 'primary', title: lang==='TR' ? 'Iyi Gidiyor'     : 'Doing Well',         text: lang==='TR' ? `Harcama oraniniz %${oran.toFixed(0)}.` : `Spending ratio ${oran.toFixed(0)}%.` });
  else                advices.push({ emoji: '*', type: 'success', title: lang==='TR' ? 'Mukemmel!'       : 'Excellent!',         text: lang==='TR' ? `Sadece %${oran.toFixed(0)} harciyorsunuz!` : `Only spending ${oran.toFixed(0)}%!` });

  const saved = gelir - gider;
  if (saved > 0) advices.push({ emoji: '$', type: 'success', title: lang==='TR' ? 'Tasarruf Potansiyeli' : 'Savings Potential', text: lang==='TR' ? `Bu tempoda yilda ${(saved*12).toLocaleString('tr-TR',{maximumFractionDigits:0})}TL biriktirebilirsiniz.` : `At this rate: ${(saved*12).toLocaleString('tr-TR',{maximumFractionDigits:0})}TL/year savings.` });

  const catMap: Record<string, number> = {};
  transactions.filter(t => t.tip === 'Gider').forEach(tx => { catMap[tx.kategori] = (catMap[tx.kategori] || 0) + tx.tutar; });

  if (catMap['Abonelik'] && (catMap['Abonelik']/gelir)*100 > 5)
    advices.push({ emoji: '@', type: 'warning', title: lang==='TR' ? 'Abonelik Yuku' : 'Subscription Burden', text: lang==='TR' ? `Abonelikleriniz ${catMap['Abonelik'].toFixed(0)}TL.` : `Subscriptions: ${catMap['Abonelik'].toFixed(0)}TL.` });

  return advices;
}

export default function CoachScreen() {
  const { t, lang } = useTranslation();
  const { analytics, transactions, user } = useStore();
  const meslek = user?.meslek || '';

  const colorMap = { danger:'rgba(248,113,113,0.12)', warning:'rgba(251,191,36,0.12)', success:'rgba(52,211,153,0.12)', primary:'rgba(124,110,250,0.12)' };
  const borderMap = { danger: Colors.danger, warning: Colors.warning, success: Colors.success, primary: Colors.primary };
  const textMap = { danger: Colors.danger, warning: Colors.warning, success: Colors.success, primary: Colors.primary };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll}>
        <Text style={styles.pageTitle}>{lang === 'TR' ? 'Finansal Koc' : 'Financial Coach'}</Text>

        {(!analytics || (analytics.gelir === 0 && analytics.gider === 0)) ? (
          <EmptyState emoji="🎯" title={t.coach_empty} />
        ) : (
          <>
            <View style={styles.row}>
              <ScoreCard score={analytics.finansal_skor} label={t.metric_score} />
              <Card style={{ flex: 1 }}>
                {[
                  { label: lang==='TR' ? 'Tasarruf' : 'Savings', val: analytics.net, color: analytics.net>=0 ? Colors.success : Colors.danger },
                  { label: lang==='TR' ? 'Oran' : 'Rate', val: analytics.tasarruf_orani, color: Colors.primary, suffix: '%' },
                ].map(item => (
                  <View key={item.label} style={styles.statRow}>
                    <Text style={styles.statLabel}>{item.label}</Text>
                    <Text style={[styles.statVal, { color: item.color }]}>
                      {(item.suffix || '') + Math.abs(item.val).toFixed(0) + (item.suffix ? '' : 'TL')}
                    </Text>
                  </View>
                ))}
              </Card>
            </View>
            {buildAdvices(analytics, transactions, lang, meslek).map((a, i) => (
              <View key={i} style={[styles.adviceCard, { backgroundColor: colorMap[a.type], borderLeftColor: borderMap[a.type] }]}>
                <Text style={[styles.adviceTitle, { color: textMap[a.type] }]}>{a.emoji} {a.title}</Text>
                <Text style={styles.adviceText}>{a.text}</Text>
              </View>
            ))}
          </>
        )}

        <RecentTransactionsWidget lang={lang} />
        <AccountActionsWidget lang={lang} />
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.bg },
  scroll:      { flex: 1, padding: Spacing.lg },
  pageTitle:   { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: Spacing.lg },
  row:         { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  statRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  statLabel:   { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  statVal:     { fontSize: 15, fontWeight: '800' },
  adviceCard:  { borderLeftWidth: 4, borderRadius: Radius.sm, padding: Spacing.md, marginBottom: Spacing.sm },
  adviceTitle: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  adviceText:  { fontSize: 13, color: Colors.textMuted, lineHeight: 20 },
});
