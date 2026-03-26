/**
 * Daily Living Guides — Patient Screen
 *
 * Step-by-step visual guides for daily activities.
 * Fetches from daily_living_guides table, with hardcoded fallback.
 * 100% tap-based, large text, companion pet celebration at end.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { MBSafeArea } from '../../components/ui/MBSafeArea';
import { MBHeader } from '../../components/ui/MBHeader';
import { MBButton } from '../../components/ui/MBButton';
import { PetCelebration } from '../../components/PetCelebration';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import { supabase, getCurrentProfile } from '../../lib/supabase';

interface GuideStep {
  number: number;
  instruction: string;
  emoji: string;
}

interface Guide {
  id: string;
  title: string;
  emoji: string;
  bgColor: string;
  steps: GuideStep[];
}

const FALLBACK_GUIDES: Guide[] = [
  {
    id: 'getting_dressed', title: 'Getting Dressed', emoji: '👕', bgColor: '#E8D5F5',
    steps: [
      { number: 1, instruction: 'Lay out your clothes on the bed.', emoji: '🛏️' },
      { number: 2, instruction: 'Put on your underwear first.', emoji: '👙' },
      { number: 3, instruction: 'Put on your shirt or blouse.', emoji: '👕' },
      { number: 4, instruction: 'Put on your pants or skirt.', emoji: '👖' },
      { number: 5, instruction: 'Put on your socks.', emoji: '🧦' },
      { number: 6, instruction: 'Put on your shoes.', emoji: '👟' },
    ],
  },
  {
    id: 'brushing_teeth', title: 'Brushing Teeth', emoji: '🪥', bgColor: '#E0F2FE',
    steps: [
      { number: 1, instruction: 'Pick up your toothbrush.', emoji: '🪥' },
      { number: 2, instruction: 'Put toothpaste on the brush.', emoji: '✨' },
      { number: 3, instruction: 'Brush the front teeth gently.', emoji: '😁' },
      { number: 4, instruction: 'Brush the top teeth.', emoji: '⬆️' },
      { number: 5, instruction: 'Brush the bottom teeth.', emoji: '⬇️' },
      { number: 6, instruction: 'Rinse your mouth with water.', emoji: '💧' },
      { number: 7, instruction: 'Rinse the toothbrush and put it back.', emoji: '✅' },
    ],
  },
  {
    id: 'simple_meal', title: 'Making a Simple Meal', emoji: '🍳', bgColor: '#FEF3C7',
    steps: [
      { number: 1, instruction: 'Wash your hands with soap and water.', emoji: '🧼' },
      { number: 2, instruction: 'Get a bowl and a spoon.', emoji: '🥣' },
      { number: 3, instruction: 'Open the cereal box.', emoji: '📦' },
      { number: 4, instruction: 'Pour cereal into the bowl.', emoji: '🥣' },
      { number: 5, instruction: 'Add milk from the fridge.', emoji: '🥛' },
      { number: 6, instruction: 'Sit at the table and enjoy!', emoji: '😋' },
    ],
  },
  {
    id: 'taking_meds', title: 'Taking Medications', emoji: '💊', bgColor: '#FCE4EC',
    steps: [
      { number: 1, instruction: 'Find your pill organizer.', emoji: '📦' },
      { number: 2, instruction: 'Check which day it is.', emoji: '📅' },
      { number: 3, instruction: 'Open the correct day.', emoji: '👆' },
      { number: 4, instruction: 'Get a glass of water.', emoji: '💧' },
      { number: 5, instruction: 'Take your pills one at a time.', emoji: '💊' },
      { number: 6, instruction: 'Drink water after each pill.', emoji: '🥤' },
    ],
  },
  {
    id: 'using_phone', title: 'Using the Phone', emoji: '📱', bgColor: '#E8F5E9',
    steps: [
      { number: 1, instruction: 'Pick up the phone.', emoji: '📱' },
      { number: 2, instruction: 'Tap the green phone button.', emoji: '📞' },
      { number: 3, instruction: 'Find the person you want to call.', emoji: '👤' },
      { number: 4, instruction: 'Tap their name.', emoji: '👆' },
      { number: 5, instruction: 'Wait for them to answer.', emoji: '⏳' },
      { number: 6, instruction: 'Say hello and talk.', emoji: '👋' },
    ],
  },
  {
    id: 'going_walk', title: 'Going for a Walk', emoji: '🚶', bgColor: '#F0F4EC',
    steps: [
      { number: 1, instruction: 'Put on comfortable shoes.', emoji: '👟' },
      { number: 2, instruction: 'Take your phone with you.', emoji: '📱' },
      { number: 3, instruction: 'Tell someone you are going out.', emoji: '🗣️' },
      { number: 4, instruction: 'Walk on the sidewalk.', emoji: '🚶' },
      { number: 5, instruction: 'Look both ways before crossing.', emoji: '👀' },
      { number: 6, instruction: 'Come back the same way.', emoji: '🏠' },
    ],
  },
  {
    id: 'preparing_bed', title: 'Preparing for Bed', emoji: '🛌', bgColor: '#EEF0F5',
    steps: [
      { number: 1, instruction: 'Put on your pajamas.', emoji: '👕' },
      { number: 2, instruction: 'Brush your teeth.', emoji: '🪥' },
      { number: 3, instruction: 'Use the bathroom.', emoji: '🚻' },
      { number: 4, instruction: 'Get into bed.', emoji: '🛏️' },
      { number: 5, instruction: 'Turn off the lights.', emoji: '💡' },
      { number: 6, instruction: 'Close your eyes and rest.', emoji: '😴' },
    ],
  },
  {
    id: 'washing_hands', title: 'Washing Hands', emoji: '🧼', bgColor: '#E0F7FA',
    steps: [
      { number: 1, instruction: 'Turn on the water.', emoji: '🚿' },
      { number: 2, instruction: 'Wet your hands.', emoji: '💧' },
      { number: 3, instruction: 'Put soap on your hands.', emoji: '🧼' },
      { number: 4, instruction: 'Rub your hands together for 20 seconds.', emoji: '👏' },
      { number: 5, instruction: 'Rinse off all the soap.', emoji: '💧' },
      { number: 6, instruction: 'Dry your hands with a towel.', emoji: '🧻' },
    ],
  },
];

type ScreenState = 'list' | 'guide';

export default function DailyGuidesScreen() {
  const router = useRouter();
  const [screenState, setScreenState] = useState<ScreenState>('list');
  const [guides, setGuides] = useState<Guide[]>(FALLBACK_GUIDES);
  const [activeGuide, setActiveGuide] = useState<Guide | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [patientId, setPatientId] = useState('');

  useEffect(() => {
    (async () => {
      const p = await getCurrentProfile();
      if (p) setPatientId(p.id);
      // Try to load from DB
      try {
        const { data } = await supabase
          .from('daily_living_guides')
          .select('*')
          .order('sort_order');
        if (data && data.length > 0) {
          const dbGuides = data.map((g: any) => ({
            id: g.id,
            title: g.title,
            emoji: g.emoji || '📋',
            bgColor: g.bg_color || '#F0F4F8',
            steps: (g.steps as GuideStep[]) || [],
          }));
          if (dbGuides.some((g: Guide) => g.steps.length > 0)) {
            setGuides(dbGuides);
          }
        }
      } catch {}
    })();
  }, []);

  const openGuide = (guide: Guide) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveGuide(guide);
    setCurrentStep(0);
    setCompleted(false);
    setScreenState('guide');
  };

  const nextStep = () => {
    if (!activeGuide) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep < activeGuide.steps.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCompleted(true);
    }
  };

  const backToList = () => {
    setScreenState('list');
    setActiveGuide(null);
  };

  // ── LIST VIEW ──
  if (screenState === 'list') {
    return (
      <MBSafeArea>
        <MBHeader title="Daily Guides" subtitle="Step-by-step help" icon="📋" />
        <ScrollView contentContainerStyle={st.list} showsVerticalScrollIndicator={false}>
          {guides.map(guide => (
            <Pressable
              key={guide.id}
              onPress={() => openGuide(guide)}
              accessibilityRole="button"
              accessibilityLabel={guide.title}
              style={({ pressed }) => [
                st.guideCard,
                { backgroundColor: guide.bgColor },
                pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
              ]}
            >
              <Text style={st.guideEmoji}>{guide.emoji}</Text>
              <Text style={st.guideTitle}>{guide.title}</Text>
              <Text style={st.guideStepCount}>{guide.steps.length} steps</Text>
            </Pressable>
          ))}
        </ScrollView>
      </MBSafeArea>
    );
  }

  // ── COMPLETED VIEW ──
  if (completed && activeGuide) {
    return (
      <MBSafeArea>
        <View style={st.completedContainer}>
          <Text style={st.completedEmoji}>🎉</Text>
          <PetCelebration patientId={patientId} />
          <Text style={st.completedTitle}>All Done!</Text>
          <Text style={st.completedBody}>
            You finished "{activeGuide.title}". Great job!
          </Text>
          <MBButton label="Back to Guides" variant="primary" size="large" onPress={backToList} />
        </View>
      </MBSafeArea>
    );
  }

  // ── STEP VIEW ──
  if (!activeGuide) return null;
  const step = activeGuide.steps[currentStep];

  return (
    <MBSafeArea title={activeGuide.title}>
      <View style={st.stepContainer}>
        <Text style={st.stepNumber}>Step {step.number}</Text>
        <Text style={st.stepEmoji}>{step.emoji}</Text>
        <Text style={st.stepInstruction}>{step.instruction}</Text>

        <Text style={st.stepProgress}>
          {currentStep + 1} of {activeGuide.steps.length}
        </Text>

        <MBButton
          label={currentStep < activeGuide.steps.length - 1 ? 'Next Step' : 'All Done!'}
          variant="primary"
          size="large"
          onPress={nextStep}
        />

        <MBButton
          label="Back to Guides"
          variant="ghost"
          size="compact"
          onPress={backToList}
          style={{ marginTop: 12 }}
        />
      </View>
    </MBSafeArea>
  );
}

const st = StyleSheet.create({
  list: { paddingBottom: 32, gap: 12 },
  guideCard: {
    borderRadius: 20, padding: 24, alignItems: 'center', minHeight: 100,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  guideEmoji: { fontSize: 40, marginBottom: 8 },
  guideTitle: { fontSize: A11Y.fontSizeBodyLarge, fontWeight: '700', color: COLORS.navy, textAlign: 'center' },
  guideStepCount: { fontSize: 14, color: COLORS.gray, marginTop: 4 },
  stepContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  stepNumber: { fontSize: 18, fontWeight: '600', color: COLORS.teal, marginBottom: 16 },
  stepEmoji: { fontSize: 64, marginBottom: 20 },
  stepInstruction: {
    fontSize: 22, fontWeight: '600', color: COLORS.navy, textAlign: 'center',
    lineHeight: 32, marginBottom: 32, paddingHorizontal: 12,
  },
  stepProgress: { fontSize: 16, color: COLORS.gray, marginBottom: 24 },
  completedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  completedEmoji: { fontSize: 64, marginBottom: 12 },
  completedTitle: { fontSize: 28, fontWeight: '700', color: COLORS.navy, marginBottom: 8 },
  completedBody: { fontSize: A11Y.fontSizeBody, color: COLORS.gray, textAlign: 'center', marginBottom: 32 },
});
