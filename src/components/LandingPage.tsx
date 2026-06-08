/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Dumbbell,
  Users,
  TrendingUp,
  Activity,
  MessageCircle,
  ChevronRight,
  HelpCircle,
  Zap,
  Shield,
  BarChart3,
  Check,
  ArrowRight,
  Bot,
} from 'lucide-react';
import { Button } from '../figma/components/ui/Button';
import { Badge } from '../figma/components/ui/Badge';
import { GlassCard } from '../figma/components/ui/GlassCard';
import { Wordmark } from './Wordmark';
import { PLAN_CATALOG_LIST, TRIAL_DAYS } from '../lib/plans';
import { PlanComparisonTable } from './plans/PlanComparisonTable';

interface LandingPageProps {
  onStart: () => void;
  onEnterApp: () => void;
  onSelectPlan?: (planSlug: 'starter' | 'pro' | 'studio') => void;
}

function FigmaBackground() {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a14] via-[#07070e] to-[#0a0a14]" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent/10 rounded-full blur-3xl" />
      </div>
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
    </>
  );
}

export default function LandingPage({ onStart, onEnterApp, onSelectPlan }: LandingPageProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const benefits = [
    {
      icon: Users,
      color: 'from-indigo-500 to-violet-600',
      title: 'Gestão Descomplicada',
      desc: 'Acompanhe dezenas de alunos ativos e inativos com prontuários esportivos, histórico de lesões e evolução em um painel único.',
    },
    {
      icon: Dumbbell,
      color: 'from-violet-500 to-purple-600',
      title: 'Montador de Treino Rápido',
      desc: 'Prescreva rotinas complexas em minutos. Divisão A/B/C automática, histórico de cargas integradas e biblioteca customizada.',
    },
    {
      icon: TrendingUp,
      color: 'from-emerald-500 to-teal-600',
      title: 'Metodologia de Retenção',
      desc: 'Gráficos antropométricos, percentuais de gordura e score de aderência inteligente para reter seus alunos por mais tempo.',
    },
    {
      icon: Activity,
      color: 'from-amber-500 to-orange-600',
      title: 'App do aluno incluso',
      desc: 'Seus alunos acessam treinos, evolução e perfil sem pagar nada — apenas você assina o plano.',
    },
  ];

  const plans = PLAN_CATALOG_LIST.map((p) => ({
    ...p,
    cta: p.slug === 'starter' ? `Experimentar — ${TRIAL_DAYS} dias grátis` : p.cta,
  }));

  const faqs = [
    {
      q: 'O AxxosFit necessita de instalação local?',
      a: 'Não. O AxxosFit é um SaaS 100% web e na nuvem. Você e seus alunos acessam instantaneamente por qualquer telefone, tablet ou computador.',
    },
    {
      q: 'Meus alunos pagam para acessar?',
      a: 'Não. O app do aluno é gratuito para todos os convidados por um personal cadastrado. Apenas o personal assina um plano.',
    },
    {
      q: 'Como funciona o trial de 14 dias?',
      a: 'Todo personal começa no Starter com 14 dias grátis. Você pode testar editor de treinos, app do aluno e evolução básica antes de escolher Pro ou Studio.',
    },
    {
      q: 'Qual a diferença entre Pro e Studio?',
      a: 'O Pro inclui até 25 alunos, avaliação física completa, PDF profissional, controle financeiro e suporte prioritário. O Studio adiciona alunos ilimitados, suporte WhatsApp e relatórios avançados.',
    },
  ];

  const previewStats = [
    { label: 'Receita Mensal', value: 'R$ 9.200', change: '+14%', icon: Activity, color: 'from-indigo-500 to-violet-600' },
    { label: 'Alunos Ativos', value: '24', change: '+3', icon: Users, color: 'from-violet-500 to-purple-600' },
    { label: 'Retenção', value: '87%', change: '+2%', icon: TrendingUp, color: 'from-emerald-500 to-teal-600' },
  ];

  return (
    <div id="landing-page" className="min-h-screen dark bg-background text-foreground selection:bg-primary/30">
      <FigmaBackground />

      <div className="relative z-10">
        <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Wordmark size="lg" className="max-w-[min(100%,280px)]" />
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
              <a href="#beneficios" className="hover:text-foreground transition-colors">
                Benefícios
              </a>
              <a href="#planos" className="hover:text-foreground transition-colors">
                Planos
              </a>
              <a href="#faq" className="hover:text-foreground transition-colors">
                FAQ
              </a>
            </nav>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button variant="outline" size="sm" onClick={onEnterApp}>
                Acessar Painel
              </Button>
            </div>
          </div>
        </header>

        <section className="relative pt-16 pb-12 md:pt-24 md:pb-16 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30 mb-6"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-xs text-primary font-medium">Plataforma #1 para Fitness Profissionais</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-[1.1]"
              >
                Eleve seu negócio{' '}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  fitness ao próximo nível
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-base sm:text-lg text-muted-foreground mb-8 sm:mb-10 leading-relaxed"
              >
                Gerencie alunos, crie treinos personalizados e acompanhe resultados com tecnologia de ponta — o mesmo
                visual e experiência do seu painel profissional.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-3"
              >
                <Button size="lg" onClick={onStart} iconRight={<ArrowRight className="w-5 h-5" />} className="w-full sm:w-auto">
                  Começar agora — 14 dias grátis
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="flex items-center justify-center gap-4 mt-10"
              >
                {['Tiago M.', 'Juliana R.', 'Carlos S.', 'Ana P.'].map((name, i) => (
                  <div
                    key={name}
                    className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-white border-2 border-background -ml-2 first:ml-0"
                    style={{ zIndex: 4 - i }}
                  >
                    {name[0]}
                  </div>
                ))}
                <span className="text-sm text-muted-foreground">+2.4k trainers ativos</span>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-16 sm:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary/90 to-accent p-6 sm:p-8 text-white mb-6"
          >
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'radial-gradient(circle at 70% 50%, white 1px, transparent 1px)',
                backgroundSize: '30px 30px',
              }}
            />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-white/70 text-sm mb-1">Preview do dashboard</p>
                <h2 className="text-xl sm:text-2xl font-bold">Tudo que você precisa em um só lugar</h2>
              </div>
              <Badge variant="primary" className="bg-white/15 border-white/20 text-white">
                SaaS Fitness
              </Badge>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {previewStats.map(({ label, value, change, icon: Icon, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <GlassCard className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400">
                      {change}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{label}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="beneficios" className="py-20 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Arquitetura de elite para personais escalarem
              </h2>
              <p className="text-muted-foreground">
                Diga adeus às planilhas em PDF. Ofereça uma experiência mobile interativa que mantém seu aluno focado e
                progredindo.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {benefits.map(({ icon: Icon, color, title, desc }, i) => (
                <GlassCard key={title} hover className="p-6">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-5 shadow-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </GlassCard>
              ))}
            </div>

            <div className="mt-10 grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {[
                { icon: BarChart3, text: 'Dashboard com analytics em tempo real' },
                { icon: Shield, text: 'Suporte via e-mail no Starter; prioritário no Pro' },
                { icon: Shield, text: 'Segurança e privacidade dos seus dados' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="planos" className="py-20 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Planos para cada fase da sua assessoria</h2>
              <p className="text-muted-foreground">
                {TRIAL_DAYS} dias grátis no Starter. Alunos não pagam — apenas você assina.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
              {plans.map((p) => (
                <GlassCard
                  key={p.slug}
                  glow={p.popular}
                  className={`p-6 lg:p-8 relative ${p.popular ? 'border-primary/40 bg-gradient-to-br from-primary/10 to-accent/5' : ''}`}
                >
                  {p.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="accent">Recomendado</Badge>
                    </div>
                  )}
                  {p.premium && !p.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="primary">Studio</Badge>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{p.subtitle}</p>
                  <h3 className="text-xl font-bold text-foreground mb-4">{p.name}</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-muted-foreground text-lg">R$</span>
                    <span className="text-4xl font-bold tracking-tight">{p.price}</span>
                    <span className="text-muted-foreground text-sm">/mês</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={p.popular ? 'primary' : 'outline'}
                    fullWidth
                    onClick={() => (onSelectPlan ? onSelectPlan(p.slug) : onStart())}
                    className={p.popular ? 'bg-gradient-to-r from-primary to-accent border-0' : ''}
                  >
                    {p.cta}
                  </Button>
                </GlassCard>
              ))}
            </div>

            <div className="rounded-2xl border border-border bg-card/30 p-4 sm:p-6">
              <PlanComparisonTable />
            </div>
          </div>
        </section>

        <section id="faq" className="py-20 border-t border-border">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight">Perguntas frequentes</h2>
              <p className="text-muted-foreground mt-2 text-sm">Dúvidas sobre a plataforma e funcionalidades.</p>
            </div>

            <div className="space-y-3">
              {faqs.map((f, i) => (
                <GlassCard key={f.q} className="overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                    className="w-full text-left px-5 py-4 flex items-center justify-between font-medium text-foreground hover:bg-muted/30 transition"
                  >
                    <span className="pr-4">{f.q}</span>
                    <ChevronRight
                      className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${activeFaq === i ? 'rotate-90 text-primary' : ''}`}
                    />
                  </button>
                  {activeFaq === i && (
                    <div className="px-5 pb-4 pt-0 text-sm text-muted-foreground leading-relaxed border-t border-border">
                      {f.a}
                    </div>
                  )}
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 border-t border-border">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Pronto para transformar sua assessoria?</h2>
            <p className="text-muted-foreground mb-8">
              Nossa equipe está no WhatsApp para auxiliar com configuração e dúvidas comerciais.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://wa.me/5582999636623?text=Ol%C3%A1%21%20Gostaria%20de%20saber%20mais%20sobre%20a%20plataforma%20AxxosFit"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="lg" icon={<MessageCircle className="w-5 h-5" />}>
                  Falar no WhatsApp
                </Button>
              </a>
              <Button size="lg" onClick={onStart} iconRight={<ArrowRight className="w-4 h-4" />}>
                Criar conta grátis
              </Button>
            </div>
          </div>
        </section>

        <footer className="border-t border-border py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Wordmark size="lg" className="max-w-[min(100%,280px)]" />
            <p className="text-xs text-muted-foreground">© 2026 AxxosFit. Todos os direitos reservados.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
