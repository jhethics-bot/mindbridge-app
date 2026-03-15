import React from 'react';
import { useRouter } from 'expo-router';
import MBSafeArea from '../../../components/ui/MBSafeArea';
import MBCard from '../../../components/ui/MBCard';
import MBText from '../../../components/ui/MBText';

export default function HubHomeScreen() {
  const router = useRouter();
  return (
    <MBSafeArea title="Caregiver Hub" showSOS={false}>
      <MBText variant="body" style={{ color: '#6B7280', marginBottom: 16 }}>Support for you, the caregiver.</MBText>
      <MBCard title="News" emoji="📰" subtitle="Alzheimer's news, bias removed" onPress={() => router.push('/(caregiver)/hub/news' as any)} />
      <MBCard title="Community" emoji="💬" subtitle="Connect with other caregivers" onPress={() => router.push('/(caregiver)/hub/community' as any)} />
      <MBCard title="Resources" emoji="📚" subtitle="Articles and guides" onPress={() => router.push('/(caregiver)/hub/resources' as any)} />
      <MBCard title="Local Resources" emoji="📍" subtitle="Find support near you" onPress={() => router.push('/(caregiver)/hub/local' as any)} />
      <MBCard title="Self-Care" emoji="💛" subtitle="Burnout check, breathing, journal" onPress={() => router.push('/(caregiver)/hub/self-care' as any)} />
      <MBCard title="Crisis Support" emoji="🆘" subtitle="Always here when you need help" onPress={() => router.push('/(caregiver)/hub/crisis' as any)} />
    </MBSafeArea>
  );
}
