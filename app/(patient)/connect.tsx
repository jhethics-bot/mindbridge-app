/**
 * Connect Screen
 * Hub for social and emotional connection: Photo Album, Voice Journal, Community.
 * Large tappable cards designed for easy recognition and navigation.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MBSafeArea } from '../../components/ui/MBSafeArea';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';

interface ConnectItem {
  id: string;
  title: string;
  emoji: string;
  description: string;
  route: string;
  bgColor: string;
}

const CONNECT_ITEMS: ConnectItem[] = [
  {
    id: 'photos',
    title: 'Photo Album',
    emoji: '📸',
    description: 'Browse family photos & memories',
    route: '/(patient)/photos',
    bgColor: '#FCE4EC',
  },
  {
    id: 'journal',
    title: 'Voice Journal',
    emoji: '🎙️',
    description: 'Record your thoughts & stories',
    route: '/(patient)/journal',
    bgColor: '#E3F2FD',
  },
  {
    id: 'achievements',
    title: 'My Achievements',
    emoji: '🏆',
    description: 'See everything you\'ve accomplished',
    route: '/(patient)/achievements',
    bgColor: COLORS.glow,
  },
];

export default function ConnectScreen() {
  const router = useRouter();

  const handlePress = (item: ConnectItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(item.route as any);
  };

  return (
    <MBSafeArea>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Connect</Text>
        <Text style={styles.subtitle}>Stay close to what matters</Text>

        <View style={styles.list}>
          {CONNECT_ITEMS.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.card, { backgroundColor: item.bgColor }]}
              onPress={() => handlePress(item)}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}. ${item.description}`}
            >
              <Text style={styles.emoji}>{item.emoji}</Text>
              <View style={styles.textArea}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDesc}>{item.description}</Text>
              </View>
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
  list: {
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: A11Y.cardPadding,
    minHeight: A11Y.preferredTouchTarget * 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  emoji: {
    fontSize: 44,
    marginRight: 16,
  },
  textArea: {
    flex: 1,
  },
  cardTitle: {
    fontSize: A11Y.fontSizeBodyLarge,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: A11Y.fontSizeBody,
    color: COLORS.gray,
  },
});
