import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({
    ok: true,
    hasSupabaseUrl: !!(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL),
    hasSupabaseKey: !!(
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY
    ),
    hasAsaasKey: !!(process.env.ASAAS_API_KEY || '').trim(),
    node: process.version,
  });
}
