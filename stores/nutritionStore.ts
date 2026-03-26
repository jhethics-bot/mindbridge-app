/**
 * nutritionStore - NeuBridge Nutrition & Hydration State (Zustand)
 *
 * Tracks meal logs, hydration, MIND scores, meal plans, grocery lists,
 * and weight for the nutrition module.
 */
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { buildWeekCounts, computeMindScore, type MindScoreResult } from '../lib/mindScoreEngine';
import { getHydrationProgress, type HydrationProgress } from '../lib/hydrationUtils';
import { MIND_FOOD_CATEGORIES } from '../constants/mindDietCategories';

// ============================================
// TYPES
// ============================================

export interface MealLog {
  id: string;
  patient_id: string;
  logged_by: string | null;
  meal_type: string;
  meal_date: string;
  food_categories: string[];
  notes: string | null;
  created_at: string;
}

export interface HydrationLog {
  id: string;
  patient_id: string;
  drink_type: string;
  amount_oz: number;
  log_date: string;
  created_at: string;
}

export interface HydrationSettings {
  id: string;
  care_relationship_id: string;
  daily_target_oz: number;
  reminder_frequency_hours: number;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

export interface MealPlan {
  id: string;
  care_relationship_id: string;
  plan_date: string;
  meal_type: string;
  meal_name: string | null;
  food_categories: string[];
  recipe_notes: string | null;
}

export interface GroceryItem {
  name: string;
  section: string;
  checked: boolean;
  mind_item: boolean;
}

export interface GroceryList {
  id: string;
  care_relationship_id: string;
  week_start: string;
  items: GroceryItem[];
}

export interface WeightLog {
  id: string;
  patient_id: string;
  weight_lbs: number;
  log_date: string;
}

// ============================================
// STORE INTERFACE
// ============================================

interface NutritionState {
  mealLogs: MealLog[];
  hydrationLogs: HydrationLog[];
  hydrationSettings: HydrationSettings | null;
  currentMindScore: MindScoreResult | null;
  mealPlans: MealPlan[];
  groceryList: GroceryList | null;
  todayHydration: HydrationProgress;
  weightLogs: WeightLog[];
  isLoading: boolean;

  // Patient actions
  fetchTodayMeals: (patientId: string) => Promise<void>;
  fetchTodayHydration: (patientId: string) => Promise<void>;
  logMeal: (patientId: string, mealType: string, foodCategories: string[], loggedBy?: string) => Promise<void>;
  logDrink: (patientId: string, drinkType: string, amountOz: number, loggedBy?: string) => Promise<void>;

  // Score
  fetchWeekMeals: (patientId: string, weekStart: string) => Promise<void>;
  computeWeeklyMindScore: (patientId: string, weekStart: string) => Promise<void>;

