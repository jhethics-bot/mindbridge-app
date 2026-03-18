/**
 * MBSafeArea - Screen wrapper with persistent SOS + Home buttons
 * 
 * Every patient-facing screen MUST be wrapped in MBSafeArea.
 * This ensures the SOS button and Home button are always visible
 * and accessible, regardless of screen content.
 */
import React from 'react';
import { View, StyleSheet, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { A11Y } from '../../constants/accessibility';
import { MBButton } from './MBButton';

interface MBSafeAreaProps {
  children: React.ReactNode;
  showHome?: boolean;
  showSOS?: boolean;
  backgroundColor?: string;
  title?: string;
}

export function MBSafeArea({
  children,
  showHome = true,
  showSOS = true,
  backgroundColor = COLORS.cream,
  title,
}: MBSafeAreaProps) {
  const router = useRouter();

  const handleHome = () => {
    router.replace('/(patient)');
  };

  const handleSOS = () => {
    Alert.alert(
      'Send SOS?',
      'This will send your location to your emergency contacts.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes, Send SOS', style: 'destructive', onPress: () => router.push('/(patient)/sos') },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} />
      
      {/* Header with Home and SOS */}
      <View style={styles.header}>
        {showHome ? (
          <MBButton
            label="Home"
            variant="ghost"
            size="compact"
            onPress={handleHome}
            accessibilityHint="Return to the main screen"
          />
        ) : (
          <View style={styles.placeholder} />
        )}
        
        {title && (
          <View style={styles.titleContainer}>
            <MBButton
              label={title}
              variant="ghost"
              size="compact"
              onPress={() => {}}
              disabled
              textStyle={{ color: COLORS.navy, fontWeight: '700' }}
            />
          </View>
        )}
        
        {showSOS ? (
          <MBButton
            label="SOS"
            variant="sos"
            size="compact"
            onPress={handleSOS}
            accessibilityHint="Open emergency help screen"
          />
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      {/* Screen content */}
      <View style={styles.content}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: A11Y.screenPadding,
    paddingVertical: 8,
    minHeight: 60,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  placeholder: {
    width: 80,
  },
  content: {
    flex: 1,
    paddingHorizontal: A11Y.screenPadding,
  },
});
