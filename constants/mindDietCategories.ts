/**
 * MIND Diet Food Categories & Drink Types
 *
 * Based on the MIND diet (Mediterranean-DASH Intervention for Neurodegenerative Delay)
 * and 2024 ESPEN Guidelines on nutrition/hydration in dementia.
 *
 * 10 brain-healthy categories + 5 limit categories = 15 MIND score points
 */

export interface MindFoodCategory {
  id: string;
  label: string;
  emoji: string;
  mindType: 'brain_healthy' | 'limit';
  weeklyTarget?: number;  // for brain_healthy: minimum servings
  weeklyMax?: number;     // for limit: maximum servings
  unit: string;
  examples: string;
}

export const MIND_FOOD_CATEGORIES: MindFoodCategory[] = [
  { id: 'leafy_greens', label: 'Leafy Greens', emoji: '🥬', mindType: 'brain_healthy', weeklyTarget: 6, unit: 'servings', examples: 'Kale, spinach, collard greens, lettuce' },
  { id: 'other_vegetables', label: 'Other Veggies', emoji: '🥕', mindType: 'brain_healthy', weeklyTarget: 7, unit: 'servings', examples: 'Carrots, broccoli, squash, peppers' },
  { id: 'berries', label: 'Berries', emoji: '🫐', mindType: 'brain_healthy', weeklyTarget: 2, unit: 'servings', examples: 'Blueberries, strawberries, raspberries' },
  { id: 'nuts', label: 'Nuts', emoji: '🥜', mindType: 'brain_healthy', weeklyTarget: 5, unit: 'servings', examples: 'Almonds, walnuts, cashews, pecans' },
  { id: 'beans', label: 'Beans', emoji: '🫘', mindType: 'brain_healthy', weeklyTarget: 3, unit: 'servings', examples: 'Black beans, lentils, chickpeas' },
  { id: 'whole_grains', label: 'Whole Grains', emoji: '🍞', mindType: 'brain_healthy', weeklyTarget: 21, unit: 'servings', examples: 'Oatmeal, brown rice, whole wheat bread' },
  { id: 'fish', label: 'Fish', emoji: '🐟', mindType: 'brain_healthy', weeklyTarget: 1, unit: 'servings', examples: 'Salmon, tuna, sardines, mackerel' },
  { id: 'poultry', label: 'Poultry', emoji: '🍗', mindType: 'brain_healthy', weeklyTarget: 2, unit: 'servings', examples: 'Chicken, turkey' },
  { id: 'olive_oil', label: 'Olive Oil', emoji: '🫒', mindType: 'brain_healthy', weeklyTarget: 5, unit: 'days', examples: 'Extra virgin olive oil for cooking' },
  { id: 'wine', label: 'Wine/Grape Juice', emoji: '🍷', mindType: 'brain_healthy', weeklyTarget: 1, unit: 'glasses', examples: 'Red wine or grape juice (optional)' },
  { id: 'red_meat', label: 'Red Meat', emoji: '🥩', mindType: 'limit', weeklyMax: 4, unit: 'servings', examples: 'Beef, pork, lamb' },
  { id: 'butter', label: 'Butter', emoji: '🧈', mindType: 'limit', weeklyMax: 7, unit: 'tbsp', examples: 'Butter, margarine' },
  { id: 'cheese', label: 'Cheese', emoji: '🧀', mindType: 'limit', weeklyMax: 1, unit: 'servings', examples: 'Any cheese' },
  { id: 'sweets', label: 'Sweets', emoji: '🍰', mindType: 'limit', weeklyMax: 5, unit: 'servings', examples: 'Cookies, cake, ice cream, candy' },
  { id: 'fried_fast', label: 'Fried/Fast Food', emoji: '🍔', mindType: 'limit', weeklyMax: 1, unit: 'servings', examples: 'French fries, fried chicken, fast food' },
];

export const DRINK_TYPES = [
  { id: 'water', label: 'Water', emoji: '💧' },
  { id: 'juice', label: 'Juice', emoji: '🧃' },
  { id: 'tea', label: 'Tea', emoji: '🍵' },
  { id: 'milk', label: 'Milk', emoji: '🥛' },
  { id: 'broth', label: 'Broth', emoji: '🍲' },
  { id: 'other', label: 'Other', emoji: '🥤' },
] as const;

export type DrinkTypeId = typeof DRINK_TYPES[number]['id'];
