/**
 * referralStore - NeuBridge Referral Program State (Zustand)
 *
 * Manages referral codes, redemptions, and referral tracking
 * for the caregiver referral program.
 */
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// ============================================
// TYPES
// ============================================

export interface ReferralCode {
  id: string;
  user_id: string;
  code: string;
  uses_count: number;
  max_uses: number;
  is_active: boolean;
  created_at: string;
}

export interface ReferralRedemption {
  id: string;
  referral_code_id: string;
  referrer_id: string;
  referred_id: string;
  reward_type: string;
  referrer_rewarded: boolean;
  referred_rewarded: boolean;
  created_at: string;
  // Joined
  referred_name?: string;
}

// ============================================
// STORE INTERFACE
// ============================================

interface ReferralState {
  referralCode: string | null;
  redemptions: ReferralRedemption[];
  totalReferrals: number;
  isLoading: boolean;
  error: string | null;

  fetchOrCreateCode: (userId: string, userName: string) => Promise<void>;
  redeemCode: (code: string, newUserId: string) => Promise<{ success: boolean; error?: string }>;
  getMyReferrals: (userId: string) => Promise<void>;
}

// ============================================
// HELPERS
// ============================================

function generateCode(userName: string): string {
  const prefix = userName.trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3).padEnd(3, 'X');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${prefix}${suffix}`;
}

// ============================================
// STORE
// ============================================

export const useReferralStore = create<ReferralState>((set) => ({
  referralCode: null,
  redemptions: [],
  totalReferrals: 0,
  isLoading: false,
  error: null,

  fetchOrCreateCode: async (userId, userName) => {
    set({ isLoading: true, error: null });

    // Try to fetch existing code
    const { data: existing, error: fetchErr } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (existing) {
      set({ referralCode: existing.code, isLoading: false });
      return;
    }

    // Generate a unique code
    let code = generateCode(userName);
    let attempts = 0;

    while (attempts < 5) {
      const { data: conflict } = await supabase
        .from('referral_codes')
        .select('id')
        .eq('code', code)
        .single();

      if (!conflict) break;
      code = generateCode(userName);
      attempts++;
    }

    const { data: inserted, error: insertErr } = await supabase
      .from('referral_codes')
      .insert({ user_id: userId, code })
      .select()
      .single();

    if (insertErr) {
      set({ isLoading: false, error: insertErr.message });
    } else if (inserted) {
      set({ referralCode: inserted.code, isLoading: false });
    }
  },

  redeemCode: async (code, newUserId) => {
    set({ isLoading: true, error: null });

    // Validate code exists and is active
    const { data: codeRow, error: codeErr } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .eq('is_active', true)
      .single();

    if (codeErr || !codeRow) {
      set({ isLoading: false, error: 'Invalid or expired referral code' });
      return { success: false, error: 'Invalid or expired referral code' };
    }

    if (codeRow.user_id === newUserId) {
      set({ isLoading: false, error: 'You cannot use your own referral code' });
      return { success: false, error: 'You cannot use your own referral code' };
    }

    if (codeRow.uses_count >= codeRow.max_uses) {
      set({ isLoading: false, error: 'This referral code has reached its maximum uses' });
      return { success: false, error: 'This referral code has reached its maximum uses' };
    }

    // Create redemption record
    const { error: redemptionErr } = await supabase
      .from('referral_redemptions')
      .insert({
        referral_code_id: codeRow.id,
        referrer_id: codeRow.user_id,
        referred_id: newUserId,
        reward_type: 'free_month',
      });

    if (redemptionErr) {
      set({ isLoading: false, error: redemptionErr.message });
      return { success: false, error: redemptionErr.message };
    }

    // Increment uses_count
    await supabase
      .from('referral_codes')
      .update({ uses_count: codeRow.uses_count + 1 })
      .eq('id', codeRow.id);

    set({ isLoading: false });
    return { success: true };
  },

  getMyReferrals: async (userId) => {
    set({ isLoading: true, error: null });

    const { data, error } = await supabase
      .from('referral_redemptions')
      .select('*, referred:profiles!referral_redemptions_referred_id_fkey(display_name)')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      set({ isLoading: false, error: error.message });
    } else {
      const redemptions: ReferralRedemption[] = (data ?? []).map((r: any) => ({
        ...r,
        referred_name: r.referred?.display_name,
      }));
      set({ redemptions, totalReferrals: redemptions.length, isLoading: false });
    }
  },
}));
