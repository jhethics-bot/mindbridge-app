# NeuBridge Companion Pet — Complete Build Spec
# Phase 1 Claude Code Execution Document
# Generated: March 21, 2026
# DO NOT modify this file. Execute all steps in order.

---

## CONTEXT

Project: NeuBridge (React Native / Expo SDK 52)
Local path: C:\Users\jheth\mindbridge-app\
Branch: master
GitHub: jhethics-bot/mindbridge-app
Supabase project: gzopkdbuznupcvtsmisb
Stack: React Native, Expo SDK 52, expo-router, Supabase, Zustand, Reanimated 3, Skia, NativeWind
CLAUDE.md guards are active — DO NOT run npm install or npm uninstall under any circumstances.

---

## PHASE 1 — EXECUTE ALL STEPS IN ORDER WITHOUT STOPPING

---

### STEP 1 — SUPABASE MIGRATIONS

Run these two SQL migrations against Supabase project gzopkdbuznupcvtsmisb.
Use the Supabase MCP or the supabase CLI. Do not skip or modify any column.

**Migration 1: companion_pets table**

```sql
CREATE TABLE IF NOT EXISTS companion_pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_relationship_id UUID NOT NULL REFERENCES care_relationships(id) ON DELETE CASCADE,
  pet_type TEXT NOT NULL CHECK (pet_type IN ('dog', 'cat', 'bird', 'bunny')),
  pet_name TEXT NOT NULL,
  color_primary TEXT NOT NULL DEFAULT 'golden',
  color_secondary TEXT,
  caregiver_voice_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup by care relationship
CREATE INDEX IF NOT EXISTS idx_companion_pets_care_relationship
  ON companion_pets(care_relationship_id);
```

**Migration 2: pet_interactions table**

```sql
CREATE TABLE IF NOT EXISTS pet_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES companion_pets(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (
    interaction_type IN ('pet', 'feed', 'play', 'greet', 'goodnight')
  ),
  mood_at_interaction INT CHECK (mood_at_interaction BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup by pet and date
CREATE INDEX IF NOT EXISTS idx_pet_interactions_pet_id
  ON pet_interactions(pet_id);
CREATE INDEX IF NOT EXISTS idx_pet_interactions_patient_date
  ON pet_interactions(patient_id, created_at DESC);
```

**Migration 3: RLS Policies**

```sql
-- Enable RLS on both tables
ALTER TABLE companion_pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_interactions ENABLE ROW LEVEL SECURITY;

-- companion_pets: patients can view their own pet
CREATE POLICY "patient_view_own_pet"
  ON companion_pets FOR SELECT
  USING (
    care_relationship_id IN (
      SELECT id FROM care_relationships WHERE patient_id = auth.uid()
    )
  );

-- companion_pets: caregivers can manage pets for their patients
CREATE POLICY "caregiver_manage_pet"
  ON companion_pets FOR ALL
  USING (
    care_relationship_id IN (
      SELECT id FROM care_relationships WHERE caregiver_id = auth.uid()
    )
  );

-- pet_interactions: patients can insert and view their own interactions
CREATE POLICY "patient_manage_interactions"
  ON pet_interactions FOR ALL
  USING (patient_id = auth.uid());

-- pet_interactions: caregivers can view interactions for their patients
CREATE POLICY "caregiver_view_interactions"
  ON pet_interactions FOR SELECT
  USING (
    pet_id IN (
      SELECT cp.id FROM companion_pets cp
      JOIN care_relationships cr ON cr.id = cp.care_relationship_id
      WHERE cr.caregiver_id = auth.uid()
    )
  );
```

**Verify migrations ran correctly:**
After running, confirm both tables exist with `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('companion_pets', 'pet_interactions');`
Expected result: 2 rows returned.

---

### STEP 2 — CREATE lib/petMoodEngine.ts

Create this file at `lib/petMoodEngine.ts` in the project root lib directory.
This is a pure deterministic function — no API calls, no imports from Supabase, no side effects.

