/**
 * Connect Screen
 * Hub for social and emotional connection: Photo Album, Voice Journal, Achievements.
 * Never shows infinite spinner — 3-second timeout forces UI render.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MBSafeArea } from '../../components/ui/MBSafeArea';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import { supabase } from '../../lib/supabase';

interface ConnectItem {
  id: string;
  title: string;
  emoji: string;
  description: string;
  route: string;
  bgColor: string;
  count?: number;
  emptyText?: string;
}

export default function ConnectScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [photoCount, setPhotoCount] = useState(0);
  const [journalCount, setJournalCount] = useState(0);

  useEffect(() => {
    // 3-second timeout — always show UI, never infinite spinner
    const timer = setTimeout(() => setLoading(false), 3000);

    fetchCounts().finally(() => {
      clearTimeout(timer);
      setLoading(false);
    });

    return () => clearTimeout(timer);
  }, []);

  const fetchCounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch photo count
      try {
        const { count } = await supabase
          .from('photos')
          .select('*', { count: 'exact', head: true })
          .eq('patient_id', user.id);
        setPhotoCount(count ?? 0);
      } catch {
        // Photo count unavailable — show 0
      }

      // Fetch journal count
      try {
        const { count } = await supabase
          .from('voice_journals')
          .select('*', { count: 'exact', head: true })
          .eq('patient_id', user.id);
        setJournalCount(count ?? 0);
      } catch {
        // Journal count unavailable — show 0
      }
    } catch {
      // Auth or network error — render UI with zero counts
    }
  };

  const CONNECT_ITEMS: ConnectItem[] = [
    {
      id: 'photos',
      title: 'Photo Album',
      emoji: '📸',
      description: photoCount > 0 ? `${photoCount} photos` : 'No photos added yet',
      route: '/(patient)/photos',
      bgColor: '#FCE4EC',
    },
    {
      id: 'journal',
      title: 'Voice Journal',
      emoji: '🎙️',
      description: journalCount > 0 ? `${journalCount} entries` : 'No voice messages yet',
      route: '/(patient)/journal',
      bgColor: '#E3F2FD',
    },
    {
      id: 'achievements',
      title: 'My Achievements',
      emoji: '🏆',
      description: 'See everything you\'ve accomplished',
      route: '/(patient)/achievements',
      bgColor: COLORS.glow,
    },
  ];

  const handlePress = (item: ConnectItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(item.route as any);
  };

  if (loading) {
    return (
      <MBSafeArea>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.teal} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </MBSafeArea>
    );
  }

  return (
    <MBSafeArea>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Connect</Text>
        <Text style={styles.subtitle}>Stay close to what matters</Text>

        <View style={styles.list}>
          {CONNECT_ITEMS.map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: item.bgColor },
                pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
              ]}
              onPress={() => handlePress(item)}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}. ${item.description}`}
            >
              <Text style={styles.emoji}>{item.emoji}</Text>
              <View style={styles.textArea}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDesc}>{item.description}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </MBSafeArea>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: A11Y.fontSizeBody,
    color: COLORS.gray,
    marginTop: 12,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  content: {
    padding: A11Y.screenPadding,
    paddingBottom: 100,
  },
  heading: {
    fontSize: A11Y.fontSizeHeading,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: A11Y.fontSizeBody,
    color: COLORS.gray,
    marginBottom: A11Y.sectionGap,
  },
  list: {
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: A11Y.cardPadding,
    minHeight: A11Y.preferredTouchTarget * 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  emoji: {
    fontSize: 44,
    marginRight: 16,
  },
  textArea: {
    flex: 1,
  },
  cardTitle: {
    fontSize: A11Y.fontSizeBodyLarge,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: A11Y.fontSizeBody,
    color: COLORS.gray,
  },
});
