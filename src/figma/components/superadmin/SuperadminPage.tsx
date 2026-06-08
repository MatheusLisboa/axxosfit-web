import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Crown,
  Users,
  Dumbbell,
  Plus,
  Search,
  RefreshCw,
  Check,
  Pencil,
  Trash2,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../../../services/store';
import { isSuperAdminEmail } from '../../../lib/superadmin';
import type { CreateExerciseInput, TrainerPlanTier } from '../../../types';
import { StudentsPage } from '../students/StudentsPage';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Avatar } from '../ui/Avatar';

const MUSCLE_GROUPS = [
  'Peito',
  'Costas',
  'Ombros',
  'Bíceps',
  'Tríceps',
  'Quadríceps',
  'Posterior',
  'Glúteos',
  'Core',
  'Panturrilha',
  'Cardio',
  'Funcional',
];

const SPECIALTY_PRESETS = [
  'Hipertrofia',
  'Emagrecimento',
  'Musculação',
  'Funcional',
  'HIIT',
  'Reabilitação',
  'CrossFit',
  'Corrida',
];

type AdminTab = 'trainers' | 'exercises' | 'students';

export function SuperadminPage() {
  const {
    profiles,
    trainers,
    exercises,
    isLoading,
    createTrainerByAdmin,
    createExercise,
    updateExercise,
    deleteExercise,
    refreshPlatformData,
    deactivateTrainerByAdmin,
    activateTrainerByAdmin,
  } = useStore();

  const [tab, setTab] = useState<AdminTab>('trainers');
  const [trainerSearch, setTrainerSearch] = useState('');
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');

  // —— Criar personal ——
  const [tName, setTName] = useState('');
  const [tEmail, setTEmail] = useState('');
  const [tPassword, setTPassword] = useState('AxxosFit@2026');
  const [tCref, setTCref] = useState('');
  const [tWhatsapp, setTWhatsapp] = useState('');
  const [tBio, setTBio] = useState('');
  const [tCpf, setTCpf] = useState('');
  const [tCity, setTCity] = useState('');
  const [tState, setTState] = useState('');
  const [tInstagram, setTInstagram] = useState('');
  const [tGender, setTGender] = useState<'M' | 'F' | ''>('');
  const [tBirthdate, setTBirthdate] = useState('');
  const [tPlan, setTPlan] = useState<TrainerPlanTier>('Bronze');
  const [tSpecialties, setTSpecialties] = useState<string[]>(['Musculação', 'Hipertrofia']);

  // —— Criar exercício ——
  const [eName, setEName] = useState('');
  const [eCategory, setECategory] = useState('Peito');
  const [eDescription, setEDescription] = useState('');
  const [eVideo, setEVideo] = useState('');
  const [eEquipment, setEEquipment] = useState('');
  const [eDifficulty, setEDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [eInstructions, setEInstructions] = useState('');

  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);

  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await refreshPlatformData();
      if (result.success) {
        toast.success('Supabase sincronizado', { description: result.message });
      } else {
        toast.error('Falha na sincronização', { description: result.message });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    void refreshPlatformData();
  }, [refreshPlatformData]);

  const trainerList = useMemo(() => {
    return profiles
      .filter((p) => p.role === 'trainer' && !isSuperAdminEmail(p.email))
      .filter((p) => {
        const q = trainerSearch.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          trainers.find((t) => t.id === p.id)?.cref?.toLowerCase().includes(q)
        );
      });
  }, [profiles, trainers, trainerSearch]);

  const exerciseList = useMemo(() => {
    return exercises.filter((ex) => {
      const matchCat = categoryFilter === 'Todos' || ex.category === categoryFilter;
      const q = exerciseSearch.toLowerCase();
      const matchSearch =
        ex.name.toLowerCase().includes(q) ||
        ex.category.toLowerCase().includes(q) ||
        (ex.description?.toLowerCase().includes(q) ?? false);
      return matchCat && matchSearch;
    });
  }, [exercises, exerciseSearch, categoryFilter]);

  const toggleSpecialty = (s: string) => {
    setTSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const resetTrainerForm = () => {
    setTName('');
    setTEmail('');
    setTPassword('AxxosFit@2026');
    setTCref('');
    setTWhatsapp('');
    setTBio('');
    setTCpf('');
    setTCity('');
    setTState('');
    setTInstagram('');
    setTGender('');
    setTBirthdate('');
    setTPlan('Bronze');
    setTSpecialties(['Musculação', 'Hipertrofia']);
  };

  const resetExerciseForm = () => {
    setEName('');
    setECategory('Peito');
    setEDescription('');
    setEVideo('');
    setEEquipment('');
    setEDifficulty('intermediate');
    setEInstructions('');
    setEditingExerciseId(null);
  };

  const handleCreateTrainer = async () => {
    if (!tName.trim() || !tEmail.trim() || !tCref.trim()) {
      toast.error('Preencha nome, e-mail e CREF.');
      return;
    }
    const result = await createTrainerByAdmin({
      name: tName.trim(),
      email: tEmail.trim(),
      password: tPassword,
      cref: tCref.trim(),
      specialties: tSpecialties,
      bio: tBio,
      whatsapp: tWhatsapp,
      plan: tPlan,
      cpf: tCpf,
      city: tCity,
      state: tState,
      instagram: tInstagram,
      gender: tGender || undefined,
      birthdate: tBirthdate || undefined,
    });
    if (result.success) {
      toast.success(result.message || 'Personal criado.', {
        description: result.temporaryPassword
          ? `Senha temporária: ${result.temporaryPassword}`
          : undefined,
        duration: 8000,
      });
      resetTrainerForm();
      void refreshPlatformData();
    } else {
      toast.error(result.message || 'Falha ao criar personal.');
    }
  };

  const buildExerciseInput = (): CreateExerciseInput => ({
    name: eName,
    category: eCategory,
    description: eDescription,
    video_url: eVideo,
    equipment: eEquipment,
    difficulty: eDifficulty,
    instructions: eInstructions,
    is_global: true,
  });

  const handleSaveExercise = async () => {
    if (!eName.trim()) {
      toast.error('Informe o nome do exercício.');
      return;
    }
    if (editingExerciseId) {
      const result = await updateExercise(editingExerciseId, buildExerciseInput());
      if (result.success) {
        toast.success(result.message || 'Exercício atualizado.');
        resetExerciseForm();
        void refreshPlatformData();
      } else {
        toast.error(result.message);
      }
    } else {
      const result = await createExercise(buildExerciseInput());
      if (result.success) {
        toast.success(result.message || 'Exercício criado.');
        resetExerciseForm();
        void refreshPlatformData();
      } else {
        toast.error(result.message);
      }
    }
  };

  const startEditExercise = (id: string) => {
    const ex = exercises.find((e) => e.id === id);
    if (!ex) return;
    setEditingExerciseId(id);
    setEName(ex.name);
    setECategory(ex.category);
    setEDescription(ex.description || '');
    setEVideo(ex.video_url || '');
    setEEquipment(ex.equipment || '');
    setEDifficulty(ex.difficulty || 'intermediate');
    setEInstructions(ex.instructions || '');
    setTab('exercises');
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 pb-28 lg:pb-8">
      <GlassCard className="p-5 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/25">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                Superadmin
                <Badge variant="accent">Plataforma</Badge>
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Credencie personais e gerencie a biblioteca global de exercícios — sincronizado com Supabase.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={() => void handleSync()}
            loading={isSyncing || isLoading}
          >
            Sincronizar com Supabase
          </Button>
        </div>
      </GlassCard>

      <div className="flex gap-1 p-1 rounded-xl bg-muted border border-border max-w-md">
        {[
          { id: 'trainers' as const, label: 'Personais', icon: Users },
          { id: 'students' as const, label: 'Alunos', icon: Users },
          { id: 'exercises' as const, label: 'Exercícios', icon: Dumbbell },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === id ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'trainers' && (
        <div className="grid lg:grid-cols-5 gap-6">
          <GlassCard className="lg:col-span-2 p-5 space-y-4 h-fit">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              Novo personal trainer
            </h3>
            <Input label="Nome completo *" value={tName} onChange={(e) => setTName(e.target.value)} fullWidth />
            <Input
              label="E-mail *"
              type="email"
              value={tEmail}
              onChange={(e) => setTEmail(e.target.value)}
              fullWidth
            />
            <Input
              label="Senha temporária"
              type="text"
              value={tPassword}
              onChange={(e) => setTPassword(e.target.value)}
              hint="Enviada ao personal no primeiro acesso"
              fullWidth
            />
            <div className="grid grid-cols-2 gap-3">
              <Input label="CREF *" value={tCref} onChange={(e) => setTCref(e.target.value)} fullWidth />
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Plano SaaS</label>
                <select
                  value={tPlan}
                  onChange={(e) => setTPlan(e.target.value as TrainerPlanTier)}
                  className="h-11 w-full rounded-xl border border-border bg-input-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
                >
                  <option value="Bronze">Bronze</option>
                  <option value="Silver">Silver</option>
                  <option value="Gold">Gold</option>
                </select>
              </div>
            </div>
            <Input label="WhatsApp" value={tWhatsapp} onChange={(e) => setTWhatsapp(e.target.value)} fullWidth />
            <Input label="CPF" value={tCpf} onChange={(e) => setTCpf(e.target.value)} fullWidth />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Cidade" value={tCity} onChange={(e) => setTCity(e.target.value)} fullWidth />
              <Input label="UF" value={tState} onChange={(e) => setTState(e.target.value)} fullWidth />
            </div>
            <Input label="Instagram" value={tInstagram} onChange={(e) => setTInstagram(e.target.value)} fullWidth />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Gênero</label>
                <select
                  value={tGender}
                  onChange={(e) => setTGender(e.target.value as 'M' | 'F' | '')}
                  className="h-11 w-full rounded-xl border border-border bg-input-background px-3 text-sm text-foreground"
                >
                  <option value="">—</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </div>
              <Input
                label="Nascimento"
                type="date"
                value={tBirthdate}
                onChange={(e) => setTBirthdate(e.target.value)}
                fullWidth
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Especialidades</label>
              <div className="flex flex-wrap gap-1.5">
                {SPECIALTY_PRESETS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSpecialty(s)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      tSpecialties.includes(s)
                        ? 'bg-primary text-white border-primary'
                        : 'border-border text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    {tSpecialties.includes(s) && <Check className="w-3 h-3 inline mr-0.5" />}
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Bio profissional</label>
              <textarea
                value={tBio}
                onChange={(e) => setTBio(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-border bg-input-background px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Experiência, metodologia, público-alvo..."
              />
            </div>
            <Button fullWidth loading={isLoading} onClick={() => void handleCreateTrainer()} icon={<Shield className="w-4 h-4" />}>
              Credenciar no Supabase
            </Button>
          </GlassCard>

          <div className="lg:col-span-3 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={trainerSearch}
                onChange={(e) => setTrainerSearch(e.target.value)}
                placeholder="Buscar por nome, e-mail ou CREF..."
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-input-background text-sm text-foreground"
              />
            </div>
            <div className="space-y-2 max-h-[70vh] overflow-y-auto">
              {trainerList.length === 0 ? (
                <GlassCard className="p-8 text-center text-muted-foreground text-sm">
                  Nenhum personal encontrado.
                </GlassCard>
              ) : (
                trainerList.map((p) => {
                  const tr = trainers.find((t) => t.id === p.id);
                  return (
                    <GlassCard key={p.id} className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={p.name} src={p.avatar_url} size="md" online={p.status === 'active'} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            <Badge variant="primary">{tr?.plan || 'Bronze'}</Badge>
                            <Badge variant={p.status === 'active' ? 'success' : 'danger'} dot>
                              {p.status === 'active' ? 'Ativo' : 'Inativo'}
                            </Badge>
                            {tr?.cref && <Badge variant="ghost">{tr.cref}</Badge>}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          {p.status === 'active' ? (
                            <Button variant="ghost" size="sm" onClick={() => deactivateTrainerByAdmin(p.id)}>
                              Desativar
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => activateTrainerByAdmin(p.id)}>
                              Ativar
                            </Button>
                          )}
                        </div>
                      </div>
                    </GlassCard>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'exercises' && (
        <div className="grid lg:grid-cols-5 gap-6">
          <GlassCard className="lg:col-span-2 p-5 space-y-4 h-fit">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              {editingExerciseId ? (
                <>
                  <Pencil className="w-4 h-4 text-primary" /> Editar exercício
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-primary" /> Novo exercício global
                </>
              )}
            </h3>
            <Input label="Nome *" value={eName} onChange={(e) => setEName(e.target.value)} fullWidth />
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Grupo muscular *</label>
              <select
                value={eCategory}
                onChange={(e) => setECategory(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-input-background px-3 text-sm text-foreground"
              >
                {MUSCLE_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Dificuldade</label>
              <select
                value={eDifficulty}
                onChange={(e) =>
                  setEDifficulty(e.target.value as 'beginner' | 'intermediate' | 'advanced')
                }
                className="h-11 w-full rounded-xl border border-border bg-input-background px-3 text-sm text-foreground"
              >
                <option value="beginner">Iniciante</option>
                <option value="intermediate">Intermediário</option>
                <option value="advanced">Avançado</option>
              </select>
            </div>
            <Input label="Equipamento" value={eEquipment} onChange={(e) => setEEquipment(e.target.value)} fullWidth placeholder="Barra, halteres, polia..." />
            <Input label="URL do vídeo" value={eVideo} onChange={(e) => setEVideo(e.target.value)} fullWidth placeholder="YouTube ou CDN" />
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Descrição / execução</label>
              <textarea
                value={eDescription}
                onChange={(e) => setEDescription(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-border bg-input-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Instruções do coach</label>
              <textarea
                value={eInstructions}
                onChange={(e) => setEInstructions(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-border bg-input-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Dicas de postura, respiração, progressão..."
              />
            </div>
            <div className="flex gap-2">
              <Button fullWidth loading={isLoading} onClick={() => void handleSaveExercise()}>
                {editingExerciseId ? 'Salvar alterações' : 'Publicar na biblioteca'}
              </Button>
              {editingExerciseId && (
                <Button variant="ghost" onClick={resetExerciseForm}>
                  Cancelar
                </Button>
              )}
            </div>
          </GlassCard>

          <div className="lg:col-span-3 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                  placeholder="Buscar exercícios..."
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-input-background text-sm text-foreground"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-11 px-3 rounded-xl border border-border bg-input-background text-sm text-foreground min-w-[140px]"
              >
                <option value="Todos">Todos grupos</option>
                {MUSCLE_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-muted-foreground">{exerciseList.length} exercícios na biblioteca</p>
            <div className="space-y-2 max-h-[70vh] overflow-y-auto">
              {exerciseList.map((ex, i) => (
                <motion.div
                  key={ex.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                >
                  <GlassCard hover className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                        <Dumbbell className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground">{ex.name}</p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          <Badge variant="primary">{ex.category}</Badge>
                          {ex.difficulty && <Badge variant="ghost">{ex.difficulty}</Badge>}
                          {ex.is_global !== false && <Badge variant="accent">Global</Badge>}
                        </div>
                        {ex.description && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{ex.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEditExercise(ex.id)}
                          className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm(`Remover "${ex.name}" da biblioteca?`)) return;
                            const r = await deleteExercise(ex.id);
                            if (r.success) toast.success(r.message);
                            else toast.error(r.message);
                          }}
                          className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'students' && (
        <div className="-mx-4 lg:-mx-8">
          <StudentsPage isSuperAdmin />
        </div>
      )}
    </div>
  );
}
