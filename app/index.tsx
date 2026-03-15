import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase, getCurrentProfile } from '../lib/supabase';
import { COLORS } from '../constants/colors';
import { MBButton } from '../components/ui/MBButton';

export default function Index() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const profile = await getCurrentProfile();
        if (profile?.role === 'patient') {
          router.replace('/(patient)');
          return;
        } else if (profile?.role === 'caregiver') {
          router.replace('/(caregiver)');
          return;
        }
      }
      setShowLogin(true);
    } catch (e) {
      setShowLogin(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(loginEmail: string, loginPassword: string) {
    setError('');
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }
      const profile = await getCurrentProfile();
      if (profile?.role === 'patient') {
        router.replace('/(patient)');
      } else if (profile?.role === 'caregiver') {
        router.replace('/(caregiver)');
      } else {
        router.replace('/(patient)');
      }
    } catch (e: any) {
      setError(e.message || 'Login failed');
      setLoading(false);
    }
  }

  if (loading && !showLogin) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>MindBridge</Text>
        <ActivityIndicator size="large" color={COLORS.teal} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MindBridge</Text>
      <Text style={styles.subtitle}>Cognitive Care Companion</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

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
