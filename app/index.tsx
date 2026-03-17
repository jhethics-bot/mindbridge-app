/**
 * Root Index - Login / Session Router
 *
 * Always shows the login screen. If a session already exists,
 * shows "Welcome back" with Continue + Sign Out options.
 * If no session, shows Sign In buttons.
 */
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase, getCurrentProfile } from '../lib/supabase';
import { COLORS } from '../constants/colors';
import { MBButton } from '../components/ui/MBButton';

type ScreenState = 'loading' | 'welcome_back' | 'login';

export default function Index() {
  const router = useRouter();
  const [state, setState] = useState<ScreenState>('loading');
  const [error, setError] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [welcomeName, setWelcomeName] = useState('');
  const [welcomeRole, setWelcomeRole] = useState<'patient' | 'caregiver'>('patient');

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Session exists - show "Welcome back" with Continue option
        const profile = await getCurrentProfile();
        if (profile) {
          setWelcomeName(profile.display_name || 'there');
          setWelcomeRole(profile.role === 'caregiver' ? 'caregiver' : 'patient');
          setState('welcome_back');
          return;
        }
      }
      setState('login');
    } catch (e) {
      setState('login');
    }
  }

  function handleContinue() {
    if (welcomeRole === 'caregiver') {
      router.replace('/(caregiver)' as any);
    } else {
      router.replace('/(patient)' as any);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setWelcomeName('');
    setState('login');
  }

  async function handleLogin(loginEmail: string, loginPassword: string) {
    setError('');
    setSigningIn(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (authError) {
        setError(authError.message);
        setSigningIn(false);
        return;
      }
      const profile = await getCurrentProfile();
      if (profile?.role === 'caregiver') {
        router.replace('/(caregiver)' as any);
      } else {
        router.replace('/(patient)' as any);
      }
    } catch (e: any) {
      setError(e.message || 'Login failed');
      setSigningIn(false);
    }
  }

  // ---- LOADING ----
  if (state === 'loading') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>MindBridge</Text>
        <Text style={styles.subtitle}>Cognitive Care Companion</Text>
        <ActivityIndicator size="large" color={COLORS.teal} style={{ marginTop: 32 }} />
      </View>
    );
  }

  // ---- WELCOME BACK (session exists) ----
  if (state === 'welcome_back') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>MindBridge</Text>
        <Text style={styles.welcomeBack}>Welcome back, {welcomeName}!</Text>

        <View style={styles.buttonGroup}>
          <MBButton
            label="Continue"
            variant="primary"
            size="large"
            onPress={handleContinue}
            accessibilityHint={`Continue as ${welcomeRole}`}
          />
          <MBButton
            label="Sign Out"
            variant="ghost"
            size="standard"
            onPress={handleSignOut}
            accessibilityHint="Sign out and return to login"
          />
        </View>
      </View>
    );
  }

  // ---- LOGIN (no session) ----
  return (
    <View style={styles.container}>
      <Text style={styles.title}>MindBridge</Text>
      <Text style={styles.subtitle}>Cognitive Care Companion</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {signingIn ? (
        <ActivityIndicator size="large" color={COLORS.teal} style={{ marginTop: 32 }} />
      ) : (
        <View style={styles.buttonGroup}>
          <MBButton
            label="Sign In as Patient"
            variant="primary"
            size="large"
            onPress={() => handleLogin('testpatient@mindbridge.app', 'TestPatient123!')}
            accessibilityHint="Sign in with the test patient account"
          />
          <MBButton
            label="Sign In as Caregiver"
            variant="secondary"
            size="large"
            onPress={() => handleLogin('testcaregiver@mindbridge.app', 'TestCaregiver123!')}
            accessibilityHint="Sign in with the test caregiver account"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.cream,
    padding: 24,
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.gray,
    marginBottom: 48,
  },
  welcomeBack: {
    fontSize: 22,
    color: COLORS.gray,
    marginBottom: 48,
    textAlign: 'center',
  },
  error: {
    color: COLORS.coral,
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonGroup: {
    width: '100%',
    gap: 16,
  },
});
