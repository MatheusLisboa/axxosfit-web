/** Próximo vencimento com base no dia do mês (1–28). */
export function nextDueDateFromDay(dueDay: number, refDate = new Date()): string {
  const day = Math.min(28, Math.max(1, Math.floor(dueDay) || 10));
  const year = refDate.getFullYear();
  const month = refDate.getMonth();
  let due = new Date(year, month, day, 12, 0, 0);
  const today = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), 12, 0, 0);
  if (due < today) {
    due = new Date(year, month + 1, day, 12, 0, 0);
  }
  return due.toISOString().split('T')[0];
}

/** Vencimento do mês seguinte após quitar uma mensalidade. */
export function nextDueDateAfterPaid(dueDay: number, paidDueDate: string): string {
  const day = Math.min(28, Math.max(1, Math.floor(dueDay) || 10));
  const base = new Date(`${paidDueDate}T12:00:00`);
  const next = new Date(base.getFullYear(), base.getMonth() + 1, day, 12, 0, 0);
  return next.toISOString().split('T')[0];
}

export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function buildWhatsAppBillingUrl(
  phone: string,
  opts: {
    studentName: string;
    amount: number;
    dueDate: string;
    trainerName?: string;
  }
): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return null;

  const dueLabel = new Date(`${opts.dueDate}T12:00:00`).toLocaleDateString('pt-BR');
  const amountLabel = formatBRL(opts.amount);
  const trainer = opts.trainerName?.trim() || 'seu personal';

  const message =
    `Olá ${opts.studentName}! Aqui é ${trainer}, da AxxosFit.\n\n` +
    `Sua mensalidade de ${amountLabel} ${
      opts.dueDate <= new Date().toISOString().split('T')[0] ? 'está em aberto' : `vence em ${dueLabel}`
    }. ` +
    `Pode me avisar quando realizar o pagamento?\n\nObrigado!`;

  return `https://wa.me/55${digits}?text=${encodeURIComponent(message)}`;
}
