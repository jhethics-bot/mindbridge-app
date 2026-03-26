/**
 * Nutrition Report Helper
 * Generates nutrition summary data for the weekly caregiver report.
 */

import { supabase } from './supabase';
import { buildWeekCounts, computeMindScore, type MindScoreResult } from './mindScoreEngine';
import { MIND_FOOD_CATEGORIES } from '../constants/mindDietCategories';

export interface NutritionReportData {
  avgMindScore: number;
  hydrationAvgDailyOz: number;
  hydrationAvgGlasses: number;
  mealsLoggedPerDay: number;
  topFoodCategories: { id: string; label: string; emoji: string; count: number }[];
  missingMindCategories: { id: string; label: string; emoji: string; suggestion: string }[];
  weightTrend: { date: string; weight: number }[];
  currentWeekScore: MindScoreResult | null;
}

export async function getNutritionReportData(
  patientId: string,
  startDate: string,
  endDate: string
): Promise<NutritionReportData> {
  // Fetch meals in date range
  const { data: meals } = await supabase
    .from('meal_logs')
    .select('food_categories, meal_date')
    .eq('patient_id', patientId)
    .gte('meal_date', startDate)
    .lte('meal_date', endDate)
    .order('meal_date');

  // Fetch hydration in date range
  const { data: hydration } = await supabase
    .from('hydration_logs')
    .select('amount_oz, log_date')
    .eq('patient_id', patientId)
    .gte('log_date', startDate)
    .lte('log_date', endDate);

  // Fetch weight logs
  const { data: weights } = await supabase
    .from('weight_logs')
    .select('weight_lbs, log_date')
    .eq('patient_id', patientId)
    .gte('log_date', startDate)
    .lte('log_date', endDate)
    .order('log_date');

  const mealList = meals ?? [];
  const hydrationList = hydration ?? [];
  const weightList = weights ?? [];

  // Calculate days in range
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dayCount = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);

  // MIND score for the week
  const weekCounts = buildWeekCounts(mealList.map(m => ({
    food_categories: m.food_categories ?? [],
  })));
  const currentWeekScore = computeMindScore(weekCounts);

  // Hydration average
  const totalOz = hydrationList.reduce((sum, h) => sum + (h.amount_oz ?? 8), 0);
  const hydrationAvgDailyOz = Math.round(totalOz / dayCount);

  // Meals per day
  const mealsLoggedPerDay = Math.round((mealList.length / dayCount) * 10) / 10;

  // Top food categories
  const catCounts: Record<string, number> = {};
  for (const meal of mealList) {
    for (const cat of (meal.food_categories ?? [])) {
      catCounts[cat] = (catCounts[cat] ?? 0) + 1;
    }
  }
  const sorted = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
  const topFoodCategories = sorted.slice(0, 5).map(([id, count]) => {
    const cat = MIND_FOOD_CATEGORIES.find(c => c.id === id);
    return { id, label: cat?.label ?? id, emoji: cat?.emoji ?? '🍽️', count };
  });

  // Missing MIND categories (brain-healthy ones not consumed)
  const brainHealthy = MIND_FOOD_CATEGORIES.filter(c => c.mindType === 'brain_healthy');
  const missingMindCategories = brainHealthy
    .filter(c => (catCounts[c.id] ?? 0) === 0)
    .map(c => ({
      id: c.id,
      label: c.label,
      emoji: c.emoji,
      suggestion: `Try adding ${c.examples.split(',')[0].trim().toLowerCase()} to meals this week`,
    }));

  // Weight trend
  const weightTrend = weightList.map(w => ({
    date: w.log_date,
    weight: Number(w.weight_lbs),
  }));

  return {
    avgMindScore: currentWeekScore.total,
    hydrationAvgDailyOz,
    hydrationAvgGlasses: Math.round(hydrationAvgDailyOz / 8),
    mealsLoggedPerDay,
    topFoodCategories,
    missingMindCategories,
    weightTrend,
    currentWeekScore,
  };
}
