/**
 * Superadmin — acesso total à plataforma (gestão de personais e biblioteca global).
 */

export const SUPERADMIN_EMAILS = [
  'matheus.fillipe@hotmail.com',
  'matheus.fillipe.farias.lisboa@gmail.com',
] as const;

export function normalizeEmail(email?: string | null): string {
  return (email ?? '').toLowerCase().trim();
}

export function isSuperAdminEmail(email?: string | null): boolean {
  const e = normalizeEmail(email);
  return SUPERADMIN_EMAILS.some((a) => a === e);
}

export function isSuperAdminProfile(profile?: { email?: string; role?: string } | null): boolean {
  if (!profile) return false;
  if (isSuperAdminEmail(profile.email)) return true;
  return profile.role === 'admin';
}
