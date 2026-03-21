/**
 * Achievements & Streaks Screen
 *
 * Shows unlocked and locked achievements, current streak,
 * and celebrates new unlocks. Checks for newly earned
 * achievements on load and marks them as seen.
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import { supabase, getCurrentProfile } from '../../lib/supabase';

interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  emoji: string;
  category: string;
  threshold: number;
  sort_order: number;
}

interface UnlockedAchievement {
  achievement_id: string;
  unlocked_at: string;
  seen: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  milestone: 'Milestones',
  streak: 'Streaks',
  exploration: 'Discovery',
  caregiver: 'Caregiver',
  social: 'Community',
};

export default function AchievementsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlocked, setUnlocked] = useState<Map<string, UnlockedAchievement>>(new Map());
  const [newUnlocks, setNewUnlocks] = useState<Achievement[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationAchievement, setCelebrationAchievement] = useState<Achievement | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const profile = await getCurrentProfile();
      if (!profile) { router.back(); return; }
      const pid = profile.id;

      // Load all achievements and unlocked ones in parallel
      const [achRes, unlockRes, streakData, sessionCount] = await Promise.all([
        supabase.from('achievements').select('*').order('sort_order'),
        supabase.from('patient_achievements').select('*').eq('patient_id', pid),
        calculateStreak(pid),
        countSessions(pid),
      ]);

      const allAch = (achRes.data || []) as Achievement[];
      setAchievements(allAch);
      setCurrentStreak(streakData);
      setTotalSessions(sessionCount);

      const unlockedMap = new Map<string, UnlockedAchievement>();
      for (const u of (unlockRes.data || []) as UnlockedAchievement[]) {
        unlockedMap.set(u.achievement_id, u);
      }

      // Check for new achievements to unlock
      const newlyEarned = await checkNewAchievements(pid, allAch, unlockedMap, streakData, sessionCount);

      for (const ach of newlyEarned) {
        await supabase.from('patient_achievements').insert({
          patient_id: pid,
          achievement_id: ach.id,
          seen: false,
        });
        unlockedMap.set(ach.id, { achievement_id: ach.id, unlocked_at: new Date().toISOString(), seen: false });
      }

      setUnlocked(unlockedMap);
      setNewUnlocks(newlyEarned);

      // Show celebration for first unseen achievement
      const unseenAch = newlyEarned[0];
      if (unseenAch) {
        setCelebrationAchievement(unseenAch);
        setShowCelebration(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Mark all as seen
      if (newlyEarned.length > 0) {
        const ids = newlyEarned.map((a) => a.id);
        await supabase
          .from('patient_achievements')
          .update({ seen: true })
          .eq('patient_id', pid)
          .in('achievement_id', ids);
      }
    } catch (err) {
      console.error('Achievements error:', err);
    }
    setLoading(false);
  }

  async function calculateStreak(patientId: string): Promise<number> {
    // Get distinct dates with activity in descending order
    const { data } = await supabase
      .from('activity_sessions')
      .select('created_at')
      .eq('patient_id', patientId)
      .eq('completed', true)
      .order('created_at', { ascending: false });

    if (!data || data.length === 0) return 0;

    const dates = [...new Set(data.map((d) => d.created_at.split('T')[0]))].sort().reverse();
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Streak must include today or yesterday
    if (dates[0] !== today && dates[0] !== yesterday) return 0;

    let streak = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diff = (prev.getTime() - curr.getTime()) / 86400000;
      if (Math.round(diff) === 1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  async function countSessions(patientId: string): Promise<number> {
    const { count } = await supabase
      .from('activity_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('patient_id', patientId)
      .eq('completed', true);
    return count || 0;
  }

  async function checkNewAchievements(
    patientId: string,
    allAch: Achievement[],
    alreadyUnlocked: Map<string, UnlockedAchievement>,
    streak: number,
    sessions: number
  ): Promise<Achievement[]> {
    const newlyEarned: Achievement[] = [];

    for (const ach of allAch) {
      if (alreadyUnlocked.has(ach.id)) continue;

      let earned = false;

      switch (ach.category) {
        case 'milestone':
          if (ach.code === 'first_activity') earned = sessions >= 1;
          else if (ach.code === 'ten_sessions') earned = sessions >= 10;
          else if (ach.code === 'fifty_sessions') earned = sessions >= 50;
          else if (ach.code === 'hundred_sessions') earned = sessions >= 100;
          else if (ach.code === 'memory_master') {
            const { count } = await supabase
              .from('activity_sessions').select('id', { count: 'exact', head: true })
              .eq('patient_id', patientId).eq('activity', 'memory_cards').eq('completed', true);
            earned = (count || 0) >= 20;
          } else if (ach.code === 'breathing_calm') {
            const { count } = await supabase
              .from('activity_sessions').select('id', { count: 'exact', head: true })
              .eq('patient_id', patientId).eq('activity', 'breathing').eq('completed', true);
            earned = (count || 0) >= 10;
          } else if (ach.code === 'story_teller') {
            const { count } = await supabase
              .from('journal_entries').select('id', { count: 'exact', head: true })
              .eq('patient_id', patientId);
            earned = (count || 0) >= 5;
          }
          break;

        case 'streak':
          earned = streak >= ach.threshold;
          break;

        case 'exploration':
          if (ach.code === 'all_games_tried') {
            const { data: gameTypes } = await supabase
              .from('activity_sessions')
              .select('activity')
              .eq('patient_id', patientId)
              .in('activity', ['memory_cards', 'word_find', 'face_name', 'sorting', 'spelling', 'color_number']);
            const unique = new Set((gameTypes || []).map((g) => g.activity));
            earned = unique.size >= 6;
          } else if (ach.code === 'music_lover') {
            const { count } = await supabase
              .from('activity_sessions').select('id', { count: 'exact', head: true })
              .eq('patient_id', patientId).eq('activity', 'music_listen').eq('completed', true);
            earned = (count || 0) >= 10;
          } else if (ach.code === 'photo_memories') {
            const { count } = await supabase
              .from('activity_sessions').select('id', { count: 'exact', head: true })
              .eq('patient_id', patientId).eq('activity', 'photo_album').eq('completed', true);
            earned = (count || 0) >= 5;
          } else if (ach.code === 'first_verse') {
            const { count } = await supabase
              .from('daily_verses').select('id', { count: 'exact', head: true })
              .eq('patient_id', patientId).eq('was_viewed', true);
            earned = (count || 0) >= 1;
          }
          break;

        case 'social':
          if (ach.code === 'community_voice') {
            const { count } = await supabase
              .from('community_posts').select('id', { count: 'exact', head: true })
              .eq('author_id', patientId);
            earned = (count || 0) >= 1;
          }
          break;

        case 'caregiver':
          // Caregiver achievements checked from caregiver context, skip here
          break;
      }

      if (earned) newlyEarned.push(ach);
    }

    return newlyEarned;
  }

  if (loading) {
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.center}><ActivityIndicator size="large" color={COLORS.teal} /></View>
      </SafeAreaView>
    );
  }

  // Celebration overlay
  if (showCelebration && celebrationAchievement) {
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.celebrationContainer}>
          <Text style={{ fontSize: 80, marginBottom: 12 }}>{celebrationAchievement.emoji}</Text>
          <Text style={st.celebrationTitle}>Achievement Unlocked!</Text>
          <Text style={st.celebrationName}>{celebrationAchievement.title}</Text>
          <Text style={st.celebrationDesc}>{celebrationAchievement.description}</Text>
          <Pressable
            style={st.celebrationBtn}
            onPress={() => setShowCelebration(false)}
          >
            <Text style={st.celebrationBtnText}>Wonderful!</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Group achievements by category
  const grouped: Record<string, Achievement[]> = {};
  for (const ach of achievements) {
    if (!grouped[ach.category]) grouped[ach.category] = [];
    grouped[ach.category].push(ach);
  }

  const unlockedCount = unlocked.size;
  const totalCount = achievements.length;

  return (
    <SafeAreaView style={st.safe}>
      <ScrollView contentContainerStyle={st.scroll}>
        <Pressable onPress={() => router.back()} style={st.backBtn}>
          <Text style={st.backText}>← Home</Text>
        </Pressable>

        <Text style={st.title}>Achievements</Text>

        {/* Streak & Stats Banner */}
        <View style={st.statsRow}>
          <View style={st.statCard}>
            <Text style={{ fontSize: 28 }}>🔥</Text>
            <Text style={st.statValue}>{currentStreak}</Text>
            <Text style={st.statLabel}>Day Streak</Text>
          </View>
          <View style={st.statCard}>
            <Text style={{ fontSize: 28 }}>⭐</Text>
            <Text style={st.statValue}>{unlockedCount}/{totalCount}</Text>
            <Text style={st.statLabel}>Earned</Text>
          </View>
          <View style={st.statCard}>
            <Text style={{ fontSize: 28 }}>🎯</Text>
            <Text style={st.statValue}>{totalSessions}</Text>
            <Text style={st.statLabel}>Sessions</Text>
          </View>
        </View>

        {/* Achievement Categories */}
        {Object.entries(grouped).map(([category, achs]) => (
          <View key={category} style={st.section}>
            <Text style={st.sectionTitle}>{CATEGORY_LABELS[category] || category}</Text>
            {achs.map((ach) => {
              const isUnlocked = unlocked.has(ach.id);
              const isNew = newUnlocks.some((n) => n.id === ach.id);
              return (
                <View
                  key={ach.id}
                  style={[st.achCard, !isUnlocked && st.achLocked, isNew && st.achNew]}
                >
                  <Text style={[st.achEmoji, !isUnlocked && { opacity: 0.3 }]}>
                    {ach.emoji}
                  </Text>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={st.achHeader}>
                      <Text style={[st.achTitle, !isUnlocked && { color: COLORS.gray }]}>
                        {ach.title}
                      </Text>
                      {isNew && <Text style={st.newBadge}>NEW</Text>}
                    </View>
                    <Text style={st.achDesc}>{ach.description}</Text>
                    {isUnlocked && (
                      <Text style={st.achDate}>
                        Earned {new Date(unlocked.get(ach.id)!.unlocked_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </Text>
                    )}
                  </View>
                  {isUnlocked ? (
                    <Text style={{ fontSize: 20 }}>✅</Text>
                  ) : (
                    <Text style={{ fontSize: 16, color: COLORS.lightGray }}>🔒</Text>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.cream },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: A11Y.screenPadding, paddingBottom: 40 },
  backBtn: { marginBottom: 8 },
  backText: { fontSize: 16, color: COLORS.teal, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.navy, marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: 16, padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  statValue: { fontSize: 24, fontWeight: '700', color: COLORS.navy, marginTop: 4 },
  statLabel: { fontSize: 11, color: COLORS.gray, textTransform: 'uppercase', fontWeight: '600', marginTop: 2 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.navy, marginBottom: 10 },
  achCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: 14, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  achLocked: { backgroundColor: COLORS.cream, borderWidth: 1, borderColor: COLORS.lightGray },
  achNew: { borderWidth: 2, borderColor: COLORS.gold, backgroundColor: COLORS.glow },
  achEmoji: { fontSize: 32 },
  achHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  achTitle: { fontSize: 16, fontWeight: '600', color: COLORS.navy },
  achDesc: { fontSize: 13, color: COLORS.gray, marginTop: 2 },
  achDate: { fontSize: 11, color: COLORS.teal, marginTop: 3 },
  newBadge: {
    fontSize: 10, fontWeight: '700', color: COLORS.white,
    backgroundColor: COLORS.gold, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1,
  },
  celebrationContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: A11Y.screenPadding, backgroundColor: COLORS.glow,
  },
  celebrationTitle: { fontSize: 24, fontWeight: '700', color: COLORS.navy, marginBottom: 8 },
  celebrationName: { fontSize: 28, fontWeight: '700', color: COLORS.teal, marginBottom: 4 },
  celebrationDesc: { fontSize: 16, color: COLORS.gray, marginBottom: 32 },
  celebrationBtn: { backgroundColor: COLORS.teal, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 40 },
  celebrationBtnText: { fontSize: 20, fontWeight: '700', color: COLORS.white },
});
