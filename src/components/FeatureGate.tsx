/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { Lock, Sparkles, ArrowUpRight } from 'lucide-react';
import { getRequiredPlanLabel, getUpgradeMessage, type PlanFeatureKey } from '../lib/plans';

interface FeatureGateProps {
  feature: PlanFeatureKey | 'ai' | 'custom_branding' | 'elite_badge' | 'gamification' | 'evolution_management' | 'assessment_full' | 'anamnesis';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showCTA?: boolean;
}

const LEGACY_FEATURE_MAP: Record<string, PlanFeatureKey> = {
  ai: 'advanced_reports',
  financial: 'financial',
  gamification: 'evolution_management',
  evolution_management: 'evolution_management',
  pdf: 'pdf',
  assessment_full: 'assessment_full',
  anamnesis: 'anamnesis',
  whatsapp_support: 'whatsapp_support',
  advanced_reports: 'advanced_reports',
};

const featureLabels: Record<PlanFeatureKey, { title: string; desc: string }> = {
  financial: {
    title: 'Controle financeiro',
    desc: 'Acompanhe mensalidades, vencimentos e receita recorrente dos seus alunos em um painel dedicado.',
  },
  pdf: {
    title: 'PDF profissional',
    desc: 'Exporte avaliações físicas e relatórios financeiros com layout profissional.',
  },
  assessment_full: {
    title: 'Avaliação física completa',
    desc: 'Registre medidas corporais detalhadas e acompanhe a evolução dos alunos.',
  },
  anamnesis: {
    title: 'Anamnese avançada',
    desc: 'Histórico médico, lesões, hábitos alimentares e queixa principal estruturados.',
  },
  evolution_management: {
    title: 'Gestão de evolução',
    desc: 'Gráficos e histórico avançado de peso, composição corporal e progresso.',
  },
  whatsapp_support: {
    title: 'Suporte prioritário WhatsApp',
    desc: 'Atendimento direto via WhatsApp para assessorias no plano Studio.',
  },
  advanced_reports: {
    title: 'Relatórios avançados',
    desc: 'Relatórios detalhados de performance, evolução e indicadores da assessoria.',
  },
};

export default function FeatureGate({
  feature,
  children,
  fallback,
  showCTA = true,
}: FeatureGateProps) {
  const { canAccess, isLoading, plan } = useSubscription();

  if (isLoading && !plan) {
    return (
      <div className="animate-pulse flex items-center justify-center p-6 bg-muted/30 border border-border rounded-2xl">
        <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 border-t-primary animate-spin" />
      </div>
    );
  }

  const mapped = LEGACY_FEATURE_MAP[feature] ?? (feature as PlanFeatureKey);
  const hasAccess = canAccess(mapped as Parameters<typeof canAccess>[0]);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showCTA || feature === 'custom_branding' || feature === 'elite_badge') {
    return null;
  }

  const info = featureLabels[mapped] ?? {
    title: 'Recurso premium',
    desc: getUpgradeMessage(mapped),
  };
  const requiredPlan = getRequiredPlanLabel(mapped);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card/50 p-6 sm:p-8 text-center backdrop-blur-sm m-4 lg:m-8">
      <div className="mx-auto w-11 h-11 rounded-xl bg-muted flex items-center justify-center mb-4 text-muted-foreground border border-border">
        <Lock className="w-5 h-5 text-primary" />
      </div>

      <h3 className="text-sm font-semibold text-foreground flex items-center justify-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        {info.title}
      </h3>

      <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
        {info.desc}
      </p>

      <div className="mt-5 inline-flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full text-[10px] font-medium text-muted-foreground border border-border">
        Disponível no plano
        <span className="text-primary font-semibold">{requiredPlan}</span>
        <ArrowUpRight className="w-3 h-3 text-primary" />
      </div>

      {plan && (
        <p className="text-[10px] text-muted-foreground/70 mt-3">
          Plano atual: {plan.name}
        </p>
      )}
    </div>
  );
}
