/**
 * MBHeader - NeuBridge Screen Header Component
 *
 * Persistent header with title, optional subtitle, and
 * consistent visual hierarchy. Works alongside MBSafeArea
 * (which handles Home/SOS) to add a visual title block
 * below the nav row.
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';

interface MBHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string; // emoji
  align?: 'left' | 'center';
  style?: ViewStyle;
  titleColor?: string;
}

export function MBHeader({
  title,
  subtitle,
  icon,
  align = 'center',
  style,
  titleColor = COLORS.navy,
}: MBHeaderProps) {
  return (
    <View style={[styles.container, { alignItems: align === 'center' ? 'center' : 'flex-start' }, style]}>
      {icon && (
        <Text style={styles.icon} accessibilityElementsHidden>
          {icon}
        </Text>
      )}
      <Text
        style={[styles.title, { textAlign: align, color: titleColor }]}
        accessibilityRole="header"
      >
        {title}
      </Text>
      {subtitle && (
        <Text style={[styles.subtitle, { textAlign: align }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    gap: 6,
  },
  icon: {
    fontSize: 48,
    lineHeight: 60,
    marginBottom: 4,
  },
  title: {
    fontSize: A11Y.fontSizeHeading,
    fontWeight: '700',
    lineHeight: A11Y.fontSizeHeading * A11Y.lineHeight,
    letterSpacing: A11Y.letterSpacing,
  },
  subtitle: {
    fontSize: A11Y.fontSizeBody,
    fontWeight: '400',
    color: COLORS.gray,
    lineHeight: A11Y.fontSizeBody * A11Y.lineHeight,
  },
});
