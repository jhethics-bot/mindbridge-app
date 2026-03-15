/**
 * Sorting Game
 * Show items one at a time, tap the correct category button.
 * Wrong tap: gentle bounce + correct category glows. No red, no X.
 */
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { MBSafeArea } from '../../../components/ui/MBSafeArea';
import { MBButton } from '../../../components/ui/MBButton';
import { COLORS } from '../../../constants/colors';
import { A11Y } from '../../../constants/accessibility';
import { logActivitySession, getCurrentProfile } from '../../../lib/supabase';
import type { DiseaseStage } from '../../../types';

interface SortItem { name: string; emoji: string; category: string; }

const SORT_SETS: Record<string, { categories: string[]; items: SortItem[] }> = {
  early: {
    categories: ['Fruits', 'Animals', 'Flowers'],
    items: [
      { name: 'Apple', emoji: '🍎', category: 'Fruits' },
      { name: 'Dog', emoji: '🐕', category: 'Animals' },
      { name: 'Rose', emoji: '🌹', category: 'Flowers' },
      { name: 'Banana', emoji: '🍌', category: 'Fruits' },
      { name: 'Cat', emoji: '🐱', category: 'Animals' },
      { name: 'Tulip', emoji: '🌷', category: 'Flowers' },
      { name: 'Orange', emoji: '🍊', category: 'Fruits' },
      { name: 'Bird', emoji: '🐦', category: 'Animals' },
      { name: 'Daisy', emoji: '🌼', category: 'Flowers' },
    ],
  },
  middle: {
    categories: ['Hot', 'Cold'],
    items: [
      { name: 'Sun', emoji: '☀️', category: 'Hot' },
      { name: 'Snow', emoji: '❄️', category: 'Cold' },
      { name: 'Fire', emoji: '🔥', category: 'Hot' },
      { name: 'Ice Cream', emoji: '🍦', category: 'Cold' },
      { name: 'Coffee', emoji: '☕', category: 'Hot' },
      { name: 'Snowman', emoji: '⛄', category: 'Cold' },
    ],
  },
  late: {
    categories: ['Inside', 'Outside'],
    items: [
      { name: 'Bed', emoji: '🛏️', category: 'Inside' },
      { name: 'Tree', emoji: '🌳', category: 'Outside' },
      { name: 'Chair', emoji: '🪑', category: 'Inside' },
      { name: 'Sun', emoji: '☀️', category: 'Outside' },
    ],
  },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function SortingGame() {
  const router = useRouter();
  const [stage, setStage] = useState<DiseaseStage>('middle');
  const [items, setItems] = useState<SortItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [sorted, setSorted] = useState(0);
  const [hintCat, setHintCat] = useState<string | null>(null);
  const [celebration, setCelebration] = useState('');
  const [gameState, setGameState] = useState<'loading' | 'playing' | 'complete'>('loading');
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const startTime = useRef(Date.now());
  const patientId = useRef('');

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    try {
      const p = await getCurrentProfile();
      if (p) { setStage(p.stage as DiseaseStage); patientId.current = p.id; }
    } catch {}
    setGameState('playing');
  }

  useEffect(() => {
    if (gameState !== 'playing') return;
    const set = SORT_SETS[stage] || SORT_SETS.middle;
    setCategories(set.categories);
    setItems(shuffle(set.items));
    setCurrentIdx(0);
    setSorted(0);
    setHintCat(null);
    startTime.current = Date.now();
  }, [stage, gameState]);

  function handleCategoryPress(cat: string) {
    if (currentIdx >= items.length) return;
    const item = items[currentIdx];

    if (cat === item.category) {
      // Correct!
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCelebration(['Great! 🌟', 'Perfect! ✨', 'Nice one! 💛'][Math.floor(Math.random() * 3)]);
      setTimeout(() => setCelebration(''), 1200);
      setHintCat(null);
      setSorted(s => s + 1);

      if (currentIdx + 1 >= items.length) {
        setTimeout(() => handleComplete(), 800);
      } else {
        setCurrentIdx(i => i + 1);
      }
    } else {
      // Wrong — gentle bounce, show hint
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setHintCat(item.category);
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: 1.08, duration: 150, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }

  async function handleComplete() {
    setGameState('complete');
    const dur = Math.round((Date.now() - startTime.current) / 1000);
    try {
      if (patientId.current) {
        await logActivitySession({
          patient_id: patientId.current,
          activity: 'sorting',
          stage_at_time: stage,
          difficulty_params: { categories: categories.length, items: items.length },
          score: { sorted: items.length, total: items.length },
          duration_seconds: dur,
          completed: true,
        });
      }
    } catch {}
  }

  if (gameState === 'loading') {
    return <MBSafeArea showHome showSOS><View style={st.center}><Text style={st.loading}>Loading...</Text></View></MBSafeArea>;
  }

  if (gameState === 'complete') {
    return (
      <MBSafeArea showHome showSOS>
        <View style={st.center}>
          <Text style={{ fontSize: 80, marginBottom: 20 }}>🎉</Text>
          <Text style={st.doneTitle}>All Sorted!</Text>
          <Text style={st.doneBody}>You sorted everything perfectly!</Text>
          <MBButton label="Play Again" variant="primary" size="large" onPress={() => setGameState('playing')} />
          <MBButton label="Go Home" variant="secondary" size="large" onPress={() => router.replace('/(patient)')} style={{ marginTop: 12 }} />
        </View>
      </MBSafeArea>
    );
  }

  const item = items[currentIdx];
  if (!item) return null;

  return (
    <MBSafeArea showHome showSOS title="Sorting">
      <View style={st.container}>
        <Text style={st.progress}>{sorted} of {items.length} sorted</Text>

        {celebration ? (
          <View style={st.celebBanner}><Text style={st.celebText}>{celebration}</Text></View>
        ) : null}

        {/* Current item */}
        <Animated.View style={[st.itemCard, { transform: [{ scale: bounceAnim }] }]}>
          <Text style={st.itemEmoji}>{item.emoji}</Text>
          <Text style={st.itemName}>{item.name}</Text>
        </Animated.View>

        <Text style={st.prompt}>Where does this belong?</Text>

        {/* Category buttons */}
        <View style={st.catGrid}>
          {categories.map(cat => (
            <Pressable
              key={cat}
              onPress={() => handleCategoryPress(cat)}
              accessibilityRole="button"
              accessibilityLabel={`Sort into ${cat}`}
              style={({ pressed }) => [
                st.catButton,
                hintCat === cat && st.catHint,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={[st.catText, hintCat === cat && st.catTextHint]}>{cat}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </MBSafeArea>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 40 },
  loading: { fontSize: A11Y.fontSizeHeading, color: COLORS.navy },
  progress: { fontSize: A11Y.fontSizeBody, color: COLORS.gray, marginBottom: 12 },
  celebBanner: { backgroundColor: COLORS.glow, borderRadius: 16, padding: 10, marginBottom: 8 },
  celebText: { fontSize: 20, fontWeight: '700', color: COLORS.navy },
  itemCard: {
    width: 180, height: 180, borderRadius: 24, backgroundColor: COLORS.white,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
  },
  itemEmoji: { fontSize: 64, marginBottom: 8 },
  itemName: { fontSize: 24, fontWeight: '700', color: COLORS.navy },
  prompt: { fontSize: A11Y.fontSizeBody, color: COLORS.gray, marginBottom: 20 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  catButton: {
    minWidth: 120, minHeight: A11Y.minTouchTarget, paddingHorizontal: 24, paddingVertical: 16,
    borderRadius: 16, backgroundColor: COLORS.white, borderWidth: 2, borderColor: COLORS.lightGray,
    justifyContent: 'center', alignItems: 'center',
  },
  catHint: { borderColor: COLORS.success, backgroundColor: '#F0FFF4' },
  catText: { fontSize: 20, fontWeight: '600', color: COLORS.navy },
  catTextHint: { color: COLORS.success },
  doneTitle: { fontSize: 36, fontWeight: '700', color: COLORS.navy, marginBottom: 12 },
  doneBody: { fontSize: A11Y.fontSizeBody, color: COLORS.gray, marginBottom: 32, textAlign: 'center' },
});
