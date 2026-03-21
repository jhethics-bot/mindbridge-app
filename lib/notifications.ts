/**
 * NeuBridge Push Notifications Service
 *
 * Handles Expo push token registration, local notification scheduling
 * (medication reminders, activity nudges), and incoming notification
 * response routing. Tokens are persisted to Supabase push_tokens table.
 */
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Lazy-load expo-notifications to avoid crashes in Expo Go dev builds
let Notifications: typeof import('expo-notifications') | null = null;

async function getNotifications() {
  if (!Notifications) {
    try {
      Notifications = await import('expo-notifications');
    } catch (e) {
      console.warn('[Notifications] expo-notifications not available:', e);
      return null;
    }
  }
  return Notifications;
}

// Configure how notifications appear when app is foregrounded
// Wrapped in try/catch for Expo Go compatibility
try {
  const NotifModule = require('expo-notifications');
  NotifModule.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (e) {
  console.warn('[Notifications] Could not set notification handler:', e);
}

/**
 * Register for push notifications and save token to Supabase.
 * Call once after successful auth.
 */
export async function registerForPushNotifications(userId: string): Promise<string | null> {
  // Push only works on physical devices
  if (Platform.OS === 'web') {
    console.log('Push notifications require a mobile device');
    return null;
  }

  const Notif = await getNotifications();
  if (!Notif) return null;

  try {
    const { status: existing } = await Notif.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notif.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return null;
    }

    // Android needs a notification channel
    if (Platform.OS === 'android') {
      await Notif.setNotificationChannelAsync('default', {
        name: 'NeuBridge',
        importance: Notif.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: '#2A9D8F',
      });

      await Notif.setNotificationChannelAsync('medications', {
        name: 'Medication Reminders',
        importance: Notif.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#E9C46A',
      });
    }

    const tokenData = await Notif.getExpoPushTokenAsync({
      projectId: undefined, // Uses app.json expo.extra.eas.projectId
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
 * Schedule a local medication reminder notification.
 */
export async function scheduleMedicationReminder(params: {
  medicationName: string;
  hour: number;
  minute: number;
  identifier?: string;
}): Promise<string> {
  const Notif = await getNotifications();
  if (!Notif) return '';

  const id = await Notif.scheduleNotificationAsync({
    content: {
      title: 'Medication Reminder 💊',
      body: `Time to take ${params.medicationName}`,
      data: { type: 'medication', name: params.medicationName },
      sound: true,
    },
    trigger: {
      type: Notif.SchedulableTriggerInputTypes.DAILY,
      hour: params.hour,
      minute: params.minute,
    },
    identifier: params.identifier,
  });
  return id;
}

/**
 * Schedule a daily activity nudge at a preferred time.
 */
export async function scheduleActivityNudge(params: {
  hour: number;
  minute: number;
  patientName?: string;
}): Promise<string> {
  const Notif = await getNotifications();
  if (!Notif) return '';

  const name = params.patientName || 'your loved one';
  const id = await Notif.scheduleNotificationAsync({
    content: {
      title: 'Daily Activities Ready 🌟',
      body: `${name}'s personalized activities are waiting. A few minutes can brighten the day!`,
      data: { type: 'activity_nudge' },
    },
    trigger: {
      type: Notif.SchedulableTriggerInputTypes.DAILY,
      hour: params.hour,
      minute: params.minute,
    },
    identifier: 'daily-activity-nudge',
  });
  return id;
}

/**
 * Cancel a specific scheduled notification by identifier.
 */
export async function cancelNotification(identifier: string): Promise<void> {
  const Notif = await getNotifications();
  if (!Notif) return;
  await Notif.cancelScheduledNotificationAsync(identifier);
}

/**
 * Cancel all scheduled notifications.
 */
export async function cancelAllNotifications(): Promise<void> {
  const Notif = await getNotifications();
  if (!Notif) return;
  await Notif.cancelAllScheduledNotificationsAsync();
}

/**
 * Get all currently scheduled notifications.
 */
export async function getScheduledNotifications() {
  const Notif = await getNotifications();
  if (!Notif) return [];
  return Notif.getAllScheduledNotificationsAsync();
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

/**
 * Add listeners for incoming notifications and tap responses.
 * Returns cleanup function. Call in useEffect.
 */
export function addNotificationListeners(onNotificationTap?: (data: Record<string, unknown>) => void) {
  try {
    const NotifModule = require('expo-notifications');

    // Fires when notification received while app is foregrounded
    const receivedSub = NotifModule.addNotificationReceivedListener((notification: any) => {
      console.log('Notification received:', notification.request.content.title);
    });

    // Fires when user taps a notification
    const responseSub = NotifModule.addNotificationResponseReceivedListener((response: any) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      onNotificationTap?.(data);
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  } catch (e) {
    console.warn('[Notifications] Could not add listeners:', e);
    return () => {};
  }
}
