// src/components/UI.tsx
import React from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors, Spacing, Radius, Shadow, Gradients } from '../utils/theme';

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
  const Colors = useColors();
  const gradMap = {
    primary:   Gradients.primary,
    secondary: ['#1E1E35', '#2A2A45'] as [string, string],
    danger:    Gradients.danger,
    success:   Gradients.success,
  };
  const textColor = variant === 'secondary' ? Colors.textMuted : '#fff';
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.8} style={[fullWidth && { width: '100%' }, style]}>
      <LinearGradient colors={gradMap[variant]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[btnStyles.btn, Shadow.md, (disabled || loading) && { opacity: 0.4 }]}>
        {loading
          ? <ActivityIndicator color={textColor} size="small" />
          : <Text style={[btnStyles.btnText, { color: textColor }]}>{title}</Text>}
      </LinearGradient>
    </TouchableOpacity>
  );
}
const btnStyles = StyleSheet.create({
  btn: { borderRadius: Radius.md, paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', minHeight: 50 },
  btnText: { fontSize: 15, fontWeight: '700' },
});

// ── Card ─────────────────────────────────────────────────────────
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const Colors = useColors();
  return (
    <View style={[{ backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border }, Shadow.sm, style]}>
      {children}
    </View>
  );
}

// ── MetricCard ───────────────────────────────────────────────────
interface MetricCardProps { title: string; value: string; icon: string; color: 'success' | 'danger' | 'primary' | 'warning'; }

export function MetricCard({ title, value, icon, color }: MetricCardProps) {
  const Colors = useColors();
  const colorMap = {
    success: { border: Colors.success, bg: 'rgba(52,211,153,0.12)',  text: Colors.success },
    danger:  { border: Colors.danger,  bg: 'rgba(248,113,113,0.12)', text: Colors.danger  },
    primary: { border: Colors.primary, bg: 'rgba(124,110,250,0.12)', text: Colors.primary },
    warning: { border: Colors.warning, bg: 'rgba(251,191,36,0.12)',  text: Colors.warning },
  };
  const c = colorMap[color];
  return (
    <Card style={[{ flex: 1, margin: Spacing.xs }, { borderLeftColor: c.border, borderLeftWidth: 3 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{title}</Text>
          <Text style={{ fontSize: 22, fontWeight: '800', letterSpacing: -0.5, color: c.text }}>{value}</Text>
        </View>
        <View style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg }}>
          <Text style={{ fontSize: 22 }}>{icon}</Text>
        </View>
      </View>
    </Card>
  );
}

// ── ScoreCard ────────────────────────────────────────────────────
export function ScoreCard({ score, label }: { score: number; label: string }) {
  const Colors = useColors();
  const color  = score >= 80 ? Colors.success : score >= 60 ? Colors.primary : score >= 40 ? Colors.warning : Colors.danger;
  const status = score >= 80 ? '🌟 Mükemmel' : score >= 60 ? '👍 İyi' : score >= 40 ? '😐 Orta' : '😟 Zayıf';
  return (
    <Card style={{ alignItems: 'center', margin: Spacing.xs }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</Text>
      <Text style={{ fontSize: 36, fontWeight: '900', marginVertical: 6, color }}>{score}</Text>
      <View style={{ borderWidth: 1.5, borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 4, marginTop: 4, borderColor: color }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color }}>{status}</Text>
      </View>
    </Card>
  );
}

// ── Input ────────────────────────────────────────────────────────
interface InputProps {
  label?: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; keyboardType?: 'default' | 'email-address' | 'numeric' | 'number-pad';
  secureTextEntry?: boolean; autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  style?: ViewStyle; maxLength?: number;
}
export function Input({ label, value, onChangeText, placeholder, keyboardType, secureTextEntry, autoCapitalize, style, maxLength }: InputProps) {
  const Colors = useColors();
  return (
    <View style={[{ marginBottom: Spacing.md }, style]}>
      {label && <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.textMuted, marginBottom: 6 }}>{label}</Text>}
      <TextInput
        value={value} onChangeText={onChangeText} placeholder={placeholder}
        placeholderTextColor={Colors.textLight} keyboardType={keyboardType}
        secureTextEntry={secureTextEntry} autoCapitalize={autoCapitalize || 'none'}
        maxLength={maxLength}
        style={{ backgroundColor: Colors.bgInput, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.text, minHeight: 50 }}
      />
    </View>
  );
}

// ── SectionHeader ────────────────────────────────────────────────
export function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  const Colors = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: Spacing.sm }}>
      <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.text }}>{title}</Text>
      {right}
    </View>
  );
}

// ── Divider ──────────────────────────────────────────────────────
export function Divider({ style }: { style?: ViewStyle }) {
  const Colors = useColors();
  return <View style={[{ height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm }, style]} />;
}

// ── Badge ────────────────────────────────────────────────────────
export function Badge({ text, type }: { text: string; type: 'income' | 'expense' }) {
  const Colors = useColors();
  const bg  = type === 'income' ? 'rgba(52,211,153,0.15)'  : 'rgba(248,113,113,0.15)';
  const clr = type === 'income' ? Colors.success : Colors.danger;
  return (
    <View style={{ borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: bg }}>
      <Text style={{ fontSize: 11, fontWeight: '600', color: clr }}>{text}</Text>
    </View>
  );
}

// ── EmptyState ───────────────────────────────────────────────────
export function EmptyState({ emoji, title, subtitle }: { emoji: string; title: string; subtitle?: string }) {
  const Colors = useColors();
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', padding: Spacing.xxxl }}>
      <Text style={{ fontSize: 48, marginBottom: 12 }}>{emoji}</Text>
      <Text style={{ fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8, color: Colors.text }}>{title}</Text>
      {subtitle && <Text style={{ fontSize: 14, textAlign: 'center', color: Colors.textMuted, lineHeight: 20 }}>{subtitle}</Text>}
    </View>
  );
}

// ── SyncBanner ───────────────────────────────────────────────────
export function SyncBanner({ syncing, offline }: { syncing: boolean; offline: boolean }) {
  const Colors = useColors();
  if (!syncing && !offline) return null;
  const bg  = offline ? 'rgba(251,191,36,0.15)' : 'rgba(124,110,250,0.15)';
  const clr = offline ? Colors.warning : Colors.primary;
  const msg = offline ? '📵 Çevrimdışı — veriler kaydedildi' : '🔄 Senkronize ediliyor...';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: Radius.md, marginBottom: Spacing.sm, borderWidth: 1, backgroundColor: bg, borderColor: clr }}>
      {syncing && <ActivityIndicator size="small" color={clr} style={{ marginRight: 8 }} />}
      <Text style={{ fontSize: 13, fontWeight: '600', color: clr }}>{msg}</Text>
    </View>
  );
}
