/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  getMaxStudentsForSlug,
  isUnlimitedStudents,
  normalizePlanSlug,
  TRIAL_DAYS,
  UNLIMITED_STUDENTS,
  PLAN_FEATURE_LISTS,
  PLAN_FRONTEND_PERMISSIONS,
  PLAN_PRICES,
  PLAN_DISPLAY_NAMES,
  type CanonicalPlanSlug,
} from '../lib/plans';
import { ensureSupabaseSession } from '../services/dataLoader';
import { useStore } from '../services/store';

export type PlanSlug = 'bronze' | 'silver' | 'gold' | 'starter' | 'pro' | 'studio';

export interface PlanPermissions {
  id?: string;
  name: string;
  slug: PlanSlug;
  price: number;
  max_students: number;
  ai_enabled: boolean;
  ai_limit: number;
  financial_enabled: boolean;
  gamification_enabled: boolean;
  pdf_enabled: boolean;
  custom_branding_enabled: boolean;
  whatsapp_support_enabled: boolean;
  elite_badge_enabled: boolean;
  advanced_reports_enabled?: boolean;
  assessment_full_enabled?: boolean;
  anamnesis_enabled?: boolean;
  evolution_management_enabled?: boolean;
  features: string[];
}

export interface SubscriptionState {
  id?: string;
  trainer_id: string;
  plan_id?: string;
  status: 'active' | 'trial' | 'pending' | 'canceled' | 'past_due' | 'none';
  started_at?: string;
  expires_at?: string;
  isValid: boolean;
  isExpired: boolean;
}

const SUBSCRIPTION_CACHE_KEY = 'axosfit_subscription_v1';

interface SubscriptionCachePayload {
  trainerId: string;
  subscription: SubscriptionState | null;
  plan: PlanPermissions | null;
  activeStudentsCount: number;
}

