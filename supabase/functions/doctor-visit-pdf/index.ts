/**
 * NeuBridge: Doctor Visit PDF Edge Function
 *
 * Aggregates patient health data over a configurable period and returns
 * structured JSON for the doctor visit summary screen.
 *
 * POST body: { patient_id: string, caregiver_id: string, period_days: number }
 * Returns: { header, medicationCompliance, hydrationSummary, careAlerts,
 *             moodSummary, cognitiveSummary, nutritionSummary, generatedAt }
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { patient_id, caregiver_id, period_days = 30 } = await req.json();

    if (!patient_id) {
      return new Response(
        JSON.stringify({ error: 'patient_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Use service role key for full data access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const since = new Date();
    since.setDate(since.getDate() - (period_days || 30));
    const sinceISO = since.toISOString();
    const sinceDate = sinceISO.split('T')[0];

    // Patient profile
    const { data: patient } = await supabase
      .from('profiles')
      .select('display_name, stage, created_at')
      .eq('id', patient_id)
      .single();

    if (!patient) {
      return new Response(
        JSON.stringify({ error: 'Patient not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Parallel data queries
    const [
      medSchedules,
      medConfirmations,
      hydrationLogs,
      careAlerts,
      moodEntries,
      gameSessions,
      mealLogs,
    ] = await Promise.all([
      supabase.from('medication_schedules').select('id, medication_name, dosage, is_active').eq('patient_id', patient_id).eq('is_active', true),
      supabase.from('medication_confirmations').select('status, scheduled_time, created_at').eq('patient_id', patient_id).gte('created_at', sinceISO),
      supabase.from('hydration_logs').select('glasses, oz_per_glass, logged_at').eq('patient_id', patient_id).gte('logged_at', sinceISO),
      supabase.from('care_alerts').select('alert_type, severity, message, resolved, created_at').eq('patient_id', patient_id).gte('created_at', sinceISO),
      supabase.from('mood_checkins').select('mood, created_at').eq('patient_id', patient_id).gte('created_at', sinceISO),
      supabase.from('activity_sessions').select('duration_seconds, completed, created_at').eq('patient_id', patient_id).gte('created_at', sinceISO),
      supabase.from('meal_logs').select('meal_type, food_items, created_at').eq('patient_id', patient_id).gte('created_at', sinceISO),
    ]);

    // --- Medication Compliance ---
    const totalDoses = medConfirmations.data?.length ?? 0;
    const takenDoses = (medConfirmations.data ?? []).filter((c: any) => c.status === 'confirmed').length;
    const missedDoses = (medConfirmations.data ?? []).filter((c: any) => c.status === 'missed').length;
    const skippedDoses = (medConfirmations.data ?? []).filter((c: any) => c.status === 'skipped').length;
    const complianceRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

    const medicationCompliance = {
      totalDoses,
      takenDoses,
      missedDoses,
      skippedDoses,
      complianceRate,
      activemedications: (medSchedules.data ?? []).map((m: any) => ({ name: m.medication_name, dosage: m.dosage })),
    };

    // --- Hydration Summary ---
    const hydrationData = hydrationLogs.data ?? [];
    const totalGlasses = hydrationData.reduce((sum: number, h: any) => sum + (h.glasses ?? 0), 0);
    const totalOz = hydrationData.reduce((sum: number, h: any) => sum + ((h.glasses ?? 0) * (h.oz_per_glass ?? 8)), 0);
    const hydrationDays = new Set(hydrationData.map((h: any) => h.logged_at?.split('T')[0])).size;
    const avgGlassesPerDay = hydrationDays > 0 ? Math.round((totalGlasses / hydrationDays) * 10) / 10 : 0;

    const hydrationSummary = {
      totalGlasses,
      totalOz: Math.round(totalOz),
      avgGlassesPerDay,
      daysTracked: hydrationDays,
      goalGlassesPerDay: 8,
      goalMetPercent: avgGlassesPerDay >= 8 ? 100 : Math.round((avgGlassesPerDay / 8) * 100),
    };

    // --- Care Alerts ---
    const alertsData = careAlerts.data ?? [];
    const alertsBySeverity = alertsData.reduce((acc: Record<string, number>, a: any) => {
      acc[a.severity] = (acc[a.severity] ?? 0) + 1;
      return acc;
    }, {});
    const unresolvedAlerts = alertsData.filter((a: any) => !a.resolved).length;

    const careAlertsResult = {
      total: alertsData.length,
      unresolved: unresolvedAlerts,
      bySeverity: alertsBySeverity,
      recent: alertsData.slice(0, 5).map((a: any) => ({
        type: a.alert_type,
        severity: a.severity,
        message: a.message,
        resolved: a.resolved,
        date: a.created_at?.split('T')[0],
      })),
    };

    // --- Mood Summary ---
    const moodData = moodEntries.data ?? [];
    const moodDistribution = moodData.reduce((acc: Record<string, number>, m: any) => {
      acc[m.mood] = (acc[m.mood] ?? 0) + 1;
      return acc;
    }, {});
    const dominantMood = Object.entries(moodDistribution).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'unknown';

    const moodSummary = {
      totalCheckins: moodData.length,
      distribution: moodDistribution,
      dominantMood,
    };

    // --- Cognitive Summary ---
    const sessionsData = gameSessions.data ?? [];
    const totalSessions = sessionsData.length;
    const completedSessions = sessionsData.filter((s: any) => s.completed).length;
    const totalMinutes = Math.round(sessionsData.reduce((sum: number, s: any) => sum + ((s.duration_seconds ?? 0) / 60), 0));
    const activeDays = new Set(sessionsData.map((s: any) => s.created_at?.split('T')[0])).size;

    const cognitiveSummary = {
      totalSessions,
      completedSessions,
      completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
      totalEngagementMinutes: totalMinutes,
      activeDays,
    };

    // --- Nutrition Summary ---
    const mealsData = mealLogs.data ?? [];
    const mealsByType = mealsData.reduce((acc: Record<string, number>, m: any) => {
      acc[m.meal_type] = (acc[m.meal_type] ?? 0) + 1;
      return acc;
    }, {});
    const mealDays = new Set(mealsData.map((m: any) => m.created_at?.split('T')[0])).size;

    const nutritionSummary = {
      totalMealsLogged: mealsData.length,
      mealsPerDay: mealDays > 0 ? Math.round((mealsData.length / mealDays) * 10) / 10 : 0,
      byMealType: mealsByType,
      daysTracked: mealDays,
    };

    const report = {
      header: {
        patientName: patient.display_name,
        patientStage: patient.stage ?? 'early',
        periodDays: period_days,
        periodStart: sinceDate,
        periodEnd: new Date().toISOString().split('T')[0],
      },
      medicationCompliance,
      hydrationSummary,
      careAlerts: careAlertsResult,
      moodSummary,
      cognitiveSummary,
      nutritionSummary,
      generatedAt: new Date().toISOString(),
    };

    return new Response(
      JSON.stringify(report),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
