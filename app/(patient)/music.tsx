/**
 * Music Player Screen with Animated Backgrounds
 *
 * Queries family_media (type=music) for songs with playback_url.
 * Uses expo-av Audio.Sound for real playback.
 * Animated backgrounds per animation_theme using Reanimated.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Audio, AVPlaybackStatus } from 'expo-av';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { MBSafeArea } from '../../components/ui/MBSafeArea';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import { supabase, getCurrentProfile, logActivitySession } from '../../lib/supabase';
import type { DiseaseStage } from '../../types';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ============================================
// TYPES
// ============================================
interface Song {
  id: string;
  display_name: string;
  description: string;
  playback_url: string;
  animation_theme: string | null;
  duration_seconds: number;
  sort_order: number;
}

type AnimTheme = 'peaceful' | 'golden' | 'nature' | 'patriotic' | 'joyful';

// ============================================
// THEME CONFIGS
// ============================================
const THEME_COLORS: Record<AnimTheme, { bg1: string; bg2: string }> = {
  peaceful:  { bg1: '#1B2A4A', bg2: '#2A9D8F' },
  golden:    { bg1: '#2C1810', bg2: '#E9C46A' },
  nature:    { bg1: '#1a3a2a', bg2: '#2A9D8F' },
  patriotic: { bg1: '#1B2A4A', bg2: '#2C1810' },
  joyful:    { bg1: '#E9C46A', bg2: '#F4F1DE' },
};

function resolveTheme(t: string | null): AnimTheme {
  if (t && t in THEME_COLORS) return t as AnimTheme;
  return 'peaceful';
}

// ============================================
// ANIMATED BACKGROUNDS
// ============================================

function PeacefulBg() {
  const a1 = useSharedValue(0);
  const a2 = useSharedValue(0);
  const a3 = useSharedValue(0);
  useEffect(() => {
    a1.value = withRepeat(withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.sin) }), -1, true);
    a2.value = withRepeat(withDelay(1500, withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.sin) })), -1, true);
    a3.value = withRepeat(withDelay(3000, withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.sin) })), -1, true);
  }, []);
  const s1 = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(a1.value, [0, 1], [0, 30]) }],
    opacity: interpolate(a1.value, [0, 0.5, 1], [0.04, 0.1, 0.04]),
  }));
  const s2 = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(a2.value, [0, 1], [10, -20]) }],
    opacity: interpolate(a2.value, [0, 0.5, 1], [0.03, 0.08, 0.03]),
  }));
  const s3 = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(a3.value, [0, 1], [-10, 25]) }],
    opacity: interpolate(a3.value, [0, 0.5, 1], [0.02, 0.07, 0.02]),
  }));
  return (
    <>
      <Animated.View style={[absBg, { top: '20%', backgroundColor: 'rgba(42,157,143,0.3)', borderRadius: SCREEN_W, height: 120, width: SCREEN_W * 1.4, left: -SCREEN_W * 0.2 }, s1]} />
      <Animated.View style={[absBg, { top: '45%', backgroundColor: 'rgba(42,157,143,0.25)', borderRadius: SCREEN_W, height: 100, width: SCREEN_W * 1.3, left: -SCREEN_W * 0.15 }, s2]} />
      <Animated.View style={[absBg, { top: '65%', backgroundColor: 'rgba(42,157,143,0.2)', borderRadius: SCREEN_W, height: 110, width: SCREEN_W * 1.5, left: -SCREEN_W * 0.25 }, s3]} />
    </>
  );
}

function GoldenBg() {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.8, 1.2]) }],
    opacity: interpolate(pulse.value, [0, 0.5, 1], [0.05, 0.15, 0.05]),
  }));
  return (
    <Animated.View style={[absBg, {
      top: '25%', left: '15%', width: SCREEN_W * 0.7, height: SCREEN_W * 0.7,
      borderRadius: SCREEN_W * 0.35, backgroundColor: '#E9C46A',
    }, style]} />
  );
}

function NatureBg() {
  const bubbles = [0, 1, 2, 3, 4];
  return (
    <>
      {bubbles.map(i => <NatureBubble key={i} index={i} />)}
    </>
  );
}

function NatureBubble({ index }: { index: number }) {
  const anim = useSharedValue(0);
  useEffect(() => {
    anim.value = withRepeat(
      withDelay(index * 2400, withTiming(1, { duration: 12000, easing: Easing.inOut(Easing.sin) })),
      -1, true
    );
  }, []);
  const left = 15 + index * 18;
  const size = 20 + index * 8;
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(anim.value, [0, 1], [SCREEN_H * 0.7, SCREEN_H * 0.1]) }],
    opacity: interpolate(anim.value, [0, 0.3, 0.7, 1], [0, 0.08, 0.08, 0]),
  }));
  return (
    <Animated.View style={[absBg, {
      left: `${left}%`, width: size, height: size,
      borderRadius: size / 2, backgroundColor: '#2A9D8F',
    }, style]} />
  );
}

function PatrioticBg() {
  const a1 = useSharedValue(0);
  const a2 = useSharedValue(0);
  const a3 = useSharedValue(0);
  useEffect(() => {
    a1.value = withRepeat(withTiming(1, { duration: 10000, easing: Easing.inOut(Easing.sin) }), -1, true);
    a2.value = withRepeat(withDelay(2000, withTiming(1, { duration: 10000, easing: Easing.inOut(Easing.sin) })), -1, true);
    a3.value = withRepeat(withDelay(4000, withTiming(1, { duration: 10000, easing: Easing.inOut(Easing.sin) })), -1, true);
  }, []);
  const s1 = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(a1.value, [0, 1], [-SCREEN_W * 0.3, SCREEN_W * 0.3]) }],
    opacity: interpolate(a1.value, [0, 0.5, 1], [0.03, 0.08, 0.03]),
  }));
  const s2 = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(a2.value, [0, 1], [SCREEN_W * 0.3, -SCREEN_W * 0.3]) }],
    opacity: interpolate(a2.value, [0, 0.5, 1], [0.03, 0.08, 0.03]),
  }));
  const s3 = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(a3.value, [0, 1], [-SCREEN_W * 0.2, SCREEN_W * 0.2]) }],
    opacity: interpolate(a3.value, [0, 0.5, 1], [0.03, 0.08, 0.03]),
  }));
  return (
    <>
      <Animated.View style={[absBg, { top: '25%', height: 8, width: SCREEN_W * 1.2, left: -SCREEN_W * 0.1, backgroundColor: '#C1121F', borderRadius: 4 }, s1]} />
      <Animated.View style={[absBg, { top: '45%', height: 8, width: SCREEN_W * 1.2, left: -SCREEN_W * 0.1, backgroundColor: '#FFFFFF', borderRadius: 4 }, s2]} />
      <Animated.View style={[absBg, { top: '65%', height: 8, width: SCREEN_W * 1.2, left: -SCREEN_W * 0.1, backgroundColor: '#3C3B6E', borderRadius: 4 }, s3]} />
    </>
  );
}

function JoyfulBg() {
  const dots = [0, 1, 2, 3, 4, 5];
  return (
    <>
      {dots.map(i => <JoyfulDot key={i} index={i} />)}
    </>
  );
}

function JoyfulDot({ index }: { index: number }) {
  const anim = useSharedValue(0);
  useEffect(() => {
    anim.value = withRepeat(
      withDelay(index * 1100, withTiming(1, { duration: 7000, easing: Easing.inOut(Easing.sin) })),
      -1, true
    );
  }, []);
  const left = 10 + index * 15;
  const top = 20 + (index % 3) * 25;
  const size = 16 + index * 4;
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(anim.value, [0, 1], [-10, 10]) }],
    opacity: interpolate(anim.value, [0, 0.5, 1], [0.04, 0.1, 0.04]),
  }));
  return (
    <Animated.View style={[absBg, {
      left: `${left}%`, top: `${top}%`, width: size, height: size,
      borderRadius: size / 2, backgroundColor: '#E9C46A',
    }, style]} />
  );
}

const ANIM_COMPONENTS: Record<AnimTheme, React.FC> = {
  peaceful: PeacefulBg,
  golden: GoldenBg,
  nature: NatureBg,
  patriotic: PatrioticBg,
  joyful: JoyfulBg,
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function MusicScreen() {
  const [stage, setStage] = useState<DiseaseStage>('middle');
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);
  const patientIdRef = useRef('');
  const startTimeRef = useRef(Date.now());

  const currentSong = currentIndex !== null ? songs[currentIndex] : null;
  const theme = resolveTheme(currentSong?.animation_theme ?? null);
  const colors = THEME_COLORS[theme];
  const AnimBg = ANIM_COMPONENTS[theme];

  // ---- Load data ----
  useEffect(() => {
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });
        const p = await getCurrentProfile();
        if (p) {
          setStage(p.stage as DiseaseStage);
          patientIdRef.current = p.id;
        }
        const { data: media } = await supabase
          .from('family_media')
          .select('*')
          .eq('media_type', 'music')
          .order('sort_order');

        if (media && media.length > 0) {
          setSongs(media.map((m: any) => ({
            id: m.id,
            display_name: m.display_name || 'Untitled',
            description: m.description || '',
            playback_url: m.playback_url || '',
            animation_theme: m.animation_theme || null,
            duration_seconds: m.duration_seconds || 180,
            sort_order: m.sort_order || 0,
          })));
        }
      } catch (err) {
        console.error('[music] Load error:', err);
      }
    })();
    return () => { unloadSound(); };
  }, []);

  const unloadSound = useCallback(async () => {
    if (soundRef.current) {
      try { await soundRef.current.unloadAsync(); } catch {}
      soundRef.current = null;
    }
  }, []);

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setPositionMs(status.positionMillis);
    setDurationMs(status.durationMillis || 0);
    if (status.didJustFinish) {
      setIsPlaying(false);
    }
  }, []);

  const playSong = useCallback(async (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await unloadSound();

    const song = songs[index];
    if (!song?.playback_url) return;

    setCurrentIndex(index);
    setIsPlaying(true);
    setPositionMs(0);
    setDurationMs(song.duration_seconds * 1000);
    startTimeRef.current = Date.now();

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: song.playback_url },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );
      soundRef.current = sound;
    } catch (err) {
      console.error('[music] Playback error:', err);
      setIsPlaying(false);
    }
  }, [songs, unloadSound, onPlaybackStatusUpdate]);

  const togglePlay = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!soundRef.current) return;
    try {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch {}
  }, [isPlaying]);

  const stopAndLog = useCallback(async () => {
    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
    await unloadSound();
    setIsPlaying(false);
    setCurrentIndex(null);
    setPositionMs(0);
    try {
      if (patientIdRef.current && currentSong) {
        await logActivitySession({
          patient_id: patientIdRef.current,
          activity: 'music_listen',
          stage_at_time: stage,
          difficulty_params: {},
          score: { song: currentSong.display_name, listened_seconds: elapsed },
          duration_seconds: elapsed,
          completed: true,
        });
      }
    } catch {}
  }, [currentSong, stage, unloadSound]);

  function formatTime(ms: number) {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  const progress = durationMs > 0 ? positionMs / durationMs : 0;

  // ============================================
  // RENDER: NOW PLAYING
  // ============================================
  if (currentSong) {
    const textColor = theme === 'joyful' ? COLORS.navy : '#FFFFFF';
    const subColor = theme === 'joyful' ? COLORS.gray : 'rgba(255,255,255,0.7)';

    return (
      <MBSafeArea showHome showSOS title="Music">
        <View style={[st.playerRoot, { backgroundColor: colors.bg1 }]}>
          {/* Gradient overlay */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg2, opacity: 0.3 }]} />
          {/* Animated background */}
          <AnimBg />
          {/* Content */}
          <View style={st.playerContent}>
            <Text style={[st.nowPlayingLabel, { color: subColor }]}>Now Playing</Text>

            {/* Song emoji / art */}
            <View style={st.artCircle}>
              <Text style={{ fontSize: 60 }}>🎵</Text>
            </View>

            {/* Title & description */}
            <Text style={[st.songTitle, { color: textColor }]}>{currentSong.display_name}</Text>
            {currentSong.description ? (
              <Text style={[st.songDesc, { color: subColor }]}>{currentSong.description}</Text>
            ) : null}

            {/* Progress bar */}
            <View style={st.progressContainer}>
              <View style={st.progressTrack}>
                <View style={[st.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
              </View>
              <View style={st.timeRow}>
                <Text style={[st.timeText, { color: subColor }]}>{formatTime(positionMs)}</Text>
                <Text style={[st.timeText, { color: subColor }]}>{formatTime(durationMs)}</Text>
              </View>
            </View>

            {/* Controls */}
            <Pressable
              onPress={togglePlay}
              accessibilityRole="button"
              accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
              style={({ pressed }) => [st.playBtn, pressed && { transform: [{ scale: 0.95 }] }]}
            >
              <Text style={st.playBtnText}>{isPlaying ? '⏸' : '▶️'}</Text>
            </Pressable>

            <Pressable
              onPress={stopAndLog}
              accessibilityRole="button"
              accessibilityLabel="Stop and go back to song list"
              style={({ pressed }) => [st.stopBtn, pressed && { opacity: 0.7 }]}
            >
              <Text style={[st.stopBtnText, { color: subColor }]}>⏹ Stop</Text>
            </Pressable>
          </View>

          {/* Song list at bottom */}
          <FlatList
            data={songs}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={st.bottomList}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            renderItem={({ item, index }) => {
              const active = index === currentIndex;
              return (
                <Pressable
                  onPress={() => playSong(index)}
                  accessibilityRole="button"
                  accessibilityLabel={`Play ${item.display_name}`}
                  style={[st.miniCard, active && st.miniCardActive]}
                >
                  <Text style={{ fontSize: 20 }}>🎵</Text>
                  <Text style={[st.miniTitle, { color: active ? COLORS.teal : textColor }]} numberOfLines={1}>
                    {item.display_name}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>
      </MBSafeArea>
    );
  }

  // ============================================
  // RENDER: SONG LIST
  // ============================================
  if (songs.length === 0) {
    return (
      <MBSafeArea showHome showSOS title="Music">
        <View style={st.emptyContainer}>
          <Text style={{ fontSize: 64, marginBottom: 16 }}>🎵</Text>
          <Text style={st.emptyText}>No music added yet</Text>
          <Text style={st.emptySubText}>Ask a caregiver to add your favorite songs</Text>
        </View>
      </MBSafeArea>
    );
  }

  return (
    <MBSafeArea showHome showSOS title="Music">
      <View style={st.listContainer}>
        <Text style={st.heading}>Your Music</Text>
        <FlatList
          data={songs}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() => playSong(index)}
              accessibilityRole="button"
              accessibilityLabel={`Play ${item.display_name}`}
              style={({ pressed }) => [st.songCard, pressed && { backgroundColor: COLORS.glow }]}
            >
              <Text style={{ fontSize: 36, marginRight: 16 }}>🎵</Text>
              <View style={{ flex: 1 }}>
                <Text style={st.songCardTitle}>{item.display_name}</Text>
                {item.description ? <Text style={st.songCardDesc}>{item.description}</Text> : null}
              </View>
              <Text style={st.playIcon}>▶</Text>
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>
    </MBSafeArea>
  );
}

// ============================================
// STYLES
// ============================================
const absBg: any = { position: 'absolute' };

const st = StyleSheet.create({
  // Player root
  playerRoot: {
    flex: 1,
    overflow: 'hidden',
  },
  playerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 10,
  },
  nowPlayingLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 20,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  artCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  songTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  songDesc: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },

  // Progress
  progressContainer: {
    width: '100%',
    marginBottom: 28,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: COLORS.teal,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Controls
  playBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.teal,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  playBtnText: {
    fontSize: 36,
  },
  stopBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  stopBtnText: {
    fontSize: 18,
    fontWeight: '600',
  },

  // Bottom song list (now playing)
  bottomList: {
    maxHeight: 80,
    zIndex: 10,
    marginBottom: 8,
  },
  miniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  miniCardActive: {
    backgroundColor: 'rgba(42,157,143,0.25)',
  },
  miniTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    maxWidth: 120,
  },

  // Song list
  listContainer: {
    flex: 1,
  },
  heading: {
    fontSize: A11Y.fontSizeHeading,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 16,
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  songCardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.navy,
  },
  songCardDesc: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 2,
  },
  playIcon: {
    fontSize: 24,
    color: COLORS.teal,
  },

  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
  },
});
