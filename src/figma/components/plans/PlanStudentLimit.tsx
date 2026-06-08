import { Users, AlertCircle } from 'lucide-react';
import { useSubscription } from '../../../hooks/useSubscription';
import {
  formatStudentLimit,
  isUnlimitedStudents,
  TRIAL_DAYS,
  getTrialDaysRemaining,
} from '../../../lib/plans';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';

interface PlanStudentLimitProps {
  onUpgrade?: () => void;
  compact?: boolean;
}

export function PlanStudentLimit({ onUpgrade, compact = false }: PlanStudentLimitProps) {
  const {
    plan,
    subscription,
    activeStudentsCount,
    remainingStudentsCount,
    limitProgress,
    canCreateStudent,
    isLoading,
    displayBadgeName,
  } = useSubscription();

  const isTrial = subscription?.status === 'trial';
  const trialDaysLeft = getTrialDaysRemaining(subscription?.expires_at);

  if (isLoading || !plan) return null;

  const unlimited = isUnlimitedStudents(plan.max_students);
  const atLimit = !canCreateStudent;

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-muted-foreground flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          {activeStudentsCount} / {formatStudentLimit(plan.max_students)} alunos
        </span>
        {atLimit && (
          <span className="text-rose-400 font-semibold flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            Limite atingido
          </span>
        )}
      </div>
    );
  }

  return (
    <GlassCard className={`p-4 ${atLimit ? 'border-rose-500/30' : ''}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
            Plano {displayBadgeName}
          </p>
          <p className="text-sm font-semibold text-foreground">
            {plan.name}
            {isTrial && (
              <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-primary">
                Trial{trialDaysLeft !== null ? ` · ${trialDaysLeft}d` : ''}
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isTrial
              ? `Starter grátis por ${TRIAL_DAYS} dias — faça upgrade para continuar após o trial.`
              : unlimited
                ? 'Alunos ilimitados no seu plano.'
                : `Até ${plan.max_students} alunos ativos — alunos não pagam, apenas você.`}
          </p>
        </div>
        {!unlimited && (
          <div className="w-full sm:w-56 space-y-1.5">
            <div className="flex justify-between text-xs font-medium text-muted-foreground">
              <span>Alunos ativos</span>
              <span className="text-foreground font-semibold">
                {activeStudentsCount} / {plan.max_students}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${limitProgress >= 80 ? 'bg-rose-500' : 'bg-primary'}`}
                style={{ width: `${limitProgress}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground text-right">
              {atLimit ? 'Limite atingido' : `Restam ${remainingStudentsCount} cadastros`}
            </p>
          </div>
        )}
      </div>
      {atLimit && onUpgrade && (
        <div className="mt-4 pt-4 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Faça upgrade via Asaas para cadastrar mais alunos.
          </p>
          <Button variant="primary" size="sm" onClick={onUpgrade}>
            Upgrade de plano
          </Button>
        </div>
      )}
    </GlassCard>
  );
}
