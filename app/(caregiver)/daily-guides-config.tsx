/**
 * Daily Guides Configuration — Caregiver Screen
 * Enable/disable guides, add custom notes per guide.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, TextInput, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import { supabase, getCurrentProfile, getCaregiverPatients } from '../../lib/supabase';

interface GuideConfig {
  id: string;
  title: string;
  emoji: string;
  enabled: boolean;
  notes: string;
}

const DEFAULT_GUIDES: GuideConfig[] = [
  { id: 'getting_dressed', title: 'Getting Dressed', emoji: '👕', enabled: true, notes: '' },
  { id: 'brushing_teeth', title: 'Brushing Teeth', emoji: '🪥', enabled: true, notes: '' },
  { id: 'simple_meal', title: 'Making a Simple Meal', emoji: '🍳', enabled: true, notes: '' },
  { id: 'taking_meds', title: 'Taking Medications', emoji: '💊', enabled: true, notes: '' },
  { id: 'using_phone', title: 'Using the Phone', emoji: '📱', enabled: true, notes: '' },
  { id: 'going_walk', title: 'Going for a Walk', emoji: '🚶', enabled: true, notes: '' },
  { id: 'preparing_bed', title: 'Preparing for Bed', emoji: '🛌', enabled: true, notes: '' },
  { id: 'washing_hands', title: 'Washing Hands', emoji: '🧼', enabled: true, notes: '' },
];

export default function DailyGuidesConfigScreen() {
  const router = useRouter();
  const [guides, setGuides] = useState<GuideConfig[]>(DEFAULT_GUIDES);
  const [patientId, setPatientId] = useState('');

  useEffect(() => { loadConfig(); }, []);

  async function loadConfig() {
    const profile = await getCurrentProfile();
    if (!profile) return;
    const patients = await getCaregiverPatients(profile.id);
    if (!patients || patients.length === 0) return;
    setPatientId(patients[0].patient_id);

    // Try loading saved config from daily_living_guides
    try {
      const { data } = await supabase
        .from('daily_living_guides')
        .select('id, title, emoji, is_enabled, caregiver_notes')
        .eq('patient_id', patients[0].patient_id)
        .order('sort_order');
      if (data && data.length > 0) {
        setGuides(data.map((g: any) => ({
          id: g.id,
          title: g.title,
          emoji: g.emoji || '📋',
          enabled: g.is_enabled ?? true,
          notes: g.caregiver_notes || '',
        })));
      }
    } catch {}
  }

  const toggleGuide = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGuides(prev => prev.map(g =>
      g.id === id ? { ...g, enabled: !g.enabled } : g
    ));
    // Persist
    const guide = guides.find(g => g.id === id);
    if (guide && patientId) {
      try {
        await supabase.from('daily_living_guides')
          .update({ is_enabled: !guide.enabled })
          .eq('id', id);
      } catch {}
    }
  };

  const updateNotes = async (id: string, notes: string) => {
    setGuides(prev => prev.map(g =>
      g.id === id ? { ...g, notes } : g
    ));
  };

  const saveNotes = async (id: string) => {
    const guide = guides.find(g => g.id === id);
    if (!guide) return;
    try {
      await supabase.from('daily_living_guides')
        .update({ caregiver_notes: guide.notes })
        .eq('id', id);
    } catch {}
  };

  return (
    <SafeAreaView style={st.safe}>
      <ScrollView contentContainerStyle={st.scroll}>
        <Pressable onPress={() => router.back()} style={st.backBtn}>
          <Text style={st.backText}>← Back</Text>
        </Pressable>
        <Text style={st.title}>Daily Guides</Text>
        <Text style={st.subtitle}>Enable or disable guides. Add personal notes for each step.</Text>

        {guides.map(guide => (
          <View key={guide.id} style={st.card}>
            <View style={st.cardHeader}>
              <Text style={{ fontSize: 28 }}>{guide.emoji}</Text>
              <Text style={st.cardTitle}>{guide.title}</Text>
              <Switch
                value={guide.enabled}
                onValueChange={() => toggleGuide(guide.id)}
                trackColor={{ false: COLORS.lightGray, true: COLORS.teal + '60' }}
                thumbColor={guide.enabled ? COLORS.teal : COLORS.gray}
              />
            </View>
            <TextInput
              style={st.notesInput}
              placeholder="Add personal notes (e.g., 'Mom likes the blue toothbrush')"
              placeholderTextColor={COLORS.gray}
              value={guide.notes}
              onChangeText={(text) => updateNotes(guide.id, text)}
              onEndEditing={() => saveNotes(guide.id)}
              multiline
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.cream },
  scroll: { padding: A11Y.screenPadding, paddingBottom: 40 },
  backBtn: { marginBottom: 16 },
  backText: { fontSize: 18, color: COLORS.teal, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.navy, marginBottom: 4 },
  subtitle: { fontSize: 14, color: COLORS.gray, marginBottom: 20 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8,
  },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: COLORS.navy },
  notesInput: {
    backgroundColor: COLORS.cream, borderRadius: 10, padding: 10, fontSize: 14,
    color: COLORS.navy, minHeight: 40,
  },
});
