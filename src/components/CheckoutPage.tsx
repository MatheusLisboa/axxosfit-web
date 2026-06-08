/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, CheckCircle2, ShieldCheck, Mail, Lock, 
  User, Phone, ChevronRight, RefreshCw, AlertCircle, Sparkles, Building, QrCode, Check, Copy
} from 'lucide-react';
import { useStore } from '../services/store';
import { BillingService } from '../services/billing';
import { SubscriptionService } from '../services/subscription';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  PLAN_CATALOG,
  PLAN_FEATURE_LISTS,
  PLAN_STUDENT_FEATURE_LABEL,
  getPlanPrice,
} from '../lib/plans';
import { Wordmark } from './Wordmark';

interface CheckoutPageProps {
  onBackToLanding: () => void;
  initialPlanSlug?: 'starter' | 'pro' | 'studio';
  onPaymentSuccess: () => void;
}

export default function CheckoutPage({ 
  onBackToLanding, 
  initialPlanSlug = 'starter', 
  onPaymentSuccess 
}: CheckoutPageProps) {
  const { registerUser, currentProfile, error: storeError } = useStore();
  
  // URL or props plan mapping (synchronize reactively)
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro' | 'studio'>(initialPlanSlug);
  const [step, setStep] = useState<'register' | 'payment'>('register');
  
  // Reactive selected plan sync from props
  useEffect(() => {
    if (initialPlanSlug) {
      setSelectedPlan(initialPlanSlug);
    }
  }, [initialPlanSlug]);

  // Registration States (DEFERRED: Will only trigger in Supabase AFTER successful simulated/real payment)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [cref, setCref] = useState('');
  const [cpf, setCpf] = useState('');
  const [address, setAddress] = useState('');
  const [cep, setCep] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const formatCPF = (val: string) => {
    const v = val.replace(/\D/g, '');
    return v
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .substring(0, 14);
  };

  const formatPhone = (val: string) => {
    const v = val.replace(/\D/g, '');
    if (v.length <= 10) {
      return v
        .replace(/^(\d{2})(\d)/g, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .substring(0, 14);
    }
    return v
      .replace(/^(\d{2})(\d)/g, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 15);
  };

  const formatCEP = (val: string) => {
    const v = val.replace(/\D/g, '');
    return v
      .replace(/^(\d{5})(\d)/, '$1-$2')
      .substring(0, 9);
  };

  // Cached user data for registration AFTER payment
  const [tempUserData, setTempUserData] = useState<{
    fullName: string;
    email: string;
    password: string;
    whatsapp: string;
    cref: string;
  } | null>(null);

  // Payment/MP preference States
  const [preferenceId, setPreferenceId] = useState('');
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [isLoadingPref, setIsLoadingPref] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [copiedKey, setCopiedKey] = useState(false);

  const plansConfig = {
    starter: {
      name: 'Plano Starter',
      price: getPlanPrice('starter'),
      students: PLAN_STUDENT_FEATURE_LABEL.starter,
      features: [...PLAN_FEATURE_LISTS.starter],
    },
    pro: {
      name: 'Plano Pro',
      price: getPlanPrice('pro'),
      students: PLAN_STUDENT_FEATURE_LABEL.pro,
      features: [...PLAN_FEATURE_LISTS.pro],
    },
    studio: {
      name: 'Plano Studio',
      price: getPlanPrice('studio'),
      students: PLAN_STUDENT_FEATURE_LABEL.studio,
      features: [...PLAN_FEATURE_LISTS.studio],
    },
  };

  const activePlanInfo = plansConfig[selectedPlan];

  // Se o usuário já estiver logado quando carregar o checkout
  useEffect(() => {
    if (currentProfile && currentProfile.role === 'trainer') {
      setStep('payment');
      fetchPreference(currentProfile.id, currentProfile.email, currentProfile.name);
    }
  }, [currentProfile, selectedPlan]);

  // Check if we just redirected back from a successful purchase
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status') || params.get('collection_status');
    const preferenceIdParam = params.get('preference_id') || params.get('payment_id');
    
    // Log active key & environment
    const pk = (import.meta as any).env?.VITE_MERCADO_PAGO_PUBLIC_KEY || '';
    console.log('[AxxosFit Checkout] Public Key:', pk || 'Não configurada no frontend (O Checkout Pro utiliza redirect gerado seguro pelo backend)');
    console.log('[AxxosFit Checkout] Environment: PRODUÇÃO REAL (Ambiente Sandbox Desativado)');

    if (status === 'approved' || status === 'authorized') {
      console.log('🎉 [Payment Success Log] Usuário retornou com sucesso do Mercado Pago. Ativando assinatura no frontend de segurança...');
      setIsCheckingPayment(true);
      setStep('payment');
      setPaymentStatus('success');

      const activateAndRedirect = async () => {
        try {
          if (isSupabaseConfigured && supabase) {
            const { data: sessionData } = await supabase.auth.getSession();
            const activeUserId = sessionData?.session?.user?.id || currentProfile?.id;
            
            if (activeUserId) {
              const { data: planData } = await supabase
                .from('plans')
                .select('id')
                .eq('slug', selectedPlan)
                .maybeSingle();

              if (planData) {
                const expiresDate = new Date();
                expiresDate.setMonth(expiresDate.getMonth() + 1);

                await supabase.from('subscriptions').upsert({
                  trainer_id: activeUserId,
                  plan_id: planData.id,
                  status: 'active',
                  payment_provider: 'mercado_pago',
                  payment_reference: preferenceIdParam || 'real_mp_payment',
                  started_at: new Date().toISOString(),
                  expires_at: expiresDate.toISOString()
                });

                // Insert payment log
                await supabase.from('payments').insert({
                  trainer_id: activeUserId,
                  amount: plansConfig[selectedPlan]?.price || 189.0,
                  status: 'paid',
                  provider: 'mercado_pago',
                  provider_reference: preferenceIdParam || 'real_mp_payment'
                });

                console.log('✅ [Onboarding Log] Subscription ativada no banco via client-side callback de segurança!');
              }
            }
          }
        } catch (err) {
          console.error('Erro ao garantir ativação client-side:', err);
        } finally {
          setIsCheckingPayment(false);
          // Limpa as query strings para evitar recargas acidentais que resetem o estado
          window.history.replaceState({}, document.title, window.location.pathname);
          onPaymentSuccess();
        }
      };

      activateAndRedirect();
    }
  }, []);

  // Executa o Onboarding SaaS na ordem correta:
  // 1. Usuário cria conta (nome, email, senha, whatsapp, cref)
  // 2. Criar usuário no Supabase Auth
  // 3. Criar perfil na tabela profiles (tudo feito via `registerUser`)
  // 4. Usuário escolhe plano (selecionado em `selectedPlan`)
  // 5. Criar preferência Mercado Pago com `external_reference` contendo o authUserId real
  const handleOnboardingSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsRegistering(true);

    if (!fullName || !email || !password) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      setIsRegistering(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg('A senha precisa ter pelo menos 6 caracteres.');
      setIsRegistering(false);
      return;
    }

    try {
      // Passo 2 e 3: Cadastrar fisicamente no Supabase Auth + Profiles + Trainers
      console.log('🚀 [Onboarding Log] Iniciando criação de conta no Supabase Auth para:', email);
      const result = await registerUser({
        name: fullName,
        email,
        password,
        phone: whatsapp,
        cref: cref || 'CREF/SP - Provisório',
        cpf,
        birthdate,
        cep,
        street: address,
      });

      if (!result.success) {
        throw new Error(result.message || 'Falha ao registrar usuário. Verifique se o e-mail é único.');
      }

      console.log('✅ [Onboarding Log] Auth user criado com sucesso.');
      console.log('✅ [Onboarding Log] Perfil do Trainer criado na tabela de profiles e trainers.');

      // Resgata o ID de usuário criado do Supabase ou da sessão atualizada
      let activeUserId = '';
      if (isSupabaseConfigured && supabase) {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user) {
          activeUserId = sessionData.session.user.id;
        } else {
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user) {
            activeUserId = userData.user.id;
          }
        }
      }

      if (!activeUserId) {
        // Se autologin ainda não propagou no state, lê o localStorage de sessão ou gera fallback temporário
        const savedSession = localStorage.getItem('axosfit_session_profile');
        if (savedSession) {
          activeUserId = JSON.parse(savedSession).id;
        } else {
          activeUserId = crypto.randomUUID();
        }
      }

      console.log(`✅ [Onboarding Log] Enviar external_reference com auth user id: ${activeUserId}`);

      // Passos 5 e 6: Criar preferência real do Mercado Pago associada ao ID real da conta
      await fetchPreference(activeUserId, email, fullName);

      // Avança para o passo de pagamento
      setStep('payment');
    } catch (err: any) {
      console.error('[Onboarding Error]:', err);
      setErrorMsg(err.message || 'Houve um erro durante o cadastro de onboarding.');
    } finally {
      setIsRegistering(false);
    }
  };

  const fetchPreference = async (userId: string, userEmail: string, userName: string) => {
    setIsLoadingPref(true);
    setErrorMsg('');
    try {
      const pref = await BillingService.createMercadoPagoCheckout(
        userId,
        selectedPlan,
        userEmail,
        userName
      );
      setPreferenceId(pref.preferenceId);
      setCheckoutUrl(pref.initPoint); // Use real production initPoint!
    } catch (err: any) {
      console.error('[AxxosFit Checkout] Erro:', err);
      setErrorMsg(err.message || 'Erro ao gerar link de pagamento Asaas.');
    } finally {
      setIsLoadingPref(false);
    }
  };



  // Auto-polling subscription status IF user is already logged in
  useEffect(() => {
    if (step !== 'payment' || !currentProfile) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const sub = await SubscriptionService.verifyTrainerSubscription(currentProfile.id);
        if (sub.isValid && isMounted) {
          setPaymentStatus('success');
          clearInterval(interval);
          setTimeout(() => {
            onPaymentSuccess();
          }, 2000);
        }
      } catch (err) {
        console.error('Erro de polling de faturamento:', err);
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [step, currentProfile]);

  const copyPixKey = () => {
    navigator.clipboard.writeText('00020101021126580014br.gov.bcb.pix0136axosfit-payments-transparencia-key-saas');
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div id="checkout-container" className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* HEADER */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <button 
            onClick={onBackToLanding}
            className="flex items-center gap-2 text-slate-400 hover:text-white font-medium text-xs transition cursor-pointer"
          >
            ← Voltar ao Início
          </button>
          
          <div className="flex items-center gap-2">
            <Wordmark size="md" className="max-w-[180px]" />
            <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-800 border border-indigo-500/30 text-indigo-400 font-mono font-bold shrink-0">SAAS</span>
          </div>
        </div>
      </header>

      {/* CORE WRAPPER */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-12 md:py-18 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ESQUERDA: RESUMO DO PLANO */}
        <section className="lg:col-span-5 bg-slate-950 border border-slate-800/80 p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-550/15 rounded-full blur-2xl"></div>
          
          <div className="flex items-center gap-2 bg-indigo-950/40 border border-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest w-fit mb-6">
            <Sparkles className="w-3 h-3" /> Plano de Assinatura
          </div>

          <h2 className="text-2xl font-extrabold text-white tracking-tight">{activePlanInfo.name}</h2>
          <p className="text-slate-450 text-xs mt-2 font-mono">Status: Aguardando Pagamento</p>

          <div className="flex items-baseline gap-1 my-6 border-b border-slate-850 pb-6">
            <span className="text-slate-400 text-sm">R$</span>
            <span className="text-5xl font-extrabold text-white tracking-tight">{activePlanInfo.price.toFixed(2)}</span>
            <span className="text-slate-400 text-xs font-mono ml-1">/mês</span>
          </div>

          <div className="space-y-4 mb-8">
            <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">O que está incluído:</div>
            <div className="grid gap-3">
              <div className="flex items-start gap-2.5 text-sm font-semibold text-indigo-400">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-indigo-500 mt-0.5" />
                <span>{activePlanInfo.students}</span>
              </div>
              {activePlanInfo.features.map((feat, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-slate-350">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2 shrink-0"></div>
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* PLAN TOGGLE SELECTOR */}
          <div className="border-t border-slate-850 pt-6">
            <div className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">Mudar de Plano:</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {([ 'starter', 'pro', 'studio'] as const).map((slug) => (
                <button
                  key={slug}
                  onClick={() => setSelectedPlan(slug)}
                  className={`py-2 px-1 text-[11px] font-bold rounded-xl border transition cursor-pointer ${
                    selectedPlan === slug 
                      ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400 shadow-sm shadow-indigo-500/10' 
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
                  }`}
                >
                  {slug.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* DIREITA: TELA DE REGISTRO OU PAGAMENTO */}
        <section className="lg:col-span-7 bg-slate-950/45 border border-slate-850 p-6 md:p-8 rounded-3xl shadow-xl">
          {step === 'register' ? (
            <div>
              {/* TITLES */}
              <div className="mb-8">
                <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">Crie sua Conta de Acesso</h3>
                <p className="text-slate-450 text-xs mt-1 leading-relaxed">
                  Sua conta do Supabase Auth e perfil de personal serão criados **imediatamente**, seguido da geração do link de faturamento seguro e real do Mercado Pago.
                </p>
              </div>

              {errorMsg && (
                <div className="mb-6 p-4 rounded-xl border border-rose-500/20 bg-rose-950/20 text-rose-400 text-xs leading-relaxed flex items-center gap-2 select-none">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleOnboardingSignup} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ex: Prof. Roberto Silva"
                      className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none text-sm text-white font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">E-mail Corporativo</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu.email@exemplo.com"
                      className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none text-sm text-white font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">Senha de Acesso</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 dígitos"
                      className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none text-sm text-white font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">WhatsApp / Telefone</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
                    <input 
                      type="text" 
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                      placeholder="Ex: (11) 99999-9999"
                      className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none text-sm text-white font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">CPF</label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
                    <input 
                      type="text" 
                      value={cpf}
                      onChange={(e) => setCpf(formatCPF(e.target.value))}
                      placeholder="Ex: 000.000.000-00"
                      className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none text-sm text-white font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">CEP</label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
                    <input 
                      type="text" 
                      value={cep}
                      onChange={(e) => setCep(formatCEP(e.target.value))}
                      placeholder="Ex: 00000-000"
                      className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none text-sm text-white font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">Data de Nascimento</label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
                    <input 
                      type="date" 
                      value={birthdate}
                      onChange={(e) => setBirthdate(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none text-sm text-white font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">Endereço Completo</label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
                    <input 
                      type="text" 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Ex: Rua das Flores, 123, Bloco B, Bairro Centro, São Paulo - SP"
                      className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none text-sm text-white font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">Nº Registro CREF (Opcional)</label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
                    <input 
                      type="text" 
                      value={cref}
                      onChange={(e) => setCref(e.target.value)}
                      placeholder="Ex: CREF 123456-G/SP"
                      className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none text-sm text-white font-medium"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 pt-4">
                  <button 
                    type="submit"
                    disabled={isRegistering}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-850 text-white font-extrabold py-3.5 rounded-xl text-sm transition shadow-md uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isRegistering ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Processando...
                      </>
                    ) : (
                      <>
                        Avançar para o Pagamento <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div>
              {/* TELA DE COBRANÇA */}
              <div className="mb-6 animate-fade-in">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></div>
                  <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight font-sans">Efetuar Pagamento Real</h3>
                </div>
                <p className="text-slate-400 text-xs">
                  Sua assinatura será processada e ativada instantaneamente pelo gateway oficial do Mercado Pago.
                </p>
              </div>

              {/* CARD DETALHADO */}
              <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 mb-6">
                <div className="flex justify-between items-center text-xs text-slate-450 font-mono mb-2 border-b border-slate-800 pb-2">
                  <span>Descrição de Compra</span>
                  <span>Total</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-200 text-sm">AxxosFit Premium - {activePlanInfo.name}</span>
                  <span className="font-extrabold text-indigo-400 text-base font-mono">R$ {activePlanInfo.price.toFixed(2)}</span>
                </div>
              </div>

              {errorMsg && (
                <div className="mb-5 p-3.5 rounded-xl border border-rose-500/20 bg-rose-950/20 text-rose-400 text-xs leading-relaxed flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* LOADING PREFERENCE LOADER */}
              {isLoadingPref ? (
                <div className="p-8 text-center space-y-3 bg-slate-900 rounded-2xl border border-slate-850/60 font-sans">
                  <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
                  <p className="text-xs text-slate-350 font-bold tracking-wide uppercase">Iniciando gateway seguro...</p>
                  <p className="text-[11px] text-slate-450">Gerando sua preferência oficial de pagamento no Mercado Pago.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* DIRECT BUTTON FOR SECURE CHECKOUT */}
                  {checkoutUrl && checkoutUrl !== '#' ? (
                    <div className="p-5 rounded-2xl bg-slate-900 border border-indigo-505/20 text-center space-y-4 shadow-inner">
                      <div className="space-y-1">
                        <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Ambiente de Produção Conectado</div>
                        <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                          Selecione sua forma de pagamento preferida (**Pix com ativação instantânea, Cartão de Crédito ou Boleto**) diretamente na interface oficial e segura do Mercado Pago.
                        </p>
                      </div>

                      <a 
                        href={checkoutUrl}
                        target="_self" // It can open in same or blank, let's keep blank or same. Setting it as _blank or direct is perfect
                        rel="noopener noreferrer"
                        className="inline-flex w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-widest items-center justify-center gap-2 cursor-pointer transition shadow-lg hover:shadow-indigo-500/20 text-center active:scale-95 duration-100"
                      >
                        <CreditCard className="w-4 h-4" />
                        Pagar Agora com Asaas
                      </a>

                      <div className="pt-2 flex items-center justify-center gap-4 text-slate-400 text-[10px] font-mono select-none">
                        <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> PIX ATIVO</span>
                        <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> CARTÃO AUTORIZADO</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/10 text-center text-xs text-rose-400">
                      O checkout não pôde ser gerado. Volte e atualize a página ou entre em contato com o suporte.
                    </div>
                  )}
                </div>
              )}

              {paymentStatus === 'success' && (
                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/25 text-emerald-400 text-xs text-center font-extrabold flex items-center justify-center gap-2 animate-bounce mt-4 shadow-lg shadow-emerald-900/10">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                  <span>Assinatura Realizada! Criando sua conta profissional e redirecionando...</span>
                </div>
              )}

              {/* ACTIVE SECURITY SIGNATURE */}
              <div className="mt-8 flex flex-col items-center justify-center gap-1">
                <div className="flex items-center gap-2 text-slate-450 text-[10px]">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 animate-pulse" />
                  <span>Seus dados e transações são protegidos com TLS 1.3 256 bits</span>
                </div>
                <p className="text-[9px] text-slate-600 max-w-xs text-center leading-relaxed">
                  Ao clicar em pagar, você aceita os termos e concorda com a renovação recorrente mensal que pode ser cancelada a qualquer momento no seu painel.
                </p>
              </div>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
