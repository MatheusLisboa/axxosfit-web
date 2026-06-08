import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { motion } from "motion/react";
import { User, Shield, Upload, Check, Camera, Crown, Mail } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "../ui/GlassCard";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Avatar } from "../ui/Avatar";
import { cn } from "../ui/utils";
import { useStore } from "../../../services/store";
import { useSubscription } from "../../../hooks/useSubscription";
import { normalizePlanSlug, PLAN_DISPLAY_NAMES, getTrialDaysRemaining, TRIAL_DAYS } from "../../../lib/plans";
import { resizeImageToDataUrl } from "../../../lib/avatarUtils";
import UpgradePlanPage from "../../../components/UpgradePlanPage";
import type { AppPage } from "../layout/Sidebar";

type SettingsSection = "profile" | "plan" | "security";

const sections: { id: SettingsSection; label: string; shortLabel: string; icon: typeof User }[] = [
  { id: "profile", label: "Perfil", shortLabel: "Perfil", icon: User },
  { id: "plan", label: "Meu Plano", shortLabel: "Plano", icon: Crown },
  { id: "security", label: "Segurança", shortLabel: "Senha", icon: Shield },
];

const SPECIALTY_PRESETS = [
  "Hipertrofia",
  "Emagrecimento",
  "Musculação",
  "Funcional",
  "HIIT",
  "Reabilitação",
  "CrossFit",
  "Corrida",
  "Pilates",
  "Natação",
];

function formatDate(value?: string): string {
  if (!value) return "—";
  const d = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("pt-BR");
}

function formatCpf(cpf?: string): string {
  if (!cpf) return "—";
  const v = cpf.replace(/\D/g, "");
  if (v.length !== 11) return cpf;
  return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatPhone(phone?: string): string {
  if (!phone) return "—";
  const v = phone.replace(/\D/g, "");
  if (v.length === 11) return v.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (v.length === 10) return v.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return phone;
}

function formatGender(gender?: string): string {
  if (gender === "M") return "Masculino";
  if (gender === "F") return "Feminino";
  return "—";
}

const readOnlyClass =
  "bg-muted/40 text-muted-foreground cursor-default focus:ring-0 focus:border-border text-base sm:text-sm min-h-[44px]";

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 px-3.5 py-3 min-h-[44px] flex flex-col justify-center">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground mt-0.5 break-words">{value || "—"}</span>
    </div>
  );
}

