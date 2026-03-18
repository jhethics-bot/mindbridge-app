/**
 * Appointments Screen
 * Shows upcoming appointments for the patient.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

const TYPE_COLORS: Record<string, string> = {
  medical: '#2A9D8F',
  therapy: '#4CAF50',
  lab: '#9C27B0',
  imaging: '#2196F3',
  dental: '#E9C46A',
  other: '#999',
};

interface Appointment {
  id: string;
  title: string;
  appointment_type: string;
  provider_name: string;
  location: string;
  appointment_date: string;
  duration_minutes: number;
  notes: string;
  completed: boolean;
}

export default function AppointmentsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/'); return; }

      const { data: rel } = await supabase.from('care_relationships')
        .select('patient_id').eq('caregiver_id', user.id).eq('is_primary', true).limit(1).single();

      if (!rel) { setError('No patient linked.'); setLoading(false); return; }

      const { data, error: qErr } = await supabase.from('appointments')
        .select('*').eq('patient_id', rel.patient_id)
        .gte('appointment_date', new Date().toISOString())
        .order('appointment_date', { ascending: true });

      if (qErr) { setError(qErr.message); setLoading(false); return; }
      setAppointments(data || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load appointments');
    }
    setLoading(false);
  }

  function fmtDate(d: string) {
    const dt = new Date(d);
    return dt.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  }

  function fmtTime(d: string) {
    return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}><ActivityIndicator size="large" color="#2A9D8F" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>← Back</Text>
        </Pressable>

        <Text style={s.title}>Upcoming Appointments</Text>

        {error ? (
          <Text style={s.errorText}>{error}</Text>
        ) : appointments.length === 0 ? (
          <View style={s.empty}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>📅</Text>
            <Text style={s.emptyTitle}>No upcoming appointments</Text>
            <Text style={s.emptyBody}>All clear for now. Appointments will show up here when scheduled.</Text>
          </View>
        ) : (
          appointments.map((apt) => {
            const typeColor = TYPE_COLORS[apt.appointment_type] || TYPE_COLORS.other;
            return (
              <View key={apt.id} style={s.card}>
                <View style={s.cardHeader}>
                  <Text style={s.cardTitle}>{apt.title}</Text>
                  <View style={[s.typeBadge, { backgroundColor: typeColor + '20' }]}>
                    <Text style={[s.typeText, { color: typeColor }]}>{apt.appointment_type}</Text>
                  </View>
                </View>

                {apt.provider_name ? (
                  <Text style={s.provider}>{apt.provider_name}</Text>
                ) : null}

                <View style={s.detailRow}>
                  <Text style={s.detailIcon}>📅</Text>
                  <Text style={s.detailText}>{fmtDate(apt.appointment_date)} at {fmtTime(apt.appointment_date)}</Text>
                </View>

                {apt.duration_minutes > 0 && (
                  <View style={s.detailRow}>
                    <Text style={s.detailIcon}>⏱</Text>
                    <Text style={s.detailText}>{apt.duration_minutes} minutes</Text>
                  </View>
                )}

                {apt.location ? (
                  <View style={s.detailRow}>
                    <Text style={s.detailIcon}>📍</Text>
                    <Text style={s.detailText}>{apt.location}</Text>
                  </View>
                ) : null}

                {apt.notes ? (
                  <Text style={s.notes}>{apt.notes}</Text>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F1DE' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20, paddingBottom: 40 },
  backBtn: { marginBottom: 16 },
  backText: { fontSize: 18, color: '#1B2A4A', fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '700', color: '#1B2A4A', marginBottom: 20 },
  errorText: { fontSize: 16, color: '#E76F51', textAlign: 'center', marginTop: 20 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#1B2A4A', marginBottom: 8 },
  emptyBody: { fontSize: 16, color: '#666', textAlign: 'center', paddingHorizontal: 20 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1B2A4A', flex: 1, marginRight: 8 },
  typeBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  typeText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  provider: { fontSize: 16, color: '#2A9D8F', fontWeight: '600', marginBottom: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  detailIcon: { fontSize: 14, marginRight: 8 },
  detailText: { fontSize: 15, color: '#1B2A4A' },
  notes: { fontSize: 14, color: '#666', marginTop: 8, fontStyle: 'italic', lineHeight: 20 },
});
