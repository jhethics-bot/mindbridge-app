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
import { APP_METADATA } from '../../constants/appMetadata';
import { LanguageSelector } from '../../components/LanguageSelector';
import { supabase, getCurrentProfile, getCaregiverPatients } from '../../lib/supabase';
import type { DiseaseStage } from '../../types';
import type { PetType } from '../../lib/petMoodEngine';

export default function SettingsScreen() {
  const router = useRouter();
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [stage, setStage] = useState<DiseaseStage>('middle');
  const [faithEnabled, setFaithEnabled] = useState(false);
  const [pin, setPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [saving, setSaving] = useState(false);
  // Pet settings
  const [petName, setPetName2] = useState('');
  const [petType, setPetType] = useState<PetType | null>(null);
  const [petColor, setPetColor] = useState('golden');
  const [petEnabled, setPetEnabled] = useState(true);
  const [petId, setPetId] = useState('');
  const [careRelId, setCareRelId] = useState('');

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

      // Load pet settings
      const relId = patients[0].id;
      setCareRelId(relId);
      const { data: petRow } = await supabase
        .from('companion_pets')
        .select('id, pet_name, pet_type, color_primary')
        .eq('care_relationship_id', relId)
        .single();
      if (petRow) {
        setPetId(petRow.id);
        setPetName2(petRow.pet_name || '');
        setPetType(petRow.pet_type as PetType);
        setPetColor(petRow.color_primary || 'golden');
      }

      // Load companion_pet_enabled toggle
      const { data: toggleRow } = await supabase
        .from('feature_toggles')
        .select('is_enabled')
        .eq('patient_id', patients[0].patient_id)
        .eq('feature_key', 'companion_pet_enabled')
        .single();
      if (toggleRow) setPetEnabled(toggleRow.is_enabled);
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

  async function savePetName(newName: string) {
    setPetName2(newName);
    if (!petId || !newName.trim()) return;
    try {
      await supabase.from('companion_pets').update({ pet_name: newName.trim() }).eq('id', petId);
    } catch {}
  }

  async function savePetType(newType: PetType) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPetType(newType);
    if (!petId) return;
    try {
      await supabase.from('companion_pets').update({ pet_type: newType }).eq('id', petId);
    } catch {}
  }

  async function savePetColor(newColor: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPetColor(newColor);
    if (!petId) return;
    try {
      await supabase.from('companion_pets').update({ color_primary: newColor }).eq('id', petId);
    } catch {}
  }

  async function togglePetEnabled() {
    const newVal = !petEnabled;
    setPetEnabled(newVal);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!patientId) return;
    try {
      await supabase.from('feature_toggles').upsert({
        patient_id: patientId,
        feature_key: 'companion_pet_enabled',
        is_enabled: newVal,
      }, { onConflict: 'patient_id,feature_key' });
    } catch {}
  }

  const PET_TYPES: { value: PetType; label: string; emoji: string }[] = [
    { value: 'dog', label: 'Dog', emoji: '🐕' },
    { value: 'cat', label: 'Cat', emoji: '🐱' },
    { value: 'bird', label: 'Bird', emoji: '🐦' },
    { value: 'bunny', label: 'Bunny', emoji: '🐰' },
  ];

  const PET_COLORS = [
    { value: 'golden', label: 'Golden' },
    { value: 'brown', label: 'Brown' },
    { value: 'black', label: 'Black' },
    { value: 'white', label: 'White' },
    { value: 'gray', label: 'Gray' },
    { value: 'orange', label: 'Orange' },
    { value: 'teal', label: 'Teal' },
  ];

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

        {/* Companion Pet */}
        {petId ? (
          <View style={st.section}>
            <View style={st.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={st.sectionTitle}>Companion Pet</Text>
                <Text style={st.sectionDesc}>Configure the companion pet experience.</Text>
              </View>
              <Switch
                value={petEnabled}
                onValueChange={togglePetEnabled}
                trackColor={{ false: COLORS.lightGray, true: COLORS.teal }}
                thumbColor={COLORS.white}
              />
            </View>

            <Text style={[st.sectionDesc, { marginTop: 12, marginBottom: 4, fontWeight: '600', color: COLORS.navy }]}>Pet Name</Text>
            <TextInput
              style={st.pinInput}
              value={petName}
              onChangeText={setPetName2}
              onEndEditing={() => savePetName(petName)}
              placeholder="Pet name"
              placeholderTextColor={COLORS.gray}
              maxLength={20}
            />

            <Text style={[st.sectionDesc, { marginBottom: 4, fontWeight: '600', color: COLORS.navy }]}>Pet Type</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {PET_TYPES.map(pt => (
                <Pressable
                  key={pt.value}
                  onPress={() => savePetType(pt.value)}
                  style={[st.stageCard, { flex: 0, paddingHorizontal: 16, paddingVertical: 10 }, petType === pt.value && st.stageCardActive]}
                >
                  <Text style={{ fontSize: 20, marginRight: 6 }}>{pt.emoji}</Text>
                  <Text style={[st.stageLabel, petType === pt.value && st.stageLabelActive]}>{pt.label}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={[st.sectionDesc, { marginBottom: 4, fontWeight: '600', color: COLORS.navy }]}>Primary Color</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
              {PET_COLORS.map(pc => (
                <Pressable
                  key={pc.value}
                  onPress={() => savePetColor(pc.value)}
                  style={[st.stageCard, { flex: 0, paddingHorizontal: 14, paddingVertical: 10 }, petColor === pc.value && st.stageCardActive]}
                >
                  <Text style={[st.stageLabel, petColor === pc.value && st.stageLabelActive]}>{pc.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

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

        {/* Language / Idioma */}
        <View style={st.section}>
          <Text style={st.sectionTitle}>Language / Idioma</Text>
          <Text style={st.sectionDesc}>Switch language for the entire app.</Text>
          <LanguageSelector />
        </View>

        {/* Quick Links */}
        <View style={st.section}>
          <Text style={st.sectionTitle}>Quick Links</Text>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(caregiver)/nutrition-settings' as any); }}
            style={st.linkRow}
          >
            <Text style={st.linkText}>🥗  Nutrition & Hydration Settings</Text>
          </Pressable>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(caregiver)/daily-guides-config' as any); }}
            style={st.linkRow}
          >
            <Text style={st.linkText}>📋  Daily Living Guides</Text>
          </Pressable>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(caregiver)/news' as any); }}
            style={st.linkRow}
          >
            <Text style={st.linkText}>📰  News Reader</Text>
          </Pressable>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(caregiver)/zarit' as any); }}
            style={st.linkRow}
          >
            <Text style={st.linkText}>📋  Caregiver Wellness Check (Zarit)</Text>
          </Pressable>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(caregiver)/about' as any); }}
            style={st.linkRow}
          >
            <Text style={st.linkText}>ℹ️  About {APP_METADATA.name}</Text>
          </Pressable>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(caregiver)/feedback' as any); }}
            style={st.linkRow}
          >
            <Text style={st.linkText}>💜  Share Feedback</Text>
          </Pressable>
        </View>

        {/* App Info */}
        <View style={st.section}>
          <Text style={st.sectionTitle}>App Info</Text>
          <Text style={st.sectionDesc}>{APP_METADATA.name} v{APP_METADATA.version}</Text>
          <Text style={st.sectionDesc}>{APP_METADATA.company}</Text>
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
  linkRow: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 8,
  },
  linkText: { fontSize: 15, color: COLORS.navy, fontWeight: '500' },
  logoutBtn: { alignSelf: 'center', padding: 16, marginTop: 16 },
  logoutText: { fontSize: 16, color: COLORS.coral, fontWeight: '600' },
});
