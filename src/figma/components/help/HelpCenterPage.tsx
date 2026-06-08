import { Mail, MessageCircle, Clock, Crown, ChevronRight, HelpCircle } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useSubscription } from '../../../hooks/useSubscription';
import {
  SUPPORT_EMAIL,
  getSupportInfoForPlan,
  buildSupportMailto,
  getWhatsAppSupportUrl,
  HELP_FAQ,
} from '../../../lib/support';
import { PLAN_DISPLAY_NAMES, normalizePlanSlug } from '../../../lib/plans';
import type { AppPage } from '../layout/Sidebar';

interface HelpCenterPageProps {
  onNavigate?: (page: AppPage, settingsTab?: 'profile' | 'plan' | 'security') => void;
}

export function HelpCenterPage({ onNavigate }: HelpCenterPageProps) {
  const { plan, subscription, canAccess, displayBadgeName } = useSubscription();
  const planSlug = normalizePlanSlug(plan?.slug || 'starter');
  const support = getSupportInfoForPlan(planSlug);
  const hasWhatsApp = canAccess('whatsapp_support');
  const whatsAppUrl = hasWhatsApp ? getWhatsAppSupportUrl() : null;
  const isTrial = subscription?.status === 'trial';

  const mailSubject = `Suporte AxxosFit — Plano ${displayBadgeName}`;
  const mailBody = [
    'Olá, equipe AxxosFit!',
    '',
    'Preciso de ajuda com:',
    '',
    '---',
    `Plano: ${displayBadgeName}${isTrial ? ' (trial)' : ''}`,
  ].join('\n');

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 text-primary">
          <HelpCircle className="w-5 h-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">Central de ajuda</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Como podemos ajudar?</h1>
        <p className="text-sm text-muted-foreground max-w-xl">
          Seu plano <strong className="text-foreground">{displayBadgeName}</strong> inclui{' '}
          <strong className="text-foreground">{support.title.toLowerCase()}</strong>.
        </p>
      </div>

      <GlassCard className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
              Seu canal de suporte
            </p>
            <h2 className="text-lg font-semibold text-foreground">{support.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{support.description}</p>
          </div>
          <Badge variant={hasWhatsApp ? 'accent' : support.hasPriorityEmail ? 'primary' : 'ghost'}>
            {displayBadgeName}
            {isTrial ? ' Trial' : ''}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          {support.responseTime}
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard className="p-5 flex flex-col gap-4" glow={!hasWhatsApp}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                E-mail{support.hasPriorityEmail ? ' prioritário' : ''}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Disponível em todos os planos
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground flex-1">
            Envie dúvidas, bugs ou solicitações para{' '}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-primary font-medium hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
          <Button
            variant="primary"
            size="sm"
            icon={<Mail className="w-4 h-4" />}
            onClick={() => {
              window.location.href = buildSupportMailto(mailSubject, mailBody);
            }}
          >
            Enviar e-mail
          </Button>
        </GlassCard>

        <GlassCard
          className={`p-5 flex flex-col gap-4 ${!hasWhatsApp ? 'opacity-90' : ''}`}
          glow={hasWhatsApp}
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                hasWhatsApp ? 'bg-emerald-500/10' : 'bg-muted'
              }`}
            >
              <MessageCircle
                className={`w-5 h-5 ${hasWhatsApp ? 'text-emerald-400' : 'text-muted-foreground'}`}
              />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">WhatsApp prioritário</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Exclusivo plano Studio</p>
            </div>
          </div>

          {hasWhatsApp && whatsAppUrl ? (
            <>
              <p className="text-sm text-muted-foreground flex-1">
                Atendimento rápido em horário comercial. Toque abaixo para iniciar a conversa.
              </p>
              <Button
                variant="accent"
                size="sm"
                icon={<MessageCircle className="w-4 h-4" />}
                onClick={() => window.open(whatsAppUrl, '_blank', 'noopener,noreferrer')}
              >
                Abrir WhatsApp
              </Button>
            </>
          ) : hasWhatsApp && !whatsAppUrl ? (
            <>
              <p className="text-sm text-muted-foreground flex-1">
                Seu plano inclui WhatsApp. Enquanto o número não estiver configurado, use o e-mail
                prioritário — responderemos o quanto antes.
              </p>
              <Button
                variant="outline"
                size="sm"
                icon={<Mail className="w-4 h-4" />}
                onClick={() => {
                  window.location.href = buildSupportMailto(
                    `${mailSubject} (WhatsApp Studio)`,
                    mailBody
                  );
                }}
              >
                Usar e-mail prioritário
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground flex-1">
                Disponível no plano Studio. Faça upgrade para suporte prioritário via WhatsApp além
                do e-mail.
              </p>
              <Button
                variant="outline"
                size="sm"
                icon={<Crown className="w-4 h-4" />}
                iconRight={<ChevronRight className="w-4 h-4" />}
                onClick={() => onNavigate?.('settings', 'plan')}
              >
                Ver plano Studio
              </Button>
            </>
          )}
        </GlassCard>
      </div>

      {!support.hasPriorityEmail && (
        <GlassCard className="p-4 border-primary/20 bg-primary/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Quer resposta mais rápida?</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pro inclui suporte prioritário por e-mail. Studio adiciona WhatsApp.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => onNavigate?.('settings', 'plan')}>
              Comparar planos
            </Button>
          </div>
        </GlassCard>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Perguntas frequentes
        </h2>
        <div className="space-y-2">
          {HELP_FAQ.map(({ question, answer }) => (
            <details
              key={question}
              className="group rounded-xl border border-border bg-card/60 overflow-hidden"
            >
              <summary className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer text-sm font-medium text-foreground hover:bg-muted/50 list-none [&::-webkit-details-marker]:hidden">
                {question}
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 transition-transform group-open:rotate-90" />
              </summary>
              <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{answer}</p>
            </details>
          ))}
        </div>
      </div>

      <p className="text-xs text-center text-muted-foreground pb-4">
        Planos oficiais: {PLAN_DISPLAY_NAMES.starter} (e-mail) · {PLAN_DISPLAY_NAMES.pro}{' '}
        (prioritário) · {PLAN_DISPLAY_NAMES.studio} (WhatsApp + e-mail)
      </p>
    </div>
  );
}
