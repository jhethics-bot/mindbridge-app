/**
 * Onboarding Step 9 — "Meet Your Companion"
 * Patient chooses animal type, names the pet, sees confirmation.
 * Saves to companion_pets table. Zero typing for patient.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import { supabase, getCurrentProfile } from '../../lib/supabase';
import { CompanionPet } from '../../components/CompanionPet';
import type { PetType } from '../../lib/petMoodEngine';

type Step = 'choose_animal' | 'choose_name' | 'confirmation';

const PET_OPTIONS: { type: PetType; label: string; emoji: string }[] = [
  { type: 'dog', label: 'Dog', emoji: '🐕' },
  { type: 'cat', label: 'Cat', emoji: '🐱' },
  { type: 'bird', label: 'Bird', emoji: '🐦' },
  { type: 'bunny', label: 'Bunny', emoji: '🐰' },
];

const NAME_SUGGESTIONS: Record<PetType, string[]> = {
  dog: ['Biscuit', 'Buddy', 'Daisy', 'Max'],
  cat: ['Whiskers', 'Mittens', 'Luna', 'Oliver'],
  bird: ['Tweety', 'Sunny', 'Sky', 'Pip'],
  bunny: ['Clover', 'Cotton', 'Honey', 'Thumper'],
};

export default function OnboardingPetScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('choose_animal');
  const [petType, setPetType] = useState<PetType | null>(null);
  const [petName, setPetName] = useState('');
  const [patientName, setPatientName] = useState('');
  const [saving, setSaving] = useState(false);
  const [petId, setPetId] = useState('');

  useEffect(() => {
    (async () => {
      const profile = await getCurrentProfile();
      if (profile?.display_name) setPatientName(profile.display_name);
    })();
  }, []);

  function selectAnimal(type: PetType) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPetType(type);
    setStep('choose_name');
  }

  function selectName(name: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPetName(name);
  }

  async function confirmPet() {
    if (!petType || !petName.trim()) return;
    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSaving(false); return; }

      // Find care_relationship for this patient
      const { data: rel } = await supabase
        .from('care_relationships')
        .select('id')
        .eq('patient_id', user.id)
        .limit(1)
        .single();

      if (!rel) { setSaving(false); return; }

      const { data: pet, error } = await supabase
        .from('companion_pets')
        .upsert({
          care_relationship_id: rel.id,
          pet_type: petType,
          pet_name: petName.trim(),
          color_primary: 'golden',
          color_secondary: null,
          caregiver_voice_url: null,
        }, { onConflict: 'care_relationship_id' })
        .select('id')
        .single();

      if (error) throw error;
      if (pet) setPetId(pet.id);

      setStep('confirmation');
    } catch (e) {
      console.warn('[OnboardingPet] Save error:', e);
    }
    setSaving(false);
  }

  function handleContinue() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(patient)' as any);
  }

  // ── Step 1: Choose Animal ──
  if (step === 'choose_animal') {
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.container}>
          <Text style={st.stepLabel}>Step 9 of 10</Text>
          <Text style={st.title}>Meet Your Companion</Text>
          <Text style={st.subtitle}>Choose a friendly companion to keep you company.</Text>

          <View style={st.grid}>
            {PET_OPTIONS.map(opt => (
              <Pressable
                key={opt.type}
                onPress={() => selectAnimal(opt.type)}
                accessibilityRole="button"
                accessibilityLabel={`Choose ${opt.label}`}
                style={({ pressed }) => [
                  st.animalCard,
                  petType === opt.type && st.animalCardActive,
                  pressed && { transform: [{ scale: 0.96 }] },
                ]}
              >
                <Text style={st.animalEmoji}>{opt.emoji}</Text>
                <Text style={st.animalLabel}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Step 2: Choose Name ──
  if (step === 'choose_name') {
    const suggestions = petType ? NAME_SUGGESTIONS[petType] : [];
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.container}>
          <Text style={st.stepLabel}>Step 9 of 10</Text>
          <Text style={st.title}>Name Your {petType ? PET_OPTIONS.find(p => p.type === petType)?.label : 'Pet'}</Text>
          <Text style={st.subtitle}>Tap a name or type your own.</Text>

          <View style={st.nameGrid}>
            {suggestions.map(name => (
              <Pressable
                key={name}
                onPress={() => selectName(name)}
                accessibilityRole="button"
                accessibilityLabel={`Name your pet ${name}`}
                style={({ pressed }) => [
                  st.nameChip,
                  petName === name && st.nameChipActive,
                  pressed && { transform: [{ scale: 0.96 }] },
                ]}
              >
                <Text style={[st.nameText, petName === name && st.nameTextActive]}>{name}</Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            style={st.nameInput}
            placeholder="Or type a name..."
            placeholderTextColor={COLORS.gray}
            value={petName}
            onChangeText={setPetName}
            maxLength={20}
          />

          <Pressable
            onPress={confirmPet}
            disabled={!petName.trim() || saving}
            accessibilityRole="button"
            accessibilityLabel={`Confirm pet name ${petName}`}
            style={[st.confirmBtn, (!petName.trim() || saving) && { opacity: 0.5 }]}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={st.confirmBtnText}>Continue</Text>
            )}
          </Pressable>

          <Pressable onPress={() => { setStep('choose_animal'); setPetName(''); }}>
            <Text style={st.backLink}>← Change animal</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Step 3: Confirmation ──
  return (
    <SafeAreaView style={st.safe}>
      <View style={[st.container, { justifyContent: 'center' }]}>
        <Text style={st.confirmTitle}>
          {patientName || 'You'}, meet {petName}!
        </Text>

        {petType && (
          <View style={st.petPreview}>
            <CompanionPet
              petId={petId}
              petType={petType}
              petName={petName}
              colorPrimary="golden"
              moodState="happy"
              patientId=""
              size={160}
            />
          </View>
        )}

        <Text style={st.confirmSubtitle}>
          {petName} will be here to greet you every day.
        </Text>

        <Pressable
          onPress={handleContinue}
          accessibilityRole="button"
          accessibilityLabel="Continue to home screen"
          style={st.confirmBtn}
        >
          <Text style={st.confirmBtnText}>Let's Go!</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.cream },
  container: { flex: 1, padding: A11Y.screenPadding, justifyContent: 'flex-start' },
  stepLabel: { fontSize: 14, color: COLORS.gray, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.navy, marginBottom: 8 },
  subtitle: { fontSize: 18, color: COLORS.gray, marginBottom: 32 },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center',
  },
  animalCard: {
    width: '45%' as any, aspectRatio: 1, backgroundColor: COLORS.white, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'transparent',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    minHeight: A11Y.preferredTouchTarget,
  },
  animalCardActive: { borderColor: COLORS.teal, backgroundColor: '#F0FAF8' },
  animalEmoji: { fontSize: 56, marginBottom: 8 },
  animalLabel: { fontSize: 20, fontWeight: '700', color: COLORS.navy },
  nameGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  nameChip: {
    paddingHorizontal: 24, paddingVertical: 14, backgroundColor: COLORS.white, borderRadius: 16,
    borderWidth: 2, borderColor: COLORS.lightGray, minHeight: A11Y.preferredTouchTarget,
    justifyContent: 'center', alignItems: 'center',
  },
  nameChipActive: { borderColor: COLORS.teal, backgroundColor: '#F0FAF8' },
  nameText: { fontSize: 20, fontWeight: '600', color: COLORS.navy },
  nameTextActive: { color: COLORS.teal },
  nameInput: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 16, fontSize: 20,
    color: COLORS.navy, borderWidth: 1, borderColor: COLORS.lightGray, marginBottom: 20, textAlign: 'center',
  },
  confirmBtn: {
    backgroundColor: COLORS.teal, borderRadius: 16, paddingVertical: 18, alignItems: 'center',
    marginBottom: 16, minHeight: A11Y.preferredTouchTarget,
  },
  confirmBtnText: { fontSize: 22, fontWeight: '700', color: COLORS.white },
  backLink: { fontSize: 16, color: COLORS.teal, fontWeight: '600', textAlign: 'center' },
  confirmTitle: { fontSize: 32, fontWeight: '700', color: COLORS.navy, textAlign: 'center', marginBottom: 24 },
  confirmSubtitle: { fontSize: 18, color: COLORS.gray, textAlign: 'center', marginBottom: 32 },
  petPreview: { alignItems: 'center', marginBottom: 24 },
});
