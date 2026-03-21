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
        <HubCard title="Community" emoji="💬" subtitle="Connect with other caregivers" onPress={() => {}} />
        <HubCard title="Resources" emoji="📚" subtitle="Articles and guides" onPress={() => {}} />
        <HubCard title="Self-Care" emoji="💛" subtitle="Burnout check, breathing, journal" onPress={() => router.push('/(caregiver)/hub/self-care' as any)} />
        <HubCard title="Crisis Support" emoji="🆘" subtitle="Always here when you need help" onPress={() => {}} />
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
