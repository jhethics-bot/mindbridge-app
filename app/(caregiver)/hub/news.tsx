import React, { useEffect, useState } from 'react';
import { FlatList, View, Text, Pressable, Linking, StyleSheet } from 'react-native';
import { useNewsStore } from '../../../stores/newsStore';
import { NewsArticle } from '../../../lib/news-reader';
import { COLORS } from '../../../constants/colors';
import { MBSafeArea } from '../../../components/ui/MBSafeArea';
import { MBButton } from '../../../components/ui/MBButton';

const CATEGORIES = [
  { key: null, label: 'All', emoji: '📰' },
  { key: 'research', label: 'Research', emoji: '🔬' },
  { key: 'caregiving', label: 'Caregiving', emoji: '💛' },
  { key: 'treatment', label: 'Treatment', emoji: '💊' },
  { key: 'policy', label: 'Policy', emoji: '🏛️' },
  { key: 'lifestyle', label: 'Lifestyle', emoji: '🌿' },
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function NewsCard({ article }: { article: NewsArticle }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Pressable onPress={() => setExpanded(!expanded)} style={st.newsCard}
      accessibilityRole="button" accessibilityLabel={`News: ${article.title}`}>
      <View style={st.cardHeader}>
        <View style={st.sourceBadge}>
          <Text style={st.sourceText}>{article.source}</Text>
        </View>
        <Text style={st.dateText}>{formatDate(article.published_at)}</Text>
      </View>
      <Text style={st.newsTitle}>{article.title}</Text>
      {expanded ? (
        <View style={{ marginTop: 12 }}>
          <Text style={st.summary}>{article.summary}</Text>
          {article.bias_removed && (
            <View style={st.biasTag}>
              <Text style={st.biasText}>Bias-checked by AI for neutral, factual reporting</Text>
            </View>
          )}
          <MBButton label="Read Full Article" variant="secondary" size="compact"
            onPress={() => Linking.openURL(article.source_url)} style={{ marginTop: 12 }} />
        </View>
      ) : (
        <Text style={st.preview} numberOfLines={2}>{article.summary}</Text>
      )}
    </Pressable>
  );
}

export default function NewsReaderScreen() {
  const { articles, loading, loadNews, selectedCategory, setCategory } = useNewsStore();
  useEffect(() => { loadNews(); }, []);

  return (
    <MBSafeArea title="News" showSOS={false}>
      <Text style={st.intro}>
        Alzheimer's news, rewritten for clarity with bias removed.
      </Text>
      <View style={st.catRow}>
        {CATEGORIES.map(cat => (
          <Pressable key={cat.label} onPress={() => setCategory(cat.key)}
            style={[st.catChip, selectedCategory === cat.key && st.catChipActive]}>
            <Text style={[st.catText, selectedCategory === cat.key && st.catTextActive]}>
              {cat.emoji} {cat.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={articles}
        keyExtractor={a => a.id}
        renderItem={({ item }) => <NewsCard article={item} />}
        refreshing={loading}
        onRefresh={() => loadNews(selectedCategory || undefined)}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListEmptyComponent={
          <Text style={st.empty}>{loading ? 'Loading news...' : 'No articles yet. Pull to refresh.'}</Text>
        }
      />
    </MBSafeArea>
  );
}

const st = StyleSheet.create({
  intro: { fontSize: 14, color: COLORS.gray, marginBottom: 12 },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.lightGray },
  catChipActive: { backgroundColor: COLORS.teal, borderColor: COLORS.teal },
  catText: { fontSize: 14, color: COLORS.gray },
  catTextActive: { color: COLORS.white, fontWeight: '700' },
  newsCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  sourceBadge: { backgroundColor: '#2A9D8F22', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  sourceText: { fontSize: 12, color: COLORS.teal, fontWeight: '600' },
  dateText: { fontSize: 12, color: COLORS.gray },
  newsTitle: { fontSize: 18, fontWeight: '600', color: COLORS.navy, lineHeight: 24 },
  preview: { fontSize: 14, color: COLORS.gray, marginTop: 4 },
  summary: { fontSize: 16, color: COLORS.navy, lineHeight: 26 },
  biasTag: { backgroundColor: COLORS.cream, borderRadius: 8, padding: 8, marginTop: 12 },
  biasText: { fontSize: 12, color: COLORS.gray, fontStyle: 'italic', textAlign: 'center' },
  empty: { textAlign: 'center', marginTop: 40, color: COLORS.gray, fontSize: 16 },
});
