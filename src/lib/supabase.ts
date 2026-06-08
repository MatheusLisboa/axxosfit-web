/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';

let rawUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
// Certifica que não há '/rest/v1/' ou barras finais no final da URL
if (rawUrl) {
  rawUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
}
export const supabaseUrl = rawUrl;
export const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

// Verifica se as chaves existem para não quebrar a aplicação ao buildar/inicializar sem credenciais configuradas
export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseUrl !== 'https://seu-projeto.supabase.co' && 
  supabaseAnonKey &&
  supabaseAnonKey !== 'sua-chave-anonima-publica'
);

// Inicializa o cliente do Supabase de forma segura. Se não estiver configurado, exporta null
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

console.log(
  isSupabaseConfigured 
    ? '✅ Supabase integrado com sucesso.' 
    : 'ℹ️ Supabase não configurado. Utilizando motor local persistente (LocalStorage Database Engine).'
);
