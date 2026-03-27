/**
 * Gentle Touch — Sensory Screen
 * Interactive colored circles that ripple on tap. No scoring, purely calming.
 */
import React, { useState, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { MBButton } from '../../components/ui/MBButton';
import { COLORS } from '../../constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';

const CIRCLE_COLORS = [
  '#2A9D8F', // teal
  '#E9C46A', // gold
  '#E76F51', // coral
  '#A78BFA', // purple
  '#4ADE80', // green
  '#7DD3FC', // blue
];

interface CircleState {
  id: number;
  colorIdx: number;
  scale: Animated.Value;
  opacity: Animated.Value;
}

export default function GentleTouchScreen() {
  const router = useRouter();
  const [circles, setCircles] = useState<CircleState[]>(() =>
    CIRCLE_COLORS.map((_, i) => ({
      id: i,
      colorIdx: i,
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1),
    }))
  );

  const handleTouch = (circle: CircleState) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Ripple animation: scale up, slight fade, then settle with new color
    Animated.sequence([
      Animated.parallel([
        Animated.timing(circle.scale, { toValue: 1.3, duration: 200, useNativeDriver: true }),
        Animated.timing(circle.opacity, { toValue: 0.6, duration: 200, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(circle.scale, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(circle.opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();

    // Shift color
    setCircles(prev => prev.map(c =>
      c.id === circle.id
        ? { ...c, colorIdx: (c.colorIdx + 1) % CIRCLE_COLORS.length }
        : c
    ));
  };

  return (
    <SafeAreaView style={st.container}>
      <View style={st.grid}>
        {circles.map(circle => (
          <Pressable
            key={circle.id}
            onPress={() => handleTouch(circle)}
            accessibilityRole="button"
            accessibilityLabel="Tap to interact"
          >
            <Animated.View
              style={[
                st.circle,
                {
                  backgroundColor: CIRCLE_COLORS[circle.colorIdx],
                  transform: [{ scale: circle.scale }],
                  opacity: circle.opacity,
                },
              ]}
            />
          </Pressable>
        ))}
      </View>

      <View style={st.bottomBar}>
        <MBButton
          label="Home"
          variant="ghost"
          size="compact"
          onPress={() => router.replace('/(patient)')}
          textStyle={{ color: COLORS.gray }}
        />
      </View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  grid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    gap: 24,
    padding: 32,
  },
  circle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  bottomBar: {
    paddingBottom: 16,
    alignItems: 'center',
  },
});
