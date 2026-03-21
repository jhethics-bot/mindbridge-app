/**
 * MBEmoji - NeuBridge Mood Emoji Selector
 *
 * Large, accessible emoji buttons for mood check-in.
 * Stage-adaptive: late stage shows fewer options.
 * Tapping an emoji plays a warm haptic + gentle glow animation.
 * Never shows deselected states as "wrong" — all options are friendly.
 */
import React, { useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import type { MoodType, DiseaseStage } from '../../types';

interface MoodOption {
  mood: MoodType;
  emoji: string;
  label: string;
}

const ALL_MOODS: MoodOption[] = [
  { mood: 'happy',    emoji: '😊', label: 'Happy' },
  { mood: 'okay',     emoji: '😐', label: 'Okay' },
  { mood: 'sad',      emoji: '😢', label: 'Sad' },
  { mood: 'confused', emoji: '😕', label: 'Confused' },
  { mood: 'tired',    emoji: '😴', label: 'Tired' },
];

// Late stage only shows 3 most recognizable
const LATE_MOODS: MoodOption[] = [
  { mood: 'happy',    emoji: '😊', label: 'Happy' },
  { mood: 'okay',     emoji: '😐', label: 'Okay' },
  { mood: 'sad',      emoji: '😢', label: 'Sad' },
];

interface MBEmojiProps {
  selected?: MoodType | null;
  onSelect: (mood: MoodType) => void;
  stage?: DiseaseStage;
  disabled?: boolean;
}

export function MBEmoji({
  selected,
  onSelect,
  stage = 'middle',
  disabled = false,
}: MBEmojiProps) {
  const moods = stage === 'late' ? LATE_MOODS : ALL_MOODS;

  return (
    <View
      style={styles.row}
      accessibilityRole="radiogroup"
      accessibilityLabel="How are you feeling today?"
    >
      {moods.map((option) => (
        <EmojiButton
          key={option.mood}
          option={option}
          selected={selected === option.mood}
          onSelect={onSelect}
          disabled={disabled}
          count={moods.length}
        />
      ))}
    </View>
  );
}

interface EmojiButtonProps {
  option: MoodOption;
  selected: boolean;
  onSelect: (mood: MoodType) => void;
  disabled: boolean;
  count: number;
}

function EmojiButton({ option, selected, onSelect, disabled, count }: EmojiButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    if (disabled) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Bounce animation
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.2,
        friction: 4,
        tension: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 150,
        useNativeDriver: true,
      }),
    ]).start();

    // Glow in + out
    Animated.sequence([
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(glowAnim, {
        toValue: selected ? 1 : 0,
        duration: 400,
        useNativeDriver: false,
      }),
    ]).start();

    onSelect(option.mood);
  };

  const bgColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      selected ? COLORS.glow : COLORS.white,
      COLORS.glow,
    ],
  });

  const buttonSize = count <= 3 ? 96 : 72;

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityLabel={option.label}
      accessibilityState={{ selected, disabled }}
      style={styles.buttonWrapper}
    >
      <Animated.View
        style={[
          styles.emojiButton,
          {
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
            backgroundColor: bgColor,
            borderColor: selected ? COLORS.gold : COLORS.lightGray,
            borderWidth: selected ? 3 : 1.5,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={[styles.emoji, { fontSize: count <= 3 ? 48 : 36 }]}>
          {option.emoji}
        </Text>
      </Animated.View>
      <Text style={[styles.label, selected && styles.labelSelected]}>
        {option.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: 16,
    paddingVertical: 16,
  },
  buttonWrapper: {
    alignItems: 'center',
    gap: 8,
  },
  emojiButton: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  emoji: {
    lineHeight: undefined,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray,
    textAlign: 'center',
  },
  labelSelected: {
    color: COLORS.navy,
    fontWeight: '700',
  },
});
