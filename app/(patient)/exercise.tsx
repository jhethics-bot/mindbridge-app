/**
 * Wellness Hub Screen
 * Grid of wellness activities: Breathing, Gentle Exercise, Chair Yoga, Sensory Calm.
 * Large tappable cards with warm colors and accessibility-first design.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MBSafeArea } from '../../components/ui/MBSafeArea';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';

interface WellnessItem {
  id: string;
  title: string;
  emoji: string;
  description: string;
  route: string;
  bgColor: string;
}

const WELLNESS_ITEMS: WellnessItem[] = [
  {
    id: 'breathing',
    title: 'Breathing',
    emoji: '🌬️',
    description: 'Calming breath exercises',
    route: '/(patient)/breathing',
    bgColor: '#E0F2FE',
  },
  {
    id: 'guided-workout',
    title: 'Gentle Workout',
    emoji: '💪',
    description: 'Easy movement activities',
    route: '/(patient)/guided-workout',
    bgColor: '#DCFCE7',
  },
  {
    id: 'chair-yoga',
    title: 'Chair Yoga',
    emoji: '🪑',
    description: 'Seated stretches',
    route: '/(patient)/chair-yoga',
    bgColor: '#FEF3C7',
  },
  {
    id: 'sensory-calm',
    title: 'Calm Screen',
    emoji: '🌊',
    description: 'Calming visuals',
    route: '/(patient)/calm',
    bgColor: '#E8D5F5',
  },
  {
    id: 'gentle-touch',
    title: 'Gentle Touch',
    emoji: '💫',
    description: 'Interactive sensory play',
    route: '/(patient)/gentle-touch',
    bgColor: '#FCE4EC',
  },
];

export default function ExerciseScreen() {
  const router = useRouter();

  const handlePress = (item: WellnessItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(item.route as any);
  };

  return (
    <MBSafeArea>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Wellness</Text>
        <Text style={styles.subtitle}>Choose an activity to feel your best</Text>

        <View style={styles.grid}>
          {WELLNESS_ITEMS.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.card, { backgroundColor: item.bgColor }]}
              onPress={() => handlePress(item)}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}. ${item.description}`}
            >
              <Text style={styles.emoji}>{item.emoji}</Text>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc}>{item.description}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </MBSafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  content: {
    padding: A11Y.screenPadding,
    paddingBottom: 100,
  },
  heading: {
    fontSize: A11Y.fontSizeHeading,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: A11Y.fontSizeBody,
    color: COLORS.gray,
    marginBottom: A11Y.sectionGap,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  card: {
    width: '47%',
    borderRadius: 20,
    padding: A11Y.cardPadding,
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  emoji: {
    fontSize: 44,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: A11Y.fontSizeBodyLarge,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
  },
});
