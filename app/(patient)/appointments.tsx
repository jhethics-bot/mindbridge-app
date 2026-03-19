/**
 * Patient Appointments Screen - Read-only view of upcoming appointments
 *
 * Caregivers create appointments; patients just see them here.
 * Large, high-contrast cards designed for elderly readability.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MBSafeArea } from '../../components/ui/MBSafeArea';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import { supabase } from '../../lib/supabase';

interface Appointment {
  id: string;
  title: string;
  provider_name?: string;
  appointment_date: string;
  location?: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function PatientAppointmentsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/(auth)/login' as any);
        return;
      }

      const { data } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', user.id)
        .gte('appointment_date', new Date().toISOString())
        .order('appointment_date', { ascending: true });

      setAppointments(data || []);
    } catch (err) {
      console.error('[appointments] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MBSafeArea showHome={true} showSOS={true} backgroundColor={COLORS.cream}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.teal} />
          <Text style={styles.loadingText}>Loading appointments...</Text>
        </View>
      </MBSafeArea>
    );
  }

  return (
    <MBSafeArea showHome={true} showSOS={true} backgroundColor={COLORS.cream}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Your Appointments</Text>

        {appointments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyText}>No upcoming appointments</Text>
          </View>
        ) : (
          appointments.map((appt) => (
            <View
              key={appt.id}
              style={styles.card}
              accessible={true}
              accessibilityLabel={`${appt.title}${appt.provider_name ? ` with ${appt.provider_name}` : ''}, ${formatDate(appt.appointment_date)} at ${formatTime(appt.appointment_date)}${appt.location ? `, at ${appt.location}` : ''}`}
            >
              <Text style={styles.cardTitle}>{appt.title}</Text>

              {appt.provider_name ? (
                <Text style={styles.cardProvider}>{appt.provider_name}</Text>
              ) : null}

              <View style={styles.divider} />

              <Text style={styles.cardDate}>
                {formatDate(appt.appointment_date)}
              </Text>
              <Text style={styles.cardTime}>
                {formatTime(appt.appointment_date)}
              </Text>

              {appt.location ? (
                <Text style={styles.cardLocation}>📍 {appt.location}</Text>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
    </MBSafeArea>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: A11Y.fontSizeBody,
    color: COLORS.navy,
    marginTop: 16,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 24,
  },

  // Appointment card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderLeftWidth: 6,
    borderLeftColor: COLORS.teal,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.navy,
  },
  cardProvider: {
    fontSize: 20,
    color: COLORS.teal,
    fontWeight: '600',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGray,
    marginVertical: 16,
  },
  cardDate: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.navy,
  },
  cardTime: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.navy,
    marginTop: 4,
  },
  cardLocation: {
    fontSize: 20,
    color: COLORS.gray,
    marginTop: 12,
  },

  // Empty state
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 22,
    color: COLORS.gray,
    fontWeight: '600',
    textAlign: 'center',
  },
});
