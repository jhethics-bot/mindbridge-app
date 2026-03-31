/**
 * Doctor Visit Screen
 * Generates a comprehensive health summary for physician appointments.
 * Pulls data via the doctor-visit-pdf edge function.
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Share, Alert, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import { supabase } from '../../lib/supabase';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ReportHeader {
  patientName: string;
  patientStage: string;
  periodDays: number;
  periodStart: string;
  periodEnd: string;
}

interface MedicationCompliance {
  totalDoses: number;
  takenDoses: number;
  missedDoses: number;
  skippedDoses: number;
  complianceRate: number;
  activemedications: { name: string; dosage: string | null }[];
}

interface HydrationSummary {
  totalGlasses: number;
  totalOz: number;
  avgGlassesPerDay: number;
  daysTracked: number;
  goalGlassesPerDay: number;
  goalMetPercent: number;
}

interface CareAlerts {
  total: number;
  unresolved: number;
  bySeverity: Record<string, number>;
  recent: { type: string; severity: string; message: string; resolved: boolean; date: string }[];
}

interface MoodSummary {
  totalCheckins: number;
  distribution: Record<string, number>;
  dominantMood: string;
}

interface CognitiveSummary {
  totalSessions: number;
  completedSessions: number;
  completionRate: number;
  totalEngagementMinutes: number;
  activeDays: number;
}

interface NutritionSummary {
  totalMealsLogged: number;
  mealsPerDay: number;
  byMealType: Record<string, number>;
  daysTracked: number;
}

interface DoctorVisitReport {
  header: ReportHeader;
  medicationCompliance: MedicationCompliance;
  hydrationSummary: HydrationSummary;
  careAlerts: CareAlerts;
  moodSummary: MoodSummary;
  cognitiveSummary: CognitiveSummary;
  nutritionSummary: NutritionSummary;
  generatedAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const MOOD_EMOJI: Record<string, string> = {
  happy: '😊', okay: '😐', confused: '😵', tired: '😴', sad: '😢',
};

function complianceColor(rate: number): string {
  if (rate >= 80) return COLORS.teal;
  if (rate >= 60) return COLORS.gold;
  return COLORS.coral;
}

function severityColor(severity: string): string {
  if (severity === 'high') return COLORS.coral;
  if (severity === 'medium') return COLORS.gold;
  return COLORS.teal;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Component ─────────────────────────────────────────────────────────────────

const PERIOD_OPTIONS = [30, 60, 90] as const;
type PeriodDays = typeof PERIOD_OPTIONS[number];

export default function DoctorVisitScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<PeriodDays>(30);
  const [report, setReport] = useState<DoctorVisitReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function generateReport() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    setError('');
    setReport(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('Not signed in.'); setIsLoading(false); return; }

      const { data: rel } = await supabase
        .from('care_relationships')
        .select('patient_id')
        .eq('caregiver_id', user.id)
        .eq('is_primary', true)
        .limit(1)
        .single();

      if (!rel) { setError('No patient linked to your account.'); setIsLoading(false); return; }

      const { data, error: fnErr } = await supabase.functions.invoke('doctor-visit-pdf', {
        body: { patient_id: rel.patient_id, caregiver_id: user.id, period_days: period },
      });

      if (fnErr) { setError(fnErr.message || 'Failed to generate report.'); setIsLoading(false); return; }
      setReport(data as DoctorVisitReport);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      setError(e.message || 'Something went wrong.');
    }
    setIsLoading(false);
  }

  async function handleShare() {
    if (!report) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { header, medicationCompliance, hydrationSummary, moodSummary, cognitiveSummary, nutritionSummary, careAlerts } = report;
    const text = [
      `NeuBridge Doctor Visit Summary`,
      `Patient: ${header.patientName} (${capitalize(header.patientStage)} stage)`,
      `Period: ${header.periodStart} to ${header.periodEnd} (${header.periodDays} days)`,
      ``,
      `MEDICATION COMPLIANCE`,
      `  Rate: ${medicationCompliance.complianceRate}% (${medicationCompliance.takenDoses}/${medicationCompliance.totalDoses} doses)`,
      `  Missed: ${medicationCompliance.missedDoses}  Skipped: ${medicationCompliance.skippedDoses}`,
      ``,
      `HYDRATION`,
      `  Avg: ${hydrationSummary.avgGlassesPerDay} glasses/day  Goal met: ${hydrationSummary.goalMetPercent}%`,
      `  Total oz over period: ${hydrationSummary.totalOz}`,
      ``,
      `MOOD`,
      `  Check-ins: ${moodSummary.totalCheckins}  Dominant: ${moodSummary.dominantMood}`,
      `  ${Object.entries(moodSummary.distribution).map(([k, v]) => `${k}: ${v}`).join(', ')}`,
      ``,
      `COGNITIVE ACTIVITY`,
      `  Sessions: ${cognitiveSummary.totalSessions}  Completed: ${cognitiveSummary.completedSessions} (${cognitiveSummary.completionRate}%)`,
      `  Total engagement: ${cognitiveSummary.totalEngagementMinutes} min over ${cognitiveSummary.activeDays} active days`,
      ``,
      `NUTRITION`,
      `  Meals logged: ${nutritionSummary.totalMealsLogged} (${nutritionSummary.mealsPerDay}/day over ${nutritionSummary.daysTracked} days)`,
      ``,
      `CARE ALERTS`,
      `  Total: ${careAlerts.total}  Unresolved: ${careAlerts.unresolved}`,
      ``,
      `Generated by NeuBridge on ${new Date(report.generatedAt).toLocaleDateString()}`,
    ].join('\n');

    try {
      await Share.share({ message: text, title: 'NeuBridge Doctor Visit Summary' });
    } catch {}
  }

  return (
    <SafeAreaView style={st.safeArea}>
      <ScrollView contentContainerStyle={st.scroll}>
        {/* Header */}
        <View style={st.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={st.backBtn}>← Back</Text>
          </Pressable>
        </View>

        {/* NeuBridge branding */}
        <View style={st.brandRow}>
          <Text style={st.brandName}>NeuBridge</Text>
          <Text style={st.brandTagline}>Doctor Visit Summary</Text>
        </View>

        {/* Period selector */}
        <View style={st.section}>
          <Text style={st.sectionTitle}>Report Period</Text>
          <View style={st.periodRow}>
            {PERIOD_OPTIONS.map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => { setPeriod(p); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[st.periodBtn, period === p && st.periodBtnActive]}
              >
                <Text style={[st.periodBtnText, period === p && st.periodBtnTextActive]}>{p} days</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Generate CTA */}
        <Pressable onPress={generateReport} disabled={isLoading} style={[st.generateBtn, isLoading && { opacity: 0.6 }]}>
          {isLoading
            ? <ActivityIndicator color={COLORS.navy} />
            : <Text style={st.generateBtnText}>Generate for Appointment</Text>
          }
        </Pressable>

        {error ? <Text style={st.errorText}>{error}</Text> : null}

        {/* Report sections */}
        {report && (
          <>
            {/* Report header */}
            <View style={st.reportHeader}>
              <Text style={st.reportPatientName}>{report.header.patientName}</Text>
              <Text style={st.reportMeta}>{capitalize(report.header.patientStage)} stage · {report.header.periodDays}-day report</Text>
              <Text style={st.reportMeta}>{report.header.periodStart} – {report.header.periodEnd}</Text>
            </View>

            {/* Medication Compliance */}
            <View style={st.section}>
              <Text style={st.sectionTitle}>Medication Compliance</Text>
              <View style={st.complianceCard}>
                <Text style={[st.bigStat, { color: complianceColor(report.medicationCompliance.complianceRate) }]}>
                  {report.medicationCompliance.complianceRate}%
                </Text>
                <Text style={st.bigStatLabel}>compliance rate</Text>
              </View>
              <View style={st.statsRow}>
                <View style={st.statChip}>
                  <Text style={st.statChipNum}>{report.medicationCompliance.takenDoses}</Text>
                  <Text style={st.statChipLabel}>Taken</Text>
                </View>
                <View style={st.statChip}>
                  <Text style={st.statChipNum}>{report.medicationCompliance.missedDoses}</Text>
                  <Text style={st.statChipLabel}>Missed</Text>
                </View>
                <View style={st.statChip}>
                  <Text style={st.statChipNum}>{report.medicationCompliance.skippedDoses}</Text>
                  <Text style={st.statChipLabel}>Skipped</Text>
                </View>
              </View>
              {report.medicationCompliance.activemedications.length > 0 && (
                <View style={st.medList}>
                  {report.medicationCompliance.activemedications.map((m, i) => (
                    <Text key={i} style={st.medItem}>• {m.name}{m.dosage ? ` — ${m.dosage}` : ''}</Text>
                  ))}
                </View>
              )}
            </View>

            {/* Hydration */}
            <View style={st.section}>
              <Text style={st.sectionTitle}>Hydration</Text>
              <View style={st.statsRow}>
                <View style={st.statChip}>
                  <Text style={st.statChipNum}>{report.hydrationSummary.avgGlassesPerDay}</Text>
                  <Text style={st.statChipLabel}>Avg glasses/day</Text>
                </View>
                <View style={st.statChip}>
                  <Text style={st.statChipNum}>{report.hydrationSummary.goalMetPercent}%</Text>
                  <Text style={st.statChipLabel}>Goal met</Text>
                </View>
                <View style={st.statChip}>
                  <Text style={st.statChipNum}>{report.hydrationSummary.totalOz} oz</Text>
                  <Text style={st.statChipLabel}>Total</Text>
                </View>
              </View>
            </View>

            {/* Care Alerts */}
            <View style={st.section}>
              <Text style={st.sectionTitle}>Care Alerts</Text>
              <View style={st.statsRow}>
                <View style={st.statChip}>
                  <Text style={st.statChipNum}>{report.careAlerts.total}</Text>
                  <Text style={st.statChipLabel}>Total</Text>
                </View>
                <View style={st.statChip}>
                  <Text style={[st.statChipNum, { color: report.careAlerts.unresolved > 0 ? COLORS.coral : COLORS.teal }]}>
                    {report.careAlerts.unresolved}
                  </Text>
                  <Text style={st.statChipLabel}>Unresolved</Text>
                </View>
              </View>
              {report.careAlerts.recent.length > 0 && (
                <View style={{ marginTop: 8 }}>
                  {report.careAlerts.recent.map((a, i) => (
                    <View key={i} style={st.alertRow}>
                      <View style={[st.alertSeverityDot, { backgroundColor: severityColor(a.severity) }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={st.alertMessage}>{a.message}</Text>
                        <Text style={st.alertMeta}>{capitalize(a.severity)} · {a.date} · {a.resolved ? 'Resolved' : 'Open'}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Mood */}
            <View style={st.section}>
              <Text style={st.sectionTitle}>Mood</Text>
              <Text style={st.metaText}>{report.moodSummary.totalCheckins} check-ins · Dominant: {report.moodSummary.dominantMood}</Text>
              <View style={st.moodRow}>
                {Object.entries(report.moodSummary.distribution).map(([mood, count]) => (
                  <View key={mood} style={st.moodChip}>
                    <Text style={{ fontSize: 24 }}>{MOOD_EMOJI[mood] ?? '😊'}</Text>
                    <Text style={st.moodCount}>{count}</Text>
                    <Text style={st.moodLabel}>{mood}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Cognitive */}
            <View style={st.section}>
              <Text style={st.sectionTitle}>Cognitive Activity</Text>
              <View style={st.statsRow}>
                <View style={st.statChip}>
                  <Text style={st.statChipNum}>{report.cognitiveSummary.totalSessions}</Text>
                  <Text style={st.statChipLabel}>Sessions</Text>
                </View>
                <View style={st.statChip}>
                  <Text style={st.statChipNum}>{report.cognitiveSummary.completionRate}%</Text>
                  <Text style={st.statChipLabel}>Completion</Text>
                </View>
                <View style={st.statChip}>
                  <Text style={st.statChipNum}>{report.cognitiveSummary.totalEngagementMinutes}</Text>
                  <Text style={st.statChipLabel}>Minutes</Text>
                </View>
                <View style={st.statChip}>
                  <Text style={st.statChipNum}>{report.cognitiveSummary.activeDays}</Text>
                  <Text style={st.statChipLabel}>Active days</Text>
                </View>
              </View>
            </View>

            {/* Nutrition */}
            <View style={st.section}>
              <Text style={st.sectionTitle}>Nutrition</Text>
              <View style={st.statsRow}>
                <View style={st.statChip}>
                  <Text style={st.statChipNum}>{report.nutritionSummary.totalMealsLogged}</Text>
                  <Text style={st.statChipLabel}>Meals logged</Text>
                </View>
                <View style={st.statChip}>
                  <Text style={st.statChipNum}>{report.nutritionSummary.mealsPerDay}</Text>
                  <Text style={st.statChipLabel}>Per day</Text>
                </View>
                <View style={st.statChip}>
                  <Text style={st.statChipNum}>{report.nutritionSummary.daysTracked}</Text>
                  <Text style={st.statChipLabel}>Days tracked</Text>
                </View>
              </View>
            </View>

            {/* Share button */}
            <Pressable onPress={handleShare} style={st.shareBtn}>
              <Text style={st.shareBtnText}>Share Summary</Text>
            </Pressable>

            <Text style={st.generatedAt}>
              Generated {new Date(report.generatedAt).toLocaleString()}
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const GOLD = '#D4A843';

const st = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.cream },
  scroll: { padding: A11Y.screenPadding, paddingBottom: 60 },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backBtn: { fontSize: 18, color: COLORS.teal, fontWeight: '600' },

  brandRow: { marginBottom: 24, alignItems: 'center' },
  brandName: { fontSize: 28, fontWeight: '800', color: COLORS.navy, letterSpacing: 1 },
  brandTagline: { fontSize: 14, color: COLORS.gray, marginTop: 2 },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.navy, marginBottom: 12 },

  periodRow: { flexDirection: 'row', gap: 10 },
  periodBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    backgroundColor: COLORS.white, borderWidth: 2, borderColor: COLORS.lightGray,
  },
  periodBtnActive: { borderColor: COLORS.teal, backgroundColor: '#F0FAF8' },
  periodBtnText: { fontSize: 16, fontWeight: '600', color: COLORS.navy },
  periodBtnTextActive: { color: COLORS.teal },

  generateBtn: {
    backgroundColor: GOLD, borderRadius: 16, padding: 18, alignItems: 'center', marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 4,
  },
  generateBtnText: { fontSize: 18, fontWeight: '800', color: COLORS.navy },

  errorText: { color: COLORS.coral, fontSize: 15, textAlign: 'center', marginBottom: 16 },

  reportHeader: {
    backgroundColor: COLORS.navy, borderRadius: 16, padding: 20, marginBottom: 24, alignItems: 'center',
  },
  reportPatientName: { fontSize: 22, fontWeight: '800', color: COLORS.white, marginBottom: 4 },
  reportMeta: { fontSize: 14, color: '#B0BEC5', marginTop: 2 },

  complianceCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  bigStat: { fontSize: 52, fontWeight: '800' },
  bigStatLabel: { fontSize: 15, color: COLORS.gray, marginTop: 4 },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statChip: {
    flex: 1, minWidth: 80, backgroundColor: COLORS.white, borderRadius: 12,
    padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  statChipNum: { fontSize: 22, fontWeight: '700', color: COLORS.navy },
  statChipLabel: { fontSize: 11, color: COLORS.gray, marginTop: 3, textAlign: 'center' },

  medList: { marginTop: 12, backgroundColor: COLORS.white, borderRadius: 12, padding: 14 },
  medItem: { fontSize: 14, color: COLORS.navy, marginBottom: 4 },

  alertRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: COLORS.white, borderRadius: 12, padding: 12, marginBottom: 8,
  },
  alertSeverityDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  alertMessage: { fontSize: 14, color: COLORS.navy, fontWeight: '500' },
  alertMeta: { fontSize: 12, color: COLORS.gray, marginTop: 2 },

  metaText: { fontSize: 14, color: COLORS.gray, marginBottom: 10 },

  moodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  moodChip: {
    alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 14, padding: 12, minWidth: 72,
  },
  moodCount: { fontSize: 18, fontWeight: '700', color: COLORS.navy, marginTop: 4 },
  moodLabel: { fontSize: 11, color: COLORS.gray, marginTop: 2, textTransform: 'capitalize' },

  shareBtn: {
    backgroundColor: COLORS.teal, borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 12,
  },
  shareBtnText: { fontSize: 17, fontWeight: '700', color: COLORS.white },

  generatedAt: { fontSize: 12, color: COLORS.gray, textAlign: 'center', marginBottom: 8 },
});
