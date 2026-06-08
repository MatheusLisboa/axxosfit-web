import type { ReactNode } from 'react';
import FeatureGate from '../../../components/FeatureGate';
import type { PlanFeatureKey } from '../../../lib/plans';

interface PlanFeatureGateProps {
  feature: PlanFeatureKey | 'ai' | 'custom_branding' | 'elite_badge' | 'gamification' | 'evolution_management' | 'assessment_full' | 'anamnesis';
  children: ReactNode;
  fallback?: ReactNode;
  showCTA?: boolean;
}

const FEATURE_ALIAS: Record<string, PlanFeatureKey | 'ai' | 'custom_branding' | 'elite_badge'> = {
  gamification: 'evolution_management',
  evolution_management: 'evolution_management',
  assessment_full: 'assessment_full',
  anamnesis: 'anamnesis',
};

export function PlanFeatureGate({ feature, children, fallback, showCTA }: PlanFeatureGateProps) {
  const mapped = (FEATURE_ALIAS[feature] ?? feature) as PlanFeatureKey | 'ai' | 'custom_branding' | 'elite_badge';
  return (
    <FeatureGate feature={mapped} fallback={fallback} showCTA={showCTA}>
      {children}
    </FeatureGate>
  );
}
