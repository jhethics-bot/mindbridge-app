/**
 * LoadingSkeleton - NeuBridge Skeleton Placeholder Component
 *
 * Animated pulsing placeholders shown while content loads.
 * Three variants: card (default), list, and dashboard.
 */
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

interface LoadingSkeletonProps {
  variant?: 'card' | 'list' | 'dashboard';
  count?: number;
}

const SKELETON_COLOR = `${COLORS.navy}1A`; // navy at ~10% opacity

function LoadingSkeleton({ variant = 'card', count = 3 }: LoadingSkeletonProps) {
  const pulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.7,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const animatedStyle = { opacity: pulse };

  if (variant === 'list') {
    return (
      <View style={styles.container}>
        {Array.from({ length: count }).map((_, i) => (
          <Animated.View key={i} style={[styles.listRow, animatedStyle]}>
            <View style={styles.listCircle} />
            <View style={styles.listLine} />
          </Animated.View>
        ))}
      </View>
    );
  }

  if (variant === 'dashboard') {
    return (
      <View style={styles.container}>
        <View style={styles.dashboardGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Animated.View key={i} style={[styles.dashboardBox, animatedStyle]} />
          ))}
        </View>
      </View>
    );
  }

  // Default: 'card'
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, i) => (
        <Animated.View key={i} style={[styles.card, animatedStyle]}>
          <View style={styles.cardCircle} />
          <View style={styles.cardLines}>
            <View style={styles.cardLineShort} />
            <View style={styles.cardLineLong} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cream,
    padding: 16,
    gap: 12,
  },

  // Card variant
  card: {
    width: '100%',
    height: 80,
    backgroundColor: SKELETON_COLOR,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  cardCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SKELETON_COLOR,
  },
  cardLines: {
    flex: 1,
    gap: 8,
  },
  cardLineShort: {
    width: '50%',
    height: 12,
    borderRadius: 6,
    backgroundColor: SKELETON_COLOR,
  },
  cardLineLong: {
    width: '80%',
    height: 12,
    borderRadius: 6,
    backgroundColor: SKELETON_COLOR,
  },

  // List variant
  listRow: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SKELETON_COLOR,
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  listCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: SKELETON_COLOR,
  },
  listLine: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    backgroundColor: SKELETON_COLOR,
  },

  // Dashboard variant
  dashboardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  dashboardBox: {
    width: '47%',
    aspectRatio: 1,
    backgroundColor: SKELETON_COLOR,
    borderRadius: 12,
  },
});

export default LoadingSkeleton;
export { LoadingSkeleton };
