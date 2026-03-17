/**
 * Login Screen
 * Email/password auth via Supabase. Routes patient vs caregiver.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MBButton } from '../../components/ui/MBButton';
import { COLORS } from '../../constants/colors';
import { supabase, getCurrentProfile } from '../../lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authErr) { setError(authErr.message); setLoading(false); return; }

      const profile = await getCurrentProfile();
      if (profile?.role === 'caregiver') {
        router.replace('/(caregiver)');
      } else {
        router.replace('/(patient)');
      }
    } catch (e: any) {
      setError(e.message || 'Login failed');
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={st.safeArea}>
      <KeyboardAvoidingView style={st.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Text style={st.logo}>NeuBridge</Text>
        <Text style={st.tagline}>Cognitive Care Companion</Text>

        {error ? <Text style={st.error}>{error}</Text> : null}

        <TextInput
          style={st.input}
          placeholder="Email"
          placeholderTextColor={COLORS.gray}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={st.input}
          placeholder="Password"
          placeholderTextColor={COLORS.gray}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.teal} style={{ marginTop: 20 }} />
        ) : (
          <>
            <MBButton
              label="Sign In"
              variant="primary"
              size="large"
              onPress={handleLogin}
              accessibilityHint="Sign in to your account"
              style={{ marginTop: 16, width: '100%' }}
            />
            <MBButton
              label="Create Account"
              variant="ghost"
              size="standard"
              onPress={() => router.push('/(auth)/signup')}
              accessibilityHint="Go to signup screen"
              style={{ marginTop: 12 }}
            />
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.cream },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  logo: { fontSize: 42, fontWeight: '700', color: COLORS.navy, textAlign: 'center' },
  tagline: { fontSize: 16, color: COLORS.gray, textAlign: 'center', marginBottom: 40 },
  error: { color: COLORS.coral, fontSize: 15, textAlign: 'center', marginBottom: 12 },
  input: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 16, fontSize: 18,
    color: COLORS.navy, borderWidth: 1, borderColor: COLORS.lightGray, marginBottom: 12,
  },
});
