/**
 * News Reader — Patient Screen
 * Curated, bias-removed news with large text and tap-based interaction.
 * Uses the existing news-reader Edge Function via newsStore.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MBSafeArea } from '../../components/ui/MBSafeArea';
import { MBHeader } from '../../components/ui/MBHeader';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import { useNewsStore } from '../../stores/newsStore';
import type { NewsArticle } from '../../lib/news-reader';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function PatientNewsCard({ article }: { article: NewsArticle }) {
  const [expanded, setExpanded] = useState(false);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded(!expanded);
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={article.title}
      accessibilityHint={expanded ? 'Tap to collapse' : 'Tap to read summary'}
      style={({ pressed }) => [
        st.card,
        pressed && { opacity: 0.9 },
      ]}
    >
      <Text style={st.source}>{article.source} · {formatDate(article.published_at)}</Text>
      <Text style={st.headline}>{article.title}</Text>

      {expanded ? (
        <View style={st.expandedContent}>
          <Text style={st.summary}>{article.summary}</Text>
          <Text style={st.tapHint}>Tap to close</Text>
        </View>
      ) : (
        <Text style={st.preview} numberOfLines={2}>{article.summary}</Text>
      )}
    </Pressable>
  );
}

export default function PatientNewsScreen() {
  const { articles, loading, loadNews } = useNewsStore();

  useEffect(() => { loadNews(); }, []);

  return (
    <MBSafeArea>
      <MBHeader title="Today's News" subtitle="Curated for you" icon="📰" />
      <FlatList
        data={articles}
        keyExtractor={a => a.id}
        renderItem={({ item }) => <PatientNewsCard article={item} />}
        refreshing={loading}
        onRefresh={() => loadNews()}
        contentContainerStyle={st.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={st.emptyState}>
            <Text style={st.emptyEmoji}>📰</Text>
            <Text style={st.emptyText}>
              {loading ? 'Loading news...' : 'No news right now.\nCheck back later!'}
            </Text>
          </View>
        }
      />
    </MBSafeArea>
  );
}

const st = StyleSheet.create({
  list: { paddingBottom: 32 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 20, padding: 20, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  source: {
    fontSize: 14, color: COLORS.gray, marginBottom: 6,
  },
  headline: {
    fontSize: A11Y.fontSizeBodyLarge, fontWeight: '700', color: COLORS.navy,
    lineHeight: A11Y.fontSizeBodyLarge * 1.4,
  },
  preview: {
    fontSize: A11Y.fontSizeBody, color: COLORS.gray, marginTop: 6,
    lineHeight: A11Y.fontSizeBody * 1.4,
  },
  expandedContent: { marginTop: 12 },
  summary: {
    fontSize: A11Y.fontSizeBody, color: COLORS.navy,
    lineHeight: A11Y.fontSizeBody * 1.6,
  },
  tapHint: {
    fontSize: 14, color: COLORS.teal, fontWeight: '500', marginTop: 12, textAlign: 'center',
  },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyText: {
    fontSize: A11Y.fontSizeBody, color: COLORS.gray, textAlign: 'center', lineHeight: 28,
  },
});
