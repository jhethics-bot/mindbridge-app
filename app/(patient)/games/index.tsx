/**
 * Games Hub Screen
 * 2-column grid of all 6 cognitive games.
 * Each card navigates to the game's screen via expo-router.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { MBSafeArea } from '../../../components/ui/MBSafeArea';
import { COLORS } from '../../../constants/colors';
import { A11Y } from '../../../constants/accessibility';

interface GameItem {
  id: string;
  title: string;
  emoji: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  description: string;
  route: string;
  bgColor: string;
}

const GAMES: GameItem[] = [
  {
    id: 'memory-cards',
    title: 'Memory Cards',
    emoji: '🃏',
    icon: 'grid-on',
    description: 'Match pairs of cards',
    route: '/(patient)/games/memory-cards',
    bgColor: '#E0F2FE',
  },
  {
    id: 'face-name',
    title: 'Face & Name',
    emoji: '👤',
    icon: 'face',
    description: 'Match faces to names',
    route: '/(patient)/games/face-name',
    bgColor: '#FCE4EC',
  },
  {
    id: 'word-find',
    title: 'Word Find',
    emoji: '🔤',
    icon: 'search',
    description: 'Find hidden words',
    route: '/(patient)/games/word-find',
    bgColor: '#DCFCE7',
  },
  {
    id: 'sorting',
    title: 'Sorting',
    emoji: '📦',
    icon: 'sort',
    description: 'Sort items into groups',
    route: '/(patient)/games/sorting',
    bgColor: '#FEF3C7',
  },
  {
    id: 'spelling',
    title: 'Spelling',
    emoji: '✏️',
    icon: 'spellcheck',
    description: 'Spell familiar words',
    route: '/(patient)/games/spelling',
    bgColor: '#E8D5F5',
  },
  {
    id: 'color-number',
    title: 'Color by Number',
    emoji: '🎨',
    icon: 'palette',
    description: 'Color beautiful pictures',
    route: '/(patient)/games/color-number',
    bgColor: '#FFF3E0',
  },
];

export default function GamesHub() {
  const router = useRouter();

  const handlePress = (game: GameItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(game.route as any);
  };

  return (
    <MBSafeArea>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Games</Text>
        <Text style={styles.subtitle}>Exercise your mind with fun activities</Text>

        <View style={styles.grid}>
          {GAMES.map((game) => (
            <Pressable
              key={game.id}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: game.bgColor },
                pressed && { transform: [{ scale: 0.96 }], opacity: 0.9 },
              ]}
              onPress={() => handlePress(game)}
              accessibilityRole="button"
              accessibilityLabel={`${game.title}. ${game.description}`}
            >
              <Text style={styles.emoji}>{game.emoji}</Text>
              <Text style={styles.cardTitle}>{game.title}</Text>
              <Text style={styles.cardDesc}>{game.description}</Text>
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
