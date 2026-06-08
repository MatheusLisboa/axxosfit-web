import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { normalizePlanSlug } from '../lib/plans';
import { SubscriptionService } from './subscription';

export interface AsaasPaymentCheckPayload {
  paid: boolean;
  status: 'active' | 'pending';
  trainerId: string;
  planId?: string;
  planSlug?: string;
  asaasSubscriptionId?: string;
  asaasPaymentId?: string;
  amount?: number;
  message?: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolvePlanIdForApply(
  planId?: string,
  planSlug?: string
): Promise<string | undefined> {
  if (planId && UUID_RE.test(planId)) {
    return planId;
  }

  const slugFromLocal =
    planId?.startsWith('local_') ? planId.slice('local_'.length) : undefined;
  const slug = slugFromLocal || (planSlug ? normalizePlanSlug(planSlug) : undefined);

  if (slug) {
    const resolved = await SubscriptionService.resolvePlanId(slug);
    if (resolved) return resolved;
  }

  return undefined;
}

export async function applyAsaasPaymentLocally(check: AsaasPaymentCheckPayload) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase não configurado.');
  }

  if (!check.paid || !check.trainerId) {
    throw new Error('Pagamento não confirmado no Asaas.');
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    throw new Error('Sessão expirada. Faça login novamente e clique em Verificar pagamento.');
  }

  if (session.user.id !== check.trainerId) {
    throw new Error(
      'A conta logada não corresponde ao pagamento. Entre com o mesmo e-mail usado no checkout.'
    );
  }

  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id, plan_id, asaas_subscription_id')
    .eq('trainer_id', check.trainerId)
    .maybeSingle();

  const nextDueDate = new Date();
  nextDueDate.setMonth(nextDueDate.getMonth() + 1);
  const nextDueIso = nextDueDate.toISOString();
  const nextDueDateOnly = nextDueIso.split('T')[0];

  const resolvedPlanId =
    (await resolvePlanIdForApply(check.planId, check.planSlug)) || existingSub?.plan_id;
  const resolvedAsaasSubId =
    check.asaasSubscriptionId || existingSub?.asaas_subscription_id;

  const updatePayload: Record<string, unknown> = {
    status: 'active',
    payment_provider: 'asaas',
    asaas_subscription_id: resolvedAsaasSubId,
    payment_reference: check.asaasPaymentId || resolvedAsaasSubId,
    expires_at: nextDueIso,
    next_due_date: nextDueDateOnly,
    started_at: new Date().toISOString(),
  };

  if (resolvedPlanId) {
    updatePayload.plan_id = resolvedPlanId;
  }

  let subscriptionId: string;

  if (!existingSub?.id) {
    if (!resolvedPlanId) {
      throw new Error('Plano não identificado. Tente iniciar o upgrade novamente.');
    }

    const { data: inserted, error: insertErr } = await supabase
      .from('subscriptions')
      .insert({
        trainer_id: check.trainerId,
        plan_id: resolvedPlanId,
        ...updatePayload,
      })
      .select('id')
      .maybeSingle();

    if (insertErr || !inserted?.id) {
      throw new Error(
        insertErr?.message ||
          'Não foi possível criar sua assinatura. Configure SUPABASE_SERVICE_ROLE_KEY no servidor ou contate o suporte.'
      );
    }

    subscriptionId = inserted.id;
  } else {
    const { data: updatedRows, error: subError } = await supabase
      .from('subscriptions')
      .update(updatePayload)
      .eq('trainer_id', check.trainerId)
      .select('id');

    if (subError) {
      throw new Error(`Falha ao ativar plano: ${subError.message}`);
    }

    if (!updatedRows?.length) {
      throw new Error(
        'Não foi possível atualizar sua assinatura. Faça login novamente ou configure a service role no backend.'
      );
    }

    subscriptionId = updatedRows[0].id;
  }

  if (check.asaasPaymentId) {
    const { data: existing } = await supabase
      .from('payments')
      .select('id')
      .eq('provider_reference', check.asaasPaymentId)
      .maybeSingle();

    if (!existing) {
      const { error: payError } = await supabase.from('payments').insert({
        trainer_id: check.trainerId,
        subscription_id: subscriptionId,
        amount: check.amount || 0,
        status: 'paid',
        provider: 'asaas',
        provider_reference: check.asaasPaymentId,
      });

      if (payError) {
        console.warn('Pagamento Asaas registrado no plano, mas falhou log em payments:', payError.message);
      }
    }
  }

  return {
    synced: true,
    status: 'active' as const,
    message: 'Plano ativado com sucesso.',
    subscriptionId,
  };
}

export function notifySubscriptionRefresh() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('axosfit:subscription-refresh'));
  }
}
