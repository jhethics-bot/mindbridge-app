/**
 * Meal Logging Screen - Patient
 *
 * 100% tap-based, zero typing. Large food category grid with
 * MIND diet color coding. Auto-detects meal period.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MBSafeArea } from '../../components/ui/MBSafeArea';
import { MBButton } from '../../components/ui/MBButton';
import { MBHeader } from '../../components/ui/MBHeader';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import { MIND_FOOD_CATEGORIES } from '../../constants/mindDietCategories';
import { getMealPeriod, getMealPeriodLabel, getMealPeriodEmoji } from '../../lib/hydrationUtils';
import { useTimeTheme } from '../../lib/time-theme';
import { useNutritionStore } from '../../stores/nutritionStore';
import { supabase } from '../../lib/supabase';

export default function MealsScreen() {
  const router = useRouter();
  const theme = useTimeTheme();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [logged, setLogged] = useState(false);
  const { logMeal, isLoading } = useNutritionStore();

  const mealPeriod = getMealPeriod();
  const mealLabel = getMealPeriodLabel(mealPeriod);
  const mealEmoji = getMealPeriodEmoji(mealPeriod);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    })();
  }, []);

  const toggleCategory = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleLogMeal = async () => {
    if (!userId || selected.size === 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await logMeal(userId, mealPeriod, Array.from(selected));
    setLogged(true);
    // Reset after brief delay
    setTimeout(() => {
      setSelected(new Set());
      setLogged(false);
    }, 2000);
  };

  return (
    <MBSafeArea backgroundColor={theme.backgroundColor}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <MBHeader
          title={`${mealLabel} ${mealEmoji}`}
          subtitle={new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        />

        {logged ? (
          <View style={styles.successContainer}>
            <Text style={styles.successEmoji}>✅</Text>
            <Text style={[styles.successText, { color: theme.textColor }]}>
              Logged!
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.instruction, { color: theme.secondaryText }]}>
              Tap what you ate
            </Text>

            {/* Food category grid */}
            <View style={styles.grid}>
              {MIND_FOOD_CATEGORIES.map(cat => {
                const isSelected = selected.has(cat.id);
                const borderColor = cat.mindType === 'brain_healthy'
                  ? COLORS.success
                  : COLORS.gold;

                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => toggleCategory(cat.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`${cat.label}${isSelected ? ', selected' : ''}`}
                    accessibilityHint={`${cat.mindType === 'brain_healthy' ? 'Brain healthy' : 'Limit'}: ${cat.examples}`}
                    accessibilityState={{ selected: isSelected }}
                    style={({ pressed }) => [
                      styles.categoryTile,
                      { borderColor: isSelected ? borderColor : COLORS.lightGray },
                      isSelected && { backgroundColor: borderColor + '15' },
                      pressed && { transform: [{ scale: 0.95 }], opacity: 0.85 },
                    ]}
                  >
                    <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                    <Text style={styles.categoryLabel} numberOfLines={1}>{cat.label}</Text>
                    {isSelected && (
                      <View style={[styles.checkmark, { backgroundColor: borderColor }]}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Log button */}
            <View style={styles.footer}>
              <Text style={[styles.selectedCount, { color: theme.secondaryText }]}>
                {selected.size} item{selected.size !== 1 ? 's' : ''} selected
              </Text>
              <MBButton
                label={`Log ${mealLabel}`}
                onPress={handleLogMeal}
                disabled={selected.size === 0 || isLoading}
                size="large"
                accessibilityHint={`Log ${selected.size} food items for ${mealLabel}`}
              />
            </View>
          </>
        )}
      </ScrollView>
    </MBSafeArea>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  instruction: {
    fontSize: A11Y.fontSizeBody,
    marginBottom: 16,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 24,
  },
  categoryTile: {
    width: 80,
    height: 96,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryEmoji: {
    fontSize: 32,
    lineHeight: 40,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.navy,
    marginTop: 4,
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  footer: {
    gap: 12,
    alignItems: 'center',
  },
  selectedCount: {
    fontSize: 16,
    fontWeight: '500',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  successEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  successText: {
    fontSize: A11Y.fontSizeHeading,
    fontWeight: '700',
  },
});
