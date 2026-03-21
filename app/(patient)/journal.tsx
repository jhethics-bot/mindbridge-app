/**
 * Voice Journaling / Legacy Stories
 *
 * Guided journal prompts organized by life chapter (childhood, family,
 * faith, etc.). Patient selects a prompt and records a text entry.
 * Voice recording stubbed until dev build (expo-av not in Expo Go).
 * Entries saved to journal_entries, viewable by caregiver as legacy book.
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, Pressable, TextInput, ScrollView, FlatList,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import { supabase, getCurrentProfile } from '../../lib/supabase';
import type { DiseaseStage } from '../../types';

interface Prompt {
  id: string;
  prompt_text: string;
  category: string;
  stage_appropriate: string[];
}

interface JournalEntry {
  id: string;
  title: string | null;
  transcript: string | null;
  category: string | null;
  ai_prompt: string | null;
  is_favorite: boolean;
  created_at: string;
}

const CATEGORY_META: Record<string, { emoji: string; label: string }> = {
  childhood: { emoji: '🏡', label: 'Childhood' },
  family: { emoji: '👨‍👩‍👧‍👦', label: 'Family' },
  marriage: { emoji: '💍', label: 'Marriage' },
  career: { emoji: '💼', label: 'Career' },
  faith: { emoji: '🙏', label: 'Faith' },
  travel: { emoji: '✈️', label: 'Travel' },
  holidays: { emoji: '🎄', label: 'Holidays' },
  grandkids: { emoji: '👶', label: 'Grandchildren' },
  general: { emoji: '💭', label: 'Reflections' },
};

type Screen = 'categories' | 'prompts' | 'write' | 'entries' | 'view';

export default function JournalScreen() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>('categories');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [stage, setStage] = useState<DiseaseStage>('middle');

  // Prompt browsing
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);

  // Writing
  const [entryText, setEntryText] = useState('');
  const [entryTitle, setEntryTitle] = useState('');

  // Past entries
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [viewEntry, setViewEntry] = useState<JournalEntry | null>(null);

  useEffect(() => { init(); }, []);

  async function init() {
    try {
      const profile = await getCurrentProfile();
      if (!profile) { router.back(); return; }
      setPatientId(profile.id);
      setStage(profile.stage as DiseaseStage);

      // Load prompts appropriate for patient's stage
      const { data } = await supabase
        .from('journal_prompts')
        .select('*')
        .contains('stage_appropriate', [profile.stage || 'middle'])
        .order('category')
        .order('sort_order');

      const allPrompts = (data || []) as Prompt[];
      setPrompts(allPrompts);

      const cats = [...new Set(allPrompts.map((p) => p.category))];
      setCategories(cats);
    } catch {}
    setLoading(false);
  }

  async function saveEntry() {
    if (!entryText.trim()) {
      Alert.alert('Write something', 'Share a memory or thought before saving.');
      return;
    }

    setSaving(true);
    try {
      await supabase.from('journal_entries').insert({
        patient_id: patientId,
        entry_type: 'text',
        transcript: entryText.trim(),
        title: entryTitle.trim() || selectedPrompt?.prompt_text || 'Untitled',
        category: selectedPrompt?.category || 'general',
        ai_prompt: selectedPrompt?.prompt_text || null,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEntryText('');
      setEntryTitle('');
      setSelectedPrompt(null);
      setScreen('categories');
      Alert.alert('Saved! 🌟', 'Your story has been preserved.');
    } catch {
      Alert.alert('Error', 'Could not save. Please try again.');
    }
    setSaving(false);
  }

  async function loadEntries() {
    const { data } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(30);
    setEntries((data || []) as JournalEntry[]);
    setScreen('entries');
  }

  async function toggleFavorite(entry: JournalEntry) {
    const newVal = !entry.is_favorite;
    await supabase
      .from('journal_entries')
      .update({ is_favorite: newVal })
      .eq('id', entry.id);
    setEntries((prev) =>
      prev.map((e) => (e.id === entry.id ? { ...e, is_favorite: newVal } : e))
    );
    if (viewEntry?.id === entry.id) {
      setViewEntry({ ...entry, is_favorite: newVal });
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  if (loading) {
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.center}>
          <ActivityIndicator size="large" color={COLORS.teal} />
        </View>
      </SafeAreaView>
    );
  }

  // ── View Single Entry ──
  if (screen === 'view' && viewEntry) {
    return (
      <SafeAreaView style={st.safe}>
        <ScrollView contentContainerStyle={st.scroll}>
          <Pressable onPress={() => setScreen('entries')} style={st.backBtn}>
            <Text style={st.backText}>← Back</Text>
          </Pressable>
          <View style={st.viewHeader}>
            <Text style={st.viewTitle}>{viewEntry.title || 'Untitled'}</Text>
            <Pressable onPress={() => toggleFavorite(viewEntry)}>
              <Text style={{ fontSize: 28 }}>{viewEntry.is_favorite ? '⭐' : '☆'}</Text>
            </Pressable>
          </View>
          {viewEntry.ai_prompt && (
            <Text style={st.viewPrompt}>Prompt: "{viewEntry.ai_prompt}"</Text>
          )}
          <Text style={st.viewDate}>
            {new Date(viewEntry.created_at).toLocaleDateString([], {
              weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
            })}
          </Text>
          <View style={st.viewCard}>
            <Text style={st.viewText}>{viewEntry.transcript}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Past Entries List ──
  if (screen === 'entries') {
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.scroll}>
          <Pressable onPress={() => setScreen('categories')} style={st.backBtn}>
            <Text style={st.backText}>← Back</Text>
          </Pressable>
          <Text style={st.title}>My Stories</Text>
          <Text style={st.subtitle}>{entries.length} entries</Text>
          <FlatList
            data={entries}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 40 }}
            renderItem={({ item }) => (
              <Pressable
                style={st.entryCard}
                onPress={() => { setViewEntry(item); setScreen('view'); }}
              >
                <View style={st.entryHeader}>
                  <Text style={st.entryTitle} numberOfLines={1}>
                    {item.is_favorite ? '⭐ ' : ''}{item.title || 'Untitled'}
                  </Text>
                  <Text style={st.entryCat}>
                    {CATEGORY_META[item.category || 'general']?.emoji || '💭'}
                  </Text>
                </View>
                <Text style={st.entryPreview} numberOfLines={2}>{item.transcript}</Text>
                <Text style={st.entryDate}>
                  {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </Text>
              </Pressable>
            )}
            ListEmptyComponent={
              <View style={st.emptyState}>
                <Text style={{ fontSize: 48, marginBottom: 12 }}>📖</Text>
                <Text style={st.emptyText}>No stories yet. Start your first one!</Text>
              </View>
            }
          />
        </View>
      </SafeAreaView>
    );
  }

  // ── Write Entry ──
  if (screen === 'write') {
    return (
      <SafeAreaView style={st.safe}>
        <ScrollView contentContainerStyle={st.scroll} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => setScreen('prompts')} style={st.backBtn}>
            <Text style={st.backText}>← Back</Text>
          </Pressable>

          {selectedPrompt && (
            <View style={st.promptBanner}>
              <Text style={st.promptBannerText}>"{selectedPrompt.prompt_text}"</Text>
            </View>
          )}

          <Text style={st.sectionLabel}>Title (optional)</Text>
          <TextInput
            style={st.titleInput}
            value={entryTitle}
            onChangeText={setEntryTitle}
            placeholder="Give this story a name..."
            placeholderTextColor={COLORS.gray}
            maxLength={100}
          />

          <Text style={st.sectionLabel}>Your Story</Text>
          <TextInput
            style={st.storyInput}
            value={entryText}
            onChangeText={setEntryText}
            placeholder="Take your time. Share whatever comes to mind..."
            placeholderTextColor={COLORS.gray}
            multiline
            textAlignVertical="top"
            autoFocus
          />

          <Text style={st.charCount}>{entryText.length} characters</Text>

          <Pressable
            style={[st.saveBtn, saving && { opacity: 0.5 }]}
            onPress={saveEntry}
            disabled={saving}
          >
            <Text style={st.saveBtnText}>{saving ? 'Saving...' : 'Save Story 🌟'}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Prompts for Selected Category ──
  if (screen === 'prompts') {
    const catPrompts = prompts.filter((p) => p.category === selectedCategory);
    const meta = CATEGORY_META[selectedCategory] || { emoji: '💭', label: selectedCategory };

    return (
      <SafeAreaView style={st.safe}>
        <ScrollView contentContainerStyle={st.scroll}>
          <Pressable onPress={() => setScreen('categories')} style={st.backBtn}>
            <Text style={st.backText}>← Back</Text>
          </Pressable>
          <Text style={st.title}>{meta.emoji} {meta.label}</Text>
          <Text style={st.subtitle}>Choose a prompt to get started</Text>

          {catPrompts.map((p) => (
            <Pressable
              key={p.id}
              style={({ pressed }) => [st.promptCard, pressed && { backgroundColor: COLORS.glow }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedPrompt(p);
                setScreen('write');
              }}
            >
              <Text style={st.promptText}>{p.prompt_text}</Text>
              <Text style={st.promptArrow}>→</Text>
            </Pressable>
          ))}

          <Pressable
            style={st.freeWriteBtn}
            onPress={() => {
              setSelectedPrompt(null);
              setScreen('write');
            }}
          >
            <Text style={st.freeWriteText}>✏️ Free write (no prompt)</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Category Selection (Home) ──
  return (
    <SafeAreaView style={st.safe}>
      <ScrollView contentContainerStyle={st.scroll}>
        <Pressable onPress={() => router.back()} style={st.backBtn}>
          <Text style={st.backText}>← Home</Text>
        </Pressable>

        <Text style={st.title}>My Life Stories</Text>
        <Text style={st.subtitle}>Preserve your memories, one story at a time</Text>

        <View style={st.topActions}>
          <Pressable style={st.topActionBtn} onPress={loadEntries}>
            <Text style={{ fontSize: 20 }}>📖</Text>
            <Text style={st.topActionLabel}>My Stories</Text>
          </Pressable>
        </View>

        <Text style={st.sectionLabel}>Choose a chapter of your life</Text>

        {categories.map((cat) => {
          const meta = CATEGORY_META[cat] || { emoji: '💭', label: cat };
          const count = prompts.filter((p) => p.category === cat).length;
          return (
            <Pressable
              key={cat}
              style={({ pressed }) => [st.catCard, pressed && { backgroundColor: COLORS.glow }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedCategory(cat);
                setScreen('prompts');
              }}
            >
              <Text style={{ fontSize: 32 }}>{meta.emoji}</Text>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={st.catTitle}>{meta.label}</Text>
                <Text style={st.catCount}>{count} prompts</Text>
              </View>
              <Text style={st.catArrow}>→</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.cream },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: A11Y.screenPadding, paddingBottom: 40, flex: 1 },
  backBtn: { marginBottom: 8 },
  backText: { fontSize: 16, color: COLORS.teal, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.navy, marginBottom: 4 },
  subtitle: { fontSize: 16, color: COLORS.gray, marginBottom: 20 },
  sectionLabel: { fontSize: 16, fontWeight: '600', color: COLORS.navy, marginBottom: 10, marginTop: 8 },
  topActions: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  topActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.white, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16,
    borderWidth: 1, borderColor: COLORS.lightGray,
  },
  topActionLabel: { fontSize: 15, fontWeight: '600', color: COLORS.navy },
  catCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: 16, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  catTitle: { fontSize: 18, fontWeight: '600', color: COLORS.navy },
  catCount: { fontSize: 13, color: COLORS.gray, marginTop: 2 },
  catArrow: { fontSize: 20, color: COLORS.teal, fontWeight: '700' },
  promptCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: 14, padding: 16, marginBottom: 10,
    borderLeftWidth: 4, borderLeftColor: COLORS.gold,
  },
  promptText: { flex: 1, fontSize: 16, color: COLORS.navy, lineHeight: 22 },
  promptArrow: { fontSize: 18, color: COLORS.teal, fontWeight: '700', marginLeft: 10 },
  freeWriteBtn: {
    alignItems: 'center', padding: 14, marginTop: 10,
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.teal, borderStyle: 'dashed',
  },
  freeWriteText: { fontSize: 16, color: COLORS.teal, fontWeight: '600' },
  promptBanner: {
    backgroundColor: COLORS.glow, borderRadius: 14, padding: 16, marginBottom: 16,
    borderLeftWidth: 4, borderLeftColor: COLORS.gold,
  },
  promptBannerText: { fontSize: 17, color: COLORS.navy, fontStyle: 'italic', lineHeight: 24 },
  titleInput: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 14,
    fontSize: 16, color: COLORS.navy, borderWidth: 1, borderColor: COLORS.lightGray, marginBottom: 12,
  },
  storyInput: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 16,
    fontSize: 17, color: COLORS.navy, minHeight: 200, lineHeight: 26,
    borderWidth: 1, borderColor: COLORS.lightGray,
  },
  charCount: { fontSize: 12, color: COLORS.gray, textAlign: 'right', marginTop: 4 },
  saveBtn: {
    backgroundColor: COLORS.teal, borderRadius: 16, padding: 16,
    alignItems: 'center', marginTop: 20,
  },
  saveBtnText: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  entryCard: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  entryTitle: { fontSize: 16, fontWeight: '600', color: COLORS.navy, flex: 1 },
  entryCat: { fontSize: 18, marginLeft: 8 },
  entryPreview: { fontSize: 14, color: COLORS.gray, marginTop: 6, lineHeight: 20 },
  entryDate: { fontSize: 12, color: COLORS.gray, marginTop: 6 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, color: COLORS.gray, textAlign: 'center' },
  viewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  viewTitle: { fontSize: 24, fontWeight: '700', color: COLORS.navy, flex: 1 },
  viewPrompt: { fontSize: 14, color: COLORS.teal, fontStyle: 'italic', marginBottom: 4 },
  viewDate: { fontSize: 13, color: COLORS.gray, marginBottom: 16 },
  viewCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 20 },
  viewText: { fontSize: 17, color: COLORS.navy, lineHeight: 28 },
});
