import type { VercelRequest, VercelResponse } from '@vercel/node';
import { processAsaasWebhook } from '../../lib/asaasWebhook';
import { createSupabaseAdmin } from '../../lib/supabaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await processAsaasWebhook(createSupabaseAdmin(), req.body || {});
    return res.status(200).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('❌ Erro ao processar webhook Asaas (Vercel):', error);
    return res.status(500).json({ error: 'Erro ao processar webhook', details: message });
  }
}
