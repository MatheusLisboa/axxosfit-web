const MOTIVATIONAL = [
  'Consistência vence intensidade.',
  'Um treino de cada vez.',
  'Seu corpo agradece cada repetição.',
  'Progresso não é linear — é diário.',
  'Hoje é o melhor dia para evoluir.',
  'Disciplina é o seu superpoder.',
  'Pequenos passos, grandes resultados.',
];

export function getTimeGreeting(): 'Bom dia' | 'Boa tarde' | 'Boa noite' {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function getMotivationalQuote(seed = new Date().toDateString()): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash << 5) - hash + seed.charCodeAt(i);
  return MOTIVATIONAL[Math.abs(hash) % MOTIVATIONAL.length];
}

export const WEEKDAY_LABELS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'] as const;

/** Segunda = 0 … Domingo = 6 (ISO weekday - 1) */
export function getWeekdayIndex(date = new Date()): number {
  const d = date.getDay();
  return d === 0 ? 6 : d - 1;
}

export function startOfWeek(date = new Date()): Date {
  const d = new Date(date);
  const idx = getWeekdayIndex(d);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - idx);
  return d;
}
