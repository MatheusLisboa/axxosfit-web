/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { useStore } from '../services/store';
import { Button, Input, Card } from './ui';

export default function PasswordResetScreen() {
  const { currentProfile, updatePassword, logout } = useStore();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);

  if (!currentProfile) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);

    if (newPassword.length < 6) {
      setErrorText('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword === 'axosfit') {
      setErrorText('Por favor, defina uma senha diferente da senha padrão "axosfit".');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorText('As senhas digitadas não coincidem.');
      return;
    }

    try {
      await updatePassword(currentProfile.id, newPassword);
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : 'Não foi possível atualizar a senha.');
    }
  };

  return (
    <div className="min-h-screen dark bg-background text-foreground flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <Card variant="elevated" padding="lg" className="w-full max-w-md animate-slide-up">
        
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center text-primary mb-4 border border-primary/20">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Primeiro Acesso</h2>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed max-w-sm">
            Olá, <span className="text-foreground font-semibold">{currentProfile.name}</span>! Configure uma senha personalizada para continuar.
          </p>
        </div>

        {errorText && (
          <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs mb-5 font-medium animate-fade-in">
            {errorText}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nova Senha"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Mínimo de 5 caracteres"
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />

          <Input
            label="Confirmar Nova Senha"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repita a nova senha"
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />

          <Button type="submit" className="w-full mt-2" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
            Salvar e Continuar
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-border text-center">
          <button 
            onClick={logout}
            className="text-xs text-muted-foreground hover:text-foreground transition cursor-pointer font-medium"
          >
            Sair e voltar ao login
          </button>
        </div>
      </Card>
    </div>
  );
}
