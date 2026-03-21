/**
 * mediaStore - NeuBridge Media State (Zustand)
 *
 * Manages family photos, voice messages, and music playlists
 * uploaded by caregivers. Used by photo album, voice messages,
 * singalong, and music player screens.
 */
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { FamilyMedia, Playlist, MediaType } from '../types';

interface MediaState {
  photos: FamilyMedia[];
  voiceMessages: FamilyMedia[];
  music: FamilyMedia[];
  playlists: Playlist[];
  isLoading: boolean;
  lastLoaded: string | null; // patient_id

  // Actions
  loadMedia: (patientId: string) => Promise<void>;
  getSignedUrl: (storagePath: string, bucket: string) => Promise<string | null>;
  uploadMedia: (patientId: string, file: {
    uri: string;
    name: string;
    type: string;
    mediaType: MediaType;
    displayName?: string;
    personName?: string;
    description?: string;
  }) => Promise<FamilyMedia | null>;
  deleteMedia: (mediaId: string, storagePath: string, bucket: string) => Promise<void>;
}

export const useMediaStore = create<MediaState>((set, get) => ({
  photos: [],
  voiceMessages: [],
  music: [],
  playlists: [],
  isLoading: false,
  lastLoaded: null,

  loadMedia: async (patientId) => {
    if (get().lastLoaded === patientId) return; // Cache hit
    set({ isLoading: true });

    try {
      const { data } = await supabase
        .from('family_media')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      const all = data ?? [];
      set({
        photos: all.filter((m) => m.media_type === 'photo'),
        voiceMessages: all.filter((m) => m.media_type === 'voice_message'),
        music: all.filter((m) => m.media_type === 'music'),
        isLoading: false,
        lastLoaded: patientId,
      });

      // Load playlists separately
      const { data: playlists } = await supabase
        .from('playlists')
        .select('*')
        .eq('patient_id', patientId);
      set({ playlists: playlists ?? [] });
    } catch {
      set({ isLoading: false });
    }
  },

  getSignedUrl: async (storagePath, bucket) => {
    const { data } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, 3600); // 1 hour
    return data?.signedUrl ?? null;
  },

  uploadMedia: async (patientId, file) => {
    try {
      const bucket = file.mediaType === 'photo' ? 'family-photos'
        : file.mediaType === 'voice_message' ? 'voice-messages'
        : 'music-uploads';

      const ext = file.name.split('.').pop();
      const storagePath = `${patientId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(storagePath, { uri: file.uri, name: file.name, type: file.type } as any);

      if (uploadError) throw uploadError;

      const { data: media, error: dbError } = await supabase
        .from('family_media')
        .insert({
          patient_id: patientId,
          media_type: file.mediaType,
          storage_path: storagePath,
          display_name: file.displayName,
          person_name: file.personName,
          description: file.description,
          tags: [],
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Update local state
      set((state) => {
        if (file.mediaType === 'photo') return { photos: [media, ...state.photos] };
        if (file.mediaType === 'voice_message') return { voiceMessages: [media, ...state.voiceMessages] };
        return { music: [media, ...state.music] };
      });

      return media;
    } catch {
      return null;
    }
  },

  deleteMedia: async (mediaId, storagePath, bucket) => {
    await supabase.storage.from(bucket).remove([storagePath]);
    await supabase.from('family_media').delete().eq('id', mediaId);

    set((state) => ({
      photos: state.photos.filter((m) => m.id !== mediaId),
      voiceMessages: state.voiceMessages.filter((m) => m.id !== mediaId),
      music: state.music.filter((m) => m.id !== mediaId),
    }));
  },
}));
