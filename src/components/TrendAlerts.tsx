// src/components/TrendAlerts.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {useColors,  Colors, Spacing, Radius } from '../utils/theme';

interface TrendAlert {
  kategori: string; bu_ay: number; gecen_ay: number; degisim_pct: number;
}

export default function TrendAlerts({ trends, lang }: { trends: TrendAlert[]; lang: string }) {
  const Colors = useColors();
  const styles = make_styles(Colors);
  if (!trends.length) return null;
  const title = lang === 'TR'
    ? `⚠️ Harcama Trend Uyarıları (${trends.length})`
    : `⚠️ Spending Trend Alerts (${trends.length})`;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {trends.map((tr, i) => {
        const isCritical = tr.degisim_pct >= 40;
        const bg  = isCritical ? 'rgba(248,113,113,0.12)' : 'rgba(251,191,36,0.12)';
        const brd = isCritical ? Colors.danger : Colors.warning;
        const tc  = isCritical ? Colors.danger : Colors.warning;
        return (
          <View key={i} style={[styles.alert, { backgroundColor: bg, borderLeftColor: brd }]}>
            <Text style={[styles.alertTitle, { color: tc }]}>
              {tr.kategori} – %{tr.degisim_pct.toFixed(0)} {lang === 'TR' ? 'artış' : 'increase'}
            </Text>
            <Text style={styles.alertSub}>
              {lang === 'TR' ? 'Geçen ay' : 'Last'}: {tr.gecen_ay.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}₺ →{' '}
              {lang === 'TR' ? 'Bu ay' : 'This'}: {tr.bu_ay.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}₺
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const make_styles = (C: any) => StyleSheet.create({
  container: { marginBottom: Spacing.sm },
  title: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 8 },
  alert: {
    borderLeftWidth: 4, borderRadius: Radius.sm,
    padding: Spacing.md, marginBottom: 6,
  },
  alertTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  alertSub: { fontSize: 12, color: C.textMuted },
});
