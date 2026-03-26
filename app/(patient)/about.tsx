/**
 * About NeuBridge — Patient Screen
 * Simple, readable information about the app.
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { MBSafeArea } from '../../components/ui/MBSafeArea';
import { MBHeader } from '../../components/ui/MBHeader';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import { APP_METADATA } from '../../constants/appMetadata';

export default function AboutScreen() {
  return (
    <MBSafeArea>
      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
        <MBHeader title={APP_METADATA.name} subtitle={APP_METADATA.tagline} />

        <Text style={st.version}>Version {APP_METADATA.version}</Text>

        <View style={st.card}>
          <Text style={st.body}>{APP_METADATA.description}.</Text>
          <Text style={st.body}>Built with love in Northern Virginia.</Text>
        </View>

        <View style={st.card}>
          <Text style={st.statsTitle}>What's Inside</Text>
          <Text style={st.statLine}>{APP_METADATA.stats.screens} Screens</Text>
          <Text style={st.statLine}>{APP_METADATA.stats.cognitiveGames} Cognitive Games</Text>
          <Text style={st.statLine}>Companion Pet Therapy</Text>
          <Text style={st.statLine}>MIND Diet Tracking</Text>
          <Text style={st.statLine}>Hydration Monitoring</Text>
          <Text style={st.statLine}>AI Weekly Reports</Text>
        </View>

        <View style={st.card}>
          <Text style={st.statsTitle}>Credits</Text>
          <Text style={st.body}>{APP_METADATA.company}</Text>
        </View>

        <View style={st.linksSection}>
          <Pressable
            onPress={() => Linking.openURL(APP_METADATA.website)}
            accessibilityRole="link"
            accessibilityLabel="Visit our website"
            style={st.link}
          >
            <Text style={st.linkText}>Visit our website</Text>
          </Pressable>
          <Pressable
            onPress={() => Linking.openURL(`mailto:${APP_METADATA.supportEmail}`)}
            accessibilityRole="link"
            accessibilityLabel="Email support"
            style={st.link}
          >
            <Text style={st.linkText}>Email support</Text>
          </Pressable>
          <Pressable
            onPress={() => Linking.openURL(APP_METADATA.legal.privacyUrl)}
            accessibilityRole="link"
            style={st.link}
          >
            <Text style={st.linkText}>Privacy Policy</Text>
          </Pressable>
          <Pressable
            onPress={() => Linking.openURL(APP_METADATA.legal.termsUrl)}
            accessibilityRole="link"
            style={st.link}
          >
            <Text style={st.linkText}>Terms of Service</Text>
          </Pressable>
        </View>

        <Text style={st.disclaimer}>{APP_METADATA.legal.disclaimer}</Text>
      </ScrollView>
    </MBSafeArea>
  );
}

const st = StyleSheet.create({
  scroll: { paddingBottom: 40 },
  version: {
    fontSize: 14, color: COLORS.gray, textAlign: 'center', marginBottom: 20,
  },
  card: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  body: {
    fontSize: A11Y.fontSizeBody, color: COLORS.navy, lineHeight: A11Y.fontSizeBody * 1.5, marginBottom: 4,
  },
  statsTitle: {
    fontSize: 18, fontWeight: '700', color: COLORS.navy, marginBottom: 10,
  },
  statLine: {
    fontSize: A11Y.fontSizeBody, color: COLORS.teal, fontWeight: '500', marginBottom: 6,
  },
  linksSection: { marginBottom: 20, gap: 4 },
  link: {
    paddingVertical: 14, paddingHorizontal: 16,
    backgroundColor: COLORS.white, borderRadius: 12, marginBottom: 8,
  },
  linkText: {
    fontSize: A11Y.fontSizeBody, color: COLORS.teal, fontWeight: '600',
  },
  disclaimer: {
    fontSize: 13, color: COLORS.gray, textAlign: 'center', lineHeight: 20,
    paddingHorizontal: 16,
  },
});
