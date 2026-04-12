// src/utils/theme.ts
export const Colors = {
  // Ana renkler
  primary:   '#7C6EFA',   // Canlı mor-indigo
  violet:    '#A78BFA',   // Açık violet
  accent:    '#F472B6',   // Pink accent
  success:   '#34D399',   // Yeşil
  danger:    '#F87171',   // Kırmızı
  warning:   '#FBBF24',   // Sarı

  // Dark arka planlar
  bg:        '#0F0F1A',   // En koyu — sayfa zemini
  bgCard:    '#1A1A2E',   // Kart zemini
  bgElevated:'#242438',   // Yükseltilmiş kart
  bgInput:   '#1E1E32',   // Input zemini

  // Eski isimleri koru (geriye uyumluluk)
  card:      '#1A1A2E',
  border:    '#2E2E4A',
  borderLight:'#3A3A5C',

  // Metin
  text:      '#F0EEFF',   // Neredeyse beyaz, hafif mor
  textMuted: '#9B97C3',   // Soluk mor-gri
  textLight: '#5C5880',   // Çok soluk

  // Özel
  income:    '#34D399',
  expense:   '#F87171',
};

export const Gradients = {
  primary:  ['#7C6EFA', '#A78BFA'] as [string, string],
  violet:   ['#6D28D9', '#7C3AED'] as [string, string],
  success:  ['#059669', '#34D399'] as [string, string],
  danger:   ['#DC2626', '#F87171'] as [string, string],
  warning:  ['#D97706', '#FBBF24'] as [string, string],
  dark:     ['#1A1A2E', '#242438'] as [string, string],
  card:     ['#1E1E35', '#252542'] as [string, string],
};

export const Spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32,
};

export const Radius = {
  sm: 10, md: 14, lg: 18, xl: 22, full: 999,
};

export const Typography = {
  h1: { fontSize: 28, fontWeight: '800' as const, color: Colors.text, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' as const, color: Colors.text, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  h4: { fontSize: 15, fontWeight: '600' as const, color: Colors.text },
  body: { fontSize: 14, fontWeight: '400' as const, color: Colors.text },
  caption: { fontSize: 12, fontWeight: '400' as const, color: Colors.textMuted },
  label: { fontSize: 13, fontWeight: '600' as const, color: Colors.textMuted },
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#7C6EFA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#7C6EFA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
};
