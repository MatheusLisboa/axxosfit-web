import type { VercelRequest, VercelResponse } from '@vercel/node';
import { syncAsaasPaymentForTrainer } from '../../lib/asaasBilling';
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

  try {
    const { trainerId, asaasSubscriptionId } = req.body || {};
    const result = await syncAsaasPaymentForTrainer(createSupabaseAdmin(), {
      trainerId,
      asaasSubscriptionId,
    });
    return res.status(200).json({ success: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('❌ Erro ao sincronizar pagamento Asaas (Vercel):', error);
    return res.status(500).json({ error: 'Erro ao sincronizar pagamento', details: message });
  }
}
