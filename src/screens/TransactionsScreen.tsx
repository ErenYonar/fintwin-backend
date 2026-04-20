// src/screens/TransactionsScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useStore } from '../store/useStore';
import TransactionItem from '../components/TransactionItem';
import { EmptyState, SyncBanner } from '../components/UI';
import { useColors, Colors, Spacing, Radius, Typography } from '../utils/theme';
import { useTranslation } from '../hooks/useTranslation';

type Filter = 'all' | 'Gelir' | 'Gider';

export default function TransactionsScreen() {
  const Colors = useColors();
  const styles = make_styles(Colors);
  const { t, lang } = useTranslation();
  const navigation = useNavigation<any>();
  const { transactions, deleteTx, syncState } = useStore();
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = filter === 'all'
    ? transactions
    : transactions.filter(tx => tx.tip === filter);

  const filters: { key: Filter; label: string }[] = [
    { key: 'all',   label: lang === 'TR' ? '🔵 Tümü'    : '🔵 All' },
    { key: 'Gelir', label: lang === 'TR' ? '🟢 Gelirler' : '🟢 Income' },
    { key: 'Gider', label: lang === 'TR' ? '🔴 Giderler' : '🔴 Expenses' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{lang === 'TR' ? '📋 Tüm İşlemler' : '📋 All Transactions'}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddTransaction', {})}>
          <Text style={styles.addBtn}>＋</Text>
        </TouchableOpacity>
      </View>

      <SyncBanner syncing={syncState.isSyncing} offline={!syncState.isOnline} />

      {/* Filtre butonları */}
      <View style={styles.filterRow}>
        {filters.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.countText}>
        {filtered.length} {lang === 'TR' ? 'kayıt' : 'records'}
      </Text>

      {filtered.length === 0 ? (
        <EmptyState emoji="📊" title={lang === 'TR' ? 'İşlem bulunamadı' : 'No transactions found'} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.local_id || String(item.id)}
          contentContainerStyle={{ padding: Spacing.lg }}
          renderItem={({ item }) => (
            <TransactionItem
              transaction={item}
              onEdit={() => navigation.navigate('EditTransaction', { tx: item })}
              onDelete={() => deleteTx(item.local_id || String(item.id))}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const make_styles = (C: any) => StyleSheet.create({
  safe:            { flex: 1, backgroundColor: C.bg },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, paddingBottom: Spacing.sm },
  back:            { fontSize: 24, color: C.primary, fontWeight: '700' },
  title:           { ...Typography.h3 },
  addBtn:          { fontSize: 24, color: C.primary, fontWeight: '700' },
  filterRow:       { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  filterBtn:       { flex: 1, paddingVertical: 10, borderRadius: Radius.md, backgroundColor: C.bgElevated, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  filterBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  filterText:      { fontSize: 12, fontWeight: '600', color: C.textMuted },
  filterTextActive:{ color: '#fff' },
  countText:       { fontSize: 12, color: C.textMuted, paddingHorizontal: Spacing.lg, marginBottom: 4 },
});
