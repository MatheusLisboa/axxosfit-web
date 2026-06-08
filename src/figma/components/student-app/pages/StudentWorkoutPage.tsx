import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Circle, Timer } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../../../../services/store';
import { useStudentData } from '../hooks/useStudentData';
import { parseDurationMinutes } from '../../../../lib/exerciseUtils';
import { PremiumSurface } from '../components/PremiumSurface';
import { SetLoadModal, type PendingSet } from '../components/SetLoadModal';
import { RestTimer } from '../components/RestTimer';

export function StudentWorkoutPage() {
  const { addExerciseLog } = useStore();
  const { studentId, activeWorkout, days, todayDay, buildExercisesForDay, parseReps } = useStudentData();

  const [selectedDayId, setSelectedDayId] = useState('');
  useEffect(() => {
    const preferred = todayDay?.id || days[0]?.id || '';
    if (preferred && !selectedDayId) setSelectedDayId(preferred);
    if (days.length && !days.some((d) => d.id === selectedDayId)) {
      setSelectedDayId(preferred);
    }
  }, [days, todayDay, selectedDayId]);

  const selectedDay = days.find((d) => d.id === selectedDayId) || todayDay;
  const todayExercises = useMemo(
    () => buildExercisesForDay(selectedDay?.id),
    [buildExercisesForDay, selectedDay?.id]
  );

  const [checkedSets, setCheckedSets] = useState<Record<string, boolean>>({});
  const [setLoads, setSetLoads] = useState<Record<string, number>>({});
  const [pendingSet, setPendingSet] = useState<PendingSet | null>(null);
  const [loadInput, setLoadInput] = useState('');
  const [repsInput, setRepsInput] = useState('');
  const [showRest, setShowRest] = useState(false);
  const [restSeconds, setRestSeconds] = useState(60);

  const exerciseUnitKey = (ex: (typeof todayExercises)[number], setIdx?: number) =>
    ex.isCardio ? `cardio-${ex.workoutExerciseId}` : `${ex.id}-${setIdx ?? 0}`;

  const totalUnits = todayExercises.reduce(
    (acc, ex) => acc + (ex.isCardio ? 1 : ex.sets),
    0
  );
  const doneUnits = todayExercises.reduce((acc, ex) => {
    if (ex.isCardio) {
      return acc + (checkedSets[exerciseUnitKey(ex)] ? 1 : 0);
    }
    return acc + Array.from({ length: ex.sets }).filter((_, i) => checkedSets[exerciseUnitKey(ex, i)]).length;
  }, 0);
  const progress = totalUnits > 0 ? Math.round((doneUnits / totalUnits) * 100) : 0;

  const handleCardioComplete = (ex: (typeof todayExercises)[number]) => {
    if (!studentId) return;
    const key = exerciseUnitKey(ex);
    if (checkedSets[key]) {
      setCheckedSets((prev) => ({ ...prev, [key]: false }));
      return;
    }

    const minutes = parseDurationMinutes(ex.durationMinutes);
    addExerciseLog({
      student_id: studentId,
      workout_exercise_id: ex.workoutExerciseId,
      completed_series: 1,
      completed_reps: minutes,
      load_used: ex.isTreadmill ? ex.inclination : 0,
      difficulty: 'moderate',
      feedback_text: ex.observations || '',
    });
    setCheckedSets((prev) => ({ ...prev, [key]: true }));
    toast.success(`Cardio registrado — ${minutes} min`);
  };

  const handleSetClick = (ex: (typeof todayExercises)[number], setIdx: number) => {
    if (ex.isCardio) return;
    const key = `${ex.id}-${setIdx}`;
    if (checkedSets[key]) {
      setCheckedSets((prev) => ({ ...prev, [key]: false }));
      setSetLoads((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }
    setPendingSet({
      key,
      exName: ex.name,
      setIdx,
      weId: ex.workoutExerciseId,
      prescribedLoad: ex.loadKg,
      reps: ex.reps,
      restSeconds: ex.rest,
    });
    setLoadInput(ex.loadKg > 0 ? String(ex.loadKg) : '');
    setRepsInput(String(parseReps(ex.reps)));
  };

  const confirmSetCompletion = () => {
    if (!pendingSet || !studentId) return;
    const load = Number(loadInput.replace(',', '.')) || 0;
    const reps = Number(repsInput) || parseReps(pendingSet.reps);

    setCheckedSets((prev) => ({ ...prev, [pendingSet.key]: true }));
    setSetLoads((prev) => ({ ...prev, [pendingSet.key]: load }));

    addExerciseLog({
      student_id: studentId,
      workout_exercise_id: pendingSet.weId,
      completed_series: pendingSet.setIdx + 1,
      completed_reps: reps,
      load_used: load,
      difficulty: 'moderate',
      feedback_text: '',
    });

    toast.success(load > 0 ? `${load} kg registrados` : 'Série concluída');
    setRestSeconds(pendingSet.restSeconds || 60);
    setPendingSet(null);
    setTimeout(() => setShowRest(true), 80);
  };

  if (!activeWorkout) {
    return (
      <PremiumSurface className="p-10 text-center">
        <p className="text-muted-foreground text-sm leading-relaxed">
          Seu personal ainda não publicou um treino para você.
        </p>
      </PremiumSurface>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Treino ativo</p>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">{activeWorkout.name}</h1>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{doneUnits}/{totalUnits} concluídos</span>
            <span className="text-foreground font-medium">{progress}%</span>
          </div>
          <div className="h-1 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full bg-foreground rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>
      </header>

      {days.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          {days.map((day) => (
            <button
              key={day.id}
              type="button"
              onClick={() => setSelectedDayId(day.id)}
              className={`shrink-0 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                selectedDay?.id === day.id
                  ? 'bg-foreground text-background'
                  : 'bg-muted/50 text-muted-foreground'
              }`}
            >
              {day.day_name}
            </button>
          ))}
        </div>
      )}

      {todayExercises.length === 0 ? (
        <PremiumSurface className="p-8 text-center text-sm text-muted-foreground">
          Nenhum exercício para este dia.
        </PremiumSurface>
      ) : (
        <div className="space-y-4">
          {todayExercises.map((ex, idx) => (
            <div key={ex.id}>
            <PremiumSurface delay={idx * 0.04} className="p-5">
              <div className="mb-4">
                <p className="font-semibold text-lg tracking-tight">{ex.name}</p>
                {ex.isCardio ? (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {ex.cardioLabel}
                    {ex.observations ? ` · ${ex.observations}` : ''}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {ex.sets}×{ex.reps} · {ex.weight} · {ex.rest}s
                  </p>
                )}
              </div>
              {ex.isCardio ? (
                <button
                  type="button"
                  onClick={() => handleCardioComplete(ex)}
                  className={`w-full min-h-12 rounded-2xl border flex items-center justify-center gap-2 transition-all ${
                    checkedSets[exerciseUnitKey(ex)]
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                      : 'border-white/[0.08] hover:border-primary/40 text-foreground'
                  }`}
                >
                  {checkedSets[exerciseUnitKey(ex)] ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Cardio concluído
                    </>
                  ) : (
                    <>
                      <Timer className="w-5 h-5 text-muted-foreground" />
                      Marcar cardio como feito
                    </>
                  )}
                </button>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: ex.sets }).map((_, i) => {
                    const key = exerciseUnitKey(ex, i);
                    const done = checkedSets[key];
                    const load = setLoads[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleSetClick(ex, i)}
                        className={`min-w-[2.75rem] h-11 px-2 rounded-2xl border flex flex-col items-center justify-center transition-all ${
                          done
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                            : 'border-white/[0.08] hover:border-primary/40'
                        }`}
                      >
                        {done ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            {load > 0 && <span className="text-[9px] font-bold mt-0.5">{load}kg</span>}
                          </>
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </PremiumSurface>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {pendingSet && (
          <SetLoadModal
            pending={pendingSet}
            loadInput={loadInput}
            repsInput={repsInput}
            onLoadChange={setLoadInput}
            onRepsChange={setRepsInput}
            onConfirm={confirmSetCompletion}
            onCancel={() => setPendingSet(null)}
          />
        )}
        {showRest && <RestTimer seconds={restSeconds} onComplete={() => setShowRest(false)} />}
      </AnimatePresence>
    </div>
  );
}
