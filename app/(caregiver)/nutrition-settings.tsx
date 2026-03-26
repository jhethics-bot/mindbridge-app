/**
 * Nutrition Settings - Caregiver
 * Hydration targets, reminders, quiet hours, weight logging, feature toggles.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, TextInput, ActivityIndicator, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import { supabase, getCurrentProfile, getCaregiverPatients } from '../../lib/supabase';
import { useNutritionStore, type WeightLog } from '../../stores/nutritionStore';
import { useSettingsStore } from '../../stores/settingsStore';

const FREQUENCY_OPTIONS = [1, 2, 3];
const TARGET_OPTIONS = [32, 48, 64, 80, 96];

export default function NutritionSettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [careRelId, setCareRelId] = useState('');
  const [patientId, setPatientId] = useState('');
  const [weightInput, setWeightInput] = useState('');

  const {
    hydrationSettings, fetchHydrationSettings, updateHydrationSettings,
    logWeight, fetchWeightLogs, weightLogs,
  } = useNutritionStore();

  const { toggles, toggleFeature } = useSettingsStore();

  useEffect(() => { init(); }, []);

  async function init() {
    const profile = await getCurrentProfile();
    if (!profile) { router.replace('/'); return; }
    const patients = await getCaregiverPatients(profile.id);
    if (!patients || patients.length === 0) { setLoading(false); return; }

    const relId = patients[0].id;
    const pid = patients[0].patient_id;
    setCareRelId(relId);
    setPatientId(pid);

    await Promise.all([
      fetchHydrationSettings(relId),
      fetchWeightLogs(pid),
    ]);
    setLoading(false);
  }

  const handleTargetChange = async (target: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateHydrationSettings(careRelId, { daily_target_oz: target });
  };

  const handleFrequencyChange = async (hours: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateHydrationSettings(careRelId, { reminder_frequency_hours: hours });
  };

  const handleLogWeight = async () => {
    const w = parseFloat(weightInput);
    if (isNaN(w) || w <= 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await logWeight(patientId, w);
    setWeightInput('');
  };

  const handleToggle = async (key: string, value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleFeature(patientId, key as any, value);
  };

  if (loading) {
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.center}><ActivityIndicator size="large" color={COLORS.teal} /></View>
      </SafeAreaView>
    );
  }

  const currentTarget = hydrationSettings?.daily_target_oz ?? 64;
  const currentFreq = hydrationSettings?.reminder_frequency_hours ?? 2;

  return (
    <SafeAreaView style={st.safe}>
      <ScrollView contentContainerStyle={st.scroll}>
        <Pressable onPress={() => router.back()} style={st.backBtn}>
          <Text style={st.backBtnText}>← Back</Text>
        </Pressable>
        <Text style={st.title}>Nutrition Settings</Text>

        {/* Hydration Target */}
        <View style={st.section}>
          <Text style={st.sectionTitle}>Daily Hydration Target</Text>
          <View style={st.optionRow}>
            {TARGET_OPTIONS.map(oz => (
              <Pressable
                key={oz}
                onPress={() => handleTargetChange(oz)}
                style={[st.optionBtn, currentTarget === oz && st.optionBtnActive]}
              >
                <Text style={[st.optionText, currentTarget === oz && st.optionTextActive]}>
                  {oz} oz
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={st.hint}>{Math.round(currentTarget / 8)} glasses per day</Text>
        </View>

        {/* Reminder Frequency */}
        <View style={st.section}>
          <Text style={st.sectionTitle}>Reminder Frequency</Text>
          <View style={st.optionRow}>
            {FREQUENCY_OPTIONS.map(hrs => (
              <Pressable
                key={hrs}
                onPress={() => handleFrequencyChange(hrs)}
                style={[st.optionBtn, currentFreq === hrs && st.optionBtnActive]}
              >
                <Text style={[st.optionText, currentFreq === hrs && st.optionTextActive]}>
                  Every {hrs}h
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Quiet Hours */}
        <View style={st.section}>
          <Text style={st.sectionTitle}>Quiet Hours</Text>
          <Text style={st.quietText}>
            No reminders from {hydrationSettings?.quiet_hours_start ?? '21:00'} to {hydrationSettings?.quiet_hours_end ?? '07:00'}
          </Text>
        </View>

        {/* Weight Logging */}
        <View style={st.section}>
          <Text style={st.sectionTitle}>Weight Log</Text>
          <View style={st.weightRow}>
            <TextInput
              style={st.weightInput}
              placeholder="Weight (lbs)"
              value={weightInput}
              onChangeText={setWeightInput}
              keyboardType="numeric"
              placeholderTextColor={COLORS.gray}
            />
            <Pressable onPress={handleLogWeight} style={st.logWeightBtn}>
              <Text style={st.logWeightText}>Log</Text>
            </Pressable>
          </View>

          {weightLogs.length > 0 && (
            <View style={st.weightHistory}>
              <Text style={st.historyTitle}>Recent Entries</Text>
              {weightLogs.slice(0, 5).map((w, i) => (
                <View key={w.id || i} style={st.weightEntry}>
                  <Text style={st.weightDate}>
                    {new Date(w.log_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </Text>
                  <Text style={st.weightValue}>{w.weight_lbs} lbs</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Feature Toggles */}
        <View style={st.section}>
          <Text style={st.sectionTitle}>Feature Toggles</Text>
          {[
            { key: 'nutrition_enabled', label: 'Nutrition Tracking' },
            { key: 'hydration_tracking_enabled', label: 'Hydration Tracking' },
            { key: 'mind_diet_scoring_enabled', label: 'MIND Diet Scoring' },
          ].map(toggle => (
            <View key={toggle.key} style={st.toggleRow}>
              <Text style={st.toggleLabel}>{toggle.label}</Text>
              <Switch
                value={(toggles as any)[toggle.key] ?? true}
                onValueChange={(v) => handleToggle(toggle.key, v)}
                trackColor={{ false: COLORS.lightGray, true: COLORS.teal + '60' }}
                thumbColor={(toggles as any)[toggle.key] ?? true ? COLORS.teal : COLORS.gray}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.cream },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: A11Y.screenPadding, paddingBottom: 40 },
  backBtn: { marginBottom: 16 },
  backBtnText: { fontSize: 18, color: COLORS.navy, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.navy, marginBottom: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.navy, marginBottom: 10 },
  optionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  optionBtn: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.lightGray,
  },
  optionBtnActive: { backgroundColor: COLORS.teal, borderColor: COLORS.teal },
  optionText: { fontSize: 14, fontWeight: '600', color: COLORS.navy },
  optionTextActive: { color: COLORS.white },
  hint: { fontSize: 13, color: COLORS.gray, marginTop: 6 },
  quietText: { fontSize: 15, color: COLORS.gray },
  weightRow: { flexDirection: 'row', gap: 10 },
  weightInput: {
    flex: 1, borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: 12, padding: 12,
    fontSize: 16, color: COLORS.navy, backgroundColor: COLORS.white,
  },
  logWeightBtn: {
    backgroundColor: COLORS.teal, borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center',
  },
  logWeightText: { fontSize: 16, fontWeight: '600', color: COLORS.white },
  weightHistory: { marginTop: 12 },
  historyTitle: { fontSize: 14, fontWeight: '600', color: COLORS.gray, marginBottom: 6 },
  weightEntry: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray,
  },
  weightDate: { fontSize: 15, color: COLORS.navy },
  weightValue: { fontSize: 15, fontWeight: '600', color: COLORS.teal },
  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 8,
  },
  toggleLabel: { fontSize: 16, color: COLORS.navy, fontWeight: '500' },
});
