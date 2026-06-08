import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { getPlanPrice, normalizePlanSlug } from '../lib/plans';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { trainerId, planSlug, email, fullName } = req.body;

  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
  const mpToken = (process.env.MERCADO_PAGO_ACCESS_TOKEN || '').trim();
  const appUrl = (process.env.APP_URL || 'https://axos-fit.vercel.app').trim().replace(/\/+$/, '');

  const supabaseAdmin = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

  try {
    let plan: any = null;

    if (supabaseAdmin) {
      const { data } = await supabaseAdmin.from('plans').select('*').eq('slug', planSlug).maybeSingle();
      plan = data;
    }

    if (!plan) {
      const slug = normalizePlanSlug(planSlug || 'starter');
      plan = {
        slug,
        name: slug.charAt(0).toUpperCase() + slug.slice(1),
        price: getPlanPrice(slug),
        id: null,
      };
    } else {
      plan = { ...plan, price: getPlanPrice(plan.slug || planSlug) };
    }

    let preferenceId = `mp_pref_${Math.random().toString(36).substring(2, 11)}`;
    let initPoint = `${appUrl}/?status=approved`;

    if (mpToken) {
      const preferenceBody: any = {
        items: [{
          id: plan.slug,
          title: `AxxosFit - Plano ${plan.name}`,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: Number(plan.price)
        }],
        payer: { name: fullName || 'Personal Trainer', email: (email || 'trainer@example.com').toLowerCase() },
        back_urls: {
          success: `${appUrl}/?status=approved`,
          failure: `${appUrl}/?status=failed`,
          pending: `${appUrl}/?status=pending`,
        },
        auto_return: 'approved',
        external_reference: trainerId,
      };

      const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${mpToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(preferenceBody)
      });

      if (!mpResponse.ok) {
        const errText = await mpResponse.text();
        throw new Error(`Mercado Pago erro (${mpResponse.status}): ${errText}`);
      }

      const mpData = await mpResponse.json();
      preferenceId = mpData.id;
      initPoint = mpData.init_point;
    }

    if (supabaseAdmin && trainerId && plan.id) {
      const { data: existingSub } = await supabaseAdmin
        .from('subscriptions').select('id').eq('trainer_id', trainerId).maybeSingle();

      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      if (existingSub) {
        await supabaseAdmin.from('subscriptions').update({
          plan_id: plan.id, status: 'pending', payment_reference: preferenceId,
          started_at: new Date().toISOString(), expires_at: expiresAt.toISOString()
        }).eq('trainer_id', trainerId);
      } else {
        await supabaseAdmin.from('subscriptions').insert({
          trainer_id: trainerId, plan_id: plan.id, status: 'pending',
          payment_provider: 'mercado_pago', payment_reference: preferenceId,
          started_at: new Date().toISOString(), expires_at: expiresAt.toISOString()
        });
      }
    }

    return res.status(200).json({ preferenceId, initPoint, planName: plan.name, price: plan.price });

  } catch (error: any) {
    console.error('[create-checkout] Erro:', error);
    return res.status(500).json({ error: 'Erro ao gerar checkout', details: error.message });
  }
}