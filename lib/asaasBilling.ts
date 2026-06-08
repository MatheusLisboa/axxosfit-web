import type { SupabaseClient } from '@supabase/supabase-js';
import { activateTrainerSubscription, isAsaasPaymentPaid } from './asaasWebhook';
import { getPlanPrice, normalizePlanSlug } from './plans';

function getAsaasApiKey(): string {
  return (process.env.ASAAS_API_KEY || '').trim();
}

function getAsaasBaseUrl(): string {
  return (process.env.ASAAS_BASE_URL || 'https://api-sandbox.asaas.com/v3')
    .split('#')[0]
    .trim()
    .replace(/\/$/, '');
}


export function sanitizeCpfCnpj(value?: string | null): string | null {
  if (!value) return null;
  const digits = String(value).replace(/\D/g, '');
  if (digits.length === 11 || digits.length === 14) return digits;
  return null;
}

export function getAppUrl(): string {
  return (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

/** Asaas só aceita callback HTTPS público (rejeita localhost). */
export function isValidAsaasCallbackUrl(url?: string | null): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    return host !== 'localhost' && host !== '127.0.0.1' && !host.endsWith('.local');
  } catch {
    return false;
  }
}

/** Prioriza APP_URL (produção); ignora localhost enviado pelo client em dev. */
export function resolveAsaasCallbackUrl(clientReturnUrl?: string): string | null {
  const candidates = [
    clientReturnUrl,
    `${getAppUrl()}/?asaas_payment=success`,
  ];

  for (const raw of candidates) {
    if (isValidAsaasCallbackUrl(raw)) {
      return String(raw).split('#')[0];
    }
  }

  return null;
}

export function formatAsaasDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** externalReference Asaas: `{trainerId}_{planId}` — planId pode conter underscores. */
export function parseAsaasExternalReference(ref: string): {
  trainerId: string;
  planId?: string;
} {
  const trimmed = String(ref || '').trim();
  const idx = trimmed.indexOf('_');
  if (idx <= 0) return { trainerId: trimmed };
  return {
    trainerId: trimmed.slice(0, idx),
    planId: trimmed.slice(idx + 1) || undefined,
  };
}

export async function asaasFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${getAsaasBaseUrl()}${endpoint}`;
  const headers = {
    access_token: getAsaasApiKey(),
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `Asaas API Error (${response.status}): ${data.errors?.[0]?.description || data.errors?.[0]?.detail || data.message || 'Unknown error'}`
    );
  }

  return data;
}

async function resolvePlanRecord(supabaseAdmin: SupabaseClient | null, planSlug: string) {
  const slug = normalizePlanSlug(planSlug);
  const canonicalPrice = getPlanPrice(slug);

  if (!supabaseAdmin) {
    return {
      id: `local_${slug}`,
      name: slug.charAt(0).toUpperCase() + slug.slice(1),
      slug,
      price: canonicalPrice,
    };
  }

  const { data: plan } = await supabaseAdmin
    .from('plans')
    .select('id, name, slug, price')
    .eq('slug', slug)
    .maybeSingle();

  if (plan) {
    return { ...plan, price: canonicalPrice };
  }

  return {
    id: `local_${slug}`,
    name: slug.charAt(0).toUpperCase() + slug.slice(1),
    slug,
    price: canonicalPrice,
  };
}

async function ensureAsaasCustomerForTrainer(
  supabaseAdmin: SupabaseClient | null,
  trainerId: string,
  profile: { name: string; email: string; phone?: string | null; cpf?: string | null },
  providedCustomerId?: string
): Promise<string> {
  const cpfCnpj = sanitizeCpfCnpj(profile.cpf);
  const canWriteDb = usesServiceRole();

  if (providedCustomerId && getAsaasApiKey()) {
    return providedCustomerId;
  }

  let trainerRow: { asaas_customer_id?: string | null; cpf?: string | null } | null = null;
  if (supabaseAdmin) {
    const { data } = await supabaseAdmin
      .from('trainers')
      .select('asaas_customer_id, cpf')
      .eq('id', trainerId)
      .maybeSingle();
    trainerRow = data;
  }

  const resolvedCpf = cpfCnpj || sanitizeCpfCnpj(trainerRow?.cpf);

  if (trainerRow?.asaas_customer_id) {
    if (resolvedCpf && getAsaasApiKey()) {
      try {
        await asaasFetch(`/customers/${trainerRow.asaas_customer_id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: profile.name,
            email: profile.email,
            phone: profile.phone || undefined,
            cpfCnpj: resolvedCpf,
          }),
        });
      } catch (err) {
        console.warn('⚠️ Não foi possível atualizar CPF do cliente Asaas:', err);
      }
    }
    return trainerRow.asaas_customer_id;
  }

  if (!getAsaasApiKey()) {
    return `sim_cus_${trainerId.slice(0, 8)}`;
  }

  if (!resolvedCpf) {
    throw new Error(
      'CPF obrigatório para pagamento no Asaas. Cadastre seu CPF no perfil antes de fazer upgrade.'
    );
  }

  const asaasCustomer = await asaasFetch('/customers', {
    method: 'POST',
    body: JSON.stringify({
      name: profile.name,
      email: profile.email,
      phone: profile.phone || undefined,
      cpfCnpj: resolvedCpf,
      notificationDisabled: false,
    }),
  });

  if (canWriteDb && supabaseAdmin) {
    try {
      await supabaseAdmin
        .from('trainers')
        .update({ asaas_customer_id: asaasCustomer.id })
        .eq('id', trainerId);
    } catch (err) {
      console.warn('⚠️ Cliente Asaas criado, mas falhou ao salvar asaas_customer_id:', err);
    }
  }

  return asaasCustomer.id;
}

