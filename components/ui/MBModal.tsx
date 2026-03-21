/**
 * MBModal - NeuBridge Gentle Modal Component
 *
 * No harsh transitions. No abrupt overlays. Smooth fade + scale in.
 * One clear action. Always closeable. Screen reader accessible.
 * Use for confirmations, achievements, help overlays.
 * Never use for errors — NeuBridge has no error states for patients.
 */
import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import { MBButton } from './MBButton';

interface MBModalAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
}

interface MBModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  icon?: string; // emoji
  actions?: MBModalAction[];
  style?: ViewStyle;
  // If true, tapping the backdrop closes the modal
  closeOnBackdrop?: boolean;
}

export function MBModal({
  visible,
  onClose,
  title,
  message,
  icon,
  actions = [],
  style,
  closeOnBackdrop = true,
}: MBModalProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: A11Y.transitionDuration,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: A11Y.fadeOutDuration,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: A11Y.fadeOutDuration,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <Pressable
        style={styles.backdrop}
        onPress={closeOnBackdrop ? onClose : undefined}
        accessibilityElementsHidden
      />

      <Animated.View
        style={[
          styles.sheet,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
          style,
        ]}
        accessibilityLiveRegion="polite"
      >
        {icon && (
          <Text style={styles.icon} accessibilityElementsHidden>
            {icon}
          </Text>
        )}

        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>

        {message && (
          <Text style={styles.message}>{message}</Text>
        )}

        {actions.length > 0 && (
          <View style={styles.actions}>
            {actions.map((action, idx) => (
              <MBButton
                key={idx}
                label={action.label}
                onPress={action.onPress}
                variant={action.variant ?? (idx === 0 ? 'primary' : 'ghost')}
                size="standard"
                style={styles.actionButton}
              />
            ))}
          </View>
        )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(27, 42, 74, 0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 32,
    paddingBottom: 48,
    alignItems: 'center',
    gap: 16,
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 16,
  },
  icon: {
    fontSize: 64,
    lineHeight: 76,
    marginBottom: 8,
  },
  title: {
    fontSize: A11Y.fontSizeHeading,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
    lineHeight: A11Y.fontSizeHeading * A11Y.lineHeight,
  },
  message: {
    fontSize: A11Y.fontSizeBody,
    fontWeight: '400',
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: A11Y.fontSizeBody * A11Y.lineHeight,
  },
  actions: {
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    width: '100%',
  },
});
