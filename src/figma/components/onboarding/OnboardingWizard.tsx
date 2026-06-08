import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight, ArrowLeft, Check, User, Briefcase,
  Target, Camera, Zap, Crown, Star
} from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Badge } from "../ui/Badge";
import { Wordmark } from "../../../components/Wordmark";
import { PLAN_CATALOG_LIST, TRIAL_DAYS } from "../../../lib/plans";

interface OnboardingWizardProps {
  onComplete: () => void;
}

const planIcons = {
  starter: Star,
  pro: Zap,
  studio: Crown,
} as const;

const planColors = {
  starter: "from-slate-600 to-slate-800",
  pro: "from-violet-500 to-indigo-600",
  studio: "from-amber-400 to-amber-600",
} as const;

const plans = PLAN_CATALOG_LIST.map((p) => ({
  id: p.slug,
  name: p.name,
  price: `R$ ${p.price}`,
  students: p.slug === "studio" ? "∞" : p.slug === "pro" ? 25 : 10,
  icon: planIcons[p.slug],
  color: planColors[p.slug],
  recommended: p.popular,
  features: p.features.slice(0, 4),
}));

const specialties = ["Hipertrofia", "Emagrecimento", "Musculação", "Funcional", "HIIT", "Pilates", "CrossFit", "Corrida", "Natação", "Fisioterapia", "Reabilitação", "Esporte"];

const steps = [
  { id: "plan", title: "Escolha seu plano", subtitle: `${TRIAL_DAYS} dias grátis no Starter` },
  { id: "profile", title: "Seu perfil", subtitle: "Conte um pouco sobre você" },
  { id: "specialties", title: "Especialidades", subtitle: "Selecione suas áreas de atuação" },
  { id: "done", title: "Tudo pronto!", subtitle: "Seu negócio está configurado" },
];

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [plan, setPlan] = useState("pro");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(["Hipertrofia", "Emagrecimento"]);

  const toggleSpecialty = (s: string) => {
    setSelectedSpecialties(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const next = () => {
    if (step < steps.length - 1) setStep(s => s + 1);
    else onComplete();
  };

  const back = () => setStep(s => s - 1);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 dark bg-background text-foreground">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-2xl">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Wordmark size="lg" />
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${i < step ? "bg-primary text-white" : i === step ? "bg-primary/20 border-2 border-primary text-primary" : "bg-muted text-muted-foreground"}`}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 h-0.5 rounded-full transition-all duration-300 ${i < step ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 lg:p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-foreground">{steps[step].title}</h2>
            <p className="text-muted-foreground mt-1">{steps[step].subtitle}</p>
          </div>

          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="plan" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                {plans.map(({ id, name, price, students, icon: Icon, color, recommended }) => (
                  <button
                    key={id}
                    onClick={() => setPlan(id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-left ${plan === id ? "border-primary bg-primary/10" : "border-border bg-muted/30 hover:border-primary/30"}`}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{name}</span>
                        {recommended && <Badge variant="accent">Recomendado</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">Até {students} alunos ativos</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-foreground">{price}</p>
                      <p className="text-xs text-muted-foreground">/mês</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${plan === id ? "border-primary bg-primary" : "border-border"}`}>
                      {plan === id && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                ))}
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="flex flex-col items-center gap-3 mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-xs text-muted-foreground">Toque para adicionar foto</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input label="Nome completo" placeholder="João Silva" icon={<User className="w-4 h-4" />} fullWidth />
                  <Input label="CREF" placeholder="123456-G/SP" icon={<Briefcase className="w-4 h-4" />} fullWidth />
                </div>
                <Input label="WhatsApp para contato" placeholder="(11) 99999-0000" fullWidth />
                <div>
                  <label className="text-sm font-medium text-foreground">Bio profissional</label>
                  <textarea
                    rows={3}
                    placeholder="Conte sobre sua experiência e método de trabalho..."
                    className="mt-1.5 w-full rounded-xl border border-border bg-input-background px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none"
                  />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="specialties" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex flex-wrap gap-2 mb-4">
                  {specialties.map(s => (
                    <button
                      key={s}
                      onClick={() => toggleSpecialty(s)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${selectedSpecialties.includes(s) ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground border border-border"}`}
                    >
                      {selectedSpecialties.includes(s) && <Check className="w-3.5 h-3.5" />}
                      {s}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground text-center mt-4">
                  {selectedSpecialties.length} especialidades selecionadas
                </p>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center py-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-primary/30">
                  <Check className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Configuração concluída!</h3>
                <p className="text-muted-foreground mb-6">Sua conta está pronta. Comece adicionando seu primeiro aluno.</p>
                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                  {["Perfil configurado", "Plano Silver ativo (14 dias grátis)", "IA assistente ativada"].map(item => (
                    <div key={item} className="flex items-center gap-2 justify-center">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center">
                        <Check className="w-3 h-3 text-emerald-400" />
                      </div>
                      {item}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <Button
              variant="ghost"
              onClick={back}
              icon={<ArrowLeft className="w-4 h-4" />}
              disabled={step === 0}
              className={step === 0 ? "invisible" : ""}
            >
              Voltar
            </Button>
            <Button
              variant="primary"
              onClick={next}
              iconRight={step < steps.length - 1 ? <ArrowRight className="w-4 h-4" /> : undefined}
              className="bg-gradient-to-r from-primary to-accent border-0"
            >
              {step === steps.length - 1 ? "Entrar no dashboard" : "Continuar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
