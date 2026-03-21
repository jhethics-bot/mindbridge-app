/**
 * NeuBridge Push Notifications Service
 *
 * Handles Expo push token registration, local notification scheduling
 * (medication reminders, activity nudges), and incoming notification
 * response routing. Tokens are persisted to Supabase push_tokens table.
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure how notifications appear when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register for push notifications and save token to Supabase.
 * Call once after successful auth.
 */
export async function registerForPushNotifications(userId: string): Promise<string | null> {
  // Push only works on physical devices
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

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

  // Android needs a notification channel
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

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
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
}

/**
 * Schedule a daily activity nudge at a preferred time.
 */
export async function scheduleActivityNudge(params: {
  hour: number;
  minute: number;
  patientName?: string;
}): Promise<string> {
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
}

/**
 * Cancel a specific scheduled notification by identifier.
 */
export async function cancelNotification(identifier: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(identifier);
}

/**
 * Cancel all scheduled notifications.
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get all currently scheduled notifications.
 */
export async function getScheduledNotifications() {
  return Notifications.getAllScheduledNotificationsAsync();
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
  // Fires when notification received while app is foregrounded
  const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
    console.log('Notification received:', notification.request.content.title);
  });

  // Fires when user taps a notification
  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as Record<string, unknown>;
    onNotificationTap?.(data);
  });

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}
