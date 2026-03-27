/**
 * OfflineIndicator - NeuBridge Offline Banner Component
 *
 * Renders a small teal banner when the device is offline, with
 * an optional count of pending sync items. Returns null when online.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import { useOfflineStore } from '../stores/offlineStore';

function OfflineIndicator() {
  const isOnline = useOfflineStore((s) => s.isOnline);
  const pendingCount = useOfflineStore((s) => s.pendingCount);

  if (isOnline) return null;

  return (
    <View
      style={styles.banner}
      accessibilityRole="alert"
      accessibilityLabel={`You are offline.${pendingCount > 0 ? ` ${pendingCount} items waiting to sync.` : ''}`}
    >
      <Text style={styles.text}>
        You're offline. Some features may be limited.
      </Text>
      {pendingCount > 0 && (
        <Text style={styles.text}>
          {pendingCount} {pendingCount === 1 ? 'item' : 'items'} waiting to sync
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    backgroundColor: COLORS.teal,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
    lineHeight: 20,
  },
});

export default OfflineIndicator;
export { OfflineIndicator };
