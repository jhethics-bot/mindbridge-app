/**
 * Pet Interaction Report Data
 * Generates companion pet interaction summary for doctor visit reports.
 */
import { supabase } from './supabase';

export interface PetReportSummary {
  petName: string;
  petType: string;
  totalInteractions: number;
  avgDailyInteractions: number;
  mostCommonInteractionType: string;
  periodDays: number;
}

/**
 * Generate pet interaction summary for a given patient over a date range.
 * Used by the doctor-visit-report Edge Function.
 */
export async function getPetReportData(params: {
  patientId: string;
  startDate: string; // ISO date
  endDate: string;   // ISO date
}): Promise<PetReportSummary | null> {
  const { patientId, startDate, endDate } = params;

  try {
    // Get care relationship and pet
    const { data: rel } = await supabase
      .from('care_relationships')
      .select('id')
      .eq('patient_id', patientId)
      .limit(1)
      .single();
    if (!rel) return null;

    const { data: pet } = await supabase
      .from('companion_pets')
      .select('id, pet_name, pet_type')
      .eq('care_relationship_id', rel.id)
      .single();
    if (!pet) return null;

    // Get all interactions in the period
    const { data: interactions } = await supabase
      .from('pet_interactions')
      .select('interaction_type, created_at')
      .eq('pet_id', pet.id)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (!interactions || interactions.length === 0) {
      return {
        petName: pet.pet_name,
        petType: pet.pet_type,
        totalInteractions: 0,
        avgDailyInteractions: 0,
        mostCommonInteractionType: 'none',
        periodDays: Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) || 1,
      };
    }

    // Calculate days in period
    const periodDays = Math.max(
      1,
      Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000)
    );

    // Count interaction types
    const typeCounts: Record<string, number> = {};
    for (const row of interactions) {
      const t = row.interaction_type || 'unknown';
      typeCounts[t] = (typeCounts[t] || 0) + 1;
    }

    // Find most common
    let mostCommon = 'pet';
    let maxCount = 0;
    for (const [type, count] of Object.entries(typeCounts)) {
      if (count > maxCount) {
        mostCommon = type;
        maxCount = count;
      }
    }

    return {
      petName: pet.pet_name,
      petType: pet.pet_type,
      totalInteractions: interactions.length,
      avgDailyInteractions: Math.round((interactions.length / periodDays) * 10) / 10,
      mostCommonInteractionType: mostCommon,
      periodDays,
    };
  } catch (e) {
    console.warn('[petReport] Error generating report:', e);
    return null;
  }
}
