import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (_req) => {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Get all active care relationships with patient/caregiver IDs
  const { data: relationships, error: relError } = await supabase
    .from('care_relationships')
    .select('patient_id, caregiver_id');

  if (relError) {
    return new Response(JSON.stringify({ error: relError.message }), { status: 500 });
  }

  const now = new Date();
  const currentHour = now.getUTCHours(); // using UTC; adjust as needed
  const today = now.toISOString().split('T')[0];
  const alertsCreated: string[] = [];

  for (const rel of relationships ?? []) {
    const { patient_id, caregiver_id } = rel;

    // --- Hydration checks ---
    const { data: hydrationLogs } = await supabase
      .from('hydration_logs')
      .select('amount_ml, created_at')
      .eq('patient_id', patient_id)
      .gte('created_at', `${today}T00:00:00`);

    const totalMl = (hydrationLogs ?? []).reduce((sum: number, h: any) => sum + (h.amount_ml ?? 0), 0);

    // Fetch daily target from nutrition_settings or default 2000ml
    const { data: nutSettings } = await supabase
      .from('nutrition_settings')
      .select('daily_water_ml')
      .eq('patient_id', patient_id)
      .single();
    const dailyTarget = nutSettings?.daily_water_ml ?? 2000;

    if (currentHour >= 14 && totalMl === 0) {
      // After 2PM, zero intake = critical
      await supabase.from('care_alerts').insert({
        patient_id,
        caregiver_id,
        alert_type: 'hydration_critical',
        title: 'Critical: No Hydration Today',
        message: 'Your loved one has had no recorded fluid intake today. Please check in immediately.',
      });
      alertsCreated.push(`hydration_critical:${patient_id}`);
    } else if (currentHour >= 12 && totalMl < dailyTarget * 0.25) {
      // After 12PM, less than 25% of daily target
      await supabase.from('care_alerts').insert({
        patient_id,
        caregiver_id,
        alert_type: 'hydration_low',
        title: 'Low Hydration Alert',
        message: `Only ${totalMl}ml of ${dailyTarget}ml target recorded so far today. Encourage fluids.`,
      });
      alertsCreated.push(`hydration_low:${patient_id}`);
    }

    // --- Medication checks ---
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
    const { data: pendingMeds } = await supabase
      .from('medication_confirmations')
      .select('id, scheduled_time, medication_schedules(medication_name)')
      .eq('patient_id', patient_id)
      .eq('status', 'pending')
      .lte('scheduled_time', thirtyMinutesAgo);

    for (const med of pendingMeds ?? []) {
      const medName = (med as any).medication_schedules?.medication_name ?? 'medication';
      await supabase.from('care_alerts').insert({
        patient_id,
        caregiver_id,
        alert_type: 'medication_missed',
        title: 'Medication Not Taken',
        message: `${medName} was scheduled 30+ minutes ago and has not been confirmed.`,
      });
      alertsCreated.push(`medication_missed:${patient_id}:${med.id}`);
    }
  }

  return new Response(
    JSON.stringify({ success: true, alertsCreated }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
