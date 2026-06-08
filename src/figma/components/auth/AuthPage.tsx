import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Zap, Shield, BarChart3, Check } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Wordmark } from "../../../components/Wordmark";

type AuthView = "login" | "register" | "forgot";

interface AuthPageProps {
  onAuth: (role: "trainer" | "student") => void;
}

const features = [
  { icon: BarChart3, text: "Dashboard com analytics em tempo real" },
  { icon: Zap, text: "IA para criação de treinos personalizados" },
  { icon: Shield, text: "Segurança e privacidade dos seus dados" },
];

export function AuthPage({ onAuth }: AuthPageProps) {
  const [view, setView] = useState<AuthView>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (view === "forgot") {
      setLoading(true);
      await new Promise(r => setTimeout(r, 1200));
      setForgotSent(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    onAuth("trainer");
  };

  return (
    <div className="min-h-screen flex dark bg-background text-foreground">
      {/* Left panel - decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a14] via-[#0d0d20] to-[#0a0a14]" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-accent/15 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-primary/10 rounded-full blur-2xl" />
        </div>

        {/* Grid lines */}
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: "linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px"
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
                Eleve seu negócio<br />
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">fitness ao próximo nível</span>
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

            <div className="flex items-center gap-4 pt-4">
              {["Tiago M.", "Juliana R.", "Carlos S.", "Ana P."].map((name, i) => (
                <div key={i} className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-white border-2 border-background -ml-2 first:ml-0">
                  {name[0]}
                </div>
              ))}
              <span className="text-white/50 text-sm ml-1">+2.4k trainers ativos</span>
            </div>
          </div>

          <p className="text-white/30 text-xs">© 2026 AxxosFit. Todos os direitos reservados.</p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 lg:hidden">
            <Wordmark size="lg" className="max-w-[min(100%,240px)]" />
          </div>

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

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setView("forgot")}
                      className="text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>

                  <Button type="submit" fullWidth size="lg" loading={loading} iconRight={<ArrowRight className="w-4 h-4" />}>
                    Entrar
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
                    icon={
                      <svg viewBox="0 0 24 24" className="w-4 h-4">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    }
                  >
                    Entrar com Google
                  </Button>
                </form>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                  Não tem conta?{" "}
                  <button onClick={() => setView("register")} className="text-primary font-medium hover:text-primary/80 transition-colors">
                    Criar conta gratuita
                  </button>
                </p>

                <div className="mt-8 flex gap-3">
                  <button onClick={() => onAuth("trainer")} className="flex-1 py-2.5 px-3 rounded-xl border border-border text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-all text-center">
                    Demo Personal
                  </button>
                  <button onClick={() => onAuth("student")} className="flex-1 py-2.5 px-3 rounded-xl border border-border text-xs text-muted-foreground hover:border-accent/40 hover:text-accent transition-all text-center">
                    Demo Aluno
                  </button>
                </div>
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

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input label="Nome completo" type="text" placeholder="João Silva" value={name} onChange={e => setName(e.target.value)} icon={<User className="w-4 h-4" />} fullWidth required />
                  <Input label="E-mail profissional" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} icon={<Mail className="w-4 h-4" />} fullWidth required />
                  <Input label="Senha" type={showPassword ? "text" : "password"} placeholder="Mínimo 8 caracteres" value={password} onChange={e => setPassword(e.target.value)}
                    icon={<Lock className="w-4 h-4" />}
                    iconRight={<button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>}
                    hint="Use letras, números e símbolos"
                    fullWidth required />

                  <div className="flex flex-col gap-2 p-3 rounded-xl bg-muted/50 border border-border">
                    {["14 dias de teste gratuito", "Cancele quando quiser", "Suporte via WhatsApp"].map(item => (
                      <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>

                  <Button type="submit" fullWidth size="lg" loading={loading} iconRight={<ArrowRight className="w-4 h-4" />}>
                    Criar conta grátis
                  </Button>
                </form>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                  Já tem conta?{" "}
                  <button onClick={() => setView("login")} className="text-primary font-medium hover:text-primary/80">Entrar</button>
                </p>
                <p className="mt-3 text-center text-xs text-muted-foreground/60">
                  Ao criar conta você concorda com os <span className="underline cursor-pointer">Termos de Uso</span> e <span className="underline cursor-pointer">Política de Privacidade</span>
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
                    <p className="text-muted-foreground text-sm">Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.</p>
                    <Button variant="outline" fullWidth onClick={() => { setView("login"); setForgotSent(false); }}>Voltar ao login</Button>
                  </div>
                ) : (
                  <>
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-foreground mb-2">Recuperar senha</h2>
                      <p className="text-muted-foreground text-sm">Enviaremos um link de recuperação para seu e-mail</p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <Input label="E-mail" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} icon={<Mail className="w-4 h-4" />} fullWidth required />
                      <Button type="submit" fullWidth size="lg" loading={loading}>Enviar link de recuperação</Button>
                    </form>
                    <p className="mt-6 text-center text-sm text-muted-foreground">
                      <button onClick={() => setView("login")} className="text-primary font-medium hover:text-primary/80">← Voltar ao login</button>
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
