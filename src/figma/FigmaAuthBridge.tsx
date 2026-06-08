import { useState, useEffect, type FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Eye, EyeOff, Mail, Lock, User, ArrowRight, Zap, Shield, BarChart3, Check, ArrowLeft,
  CreditCard, Phone, MapPin, Calendar,
} from "lucide-react";
import type { RegisterTrainerInput } from "../types";
import { maskCPF, maskPhone, maskCEP, maskCREF, maskDateBR, dateBRToISO } from "../lib/masks";
import { Button } from "./components/ui/Button";
import { Input } from "./components/ui/Input";
import { Wordmark } from "../components/Wordmark";

type AuthView = "login" | "register" | "forgot";

const features = [
  { icon: BarChart3, text: "Dashboard com analytics em tempo real" },
  { icon: Zap, text: "IA para criação de treinos personalizados" },
  { icon: Shield, text: "Segurança e privacidade dos seus dados" },
];

export interface FigmaAuthBridgeProps {
  onBack?: () => void;
  initialView?: AuthView;
  onLoginSuccess: (params: {
    email: string;
    password: string;
  }) => Promise<void>;
  onRegisterSuccess?: (data: RegisterTrainerInput) => Promise<void>;
  onForgotPassword?: (email: string) => Promise<void>;
}