export function SettingsPage({
  onNavigate: _onNavigate,
  initialSection = "profile",
}: {
  onNavigate?: (page: AppPage) => void;
  initialSection?: SettingsSection;
} = {}) {
  const { currentProfile, currentTrainer, updateProfile } = useStore();
  const { plan, subscription } = useSubscription();
  const fileRef = useRef<HTMLInputElement>(null);

  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);
  const [bio, setBio] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const profile = currentProfile;
  const trainer = currentTrainer;

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  useEffect(() => {
    if (!profile) return;
    setBio(trainer?.bio || "");
    setSpecialties(trainer?.specialties || []);
    setAvatarPreview(profile.avatar_url);
  }, [profile?.id, trainer?.bio, trainer?.specialties, profile?.avatar_url]);

  const planSlug = normalizePlanSlug(plan?.slug || trainer?.plan?.toLowerCase() || "starter");
  const planLabel = PLAN_DISPLAY_NAMES[planSlug] || trainer?.plan || "Starter";
  const trialDaysLeft = getTrialDaysRemaining(subscription?.expires_at);
  const isTrial = subscription?.status === "trial";

  const toggleSpecialty = (s: string) => {
    setSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem (JPG, PNG ou WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5 MB.");
      return;
    }
    resizeImageToDataUrl(file, (dataUrl) => {
      setAvatarPreview(dataUrl);
      toast.success("Foto carregada. Salve para aplicar.");
    });
    e.target.value = "";
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await updateProfile(profile.id, {
        avatar_url: avatarPreview,
        bio: bio.trim(),
        specialties,
      });
      setSaved(true);
      toast.success("Perfil atualizado com sucesso.");
      setTimeout(() => setSaved(false), 2000);
    } catch {
      toast.error("Não foi possível salvar o perfil.");
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 text-muted-foreground text-sm">
        Carregando perfil…
      </div>
    );
  }

  const phone = trainer?.whatsapp || profile.phone;

  return (
    <div className="px-3 sm:px-4 lg:px-8 pt-3 sm:pt-4 lg:pt-8 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-8 max-w-4xl lg:max-w-none mx-auto">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarChange}
      />
      {/* Navegação — mobile: abas fixas em grade; desktop: sidebar */}
      <div className="sticky top-0 z-20 -mx-3 sm:-mx-4 px-3 sm:px-4 lg:static lg:mx-0 lg:px-0 py-2 mb-4 lg:mb-6 bg-background/95 backdrop-blur-xl border-b border-border lg:border-0 lg:bg-transparent lg:backdrop-blur-none">
        <nav
          className="grid grid-cols-3 gap-1.5 lg:grid-cols-1 lg:gap-1 lg:max-w-[13rem]"
          aria-label="Seções de configurações"
        >
          {sections.map(({ id, label, shortLabel, icon: Icon }) => {
            const active = activeSection === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveSection(id)}
                className={cn(
                  "flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2.5",
                  "min-h-11 px-2 sm:px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all touch-manipulation",
                  active
                    ? "bg-primary/15 text-primary border border-primary/25 shadow-sm"
                    : "text-muted-foreground border border-transparent hover:text-foreground hover:bg-muted active:bg-muted"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate max-w-full">
                  <span className="sm:hidden">{shortLabel}</span>
                  <span className="hidden sm:inline">{label}</span>
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="lg:flex lg:gap-8">
        {/* Hero do perfil — mobile */}
        {activeSection === "profile" && (
          <div className="lg:hidden mb-4">
            <GlassCard className="p-4">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="relative shrink-0 rounded-full touch-manipulation"
                  aria-label="Alterar foto de perfil"
                >
                  <Avatar name={profile.name} src={avatarPreview} size="xl" className="!w-20 !h-20 !text-xl" />
                  <span className="absolute inset-0 rounded-full bg-black/45 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-white" />
                  </span>
                </button>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground text-base leading-tight truncate">{profile.name}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                    <Mail className="w-3 h-3 shrink-0" />
                    {profile.email}
                  </p>
                  <Badge variant="primary" className="mt-2">{planLabel}</Badge>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-4 sm:space-y-5">
          {activeSection === "profile" && (
            <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 sm:space-y-5">
              {/* Foto — desktop / tablet */}
              <GlassCard className="p-4 sm:p-5 hidden sm:block">
                <h3 className="font-semibold text-foreground mb-4 sm:mb-5">Foto de Perfil</h3>
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="relative group">
                    <Avatar name={profile.name} src={avatarPreview} size="xl" className="!w-20 !h-20 sm:!w-16 sm:!h-16" />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-manipulation"
                      aria-label="Alterar foto"
                    >
                      <Camera className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  <div className="space-y-2 text-center sm:text-left w-full sm:w-auto">
                    <p className="text-sm font-medium text-foreground">{profile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Sem foto personalizada, exibimos as iniciais do seu nome.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      fullWidth
                      className="sm:w-auto"
                      icon={<Upload className="w-3.5 h-3.5" />}
                      onClick={() => fileRef.current?.click()}
                    >
                      Alterar foto
                    </Button>
                    <p className="text-xs text-muted-foreground">JPG, PNG ou WebP. Máx 5 MB.</p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-4 sm:p-5 space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="font-semibold text-foreground">Dados do cadastro</h3>
                  <Badge variant="primary" className="w-fit">{planLabel}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Estes dados vêm do seu cadastro e não podem ser alterados aqui.
                </p>

                {/* Mobile: cards compactos */}
                <div className="grid grid-cols-1 gap-3 sm:hidden">
                  <ReadOnlyField label="Nome completo" value={profile.name} />
                  <ReadOnlyField label="E-mail" value={profile.email} />
                  <ReadOnlyField label="Telefone / WhatsApp" value={formatPhone(phone)} />
                  <ReadOnlyField label="CREF" value={trainer?.cref || "—"} />
                  <ReadOnlyField label="CPF" value={formatCpf(trainer?.cpf || profile.cpf)} />
                  <ReadOnlyField label="Data de nascimento" value={formatDate(trainer?.birthdate || profile.birthdate)} />
                  <ReadOnlyField label="Gênero" value={formatGender(profile.gender)} />
                  <ReadOnlyField label="Membro desde" value={formatDate(profile.created_at)} />
                  <ReadOnlyField label="Endereço" value={trainer?.address || profile.address || "—"} />
                  <div className="grid grid-cols-2 gap-3">
                    <ReadOnlyField label="Cidade" value={trainer?.city || "—"} />
                    <ReadOnlyField label="Estado" value={trainer?.state || "—"} />
                  </div>
                  <ReadOnlyField label="Instagram" value={trainer?.instagram || "—"} />
                </div>

                {/* Tablet+ */}
                <div className="hidden sm:grid sm:grid-cols-2 gap-4">
                  <Input label="Nome completo" value={profile.name} readOnly className={readOnlyClass} fullWidth />
                  <Input label="E-mail" type="email" value={profile.email} readOnly className={readOnlyClass} fullWidth />
                  <Input label="Telefone / WhatsApp" value={formatPhone(phone)} readOnly className={readOnlyClass} fullWidth />
                  <Input label="CREF" value={trainer?.cref || "—"} readOnly className={readOnlyClass} fullWidth />
                  <Input label="CPF" value={formatCpf(trainer?.cpf || profile.cpf)} readOnly className={readOnlyClass} fullWidth />
                  <Input label="Data de nascimento" value={formatDate(trainer?.birthdate || profile.birthdate)} readOnly className={readOnlyClass} fullWidth />
                  <Input label="Gênero" value={formatGender(profile.gender)} readOnly className={readOnlyClass} fullWidth />
                  <Input label="Membro desde" value={formatDate(profile.created_at)} readOnly className={readOnlyClass} fullWidth />
                </div>

                <div className="hidden sm:block space-y-4">
                  <Input
                    label="Endereço"
                    value={trainer?.address || profile.address || "—"}
                    readOnly
                    className={readOnlyClass}
                    fullWidth
                  />
                  <div className="grid sm:grid-cols-3 gap-4">
                    <Input label="Cidade" value={trainer?.city || "—"} readOnly className={readOnlyClass} fullWidth />
                    <Input label="Estado" value={trainer?.state || "—"} readOnly className={readOnlyClass} fullWidth />
                    <Input label="Instagram" value={trainer?.instagram || "—"} readOnly className={readOnlyClass} fullWidth />
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-4 sm:p-5 space-y-4">
                <h3 className="font-semibold text-foreground">Bio e especialidades</h3>
                <p className="text-xs text-muted-foreground">
                  Você pode editar apenas estes campos.
                </p>

                <div>
                  <label htmlFor="trainer-bio" className="text-sm font-medium text-foreground">
                    Bio
                  </label>
                  <textarea
                    id="trainer-bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    placeholder="Conte um pouco sobre sua experiência e metodologia…"
                    className="mt-1.5 w-full min-h-[120px] rounded-xl border border-border bg-input-background px-3.5 py-3 text-base sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all resize-y"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Especialidades</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {SPECIALTY_PRESETS.map((s) => {
                      const active = specialties.includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleSpecialty(s)}
                          className={cn(
                            "px-3 py-2.5 min-h-11 rounded-full text-xs font-medium border transition-all touch-manipulation",
                            active
                              ? "bg-primary/15 text-primary border-primary/30"
                              : "bg-muted/50 text-muted-foreground border-border hover:border-primary/30 active:bg-muted"
                          )}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                  {specialties.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2 break-words">
                      Selecionadas: {specialties.join(", ")}
                    </p>
                  )}
                </div>

                {/* Salvar — desktop */}
                <div className="hidden lg:flex justify-end pt-2">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    icon={saved ? <Check className="w-4 h-4" /> : undefined}
                    variant={saved ? "ghost" : "primary"}
                  >
                    {saving ? "Salvando…" : saved ? "Salvo!" : "Salvar alterações"}
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {activeSection === "plan" && (
            <motion.div key="plan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 sm:space-y-5">
              <GlassCard className="p-4 sm:p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
                  <h3 className="font-semibold text-foreground">Assinatura AxxosFit</h3>
                  <Badge variant="primary" className="w-fit">{planLabel}</Badge>
                </div>
                {isTrial && trialDaysLeft !== null && (
                  <p className="text-xs text-muted-foreground mb-3 sm:mb-4">
                    Trial Starter — {trialDaysLeft} {trialDaysLeft === 1 ? "dia" : "dias"} restante{trialDaysLeft === 1 ? "" : "s"} de {TRIAL_DAYS} dias grátis.
                  </p>
                )}
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Upgrade da plataforma é gerenciado aqui. Cobranças de mensalidade dos seus alunos ficam no Financeiro (Pro+).
                </p>
              </GlassCard>
              <UpgradePlanPage />
            </motion.div>
          )}

          {activeSection === "security" && (
            <motion.div key="security" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 sm:space-y-5">
              <GlassCard className="p-4 sm:p-5 space-y-4">
                <h3 className="font-semibold text-foreground">Alterar Senha</h3>
                <Input label="Senha atual" type="password" placeholder="••••••••" fullWidth className="text-base sm:text-sm" />
                <Input label="Nova senha" type="password" placeholder="••••••••" hint="Mínimo 8 caracteres com letra e número" fullWidth className="text-base sm:text-sm" />
                <Input label="Confirmar nova senha" type="password" placeholder="••••••••" fullWidth className="text-base sm:text-sm" />
                <Button variant="primary" size="md" fullWidth className="sm:w-auto sm:min-w-[10rem]">
                  Alterar senha
                </Button>
              </GlassCard>

              <GlassCard className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">Autenticação 2 Fatores</p>
                    <p className="text-sm text-muted-foreground mt-0.5">Camada extra de segurança na sua conta</p>
                  </div>
                  <Button variant="outline" size="md" fullWidth className="sm:w-auto shrink-0">
                    Ativar 2FA
                  </Button>
                </div>
              </GlassCard>

              <GlassCard className="p-4 sm:p-5">
                <h3 className="font-semibold text-foreground mb-4">Sessões Ativas</h3>
                <div className="space-y-3">
                  {[
                    { device: "Chrome — MacBook Pro", location: "São Paulo, BR", current: true },
                    { device: "Safari — iPhone 15", location: "São Paulo, BR", current: false },
                  ].map(({ device, location, current }, i) => (
                    <div
                      key={i}
                      className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between py-3 border-b border-border last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground break-words">{device}</p>
                        <p className="text-xs text-muted-foreground">{location}</p>
                      </div>
                      {current ? (
                        <Badge variant="success" dot className="w-fit">Atual</Badge>
                      ) : (
                        <Button variant="ghost" size="sm" fullWidth className="sm:w-auto text-destructive">
                          Encerrar
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          )}
        </div>
      </div>

      {/* Barra fixa salvar — mobile / tablet */}
      {activeSection === "profile" && (
        <div className="lg:hidden fixed left-0 right-0 z-30 bottom-[calc(4rem+env(safe-area-inset-bottom))] border-t border-border bg-background/95 backdrop-blur-xl px-3 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.12)]">
          <Button
            onClick={handleSave}
            disabled={saving}
            fullWidth
            size="lg"
            icon={saved ? <Check className="w-4 h-4" /> : undefined}
            variant={saved ? "ghost" : "primary"}
          >
            {saving ? "Salvando…" : saved ? "Salvo!" : "Salvar alterações"}
          </Button>
        </div>
      )}
    </div>
  );
}
