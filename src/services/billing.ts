/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { normalizePlanSlug } from '../lib/plans';
import { applyAsaasPaymentLocally, notifySubscriptionRefresh } from './asaasPaymentApply';
import { SubscriptionService } from './subscription';
import { apiUrl, formatApiNetworkError } from '../lib/apiBase';

const ASAAS_SUB_STORAGE_PREFIX = 'axosfit_asaas_sub_';
const ASAAS_UPGRADE_CTX_PREFIX = 'axosfit_asaas_upgrade_';

export interface StoredAsaasUpgradeContext {
  trainerId: string;
  planSlug: string;
  planId?: string;
  asaasSubscriptionId: string;
  price?: number;
  savedAt: string;
}

function persistAsaasSubscriptionId(userId: string, asaasSubscriptionId: string) {
  try {
    localStorage.setItem(`${ASAAS_SUB_STORAGE_PREFIX}${userId}`, asaasSubscriptionId);
    sessionStorage.setItem(`${ASAAS_SUB_STORAGE_PREFIX}${userId}`, asaasSubscriptionId);
  } catch {
    // noop
  }
}

export function persistAsaasUpgradeContext(ctx: StoredAsaasUpgradeContext) {
  try {
    localStorage.setItem(`${ASAAS_UPGRADE_CTX_PREFIX}${ctx.trainerId}`, JSON.stringify(ctx));
  } catch {
    // noop
  }
}

export function getStoredAsaasUpgradeContext(
  userId: string
): StoredAsaasUpgradeContext | undefined {
  try {
    const raw = localStorage.getItem(`${ASAAS_UPGRADE_CTX_PREFIX}${userId}`);
    if (!raw) return undefined;
    return JSON.parse(raw) as StoredAsaasUpgradeContext;
  } catch {
    return undefined;
  }
}

export function clearStoredAsaasUpgradeContext(userId: string) {
  try {
    localStorage.removeItem(`${ASAAS_UPGRADE_CTX_PREFIX}${userId}`);
  } catch {
    // noop
  }
}

export function getStoredAsaasSubscriptionId(userId: string): string | undefined {
  try {
    return (
      localStorage.getItem(`${ASAAS_SUB_STORAGE_PREFIX}${userId}`) ||
      sessionStorage.getItem(`${ASAAS_SUB_STORAGE_PREFIX}${userId}`) ||
      undefined
    );
  } catch {
    return undefined;
  }
}

export interface CheckoutPreference {
  preferenceId: string;
  initPoint: string;
  planName: string;
  price: number;
}

export interface AsaasUpgradeResult {
  success: boolean;
  paymentUrl: string | null;
  subscriptionId?: string;
  asaasSubscriptionId?: string;
  asaasCustomerId?: string | null;
  planId?: string;
  planSlug?: string;
  planName: string;
  price: number;
  status: 'pending' | 'active' | 'simulated';
  requiresClientSave?: boolean;
  message?: string;
}

export type UpgradePlanSlug = 'starter' | 'pro' | 'studio' | 'bronze' | 'silver' | 'gold';

export interface AsaasUpgradeInput {
  userId: string;
  email: string;
  name: string;
  planSlug: UpgradePlanSlug | string;
  phone?: string;
  cpf?: string;
  asaasCustomerId?: string;
  billingType?: 'PIX' | 'CREDIT_CARD' | 'BOLETO' | 'UNDEFINED';
  /** URL de retorno após pagamento (usa origem atual se omitido) */
  returnUrl?: string;
}

