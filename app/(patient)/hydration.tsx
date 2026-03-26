/**
 * Hydration Tracking Screen - Patient
 *
 * 100% tap-based. Large animated water glass, drink type buttons.
 * Companion pet integration for hydration reminders.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MBSafeArea } from '../../components/ui/MBSafeArea';
import { MBHeader } from '../../components/ui/MBHeader';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import { DRINK_TYPES } from '../../constants/mindDietCategories';
import { useTimeTheme } from '../../lib/time-theme';
import { useNutritionStore } from '../../stores/nutritionStore';
import { usePetStore } from '../../stores/petStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { supabase } from '../../lib/supabase';

export default function HydrationScreen() {
  const theme = useTimeTheme();
  const [userId, setUserId] = useState<string | null>(null);
  const [justLogged, setJustLogged] = useState(false);

  const { todayHydration, logDrink, fetchTodayHydration, fetchHydrationSettings, isLoading } = useNutritionStore();
  const { pet } = usePetStore();
  const companionPetEnabled = useSettingsStore(s => s.toggles?.companion_pet_enabled ?? true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // Load hydration settings from care relationship
        const { data: rel } = await supabase
          .from('care_relationships')
          .select('id')
          .eq('patient_id', user.id)
          .limit(1)
          .single();
        if (rel) {
          await fetchHydrationSettings(rel.id);
        }
        await fetchTodayHydration(user.id);
      }
    })();
  }, []);

  const handleDrink = async (drinkType: string) => {
    if (!userId || isLoading) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await logDrink(userId, drinkType, 8);
    setJustLogged(true);
    setTimeout(() => setJustLogged(false), 1500);
  };

  // Water glass fill percentage
  const fillHeight = Math.min(todayHydration.percentage, 100);

  return (
    <MBSafeArea backgroundColor={theme.backgroundColor}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <MBHeader
          title="Stay Hydrated"
          subtitle="Tap a drink to log it"
          icon="💧"
        />

        {/* Water Glass Visual */}
        <View style={styles.glassContainer}>
          <View style={styles.glass}>
            {/* Fill level */}
            <View style={[styles.glassFill, { height: `${fillHeight}%` as any }]} />
            {/* Percentage text */}
            <View style={styles.glassTextOverlay}>
              <Text style={styles.glassPercent}>{todayHydration.percentage}%</Text>
            </View>
          </View>
        </View>

        {/* Count display */}
        <Text style={[styles.countText, { color: theme.textColor }]}>
          {todayHydration.glassesLogged} of {todayHydration.glassesTarget} glasses
        </Text>
        <Text style={[styles.ozText, { color: theme.secondaryText }]}>
          {todayHydration.current} oz / {todayHydration.target} oz
        </Text>

        {/* Just logged feedback */}
        {justLogged && pet && companionPetEnabled && (
          <Text style={styles.petMessage}>
            {pet.petName} had a drink too! 🐾
          </Text>
        )}

        {/* Drink type buttons */}
        <View style={styles.drinkGrid}>
          {DRINK_TYPES.map(drink => (
            <Pressable
              key={drink.id}
              onPress={() => handleDrink(drink.id)}
              accessibilityRole="button"
              accessibilityLabel={`Log ${drink.label}`}
              accessibilityHint="Logs one 8 oz serving"
              style={({ pressed }) => [
                styles.drinkButton,
                pressed && { transform: [{ scale: 0.93 }], backgroundColor: COLORS.glow },
              ]}
            >
              <Text style={styles.drinkEmoji}>{drink.emoji}</Text>
              <Text style={styles.drinkLabel}>{drink.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${fillHeight}%` as any },
              ]}
            />
          </View>
        </View>
      </ScrollView>
    </MBSafeArea>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32, alignItems: 'center' },
  glassContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  glass: {
    width: 120,
    height: 200,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: COLORS.teal,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  glassFill: {
    width: '100%',
    backgroundColor: '#7DD3FC', // Light blue water color
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  glassTextOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassPercent: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.navy,
  },
  countText: {
    fontSize: A11Y.fontSizeHeading,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },
  ozText: {
    fontSize: A11Y.fontSizeBody,
    textAlign: 'center',
    marginBottom: 8,
  },
  petMessage: {
    fontSize: A11Y.fontSizeBody,
    color: COLORS.teal,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 8,
  },
  drinkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
    paddingHorizontal: 12,
  },
  drinkButton: {
    width: 96,
    height: 96,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  drinkEmoji: {
    fontSize: 36,
    marginBottom: 4,
  },
  drinkLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.navy,
  },
  progressContainer: {
    width: '100%',
    paddingHorizontal: 24,
    marginTop: 24,
  },
  progressTrack: {
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.lightGray,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.teal,
    borderRadius: 6,
  },
});
