// src/components/RecentTransactionsWidget.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, Modal, TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import {useColors,  Colors, Shadow, Radius, Spacing } from '../utils/theme';
import { translateKategori } from '../hooks/useTranslation';

const CATEGORY_ICONS: Record<string, string> = {
  'Abonelik': '📱', 'Fatura': '📄', 'Kira/Aidat': '🏠', 'Kredi/Borç': '🏦',
  'Eğitim': '📚', 'Personel': '👤', 'Yeme-İçme': '🍽️', 'Ulaşım': '🚗',
  'Alışveriş': '🛍️', 'Sağlık': '💊', 'Eğlence': '🎮', 'Diğer': '📌',
  'Maaş': '💰', 'Emekli Maaşı': '💰', 'SGK/SSK Maaşı': '💰',
  'Freelance': '💻', 'Kira Geliri': '🏠', 'Yatırım Geliri': '📈',
  'Ek İş': '💼', 'Prim/Bonus': '🎯',
  'Salary': '💰', 'Pension': '💰', 'Social Security': '💰',
  'Rental Income': '🏠', 'Investment': '📈', 'Side Job': '💼',
  'Bonus/Premium': '🎯', 'Subscription': '📱', 'Bill': '📄',
  'Rent/HOA': '🏠', 'Loan/Debt': '🏦', 'Education': '📚',
  'Staff': '👤', 'Food & Dining': '🍽️', 'Transport': '🚗',
  'Shopping': '🛍️', 'Health': '💊', 'Entertainment': '🎮', 'Other': '📌',
};

const DETAY_TR_TO_EN: Record<string, string> = {
  'Maaş': 'Salary',
  'Emekli Maaşı': 'Pension',
  'SGK/SSK Maaşı': 'Social Security',
  'Kira Geliri': 'Rental Income',
  'Yatırım Geliri': 'Investment Income',
  'Ek İş': 'Side Job',
  'Prim/Bonus': 'Bonus/Premium',
  'Elektrik': 'Electricity',
  'Su': 'Water',
  'Doğalgaz': 'Natural Gas',
  'İnternet': 'Internet',
  'Cep Telefonu': 'Mobile Phone',
  'Kasko': 'Car Insurance',
  'Trafik Sigortası': 'Traffic Insurance',
  'Sağlık Sigortası': 'Health Insurance',
  'Kira': 'Rent',
  'Aidat': 'HOA Fee',
  'Site Aidatı': 'HOA Fee',
  'Apartman Aidatı': 'Building Fee',
  'İşyeri Kirası': 'Commercial Rent',
  'Konut Kredisi': 'Mortgage',
  'Araç Kredisi': 'Auto Loan',
  'İhtiyaç Kredisi': 'Personal Loan',
  'Öğrenim Kredisi (KYK)': 'Student Loan',
  'Taksit': 'Installment',
  'Diğer': 'Other',
};

function translateDetay(detay: string, lang: string): string {
  if (lang === 'TR' || !detay) return detay;
  return DETAY_TR_TO_EN[detay] || detay;
}

