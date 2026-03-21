// components/CompanionPet.tsx
// Animated companion pet using View-based circles + Reanimated 3
// Replaces Skia Canvas (not installed) with absolute-positioned rounded Views
import React, { useEffect, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabase';
import type { PetMoodState, PetType } from '../lib/petMoodEngine';

// ── Brand Colors ──────────────────────────────────────────
const COLORS = {
  navy: '#0D2137',
  teal: '#0D9488',
  tealLight: '#14B8A6',
  gold: '#D4A843',
  cream: '#F5F0E8',
  white: '#FFFFFF',
};

// ── Pet Color Palettes ────────────────────────────────────
const PET_PALETTES: Record<string, { body: string; accent: string; eyes: string }> = {
  golden:  { body: '#C8860A', accent: '#E8A020', eyes: '#3D2000' },
  brown:   { body: '#7B4F2E', accent: '#9C6B42', eyes: '#1A0A00' },
  black:   { body: '#1A1A1A', accent: '#333333', eyes: '#555555' },
  white:   { body: '#F0EDE8', accent: '#D4C9B8', eyes: '#3D3030' },
  gray:    { body: '#8A8A8A', accent: '#AAAAAA', eyes: '#222222' },
  orange:  { body: '#D4580A', accent: '#E87030', eyes: '#2A1000' },
  teal:    { body: '#0D9488', accent: '#14B8A6', eyes: '#062E2A' },
};

// ── Props ─────────────────────────────────────────────────
interface CompanionPetProps {
  petId: string;
  petType: PetType;
  petName: string;
  colorPrimary?: string;
  moodState: PetMoodState;
  patientId: string;
  onInteraction?: (type: string) => void;
  size?: number;
}

// ── Rounded circle helper ─────────────────────────────────
const Dot = ({ cx, cy, r, color }: { cx: number; cy: number; r: number; color: string }) => (
  <View
    style={{
      position: 'absolute',
      left: cx - r,
      top: cy - r,
      width: r * 2,
      height: r * 2,
      borderRadius: r,
      backgroundColor: color,
    }}
  />
);

// ── Main Component ────────────────────────────────────────
export const CompanionPet: React.FC<CompanionPetProps> = ({
  petId,
  petType,
  petName,
  colorPrimary = 'golden',
  moodState,
  patientId,
  onInteraction,
  size = 120,
}) => {
  const palette = PET_PALETTES[colorPrimary] ?? PET_PALETTES.golden;

  // ── Shared animation values ──────────────────────────────
  const translateY    = useSharedValue(0);
  const scale         = useSharedValue(1);
  const rotateZ       = useSharedValue(0);
  const opacity       = useSharedValue(1);

  // ── Trigger idle animation based on moodState ────────────
  useEffect(() => {
    cancelAnimation(translateY);
    cancelAnimation(scale);
    cancelAnimation(rotateZ);

    switch (moodState) {
      case 'happy':
        translateY.value = withRepeat(
          withSequence(
            withTiming(-10, { duration: 300, easing: Easing.out(Easing.quad) }),
            withTiming(0,   { duration: 300, easing: Easing.in(Easing.quad) }),
          ),
          -1,
          false
        );
        break;

      case 'calm':
        scale.value = withRepeat(
          withSequence(
            withTiming(1.03, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
            withTiming(1.0,  { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          ),
          -1,
          false
        );
        break;

      case 'sleepy':
        translateY.value = withRepeat(
          withSequence(
            withTiming(4, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
            withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
          ),
          -1,
          false
        );
        break;

      case 'cozy':
        scale.value = withRepeat(
          withSequence(
            withTiming(1.02, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
            withTiming(0.99, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
          ),
          -1,
          false
        );
        break;

      case 'curious':
        rotateZ.value = withRepeat(
          withSequence(
            withTiming(0.15,  { duration: 600, easing: Easing.out(Easing.quad) }),
            withTiming(0,     { duration: 400, easing: Easing.in(Easing.quad) }),
            withTiming(-0.08, { duration: 400, easing: Easing.out(Easing.quad) }),
            withTiming(0,     { duration: 400, easing: Easing.in(Easing.quad) }),
            withTiming(0,     { duration: 2000 }),
          ),
          -1,
          false
        );
        break;
    }
  }, [moodState]);

  // ── Tap interaction handler ──────────────────────────────
  const handleTap = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    scale.value = withSequence(
      withSpring(1.25, { damping: 4, stiffness: 300 }),
      withSpring(1.0,  { damping: 8, stiffness: 200 }),
    );

    try {
      await supabase.from('pet_interactions').insert({
        pet_id: petId,
        patient_id: patientId,
        interaction_type: 'pet',
      });
    } catch (e) {
      console.warn('[CompanionPet] Failed to log interaction:', e);
    }

    onInteraction?.('pet');
  }, [petId, patientId, onInteraction]);

  // ── Animated container style ─────────────────────────────
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotateZ.value}rad` },
    ],
    opacity: opacity.value,
  }));

  // ── Render ───────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handleTap}
        activeOpacity={0.9}
        style={[styles.touchTarget, { width: Math.max(size, 64), height: Math.max(size, 64) }]}
        accessibilityLabel={`${petName} the ${petType}. Tap to interact.`}
        accessibilityRole="button"
      >
        <Animated.View style={animatedStyle}>
          <View style={{ width: size, height: size, position: 'relative' }}>
            <PetSprite
              type={petType}
              palette={palette}
              moodState={moodState}
              size={size}
            />
          </View>
        </Animated.View>
      </TouchableOpacity>

      <Text style={styles.petName}>{petName}</Text>
      <View style={[styles.moodDot, { backgroundColor: getMoodColor(moodState) }]} />
    </View>
  );
};

// ── Pet Sprite Renderer (View-based circles) ──────────────
interface PetSpriteProps {
  type: PetType;
  palette: { body: string; accent: string; eyes: string };
  moodState: PetMoodState;
  size: number;
}

const PetSprite: React.FC<PetSpriteProps> = ({ type, palette, moodState, size }) => {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;
  const eyeOpenness = moodState === 'sleepy' ? 0.3 : moodState === 'cozy' ? 0.6 : 1.0;

  switch (type) {
    case 'dog':
      return <DogSprite cx={cx} cy={cy} s={s} palette={palette} eyeOpenness={eyeOpenness} moodState={moodState} />;
    case 'cat':
      return <CatSprite cx={cx} cy={cy} s={s} palette={palette} eyeOpenness={eyeOpenness} moodState={moodState} />;
    case 'bird':
      return <BirdSprite cx={cx} cy={cy} s={s} palette={palette} eyeOpenness={eyeOpenness} moodState={moodState} />;
    case 'bunny':
      return <BunnySprite cx={cx} cy={cy} s={s} palette={palette} eyeOpenness={eyeOpenness} moodState={moodState} />;
  }
};

// ── Dog ───────────────────────────────────────────────────
const DogSprite = ({ cx, cy, s, palette, eyeOpenness, moodState }: any) => {
  const r = s * 0.32;
  return (
    <>
      <Dot cx={cx} cy={cy + s * 0.05} r={r} color={palette.body} />
      <Dot cx={cx} cy={cy - s * 0.18} r={r * 0.75} color={palette.body} />
      <Dot cx={cx - r * 0.72} cy={cy - s * 0.32} r={r * 0.38} color={palette.accent} />
      <Dot cx={cx + r * 0.72} cy={cy - s * 0.32} r={r * 0.38} color={palette.accent} />
      <Dot cx={cx} cy={cy - s * 0.08} r={r * 0.35} color={palette.accent} />
      <Dot cx={cx} cy={cy - s * 0.13} r={r * 0.12} color={palette.eyes} />
      <Dot cx={cx - r * 0.35} cy={cy - s * 0.26} r={r * 0.13 * eyeOpenness} color={palette.eyes} />
      <Dot cx={cx + r * 0.35} cy={cy - s * 0.26} r={r * 0.13 * eyeOpenness} color={palette.eyes} />
      <Dot cx={cx + r * 0.9 + (moodState === 'happy' ? r * 0.15 : 0)} cy={cy - s * 0.05} r={r * 0.2} color={palette.accent} />
    </>
  );
};

// ── Cat ───────────────────────────────────────────────────
const CatSprite = ({ cx, cy, s, palette, eyeOpenness }: any) => {
  const r = s * 0.3;
  return (
    <>
      <Dot cx={cx} cy={cy + s * 0.08} r={r} color={palette.body} />
      <Dot cx={cx} cy={cy - s * 0.15} r={r * 0.72} color={palette.body} />
      <Dot cx={cx - r * 0.58} cy={cy - s * 0.38} r={r * 0.28} color={palette.body} />
      <Dot cx={cx + r * 0.58} cy={cy - s * 0.38} r={r * 0.28} color={palette.body} />
      <Dot cx={cx - r * 0.58} cy={cy - s * 0.38} r={r * 0.16} color={palette.accent} />
      <Dot cx={cx + r * 0.58} cy={cy - s * 0.38} r={r * 0.16} color={palette.accent} />
      <Dot cx={cx - r * 0.32} cy={cy - s * 0.22} r={r * 0.14 * eyeOpenness} color={palette.eyes} />
      <Dot cx={cx + r * 0.32} cy={cy - s * 0.22} r={r * 0.14 * eyeOpenness} color={palette.eyes} />
      <Dot cx={cx} cy={cy - s * 0.1} r={r * 0.08} color={palette.accent} />
    </>
  );
};

// ── Bird ──────────────────────────────────────────────────
const BirdSprite = ({ cx, cy, s, palette, eyeOpenness, moodState }: any) => {
  const r = s * 0.26;
  return (
    <>
      <Dot cx={cx} cy={cy + s * 0.1} r={r * 1.1} color={palette.body} />
      <Dot cx={cx} cy={cy - s * 0.12} r={r * 0.72} color={palette.body} />
      <Dot cx={cx - r * 0.9} cy={cy + s * 0.05} r={r * 0.55} color={palette.accent} />
      <Dot cx={cx + r * 0.9} cy={cy + s * 0.05} r={r * 0.55} color={palette.accent} />
      <Dot cx={cx} cy={cy - s * 0.06} r={r * 0.18} color={COLORS.gold} />
      <Dot cx={cx - r * 0.25} cy={cy - s * 0.2} r={r * 0.14 * eyeOpenness} color={palette.eyes} />
      <Dot cx={cx + r * 0.25} cy={cy - s * 0.2} r={r * 0.14 * eyeOpenness} color={palette.eyes} />
      <Dot cx={cx} cy={cy - s * 0.32 - (moodState === 'happy' ? r * 0.1 : 0)} r={r * 0.2} color={palette.accent} />
    </>
  );
};

// ── Bunny ─────────────────────────────────────────────────
const BunnySprite = ({ cx, cy, s, palette, eyeOpenness }: any) => {
  const r = s * 0.28;
  return (
    <>
      <Dot cx={cx} cy={cy + s * 0.1} r={r} color={palette.body} />
      <Dot cx={cx} cy={cy - s * 0.14} r={r * 0.7} color={palette.body} />
      <Dot cx={cx - r * 0.45} cy={cy - s * 0.42} r={r * 0.22} color={palette.body} />
      <Dot cx={cx + r * 0.45} cy={cy - s * 0.42} r={r * 0.22} color={palette.body} />
      <Dot cx={cx - r * 0.45} cy={cy - s * 0.42} r={r * 0.12} color={palette.accent} />
      <Dot cx={cx + r * 0.45} cy={cy - s * 0.42} r={r * 0.12} color={palette.accent} />
      <Dot cx={cx - r * 0.3} cy={cy - s * 0.22} r={r * 0.13 * eyeOpenness} color={palette.eyes} />
      <Dot cx={cx + r * 0.3} cy={cy - s * 0.22} r={r * 0.13 * eyeOpenness} color={palette.eyes} />
      <Dot cx={cx} cy={cy - s * 0.1} r={r * 0.09} color={palette.accent} />
      <Dot cx={cx + r * 0.85} cy={cy + s * 0.15} r={r * 0.22} color={COLORS.cream} />
    </>
  );
};

// ── Helpers ───────────────────────────────────────────────
function getMoodColor(state: PetMoodState): string {
  const map: Record<PetMoodState, string> = {
    happy:   COLORS.teal,
    calm:    COLORS.tealLight,
    sleepy:  '#8BAFC8',
    cozy:    COLORS.gold,
    curious: '#A78BFA',
  };
  return map[state];
}

// ── Styles ────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchTarget: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
    minHeight: 64,
  },
  petName: {
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  moodDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 3,
  },
});
