/**
 * CompanionPetWidget - Caregiver Dashboard Pet Summary
 * Shows: pet name + type, today's interactions, last interaction,
 * current mood, and 7-day interaction trend.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';
import { computePetMood, getTimeOfDay, minutesSince } from '../lib/petMoodEngine';
import type { PetMoodState, PetType } from '../lib/petMoodEngine';
import { COLORS } from '../constants/colors';

interface CompanionPetWidgetProps {
  patientId: string;
}

interface PetData {
  petName: string;
  petType: PetType;
  moodState: PetMoodState;
  moodEmoji: string;
  interactionsToday: number;
  lastInteractionAt: string | null;
  weeklyTrend: number[]; // 7 values, oldest first
}

const PET_TYPE_EMOJI: Record<PetType, string> = {
  dog: '🐕', cat: '🐱', bird: '🐦', bunny: '🐰',
};

const MOOD_EMOJI: Record<PetMoodState, string> = {
  happy: '😊', calm: '😌', sleepy: '😴', cozy: '🥰', curious: '🤔',
};

export function CompanionPetWidget({ patientId }: CompanionPetWidgetProps) {
  const [data, setData] = useState<PetData | null>(null);

  useEffect(() => {
    loadPetData();
  }, [patientId]);

  async function loadPetData() {
    try {
      // Get care_relationship
      const { data: rel } = await supabase
        .from('care_relationships')
        .select('id')
        .eq('patient_id', patientId)
        .limit(1)
        .single();
      if (!rel) return;

      // Get pet
      const { data: pet } = await supabase
        .from('companion_pets')
        .select('id, pet_name, pet_type')
        .eq('care_relationship_id', rel.id)
        .single();
      if (!pet) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Today's interaction count
      const { count: todayCount } = await supabase
        .from('pet_interactions')
        .select('*', { count: 'exact', head: true })
        .eq('pet_id', pet.id)
        .gte('created_at', today.toISOString());

      // Last interaction
      const { data: lastRow } = await supabase
        .from('pet_interactions')
        .select('created_at')
        .eq('pet_id', pet.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // 7-day trend
      const trend: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const dayStart = new Date();
        dayStart.setDate(dayStart.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const { count } = await supabase
          .from('pet_interactions')
          .select('*', { count: 'exact', head: true })
          .eq('pet_id', pet.id)
          .gte('created_at', dayStart.toISOString())
          .lt('created_at', dayEnd.toISOString());

        trend.push(count ?? 0);
      }

      // Today's activity count for mood
      const { count: actCount } = await supabase
        .from('activity_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', patientId)
        .gte('created_at', today.toISOString());

      // Latest mood check-in
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: moodRows } = await supabase
        .from('mood_checkins')
        .select('mood')
        .eq('patient_id', patientId)
        .gte('created_at', `${todayStr}T00:00:00`)
        .order('created_at', { ascending: false })
        .limit(1);

      const MOOD_SCORE: Record<string, number> = {
        happy: 5, okay: 3, sad: 1, confused: 2, tired: 2,
      };
      const moodScore = moodRows?.[0]?.mood ? (MOOD_SCORE[moodRows[0].mood] ?? null) : null;

      const moodResult = computePetMood({
        timeOfDay: getTimeOfDay(),
        activitiesCompletedToday: actCount ?? 0,
        lastInteractionMinutesAgo: minutesSince(lastRow?.created_at),
        patientMoodScore: moodScore,
      });

      setData({
        petName: pet.pet_name,
        petType: pet.pet_type as PetType,
        moodState: moodResult.state,
        moodEmoji: MOOD_EMOJI[moodResult.state],
        interactionsToday: todayCount ?? 0,
        lastInteractionAt: lastRow?.created_at ?? null,
        weeklyTrend: trend,
      });
    } catch (e) {
      console.warn('[CompanionPetWidget] Load error:', e);
    }
  }

  if (!data) return null;

  const maxTrend = Math.max(...data.weeklyTrend, 1);
  // Align labels to actual days of week
  const todayDow = new Date().getDay(); // 0=Sun
  const labels: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const dow = (todayDow - i + 7) % 7;
    labels.push(['S', 'M', 'T', 'W', 'T', 'F', 'S'][dow]);
  }

  function formatLastSeen(ts: string | null): string {
    if (!ts) return 'No interactions yet';
    const mins = minutesSince(ts);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  }

  return (
    <View style={st.card}>
      <View style={st.headerRow}>
        <Text style={st.petEmoji}>{PET_TYPE_EMOJI[data.petType]}</Text>
        <View style={{ flex: 1 }}>
          <Text style={st.petName}>{data.petName}</Text>
          <Text style={st.petType}>{data.petType}</Text>
        </View>
        <View style={st.moodBadge}>
          <Text style={{ fontSize: 20 }}>{data.moodEmoji}</Text>
          <Text style={st.moodLabel}>{data.moodState}</Text>
        </View>
      </View>

      <View style={st.statsRow}>
        <View style={st.stat}>
          <Text style={st.statNum}>{data.interactionsToday}</Text>
          <Text style={st.statLabel}>Today</Text>
        </View>
        <View style={st.stat}>
          <Text style={st.statValue}>{formatLastSeen(data.lastInteractionAt)}</Text>
          <Text style={st.statLabel}>Last Seen</Text>
        </View>
      </View>

      {/* 7-day trend bar chart */}
      <View style={st.trendContainer}>
        <Text style={st.trendTitle}>7-Day Interactions</Text>
        <View style={st.trendRow}>
          {data.weeklyTrend.map((count, i) => (
            <View key={i} style={st.trendCol}>
              <View style={st.barContainer}>
                <View
                  style={[
                    st.bar,
                    {
                      height: Math.max((count / maxTrend) * 32, 3),
                      backgroundColor: i === 6 ? COLORS.teal : COLORS.lightGray,
                    },
                  ]}
                />
              </View>
              <Text style={st.trendLabel}>{labels[i]}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  petEmoji: { fontSize: 36 },
  petName: { fontSize: 18, fontWeight: '700', color: COLORS.navy },
  petType: { fontSize: 14, color: COLORS.gray, textTransform: 'capitalize' },
  moodBadge: { alignItems: 'center' },
  moodLabel: { fontSize: 11, color: COLORS.gray, textTransform: 'capitalize', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  stat: { flex: 1, backgroundColor: COLORS.cream, borderRadius: 12, padding: 10, alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: '700', color: COLORS.teal },
  statValue: { fontSize: 14, fontWeight: '600', color: COLORS.navy },
  statLabel: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  trendContainer: { marginTop: 4 },
  trendTitle: { fontSize: 13, fontWeight: '600', color: COLORS.gray, marginBottom: 8 },
  trendRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  trendCol: { flex: 1, alignItems: 'center' },
  barContainer: { height: 36, justifyContent: 'flex-end' },
  bar: { width: 12, borderRadius: 3 },
  trendLabel: { fontSize: 11, color: COLORS.gray, marginTop: 4 },
});
