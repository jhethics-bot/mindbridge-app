import React, { useEffect, useState } from 'react';
import { FlatList, View, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { useNewsStore } from '../../../stores/newsStore';
import { NewsArticle } from '../../../lib/news-reader';
import { COLORS } from '../../../constants/colors';
import MBSafeArea from '../../../components/ui/MBSafeArea';
import MBText from '../../../components/ui/MBText';
import MBButton from '../../../components/ui/MBButton';
import MBCard from '../../../components/ui/MBCard';

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
    <TouchableOpacity
      onPress={() => setExpanded(!expanded)}
      style={styles.newsCard}
      accessibilityRole="button"
      accessibilityLabel={`News article: ${article.title}`}
    >
      <View style={styles.cardHeader}>
        <View style={styles.sourceBadge}>
          <MBText style={styles.sourceText}>{article.source}</MBText>
        </View>
        <MBText variant="caption">{formatDate(article.published_at)}</MBText>
      </View>

      <MBText variant="heading" style={styles.newsTitle}>{article.title}</MBText>

      {expanded && (
        <View style={styles.expandedContent}>
          <MBText variant="body" style={styles.summary}>{article.summary}</MBText>
          {article.bias_removed && (
            <View style={styles.biasTag}>
              <MBText style={styles.biasText}>Bias-checked by AI for neutral, factual reporting</MBText>
            </View>
          )}
          <MBButton
            title="Read Full Article"
            onPress={() => Linking.openURL(article.source_url)}
            variant="secondary"
            size="medium"
            style={styles.readMore}
          />
        </View>
      )}

      {!expanded && (
        <MBText variant="caption" numberOfLines={2} style={styles.preview}>
          {article.summary}
        </MBText>
      )}
    </TouchableOpacity>
  );
}

export default function NewsReaderScreen() {
  const { articles, loading, loadNews, selectedCategory, setCategory } = useNewsStore();

  useEffect(() => { loadNews(); }, []);

  return (
    <MBSafeArea title="News" showSOS={false}>
      <MBText variant="body" style={styles.intro}>
        Alzheimer's and dementia news, rewritten for clarity with political bias and sensationalism removed.
      </MBText>

      <View style={styles.categoryRow}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.label}
            onPress={() => setCategory(cat.key)}
            style={[styles.catChip, selectedCategory === cat.key && styles.catChipActive]}
            accessibilityRole="radio"
            accessibilityState={{ selected: selectedCategory === cat.key }}
          >
            <MBText style={[styles.catText, selectedCategory === cat.key && styles.catTextActive]}>
              {cat.emoji} {cat.label}
            </MBText>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={articles}
        keyExtractor={a => a.id}
        renderItem={({ item }) => <NewsCard article={item} />}
        refreshing={loading}
        onRefresh={() => loadNews(selectedCategory || undefined)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          loading ? (
            <MBText variant="body" style={styles.empty}>Loading news...</MBText>
          ) : (
            <MBCard
              title="No Articles Yet"
              emoji="📰"
              subtitle="Pull down to refresh, or check back later. News updates every 4 hours."
            />
          )
        }
      />
    </MBSafeArea>
  );
}

const styles = StyleSheet.create({
  intro: { color: COLORS.gray, marginBottom: 12 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.lightGray },
  catChipActive: { backgroundColor: COLORS.teal, borderColor: COLORS.teal },
  catText: { fontSize: 14, color: COLORS.gray },
  catTextActive: { color: COLORS.white, fontWeight: '700' },
  list: { paddingBottom: 32 },
  newsCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sourceBadge: { backgroundColor: COLORS.teal + '15', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  sourceText: { fontSize: 12, color: COLORS.teal, fontWeight: '600' },
  newsTitle: { fontSize: 18, lineHeight: 24, marginBottom: 4 },
  preview: { marginTop: 4 },
  expandedContent: { marginTop: 12 },
  summary: { lineHeight: 26 },
  biasTag: { backgroundColor: COLORS.cream, borderRadius: 8, padding: 8, marginTop: 12 },
  biasText: { fontSize: 12, color: COLORS.gray, fontStyle: 'italic', textAlign: 'center' },
  readMore: { marginTop: 12 },
  empty: { textAlign: 'center', marginTop: 40, color: COLORS.gray },
});
