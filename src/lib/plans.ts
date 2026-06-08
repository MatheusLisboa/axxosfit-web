/**
 * Regras de planos — docs/AxxosFit Docs/Regras/Planos.md
 * Trial: 14 dias grátis. Limites: Starter 10, Pro 25, Studio ilimitado.
 * Alunos não pagam — apenas o personal.
 */

export const TRIAL_DAYS = 14;

/** Valor sentinela para planos com alunos ilimitados (Studio). */
export const UNLIMITED_STUDENTS = 999_999;

export type CanonicalPlanSlug = 'starter' | 'pro' | 'studio';

export const PLAN_STUDENT_LIMITS: Record<string, number> = {
  starter: 10,
  bronze: 10,
  pro: 25,
  silver: 25,
  studio: UNLIMITED_STUDENTS,
  gold: UNLIMITED_STUDENTS,
};

export function normalizePlanSlug(slug: string): CanonicalPlanSlug {
  const s = slug.toLowerCase();
  if (s === 'bronze' || s === 'starter') return 'starter';
  if (s === 'silver' || s === 'pro') return 'pro';
  return 'studio';
}

export function getMaxStudentsForSlug(slug: string): number {
  return PLAN_STUDENT_LIMITS[slug.toLowerCase()] ?? PLAN_STUDENT_LIMITS.starter;
}

export function isUnlimitedStudents(max: number): boolean {
  return max >= UNLIMITED_STUDENTS;
}

export function formatStudentLimit(max: number): string {
  return isUnlimitedStudents(max) ? 'Ilimitado' : String(max);
}

export function canAddStudent(maxStudents: number, currentActiveCount: number): boolean {
  if (isUnlimitedStudents(maxStudents)) return true;
  return currentActiveCount < maxStudents;
}

export function studentLimitMessage(maxStudents: number, planName?: string): string {
  const label = planName ? `plano ${planName}` : 'seu plano atual';
  if (isUnlimitedStudents(maxStudents)) {
    return `Limite de alunos atingido no ${label}.`;
  }
  return `Limite de alunos atingido! O ${label} permite no máximo ${maxStudents} alunos ativos. Faça upgrade para cadastrar mais.`;
}

export const PLAN_STUDENT_FEATURE_LABEL: Record<CanonicalPlanSlug, string> = {
  starter: 'Até 10 alunos ativos',
  pro: 'Até 25 alunos ativos',
  studio: 'Alunos ilimitados',
};

export const PLAN_PRICES: Record<CanonicalPlanSlug, number> = {
  starter: 99.9,
  pro: 149.9,
  studio: 189.9,
};

export const PLAN_DISPLAY_NAMES = {
  starter: 'Starter',
  pro: 'Pro',
  studio: 'Studio',
} as const satisfies Record<CanonicalPlanSlug, string>;

