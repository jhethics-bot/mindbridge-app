/**
 * Community Hub Screen
 * Shows community posts from caregivers with stage/topic tags,
 * hearts, replies, and time-ago display.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { supabase } from '../../lib/supabase';

interface CommunityPost {
  id: string;
  title: string;
  body: string;
  stage_tag: 'early' | 'middle' | 'late';
  topic_tag: 'celebrations' | 'tips' | 'questions';
  hearts_count: number;
  replies_count: number;
  created_at: string;
}

const TOPIC_COLORS: Record<string, string> = {
  celebrations: '#E9C46A',
  tips: '#2A9D8F',
  questions: '#1B2A4A',
};

const STAGE_COLORS: Record<string, string> = {
  early: '#4ADE80',
  middle: '#3B82F6',
  late: '#8B5CF6',
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

export default function CommunityScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<CommunityPost[]>([]);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    try {
      const { data } = await supabase
        .from('community_posts')
        .select('*')
        .eq('is_anonymous', false)
        .order('created_at', { ascending: false });
      setPosts(data || []);
    } catch (err) {
      console.error('Community posts error:', err);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <SafeAreaView style={st.safeArea}>
        <View style={st.center}>
          <ActivityIndicator size="large" color={COLORS.teal} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={st.safeArea}>
      <View style={st.headerRow}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={st.backBtn}
        >
          <Text style={st.backText}>← Back</Text>
        </Pressable>
        <Text style={st.headerTitle}>Community</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={st.scroll}>
        {posts.length === 0 ? (
          <View style={st.emptyState}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>💬</Text>
            <Text style={st.emptyText}>No posts yet.</Text>
            <Text style={st.emptySubtext}>Be the first to share with the community.</Text>
          </View>
        ) : (
          posts.map((post) => (
            <View key={post.id} style={st.card}>
              <Text style={st.cardTitle}>{post.title}</Text>
              <Text style={st.cardBody} numberOfLines={3}>
                {post.body}
              </Text>
              <View style={st.tagRow}>
                <View style={[st.badge, { backgroundColor: STAGE_COLORS[post.stage_tag] + '20' }]}>
                  <Text style={[st.badgeText, { color: STAGE_COLORS[post.stage_tag] }]}>
                    {post.stage_tag}
                  </Text>
                </View>
                <View style={[st.badge, { backgroundColor: TOPIC_COLORS[post.topic_tag] + '20' }]}>
                  <Text style={[st.badgeText, { color: TOPIC_COLORS[post.topic_tag] }]}>
                    {post.topic_tag}
                  </Text>
                </View>
              </View>
              <View style={st.metaRow}>
                <Text style={st.metaText}>❤️ {post.hearts_count}</Text>
                <Text style={st.metaText}>{post.replies_count} replies</Text>
                <Text style={st.metaTime}>{timeAgo(post.created_at)}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.cream },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backBtn: { padding: 8, minWidth: 60 },
  backText: { fontSize: 16, fontWeight: '600', color: COLORS.teal },
  headerTitle: { fontSize: 24, fontWeight: '700', color: COLORS.navy },
  scroll: { padding: 16, paddingBottom: 40 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 20, fontWeight: '600', color: COLORS.navy },
  emptySubtext: { fontSize: 16, color: COLORS.gray, marginTop: 4 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: COLORS.navy, marginBottom: 6 },
  cardBody: { fontSize: 15, color: COLORS.navy, lineHeight: 22, marginBottom: 10 },
  tagRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  metaText: { fontSize: 14, color: COLORS.navy, fontWeight: '500' },
  metaTime: { fontSize: 13, color: COLORS.gray, marginLeft: 'auto' },
});
