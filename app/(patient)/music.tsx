import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
const THEMES: Record<string, { bg: string; accent: string }> = {
  peaceful: { bg: '#1B2A4A', accent: '#2A9D8F' },
  golden: { bg: '#2C1810', accent: '#E9C46A' },
  nature: { bg: '#1a3a2a', accent: '#2A9D8F' },
  patriotic: { bg: '#1B2A4A', accent: '#8B1A1A' },
  joyful: { bg: '#E9C46A', accent: '#F4F1DE' },
};
export default function MusicScreen() {
  const [songs, setSongs] = useState<any[]>([]);
  const [currentSong, setCurrentSong] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const pulseAnim = useRef(new Animated.Value(0.05)).current;
  const router = useRouter();
  useEffect(() => { loadSongs(); }, []);
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.15, duration: 3000, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 0.05, duration: 3000, useNativeDriver: false }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);
  const loadSongs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('family_media').select('*')
        .eq('patient_id', user.id).eq('media_type', 'music').order('sort_order');
      if (data && data.length > 0) { setSongs(data); setCurrentSong(data[0]); }
    } catch { /* song loading is non-critical */ }
  };
  const theme = THEMES[currentSong?.animation_theme || 'peaceful'];
  const textColor = currentSong?.animation_theme === 'joyful' ? '#1B2A4A' : '#F4F1DE';
  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Animated.View style={[styles.glowOrb, { backgroundColor: theme.accent, opacity: pulseAnim }]} />
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Text style={[styles.backText, { color: textColor }]}>← Back</Text>
      </TouchableOpacity>
      <View style={styles.nowPlaying}>
        <Text style={[styles.nowLabel, { color: textColor + '80' }]}>Now Playing</Text>
        <Text style={[styles.songTitle, { color: textColor }]}>{currentSong?.display_name || 'Select a song'}</Text>
        <Text style={[styles.songDesc, { color: textColor + 'B3' }]}>{currentSong?.description || ''}</Text>
        <TouchableOpacity style={styles.playBtn} onPress={() => setIsPlaying(!isPlaying)}>
          <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶️'}</Text>
        </TouchableOpacity>
        <Text style={[styles.audioNote, { color: textColor + '66' }]}>Audio available in full app release</Text>
      </View>
      <ScrollView style={styles.songList}>
        <Text style={[styles.listLabel, { color: textColor + '80' }]}>Songs ({songs.length})</Text>
        {songs.map((song, i) => (
          <TouchableOpacity key={song.id || i}
            style={[styles.songRow, currentSong?.id === song.id && styles.songRowActive]}
            onPress={() => { setCurrentSong(song); setIsPlaying(true); }}>
            <Text style={styles.songEmoji}>🎵</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.songName, { color: textColor }]}>{song.display_name}</Text>
              <Text style={[styles.songInfo, { color: textColor + '99' }]}>{song.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  glowOrb: { position: 'absolute', top: '20%', left: '10%', width: 300, height: 300, borderRadius: 150 },
  back: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
  backText: { fontSize: 18 },
  nowPlaying: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 40, paddingBottom: 20 },
  nowLabel: { fontSize: 14, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
  songTitle: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  songDesc: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  playBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  playIcon: { fontSize: 36 },
  audioNote: { fontSize: 12, marginTop: 4 },
  songList: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 16, paddingHorizontal: 16 },
  listLabel: { fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  songRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12, marginBottom: 4 },
  songRowActive: { backgroundColor: 'rgba(42,157,143,0.2)' },
  songEmoji: { fontSize: 20, marginRight: 12 },
  songName: { fontSize: 16, fontWeight: '600' },
  songInfo: { fontSize: 13, marginTop: 2 },
});
