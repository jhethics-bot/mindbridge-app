/**
 * betaAnalytics - Beta Program Analytics Queries
 * All functions are async and query Supabase directly.
 */
import { supabase } from './supabase';

// ============================================
// HELPERS
// ============================================

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString();
}

// ============================================
// DAU / MAU
// ============================================

/**
 * Count profiles with any recorded activity on a given date.
 * Activity is defined as: mood_checkin, activity_session, meal_log, hydration_log, or medication_confirmation.
 */
export async function getDailyActiveUsers(date: Date): Promise<number> {
  const day = isoDate(date);
  const start = `${day}T00:00:00`;
  const end = `${day}T23:59:59`;

  const tables = [
    'mood_checkins',
    'activity_sessions',
    'meal_logs',
    'hydration_logs',
    'medication_confirmations',
  ] as const;

  const activeIds = new Set<string>();
  await Promise.all(
    tables.map(async (table) => {
      const { data } = await supabase
        .from(table)
        .select('patient_id')
        .gte('created_at', start)
        .lte('created_at', end);
      (data ?? []).forEach((row: any) => activeIds.add(row.patient_id));
    })
  );
  return activeIds.size;
}

/**
 * Count profiles with any activity in the last 30 days.
 */
export async function getMonthlyActiveUsers(): Promise<number> {
  const since = daysAgo(30);
  const tables = [
    'mood_checkins',
    'activity_sessions',
    'meal_logs',
    'hydration_logs',
    'medication_confirmations',
  ] as const;

  const activeIds = new Set<string>();
  await Promise.all(
    tables.map(async (table) => {
      const { data } = await supabase
        .from(table)
        .select('patient_id')
        .gte('created_at', since);
      (data ?? []).forEach((row: any) => activeIds.add(row.patient_id));
    })
  );
  return activeIds.size;
}

/**
 * DAU / MAU ratio for today.
 */
export async function getDAUMAURatio(): Promise<number> {
  const [dau, mau] = await Promise.all([
    getDailyActiveUsers(new Date()),
    getMonthlyActiveUsers(),
  ]);
  if (mau === 0) return 0;
  return Math.round((dau / mau) * 100) / 100;
}

// ============================================
// RETENTION
// ============================================

/**
 * Weekly retention: % of users active in week N who were also active in week 1.
 * weekNumber = 1 means the first week after signup (cohort baseline).
 * weekNumber = 2+ means subsequent weeks.
 */
export async function getWeeklyRetention(weekNumber: number): Promise<number> {
  if (weekNumber < 1) return 0;

  // Week 1 window: 0-7 days after first activity ever recorded
  // Simplified: use profiles.created_at as signup date
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, created_at')
    .eq('role', 'patient');

  if (!profiles || profiles.length === 0) return 0;

  let week1Active = 0;
  let weekNActive = 0;

  for (const p of profiles) {
    const signupDate = new Date(p.created_at);

    // Week 1: days 0-6
    const w1Start = new Date(signupDate.getTime()).toISOString();
    const w1End = new Date(signupDate.getTime() + 7 * 86400000).toISOString();

    // Week N: days (N-1)*7 to N*7
    const wNStart = new Date(signupDate.getTime() + (weekNumber - 1) * 7 * 86400000).toISOString();
    const wNEnd = new Date(signupDate.getTime() + weekNumber * 7 * 86400000).toISOString();

    const [w1Res, wNRes] = await Promise.all([
      supabase.from('activity_sessions').select('id').eq('patient_id', p.id)
        .gte('created_at', w1Start).lte('created_at', w1End).limit(1),
      supabase.from('activity_sessions').select('id').eq('patient_id', p.id)
        .gte('created_at', wNStart).lte('created_at', wNEnd).limit(1),
    ]);

    const inW1 = (w1Res.data ?? []).length > 0;
    const inWN = (wNRes.data ?? []).length > 0;

    if (inW1) week1Active++;
    if (inW1 && inWN) weekNActive++;
  }

  if (week1Active === 0) return 0;
  return Math.round((weekNActive / week1Active) * 100);
}

// ============================================
// FEATURE USAGE
// ============================================

/**
 * Count interactions per feature over the last N days.
 */
