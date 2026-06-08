/**
 * Central de ajuda — docs/AxxosFit Docs/Regras/Planos.md
 * Starter: e-mail | Pro: prioritário (e-mail) | Studio: WhatsApp prioritário + e-mail
 */

import { normalizePlanSlug, type CanonicalPlanSlug } from './plans';

export const SUPPORT_EMAIL = 'suporte@axxosfit.com.br';

export type SupportLevel = 'email' | 'priority_email' | 'whatsapp';

export interface SupportPlanInfo {
  level: SupportLevel;
  title: string;
  description: string;
  responseTime: string;
  hasWhatsApp: boolean;
  hasPriorityEmail: boolean;
}

const SUPPORT_BY_PLAN: Record<CanonicalPlanSlug, SupportPlanInfo> = {
  starter: {
    level: 'email',
    title: 'Suporte via e-mail',
    description: 'Tire dúvidas sobre treinos, alunos e uso da plataforma.',
    responseTime: 'Resposta em até 48h úteis',
    hasWhatsApp: false,
    hasPriorityEmail: false,
  },
  pro: {
    level: 'priority_email',
    title: 'Suporte prioritário',
    description: 'Atendimento com prioridade para personais no plano Pro.',
    responseTime: 'Resposta em até 24h úteis',
    hasWhatsApp: false,
    hasPriorityEmail: true,
  },
  studio: {
    level: 'whatsapp',
    title: 'Suporte prioritário WhatsApp',
    description: 'Canal rápido para assessorias no plano Studio, com e-mail como alternativa.',
    responseTime: 'WhatsApp em horário comercial · e-mail prioritário',
    hasWhatsApp: true,
    hasPriorityEmail: true,
  },
};

export function getSupportInfoForPlan(planSlug?: string | null): SupportPlanInfo {
  return SUPPORT_BY_PLAN[normalizePlanSlug(planSlug || 'starter')];
}

export function buildSupportMailto(subject?: string, body?: string): string {
  const params = new URLSearchParams();
  if (subject) params.set('subject', subject);
  if (body) params.set('body', body);
  const qs = params.toString();
  return `mailto:${SUPPORT_EMAIL}${qs ? `?${qs}` : ''}`;
}

export function getWhatsAppSupportUrl(message?: string): string | null {
  const fromEnv = (import.meta as ImportMeta & { env?: { VITE_SUPPORT_WHATSAPP?: string } }).env
    ?.VITE_SUPPORT_WHATSAPP;
  const digits = (fromEnv || '').replace(/\D/g, '');
  if (!digits) return null;

  const text = encodeURIComponent(
    message ||
      'Olá! Sou personal na AxxosFit (plano Studio) e preciso de ajuda.'
  );
  return `https://wa.me/${digits}?text=${text}`;
}

export const HELP_FAQ: { question: string; answer: string }[] = [
  {
    question: 'Como faço upgrade do meu plano?',
    answer:
      'Acesse Configurações → Meu Plano, escolha Starter, Pro ou Studio e conclua o pagamento no Asaas. Após confirmar, use "Já paguei — verificar" se os recursos não liberarem na hora.',
  },
  {
    question: 'Qual a diferença entre os planos de suporte?',
    answer:
      'Starter inclui suporte por e-mail. Pro tem atendimento prioritário por e-mail. Studio adiciona suporte prioritário via WhatsApp, além do e-mail.',
  },
  {
    question: 'Meus alunos pagam a assinatura?',
    answer:
      'Não. Apenas o personal trainer assina a AxxosFit. Cobranças de mensalidade dos alunos são gerenciadas por você no Financeiro (planos Pro e Studio).',
  },
  {
    question: 'Como cadastrar mais alunos?',
    answer:
      'Starter permite até 10 alunos ativos, Pro até 25 e Studio ilimitados. Se atingir o limite, faça upgrade em Meu Plano.',
  },
  {
    question: 'O trial de 14 dias inclui quais recursos?',
    answer:
      'O trial é do plano Starter: editor de treinos, app do aluno e evolução básica. Recursos Pro e Studio exigem upgrade após o trial.',
  },
];
