// src/components/BottomActionsWidget.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ActivityIndicator,
} from 'react-native';
import { useStore } from '../store/useStore';
import { UserAPI } from '../services/api';
import { Colors, Radius, Shadow } from '../utils/theme';

export default function BottomActionsWidget({ lang }: { lang: string }) {
  const { logout } = useStore();
  const [feedback, setFeedback] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [open,     setOpen]     = useState(false);

  const handleLogout = () => {
    Alert.alert(
      lang === 'TR' ? 'Çıkış Yap' : 'Sign Out',
      lang === 'TR' ? 'Çıkış yapmak istiyor musunuz?' : 'Do you want to sign out?',
      [
        { text: lang === 'TR' ? 'İptal' : 'Cancel', style: 'cancel' },
        { text: lang === 'TR' ? 'Çıkış Yap' : 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleSendFeedback = async () => {
    if (!feedback.trim()) return;
    setLoading(true);
    try {
      await UserAPI.sendFeedback(feedback.trim(), lang);
      setFeedback('');
      setOpen(false);
      Alert.alert(
        lang === 'TR' ? 'Teşekkürler!' : 'Thank you!',
        lang === 'TR' ? 'Geri bildiriminiz alındı!' : 'Feedback received!'
      );
    } catch {
      Alert.alert(
        lang === 'TR' ? 'Hata' : 'Error',
        lang === 'TR' ? 'Gönderilemedi.' : 'Could not send.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Geri Bildirim */}
      <TouchableOpacity style={styles.feedbackBtn} onPress={() => setOpen(!open)}>
        <Text style={styles.feedbackBtnText}>
          {open
            ? (lang === 'TR' ? '✕ Kapat' : '✕ Close')
            : (lang === 'TR' ? '💬 Öneri / Geri Bildirim' : '💬 Feedback / Suggestion')}
        </Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.feedbackBox}>
          <TextInput
            style={styles.input}
            value={feedback}
            onChangeText={setFeedback}
            placeholder={lang === 'TR' ? 'Mesajınızı yazın...' : 'Write your message...'}
            placeholderTextColor={Colors.textLight}
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!feedback.trim() || loading) && { opacity: 0.5 }]}
            onPress={handleSendFeedback}
            disabled={!feedback.trim() || loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.sendBtnText}>
                  {lang === 'TR' ? '📨 Gönder' : '📨 Send'}
                </Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* Çıkış Yap */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>
          {lang === 'TR' ? '🚪 Çıkış Yap' : '🚪 Sign Out'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { marginBottom: 16 },
  feedbackBtn:    { backgroundColor: '#EEF2FF', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 8 },
  feedbackBtnText:{ fontSize: 14, fontWeight: '700', color: Colors.primary },
  feedbackBox:    { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, ...Shadow.sm },
  input:          { backgroundColor: '#F8F9FF', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, fontSize: 14, color: Colors.text, minHeight: 80, textAlignVertical: 'top', marginBottom: 10 },
  sendBtn:        { backgroundColor: Colors.primary, borderRadius: 10, padding: 14, alignItems: 'center' },
  sendBtnText:    { color: '#fff', fontSize: 14, fontWeight: '700' },
  logoutBtn:      { backgroundColor: '#FEE2E2', borderRadius: 12, padding: 14, alignItems: 'center' },
  logoutText:     { fontSize: 14, fontWeight: '700', color: '#991B1B' },
});
