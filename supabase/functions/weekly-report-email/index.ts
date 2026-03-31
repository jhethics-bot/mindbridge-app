import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

serve(async (_req) => {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const now = new Date();
  const weekEnd = now.toISOString().split('T')[0];
  const weekStart = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];

  // Get all active care relationships
  const { data: relationships, error: relError } = await supabase
    .from('care_relationships')
    .select('patient_id, caregiver_id, patient:profiles!care_relationships_patient_id_fkey(display_name)');

  if (relError) {
    return new Response(JSON.stringify({ error: relError.message }), { status: 500 });
  }

  const results = [];

  for (const rel of relationships ?? []) {
    const { patient_id, caregiver_id } = rel;
    const patientName = (rel as any).patient?.display_name ?? 'Patient';
    const weekStartISO = `${weekStart}T00:00:00`;
    const weekEndISO = `${weekEnd}T23:59:59`;

    // Fetch all 7-day data in parallel
    const [
      moodRes,
      gameRes,
      mealRes,
      hydrationRes,
      medRes,
      petRes,
      achievementsRes,
    ] = await Promise.all([
      supabase.from('mood_checkins').select('mood, created_at')
        .eq('patient_id', patient_id)
        .gte('created_at', weekStartISO).lte('created_at', weekEndISO),
      supabase.from('activity_sessions').select('activity, duration_seconds, score, created_at')
        .eq('patient_id', patient_id)
        .gte('created_at', weekStartISO).lte('created_at', weekEndISO),
      supabase.from('meal_logs').select('meal_type, mind_score, created_at')
        .eq('patient_id', patient_id)
        .gte('created_at', weekStartISO).lte('created_at', weekEndISO),
      supabase.from('hydration_logs').select('amount_ml, created_at')
        .eq('patient_id', patient_id)
        .gte('created_at', weekStartISO).lte('created_at', weekEndISO),
      supabase.from('medication_confirmations').select('status, created_at')
        .eq('patient_id', patient_id)
        .gte('created_at', weekStartISO).lte('created_at', weekEndISO),
      supabase.from('pet_interactions').select('interaction_type, created_at')
        .eq('patient_id', patient_id)
        .gte('created_at', weekStartISO).lte('created_at', weekEndISO),
      supabase.from('achievements').select('achievement_type, created_at')
        .eq('patient_id', patient_id)
        .gte('created_at', weekStartISO).lte('created_at', weekEndISO),
    ]);

    const moods = moodRes.data ?? [];
    const sessions = gameRes.data ?? [];
    const meals = mealRes.data ?? [];
    const hydrationLogs = hydrationRes.data ?? [];
    const medConfirmations = medRes.data ?? [];
    const petInteractions = petRes.data ?? [];
    const achievements = achievementsRes.data ?? [];

    // Compute summary stats
    const avgMindScore = meals.length > 0
      ? Math.round(meals.reduce((s: number, m: any) => s + (m.mind_score ?? 0), 0) / meals.length)
      : null;
    const totalHydrationMl = hydrationLogs.reduce((s: number, h: any) => s + (h.amount_ml ?? 0), 0);
    const medTotal = medConfirmations.length;
    const medConfirmed = medConfirmations.filter((c: any) => c.status === 'confirmed').length;
    const medCompliancePct = medTotal > 0 ? Math.round((medConfirmed / medTotal) * 100) : null;
    const moodCounts: Record<string, number> = {};
    moods.forEach((m: any) => { moodCounts[m.mood] = (moodCounts[m.mood] ?? 0) + 1; });

    const reportData = {
      week_start: weekStart,
      week_end: weekEnd,
      mood_summary: moodCounts,
      total_mood_entries: moods.length,
      game_sessions: sessions.length,
      total_activity_minutes: Math.round(sessions.reduce((s: number, a: any) => s + (a.duration_seconds ?? 0), 0) / 60),
      avg_mind_score: avgMindScore,
      total_meals_logged: meals.length,
      total_hydration_ml: totalHydrationMl,
      medication_compliance_pct: medCompliancePct,
      pet_interactions: petInteractions.length,
      achievements_earned: achievements.length,
    };

    // Generate Claude narrative
    let narrative = '';
    try {
      const prompt = `You are a compassionate health assistant. Write a 2-3 sentence weekly summary for a caregiver about their loved one named ${patientName}. Use warm, clear language. Data: ${JSON.stringify(reportData)}`;
      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 256,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const claudeData = await claudeRes.json();
      narrative = claudeData?.content?.[0]?.text ?? '';
    } catch (_e) {
      narrative = 'Unable to generate narrative summary.';
    }

    // Store in weekly_reports
    await supabase.from('weekly_reports').insert({
      patient_id,
      caregiver_id,
      week_start: weekStart,
      week_end: weekEnd,
      report_data: reportData,
      narrative,
    });

    results.push({ patient_id, caregiver_id, report_data: reportData, narrative });
  }

  return new Response(
    JSON.stringify({ success: true, reports: results }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
