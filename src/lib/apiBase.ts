/**
 * Base URL para chamadas à API backend (Express local, Cloud Run ou Vercel serverless).
 * Em dev: use `npm run dev` (porta 3000). Se o front estiver em outro host, defina VITE_API_URL.
 */
export function getApiBaseUrl(): string {
  const fromEnv = (import.meta as ImportMeta & { env?: { VITE_API_URL?: string } }).env
    ?.VITE_API_URL;
  if (fromEnv && typeof fromEnv === 'string') {
    return fromEnv.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    return window.location.origin.replace(/\/$/, '');
  }
  return '';
}

export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function isNetworkFetchError(err: unknown): boolean {
  return err instanceof TypeError && /failed to fetch|networkerror|load failed/i.test(err.message);
}

export function formatApiNetworkError(err: unknown): string {
  if (isNetworkFetchError(err)) {
    const base = getApiBaseUrl();
    const isLocal =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    if (isLocal) {
      return `Não foi possível conectar à API (${base || 'localhost'}). Execute npm run dev e acesse http://localhost:3000`;
    }
    return `Não foi possível conectar ao servidor de pagamentos. Verifique VITE_API_URL ou se a API está publicada (POST /api/asaas/upgrade).`;
  }
  return err instanceof Error ? err.message : 'Erro de comunicação com o servidor.';
}
