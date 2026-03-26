/**
 * Memory Cards Game
 * Classic card-flipping pairs. Stage-adaptive grid sizes.
 * Zero negative feedback: mismatched cards gently flip back.
 */
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { MBSafeArea } from '../../../components/ui/MBSafeArea';
import { MBButton } from '../../../components/ui/MBButton';
import { COLORS } from '../../../constants/colors';
import { A11Y } from '../../../constants/accessibility';
import { supabase, logActivitySession, getCurrentProfile } from '../../../lib/supabase';
import type { DiseaseStage } from '../../../types';
import { PetCelebration } from '../../../components/PetCelebration';

const EMOJIS = ['🌸', '🌻', '🦋', '🐦', '🌈', '⭐', '🎵', '🏠', '❤️', '☀️', '🍎', '🐱'];
const { width: SCREEN_W } = Dimensions.get('window');

const GRID_CONFIG: Record<string, { cols: number; rows: number; pairs: number; peekMs: number }> = {
  early:  { cols: 4, rows: 3, pairs: 6, peekMs: 1200 },
  middle: { cols: 3, rows: 2, pairs: 3, peekMs: 2000 },
  late:   { cols: 2, rows: 2, pairs: 2, peekMs: 3000 },
};

const CELEBRATIONS = [
  'Wonderful! 🌟', 'Great match! 💛', 'You did it! ⭐',
  'Beautiful! 🌸', 'Amazing! 🎉', 'Perfect! ✨',
];

interface Card { id: number; emoji: string; matched: boolean; }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MemoryCards() {
  const router = useRouter();
  const [stage, setStage] = useState<DiseaseStage>('middle');
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [celebration, setCelebration] = useState('');
  const [gameState, setGameState] = useState<'loading' | 'playing' | 'complete'>('loading');
  const [moves, setMoves] = useState(0);
  const startTime = useRef(Date.now());
  const locked = useRef(false);
  const patientId = useRef('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const profile = await getCurrentProfile();
      if (profile) {
        setStage(profile.stage as DiseaseStage);
        patientId.current = profile.id;
      }
    } catch {}
    initGame('middle');
  }

  function initGame(s: DiseaseStage) {
    const cfg = GRID_CONFIG[s] || GRID_CONFIG.middle;
    const selected = shuffle(EMOJIS).slice(0, cfg.pairs);
    const deck = shuffle([...selected, ...selected].map((emoji, id) => ({
      id, emoji, matched: false,
    })));
    setCards(deck);
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setCelebration('');
    startTime.current = Date.now();
    setGameState('playing');
  }

  useEffect(() => {
    if (stage) initGame(stage);
  }, [stage]);

  function handleFlip(idx: number) {
    if (locked.current || flipped.includes(idx) || matched.has(idx)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const next = [...flipped, idx];
    setFlipped(next);

    if (next.length === 2) {
      locked.current = true;
      setMoves(m => m + 1);
      const [a, b] = next;

      if (cards[a].emoji === cards[b].emoji) {
        // Match!
        const newMatched = new Set(matched);
        newMatched.add(a);
        newMatched.add(b);
        setMatched(newMatched);
        setCelebration(CELEBRATIONS[Math.floor(Math.random() * CELEBRATIONS.length)]);
        setTimeout(() => setCelebration(''), 1500);
        setFlipped([]);
        locked.current = false;

        // Check win
        if (newMatched.size === cards.length) {
          setTimeout(() => handleComplete(), 800);
        }
      } else {
        // No match — gently flip back
        const cfg = GRID_CONFIG[stage] || GRID_CONFIG.middle;
        setTimeout(() => {
          setFlipped([]);
          locked.current = false;
        }, cfg.peekMs);
      }
    }
  }

  async function handleComplete() {
    setGameState('complete');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const duration = Math.round((Date.now() - startTime.current) / 1000);
    try {
      if (patientId.current) {
        await logActivitySession({
          patient_id: patientId.current,
          activity: 'memory_cards',
          stage_at_time: stage,
          difficulty_params: GRID_CONFIG[stage],
          score: { moves, pairs_found: cards.length / 2 },
          duration_seconds: duration,
          completed: true,
        });
      }
    } catch {}
  }

  if (gameState === 'loading') {
    return (
      <MBSafeArea showHome showSOS>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </MBSafeArea>
    );
  }

  if (gameState === 'complete') {
    return (
      <MBSafeArea showHome showSOS>
        <View style={styles.center}>
          <Text style={styles.completeEmoji}>🌟</Text>
          <PetCelebration patientId={patientId.current} />
          <Text style={styles.completeTitle}>All Matched!</Text>
          <Text style={styles.completeBody}>You found every pair. Wonderful!</Text>
          <MBButton
            label="Play Again"
            variant="primary"
            size="large"
            onPress={() => initGame(stage)}
            accessibilityHint="Start a new game"
          />
          <MBButton
            label="Go Home"
            variant="secondary"
            size="large"
            onPress={() => router.replace('/(patient)')}
            accessibilityHint="Return to home screen"
            style={{ marginTop: 12 }}
          />
        </View>
      </MBSafeArea>
    );
  }

  const cfg = GRID_CONFIG[stage] || GRID_CONFIG.middle;
  const gap = 10;
  const cardW = (SCREEN_W - A11Y.screenPadding * 2 - gap * (cfg.cols - 1)) / cfg.cols;
  const cardH = cardW * 1.2;

  return (
    <MBSafeArea showHome showSOS title="Memory Cards">
      <View style={styles.container}>
        {celebration ? (
          <View style={styles.celebrationBanner}>
            <Text style={styles.celebrationText}>{celebration}</Text>
          </View>
        ) : (
          <Text style={styles.progressText}>
            {matched.size / 2} of {cards.length / 2} pairs found
          </Text>
        )}

        <View style={[styles.grid, { gap }]}>
          {cards.map((card, idx) => {
            const isFlipped = flipped.includes(idx) || matched.has(idx);
            const isMatched = matched.has(idx);
            return (
              <Pressable
                key={idx}
                onPress={() => handleFlip(idx)}
                accessibilityRole="button"
                accessibilityLabel={isFlipped ? card.emoji : 'Hidden card'}
                style={[
                  styles.card,
                  { width: cardW, height: cardH },
                  isFlipped && styles.cardFlipped,
                  isMatched && styles.cardMatched,
                ]}
              >
                <Text style={[styles.cardEmoji, { fontSize: cardW * 0.45 }]}>
                  {isFlipped ? card.emoji : '?'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </MBSafeArea>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 40 },
  loadingText: { fontSize: A11Y.fontSizeHeading, color: COLORS.navy },
  progressText: { fontSize: A11Y.fontSizeBody, color: COLORS.gray, textAlign: 'center', marginBottom: 16 },
  celebrationBanner: {
    backgroundColor: COLORS.glow, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 20,
    alignSelf: 'center', marginBottom: 16,
  },
  celebrationText: { fontSize: 22, fontWeight: '700', color: COLORS.navy, textAlign: 'center' },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
  },
  card: {
    borderRadius: 16, backgroundColor: COLORS.teal, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3,
  },
  cardFlipped: { backgroundColor: COLORS.white },
  cardMatched: { backgroundColor: '#FFF8E1', borderWidth: 2, borderColor: COLORS.gold },
  cardEmoji: { color: COLORS.white },
  completeEmoji: { fontSize: 80, marginBottom: 20 },
  completeTitle: { fontSize: 36, fontWeight: '700', color: COLORS.navy, marginBottom: 12 },
  completeBody: { fontSize: A11Y.fontSizeBody, color: COLORS.gray, marginBottom: 32, textAlign: 'center' },
});
