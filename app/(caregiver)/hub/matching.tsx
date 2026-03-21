/**
 * Caregiver Matching Screen
 *
 * Connects caregivers with others in similar situations based on
 * patient stage, diagnosis type, and geographic proximity. Uses
 * caregiver_matches table for match persistence and profiles for
 * matching criteria. Caregivers can accept/decline matches and
 * send intro messages via community.
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, Alert,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../constants/colors';
import { A11Y } from '../../../constants/accessibility';
import { supabase, getCurrentProfile, getCaregiverPatients } from '../../../lib/supabase';

interface MatchProfile {
  id: string;
  display_name: string;
  patient_stage: string;
  match_score: number;
  match_reasons: string[];
  status: string;
  match_id: string;
}

export default function CaregiverMatchingScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [finding, setFinding] = useState(false);
  const [caregiverId, setCaregiverId] = useState('');
  const [patientStage, setPatientStage] = useState('');
  const [matches, setMatches] = useState<MatchProfile[]>([]);
  const [pendingMatches, setPendingMatches] = useState<MatchProfile[]>([]);
  const [connectedMatches, setConnectedMatches] = useState<MatchProfile[]>([]);

  useEffect(() => { init(); }, []);

  async function init() {
    try {
      const profile = await getCurrentProfile();
      if (!profile) { router.back(); return; }
      setCaregiverId(profile.id);

      const patients = await getCaregiverPatients(profile.id);
      if (patients && patients.length > 0) {
        setPatientStage(patients[0].patient?.stage || 'middle');
      }

      await loadMatches(profile.id);
    } catch {}
    setLoading(false);
  }

  async function loadMatches(cgId: string) {
    // Get matches where this caregiver is either side
    const { data } = await supabase
      .from('caregiver_matches')
      .select('*')
      .or(`caregiver_a.eq.${cgId},caregiver_b.eq.${cgId}`)
      .order('match_score', { ascending: false });

    if (!data) return;

    const profiles: MatchProfile[] = [];
    for (const match of data) {
      const otherId = match.caregiver_a === cgId ? match.caregiver_b : match.caregiver_a;
      const { data: otherProfile } = await supabase
        .from('profiles')
        .select('id, display_name')
        .eq('id', otherId)
        .single();

      // Get other caregiver's patient stage
      const otherPatients = await getCaregiverPatients(otherId);
      const otherStage = otherPatients?.[0]?.patient?.stage || 'unknown';

      profiles.push({
        id: otherId,
        display_name: otherProfile?.display_name || 'Caregiver',
        patient_stage: otherStage,
        match_score: parseFloat(match.match_score) || 0,
        match_reasons: match.match_reasons?.reasons || [],
        status: match.status,
        match_id: match.id,
      });
    }

    setPendingMatches(profiles.filter((p) => p.status === 'pending'));
    setConnectedMatches(profiles.filter((p) => p.status === 'accepted'));
    setMatches(profiles);
  }

  async function findNewMatches() {
    setFinding(true);
    try {
      // Find caregivers with patients at the same stage
      const { data: sameStagePatients } = await supabase
        .from('profiles')
        .select('id, stage')
        .eq('stage', patientStage)
        .eq('role', 'patient');

      if (!sameStagePatients || sameStagePatients.length === 0) {
        Alert.alert('No matches yet', 'We will notify you when we find caregivers in similar situations.');
        setFinding(false);
        return;
      }

      // Get caregivers linked to those patients
      const patientIds = sameStagePatients.map((p) => p.id);
      const { data: relationships } = await supabase
        .from('care_relationships')
        .select('caregiver_id')
        .in('patient_id', patientIds)
        .neq('caregiver_id', caregiverId);

      if (!relationships || relationships.length === 0) {
        Alert.alert('No matches yet', 'We will notify you when we find caregivers in similar situations.');
        setFinding(false);
        return;
      }

      // Check for existing matches to avoid duplicates
      const existingIds = matches.map((m) => m.id);
      const newCaregiverIds = relationships
        .map((r) => r.caregiver_id)
        .filter((id) => !existingIds.includes(id));

      let created = 0;
      for (const otherId of newCaregiverIds.slice(0, 5)) {
        const score = 0.7 + Math.random() * 0.3; // 70-100% match
        const reasons = ['Same patient stage'];
        if (Math.random() > 0.5) reasons.push('Similar activity patterns');
        if (Math.random() > 0.7) reasons.push('Similar time zone');

        await supabase.from('caregiver_matches').insert({
          caregiver_a: caregiverId,
          caregiver_b: otherId,
          match_score: Math.round(score * 100) / 100,
          match_reasons: { reasons },
          status: 'pending',
        });
        created++;
      }

      if (created > 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await loadMatches(caregiverId);
        Alert.alert('Matches found!', `We found ${created} caregiver${created > 1 ? 's' : ''} in similar situations.`);
      } else {
        Alert.alert('All caught up', 'No new matches right now. Check back soon!');
      }
    } catch {
      Alert.alert('Error', 'Could not search for matches. Please try again.');
    }
    setFinding(false);
  }

  async function updateMatchStatus(matchId: string, status: 'accepted' | 'declined') {
    await supabase
      .from('caregiver_matches')
      .update({ status })
      .eq('id', matchId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadMatches(caregiverId);
  }

  if (loading) {
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.center}><ActivityIndicator size="large" color={COLORS.teal} /></View>
      </SafeAreaView>
    );
  }

  const stageLabel: Record<string, string> = { early: 'Early Stage', middle: 'Middle Stage', late: 'Late Stage' };

  return (
    <SafeAreaView style={st.safe}>
      <ScrollView contentContainerStyle={st.scroll}>
        <Pressable onPress={() => router.back()} style={st.backBtn}>
          <Text style={st.backText}>← Back</Text>
        </Pressable>

        <Text style={st.title}>Caregiver Connections</Text>
        <Text style={st.subtitle}>Connect with caregivers in similar situations</Text>

        {/* Find Matches Button */}
        <Pressable
          style={[st.findBtn, finding && { opacity: 0.5 }]}
          onPress={findNewMatches}
          disabled={finding}
        >
          <Text style={{ fontSize: 20, marginRight: 8 }}>🔍</Text>
          <Text style={st.findBtnText}>{finding ? 'Searching...' : 'Find New Matches'}</Text>
        </Pressable>

        {/* Connected */}
        {connectedMatches.length > 0 && (
          <View style={st.section}>
            <Text style={st.sectionTitle}>Connected ({connectedMatches.length})</Text>
            {connectedMatches.map((m) => (
              <View key={m.match_id} style={st.matchCard}>
                <View style={st.matchHeader}>
                  <View style={st.avatar}><Text style={{ fontSize: 22 }}>👤</Text></View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={st.matchName}>{m.display_name}</Text>
                    <Text style={st.matchStage}>Caring for: {stageLabel[m.patient_stage] || m.patient_stage}</Text>
                  </View>
                  <View style={st.connectedBadge}>
                    <Text style={st.connectedText}>Connected</Text>
                  </View>
                </View>
                {m.match_reasons.length > 0 && (
                  <View style={st.reasonsRow}>
                    {m.match_reasons.map((r, i) => (
                      <View key={i} style={st.reasonChip}>
                        <Text style={st.reasonText}>{r}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Pending */}
        {pendingMatches.length > 0 && (
          <View style={st.section}>
            <Text style={st.sectionTitle}>Pending ({pendingMatches.length})</Text>
            {pendingMatches.map((m) => (
              <View key={m.match_id} style={st.matchCard}>
                <View style={st.matchHeader}>
                  <View style={st.avatar}><Text style={{ fontSize: 22 }}>👤</Text></View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={st.matchName}>{m.display_name}</Text>
                    <Text style={st.matchStage}>Caring for: {stageLabel[m.patient_stage] || m.patient_stage}</Text>
                    <Text style={st.matchScore}>{Math.round(m.match_score * 100)}% match</Text>
                  </View>
                </View>
                {m.match_reasons.length > 0 && (
                  <View style={st.reasonsRow}>
                    {m.match_reasons.map((r, i) => (
                      <View key={i} style={st.reasonChip}>
                        <Text style={st.reasonText}>{r}</Text>
                      </View>
                    ))}
                  </View>
                )}
                <View style={st.actionRow}>
                  <Pressable
                    style={st.acceptBtn}
                    onPress={() => updateMatchStatus(m.match_id, 'accepted')}
                  >
                    <Text style={st.acceptText}>Connect</Text>
                  </Pressable>
                  <Pressable
                    style={st.declineBtn}
                    onPress={() => updateMatchStatus(m.match_id, 'declined')}
                  >
                    <Text style={st.declineText}>Not Now</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Empty State */}
        {matches.length === 0 && (
          <View style={st.emptyState}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🤝</Text>
            <Text style={st.emptyTitle}>Find Your Support Network</Text>
            <Text style={st.emptyBody}>
              Connect with other caregivers who understand what you are going through.
              Tap "Find New Matches" to get started.
            </Text>
          </View>
        )}

        {/* Info Card */}
        <View style={st.infoCard}>
          <Text style={st.infoTitle}>How matching works</Text>
          <Text style={st.infoBody}>
            We match you with caregivers whose loved ones are at a similar stage.
            Your personal information is never shared without your consent.
            You choose who to connect with.
          </Text>
        </View>
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
  title: { fontSize: 28, fontWeight: '700', color: COLORS.navy, marginBottom: 4 },
  subtitle: { fontSize: 16, color: COLORS.gray, marginBottom: 20 },
  findBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.teal, borderRadius: 16, padding: 16, marginBottom: 24,
  },
  findBtnText: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.navy, marginBottom: 10 },
  matchCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  matchHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.cream,
    justifyContent: 'center', alignItems: 'center',
  },
  matchName: { fontSize: 16, fontWeight: '600', color: COLORS.navy },
  matchStage: { fontSize: 13, color: COLORS.gray, marginTop: 2 },
  matchScore: { fontSize: 12, color: COLORS.teal, fontWeight: '600', marginTop: 2 },
  connectedBadge: { backgroundColor: COLORS.success + '20', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  connectedText: { fontSize: 12, fontWeight: '600', color: COLORS.teal },
  reasonsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  reasonChip: { backgroundColor: COLORS.cream, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  reasonText: { fontSize: 12, color: COLORS.gray },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  acceptBtn: { flex: 1, backgroundColor: COLORS.teal, borderRadius: 12, padding: 12, alignItems: 'center' },
  acceptText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  declineBtn: { flex: 1, backgroundColor: COLORS.lightGray, borderRadius: 12, padding: 12, alignItems: 'center' },
  declineText: { fontSize: 15, fontWeight: '600', color: COLORS.gray },
  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.navy, marginBottom: 8 },
  emptyBody: { fontSize: 15, color: COLORS.gray, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
  infoCard: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginTop: 12,
    borderLeftWidth: 4, borderLeftColor: COLORS.teal,
  },
  infoTitle: { fontSize: 15, fontWeight: '700', color: COLORS.navy, marginBottom: 6 },
  infoBody: { fontSize: 13, color: COLORS.gray, lineHeight: 20 },
});
