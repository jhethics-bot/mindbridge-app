/**
 * MIND Diet Score Engine — deterministic, client-side, no API calls
 * Same philosophy as petMoodEngine.ts
 *
 * Scoring based on the MIND diet (Morris et al., 2015):
 * - 10 brain-healthy categories: 1 point each if weekly target met, 0.5 if >= 50%
 * - 5 limit categories: 1 point each if weekly max not exceeded, 0.5 if within 150%
 * - Total: 0-15 points
 */

import { MIND_FOOD_CATEGORIES, type MindFoodCategory } from '../constants/mindDietCategories';

export interface WeekCategoryCounts {
  [categoryId: string]: number;  // total servings for the week
}

export interface CategoryScore {
  categoryId: string;
  label: string;
  emoji: string;
  mindType: 'brain_healthy' | 'limit';
  count: number;
  target: number;       // weeklyTarget or weeklyMax
  score: number;        // 0, 0.5, or 1
  met: boolean;         // fully met
  partial: boolean;     // at least 50%
}

export type MindRating = 'excellent' | 'good' | 'needs_improvement';

export interface MindScoreResult {
  total: number;
  rating: MindRating;
  breakdown: CategoryScore[];
  brainHealthyScore: number;
  limitScore: number;
}

function scoreBrainHealthy(category: MindFoodCategory, count: number): number {
  const target = category.weeklyTarget ?? 1;
  if (count >= target) return 1;
  if (count >= target * 0.5) return 0.5;
  return 0;
}

function scoreLimit(category: MindFoodCategory, count: number): number {
  const max = category.weeklyMax ?? 1;
  if (count <= max) return 1;
  if (count <= max * 1.5) return 0.5;
  return 0;
}

/**
 * Compute the MIND diet score for a week of food data.
 *
 * @param weekData - Map of food category ID to total servings for the week
 * @returns MindScoreResult with total score, rating, and per-category breakdown
 */
export function computeMindScore(weekData: WeekCategoryCounts): MindScoreResult {
  const breakdown: CategoryScore[] = [];
  let brainHealthyScore = 0;
  let limitScore = 0;

  for (const category of MIND_FOOD_CATEGORIES) {
    const count = weekData[category.id] ?? 0;
    const target = category.mindType === 'brain_healthy'
      ? (category.weeklyTarget ?? 1)
      : (category.weeklyMax ?? 1);

    let score: number;
    if (category.mindType === 'brain_healthy') {
      score = scoreBrainHealthy(category, count);
      brainHealthyScore += score;
    } else {
      score = scoreLimit(category, count);
      limitScore += score;
    }

    breakdown.push({
      categoryId: category.id,
      label: category.label,
      emoji: category.emoji,
      mindType: category.mindType,
      count,
      target,
      score,
      met: score === 1,
      partial: score === 0.5,
    });
  }

  const total = brainHealthyScore + limitScore;
  let rating: MindRating;
  if (total >= 11) rating = 'excellent';
  else if (total >= 6) rating = 'good';
  else rating = 'needs_improvement';

  return { total, rating, breakdown, brainHealthyScore, limitScore };
}

/**
 * Build WeekCategoryCounts from an array of meal logs.
 * Each meal log has food_categories: string[] listing category IDs.
 */
export function buildWeekCounts(
  mealLogs: { food_categories: string[] }[]
): WeekCategoryCounts {
  const counts: WeekCategoryCounts = {};
  for (const log of mealLogs) {
    for (const cat of log.food_categories) {
      counts[cat] = (counts[cat] ?? 0) + 1;
    }
  }
  return counts;
}
