/**
 * Local Resources — Caregiver Hub
 * Northern Virginia Alzheimer's resources fetched from local_resources table.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Linking, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../../../constants/colors';
import { A11Y } from '../../../../constants/accessibility';
import { supabase } from '../../../../lib/supabase';

interface LocalResource {
  id: string;
  name: string;
  category: string;
  address: string;
  phone: string;
  description: string;
}

const FALLBACK_RESOURCES: LocalResource[] = [
  { id: '1', name: 'Alzheimer\'s Association - National Capital Area', category: 'Support', address: 'Fairfax, VA', phone: '1-800-272-3900', description: 'Support groups, education, and care consultation.' },
  { id: '2', name: 'Insight Memory Care Center', category: 'Day Program', address: 'Fairfax, VA', phone: '703-204-4664', description: 'Day programs and support for early-stage dementia.' },
  { id: '3', name: 'INOVA Memory Care Program', category: 'Medical', address: 'Falls Church, VA', phone: '703-776-3700', description: 'Medical evaluation, treatment, and clinical trials.' },
  { id: '4', name: 'Fairfax Area Agency on Aging', category: 'Government', address: 'Fairfax, VA', phone: '703-324-7948', description: 'Aging services, caregiver support, Meals on Wheels.' },
  { id: '5', name: 'Prince William Area Agency on Aging', category: 'Government', address: 'Manassas, VA', phone: '703-792-6400', description: 'Senior services, adult day care, respite care.' },
];

export default function LocalResourcesScreen() {
  const router = useRouter();
  const [resources, setResources] = useState<LocalResource[]>(FALLBACK_RESOURCES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('local_resources')
          .select('*')
          .order('name');
        if (data && data.length > 0) setResources(data);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const callPhone = (phone: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const cleaned = phone.replace(/[^0-9]/g, '');
    Linking.openURL(`tel:${cleaned}`);
  };

  return (
    <SafeAreaView style={st.safe}>
      <ScrollView contentContainerStyle={st.scroll}>
        <Pressable onPress={() => router.back()}>
          <Text style={st.back}>← Back</Text>
        </Pressable>
        <Text style={st.title}>Local Resources</Text>
        <Text style={st.subtitle}>Northern Virginia area support</Text>

        {loading ? (
          <ActivityIndicator color={COLORS.teal} style={{ marginTop: 40 }} />
        ) : (
          resources.map(r => (
            <View key={r.id} style={st.card}>
              <View style={st.catBadge}>
                <Text style={st.catText}>{r.category}</Text>
              </View>
              <Text style={st.cardName}>{r.name}</Text>
              <Text style={st.cardDesc}>{r.description}</Text>
              <Text style={st.cardAddr}>{r.address}</Text>
              <Pressable onPress={() => callPhone(r.phone)} style={st.phoneRow}>
                <Text style={st.phoneText}>📞 {r.phone}</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.cream },
  scroll: { padding: A11Y.screenPadding, paddingBottom: 40 },
  back: { fontSize: 18, color: COLORS.teal, fontWeight: '600', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.navy, marginBottom: 4 },
  subtitle: { fontSize: 15, color: COLORS.gray, marginBottom: 20 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  catBadge: { alignSelf: 'flex-start', backgroundColor: COLORS.teal + '20', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 8 },
  catText: { fontSize: 12, fontWeight: '600', color: COLORS.teal },
  cardName: { fontSize: 17, fontWeight: '700', color: COLORS.navy, marginBottom: 4 },
  cardDesc: { fontSize: 14, color: COLORS.gray, lineHeight: 20, marginBottom: 6 },
  cardAddr: { fontSize: 13, color: COLORS.gray, marginBottom: 8 },
  phoneRow: { alignSelf: 'flex-start', paddingVertical: 6 },
  phoneText: { fontSize: 16, color: COLORS.teal, fontWeight: '600' },
});
