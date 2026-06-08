import type { SupabaseClient } from '@supabase/supabase-js';

const PAID_STATUSES = new Set(['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH']);

export function isAsaasPaymentPaid(status?: string | null): boolean {
  return !!status && PAID_STATUSES.has(status);
}

async function resolveTrainerFromAsaasPayment(
  supabaseAdmin: SupabaseClient,
  pay: Record<string, unknown>,
  subscription?: Record<string, unknown>
): Promise<{ trainerId: string; subscriptionRow: { id: string; trainer_id: string } | null } | null> {
  const asaasSubId = pay?.subscription as string | undefined;
  if (!asaasSubId) return null;

  const { data: subscriptionRow } = await supabaseAdmin
    .from('subscriptions')
    .select('id, trainer_id')
    .eq('asaas_subscription_id', asaasSubId)
    .maybeSingle();

  if (subscriptionRow?.trainer_id) {
    return { trainerId: subscriptionRow.trainer_id, subscriptionRow };
  }

  const externalRef =
    (pay?.externalReference as string | undefined) ||
    (subscription?.externalReference as string | undefined);
  if (externalRef) {
    const idx = String(externalRef).indexOf('_');
    const trainerId = idx > 0 ? String(externalRef).slice(0, idx) : String(externalRef);
    if (trainerId) return { trainerId, subscriptionRow: null };
  }

  return null;
}

export async function activateTrainerSubscription(
  supabaseAdmin: SupabaseClient,
  trainerId: string,
  amount: number,
  paymentId?: string
) {
  const nextDueDate = new Date();
  nextDueDate.setMonth(nextDueDate.getMonth() + 1);

  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'active',
      expires_at: nextDueDate.toISOString(),
      next_due_date: nextDueDate.toISOString(),
    })
    .eq('trainer_id', trainerId);

  const { data: subscriptionRow } = await supabaseAdmin
    .from('subscriptions')
    .select('id')
    .eq('trainer_id', trainerId)
    .maybeSingle();

  if (paymentId) {
    const { data: existingPayment } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('provider_reference', paymentId)
      .maybeSingle();

    if (!existingPayment) {
      await supabaseAdmin.from('payments').insert({
        trainer_id: trainerId,
        subscription_id: subscriptionRow?.id,
        amount,
        status: 'paid',
        provider: 'asaas',
        provider_reference: paymentId,
      });
    }
  }

  await supabaseAdmin.from('notifications').insert({
    trainer_id: trainerId,
    title: '🎉 Pagamento Confirmado!',
    message: `Seu pagamento de R$ ${amount.toFixed(2)} foi confirmado. Plano liberado!`,
    read: false,
  });
}

export async function processAsaasWebhook(
  supabaseAdmin: SupabaseClient | null,
  body: Record<string, unknown>
) {
  if (!supabaseAdmin) {
    return { success: true, message: 'Simulado sem Supabase ativo.' };
  }

  const event = body.event as string | undefined;
  const payment = (body.payment || (body.data as Record<string, unknown>)?.payment || body.data) as
    | Record<string, unknown>
    | undefined;
  const subscription = body.subscription as Record<string, unknown> | undefined;

  const eventHandlers: Record<string, () => Promise<void>> = {
    PAYMENT_RECEIVED: async () => {
      if (!payment) return;
      const resolved = await resolveTrainerFromAsaasPayment(supabaseAdmin, payment, subscription);
      if (!resolved) {
        console.warn('⚠️ Não foi possível resolver trainer no webhook PAYMENT_RECEIVED');
        return;
      }
      await activateTrainerSubscription(
        supabaseAdmin,
        resolved.trainerId,
        Number(payment.value || 0),
        payment.id as string | undefined
      );
    },

    PAYMENT_CONFIRMED: async () => {
      if (!payment) return;
      const resolved = await resolveTrainerFromAsaasPayment(supabaseAdmin, payment, subscription);
      if (!resolved) return;

      await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'active' })
        .eq('trainer_id', resolved.trainerId);

      if (payment.id) {
        const { data: existingPayment } = await supabaseAdmin
          .from('payments')
          .select('id')
          .eq('provider_reference', payment.id)
          .maybeSingle();

        if (!existingPayment) {
          const { data: subscriptionRow } = await supabaseAdmin
            .from('subscriptions')
            .select('id')
            .eq('trainer_id', resolved.trainerId)
            .maybeSingle();

          await supabaseAdmin.from('payments').insert({
            trainer_id: resolved.trainerId,
            subscription_id: subscriptionRow?.id,
            amount: Number(payment.value || 0),
            status: 'paid',
            provider: 'asaas',
            provider_reference: payment.id,
          });
        }
      }
    },

    PAYMENT_OVERDUE: async () => {
      if (!payment) return;
      const resolved = await resolveTrainerFromAsaasPayment(supabaseAdmin, payment, subscription);
      if (!resolved) return;

      await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'past_due' })
        .eq('trainer_id', resolved.trainerId);

      await supabaseAdmin.from('notifications').insert({
        trainer_id: resolved.trainerId,
        title: '⚠️ Pagamento Vencido',
        message: 'Seu pagamento está vencido. Atualize o método de pagamento no Asaas.',
        read: false,
      });
    },

    SUBSCRIPTION_DELETED: async () => {
      const subData = subscription || (body.data as Record<string, unknown>);
      const externalRef = subData?.externalReference as string | undefined;
      if (!externalRef) return;
      const [trainerId] = String(externalRef).split('_');

      await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('trainer_id', trainerId);
    },

    PAYMENT_DELETED: async () => {
      if (!payment?.id) return;
      await supabaseAdmin
        .from('payments')
        .update({ status: 'failed' })
        .eq('provider_reference', payment.id);
    },
  };

  if (event && eventHandlers[event]) {
    await eventHandlers[event]();
  } else {
    console.log(`ℹ️ Evento Asaas ${event} ignorado ou não implementado`);
  }

  return { success: true, message: 'Webhook processado com sucesso' };
}
