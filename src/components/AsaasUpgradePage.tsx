/**
 * Checkout de upgrade de plano via Asaas (personal já autenticado).
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  CreditCard,
  ExternalLink,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { useStore } from '../services/store';
import { BillingService, getStoredAsaasSubscriptionId } from '../services/billing';
import { SubscriptionService } from '../services/subscription';
import {
  getPlanPrice,
  normalizePlanSlug,
  PLAN_DISPLAY_NAMES,
  PLAN_STUDENT_FEATURE_LABEL,
  type CanonicalPlanSlug,
} from '../lib/plans';
import { Button } from '../figma/components/ui/Button';
import { GlassCard } from '../figma/components/ui/GlassCard';

interface AsaasUpgradePageProps {
  initialPlanSlug: CanonicalPlanSlug;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function AsaasUpgradePage({
  initialPlanSlug,
  onCancel,
  onSuccess,
}: AsaasUpgradePageProps) {
  const { currentProfile, currentTrainer } = useStore();
  const [planSlug] = useState<CanonicalPlanSlug>(normalizePlanSlug(initialPlanSlug));
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activated, setActivated] = useState(false);

  const planName = PLAN_DISPLAY_NAMES[planSlug];
  const price = getPlanPrice(planSlug);

  const startUpgrade = useCallback(async () => {
    if (!currentProfile) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const result = await BillingService.startAsaasUpgrade({
        userId: currentProfile.id,
        email: currentProfile.email,
        name: currentProfile.name,
        phone: currentProfile.phone || currentTrainer?.whatsapp,
        cpf: currentProfile.cpf || currentTrainer?.cpf,
        asaasCustomerId: currentTrainer?.asaas_customer_id,
        planSlug,
      });

      if (result.paymentUrl) {
        setPaymentUrl(result.paymentUrl);
        window.open(result.paymentUrl, '_blank', 'noopener,noreferrer');
      } else if (result.status === 'simulated') {
        setActivated(true);
        onSuccess();
      } else {
        throw new Error(result.message || 'Link de pagamento não retornado pelo Asaas.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao iniciar pagamento.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  }, [currentProfile, onSuccess, planSlug]);

  useEffect(() => {
    void startUpgrade();
  }, [startUpgrade]);

  const checkPaymentStatus = async () => {
    if (!currentProfile) return;
    setIsChecking(true);
    setErrorMsg(null);
    try {
      await BillingService.syncAsaasPayment(
        currentProfile.id,
        getStoredAsaasSubscriptionId(currentProfile.id)
      );

      const sub = await SubscriptionService.verifyTrainerSubscription(currentProfile.id);
      if (sub.isValid && sub.status === 'active') {
        setActivated(true);
        onSuccess();
      } else {
        setErrorMsg('Pagamento ainda não confirmado no Asaas. Aguarde alguns segundos e tente novamente.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Não foi possível verificar o status.';
      setErrorMsg(msg);
    } finally {
      setIsChecking(false);
    }
  };

  if (activated) {
    return (
      <div className="min-h-screen dark bg-background text-foreground flex items-center justify-center p-4">
        <GlassCard className="max-w-md w-full p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Plano ativado!</h2>
          <p className="text-sm text-muted-foreground">
            Seu plano {planName} está ativo. Redirecionando ao painel…
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark bg-background text-foreground flex items-center justify-center p-4">
      <GlassCard className="max-w-lg w-full p-6 sm:p-8">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao painel
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Upgrade — {planName}</h1>
            <p className="text-xs text-muted-foreground">Pagamento seguro via Asaas</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-4 mb-6">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm text-muted-foreground">Valor mensal</span>
            <span className="text-2xl font-bold">
              R$ {price.toFixed(2).replace('.', ',')}
              <span className="text-xs font-normal text-muted-foreground">/mês</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{PLAN_STUDENT_FEATURE_LABEL[planSlug]}</p>
        </div>

        {errorMsg && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs mb-4">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-3">
          <Button
            variant="primary"
            fullWidth
            loading={isLoading}
            onClick={() => void startUpgrade()}
            icon={<ShieldCheck className="w-4 h-4" />}
          >
            {isLoading ? 'Gerando cobrança…' : 'Abrir pagamento Asaas'}
          </Button>

          {paymentUrl && (
            <Button
              variant="outline"
              fullWidth
              onClick={() => window.open(paymentUrl, '_blank', 'noopener,noreferrer')}
              icon={<ExternalLink className="w-4 h-4" />}
            >
              Reabrir link de pagamento
            </Button>
          )}

          <Button
            variant="ghost"
            fullWidth
            loading={isChecking}
            onClick={() => void checkPaymentStatus()}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Já paguei — verificar status
          </Button>
        </div>

        <p className="text-[11px] text-muted-foreground text-center mt-6 leading-relaxed">
          A confirmação é feita automaticamente pelo webhook do Asaas. Você também pode verificar
          manualmente após concluir o pagamento.
        </p>
      </GlassCard>
    </div>
  );
}
