/**
 * Daily Mood Check-In Screen
 * 
 * First screen shown each day. Five emoji faces, single tap selection.
 * No reading required. Feeds into AI difficulty engine.
 * 
 * Clinical basis: Mood data drives adaptive difficulty calibration.
 * Longitudinal mood tracking included in weekly caregiver reports.
 */
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { MBSafeArea } from '../../components/ui/MBSafeArea';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import type { MoodType } from '../../types';

interface MoodOption {
  mood: MoodType;
  emoji: string;
  label: string;
}

const MOOD_OPTIONS: MoodOption[] = [
  { mood: 'happy', emoji: '😊', label: 'Happy' },
  { mood: 'okay', emoji: '😐', label: 'Okay' },
  { mood: 'sad', emoji: '😢', label: 'Sad' },
  { mood: 'confused', emoji: '😕', label: 'Confused' },
  { mood: 'tired', emoji: '😴', label: 'Tired' },
];

export default function MoodCheckIn() {
  const router = useRouter();
  const [selected, setSelected] = useState<MoodType | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = async (mood: MoodType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(mood);
    
    // Brief pause to show selection, then submit
    setTimeout(async () => {
      setSubmitted(true);
      
      // TODO: Call logMoodCheckin(patientId, mood)
      // TODO: Trigger AI calibration
      
      // Show thank you, then navigate to home
      setTimeout(() => {
        router.replace('/(patient)');
      }, 1500);
    }, 500);
  };

  if (submitted) {
    return (
      <MBSafeArea showHome={false} showSOS={true}>
        <View style={styles.thankYouContainer}>
          <Text style={styles.thankYouEmoji}>💛</Text>
          <Text style={styles.thankYouText}>Thank you!</Text>
          <Text style={styles.thankYouSub}>
            Getting your activities ready...
          </Text>
        </View>
      </MBSafeArea>
    );
  }

  return (
    <MBSafeArea showHome={false} showSOS={true}>
      <View style={styles.container}>
        <Text style={styles.greeting}>Good morning!</Text>
        <Text style={styles.question}>How are you feeling today?</Text>
        
        <View style={styles.emojiGrid}>
          {MOOD_OPTIONS.map((option) => (
            <Pressable
              key={option.mood}
              onPress={() => handleSelect(option.mood)}
              accessibilityRole="button"
              accessibilityLabel={`I feel ${option.label}`}
              accessibilityHint={`Select ${option.label} as your mood for today`}
              style={({ pressed }) => [
                styles.emojiButton,
                selected === option.mood && styles.emojiSelected,
                { transform: [{ scale: pressed ? 0.95 : 1 }] },
              ]}
            >
              <Text style={styles.emoji}>{option.emoji}</Text>
              <Text style={[
                styles.emojiLabel,
                selected === option.mood && styles.emojiLabelSelected,
              ]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </MBSafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 12,
    textAlign: 'center',
  },
  question: {
    fontSize: A11Y.fontSizeHeading,
    fontWeight: '500',
    color: COLORS.gray,
    marginBottom: 48,
    textAlign: 'center',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 16,
  },
  emojiButton: {
    width: 100,
    height: 120,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    // Subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  emojiSelected: {
    borderWidth: 3,
    borderColor: COLORS.teal,
    backgroundColor: COLORS.glow,
  },
  emoji: {
    fontSize: A11Y.fontSizeEmoji,
    marginBottom: 8,
  },
  emojiLabel: {
    fontSize: A11Y.fontSizeBody,
    fontWeight: '600',
    color: COLORS.navy,
  },
  emojiLabelSelected: {
    color: COLORS.teal,
  },
  // Thank you screen
  thankYouContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thankYouEmoji: {
    fontSize: 72,
    marginBottom: 24,
  },
  thankYouText: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 12,
  },
  thankYouSub: {
    fontSize: A11Y.fontSizeBody,
    color: COLORS.gray,
  },
});
