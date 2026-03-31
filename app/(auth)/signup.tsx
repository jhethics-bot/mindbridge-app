/**
 * Signup Screen
 * Create patient or caregiver account.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MBButton } from '../../components/ui/MBButton';
import { COLORS } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import type { UserRole } from '../../types';

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('patient');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!email.trim() || !password.trim() || !displayName.trim()) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data, error: authErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { display_name: displayName.trim(), role },
        },
      });
      if (authErr) { setError(authErr.message); setLoading(false); return; }

      // Create profile
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          role,
          display_name: displayName.trim(),
          stage: 'middle',
          faith_enabled: false,
          onboarding_complete: false,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
      }

      // Redeem referral code if provided
      if (referralCode.trim() && data.user) {
        try {
          const code = referralCode.trim().toUpperCase();
          const { data: codeRow } = await supabase
            .from('referral_codes')
            .select('id, user_id, uses_count, max_uses, is_active')
            .eq('code', code)
            .eq('is_active', true)
            .single();
          if (codeRow && codeRow.user_id !== data.user.id && codeRow.uses_count < codeRow.max_uses) {
            await supabase.from('referral_redemptions').insert({
              referral_code_id: codeRow.id,
              referrer_id: codeRow.user_id,
              referred_id: data.user.id,
              reward_type: 'free_month',
            });
            await supabase.from('referral_codes').update({ uses_count: codeRow.uses_count + 1 }).eq('id', codeRow.id);
          }
        } catch {}
      }

      Alert.alert('Account Created', 'You can now sign in.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (e: any) {
      setError(e.message || 'Signup failed');
    }
    setLoading(false);
  }

  return (
    <SafeAreaView style={st.safeArea}>
      <KeyboardAvoidingView style={st.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Text style={st.title}>Create Account</Text>

        {error ? <Text style={st.error}>{error}</Text> : null}

        {/* Role selector */}
        <View style={st.roleRow}>
          <Pressable
            onPress={() => setRole('patient')}
            style={[st.roleBtn, role === 'patient' && st.roleBtnActive]}
          >
            <Text style={[st.roleText, role === 'patient' && st.roleTextActive]}>Patient</Text>
          </Pressable>
          <Pressable
            onPress={() => setRole('caregiver')}
            style={[st.roleBtn, role === 'caregiver' && st.roleBtnActive]}
          >
            <Text style={[st.roleText, role === 'caregiver' && st.roleTextActive]}>Caregiver</Text>
          </Pressable>
        </View>

        <TextInput style={st.input} placeholder="Display Name" placeholderTextColor={COLORS.gray}
          value={displayName} onChangeText={setDisplayName} />
        <TextInput style={st.input} placeholder="Email" placeholderTextColor={COLORS.gray}
          value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={st.input} placeholder="Password (6+ characters)" placeholderTextColor={COLORS.gray}
          value={password} onChangeText={setPassword} secureTextEntry />

        {role === 'caregiver' && (
          <TextInput
            style={st.input}
            placeholder="Referral code (optional)"
            placeholderTextColor={COLORS.gray}
            value={referralCode}
            onChangeText={setReferralCode}
            autoCapitalize="characters"
            maxLength={10}
          />
        )}

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.teal} style={{ marginTop: 20 }} />
        ) : (
          <>
            <MBButton label="Create Account" variant="primary" size="large"
              onPress={handleSignup} style={{ marginTop: 16, width: '100%' }} />
            <MBButton label="Already have an account? Sign In" variant="ghost" size="standard"
              onPress={() => router.replace('/(auth)/login')} style={{ marginTop: 12 }} />
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.cream },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  title: { fontSize: 32, fontWeight: '700', color: COLORS.navy, textAlign: 'center', marginBottom: 24 },
  error: { color: COLORS.coral, fontSize: 15, textAlign: 'center', marginBottom: 12 },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 20, justifyContent: 'center' },
  roleBtn: {
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16,
    backgroundColor: COLORS.white, borderWidth: 2, borderColor: COLORS.lightGray,
  },
  roleBtnActive: { borderColor: COLORS.teal, backgroundColor: '#F0FAF8' },
  roleText: { fontSize: 18, fontWeight: '600', color: COLORS.navy },
  roleTextActive: { color: COLORS.teal },
  input: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 16, fontSize: 18,
    color: COLORS.navy, borderWidth: 1, borderColor: COLORS.lightGray, marginBottom: 12,
  },
});
