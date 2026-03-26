/**
 * Nutrition Dashboard - Caregiver
 * MIND score overview, today's meals, hydration progress, food category breakdown.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import { MIND_FOOD_CATEGORIES } from '../../constants/mindDietCategories';
import { supabase, getCurrentProfile, getCaregiverPatients } from '../../lib/supabase';
import { useNutritionStore } from '../../stores/nutritionStore';

export default function NutritionDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState('');
  const [careRelId, setCareRelId] = useState('');
  const [patientName, setPatientName] = useState('');

  const {
    mealLogs, todayHydration, currentMindScore,
    fetchTodayMeals, fetchTodayHydration, fetchHydrationSettings, computeWeeklyMindScore,
  } = useNutritionStore();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const profile = await getCurrentProfile();
      if (!profile) { router.replace('/'); return; }

      const patients = await getCaregiverPatients(profile.id);
      if (!patients || patients.length === 0) { setLoading(false); return; }

      const patient = patients[0].patient;
      const pid = patients[0].patient_id;
      const relId = patients[0].id;
      setPatientId(pid);
      setCareRelId(relId);
      setPatientName(patient?.display_name ?? 'Patient');

      // Get current week start (Monday)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
      const weekStart = monday.toISOString().split('T')[0];

      await Promise.all([
        fetchTodayMeals(pid),
        fetchHydrationSettings(relId),
        computeWeeklyMindScore(pid, weekStart),
      ]);
      await fetchTodayHydration(pid);
    } catch (err) {
      console.error('NutritionDashboard error:', err);
    }
    setLoading(false);
  }

  function navButton(label: string, emoji: string, route: string) {
    return (
      <Pressable
        key={route}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(route as any); }}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [st.navBtn, pressed && { backgroundColor: COLORS.glow }]}
      >
        <Text style={{ fontSize: 20, marginRight: 10 }}>{emoji}</Text>
        <Text style={st.navBtnText}>{label}</Text>
      </Pressable>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.center}><ActivityIndicator size="large" color={COLORS.teal} /></View>
      </SafeAreaView>
    );
  }

  // Determine which meals have been logged today
  const loggedMealTypes = new Set(mealLogs.map(m => m.meal_type));
  const mealTypes = ['breakfast', 'lunch', 'snack', 'dinner'];
  const mealIcons: Record<string, string> = { breakfast: '🌅', lunch: '☀️', snack: '🍎', dinner: '🌙' };

  // MIND score color
  const scoreColor = currentMindScore
    ? (currentMindScore.total >= 11 ? COLORS.success : currentMindScore.total >= 6 ? COLORS.gold : COLORS.coral)
    : COLORS.gray;

  // Missing brain-healthy categories
  const missingCategories = currentMindScore?.breakdown
    .filter(b => b.mindType === 'brain_healthy' && b.score === 0) ?? [];

  return (
    <SafeAreaView style={st.safe}>
      <ScrollView contentContainerStyle={st.scroll}>
        <Pressable onPress={() => router.back()} style={st.backBtn}>
          <Text style={st.backBtnText}>← Back</Text>
        </Pressable>

        <Text style={st.title}>Nutrition & Hydration</Text>
        <Text style={st.subtitle}>{patientName}</Text>

        {/* MIND Score Card */}
        <View style={st.card}>
          <Text style={st.cardLabel}>MIND Score This Week</Text>
          <Text style={[st.scoreNum, { color: scoreColor }]}>
            {currentMindScore ? currentMindScore.total : '—'}
          </Text>
          <Text style={st.scoreMax}>/ 15</Text>
          {currentMindScore && (
            <Text style={[st.ratingBadge, { backgroundColor: scoreColor + '20', color: scoreColor }]}>
              {currentMindScore.rating.replace('_', ' ')}
            </Text>
          )}
        </View>

        {/* Today's Meals */}
        <View style={st.section}>
          <Text style={st.sectionTitle}>Today's Meals</Text>
          <View style={st.mealRow}>
            {mealTypes.map(type => (
              <View key={type} style={[st.mealSlot, loggedMealTypes.has(type) && st.mealSlotFilled]}>
                <Text style={{ fontSize: 24 }}>{mealIcons[type]}</Text>
                <Text style={st.mealSlotLabel}>{type}</Text>
                {loggedMealTypes.has(type) && <Text style={st.mealCheck}>✓</Text>}
              </View>
            ))}
          </View>
        </View>

        {/* Hydration Progress */}
        <View style={st.section}>
          <Text style={st.sectionTitle}>Hydration Today</Text>
          <View style={st.hydrationCard}>
            <Text style={st.hydrationNum}>{todayHydration.glassesLogged}</Text>
            <Text style={st.hydrationSep}>of</Text>
            <Text style={st.hydrationTarget}>{todayHydration.glassesTarget}</Text>
            <Text style={st.hydrationUnit}>glasses</Text>
          </View>
          <View style={st.progressTrack}>
            <View style={[st.progressFill, { width: `${todayHydration.percentage}%` as any }]} />
          </View>
          <Text style={st.progressLabel}>{todayHydration.percentage}% of daily goal</Text>
        </View>

        {/* Missing Categories */}
        {missingCategories.length > 0 && (
          <View style={st.section}>
            <Text style={st.sectionTitle}>Missing MIND Foods</Text>
            <View style={st.missingRow}>
              {missingCategories.slice(0, 5).map(cat => (
                <View key={cat.categoryId} style={st.missingChip}>
                  <Text style={{ fontSize: 20 }}>{cat.emoji}</Text>
                  <Text style={st.missingLabel}>{cat.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Nav buttons */}
        {navButton('Plan Meals', '📋', '/(caregiver)/meal-planner')}
        {navButton('Grocery List', '🛒', '/(caregiver)/grocery-list')}
        {navButton('Nutrition Settings', '⚙️', '/(caregiver)/nutrition-settings')}
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
  title: { fontSize: 28, fontWeight: '700', color: COLORS.navy },
  subtitle: { fontSize: 16, color: COLORS.teal, fontWeight: '600', marginBottom: 20 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardLabel: { fontSize: 14, color: COLORS.gray, textTransform: 'uppercase', fontWeight: '600', marginBottom: 8 },
  scoreNum: { fontSize: 56, fontWeight: '700' },
  scoreMax: { fontSize: 18, color: COLORS.gray },
  ratingBadge: {
    fontSize: 14, fontWeight: '600', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12,
    marginTop: 8, textTransform: 'capitalize', overflow: 'hidden',
  },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.navy, marginBottom: 10 },
  mealRow: { flexDirection: 'row', gap: 8 },
  mealSlot: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: 12, padding: 12, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.lightGray,
  },
  mealSlotFilled: { backgroundColor: COLORS.glow, borderColor: COLORS.gold },
  mealSlotLabel: { fontSize: 12, color: COLORS.gray, marginTop: 4, textTransform: 'capitalize' },
  mealCheck: { fontSize: 14, color: COLORS.teal, fontWeight: '700', marginTop: 2 },
  hydrationCard: {
    flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 6,
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 10,
  },
  hydrationNum: { fontSize: 36, fontWeight: '700', color: COLORS.teal },
  hydrationSep: { fontSize: 18, color: COLORS.gray },
  hydrationTarget: { fontSize: 36, fontWeight: '700', color: COLORS.navy },
  hydrationUnit: { fontSize: 16, color: COLORS.gray },
  progressTrack: { height: 10, borderRadius: 5, backgroundColor: COLORS.lightGray, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.teal, borderRadius: 5 },
  progressLabel: { fontSize: 13, color: COLORS.gray, textAlign: 'center', marginTop: 6 },
  missingRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  missingChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.white, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: COLORS.gold,
  },
  missingLabel: { fontSize: 13, fontWeight: '600', color: COLORS.navy },
  navBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  navBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.navy },
});
