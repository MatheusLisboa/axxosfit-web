import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Plus, Dumbbell, Clock, X, Trash2, ChevronDown, ChevronUp, Users, Copy,
} from "lucide-react";
import { toast } from "sonner";
import { useStore } from "../../../services/store";
import {
  defaultCardioPrescription,
  defaultStrengthPrescription,
  formatCardioPrescription,
  isCardioExercise,
  isTreadmillExercise,
} from "../../../lib/exerciseUtils";
import { GlassCard } from "../ui/GlassCard";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

export interface WorkoutsPageProps {
  initialStudentId?: string;
  autoOpenCreate?: boolean;
  onPrefillConsumed?: () => void;
}

const WEEKDAYS = [
  { short: "Seg", full: "Segunda-feira" },
  { short: "Ter", full: "Terça-feira" },
  { short: "Qua", full: "Quarta-feira" },
  { short: "Qui", full: "Quinta-feira" },
  { short: "Sex", full: "Sexta-feira" },
  { short: "Sáb", full: "Sábado" },
  { short: "Dom", full: "Domingo" },
] as const;

export function WorkoutsPage({
  initialStudentId,
  autoOpenCreate = false,
  onPrefillConsumed,
}: WorkoutsPageProps = {}) {
  const {
    currentProfile,
    students,
    profiles,
    exercises,
    workouts,
    workoutDays,
    workoutExercises,
    createWorkout,
    deleteWorkout,
    duplicateWorkout,
    toggleWorkoutActive,
  } = useStore();

  type DraftExercise = {
    exercise_id: string;
    series: number;
    reps: string;
    rest_seconds: number;
    load_kg: number;
    observations: string;
  };

  const [view, setView] = useState<"list" | "create">("list");
  const [workoutName, setWorkoutName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [muscleFilter, setMuscleFilter] = useState("Todos");
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [copyDayFrom, setCopyDayFrom] = useState("");
  const [copyDayTo, setCopyDayTo] = useState("");
  const [dayExercises, setDayExercises] = useState<Record<string, DraftExercise[]>>({
    "Segunda-feira": [],
  });
  const [saving, setSaving] = useState(false);
  const [duplicateSource, setDuplicateSource] = useState<{ id: string; name: string; studentId: string } | null>(null);
  const [duplicateTargetId, setDuplicateTargetId] = useState("");
  const [duplicating, setDuplicating] = useState(false);

  useEffect(() => {
    if (!initialStudentId) return;
    setStudentId(initialStudentId);
    if (autoOpenCreate) {
      setView("create");
    }
    onPrefillConsumed?.();
  }, [initialStudentId, autoOpenCreate, onPrefillConsumed]);

  const selectedDayName = WEEKDAYS[selectedDayIndex].full;
  const currentDayExercises = dayExercises[selectedDayName] || [];
  const selectedExerciseIds = currentDayExercises.map((exercise) => exercise.exercise_id);

  const trainerId = currentProfile?.id;
  const myStudents = students.filter((s) => s.trainer_id === trainerId && s.status === "active");
  const myWorkouts = workouts.filter((w) => w.trainer_id === trainerId);

  const duplicateTargetOptions = useMemo(() => {
    if (!duplicateSource) return myStudents;
    return myStudents.filter((s) => s.id !== duplicateSource.studentId);
  }, [duplicateSource, myStudents]);

  const handleDuplicate = async () => {
    if (!duplicateSource || !duplicateTargetId) {
      toast.error("Selecione o aluno de destino.");
      return;
    }
    setDuplicating(true);
    const result = await duplicateWorkout(duplicateSource.id, duplicateTargetId);
    setDuplicating(false);
    if (!result.success) {
      toast.error(result.message || "Não foi possível duplicar o treino.");
      return;
    }
    const targetName = profiles.find((p) => p.id === duplicateTargetId)?.name || "aluno";
    toast.success(`Treino copiado para ${targetName}`);
    setDuplicateSource(null);
    setDuplicateTargetId("");
  };

  const muscleGroups = useMemo(() => {
    const set = new Set(exercises.map((e) => e.category));
    return ["Todos", ...Array.from(set).sort()];
  }, [exercises]);

  const filteredExercises = exercises.filter((e) => {
    return muscleFilter === "Todos" || e.category === muscleFilter;
  });

  const daysWithExercises = useMemo(
    () => WEEKDAYS.filter((d) => (dayExercises[d.full] || []).length > 0),
    [dayExercises]
  );

  const duplicateDayExercises = () => {
    if (!copyDayFrom || !copyDayTo) {
      toast.error("Selecione o dia de origem e o dia de destino.");
      return;
    }
    if (copyDayFrom === copyDayTo) {
      toast.error("Selecione dias diferentes.");
      return;
    }
    const source = dayExercises[copyDayFrom] || [];
    if (!source.length) {
      toast.error("O dia de origem não tem exercícios.");
      return;
    }
    setDayExercises((prev) => ({
      ...prev,
      [copyDayTo]: source.map((exercise) => ({ ...exercise })),
    }));
    const targetIndex = WEEKDAYS.findIndex((d) => d.full === copyDayTo);
    if (targetIndex >= 0) setSelectedDayIndex(targetIndex);
    const fromShort = WEEKDAYS.find((d) => d.full === copyDayFrom)?.short || copyDayFrom;
    const toShort = WEEKDAYS.find((d) => d.full === copyDayTo)?.short || copyDayTo;
    toast.success(`Treino de ${fromShort} copiado para ${toShort}`);
  };

  const handleSave = async (activate: boolean) => {
    const selectedDayGroups = WEEKDAYS
      .map((day) => ({
        day_name: day.full,
        exercises: dayExercises[day.full] || [],
      }))
      .filter((day) => day.exercises.length > 0);

    if (!workoutName.trim() || !studentId || selectedDayGroups.length === 0) {
      toast.error("Preencha nome, aluno e ao menos um exercício em um dia de treino.");
      return;
    }

    setSaving(true);
    const result = await createWorkout(
      {
        student_id: studentId,
        trainer_id: trainerId!,
        name: workoutName.trim(),
        description: "",
        is_active: activate,
      },
      selectedDayGroups
    );
    setSaving(false);

    if (!result.success) {
      toast.error(result.message || "Não foi possível salvar o treino.");
      return;
    }

    toast.success(activate ? "Treino publicado! O aluno verá ao entrar no app." : "Rascunho salvo com sucesso!");
    setView("list");
    setWorkoutName("");
    setStudentId("");
    setDayExercises({ "Segunda-feira": [] });
    setCopyDayFrom("");
    setCopyDayTo("");
    setSelectedDayIndex(0);
  };

  const toggleExercise = (id: string) => {
    setDayExercises((prev) => {
      const current = prev[selectedDayName] || [];
      const selected = current.find((exercise) => exercise.exercise_id === id);
      const next = { ...prev };

      if (selected) {
        next[selectedDayName] = current.filter((exercise) => exercise.exercise_id !== id);
        return next;
      }

      const meta = exercises.find((e) => e.id === id);
      const defaults = isCardioExercise(meta)
        ? defaultCardioPrescription()
        : defaultStrengthPrescription();

      next[selectedDayName] = [
        ...current,
        { exercise_id: id, ...defaults },
      ];
      return next;
    });
  };

  const updateExerciseDetails = (
    id: string,
    field: keyof DraftExercise,
    value: number | string
  ) => {
    setDayExercises((prev) => {
      const current = prev[selectedDayName] || [];
      return {
        ...prev,
        [selectedDayName]: current.map((exercise) =>
          exercise.exercise_id === id ? { ...exercise, [field]: value } : exercise
        ),
      };
    });
  };

  const patchExerciseDetails = (id: string, patch: Partial<DraftExercise>) => {
    setDayExercises((prev) => {
      const current = prev[selectedDayName] || [];
      return {
        ...prev,
        [selectedDayName]: current.map((exercise) =>
          exercise.exercise_id === id ? { ...exercise, ...patch } : exercise
        ),
      };
    });
  };

  if (view === "create") {
    return (
      <div className="p-4 lg:p-8 space-y-5 pb-24">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setView("list")} className="p-2 rounded-xl hover:bg-muted">
              <X className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold">Novo Treino</h2>
              <p className="text-sm text-muted-foreground">Crie cronogramas com dias, exercícios e cargas de forma rápida.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm" disabled={saving} onClick={() => void handleSave(false)}>
              Rascunho
            </Button>
            <Button variant="primary" size="sm" disabled={saving} onClick={() => void handleSave(true)}>
              {saving ? "Salvando…" : "Publicar"}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.7fr_0.9fr]">
          <div className="space-y-5">
            <GlassCard className="p-5">
              <div className="grid gap-4 lg:grid-cols-[1fr_auto] items-end">
                <div className="space-y-3">
                  <Input
                    label="Nome do treino"
                    value={workoutName}
                    onChange={(e) => setWorkoutName(e.target.value)}
                    fullWidth
                  />
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Aluno</label>
                    <select
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-border bg-input-background text-sm text-foreground"
                    >
                      <option value="">Selecione…</option>
                      {myStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                          {profiles.find((p) => p.id === s.id)?.name || s.id}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="rounded-3xl bg-slate-950/50 p-3 text-sm text-slate-300">
                  <p className="font-semibold">Dia atual</p>
                  <p className="mt-2">{selectedDayName}</p>
                  <p className="mt-1 text-xs text-slate-500">{currentDayExercises.length} exercício(s)</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-4 space-y-3">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {WEEKDAYS.map((day, index) => {
                  const isSelected = index === selectedDayIndex;
                  const hasExercises = (dayExercises[day.full] || []).length > 0;
                  return (
                    <button
                      key={day.full}
                      type="button"
                      onClick={() => {
                        if (!dayExercises[day.full]) {
                          setDayExercises((prev) => ({ ...prev, [day.full]: [] }));
                        }
                        setSelectedDayIndex(index);
                        setCopyDayTo(day.full);
                      }}
                      className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${isSelected ? "bg-primary text-white" : "bg-muted text-slate-300 hover:bg-slate-800"}`}
                    >
                      {day.short}
                      {hasExercises && <span className="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary/20 text-[10px] text-primary">{(dayExercises[day.full] || []).length}</span>}
                    </button>
                  );
                })}
              </div>

              {daysWithExercises.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-2 sm:items-end pt-1 border-t border-border">
                  <div className="flex-1 min-w-0">
                    <label className="text-xs text-muted-foreground mb-1 block">Copiar dia de</label>
                    <select
                      value={copyDayFrom}
                      onChange={(e) => setCopyDayFrom(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-border bg-input-background text-sm text-foreground"
                    >
                      <option value="">Selecione…</option>
                      {daysWithExercises.map((d) => (
                        <option key={d.full} value={d.full}>
                          {d.full} ({(dayExercises[d.full] || []).length} ex.)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="text-xs text-muted-foreground mb-1 block">Para</label>
                    <select
                      value={copyDayTo || selectedDayName}
                      onChange={(e) => setCopyDayTo(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-border bg-input-background text-sm text-foreground"
                    >
                      {WEEKDAYS
                        .filter((d) => d.full !== copyDayFrom)
                        .map((d) => (
                          <option key={d.full} value={d.full}>
                            {d.full}
                          </option>
                        ))}
                    </select>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Copy className="w-4 h-4" />}
                    className="shrink-0 sm:mb-0.5"
                    onClick={duplicateDayExercises}
                  >
                    Copiar dia
                  </Button>
                </div>
              )}
            </GlassCard>

            <GlassCard className="p-4 space-y-4">
              <div>
                <p className="text-base font-semibold">{selectedDayName} — {workoutName || "Treino sem título"}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Selecione os exercícios. Musculação: séries, reps e carga. Cardio: tempo, inclinação (esteira) e observações.
                </p>
              </div>

              <div className="space-y-3">
                {currentDayExercises.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    Nenhum exercício adicionado para este dia ainda.
                  </div>
                ) : (
                  currentDayExercises.map((exerciseGroup) => {
                    const exercise = exercises.find((e) => e.id === exerciseGroup.exercise_id);
                    const isCardio = isCardioExercise(exercise);
                    const showIncline = isCardio && isTreadmillExercise(exercise);

                    return (
                      <GlassCard key={exerciseGroup.exercise_id} className="p-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="font-semibold">{exercise?.name || "Exercício"}</p>
                            <p className="text-xs text-muted-foreground">{exercise?.category}</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => toggleExercise(exerciseGroup.exercise_id)}>
                            Remover
                          </Button>
                        </div>

                        {isCardio ? (
                          <div className="grid gap-3 sm:grid-cols-2 mt-4">
                            <Input
                              label="Tempo (minutos)"
                              type="number"
                              min={1}
                              value={exerciseGroup.reps}
                              onChange={(e) =>
                                patchExerciseDetails(exerciseGroup.exercise_id, {
                                  reps: e.target.value,
                                  series: 1,
                                  rest_seconds: 0,
                                })
                              }
                            />
                            {showIncline && (
                              <Input
                                label="Inclinação (%)"
                                type="number"
                                min={0}
                                max={30}
                                step={0.5}
                                value={exerciseGroup.load_kg}
                                onChange={(e) =>
                                  updateExerciseDetails(exerciseGroup.exercise_id, 'load_kg', Number(e.target.value))
                                }
                                hint="Apenas para esteira"
                              />
                            )}
                            <div className={showIncline ? 'sm:col-span-2' : ''}>
                              <Input
                                label="Observações"
                                value={exerciseGroup.observations}
                                onChange={(e) =>
                                  updateExerciseDetails(exerciseGroup.exercise_id, 'observations', e.target.value)
                                }
                                placeholder="Ex.: ritmo moderado, zona 2, inclinação progressiva…"
                                fullWidth
                              />
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mt-4">
                              <Input
                                label="Séries"
                                type="number"
                                min={1}
                                value={exerciseGroup.series}
                                onChange={(e) => updateExerciseDetails(exerciseGroup.exercise_id, 'series', Number(e.target.value))}
                              />
                              <Input
                                label="Repetições"
                                value={exerciseGroup.reps}
                                onChange={(e) => updateExerciseDetails(exerciseGroup.exercise_id, 'reps', e.target.value)}
                              />
                              <Input
                                label="Descanso (s)"
                                type="number"
                                min={0}
                                value={exerciseGroup.rest_seconds}
                                onChange={(e) => updateExerciseDetails(exerciseGroup.exercise_id, 'rest_seconds', Number(e.target.value))}
                              />
                              <Input
                                label="Carga (kg)"
                                type="number"
                                min={0}
                                value={exerciseGroup.load_kg}
                                onChange={(e) => updateExerciseDetails(exerciseGroup.exercise_id, 'load_kg', Number(e.target.value))}
                              />
                            </div>
                            <Input
                              label="Observações"
                              value={exerciseGroup.observations}
                              onChange={(e) => updateExerciseDetails(exerciseGroup.exercise_id, 'observations', e.target.value)}
                              fullWidth
                              className="mt-3"
                            />
                          </>
                        )}
                      </GlassCard>
                    );
                  })
                )}
              </div>
            </GlassCard>
          </div>

          <aside className="space-y-5">
            <GlassCard className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold">Banco de Exercícios</p>
                  <p className="text-xs text-muted-foreground">Filtre por grupo e adicione ao dia selecionado.</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {muscleGroups.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMuscleFilter(m)}
                    className={`rounded-full px-3 py-2 text-xs font-semibold ${muscleFilter === m ? "bg-primary text-white" : "bg-muted text-slate-300 hover:bg-slate-800"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <div className="mt-4 space-y-2 max-h-[28rem] overflow-y-auto">
                {filteredExercises.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Nenhum exercício encontrado.</p>
                ) : (
                  filteredExercises.map((exercise) => {
                    const isSelected = selectedExerciseIds.includes(exercise.id);
                    return (
                      <button
                        key={exercise.id}
                        type="button"
                        onClick={() => toggleExercise(exercise.id)}
                        className={`w-full flex items-center justify-between gap-4 rounded-3xl border px-4 py-3 text-left transition ${isSelected ? "border-primary bg-primary/10" : "border-border hover:bg-muted"}`}
                      >
                        <div>
                          <p className="font-semibold">{exercise.name}</p>
                          <p className="text-xs text-muted-foreground">{exercise.category}</p>
                        </div>
                        <Plus className={`w-4 h-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                      </button>
                    );
                  })
                )}
              </div>
            </GlassCard>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-5 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Treinos</h2>
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setView("create")}
          disabled={myStudents.length === 0}
        >
          Novo treino
        </Button>
      </div>

      {myStudents.length === 0 && (
        <GlassCard className="p-6 text-center text-sm text-muted-foreground">
          Cadastre alunos antes de montar treinos.
        </GlassCard>
      )}

      <div className="space-y-3">
        {myWorkouts.length === 0 ? (
          <GlassCard className="p-8 text-center text-muted-foreground text-sm">
            Nenhum treino cadastrado.
          </GlassCard>
        ) : (
          myWorkouts.map((w) => {
            const studentName = profiles.find((p) => p.id === w.student_id)?.name || "Aluno";
            const days = workoutDays.filter((d) => d.workout_id === w.id);
            const exCount = workoutExercises.filter((we) =>
              days.some((d) => d.id === we.workout_day_id)
            ).length;
            const expanded = expandedId === w.id;

            return (
              <GlassCard key={w.id} className="p-4">
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => setExpandedId(expanded ? null : w.id)}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                    <Dumbbell className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{w.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" /> {studentName} · {exCount} exercícios
                    </p>
                  </div>
                  <Badge variant={w.is_active ? "success" : "ghost"}>{w.is_active ? "Ativo" : "Inativo"}</Badge>
                  {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>

                {expanded && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 pt-4 border-t border-border space-y-2">
                    {workoutExercises
                      .filter((we) => days.some((d) => d.id === we.workout_day_id))
                      .map((we, i) => {
                        const ex = exercises.find((e) => e.id === we.exercise_id);
                        const isCardio = isCardioExercise(ex);
                        return (
                          <div key={we.id} className="flex items-center gap-3 text-sm p-2 rounded-lg bg-muted/30">
                            <span className="text-primary font-bold w-6">{i + 1}</span>
                            <span className="flex-1">{ex?.name || "Exercício"}</span>
                            {isCardio ? (
                              <span className="text-muted-foreground text-xs">
                                {formatCardioPrescription(we, ex)}
                              </span>
                            ) : (
                              <>
                                <span className="text-muted-foreground">{we.series}x{we.reps}</span>
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{we.rest_seconds}s</span>
                              </>
                            )}
                          </div>
                        );
                      })}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={() => toggleWorkoutActive(w.id)}>
                        {w.is_active ? "Desativar" : "Ativar"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Copy className="w-4 h-4" />}
                        disabled={myStudents.length < 2}
                        onClick={() => {
                          setDuplicateSource({ id: w.id, name: w.name, studentId: w.student_id });
                          setDuplicateTargetId("");
                        }}
                      >
                        Duplicar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        icon={<Trash2 className="w-4 h-4" />}
                        onClick={async () => {
                          const result = await deleteWorkout(w.id);
                          if (result.success) toast.success("Treino removido");
                          else toast.error(result.message || "Não foi possível excluir o treino.");
                        }}
                      >
                        Excluir
                      </Button>
                    </div>
                  </motion.div>
                )}
              </GlassCard>
            );
          })
        )}
      </div>

      {duplicateSource && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
          <GlassCard className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Duplicar treino</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Copiar <span className="text-foreground font-medium">{duplicateSource.name}</span> para outro aluno.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDuplicateSource(null);
                  setDuplicateTargetId("");
                }}
                className="p-2 rounded-xl hover:bg-muted shrink-0"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Aluno de origem</label>
              <p className="text-sm font-medium rounded-xl border border-border bg-muted/30 px-3 py-2.5">
                {profiles.find((p) => p.id === duplicateSource.studentId)?.name || "Aluno"}
              </p>
            </div>

            <div>
              <label htmlFor="duplicate-target" className="text-xs text-muted-foreground mb-1 block">
                Copiar para
              </label>
              <select
                id="duplicate-target"
                value={duplicateTargetId}
                onChange={(e) => setDuplicateTargetId(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-border bg-input-background text-sm text-foreground"
              >
                <option value="">Selecione o aluno…</option>
                {duplicateTargetOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {profiles.find((p) => p.id === s.id)?.name || s.id}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-xs text-muted-foreground">
              Dias, exercícios, séries e observações são copiados. O treino duplicado mantém o status ativo/inativo do original.
            </p>

            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  setDuplicateSource(null);
                  setDuplicateTargetId("");
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                fullWidth
                loading={duplicating}
                icon={<Copy className="w-4 h-4" />}
                disabled={!duplicateTargetId}
                onClick={() => void handleDuplicate()}
              >
                Duplicar treino
              </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