async function fetchAsaasPaymentUrl(asaasSubscriptionId: string): Promise<string | null> {
  if (!getAsaasApiKey() || asaasSubscriptionId.startsWith('sim_')) {
    return null;
  }

  try {
    const payments = await asaasFetch(
      `/payments?subscription=${asaasSubscriptionId}&status=PENDING&limit=1`
    );
    const payment = payments?.data?.[0];
    return (
      payment?.invoiceUrl ||
      payment?.bankSlipUrl ||
      payment?.transactionReceiptUrl ||
      null
    );
  } catch (err) {
    console.warn('⚠️ Não foi possível obter link de pagamento Asaas:', err);
    return null;
  }
}

async function upsertTrainerSubscription(
  supabaseAdmin: SupabaseClient | null,
  params: {
    trainerId: string;
    planId: string;
    asaasSubscriptionId: string;
    value: number;
  }
) {
  const nextDueDate = new Date();
  nextDueDate.setMonth(nextDueDate.getMonth() + 1);

  if (!supabaseAdmin) return { id: 'local_sub' };

  const { data: existingSub } = await supabaseAdmin
    .from('subscriptions')
    .select('id')
    .eq('trainer_id', params.trainerId)
    .maybeSingle();

  const payload = {
    plan_id: params.planId,
    status: 'pending',
    payment_provider: 'asaas',
    asaas_subscription_id: params.asaasSubscriptionId,
    payment_reference: params.asaasSubscriptionId,
    started_at: new Date().toISOString(),
    expires_at: nextDueDate.toISOString(),
    next_due_date: nextDueDate.toISOString(),
  };

  if (existingSub?.id) {
    const { data: updatedSub, error } = await supabaseAdmin
      .from('subscriptions')
      .update(payload)
      .eq('trainer_id', params.trainerId)
      .select('id')
      .single();
    if (error) throw error;
    return { id: updatedSub?.id || existingSub.id };
  }

  const { data: newSub, error } = await supabaseAdmin
    .from('subscriptions')
    .insert({
      trainer_id: params.trainerId,
      ...payload,
    })
    .select('id')
    .single();

  if (error) throw error;
  return { id: newSub?.id || '' };
}

export interface AsaasUpgradeRequest {
  trainerId: string;
  planSlug: string;
  email?: string;
  name?: string;
  phone?: string;
  cpf?: string;
  billingType?: 'PIX' | 'CREDIT_CARD' | 'BOLETO' | 'UNDEFINED';
  /** Enviado pelo client quando não há service role no servidor */
  asaasCustomerId?: string;
  /** URL de retorno após pagamento (prioridade sobre APP_URL) */
  returnUrl?: string;
}

