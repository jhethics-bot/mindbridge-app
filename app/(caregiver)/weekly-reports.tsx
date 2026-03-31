/**
 * Weekly Reports Screen
 * Lists AI-generated weekly summaries for the linked patient.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { supabase, getCurrentProfile, getCaregiverPatients } from '../../lib/supabase';

interface WeeklyReport {
  id: string;
  patient_id: string;
  caregiver_id: string;
  week_start: string;
  week_end: string;
  report_data: {
    mood_summary?: Record<string, number>;
    total_mood_entries?: number;
    game_sessions?: number;
    total_activity_minutes?: number;
    avg_mind_score?: number | null;
    total_meals_logged?: number;
    total_hydration_ml?: number;
    medication_compliance_pct?: number | null;
    pet_interactions?: number;
    achievements_earned?: number;
  };
  narrative: string | null;
  created_at: string;
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start + 'T12:00:00');
  const e = new Date(end + 'T12:00:00');
  return `${s.toLocaleDateString([], { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

function ReportCard({ report }: { report: WeeklyReport }) {
  const [expanded, setExpanded] = useState(false);
  const d = report.report_data;

  function handleShare() {
    const summary = [
      `MindBridge Weekly Report`,
      `Week: ${formatDateRange(report.week_start, report.week_end)}`,
      ``,
      report.narrative ?? 'No narrative available.',
      ``,
      `Sessions: ${d.game_sessions ?? 0}`,
      `MIND Avg: ${d.avg_mind_score != null ? d.avg_mind_score : '--'}`,
      `Hydration: ${d.total_hydration_ml ?? 0}ml`,
      `Med Compliance: ${d.medication_compliance_pct != null ? `${d.medication_compliance_pct}%` : '--'}`,
    ].join('\n');
    Alert.alert('Export Report', summary);
  }

  return (
    <View style={st.card}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setExpanded(prev => !prev);
        }}
        accessibilityRole="button"
        accessibilityLabel={`Weekly report ${formatDateRange(report.week_start, report.week_end)}`}
      >
        <Text style={st.cardDate}>{formatDateRange(report.week_start, report.week_end)}</Text>

        {/* Key stats row */}
        <View style={st.statsRow}>
          <View style={st.statBox}>
            <Text style={st.statValue}>{d.game_sessions ?? 0}</Text>
            <Text style={st.statLabel}>Sessions</Text>
          </View>
          <View style={st.statBox}>
            <Text style={st.statValue}>{d.avg_mind_score != null ? d.avg_mind_score : '--'}</Text>
            <Text style={st.statLabel}>MIND Avg</Text>
          </View>
          <View style={st.statBox}>
            <Text style={st.statValue}>{d.total_hydration_ml != null ? `${Math.round(d.total_hydration_ml / 100) / 10}L` : '--'}</Text>
            <Text style={st.statLabel}>Hydration</Text>
          </View>
          <View style={st.statBox}>
            <Text style={st.statValue}>{d.medication_compliance_pct != null ? `${d.medication_compliance_pct}%` : '--'}</Text>
            <Text style={st.statLabel}>Med %</Text>
          </View>
        </View>

        {/* AI narrative */}
        {report.narrative ? (
          <Text style={st.narrative} numberOfLines={expanded ? undefined : 2}>
            {report.narrative}
          </Text>
        ) : null}

        <Text style={st.expandHint}>{expanded ? 'Tap to collapse' : 'Tap for full report'}</Text>
      </Pressable>

      {expanded && (
        <View style={st.detailSection}>
          <Text style={st.detailTitle}>Detailed Breakdown</Text>
          <View style={st.detailRow}>
            <Text style={st.detailKey}>Mood entries</Text>
            <Text style={st.detailVal}>{d.total_mood_entries ?? 0}</Text>
          </View>
          <View style={st.detailRow}>
            <Text style={st.detailKey}>Activity minutes</Text>
            <Text style={st.detailVal}>{d.total_activity_minutes ?? 0} min</Text>
          </View>
          <View style={st.detailRow}>
            <Text style={st.detailKey}>Meals logged</Text>
            <Text style={st.detailVal}>{d.total_meals_logged ?? 0}</Text>
          </View>
          <View style={st.detailRow}>
            <Text style={st.detailKey}>Pet interactions</Text>
            <Text style={st.detailVal}>{d.pet_interactions ?? 0}</Text>
          </View>
          <View style={st.detailRow}>
            <Text style={st.detailKey}>Achievements</Text>
            <Text style={st.detailVal}>{d.achievements_earned ?? 0}</Text>
          </View>
          {d.mood_summary && Object.keys(d.mood_summary).length > 0 && (
            <View style={st.moodBreakdown}>
              <Text style={st.detailKey}>Mood breakdown:</Text>
              <View style={st.moodChips}>
                {Object.entries(d.mood_summary).map(([mood, count]) => (
                  <View key={mood} style={st.moodChip}>
                    <Text style={st.moodChipText}>{mood}: {count}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [st.shareBtn, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel="Share as PDF"
          >
            <Text style={st.shareBtnText}>Share as PDF</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function WeeklyReportsScreen() {
  const router = useRouter();
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadReports(); }, []);

  async function loadReports() {
    try {
      const profile = await getCurrentProfile();
      if (!profile) { router.replace('/'); return; }

      const { data, error } = await supabase
        .from('weekly_reports')
        .select('*')
        .eq('caregiver_id', profile.id)
        .order('week_start', { ascending: false })
        .limit(20);

      if (!error) {
        setReports(data ?? []);
      }
    } catch (err) {
      console.error('Weekly reports error:', err);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <SafeAreaView style={st.safeArea}>
        <View style={st.center}><ActivityIndicator size="large" color={COLORS.teal} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={st.safeArea}>
      <ScrollView contentContainerStyle={st.scroll}>
        <View style={st.header}>
          <Pressable onPress={() => router.back()} style={st.backBtn} accessibilityRole="button" accessibilityLabel="Back">
            <Text style={st.backText}>← Back</Text>
          </Pressable>
          <Text style={st.title}>Weekly Reports</Text>
          <Text style={st.subtitle}>AI-generated summaries, most recent first</Text>
        </View>

        {reports.length === 0 ? (
          <View style={st.emptyState}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>📋</Text>
            <Text style={st.emptyText}>No reports yet.</Text>
            <Text style={st.emptySubtext}>Reports are generated automatically each week.</Text>
          </View>
        ) : (
          reports.map(r => <ReportCard key={r.id} report={r} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.cream },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 24 },
  backBtn: { marginBottom: 8 },
  backText: { fontSize: 16, color: COLORS.teal, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.navy },
  subtitle: { fontSize: 14, color: COLORS.gray, marginTop: 4 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardDate: { fontSize: 16, fontWeight: '700', color: COLORS.navy, marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statBox: { flex: 1, alignItems: 'center', backgroundColor: COLORS.cream, borderRadius: 10, padding: 10 },
  statValue: { fontSize: 20, fontWeight: '700', color: COLORS.teal },
  statLabel: { fontSize: 11, color: COLORS.gray, marginTop: 2, textAlign: 'center' },
  narrative: { fontSize: 14, color: COLORS.navy, lineHeight: 20, marginBottom: 8 },
  expandHint: { fontSize: 12, color: COLORS.teal, fontWeight: '600', textAlign: 'right' },
  detailSection: { marginTop: 12, borderTopWidth: 1, borderTopColor: COLORS.lightGray, paddingTop: 12 },
  detailTitle: { fontSize: 15, fontWeight: '700', color: COLORS.navy, marginBottom: 10 },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: COLORS.lightGray,
  },
  detailKey: { fontSize: 14, color: COLORS.gray },
  detailVal: { fontSize: 14, fontWeight: '600', color: COLORS.navy },
  moodBreakdown: { marginTop: 8 },
  moodChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  moodChip: { backgroundColor: COLORS.teal + '20', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  moodChipText: { fontSize: 13, color: COLORS.teal, fontWeight: '600' },
  shareBtn: {
    marginTop: 14,
    backgroundColor: COLORS.navy,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  shareBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 20, fontWeight: '600', color: COLORS.navy, marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: COLORS.gray, textAlign: 'center' },
});
