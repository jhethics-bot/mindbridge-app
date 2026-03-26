/**
 * Grocery List - Caregiver
 * Auto-generated from meal plans, organized by section, MIND diet markers.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator, Alert, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import { MIND_FOOD_CATEGORIES } from '../../constants/mindDietCategories';
import { supabase, getCurrentProfile, getCaregiverPatients } from '../../lib/supabase';
import { useNutritionStore, type GroceryItem } from '../../stores/nutritionStore';

const MIND_ESSENTIALS: GroceryItem[] = [
  { name: 'Spinach', section: 'Produce', checked: false, mind_item: true },
  { name: 'Blueberries', section: 'Produce', checked: false, mind_item: true },
  { name: 'Broccoli', section: 'Produce', checked: false, mind_item: true },
  { name: 'Salmon', section: 'Proteins', checked: false, mind_item: true },
  { name: 'Chicken breast', section: 'Proteins', checked: false, mind_item: true },
  { name: 'Walnuts', section: 'Pantry', checked: false, mind_item: true },
  { name: 'Almonds', section: 'Pantry', checked: false, mind_item: true },
  { name: 'Black beans', section: 'Pantry', checked: false, mind_item: true },
  { name: 'Extra virgin olive oil', section: 'Pantry', checked: false, mind_item: true },
  { name: 'Oatmeal', section: 'Grains', checked: false, mind_item: true },
];

export default function GroceryListScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [careRelId, setCareRelId] = useState('');
  const [weekStart, setWeekStart] = useState('');

  const {
    groceryList, fetchGroceryList, generateGroceryList,
    fetchMealPlans, updateGroceryItem,
  } = useNutritionStore();

  useEffect(() => { init(); }, []);

  async function init() {
    const profile = await getCurrentProfile();
    if (!profile) { router.replace('/'); return; }
    const patients = await getCaregiverPatients(profile.id);
    if (!patients || patients.length === 0) { setLoading(false); return; }

    const relId = patients[0].id;
    setCareRelId(relId);

    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    const ws = monday.toISOString().split('T')[0];
    setWeekStart(ws);

    await fetchMealPlans(relId, ws);
    await fetchGroceryList(relId, ws);
    setLoading(false);
  }

  const handleGenerate = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await generateGroceryList(careRelId, weekStart);
  };

  const handleAddEssentials = async () => {
    if (!groceryList) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const existing = new Set(groceryList.items.map(i => i.name.toLowerCase()));
    const newItems = MIND_ESSENTIALS.filter(e => !existing.has(e.name.toLowerCase()));
    if (newItems.length === 0) {
      Alert.alert('Already Added', 'All MIND essentials are already on your list.');
      return;
    }
    const allItems = [...groceryList.items, ...newItems];
    await supabase
      .from('grocery_lists')
      .update({ items: allItems, updated_at: new Date().toISOString() })
      .eq('id', groceryList.id);
    await fetchGroceryList(careRelId, weekStart);
  };

  const handleToggleItem = (index: number) => {
    if (!groceryList) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateGroceryItem(groceryList.id, index, !groceryList.items[index].checked);
  };

  const handleShare = async () => {
    if (!groceryList) return;
    const sections: Record<string, string[]> = {};
    for (const item of groceryList.items) {
      if (!sections[item.section]) sections[item.section] = [];
      const prefix = item.checked ? '✅' : '⬜';
      const brain = item.mind_item ? ' 🧠' : '';
      sections[item.section].push(`${prefix} ${item.name}${brain}`);
    }
    let text = 'Grocery List\n';
    for (const [section, items] of Object.entries(sections)) {
      text += `\n${section}:\n${items.join('\n')}\n`;
    }
    try {
      await Share.share({ message: text });
    } catch {
      Alert.alert('Error', 'Could not share grocery list.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.center}><ActivityIndicator size="large" color={COLORS.teal} /></View>
      </SafeAreaView>
    );
  }

  // Group items by section
  const sections: Record<string, { item: GroceryItem; index: number }[]> = {};
  if (groceryList) {
    groceryList.items.forEach((item, index) => {
      if (!sections[item.section]) sections[item.section] = [];
      sections[item.section].push({ item, index });
    });
  }

  return (
    <SafeAreaView style={st.safe}>
      <ScrollView contentContainerStyle={st.scroll}>
        <Pressable onPress={() => router.back()} style={st.backBtn}>
          <Text style={st.backBtnText}>← Back</Text>
        </Pressable>
        <Text style={st.title}>Grocery List</Text>

        {/* Actions */}
        <View style={st.actionRow}>
          <Pressable onPress={handleGenerate} style={st.actionBtn}>
            <Text style={st.actionText}>Generate from Plans</Text>
          </Pressable>
          {groceryList && (
            <Pressable onPress={handleAddEssentials} style={st.actionBtn}>
              <Text style={st.actionText}>🧠 MIND Essentials</Text>
            </Pressable>
          )}
        </View>

        {groceryList ? (
          <>
            {Object.entries(sections).map(([section, items]) => (
              <View key={section} style={st.sectionBlock}>
                <Text style={st.sectionTitle}>{section}</Text>
                {items.map(({ item, index }) => (
                  <Pressable
                    key={index}
                    onPress={() => handleToggleItem(index)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: item.checked }}
                    accessibilityLabel={item.name}
                    style={st.itemRow}
                  >
                    <View style={[st.checkbox, item.checked && st.checkboxChecked]}>
                      {item.checked && <Text style={st.checkText}>✓</Text>}
                    </View>
                    <Text style={[st.itemName, item.checked && st.itemChecked]}>
                      {item.name}
                    </Text>
                    {item.mind_item && <Text style={st.brainIcon}>🧠</Text>}
                  </Pressable>
                ))}
              </View>
            ))}

            <Pressable onPress={handleShare} style={st.shareBtn}>
              <Text style={st.shareText}>Share List</Text>
            </Pressable>
          </>
        ) : (
          <View style={st.emptyState}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🛒</Text>
            <Text style={st.emptyText}>No grocery list yet.</Text>
            <Text style={st.emptySubtext}>Generate one from your meal plans.</Text>
          </View>
        )}
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
  title: { fontSize: 28, fontWeight: '700', color: COLORS.navy, marginBottom: 16 },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  actionBtn: {
    flex: 1, backgroundColor: COLORS.teal, borderRadius: 12, padding: 12, alignItems: 'center',
  },
  actionText: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  sectionBlock: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.navy, marginBottom: 8 },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 6,
  },
  checkbox: {
    width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: COLORS.lightGray,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: COLORS.teal, borderColor: COLORS.teal },
  checkText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  itemName: { flex: 1, fontSize: 16, color: COLORS.navy },
  itemChecked: { textDecorationLine: 'line-through', color: COLORS.gray },
  brainIcon: { fontSize: 16 },
  shareBtn: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 12,
    borderWidth: 1, borderColor: COLORS.teal,
  },
  shareText: { fontSize: 16, fontWeight: '700', color: COLORS.teal },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 20, fontWeight: '600', color: COLORS.navy },
  emptySubtext: { fontSize: 16, color: COLORS.gray, marginTop: 4 },
});
