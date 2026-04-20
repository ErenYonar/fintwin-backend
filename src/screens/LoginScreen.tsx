// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

import { useStore } from '../store/useStore';
import { Button, Input } from '../components/UI';
import { useColors, Colors, Spacing, Radius, Typography, Shadow } from '../utils/theme';
import { useTranslation } from '../hooks/useTranslation';

const LOGO_DARK  = require('../../assets/logo-dark.png');
const LOGO_LIGHT = require('../../assets/logo.png');

export default function LoginScreen() {
  const Colors = useColors();
  const styles = make_styles(Colors);
  const { t, lang } = useTranslation();
  const { setLang, themeMode, setThemeMode } = useStore();
  const navigation = useNavigation<any>();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useStore();

  const handleLogin = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert(t.error, 'Geçerli bir e-posta girin.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), lang);
      navigation.navigate('OTP', { email: email.trim(), mode: 'login' });
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Bir hata oluştu.';
      Alert.alert(t.error, msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Üst butonlar - Dil + Tema */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginBottom: Spacing.xl }}>
          {/* Tema butonu */}
          <TouchableOpacity
            style={[styles.langBtn, { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border }]}
            onPress={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
          >
            <Text style={[styles.langText, { color: Colors.text }]}>
              {themeMode === 'dark' ? '☀️' : '🌙'}
            </Text>
          </TouchableOpacity>
          {/* Dil butonu */}
          <TouchableOpacity
            style={styles.langBtn}
            onPress={() => setLang(lang === 'TR' ? 'EN' : 'TR')}
          >
            <Text style={styles.langText}>{lang === 'TR' ? '🇬🇧 EN' : '🇹🇷 TR'}</Text>
          </TouchableOpacity>
        </View>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={themeMode === 'dark' ? LOGO_DARK : LOGO_LIGHT}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{t.login_title}</Text>
          <Text style={styles.formCaption}>{t.login_caption}</Text>

          <Input
            label="E-posta"
            value={email}
            onChangeText={setEmail}
            placeholder={t.login_email_placeholder}
            keyboardType="email-address"
          />

          <Button
            title={t.login_btn}
            onPress={handleLogin}
            loading={loading}
            fullWidth
          />

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerLinkText}>
              {lang === 'TR' ? 'Hesabın yok mu? ' : "Don't have an account? "}
              <Text style={{ color: Colors.primary, fontWeight: '700' }}>
                {lang === 'TR' ? 'Kayıt Ol' : 'Sign Up'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const make_styles = (C: any) => StyleSheet.create({
  container: {
    flexGrow: 1, backgroundColor: C.bg,
    padding: Spacing.xl, justifyContent: 'center',
  },
  langBtn: {
    alignSelf: 'flex-end', backgroundColor: C.warning,
    borderRadius: Radius.full, paddingHorizontal: 16, paddingVertical: 8,
    marginBottom: Spacing.xl, ...Shadow.sm,
  },
  langText: { fontWeight: '800', fontSize: 14, color: '#1E293B' },
  logoContainer: {
    borderRadius: Radius.xl, padding: Spacing.lg,
    alignItems: 'center', marginBottom: Spacing.xl,
    backgroundColor: 'transparent',
  },
  logoImage:    { width: 280, height: 280, marginBottom: 4 },
  logoEmoji:    { fontSize: 48, marginBottom: 8 },
  logoText:     { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  logoSubtitle: { fontSize: 15, marginTop: 2, fontWeight: '600' },
  formCard: {
    backgroundColor: C.bgCard, borderRadius: Radius.xl,
    padding: Spacing.xl, ...Shadow.md,
    borderWidth: 1, borderColor: C.border,
  },
  formTitle:        { ...Typography.h2, marginBottom: 4, color: C.textMuted },
  formCaption:      { ...Typography.body, color: C.textMuted, marginBottom: Spacing.xl },
  registerLink:     { marginTop: Spacing.lg, alignItems: 'center' },
  registerLinkText: { fontSize: 14, color: C.textMuted },
});