export async function processAsaasUpgrade(
  supabaseAdmin: SupabaseClient | null,
  input: AsaasUpgradeRequest
) {
  const {
    trainerId,
    planSlug,
    email,
    name,
    phone,
    cpf,
    billingType = 'UNDEFINED',
    asaasCustomerId,
    returnUrl,
  } = input;

  if (!trainerId || !planSlug) {
    throw new Error('trainerId e planSlug são obrigatórios');
  }

  const plan = await resolvePlanRecord(supabaseAdmin, planSlug);
  const profileName = name || 'Personal Trainer';
  const profileEmail = (email || 'trainer@example.com').trim().toLowerCase();

  let profileCpf = cpf;
  if (!profileCpf && supabaseAdmin) {
    const { data: trainerRow } = await supabaseAdmin
      .from('trainers')
      .select('cpf')
      .eq('id', trainerId)
      .maybeSingle();
    profileCpf = trainerRow?.cpf || undefined;
  }

  const resolvedCpf = sanitizeCpfCnpj(profileCpf);
  if (getAsaasApiKey() && !resolvedCpf) {
    throw new Error(
      'CPF obrigatório para pagamento no Asaas. Cadastre seu CPF no perfil antes de fazer upgrade.'
    );
  }

  if (!getAsaasApiKey()) {
    const simSubId = `sim_sub_${Math.random().toString(36).slice(2, 10)}`;
    if (supabaseAdmin && usesServiceRole()) {
      try {
        await upsertTrainerSubscription(supabaseAdmin, {
          trainerId,
          planId: plan.id,
          asaasSubscriptionId: simSubId,
          value: Number(plan.price),
        });
      } catch (dbErr) {
        console.warn('⚠️ Modo simulado: falha ao salvar subscription no Supabase:', dbErr);
      }
    }

    return {
      success: true,
      status: 'simulated' as const,
      paymentUrl: `${getAppUrl()}/?asaas_simulated=1`,
      subscriptionId: simSubId,
      asaasSubscriptionId: simSubId,
      asaasCustomerId: asaasCustomerId || null,
      planId: plan.id,
      planSlug: normalizePlanSlug(planSlug),
      planName: plan.name,
      price: Number(plan.price),
      requiresClientSave: !usesServiceRole(),
      message: 'Modo simulado — configure ASAAS_API_KEY para cobrança real.',
    };
  }

  const customerId = await ensureAsaasCustomerForTrainer(
    supabaseAdmin,
    trainerId,
    {
      name: profileName,
      email: profileEmail,
      phone,
      cpf: profileCpf,
    },
    asaasCustomerId
  );

  const nextDueDate = new Date();
  nextDueDate.setDate(nextDueDate.getDate() + 1);
  const successReturnUrl = resolveAsaasCallbackUrl(returnUrl);

  const asaasSubscription = await asaasFetch('/subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      customer: customerId,
      billingType,
      value: Number(plan.price),
      nextDueDate: formatAsaasDate(nextDueDate),
      cycle: 'MONTHLY',
      description: `AxxosFit - Plano ${plan.name}`,
      externalReference: `${trainerId}_${plan.id}`,
      ...(successReturnUrl
        ? {
            callback: {
              successUrl: successReturnUrl,
              autoRedirect: true,
            },
          }
        : {}),
    }),
  });

  let subscriptionId = '';
  if (supabaseAdmin && usesServiceRole()) {
    try {
      const subRecord = await upsertTrainerSubscription(supabaseAdmin, {
        trainerId,
        planId: plan.id,
        asaasSubscriptionId: asaasSubscription.id,
        value: Number(plan.price),
      });
      subscriptionId = subRecord.id;
    } catch (dbErr) {
      console.warn('⚠️ Assinatura Asaas criada, mas falhou ao salvar no Supabase:', dbErr);
    }
  }

  const paymentUrl = await fetchAsaasPaymentUrl(asaasSubscription.id);

  return {
    success: true,
    status: 'pending' as const,
    paymentUrl,
    subscriptionId,
    asaasSubscriptionId: asaasSubscription.id,
    asaasCustomerId: customerId,
    planId: plan.id,
    planSlug: normalizePlanSlug(planSlug),
    planName: plan.name,
    price: Number(plan.price),
    requiresClientSave: !usesServiceRole(),
    message: paymentUrl
      ? undefined
      : 'Assinatura criada no Asaas. Acesse sua conta Asaas para concluir o pagamento.',
  };
}

export interface AsaasSyncPaymentRequest {
  trainerId: string;
  asaasSubscriptionId?: string;
}

export interface AsaasPaymentCheckResult {
  paid: boolean;
  status: 'active' | 'pending';
  trainerId: string;
  planId?: string;
  asaasSubscriptionId?: string;
  asaasPaymentId?: string;
  amount?: number;
  message?: string;
}

async function resolveAsaasSubscriptionId(
  supabaseAdmin: SupabaseClient | null,
  trainerId: string,
  providedSubId?: string
): Promise<string | undefined> {
  if (providedSubId && !providedSubId.startsWith('sim_')) {
    return providedSubId;
  }

  if (!supabaseAdmin) return undefined;

  const { data: subRow } = await supabaseAdmin
    .from('subscriptions')
    .select('asaas_subscription_id')
    .eq('trainer_id', trainerId)
    .maybeSingle();

  if (subRow?.asaas_subscription_id) {
    return subRow.asaas_subscription_id;
  }

  const { data: trainer } = await supabaseAdmin
    .from('trainers')
    .select('asaas_customer_id')
    .eq('id', trainerId)
    .maybeSingle();

  if (trainer?.asaas_customer_id && getAsaasApiKey()) {
    const subs = await asaasFetch(
      `/subscriptions?customer=${trainer.asaas_customer_id}&limit=20`
    );
    const activeSub = (subs?.data || []).find(
      (s: { status?: string; id?: string }) =>
        s.status === 'ACTIVE' && s.id && !String(s.id).startsWith('sim_')
    );
    if (activeSub?.id) return activeSub.id as string;
  }

  return undefined;
}

