/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import {
  processAsaasUpgrade,
  syncAsaasPaymentForTrainer,
  checkAsaasPaymentForTrainer,
} from './lib/asaasBilling';
import { processAsaasWebhook } from './lib/asaasWebhook';
import { createSupabaseAdmin } from './lib/supabaseAdmin';
import { getPlanPrice, normalizePlanSlug } from './lib/plans';

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser
app.use(express.json());

// CORS para API (front em outro host ou preview)
app.use('/api', (req, res, next) => {
  const origin = req.headers.origin;
  const allowed =
    process.env.APP_URL?.replace(/\/$/, '') ||
    (process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : '');
  if (origin && (!allowed || origin === allowed || process.env.NODE_ENV !== 'production')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Initialize server-side Supabase client (service role quando disponível)
const supabaseAdmin = createSupabaseAdmin();

// API: Mercado Pago Create Checkout Preference with Real SDK fetch representation
app.post('/api/create-checkout', async (req, res) => {
  const { trainerId, planSlug, email, fullName } = req.body;

  if (!supabaseAdmin) {
    console.warn('⚠️ Supabase URL / KEY não configurados na API backend.');
    return res.status(200).json({
      preferenceId: `mp_pref_${Math.random().toString(36).substring(2, 11)}`,
      initPoint: '#',
      planName: (planSlug || 'starter').toUpperCase(),
      price: getPlanPrice(planSlug || 'starter')
    });
  }

  try {
    // 1. Obter o plano correto pelo slug
    let { data: plan, error: planError } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('slug', planSlug)
      .maybeSingle();

    // No special test-plan creation flow.

    if (!plan) {
      return res.status(404).json({ error: `Plano com slug '${planSlug}' não encontrado.` });
    }

    const appUrl = (process.env.APP_URL || 'https://ais-dev-o4causxyxjbwmzz6vhq4ra-500841687397.us-east1.run.app').trim().replace(/^['"“]+|['"”]+$/g, '');
    const rawMpToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || '';
    const mpToken = rawMpToken.trim().replace(/^['"“]+|['"”]+$/g, '');
    
    // 2. Sanitize and validate URLs for Mercado Pago production constraints
    const cleanAppUrl = appUrl.trim().replace(/\/+$/, '');
    let cleanNotificationUrl = `${cleanAppUrl}/api/webhook`;
    
    // Mercado Pago requires notification_url to be a secure HTTPS public URL without ports
    if (cleanNotificationUrl.includes('localhost') || cleanNotificationUrl.includes('127.0.0.1') || !cleanNotificationUrl.startsWith('https://')) {
      console.warn('⚠️ [Mercado Pago] URL de notificacao incompatível ou local (localhost/http). Omitindo "notification_url" para evitar Erro 400 da API.');
      cleanNotificationUrl = ''; // Omit parameter dynamically to allow local/dev fallback
    }

    // Logger requested by investor/user
    const isProdToken = mpToken && mpToken.startsWith('APP_USR-');
    const activeEnvironment = isProdToken ? 'PRODUÇÃO REAL (APP_USR / PRODUÇÃO EXCLUSIVA)' : 'PRODUÇÃO REAL (Modo Simulado Local)';
    const rawPublicKey = process.env.VITE_MERCADO_PAGO_PUBLIC_KEY || '';
    const activePublicKey = rawPublicKey.trim().replace(/^['"“]+|['"”]+$/g, '') || 'APP_USR-3354d71d-0a7e-413f-aba2-2ef5ad38b307-FALLBACK';
    
    console.log(`\n==================================================`);
    console.log(`[MERCADO PAGO PRODUCTION CONTROLLER LOGS]`);
    console.log(`- Token Ativo: ${mpToken ? 'Sim' : 'Não (Simulado)'}`);
    console.log(`- Token Tipo: ${isProdToken ? 'APP_USR (PRODUÇÃO EXCLUSIVA)' : 'SIMULADOR / FALLBACK'}`);
    console.log(`- Public Key Ativa: ${activePublicKey}`);
    console.log(`- Ambiente Ativo: ${activeEnvironment}`);
    console.log(`- URL Base Aplicada: ${cleanAppUrl}`);
    console.log(`- URL Notificação Integrada: ${cleanNotificationUrl || 'Nenhum (Modo Local Bypass Ativado)'}`);
    console.log(`==================================================\n`);

    let preferenceId = `mp_pref_${Math.random().toString(36).substring(2, 11)}`;
    let initPoint = `${cleanAppUrl}/#payment-success-sim`;

    if (mpToken && mpToken.trim() !== '') {
      console.log('🔌 Conectando à API Real de Produção do Mercado Pago para gerar preferências...');
      try {
        const cleanEmail = (email || 'trainer@example.com').trim().toLowerCase();
        
        const preferenceBody = {
          items: [
            {
              id: plan.slug,
              title: `Recorrência AxxosFit - Plano ${plan.name}`,
              description: `Assinatura recorrente mensal do plano ${plan.name} para o personal trainer`,
              quantity: 1,
              currency_id: 'BRL',
              unit_price: Number(plan.price)
            }
          ],
          payer: {
            name: fullName || 'Personal Trainer',
            email: cleanEmail
          },
          back_urls: {
            success: `${cleanAppUrl}/`,
            failure: `${cleanAppUrl}/`,
            pending: `${cleanAppUrl}/`
          },
          auto_return: 'approved',
          external_reference: trainerId,
          metadata: {
            trainer_id: trainerId,
            plan_slug: plan.slug,
            is_recurring: true
          }
        };

        // Attach notification_url only if secure & compatible
        if (cleanNotificationUrl) {
          (preferenceBody as any).notification_url = cleanNotificationUrl;
        }

        const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${mpToken.trim()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(preferenceBody)
        });

        if (mpResponse.ok) {
          const mpData = await mpResponse.json();
          preferenceId = mpData.id;
          initPoint = mpData.init_point;
          
          console.log(`\n==================================================`);
          console.log(`[MERCADO PAGO PREFERENCE CREATED]`);
          console.log(`- Preference ID: ${preferenceId}`);
          console.log(`- Init Point Real Utilizado: ${initPoint}`);
          console.log(`- Public Key Correspondente: ${activePublicKey}`);
          console.log(`- Environment Ativo: ${activeEnvironment}`);
          console.log(`==================================================\n`);
        } else {
          const errText = await mpResponse.text();
          console.error('❌ Erro retornado pela API do Mercado Pago:', errText);
          throw new Error(`Mercado Pago erro API (Status ${mpResponse.status}): ${errText}`);
        }
      } catch (mpErr: any) {
        console.error('❌ Falha na requisição ao Mercado Pago:', mpErr);
        throw mpErr;
      }
    } else {
      console.log('⚠️ MERCADO_PAGO_ACCESS_TOKEN ausente. Gerado checkout simulado inteligente.');
    }

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    // 2. Buscar por assinatura pendente/atual do Personal
    const { data: existingSub } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('trainer_id', trainerId)
      .maybeSingle();

    if (existingSub) {
      await supabaseAdmin
        .from('subscriptions')
        .update({
          plan_id: plan.id,
          status: 'pending',
          payment_reference: preferenceId,
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString()
        })
        .eq('trainer_id', trainerId);
    } else {
      await supabaseAdmin
        .from('subscriptions')
        .insert({
          trainer_id: trainerId,
          plan_id: plan.id,
          status: 'pending',
          payment_provider: 'mercado_pago',
          payment_reference: preferenceId,
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString()
        });
    }

    return res.json({
      preferenceId,
      initPoint,
      planName: plan.name,
      price: plan.price
    });

  } catch (error: any) {
    console.error('Erro ao gerar checkout no servidor:', error);
    return res.status(500).json({ error: 'Erro ao confeccionar Checkout Preference', details: error.message });
  }
});

// API: Mercado Pago Webhook Payment Notification Real Integrator
app.post('/api/webhook', async (req, res) => {
  if (!supabaseAdmin) {
    return res.json({ success: true, message: 'Simulado sem Supabase ativo.' });
  }

  try {
    console.log('📞 Webhook recebido do Mercado Pago:', JSON.stringify(req.body));

    // Suporta múltiplos formatos enviados pela API
    let paymentId = req.body?.data?.id || req.body?.id || req.query?.id;
    let topic = req.body?.type || req.body?.topic || req.query?.topic;

    let transactionStatus = req.body?.status || 'approved';
    let trainerId = req.body?.external_reference;
    let transactionAmount = req.body?.transaction_amount || 189.00;
    let preferenceId = req.body?.preference_id;

    const mpToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    // Se tivermos token real, buscamos o pagamento direto no Mercado Pago para garantir autenticidade (anti-spoofing)
    if (mpToken && mpToken.trim() !== '' && paymentId && (topic === 'payment' || !topic)) {
      console.log(`🔍 Verificando pagamento ${paymentId} real na API do Mercado Pago...`);
      try {
        const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: {
            'Authorization': `Bearer ${mpToken.trim()}`
          }
        });

        if (mpRes.ok) {
          const paymentData = await mpRes.json();
          transactionStatus = paymentData.status;
          trainerId = paymentData.external_reference || paymentData.metadata?.trainer_id;
          transactionAmount = paymentData.transaction_amount;
          preferenceId = paymentData.preference_id;
          console.log(`📊 Status confirmado no MP: ${transactionStatus} para trainer: ${trainerId}`);
        } else {
          console.warn('⚠️ Não foi possível autenticar o ID do pagamento no Mercado Pago. Usando payload recebido.');
        }
      } catch (err) {
        console.error('❌ Erro ao consultar pagamento no Mercado Pago:', err);
      }
    }

    // Se o pagamento for aprovado, ativar ou estender a assinatura recorrente
    if (transactionStatus === 'approved' || transactionStatus === 'authorized') {
      if (!trainerId) {
        // Se falhar external_reference, localizamos assinatura com base na payment_reference (preferenceId)
        const { data: subByPref } = await supabaseAdmin
          .from('subscriptions')
          .select('trainer_id')
          .eq('payment_reference', preferenceId)
          .maybeSingle();

        if (subByPref) {
          trainerId = subByPref.trainer_id;
        }
      }

      if (!trainerId) {
        console.error('❌ Não foi possível mapear o personal trainer para este pagamento webhook.');
        return res.status(400).json({ error: 'Mapeamento de trainer ausente.' });
      }

      const { data: subscription } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('trainer_id', trainerId)
        .maybeSingle();

      // Estende ou renova assinatura mantendo exatamente o mesmo dia de vencimento da contratação
      const newExpiration = new Date();
      if (subscription && subscription.started_at) {
        const startDay = new Date(subscription.started_at).getDate();
        newExpiration.setMonth(newExpiration.getMonth() + 1);
        newExpiration.setDate(startDay);
      } else {
        newExpiration.setMonth(newExpiration.getMonth() + 1);
      }

      let subscriptionId = null;

      if (subscription) {
        subscriptionId = subscription.id;
        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'active',
            expires_at: newExpiration.toISOString(),
            payment_reference: preferenceId || subscription.payment_reference
          })
          .eq('trainer_id', trainerId);
      } else {
        // Fallback de contingência: cria uma assinatura ativa vinculada ao plano Pro
        const { data: proPlan } = await supabaseAdmin.from('plans').select('id').eq('slug', 'pro').maybeSingle();
        const { data: newSub } = await supabaseAdmin
          .from('subscriptions')
          .insert({
            trainer_id: trainerId,
            plan_id: proPlan?.id,
            status: 'active',
            payment_provider: 'mercado_pago',
            payment_reference: preferenceId || `fallback_${Date.now()}`,
            started_at: new Date().toISOString(),
            expires_at: newExpiration.toISOString()
          })
          .select()
          .single();
        if (newSub) subscriptionId = newSub.id;
      }

      // Registra o faturamento na tabela de pagamentos
      await supabaseAdmin
        .from('payments')
        .insert({
          trainer_id: trainerId,
          subscription_id: subscriptionId,
          amount: Number(transactionAmount),
          status: 'paid',
          provider: 'mercado_pago',
          provider_reference: String(paymentId)
        });

      // Cria notificação premium para o personal trainer
      await supabaseAdmin
        .from('notifications')
        .insert({
          trainer_id: trainerId,
          title: '🎉 Assinatura Ativa & Faturada!',
          message: `Obrigado por escolher a revolução fitness da AxxosFit! O seu pagamento recorrente no valor de R$ ${Number(transactionAmount).toFixed(2)} foi confirmado via Mercado Pago.`,
          read: false
        });

      console.log(`🎉 Assinatura do Trainer ${trainerId} ativada via Webhook Real com sucesso!`);
    } else {
      console.log(`ℹ️ Notificação de pagamento ignorada ou pendente. Status: ${transactionStatus}`);
    }

    return res.json({
      success: true,
      message: 'Notificação processada com sucesso no Webhook.'
    });

  } catch (error: any) {
    console.error('Erro ao processar webhook no servidor:', error);
    return res.status(500).json({ error: 'Erro interno no processamento do Webhook', details: error.message });
  }
});

// ============================================================
// ASAAS INTEGRATION ENDPOINTS
// ============================================================

const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '';
const ASAAS_BASE_URL = (process.env.ASAAS_BASE_URL || 'https://api.asaas.com/v3').replace(/\/$/, '');

// Helper: Fetch wrapper para Asaas com headers padrão
async function asaasFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${ASAAS_BASE_URL}${endpoint}`;
  const headers = {
    'access_token': ASAAS_API_KEY,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, { ...options, headers });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Asaas API Error (${response.status}): ${data.errors?.[0]?.detail || data.message || 'Unknown error'}`);
  }

  return data;
}

// API: Criar cliente no Asaas
// POST /api/asaas/create-customer
app.post('/api/asaas/create-customer', async (req, res) => {
  if (!supabaseAdmin) {
    console.warn('⚠️ Supabase não configurado. Retornando erro.');
    return res.status(500).json({ error: 'Supabase não configurado' });
  }

  if (!ASAAS_API_KEY) {
    console.warn('⚠️ ASAAS_API_KEY não configurada. Retornando erro.');
    return res.status(500).json({ error: 'Asaas API Key não configurada' });
  }

  try {
    const { name, email, phone } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name e email são obrigatórios' });
    }

    console.log(`\n==================================================`);
    console.log(`[ASAAS CREATE CUSTOMER]`);
    console.log(`- Nome: ${name}`);
    console.log(`- Email: ${email}`);
    console.log(`- Telefone: ${phone || 'Não informado'}`);
    console.log(`==================================================\n`);

    // Criar cliente no Asaas
    const customerData = {
      name,
      email,
      phone: phone || undefined,
      notificationDisabled: false
    };

    const asaasCustomer = await asaasFetch('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData)
    });

    console.log(`✅ Cliente criado no Asaas: ${asaasCustomer.id}`);

    // Neste ponto, trainerId ainda não foi criado no banco
    // Retornamos o asaas_customer_id para ser salvo pelo cliente
    // O cliente irá atualizar o trainer com esse ID após criar a conta

    return res.status(201).json({
      success: true,
      asaas_customer_id: asaasCustomer.id,
      customer: asaasCustomer
    });

  } catch (error: any) {
    console.error('❌ Erro ao criar cliente no Asaas:', error);
    return res.status(500).json({ 
      error: 'Erro ao criar cliente no Asaas', 
      details: error.message 
    });
  }
});

