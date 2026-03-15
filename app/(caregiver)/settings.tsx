/**
 * Caregiver Settings Screen
 * PIN lock, patient stage management, faith toggle, notifications.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Pressable, Switch, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import { supabase, getCurrentProfile, getCaregiverPatients } from '../../lib/supabase';
import type { DiseaseStage } from '../../types';

export default function SettingsScreen() {
  const router = useRouter();
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [stage, setStage] = useState<DiseaseStage>('middle');
  const [faithEnabled, setFaithEnabled] = useState(false);
  const [pin, setPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const profile = await getCurrentProfile();
      if (!profile) return;

      // Load caregiver PIN from profile metadata
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.caregiver_pin) {
        setCurrentPin(user.user_metadata.caregiver_pin);
      }

      const patients = await getCaregiverPatients(profile.id);
      if (!patients || patients.length === 0) return;
      const patient = patients[0].patient;
      setPatientId(patients[0].patient_id);
      setPatientName(patient?.display_name || '');
      setStage(patient?.stage || 'middle');
      setFaithEnabled(patient?.faith_enabled || false);
    } catch {}
  }

  async function saveStage(newStage: DiseaseStage) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStage(newStage);
    try {
      await supabase
        .from('profiles')
        .update({ stage: newStage })
        .eq('id', patientId);
    } catch {}
  }

  async function toggleFaith() {
    const newVal = !faithEnabled;
    setFaithEnabled(newVal);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await supabase
        .from('profiles')
        .update({ faith_enabled: newVal })
        .eq('id', patientId);
    } catch {}
  }

  async function savePin() {
    if (pin.length < 4) {
      Alert.alert('PIN too short', 'Please enter at least 4 digits.');
      return;
    }
    setSaving(true);
    try {
      await supabase.auth.updateUser({
        data: { caregiver_pin: pin },
      });
      setCurrentPin(pin);
      setPin('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved', 'PIN has been updated.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not save PIN');
    }
    setSaving(false);
  }

  const STAGES: { value: DiseaseStage; label: string; desc: string }[] = [
    { value: 'early', label: 'Early', desc: 'Independent with minor memory issues' },
    { value: 'middle', label: 'Middle', desc: 'Needs supervision, simplified interactions' },
    { value: 'late', label: 'Late', desc: 'Requires full assistance, minimal interaction' },
  ];

  return (
    <SafeAreaView style={st.safeArea}>
      <ScrollView contentContainerStyle={st.scroll}>
        <View style={st.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={st.backBtn}>← Back</Text>
          </Pressable>
          <Text style={st.title}>Settings</Text>
        </View>

        {/* Patient Info */}
        <View style={st.section}>
          <Text style={st.sectionTitle}>Patient</Text>
          <Text style={st.patientName}>{patientName || 'Not linked'}</Text>
        </View>

        {/* Disease Stage */}
        <View style={st.section}>
          <Text style={st.sectionTitle}>Disease Stage</Text>
          <Text style={st.sectionDesc}>This controls the difficulty and UI of all activities.</Text>
          {STAGES.map(s => (
            <Pressable
              key={s.value}
              onPress={() => saveStage(s.value)}
              style={[st.stageCard, stage === s.value && st.stageCardActive]}
            >
              <View style={[st.radio, stage === s.value && st.radioActive]} />
              <View style={{ flex: 1 }}>
                <Text style={[st.stageLabel, stage === s.value && st.stageLabelActive]}>{s.label}</Text>
                <Text style={st.stageDesc}>{s.desc}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Faith Module */}
        <View style={st.section}>
          <View style={st.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={st.sectionTitle}>Scripture Module</Text>
              <Text style={st.sectionDesc}>Show daily verses and devotional content.</Text>
            </View>
            <Switch
              value={faithEnabled}
              onValueChange={toggleFaith}
              trackColor={{ false: COLORS.lightGray, true: COLORS.teal }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>

        {/* PIN Lock */}
        <View style={st.section}>
          <Text style={st.sectionTitle}>Caregiver PIN Lock</Text>
          <Text style={st.sectionDesc}>
            {currentPin ? 'PIN is set. Enter a new one to change it.' : 'Set a PIN to protect caregiver settings.'}
          </Text>
          <TextInput
            style={st.pinInput}
            placeholder="Enter 4+ digit PIN"
            placeholderTextColor={COLORS.gray}
            value={pin}
            onChangeText={setPin}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={8}
          />
          <Pressable
            onPress={savePin}
            disabled={saving || pin.length < 4}
            style={[st.saveBtn, (saving || pin.length < 4) && { opacity: 0.5 }]}
          >
            <Text style={st.saveBtnText}>{saving ? 'Saving...' : 'Save PIN'}</Text>
          </Pressable>
        </View>

        {/* Sign out */}
        <Pressable
          onPress={async () => { await supabase.auth.signOut(); router.replace('/'); }}
          style={st.logoutBtn}
        >
          <Text style={st.logoutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.cream },
  scroll: { padding: A11Y.screenPadding, paddingBottom: 60 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  backBtn: { fontSize: 18, color: COLORS.teal, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.navy },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.navy, marginBottom: 4 },
  sectionDesc: { fontSize: 14, color: COLORS.gray, marginBottom: 12 },
  patientName: { fontSize: 20, fontWeight: '600', color: COLORS.teal },
  stageCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    backgroundColor: COLORS.white, borderRadius: 12, marginBottom: 8,
    borderWidth: 2, borderColor: 'transparent',
  },
  stageCardActive: { borderColor: COLORS.teal, backgroundColor: '#F0FAF8' },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.lightGray,
  },
  radioActive: { borderColor: COLORS.teal, backgroundColor: COLORS.teal },
  stageLabel: { fontSize: 16, fontWeight: '600', color: COLORS.navy },
  stageLabelActive: { color: COLORS.teal },
  stageDesc: { fontSize: 13, color: COLORS.gray, marginTop: 2 },
  toggleRow: { flexDirection: 'row', alignItems: 'center' },
  pinInput: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 14, fontSize: 20,
    textAlign: 'center', letterSpacing: 8, borderWidth: 1, borderColor: COLORS.lightGray,
    color: COLORS.navy, marginBottom: 12,
  },
  saveBtn: { backgroundColor: COLORS.teal, borderRadius: 12, padding: 14, alignItems: 'center' },
  saveBtnText: { fontSize: 16, fontWeight: '600', color: COLORS.white },
  logoutBtn: { alignSelf: 'center', padding: 16, marginTop: 16 },
  logoutText: { fontSize: 16, color: COLORS.coral, fontWeight: '600' },
});