export async function getFeatureUsage(days: number): Promise<Record<string, number>> {
  const since = daysAgo(days);

  const [actRes, moodRes, mealRes, hydRes, medRes, petRes, gameRes] = await Promise.all([
    supabase.from('activity_sessions').select('id', { count: 'exact', head: true }).gte('created_at', since),
    supabase.from('mood_checkins').select('id', { count: 'exact', head: true }).gte('created_at', since),
    supabase.from('meal_logs').select('id', { count: 'exact', head: true }).gte('created_at', since),
    supabase.from('hydration_logs').select('id', { count: 'exact', head: true }).gte('created_at', since),
    supabase.from('medication_confirmations').select('id', { count: 'exact', head: true }).gte('created_at', since),
    supabase.from('pet_interactions').select('id', { count: 'exact', head: true }).gte('created_at', since),
    supabase.from('activity_sessions').select('id', { count: 'exact', head: true }).gte('created_at', since).not('score', 'is', null),
  ]);

  return {
    activities: actRes.count ?? 0,
    mood_checkins: moodRes.count ?? 0,
    meal_logging: mealRes.count ?? 0,
    hydration_logging: hydRes.count ?? 0,
    medication_confirmations: medRes.count ?? 0,
    companion_pet: petRes.count ?? 0,
    games: gameRes.count ?? 0,
  };
}

// ============================================
// SESSION METRICS
// ============================================

/**
 * Average number of activity sessions per patient per week over the last 4 weeks.
 */
export async function getAvgSessionsPerWeek(): Promise<number> {
  const since = daysAgo(28);
  const { data, count } = await supabase
    .from('activity_sessions')
    .select('patient_id', { count: 'exact' })
    .gte('created_at', since);

  if (!count || count === 0) return 0;

  // Unique patient count
  const uniquePatients = new Set((data ?? []).map((r: any) => r.patient_id)).size;
  if (uniquePatients === 0) return 0;

  // 4 weeks total; avg per patient per week
  return Math.round((count / uniquePatients / 4) * 10) / 10;
}

// ============================================
// MIND SCORE TREND
// ============================================

/**
 * Average MIND score per week for the last N weeks.
 */
export async function getMINDScoreTrend(weeks: number): Promise<Array<{ week: string; avgScore: number }>> {
  const results: Array<{ week: string; avgScore: number }> = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const end = new Date(Date.now() - i * 7 * 86400000);
    const start = new Date(end.getTime() - 7 * 86400000);
    const label = `Week of ${start.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;

    const { data } = await supabase
      .from('meal_logs')
      .select('mind_score')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .not('mind_score', 'is', null);

    const scores = (data ?? []).map((r: any) => r.mind_score as number);
    const avg = scores.length > 0
      ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length * 10) / 10
      : 0;

    results.push({ week: label, avgScore: avg });
  }

  return results;
}

// ============================================
// HYDRATION COMPLIANCE TREND
// ============================================

/**
 * % of patients meeting their daily hydration target per week for the last N weeks.
 */
export async function getHydrationComplianceTrend(weeks: number): Promise<Array<{ week: string; pctMeetingTarget: number }>> {
  const results: Array<{ week: string; pctMeetingTarget: number }> = [];

  const { data: patients } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'patient');

  const patientIds = (patients ?? []).map((p: any) => p.id as string);
  if (patientIds.length === 0) {
    for (let i = weeks - 1; i >= 0; i--) {
      const end = new Date(Date.now() - i * 7 * 86400000);
      const start = new Date(end.getTime() - 7 * 86400000);
      results.push({ week: `Week of ${start.toLocaleDateString([], { month: 'short', day: 'numeric' })}`, pctMeetingTarget: 0 });
    }
    return results;
  }

  for (let i = weeks - 1; i >= 0; i--) {
    const end = new Date(Date.now() - i * 7 * 86400000);
    const start = new Date(end.getTime() - 7 * 86400000);
    const label = `Week of ${start.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;

    // Default target 2000ml; count patients who hit it at least 4 days that week
    let meetingCount = 0;
    for (const pid of patientIds) {
      const { data: logs } = await supabase
        .from('hydration_logs')
        .select('amount_ml, created_at')
        .eq('patient_id', pid)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      // Group by day
      const byDay: Record<string, number> = {};
      (logs ?? []).forEach((l: any) => {
        const day = l.created_at.split('T')[0];
        byDay[day] = (byDay[day] ?? 0) + (l.amount_ml ?? 0);
      });
      const daysMetTarget = Object.values(byDay).filter(ml => ml >= 2000).length;
      if (daysMetTarget >= 4) meetingCount++;
    }

    results.push({
      week: label,
      pctMeetingTarget: Math.round((meetingCount / patientIds.length) * 100),
    });
  }

  return results;
}

// ============================================
// MEDICATION COMPLIANCE
// ============================================

/**
 * Overall medication compliance % over the last N days.
 */
export async function getMedicationCompliance(days: number): Promise<number> {
  const since = daysAgo(days);
  const { data } = await supabase
    .from('medication_confirmations')
    .select('status')
    .gte('created_at', since);

  const all = data ?? [];
  if (all.length === 0) return 0;
  const confirmed = all.filter((c: any) => c.status === 'confirmed').length;
  return Math.round((confirmed / all.length) * 100);
}
