/**
 * Word Find Game
 * Letter grid word search. Stage-adaptive grid and word count.
 * Tap letters to select. Auto-detects complete words. No timer.
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

const { width: SCREEN_W } = Dimensions.get('window');
const WORDS_POOL = ['LOVE', 'HOME', 'FAMILY', 'PEACE', 'HAPPY', 'SMILE', 'HEART', 'MUSIC', 'LIGHT', 'GRACE'];
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const STAGE_CFG: Record<string, { gridSize: number; wordCount: number; showHint: boolean }> = {
  early:  { gridSize: 8, wordCount: 6, showHint: false },
  middle: { gridSize: 6, wordCount: 4, showHint: true },
  late:   { gridSize: 5, wordCount: 2, showHint: true },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function placeWord(grid: string[][], word: string, size: number): boolean {
  const dirs = [[0, 1], [1, 0], [1, 1]]; // right, down, diagonal
  for (let attempt = 0; attempt < 50; attempt++) {
    const dir = dirs[Math.floor(Math.random() * dirs.length)];
    const r = Math.floor(Math.random() * size);
    const c = Math.floor(Math.random() * size);
    const endR = r + dir[0] * (word.length - 1);
    const endC = c + dir[1] * (word.length - 1);
    if (endR >= size || endC >= size) continue;

    let canPlace = true;
    for (let i = 0; i < word.length; i++) {
      const cell = grid[r + dir[0] * i][c + dir[1] * i];
      if (cell !== '' && cell !== word[i]) { canPlace = false; break; }
    }
    if (!canPlace) continue;

    for (let i = 0; i < word.length; i++) {
      grid[r + dir[0] * i][c + dir[1] * i] = word[i];
    }
    return true;
  }
  return false;
}

function generateGrid(size: number, words: string[]): { grid: string[][]; placedWords: string[] } {
  const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(''));
  const placedWords: string[] = [];
  for (const w of words) {
    if (placeWord(grid, w, size)) placedWords.push(w);
  }
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === '') grid[r][c] = ALPHA[Math.floor(Math.random() * 26)];
    }
  }
  return { grid, placedWords };
}

export default function WordFind() {
  const router = useRouter();
  const [stage, setStage] = useState<DiseaseStage>('middle');
  const [grid, setGrid] = useState<string[][]>([]);
  const [words, setWords] = useState<string[]>([]);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [celebration, setCelebration] = useState('');
  const [gameState, setGameState] = useState<'loading' | 'playing' | 'complete'>('loading');
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
    if (gameState === 'loading') return;
    const cfg = STAGE_CFG[stage] || STAGE_CFG.middle;
    const chosen = shuffle(WORDS_POOL).slice(0, cfg.wordCount);
    const { grid: g, placedWords } = generateGrid(cfg.gridSize, chosen);
    setGrid(g);
    setWords(placedWords);
    setFound(new Set());
    setSelected(new Set());
    startTime.current = Date.now();
  }, [stage, gameState]);

  function cellKey(r: number, c: number) { return `${r}-${c}`; }

  function handleCellPress(r: number, c: number) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const key = cellKey(r, c);
    const next = new Set(selected);
    if (next.has(key)) next.delete(key); else next.add(key);
    setSelected(next);

    // Check if selected letters form a word
    const letters = Array.from(next).map(k => {
      const [row, col] = k.split('-').map(Number);
      return grid[row][col];
    }).join('');

    for (const w of words) {
      if (!found.has(w) && letters.includes(w)) {
        const newFound = new Set(found);
        newFound.add(w);
        setFound(newFound);
        setCelebration(`Found "${w}"! 🌟`);
        setTimeout(() => setCelebration(''), 1500);
        setSelected(new Set());
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        if (newFound.size === words.length) {
          setTimeout(() => handleComplete(), 800);
        }
        return;
      }
    }
  }

  function showHint() {
    const unfound = words.find(w => !found.has(w));
    if (!unfound) return;
    // Find first letter position
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[0].length; c++) {
        if (grid[r][c] === unfound[0]) {
          setSelected(new Set([cellKey(r, c)]));
          return;
        }
      }
    }
  }

  async function handleComplete() {
    setGameState('complete');
    const dur = Math.round((Date.now() - startTime.current) / 1000);
    try {
      if (patientId.current) {
        await logActivitySession({
          patient_id: patientId.current,
          activity: 'word_find',
          stage_at_time: stage,
          difficulty_params: STAGE_CFG[stage],
          score: { words_found: found.size, total_words: words.length },
          duration_seconds: dur,
          completed: true,
        });
      }
    } catch {}
  }

  if (gameState === 'loading') {
    return <MBSafeArea showHome showSOS><View style={s.center}><Text style={s.loading}>Loading...</Text></View></MBSafeArea>;
  }

  if (gameState === 'complete') {
    return (
      <MBSafeArea showHome showSOS>
        <View style={s.center}>
          <Text style={{ fontSize: 80, marginBottom: 20 }}>🎉</Text>
          <Text style={s.doneTitle}>All Words Found!</Text>
          <Text style={s.doneBody}>You found every word. Wonderful job!</Text>
          <MBButton label="Play Again" variant="primary" size="large" onPress={() => setGameState('playing')} />
          <MBButton label="Go Home" variant="secondary" size="large" onPress={() => router.replace('/(patient)')} style={{ marginTop: 12 }} />
        </View>
      </MBSafeArea>
    );
  }

  const cfg = STAGE_CFG[stage] || STAGE_CFG.middle;
  const cellSize = Math.min((SCREEN_W - A11Y.screenPadding * 2 - 4 * (cfg.gridSize - 1)) / cfg.gridSize, 50);

  return (
    <MBSafeArea showHome showSOS title="Word Find">
      <View style={s.container}>
        {celebration ? (
          <View style={s.celebBanner}><Text style={s.celebText}>{celebration}</Text></View>
        ) : (
          <Text style={s.progress}>{found.size} of {words.length} words</Text>
        )}

        {/* Word list */}
        <View style={s.wordRow}>
          {words.map(w => (
            <View key={w} style={[s.wordChip, found.has(w) && s.wordFound]}>
              <Text style={[s.wordText, found.has(w) && s.wordTextFound]}>{w}</Text>
            </View>
          ))}
        </View>

        {/* Grid */}
        <View style={s.grid}>
          {grid.map((row, r) => (
            <View key={r} style={s.gridRow}>
              {row.map((letter, c) => {
                const key = cellKey(r, c);
                const isSel = selected.has(key);
                return (
                  <Pressable
                    key={key}
                    onPress={() => handleCellPress(r, c)}
                    accessibilityRole="button"
                    accessibilityLabel={letter}
                    style={[s.cell, { width: cellSize, height: cellSize }, isSel && s.cellSelected]}
                  >
                    <Text style={[s.cellText, { fontSize: cellSize * 0.5 }, isSel && s.cellTextSel]}>
                      {letter}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        {cfg.showHint && (
          <MBButton label="Show Hint" variant="secondary" size="compact" onPress={showHint}
            accessibilityHint="Highlight the first letter of an unfound word" style={{ marginTop: 16, alignSelf: 'center' }} />
        )}
      </View>
    </MBSafeArea>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 40 },
  loading: { fontSize: A11Y.fontSizeHeading, color: COLORS.navy },
  progress: { fontSize: A11Y.fontSizeBody, color: COLORS.gray, textAlign: 'center', marginBottom: 12 },
  celebBanner: { backgroundColor: COLORS.glow, borderRadius: 16, padding: 10, alignSelf: 'center', marginBottom: 12 },
  celebText: { fontSize: 20, fontWeight: '700', color: COLORS.navy },
  wordRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 16 },
  wordChip: { backgroundColor: COLORS.white, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: COLORS.lightGray },
  wordFound: { backgroundColor: COLORS.glow, borderColor: COLORS.gold },
  wordText: { fontSize: 16, fontWeight: '600', color: COLORS.navy },
  wordTextFound: { textDecorationLine: 'line-through', color: COLORS.gray },
  grid: { alignItems: 'center', gap: 4 },
  gridRow: { flexDirection: 'row', gap: 4 },
  cell: {
    borderRadius: 8, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.lightGray,
  },
  cellSelected: { backgroundColor: COLORS.teal, borderColor: COLORS.teal },
  cellText: { fontWeight: '700', color: COLORS.navy },
  cellTextSel: { color: COLORS.white },
  doneTitle: { fontSize: 36, fontWeight: '700', color: COLORS.navy, marginBottom: 12 },
  doneBody: { fontSize: A11Y.fontSizeBody, color: COLORS.gray, marginBottom: 32, textAlign: 'center' },
});