```typescript
// lib/petMoodEngine.ts
// Companion Pet Mood Engine — deterministic, client-side, no API calls
// Same philosophy as the AI daily queue rebuild

export type PetMoodState = 'happy' | 'calm' | 'sleepy' | 'cozy' | 'curious';
export type PetType = 'dog' | 'cat' | 'bird' | 'bunny';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening';

export interface PetMoodContext {
  timeOfDay: TimeOfDay;
  activitiesCompletedToday: number;
  lastInteractionMinutesAgo: number;
  patientMoodScore: number | null; // 1-5 scale, null if no check-in today
}

export interface PetMoodResult {
  state: PetMoodState;
  animationKey: string;   // maps to Reanimated animation preset
  soundKey: string;       // maps to audio file key
  moodEmoji: string;      // for caregiver dashboard display
}

/**
 * Compute the pet's current mood state based on context.
 * Priority order: time of day → recent interaction → activities → patient mood → default
 * 
 * CRITICAL RULE: No state should ever feel punishing or negative.
 * The pet is NEVER distressed due to patient inaction.
 */
export function computePetMood(context: PetMoodContext): PetMoodResult {
  const {
    timeOfDay,
    activitiesCompletedToday,
    lastInteractionMinutesAgo,
    patientMoodScore,
  } = context;

  let state: PetMoodState;

  // Evening always overrides everything — natural sleep rhythm
  if (timeOfDay === 'evening') {
    state = 'sleepy';
  }
  // Just interacted in the last 5 minutes — still in post-interaction warmth
  else if (lastInteractionMinutesAgo < 5) {
    state = 'cozy';
  }
  // Had a productive day — pet is energized and happy
  else if (activitiesCompletedToday >= 2) {
    state = 'happy';
  }
  // Patient reported low mood — pet shifts to calm/comfort presence
  else if (patientMoodScore !== null && patientMoodScore <= 2) {
    state = 'calm';
  }
  // First visit of the day (no interaction in 24+ hours) — curious and alert
  else if (lastInteractionMinutesAgo > 1440) {
    state = 'curious';
  }
  // Default: calm and present
  else {
    state = 'calm';
  }

  return {
    state,
    animationKey: getMoodAnimation(state),
    soundKey: getMoodSound(state),
    moodEmoji: getMoodEmoji(state),
  };
}

/**
 * Get the Reanimated 3 animation preset key for a given mood state.
 * These keys map to animation configs in components/CompanionPet.tsx
 */
function getMoodAnimation(state: PetMoodState): string {
  const map: Record<PetMoodState, string> = {
    happy: 'happy_bounce',
    calm: 'idle_breathe',
    sleepy: 'sleepy_drift',
    cozy: 'cozy_curl',
    curious: 'curious_tilt',
  };
  return map[state];
}

/**
 * Get the ambient sound key for the current mood.
 * Sounds are loaded at app init and cached.
 */
function getMoodSound(state: PetMoodState): string {
  const map: Record<PetMoodState, string> = {
    happy: 'ambient_happy',
    calm: 'ambient_calm',
    sleepy: 'ambient_sleepy',
    cozy: 'ambient_cozy',
    curious: 'ambient_curious',
  };
  return map[state];
}

function getMoodEmoji(state: PetMoodState): string {
  const map: Record<PetMoodState, string> = {
    happy: '😊',
    calm: '😌',
    sleepy: '😴',
    cozy: '🥰',
    curious: '🤔',
  };
  return map[state];
}

/**
 * Determine time of day bucket from a Date object.
 * Morning: 5am–11:59am, Afternoon: 12pm–5:59pm, Evening: 6pm–4:59am
 */
export function getTimeOfDay(date: Date = new Date()): TimeOfDay {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening';
}

/**
 * Calculate how many minutes ago a timestamp was.
 * Returns Infinity if no timestamp provided (e.g. never interacted).
 */
export function minutesSince(timestamp: string | null | undefined): number {
  if (!timestamp) return Infinity;
  const then = new Date(timestamp).getTime();
  const now = Date.now();
  return Math.floor((now - then) / 60000);
}
```

---

### STEP 3 — CREATE components/CompanionPet.tsx

Create this file at `components/CompanionPet.tsx`.

This component renders an animated SVG-based pet using Skia Canvas + Reanimated 3.
4 pet types: dog, cat, bird, bunny.
5 animation states mapped from petMoodEngine.
All interactions are single tap, minimum 64x64pt touch targets.