  // Caregiver actions
  fetchMealPlans: (careRelationshipId: string, weekStart: string) => Promise<void>;
  saveMealPlan: (careRelationshipId: string, planDate: string, mealType: string, mealName: string, foodCategories: string[]) => Promise<void>;
  deleteMealPlan: (planId: string) => Promise<void>;
  fetchGroceryList: (careRelationshipId: string, weekStart: string) => Promise<void>;
  generateGroceryList: (careRelationshipId: string, weekStart: string) => Promise<void>;
  updateGroceryItem: (listId: string, itemIndex: number, checked: boolean) => Promise<void>;
  fetchHydrationSettings: (careRelationshipId: string) => Promise<void>;
  updateHydrationSettings: (careRelationshipId: string, settings: Partial<HydrationSettings>) => Promise<void>;
  logWeight: (patientId: string, weightLbs: number, loggedBy?: string) => Promise<void>;
  fetchWeightLogs: (patientId: string) => Promise<void>;
}

// ============================================
// STORE
// ============================================

export const useNutritionStore = create<NutritionState>((set, get) => ({
  mealLogs: [],
  hydrationLogs: [],
  hydrationSettings: null,
  currentMindScore: null,
  mealPlans: [],
  groceryList: null,
  todayHydration: { current: 0, target: 64, percentage: 0, glassesLogged: 0, glassesTarget: 8 },
  weightLogs: [],
  isLoading: false,

  fetchTodayMeals: async (patientId) => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('patient_id', patientId)
      .eq('meal_date', today)
      .order('created_at', { ascending: false });
    set({ mealLogs: data ?? [] });
  },

  fetchTodayHydration: async (patientId) => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('hydration_logs')
      .select('*')
      .eq('patient_id', patientId)
      .eq('log_date', today)
      .order('created_at', { ascending: false });

    const logs = data ?? [];
    const settings = get().hydrationSettings;
    const targetOz = settings?.daily_target_oz ?? 64;
    const progress = getHydrationProgress(
      logs.map(l => ({ amount_oz: Number(l.amount_oz) })),
      targetOz
    );

    set({ hydrationLogs: logs, todayHydration: progress });
  },

  logMeal: async (patientId, mealType, foodCategories, loggedBy) => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('meal_logs')
      .insert({
        patient_id: patientId,
        logged_by: loggedBy ?? patientId,
        meal_type: mealType,
        food_categories: foodCategories,
      })
      .select()
      .single();

    if (!error && data) {
      // Also insert meal_items for MIND tracking
      const items = foodCategories.map(cat => {
        const mindCat = MIND_FOOD_CATEGORIES.find(c => c.id === cat);
        return {
          meal_log_id: data.id,
          food_category: cat,
          mind_category: mindCat?.mindType ?? 'neutral',
          servings: 1,
        };
      });
      if (items.length > 0) {
        await supabase.from('meal_items').insert(items);
      }
      set(state => ({ mealLogs: [data, ...state.mealLogs], isLoading: false }));
    } else {
      set({ isLoading: false });
    }
  },

  logDrink: async (patientId, drinkType, amountOz, loggedBy) => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('hydration_logs')
      .insert({
        patient_id: patientId,
        logged_by: loggedBy ?? patientId,
        drink_type: drinkType,
        amount_oz: amountOz,
      })
      .select()
      .single();

    if (!error && data) {
      const logs = [data, ...get().hydrationLogs];
      const settings = get().hydrationSettings;
      const targetOz = settings?.daily_target_oz ?? 64;
      const progress = getHydrationProgress(
        logs.map(l => ({ amount_oz: Number(l.amount_oz) })),
        targetOz
      );
      set({ hydrationLogs: logs, todayHydration: progress, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  fetchWeekMeals: async (patientId, weekStart) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const { data } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('patient_id', patientId)
      .gte('meal_date', weekStart)
      .lte('meal_date', weekEnd.toISOString().split('T')[0])
      .order('meal_date');
    set({ mealLogs: data ?? [] });
  },

  computeWeeklyMindScore: async (patientId, weekStart) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    const { data: meals } = await supabase
      .from('meal_logs')
      .select('food_categories')
      .eq('patient_id', patientId)
      .gte('meal_date', weekStart)
      .lte('meal_date', weekEndStr);

    const weekCounts = buildWeekCounts(
      (meals ?? []).map(m => ({ food_categories: m.food_categories ?? [] }))
    );
    const result = computeMindScore(weekCounts);
    set({ currentMindScore: result });

    // Persist to mind_scores table
    await supabase.from('mind_scores').upsert({
      patient_id: patientId,
      week_start: weekStart,
      week_end: weekEndStr,
      score: Math.round(result.total),
      category_scores: Object.fromEntries(
        result.breakdown.map(b => [b.categoryId, b.score])
      ),
    }, { onConflict: 'patient_id,week_start' });
  },

  fetchMealPlans: async (careRelationshipId, weekStart) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const { data } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('care_relationship_id', careRelationshipId)
      .gte('plan_date', weekStart)
      .lte('plan_date', weekEnd.toISOString().split('T')[0])
      .order('plan_date');
    set({ mealPlans: data ?? [] });
  },

  saveMealPlan: async (careRelationshipId, planDate, mealType, mealName, foodCategories) => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('meal_plans')
      .upsert({
        care_relationship_id: careRelationshipId,
        plan_date: planDate,
        meal_type: mealType,
        meal_name: mealName,
        food_categories: foodCategories,
      }, { onConflict: 'care_relationship_id,plan_date,meal_type' })
      .select()
      .single();

