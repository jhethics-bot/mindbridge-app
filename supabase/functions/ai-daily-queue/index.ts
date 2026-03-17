/**
 * NeuBridge: AI Daily Queue Edge Function
 *
 * Generates a personalized daily activity queue for each patient using
 * Claude AI. Considers disease stage, recent mood, cognitive performance
 * history, caregiver preferences, and time of day.
 *
 * Called by: app cron (morning) + manual refresh on patient home screen
 *
 * Actions:
 *   - generate:  Build today's activity queue for a patient
 *   - refresh:   Force regenerate (caregiver-triggered)
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, patient_id } = await req.json();

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

    if (!patient_id) {
      return new Response(
        JSON.stringify({ error: 'patient_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Get patient profile + stage
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', patient_id)
      .single();

    if (!profile) {
      return new Response(
        JSON.stringify({ error: 'Patient not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Get recent performance (7 days)
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const { data: sessions } = await supabase
      .from('activity_sessions')
      .select('activity, score, duration_seconds, completed')
      .eq('patient_id', patient_id)
      .gte('created_at', since.toISOString());

    // Get today's mood
    const today = new Date().toISOString().split('T')[0];
    const { data: mood } = await supabase
      .from('mood_checkins')
      .select('mood')
      .eq('patient_id', patient_id)
      .gte('created_at', today)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Build AI prompt context
    const stage = profile.stage || 'early';
    const currentMood = mood?.mood || 'okay';

    // Call Claude API for queue generation
    const claudeApiKey = Deno.env.get('CLAUDE_API_KEY');
    if (!claudeApiKey) {
      // Fallback: return a default queue if no API key
      const defaultQueue = getDefaultQueue(stage);
      return new Response(
        JSON.stringify({ queue: defaultQueue, source: 'default', reasoning: 'Claude API key not configured; using stage-based defaults.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `You are the NeuBridge AI engine. Generate a personalized daily activity queue for an Alzheimer's patient.

Patient stage: ${stage}
Current mood: ${currentMood}
Recent sessions (7d): ${JSON.stringify(sessions?.slice(0, 20) || [])}

Return ONLY valid JSON matching this schema:
{
  "daily_queue": [
    {
      "activity": "face_name|word_find|color_number|spelling|memory_cards|sorting|guided_workout|chair_yoga|breathing|singalong|daily_verse",
      "difficulty": { ... activity-specific params ... },
      "order": 1,
      "estimated_minutes": 10
    }
  ],
  "reasoning": "Brief explanation for caregiver log"
}

Rules:
- For "${stage}" stage, pick 4-6 activities
- If mood is "sad" or "confused", start with music or breathing
- If mood is "happy", include more cognitive activities
- Never exceed 45 minutes total
- Always include at least one physical activity
- For "late" stage, favor sensory and music over cognitive`,
        }],
      }),
    });

    const aiResult = await claudeResponse.json();
    const aiText = aiResult.content?.[0]?.text || '';

    // Parse JSON from Claude's response
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      // Save to daily_queues table
      await supabase.from('daily_queues').upsert({
        patient_id,
        queue_date: today,
        queue: parsed.daily_queue,
        reasoning: parsed.reasoning,
        generated_by: 'claude-sonnet-4',
      }, { onConflict: 'patient_id,queue_date' });

      return new Response(
        JSON.stringify({ queue: parsed.daily_queue, source: 'ai', reasoning: parsed.reasoning }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // AI response wasn't parseable; use defaults
    const fallback = getDefaultQueue(stage);
    return new Response(
      JSON.stringify({ queue: fallback, source: 'default', reasoning: 'AI response not parseable; using defaults.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

// ── Default Queues by Stage ────────────────────────────────────────
function getDefaultQueue(stage: string) {
  const queues: Record<string, any[]> = {
    early: [
      { activity: 'face_name', difficulty: { num_faces: 4, cue_visibility: 0.5 }, order: 1, estimated_minutes: 10 },
      { activity: 'word_find', difficulty: { grid_size: 8, word_count: 6 }, order: 2, estimated_minutes: 10 },
      { activity: 'guided_workout', difficulty: { intensity: 'light', duration_min: 10 }, order: 3, estimated_minutes: 10 },
      { activity: 'spelling', difficulty: { word_length: 5, hints: true }, order: 4, estimated_minutes: 8 },
      { activity: 'breathing', difficulty: { pattern: '4-7-8', rounds: 3 }, order: 5, estimated_minutes: 5 },
    ],
    middle: [
      { activity: 'singalong', difficulty: { era: 'preferred', tempo: 'slow' }, order: 1, estimated_minutes: 10 },
      { activity: 'memory_cards', difficulty: { pairs: 4, show_time_ms: 3000 }, order: 2, estimated_minutes: 8 },
      { activity: 'chair_yoga', difficulty: { poses: 5, hold_seconds: 15 }, order: 3, estimated_minutes: 10 },
      { activity: 'color_number', difficulty: { complexity: 'simple', palette: 4 }, order: 4, estimated_minutes: 10 },
      { activity: 'breathing', difficulty: { pattern: 'box', rounds: 4 }, order: 5, estimated_minutes: 5 },
    ],
    late: [
      { activity: 'singalong', difficulty: { era: 'preferred', tempo: 'very_slow' }, order: 1, estimated_minutes: 10 },
      { activity: 'breathing', difficulty: { pattern: 'simple', rounds: 5 }, order: 2, estimated_minutes: 8 },
      { activity: 'sorting', difficulty: { categories: 2, items: 4 }, order: 3, estimated_minutes: 8 },
      { activity: 'chair_yoga', difficulty: { poses: 3, hold_seconds: 10 }, order: 4, estimated_minutes: 8 },
    ],
  };
  return queues[stage] || queues.early;
}
