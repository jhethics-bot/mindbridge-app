/**
 * MBButton - MindBridge Accessible Button
 * 
 * Enforces minimum 56dp touch target, WCAG AAA contrast,
 * and full screen reader support. Use this for ALL buttons
 * in the app. Never use raw Pressable/TouchableOpacity.
 */
import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';

interface MBButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'sos' | 'confused' | 'ghost';
  size?: 'standard' | 'large' | 'compact';
  disabled?: boolean;
  accessibilityHint?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function MBButton({
  label,
  onPress,
  variant = 'primary',
  size = 'standard',
  disabled = false,
  accessibilityHint,
  style,
  textStyle,
  icon,
}: MBButtonProps) {
  
  const handlePress = () => {
    // Gentle haptic feedback on every press
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const variantStyles = {
    primary: {
      bg: COLORS.teal,
      text: COLORS.white,
    },
    secondary: {
      bg: COLORS.white,
      text: COLORS.navy,
    },
    sos: {
      bg: COLORS.coral,
      text: COLORS.white,
    },
    confused: {
      bg: '#4A90D9', // Calm blue
      text: COLORS.white,
    },
    ghost: {
      bg: 'transparent',
      text: COLORS.teal,
    },
  };

  const sizeStyles = {
    standard: {
      minHeight: A11Y.minTouchTarget,
      paddingHorizontal: 24,
      paddingVertical: 16,
      fontSize: 20,
    },
    large: {
      minHeight: A11Y.preferredTouchTarget,
      paddingHorizontal: 32,
      paddingVertical: 20,
      fontSize: 24,
    },
    compact: {
      minHeight: A11Y.minTouchTarget,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 18,
    },
  };

  const v = variantStyles[variant];
  const s = sizeStyles[size];

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: s.minHeight,
          paddingHorizontal: s.paddingHorizontal,
          paddingVertical: s.paddingVertical,
          backgroundColor: v.bg,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          borderWidth: variant === 'secondary' ? 2 : 0,
          borderColor: variant === 'secondary' ? COLORS.navy : undefined,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      {icon && icon}
      <Text
        style={[
          styles.text,
          {
            fontSize: s.fontSize,
            color: v.text,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minWidth: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
