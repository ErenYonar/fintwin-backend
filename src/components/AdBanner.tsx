// src/components/AdBanner.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Linking, ActivityIndicator, Image,
} from 'react-native';
import { useColors } from '../utils/theme';
import { BASE_URL } from '../services/api';

interface Ad {
  id: number;
  baslik: string;
  gorsel_url: string;
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
      // Reklam yüklenemedi
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
  if (!ad || !ad.aktif || !ad.gorsel_url) {
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

  // Tam genişlik görsel banner
  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => ad.link && Linking.openURL(ad.link)}
        style={styles.banner}
      >
        <Image
          source={{ uri: ad.gorsel_url }}
          style={styles.image}
          resizeMode="cover"
        />
      </TouchableOpacity>
      <TouchableOpacity style={styles.closeBtn} onPress={() => setDismissed(true)}>
        <Text style={styles.closeBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const make_styles = (C: any) => StyleSheet.create({
  placeholder: {
    marginVertical: 8,
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
  wrapper: {
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  banner: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '700',
  },
});
