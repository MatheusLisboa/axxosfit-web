/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Check, ShieldAlert, Sparkles, RefreshCw, CreditCard } from 'lucide-react';
import { useStore } from '../services/store';
import { useSubscription } from '../hooks/useSubscription';
import {
  PLAN_CATALOG_LIST,
  normalizePlanSlug,
  TRIAL_DAYS,
  getTrialDaysRemaining,
  PLAN_DISPLAY_NAMES,
} from '../lib/plans';
import { BillingService, getStoredAsaasSubscriptionId } from '../services/billing';
import { PlanComparisonTable } from './plans/PlanComparisonTable';

export default function UpgradePlanPage() {
  const { currentProfile, currentTrainer } = useStore();
  const { plan: currentPlan, subscription, refresh, isPaymentPending } = useSubscription();
  const isTrial = subscription?.status === 'trial';
  const trialDaysLeft = getTrialDaysRemaining(subscription?.expires_at);
  const currentSlug = normalizePlanSlug(currentPlan?.slug || 'starter');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [verifyErrorMsg, setVerifyErrorMsg] = useState<string | null>(null);
  const [successLink, setSuccessLink] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [checkOk, setCheckOk] = useState(false);

  const handleVerifyPayment = async () => {
    if (!currentProfile) return;
    setIsChecking(true);
    setVerifyErrorMsg(null);
    try {
      const result = await BillingService.syncAsaasPayment(
        currentProfile.id,
        getStoredAsaasSubscriptionId(currentProfile.id),
        { retries: 5, delayMs: 2500 }
      );
      if (result.synced) {
        setCheckOk(true);
        setVerifyErrorMsg(null);
        await refresh();
      } else {
        setVerifyErrorMsg(result.message || 'Pagamento ainda não confirmado no Asaas.');
      }
    } catch (err: unknown) {
      setVerifyErrorMsg(err instanceof Error ? err.message : 'Não foi possível verificar o pagamento.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleUpgrade = async (planSlug: string) => {
    if (!currentProfile) return;
    setLoadingPlan(planSlug);
    setErrorMsg(null);
    setVerifyErrorMsg(null);
    setSuccessLink(null);

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
        window.open(result.paymentUrl, '_blank', 'noopener,noreferrer');
        setSuccessLink(result.paymentUrl);
      } else if (result.status === 'simulated') {
        await refresh();
        setSuccessLink(null);
        setErrorMsg(null);
      } else {
        throw new Error(result.message || 'Não foi possível gerar o link de pagamento Asaas.');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : 'Erro de comunicação ao contactar o Asaas. Tente novamente.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="space-y-12 animate-fade-in">
      {isTrial && (
        <div className="max-w-2xl mx-auto rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-center text-sm text-foreground">
          Você está no <strong>Starter trial</strong>
          {trialDaysLeft !== null && (
            <> — {trialDaysLeft} {trialDaysLeft === 1 ? 'dia' : 'dias'} restante{trialDaysLeft === 1 ? '' : 's'}</>
          )}
          . Após os {TRIAL_DAYS} dias grátis, faça upgrade para continuar com recursos avançados.
        </div>
      )}

      {(isPaymentPending || successLink) && !checkOk && (
        <div className="max-w-3xl mx-auto p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-3">
          <div className="flex items-start gap-3">
            <CreditCard className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-amber-300">
                {isPaymentPending && !successLink
                  ? 'Pagamento pendente de confirmação'
                  : 'Checkout iniciado'}
              </h4>
              <p className="text-xs text-amber-400/90 mt-1">
                {isPaymentPending
                  ? `Seu plano ${currentPlan?.name || ''} só libera os recursos após confirmar o pagamento.`
                  : 'Se a janela não abriu, use o link abaixo.'}
              </p>
              {successLink && (
                <p className="text-xs mt-1">
                  <a href={successLink} target="_blank" rel="noreferrer" className="underline font-medium text-amber-300">
                    Abrir link de pagamento
                  </a>
                </p>
              )}
            </div>
          </div>
          {verifyErrorMsg && <p className="text-xs text-rose-400/90">{verifyErrorMsg}</p>}
          <button
            type="button"
            onClick={() => void handleVerifyPayment()}
            disabled={isChecking}
            className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Verificando pagamento…' : 'Já paguei — verificar e ativar plano'}
          </button>
        </div>
      )}

      {checkOk && (
        <div className="max-w-3xl mx-auto p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
          <p className="text-xs text-emerald-300 font-medium">Plano ativado com sucesso! Recarregue a página se os menus não atualizarem.</p>
        </div>
      )}

      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs font-medium border border-border">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          Planos AxxosFit
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Escale sua assessoria no seu ritmo
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Alunos não pagam — apenas você assina. Escolha o plano ideal e faça upgrade quando precisar.
        </p>
      </div>

      {errorMsg && (
        <div className="max-w-3xl mx-auto p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-semibold text-rose-300">Erro ao gerar checkout</h4>
            <p className="text-xs text-rose-400/90 mt-1">{errorMsg}</p>
            {errorMsg.includes('CPF') && (
              <p className="text-xs text-muted-foreground mt-2">
                O CPF é obtido do seu cadastro. Se estiver em branco, entre em contato com o suporte para atualizar.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
        {PLAN_CATALOG_LIST.map((tier) => {
          const isCurrent =
            currentSlug === tier.slug &&
            (subscription?.status === 'active' || subscription?.status === 'trial');

          return (
            <div
              key={tier.slug}
              className={`relative flex flex-col rounded-2xl border p-6 transition-all ${
                tier.popular
                  ? 'border-primary/40 bg-card shadow-lg shadow-primary/5 ring-1 ring-primary/20'
                  : tier.premium
                    ? 'border-amber-500/20 bg-card'
                    : 'border-border bg-card/60'
              }`}
            >
              {tier.popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-[10px] font-semibold tracking-wide uppercase px-3 py-0.5 rounded-full text-primary-foreground">
                  Recomendado
                </span>
              )}
              {tier.premium && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-500/90 text-[10px] font-semibold tracking-wide uppercase px-3 py-0.5 rounded-full text-slate-950">
                  Studio
                </span>
              )}

              <div className="mb-5">
                <p className="text-xs text-muted-foreground mb-1">{tier.subtitle}</p>
                <h3 className="text-lg font-semibold text-foreground">{tier.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold tracking-tight text-foreground">R$ {tier.price}</span>
                  <span className="text-xs text-muted-foreground">/mês</span>
                </div>
              </div>

              {isCurrent ? (
                <button
                  disabled
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold border border-border bg-muted text-muted-foreground cursor-not-allowed mb-6"
                >
                  {isTrial && tier.slug === 'starter'
                    ? `Trial · ${trialDaysLeft ?? TRIAL_DAYS} dias`
                    : 'Plano atual'}
                </button>
              ) : (
                <button
                  disabled={!!loadingPlan}
                  onClick={() => handleUpgrade(tier.slug)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition mb-6 flex items-center justify-center gap-2 ${
                    loadingPlan === tier.slug
                      ? 'bg-muted text-muted-foreground animate-pulse'
                      : tier.popular
                        ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                        : 'bg-foreground hover:bg-foreground/90 text-background'
                  }`}
                >
                  {loadingPlan === tier.slug ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Processando…
                    </>
                  ) : (
                    `Contratar ${PLAN_DISPLAY_NAMES[tier.slug]}`
                  )}
                </button>
              )}

              <ul className="space-y-2.5 flex-1">
                {tier.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" strokeWidth={2.5} />
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="max-w-6xl mx-auto space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground">Compare os planos</h3>
          <p className="text-xs text-muted-foreground mt-1">Recursos oficiais conforme seu plano contratado</p>
        </div>
        <div className="rounded-2xl border border-border bg-card/40 p-4 sm:p-6">
          <PlanComparisonTable highlightSlug={currentSlug} />
        </div>
      </div>
    </div>
  );
}
