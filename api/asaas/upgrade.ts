import type { VercelRequest, VercelResponse } from '@vercel/node';
import { processAsaasUpgrade } from '../../lib/asaasBilling';
import { createSupabaseAdmin } from '../../lib/supabaseAdmin';

export const config = {
  maxDuration: 30,
};

function setCors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseAdmin = createSupabaseAdmin();

  try {
    const { trainerId, planSlug, email, name, phone, cpf, billingType, asaasCustomerId, returnUrl } = req.body || {};

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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    const isValidation =
      message.includes('obrigatório') || message.includes('CPF');

    console.error('❌ Erro no upgrade Asaas (Vercel):', error);
    return res.status(isValidation ? 400 : 500).json({
      error: 'Erro ao iniciar upgrade no Asaas',
      details: message,
    });
  }
}
