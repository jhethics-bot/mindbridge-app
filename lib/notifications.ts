// lib/notifications.ts
// Push notifications are only available in development builds, not Expo Go.
// All functions gracefully no-op when running in Expo Go.
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';

const isExpoGo = Constants.appOwnership === 'expo';

/**
 * Register for push notifications and save token to Supabase.
 * No-ops in Expo Go.
 */
export async function registerForPushNotifications(userId: string): Promise<string | null> {
  if (isExpoGo || Platform.OS === 'web') return null;
  try {
    const Notifications = await import('expo-notifications');
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return null;
    }

    // Android needs notification channels
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'NeuBridge',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: '#2A9D8F',
      });

      await Notifications.setNotificationChannelAsync('medications', {
        name: 'Medication Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#E9C46A',
      });
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: undefined,
    });
    const token = tokenData.data;

    // Upsert token to Supabase
    await supabase
      .from('push_tokens')
      .upsert(
        {
          user_id: userId,
          token,
          platform: Platform.OS,
          is_active: true,
        },
        { onConflict: 'user_id' }
      );

    return token;
  } catch (error) {
    console.log('Error getting push token:', error);
    return null;
  }
}

/**
 * Configure foreground notification display.
 * No-ops in Expo Go.
 */
export function setNotificationHandler(): void {
  if (isExpoGo) return;
  import('expo-notifications').then((Notifications) => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }).catch(() => {});
}

/**
 * Add listeners for incoming notifications and tap responses.
 * Returns cleanup object with remove(). No-ops in Expo Go.
 */
export function addNotificationListeners(
  onNotificationTap?: (data: Record<string, unknown>) => void
): { remove: () => void } {
  if (isExpoGo) return { remove: () => {} };

  let receivedSub: any;
  let responseSub: any;

  import('expo-notifications').then((Notifications) => {
    receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification.request.content.title);
    });

    responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      onNotificationTap?.(data);
    });
  }).catch(() => {});

  return {
    remove: () => {
      receivedSub?.remove();
      responseSub?.remove();
    },
  };
}

/**
 * Schedule a local medication reminder notification.
 */
export async function scheduleMedicationReminder(params: {
  medicationName: string;
  hour: number;
  minute: number;
  identifier?: string;
}): Promise<string> {
  if (isExpoGo) return '';
  try {
    const Notifications = await import('expo-notifications');
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Medication Reminder 💊',
        body: `Time to take ${params.medicationName}`,
        data: { type: 'medication', name: params.medicationName },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: params.hour,
        minute: params.minute,
      },
      identifier: params.identifier,
    });
    return id;
  } catch {
    return '';
  }
}

/**
 * Schedule a daily activity nudge at a preferred time.
 */
export async function scheduleActivityNudge(params: {
  hour: number;
  minute: number;
  patientName?: string;
}): Promise<string> {
  if (isExpoGo) return '';
  try {
    const Notifications = await import('expo-notifications');
    const name = params.patientName || 'your loved one';
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Daily Activities Ready 🌟',
        body: `${name}'s personalized activities are waiting. A few minutes can brighten the day!`,
        data: { type: 'activity_nudge' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: params.hour,
        minute: params.minute,
      },
      identifier: 'daily-activity-nudge',
    });
    return id;
  } catch {
    return '';
  }
}

/**
 * Cancel a specific scheduled notification by identifier.
 */
export async function cancelNotification(identifier: string): Promise<void> {
  if (isExpoGo) return;
  try {
    const Notifications = await import('expo-notifications');
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {}
}

/**
 * Cancel all scheduled notifications.
 */
export async function cancelAllNotifications(): Promise<void> {
  if (isExpoGo) return;
  try {
    const Notifications = await import('expo-notifications');
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}

/**
 * Get all currently scheduled notifications.
 */
export async function getScheduledNotifications() {
  if (isExpoGo) return [];
  try {
    const Notifications = await import('expo-notifications');
    return Notifications.getAllScheduledNotificationsAsync();
  } catch {
    return [];
  }
}

/**
 * Deactivate push token on sign-out.
 */
export async function deactivatePushToken(userId: string): Promise<void> {
  await supabase
    .from('push_tokens')
    .update({ is_active: false })
    .eq('user_id', userId);
}