    if (!error && data) {
      set(state => {
        const plans = state.mealPlans.filter(
          p => !(p.plan_date === planDate && p.meal_type === mealType)
        );
        return { mealPlans: [...plans, data].sort((a, b) => a.plan_date.localeCompare(b.plan_date)), isLoading: false };
      });
    } else {
      set({ isLoading: false });
    }
  },

  deleteMealPlan: async (planId) => {
    await supabase.from('meal_plans').delete().eq('id', planId);
    set(state => ({ mealPlans: state.mealPlans.filter(p => p.id !== planId) }));
  },

  fetchGroceryList: async (careRelationshipId, weekStart) => {
    const { data } = await supabase
      .from('grocery_lists')
      .select('*')
      .eq('care_relationship_id', careRelationshipId)
      .eq('week_start', weekStart)
      .single();

    if (data) {
      set({ groceryList: { ...data, items: (data.items as GroceryItem[]) ?? [] } });
    } else {
      set({ groceryList: null });
    }
  },

  generateGroceryList: async (careRelationshipId, weekStart) => {
    // Build grocery list from current meal plans
    const { mealPlans } = get();

    // Collect all food categories from plans
    const categoryCounts: Record<string, number> = {};
    for (const plan of mealPlans) {
      for (const cat of (plan.food_categories ?? [])) {
        categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
      }
    }

    // Map food categories to grocery sections
    const SECTION_MAP: Record<string, string> = {
      leafy_greens: 'Produce', other_vegetables: 'Produce', berries: 'Produce',
      nuts: 'Pantry', beans: 'Pantry', whole_grains: 'Grains',
      fish: 'Proteins', poultry: 'Proteins', olive_oil: 'Pantry',
      wine: 'Other', red_meat: 'Proteins', butter: 'Dairy',
      cheese: 'Dairy', sweets: 'Other', fried_fast: 'Other',
    };

    const items: GroceryItem[] = [];
    for (const [catId, count] of Object.entries(categoryCounts)) {
      const mindCat = MIND_FOOD_CATEGORIES.find(c => c.id === catId);
      if (mindCat) {
        const example = mindCat.examples.split(',')[0].trim();
        items.push({
          name: `${example} (${count}x)`,
          section: SECTION_MAP[catId] ?? 'Other',
          checked: false,
          mind_item: mindCat.mindType === 'brain_healthy',
        });
      }
    }

    // Sort by section
    items.sort((a, b) => a.section.localeCompare(b.section));

    const { data, error } = await supabase
      .from('grocery_lists')
      .upsert({
        care_relationship_id: careRelationshipId,
        week_start: weekStart,
        items,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'care_relationship_id,week_start' })
      .select()
      .single();

    if (!error && data) {
      set({ groceryList: { ...data, items: (data.items as GroceryItem[]) ?? [] } });
    }
  },

  updateGroceryItem: async (listId, itemIndex, checked) => {
    const { groceryList } = get();
    if (!groceryList || groceryList.id !== listId) return;

    const newItems = [...groceryList.items];
    if (newItems[itemIndex]) {
      newItems[itemIndex] = { ...newItems[itemIndex], checked };
    }

    set({ groceryList: { ...groceryList, items: newItems } });

    await supabase
      .from('grocery_lists')
      .update({ items: newItems, updated_at: new Date().toISOString() })
      .eq('id', listId);
  },

  fetchHydrationSettings: async (careRelationshipId) => {
    const { data } = await supabase
      .from('hydration_settings')
      .select('*')
      .eq('care_relationship_id', careRelationshipId)
      .single();

    set({ hydrationSettings: data ?? null });
  },

  updateHydrationSettings: async (careRelationshipId, settings) => {
    const { data } = await supabase
      .from('hydration_settings')
      .upsert({
        care_relationship_id: careRelationshipId,
        ...settings,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'care_relationship_id' })
      .select()
      .single();

    if (data) set({ hydrationSettings: data });
  },

  logWeight: async (patientId, weightLbs, loggedBy) => {
    await supabase.from('weight_logs').insert({
      patient_id: patientId,
      logged_by: loggedBy ?? patientId,
      weight_lbs: weightLbs,
    });
    get().fetchWeightLogs(patientId);
  },

  fetchWeightLogs: async (patientId) => {
    const { data } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('patient_id', patientId)
      .order('log_date', { ascending: false })
      .limit(10);
    set({ weightLogs: data ?? [] });
  },
}));
