/**
 * Medications Screen
 * Caregiver manages patient medication schedules with compliance tracking.
 * Integrates medication_schedules + medication_confirmations tables.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, Pressable, Switch, Alert, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import { supabase, getCurrentProfile, getCaregiverPatients } from '../../lib/supabase';
import { useMedicationAlertStore, type MedicationSchedule, type MedicationConfirmation } from '../../stores/medicationAlertStore';

interface LegacyMedication {
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
  const [legacyMeds, setLegacyMeds] = useState<LegacyMedication[]>([]);
  const [patientId, setPatientId] = useState('');
  const [caregiverId, setCaregiverId] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDosage, setNewDosage] = useState('');
  const [newFreq, setNewFreq] = useState('Daily');
  const [newTime, setNewTime] = useState('Morning');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'schedules' | 'today'>('today');

  const {
    medications: schedules,
    todaysConfirmations,
    pendingCount,
    fetchMedications,
    fetchTodaysConfirmations,
    confirmMedication,
    skipMedication,
    addMedication: addSchedule,
    deleteMedication: deleteSchedule,
  } = useMedicationAlertStore();

  // 7-day compliance
  const [weekCompliance, setWeekCompliance] = useState<number | null>(null);
  const [lastMissed, setLastMissed] = useState<{ date: string; name: string } | null>(null);

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

      // Legacy medications table
      const { data } = await supabase
        .from('medications')
        .select('*')
        .eq('patient_id', pid)
        .order('is_active', { ascending: false })
        .order('name');
      if (data) setLegacyMeds(data as LegacyMedication[]);

      // New schedule-based medications
      await fetchMedications(pid);
      await fetchTodaysConfirmations(pid);

      // 7-day compliance
      await load7DayCompliance(pid);
    } catch {}
  }

  async function load7DayCompliance(pid: string) {
    try {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const { data: weekData } = await supabase
        .from('medication_confirmations')
        .select('status, scheduled_time, created_at, medication_schedules(medication_name)')
        .eq('patient_id', pid)
        .gte('created_at', weekAgo)
        .order('created_at', { ascending: false });

      if (weekData && weekData.length > 0) {
        const total = weekData.length;
        const confirmed = weekData.filter((c: any) => c.status === 'confirmed').length;
        setWeekCompliance(total > 0 ? Math.round((confirmed / total) * 100) : null);

        const missed = weekData.find((c: any) => c.status === 'missed');
        if (missed) {
          setLastMissed({
            date: new Date(missed.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
            name: (missed as any).medication_schedules?.medication_name ?? 'Unknown',
          });
        }
      }
    } catch {}
  }

  async function addLegacyMedication() {
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
        setLegacyMeds(prev => [data as LegacyMedication, ...prev]);
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

  async function toggleActive(med: LegacyMedication) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await supabase
        .from('medications')
        .update({ is_active: !med.is_active })
        .eq('id', med.id);
      setLegacyMeds(prev => prev.map(m => m.id === med.id ? { ...m, is_active: !m.is_active } : m));
    } catch {}
  }

  async function handleMarkAsGiven(confirmationId: string) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await confirmMedication(confirmationId);
    if (patientId) fetchTodaysConfirmations(patientId);
  }

  async function handleDeleteSchedule(id: string) {
    Alert.alert('Remove Medication', 'This will deactivate this medication schedule.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          await deleteSchedule(id);
          if (patientId) fetchMedications(patientId);
        },
      },
    ]);
  }

  const TIMES = ['Morning', 'Afternoon', 'Evening', 'Bedtime'];
  const FREQS = ['Daily', 'Twice Daily', 'Weekly', 'As Needed'];

  const confirmedToday = todaysConfirmations.filter(c => c.status === 'confirmed').length;
  const totalToday = todaysConfirmations.length;

  function getStatusColor(status: string) {
    switch (status) {
      case 'confirmed': return COLORS.success;
      case 'pending': return '#D4A843';
      case 'missed': return COLORS.coral;
      case 'skipped': return COLORS.gray;
      default: return COLORS.gray;
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'confirmed': return 'Taken';
      case 'pending': return 'Pending';
      case 'missed': return 'Missed';
      case 'skipped': return 'Skipped';
      default: return status;
    }
  }

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

        {/* Compliance summary */}
        <View style={st.complianceRow}>
          <View style={st.complianceCard}>
            <Text style={st.complianceLabel}>Today</Text>
            <Text style={st.complianceValue}>{confirmedToday} of {totalToday}</Text>
            <Text style={st.complianceSubtext}>confirmed</Text>
          </View>
          <View style={st.complianceCard}>
            <Text style={st.complianceLabel}>7-Day</Text>
            <Text style={st.complianceValue}>{weekCompliance !== null ? `${weekCompliance}%` : '--'}</Text>
            <Text style={st.complianceSubtext}>compliance</Text>
          </View>
          {lastMissed && (
            <View style={[st.complianceCard, { borderColor: COLORS.coral, borderWidth: 1 }]}>
              <Text style={st.complianceLabel}>Last Missed</Text>
              <Text style={[st.complianceValue, { fontSize: 14, color: COLORS.coral }]}>{lastMissed.date}</Text>
              <Text style={st.complianceSubtext}>{lastMissed.name}</Text>
            </View>
          )}
        </View>

        {/* Tab switcher */}
        <View style={st.tabRow}>
          <Pressable
            onPress={() => setActiveTab('today')}
            style={[st.tab, activeTab === 'today' && st.tabActive]}
          >
            <Text style={[st.tabText, activeTab === 'today' && st.tabTextActive]}>
              Today{pendingCount > 0 ? ` (${pendingCount})` : ''}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('schedules')}
            style={[st.tab, activeTab === 'schedules' && st.tabActive]}
          >
            <Text style={[st.tabText, activeTab === 'schedules' && st.tabTextActive]}>Schedules</Text>
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
            <Pressable onPress={addLegacyMedication} disabled={saving || !newName.trim()}
              style={[st.saveBtn, (!newName.trim() || saving) && { opacity: 0.5 }]}>
              <Text style={st.saveBtnText}>{saving ? 'Saving...' : 'Add Medication'}</Text>
            </Pressable>
          </View>
        )}

        {activeTab === 'today' ? (
          <FlatList
            data={todaysConfirmations}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={st.medCard}>
                <View style={{ flex: 1 }}>
                  <Text style={st.medName}>{item.medication_name ?? 'Medication'}</Text>
                  <Text style={st.medDosage}>{item.dosage ?? ''} · {item.scheduled_time}</Text>
                  <View style={[st.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[st.statusText, { color: getStatusColor(item.status) }]}>
                      {getStatusLabel(item.status)}
                    </Text>
                  </View>
                </View>
                {item.status === 'pending' && (
                  <Pressable
                    onPress={() => handleMarkAsGiven(item.id)}
                    style={({ pressed }) => [st.markGivenBtn, pressed && { opacity: 0.85 }]}
                  >
                    <Text style={st.markGivenText}>Mark as Given</Text>
                  </Pressable>
                )}
              </View>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={
              <Text style={st.emptyText}>No medication confirmations for today.</Text>
            }
          />
        ) : (
          <FlatList
            data={[...legacyMeds.map(m => ({ ...m, _type: 'legacy' as const }))]}
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
        )}
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

  // Compliance summary
  complianceRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  complianceCard: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: 12, padding: 12, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  complianceLabel: { fontSize: 11, fontWeight: '600', color: COLORS.gray, textTransform: 'uppercase', marginBottom: 4 },
  complianceValue: { fontSize: 22, fontWeight: '700', color: COLORS.teal },
  complianceSubtext: { fontSize: 12, color: COLORS.gray, marginTop: 2 },

  // Tab switcher
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.lightGray,
  },
  tabActive: { backgroundColor: COLORS.teal, borderColor: COLORS.teal },
  tabText: { fontSize: 15, fontWeight: '600', color: COLORS.navy },
  tabTextActive: { color: COLORS.white },

  // Form
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

  // Med cards
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

  // Status badge
  statusBadge: {
    alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4,
  },
  statusText: { fontSize: 12, fontWeight: '600' },

  // Mark as given button
  markGivenBtn: {
    backgroundColor: COLORS.teal, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
  },
  markGivenText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
});
