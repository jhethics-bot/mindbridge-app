/**
 * Meal Planner - Caregiver
 * Weekly meal calendar with add/edit/remove for each slot.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, TextInput, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import { MIND_FOOD_CATEGORIES } from '../../constants/mindDietCategories';
import { supabase, getCurrentProfile, getCaregiverPatients } from '../../lib/supabase';
import { useNutritionStore } from '../../stores/nutritionStore';

const MEAL_TYPES = ['breakfast', 'lunch', 'snack', 'dinner'] as const;
const MEAL_ICONS: Record<string, string> = { breakfast: '🌅', lunch: '☀️', snack: '🍎', dinner: '🌙' };

export default function MealPlannerScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [careRelId, setCareRelId] = useState('');
  const [weekStart, setWeekStart] = useState('');
  const [days, setDays] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editMealType, setEditMealType] = useState('');
  const [editMealName, setEditMealName] = useState('');
  const [editCategories, setEditCategories] = useState<Set<string>>(new Set());

  const { mealPlans, fetchMealPlans, saveMealPlan, deleteMealPlan, isLoading } = useNutritionStore();

  useEffect(() => { init(); }, []);

  async function init() {
    const profile = await getCurrentProfile();
    if (!profile) { router.replace('/'); return; }
    const patients = await getCaregiverPatients(profile.id);
    if (!patients || patients.length === 0) { setLoading(false); return; }

    const relId = patients[0].id;
    setCareRelId(relId);

    // Current week start (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    const ws = monday.toISOString().split('T')[0];
    setWeekStart(ws);

    // Generate 7 days
    const d: string[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      d.push(day.toISOString().split('T')[0]);
    }
    setDays(d);

    await fetchMealPlans(relId, ws);
    setLoading(false);
  }

  const getPlan = (date: string, mealType: string) => {
    return mealPlans.find(p => p.plan_date === date && p.meal_type === mealType);
  };

  const openAddModal = (date: string, mealType: string) => {
    const existing = getPlan(date, mealType);
    setEditDate(date);
    setEditMealType(mealType);
    setEditMealName(existing?.meal_name ?? '');
    setEditCategories(new Set(existing?.food_categories ?? []));
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!careRelId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await saveMealPlan(careRelId, editDate, editMealType, editMealName, Array.from(editCategories));
    setShowModal(false);
  };

  const handleDelete = async (planId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await deleteMealPlan(planId);
  };

  const toggleCat = (id: string) => {
    setEditCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const formatDay = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.center}><ActivityIndicator size="large" color={COLORS.teal} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={st.safe}>
      <ScrollView contentContainerStyle={st.scroll}>
        <Pressable onPress={() => router.back()} style={st.backBtn}>
          <Text style={st.backBtnText}>← Back</Text>
        </Pressable>
        <Text style={st.title}>Meal Planner</Text>

        {/* Week scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.weekScroll}>
          {days.map(date => (
            <View key={date} style={st.dayColumn}>
              <Text style={st.dayLabel}>{formatDay(date)}</Text>
              {MEAL_TYPES.map(mealType => {
                const plan = getPlan(date, mealType);
                const hasBrainFood = (plan?.food_categories ?? []).some(c =>
                  MIND_FOOD_CATEGORIES.find(mc => mc.id === c)?.mindType === 'brain_healthy'
                );
                const hasLimitFood = (plan?.food_categories ?? []).some(c =>
                  MIND_FOOD_CATEGORIES.find(mc => mc.id === c)?.mindType === 'limit'
                );
                return (
                  <Pressable
                    key={mealType}
                    onPress={() => openAddModal(date, mealType)}
                    style={[
                      st.mealSlot,
                      hasBrainFood && st.mealSlotGreen,
                      hasLimitFood && !hasBrainFood && st.mealSlotAmber,
                    ]}
                  >
                    <Text style={{ fontSize: 14 }}>{MEAL_ICONS[mealType]}</Text>
                    {plan ? (
                      <>
                        <Text style={st.mealName} numberOfLines={2}>{plan.meal_name || mealType}</Text>
                        <Text style={st.mealEmojis} numberOfLines={1}>
                          {(plan.food_categories ?? []).map(c =>
                            MIND_FOOD_CATEGORIES.find(mc => mc.id === c)?.emoji ?? ''
                          ).join('')}
                        </Text>
                      </>
                    ) : (
                      <Text style={st.addText}>+</Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </ScrollView>
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={st.modalOverlay}>
          <View style={st.modalContent}>
            <Text style={st.modalTitle}>
              {MEAL_ICONS[editMealType]} {editMealType} — {formatDay(editDate)}
            </Text>

            <TextInput
              style={st.input}
              placeholder="Meal name (e.g., Grilled Salmon)"
              value={editMealName}
              onChangeText={setEditMealName}
              placeholderTextColor={COLORS.gray}
            />

            <Text style={st.catLabel}>Food Categories:</Text>
            <View style={st.catGrid}>
              {MIND_FOOD_CATEGORIES.map(cat => (
                <Pressable
                  key={cat.id}
                  onPress={() => toggleCat(cat.id)}
                  style={[
                    st.catChip,
                    editCategories.has(cat.id) && {
                      backgroundColor: cat.mindType === 'brain_healthy' ? COLORS.success + '30' : COLORS.gold + '30',
                      borderColor: cat.mindType === 'brain_healthy' ? COLORS.success : COLORS.gold,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 18 }}>{cat.emoji}</Text>
                  <Text style={st.catChipLabel}>{cat.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={st.modalActions}>
              <Pressable onPress={() => setShowModal(false)} style={st.cancelBtn}>
                <Text style={st.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSave} style={st.saveBtn}>
                <Text style={st.saveText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  weekScroll: { marginBottom: 20 },
  dayColumn: { width: 140, marginRight: 12 },
  dayLabel: { fontSize: 14, fontWeight: '700', color: COLORS.navy, marginBottom: 8, textAlign: 'center' },
  mealSlot: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 10, marginBottom: 8,
    minHeight: 72, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.lightGray,
  },
  mealSlotGreen: { borderColor: COLORS.success, backgroundColor: COLORS.success + '10' },
  mealSlotAmber: { borderColor: COLORS.gold, backgroundColor: COLORS.gold + '10' },
  mealName: { fontSize: 12, fontWeight: '600', color: COLORS.navy, textAlign: 'center', marginTop: 2 },
  mealEmojis: { fontSize: 14, marginTop: 2 },
  addText: { fontSize: 24, color: COLORS.gray, fontWeight: '300' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: '80%',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.navy, marginBottom: 16, textTransform: 'capitalize' },
  input: {
    borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: 12, padding: 14,
    fontSize: 16, color: COLORS.navy, marginBottom: 16,
  },
  catLabel: { fontSize: 14, fontWeight: '600', color: COLORS.gray, marginBottom: 8 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    backgroundColor: COLORS.cream, borderWidth: 1, borderColor: COLORS.lightGray,
  },
  catChipLabel: { fontSize: 12, fontWeight: '500', color: COLORS.navy },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, padding: 14, borderRadius: 12, alignItems: 'center',
    backgroundColor: COLORS.lightGray,
  },
  cancelText: { fontSize: 16, fontWeight: '600', color: COLORS.navy },
  saveBtn: {
    flex: 1, padding: 14, borderRadius: 12, alignItems: 'center',
    backgroundColor: COLORS.teal,
  },
  saveText: { fontSize: 16, fontWeight: '600', color: COLORS.white },
});
