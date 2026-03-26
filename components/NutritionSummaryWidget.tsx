/**
 * NutritionSummaryWidget - Caregiver Dashboard Nutrition Summary
 * Shows: MIND score, hydration progress, meals logged today.
 * Same pattern as CompanionPetWidget.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabase';
import { buildWeekCounts, computeMindScore } from '../lib/mindScoreEngine';
import { getHydrationProgress } from '../lib/hydrationUtils';
import { COLORS } from '../constants/colors';

interface NutritionSummaryWidgetProps {
  patientId: string;
}

interface WidgetData {
  mindScore: number | null;
  mindRating: string;
  hydrationGlasses: number;
  hydrationTarget: number;
  hydrationPct: number;
  mealsToday: number;
}

export function NutritionSummaryWidget({ patientId }: NutritionSummaryWidgetProps) {
  const router = useRouter();
  const [data, setData] = useState<WidgetData | null>(null);

  useEffect(() => {
    loadData();
  }, [patientId]);

  async function loadData() {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get care relationship for hydration settings
      const { data: rel } = await supabase
        .from('care_relationships')
        .select('id')
        .eq('patient_id', patientId)
        .limit(1)
        .single();

      // Current week start (Monday)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
      const weekStart = monday.toISOString().split('T')[0];
      const weekEnd = new Date(monday);
      weekEnd.setDate(monday.getDate() + 6);

      const [mealsRes, hydRes, weekMealsRes, settingsRes] = await Promise.all([
        supabase.from('meal_logs').select('id').eq('patient_id', patientId).eq('meal_date', today),
        supabase.from('hydration_logs').select('amount_oz').eq('patient_id', patientId).eq('log_date', today),
        supabase.from('meal_logs').select('food_categories')
          .eq('patient_id', patientId)
          .gte('meal_date', weekStart)
          .lte('meal_date', weekEnd.toISOString().split('T')[0]),
        rel ? supabase.from('hydration_settings').select('daily_target_oz')
          .eq('care_relationship_id', rel.id).single() : Promise.resolve({ data: null }),
      ]);

      // MIND score
      const weekMeals = (weekMealsRes.data ?? []).map(m => ({
        food_categories: m.food_categories ?? [],
      }));
      const weekCounts = buildWeekCounts(weekMeals);
      const score = computeMindScore(weekCounts);

      // Hydration
      const targetOz = settingsRes.data?.daily_target_oz ?? 64;
      const hydProgress = getHydrationProgress(
        (hydRes.data ?? []).map(h => ({ amount_oz: Number(h.amount_oz) })),
        targetOz
      );

      setData({
        mindScore: score.total,
        mindRating: score.rating,
        hydrationGlasses: hydProgress.glassesLogged,
        hydrationTarget: hydProgress.glassesTarget,
        hydrationPct: hydProgress.percentage,
        mealsToday: mealsRes.data?.length ?? 0,
      });
    } catch (e) {
      console.warn('[NutritionSummaryWidget] Load error:', e);
    }
  }

  if (!data) return null;

  const scoreColor = data.mindScore !== null
    ? (data.mindScore >= 11 ? COLORS.success : data.mindScore >= 6 ? COLORS.gold : COLORS.coral)
    : COLORS.gray;

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/(caregiver)/nutrition-dashboard' as any);
      }}
      accessibilityRole="button"
      accessibilityLabel="Nutrition summary. Tap for details."
      style={({ pressed }) => [st.card, pressed && { opacity: 0.9 }]}
    >
      <View style={st.headerRow}>
        <Text style={{ fontSize: 24 }}>🥗</Text>
        <Text style={st.headerTitle}>Nutrition & Hydration</Text>
      </View>

      <View style={st.statsRow}>
        <View style={st.stat}>
          <Text style={[st.statNum, { color: scoreColor }]}>{data.mindScore ?? '—'}</Text>
          <Text style={st.statLabel}>MIND Score</Text>
        </View>
        <View style={st.stat}>
          <Text style={st.statNum}>{data.hydrationGlasses}/{data.hydrationTarget}</Text>
          <Text style={st.statLabel}>Glasses</Text>
        </View>
        <View style={st.stat}>
          <Text style={st.statNum}>{data.mealsToday}</Text>
          <Text style={st.statLabel}>Meals Today</Text>
        </View>
      </View>

      {/* Hydration progress bar */}
      <View style={st.progressTrack}>
        <View style={[st.progressFill, { width: `${data.hydrationPct}%` as any }]} />
      </View>
    </Pressable>
  );
}

const st = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.navy },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  stat: { flex: 1, backgroundColor: COLORS.cream, borderRadius: 12, padding: 10, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '700', color: COLORS.teal },
  statLabel: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: COLORS.lightGray, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.teal, borderRadius: 3 },
});
