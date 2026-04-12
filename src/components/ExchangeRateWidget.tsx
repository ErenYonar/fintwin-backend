// src/components/ExchangeRateWidget.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../store/useStore';
import { formatRateTimestamp } from '../services/exchangeService';
import { Colors, Radius, Spacing } from '../utils/theme';

interface Props {
  lang: 'TR' | 'EN';
}

const CURRENCY_FLAGS: Record<string, string> = {
  USD: '🇺🇸',
  EUR: '🇪🇺',
  GBP: '🇬🇧',
};

const CURRENCY_NAMES_TR: Record<string, string> = {
  USD: 'Amerikan Doları',
  EUR: 'Euro',
  GBP: 'İngiliz Sterlini',
};

const CURRENCY_NAMES_EN: Record<string, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
};

export default function ExchangeRateWidget({ lang }: Props) {
  const { exchangeRates, ratesMeta, loadExchangeRates } = useStore();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadExchangeRates(true); // forceRefresh: cache bypass
    } finally {
      setRefreshing(false);
    }
  };

  const currencies = ['USD', 'EUR', 'GBP'] as const;

  return (
    <View style={styles.container}>
      {/* Başlık satırı */}
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.title}>
            {lang === 'TR' ? '💱 Döviz Kurları' : '💱 Exchange Rates'}
          </Text>
          {ratesMeta?.lastUpdated ? (
            <Text style={styles.lastUpdate}>
              {lang === 'TR' ? 'Güncellendi: ' : 'Updated: '}
              {formatRateTimestamp(ratesMeta.lastUpdated, lang)}
            </Text>
          ) : (
            <Text style={styles.lastUpdate}>
              {lang === 'TR' ? 'Yükleniyor...' : 'Loading...'}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={handleRefresh}
          disabled={refreshing}
          activeOpacity={0.75}
        >
          {refreshing
            ? <ActivityIndicator size="small" color={Colors.primary} />
            : <Text style={styles.refreshIcon}>🔄</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Kur kartları */}
      <View style={styles.rateRow}>
        {currencies.map(cur => (
          <LinearGradient
            key={cur}
            colors={cur === 'USD' ? ['#EEF2FF', '#E0E7FF'] : cur === 'EUR' ? ['#F0FDF4', '#DCFCE7'] : ['#FFF7ED', '#FED7AA']}
            style={styles.rateCard}
          >
            <Text style={styles.rateFlag}>{CURRENCY_FLAGS[cur]}</Text>
            <Text style={styles.rateCur}>{cur}</Text>
            <Text style={styles.rateName} numberOfLines={1}>
              {lang === 'TR' ? CURRENCY_NAMES_TR[cur] : CURRENCY_NAMES_EN[cur]}
            </Text>
            <Text style={styles.rateValue}>
              {exchangeRates[cur]
                ? exchangeRates[cur].toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : '—'}
            </Text>
            <Text style={styles.rateTL}>₺</Text>
          </LinearGradient>
        ))}
      </View>

      {/* Kaynak bilgisi */}
      {ratesMeta?.source && ratesMeta.source !== 'fallback' && (
        <Text style={styles.source}>
          {lang === 'TR' ? 'Kaynak: ' : 'Source: '}{ratesMeta.source}
        </Text>
      )}
      {ratesMeta?.source === 'fallback' && (
        <Text style={[styles.source, { color: Colors.warning }]}>
          {lang === 'TR'
            ? '⚠️ İnternet bağlantısı yok — tahmini değerler gösteriliyor'
            : '⚠️ No internet connection — showing estimated values'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  lastUpdate: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshIcon: { fontSize: 18 },
  rateRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  rateCard: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: 10,
    alignItems: 'center',
  },
  rateFlag:  { fontSize: 20, marginBottom: 2 },
  rateCur:   { fontSize: 13, fontWeight: '800', color: Colors.text },
  rateName:  { fontSize: 9, color: Colors.textMuted, textAlign: 'center', marginBottom: 4 },
  rateValue: { fontSize: 16, fontWeight: '900', color: Colors.text },
  rateTL:    { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  source: {
    fontSize: 10,
    color: Colors.textLight,
    textAlign: 'right',
  },
});
