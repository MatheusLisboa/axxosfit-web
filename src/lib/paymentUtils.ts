import type { Payment } from '../types';

/** Pagamentos de mensalidade de alunos — exclui upgrades de plano da plataforma. */
export function isStudentBillingPayment(p: Pick<Payment, 'student_id' | 'description'>): boolean {
  if (!p.student_id || p.student_id.trim() === '') return false;
  const desc = (p.description || '').toLowerCase();
  if (
    desc.includes('axxosfit') ||
    desc.includes('axosfit') ||
    desc.includes('assinatura') ||
    desc.includes('upgrade') ||
    desc.includes('plano starter') ||
    desc.includes('plano pro') ||
    desc.includes('plano studio')
  ) {
    return false;
  }
  return true;
}

export function filterStudentBillingPayments<T extends Pick<Payment, 'student_id' | 'description'>>(
  payments: T[]
): T[] {
  return payments.filter(isStudentBillingPayment);
}
