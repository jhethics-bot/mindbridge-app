/**
 * About NeuBridge — Caregiver Screen
 * Detailed app information with links and legal text.
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import { APP_METADATA } from '../../constants/appMetadata';

export default function CaregiverAboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={st.safe}>
      <ScrollView contentContainerStyle={st.scroll}>
        <Pressable onPress={() => router.back()} style={st.backBtn}>
          <Text style={st.backText}>← Back</Text>
        </Pressable>

        {/* Logo area */}
        <View style={st.logoArea}>
          <Text style={st.logoText}>{APP_METADATA.name}</Text>
          <Text style={st.tagline}>{APP_METADATA.tagline}</Text>
          <Text style={st.version}>Version {APP_METADATA.version}</Text>
        </View>

        <View style={st.card}>
          <Text style={st.body}>
            {APP_METADATA.description}. Built with love in Northern Virginia.
          </Text>
        </View>

        {/* Stats */}
        <View style={st.card}>
          <Text style={st.sectionTitle}>By the Numbers</Text>
          <View style={st.statsGrid}>
            <StatItem value={`${APP_METADATA.stats.screens}`} label="Screens" />
            <StatItem value={`${APP_METADATA.stats.cognitiveGames}`} label="Cognitive Games" />
            <StatItem value={`${APP_METADATA.stats.mindFoodCategories}`} label="MIND Foods" />
            <StatItem value={`${APP_METADATA.stats.edgeFunctions}`} label="AI Functions" />
          </View>
        </View>

        {/* Features */}
        <View style={st.card}>
          <Text style={st.sectionTitle}>Features</Text>
          {[
            'Companion Pet Therapy',
            'MIND Diet Scoring & Meal Planning',
            'Hydration Monitoring & Reminders',
            'AI-Powered Weekly Reports',
            'Bias-Removed News Reader',
            'Caregiver Peer Matching',
            'Emergency SOS with GPS',
          ].map((f, i) => (
            <Text key={i} style={st.featureItem}>{f}</Text>
          ))}
        </View>

        {/* Credits */}
        <View style={st.card}>
          <Text style={st.sectionTitle}>Credits</Text>
          <Text style={st.body}>{APP_METADATA.company}</Text>
          <Text style={st.bodySmall}>{APP_METADATA.address}</Text>
        </View>

        {/* Links */}
        <View style={st.linksSection}>
          <LinkRow label="Visit our website" onPress={() => Linking.openURL(APP_METADATA.website)} />
          <LinkRow label="Email support" onPress={() => Linking.openURL(`mailto:${APP_METADATA.supportEmail}`)} />
          <LinkRow label="Privacy Policy" onPress={() => Linking.openURL(APP_METADATA.legal.privacyUrl)} />
          <LinkRow label="Terms of Service" onPress={() => Linking.openURL(APP_METADATA.legal.termsUrl)} />
        </View>

        <Text style={st.disclaimer}>{APP_METADATA.legal.disclaimer}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <View style={st.statItem}>
      <Text style={st.statValue}>{value}</Text>
      <Text style={st.statLabel}>{label}</Text>
    </View>
  );
}

function LinkRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={st.linkRow} accessibilityRole="link">
      <Text style={st.linkText}>{label}</Text>
      <Text style={st.linkArrow}>→</Text>
    </Pressable>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.cream },
  scroll: { padding: A11Y.screenPadding, paddingBottom: 40 },
  backBtn: { marginBottom: 16 },
  backText: { fontSize: 18, color: COLORS.teal, fontWeight: '600' },
  logoArea: { alignItems: 'center', marginBottom: 24 },
  logoText: { fontSize: 32, fontWeight: '700', color: COLORS.navy },
  tagline: { fontSize: 16, color: COLORS.teal, fontWeight: '500', marginTop: 4 },
  version: { fontSize: 14, color: COLORS.gray, marginTop: 8 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.navy, marginBottom: 12 },
  body: { fontSize: 15, color: COLORS.navy, lineHeight: 22 },
  bodySmall: { fontSize: 13, color: COLORS.gray, marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statItem: {
    width: '47%' as any, backgroundColor: COLORS.cream, borderRadius: 12, padding: 14, alignItems: 'center',
  },
  statValue: { fontSize: 28, fontWeight: '700', color: COLORS.teal },
  statLabel: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  featureItem: {
    fontSize: 15, color: COLORS.navy, paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: COLORS.lightGray,
  },
  linksSection: { marginBottom: 16 },
  linkRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 8,
  },
  linkText: { fontSize: 15, color: COLORS.teal, fontWeight: '600' },
  linkArrow: { fontSize: 16, color: COLORS.gray },
  disclaimer: {
    fontSize: 12, color: COLORS.gray, textAlign: 'center', lineHeight: 18, paddingHorizontal: 8,
  },
});