export function FigmaAuthBridge({
  onBack,
  initialView = "login",
  onLoginSuccess,
  onRegisterSuccess,
  onForgotPassword,
}: FigmaAuthBridgeProps) {
  const [view, setView] = useState<AuthView>(initialView);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [cpf, setCpf] = useState("");
  const [cref, setCref] = useState("");
  const [phone, setPhone] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await onLoginSuccess({ email, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!onRegisterSuccess) {
      await handleLogin();
      return;
    }
    if (!name.trim() || !email.trim() || !password || !cref.trim()) {
      setError("Preencha nome, e-mail, senha e CREF.");
      return;
    }
    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onRegisterSuccess({
        name: name.trim(),
        email: email.trim(),
        password,
        cpf,
        cref,
        phone,
        birthdate: birthdate.includes("/") ? dateBRToISO(birthdate) : birthdate,
        cep,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar conta.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (view === "forgot") {
      if (!email.trim()) {
        setError("Informe seu e-mail.");
        return;
      }
      if (!onForgotPassword) {
        setError("Recuperação de senha indisponível.");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        await onForgotPassword(email.trim());
        setForgotSent(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível enviar o e-mail.");
      } finally {
        setLoading(false);
      }
      return;
    }
    if (view === "register") {
      await handleRegister();
      return;
    }
    await handleLogin();
  };

  return (
    <div className="min-h-screen flex dark bg-background text-foreground">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a14] via-[#0d0d20] to-[#0a0a14]" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-accent/15 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-primary/10 rounded-full blur-2xl" />
        </div>
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
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

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Wordmark size="lg" className="max-w-[min(100%,240px)]" />
          </div>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          )}

          <AnimatePresence mode="wait">
            {view === "login" && (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Bem-vindo de volta</h2>
                  <p className="text-muted-foreground text-sm">Entre na sua conta para continuar</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="E-mail"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    icon={<Mail className="w-4 h-4" />}
                    fullWidth
                    required
                  />
                  <Input
                    label="Senha"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    icon={<Lock className="w-4 h-4" />}
                    iconRight={
                      <button type="button" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                    fullWidth
                    required
                  />

                  {error && (
                    <p className="text-sm text-destructive text-center">{error}</p>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setView("forgot")}
                      className="text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    fullWidth
                    size="lg"
                    loading={loading}
                    iconRight={<ArrowRight className="w-4 h-4" />}
                  >
                    Entrar
                  </Button>
                </form>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                  Não tem conta?{" "}
                  <button
                    onClick={() => setView("register")}
                    className="text-primary font-medium hover:text-primary/80 transition-colors"
                  >
                    Criar conta gratuita
                  </button>
                </p>
              </motion.div>
            )}

            {view === "register" && (
              <motion.div
                key="register"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Crie sua conta</h2>
                  <p className="text-muted-foreground text-sm">14 dias grátis, sem cartão de crédito</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                  <Input
                    label="Nome completo"
                    type="text"
                    placeholder="João Silva"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    icon={<User className="w-4 h-4" />}
                    fullWidth
                    required
                  />
                  <Input
                    label="E-mail profissional"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    icon={<Mail className="w-4 h-4" />}
                    fullWidth
                    required
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="CPF"
                      value={cpf}
                      onChange={e => setCpf(maskCPF(e.target.value))}
                      placeholder="000.000.000-00"
                      icon={<CreditCard className="w-4 h-4" />}
                      fullWidth
                    />
                    <Input
                      label="CREF *"
                      value={cref}
                      onChange={e => setCref(maskCREF(e.target.value))}
                      placeholder="CREF 000000-G/UF"
                      fullWidth
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Telefone"
                      value={phone}
                      onChange={e => setPhone(maskPhone(e.target.value))}
                      placeholder="(11) 99999-9999"
                      icon={<Phone className="w-4 h-4" />}
                      fullWidth
                    />
                    <Input
                      label="Data de nascimento"
                      value={birthdate}
                      onChange={e => setBirthdate(maskDateBR(e.target.value))}
                      placeholder="dd/mm/aaaa"
                      icon={<Calendar className="w-4 h-4" />}
                      fullWidth
                    />
                  </div>
                  <Input
                    label="CEP"
                    value={cep}
                    onChange={e => setCep(maskCEP(e.target.value))}
                    placeholder="00000-000"
                    icon={<MapPin className="w-4 h-4" />}
                    fullWidth
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <Input
                        label="Endereço"
                        value={street}
                        onChange={e => setStreet(e.target.value)}
                        fullWidth
                      />
                    </div>
                    <Input label="Nº" value={number} onChange={e => setNumber(e.target.value)} fullWidth />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Bairro"
                      value={neighborhood}
                      onChange={e => setNeighborhood(e.target.value)}
                      fullWidth
                    />
                    <Input
                      label="Complemento"
                      value={complement}
                      onChange={e => setComplement(e.target.value)}
                      fullWidth
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Cidade" value={city} onChange={e => setCity(e.target.value)} fullWidth />
                    <Input
                      label="UF"
                      value={state}
                      onChange={e => setState(e.target.value.toUpperCase().slice(0, 2))}
                      placeholder="SP"
                      fullWidth
                    />
                  </div>
                  <Input
                    label="Senha"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    icon={<Lock className="w-4 h-4" />}
                    iconRight={
                      <button type="button" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                    hint="14 dias grátis no plano Starter — sem cartão"
                    fullWidth
                    required
                  />

                  {error && (
                    <p className="text-sm text-destructive text-center">{error}</p>
                  )}

                  <Button
                    type="submit"
                    fullWidth
                    size="lg"
                    loading={loading}
                    iconRight={<ArrowRight className="w-4 h-4" />}
                  >
                    Criar conta grátis
                  </Button>
                </form>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                  Já tem conta?{" "}
                  <button onClick={() => setView("login")} className="text-primary font-medium hover:text-primary/80">
                    Entrar
                  </button>
                </p>
              </motion.div>
            )}

            {view === "forgot" && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
              >
                {forgotSent ? (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
                      <Check className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">E-mail enviado!</h2>
                    <p className="text-muted-foreground text-sm">
                      Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                    </p>
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={() => { setView("login"); setForgotSent(false); }}
                    >
                      Voltar ao login
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-foreground mb-2">Recuperar senha</h2>
                      <p className="text-muted-foreground text-sm">
                        Enviaremos um link de recuperação para seu e-mail
                      </p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <Input
                        label="E-mail"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        icon={<Mail className="w-4 h-4" />}
                        fullWidth
                        required
                      />
                      {error && (
                        <p className="text-sm text-destructive text-center">{error}</p>
                      )}
                      <Button type="submit" fullWidth size="lg" loading={loading}>
                        Enviar link de recuperação
                      </Button>
                    </form>
                    <p className="mt-6 text-center text-sm text-muted-foreground">
                      <button onClick={() => setView("login")} className="text-primary font-medium hover:text-primary/80">
                        ← Voltar ao login
                      </button>
                    </p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
