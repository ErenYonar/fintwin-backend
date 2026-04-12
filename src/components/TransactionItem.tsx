// src/components/TransactionItem.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { Colors, Spacing, Radius, Shadow } from '../utils/theme';
import { Transaction } from '../services/api';
import { translateKategori } from '../hooks/useTranslation';

interface Props {
  transaction: Transaction;
  onEdit: () => void;
  onDelete: () => void;
  lang?: string;
}

export default function TransactionItem({ transaction: tx, onEdit, onDelete, lang = 'TR' }: Props) {
  const isIncome = tx.tip === 'Gelir';
  const sign     = isIncome ? '+' : '-';
  const clr      = isIncome ? Colors.income : Colors.expense;
  const bg       = isIncome ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)';
  const L        = lang === 'TR';

  const displayKategori = translateKategori(tx.kategori, lang);
  const displayDetay    = tx.detay || tx.kategori;

  const handleDelete = () =>
    Alert.alert(
      L ? 'Sil' : 'Delete',
      `"${displayDetay}" ${L ? 'silinsin mi?' : 'will be deleted. Are you sure?'}`,
      [
        { text: L ? 'İptal' : 'Cancel', style: 'cancel' },
        { text: L ? 'Sil' : 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );

  const tutar = tx.para_birimi !== 'TL'
    ? `${tx.tutar_orijinal.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ${tx.para_birimi}`
    : `${sign}${tx.tutar.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}₺`;

  return (
    <View style={styles.row}>
      <View style={[styles.logoWrap, { backgroundColor: bg }]}>
        {tx.logo
          ? <Image source={{ uri: tx.logo }} style={styles.logo} resizeMode="contain" />
          : <Text style={{ fontSize: 20 }}>{isIncome ? '💰' : '💸'}</Text>
        }
      </View>
      <View style={styles.info}>
        <Text style={styles.detay} numberOfLines={1}>{displayDetay}</Text>
        <View style={styles.metaRow}>
          <View style={[styles.badge, { backgroundColor: bg }]}>
            <Text style={[styles.badgeText, { color: clr }]}>{displayKategori}</Text>
          </View>
          <Text style={styles.tarih}>{tx.tarih}</Text>
          {tx.sync_status === 'pending' && <Text style={styles.pendingDot}>🔄</Text>}
        </View>
      </View>
      <View style={styles.right}>
        <Text style={[styles.tutar, { color: clr }]}>{tutar}</Text>
        <View style={styles.actions}>
          <TouchableOpacity onPress={onEdit} style={styles.actionBtn}>
            <Text>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.actionBtn}>
            <Text>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  logoWrap: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm,
  },
  logo:       { width: 28, height: 28 },
  info:       { flex: 1 },
  detay:      { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  metaRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge:      { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText:  { fontSize: 10, fontWeight: '600' },
  tarih:      { fontSize: 11, color: Colors.textMuted },
  pendingDot: { fontSize: 11 },
  right:      { alignItems: 'flex-end' },
  tutar:      { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  actions:    { flexDirection: 'row', gap: 4 },
  actionBtn:  { padding: 4 },
});
