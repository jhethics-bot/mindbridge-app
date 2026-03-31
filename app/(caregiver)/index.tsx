/**
 * Caregiver Dashboard
 * Shows patient status, recent activity, mood trends, SOS count.
 * Queries tables directly (no RPC needed).
 */
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import { supabase, getCurrentProfile, getCaregiverPatients } from '../../lib/supabase';
import { CompanionPetWidget } from '../../components/CompanionPetWidget';
import { NutritionSummaryWidget } from '../../components/NutritionSummaryWidget';
import { checkPetInactivityAndNotify } from '../../lib/petNotifications';
import { useMedicationAlertStore } from '../../stores/medicationAlertStore';
import { useCareAlertStore } from '../../stores/careAlertStore';

interface DashboardData {
  patientName: string;
  patientStage: string;
  todayMood: string | null;
  moodEmoji: string;
  activitiesToday: number;
  totalMinutesToday: number;
  sosThisWeek: number;
  recentActivities: { activity: string; created_at: string }[];
  moodWeek: { mood: string; created_at: string }[];
  activeMeds: number;
  totalMeds: number;
  recentObservations: { note: string; category: string; created_at: string }[];
}

const MOOD_EMOJIS: Record<string, string> = {
  happy: '😊', okay: '😐', sad: '😢', confused: '😕', tired: '😴',
};

