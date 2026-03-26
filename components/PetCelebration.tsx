/**
 * PetCelebration - Shows companion pet celebrating game completion
 *
 * Drop this into any game's "complete" screen to show the pet
 * bouncing happily with a proud message. Holds for 3 seconds.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CompanionPet, type PetAnimationState } from './CompanionPet';
import { usePetStore } from '../stores/petStore';
import { useSettingsStore } from '../stores/settingsStore';

interface PetCelebrationProps {
  patientId: string;
}

export function PetCelebration({ patientId }: PetCelebrationProps) {
  const { pet, moodState } = usePetStore();
  const companionPetEnabled = useSettingsStore(s => s.toggles?.companion_pet_enabled ?? true);
  const [animState, setAnimState] = useState<PetAnimationState>('celebrate');

  useEffect(() => {
    // After 3 seconds, return to idle
    const timer = setTimeout(() => setAnimState('idle'), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!pet || !companionPetEnabled) return null;

  return (
    <View style={styles.container}>
      <CompanionPet
        petId={pet.id}
        petType={pet.petType}
        petName={pet.petName}
        colorPrimary={pet.colorPrimary}
        moodState={moodState}
        patientId={patientId}
        size={90}
        animationState={animState}
        showCelebration={animState === 'celebrate'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 12,
  },
});
