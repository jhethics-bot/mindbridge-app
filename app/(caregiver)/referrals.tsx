/**
 * Referrals Screen
 * Displays the caregiver's referral code, lets them share it,
 * and shows a list of families they have referred.
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Share, Alert, ActivityIndicator,
} from 'react-native';
import { Clipboard } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import { supabase } from '../../lib/supabase';
import { useReferralStore } from '../../stores/referralStore';

export default function ReferralsScreen() {
  const router = useRouter();
  const { referralCode, redemptions, totalReferrals, isLoading, fetchOrCreateCode, getMyReferrals } = useReferralStore();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user.id).single();
      await fetchOrCreateCode(user.id, profile?.display_name || 'USER');
      await getMyReferrals(user.id);
    } catch {}
  }

  async function handleCopy() {
    if (!referralCode) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Clipboard.setString(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    if (!referralCode) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: `Join me on NeuBridge — the compassionate app for Alzheimer's caregivers. Use my referral code ${referralCode} when you sign up and we both get a free month!\n\nDownload NeuBridge today.`,
        title: 'Join NeuBridge with my referral code',
      });
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
          <Text style={st.title}>Refer a Family</Text>
        </View>

        {/* Reward callout */}
        <View style={st.rewardCard}>
          <Text style={st.rewardEmoji}>🎁</Text>
          <Text style={st.rewardTitle}>Give a free month, get a free month</Text>
          <Text style={st.rewardDesc}>
            When a friend signs up with your code, they get their first month free — and so do you. No limits on how many families you can refer.
          </Text>
        </View>

        {/* Referral code */}
        <View style={st.section}>
          <Text style={st.sectionTitle}>Your Referral Code</Text>
          {isLoading && !referralCode ? (
            <ActivityIndicator size="large" color={COLORS.teal} style={{ marginVertical: 24 }} />
          ) : (
            <Pressable onPress={handleCopy} style={st.codeCard} accessibilityLabel="Tap to copy referral code">
              <Text style={st.codeText}>{referralCode || '------'}</Text>
              <Text style={st.copyHint}>{copied ? 'Copied!' : 'Tap to copy'}</Text>
            </Pressable>
          )}

          <Pressable onPress={handleShare} style={st.shareBtn}>
            <Text style={st.shareBtnText}>Share Code</Text>
          </Pressable>
        </View>

        {/* Counter */}
        <View style={st.section}>
          <View style={st.counterCard}>
            <Text style={st.counterNum}>{totalReferrals}</Text>
            <Text style={st.counterLabel}>
              {totalReferrals === 1 ? 'Family referred' : 'Families referred'}
            </Text>
          </View>
        </View>

        {/* Referral list */}
        {redemptions.length > 0 && (
          <View style={st.section}>
            <Text style={st.sectionTitle}>Referred Families</Text>
            {redemptions.map((r) => (
              <View key={r.id} style={st.referralRow}>
                <View style={st.avatar}>
                  <Text style={st.avatarText}>
                    {(r.referred_name || 'F').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={st.referralName}>{r.referred_name?.split(' ')[0] || 'Family'}</Text>
                <Text style={st.referralDate}>
                  {new Date(r.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
            ))}
          </View>
        )}

        {redemptions.length === 0 && !isLoading && (
          <View style={st.emptyState}>
            <Text style={st.emptyEmoji}>💜</Text>
            <Text style={st.emptyText}>No referrals yet — share your code to get started!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.cream },
  scroll: { padding: A11Y.screenPadding, paddingBottom: 60 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  backBtn: { fontSize: 18, color: COLORS.teal, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.navy },

  rewardCard: {
    backgroundColor: COLORS.gold + '30',
    borderRadius: 16, padding: 20, marginBottom: 28,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.gold,
  },
  rewardEmoji: { fontSize: 32, marginBottom: 8 },
  rewardTitle: { fontSize: 18, fontWeight: '700', color: COLORS.navy, textAlign: 'center', marginBottom: 8 },
  rewardDesc: { fontSize: 14, color: COLORS.gray, textAlign: 'center', lineHeight: 20 },

  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.navy, marginBottom: 12 },

  codeCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 24,
    alignItems: 'center', marginBottom: 12,
    borderWidth: 2, borderColor: COLORS.teal,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  codeText: { fontSize: 36, fontWeight: '800', color: COLORS.navy, letterSpacing: 6 },
  copyHint: { fontSize: 14, color: COLORS.teal, marginTop: 8, fontWeight: '600' },

  shareBtn: {
    backgroundColor: COLORS.teal, borderRadius: 14, padding: 16, alignItems: 'center',
  },
  shareBtnText: { fontSize: 18, fontWeight: '700', color: COLORS.white },

  counterCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 24, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  counterNum: { fontSize: 48, fontWeight: '800', color: COLORS.teal },
  counterLabel: { fontSize: 16, color: COLORS.gray, marginTop: 4 },

  referralRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: 12, padding: 14, marginBottom: 8, gap: 12,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.teal,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  referralName: { flex: 1, fontSize: 16, fontWeight: '600', color: COLORS.navy },
  referralDate: { fontSize: 13, color: COLORS.gray },

  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 16, color: COLORS.gray, textAlign: 'center', lineHeight: 22 },
});