export function formatPlanPrice(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

export function getPlanPriceFormatted(slug: string): string {
  return formatPlanPrice(getPlanPrice(slug));
}

export function getPlanPrice(slug: string): number {
  return PLAN_PRICES[normalizePlanSlug(slug)];
}

export function planSlugToCardName(slug: string): 'Starter' | 'Pro' | 'Studio' {
  const canonical = normalizePlanSlug(slug);
  return PLAN_DISPLAY_NAMES[canonical];
}

export function getTrialDaysRemaining(expiresAt?: string | null): number | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

/** Features oficiais por plano (Planos.md). */
export const PLAN_FEATURE_LISTS: Record<CanonicalPlanSlug, readonly string[]> = {
  starter: [
    'Até 10 alunos ativos',
    'Editor de treinos',
    'App do aluno',
    'Evolução básica',
    'Suporte via e-mail',
    `${TRIAL_DAYS} dias grátis`,
  ],
  pro: [
    'Tudo do Starter',
    'Até 25 alunos ativos',
    'Avaliação física completa',
    'PDF profissional',
    'Controle financeiro',
    'Anamnese avançada',
    'Gestão de evolução',
    'Suporte prioritário',
  ],
  studio: [
    'Tudo do Pro',
    'Alunos ilimitados',
    'Suporte prioritário WhatsApp',
    'Relatórios avançados',
  ],
};

export interface PlanMarketingCard {
  slug: CanonicalPlanSlug;
  name: string;
  subtitle: string;
  price: string;
  priceValue: number;
  cta: string;
  popular?: boolean;
  premium?: boolean;
  features: readonly string[];
}

export const PLAN_CATALOG: Record<CanonicalPlanSlug, PlanMarketingCard> = {
  starter: {
    slug: 'starter',
    name: 'Starter',
    subtitle: 'Para começar sua assessoria',
    price: '99,90',
    priceValue: PLAN_PRICES.starter,
    cta: 'Começar grátis',
    features: PLAN_FEATURE_LISTS.starter,
  },
  pro: {
    slug: 'pro',
    name: 'Pro',
    subtitle: 'Para escalar com profissionalismo',
    price: '149,90',
    priceValue: PLAN_PRICES.pro,
    cta: 'Escolher Pro',
    popular: true,
    features: PLAN_FEATURE_LISTS.pro,
  },
  studio: {
    slug: 'studio',
    name: 'Studio',
    subtitle: 'Para assessorias em crescimento',
    price: '189,90',
    priceValue: PLAN_PRICES.studio,
    cta: 'Escolher Studio',
    premium: true,
    features: PLAN_FEATURE_LISTS.studio,
  },
};

export const PLAN_CATALOG_LIST: PlanMarketingCard[] = [
  PLAN_CATALOG.starter,
  PLAN_CATALOG.pro,
  PLAN_CATALOG.studio,
];

/** Linhas da tabela comparativa (UI). */
export interface PlanComparisonRow {
  label: string;
  starter: string | boolean;
  pro: string | boolean;
  studio: string | boolean;
  minPlan?: 'pro' | 'studio';
}

export const PLAN_COMPARISON_ROWS: PlanComparisonRow[] = [
  { label: 'Alunos ativos', starter: '10', pro: '25', studio: 'Ilimitados' },
  { label: 'Editor de treinos', starter: true, pro: true, studio: true },
  { label: 'App do aluno', starter: true, pro: true, studio: true },
  { label: 'Evolução básica', starter: true, pro: true, studio: true },
  { label: 'Suporte via e-mail', starter: true, pro: true, studio: true },
  { label: `${TRIAL_DAYS} dias grátis`, starter: true, pro: false, studio: false },
  { label: 'Avaliação física completa', starter: false, pro: true, studio: true, minPlan: 'pro' },
  { label: 'PDF profissional', starter: false, pro: true, studio: true, minPlan: 'pro' },
  { label: 'Controle financeiro', starter: false, pro: true, studio: true, minPlan: 'pro' },
  { label: 'Anamnese avançada', starter: false, pro: true, studio: true, minPlan: 'pro' },
  { label: 'Gestão de evolução', starter: false, pro: true, studio: true, minPlan: 'pro' },
  { label: 'Suporte prioritário', starter: false, pro: true, studio: true, minPlan: 'pro' },
  { label: 'Suporte WhatsApp', starter: false, pro: false, studio: true, minPlan: 'studio' },
  { label: 'Relatórios avançados', starter: false, pro: false, studio: true, minPlan: 'studio' },
];

export type PlanFeatureKey =
  | 'financial'
  | 'pdf'
  | 'assessment_full'
  | 'anamnesis'
  | 'evolution_management'
  | 'whatsapp_support'
  | 'advanced_reports';

/** Permissões frontend alinhadas ao Planos.md (fallback quando DB não informa). */
export const PLAN_FRONTEND_PERMISSIONS: Record<
  CanonicalPlanSlug,
  {
    financial_enabled: boolean;
    pdf_enabled: boolean;
    assessment_full_enabled: boolean;
    anamnesis_enabled: boolean;
    evolution_management_enabled: boolean;
    whatsapp_support_enabled: boolean;
    advanced_reports_enabled: boolean;
  }
> = {
  starter: {
    financial_enabled: false,
    pdf_enabled: false,
    assessment_full_enabled: false,
    anamnesis_enabled: false,
    evolution_management_enabled: false,
    whatsapp_support_enabled: false,
    advanced_reports_enabled: false,
  },
  pro: {
    financial_enabled: true,
    pdf_enabled: true,
    assessment_full_enabled: true,
    anamnesis_enabled: true,
    evolution_management_enabled: true,
    whatsapp_support_enabled: false,
    advanced_reports_enabled: false,
  },
  studio: {
    financial_enabled: true,
    pdf_enabled: true,
    assessment_full_enabled: true,
    anamnesis_enabled: true,
    evolution_management_enabled: true,
    whatsapp_support_enabled: true,
    advanced_reports_enabled: true,
  },
};

export function getRequiredPlanLabel(feature: PlanFeatureKey): 'Pro' | 'Studio' {
  if (feature === 'whatsapp_support' || feature === 'advanced_reports') return 'Studio';
  return 'Pro';
}

export function getUpgradeMessage(feature: PlanFeatureKey): string {
  const plan = getRequiredPlanLabel(feature);
  const labels: Record<PlanFeatureKey, string> = {
    financial: 'Controle financeiro',
    pdf: 'PDF profissional',
    assessment_full: 'Avaliação física completa',
    anamnesis: 'Anamnese avançada',
    evolution_management: 'Gestão de evolução',
    whatsapp_support: 'Suporte prioritário WhatsApp',
    advanced_reports: 'Relatórios avançados',
  };
  return `${labels[feature]} está disponível no plano ${plan} ou superior.`;
}
