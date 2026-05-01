// src/components/AdBanner.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Linking, ActivityIndicator,
} from 'react-native';
import { useColors } from '../utils/theme';
import { BASE_URL } from '../services/api';

interface Ad {
  id: number;
  baslik: string;
  aciklama: string;
  link: string;
  konum: string;
  aktif: boolean;
}

interface Props {
  konum: 'home' | 'analysis' | 'statement';
  lang?: 'TR' | 'EN';
}

export default function AdBanner({ konum, lang = 'TR' }: Props) {
  const Colors = useColors();
  const styles = make_styles(Colors);
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchAd();
  }, [konum]);

  const fetchAd = async () => {
    try {
      const res = await fetch(`${BASE_URL}/ads/active?konum=${konum}`);
      if (res.ok) {
        const data = await res.json();
        setAd(data);
      }
    } catch {
      // Reklam yüklenemedi, placeholder göster
    } finally {
      setLoading(false);
    }
  };

  if (dismissed) return null;

  if (loading) {
    return (
      <View style={styles.placeholder}>
        <ActivityIndicator size="small" color={Colors.textMuted} />
      </View>
    );
  }

  // Reklam yoksa placeholder
  if (!ad || !ad.aktif) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          {lang === 'TR' ? '📢 Reklam Alanı' : '📢 Ad Space'}
        </Text>
        <Text style={styles.placeholderSub}>
          {lang === 'TR' ? 'Bu alan reklam için ayrılmıştır' : 'This space is reserved for ads'}
        </Text>
      </View>
    );
  }

  // Gerçek reklam
  return (
    <TouchableOpacity
      style={styles.banner}
      activeOpacity={0.85}
      onPress={() => ad.link && Linking.openURL(ad.link)}
    >
      <View style={styles.bannerLeft}>
        <View style={styles.adBadge}>
          <Text style={styles.adBadgeText}>{lang === 'TR' ? 'Reklam' : 'Ad'}</Text>
        </View>
        <Text style={styles.bannerTitle} numberOfLines={1}>{ad.baslik}</Text>
        <Text style={styles.bannerSub} numberOfLines={1}>{ad.aciklama}</Text>
      </View>
      <TouchableOpacity style={styles.closeBtn} onPress={() => setDismissed(true)}>
        <Text style={styles.closeBtnText}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const make_styles = (C: any) => StyleSheet.create({
  // Placeholder (reklam yokken)
  placeholder: {
    marginVertical: 8,
    marginHorizontal: 0,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: C.border,
    backgroundColor: C.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,
  },
  placeholderText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textMuted,
  },
  placeholderSub: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 2,
    opacity: 0.7,
  },

  // Gerçek banner
  banner: {
    marginVertical: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bgCard,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 64,
  },
  bannerLeft: {
    flex: 1,
    marginRight: 8,
  },
  adBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(124,110,250,0.15)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
  },
  adBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7C6EFA',
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
    marginBottom: 2,
  },
  bannerSub: {
    fontSize: 11,
    color: C.textMuted,
  },
  closeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 11,
    color: C.textMuted,
    fontWeight: '700',
  },
});