export default function RecentTransactionsWidget({ lang }: { lang: string }) {
  const Colors = useColors();
  const styles = make_styles(Colors);
  const navigation = useNavigation<any>();
  const { transactions, deleteTx, updateTx, loadTransactions } = useStore();
  const L = lang === 'TR';

  const [filter,    setFilter]    = useState<'all' | 'gelir' | 'gider'>('all');
  const [expanded,  setExpanded]  = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editTx,    setEditTx]    = useState<any>(null);
  const [editDetay, setEditDetay] = useState('');
  const [editTutar, setEditTutar] = useState('');
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState<string | null>(null);

  useEffect(() => { loadTransactions(); }, []);

  const filtered = transactions.filter(tx => {
    if (filter === 'gelir') return tx.tip === 'Gelir';
    if (filter === 'gider') return tx.tip === 'Gider';
    return true;
  });

  const displayed = expanded ? filtered : filtered.slice(0, 8);

  const handleDelete = (tx: any) => {
    Alert.alert(
      L ? 'Sil' : 'Delete',
      L ? 'Bu işlemi silmek istiyor musunuz?' : 'Delete this transaction?',
      [
        { text: L ? 'İptal' : 'Cancel', style: 'cancel' },
        {
          text: L ? 'Sil' : 'Delete', style: 'destructive',
          onPress: async () => {
            const id = tx.local_id || String(tx.id);
            setDeleting(id);
            try {
              await deleteTx(id);
            } catch {
              Alert.alert(L ? 'Hata' : 'Error', L ? 'Silinemedi.' : 'Could not delete.');
            } finally { setDeleting(null); }
          },
        },
      ]
    );
  };

  const handleEditOpen = (tx: any) => {
    setEditTx(tx);
    setEditDetay(tx.detay || '');
    setEditTutar(String(tx.tutar_orijinal || tx.tutar));
    setEditModal(true);
  };

  const handleEditSave = async () => {
    if (!editTx) return;
    const newTutar = parseFloat(editTutar);
    if (isNaN(newTutar) || newTutar <= 0) {
      Alert.alert(L ? 'Hata' : 'Error', L ? 'Geçerli bir tutar girin.' : 'Enter a valid amount.');
      return;
    }
    setSaving(true);
    try {
      await updateTx(editTx.local_id || String(editTx.id), {
        detay: editDetay.trim() || editTx.kategori,
        tutar: newTutar, tutar_orijinal: newTutar,
        tarih: editTx.tarih, kategori: editTx.kategori,
        tip: editTx.tip, para_birimi: editTx.para_birimi || 'TL',
      });
      setEditModal(false); setEditTx(null);
    } catch {
      Alert.alert(L ? 'Hata' : 'Error', L ? 'Güncellenemedi.' : 'Could not update.');
    } finally { setSaving(false); }
  };

  return (
    <View style={styles.container}>
      {/* Başlık */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {L ? '📌 Son İşlemler' : '📌 Recent Transactions'}
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
          <Text style={styles.seeAll}>{L ? 'Tümü →' : 'All →'}</Text>
        </TouchableOpacity>
      </View>

      {/* Chip listesi */}
      {transactions.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {transactions.slice(0, 12).map((tx, i) => {
            const isIncome  = tx.tip === 'Gelir';
            const chipBg    = isIncome ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)';
            const chipBorder= isIncome ? 'rgba(52,211,153,0.3)'  : 'rgba(248,113,113,0.3)';
            const chipColor = isIncome ? Colors.success           : Colors.danger;
            const chipText  = translateDetay(tx.detay || tx.kategori, lang) || translateKategori(tx.kategori, lang);
            return (
              <View key={i} style={[styles.chip, { backgroundColor: chipBg, borderColor: chipBorder, borderWidth: 1 }]}>
                <Text style={styles.chipIcon}>
                  {CATEGORY_ICONS[tx.kategori] || (isIncome ? '💰' : '📌')}
                </Text>
                <Text style={[styles.chipLabel, { color: chipColor }]} numberOfLines={1}>
                  {chipText}
                </Text>
                <Text style={[styles.chipAmount, { color: chipColor }]}>
                  {isIncome ? '+' : ''}{Math.abs(tx.tutar).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}₺
                </Text>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Filtre butonları */}
      <View style={styles.filterRow}>
        {([
          { key: 'gelir', dot: Colors.success, label: L ? 'Gelirler' : 'Income',   active: 'rgba(52,211,153,0.2)',  border: Colors.success, color: Colors.success },
          { key: 'gider', dot: Colors.danger, label: L ? 'Giderler' : 'Expenses', active: 'rgba(248,113,113,0.2)', border: Colors.danger,  color: Colors.danger  },
          { key: 'all',   dot: Colors.primary, label: L ? 'Tümü'     : 'All',       active: Colors.primary,          border: Colors.primary, color: '#fff'         },
        ] as const).map(f => {
          const isActive = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterBtn, isActive && { backgroundColor: f.active, borderColor: f.border }]}
              onPress={() => setFilter(f.key as any)}
            >
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: f.dot, marginBottom: 4 }} />
              <Text style={[styles.filterText, { color: isActive ? f.color : Colors.text }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Kayıt sayısı */}
      {filtered.length > 0 && (
        <Text style={styles.countText}>
          {L
            ? `📋 ${filter === 'all' ? 'Tüm' : filter === 'gelir' ? 'Gelir' : 'Gider'} İşlemler — ${filtered.length} kayıt`
            : `📋 ${filter === 'all' ? 'All' : filter === 'gelir' ? 'Income' : 'Expense'} Transactions — ${filtered.length} records`}
        </Text>
      )}

      {/* Liste */}
      {filtered.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>{L ? 'Henüz işlem yok' : 'No transactions yet'}</Text>
        </View>
      ) : (
        <>
          <View style={styles.tableHeader}>
            <Text style={[styles.thText, { flex: 1.2 }]}>{L ? 'TARİH' : 'DATE'}</Text>
            <Text style={[styles.thText, { flex: 1 }]}>{L ? 'KATEGORİ' : 'CATEGORY'}</Text>
            <Text style={[styles.thText, { flex: 2 }]}>{L ? 'AÇIKLAMA' : 'DESCRIPTION'}</Text>
            <Text style={[styles.thText, { flex: 1, textAlign: 'right' }]}>{L ? 'TUTAR' : 'AMOUNT'}</Text>
            <Text style={[styles.thText, { width: 56, textAlign: 'center' }]}>{L ? 'İŞLEM' : 'ACTION'}</Text>
          </View>

          {displayed.map((tx, i) => {
            const txId            = tx.local_id || String(tx.id);
            const isDeleting      = deleting === txId;
            const isIncome        = tx.tip === 'Gelir';
            const displayKategori = translateKategori(tx.kategori, lang);
            const displayDetay    = translateDetay(tx.detay || tx.kategori, lang);
            return (
              <View
                key={txId + i}
                style={[styles.row, i % 2 === 0 && styles.rowAlt, isDeleting && { opacity: 0.3 }]}
              >
                <Text style={[styles.cell, { flex: 1.2, fontSize: 11 }]} numberOfLines={1}>
                  {tx.tarih}
                </Text>
                <View style={{ flex: 1 }}>
                  <View style={[styles.catBadge, {
                    backgroundColor: isIncome ? 'rgba(52,211,153,0.12)' : 'rgba(124,110,250,0.12)',
                  }]}>
                    <Text style={[styles.catBadgeText, { color: isIncome ? Colors.success : Colors.primary }]} numberOfLines={1}>
                      {displayKategori}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.cell, { flex: 2 }]} numberOfLines={1}>
                  {displayDetay}
                </Text>
                <Text style={[styles.cell, {
                  flex: 1, textAlign: 'right', fontWeight: '800',
                  color: isIncome ? Colors.success : Colors.danger,
                }]} numberOfLines={1}>
                  {isIncome ? '+' : '-'}{Math.abs(tx.tutar).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}₺
                </Text>
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleEditOpen(tx)} disabled={isDeleting}>
                    <Text style={{ fontSize: 15 }}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(tx)} disabled={isDeleting}>
                    <Text style={{ fontSize: 15 }}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {filtered.length > 8 && (
            <TouchableOpacity style={styles.expandBtn} onPress={() => setExpanded(!expanded)}>
              <Text style={styles.expandText}>
                {expanded
                  ? (L ? '▲ Daha Az Göster' : '▲ Show Less')
                  : (L ? `▼ Tümünü Gör (${filtered.length - 8} daha)` : `▼ Show All (${filtered.length - 8} more)`)}
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Düzenle Modal */}
      <Modal visible={editModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {L ? '✏️ İşlemi Düzenle' : '✏️ Edit Transaction'}
            </Text>

            {editTx && (
              <View style={styles.editInfoRow}>
                <View style={[styles.catBadge, {
                  backgroundColor: editTx.tip === 'Gelir' ? 'rgba(52,211,153,0.15)' : 'rgba(124,110,250,0.15)',
                }]}>
                  <Text style={[styles.catBadgeText, { color: editTx.tip === 'Gelir' ? Colors.success : Colors.primary }]}>
                    {translateKategori(editTx.kategori, lang)}
                  </Text>
                </View>
                <Text style={styles.editDate}>{editTx.tarih}</Text>
              </View>
            )}

            <Text style={styles.modalLabel}>{L ? 'Açıklama' : 'Description'}</Text>
            <TextInput
              style={styles.modalInput}
              value={editDetay}
              onChangeText={setEditDetay}
              placeholder={L ? 'Açıklama girin' : 'Enter description'}
              placeholderTextColor={Colors.textLight}
              color={Colors.text}
            />

            <Text style={styles.modalLabel}>{L ? 'Tutar (₺)' : 'Amount (₺)'}</Text>
            <TextInput
              style={styles.modalInput}
              value={editTutar}
              onChangeText={setEditTutar}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={Colors.textLight}
              color={Colors.text}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border }]}
                onPress={() => { setEditModal(false); setEditTx(null); }}
                disabled={saving}
              >
                <Text style={{ color: Colors.textMuted, fontWeight: '600' }}>
                  {L ? 'İptal' : 'Cancel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: saving ? Colors.textLight : Colors.primary }]}
                onPress={handleEditSave}
                disabled={saving}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>
                  {saving ? (L ? 'Kaydediliyor...' : 'Saving...') : (L ? 'Kaydet' : 'Save')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const make_styles = (C: any) => StyleSheet.create({
  container:    { backgroundColor: C.bgCard, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: C.border, ...Shadow.sm },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title:        { fontSize: 15, fontWeight: '800', color: C.text },
  seeAll:       { fontSize: 13, color: C.primary, fontWeight: '600' },

  chipScroll:   { marginBottom: 12 },
  chip:         { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, marginRight: 8, gap: 5 },
  chipIcon:     { fontSize: 15 },
  chipLabel:    { fontSize: 13, fontWeight: '700' },
  chipAmount:   { fontSize: 13, fontWeight: '800' },

  filterRow:    { flexDirection: 'row', gap: 8, marginBottom: 10 },
  filterBtn:    { flex: 1, paddingVertical: 10, paddingHorizontal: 4, borderRadius: 10, backgroundColor: C.bgInput, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: C.borderLight, minHeight: 48, overflow: 'hidden' },
  filterEmoji:  { fontSize: 16, marginBottom: 2 },
  filterText:   { fontSize: 11, fontWeight: '700' },

  countText:    { fontSize: 12, color: C.textMuted, marginBottom: 8, fontWeight: '600' },

  emptyBox:     { alignItems: 'center', paddingVertical: 20 },
  emptyText:    { fontSize: 14, color: C.textLight },

  tableHeader:  { flexDirection: 'row', paddingHorizontal: 6, paddingVertical: 6, backgroundColor: C.bgElevated, borderRadius: 8, marginBottom: 4 },
  thText:       { fontSize: 10, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase' },

  row:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  rowAlt:       { backgroundColor: 'rgba(124,110,250,0.04)' },
  cell:         { fontSize: 12, color: C.text },

  catBadge:     { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  catBadgeText: { fontSize: 10, fontWeight: '700' },

  actions:      { width: 56, flexDirection: 'row', justifyContent: 'flex-end', gap: 2 },
  actionBtn:    { padding: 4 },

  expandBtn:    { alignItems: 'center', paddingVertical: 12 },
  expandText:   { fontSize: 13, color: C.primary, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox:     { backgroundColor: C.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderTopWidth: 1, borderColor: C.border },
  modalTitle:   { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 16 },
  editInfoRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  editDate:     { fontSize: 13, color: C.textMuted },
  modalLabel:   { fontSize: 13, fontWeight: '600', color: C.textMuted, marginBottom: 6 },
  modalInput:   { backgroundColor: C.bgInput, borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 14, color: C.text },
  modalBtns:    { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalBtn:     { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
});
