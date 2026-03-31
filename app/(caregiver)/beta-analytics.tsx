/**
 * Beta Analytics Screen
 * Hidden screen — only rendered when EXPO_PUBLIC_BETA_MODE === 'true'.
 * Shows engagement metrics for the beta program.
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
import {
  getDAUMAURatio,
  getDailyActiveUsers,
  getMonthlyActiveUsers,
  getWeeklyRetention,
  getFeatureUsage,
  getAvgSessionsPerWeek,
  getMINDScoreTrend,
  getHydrationComplianceTrend,
  getMedicationCompliance,
} from '../../lib/betaAnalytics';
import { supabase } from '../../lib/supabase';

const IS_BETA = process.env.EXPO_PUBLIC_BETA_MODE === 'true';

const DAU_MAU_TARGET = 0.30;
const RETENTION_TARGET = 60;

interface AnalyticsData {
  dau: number;
  mau: number;
  dauMauRatio: number;
  weeklyRetentionW2: number;
  weeklyRetentionW4: number;
  featureUsage: Record<string, number>;
  avgSessionsPerWeek: number;
  mindTrend: Array<{ week: string; avgScore: number }>;
  hydrationTrend: Array<{ week: string; pctMeetingTarget: number }>;
  medCompliance: number;
  totalPatients: number;
  totalCaregivers: number;
}

function MetricRow({ label, value, target, unit = '' }: { label: string; value: number; target?: number; unit?: string }) {
  const meetsTarget = target != null ? value >= target : null;
  return (
    <View style={st.metricRow}>
      <View style={{ flex: 1 }}>
        <Text style={st.metricLabel}>{label}</Text>
        {target != null && (
          <Text style={st.metricTarget}>Target: {target}{unit}</Text>
        )}
      </View>
      <View style={[st.metricBadge, meetsTarget === true && st.metricGood, meetsTarget === false && st.metricWarn]}>
        <Text style={[st.metricValue, meetsTarget === false && { color: '#92400E' }]}>
          {value}{unit}
        </Text>
      </View>
    </View>
  );
}

function TrendTable({ rows, valueKey, valueLabel }: {
  rows: Array<Record<string, any>>;
  valueKey: string;
  valueLabel: string;
}) {
  return (
    <View>
      {rows.map((r, i) => (
        <View key={i} style={st.trendRow}>
          <Text style={st.trendWeek}>{r.week}</Text>
          <Text style={st.trendValue}>{r[valueKey]}{valueLabel}</Text>
        </View>
      ))}
    </View>
  );
}

export default function BetaAnalyticsScreen() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!IS_BETA) { setLoading(false); return; }
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      const [
        dau,
        mau,
        ratio,
        retW2,
        retW4,
        featureUsage,
        avgSessions,
        mindTrend,
        hydrationTrend,
        medCompliance,
        patientsRes,
        caregiversRes,
      ] = await Promise.all([
        getDailyActiveUsers(new Date()),
        getMonthlyActiveUsers(),
        getDAUMAURatio(),
        getWeeklyRetention(2),
        getWeeklyRetention(4),
        getFeatureUsage(30),
        getAvgSessionsPerWeek(),
        getMINDScoreTrend(6),
        getHydrationComplianceTrend(6),
        getMedicationCompliance(30),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'patient'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'caregiver'),
      ]);

      setData({
        dau,
        mau,
        dauMauRatio: ratio,
        weeklyRetentionW2: retW2,
        weeklyRetentionW4: retW4,
        featureUsage,
        avgSessionsPerWeek: avgSessions,
        mindTrend,
        hydrationTrend,
        medCompliance,
        totalPatients: patientsRes.count ?? 0,
        totalCaregivers: caregiversRes.count ?? 0,
      });
    } catch (err) {
      console.error('Beta analytics error:', err);
    }
    setLoading(false);
  }

  function handleExport() {
    if (!data) return;
    const lines = [
      'MindBridge Beta Analytics Report',
      `Generated: ${new Date().toLocaleDateString()}`,
      '',
      `DAU: ${data.dau}`,
      `MAU: ${data.mau}`,
      `DAU/MAU Ratio: ${(data.dauMauRatio * 100).toFixed(1)}% (target: 30%)`,
      `Week-2 Retention: ${data.weeklyRetentionW2}% (target: 60%)`,
      `Week-4 Retention: ${data.weeklyRetentionW4}%`,
      `Avg Sessions/Week: ${data.avgSessionsPerWeek}`,
      `Med Compliance (30d): ${data.medCompliance}%`,
      `Total Patients: ${data.totalPatients}`,
      `Total Caregivers: ${data.totalCaregivers}`,
      '',
      'Feature Usage (30d):',
      ...Object.entries(data.featureUsage).map(([k, v]) => `  ${k}: ${v}`),
    ].join('\n');
    Alert.alert('Beta Report', lines);
  }

  if (!IS_BETA) {
    return (
      <SafeAreaView style={st.safeArea}>
        <View style={st.center}>
          <Text style={st.hiddenText}>Beta mode is not enabled.</Text>
          <Text style={{ fontSize: 13, color: COLORS.gray, marginTop: 8 }}>Set EXPO_PUBLIC_BETA_MODE=true to access.</Text>
          <Pressable onPress={() => router.back()} style={st.backBtnCenter}>
            <Text style={st.backText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={st.safeArea}>
        <View style={st.center}><ActivityIndicator size="large" color={COLORS.teal} /></View>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={st.safeArea}>
        <View style={st.center}><Text style={st.hiddenText}>Failed to load analytics.</Text></View>
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
          <Text style={st.title}>Beta Analytics</Text>
          <Text style={st.subtitle}>Internal metrics — not for distribution</Text>
        </View>

        {/* Enrollment */}
        <View style={st.card}>
          <Text style={st.cardTitle}>Enrollment</Text>
          <View style={st.enrollRow}>
            <View style={st.enrollBox}>
              <Text style={st.enrollNum}>{data.totalPatients}</Text>
              <Text style={st.enrollLabel}>Patients Enrolled</Text>
            </View>
            <View style={st.enrollBox}>
              <Text style={st.enrollNum}>{data.totalCaregivers}</Text>
              <Text style={st.enrollLabel}>Caregivers Active</Text>
            </View>
          </View>
        </View>

        {/* DAU/MAU */}
        <View style={st.card}>
          <Text style={st.cardTitle}>Engagement</Text>
          <MetricRow label="Daily Active Users" value={data.dau} />
          <MetricRow label="Monthly Active Users" value={data.mau} />
          <MetricRow
            label="DAU/MAU Ratio"
            value={Math.round(data.dauMauRatio * 100)}
            target={Math.round(DAU_MAU_TARGET * 100)}
            unit="%"
          />
          <MetricRow label="Avg Sessions / Week" value={data.avgSessionsPerWeek} />
        </View>

        {/* Retention */}
        <View style={st.card}>
          <Text style={st.cardTitle}>Weekly Retention</Text>
          <MetricRow label="Week 2 Retention" value={data.weeklyRetentionW2} target={RETENTION_TARGET} unit="%" />
          <MetricRow label="Week 4 Retention" value={data.weeklyRetentionW4} unit="%" />
        </View>

        {/* Feature usage */}
        <View style={st.card}>
          <Text style={st.cardTitle}>Feature Usage (30d)</Text>
          {Object.entries(data.featureUsage)
            .sort(([, a], [, b]) => b - a)
            .map(([feature, count]) => (
              <View key={feature} style={st.featureRow}>
                <Text style={st.featureLabel}>{feature.replace(/_/g, ' ')}</Text>
                <Text style={st.featureCount}>{count}</Text>
              </View>
            ))}
        </View>

        {/* MIND Score Trend */}
        <View style={st.card}>
          <Text style={st.cardTitle}>MIND Score Trend</Text>
          <TrendTable rows={data.mindTrend} valueKey="avgScore" valueLabel=" pts" />
        </View>

        {/* Hydration Compliance Trend */}
        <View style={st.card}>
          <Text style={st.cardTitle}>Hydration Compliance Trend</Text>
          <TrendTable rows={data.hydrationTrend} valueKey="pctMeetingTarget" valueLabel="%" />
        </View>

        {/* Medication Compliance */}
        <View style={st.card}>
          <Text style={st.cardTitle}>Medication Compliance (30d)</Text>
          <MetricRow label="Overall Compliance" value={data.medCompliance} unit="%" />
        </View>

        {/* Export */}
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); handleExport(); }}
          style={({ pressed }) => [st.exportBtn, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Export Beta Report"
        >
          <Text style={st.exportBtnText}>Export Beta Report</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.cream },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  hiddenText: { fontSize: 18, fontWeight: '600', color: COLORS.navy },
  backBtnCenter: { marginTop: 20 },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 24 },
  backBtn: { marginBottom: 8 },
  backText: { fontSize: 16, color: COLORS.teal, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.navy },
  subtitle: { fontSize: 13, color: COLORS.coral, marginTop: 4, fontWeight: '600' },
  card: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.navy, marginBottom: 12 },
  enrollRow: { flexDirection: 'row', gap: 12 },
  enrollBox: { flex: 1, alignItems: 'center', backgroundColor: COLORS.cream, borderRadius: 12, padding: 16 },
  enrollNum: { fontSize: 36, fontWeight: '700', color: COLORS.teal },
  enrollLabel: { fontSize: 13, color: COLORS.gray, marginTop: 4, textAlign: 'center' },
  metricRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: COLORS.lightGray,
  },
  metricLabel: { fontSize: 14, color: COLORS.navy, fontWeight: '500' },
  metricTarget: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  metricBadge: { backgroundColor: COLORS.cream, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 },
  metricGood: { backgroundColor: '#D1FAE5' },
  metricWarn: { backgroundColor: '#FEF3C7' },
  metricValue: { fontSize: 16, fontWeight: '700', color: COLORS.teal },
  featureRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7,
    borderBottomWidth: 1, borderBottomColor: COLORS.lightGray,
  },
  featureLabel: { fontSize: 14, color: COLORS.navy, textTransform: 'capitalize' },
  featureCount: { fontSize: 14, fontWeight: '700', color: COLORS.teal },
  trendRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7,
    borderBottomWidth: 1, borderBottomColor: COLORS.lightGray,
  },
  trendWeek: { fontSize: 13, color: COLORS.gray },
  trendValue: { fontSize: 14, fontWeight: '700', color: COLORS.navy },
  exportBtn: {
    backgroundColor: COLORS.navy, borderRadius: 14, padding: 16,
    alignItems: 'center', marginTop: 8,
  },
  exportBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
});
