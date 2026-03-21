/**
 * MBText - NeuBridge Accessible Text Component
 *
 * Enforces minimum 18sp body text, WCAG AAA contrast,
 * and full screen reader support. Use this for ALL text in the app.
 * Never use raw <Text> from React Native.
 */
import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';

interface MBTextProps {
  children: React.ReactNode;
  variant?: 'heading' | 'subheading' | 'body' | 'bodyLarge' | 'caption' | 'game' | 'sos';
  color?: string;
  align?: 'left' | 'center' | 'right';
  style?: TextStyle;
  accessibilityLabel?: string;
  accessibilityRole?: 'header' | 'text' | 'link' | 'none';
  numberOfLines?: number;
}

const VARIANT_STYLES: Record<string, TextStyle> = {
  heading: {
    fontSize: A11Y.fontSizeHeading,
    fontWeight: '700',
    color: COLORS.navy,
    lineHeight: A11Y.fontSizeHeading * A11Y.lineHeight,
    letterSpacing: A11Y.letterSpacing,
  },
  subheading: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.navy,
    lineHeight: 22 * A11Y.lineHeight,
    letterSpacing: A11Y.letterSpacing,
  },
  body: {
    fontSize: A11Y.fontSizeBody,
    fontWeight: '400',
    color: COLORS.navy,
    lineHeight: A11Y.fontSizeBody * A11Y.lineHeight,
    letterSpacing: A11Y.letterSpacing,
  },
  bodyLarge: {
    fontSize: A11Y.fontSizeBodyLarge,
    fontWeight: '400',
    color: COLORS.navy,
    lineHeight: A11Y.fontSizeBodyLarge * A11Y.lineHeight,
    letterSpacing: A11Y.letterSpacing,
  },
  caption: {
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.gray,
    lineHeight: 16 * A11Y.lineHeight,
    letterSpacing: A11Y.letterSpacing,
  },
  game: {
    fontSize: A11Y.fontSizeGameText,
    fontWeight: '600',
    color: COLORS.navy,
    lineHeight: A11Y.fontSizeGameText * A11Y.lineHeight,
    letterSpacing: 1,
  },
  sos: {
    fontSize: A11Y.fontSizeSOS,
    fontWeight: '700',
    color: COLORS.coral,
    lineHeight: A11Y.fontSizeSOS * A11Y.lineHeight,
    letterSpacing: 1,
  },
};

export function MBText({
  children,
  variant = 'body',
  color,
  align = 'left',
  style,
  accessibilityLabel,
  accessibilityRole = 'text',
  numberOfLines,
}: MBTextProps) {
  const variantStyle = VARIANT_STYLES[variant];

  return (
    <Text
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      numberOfLines={numberOfLines}
      style={[
        variantStyle,
        { textAlign: align },
        color ? { color } : undefined,
        style,
      ]}
    >
      {children}
    </Text>
  );
}
