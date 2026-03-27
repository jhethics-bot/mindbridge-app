/**
 * Voice Messages — Patient Screen
 * Placeholder until expo-av is available. Shows list of saved messages.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { MBSafeArea } from '../../components/ui/MBSafeArea';
import { MBHeader } from '../../components/ui/MBHeader';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import { supabase, getCurrentProfile } from '../../lib/supabase';

interface VoiceMessage {
  id: string;
  display_name: string;
  person_name: string | null;
  duration_seconds: number | null;
  created_at: string;
}

export default function VoiceMessagesScreen() {
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const p = await getCurrentProfile();
        if (!p) { setLoading(false); return; }
        const { data } = await supabase
          .from('family_media')
          .select('id, display_name, person_name, duration_seconds, created_at')
          .eq('patient_id', p.id)
          .eq('media_type', 'voice_message')
          .order('created_at', { ascending: false });
        setMessages(data ?? []);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const formatDuration = (sec: number | null) => {
    if (!sec) return '';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <MBSafeArea>
      <MBHeader title="Voice Messages" subtitle="Messages from your family" icon="🎙️" />

      {messages.length === 0 && !loading ? (
        <View style={st.emptyState}>
          <Text style={st.emptyEmoji}>🎙️</Text>
          <Text style={st.emptyTitle}>Voice messages are coming soon!</Text>
          <Text style={st.emptyBody}>
            In our next update, your family will be able to record voice messages for you to listen to anytime.
          </Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={st.list}
          renderItem={({ item }) => (
            <View style={st.card}>
              <Text style={st.cardName}>{item.person_name || item.display_name || 'Family'}</Text>
              <Text style={st.cardDate}>
                {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                {item.duration_seconds ? ` · ${formatDuration(item.duration_seconds)}` : ''}
              </Text>
              <Text style={st.playNote}>Audio playback coming in next update</Text>
            </View>
          )}
        />
      )}
    </MBSafeArea>
  );
}

const st = StyleSheet.create({
  list: { paddingBottom: 32 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: A11Y.fontSizeBodyLarge, fontWeight: '700', color: COLORS.navy, textAlign: 'center', marginBottom: 12 },
  emptyBody: { fontSize: A11Y.fontSizeBody, color: COLORS.gray, textAlign: 'center', lineHeight: 28 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardName: { fontSize: A11Y.fontSizeBodyLarge, fontWeight: '700', color: COLORS.navy },
  cardDate: { fontSize: 14, color: COLORS.gray, marginTop: 4 },
  playNote: { fontSize: 13, color: COLORS.teal, fontStyle: 'italic', marginTop: 8 },
});