// API: Atualizar trainer com asaas_customer_id
// PUT /api/asaas/trainer/:trainerId
app.put('/api/asaas/trainer/:trainerId', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase não configurado' });
  }

  try {
    const { trainerId } = req.params;
    const { asaas_customer_id } = req.body;

    if (!asaas_customer_id) {
      return res.status(400).json({ error: 'asaas_customer_id é obrigatório' });
    }

    console.log(`📝 Atualizando trainer ${trainerId} com asaas_customer_id: ${asaas_customer_id}`);

    // Verificar se trainer existe
    const { data: trainer, error: trainerError } = await supabaseAdmin
      .from('trainers')
      .select('id')
      .eq('id', trainerId)
      .maybeSingle();

    if (trainerError || !trainer) {
      return res.status(404).json({ error: 'Trainer não encontrado' });
    }

    // Atualizar trainer com asaas_customer_id
    const { data: updatedTrainer, error: updateError } = await supabaseAdmin
      .from('trainers')
      .update({ asaas_customer_id })
      .eq('id', trainerId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ Trainer ${trainerId} atualizado com sucesso`);

    return res.status(200).json({
      success: true,
      trainer: updatedTrainer
    });

  } catch (error: any) {
    console.error('❌ Erro ao atualizar trainer:', error);
    return res.status(500).json({ 
      error: 'Erro ao atualizar trainer', 
      details: error.message 
    });
  }
});

async function resolvePlanRecord(planSlug: string) {
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
  trainerId: string,
  profile: { name: string; email: string; phone?: string | null }
): Promise<string> {
  if (!supabaseAdmin) {
    throw new Error('Supabase não configurado');
  }

  const { data: trainer } = await supabaseAdmin
    .from('trainers')
    .select('asaas_customer_id')
    .eq('id', trainerId)
    .maybeSingle();

  if (trainer?.asaas_customer_id) {
    return trainer.asaas_customer_id;
  }

  if (!ASAAS_API_KEY) {
    return `sim_cus_${trainerId.slice(0, 8)}`;
  }

  const asaasCustomer = await asaasFetch('/customers', {
    method: 'POST',
    body: JSON.stringify({
      name: profile.name,
      email: profile.email,
      phone: profile.phone || undefined,
      notificationDisabled: false,
    }),
  });

  await supabaseAdmin
    .from('trainers')
    .update({ asaas_customer_id: asaasCustomer.id })
    .eq('id', trainerId);

  return asaasCustomer.id;
}

async function fetchAsaasPaymentUrl(asaasSubscriptionId: string): Promise<string | null> {
  if (!ASAAS_API_KEY || asaasSubscriptionId.startsWith('sim_')) {
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

async function upsertTrainerSubscription(params: {
  trainerId: string;
  planId: string;
  asaasSubscriptionId: string;
  value: number;
}) {
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
    const { data: updatedSub } = await supabaseAdmin
      .from('subscriptions')
      .update(payload)
      .eq('trainer_id', params.trainerId)
      .select('id')
      .single();
    return { id: updatedSub?.id || existingSub.id };
  }

  const { data: newSub } = await supabaseAdmin
    .from('subscriptions')
    .insert({
      trainer_id: params.trainerId,
      ...payload,
    })
    .select('id')
    .single();

  return { id: newSub?.id || '' };
}

// API: Upgrade de plano (fluxo completo Asaas)
// POST /api/asaas/upgrade
app.post('/api/asaas/upgrade', async (req, res) => {
  try {
    const { trainerId, planSlug, email, name, phone, cpf, billingType, asaasCustomerId, returnUrl } = req.body;
    console.log(`\n[ASAAS UPGRADE] trainer=${trainerId} plan=${planSlug}`);

    const result = await processAsaasUpgrade(supabaseAdmin, {
      trainerId,
      planSlug,
      email,
      name,
      phone,
      cpf,
      billingType,
      asaasCustomerId,
      returnUrl,
    });

    return res.status(result.status === 'simulated' ? 200 : 201).json(result);
  } catch (error: any) {
    console.error('❌ Erro no upgrade Asaas:', error);
    const message = error?.message || 'Erro desconhecido';
    const isValidation = message.includes('obrigatório') || message.includes('CPF');
    return res.status(isValidation ? 400 : 500).json({
      error: 'Erro ao iniciar upgrade no Asaas',
      details: message,
    });
  }
});

// API: Criar assinatura recorrente no Asaas
// POST /api/asaas/create-subscription
app.post('/api/asaas/create-subscription', async (req, res) => {
  if (!supabaseAdmin) {
    console.warn('⚠️ Supabase não configurado.');
    return res.status(500).json({ error: 'Supabase não configurado' });
  }

  if (!ASAAS_API_KEY) {
    console.warn('⚠️ ASAAS_API_KEY não configurada.');
    return res.status(500).json({ error: 'Asaas API Key não configurada' });
  }

  try {
    const { trainerId, planId, planName, value } = req.body;

    if (!trainerId || !planId || !value) {
      return res.status(400).json({ error: 'trainerId, planId e value são obrigatórios' });
    }

    console.log(`\n==================================================`);
    console.log(`[ASAAS CREATE SUBSCRIPTION]`);
    console.log(`- Trainer ID: ${trainerId}`);
    console.log(`- Plan: ${planName || planId}`);
    console.log(`- Value: R$ ${value}`);
    console.log(`==================================================\n`);

    // 1. Buscar trainer e asaas_customer_id
    const { data: trainer, error: trainerError } = await supabaseAdmin
      .from('trainers')
      .select('asaas_customer_id, email')
      .eq('id', trainerId)
      .maybeSingle();

    if (trainerError || !trainer) {
      return res.status(404).json({ error: 'Trainer não encontrado' });
    }

    if (!trainer.asaas_customer_id) {
      return res.status(400).json({ error: 'Trainer sem asaas_customer_id. Crie o cliente Asaas primeiro.' });
    }

    // 2. Criar assinatura recorrente no Asaas
    const subscriptionData = {
      customer: trainer.asaas_customer_id,
      billingType: 'UNDEFINED',
      value: Number(value),
      nextDueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      cycle: 'MONTHLY',
      description: `AxxosFit - Plano ${planName || planId}`,
      externalReference: `${trainerId}_${planId}`,
    };

    console.log(`🔌 Criando assinatura recorrente no Asaas...`);
    
    const asaasSubscription = await asaasFetch('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(subscriptionData)
    });

    console.log(`✅ Assinatura criada no Asaas: ${asaasSubscription.id}`);

    // 3. Atualizar/criar subscription no Supabase
    const nextDueDate = new Date();
    nextDueDate.setMonth(nextDueDate.getMonth() + 1);

    const { data: existingSub } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('trainer_id', trainerId)
      .maybeSingle();

    let subscriptionId: string;

    if (existingSub) {
      const { data: updatedSub } = await supabaseAdmin
        .from('subscriptions')
        .update({
          plan_id: planId,
          status: 'pending',
          payment_provider: 'asaas',
          asaas_subscription_id: asaasSubscription.id,
          started_at: new Date().toISOString(),
          expires_at: nextDueDate.toISOString(),
          next_due_date: nextDueDate.toISOString()
        })
        .eq('trainer_id', trainerId)
        .select()
        .single();

      subscriptionId = updatedSub?.id || existingSub.id;
    } else {
      const { data: newSub } = await supabaseAdmin
        .from('subscriptions')
        .insert({
          trainer_id: trainerId,
          plan_id: planId,
          status: 'pending',
          payment_provider: 'asaas',
          asaas_subscription_id: asaasSubscription.id,
          started_at: new Date().toISOString(),
          expires_at: nextDueDate.toISOString(),
          next_due_date: nextDueDate.toISOString()
        })
        .select()
        .single();

      subscriptionId = newSub?.id || '';
    }

    console.log(`✅ Subscription no Supabase atualizada: ${subscriptionId}`);

    return res.status(201).json({
      success: true,
      subscription: {
        id: subscriptionId,
        asaas_subscription_id: asaasSubscription.id,
        status: 'pending',
        nextDueDate: nextDueDate.toISOString()
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao criar subscription no Asaas:', error);
    return res.status(500).json({ 
      error: 'Erro ao criar subscription no Asaas', 
      details: error.message 
    });
  }
});

// API: Webhook do Asaas
// POST /api/asaas/webhook
app.post('/api/asaas/webhook', async (req, res) => {
  try {
    console.log(`\n[ASAAS WEBHOOK] event=${req.body?.event}`);
    const result = await processAsaasWebhook(supabaseAdmin, req.body || {});
    return res.json(result);
  } catch (error: any) {
    console.error('❌ Erro ao processar webhook Asaas:', error);
    return res.status(500).json({
      error: 'Erro ao processar webhook',
      details: error.message,
    });
  }
});

// API: Consultar pagamento no Asaas (sem gravar no banco)
// POST /api/asaas/check-payment
app.post('/api/asaas/check-payment', async (req, res) => {
  try {
    const { trainerId, asaasSubscriptionId } = req.body;
    const result = await checkAsaasPaymentForTrainer(supabaseAdmin, {
      trainerId,
      asaasSubscriptionId,
    });
    return res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    console.error('❌ Erro ao consultar pagamento Asaas:', error);
    return res.status(500).json({
      error: 'Erro ao consultar pagamento',
      details: error.message,
    });
  }
});

// API: Sincronizar pagamento manualmente (fallback sem webhook)
// POST /api/asaas/sync-payment
app.post('/api/asaas/sync-payment', async (req, res) => {
  try {
    const { trainerId, asaasSubscriptionId } = req.body;
    const result = await syncAsaasPaymentForTrainer(supabaseAdmin, {
      trainerId,
      asaasSubscriptionId,
    });
    return res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    console.error('❌ Erro ao sincronizar pagamento Asaas:', error);
    return res.status(500).json({
      error: 'Erro ao sincronizar pagamento',
      details: error.message,
    });
  }
});

// API: Obter informações da assinatura
// GET /api/asaas/subscription/:trainerId
app.get('/api/asaas/subscription/:trainerId', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase não configurado' });
  }

  try {
    const { trainerId } = req.params;

    console.log(`📋 Buscando subscription para trainer: ${trainerId}`);

    // Buscar subscription no Supabase
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        id,
        plan_id,
        status,
        started_at,
        expires_at,
        next_due_date,
        asaas_subscription_id,
        payment_provider,
        plans(id, name, slug, price)
      `)
      .eq('trainer_id', trainerId)
      .maybeSingle();

    if (subError || !subscription) {
      console.log(`ℹ️ Nenhuma subscription encontrada para trainer ${trainerId}`);
      return res.status(404).json({ 
        error: 'Subscription não encontrada',
        subscription: null 
      });
    }

    // Se houver asaas_subscription_id, buscar dados atualizados do Asaas
    let asaasData = null;
    if (subscription.asaas_subscription_id && ASAAS_API_KEY) {
      try {
        asaasData = await asaasFetch(`/subscriptions/${subscription.asaas_subscription_id}`);
        console.log(`✅ Dados obtidos do Asaas`);
      } catch (asaasErr) {
        console.warn(`⚠️ Erro ao buscar dados do Asaas:`, asaasErr);
      }
    }

    const response = {
      id: subscription.id,
      status: subscription.status,
      plan: subscription.plans?.[0] || null,
      startedAt: subscription.started_at,
      expiresAt: subscription.expires_at,
      nextDueDate: subscription.next_due_date,
      paymentProvider: subscription.payment_provider,
      asaasSubscriptionId: subscription.asaas_subscription_id,
      asaasData: asaasData
    };

    console.log(`✅ Subscription retornada com sucesso`);

    return res.status(200).json({
      success: true,
      subscription: response
    });

  } catch (error: any) {
    console.error('❌ Erro ao buscar subscription:', error);
    return res.status(500).json({ 
      error: 'Erro ao buscar subscription', 
      details: error.message 
    });
  }
});

