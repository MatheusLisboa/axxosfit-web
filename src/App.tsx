/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * UI shell exported from Figma Make (8rft0xtK5ogUf5dVpoEr6x).
 * Business logic: services/store, billing, Supabase — unchanged.
 */

import React, { useState, useEffect } from 'react';
import { toast, Toaster } from 'sonner';
import { StoreProvider, useStore } from './services/store';
import PasswordResetScreen from './components/PasswordResetScreen';
import RecoverPasswordScreen from './components/RecoverPasswordScreen';
import CheckoutPage from './components/CheckoutPage';
import AsaasUpgradePage from './components/AsaasUpgradePage';
import { TrainerFigmaApp } from './figma/TrainerFigmaApp';
import { SubscriptionProvider } from './hooks/useSubscription';
import { StudentFigmaApp } from './figma/StudentFigmaApp';
import { FigmaAuthBridge } from './figma/FigmaAuthBridge';
import { isSuperAdminProfile } from './lib/superadmin';
import type { RegisterTrainerInput } from './types';
import { resolveAuthInitialView, syncAuthPath } from './lib/pwa';

function resolveInitialScreen(): 'auth' | 'checkout' {
  if (typeof window === 'undefined') return 'auth';
  const path = window.location.pathname;
  if (path === '/checkout') return 'checkout';
  return 'auth';
}

function MainAppRouter() {
  const {
    currentProfile,
    logout,
    login,
    registerUser,
    requestPasswordReset,
    error: storeError,
    pendingUpgradePlan,
    clearPendingUpgrade,
    passwordRecoveryPending,
  } = useStore();
  const [screen, setScreen] = useState<'auth' | 'checkout'>(resolveInitialScreen);
  const [authInitialView, setAuthInitialView] = useState<'login' | 'register'>(() =>
    typeof window !== 'undefined' ? resolveAuthInitialView(window.location.pathname) : 'login'
  );
  const [chosenPlan, setChosenPlan] = useState<'starter' | 'pro' | 'studio'>('starter');

  useEffect(() => {
    try {
      const path = window.location.pathname;
      if (path === '/checkout') {
        setScreen('checkout');
        return;
      }

      setScreen('auth');
      setAuthInitialView(resolveAuthInitialView(path));
      syncAuthPath(path);
      const upgrade = sessionStorage.getItem('axosfit_upgrade_plan');
      if (upgrade === 'starter' || upgrade === 'pro' || upgrade === 'studio') {
        setChosenPlan(upgrade);
      }
    } catch {
      // noop
    }
  }, []);

  useEffect(() => {
    if (!currentProfile) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get('asaas_payment') !== 'success') return;

    void (async () => {
      try {
        const { BillingService, getStoredAsaasSubscriptionId } = await import('./services/billing');
        const asaasSubFromUrl = params.get('asaas_sub') || undefined;
        const asaasSubId =
          asaasSubFromUrl || getStoredAsaasSubscriptionId(currentProfile.id);

        if (asaasSubFromUrl && currentProfile.id) {
          try {
            localStorage.setItem(`axosfit_asaas_sub_${currentProfile.id}`, asaasSubFromUrl);
          } catch {
            // noop
          }
        }

        const result = await BillingService.syncAsaasPayment(
          currentProfile.id,
          asaasSubId,
          { retries: 5, delayMs: 2500 }
        );

        window.dispatchEvent(new Event('axosfit:subscription-refresh'));

        if (result.synced) {
          toast.success('Pagamento confirmado!', {
            description: 'Seu plano foi ativado com sucesso.',
          });
        } else {
          toast.info('Pagamento em processamento', {
            description:
              result.message ||
              'O Asaas ainda está confirmando. Use Configurações → Meu Plano → Verificar pagamento em instantes.',
          });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erro ao sincronizar pagamento.';
        toast.error('Pagamento recebido, mas falhou a sincronização', { description: msg });
      } finally {
        const url = new URL(window.location.href);
        url.searchParams.delete('asaas_payment');
        url.searchParams.delete('asaas_sub');
        window.history.replaceState({}, '', url.pathname + url.search);
      }
    })();
  }, [currentProfile]);

  const goToAuth = (view: 'login' | 'register' = 'login') => {
    setAuthInitialView(view);
    setScreen('auth');
    window.history.replaceState({}, '', view === 'register' ? '/register' : '/login');
  };

  if (passwordRecoveryPending) {
    return (
      <>
        <Toaster theme="dark" position="top-right" />
        <RecoverPasswordScreen />
      </>
    );
  }

  if (currentProfile) {
    if (currentProfile.is_first_login) {
      return <PasswordResetScreen />;
    }

    if (currentProfile.role === 'trainer' || currentProfile.role === 'admin') {
      const superAdmin = isSuperAdminProfile(currentProfile);

      if (!superAdmin && pendingUpgradePlan) {
        return (
          <AsaasUpgradePage
            initialPlanSlug={pendingUpgradePlan}
            onCancel={() => {
              clearPendingUpgrade();
            }}
            onSuccess={() => {
              clearPendingUpgrade();
              window.dispatchEvent(new Event('axosfit:subscription-refresh'));
            }}
          />
        );
      }

      return (
        <SubscriptionProvider trainerId={currentProfile.id}>
          <TrainerFigmaApp
            userName={currentProfile.name?.trim() || currentProfile.email?.split('@')[0] || 'Personal'}
            userAvatar={currentProfile.avatar_url}
            planBadge={superAdmin ? 'Superadmin' : undefined}
            isSuperAdmin={superAdmin}
            onLogout={logout}
          />
        </SubscriptionProvider>
      );
    }

    return (
      <StudentFigmaApp
        userName={currentProfile.name || 'Aluno'}
        userAvatar={currentProfile.avatar_url}
        onLogout={logout}
      />
    );
  }

  if (screen === 'checkout') {
    return (
      <CheckoutPage
        initialPlanSlug={chosenPlan}
        onBack={() => goToAuth('login')}
        onPaymentSuccess={() => {
          window.dispatchEvent(new Event('axosfit:subscription-refresh'));
        }}
      />
    );
  }

  return (
    <>
      <Toaster theme="dark" position="top-right" />
      <FigmaAuthBridge
        initialView={authInitialView}
        onRegisterSuccess={async (data: RegisterTrainerInput) => {
          const result = await registerUser(data);
          if (!result.success) {
            throw new Error(result.message || 'Não foi possível criar a conta.');
          }
          const loggedIn = await login(data.email, data.password);
          if (!loggedIn) {
            throw new Error(
              'Conta criada. Confirme o e-mail no Supabase (se exigido) e faça login.'
            );
          }
        }}
        onLoginSuccess={async ({ email, password }) => {
          const success = await login(email, password);
          if (!success) {
            const msg =
              localStorage.getItem('axosfit_error') ||
              storeError ||
              'Credenciais inválidas. Verifique e-mail e senha.';
            throw new Error(msg);
          }
        }}
        onForgotPassword={async (email) => {
          const result = await requestPasswordReset(email);
          if (!result.success) {
            throw new Error(result.message || 'Não foi possível enviar o e-mail de recuperação.');
          }
        }}
      />
    </>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <MainAppRouter />
    </StoreProvider>
  );
}
