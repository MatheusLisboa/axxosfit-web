/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  canAddStudent,
  getMaxStudentsForSlug,
  normalizePlanSlug,
  TRIAL_DAYS,
  UNLIMITED_STUDENTS,
} from '../lib/plans';
import { SupabaseService, SubscriptionData, PlanData } from './supabase';

/**
 * Subscription & Plans Management Service
 */
export const SubscriptionService = {
  /**
   * Verify if a trainer has an active subscription block.
   * Returns validity info and reasons if blocked.
   */
  async verifyTrainerSubscription(trainerId: string): Promise<{
    isValid: boolean;
    status: 'active' | 'past_due' | 'trial' | 'pending' | 'canceled' | 'none';
    subscription: SubscriptionData | null;
    expiresAt: string | null;
    plan: PlanData | null;
  }> {
    if (!isSupabaseConfigured || !supabase) {
      // Offline fallback: allow access
      return {
        isValid: true,
        status: 'active',
        subscription: null,
        expiresAt: null,
        plan: {
          id: 'p1-offline',
          name: 'Starter (Offline Fallback)',
          slug: 'starter',
          price: 99.9,
          max_students: 10,
          features: []
        }
      };
    }

    try {
      const subscription = await SupabaseService.getSubscriptionByTrainer(trainerId);
      if (!subscription) {
        return {
          isValid: false,
          status: 'none',
          subscription: null,
          expiresAt: null,
          plan: null
        };
      }

      const activePlan = (subscription as any).plans as PlanData | undefined || null;
      const isExpired = new Date(subscription.expires_at).getTime() < Date.now();
      const isActive = subscription.status === 'active' || subscription.status === 'trial';
      const isValid = isActive && !isExpired;

      return {
        isValid,
        status: subscription.status,
        subscription,
        expiresAt: subscription.expires_at,
        plan: activePlan
      };
    } catch (e) {
      console.error('Error verifying trainer subscription:', e);
      return {
        isValid: true, // Fail open in case of network issue to prevent blocking the trainer
        status: 'active',
        subscription: null,
        expiresAt: null,
        plan: null
      };
    }
  },

  /**
   * Trial Starter de 14 dias para novos personais (cadastro público).
   */
  async createStarterTrial(trainerId: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return true;

    try {
      const slugs = ['starter', 'bronze'];
      let planRow: { id: string } | null = null;
      for (const slug of slugs) {
        const { data } = await supabase.from('plans').select('id').eq('slug', slug).maybeSingle();
        if (data?.id) {
          planRow = data;
          break;
        }
      }
      if (!planRow?.id) {
        console.warn('Plano starter/bronze não encontrado para trial');
        return false;
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + TRIAL_DAYS);

      const { error } = await supabase.from('subscriptions').upsert(
        {
          trainer_id: trainerId,
          plan_id: planRow.id,
          status: 'trial',
          payment_provider: 'mercado_pago',
          payment_reference: 'starter_trial_14d',
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        },
        { onConflict: 'trainer_id' }
      );

      if (error) {
        const { error: insertErr } = await supabase.from('subscriptions').insert({
          trainer_id: trainerId,
          plan_id: planRow.id,
          status: 'trial',
          payment_provider: 'mercado_pago',
          payment_reference: 'starter_trial_14d',
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        });
        if (insertErr) {
          console.error('createStarterTrial:', insertErr.message);
          return false;
        }
      }
      return true;
    } catch (e) {
      console.error('createStarterTrial error:', e);
      return false;
    }
  },

  async createOnboardingSubscription(trainerId: string, planSlug: 'starter' | 'pro' | 'studio'): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return true;

    try {
      // 1. Get plan metadata
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('slug', planSlug)
        .maybeSingle();

      if (planError || !plan) {
        console.error('Plan not found for slug:', planSlug);
        return false;
      }

      // 2. Insert new subscription as 'pending'
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30-day initial billing schedule

      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert([{
          trainer_id: trainerId,
          plan_id: plan.id,
          status: 'pending',
          payment_provider: 'mercado_pago',
          payment_reference: `pref_${Math.random().toString(36).substring(2, 11)}`,
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString()
        }]);

      if (insertError) {
        console.error('Error creating subscription row:', insertError.message);
        return false;
      }

      return true;
    } catch (e) {
      console.error('Subscription onboarding error:', e);
      return false;
    }
  },

  /**
   * Check if a trainer can add more students based on their subscription limit.
   */
  async canTrainerAddStudent(trainerId: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return true;

    const authCheck = await this.verifyTrainerSubscription(trainerId);
    if (!authCheck.isValid || !authCheck.plan) {
      return false;
    }

    const { count, error } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('trainer_id', trainerId)
      .eq('status', 'active');

    if (error) {
      console.error('Error checking student counts:', error.message);
      return false;
    }

    const currentCount = count || 0;
    const maxStudents = getMaxStudentsForSlug(
      normalizePlanSlug(authCheck.plan.slug || 'starter')
    );
    return canAddStudent(maxStudents, currentCount);
  },

  getMaxStudentsForPlanSlug(slug: string): number {
    return getMaxStudentsForSlug(normalizePlanSlug(slug));
  },

  /** Resolve UUID do plano no Supabase (fallback quando API retorna local_pro). */
  async resolvePlanId(planSlug: string): Promise<string | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    const canonical = normalizePlanSlug(planSlug);
    const candidates = [canonical, planSlug.toLowerCase()];
    if (canonical === 'starter') candidates.push('bronze');
    if (canonical === 'pro') candidates.push('silver');
    if (canonical === 'studio') candidates.push('gold');

    for (const slug of candidates) {
      const { data } = await supabase.from('plans').select('id').eq('slug', slug).maybeSingle();
      if (data?.id) return data.id;
    }
    return null;
  },

  /**
   * Grava subscription pending + asaas_customer_id com sessão do personal (sem service role).
   */
  async savePendingAsaasUpgrade(params: {
    trainerId: string;
    planSlug: string;
    planId?: string;
    asaasSubscriptionId: string;
    asaasCustomerId?: string;
  }): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;

    const planId =
      params.planId && !params.planId.startsWith('local_')
        ? params.planId
        : await this.resolvePlanId(params.planSlug);

    if (!planId) {
      console.warn('savePendingAsaasUpgrade: plano não encontrado para', params.planSlug);
      return false;
    }

    const nextDue = new Date();
    nextDue.setMonth(nextDue.getMonth() + 1);

    const payload = {
      plan_id: planId,
      status: 'pending' as const,
      payment_provider: 'asaas',
      asaas_subscription_id: params.asaasSubscriptionId,
      payment_reference: params.asaasSubscriptionId,
      started_at: new Date().toISOString(),
      expires_at: nextDue.toISOString(),
      next_due_date: nextDue.toISOString().split('T')[0],
    };

    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('trainer_id', params.trainerId)
      .maybeSingle();

    if (existing?.id) {
      const { error: updateErr } = await supabase
        .from('subscriptions')
        .update(payload)
        .eq('trainer_id', params.trainerId);
      if (updateErr) {
        console.error('savePendingAsaasUpgrade subscription:', updateErr.message);
        return false;
      }
    } else {
      const { error: insertErr } = await supabase.from('subscriptions').insert({
        trainer_id: params.trainerId,
        ...payload,
      });
      if (insertErr) {
        console.error('savePendingAsaasUpgrade subscription:', insertErr.message);
        return false;
      }
    }

    if (params.asaasCustomerId) {
      const { error: trainerErr } = await supabase
        .from('trainers')
        .update({ asaas_customer_id: params.asaasCustomerId })
        .eq('id', params.trainerId);
      if (trainerErr) {
        console.warn('savePendingAsaasUpgrade asaas_customer_id:', trainerErr.message);
      }
    }

    return true;
  },
};