```typescript
// components/CompanionPet.tsx
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
  runOnJS,
} from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Canvas, Circle, Path, Group, Paint } from '@shopify/react-native-skia';
import { supabase } from '@/lib/supabase';
import {
  PetMoodState,
  PetType,
  computePetMood,
  getTimeOfDay,
  minutesSince,
} from '@/lib/petMoodEngine';

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
        // Bouncy vertical loop
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
        // Subtle breathing — gentle scale pulse
        scale.value = withRepeat(
          withSequence(
            withTiming(1.03, { duration: 2000, easing: Easing.inOut(Easing.sine) }),
            withTiming(1.0,  { duration: 2000, easing: Easing.inOut(Easing.sine) }),
          ),
          -1,
          false
        );
        break;

      case 'sleepy':
        // Slow drift down and back
        translateY.value = withRepeat(
          withSequence(
            withTiming(4, { duration: 3000, easing: Easing.inOut(Easing.sine) }),
            withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.sine) }),
          ),
          -1,
          false
        );
        break;

      case 'cozy':
        // Very gentle scale pulse — settled and warm
        scale.value = withRepeat(
          withSequence(
            withTiming(1.02, { duration: 3000, easing: Easing.inOut(Easing.sine) }),
            withTiming(0.99, { duration: 3000, easing: Easing.inOut(Easing.sine) }),
          ),
          -1,
          false
        );
        break;

      case 'curious':
        // Head tilt — rotate and return
        rotateZ.value = withRepeat(
          withSequence(
            withTiming(0.15,  { duration: 600, easing: Easing.out(Easing.quad) }),
            withTiming(0,     { duration: 400, easing: Easing.in(Easing.quad) }),
            withTiming(-0.08, { duration: 400, easing: Easing.out(Easing.quad) }),
            withTiming(0,     { duration: 400, easing: Easing.in(Easing.quad) }),
            withTiming(0,     { duration: 2000 }), // pause
          ),
          -1,
          false
        );
        break;
    }
  }, [moodState]);

  // ── Tap interaction handler ──────────────────────────────
  const handleTap = useCallback(async () => {
    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Spring pop animation on tap
    scale.value = withSequence(
      withSpring(1.25, { damping: 4, stiffness: 300 }),
      withSpring(1.0,  { damping: 8, stiffness: 200 }),
    );

    // Log interaction to Supabase
    try {
      await supabase.from('pet_interactions').insert({
        pet_id: petId,
        patient_id: patientId,
        interaction_type: 'pet',
      });
    } catch (e) {
      // Non-critical — don't surface to user
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
          <Canvas style={{ width: size, height: size }}>
            <PetSvg
              type={petType}
              palette={palette}
              moodState={moodState}
              size={size}
            />
          </Canvas>
        </Animated.View>
      </TouchableOpacity>

      {/* Pet name label */}
      <Text style={styles.petName}>{petName}</Text>

      {/* Mood indicator dot */}
      <View style={[styles.moodDot, { backgroundColor: getMoodColor(moodState) }]} />
    </View>
  );
};

// ── SVG Pet Renderer (Skia Canvas) ────────────────────────
interface PetSvgProps {
  type: PetType;
  palette: { body: string; accent: string; eyes: string };
  moodState: PetMoodState;
  size: number;
}

const PetSvg: React.FC<PetSvgProps> = ({ type, palette, moodState, size }) => {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;

  // Eyes: open for most states, half-closed for sleepy
  const eyeOpenness = moodState === 'sleepy' ? 0.3 : moodState === 'cozy' ? 0.6 : 1.0;

  switch (type) {
    case 'dog':
      return <DogSvg cx={cx} cy={cy} s={s} palette={palette} eyeOpenness={eyeOpenness} moodState={moodState} />;
    case 'cat':
      return <CatSvg cx={cx} cy={cy} s={s} palette={palette} eyeOpenness={eyeOpenness} moodState={moodState} />;
    case 'bird':
      return <BirdSvg cx={cx} cy={cy} s={s} palette={palette} eyeOpenness={eyeOpenness} moodState={moodState} />;
    case 'bunny':
      return <BunnySvg cx={cx} cy={cy} s={s} palette={palette} eyeOpenness={eyeOpenness} moodState={moodState} />;
  }
};

// ── Dog SVG ───────────────────────────────────────────────
const DogSvg = ({ cx, cy, s, palette, eyeOpenness, moodState }: any) => {
  const r = s * 0.32; // body radius
  return (
    <Group>
      {/* Body */}
      <Circle cx={cx} cy={cy + s * 0.05} r={r} color={palette.body} />
      {/* Head */}
      <Circle cx={cx} cy={cy - s * 0.18} r={r * 0.75} color={palette.body} />
      {/* Ears */}
      <Circle cx={cx - r * 0.72} cy={cy - s * 0.32} r={r * 0.38} color={palette.accent} />
      <Circle cx={cx + r * 0.72} cy={cy - s * 0.32} r={r * 0.38} color={palette.accent} />
      {/* Snout */}
      <Circle cx={cx} cy={cy - s * 0.08} r={r * 0.35} color={palette.accent} />
      {/* Nose */}
      <Circle cx={cx} cy={cy - s * 0.13} r={r * 0.12} color={palette.eyes} />
      {/* Eyes */}
      <Circle cx={cx - r * 0.35} cy={cy - s * 0.26} r={r * 0.13 * eyeOpenness} color={palette.eyes} />
      <Circle cx={cx + r * 0.35} cy={cy - s * 0.26} r={r * 0.13 * eyeOpenness} color={palette.eyes} />
      {/* Tail — wagging offset for happy */}
      <Circle
        cx={cx + r * 0.9 + (moodState === 'happy' ? r * 0.15 : 0)}
        cy={cy - s * 0.05}
        r={r * 0.2}
        color={palette.accent}
      />
    </Group>
  );
};

// ── Cat SVG ───────────────────────────────────────────────
const CatSvg = ({ cx, cy, s, palette, eyeOpenness, moodState }: any) => {
  const r = s * 0.3;
  return (
    <Group>
      {/* Body */}
      <Circle cx={cx} cy={cy + s * 0.08} r={r} color={palette.body} />
      {/* Head */}
      <Circle cx={cx} cy={cy - s * 0.15} r={r * 0.72} color={palette.body} />
      {/* Pointy ears */}
      <Circle cx={cx - r * 0.58} cy={cy - s * 0.38} r={r * 0.28} color={palette.body} />
      <Circle cx={cx + r * 0.58} cy={cy - s * 0.38} r={r * 0.28} color={palette.body} />
      <Circle cx={cx - r * 0.58} cy={cy - s * 0.38} r={r * 0.16} color={palette.accent} />
      <Circle cx={cx + r * 0.58} cy={cy - s * 0.38} r={r * 0.16} color={palette.accent} />
      {/* Eyes — almond shaped approximation via circles */}
      <Circle cx={cx - r * 0.32} cy={cy - s * 0.22} r={r * 0.14 * eyeOpenness} color={palette.eyes} />
      <Circle cx={cx + r * 0.32} cy={cy - s * 0.22} r={r * 0.14 * eyeOpenness} color={palette.eyes} />
      {/* Nose */}
      <Circle cx={cx} cy={cy - s * 0.1} r={r * 0.08} color={palette.accent} />
    </Group>
  );
};

// ── Bird SVG ──────────────────────────────────────────────
const BirdSvg = ({ cx, cy, s, palette, eyeOpenness, moodState }: any) => {
  const r = s * 0.26;
  return (
    <Group>
      {/* Body (oval) */}
      <Circle cx={cx} cy={cy + s * 0.1} r={r * 1.1} color={palette.body} />
      {/* Head */}
      <Circle cx={cx} cy={cy - s * 0.12} r={r * 0.72} color={palette.body} />
      {/* Wing hints */}
      <Circle cx={cx - r * 0.9} cy={cy + s * 0.05} r={r * 0.55} color={palette.accent} />
      <Circle cx={cx + r * 0.9} cy={cy + s * 0.05} r={r * 0.55} color={palette.accent} />
      {/* Beak */}
      <Circle cx={cx} cy={cy - s * 0.06} r={r * 0.18} color={COLORS.gold} />
      {/* Eye */}
      <Circle cx={cx - r * 0.25} cy={cy - s * 0.2} r={r * 0.14 * eyeOpenness} color={palette.eyes} />
      <Circle cx={cx + r * 0.25} cy={cy - s * 0.2} r={r * 0.14 * eyeOpenness} color={palette.eyes} />
      {/* Crest (happy = raised) */}
      <Circle
        cx={cx}
        cy={cy - s * 0.32 - (moodState === 'happy' ? r * 0.1 : 0)}
        r={r * 0.2}
        color={palette.accent}
      />
    </Group>
  );
};

// ── Bunny SVG ─────────────────────────────────────────────
const BunnySvg = ({ cx, cy, s, palette, eyeOpenness, moodState }: any) => {
  const r = s * 0.28;
  return (
    <Group>
      {/* Body */}
      <Circle cx={cx} cy={cy + s * 0.1} r={r} color={palette.body} />
      {/* Head */}
      <Circle cx={cx} cy={cy - s * 0.14} r={r * 0.7} color={palette.body} />
      {/* Long ears */}
      <Circle cx={cx - r * 0.45} cy={cy - s * 0.42} r={r * 0.22} color={palette.body} />
      <Circle cx={cx + r * 0.45} cy={cy - s * 0.42} r={r * 0.22} color={palette.body} />
      <Circle cx={cx - r * 0.45} cy={cy - s * 0.42} r={r * 0.12} color={palette.accent} />
      <Circle cx={cx + r * 0.45} cy={cy - s * 0.42} r={r * 0.12} color={palette.accent} />
      {/* Eyes */}
      <Circle cx={cx - r * 0.3} cy={cy - s * 0.22} r={r * 0.13 * eyeOpenness} color={palette.eyes} />
      <Circle cx={cx + r * 0.3} cy={cy - s * 0.22} r={r * 0.13 * eyeOpenness} color={palette.eyes} />
      {/* Nose */}
      <Circle cx={cx} cy={cy - s * 0.1} r={r * 0.09} color={palette.accent} />
      {/* Fluffy tail */}
      <Circle cx={cx + r * 0.85} cy={cy + s * 0.15} r={r * 0.22} color={COLORS.cream} />
    </Group>
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
```

