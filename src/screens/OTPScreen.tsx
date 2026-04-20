// src/screens/OTPScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Alert, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';

import { useStore } from '../store/useStore';
import { AuthAPI } from '../services/api';
import { Button } from '../components/UI';
import { useColors, Colors, Spacing, Radius, Typography, Shadow } from '../utils/theme';
import { useTranslation } from '../hooks/useTranslation';

const OTP_EXPIRE = 300;

export default function OTPScreen() {
  const Colors = useColors();
  const styles = make_styles(Colors);
  const { t, lang } = useTranslation();
  const navigation  = useNavigation<any>();
  const route       = useRoute<any>();
  const { email, mode } = route.params;

  const [code, setCode]           = useState('');
  const [remaining, setRemaining] = useState(OTP_EXPIRE);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<TextInput>(null);

  const { verifyOtp } = useStore();

  // ── Deep link dinleyici ──────────────────────────────────────────
  useEffect(() => {
    // Uygulama açıkken gelen deep link
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Uygulama kapalıyken deep link ile açıldıysa
    Linking.getInitialURL().then(url => {
      if (url) handleDeepLink(url);
    });

    return () => subscription.remove();
  }, []);

  const handleDeepLink = (url: string) => {
    try {
      const parsed = Linking.parse(url);
      // fintwin://verify?code=123456&email=...
      if (parsed.path === 'verify' && parsed.queryParams?.code) {
        const deepCode = parsed.queryParams.code as string;
        setCode(deepCode);
        // Otomatik doğrula
        setTimeout(() => autoVerify(deepCode), 500);
      }
    } catch (e) {
      console.log('Deep link parse hatası:', e);
    }
  };

  const autoVerify = async (deepCode: string) => {
    if (deepCode.length !== 6) return;
    setVerifying(true);
    try {
      await verifyOtp(email, deepCode);
    } catch (err: any) {
      const msg = err.response?.data?.detail || t.otp_wrong;
      Alert.alert(t.error, msg);
      setCode('');
    } finally {
      setVerifying(false);
    }
  };
  // ────────────────────────────────────────────────────────────────

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setRemaining(r => Math.max(0, r - 1));
    }, 1000);
    inputRef.current?.focus();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert(t.error, 'Lütfen 6 haneli kodu girin.');
      return;
    }
    if (remaining === 0) {
      Alert.alert(t.error, t.otp_expired);
      return;
    }
    setVerifying(true);
    try {
      await verifyOtp(email, code);
    } catch (err: any) {
      const msg = err.response?.data?.detail || t.otp_wrong;
      Alert.alert(t.error, msg);
      setCode('');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await AuthAPI.resendOtp(email, lang);
      setRemaining(OTP_EXPIRE);
      setCode('');
      Alert.alert(t.success, lang === 'TR' ? 'Yeni kod gönderildi.' : 'New code sent.');
    } catch (err: any) {
      Alert.alert(t.error, err.response?.data?.detail || 'Kod gönderilemedi.');
    } finally {
      setResending(false);
    }
  };

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const timerColor = remaining <= 60 ? Colors.danger : Colors.primary;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.header}>
          <Text style={styles.headerEmoji}>🏦</Text>
          <Text style={styles.headerTitle}>FinTwin</Text>
          <Text style={styles.headerSub}>{t.otp_title}</Text>
        </LinearGradient>

        {/* Email göster */}
        <View style={styles.emailBanner}>
          <Text style={styles.emailLabel}>
            {lang === 'TR' ? '📧 Doğrulama kodu gönderildi:' : '📧 Verification code sent to:'}
          </Text>
          <Text style={styles.emailText}>{email}</Text>
          <Text style={styles.emailHint}>
            {lang === 'TR'
              ? 'Gelen kutusu ve spam klasörünü kontrol edin. Maildeki butona tıklayarak otomatik doğrulama yapabilirsiniz.'
              : 'Check your inbox and spam folder. Tap the button in the email to verify automatically.'}
          </Text>
        </View>

        {/* Timer */}
        <View style={[styles.timerBox, { borderColor: timerColor }]}>
          <Text style={{ fontSize: 20, marginRight: 8 }}>⏱</Text>
          <Text style={[styles.timerText, { color: timerColor }]}>
            {remaining > 0
              ? `${minutes}:${seconds.toString().padStart(2, '0')}`
              : (lang === 'TR' ? 'Süre doldu' : 'Expired')}
          </Text>
        </View>

        {/* OTP input */}
        <View style={styles.otpWrapper}>
          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={v => setCode(v.replace(/\D/g, '').slice(0, 6))}
            placeholder="• • • • • •"
            placeholderTextColor={Colors.textLight}
            keyboardType="number-pad"
            maxLength={6}
            style={styles.otpInput}
          />
        </View>

        {/* Butonlar */}
        <Button
          title={t.otp_verify_btn}
          onPress={handleVerify}
          loading={verifying}
          disabled={remaining === 0 || code.length !== 6}
          fullWidth
          style={{ marginBottom: Spacing.sm }}
        />
        <TouchableOpacity
          onPress={handleResend}
          disabled={resending}
          activeOpacity={0.8}
          style={{ paddingVertical: 14, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center' }}
        >
          {resending
            ? <ActivityIndicator size="small" color={Colors.primary} />
            : <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.text }}>{t.otp_resend_btn}</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>
            {lang === 'TR' ? '← Geri Dön' : '← Go Back'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const make_styles = (C: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, padding: Spacing.xl },
  header: {
    borderRadius: Radius.xl, padding: Spacing.xl,
    alignItems: 'center', marginBottom: Spacing.lg, ...Shadow.lg,
  },
  headerEmoji: { fontSize: 36, marginBottom: 6 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerSub:   { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  emailBanner: {
    backgroundColor: 'rgba(124,110,250,0.1)',
    borderWidth: 1.5, borderColor: C.primary,
    borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.lg,
  },
  emailLabel: { fontSize: 13, fontWeight: '600', color: C.primary, marginBottom: 4 },
  emailText:  { fontSize: 15, fontWeight: '800', color: C.text },
  emailHint:  { fontSize: 12, color: C.textMuted, marginTop: 4, lineHeight: 18 },
  timerBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderRadius: Radius.lg, padding: Spacing.md,
    marginBottom: Spacing.lg, backgroundColor: C.bgElevated,
  },
  timerText:  { fontSize: 18, fontWeight: '700' },
  otpWrapper: { marginBottom: Spacing.xl },
  otpInput: {
    backgroundColor: 'rgba(124,110,250,0.1)',
    borderWidth: 2, borderColor: C.primary,
    borderRadius: Radius.lg, padding: Spacing.xl,
    fontSize: 32, fontWeight: '800', color: C.primary,
    textAlign: 'center', letterSpacing: 12, ...Shadow.md,
  },
  backBtn:  { marginTop: Spacing.xl, alignItems: 'center' },
  backText: { fontSize: 14, color: C.primary, fontWeight: '600' },
});
