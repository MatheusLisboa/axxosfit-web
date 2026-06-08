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

/** PWA ou URL de login → abrir direto na tela de autenticação. */
export function shouldStartOnLogin(pathname = typeof window !== 'undefined' ? window.location.pathname : '/'): boolean {
  return isPwaStandalone() || isLoginEntryPath(pathname);
}
