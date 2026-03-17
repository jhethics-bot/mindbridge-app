/**
 * NeuBridge: Medication Tracker Edge Function
 *
 * Handles patient medication schedules: generates today's dose list,
 * records confirmations, and provides adherence data.
 *
 * Actions:
 *   - get_today:       Get today's medication schedule (pending + completed)
 *   - confirm_taken:   Mark a dose as taken
 *   - mark_skipped:    Mark a dose as skipped
 *   - adherence:       Get adherence rate for a date range
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;

    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader ?? '' } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── get_today: Build today's schedule ──────────────
    if (action === 'get_today') {
      const patientId = body.patient_id || user.id;
      const today = new Date().toISOString().split('T')[0];

      // Get active medications
      const { data: meds } = await supabase
        .from('medications')
        .select('*')
        .eq('patient_id', patientId)
        .eq('is_active', true);

      if (!meds || meds.length === 0) {
        return new Response(
          JSON.stringify({ schedule: [], message: 'No active medications.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      // Get existing logs for today
      const { data: logs } = await supabase
        .from('medication_logs')
        .select('*')
        .eq('patient_id', patientId)
        .gte('scheduled_time', today + 'T00:00:00')
        .lte('scheduled_time', today + 'T23:59:59');

      // Build schedule: one entry per med per scheduled time
      const schedule = [];
      for (const med of meds) {
        const times = med.times_of_day || ['08:00'];
        for (const time of times) {
          const scheduledTime = `${today}T${time}:00`;
          const existingLog = (logs || []).find(
            (l) => l.medication_id === med.id && l.scheduled_time === scheduledTime,
          );

          if (existingLog) {
            schedule.push({
              log_id: existingLog.id,
              medication_id: med.id,
              name: med.name,
              dosage: med.dosage,
              instructions: med.instructions,
              scheduled_time: scheduledTime,
              status: existingLog.status,
              taken_at: existingLog.taken_at,
            });
          } else {
            // Create a pending log entry
            const { data: newLog } = await supabase
              .from('medication_logs')
              .insert({
                medication_id: med.id,
                patient_id: patientId,
                scheduled_time: scheduledTime,
                status: 'pending',
              })
              .select()
              .single();

            schedule.push({
              log_id: newLog?.id || crypto.randomUUID(),
              medication_id: med.id,
              name: med.name,
              dosage: med.dosage,
              instructions: med.instructions,
              scheduled_time: scheduledTime,
              status: 'pending',
              taken_at: null,
            });
          }
        }
      }

      // Sort by scheduled time
      schedule.sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time));

      return new Response(
        JSON.stringify({ schedule }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── confirm_taken: Mark a dose as taken ────────────
    if (action === 'confirm_taken') {
      const { log_id } = body;
      if (!log_id) {
        return new Response(
          JSON.stringify({ error: 'log_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      const { data, error } = await supabase
        .from('medication_logs')
        .update({
          status: 'taken',
          taken_at: new Date().toISOString(),
          logged_by: user.id,
        })
        .eq('id', log_id)
        .select()
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      return new Response(
        JSON.stringify({ success: true, log: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── mark_skipped ───────────────────────────────────
    if (action === 'mark_skipped') {
      const { log_id, notes } = body;
      if (!log_id) {
        return new Response(
          JSON.stringify({ error: 'log_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      const { data, error } = await supabase
        .from('medication_logs')
        .update({
          status: 'skipped',
          notes: notes || null,
          logged_by: user.id,
        })
        .eq('id', log_id)
        .select()
        .single();

      return new Response(
        JSON.stringify({ success: true, log: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── adherence: Get adherence rate ──────────────────
    if (action === 'adherence') {
      const { patient_id, days = 30 } = body;
      const pid = patient_id || user.id;
      const since = new Date();
      since.setDate(since.getDate() - days);

      const { data: logs } = await supabase
        .from('medication_logs')
        .select('status')
        .eq('patient_id', pid)
        .gte('scheduled_time', since.toISOString());

      const total = logs?.length || 0;
      const taken = (logs || []).filter((l) => l.status === 'taken').length;
      const rate = total > 0 ? taken / total : 0;

      return new Response(
        JSON.stringify({ adherence_rate: rate, taken, total, days }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ error: `Unknown action: ${action}. Valid: get_today, confirm_taken, mark_skipped, adherence` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