---

### STEP 4 — CREATE stores/petStore.ts

Create `stores/petStore.ts` following the existing Zustand store pattern in the project.

```typescript
// stores/petStore.ts
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import {
  PetMoodState,
  PetType,
  computePetMood,
  getTimeOfDay,
  minutesSince,
} from '@/lib/petMoodEngine';

interface CompanionPet {
  id: string;
  careRelationshipId: string;
  petType: PetType;
  petName: string;
  colorPrimary: string;
  colorSecondary: string | null;
  caregiverVoiceUrl: string | null;
}

interface PetInteractionSummary {
  interactionCountToday: number;
  lastInteractionAt: string | null;
  weeklyTrend: number[]; // 7 day interaction counts, oldest first
}

interface PetStore {
  pet: CompanionPet | null;
  moodState: PetMoodState;
  interactionSummary: PetInteractionSummary | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchPet: (careRelationshipId: string) => Promise<void>;
  logInteraction: (interactionType: string, moodAtInteraction?: number) => Promise<void>;
  refreshMood: (activitiesCompletedToday: number, patientMoodScore: number | null) => void;
  fetchInteractionSummary: () => Promise<void>;
  reset: () => void;
}

export const usePetStore = create<PetStore>((set, get) => ({
  pet: null,
  moodState: 'calm',
  interactionSummary: null,
  isLoading: false,
  error: null,

  fetchPet: async (careRelationshipId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('companion_pets')
        .select('*')
        .eq('care_relationship_id', careRelationshipId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found (no pet yet)

      set({
        pet: data ? {
          id: data.id,
          careRelationshipId: data.care_relationship_id,
          petType: data.pet_type as PetType,
          petName: data.pet_name,
          colorPrimary: data.color_primary,
          colorSecondary: data.color_secondary,
          caregiverVoiceUrl: data.caregiver_voice_url,
        } : null,
        isLoading: false,
      });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  logInteraction: async (interactionType: string, moodAtInteraction?: number) => {
    const { pet } = get();
    if (!pet) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      await supabase.from('pet_interactions').insert({
        pet_id: pet.id,
        patient_id: user.id,
        interaction_type: interactionType,
        mood_at_interaction: moodAtInteraction ?? null,
      });

      // Refresh summary after logging
      get().fetchInteractionSummary();
    } catch (e) {
      console.warn('[PetStore] Failed to log interaction:', e);
    }
  },

  refreshMood: (activitiesCompletedToday: number, patientMoodScore: number | null) => {
    const { interactionSummary } = get();
    const result = computePetMood({
      timeOfDay: getTimeOfDay(),
      activitiesCompletedToday,
      lastInteractionMinutesAgo: minutesSince(interactionSummary?.lastInteractionAt),
      patientMoodScore,
    });
    set({ moodState: result.state });
  },

  fetchInteractionSummary: async () => {
    const { pet } = get();
    if (!pet) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Today's count
      const { count: todayCount } = await supabase
        .from('pet_interactions')
        .select('*', { count: 'exact', head: true })
        .eq('pet_id', pet.id)
        .gte('created_at', today.toISOString());

      // Last interaction
      const { data: lastData } = await supabase
        .from('pet_interactions')
        .select('created_at')
        .eq('pet_id', pet.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      set({
        interactionSummary: {
          interactionCountToday: todayCount ?? 0,
          lastInteractionAt: lastData?.created_at ?? null,
          weeklyTrend: [], // populated separately if needed
        },
      });
    } catch (e) {
      console.warn('[PetStore] Failed to fetch summary:', e);
    }
  },

  reset: () => set({
    pet: null,
    moodState: 'calm',
    interactionSummary: null,
    isLoading: false,
    error: null,
  }),
}));
```

