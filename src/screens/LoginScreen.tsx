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
import { Colors, Spacing, Radius, Typography, Shadow } from '../utils/theme';
import { useTranslation } from '../hooks/useTranslation';

export default function LoginScreen() {
  const { t, lang } = useTranslation();
  const { setLang } = useStore();
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
        {/* Dil butonu */}
        <TouchableOpacity
          style={styles.langBtn}
          onPress={() => setLang(lang === 'TR' ? 'EN' : 'TR')}
        >
          <Text style={styles.langText}>{lang === 'TR' ? '🇬🇧 EN' : '🇹🇷 TR'}</Text>
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>FinTwin</Text>
          <Text style={styles.logoSubtitle}>{t.app_subtitle}</Text>
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

const styles = StyleSheet.create({
  container: {
    flexGrow: 1, backgroundColor: Colors.bg,
    padding: Spacing.xl, justifyContent: 'center',
  },
  langBtn: {
    alignSelf: 'flex-end', backgroundColor: Colors.warning,
    borderRadius: Radius.full, paddingHorizontal: 16, paddingVertical: 8,
    marginBottom: Spacing.xl, ...Shadow.sm,
  },
  langText: { fontWeight: '800', fontSize: 14, color: '#1E293B' },
  logoContainer: {
    borderRadius: Radius.xl, padding: Spacing.xxxl,
    alignItems: 'center', marginBottom: Spacing.xl,
    backgroundColor: '#000000',
    borderWidth: 1, borderColor: 'rgba(124,110,250,0.2)',
    ...Shadow.lg,
  },
  logoImage:    { width: 110, height: 110, marginBottom: 12 },
  logoEmoji:    { fontSize: 48, marginBottom: 8 },
  logoText:     { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  logoSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  formCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.xl,
    padding: Spacing.xl, ...Shadow.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  formTitle:        { ...Typography.h2, marginBottom: 4 },
  formCaption:      { ...Typography.body, color: Colors.textMuted, marginBottom: Spacing.xl },
  registerLink:     { marginTop: Spacing.lg, alignItems: 'center' },
  registerLinkText: { fontSize: 14, color: Colors.textMuted },
});
