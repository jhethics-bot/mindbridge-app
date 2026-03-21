/**
 * MBCard - NeuBridge Activity Card Component
 *
 * Used for activity tiles on the home screen, resource cards,
 * and caregiver dashboard items. Large touch targets, gentle press
 * animation, WCAG AAA contrast. Accepts icon, title, subtitle, and badge.
 */
import React from 'react';
import { Pressable, View, Text, StyleSheet, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';

interface MBCardProps {
  title: string;
  subtitle?: string;
  icon?: string; // emoji icon
  badge?: string; // small label e.g. "10 min"
  onPress?: () => void;
  variant?: 'activity' | 'info' | 'caregiver' | 'achievement';
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityHint?: string;
  completed?: boolean;
}

const VARIANT_BG: Record<string, string> = {
  activity: COLORS.white,
  info: COLORS.glow,
  caregiver: COLORS.white,
  achievement: COLORS.navy,
};

const VARIANT_BORDER: Record<string, string> = {
  activity: COLORS.lightGray,
  info: COLORS.gold,
  caregiver: COLORS.lightGray,
  achievement: COLORS.gold,
};

export function MBCard({
  title,
  subtitle,
  icon,
  badge,
  onPress,
  variant = 'activity',
  disabled = false,
  style,
  accessibilityHint,
  completed = false,
}: MBCardProps) {
  const handlePress = () => {
    if (disabled || !onPress) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const isAchievement = variant === 'achievement';
  const titleColor = isAchievement ? COLORS.gold : COLORS.navy;
  const subtitleColor = isAchievement ? COLORS.lightGray : COLORS.gray;

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || !onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: completed ? COLORS.glow : VARIANT_BG[variant],
          borderColor: completed ? COLORS.gold : VARIANT_BORDER[variant],
          opacity: disabled ? 0.5 : pressed ? 0.88 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
        style,
      ]}
    >
      {completed && (
        <View style={styles.completedBadge}>
          <Text style={styles.completedText}>✓</Text>
        </View>
      )}

      {icon && (
        <Text style={styles.icon} accessibilityElementsHidden>
          {icon}
        </Text>
      )}

      <View style={styles.textBlock}>
        <Text
          style={[styles.title, { color: titleColor }]}
          numberOfLines={2}
          accessibilityRole="text"
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[styles.subtitle, { color: subtitleColor }]}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: A11Y.cardPadding,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: A11Y.preferredTouchTarget,
    gap: 16,
    marginBottom: 12,
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  icon: {
    fontSize: 40,
    lineHeight: 48,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: A11Y.fontSizeBodyLarge,
    fontWeight: '600',
    lineHeight: A11Y.fontSizeBodyLarge * A11Y.lineHeight,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 16 * 1.4,
  },
  badge: {
    backgroundColor: COLORS.teal,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  completedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
  },
});
