/**
 * More Screen
 * Grid hub for patient-appropriate features not in the main tabs:
 * Music, Daily Verse, Mood Check-In, SOS Help.
 * Caregiver-only features (Driving, Appointments) are excluded.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MBSafeArea } from '../../components/ui/MBSafeArea';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';

interface MoreItem {
  id: string;
  title: string;
  emoji: string;
  route: string;
  bgColor: string;
}

const MORE_ITEMS: MoreItem[] = [
  {
    id: 'music',
    title: 'Music',
    emoji: '🎵',
    route: '/(patient)/music',
    bgColor: '#E8D5F5',
  },
  {
    id: 'verse',
    title: 'Daily Verse',
    emoji: '📖',
    route: '/(patient)/verse',
    bgColor: '#FEF3C7',
  },
  {
    id: 'mood',
    title: 'Mood Check-In',
    emoji: '😊',
    route: '/(patient)/mood',
    bgColor: '#FCE4EC',
  },
  {
    id: 'sos',
    title: 'SOS Help',
    emoji: '🆘',
    route: '/(patient)/sos',
    bgColor: '#FEE2E2',
  },
];

export default function MoreScreen() {
  const router = useRouter();

  const handlePress = (item: MoreItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(item.route as any);
  };

  return (
    <MBSafeArea>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>More</Text>
        <Text style={styles.subtitle}>Additional features</Text>

        <View style={styles.grid}>
          {MORE_ITEMS.map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: item.bgColor },
                pressed && { transform: [{ scale: 0.96 }], opacity: 0.9 },
              ]}
              onPress={() => handlePress(item)}
              accessibilityRole="button"
              accessibilityLabel={item.title}
            >
              <Text style={styles.emoji}>{item.emoji}</Text>
              <Text style={styles.cardTitle}>{item.title}</Text>
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
    minHeight: 130,
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
  },
});
