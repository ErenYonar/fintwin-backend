// src/components/UI.tsx
import React from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius, Typography, Shadow, Gradients } from '../utils/theme';

// ── Button ───────────────────────────────────────────────────────
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({ title, onPress, variant = 'primary', loading, disabled, fullWidth, style }: ButtonProps) {
  const gradMap = {
    primary:   Gradients.primary,
    secondary: ['#1E1E35', '#2A2A45'] as [string, string],
    danger:    Gradients.danger,
    success:   Gradients.success,
  };
  const textColor = variant === 'secondary' ? Colors.textMuted : '#fff';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[fullWidth && { width: '100%' }, style]}
    >
      <LinearGradient
        colors={gradMap[variant]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.btn, Shadow.md, (disabled || loading) && { opacity: 0.4 }]}
      >
        {loading
          ? <ActivityIndicator color={textColor} size="small" />
          : <Text style={[styles.btnText, { color: textColor }]}>{title}</Text>
        }
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ── Card ─────────────────────────────────────────────────────────
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[styles.card, Shadow.sm, style]}>
      {children}
    </View>
  );
}

// ── MetricCard ───────────────────────────────────────────────────
interface MetricCardProps {
  title: string;
  value: string;
  icon: string;
  color: 'success' | 'danger' | 'primary' | 'warning';
}

export function MetricCard({ title, value, icon, color }: MetricCardProps) {
  const colorMap = {
    success: { border: Colors.success, bg: 'rgba(52,211,153,0.12)',  text: Colors.success },
    danger:  { border: Colors.danger,  bg: 'rgba(248,113,113,0.12)', text: Colors.danger  },
    primary: { border: Colors.primary, bg: 'rgba(124,110,250,0.12)', text: Colors.primary },
    warning: { border: Colors.warning, bg: 'rgba(251,191,36,0.12)',  text: Colors.warning },
  };
  const c = colorMap[color];
  return (
    <Card style={[styles.metricCard, { borderLeftColor: c.border, borderLeftWidth: 3 }]}>
      <View style={styles.metricRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.metricLabel}>{title}</Text>
          <Text style={[styles.metricValue, { color: c.text }]}>{value}</Text>
        </View>
        <View style={[styles.metricIcon, { backgroundColor: c.bg }]}>
          <Text style={{ fontSize: 22 }}>{icon}</Text>
        </View>
      </View>
    </Card>
  );
}

// ── ScoreCard ────────────────────────────────────────────────────
export function ScoreCard({ score, label }: { score: number; label: string }) {
  const color  = score >= 80 ? Colors.success : score >= 60 ? Colors.primary : score >= 40 ? Colors.warning : Colors.danger;
  const status = score >= 80 ? '🌟 Mükemmel' : score >= 60 ? '👍 İyi' : score >= 40 ? '😐 Orta' : '😟 Zayıf';
  return (
    <Card style={styles.scoreCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.scoreValue, { color }]}>{score}</Text>
      <View style={[styles.scoreBadge, { borderColor: color }]}>
        <Text style={[styles.scoreBadgeText, { color }]}>{status}</Text>
      </View>
    </Card>
  );
}

// ── Input ────────────────────────────────────────────────────────
interface InputProps {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'number-pad';
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  style?: ViewStyle;
  maxLength?: number;
}

export function Input({ label, value, onChangeText, placeholder, keyboardType, secureTextEntry, autoCapitalize, style, maxLength }: InputProps) {
  return (
    <View style={[{ marginBottom: Spacing.md }, style]}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textLight}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize || 'none'}
        maxLength={maxLength}
        style={styles.input}
      />
    </View>
  );
}

// ── SectionHeader ────────────────────────────────────────────────
export function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {right}
    </View>
  );
}

// ── Divider ──────────────────────────────────────────────────────
export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[styles.divider, style]} />;
}

// ── Badge ────────────────────────────────────────────────────────
export function Badge({ text, type }: { text: string; type: 'income' | 'expense' }) {
  const bg  = type === 'income' ? 'rgba(52,211,153,0.15)'  : 'rgba(248,113,113,0.15)';
  const clr = type === 'income' ? Colors.success : Colors.danger;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: clr }]}>{text}</Text>
    </View>
  );
}

// ── EmptyState ───────────────────────────────────────────────────
export function EmptyState({ emoji, title, subtitle }: { emoji: string; title: string; subtitle?: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={{ fontSize: 48, marginBottom: 12 }}>{emoji}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
    </View>
  );
}

// ── SyncBanner ───────────────────────────────────────────────────
export function SyncBanner({ syncing, offline }: { syncing: boolean; offline: boolean }) {
  if (!syncing && !offline) return null;
  const bg  = offline ? 'rgba(251,191,36,0.15)' : 'rgba(124,110,250,0.15)';
  const clr = offline ? Colors.warning : Colors.primary;
  const msg = offline ? '📵 Çevrimdışı — veriler kaydedildi' : '🔄 Senkronize ediliyor...';
  return (
    <View style={[styles.syncBanner, { backgroundColor: bg, borderColor: clr }]}>
      {syncing && <ActivityIndicator size="small" color={clr} style={{ marginRight: 8 }} />}
      <Text style={[styles.syncText, { color: clr }]}>{msg}</Text>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  btn: {
    borderRadius: Radius.md, paddingVertical: 14, paddingHorizontal: 20,
    alignItems: 'center', justifyContent: 'center', minHeight: 50,
  },
  btnText: { fontSize: 15, fontWeight: '700' },

  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  metricCard:   { flex: 1, margin: Spacing.xs },
  metricRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metricLabel:  { fontSize: 10, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  metricValue:  { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  metricIcon:   { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  scoreCard:      { alignItems: 'center', margin: Spacing.xs },
  scoreValue:     { fontSize: 36, fontWeight: '900', marginVertical: 6 },
  scoreBadge:     { borderWidth: 1.5, borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 4, marginTop: 4 },
  scoreBadgeText: { fontSize: 12, fontWeight: '700' },

  inputLabel: { fontSize: 13, fontWeight: '600', color: Colors.textMuted, marginBottom: 6 },
  input: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: Colors.text, minHeight: 50,
  },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: Spacing.sm },
  sectionTitle:  { fontSize: 15, fontWeight: '700', color: Colors.text },

  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },

  badge:     { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '600' },

  emptyState:    { alignItems: 'center', justifyContent: 'center', padding: Spacing.xxxl },
  emptyTitle:    { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8, color: Colors.text },
  emptySubtitle: { fontSize: 14, textAlign: 'center', color: Colors.textMuted, lineHeight: 20 },

  syncBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, paddingHorizontal: 16,
    borderRadius: Radius.md, marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  syncText: { fontSize: 13, fontWeight: '600' },
});
