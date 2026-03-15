/**
 * Color-by-Number Game
 * Tap regions to fill with selected color. Every fill is "correct."
 * Late stage: regions auto-fill every 2 seconds.
 */
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { MBSafeArea } from '../../../components/ui/MBSafeArea';
import { MBButton } from '../../../components/ui/MBButton';
import { COLORS } from '../../../constants/colors';
import { A11Y } from '../../../constants/accessibility';
import { logActivitySession, getCurrentProfile } from '../../../lib/supabase';
import type { DiseaseStage } from '../../../types';

const { width: SCREEN_W } = Dimensions.get('window');

const PALETTE = [
  { name: 'Coral', color: '#E76F51' },
  { name: 'Gold', color: '#E9C46A' },
  { name: 'Teal', color: '#2A9D8F' },
  { name: 'Navy', color: '#264653' },
  { name: 'Orange', color: '#F4A261' },
  { name: 'Sky', color: '#89CFF0' },
  { name: 'Sage', color: '#A8C686' },
  { name: 'Plum', color: '#9B59B6' },
];

interface Region {
  id: number;
  label: string;
  assignedColor: number; // palette index
  filledColor: string | null;
  x: number; y: number; w: number; h: number;
  shape: 'rect' | 'circle';
}

// Simple flower template
function flowerTemplate(canvasW: number): Region[] {
  const cx = canvasW / 2;
  const cy = canvasW / 2;
  const pr = canvasW * 0.12; // petal radius offset
  const ps = canvasW * 0.13; // petal size
  const regions: Region[] = [];
  let id = 0;

  // Center
  regions.push({ id: id++, label: '1', assignedColor: 0, filledColor: null,
    x: cx - ps/2, y: cy - ps/2, w: ps, h: ps, shape: 'circle' });

  // Petals (6 around center)
  const angles = [0, 60, 120, 180, 240, 300];
  angles.forEach((deg, i) => {
    const rad = (deg * Math.PI) / 180;
    regions.push({
      id: id++, label: `${i + 2}`, assignedColor: (i % 4) + 1, filledColor: null,
      x: cx + Math.cos(rad) * pr * 1.8 - ps/2,
      y: cy + Math.sin(rad) * pr * 1.8 - ps/2,
      w: ps, h: ps, shape: 'circle',
    });
  });

  // Stem
  regions.push({ id: id++, label: `${id}`, assignedColor: 6, filledColor: null,
    x: cx - 8, y: cy + pr * 2, w: 16, h: canvasW * 0.25, shape: 'rect' });

  // Leaves
  regions.push({ id: id++, label: `${id}`, assignedColor: 6, filledColor: null,
    x: cx - ps * 1.2, y: cy + pr * 2.5, w: ps, h: ps * 0.6, shape: 'rect' });
  regions.push({ id: id++, label: `${id}`, assignedColor: 6, filledColor: null,
    x: cx + ps * 0.2, y: cy + pr * 3, w: ps, h: ps * 0.6, shape: 'rect' });

  // Ground
  regions.push({ id: id++, label: `${id}`, assignedColor: 5, filledColor: null,
    x: 0, y: canvasW - 30, w: canvasW, h: 30, shape: 'rect' });
  regions.push({ id: id++, label: `${id}`, assignedColor: 3, filledColor: null,
    x: 0, y: 0, w: canvasW, h: 30, shape: 'rect' });

  return regions;
}

const STAGE_CFG: Record<string, { maxRegions: number; colorCount: number; autoFill: boolean }> = {
  early:  { maxRegions: 12, colorCount: 6, autoFill: false },
  middle: { maxRegions: 8, colorCount: 4, autoFill: false },
  late:   { maxRegions: 4, colorCount: 3, autoFill: true },
};

const CELEBRATIONS = ['Beautiful! 🎨', 'Lovely colors! 🌈', 'Wonderful! ✨'];

