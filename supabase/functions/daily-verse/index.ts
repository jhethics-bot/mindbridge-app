/**
 * NeuBridge: Daily Verse Edge Function
 *
 * Selects a comforting scripture verse based on the patient's current mood
 * and preferences. Uses public domain translations only (KJV, WEB, ASV).
 * Faith module is optional and caregiver-configured.
 *
 * Actions:
 *   - get_verse:  Get today's verse for a patient (mood-aware selection)
 *   - history:    Get past verses delivered to a patient
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// ── Verse Library (Public Domain - KJV) ────────────────────────────
const VERSES: Record<string, { reference: string; text: string; translation: string }[]> = {
  comfort: [
    { reference: 'Psalm 23:4', text: 'Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.', translation: 'KJV' },
    { reference: 'Isaiah 41:10', text: 'Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.', translation: 'KJV' },
    { reference: 'Matthew 11:28', text: 'Come unto me, all ye that labour and are heavy laden, and I will give you rest.', translation: 'KJV' },
    { reference: 'Psalm 46:1', text: 'God is our refuge and strength, a very present help in trouble.', translation: 'KJV' },
    { reference: 'Romans 8:28', text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.', translation: 'KJV' },
    { reference: 'Psalm 34:18', text: 'The Lord is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.', translation: 'KJV' },
  ],
  strength: [
    { reference: 'Philippians 4:13', text: 'I can do all things through Christ which strengtheneth me.', translation: 'KJV' },
    { reference: 'Joshua 1:9', text: 'Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the Lord thy God is with thee whithersoever thou goest.', translation: 'KJV' },
    { reference: 'Isaiah 40:31', text: 'But they that wait upon the Lord shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.', translation: 'KJV' },
    { reference: 'Deuteronomy 31:6', text: 'Be strong and of a good courage, fear not, nor be afraid of them: for the Lord thy God, he it is that doth go with thee; he will not fail thee, nor forsake thee.', translation: 'KJV' },
  ],
  peace: [
    { reference: 'John 14:27', text: 'Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid.', translation: 'KJV' },
    { reference: 'Philippians 4:6-7', text: 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.', translation: 'KJV' },
    { reference: 'Psalm 29:11', text: 'The Lord will give strength unto his people; the Lord will bless his people with peace.', translation: 'KJV' },
  ],
  joy: [
    { reference: 'Psalm 118:24', text: 'This is the day which the Lord hath made; we will rejoice and be glad in it.', translation: 'KJV' },
    { reference: 'Nehemiah 8:10', text: 'The joy of the Lord is your strength.', translation: 'KJV' },
    { reference: 'Psalm 16:11', text: 'Thou wilt shew me the path of life: in thy presence is fulness of joy; at thy right hand there are pleasures for evermore.', translation: 'KJV' },
  ],
};

// Map mood to verse category
const MOOD_TO_CATEGORY: Record<string, string> = {
  happy: 'joy',
  okay: 'strength',
  sad: 'comfort',
  confused: 'comfort',
  tired: 'peace',
};

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

    if (action === 'get_verse') {
      if (!patient_id) {
        return new Response(
          JSON.stringify({ error: 'patient_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      // Check if faith is enabled for this patient
      const { data: profile } = await supabase
        .from('profiles')
        .select('faith_enabled')
        .eq('id', patient_id)
        .single();

      if (!profile?.faith_enabled) {
        return new Response(
          JSON.stringify({ error: 'Faith module is not enabled for this patient.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      // Get today's mood for verse selection
      const today = new Date().toISOString().split('T')[0];
      const { data: mood } = await supabase
        .from('mood_checkins')
        .select('mood')
        .eq('patient_id', patient_id)
        .gte('created_at', today)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const currentMood = mood?.mood || 'okay';
      const category = MOOD_TO_CATEGORY[currentMood] || 'comfort';
      const versePool = VERSES[category] || VERSES.comfort;

      // Pick a verse using day-of-year as seed for consistency within a day
      const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
      const verse = versePool[dayOfYear % versePool.length];

      return new Response(
        JSON.stringify({
          verse,
          mood_category: category,
          patient_mood: currentMood,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (action === 'history') {
      // Return verse delivery history (if tracked)
      return new Response(
        JSON.stringify({ history: [], message: 'Verse history tracking coming in a future update.' }),
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
