/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Dumbbell,
  Users,
  TrendingUp,
  Activity,
  MessageCircle,
  ChevronRight,
  HelpCircle,
  Shield,
  BarChart3,
  Check,
  ArrowRight,
  Sparkles,
  Wallet,
  Smartphone,
  Trophy,
  Timer,
  Flame,
  ClipboardList,
  Bell,
  Menu,
  X,
  Mail,
} from 'lucide-react';
import { Button } from '../figma/components/ui/Button';
import { Badge } from '../figma/components/ui/Badge';
import { GlassCard } from '../figma/components/ui/GlassCard';
import { Wordmark } from './Wordmark';
import {
  PLAN_CATALOG_LIST,
  PLAN_PRICES,
  STUDIO_INCLUDED_STUDENTS,
  STUDIO_OVERAGE_PRICE,
  TRIAL_DAYS,
  formatPlanPrice,
} from '../lib/plans';
import { PlanComparisonTable } from './plans/PlanComparisonTable';

const APP_REGISTER_URL = 'https://app.axxosfit.com.br/register';
const APP_LOGIN_URL = 'https://app.axxosfit.com.br/login';
const CONTACT_EMAIL = 'contato@axxosfit.com.br';

function FigmaBackground() {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a14] via-[#07070e] to-[#0a0a14]" />
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
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

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navLinks = [
    { href: '#beneficios', label: 'Benefícios' },
    { href: '#planos', label: 'Planos' },
    { href: '#faq', label: 'FAQ' },
  ];

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileNavOpen]);

  const benefits = [
    {
      icon: Users,
      color: 'from-indigo-500 to-violet-600',
      title: 'Gestão Descomplicada',
      desc: 'Cadastre alunos, convide por WhatsApp ou e-mail e envie formulários prontos — PAR-Q, anamnese, lesões e restrições — num painel único.',
    },
    {
      icon: Dumbbell,
      color: 'from-violet-500 to-purple-600',
      title: 'Montador de Treino Rápido',
      desc: 'Monte fichas A/B/C, full body, superior/inferior ou PPL, com biblioteca de exercícios e vídeo. Duplique um treino para vários alunos de uma vez.',
    },
    {
      icon: Sparkles,
      color: 'from-fuchsia-500 to-pink-600',
      title: 'IA Coach',
      plan: 'Studio',
      desc: 'Escolha o aluno e gere a ficha com IA usando a sua biblioteca de exercícios. Revise, ajuste e publique direto no app dele.',
    },
    {
      icon: TrendingUp,
      color: 'from-emerald-500 to-teal-600',
      title: 'Evolução que retém',
      plan: 'Pro',
      desc: 'Avaliação física completa com % de gordura, perímetros e fotos, gráficos de evolução e PDF profissional para entregar ao aluno.',
    },
    {
      icon: Wallet,
      color: 'from-amber-500 to-orange-600',
      title: 'Financeiro em dia',
      plan: 'Pro',
      desc: 'Acompanhe mensalidades, inadimplentes, próximos vencimentos e a previsão do mês. Exporte o relatório em PDF.',
    },
    {
      icon: Smartphone,
      color: 'from-sky-500 to-indigo-600',
      title: 'App do aluno incluso',
      desc: 'Seus alunos treinam, registram cargas e acompanham a evolução pelo celular sem pagar nada — apenas você assina o plano.',
    },
  ];

  const studentAppFeatures = [
    { icon: Timer, text: 'Timer de descanso entre as séries' },
    { icon: Dumbbell, text: 'Carga registrada por série' },
    { icon: Flame, text: 'Sequência de treinos (streak)' },
    { icon: Trophy, text: 'Ranking da turma e medalhas' },
    { icon: ClipboardList, text: 'Formulários enviados pelo personal' },
    { icon: Bell, text: 'Lembretes e instalação na tela inicial' },
  ];

  const plans = PLAN_CATALOG_LIST.map((p) => ({
    ...p,
    cta: p.slug === 'starter' ? `Experimentar — ${TRIAL_DAYS} dias grátis` : p.cta,
  }));

  const faqs = [
    {
      q: 'O AxxosFit necessita de instalação local?',
      a: 'Não. O AxxosFit é um SaaS 100% web e na nuvem. Você e seus alunos acessam por qualquer telefone, tablet ou computador — e ainda podem instalar o app na tela inicial do celular.',
    },
    {
      q: 'Meus alunos pagam para acessar?',
      a: 'Não. O app do aluno é gratuito. O personal cadastra e convida o aluno (por WhatsApp ou e-mail) e apenas o personal assina um plano.',
    },
    {
      q: `Como funciona o trial de ${TRIAL_DAYS} dias?`,
      a: `Todo personal começa no Starter com ${TRIAL_DAYS} dias grátis, sem precisar de cartão. Você testa o editor de treinos, o app do aluno e a evolução básica. Terminado o período, o cadastro de alunos, treinos e avaliações fica bloqueado até você assinar um plano.`,
    },
    {
      q: 'Qual a diferença entre Starter, Pro e Studio?',
      a: `O Starter (R$ ${formatPlanPrice(PLAN_PRICES.starter)}/mês) atende até 5 alunos ativos. O Pro (R$ ${formatPlanPrice(PLAN_PRICES.pro)}/mês) sobe para 10 alunos e libera avaliação física completa, PDF profissional, controle financeiro, anamnese avançada e suporte prioritário. O Studio (R$ ${formatPlanPrice(PLAN_PRICES.studio)}/mês) inclui até ${STUDIO_INCLUDED_STUDENTS} alunos, IA Coach, relatórios avançados e suporte prioritário por WhatsApp.`,
    },
    {
      q: 'O que acontece se eu passar do limite de alunos?',
      a: `No Starter e no Pro você faz upgrade para cadastrar mais alunos. No Studio o cadastro não é bloqueado acima de ${STUDIO_INCLUDED_STUDENTS}: cada aluno extra soma R$ ${formatPlanPrice(STUDIO_OVERAGE_PRICE)}/mês à sua fatura.`,
    },
    {
      q: 'O que é o IA Coach?',
      a: 'É um assistente que gera a ficha de treino do aluno (ABC, full body, superior/inferior ou PPL) a partir da sua biblioteca de exercícios. Você revisa e publica direto no app do aluno. Disponível no plano Studio.',
    },
  ];

  const previewStats = [
    { label: 'Faturamento do mês', value: 'R$ 9.200', change: '+14%', icon: Activity, color: 'from-indigo-500 to-violet-600' },
    { label: 'Alunos ativos', value: '24', change: '+3', icon: Users, color: 'from-violet-500 to-purple-600' },
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
              {navLinks.map(({ href, label }) => (
                <a key={href} href={href} className="hover:text-foreground transition-colors">
                  {label}
                </a>
              ))}
            </nav>
            <div className="flex items-center gap-2 sm:gap-3">
              <a href={APP_LOGIN_URL} className="hidden sm:block">
                <Button variant="outline" size="sm">
                  Acessar Painel
                </Button>
              </a>
              <button
                type="button"
                onClick={() => setMobileNavOpen((v) => !v)}
                className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
                aria-label={mobileNavOpen ? 'Fechar menu' : 'Abrir menu'}
                aria-expanded={mobileNavOpen}
              >
                {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {mobileNavOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl overflow-hidden"
              >
                <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col gap-1 text-sm font-medium text-muted-foreground">
                  {navLinks.map(({ href, label }) => (
                    <a
                      key={href}
                      href={href}
                      onClick={() => setMobileNavOpen(false)}
                      className="px-2 py-2.5 rounded-lg hover:bg-muted hover:text-foreground transition-colors"
                    >
                      {label}
                    </a>
                  ))}
                  <a href={APP_LOGIN_URL} onClick={() => setMobileNavOpen(false)} className="mt-1">
                    <Button variant="outline" size="sm" fullWidth>
                      Acessar Painel
                    </Button>
                  </a>
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
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
                <span className="text-xs text-primary font-medium">Feito para personal trainers</span>
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
                Gerencie alunos, monte treinos (ou gere com IA), acompanhe a evolução e as mensalidades — com app do
                aluno incluso, sem custo para quem treina.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-3"
              >
                <a href={APP_REGISTER_URL}>
                  <Button
                    size="lg"
                    iconRight={<ArrowRight className="w-5 h-5" />}
                    className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent border-0 hover:brightness-110"
                  >
                    Começar agora — {TRIAL_DAYS} dias grátis
                  </Button>
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-10 text-sm text-muted-foreground"
              >
                {['Sem cartão de crédito', 'App do aluno grátis', 'Funciona no celular'].map((text) => (
                  <span key={text} className="inline-flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    {text}
                  </span>
                ))}
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
                <p className="text-white/70 text-sm mb-1">Preview do dashboard · dados ilustrativos</p>
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

        <section id="beneficios" className="py-20 border-t border-border scroll-mt-20">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {benefits.map(({ icon: Icon, color, title, desc, plan }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i % 3) * 0.08 }}
                >
                  <GlassCard hover className="p-6 h-full">
                    <div className="flex items-start justify-between mb-5">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      {plan && <Badge variant="primary">{plan}</Badge>}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </GlassCard>
                </motion.div>
              ))}
            </div>

            <div className="mt-10 grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {[
                { icon: BarChart3, text: 'Dashboard com faturamento, retenção e pendências' },
                { icon: MessageCircle, text: 'Suporte por e-mail; prioritário no Pro e por WhatsApp no Studio' },
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

        <section id="app-do-aluno" className="py-20 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <Badge variant="accent" className="mb-4">
                Grátis para o aluno
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Um app que seu aluno vai querer abrir
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Treino do dia, descanso cronometrado e cargas registradas a cada série. O aluno vê a própria evolução e
                você acompanha tudo pelo painel — sem mensagem solta no WhatsApp.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {studentAppFeatures.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
                  <div className="w-9 h-9 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="planos" className="py-20 border-t border-border scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Planos para cada fase da sua assessoria</h2>
              <p className="text-muted-foreground">
                {TRIAL_DAYS} dias grátis, sem cartão. Alunos não pagam — apenas você assina.
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
                  <a href={APP_REGISTER_URL} className="block">
                    <Button
                      variant={p.popular ? 'primary' : 'outline'}
                      fullWidth
                      className={p.popular ? 'bg-gradient-to-r from-primary to-accent border-0' : ''}
                    >
                      {p.cta}
                    </Button>
                  </a>
                </GlassCard>
              ))}
            </div>

            <div className="rounded-2xl border border-border bg-card/30 p-4 sm:p-6">
              <p className="sm:hidden flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                Deslize para o lado para comparar todos os planos
                <ArrowRight className="w-3.5 h-3.5" />
              </p>
              <PlanComparisonTable highlightSlug="pro" />
            </div>
          </div>
        </section>

        <section id="faq" className="py-20 border-t border-border scroll-mt-20">
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
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      activeFaq === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-5 pb-4 pt-0 text-sm text-muted-foreground leading-relaxed border-t border-border">
                        {f.a}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 border-t border-border">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Pronto para transformar sua assessoria?</h2>
            <p className="text-muted-foreground mb-8">
              Nossa equipe está no WhatsApp ou em {CONTACT_EMAIL} para auxiliar com configuração e dúvidas
              comerciais.
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
              <a href={APP_REGISTER_URL}>
                <Button
                  size="lg"
                  iconRight={<ArrowRight className="w-4 h-4" />}
                  className="bg-gradient-to-r from-primary to-accent border-0 hover:brightness-110"
                >
                  Criar conta — {TRIAL_DAYS} dias grátis
                </Button>
              </a>
            </div>
          </div>
        </section>

        <footer className="border-t border-border py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Wordmark size="lg" className="max-w-[min(100%,280px)]" />
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="w-4 h-4" />
              {CONTACT_EMAIL}
            </a>
            <p className="text-xs text-muted-foreground">© 2026 AxxosFit. Todos os direitos reservados.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
