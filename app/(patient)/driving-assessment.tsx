/**
 * Driving Safety Assessment — Enhanced 4-Section Version
 *
 * Section 1: Reaction Time (tap green circles)
 * Section 2: Visual Scanning (find specific shapes)
 * Section 3: Sequence Memory (remember arrow order)
 * Section 4: Traffic Sign Recognition
 *
 * Results saved to driving_assessments table with traffic light rating.
 * Not a medical evaluation — for caregiver/physician discussion only.
 */
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { MBSafeArea } from '../../components/ui/MBSafeArea';
import { MBButton } from '../../components/ui/MBButton';
import { MBHeader } from '../../components/ui/MBHeader';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import { supabase, getCurrentProfile } from '../../lib/supabase';

type Phase = 'intro' | 'reaction' | 'scanning' | 'sequence' | 'signs' | 'results';

// ── Traffic signs ──
const SIGNS = [
  { shape: '🛑', name: 'Stop Sign', correct: 'Stop completely', options: ['Stop completely', 'Slow down', 'Speed up', 'Turn right'] },
  { shape: '⚠️', name: 'Yield', correct: 'Let others go first', options: ['Stop completely', 'Let others go first', 'Speed up', 'Honk'] },
  { shape: '🚸', name: 'School Zone', correct: 'Slow down for children', options: ['Slow down for children', 'Speed up', 'Stop', 'Turn around'] },
  { shape: '🚫', name: 'Do Not Enter', correct: 'Do not go this way', options: ['Go straight', 'Do not go this way', 'Slow down', 'Turn left'] },
  { shape: '⛽', name: 'Gas Station', correct: 'Gas station ahead', options: ['Hospital ahead', 'Gas station ahead', 'Restaurant ahead', 'Stop'] },
];

// ── Arrow directions ──
const ARROWS = ['⬆️', '⬇️', '⬅️', '➡️'];

// ── Shape grid for scanning ──
interface ShapeItem { id: number; shape: string; color: string; isTarget: boolean }

function generateScanGrid(targetShape: string, targetColor: string): ShapeItem[] {
  const shapes = ['●', '■', '▲'];
  const colors = ['#E76F51', '#2A9D8F', '#E9C46A', '#6366F1'];
  const items: ShapeItem[] = [];
  // 3-4 targets
  const targetCount = 3 + Math.floor(Math.random() * 2);
  for (let i = 0; i < targetCount; i++) {
    items.push({ id: i, shape: targetShape, color: targetColor, isTarget: true });
  }
  // Fill rest with non-targets
  for (let i = targetCount; i < 12; i++) {
    let s = shapes[Math.floor(Math.random() * shapes.length)];
    let c = colors[Math.floor(Math.random() * colors.length)];
    // Avoid duplicating the target combo
    if (s === targetShape && c === targetColor) {
      c = colors[(colors.indexOf(c) + 1) % colors.length];
    }
    items.push({ id: i, shape: s, color: c, isTarget: false });
  }
  // Shuffle
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items.map((item, idx) => ({ ...item, id: idx }));
}