function toApiPlanSlug(slug: string): 'starter' | 'pro' | 'studio' {
  const normalized = normalizePlanSlug(slug);
  return normalized;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function applyCheckLocally(check: {
  paid: boolean;
  trainerId: string;
  planId?: string;
  planSlug?: string;
  asaasSubscriptionId?: string;
  asaasPaymentId?: string;
  amount?: number;
}) {
  if (!check.paid) {
    return { synced: false as const, status: 'pending' as const, message: 'Pagamento ainda pendente.' };
  }

  const applied = await applyAsaasPaymentLocally({
    paid: true,
    status: 'active',
    trainerId: check.trainerId,
    planId: check.planId,
    planSlug: check.planSlug,
    asaasSubscriptionId: check.asaasSubscriptionId,
    asaasPaymentId: check.asaasPaymentId,
    amount: check.amount,
  });
  notifySubscriptionRefresh();
  clearStoredAsaasUpgradeContext(check.trainerId);
  return {
    ...applied,
    synced: true,
    paymentId: check.asaasPaymentId,
  };
}

export const BillingService = {
  /**
   * Inicia upgrade de plano via Asaas (assinatura recorrente + link de pagamento).
   */
  async startAsaasUpgrade(input: AsaasUpgradeInput): Promise<AsaasUpgradeResult> {
    const planSlug = toApiPlanSlug(input.planSlug);

    let response: Response;
    try {
      response = await fetch(apiUrl('/api/asaas/upgrade'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainerId: input.userId,
          planSlug,
          email: input.email,
          name: input.name,
          phone: input.phone,
          cpf: input.cpf,
          asaasCustomerId: input.asaasCustomerId,
          billingType: input.billingType || 'UNDEFINED',
          returnUrl:
            input.returnUrl ||
            (typeof window !== 'undefined'
              ? `${window.location.origin}/?asaas_payment=success`
              : undefined),
        }),
      });
    } catch (err) {
      throw new Error(formatApiNetworkError(err));
    }

    if (!response.ok) {
      let errMsg = 'Falha ao iniciar pagamento no Asaas.';
      const errText = await response.text();
      try {
        const errData = JSON.parse(errText) as { details?: string; error?: string };
        errMsg = errData.details || errData.error || errMsg;
      } catch {
        if (errText && errText.length < 400) errMsg = errText;
        if (response.status === 405) {
          errMsg =
            'API de pagamento indisponível (405). Execute npm run dev ou configure a API na Vercel.';
        }
      }
      if (/callback.*inválida|invalid.*callback/i.test(errMsg)) {
        errMsg +=
          ' Em dev local, conclua o pagamento no Asaas e use Configurações → Meu Plano → Verificar pagamento.';
      }
      throw new Error(errMsg);
    }

    const result = await response.json();

    if (result.asaasSubscriptionId && input.userId) {
      persistAsaasSubscriptionId(input.userId, result.asaasSubscriptionId);
      persistAsaasUpgradeContext({
        trainerId: input.userId,
        planSlug: result.planSlug || planSlug,
        planId: result.planId,
        asaasSubscriptionId: result.asaasSubscriptionId,
        price: result.price,
        savedAt: new Date().toISOString(),
      });
    }

    if (
      (result.requiresClientSave === true || !result.subscriptionId) &&
      input.userId &&
      result.asaasSubscriptionId
    ) {
      const saved = await SubscriptionService.savePendingAsaasUpgrade({
        trainerId: input.userId,
        planSlug: result.planSlug || planSlug,
        planId: result.planId,
        asaasSubscriptionId: result.asaasSubscriptionId,
        asaasCustomerId: result.asaasCustomerId || undefined,
      });
      if (!saved) {
        console.warn('Checkout Asaas OK, mas falhou ao salvar subscription localmente.');
      }
    }

    return result;
  },

  /**
   * Ativa plano localmente quando a API de sync falha mas o pagamento foi concluído.
   * Usa contexto do checkout (localStorage) ou subscription pending no Supabase.
   */
  async applyStoredUpgradeAfterPayment(trainerId: string) {
    const ctx = getStoredAsaasUpgradeContext(trainerId);

    if (ctx?.asaasSubscriptionId) {
      return applyCheckLocally({
        paid: true,
        trainerId,
        planId: ctx.planId,
        planSlug: ctx.planSlug,
        asaasSubscriptionId: ctx.asaasSubscriptionId,
        amount: ctx.price,
      });
    }

    const { supabase, isSupabaseConfigured } = await import('../lib/supabase');
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase não configurado.');
    }

    const { data: pendingSub } = await supabase
      .from('subscriptions')
      .select('plan_id, asaas_subscription_id, status')
      .eq('trainer_id', trainerId)
      .maybeSingle();

    if (pendingSub?.asaas_subscription_id) {
      return applyCheckLocally({
        paid: true,
        trainerId,
        planId: pendingSub.plan_id,
        asaasSubscriptionId: pendingSub.asaas_subscription_id,
      });
    }

    throw new Error(
      'Dados do checkout não encontrados. Use Configurações → Meu Plano → Verificar pagamento.'
    );
  },

  /**
   * Consulta Asaas e aplica o pagamento no banco com a sessão do personal logado.
   * Retries: sandbox pode demorar alguns segundos para marcar RECEIVED/CONFIRMED.
   */
  async syncAsaasPayment(
    trainerId: string,
    asaasSubscriptionId?: string,
    options?: { retries?: number; delayMs?: number }
  ) {
    const retries = options?.retries ?? 4;
    const delayMs = options?.delayMs ?? 2500;
    const storedSubId = asaasSubscriptionId || getStoredAsaasSubscriptionId(trainerId);
    const storedCtx = getStoredAsaasUpgradeContext(trainerId);
    let lastPendingMessage = 'Pagamento ainda pendente no Asaas.';
    let lastApiError: string | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      let response: Response;
      try {
        response = await fetch(apiUrl('/api/asaas/sync-payment'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trainerId, asaasSubscriptionId: storedSubId }),
        });
      } catch (err) {
        lastApiError = formatApiNetworkError(err);
        if (attempt < retries - 1) {
          await delay(delayMs);
          continue;
        }
        break;
      }

      if (!response.ok) {
        let errMsg = 'Falha ao sincronizar pagamento.';
        try {
          const errData = await response.json();
          errMsg = errData.details || errData.error || errMsg;
        } catch {
          // noop
        }
        lastApiError = errMsg;
        if (attempt < retries - 1 && response.status >= 500) {
          await delay(delayMs);
          continue;
        }
        break;
      }

      const serverResult = await response.json();

      if (serverResult.synced) {
        clearStoredAsaasUpgradeContext(trainerId);
        notifySubscriptionRefresh();
        return serverResult;
      }

      const check = serverResult.check;
      if (check?.paid) {
        try {
          return await applyCheckLocally({
            ...check,
            planSlug: check.planSlug || storedCtx?.planSlug,
          });
        } catch (applyErr) {
          lastApiError =
            applyErr instanceof Error ? applyErr.message : 'Falha ao ativar plano localmente.';
          break;
        }
      }

      lastPendingMessage =
        check?.message || serverResult.message || lastPendingMessage;

      if (attempt < retries - 1) {
        await delay(delayMs);
        continue;
      }
    }

    if (storedCtx?.asaasSubscriptionId || storedSubId) {
      try {
        return await this.applyStoredUpgradeAfterPayment(trainerId);
      } catch (fallbackErr) {
        const fallbackMsg =
          fallbackErr instanceof Error ? fallbackErr.message : 'Falha ao ativar plano.';
        throw new Error(lastApiError ? `${lastApiError} — ${fallbackMsg}` : fallbackMsg);
      }
    }

    if (lastApiError) {
      throw new Error(lastApiError);
    }

    return {
      synced: false,
      status: 'pending' as const,
      message: lastPendingMessage,
    };
  },

  /**
   * Consulta assinatura Asaas do personal no backend.
   */
  async getAsaasSubscription(trainerId: string) {
    const response = await fetch(apiUrl(`/api/asaas/subscription/${trainerId}`));
    if (!response.ok) {
      return null;
    }
    return response.json();
  },

  /** @deprecated Use startAsaasUpgrade — mantido por compatibilidade. */
  async createMercadoPagoCheckout(
    trainerIdOrOption: string | AsaasUpgradeInput,
    planSlug?: UpgradePlanSlug,
    email?: string,
    fullName?: string
  ): Promise<CheckoutPreference> {
    let input: AsaasUpgradeInput;

    if (typeof trainerIdOrOption === 'object' && trainerIdOrOption !== null) {
      input = trainerIdOrOption;
    } else {
      input = {
        userId: String(trainerIdOrOption),
        planSlug: planSlug || 'pro',
        email: email || '',
        name: fullName || '',
      };
    }

    const result = await this.startAsaasUpgrade(input);
    return {
      preferenceId: result.asaasSubscriptionId || result.subscriptionId || 'asaas',
      initPoint: result.paymentUrl || '#',
      planName: result.planName,
      price: result.price,
    };
  },

  /** @deprecated Webhook simulado do Mercado Pago — não usar em produção com Asaas. */
  async triggerSimulatedApprovedWebhook(
    trainerId: string,
    preferenceId: string,
    amount: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'payment.created',
          data: { id: `mp_payment_${Math.random().toString(36).substring(2, 11)}` },
          external_reference: trainerId,
          preference_id: preferenceId,
          transaction_amount: amount,
          status: 'approved',
        }),
      });

      if (!response.ok) {
        throw new Error('Webhook simulator endpoint returned status ' + response.status);
      }

      return await response.json();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro de rede';
      console.error('Trigger webhook failed:', e);
      return { success: false, message: msg };
    }
  },
};
