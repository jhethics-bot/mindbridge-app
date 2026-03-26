/**
 * LanguageSelector — Toggle between English and Español
 */
import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useI18nStore } from '../stores/i18nStore';
import { COLORS } from '../constants/colors';

export function LanguageSelector() {
  const { locale, switchLocale, availableLocales } = useI18nStore();

  const handleSwitch = async (code: string) => {
    if (code === locale) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await switchLocale(code);
  };

  return (
    <View style={st.container}>
      {availableLocales.map(lang => (
        <Pressable
          key={lang.code}
          onPress={() => handleSwitch(lang.code)}
          accessibilityRole="button"
          accessibilityLabel={`Switch to ${lang.name}`}
          accessibilityState={{ selected: locale === lang.code }}
          style={[st.chip, locale === lang.code && st.chipActive]}
        >
          <Text style={[st.label, locale === lang.code && st.labelActive]}>
            {lang.nativeName}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  container: { flexDirection: 'row', gap: 10 },
  chip: {
    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    backgroundColor: COLORS.white, borderWidth: 2, borderColor: 'transparent',
  },
  chipActive: { borderColor: COLORS.teal, backgroundColor: '#F0FAF8' },
  label: { fontSize: 16, fontWeight: '600', color: COLORS.navy },
  labelActive: { color: COLORS.teal },
});
