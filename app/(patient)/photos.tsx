/**
 * Photo Album Screen
 * Queries family_media table for photos. Shows era-grouped grid.
 * Tap photo to view large. Stage-adaptive text size.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, Image, Dimensions, Modal } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { MBSafeArea } from '../../components/ui/MBSafeArea';
import { MBButton } from '../../components/ui/MBButton';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import { supabase, logActivitySession, getCurrentProfile } from '../../lib/supabase';
import type { DiseaseStage } from '../../types';

const { width: SCREEN_W } = Dimensions.get('window');

interface Photo {
  id: string;
  display_name?: string;
  description?: string;
  person_name?: string;
  era?: string;
  playback_url?: string;
}

const FALLBACK_PHOTOS: Photo[] = [
  { id: '1', display_name: 'Family Gathering', era: '1990s', description: 'A warm family gathering' },
  { id: '2', display_name: 'Garden', era: '2000s', description: 'Beautiful flowers in the garden' },
  { id: '3', display_name: 'Holiday', era: '1980s', description: 'A holiday celebration' },
];

export default function PhotosScreen() {
  const router = useRouter();
  const [stage, setStage] = useState<DiseaseStage>('middle');
  const [photos, setPhotos] = useState<Photo[]>(FALLBACK_PHOTOS);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const startTime = React.useRef(Date.now());
  const patientId = React.useRef('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const p = await getCurrentProfile();
      if (p) { setStage(p.stage as DiseaseStage); patientId.current = p.id; }

      const { data } = await supabase
        .from('family_media')
        .select('*')
        .eq('patient_id', p?.id)
        .eq('media_type', 'photo')
        .order('sort_order');

      if (data && data.length > 0) {
        const mapped = data.map((m: any) => ({
          id: m.id,
          display_name: m.display_name,
          description: m.description,
          person_name: m.person_name,
          era: m.era,
          playback_url: m.playback_url || undefined,
        }));
        setPhotos(mapped);
      }
    } catch {}
  }

  function openPhoto(photo: Photo) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPhoto(photo);
  }

  async function closePhoto() {
    if (selectedPhoto) {
      // Log viewing session
      try {
        if (patientId.current) {
          const dur = Math.round((Date.now() - startTime.current) / 1000);
          await logActivitySession({
            patient_id: patientId.current,
            activity: 'photo_album',
            stage_at_time: stage,
            difficulty_params: {},
            score: { photos_viewed: 1, photo_id: selectedPhoto.id },
            duration_seconds: dur,
            completed: true,
          });
        }
      } catch {}
    }
    setSelectedPhoto(null);
  }

  const colCount = stage === 'late' ? 1 : 2;
  const imgSize = (SCREEN_W - A11Y.screenPadding * 2 - 12) / colCount;
  const fontSize = stage === 'late' ? 24 : stage === 'middle' ? 20 : 18;

  return (
    <MBSafeArea showHome showSOS title="Photo Album">
      <View style={st.container}>
        <Text style={st.heading}>Your Photos</Text>

        <FlatList
          data={photos}
          keyExtractor={item => item.id}
          numColumns={colCount}
          key={colCount} // re-render on column change
          columnWrapperStyle={colCount > 1 ? { gap: 12 } : undefined}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => openPhoto(item)}
              accessibilityRole="button"
              accessibilityLabel={item.display_name || 'Photo'}
              style={[st.photoCard, { width: imgSize }]}
            >
              {item.playback_url ? (
                <Image source={{ uri: item.playback_url }} style={[st.photoImage, { width: imgSize - 16, height: imgSize - 16 }]} resizeMode="cover" />
              ) : (
                <View style={[st.photoPlaceholder, { width: imgSize - 16, height: imgSize - 16 }]}>
                  <Text style={{ fontSize: 48 }}>📷</Text>
                  {item.display_name && <Text style={st.placeholderName}>{item.display_name}</Text>}
                  {item.description && <Text style={st.placeholderDesc} numberOfLines={2}>{item.description}</Text>}
                </View>
              )}
              <Text style={[st.photoTitle, { fontSize: Math.min(fontSize, 18) }]} numberOfLines={1}>
                {item.display_name || item.person_name || 'Photo'}
              </Text>
              {item.era && <Text style={st.photoEra}>{item.era}</Text>}
            </Pressable>
          )}
          contentContainerStyle={{ paddingBottom: 20, gap: 12 }}
        />

        {/* Full-screen photo modal */}
        <Modal visible={!!selectedPhoto} animationType="fade" transparent>
          <View style={st.modalOverlay}>
            <View style={st.modalContent}>
              {selectedPhoto?.playback_url ? (
                <Image source={{ uri: selectedPhoto.playback_url }}
                  style={st.modalImage} resizeMode="contain" />
              ) : (
                <View style={st.modalPlaceholder}>
                  <Text style={{ fontSize: 100 }}>📷</Text>
                </View>
              )}
              <Text style={[st.modalTitle, { fontSize }]}>
                {selectedPhoto?.display_name || selectedPhoto?.person_name || 'Photo'}
              </Text>
              {selectedPhoto?.description && (
                <Text style={st.modalDescription}>{selectedPhoto.description}</Text>
              )}
              <MBButton label="Close" variant="secondary" size="large" onPress={closePhoto}
                style={{ marginTop: 20 }} />
            </View>
          </View>
        </Modal>
      </View>
    </MBSafeArea>
  );
}

const st = StyleSheet.create({
  container: { flex: 1 },
  heading: { fontSize: A11Y.fontSizeHeading, fontWeight: '700', color: COLORS.navy, marginBottom: 16 },
  photoCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 8, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  photoImage: { borderRadius: 12 },
  photoPlaceholder: {
    borderRadius: 12, backgroundColor: COLORS.glow, justifyContent: 'center', alignItems: 'center', padding: 8,
  },
  placeholderName: { fontSize: 14, fontWeight: '600', color: COLORS.navy, marginTop: 8, textAlign: 'center' },
  placeholderDesc: { fontSize: 12, color: COLORS.gray, marginTop: 4, textAlign: 'center' },
  photoTitle: { fontWeight: '600', color: COLORS.navy, marginTop: 8 },
  photoEra: { fontSize: 14, color: COLORS.gray, marginTop: 2 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center',
    padding: 24,
  },
  modalContent: { width: '100%', alignItems: 'center' },
  modalImage: { width: SCREEN_W - 48, height: SCREEN_W - 48, borderRadius: 16 },
  modalPlaceholder: {
    width: SCREEN_W - 48, height: SCREEN_W - 48, borderRadius: 16,
    backgroundColor: COLORS.cream, justifyContent: 'center', alignItems: 'center',
  },
  modalTitle: { fontWeight: '700', color: COLORS.white, marginTop: 16, textAlign: 'center' },
  modalDescription: { fontSize: 16, color: '#CCC', marginTop: 8, textAlign: 'center' },
});