export default function CaregiverDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [patientId, setPatientId] = useState('');
  const { todaysConfirmations, pendingCount, fetchTodaysConfirmations } = useMedicationAlertStore();
  const { alerts, unreadCount, fetchAlerts, markAsRead, dismissAlert, dismissAll } = useCareAlertStore();
  const [alertsExpanded, setAlertsExpanded] = useState(false);
  const [weekMedCompliance, setWeekMedCompliance] = useState<number | null>(null);
  const [lastMissedMed, setLastMissedMed] = useState<{ date: string; name: string } | null>(null);
  const [caregiverId, setCaregiverId] = useState('');

  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    try {
      const profile = await getCurrentProfile();
      if (!profile) { router.replace('/'); return; }

      setCaregiverId(profile.id);
      await fetchAlerts(profile.id);

      const patients = await getCaregiverPatients(profile.id);
      if (!patients || patients.length === 0) {
        setLoading(false);
        return;
      }
      const patient = patients[0].patient;
      const pid = patients[0].patient_id;
      setPatientId(pid);

      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

      const [moodRes, actRes, sosRes, weekMoodRes, medsRes, obsRes] = await Promise.all([
        supabase.from('mood_checkins').select('mood')
          .eq('patient_id', pid).gte('created_at', `${today}T00:00:00`)
          .order('created_at', { ascending: false }).limit(1),
        supabase.from('activity_sessions').select('activity, duration_seconds, created_at')
          .eq('patient_id', pid).gte('created_at', `${today}T00:00:00`)
          .order('created_at', { ascending: false }),
        supabase.from('sos_events').select('id')
          .eq('patient_id', pid).gte('created_at', weekAgo),
        supabase.from('mood_checkins').select('mood, created_at')
          .eq('patient_id', pid).gte('created_at', weekAgo)
          .order('created_at', { ascending: false }),
        supabase.from('medications').select('id, is_active')
          .eq('patient_id', pid),
        supabase.from('observations').select('note, category, created_at')
          .eq('patient_id', pid)
          .order('created_at', { ascending: false }).limit(3),
      ]);

      const todayMood = moodRes.data?.[0]?.mood || null;
      const activities = actRes.data || [];
      const totalMin = Math.round(activities.reduce((sum: number, a: any) => sum + (a.duration_seconds || 0), 0) / 60);

      const allMeds = medsRes.data || [];
      setData({
        patientName: patient?.display_name || 'Patient',
        patientStage: patient?.stage || 'middle',
        todayMood,
        moodEmoji: todayMood ? (MOOD_EMOJIS[todayMood] || '😊') : '—',
        activitiesToday: activities.length,
        totalMinutesToday: totalMin,
        sosThisWeek: sosRes.data?.length || 0,
        recentActivities: activities.slice(0, 5),
        moodWeek: weekMoodRes.data || [],
        activeMeds: allMeds.filter((m: any) => m.is_active).length,
        totalMeds: allMeds.length,
        recentObservations: obsRes.data || [],
      });
      // Check pet inactivity notification
      try {
        const { data: relData } = await supabase
          .from('care_relationships')
          .select('id')
          .eq('patient_id', pid)
          .limit(1)
          .single();
        if (relData) {
          const { data: petData } = await supabase
            .from('companion_pets')
            .select('id, pet_name')
            .eq('care_relationship_id', relData.id)
            .single();
          if (petData) {
            checkPetInactivityAndNotify({
              petId: petData.id,
              petName: petData.pet_name,
              patientId: pid,
              patientName: patient?.display_name || 'your loved one',
            });
          }
        }
      } catch {} // Non-critical

      // Medication compliance data
      try {
        await fetchTodaysConfirmations(pid);
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
        const { data: weekMedData } = await supabase
          .from('medication_confirmations')
          .select('status, created_at, medication_schedules(medication_name)')
          .eq('patient_id', pid)
          .gte('created_at', weekAgo)
          .order('created_at', { ascending: false });

        if (weekMedData && weekMedData.length > 0) {
          const total = weekMedData.length;
          const confirmed = weekMedData.filter((c: any) => c.status === 'confirmed').length;
          setWeekMedCompliance(total > 0 ? Math.round((confirmed / total) * 100) : null);

          const missed = weekMedData.find((c: any) => c.status === 'missed');
          if (missed) {
            setLastMissedMed({
              date: new Date(missed.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
              name: (missed as any).medication_schedules?.medication_name ?? 'Unknown',
            });
          }
        }
      } catch {} // Non-critical
    } catch (err) {
      console.error('Dashboard error:', err);
    }
    setLoading(false);
  }

  function navCard(label: string, emoji: string, route: string) {
    return (
      <Pressable
        key={route}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(route as any); }}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [st.navCard, pressed && { backgroundColor: COLORS.glow }]}
      >
        <Text style={{ fontSize: 28 }}>{emoji}</Text>
        <Text style={st.navLabel}>{label}</Text>
      </Pressable>
    );
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
        {/* Alert Banner */}
        {alerts.length > 0 && (
          <View style={[
            st.alertBanner,
            alerts.some(a => a.alert_type === 'hydration_critical' || a.alert_type === 'medication_missed')
              ? st.alertBannerCritical
              : st.alertBannerWarning,
          ]}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setAlertsExpanded(prev => !prev);
                if (!alertsExpanded) {
                  alerts.filter(a => !a.is_read).forEach(a => markAsRead(a.id));
                }
              }}
              style={st.alertBannerHeader}
              accessibilityRole="button"
              accessibilityLabel={`${unreadCount > 0 ? unreadCount + ' alerts need attention' : 'View alerts'}`}
            >
              <Text style={st.alertBannerIcon}>
                {alerts.some(a => a.alert_type === 'hydration_critical' || a.alert_type === 'medication_missed') ? '🚨' : '⚠️'}
              </Text>
              <Text style={st.alertBannerText}>
                {unreadCount > 0 ? `${unreadCount} alert${unreadCount > 1 ? 's' : ''} need attention` : `${alerts.length} active alert${alerts.length > 1 ? 's' : ''}`}
              </Text>
              <Text style={st.alertBannerChevron}>{alertsExpanded ? '▲' : '▼'}</Text>
            </Pressable>

            {alertsExpanded && (
              <View style={st.alertList}>
                {alerts.map(alert => (
                  <View key={alert.id} style={st.alertItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={st.alertItemTitle}>{alert.title}</Text>
                      <Text style={st.alertItemMsg}>{alert.message}</Text>
                      <Text style={st.alertItemTime}>
                        {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => dismissAlert(alert.id)}
                      style={st.alertDismissBtn}
                      accessibilityRole="button"
                      accessibilityLabel="Dismiss alert"
                    >
                      <Text style={st.alertDismissText}>Dismiss</Text>
                    </Pressable>
                  </View>
                ))}
                <Pressable
                  onPress={dismissAll}
                  style={st.alertDismissAllBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss all alerts"
                >
                  <Text style={st.alertDismissAllText}>Dismiss All</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        <View style={st.header}>
          <Text style={st.title}>NeuBridge</Text>
          <Text style={st.subtitle}>Caregiver Dashboard</Text>
        </View>

        {data ? (
          <>
            <View style={st.statusRow}>
              <View style={st.statusCard}>
                <Text style={st.statusLabel}>Mood Today</Text>
                <Text style={{ fontSize: 36 }}>{data.moodEmoji}</Text>
                <Text style={st.statusValue}>{data.todayMood || 'Not yet'}</Text>
              </View>
              <View style={st.statusCard}>
                <Text style={st.statusLabel}>Activities</Text>
                <Text style={st.statusBig}>{data.activitiesToday}</Text>
                <Text style={st.statusValue}>{data.totalMinutesToday} min</Text>
              </View>
              <View style={[st.statusCard, data.sosThisWeek > 0 && st.sosHighlight]}>
                <Text style={st.statusLabel}>SOS (7d)</Text>
                <Text style={st.statusBig}>{data.sosThisWeek}</Text>
              </View>
            </View>

            <View style={st.infoCard}>
              <Text style={st.infoTitle}>{data.patientName}</Text>
              <Text style={st.infoStage}>Stage: {data.patientStage}</Text>
            </View>

            {/* Companion Pet Widget */}
            <CompanionPetWidget patientId={patientId} />

            {/* Nutrition Summary Widget */}
            <NutritionSummaryWidget patientId={patientId} />

            {data.recentActivities.length > 0 && (
              <View style={st.section}>
                <Text style={st.sectionTitle}>Today's Activities</Text>
                {data.recentActivities.map((a, i) => (
                  <View key={i} style={st.activityRow}>
                    <Text style={st.activityName}>{a.activity.replace(/_/g, ' ')}</Text>
                    <Text style={st.activityTime}>
                      {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {data.moodWeek.length > 0 && (
              <View style={st.section}>
                <Text style={st.sectionTitle}>Mood This Week</Text>
                <View style={st.moodRow}>
                  {data.moodWeek.slice(0, 7).map((m, i) => (
                    <View key={i} style={st.moodChip}>
                      <Text style={{ fontSize: 24 }}>{MOOD_EMOJIS[m.mood] || '😊'}</Text>
                      <Text style={st.moodDate}>
                        {new Date(m.created_at).toLocaleDateString([], { weekday: 'short' })}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={st.section}>
              <Text style={st.sectionTitle}>Medications</Text>
              <View style={st.medCard}>
                <Text style={st.medCount}>{data.activeMeds} of {data.totalMeds}</Text>
                <Text style={st.medLabel}>active medications</Text>
              </View>
            </View>

            {/* Medication Compliance Widget */}
            <View style={st.section}>
              <Text style={st.sectionTitle}>Medication Compliance</Text>
              <View style={st.medComplianceRow}>
                <View style={st.medComplianceCard}>
                  <Text style={st.medComplianceLabel}>Today</Text>
                  <Text style={st.medComplianceValue}>
                    {todaysConfirmations.filter(c => c.status === 'confirmed').length} of {todaysConfirmations.length}
                  </Text>
                  <Text style={st.medComplianceSub}>confirmed</Text>
                </View>
                <View style={st.medComplianceCard}>
                  <Text style={st.medComplianceLabel}>7-Day</Text>
                  <Text style={st.medComplianceValue}>
                    {weekMedCompliance !== null ? `${weekMedCompliance}%` : '--'}
                  </Text>
                  <Text style={st.medComplianceSub}>compliance</Text>
                </View>
              </View>
              {lastMissedMed && (
                <View style={st.missedMedRow}>
                  <Text style={st.missedMedText}>
                    Last missed: {lastMissedMed.date} - {lastMissedMed.name}
                  </Text>
                </View>
              )}
            </View>

            {data.recentObservations.length > 0 && (
              <View style={st.section}>
                <Text style={st.sectionTitle}>Latest Observations</Text>
                {data.recentObservations.map((o, i) => (
                  <View key={i} style={st.obsRow}>
                    <View style={st.obsCategoryBadge}>
                      <Text style={st.obsCategoryText}>{o.category}</Text>
                    </View>
                    <Text style={st.obsNote} numberOfLines={2}>{o.note}</Text>
                    <Text style={st.obsTime}>
                      {new Date(o.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* This Week Summary Widget */}
            <View style={st.section}>
              <View style={st.thisWeekHeader}>
                <Text style={st.sectionTitle}>This Week</Text>
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(caregiver)/weekly-reports' as any); }}
                  accessibilityRole="button"
                  accessibilityLabel="View all weekly reports"
                >
                  <Text style={st.thisWeekLink}>View Reports →</Text>
                </Pressable>
              </View>
              <View style={st.thisWeekGrid}>
                <View style={st.thisWeekCard}>
                  <Text style={st.thisWeekValue}>{data.activitiesToday}</Text>
                  <Text style={st.thisWeekLabel}>Sessions{'\n'}Today</Text>
                </View>
                <View style={st.thisWeekCard}>
                  <Text style={st.thisWeekValue}>{data.moodWeek.length}</Text>
                  <Text style={st.thisWeekLabel}>Mood{'\n'}Entries</Text>
                </View>
                <View style={st.thisWeekCard}>
                  <Text style={st.thisWeekValue}>
                    {weekMedCompliance !== null ? `${weekMedCompliance}%` : '--'}
                  </Text>
                  <Text style={st.thisWeekLabel}>Med{'\n'}Compliance</Text>
                </View>
                <View style={st.thisWeekCard}>
                  <Text style={st.thisWeekValue}>{data.sosThisWeek}</Text>
                  <Text style={st.thisWeekLabel}>SOS{'\n'}Events</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <View style={st.emptyState}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🔗</Text>
            <Text style={st.emptyText}>No patient linked yet.</Text>
          </View>
        )}

        <View style={st.navGrid}>
          {navCard('Observations', '📝', '/(caregiver)/observations')}
          {navCard('Medications', '💊', '/(caregiver)/medications')}
          {navCard('Settings', '⚙️', '/(caregiver)/settings')}
        </View>

        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(caregiver)/nutrition-dashboard' as any); }}
          accessibilityRole="button"
          accessibilityLabel="Nutrition & Hydration"
          style={({ pressed }) => [st.reportBtn, pressed && { backgroundColor: COLORS.glow }]}
        >
          <Text style={{ fontSize: 20, marginRight: 10 }}>🥗</Text>
          <Text style={st.reportBtnText}>Nutrition & Hydration</Text>
        </Pressable>

        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(caregiver)/community' as any); }}
          accessibilityRole="button"
          accessibilityLabel="Community"
          style={({ pressed }) => [st.reportBtn, pressed && { backgroundColor: COLORS.glow }]}
        >
          <Text style={{ fontSize: 20, marginRight: 10 }}>💬</Text>
          <Text style={st.reportBtnText}>Community</Text>
        </Pressable>

        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(caregiver)/appointments' as any); }}
          accessibilityRole="button"
          accessibilityLabel="Appointments"
          style={({ pressed }) => [st.reportBtn, pressed && { backgroundColor: COLORS.glow }]}
        >
          <Text style={{ fontSize: 20, marginRight: 10 }}>📅</Text>
          <Text style={st.reportBtnText}>Appointments</Text>
        </Pressable>

        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(caregiver)/report' as any); }}
          accessibilityRole="button"
          accessibilityLabel="Weekly Report"
          style={({ pressed }) => [st.reportBtn, pressed && { backgroundColor: COLORS.glow }]}
        >
          <Text style={{ fontSize: 20, marginRight: 10 }}>📊</Text>
          <Text style={st.reportBtnText}>Weekly Report</Text>
        </Pressable>

        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(caregiver)/weekly-reports' as any); }}
          accessibilityRole="button"
          accessibilityLabel="Weekly Reports"
          style={({ pressed }) => [st.reportBtn, pressed && { backgroundColor: COLORS.glow }]}
        >
          <Text style={{ fontSize: 20, marginRight: 10 }}>🗓️</Text>
          <Text style={st.reportBtnText}>Weekly Reports</Text>
        </Pressable>

        <Pressable
          onPress={async () => { await supabase.auth.signOut(); router.replace('/'); }}
          style={st.logoutBtn}
        >
          <Text style={st.logoutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.cream },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: A11Y.screenPadding, paddingBottom: 40 },
  header: { marginBottom: 24 },
  title: { fontSize: 32, fontWeight: '700', color: COLORS.navy },
  subtitle: { fontSize: 16, color: COLORS.gray },
  statusRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statusCard: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: 16, padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  sosHighlight: { backgroundColor: '#FFF3F0', borderWidth: 1, borderColor: COLORS.coral },
  statusLabel: { fontSize: 12, color: COLORS.gray, marginBottom: 4, textTransform: 'uppercase', fontWeight: '600' },
  statusBig: { fontSize: 32, fontWeight: '700', color: COLORS.navy },
  statusValue: { fontSize: 14, color: COLORS.gray, marginTop: 2 },
  infoCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  infoTitle: { fontSize: 20, fontWeight: '700', color: COLORS.navy },
  infoStage: { fontSize: 16, color: COLORS.teal, fontWeight: '600', textTransform: 'capitalize' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.navy, marginBottom: 10 },
  activityRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: COLORS.lightGray,
  },
  activityName: { fontSize: 16, color: COLORS.navy, textTransform: 'capitalize' },
  activityTime: { fontSize: 14, color: COLORS.gray },
  moodRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  moodChip: { alignItems: 'center', padding: 8, backgroundColor: COLORS.white, borderRadius: 12 },
  moodDate: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 20, fontWeight: '600', color: COLORS.navy },
  medCard: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 16, alignItems: 'center',
  },
  medCount: { fontSize: 28, fontWeight: '700', color: COLORS.teal },
  medLabel: { fontSize: 14, color: COLORS.gray, marginTop: 4 },
  medComplianceRow: { flexDirection: 'row', gap: 10 },
  medComplianceCard: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: 12, padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  medComplianceLabel: { fontSize: 11, fontWeight: '600', color: COLORS.gray, textTransform: 'uppercase', marginBottom: 4 },
  medComplianceValue: { fontSize: 24, fontWeight: '700', color: COLORS.teal },
  medComplianceSub: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  missedMedRow: {
    backgroundColor: '#FFF3F0', borderRadius: 10, padding: 10, marginTop: 8, borderWidth: 1, borderColor: COLORS.coral,
  },
  missedMedText: { fontSize: 14, color: COLORS.coral, fontWeight: '600' },
  obsRow: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 12, marginBottom: 8,
  },
  obsCategoryBadge: {
    alignSelf: 'flex-start', backgroundColor: COLORS.teal + '20', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 4,
  },
  obsCategoryText: { fontSize: 12, fontWeight: '600', color: COLORS.teal },
  obsNote: { fontSize: 15, color: COLORS.navy, lineHeight: 20 },
  obsTime: { fontSize: 12, color: COLORS.gray, marginTop: 4 },
  navGrid: { flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 20 },
  navCard: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: 16, padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  navLabel: { fontSize: 14, fontWeight: '600', color: COLORS.navy, marginTop: 8 },
  reportBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  reportBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.navy },
  logoutBtn: { alignSelf: 'center', padding: 16 },
  logoutText: { fontSize: 16, color: COLORS.coral, fontWeight: '600' },
  // Alert Banner
  alertBanner: {
    borderRadius: 14, marginBottom: 16, overflow: 'hidden',
    borderWidth: 1,
  },
  alertBannerCritical: { backgroundColor: '#FEE2E2', borderColor: '#DC2626' },
  alertBannerWarning: { backgroundColor: '#FEF3C7', borderColor: '#D97706' },
  alertBannerHeader: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
  },
  alertBannerIcon: { fontSize: 20, marginRight: 8 },
  alertBannerText: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.navy },
  alertBannerChevron: { fontSize: 12, color: COLORS.gray },
  alertList: { borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  alertItem: {
    flexDirection: 'row', alignItems: 'flex-start', padding: 12,
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  alertItemTitle: { fontSize: 14, fontWeight: '700', color: COLORS.navy, marginBottom: 2 },
  alertItemMsg: { fontSize: 13, color: COLORS.gray, lineHeight: 18 },
  alertItemTime: { fontSize: 11, color: COLORS.gray, marginTop: 4 },
  alertDismissBtn: {
    backgroundColor: '#DC262620', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
    marginLeft: 8, alignSelf: 'flex-start',
  },
  alertDismissText: { fontSize: 12, fontWeight: '600', color: '#DC2626' },
  alertDismissAllBtn: {
    alignItems: 'center', padding: 12,
  },
  alertDismissAllText: { fontSize: 13, fontWeight: '700', color: COLORS.gray },
  // This Week Widget
  thisWeekHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  thisWeekLink: { fontSize: 14, fontWeight: '600', color: COLORS.teal },
  thisWeekGrid: { flexDirection: 'row', gap: 8 },
  thisWeekCard: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: 12, padding: 12, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  thisWeekValue: { fontSize: 22, fontWeight: '700', color: COLORS.teal },
  thisWeekLabel: { fontSize: 11, color: COLORS.gray, marginTop: 4, textAlign: 'center' },
});