---

### STEP 5 — INTEGRATE COMPANION PET INTO PATIENT HOME SCREEN

Find the Patient Home screen. It is likely at one of these paths:
- `app/(patient)/home.tsx`
- `app/(patient)/index.tsx`
- `screens/patient/HomeScreen.tsx`

Search for the daily queue card — it renders mood check-in and activity cards.

**Add these imports at the top of the home screen file:**
```typescript
import { CompanionPet } from '@/components/CompanionPet';
import { usePetStore } from '@/stores/petStore';
import { useActivityStore } from '@/stores/activity'; // already exists
import { useMoodStore } from '@/stores/mood';          // already exists
```

**Inside the component, add pet store hooks:**
```typescript
const { pet, moodState, fetchPet, refreshMood, fetchInteractionSummary } = usePetStore();
const activitiesCompleted = useActivityStore(s => s.completedTodayCount ?? 0);
const patientMoodScore = useMoodStore(s => s.todaysMoodScore ?? null);
```

**Add a useEffect to load the pet and refresh mood on mount:**
```typescript
useEffect(() => {
  if (careRelationshipId) {
    fetchPet(careRelationshipId);
    fetchInteractionSummary();
  }
}, [careRelationshipId]);

useEffect(() => {
  refreshMood(activitiesCompleted, patientMoodScore);
}, [activitiesCompleted, patientMoodScore]);
```