export default function DrivingAssessmentScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('intro');
  const [patientId, setPatientId] = useState('');

  // Reaction time state
  const [reactionRound, setReactionRound] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [showGreen, setShowGreen] = useState(false);
  const reactionStart = useRef(0);
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scanning state
  const [scanRound, setScanRound] = useState(0);
  const [scanGrid, setScanGrid] = useState<ShapeItem[]>([]);
  const [scanTapped, setScanTapped] = useState<Set<number>>(new Set());
  const [scanTargetCount, setScanTargetCount] = useState(0);
  const [scanCorrect, setScanCorrect] = useState(0);
  const [scanErrors, setScanErrors] = useState(0);
  const scanInstruction = useRef('');

  // Sequence state
  const [seqRound, setSeqRound] = useState(0);
  const [seqLength, setSeqLength] = useState(3);
  const [sequence, setSequence] = useState<string[]>([]);
  const [playerSequence, setPlayerSequence] = useState<string[]>([]);
  const [showingSequence, setShowingSequence] = useState(false);
  const [seqCorrect, setSeqCorrect] = useState(0);
  const [currentShowIdx, setCurrentShowIdx] = useState(-1);

  // Signs state
  const [signIdx, setSignIdx] = useState(0);
  const [signCorrect, setSignCorrect] = useState(0);

  // Results
  const [scores, setScores] = useState({ reaction: 0, scanning: 0, sequence: 0, signs: 0, overall: 0 });

  useEffect(() => {
    (async () => {
      const p = await getCurrentProfile();
      if (p) setPatientId(p.id);
    })();
  }, []);

  // ── REACTION TIME ──
  const startReaction = () => {
    setShowGreen(false);
    const delay = 1000 + Math.random() * 4000;
    reactionTimer.current = setTimeout(() => {
      setShowGreen(true);
      reactionStart.current = Date.now();
    }, delay);
  };

  const handleReactionTap = () => {
    if (!showGreen) return; // Tapped too early
    const time = Date.now() - reactionStart.current;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newTimes = [...reactionTimes, time];
    setReactionTimes(newTimes);
    setShowGreen(false);

    if (reactionRound < 2) {
      setReactionRound(r => r + 1);
      setTimeout(startReaction, 500);
    } else {
      // Move to scanning
      setPhase('scanning');
      initScan();
    }
  };

  // ── VISUAL SCANNING ──
  const initScan = () => {
    const targets = [
      { shape: '●', color: '#E76F51', text: 'Tap all RED circles' },
      { shape: '■', color: '#2A9D8F', text: 'Tap all TEAL squares' },
      { shape: '▲', color: '#E9C46A', text: 'Tap all GOLD triangles' },
    ];
    const t = targets[scanRound] || targets[0];
    scanInstruction.current = t.text;
    const grid = generateScanGrid(t.shape, t.color);
    setScanGrid(grid);
    setScanTapped(new Set());
    setScanTargetCount(grid.filter(g => g.isTarget).length);
  };

  const handleScanTap = (item: ShapeItem) => {
    if (scanTapped.has(item.id)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newTapped = new Set(scanTapped);
    newTapped.add(item.id);
    setScanTapped(newTapped);

    if (item.isTarget) {
      setScanCorrect(c => c + 1);
      // Check if all targets found
      const foundCount = Array.from(newTapped).filter(id => scanGrid[id]?.isTarget).length;
      if (foundCount >= scanTargetCount) {
        if (scanRound < 2) {
          setScanRound(r => r + 1);
          setTimeout(() => initScan(), 500);
        } else {
          setPhase('sequence');
          startSequenceRound(3);
        }
      }
    } else {
      setScanErrors(e => e + 1);
    }
  };

  // ── SEQUENCE MEMORY ──
  const startSequenceRound = (len: number) => {
    setSeqLength(len);
    const seq: string[] = [];
    for (let i = 0; i < len; i++) {
      seq.push(ARROWS[Math.floor(Math.random() * ARROWS.length)]);
    }
    setSequence(seq);
    setPlayerSequence([]);
    setShowingSequence(true);
    setCurrentShowIdx(0);

    // Show sequence one at a time
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i < seq.length) {
        setCurrentShowIdx(i);
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setShowingSequence(false);
          setCurrentShowIdx(-1);
        }, 800);
      }
    }, 800);
  };

  const handleSequenceTap = (arrow: string) => {
    if (showingSequence) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newSeq = [...playerSequence, arrow];
    setPlayerSequence(newSeq);

    const idx = newSeq.length - 1;
    if (newSeq[idx] !== sequence[idx]) {
      // Wrong — move on
      finishSequenceRound(false);
      return;
    }

    if (newSeq.length === sequence.length) {
      // Correct sequence
      finishSequenceRound(true);
    }
  };

  const finishSequenceRound = (correct: boolean) => {
    if (correct) setSeqCorrect(c => c + 1);
    Haptics.notificationAsync(correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);

    if (seqRound < 2) {
      setSeqRound(r => r + 1);
      setTimeout(() => startSequenceRound(seqLength + 1), 800);
    } else {
      setPhase('signs');
    }
  };

  // ── SIGNS ──
  const handleSignAnswer = (answer: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (answer === SIGNS[signIdx].correct) {
      setSignCorrect(c => c + 1);
    }
    if (signIdx < SIGNS.length - 1) {
      setSignIdx(i => i + 1);
    } else {
      calculateResults();
    }
  };

  // ── RESULTS ──
  const calculateResults = () => {
    // Reaction: avg < 500ms = 100, < 800 = 75, < 1200 = 50, else 25
    const avgReaction = reactionTimes.length > 0
      ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
      : 2000;
    const reactionScore = avgReaction < 500 ? 100 : avgReaction < 800 ? 75 : avgReaction < 1200 ? 50 : 25;

    // Scanning: based on correct vs errors
    const totalScanAttempts = scanCorrect + scanErrors;
    const scanScore = totalScanAttempts > 0 ? Math.round((scanCorrect / (totalScanAttempts)) * 100) : 0;

    // Sequence: each correct = 33 points
    const sequenceScore = Math.round((seqCorrect / 3) * 100);

    // Signs: each correct = 20 points
    const signsScore = Math.round((signCorrect / SIGNS.length) * 100);

    const overall = Math.round((reactionScore + scanScore + sequenceScore + signsScore) / 4);

    const s = { reaction: reactionScore, scanning: scanScore, sequence: sequenceScore, signs: signsScore, overall };
    setScores(s);
    setPhase('results');

    // Save to Supabase
    if (patientId) {
      const level = overall >= 75 ? 'green' : overall >= 50 ? 'yellow' : 'red';
      supabase.from('driving_assessments').insert({
        patient_id: patientId,
        assessment_date: new Date().toISOString().split('T')[0],
        overall_score: overall,
        category_scores: { reaction: reactionScore, scanning: scanScore, sequence: sequenceScore, signs: signsScore },
        recommendation_level: level,
      });
    }
  };

  const ratingColor = scores.overall >= 75 ? COLORS.success : scores.overall >= 50 ? COLORS.gold : COLORS.coral;
  const ratingLabel = scores.overall >= 75 ? 'Safe indicators' : scores.overall >= 50 ? 'Some concerns' : 'Discuss with doctor';
  const ratingEmoji = scores.overall >= 75 ? '🟢' : scores.overall >= 50 ? '🟡' : '🔴';

  // ── INTRO ──
  if (phase === 'intro') {
    return (
      <MBSafeArea>
        <View style={st.center}>
          <Text style={st.introEmoji}>🚗</Text>
          <MBHeader title="Driving Safety Check" subtitle="4 quick cognitive tests" />
          <Text style={st.disclaimer}>
            This is not a medical evaluation. Always consult your healthcare provider about driving safety.
          </Text>
          <MBButton label="Start Assessment" variant="primary" size="large"
            onPress={() => { setPhase('reaction'); setTimeout(startReaction, 500); }} />
        </View>
      </MBSafeArea>
    );
  }

  // ── REACTION TIME ──
  if (phase === 'reaction') {
    return (
      <MBSafeArea title="Reaction Time">
        <View style={st.center}>
          <Text style={st.phaseTitle}>Tap when you see GREEN!</Text>
          <Text style={st.roundText}>Round {reactionRound + 1} of 3</Text>
          <Pressable
            onPress={handleReactionTap}
            style={[st.reactionCircle, { backgroundColor: showGreen ? COLORS.success : COLORS.lightGray }]}
            accessibilityLabel={showGreen ? 'Green circle - tap now!' : 'Wait for green'}
          >
            <Text style={{ fontSize: 32, color: COLORS.white }}>{showGreen ? 'TAP!' : '...'}</Text>
          </Pressable>
        </View>
      </MBSafeArea>
    );
  }

  // ── VISUAL SCANNING ──
  if (phase === 'scanning') {
    return (
      <MBSafeArea title="Visual Scanning">
        <View style={st.scanContainer}>
          <Text style={st.phaseTitle}>{scanInstruction.current}</Text>
          <Text style={st.roundText}>Round {scanRound + 1} of 3</Text>
          <View style={st.scanGrid}>
            {scanGrid.map(item => (
              <Pressable
                key={item.id}
                onPress={() => handleScanTap(item)}
                style={[
                  st.scanCell,
                  scanTapped.has(item.id) && (item.isTarget ? st.scanCorrectCell : st.scanWrongCell),
                ]}
              >
                <Text style={[st.scanShape, { color: item.color }]}>{item.shape}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </MBSafeArea>
    );
  }

  // ── SEQUENCE MEMORY ──
  if (phase === 'sequence') {
    return (
      <MBSafeArea title="Sequence Memory">
        <View style={st.center}>
          <Text style={st.phaseTitle}>
            {showingSequence ? 'Watch the sequence...' : 'Tap the arrows in order!'}
          </Text>
          <Text style={st.roundText}>Round {seqRound + 1} of 3 ({seqLength} arrows)</Text>

          {/* Sequence display */}
          <View style={st.seqDisplay}>
            {showingSequence ? (
              <Text style={st.seqArrow}>{sequence[currentShowIdx] || ''}</Text>
            ) : (
              <Text style={st.seqProgress}>
                {playerSequence.map(a => a).join(' ')} {playerSequence.length < sequence.length ? '?' : ''}
              </Text>
            )}
          </View>

          {/* Arrow buttons */}
          {!showingSequence && (
            <View style={st.arrowGrid}>
              {ARROWS.map(arrow => (
                <Pressable
                  key={arrow}
                  onPress={() => handleSequenceTap(arrow)}
                  style={({ pressed }) => [st.arrowBtn, pressed && { opacity: 0.7 }]}
                >
                  <Text style={st.arrowText}>{arrow}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </MBSafeArea>
    );
  }

  // ── SIGN RECOGNITION ──
  if (phase === 'signs') {
    const sign = SIGNS[signIdx];
    return (
      <MBSafeArea title="Sign Recognition">
        <View style={st.center}>
          <Text style={st.roundText}>Sign {signIdx + 1} of {SIGNS.length}</Text>
          <Text style={st.signEmoji}>{sign.shape}</Text>
          <Text style={st.phaseTitle}>What does this sign mean?</Text>
          <View style={st.optionsCol}>
            {sign.options.map(opt => (
              <MBButton
                key={opt}
                label={opt}
                variant="secondary"
                size="standard"
                onPress={() => handleSignAnswer(opt)}
                style={{ marginBottom: 10 }}
              />
            ))}
          </View>
        </View>
      </MBSafeArea>
    );
  }

  // ── RESULTS ──
  return (
    <MBSafeArea>
      <ScrollView contentContainerStyle={st.resultsScroll}>
        <MBHeader title="Results" icon="📊" />

        {/* Overall score */}
        <View style={[st.scoreCard, { borderColor: ratingColor }]}>
          <Text style={st.overallLabel}>Overall Score</Text>
          <Text style={[st.overallScore, { color: ratingColor }]}>{scores.overall}</Text>
          <Text style={st.ratingLine}>{ratingEmoji} {ratingLabel}</Text>
        </View>

        {/* Category scores */}
        <View style={st.catRow}>
          <ScoreBox label="Reaction" value={scores.reaction} />
          <ScoreBox label="Scanning" value={scores.scanning} />
          <ScoreBox label="Sequence" value={scores.sequence} />
          <ScoreBox label="Signs" value={scores.signs} />
        </View>

        <Text style={st.disclaimer}>
          This is not a medical evaluation. Always consult your healthcare provider about driving safety.
        </Text>

        <MBButton label="Go Home" variant="primary" size="large"
          onPress={() => router.replace('/(patient)')} />
      </ScrollView>
    </MBSafeArea>
  );
}

function ScoreBox({ label, value }: { label: string; value: number }) {
  const color = value >= 75 ? COLORS.success : value >= 50 ? COLORS.gold : COLORS.coral;
  return (
    <View style={st.scoreBox}>
      <Text style={[st.scoreBoxValue, { color }]}>{value}</Text>
      <Text style={st.scoreBoxLabel}>{label}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  introEmoji: { fontSize: 64, marginBottom: 8 },
  disclaimer: {
    fontSize: 13, color: COLORS.gray, textAlign: 'center', marginVertical: 16, lineHeight: 20, paddingHorizontal: 12,
  },
  phaseTitle: {
    fontSize: A11Y.fontSizeHeading, fontWeight: '700', color: COLORS.navy, textAlign: 'center', marginBottom: 12,
  },
  roundText: { fontSize: 16, color: COLORS.gray, marginBottom: 20 },

  // Reaction
  reactionCircle: {
    width: 160, height: 160, borderRadius: 80, alignItems: 'center', justifyContent: 'center',
    marginTop: 20,
  },

  // Scanning
  scanContainer: { flex: 1, alignItems: 'center', paddingTop: 16 },
  scanGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 16,
  },
  scanCell: {
    width: 72, height: 72, borderRadius: 12, backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.lightGray,
  },
  scanCorrectCell: { borderColor: COLORS.success, backgroundColor: COLORS.success + '20' },
  scanWrongCell: { borderColor: COLORS.coral, backgroundColor: COLORS.coral + '10' },
  scanShape: { fontSize: 32 },

  // Sequence
  seqDisplay: {
    width: 200, height: 100, borderRadius: 20, backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  seqArrow: { fontSize: 56 },
  seqProgress: { fontSize: 28 },
  arrowGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  arrowBtn: {
    width: A11Y.preferredTouchTarget, height: A11Y.preferredTouchTarget,
    borderRadius: 16, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  arrowText: { fontSize: 32 },

  // Signs
  signEmoji: { fontSize: 80, marginBottom: 16 },
  optionsCol: { width: '100%', marginTop: 12 },

  // Results
  resultsScroll: { padding: 24, paddingBottom: 40 },
  scoreCard: {
    backgroundColor: COLORS.white, borderRadius: 20, padding: 24, alignItems: 'center',
    borderWidth: 2, marginBottom: 20,
  },
  overallLabel: { fontSize: 14, color: COLORS.gray, textTransform: 'uppercase', fontWeight: '600' },
  overallScore: { fontSize: 56, fontWeight: '700' },
  ratingLine: { fontSize: 18, fontWeight: '600', marginTop: 4 },
  catRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  scoreBox: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: 12, padding: 12, alignItems: 'center',
  },
  scoreBoxValue: { fontSize: 24, fontWeight: '700' },
  scoreBoxLabel: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
});
