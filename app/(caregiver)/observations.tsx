/**
 * Caregiver Observations Screen
 * Log and view daily observations about the patient.
 * Quick-add form + list of recent observations.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import { supabase, getCurrentProfile, getCaregiverPatients } from '../../lib/supabase';

interface Observation {
  id: string;
  note: string;
  category: string;
  created_at: string;
}

const CATEGORIES = ['Behavior', 'Mood', 'Sleep', 'Appetite', 'Confusion', 'Physical', 'Other'];

export default function ObservationsScreen() {
  const router = useRouter();
  const [observations, setObservations] = useState<Observation[]>([]);
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('Behavior');
  const [patientId, setPatientId] = useState('');
  const [caregiverId, setCaregiverId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const profile = await getCurrentProfile();
      if (!profile) return;
      setCaregiverId(profile.id);

      const patients = await getCaregiverPatients(profile.id);
      if (!patients || patients.length === 0) return;
      const pid = patients[0].patient_id;
      setPatientId(pid);

      const { data } = await supabase
        .from('observations')
        .select('*')
        .eq('patient_id', pid)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) setObservations(data as Observation[]);
    } catch {}
  }

  async function saveObservation() {
    if (!note.trim() || !patientId) return;
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { data, error } = await supabase
        .from('observations')
        .insert({
          patient_id: patientId,
          caregiver_id: caregiverId,
          note: note.trim(),
          category,
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setObservations(prev => [data as Observation, ...prev]);
        setNote('');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not save observation');
    }
    setSaving(false);
  }

  return (
    <SafeAreaView style={st.safeArea}>
      <View style={st.container}>
        <View style={st.header}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
            <Text style={st.backBtn}>← Back</Text>
          </Pressable>
          <Text style={st.title}>Observations</Text>
        </View>

        {/* Add observation */}
        <View style={st.form}>
          <View style={st.catRow}>
            {CATEGORIES.map(c => (
              <Pressable
                key={c}
                onPress={() => setCategory(c)}
                style={[st.catChip, category === c && st.catChipActive]}
              >
                <Text style={[st.catChipText, category === c && st.catChipTextActive]}>{c}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={st.input}
            placeholder="What did you observe today?"
            placeholderTextColor={COLORS.gray}
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={500}
          />
          <Pressable
            onPress={saveObservation}
            disabled={saving || !note.trim()}
            style={[st.saveBtn, (!note.trim() || saving) && { opacity: 0.5 }]}
          >
            <Text style={st.saveBtnText}>{saving ? 'Saving...' : 'Save Observation'}</Text>
          </Pressable>
        </View>

        {/* List */}
        <FlatList
          data={observations}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={st.obsCard}>
              <View style={st.obsHeader}>
                <Text style={st.obsCat}>{item.category}</Text>
                <Text style={st.obsDate}>
                  {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <Text style={st.obsNote}>{item.note}</Text>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <Text style={st.emptyText}>No observations yet. Add your first one above.</Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.cream },
  container: { flex: 1, padding: A11Y.screenPadding },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  backBtn: { fontSize: 18, color: COLORS.teal, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.navy },
  form: { marginBottom: 20 },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  catChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.lightGray,
  },
  catChipActive: { backgroundColor: COLORS.teal, borderColor: COLORS.teal },
  catChipText: { fontSize: 14, color: COLORS.navy },
  catChipTextActive: { color: COLORS.white, fontWeight: '600' },
  input: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 16, fontSize: 16,
    color: COLORS.navy, minHeight: 80, textAlignVertical: 'top',
    borderWidth: 1, borderColor: COLORS.lightGray, marginBottom: 12,
  },
  saveBtn: {
    backgroundColor: COLORS.teal, borderRadius: 12, padding: 16, alignItems: 'center',
  },
  saveBtnText: { fontSize: 18, fontWeight: '600', color: COLORS.white },
  obsCard: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  obsHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  obsCat: { fontSize: 13, fontWeight: '700', color: COLORS.teal, textTransform: 'uppercase' },
  obsDate: { fontSize: 12, color: COLORS.gray },
  obsNote: { fontSize: 16, color: COLORS.navy, lineHeight: 22 },
  emptyText: { fontSize: 16, color: COLORS.gray, textAlign: 'center', marginTop: 20 },
});
