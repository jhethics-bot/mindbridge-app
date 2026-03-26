/**
 * News Reader — Caregiver Screen
 * Full-featured news with categories, bias badges, share, and source links.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, Linking, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import { useNewsStore } from '../../stores/newsStore';
import type { NewsArticle } from '../../lib/news-reader';

const CATEGORIES = [
  { key: null, label: 'All', emoji: '📰' },
  { key: 'research', label: 'Research', emoji: '🔬' },
  { key: 'caregiving', label: 'Caregiving', emoji: '💛' },
  { key: 'treatment', label: 'Treatment', emoji: '💊' },
  { key: 'policy', label: 'Policy', emoji: '🏛️' },
  { key: 'lifestyle', label: 'Lifestyle', emoji: '🌿' },
];

const CATEGORY_COLORS: Record<string, string> = {
  research: '#6366F1',
  caregiving: '#F59E0B',
  treatment: '#EC4899',
  policy: '#8B5CF6',
  lifestyle: '#10B981',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function CaregiverNewsCard({ article }: { article: NewsArticle }) {
  const [expanded, setExpanded] = useState(false);
  const catColor = CATEGORY_COLORS[article.category] ?? COLORS.teal;

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `${article.title}\n\n${article.summary}\n\nSource: ${article.source_url}`,
      });
    } catch {}
  };

  return (
    <Pressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setExpanded(!expanded); }}
      style={st.card}
    >
      <View style={st.cardHeader}>
        <View style={st.headerLeft}>
          <View style={[st.catBadge, { backgroundColor: catColor + '20' }]}>
            <Text style={[st.catText, { color: catColor }]}>{article.category}</Text>
          </View>
          {article.bias_removed && (
            <View style={st.biasBadge}>
              <Text style={st.biasText}>AI Reviewed</Text>
            </View>
          )}
        </View>
        <Text style={st.dateText}>{formatDate(article.published_at)}</Text>
      </View>

      <Text style={st.headline}>{article.title}</Text>
      <Text style={st.source}>{article.source}</Text>

      {expanded ? (
        <View style={st.expandedContent}>
          <Text style={st.summary}>{article.summary}</Text>

          <View style={st.actionRow}>
            <Pressable onPress={() => Linking.openURL(article.source_url)} style={st.actionBtn}>
              <Text style={st.actionText}>Read Full Article →</Text>
            </Pressable>
            <Pressable onPress={handleShare} style={[st.actionBtn, st.shareBtn]}>
              <Text style={[st.actionText, { color: COLORS.navy }]}>Share</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Text style={st.preview} numberOfLines={2}>{article.summary}</Text>
      )}
    </Pressable>
  );
}

export default function CaregiverNewsScreen() {
  const router = useRouter();
  const { articles, loading, loadNews, selectedCategory, setCategory } = useNewsStore();

  useEffect(() => { loadNews(); }, []);

  return (
    <SafeAreaView style={st.safe}>
      <View style={st.headerRow}>
        <Pressable onPress={() => router.back()}>
          <Text style={st.backText}>← Back</Text>
        </Pressable>
        <Text style={st.title}>News</Text>
        <View style={{ width: 48 }} />
      </View>

      <Text style={st.intro}>
        Alzheimer's news, rewritten for clarity with bias removed by AI.
      </Text>

      {/* Category filter */}
      <View style={st.catRow}>
        {CATEGORIES.map(cat => (
          <Pressable
            key={cat.label}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCategory(cat.key); }}
            style={[st.catChip, selectedCategory === cat.key && st.catChipActive]}
          >
            <Text style={[st.catChipText, selectedCategory === cat.key && st.catChipTextActive]}>
              {cat.emoji} {cat.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={articles}
        keyExtractor={a => a.id}
        renderItem={({ item }) => <CaregiverNewsCard article={item} />}
        refreshing={loading}
        onRefresh={() => loadNews(selectedCategory || undefined)}
        contentContainerStyle={st.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={st.empty}>{loading ? 'Loading news...' : 'No articles yet. Pull to refresh.'}</Text>
        }
      />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.cream },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: A11Y.screenPadding, paddingTop: 8, paddingBottom: 4,
  },
  backText: { fontSize: 18, color: COLORS.teal, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.navy },
  intro: {
    fontSize: 14, color: COLORS.gray, paddingHorizontal: A11Y.screenPadding, marginBottom: 12,
  },
  catRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: A11Y.screenPadding, marginBottom: 12,
  },
  catChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.lightGray,
  },
  catChipActive: { backgroundColor: COLORS.teal, borderColor: COLORS.teal },
  catChipText: { fontSize: 13, color: COLORS.gray },
  catChipTextActive: { color: COLORS.white, fontWeight: '700' },
  list: { paddingHorizontal: A11Y.screenPadding, paddingBottom: 32 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
  },
  headerLeft: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  catBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  catText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  biasBadge: { backgroundColor: COLORS.cream, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  biasText: { fontSize: 11, color: COLORS.gray, fontWeight: '500' },
  dateText: { fontSize: 12, color: COLORS.gray },
  headline: { fontSize: 17, fontWeight: '600', color: COLORS.navy, lineHeight: 24 },
  source: { fontSize: 13, color: COLORS.teal, fontWeight: '500', marginTop: 2 },
  preview: { fontSize: 14, color: COLORS.gray, marginTop: 6 },
  expandedContent: { marginTop: 12 },
  summary: { fontSize: 15, color: COLORS.navy, lineHeight: 24 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  actionBtn: {
    flex: 1, backgroundColor: COLORS.teal, borderRadius: 10, paddingVertical: 10, alignItems: 'center',
  },
  shareBtn: { backgroundColor: COLORS.lightGray },
  actionText: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  empty: { textAlign: 'center', marginTop: 40, color: COLORS.gray, fontSize: 16 },
});
