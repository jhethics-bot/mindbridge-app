/**
 * MBProgress - NeuBridge Positive Progress Indicator
 *
 * Shows only completion and success — never "how much is left".
 * Frames progress as achievement, not deficit.
 * Animated fill using Reanimated for smooth transitions.
 * Used in games, exercise sessions, and daily queue completion.
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';

interface MBProgressProps {
  // Value between 0 and 1
  progress: number;
  label?: string;
  showPercent?: boolean;
  variant?: 'teal' | 'gold' | 'coral';
  height?: number;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

const TRACK_COLORS: Record<string, string> = {
  teal:  COLORS.teal,
  gold:  COLORS.gold,
  coral: COLORS.coral,
};

export function MBProgress({
  progress,
  label,
  showPercent = false,
  variant = 'teal',
  height = 12,
  style,
  accessibilityLabel,
}: MBProgressProps) {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const widthValue = useSharedValue(0);

  useEffect(() => {
    widthValue.value = withTiming(clampedProgress, {
      duration: A11Y.transitionDuration,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [clampedProgress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${widthValue.value * 100}%`,
  }));

  const percent = Math.round(clampedProgress * 100);
  const a11yLabel = accessibilityLabel
    ?? (label ? `${label}: ${percent}% complete` : `${percent}% complete`);

  return (
    <View style={[styles.container, style]}>
      {(label || showPercent) && (
        <View style={styles.labelRow}>
          {label && (
            <Text style={styles.label}>{label}</Text>
          )}
          {showPercent && (
            <Text style={styles.percent}>{percent}%</Text>
          )}
        </View>
      )}

      <View
        style={[styles.track, { height, borderRadius: height / 2 }]}
        accessibilityRole="progressbar"
        accessibilityLabel={a11yLabel}
        accessibilityValue={{ min: 0, max: 100, now: percent }}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              height,
              borderRadius: height / 2,
              backgroundColor: TRACK_COLORS[variant],
            },
            animatedStyle,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: A11Y.fontSizeBody,
    fontWeight: '500',
    color: COLORS.navy,
  },
  percent: {
    fontSize: A11Y.fontSizeBody,
    fontWeight: '700',
    color: COLORS.teal,
  },
  track: {
    width: '100%',
    backgroundColor: COLORS.lightGray,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
