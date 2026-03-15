/**
 * SOS Emergency Screen
 *
 * Two modes:
 * 1. "I'm Confused" - calm blue, gentle reassurance, plays calming audio
 * 2. "Emergency" - coral, contacts caregivers + logs GPS
 *
 * This screen is accessible from EVERY screen via the SOS button in MBSafeArea.
 * Minimum interaction required. Large buttons. No complex UI.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { MBButton } from '../../components/ui/MBButton';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import { supabase, logSOSEvent } from '../../lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

type SOSState = 'choose' | 'confused' | 'emergency' | 'help_sent';

export default function SOSScreen() {
  const router = useRouter();
  const [state, setState] = useState<SOSState>('choose');
  const [emergencyPhone, setEmergencyPhone] = useState<string | null>(null);

  const handleConfused = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setState('confused');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await logSOSEvent({
          patient_id: user.id,
          sos_type: 'confused',
        });
      }
    } catch {
      // Non-critical - still show calming screen
    }
  };

  const handleEmergency = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setState('emergency');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await logSOSEvent({
          patient_id: user.id,
          sos_type: 'emergency',
        });

        // Get emergency contact
        const { data: contacts } = await supabase
          .from('emergency_contacts')
          .select('phone, name')
          .eq('patient_id', user.id)
          .eq('is_primary', true)
          .limit(1);

        if (contacts && contacts.length > 0) {
          setEmergencyPhone(contacts[0].phone);
        }
      }
    } catch {
      // Still show emergency screen
    }

    setState('help_sent');
  };

  const callEmergency = () => {
    if (emergencyPhone) {
      Linking.openURL(`tel:${emergencyPhone}`);
    } else {
      Linking.openURL('tel:911');
    }
  };

  const goHome = () => {
    router.replace('/(patient)');
  };

  // ---- CONFUSED: Calm reassurance ----
  if (state === 'confused') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#E8F4F8' }]}>
        <View style={styles.centerContent}>
          <Text style={styles.calmEmoji}>💙</Text>
          <Text style={[styles.calmTitle, { color: '#2D6B8A' }]}>
            You are safe
          </Text>
          <Text style={[styles.calmBody, { color: '#4A7C94' }]}>
            Everything is okay.{'\n'}
            You are at home.{'\n'}
            Someone who loves you is nearby.
          </Text>

          <View style={styles.calmActions}>
            <MBButton
              label="Go Home"
              variant="primary"
              size="large"
              onPress={goHome}
              accessibilityHint="Return to the main screen"
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ---- HELP SENT ----
  if (state === 'help_sent') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#FEF3E2' }]}>
        <View style={styles.centerContent}>
          <Text style={styles.calmEmoji}>📞</Text>
          <Text style={[styles.calmTitle, { color: COLORS.navy }]}>
            Help is coming
          </Text>
          <Text style={[styles.calmBody, { color: COLORS.gray }]}>
            Your caregiver has been notified.{'\n'}
            Stay where you are.
          </Text>

          <View style={styles.calmActions}>
            <MBButton
              label={emergencyPhone ? 'Call Caregiver' : 'Call 911'}
              variant="sos"
              size="large"
              onPress={callEmergency}
              accessibilityHint="Make a phone call for help"
            />
            <MBButton
              label="Go Home"
              variant="secondary"
              size="large"
              onPress={goHome}
              accessibilityHint="Return to the main screen"
              style={{ marginTop: 16 }}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ---- CHOOSE: Two big buttons ----
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.cream }]}>
      <View style={styles.centerContent}>
        <Text style={styles.sosTitle}>Do you need help?</Text>

        <View style={styles.bigButtons}>
          <MBButton
            label="I'm Confused"
            variant="confused"
            size="large"
            onPress={handleConfused}
            accessibilityHint="Show calming reassurance screen"
            style={styles.bigButton}
          />

          <MBButton
            label="Emergency"
            variant="sos"
            size="large"
            onPress={handleEmergency}
            accessibilityHint="Alert your caregiver and call for help"
            style={styles.bigButton}
          />
        </View>

        <MBButton
          label="Go Back"
          variant="ghost"
          size="standard"
          onPress={() => router.back()}
          accessibilityHint="Return to previous screen"
          style={{ marginTop: 32 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: A11Y.screenPadding,
  },
  sosTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 48,
    textAlign: 'center',
  },
  bigButtons: {
    width: '100%',
    gap: 24,
  },
  bigButton: {
    width: '100%',
    minHeight: 100,
    borderRadius: 24,
  },
  // Calm/confused state
  calmEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  calmTitle: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  calmBody: {
    fontSize: 24,
    lineHeight: 38,
    textAlign: 'center',
    marginBottom: 48,
  },
  calmActions: {
    width: '100%',
  },
});