export default function ColorNumber() {
  const router = useRouter();
  const [stage, setStage] = useState<DiseaseStage>('middle');
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedColor, setSelectedColor] = useState(0);
  const [filledCount, setFilledCount] = useState(0);
  const [celebration, setCelebration] = useState('');
  const [gameState, setGameState] = useState<'loading' | 'playing' | 'complete'>('loading');
  const startTime = useRef(Date.now());
  const patientId = useRef('');
  const autoFillTimer = useRef<ReturnType<typeof setInterval> | null>(null);

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
    const canvasW = SCREEN_W - A11Y.screenPadding * 2;
    const cfg = STAGE_CFG[stage] || STAGE_CFG.middle;
    let regs = flowerTemplate(canvasW).slice(0, cfg.maxRegions);
    // Re-assign colors within palette range
    regs = regs.map(r => ({ ...r, assignedColor: r.assignedColor % cfg.colorCount, filledColor: null }));
    setRegions(regs);
    setFilledCount(0);
    setSelectedColor(0);
    startTime.current = Date.now();

    // Late stage auto-fill
    if (cfg.autoFill) {
      autoFillTimer.current = setInterval(() => {
        setRegions(prev => {
          const unfilled = prev.filter(r => !r.filledColor);
          if (unfilled.length === 0) return prev;
          const target = unfilled[0];
          return prev.map(r =>
            r.id === target.id ? { ...r, filledColor: PALETTE[r.assignedColor].color } : r
          );
        });
        setFilledCount(c => c + 1);
      }, 2000);
    }

    return () => {
      if (autoFillTimer.current) clearInterval(autoFillTimer.current);
    };
  }, [stage, gameState]);

  useEffect(() => {
    if (gameState === 'playing' && regions.length > 0 && filledCount >= regions.length) {
      setTimeout(() => handleComplete(), 800);
    }
  }, [filledCount, regions.length]);

  function handleRegionPress(id: number) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRegions(prev => prev.map(r =>
      r.id === id ? { ...r, filledColor: PALETTE[selectedColor].color } : r
    ));
    const newCount = filledCount + 1;
    setFilledCount(newCount);

    if (newCount % 3 === 0) {
      setCelebration(CELEBRATIONS[Math.floor(Math.random() * CELEBRATIONS.length)]);
      setTimeout(() => setCelebration(''), 1200);
    }
  }

  async function handleComplete() {
    setGameState('complete');
    if (autoFillTimer.current) clearInterval(autoFillTimer.current);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const dur = Math.round((Date.now() - startTime.current) / 1000);
    try {
      if (patientId.current) {
        await logActivitySession({
          patient_id: patientId.current,
          activity: 'color_number',
          stage_at_time: stage,
          difficulty_params: STAGE_CFG[stage],
          score: { regions_filled: filledCount, total_regions: regions.length },
          duration_seconds: dur,
          completed: true,
        });
      }
    } catch {}
  }

  if (gameState === 'loading') {
    return <MBSafeArea showHome showSOS><View style={st.center}><Text style={st.loadText}>Loading...</Text></View></MBSafeArea>;
  }

  if (gameState === 'complete') {
    return (
      <MBSafeArea showHome showSOS>
        <View style={st.center}>
          <Text style={{ fontSize: 80, marginBottom: 20 }}>🎨</Text>
          <Text style={st.doneTitle}>Masterpiece!</Text>
          <Text style={st.doneBody}>What beautiful colors you chose!</Text>
          <MBButton label="Paint Again" variant="primary" size="large" onPress={() => setGameState('playing')} />
          <MBButton label="Go Home" variant="secondary" size="large" onPress={() => router.replace('/(patient)')} style={{ marginTop: 12 }} />
        </View>
      </MBSafeArea>
    );
  }

  const cfg = STAGE_CFG[stage] || STAGE_CFG.middle;
  const canvasW = SCREEN_W - A11Y.screenPadding * 2;

  return (
    <MBSafeArea showHome showSOS title="Color by Number">
      <View style={st.container}>
        {celebration ? (
          <View style={st.celebBanner}><Text style={st.celebText}>{celebration}</Text></View>
        ) : (
          <Text style={st.progress}>{filledCount} of {regions.length} colored</Text>
        )}

        {/* Canvas */}
        <View style={[st.canvas, { width: canvasW, height: canvasW }]}>
          {regions.map(r => (
            <Pressable
              key={r.id}
              onPress={() => !r.filledColor && handleRegionPress(r.id)}
              accessibilityRole="button"
              accessibilityLabel={`Region ${r.label}, color ${PALETTE[r.assignedColor].name}`}
              style={[
                st.region,
                {
                  position: 'absolute',
                  left: r.x, top: r.y,
                  width: r.w, height: r.h,
                  borderRadius: r.shape === 'circle' ? r.w / 2 : 4,
                  backgroundColor: r.filledColor || '#F8F8F8',
                },
              ]}
            >
              {!r.filledColor && (
                <Text style={[st.regionLabel, { color: PALETTE[r.assignedColor].color }]}>
                  {r.assignedColor + 1}
                </Text>
              )}
            </Pressable>
          ))}
        </View>

        {/* Color palette */}
        {!cfg.autoFill && (
          <View style={st.palette}>
            {PALETTE.slice(0, cfg.colorCount).map((c, i) => (
              <Pressable
                key={c.name}
                onPress={() => { setSelectedColor(i); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                accessibilityRole="button"
                accessibilityLabel={`${c.name} color`}
                style={[
                  st.colorBtn,
                  { backgroundColor: c.color },
                  selectedColor === i && st.colorSelected,
                ]}
              >
                <Text style={st.colorNum}>{i + 1}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </MBSafeArea>
  );
}

const st = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 40 },
  loadText: { fontSize: A11Y.fontSizeHeading, color: COLORS.navy },
  progress: { fontSize: 16, color: COLORS.gray, textAlign: 'center', marginBottom: 8 },
  celebBanner: { backgroundColor: COLORS.glow, borderRadius: 16, padding: 10, alignSelf: 'center', marginBottom: 8 },
  celebText: { fontSize: 20, fontWeight: '700', color: COLORS.navy },
  canvas: {
    alignSelf: 'center', backgroundColor: '#FAFAFA', borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.lightGray, overflow: 'hidden',
  },
  region: {
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.lightGray,
  },
  regionLabel: { fontSize: 18, fontWeight: '700' },
  palette: {
    flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 16, paddingVertical: 8,
  },
  colorBtn: {
    width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  colorSelected: { borderColor: COLORS.navy, borderWidth: 3 },
  colorNum: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  doneTitle: { fontSize: 36, fontWeight: '700', color: COLORS.navy, marginBottom: 12 },
  doneBody: { fontSize: A11Y.fontSizeBody, color: COLORS.gray, marginBottom: 32, textAlign: 'center' },
});
