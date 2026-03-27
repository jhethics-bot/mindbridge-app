import { useEffect, useRef } from "react";
import { Stack, useRouter } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { supabase } from "../lib/supabase";
import {
  registerForPushNotifications,
  deactivatePushToken,
  addNotificationListeners,
  setNotificationHandler,
} from "../lib/notifications";
import ErrorBoundary from "../components/ErrorBoundary";
import { OfflineIndicator } from "../components/OfflineIndicator";

export default function RootLayout() {
  const router = useRouter();
  const notifCleanup = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    // Configure foreground notification display
    setNotificationHandler();

    // Set up notification tap handler
    notifCleanup.current = addNotificationListeners((data) => {
      if (data.type === 'medication') {
        router.push('/(patient)/medications' as any);
      } else if (data.type === 'activity_nudge') {
        router.push('/(patient)' as any);
      }
    });
    return () => notifCleanup.current?.remove();
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        registerForPushNotifications(session.user.id);
      }
      if (event === "SIGNED_OUT" || !session) {
        if (session?.user) {
          await deactivatePushToken(session.user.id);
        }
        router.replace("/(auth)/login");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <OfflineIndicator />
          <Stack screenOptions={{ headerShown: false }} />
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
