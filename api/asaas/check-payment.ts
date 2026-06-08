import type { VercelRequest, VercelResponse } from '@vercel/node';
import { checkAsaasPaymentForTrainer } from '../../lib/asaasBilling';
import { createSupabaseAdmin } from '../../lib/supabaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { trainerId, asaasSubscriptionId } = req.body || {};
    const result = await checkAsaasPaymentForTrainer(createSupabaseAdmin(), {
      trainerId,
      asaasSubscriptionId,
    });
    return res.status(200).json({ success: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('❌ Erro ao consultar pagamento Asaas (Vercel):', error);
    return res.status(500).json({ error: 'Erro ao consultar pagamento', details: message });
  }
}
