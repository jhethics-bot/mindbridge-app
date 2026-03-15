/**
 * Medications Screen
 * Caregiver manages patient medication list.
 * Queries medications table. Add/view/toggle active status.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, Pressable, Switch, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import { supabase, getCurrentProfile, getCaregiverPatients } from '../../lib/supabase';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  time_of_day: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
}

export default function MedicationsScreen() {
  const router = useRouter();
  const [meds, setMeds] = useState<Medication[]>([]);
  const [patientId, setPatientId] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDosage, setNewDosage] = useState('');
  const [newFreq, setNewFreq] = useState('Daily');
  const [newTime, setNewTime] = useState('Morning');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const profile = await getCurrentProfile();
      if (!profile) return;
      const patients = await getCaregiverPatients(profile.id);
      if (!patients || patients.length === 0) return;
      const pid = patients[0].patient_id;
      setPatientId(pid);

      const { data } = await supabase
        .from('medications')
        .select('*')
        .eq('patient_id', pid)
        .order('is_active', { ascending: false })
        .order('name');

      if (data) setMeds(data as Medication[]);
    } catch {}
  }

  async function addMedication() {
    if (!newName.trim() || !patientId) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('medications')
        .insert({
          patient_id: patientId,
          name: newName.trim(),
          dosage: newDosage.trim(),
          frequency: newFreq,
          time_of_day: newTime,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setMeds(prev => [data as Medication, ...prev]);
        setNewName('');
        setNewDosage('');
        setShowAdd(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not add medication');
    }
    setSaving(false);
  }

  async function toggleActive(med: Medication) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await supabase
        .from('medications')
        .update({ is_active: !med.is_active })
        .eq('id', med.id);

      setMeds(prev => prev.map(m => m.id === med.id ? { ...m, is_active: !m.is_active } : m));
    } catch {}
  }

  const TIMES = ['Morning', 'Afternoon', 'Evening', 'Bedtime'];
  const FREQS = ['Daily', 'Twice Daily', 'Weekly', 'As Needed'];

  return (
    <SafeAreaView style={st.safeArea}>
      <View style={st.container}>
        <View style={st.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={st.backBtn}>← Back</Text>
          </Pressable>
          <Text style={st.title}>Medications</Text>
          <Pressable onPress={() => setShowAdd(!showAdd)}>
            <Text style={st.addBtn}>{showAdd ? 'Cancel' : '+ Add'}</Text>
          </Pressable>
        </View>

        {showAdd && (
          <View style={st.form}>
            <TextInput style={st.input} placeholder="Medication name" value={newName}
              onChangeText={setNewName} placeholderTextColor={COLORS.gray} />
            <TextInput style={st.input} placeholder="Dosage (e.g. 10mg)" value={newDosage}
              onChangeText={setNewDosage} placeholderTextColor={COLORS.gray} />
            <Text style={st.fieldLabel}>Frequency</Text>
            <View style={st.chipRow}>
              {FREQS.map(f => (
                <Pressable key={f} onPress={() => setNewFreq(f)}
                  style={[st.chip, newFreq === f && st.chipActive]}>
                  <Text style={[st.chipText, newFreq === f && st.chipTextActive]}>{f}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={st.fieldLabel}>Time</Text>
            <View style={st.chipRow}>
              {TIMES.map(t => (
                <Pressable key={t} onPress={() => setNewTime(t)}
                  style={[st.chip, newTime === t && st.chipActive]}>
                  <Text style={[st.chipText, newTime === t && st.chipTextActive]}>{t}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={addMedication} disabled={saving || !newName.trim()}
              style={[st.saveBtn, (!newName.trim() || saving) && { opacity: 0.5 }]}>
              <Text style={st.saveBtnText}>{saving ? 'Saving...' : 'Add Medication'}</Text>
            </Pressable>
          </View>
        )}

        <FlatList
          data={meds}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={[st.medCard, !item.is_active && st.medInactive]}>
              <View style={{ flex: 1 }}>
                <Text style={st.medName}>{item.name}</Text>
                <Text style={st.medDosage}>{item.dosage} · {item.frequency}</Text>
                <Text style={st.medTime}>{item.time_of_day}</Text>
              </View>
              <Switch
                value={item.is_active}
                onValueChange={() => toggleActive(item)}
                trackColor={{ false: COLORS.lightGray, true: COLORS.teal }}
                thumbColor={COLORS.white}
              />
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <Text style={st.emptyText}>No medications added yet.</Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.cream },
  container: { flex: 1, padding: A11Y.screenPadding },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backBtn: { fontSize: 18, color: COLORS.teal, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.navy },
  addBtn: { fontSize: 18, color: COLORS.teal, fontWeight: '600' },
  form: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 16 },
  input: {
    borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: 10, padding: 12,
    fontSize: 16, color: COLORS.navy, marginBottom: 10,
  },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: COLORS.navy, marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: COLORS.cream, borderWidth: 1, borderColor: COLORS.lightGray,
  },
  chipActive: { backgroundColor: COLORS.teal, borderColor: COLORS.teal },
  chipText: { fontSize: 14, color: COLORS.navy },
  chipTextActive: { color: COLORS.white, fontWeight: '600' },
  saveBtn: { backgroundColor: COLORS.teal, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 4 },
  saveBtnText: { fontSize: 16, fontWeight: '600', color: COLORS.white },
  medCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: 12, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  medInactive: { opacity: 0.6 },
  medName: { fontSize: 18, fontWeight: '600', color: COLORS.navy },
  medDosage: { fontSize: 14, color: COLORS.gray, marginTop: 2 },
  medTime: { fontSize: 13, color: COLORS.teal, marginTop: 2 },
  emptyText: { fontSize: 16, color: COLORS.gray, textAlign: 'center', marginTop: 20 },
});
