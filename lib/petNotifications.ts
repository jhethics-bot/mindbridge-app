/**
 * Pet Inactivity Notification
 * If no pet_interactions in 24 hours, queue a push notification:
 * "[Pet name] misses [Patient name]! Open NeuBridge to say hi."
 * Uses the existing notification_queue table.
 */
import { supabase } from './supabase';

/**
 * Check if the pet has had any interactions in the last 24 hours.
 * If not, insert a notification into the notification_queue table.
 * This should be called periodically (e.g., on caregiver dashboard load).
 */
export async function checkPetInactivityAndNotify(params: {
  petId: string;
  petName: string;
  patientId: string;
  patientName: string;
}): Promise<boolean> {
  const { petId, petName, patientId, patientName } = params;

  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Check for recent interactions
    const { count } = await supabase
      .from('pet_interactions')
      .select('*', { count: 'exact', head: true })
      .eq('pet_id', petId)
      .gte('created_at', twentyFourHoursAgo);

    if ((count ?? 0) > 0) return false; // Had recent interactions

    // Check if we already queued a notification today (avoid spam)
    const today = new Date().toISOString().split('T')[0];
    const { count: existingCount } = await supabase
      .from('notification_queue')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', patientId)
      .eq('notification_type', 'pet_inactivity')
      .gte('created_at', `${today}T00:00:00`);

    if ((existingCount ?? 0) > 0) return false; // Already queued today

    // Queue the notification
    await supabase.from('notification_queue').insert({
      user_id: patientId,
      notification_type: 'pet_inactivity',
      title: `${petName} misses you!`,
      body: `${petName} misses ${patientName}! Open NeuBridge to say hi.`,
      data: { type: 'pet_inactivity', pet_id: petId },
    });

    return true;
  } catch (e) {
    console.warn('[petNotifications] Error checking inactivity:', e);
    return false;
  }
}
