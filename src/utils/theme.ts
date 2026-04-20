// src/utils/theme.ts
import { useStore } from '../store/useStore';

// ── DARK TEMA ─────────────────────────────────────────────────────────────────
export const DarkColors = {
  primary:    '#7C6EFA',
  violet:     '#A78BFA',
  accent:     '#F472B6',
  success:    '#34D399',
  danger:     '#F87171',
  warning:    '#FBBF24',
  bg:         '#0F0F1A',
  bgCard:     '#1A1A2E',
  bgElevated: '#242438',
  bgInput:    '#1E1E32',
  card:       '#1A1A2E',
  border:     '#2E2E4A',
  borderLight:'#3A3A5C',
  text:       '#F0EEFF',
  textMuted:  '#9B97C3',
  textLight:  '#5C5880',
  income:     '#34D399',
  expense:    '#F87171',
};

// ── LIGHT TEMA ────────────────────────────────────────────────────────────────
export const LightColors = {
  primary:    '#6366F1',   // Canlı indigo
  violet:     '#8B5CF6',   // Mor
  accent:     '#EC4899',   // Pembe
  success:    '#10B981',   // Yeşil
  danger:     '#EF4444',   // Kırmızı
  warning:    '#F97316',   // Turuncu
  bg:         '#FAF5FF',   // Açık lavanta arka plan
  bgCard:     '#FFFFFF',   // Beyaz kart
  bgElevated: '#F0EBFF',   // Açık mor elevated
  bgInput:    '#F5F0FF',   // Input arka planı
  card:       '#FFFFFF',
  border:     '#E4D9FF',   // Hafif mor border
  borderLight:'#EDE5FF',
  text:       '#1E1B4B',   // Koyu lacivert
  textMuted:  '#5B52A0',   // Orta mor-gri
  textLight:  '#9B90C8',   // Açık mor
  income:     '#10B981',
  expense:    '#EF4444',
};

// ── Statik Colors (geriye uyumluluk) ──────────────────────────────────────────
export let Colors = { ...DarkColors };

export function applyTheme(mode: 'dark' | 'light') {
  const src = mode === 'dark' ? DarkColors : LightColors;
  Object.keys(src).forEach(k => { (Colors as any)[k] = (src as any)[k]; });
}

// ── useColors hook ────────────────────────────────────────────────────────────
export function useColors() {
  const themeMode = useStore(s => s.themeMode);
  return themeMode === 'light' ? LightColors : DarkColors;
}

export const Gradients = {
  primary:  ['#7C6EFA', '#A78BFA'] as [string, string],
  violet:   ['#6D28D9', '#7C3AED'] as [string, string],
  success:  ['#059669', '#34D399'] as [string, string],
  danger:   ['#DC2626', '#F87171'] as [string, string],
  warning:  ['#D97706', '#FBBF24'] as [string, string],
  dark:     ['#1A1A2E', '#242438'] as [string, string],
  card:     ['#1E1E35', '#252542'] as [string, string],
};

export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
export const Radius  = { sm: 10, md: 14, lg: 18, xl: 22, full: 999 };

export const Typography = {
  h1: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '700' as const },
  h4: { fontSize: 15, fontWeight: '600' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
  label: { fontSize: 13, fontWeight: '600' as const },
};

export const Shadow = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  md: { shadowColor: '#7C6EFA', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6 },
  lg: { shadowColor: '#7C6EFA', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
};