**Add the CompanionPet component to the JSX** — place it in the top-right area of the daily queue card. The exact position depends on the existing layout, but it should be:
- Visible on the home screen without scrolling
- In the upper-right quadrant of the main card or header area
- Size: 100-120pt

```tsx
{pet && (
  <CompanionPet
    petId={pet.id}
    petType={pet.petType}
    petName={pet.petName}
    colorPrimary={pet.colorPrimary}
    moodState={moodState}
    patientId={userId}
    size={110}
    onInteraction={(type) => {
      // Optional: trigger a subtle home screen reaction
      console.log('[Home] Pet interaction:', type);
    }}
  />
)}
```

**Morning greeting:** Add this useEffect to trigger the morning greeting animation on first app open of the day:
```typescript
useEffect(() => {
  const lastOpened = await AsyncStorage.getItem('lastAppOpen');
  const today = new Date().toDateString();
  if (lastOpened !== today && pet) {
    // Log greeting interaction
    usePetStore.getState().logInteraction('greet', patientMoodScore ?? undefined);
    await AsyncStorage.setItem('lastAppOpen', today);
  }
}, [pet]);
```

---

### STEP 6 — ADD COMPANION PET TO EXISTING FEATURE TOGGLES

The `feature_toggles` table already exists with 24 boolean flags per care relationship.
Add `companion_pet_enabled` as a new toggle.

```sql
-- Add companion_pet_enabled to feature_toggles if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'feature_toggles'
    AND column_name = 'companion_pet_enabled'
  ) THEN
    ALTER TABLE feature_toggles ADD COLUMN companion_pet_enabled BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;
```

In the home screen, wrap the CompanionPet render in a feature toggle check:
```typescript
const companionPetEnabled = useSettingsStore(s => s.featureToggles?.companion_pet_enabled ?? true);

// In JSX:
{pet && companionPetEnabled && (
  <CompanionPet ... />
)}
```

---

### STEP 7 — SEED A DEFAULT PET FOR TEST ACCOUNTS

The test accounts (testpatient@mindbridge.app and testcaregiver@mindbridge.app) need a companion pet seeded so it's visible immediately during testing.

