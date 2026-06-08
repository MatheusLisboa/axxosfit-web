import { useState, type FormEvent } from 'react';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../services/store';
import { Button } from '../figma/components/ui/Button';
import { Input } from '../figma/components/ui/Input';
import { GlassCard } from '../figma/components/ui/GlassCard';
import { Wordmark } from './Wordmark';

export default function RecoverPasswordScreen() {
  const { completePasswordRecovery, clearPasswordRecovery, logout } = useStore();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorText(null);

    if (newPassword.length < 6) {
      setErrorText('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorText('As senhas digitadas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const result = await completePasswordRecovery(newPassword);
      if (!result.success) {
        setErrorText(result.message || 'Não foi possível redefinir a senha.');
        return;
      }
      toast.success('Senha redefinida!', {
        description: 'Você já pode usar a nova senha na próxima vez que entrar.',
      });
    } catch {
      setErrorText('Erro ao redefinir a senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen dark bg-background text-foreground flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <Wordmark size="md" />
        </div>

        <GlassCard className="p-6 sm:p-8">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center text-primary mb-4 border border-primary/20">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Nova senha</h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-sm">
              Defina uma nova senha para acessar sua conta AxxosFit.
            </p>
          </div>

          {errorText && (
            <p className="p-3 mb-5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
              {errorText}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nova senha"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              icon={<Lock className="w-4 h-4" />}
              fullWidth
              required
            />
            <Input
              label="Confirmar nova senha"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha"
              icon={<Lock className="w-4 h-4" />}
              fullWidth
              required
            />
            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
              iconRight={<ArrowRight className="w-4 h-4" />}
            >
              Salvar nova senha
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-border flex flex-col gap-2 text-center">
            <button
              type="button"
              onClick={() => {
                clearPasswordRecovery();
                void logout();
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar e voltar ao login
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
