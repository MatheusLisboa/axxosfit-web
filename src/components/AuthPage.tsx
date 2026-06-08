/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, Lock, ArrowLeft, ArrowRight, Zap, Shield, BarChart3 } from 'lucide-react';
import { useStore } from '../services/store';
import { Button, Input } from './ui';
import { Wordmark } from './Wordmark';

interface AuthPageProps {
  onBack: () => void;
}

const features = [
  { icon: BarChart3, text: 'Dashboard com analytics em tempo real' },
  { icon: Zap, text: 'IA para criação de treinos personalizados' },
  { icon: Shield, text: 'Segurança e privacidade dos seus dados' },
];

export default function AuthPage({ onBack }: AuthPageProps) {
  const { login, error: storeError } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);
  const [flashMessage, setFlashMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFlashMessage(null);
    setIsLoadingLogin(true);

    if (!email || !password) {
      setFlashMessage({ text: 'Por favor, insira e-mail e senha.', type: 'error' });
      setIsLoadingLogin(false);
      return;
    }

    const success = await login(email, password);
    setIsLoadingLogin(false);

    if (success) {
      setFlashMessage({ text: 'Bem-vindo de volta!', type: 'success' });
    } else {
      setTimeout(() => {
        const currentError = localStorage.getItem('axosfit_error') || storeError;
        setFlashMessage({
          text: currentError || 'Credenciais inválidas. Verifique seu e-mail, senha e papel selecionado.',
          type: 'error',
        });
      }, 50);
    }
  };

  return (
    <div className="min-h-screen flex dark bg-background text-foreground">
      {/* Painel esquerdo — Figma Make */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a14] via-[#0d0d20] to-[#0a0a14]" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-accent/15 rounded-full blur-3xl" />
        </div>
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Wordmark size="lg" className="max-w-[min(100%,260px)]" />
          <div className="space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-xs text-primary font-medium">Plataforma #1 para Fitness Profissionais</span>
              </div>
              <h1 className="text-4xl font-bold text-white leading-tight mb-4">
                Eleve seu negócio
                <br />
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  fitness ao próximo nível
                </span>
              </h1>
              <p className="text-lg text-white/50 leading-relaxed">
                Gerencie alunos, crie treinos personalizados e acompanhe resultados com tecnologia de ponta.
              </p>
            </div>
            <div className="space-y-4">
              {features.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-white/70 text-sm">{text}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-white/30 text-xs">© 2026 AxxosFit. Todos os direitos reservados.</p>
        </div>
      </div>

      {/* Painel direito — formulário (Supabase Auth inalterado) */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md animate-slide-up">
          <div className="mb-8 lg:hidden">
            <Wordmark size="lg" className="max-w-[min(100%,240px)]" />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">Bem-vindo de volta</h2>
            <p className="text-muted-foreground text-sm">Entre na sua conta para continuar</p>
          </div>

          {(flashMessage || storeError) && (
            <div
              className={`p-4 rounded-xl border text-xs leading-relaxed mb-6 animate-fade-in ${
                flashMessage?.type === 'success'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
              }`}
            >
              {flashMessage?.text || storeError}
            </div>
          )}


          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />
            <Input
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Button type="submit" fullWidth size="lg" loading={isLoadingLogin} rightIcon={<ArrowRight className="w-4 h-4" />}>
              {isLoadingLogin ? 'Autenticando...' : 'Entrar'}
            </Button>

            <div className="relative flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">ou continue com</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <Button
              type="button"
              variant="outline"
              fullWidth
              size="lg"
              disabled
              title="Login social disponível em breve"
              leftIcon={
                <svg viewBox="0 0 24 24" className="w-4 h-4">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              }
            >
              Entrar com Google
            </Button>
          </form>

          <div className="mt-8 pt-4 border-t border-border text-center">
            <button
              onClick={onBack}
              className="text-xs text-muted-foreground hover:text-foreground transition cursor-pointer font-medium inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar para o site
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