```sql
-- Seed a companion pet for the test care relationship
-- First find the care_relationship_id for the test patient
DO $$
DECLARE
  v_care_rel_id UUID;
  v_patient_id UUID;
BEGIN
  -- Get patient profile ID
  SELECT id INTO v_patient_id
  FROM profiles
  WHERE email = 'testpatient@mindbridge.app'
  LIMIT 1;

  -- Get care relationship
  IF v_patient_id IS NOT NULL THEN
    SELECT id INTO v_care_rel_id
    FROM care_relationships
    WHERE patient_id = v_patient_id
    LIMIT 1;

    -- Insert default pet if not exists
    IF v_care_rel_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM companion_pets WHERE care_relationship_id = v_care_rel_id
    ) THEN
      INSERT INTO companion_pets (care_relationship_id, pet_type, pet_name, color_primary)
      VALUES (v_care_rel_id, 'dog', 'Biscuit', 'golden');

      RAISE NOTICE 'Seeded companion pet for test care relationship %', v_care_rel_id;
    END IF;
  END IF;
END $$;
```

---

### STEP 8 — VERIFY BUILD COMPILES

Run TypeScript check to confirm no type errors:
```bash
cd C:\Users\jheth\mindbridge-app
npx tsc --noEmit
```

If there are type errors:
- Do NOT run npm install
- Fix type errors by adjusting types within the new files only
- Do NOT change existing files' types — only fix imports and interface compatibility

---

### STEP 9 — COMMIT TO GITHUB

Stage and commit all new and modified files:

```bash
cd C:\Users\jheth\mindbridge-app
git add lib/petMoodEngine.ts
git add components/CompanionPet.tsx
git add stores/petStore.ts
git add app/(patient)/home.tsx   # or whatever the home screen path is
git commit -m "feat: Add Companion Pet Phase 1

- Create companion_pets and pet_interactions Supabase tables
- Add RLS policies for patient view + caregiver management
- Implement petMoodEngine.ts (deterministic, 5 mood states, no API calls)
- Build CompanionPet component (Skia SVG, Reanimated 3, 4 pet types)
- Create petStore.ts (Zustand, interaction logging, mood refresh)
- Integrate CompanionPet into Patient Home screen
- Add companion_pet_enabled feature toggle
- Seed Biscuit (golden dog) for test accounts"

git push origin master
```

---

### STEP 10 — FINAL VERIFICATION CHECKLIST

After commit and push, verify each item:

1. [ ] Both Supabase tables exist: `companion_pets`, `pet_interactions`
2. [ ] RLS enabled on both tables with correct policies
3. [ ] `lib/petMoodEngine.ts` created and TypeScript compiles
4. [ ] `components/CompanionPet.tsx` created with all 4 pet types
5. [ ] `stores/petStore.ts` created following existing Zustand patterns
6. [ ] CompanionPet visible on Patient Home screen for test account
7. [ ] Tapping pet logs to `pet_interactions` table (verify in Supabase dashboard)
8. [ ] Pet shows correct mood state based on time of day
9. [ ] `companion_pet_enabled` feature toggle column added to `feature_toggles`
10. [ ] All changes committed and pushed to `jhethics-bot/mindbridge-app` master

---

## PHASE 2 PREVIEW (Do not build now — Week 6)

Phase 2 tasks when ready:
- Update onboarding Step 9 to "Meet Your Companion" pet setup flow
- Add Companion Pet widget to caregiver dashboard
- Add pet settings to caregiver settings screen
- Implement caregiver voice message as pet (audio recording + playback)
- Add 24-hour inactivity push notification
- Include pet interaction data in doctor visit PDF report

---

## NOTES FOR CC

- The project uses `@/` path alias — use it consistently
- Existing stores follow Zustand create() pattern — match it exactly
- Reanimated 3 is already installed — no new packages needed
- Skia Canvas is already installed — no new packages needed
- expo-haptics is already installed — no new packages needed
- Do NOT use `withRepeat` with a positive count when you want infinite — use `-1`
- Always handle the case where `pet` is null — not every care relationship has a pet yet
- The test patient UUID is f8576d90, test caregiver is 327fd69d (from memory context)
- If any Supabase migration fails due to existing columns, wrap in IF NOT EXISTS
- All Supabase calls should be wrapped in try/catch — pet feature is non-critical

---

*End of Phase 1 spec. Execute all 10 steps in order. Do not stop between steps.*
*Generated from NeuBridge Companion Pet spec — March 21, 2026*
