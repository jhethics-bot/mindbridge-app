/**
 * Music Player Screen
 * Queries family_media (type=music) and playlists tables.
 * Simple play/pause with large controls. Stage-adaptive text.
 */
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { MBSafeArea } from '../../components/ui/MBSafeArea';
import { MBButton } from '../../components/ui/MBButton';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import { supabase, logActivitySession, getCurrentProfile } from '../../lib/supabase';
import type { DiseaseStage } from '../../types';

interface Song {
  id: string;
  title: string;
  artist?: string;
  storage_path: string;
  duration_seconds?: number;
}

// Fallback songs (public domain)
const FALLBACK_SONGS: Song[] = [
  { id: '1', title: 'Amazing Grace', artist: 'Hymn', storage_path: '', duration_seconds: 180 },
  { id: '2', title: 'You Are My Sunshine', artist: 'Classic', storage_path: '', duration_seconds: 150 },
  { id: '3', title: 'What a Wonderful World', artist: 'Classic', storage_path: '', duration_seconds: 160 },
  { id: '4', title: 'Somewhere Over the Rainbow', artist: 'Classic', storage_path: '', duration_seconds: 200 },
];

export default function MusicScreen() {
  const router = useRouter();
  const [stage, setStage] = useState<DiseaseStage>('middle');
  const [songs, setSongs] = useState<Song[]>(FALLBACK_SONGS);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTime = useRef(Date.now());
  const patientId = useRef('');

  useEffect(() => {
    loadData();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  async function loadData() {
    try {
      const p = await getCurrentProfile();
      if (p) { setStage(p.stage as DiseaseStage); patientId.current = p.id; }

      // Load music from family_media
      const { data: media } = await supabase
        .from('family_media')
        .select('*')
        .eq('patient_id', p?.id)
        .eq('media_type', 'music')
        .order('sort_order');

      if (media && media.length > 0) {
        setSongs(media.map((m: any) => ({
          id: m.id,
          title: m.display_name || 'Untitled',
          artist: m.description || '',
          storage_path: m.storage_path,
          duration_seconds: m.duration_seconds || 180,
        })));
      }

      // Also try playlists
      const { data: playlists } = await supabase
        .from('playlists')
        .select('*')
        .eq('patient_id', p?.id)
        .limit(1);

      if (playlists && playlists.length > 0 && playlists[0].songs?.length > 0) {
        const playlistSongs = playlists[0].songs.map((s: any, i: number) => ({
          id: `pl-${i}`,
          title: s.title || 'Untitled',
          artist: s.artist || '',
          storage_path: s.uri || '',
          duration_seconds: s.duration || 180,
        }));
        setSongs(prev => [...prev, ...playlistSongs]);
      }
    } catch {}
  }

  function playSong(song: Song) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentSong(song);
    setIsPlaying(true);
    setElapsed(0);
    startTime.current = Date.now();

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsed(e => e + 1);
    }, 1000);
  }

  function togglePlay() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      timerRef.current = setInterval(() => {
        setElapsed(e => e + 1);
      }, 1000);
    }
    setIsPlaying(!isPlaying);
  }

  async function stopAndLog() {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsPlaying(false);
    try {
      if (patientId.current && currentSong) {
        await logActivitySession({
          patient_id: patientId.current,
          activity: 'music_listen',
          stage_at_time: stage,
          difficulty_params: {},
          score: { song: currentSong.title, listened_seconds: elapsed },
          duration_seconds: elapsed,
          completed: true,
        });
      }
    } catch {}
    setCurrentSong(null);
    setElapsed(0);
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  const fontSize = stage === 'late' ? 24 : stage === 'middle' ? 20 : 18;

  // Now playing view
  if (currentSong) {
    return (
      <MBSafeArea showHome showSOS title="Music">
        <View style={st.playerContainer}>
          <Text style={st.nowPlaying}>Now Playing</Text>
          <View style={st.albumArt}>
            <Text style={{ fontSize: 80 }}>🎵</Text>
          </View>
          <Text style={[st.songTitle, { fontSize: fontSize + 8 }]}>{currentSong.title}</Text>
          {currentSong.artist ? <Text style={st.artistName}>{currentSong.artist}</Text> : null}
          <Text style={st.elapsed}>{formatTime(elapsed)}</Text>

          <View style={st.controls}>
            <MBButton
              label={isPlaying ? '⏸ Pause' : '▶ Play'}
              variant="primary"
              size="large"
              onPress={togglePlay}
              style={{ flex: 1 }}
            />
            <MBButton
              label="⏹ Stop"
              variant="secondary"
              size="large"
              onPress={stopAndLog}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </MBSafeArea>
    );
  }

  // Song list
  return (
    <MBSafeArea showHome showSOS title="Music">
      <View style={st.container}>
        <Text style={st.heading}>Your Music</Text>
        <FlatList
          data={songs}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => playSong(item)}
              accessibilityRole="button"
              accessibilityLabel={`Play ${item.title}`}
              style={({ pressed }) => [st.songCard, pressed && { backgroundColor: COLORS.glow }]}
            >
              <Text style={{ fontSize: 36, marginRight: 16 }}>🎵</Text>
              <View style={{ flex: 1 }}>
                <Text style={[st.songCardTitle, { fontSize }]}>{item.title}</Text>
                {item.artist ? <Text style={st.songCardArtist}>{item.artist}</Text> : null}
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

const st = StyleSheet.create({
  container: { flex: 1 },
  heading: { fontSize: A11Y.fontSizeHeading, fontWeight: '700', color: COLORS.navy, marginBottom: 16 },
  songCard: {
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16,
    backgroundColor: COLORS.white, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  songCardTitle: { fontWeight: '600', color: COLORS.navy },
  songCardArtist: { fontSize: 14, color: COLORS.gray, marginTop: 2 },
  playIcon: { fontSize: 24, color: COLORS.teal },
  playerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 40 },
  nowPlaying: { fontSize: 16, color: COLORS.gray, marginBottom: 24 },
  albumArt: {
    width: 160, height: 160, borderRadius: 80, backgroundColor: COLORS.glow,
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
  },
  songTitle: { fontWeight: '700', color: COLORS.navy, textAlign: 'center', marginBottom: 4 },
  artistName: { fontSize: 18, color: COLORS.gray, marginBottom: 16 },
  elapsed: { fontSize: 32, fontWeight: '300', color: COLORS.teal, marginBottom: 32 },
  controls: { flexDirection: 'row', gap: 16, width: '100%' },
});