function readSubscriptionCache(trainerId: string): SubscriptionCachePayload | null {
  try {
    const raw = sessionStorage.getItem(SUBSCRIPTION_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SubscriptionCachePayload;
    if (parsed.trainerId !== trainerId) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSubscriptionCache(payload: SubscriptionCachePayload): void {
  try {
    sessionStorage.setItem(SUBSCRIPTION_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // noop
  }
}

function buildPlanPermissionsFromSlug(
  canonicalSlug: CanonicalPlanSlug,
  dbPlan?: { id?: string; name?: string; price?: number; features?: unknown }
): PlanPermissions {
  const perms = PLAN_FRONTEND_PERMISSIONS[canonicalSlug];
  return {
    id: dbPlan?.id,
    name: dbPlan?.name || PLAN_DISPLAY_NAMES[canonicalSlug],
    slug: canonicalSlug as PlanSlug,
    price: dbPlan?.price != null ? Number(dbPlan.price) : PLAN_PRICES[canonicalSlug],
    max_students: getMaxStudentsForSlug(canonicalSlug),
    ai_enabled: perms.advanced_reports_enabled,
    ai_limit: perms.advanced_reports_enabled ? UNLIMITED_STUDENTS : 0,
    financial_enabled: perms.financial_enabled,
    gamification_enabled: perms.evolution_management_enabled,
    pdf_enabled: perms.pdf_enabled,
    custom_branding_enabled: false,
    whatsapp_support_enabled: perms.whatsapp_support_enabled,
    elite_badge_enabled: false,
    advanced_reports_enabled: perms.advanced_reports_enabled,
    assessment_full_enabled: perms.assessment_full_enabled,
    anamnesis_enabled: perms.anamnesis_enabled,
    evolution_management_enabled: perms.evolution_management_enabled,
    features: Array.isArray(dbPlan?.features)
      ? (dbPlan.features as string[])
      : [...PLAN_FEATURE_LISTS[canonicalSlug]],
  };
}

function buildFallbackPlan(slug: CanonicalPlanSlug, suffix = '') {
  const plan = buildPlanPermissionsFromSlug(slug);
  return { ...plan, name: PLAN_DISPLAY_NAMES[slug] + suffix };
}

export const FALLBACK_PLANS_PERMISSIONS: Record<string, PlanPermissions> = {
  bronze: buildFallbackPlan('starter'),
  starter: buildFallbackPlan('starter', ' (Fallback)'),
  silver: buildFallbackPlan('pro'),
  pro: buildFallbackPlan('pro', ' (Fallback)'),
  gold: buildFallbackPlan('studio'),
  studio: buildFallbackPlan('studio', ' (Fallback)'),
};

export interface SubscriptionContextValue {
  trainerId: string | null;
  isLoading: boolean;
  subscription: SubscriptionState | null;
  plan: PlanPermissions | null;
  activeStudentsCount: number;
  remainingStudentsCount: number;
  limitProgress: number;
  canAccess: (feature:
    | 'ai'
    | 'financial'
    | 'gamification'
    | 'pdf'
    | 'custom_branding'
    | 'whatsapp_support'
    | 'elite_badge'
    | 'advanced_reports'
    | 'assessment_full'
    | 'anamnesis'
    | 'evolution_management'
  ) => boolean;
  canCreateStudent: boolean;
  displayBadgeName: string;
  isPaymentPending: boolean;
  badgeThemeColor: string;
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

let sharedInflight: Promise<void> | null = null;
let sharedInflightTrainerId: string | null = null;

export interface SubscriptionProviderProps {
  trainerId: string | null;
  children: React.ReactNode;
}

export function SubscriptionProvider({ trainerId, children }: SubscriptionProviderProps) {
  const { currentProfile, students } = useStore();

  const countLocalActiveStudents = useCallback(
    (id: string) =>
      students.filter((s) => s.trainer_id === id && s.status === 'active').length,
    [students]
  );

  const [isLoading, setIsLoading] = useState(() => {
    if (!trainerId) return false;
    return !readSubscriptionCache(trainerId);
  });
  const [subscription, setSubscription] = useState<SubscriptionState | null>(() => {
    if (!trainerId) return null;
    return readSubscriptionCache(trainerId)?.subscription ?? null;
  });
  const [plan, setPlan] = useState<PlanPermissions | null>(() => {
    if (!trainerId) return null;
    return readSubscriptionCache(trainerId)?.plan ?? null;
  });
  const [activeStudentsCount, setActiveStudentsCount] = useState(() => {
    if (!trainerId) return 0;
    const cached = readSubscriptionCache(trainerId);
    return cached?.activeStudentsCount ?? countLocalActiveStudents(trainerId);
  });

  const hasHydratedPlanRef = useRef(!!plan);

  const applyCache = useCallback((id: string) => {
    const cached = readSubscriptionCache(id);
    if (!cached) return false;
    setSubscription(cached.subscription);
    setPlan(cached.plan);
    setActiveStudentsCount(cached.activeStudentsCount);
    hasHydratedPlanRef.current = !!cached.plan;
    setIsLoading(false);
    return true;
  }, []);

  const refresh = useCallback(async () => {
    if (!trainerId) {
      setIsLoading(false);
      return;
    }

    if (
      sharedInflight &&
      sharedInflightTrainerId === trainerId
    ) {
      await sharedInflight;
      return;
    }

    if (!hasHydratedPlanRef.current) {
      setIsLoading(true);
    }

    const run = async () => {
      if (
        currentProfile?.email &&
        ['matheus.fillipe@hotmail.com', 'matheus.fillipe.farias.lisboa@gmail.com'].includes(
          currentProfile.email.toLowerCase().trim()
        )
      ) {
        const sub: SubscriptionState = {
          trainer_id: trainerId,
          status: 'active',
          isValid: true,
          isExpired: false,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        };
        const studioPlan = FALLBACK_PLANS_PERMISSIONS.studio;
        setSubscription(sub);
        setPlan(studioPlan);
        setActiveStudentsCount(0);
        hasHydratedPlanRef.current = true;
        writeSubscriptionCache({
          trainerId,
          subscription: sub,
          plan: studioPlan,
          activeStudentsCount: 0,
        });
        return;
      }

      if (!isSupabaseConfigured || !supabase) {
        const sub: SubscriptionState = {
          trainer_id: trainerId,
          status: 'trial',
          isValid: true,
          isExpired: false,
          expires_at: new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
        };
        const starterPlan = FALLBACK_PLANS_PERMISSIONS.starter;
        setSubscription(sub);
        setPlan(starterPlan);
        setActiveStudentsCount(countLocalActiveStudents(trainerId));
        hasHydratedPlanRef.current = true;
        return;
      }

      await ensureSupabaseSession();

      try {
        const { data: subData, error: subError } = await supabase
          .from('subscriptions')
          .select(`
            id,
            trainer_id,
            plan_id,
            status,
            started_at,
            expires_at,
            asaas_subscription_id,
            plans ( * )
          `)
          .eq('trainer_id', trainerId)
          .order('created_at', { ascending: false })
          .maybeSingle();

        const { count, error: countError } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('trainer_id', trainerId)
          .eq('status', 'active');

        const studentCount =
          !countError && count !== null
            ? count
            : countLocalActiveStudents(trainerId);
        setActiveStudentsCount(studentCount);

        if (subError || !subData) {
          if (!hasHydratedPlanRef.current) {
            setSubscription({
              trainer_id: trainerId,
              status: 'none',
              isValid: false,
              isExpired: true,
            });
            setPlan(null);
          }
          return;
        }

        let effectiveSubData = subData;
        const pendingAsaasSubId = subData.asaas_subscription_id as string | undefined;

        if (subData.status === 'pending' && pendingAsaasSubId) {
          try {
            const { BillingService } = await import('../services/billing');
            const syncResult = await BillingService.syncAsaasPayment(
              trainerId,
              pendingAsaasSubId,
              { retries: 2, delayMs: 1500 }
            );
            if (syncResult.synced) {
              const { data: refreshedSub } = await supabase
                .from('subscriptions')
                .select(`
                  id,
                  trainer_id,
                  plan_id,
                  status,
                  started_at,
                  expires_at,
                  asaas_subscription_id,
                  plans ( * )
                `)
                .eq('trainer_id', trainerId)
                .maybeSingle();
              if (refreshedSub) effectiveSubData = refreshedSub;
            }
          } catch (syncErr) {
            console.warn('Auto-sync assinatura pending:', syncErr);
          }
        }

        const expiresTime = new Date(effectiveSubData.expires_at).getTime();
        const isExpired = expiresTime < Date.now();
        const isActive =
          effectiveSubData.status === 'active' || effectiveSubData.status === 'trial';
        const isValid = isActive && !isExpired;

        const nextSubscription: SubscriptionState = {
          id: effectiveSubData.id,
          trainer_id: effectiveSubData.trainer_id,
          plan_id: effectiveSubData.plan_id,
          status: effectiveSubData.status as SubscriptionState['status'],
          started_at: effectiveSubData.started_at,
          expires_at: effectiveSubData.expires_at,
          isValid,
          isExpired,
        };

        const dbPlan = (effectiveSubData as {
          plans?: { id?: string; name?: string; slug?: string; price?: number; features?: unknown };
        }).plans;

        const nextPlan = dbPlan?.slug
          ? buildPlanPermissionsFromSlug(normalizePlanSlug(String(dbPlan.slug)), dbPlan)
          : null;

        setSubscription(nextSubscription);
        setPlan(nextPlan);
        hasHydratedPlanRef.current = !!nextPlan;

        writeSubscriptionCache({
          trainerId,
          subscription: nextSubscription,
          plan: nextPlan,
          activeStudentsCount: studentCount,
        });
      } catch (err) {
        console.error('Error fetching subscription details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    sharedInflightTrainerId = trainerId;
    sharedInflight = run().finally(() => {
      sharedInflight = null;
      sharedInflightTrainerId = null;
    });
    await sharedInflight;
  }, [trainerId, countLocalActiveStudents, currentProfile?.email]);

  useEffect(() => {
    if (!trainerId) {
      setSubscription(null);
      setPlan(null);
      setActiveStudentsCount(0);
      setIsLoading(false);
      hasHydratedPlanRef.current = false;
      return;
    }

    const hadCache = applyCache(trainerId);
    if (!hadCache) {
      hasHydratedPlanRef.current = false;
    }
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh quando trainerId muda
  }, [trainerId]);

  useEffect(() => {
    const onRefresh = () => {
      void refresh();
    };
    window.addEventListener('axosfit:subscription-refresh', onRefresh);
    return () => window.removeEventListener('axosfit:subscription-refresh', onRefresh);
  }, [refresh]);

  const canAccess = useCallback(
    (feature:
      | 'ai'
      | 'financial'
      | 'gamification'
      | 'pdf'
      | 'custom_branding'
      | 'whatsapp_support'
      | 'elite_badge'
      | 'advanced_reports'
      | 'assessment_full'
      | 'anamnesis'
      | 'evolution_management'
    ): boolean => {
      if (!subscription?.isValid || !plan) {
        return false;
      }

      switch (feature) {
        case 'ai':
        case 'advanced_reports':
          return plan.advanced_reports_enabled ?? plan.ai_enabled;
        case 'financial':
          return plan.financial_enabled;
        case 'gamification':
        case 'evolution_management':
          return plan.evolution_management_enabled ?? plan.gamification_enabled;
        case 'pdf':
          return plan.pdf_enabled;
        case 'assessment_full':
          return plan.assessment_full_enabled ?? plan.pdf_enabled;
        case 'anamnesis':
          return plan.anamnesis_enabled ?? plan.pdf_enabled;
        case 'custom_branding':
        case 'elite_badge':
          return false;
        case 'whatsapp_support':
          return plan.whatsapp_support_enabled;
        default:
          return false;
      }
    },
    [subscription, plan]
  );

  const maxStudents = plan?.max_students ?? 0;
  const unlimited = isUnlimitedStudents(maxStudents);
  const canCreateStudent = plan ? unlimited || activeStudentsCount < maxStudents : false;
  const remainingStudentsCount = unlimited
    ? UNLIMITED_STUDENTS
    : Math.max(0, maxStudents - activeStudentsCount);
  const limitProgress =
    plan && !unlimited ? Math.min(100, (activeStudentsCount / maxStudents) * 100) : 0;

  const resolvedPlanSlug = plan ? normalizePlanSlug(plan.slug) : null;
  const displayBadgeName = resolvedPlanSlug ? PLAN_DISPLAY_NAMES[resolvedPlanSlug] : '';
  const isPaymentPending = subscription?.status === 'pending';

  const badgeThemeColor = !resolvedPlanSlug
    ? 'bg-muted text-muted-foreground border-border'
    : resolvedPlanSlug === 'starter'
      ? 'bg-primary/10 text-primary border-primary/20'
      : resolvedPlanSlug === 'pro'
        ? 'bg-violet-500/10 text-violet-300 border-violet-500/20'
        : 'bg-amber-500/10 text-amber-300 border-amber-500/20';

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      trainerId,
      isLoading,
      subscription,
      plan,
      activeStudentsCount,
      remainingStudentsCount,
      limitProgress,
      canAccess,
      canCreateStudent,
      displayBadgeName,
      isPaymentPending,
      badgeThemeColor,
      refresh,
    }),
    [
      trainerId,
      isLoading,
      subscription,
      plan,
      activeStudentsCount,
      remainingStudentsCount,
      limitProgress,
      canAccess,
      canCreateStudent,
      displayBadgeName,
      isPaymentPending,
      badgeThemeColor,
      refresh,
    ]
  );

  return React.createElement(SubscriptionContext.Provider, { value }, children);
}

export function useSubscription(_trainerIdOverride?: string): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error('useSubscription deve ser usado dentro de SubscriptionProvider');
  }
  return ctx;
}
