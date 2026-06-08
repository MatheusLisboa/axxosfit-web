import { Resend } from 'resend';

/** Domínio verificado no Resend — use @mail.axxosfit.com.br no remetente. */
export const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL?.trim() ||
  'AxxosFit <noreply@mail.axxosfit.com.br>';

export const resend = new Resend(process.env.RESEND_API_KEY);