// src/components/AccountActionsWidget.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, TextInput, ActivityIndicator,
} from 'react-native';
import { useStore } from '../store/useStore';
import {useColors,  Colors, Radius, Shadow, Spacing } from '../utils/theme';

export default function AccountActionsWidget({ lang }: { lang: string }) {
  const Colors = useColors();
  const styles = make_styles(Colors);
  const { logout, sendFeedback } = useStore();
  const [feedback, setFeedback] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [sent,     setSent]     = useState(false);
  const [open,     setOpen]     = useState(false);
  const L = lang === 'TR';

  const handleLogout = () => {
    Alert.alert(
      L ? 'Çıkış Yap' : 'Sign Out',
      L ? 'Çıkış yapmak istiyor musunuz?' : 'Do you want to sign out?',
      [
        { text: L ? 'İptal' : 'Cancel', style: 'cancel' },
        {
          text: L ? 'Çıkış' : 'Sign Out', style: 'destructive',
          onPress: async () => {
            try { await logout(); } catch (e) { console.error('Logout error:', e); }
          },
        },
      ]
    );
  };

  const handleSend = async () => {
    if (!feedback.trim()) return;
    setLoading(true);
    try {
      await sendFeedback(feedback.trim());
      setFeedback('');
      setSent(true);
      setTimeout(() => { setSent(false); setOpen(false); }, 2500);
    } catch {
      Alert.alert(L ? 'Hata' : 'Error', L ? 'Gönderilemedi.' : 'Could not send.');
    } finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.feedbackBtn, open && styles.feedbackBtnOpen]}
          onPress={() => setOpen(!open)}
          activeOpacity={0.8}
        >
          <Text style={[styles.feedbackBtnText, open && { color: Colors.primary }]}>
            {open ? (L ? '▲ Kapat' : '▲ Close') : (L ? '💬 Öneri / Geri Bildirim' : '💬 Feedback')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>{L ? '🚪 Çıkış' : '🚪 Sign Out'}</Text>
        </TouchableOpacity>
      </View>

      {open && (
        <View style={styles.feedbackBox}>
          {sent ? (
            <View style={styles.sentBox}>
              <Text style={styles.sentText}>
                ✅ {L ? 'Gönderildi! Teşekkürler.' : 'Sent! Thank you.'}
              </Text>
            </View>
          ) : (
            <>
              <TextInput
                style={styles.input}
                value={feedback}
                onChangeText={setFeedback}
                placeholder={L ? 'Mesajınızı yazın...' : 'Write your message...'}
                placeholderTextColor={Colors.textLight}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                editable={!loading}
                color={Colors.text}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!feedback.trim() || loading) && { opacity: 0.4 }]}
                onPress={handleSend}
                disabled={!feedback.trim() || loading}
                activeOpacity={0.8}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.sendBtnText}>{L ? '📤 Gönder' : '📤 Send'}</Text>
                }
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const make_styles = (C: any) => StyleSheet.create({
  container: { marginBottom: Spacing.lg },
  row:       { flexDirection: 'row', gap: 10 },

  feedbackBtn: {
    flex: 1, backgroundColor: 'rgba(124,110,250,0.1)',
    borderRadius: Radius.lg, paddingVertical: 13, alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(124,110,250,0.3)',
  },
  feedbackBtnOpen: { backgroundColor: 'rgba(124,110,250,0.2)', borderColor: C.primary },
  feedbackBtnText: { fontSize: 13, fontWeight: '700', color: C.primary },

  logoutBtn: {
    flex: 1, backgroundColor: C.bgCard,
    borderRadius: Radius.lg, paddingVertical: 13, alignItems: 'center',
    borderWidth: 1.5, borderColor: C.danger,
  },
  logoutText: { fontSize: 13, fontWeight: '700', color: C.danger },

  feedbackBox: {
    marginTop: 10, backgroundColor: C.bgElevated,
    borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: C.border,
  },
  input: {
    backgroundColor: C.bgInput, borderWidth: 1.5, borderColor: C.border,
    borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, minHeight: 72, textAlignVertical: 'top', marginBottom: 10,
  },
  sendBtn:     { backgroundColor: C.primary, borderRadius: Radius.md, paddingVertical: 12, alignItems: 'center' },
  sendBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  sentBox:     { backgroundColor: 'rgba(52,211,153,0.15)', borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(52,211,153,0.3)' },
  sentText:    { fontSize: 14, fontWeight: '800', color: C.success },
});
