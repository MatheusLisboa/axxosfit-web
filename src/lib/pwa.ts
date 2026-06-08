/** App instalado na área de trabalho (PWA / iOS Add to Home Screen). */
export function isPwaStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    nav.standalone === true
  );
}

export function isLoginEntryPath(pathname: string): boolean {
  return pathname === '/login' || pathname === '/auth' || pathname === '/signin';
}

export function isRegisterEntryPath(pathname: string): boolean {
  return pathname === '/register';
}

export function resolveAuthInitialView(pathname: string): 'login' | 'register' {
  if (isRegisterEntryPath(pathname)) return 'register';
  return 'login';
}

/** Normaliza a URL de autenticação (PWA abre em /login). */
export function syncAuthPath(pathname: string): void {
  if (!isPwaStandalone()) return;
  if (pathname === '/register' || isLoginEntryPath(pathname)) return;
  window.history.replaceState({}, '', '/login');
}
