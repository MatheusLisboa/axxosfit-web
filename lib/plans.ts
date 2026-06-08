/**
 * Preços oficiais dos planos — docs/AxxosFit Docs/Regras/Planos.md
 * Usado pelo backend (Asaas, checkout) e alinhado ao frontend (src/lib/plans.ts).
 */

export type CanonicalPlanSlug = 'starter' | 'pro' | 'studio';

export const PLAN_PRICES: Record<CanonicalPlanSlug, number> = {
  starter: 99.9,
  pro: 149.9,
  studio: 189.9,
};

export function normalizePlanSlug(slug: string): CanonicalPlanSlug {
  const s = String(slug || 'starter').toLowerCase();
  if (s === 'bronze' || s === 'starter') return 'starter';
  if (s === 'silver' || s === 'pro') return 'pro';
  return 'studio';
}

export function getPlanPrice(slug: string): number {
  return PLAN_PRICES[normalizePlanSlug(slug)];
}
