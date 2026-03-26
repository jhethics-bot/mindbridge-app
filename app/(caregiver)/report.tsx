/**
 * Caregiver Weekly Report
 * Calls generate_weekly_report RPC and displays results.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { getPetReportData, type PetReportSummary } from '../../lib/petReport';

const MOOD_EMOJIS: Record<string, string> = {
  happy: '😊', okay: '😐', confused: '😵', tired: '😴', sad: '😢',
};

interface WeeklyReport {
  patient: { name: string; stage: string };
  week_start: string;
  week_end: string;
  mood_summary: { mood: string; count: number }[];
  total_sessions: number;
  completed_sessions: number;
  active_days: number;
  favorite_activity: string;
  avg_session_minutes: number;
  med_adherence_pct: number;
  caregiver_observations: { date: string; rating: number; sleep: string; agitation: string }[];
  achievements_earned: { title: string; emoji: string }[];
}

export default function ReportScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [petReport, setPetReport] = useState<PetReportSummary | null>(null);
  const [error, setError] = useState('');

  useEffect(() => { loadReport(); }, []);

  async function loadReport() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/'); return; }

      const { data: rel } = await supabase.from('care_relationships')
        .select('patient_id').eq('caregiver_id', user.id).eq('is_primary', true).limit(1).single();

      if (!rel) { setError('No patient linked.'); setLoading(false); return; }

      const { data: rpt, error: rpcErr } = await supabase.rpc('generate_weekly_report', {
        p_patient_id: rel.patient_id,
      });

      if (rpcErr) { setError(rpcErr.message); setLoading(false); return; }
      setReport(rpt as WeeklyReport);

      // Load pet interaction summary for this period
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const petData = await getPetReportData({
        patientId: rel.patient_id,
        startDate: weekAgo,
        endDate: new Date().toISOString(),
      });
      if (petData) setPetReport(petData);
    } catch (e: any) {
      setError(e.message || 'Failed to load report');
    }
    setLoading(false);
  }

  function adherenceColor(pct: number) {
    if (pct >= 80) return '#2A9D8F';
    if (pct >= 60) return '#E9C46A';
    return '#E76F51';
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}><ActivityIndicator size="large" color="#2A9D8F" /></View>
      </SafeAreaView>
    );
  }

  if (error || !report) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Text style={s.errorText}>{error || 'No report data available.'}</Text>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backBtnText}>← Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        {/* Back button */}
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backBtnText}>← Back</Text>
        </Pressable>

        {/* Header */}
        <Text style={s.title}>Weekly Report</Text>
        <Text style={s.subtitle}>{report.patient.name} — {report.patient.stage} stage</Text>
        <Text style={s.dateRange}>{formatDate(report.week_start)} – {formatDate(report.week_end)}</Text>

        {/* Mood Summary */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Mood Summary</Text>
          <View style={s.moodRow}>
            {report.mood_summary.map((m, i) => (
              <View key={i} style={s.moodChip}>
                <Text style={{ fontSize: 28 }}>{MOOD_EMOJIS[m.mood] || '😊'}</Text>
                <Text style={s.moodCount}>{m.count}</Text>
                <Text style={s.moodLabel}>{m.mood}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Activity Summary */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Activity</Text>
          <View style={s.statsGrid}>
            <View style={s.statCard}>
              <Text style={s.statNum}>{report.total_sessions}</Text>
              <Text style={s.statLabel}>Total Sessions</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statNum}>{report.completed_sessions}</Text>
              <Text style={s.statLabel}>Completed</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statNum}>{report.active_days}</Text>
              <Text style={s.statLabel}>Active Days</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statNum}>{Math.round(report.avg_session_minutes)}</Text>
              <Text style={s.statLabel}>Avg Minutes</Text>
            </View>
          </View>
          {report.favorite_activity && (
            <View style={s.favoriteRow}>
              <Text style={s.favoriteLabel}>Favorite Activity:</Text>
              <Text style={s.favoriteValue}>{report.favorite_activity.replace(/_/g, ' ')}</Text>
            </View>
          )}
        </View>

        {/* Medication Adherence */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Medication Adherence</Text>
          <View style={s.adherenceCard}>
            <Text style={[s.adherenceNum, { color: adherenceColor(report.med_adherence_pct) }]}>
              {report.med_adherence_pct}%
            </Text>
            <Text style={s.adherenceLabel}>this week</Text>
          </View>
        </View>

        {/* Observations */}
        {report.caregiver_observations.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Observations</Text>
            {report.caregiver_observations.map((o, i) => (
              <View key={i} style={s.obsCard}>
                <View style={s.obsHeader}>
                  <Text style={s.obsDate}>{formatDate(o.date)}</Text>
                  <Text style={s.obsRating}>Rating: {o.rating}/5</Text>
                </View>
                {o.sleep && <Text style={s.obsDetail}>Sleep: {o.sleep}</Text>}
                {o.agitation && <Text style={s.obsDetail}>Agitation: {o.agitation}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Achievements */}
        {report.achievements_earned.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Achievements</Text>
            <View style={s.achieveRow}>
              {report.achievements_earned.map((a, i) => (
                <View key={i} style={s.achieveChip}>
                  <Text style={{ fontSize: 24 }}>{a.emoji}</Text>
                  <Text style={s.achieveTitle}>{a.title}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        {/* Companion Pet Summary */}
        {petReport && petReport.totalInteractions > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Companion Pet</Text>
            <View style={s.petReportCard}>
              <Text style={s.petReportName}>{petReport.petName} the {petReport.petType}</Text>
              <View style={s.petReportStats}>
                <View style={s.petReportStat}>
                  <Text style={s.petReportNum}>{petReport.totalInteractions}</Text>
                  <Text style={s.petReportLabel}>Total Interactions</Text>
                </View>
                <View style={s.petReportStat}>
                  <Text style={s.petReportNum}>{petReport.avgDailyInteractions}</Text>
                  <Text style={s.petReportLabel}>Avg/Day</Text>
                </View>
                <View style={s.petReportStat}>
                  <Text style={s.petReportNum}>{petReport.mostCommonInteractionType}</Text>
                  <Text style={s.petReportLabel}>Favorite</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F1DE' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  scroll: { padding: 20, paddingBottom: 40 },
  errorText: { fontSize: 18, color: '#1B2A4A', marginBottom: 20, textAlign: 'center' },
  backBtn: { marginBottom: 16 },
  backBtnText: { fontSize: 18, color: '#1B2A4A', fontWeight: '600' },
  title: { fontSize: 32, fontWeight: '700', color: '#1B2A4A', marginBottom: 4 },
  subtitle: { fontSize: 18, color: '#2A9D8F', fontWeight: '600', textTransform: 'capitalize', marginBottom: 2 },
  dateRange: { fontSize: 15, color: '#666', marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1B2A4A', marginBottom: 12 },
  moodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  moodChip: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, minWidth: 64 },
  moodCount: { fontSize: 20, fontWeight: '700', color: '#1B2A4A', marginTop: 4 },
  moodLabel: { fontSize: 12, color: '#666', marginTop: 2, textTransform: 'capitalize' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '47%' as any, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  statNum: { fontSize: 28, fontWeight: '700', color: '#1B2A4A' },
  statLabel: { fontSize: 13, color: '#666', marginTop: 4 },
  favoriteRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: 12,
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14,
  },
  favoriteLabel: { fontSize: 15, color: '#666', marginRight: 8 },
  favoriteValue: { fontSize: 16, fontWeight: '700', color: '#2A9D8F', textTransform: 'capitalize' },
  adherenceCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, alignItems: 'center' },
  adherenceNum: { fontSize: 48, fontWeight: '700' },
  adherenceLabel: { fontSize: 15, color: '#666', marginTop: 4 },
  obsCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 8 },
  obsHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  obsDate: { fontSize: 15, fontWeight: '600', color: '#1B2A4A' },
  obsRating: { fontSize: 14, color: '#2A9D8F', fontWeight: '600' },
  obsDetail: { fontSize: 14, color: '#666', marginTop: 2 },
  achieveRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  achieveChip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 12, padding: 12, gap: 8,
  },
  achieveTitle: { fontSize: 15, fontWeight: '600', color: '#1B2A4A' },
  petReportCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
  },
  petReportName: {
    fontSize: 18, fontWeight: '700', color: '#1B2A4A', textTransform: 'capitalize', marginBottom: 12,
  },
  petReportStats: { flexDirection: 'row', gap: 10 },
  petReportStat: {
    flex: 1, backgroundColor: '#F4F1DE', borderRadius: 12, padding: 10, alignItems: 'center',
  },
  petReportNum: { fontSize: 20, fontWeight: '700', color: '#2A9D8F' },
  petReportLabel: { fontSize: 11, color: '#666', marginTop: 2, textTransform: 'capitalize' },
});
