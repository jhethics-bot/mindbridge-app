/**
 * MindBridge: Doctor Visit Report Edge Function
 *
 * Generates a comprehensive report for physician visits by aggregating
 * patient data over a configurable time range (30/60/90 days).
 * Uses Claude AI to produce a clinical summary with recommendations.
 *
 * Actions:
 *   - generate:  Build a doctor visit report for a patient
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, patient_id, days = 30 } = await req.json();

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

    if (action !== 'generate') {
      return new Response(
        JSON.stringify({ error: `Unknown action: ${action}. Valid: generate` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!patient_id) {
      return new Response(
        JSON.stringify({ error: 'patient_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceISO = since.toISOString();
    const sinceDate = sinceISO.split('T')[0];

    // Get patient profile
    const { data: patient } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', patient_id)
      .single();

    if (!patient) {
      return new Response(
        JSON.stringify({ error: 'Patient not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Parallel data aggregation
    const [sessions, moods, medLogs, observations, sosEvents] = await Promise.all([
      supabase.from('activity_sessions').select('*')
        .eq('patient_id', patient_id).gte('created_at', sinceISO),
      supabase.from('mood_checkins').select('*')
        .eq('patient_id', patient_id).gte('created_at', sinceISO),
      supabase.from('medication_logs').select('*')
        .eq('patient_id', patient_id).gte('scheduled_time', sinceISO),
      supabase.from('caregiver_observations').select('*')
        .eq('patient_id', patient_id).gte('observation_date', sinceDate),
      supabase.from('sos_events').select('*')
        .eq('patient_id', patient_id).gte('created_at', sinceISO),
    ]);

    // Compute summary statistics
    const totalSessions = sessions.data?.length || 0;
    const totalMinutes = Math.round(
      (sessions.data || []).reduce((sum, s) => sum + (s.duration_seconds || 0) / 60, 0)
    );
    const daysActive = new Set(
      (sessions.data || []).map((s) => s.created_at?.split('T')[0])
    ).size;
    const moodDist = (moods.data || []).reduce((acc: Record<string, number>, m) => {
      acc[m.mood] = (acc[m.mood] || 0) + 1;
      return acc;
    }, {});
    const medTotal = medLogs.data?.length || 0;
    const medTaken = (medLogs.data || []).filter((l) => l.status === 'taken').length;
    const adherenceRate = medTotal > 0 ? medTaken / medTotal : 0;
    const sosCount = sosEvents.data?.length || 0;

    // Generate AI summary
    const claudeApiKey = Deno.env.get('CLAUDE_API_KEY');
    let aiSummary = {
      cognitive_summary: `Patient completed ${totalSessions} cognitive/activity sessions over ${days} days (${daysActive} active days). Total engagement: ${totalMinutes} minutes.`,
      mood_summary: `Mood distribution: ${Object.entries(moodDist).map(([k, v]) => `${k}: ${v}`).join(', ') || 'No mood data recorded.'}`,
      medication_adherence: `Medication adherence: ${Math.round(adherenceRate * 100)}% (${medTaken} of ${medTotal} doses taken).`,
      observations_summary: `${observations.data?.length || 0} daily observation entries recorded.`,
      sos_summary: sosCount > 0 ? `${sosCount} SOS event(s) recorded during this period.` : 'No SOS events during this period.',
      ai_recommendations: [
        'Continue current activity routine.',
        'Review medication adherence with prescribing physician.',
        'Consider adjusting activity difficulty based on recent performance.',
      ],
    };

    if (claudeApiKey) {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': claudeApiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1500,
            messages: [{
              role: 'user',
              content: `Generate a physician-friendly care report summary for an Alzheimer's patient.

Patient: ${patient.display_name}, Stage: ${patient.stage || 'early'}
Period: Last ${days} days

Data:
- Activity sessions: ${totalSessions} sessions, ${totalMinutes} minutes, ${daysActive} active days
- Mood: ${JSON.stringify(moodDist)}
- Medication adherence: ${Math.round(adherenceRate * 100)}% (${medTaken}/${medTotal})
- SOS events: ${sosCount}
- Observations logged: ${observations.data?.length || 0}
${observations.data?.length ? `Recent observations: ${JSON.stringify(observations.data.slice(0, 5))}` : ''}

Return JSON with fields: cognitive_summary, mood_summary, medication_adherence, observations_summary, sos_summary, ai_recommendations (array of 3-5 strings).
Be clinical but compassionate. No jargon. Actionable recommendations.`,
            }],
          }),
        });
        const aiResult = await res.json();
        const aiText = aiResult.content?.[0]?.text || '';
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiSummary = { ...aiSummary, ...JSON.parse(jsonMatch[0]) };
        }
      } catch {
        // AI call failed; use default summary above
      }
    }

    const report = {
      patient_name: patient.display_name,
      patient_stage: patient.stage || 'early',
      report_period_days: days,
      generated_at: new Date().toISOString(),
      data: {
        total_sessions: totalSessions,
        total_active_minutes: totalMinutes,
        days_active: daysActive,
        mood_distribution: moodDist,
        medication_adherence_rate: adherenceRate,
        sos_events: sosCount,
      },
      ...aiSummary,
    };

    return new Response(
      JSON.stringify(report),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