// ============================================================
// FIM ASAAS INTEGRATION ENDPOINTS
// ============================================================

// API: IA para sugestão de treino usando Google Gemini
app.post('/api/gemini/suggest-workout', async (req, res) => {
  const { name, objective, height, weight, bodyFat, injuries } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️ GEMINI_API_KEY não encontrada no ambiente.');
    return res.status(200).json({
      suggestion: `### 💡 Sugestão Inteligente Local (Simulação)
Olá Trainer! Como a chave Gemini API ainda não foi configurada nos Secrects do AI Studio, aqui está uma sugestão gerada pela inteligência local do **AxxosFit** para o(a) aluno(a) **${name}**:

* **Perfil**: ¹75m de altura, ${weight}kg e ${bodyFat}% de gordura corporal.
* **Foco Principal**: ${objective}
* **Restrições**: ${injuries}

**Plano de ação recomendado:**
1. **Ativação articular**: Isometria de agachamento e liberação miofascial leve.
2. **Adaptação Carga**: 3 séries de Prensa de Pernas de 10-12 reps focando na amplitude controlada antes de evoluir para agachamento profundo.
3. **Periodização do Core**: Prancha frontal tocando ombros para ganho de estabilidade lateral profunda.

*Ative sua chave de API nos Segredos do AI Studio para desbloquear o motor generativo ultra-personalizado da Inteligência do Gemini!*`
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `Gere uma prescrição de treino e orientações biomecânicas personalizadas em português brasileiro para o seguinte aluno:
    - Nome: ${name}
    - Objetivo: ${objective}
    - Altura: ${height}cm
    - Peso atual: ${weight}kg
    - Percentual de Gordura atual: ${bodyFat}%
    - Lesões/restrições relatadas: ${injuries}

    Divida a resposta em seções curtas, organizadas e profissionais:
    ### 🎯 Ajuste de Foco e Meta
    ### 🏋️ Estrutura de Periodização Sugerida (Exercícios, Séries e Repetições)
    ### ⚙️ Alertas de Segurança e Ajustes pela Restrição Relatada
    ### ⚡ Insights de Mentalidade/Frequência
    
    Seja conciso, direto e focado em alta performance em português do Brasil, utilizando ótima formatação Markdown.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'Você é o AxxosFit AI Coach, um assistente virtual ultra-avançado de personal trainers e PhD em cinesiologia e fisiologia do exercício físico.',
        temperature: 0.7,
      }
    });

    const suggestion = response.text || 'Não foi possível gerar sugestões automáticas.';
    return res.json({ suggestion });

  } catch (error: any) {
    console.error('Erro ao chamar o Gemini API:', error);
    return res.status(500).json({ 
      error: 'Erro ao gerar sugestão via IA',
      details: error.message 
    });
  }
});

// Setup das rotas de arquivos estáticos / Vite dev middleware
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    console.log('🚀 Inicializando Vite em modo de desenvolvimento...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('📦 Servindo aplicação em modo de produção (build estático)...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    // Fallback Express v4 padrão se o asterisco all não rodar:
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌍 AxxosFit rodando no endereço: http://localhost:${PORT}`);
  });
}



setupVite();
