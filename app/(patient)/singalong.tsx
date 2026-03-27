/**
 * Sing Along — Patient Screen
 * Lyrics display for music therapy. No audio playback (expo-av unavailable).
 */
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { MBSafeArea } from '../../components/ui/MBSafeArea';
import { MBButton } from '../../components/ui/MBButton';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';

interface Song {
  id: string;
  title: string;
  artist: string;
  emoji: string;
  lyrics: string;
}

const SONGS: Song[] = [
  {
    id: '1', title: 'You Are My Sunshine', artist: 'Traditional', emoji: '☀️',
    lyrics: 'You are my sunshine, my only sunshine\nYou make me happy when skies are gray\nYou\'ll never know dear, how much I love you\nPlease don\'t take my sunshine away\n\nThe other night dear, as I lay sleeping\nI dreamed I held you in my arms\nBut when I awoke, dear, I was mistaken\nSo I hung my head and I cried',
  },
  {
    id: '2', title: 'Amazing Grace', artist: 'John Newton', emoji: '✨',
    lyrics: 'Amazing grace, how sweet the sound\nThat saved a wretch like me\nI once was lost, but now am found\nWas blind, but now I see\n\n\'Twas grace that taught my heart to fear\nAnd grace my fears relieved\nHow precious did that grace appear\nThe hour I first believed',
  },
  {
    id: '3', title: 'What a Wonderful World', artist: 'Louis Armstrong', emoji: '🌎',
    lyrics: 'I see trees of green, red roses too\nI see them bloom for me and you\nAnd I think to myself\nWhat a wonderful world\n\nI see skies of blue and clouds of white\nThe bright blessed day, the dark sacred night\nAnd I think to myself\nWhat a wonderful world',
  },
  {
    id: '4', title: 'Moon River', artist: 'Andy Williams', emoji: '🌙',
    lyrics: 'Moon river, wider than a mile\nI\'m crossing you in style some day\nOh, dream maker, you heart breaker\nWherever you\'re going, I\'m going your way\n\nTwo drifters, off to see the world\nThere\'s such a lot of world to see\nWe\'re after the same rainbow\'s end\nWaiting round the bend\nMy huckleberry friend\nMoon river and me',
  },
  {
    id: '5', title: 'Somewhere Over the Rainbow', artist: 'Judy Garland', emoji: '🌈',
    lyrics: 'Somewhere over the rainbow\nWay up high\nThere\'s a land that I heard of\nOnce in a lullaby\n\nSomewhere over the rainbow\nSkies are blue\nAnd the dreams that you dare to dream\nReally do come true',
  },
  {
    id: '6', title: 'Let It Be', artist: 'The Beatles', emoji: '🕊️',
    lyrics: 'When I find myself in times of trouble\nMother Mary comes to me\nSpeaking words of wisdom\nLet it be\n\nAnd in my hour of darkness\nShe is standing right in front of me\nSpeaking words of wisdom\nLet it be',
  },
];

type Phase = 'list' | 'lyrics';

export default function SingalongScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('list');
  const [activeSong, setActiveSong] = useState<Song | null>(null);

  const openSong = (song: Song) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveSong(song);
    setPhase('lyrics');
  };

  if (phase === 'lyrics' && activeSong) {
    return (
      <MBSafeArea title="Sing Along">
        <ScrollView contentContainerStyle={st.lyricsScroll} showsVerticalScrollIndicator={false}>
          <Text style={st.songEmoji}>{activeSong.emoji}</Text>
          <Text style={st.songTitle}>{activeSong.title}</Text>
          <Text style={st.songArtist}>{activeSong.artist}</Text>
          <Text style={st.lyricsText}>{activeSong.lyrics}</Text>
          <MBButton
            label="Back to Songs"
            variant="secondary"
            size="standard"
            onPress={() => setPhase('list')}
            style={{ marginTop: 24 }}
          />
          <Text style={st.note}>Audio playback coming in a future update</Text>
        </ScrollView>
      </MBSafeArea>
    );
  }

  return (
    <MBSafeArea title="Sing Along">
      <ScrollView contentContainerStyle={st.listScroll} showsVerticalScrollIndicator={false}>
        <Text style={st.header}>Sing Along</Text>
        <Text style={st.subtitle}>Tap a song to see the lyrics</Text>
        {SONGS.map(song => (
          <Pressable
            key={song.id}
            onPress={() => openSong(song)}
            accessibilityRole="button"
            accessibilityLabel={`${song.title} by ${song.artist}`}
            style={({ pressed }) => [st.songCard, pressed && { opacity: 0.85 }]}
          >
            <Text style={st.cardEmoji}>{song.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={st.cardTitle}>{song.title}</Text>
              <Text style={st.cardArtist}>{song.artist}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </MBSafeArea>
  );
}

const st = StyleSheet.create({
  listScroll: { paddingBottom: 32 },
  header: { fontSize: A11Y.fontSizeHeading, fontWeight: '700', color: COLORS.navy, marginBottom: 4 },
  subtitle: { fontSize: A11Y.fontSizeBody, color: COLORS.gray, marginBottom: 20 },
  songCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.white, borderRadius: 16, padding: 18, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardEmoji: { fontSize: 36 },
  cardTitle: { fontSize: A11Y.fontSizeBodyLarge, fontWeight: '700', color: COLORS.navy },
  cardArtist: { fontSize: 15, color: COLORS.gray, marginTop: 2 },
  lyricsScroll: { paddingBottom: 40, alignItems: 'center' },
  songEmoji: { fontSize: 56, marginBottom: 8, marginTop: 16 },
  songTitle: { fontSize: 24, fontWeight: '700', color: COLORS.navy, textAlign: 'center' },
  songArtist: { fontSize: 16, color: COLORS.teal, fontWeight: '500', marginBottom: 24 },
  lyricsText: {
    fontSize: 22, color: COLORS.navy, lineHeight: 36, textAlign: 'center', paddingHorizontal: 16,
  },
  note: { fontSize: 13, color: COLORS.gray, textAlign: 'center', marginTop: 16, fontStyle: 'italic' },
});
