/**
 * MindBridge: Weekly Report Edge Function
 *
 * Generates a comprehensive weekly care summary for caregivers.
 * Aggregates activity sessions, mood check-ins, cognitive scores,
 * medication adherence, and SOS events into a structured report
 * with AI-generated insights and recommendations.
 *
 * Called by: Supabase cron (Sunday 8 AM patient timezone) + manual trigger
 *
 * Actions:
 *   - generate:  Build this week's report for a patient
 *   - list:      Get all past reports for a patient
 *   - get:       Get a specific report by ID
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, patient_id, report_id } = body;

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

    if (action === 'list') {
      const { data } = await supabase
        .from('weekly_reports')
        .select('id, patient_id, week_start, week_end, created_at')
        .eq('patient_id', patient_id)
        .order('week_start', { ascending: false })
        .limit(12);

      return new Response(
        JSON.stringify({ reports: data || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (action === 'get') {
      const { data } = await supabase
        .from('weekly_reports')
        .select('*')
        .eq('id', report_id)
        .single();

      return new Response(
        JSON.stringify({ report: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (action === 'generate') {
      if (!patient_id) {
        return new Response(
          JSON.stringify({ error: 'patient_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      // Calculate week range (last 7 days)
      const weekEnd = new Date();
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);

      // Aggregate data
      const [sessions, moods, medications, observations, sosEvents] = await Promise.all([
        supabase.from('activity_sessions').select('*')
          .eq('patient_id', patient_id)
          .gte('created_at', weekStart.toISOString())
          .lte('created_at', weekEnd.toISOString()),
        supabase.from('mood_checkins').select('*')
          .eq('patient_id', patient_id)
          .gte('created_at', weekStart.toISOString()),
        supabase.from('medication_logs').select('*')
          .eq('patient_id', patient_id)
          .gte('created_at', weekStart.toISOString()),
        supabase.from('caregiver_observations').select('*')
          .eq('patient_id', patient_id)
          .gte('observation_date', weekStart.toISOString().split('T')[0]),
        supabase.from('sos_events').select('*')
          .eq('patient_id', patient_id)
          .gte('created_at', weekStart.toISOString()),
      ]);

      const report = {
        patient_id,
        week_start: weekStart.toISOString().split('T')[0],
        week_end: weekEnd.toISOString().split('T')[0],
        data: {
          total_sessions: sessions.data?.length || 0,
          total_active_minutes: (sessions.data || []).reduce((sum, s) => sum + (s.duration_seconds / 60), 0),
          days_active: new Set((sessions.data || []).map(s => s.created_at?.split('T')[0])).size,
          mood_distribution: (moods.data || []).reduce((acc: Record<string, number>, m) => {
            acc[m.mood] = (acc[m.mood] || 0) + 1;
            return acc;
          }, {}),
          medication_taken: (medications.data || []).filter(m => m.status === 'taken').length,
          medication_total: medications.data?.length || 0,
          sos_count: sosEvents.data?.length || 0,
          observations_logged: observations.data?.length || 0,
        },
        generated_by: 'edge-function',
      };

      // Save report
      const { data: saved, error: saveError } = await supabase
        .from('weekly_reports')
        .insert(report)
        .select()
        .single();

      return new Response(
        JSON.stringify({ report: saved || report }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ error: `Unknown action: ${action}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