/** Consulta apenas o Asaas (sem gravar no banco). */
export async function checkAsaasPaymentForTrainer(
  supabaseAdmin: SupabaseClient | null,
  input: AsaasSyncPaymentRequest
): Promise<AsaasPaymentCheckResult> {
  const { trainerId, asaasSubscriptionId: providedSubId } = input;

  if (!trainerId) {
    throw new Error('trainerId é obrigatório');
  }

  if (!getAsaasApiKey()) {
    throw new Error('ASAAS_API_KEY não configurada');
  }

  const asaasSubId = await resolveAsaasSubscriptionId(
    supabaseAdmin,
    trainerId,
    providedSubId
  );

  if (!asaasSubId) {
    throw new Error('Assinatura Asaas não encontrada. Inicie o upgrade novamente.');
  }

  const payments = await asaasFetch(`/payments?subscription=${asaasSubId}&limit=20`);
  const paidPayment = (payments?.data || []).find((p: { status?: string }) =>
    isAsaasPaymentPaid(p.status)
  );

  if (!paidPayment) {
    return {
      paid: false,
      status: 'pending',
      trainerId,
      asaasSubscriptionId: asaasSubId,
      message: 'Pagamento ainda não confirmado no Asaas.',
    };
  }

  const externalRef = String(paidPayment.externalReference || '');
  const { trainerId: refTrainerId, planId } = parseAsaasExternalReference(externalRef);

  return {
    paid: true,
    status: 'active',
    trainerId: refTrainerId || trainerId,
    planId: planId || undefined,
    asaasSubscriptionId: asaasSubId,
    asaasPaymentId: paidPayment.id as string,
    amount: Number(paidPayment.value || 0),
    message: 'Pagamento confirmado no Asaas.',
  };
}

function usesServiceRole(): boolean {
  return !!(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
}

async function activatePaidSubscription(
  supabaseAdmin: SupabaseClient,
  check: AsaasPaymentCheckResult
) {
  const nextDueDate = new Date();
  nextDueDate.setMonth(nextDueDate.getMonth() + 1);

  let planId = check.planId;
  if (!planId) {
    const { data: subRow } = await supabaseAdmin
      .from('subscriptions')
      .select('plan_id')
      .eq('trainer_id', check.trainerId)
      .maybeSingle();
    planId = subRow?.plan_id ?? undefined;
  }

  const payload: Record<string, unknown> = {
    status: 'active',
    payment_provider: 'asaas',
    asaas_subscription_id: check.asaasSubscriptionId,
    payment_reference: check.asaasPaymentId || check.asaasSubscriptionId,
    expires_at: nextDueDate.toISOString(),
    next_due_date: nextDueDate.toISOString().split('T')[0],
    started_at: new Date().toISOString(),
  };
  if (planId) payload.plan_id = planId;

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update(payload)
    .eq('trainer_id', check.trainerId);

  if (error) throw error;

  await activateTrainerSubscription(
    supabaseAdmin,
    check.trainerId,
    check.amount || 0,
    check.asaasPaymentId
  );
}

export async function syncAsaasPaymentForTrainer(
  supabaseAdmin: SupabaseClient | null,
  input: AsaasSyncPaymentRequest
) {
  const check = await checkAsaasPaymentForTrainer(supabaseAdmin, input);

  if (!check.paid) {
    return {
      synced: false,
      status: check.status,
      message: check.message,
      requiresClientApply: true,
      check,
    };
  }

  if (!supabaseAdmin || !usesServiceRole()) {
    return {
      synced: false,
      status: 'active' as const,
      message: check.message,
      requiresClientApply: true,
      check,
    };
  }

  try {
    await activatePaidSubscription(supabaseAdmin, check);
  } catch (dbErr) {
    console.warn('⚠️ Sync server: falha ao ativar subscription:', dbErr);
    return {
      synced: false,
      status: 'active' as const,
      requiresClientApply: true,
      check,
      message: 'Pagamento confirmado no Asaas. Aplicando no app…',
    };
  }

  return {
    synced: true,
    status: 'active' as const,
    message: 'Pagamento sincronizado com sucesso.',
    paymentId: check.asaasPaymentId,
    requiresClientApply: false,
    check,
  };
}
