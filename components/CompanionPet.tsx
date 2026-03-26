// components/CompanionPet.tsx
// Companion pet with Reanimated 3 animations + View-based circle sprites
// Phase 3: 5 animation states, mood reactions, haptic feedback
import React, { useCallback, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';
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

// ── Animation state type ──────────────────────────────────
export type PetAnimationState =
  | 'idle'
  | 'happy_bounce'
  | 'cozy_curl'
  | 'curious_tilt'
  | 'interact_respond'
  | 'mood_comfort'    // slow blink for low-mood comfort
  | 'celebrate';      // game completion

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
  hydrationLow?: boolean;
  animationState?: PetAnimationState;
  showCelebration?: boolean; // game completion message
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

// ── Gentle easing ─────────────────────────────────────────
const GENTLE_EASE = Easing.bezier(0.25, 0.1, 0.25, 1);

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
  hydrationLow = false,
  animationState = 'idle',
  showCelebration = false,
}) => {
  const palette = PET_PALETTES[colorPrimary] ?? PET_PALETTES.golden;

  // ── Shared animation values ────────────────────────────
  const bodyTranslateY = useSharedValue(0);
  const bodyScale = useSharedValue(1);
  const headRotate = useSharedValue(0);
  const earTranslateY = useSharedValue(0);
  const eyeOpacity = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  // ── Animation state machine ────────────────────────────
  useEffect(() => {
    // Cancel any running animations
    cancelAnimation(bodyTranslateY);
    cancelAnimation(bodyScale);
    cancelAnimation(headRotate);
    cancelAnimation(earTranslateY);
    cancelAnimation(eyeOpacity);
    cancelAnimation(glowOpacity);

    // Reset to defaults
    bodyScale.value = withTiming(1, { duration: 200 });
    headRotate.value = withTiming(0, { duration: 200 });
    earTranslateY.value = withTiming(0, { duration: 200 });
    eyeOpacity.value = withTiming(1, { duration: 200 });
    glowOpacity.value = withTiming(0, { duration: 200 });

    switch (animationState) {
      case 'idle':
        // Gentle breathing: 2px up/down, 3-second cycle
        bodyTranslateY.value = withRepeat(
          withSequence(
            withTiming(-2, { duration: 1500, easing: GENTLE_EASE }),
            withTiming(0, { duration: 1500, easing: GENTLE_EASE }),
          ),
          -1, // infinite
          true,
        );
        // Ears subtle movement
        earTranslateY.value = withRepeat(
          withSequence(
            withDelay(500, withTiming(-1, { duration: 1200, easing: GENTLE_EASE })),
            withTiming(0, { duration: 1200, easing: GENTLE_EASE }),
          ),
          -1,
          true,
        );
        break;

      case 'happy_bounce':
        // Bounce 8px, 0.5s cycle, 3 times then idle
        bodyTranslateY.value = withSequence(
          withTiming(-8, { duration: 250, easing: GENTLE_EASE }),
          withTiming(0, { duration: 250, easing: GENTLE_EASE }),
          withTiming(-8, { duration: 250, easing: GENTLE_EASE }),
          withTiming(0, { duration: 250, easing: GENTLE_EASE }),
          withTiming(-8, { duration: 250, easing: GENTLE_EASE }),
          withTiming(0, { duration: 250, easing: GENTLE_EASE }),
          // Return to idle breathe
          withRepeat(
            withSequence(
              withTiming(-2, { duration: 1500, easing: GENTLE_EASE }),
              withTiming(0, { duration: 1500, easing: GENTLE_EASE }),
            ),
            -1,
            true,
          ),
        );
        // Ear wiggle for bunnies/dogs
        earTranslateY.value = withSequence(
          withTiming(-3, { duration: 150 }),
          withTiming(2, { duration: 150 }),
          withTiming(-3, { duration: 150 }),
          withTiming(0, { duration: 150 }),
          withTiming(0, { duration: 200 }),
        );
        break;

      case 'cozy_curl':
        // Body lowers, elements compact
        bodyTranslateY.value = withTiming(5, { duration: 800, easing: GENTLE_EASE });
        bodyScale.value = withTiming(0.95, { duration: 800, easing: GENTLE_EASE });
        // Warm glow effect
        glowOpacity.value = withRepeat(
          withSequence(
            withTiming(0.3, { duration: 1500, easing: GENTLE_EASE }),
            withTiming(0, { duration: 1500, easing: GENTLE_EASE }),
          ),
          3,
          false,
        );
        // After 5 seconds, return to idle
        bodyTranslateY.value = withDelay(
          5000,
          withRepeat(
            withSequence(
              withTiming(-2, { duration: 1500, easing: GENTLE_EASE }),
              withTiming(0, { duration: 1500, easing: GENTLE_EASE }),
            ),
            -1,
            true,
          ),
        );
        bodyScale.value = withDelay(5000, withTiming(1, { duration: 500 }));
        break;

      case 'curious_tilt':
        // Head tilts 10 degrees for 2 seconds
        headRotate.value = withSequence(
          withTiming(10, { duration: 500, easing: GENTLE_EASE }),
          withDelay(1500, withTiming(0, { duration: 500, easing: GENTLE_EASE })),
        );
        // Ears perk up
        earTranslateY.value = withSequence(
          withTiming(-3, { duration: 300, easing: GENTLE_EASE }),
          withDelay(2000, withTiming(0, { duration: 300, easing: GENTLE_EASE })),
        );
        // Then idle breathe
        bodyTranslateY.value = withRepeat(
          withSequence(
            withTiming(-2, { duration: 1500, easing: GENTLE_EASE }),
            withTiming(0, { duration: 1500, easing: GENTLE_EASE }),
          ),
          -1,
          true,
        );
        break;

      case 'interact_respond':
        // Quick scale pulse on tap
        bodyScale.value = withSequence(
          withTiming(1.1, { duration: 150, easing: GENTLE_EASE }),
          withTiming(1, { duration: 150, easing: GENTLE_EASE }),
        );
        // Brief color glow
        glowOpacity.value = withSequence(
          withTiming(0.4, { duration: 150 }),
          withTiming(0, { duration: 300 }),
        );
        // Then idle
        bodyTranslateY.value = withDelay(
          400,
          withRepeat(
            withSequence(
              withTiming(-2, { duration: 1500, easing: GENTLE_EASE }),
              withTiming(0, { duration: 1500, easing: GENTLE_EASE }),
            ),
            -1,
            true,
          ),
        );
        break;

      case 'mood_comfort':
        // Slow blink (calming) — 3 times
        eyeOpacity.value = withRepeat(
          withSequence(
            withTiming(0.15, { duration: 800, easing: GENTLE_EASE }),
            withTiming(1, { duration: 800, easing: GENTLE_EASE }),
            withDelay(400, withTiming(1, { duration: 1 })),
          ),
          3,
          false,
        );
        // Gentle settle
        bodyTranslateY.value = withTiming(3, { duration: 600, easing: GENTLE_EASE });
        bodyScale.value = withTiming(0.97, { duration: 600, easing: GENTLE_EASE });
        // Return to idle after
        bodyTranslateY.value = withDelay(
          6000,
          withRepeat(
            withSequence(
              withTiming(-2, { duration: 1500, easing: GENTLE_EASE }),
              withTiming(0, { duration: 1500, easing: GENTLE_EASE }),
            ),
            -1,
            true,
          ),
        );
        bodyScale.value = withDelay(6000, withTiming(1, { duration: 400 }));
        break;

      case 'celebrate':
        // Game completion: bounce + scale
        bodyTranslateY.value = withSequence(
          withTiming(-10, { duration: 200, easing: GENTLE_EASE }),
          withTiming(0, { duration: 200, easing: GENTLE_EASE }),
          withTiming(-8, { duration: 200, easing: GENTLE_EASE }),
          withTiming(0, { duration: 200, easing: GENTLE_EASE }),
          withTiming(-5, { duration: 200, easing: GENTLE_EASE }),
          withTiming(0, { duration: 200, easing: GENTLE_EASE }),
          // Return to idle
          withRepeat(
            withSequence(
              withTiming(-2, { duration: 1500, easing: GENTLE_EASE }),
              withTiming(0, { duration: 1500, easing: GENTLE_EASE }),
            ),
            -1,
            true,
          ),
        );
        // Glow
        glowOpacity.value = withSequence(
          withTiming(0.5, { duration: 300 }),
          withTiming(0, { duration: 600 }),
        );
        break;
    }
  }, [animationState]);

  // ── Animated styles ────────────────────────────────────
  const bodyAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: bodyTranslateY.value },
      { scale: bodyScale.value },
    ],
  }));

  const headAnimStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${headRotate.value}deg` }],
  }));

  const eyeAnimStyle = useAnimatedStyle(() => ({
    opacity: eyeOpacity.value,
  }));

  const glowAnimStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  // ── Tap interaction handler ────────────────────────────
  const handleTap = useCallback(async () => {
    // Haptic: light impact for pet/stroke
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Audio: placeholder for when expo-av is available
    // TODO: Play soft chirp/purr sound based on petType

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

  // ── Render ─────────────────────────────────────────────
  const eyeOpenness = moodState === 'sleepy' ? 0.3 : moodState === 'cozy' ? 0.6 : 1.0;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handleTap}
        activeOpacity={0.9}
        style={[styles.touchTarget, { width: Math.max(size, 64), height: Math.max(size, 64) }]}
        accessibilityLabel={`${petName} the ${petType}. Tap to interact.`}
        accessibilityRole="button"
      >
        <Animated.View style={bodyAnimStyle}>
          {/* Glow overlay */}
          <Animated.View style={[
            { position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: COLORS.gold },
            glowAnimStyle,
          ]} />
          <Animated.View style={headAnimStyle}>
            <View style={{ width: size, height: size, position: 'relative' }}>
              <PetSprite
                type={petType}
                palette={palette}
                eyeOpenness={eyeOpenness}
                moodState={moodState}
                size={size}
                eyeAnimStyle={eyeAnimStyle}
                earTranslateY={earTranslateY}
              />
            </View>
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>

      <Text style={styles.petName}>{petName}</Text>
      <View style={[styles.moodDot, { backgroundColor: getMoodColor(moodState) }]} />

      {/* Hydration cue */}
      {hydrationLow && (
        <Text style={styles.hydrationCue}>💧</Text>
      )}

      {/* Celebration message */}
      {showCelebration && (
        <Text style={styles.celebrationText}>
          {petName} is so proud of you!
        </Text>
      )}
    </View>
  );
};

// ── Pet Sprite Renderer (View-based circles) ──────────────
interface PetSpriteProps {
  type: PetType;
  palette: { body: string; accent: string; eyes: string };
  eyeOpenness: number;
  moodState: PetMoodState;
  size: number;
  eyeAnimStyle: any;
  earTranslateY: Animated.SharedValue<number>;
}

const PetSprite: React.FC<PetSpriteProps> = ({ type, palette, eyeOpenness, moodState, size, eyeAnimStyle, earTranslateY }) => {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;

  // Animated ear wrapper
  const earAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: earTranslateY.value }],
  }));

  switch (type) {
    case 'dog':
      return (
        <>
          <Dot cx={cx} cy={cy + s * 0.05} r={s * 0.32} color={palette.body} />
          <Dot cx={cx} cy={cy - s * 0.18} r={s * 0.32 * 0.75} color={palette.body} />
          {/* Animated ears */}
          <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: s, height: s }, earAnimStyle]}>
            <Dot cx={cx - s * 0.32 * 0.72} cy={cy - s * 0.32} r={s * 0.32 * 0.38} color={palette.accent} />
            <Dot cx={cx + s * 0.32 * 0.72} cy={cy - s * 0.32} r={s * 0.32 * 0.38} color={palette.accent} />
          </Animated.View>
          <Dot cx={cx} cy={cy - s * 0.08} r={s * 0.32 * 0.35} color={palette.accent} />
          <Dot cx={cx} cy={cy - s * 0.13} r={s * 0.32 * 0.12} color={palette.eyes} />
          {/* Animated eyes */}
          <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: s, height: s }, eyeAnimStyle]}>
            <Dot cx={cx - s * 0.32 * 0.35} cy={cy - s * 0.26} r={s * 0.32 * 0.13 * eyeOpenness} color={palette.eyes} />
            <Dot cx={cx + s * 0.32 * 0.35} cy={cy - s * 0.26} r={s * 0.32 * 0.13 * eyeOpenness} color={palette.eyes} />
          </Animated.View>
          {/* Tail */}
          <Dot cx={cx + s * 0.32 * 0.9 + (moodState === 'happy' ? s * 0.32 * 0.15 : 0)} cy={cy - s * 0.05} r={s * 0.32 * 0.2} color={palette.accent} />
        </>
      );
    case 'cat':
      return (
        <>
          <Dot cx={cx} cy={cy + s * 0.08} r={s * 0.3} color={palette.body} />
          <Dot cx={cx} cy={cy - s * 0.15} r={s * 0.3 * 0.72} color={palette.body} />
          <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: s, height: s }, earAnimStyle]}>
            <Dot cx={cx - s * 0.3 * 0.58} cy={cy - s * 0.38} r={s * 0.3 * 0.28} color={palette.body} />
            <Dot cx={cx + s * 0.3 * 0.58} cy={cy - s * 0.38} r={s * 0.3 * 0.28} color={palette.body} />
            <Dot cx={cx - s * 0.3 * 0.58} cy={cy - s * 0.38} r={s * 0.3 * 0.16} color={palette.accent} />
            <Dot cx={cx + s * 0.3 * 0.58} cy={cy - s * 0.38} r={s * 0.3 * 0.16} color={palette.accent} />
          </Animated.View>
          <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: s, height: s }, eyeAnimStyle]}>
            <Dot cx={cx - s * 0.3 * 0.32} cy={cy - s * 0.22} r={s * 0.3 * 0.14 * eyeOpenness} color={palette.eyes} />
            <Dot cx={cx + s * 0.3 * 0.32} cy={cy - s * 0.22} r={s * 0.3 * 0.14 * eyeOpenness} color={palette.eyes} />
          </Animated.View>
          <Dot cx={cx} cy={cy - s * 0.1} r={s * 0.3 * 0.08} color={palette.accent} />
        </>
      );
    case 'bird':
      return (
        <>
          <Dot cx={cx} cy={cy + s * 0.1} r={s * 0.26 * 1.1} color={palette.body} />
          <Dot cx={cx} cy={cy - s * 0.12} r={s * 0.26 * 0.72} color={palette.body} />
          {/* Wings (act as "ears" for animation) */}
          <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: s, height: s }, earAnimStyle]}>
            <Dot cx={cx - s * 0.26 * 0.9} cy={cy + s * 0.05} r={s * 0.26 * 0.55} color={palette.accent} />
            <Dot cx={cx + s * 0.26 * 0.9} cy={cy + s * 0.05} r={s * 0.26 * 0.55} color={palette.accent} />
          </Animated.View>
          <Dot cx={cx} cy={cy - s * 0.06} r={s * 0.26 * 0.18} color={COLORS.gold} />
          <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: s, height: s }, eyeAnimStyle]}>
            <Dot cx={cx - s * 0.26 * 0.25} cy={cy - s * 0.2} r={s * 0.26 * 0.14 * eyeOpenness} color={palette.eyes} />
            <Dot cx={cx + s * 0.26 * 0.25} cy={cy - s * 0.2} r={s * 0.26 * 0.14 * eyeOpenness} color={palette.eyes} />
          </Animated.View>
          <Dot cx={cx} cy={cy - s * 0.32 - (moodState === 'happy' ? s * 0.26 * 0.1 : 0)} r={s * 0.26 * 0.2} color={palette.accent} />
        </>
      );
    case 'bunny':
      return (
        <>
          <Dot cx={cx} cy={cy + s * 0.1} r={s * 0.28} color={palette.body} />
          <Dot cx={cx} cy={cy - s * 0.14} r={s * 0.28 * 0.7} color={palette.body} />
          <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: s, height: s }, earAnimStyle]}>
            <Dot cx={cx - s * 0.28 * 0.45} cy={cy - s * 0.42} r={s * 0.28 * 0.22} color={palette.body} />
            <Dot cx={cx + s * 0.28 * 0.45} cy={cy - s * 0.42} r={s * 0.28 * 0.22} color={palette.body} />
            <Dot cx={cx - s * 0.28 * 0.45} cy={cy - s * 0.42} r={s * 0.28 * 0.12} color={palette.accent} />
            <Dot cx={cx + s * 0.28 * 0.45} cy={cy - s * 0.42} r={s * 0.28 * 0.12} color={palette.accent} />
          </Animated.View>
          <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: s, height: s }, eyeAnimStyle]}>
            <Dot cx={cx - s * 0.28 * 0.3} cy={cy - s * 0.22} r={s * 0.28 * 0.13 * eyeOpenness} color={palette.eyes} />
            <Dot cx={cx + s * 0.28 * 0.3} cy={cy - s * 0.22} r={s * 0.28 * 0.13 * eyeOpenness} color={palette.eyes} />
          </Animated.View>
          <Dot cx={cx} cy={cy - s * 0.1} r={s * 0.28 * 0.09} color={palette.accent} />
          <Dot cx={cx + s * 0.28 * 0.85} cy={cy + s * 0.15} r={s * 0.28 * 0.22} color={COLORS.cream} />
        </>
      );
  }
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

/**
 * Determine pet animation state from mood score (after mood check-in).
 * Call this when patient completes mood check-in.
 */
export function getAnimationForMood(moodScore: number): PetAnimationState {
  if (moodScore >= 4) return 'happy_bounce';
  if (moodScore === 3) return 'curious_tilt'; // gentle nod
  // Score 1-2: comfort posture — slow blink
  return 'mood_comfort';
}

/**
 * Haptic patterns for different interaction types.
 */
export async function petHaptic(interactionType: string) {
  switch (interactionType) {
    case 'feed':
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      break;
    case 'play':
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Double tap feel
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 100);
      break;
    case 'greet':
    case 'goodnight':
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    default:
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
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
  hydrationCue: {
    fontSize: 16,
    marginTop: 2,
  },
  celebrationText: {
    color: '#2A9D8F',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
});
