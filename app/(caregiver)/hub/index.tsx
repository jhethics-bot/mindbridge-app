import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MBSafeArea } from '../../../components/ui/MBSafeArea';
import { COLORS } from '../../../constants/colors';

function HubCard({ title, emoji, subtitle, onPress }: { title: string; emoji: string; subtitle: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [st.card, pressed && { backgroundColor: COLORS.glow }]}
      accessibilityRole="button" accessibilityLabel={title}>
      <Text style={{ fontSize: 32 }}>{emoji}</Text>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={st.cardTitle}>{title}</Text>
        <Text style={st.cardSub}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

export default function HubHomeScreen() {
  const router = useRouter();
  return (
    <MBSafeArea title="Caregiver Hub" showSOS={false}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <Text style={st.intro}>Support for you, the caregiver.</Text>
        <HubCard title="News" emoji="📰" subtitle="Alzheimer's news, bias removed" onPress={() => router.push('/(caregiver)/hub/news' as any)} />
        <HubCard title="Community" emoji="💬" subtitle="Connect with other caregivers" onPress={() => router.push('/(caregiver)/community' as any)} />
        <HubCard title="Resources" emoji="📚" subtitle="Articles and guides" onPress={() => router.push('/(caregiver)/hub/resources' as any)} />
        <HubCard title="Local Resources" emoji="📍" subtitle="Northern Virginia support services" onPress={() => router.push('/(caregiver)/hub/local' as any)} />
        <HubCard title="Self-Care" emoji="💛" subtitle="Burnout check, breathing, journal" onPress={() => router.push('/(caregiver)/hub/self-care' as any)} />
        <HubCard title="Crisis Support" emoji="🆘" subtitle="24/7 helplines and emergency contacts" onPress={() => router.push('/(caregiver)/hub/crisis' as any)} />
      </ScrollView>
    </MBSafeArea>
  );
}

const st = StyleSheet.create({
  intro: { fontSize: 16, color: COLORS.gray, marginBottom: 16 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: 16, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: '600', color: COLORS.navy },
  cardSub: { fontSize: 14, color: COLORS.gray, marginTop: 2 },
});
