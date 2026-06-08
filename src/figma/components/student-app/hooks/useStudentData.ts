import { useMemo } from 'react';
import { useStore } from '../../../../services/store';
import {
  formatCardioPrescription,
  isCardioExercise,
  isTreadmillExercise,
  parseDurationMinutes,
} from '../../../../lib/exerciseUtils';
import { getWeekdayIndex, startOfWeek, WEEKDAY_LABELS } from '../lib/studentCopy';

function parseReps(reps: string): number {
  const match = reps.match(/\d+/);
  return match ? Number(match[0]) : 10;
}

export function useStudentData() {
  const {
    currentProfile,
    currentStudent,
    profiles,
    workouts,
    workoutDays,
    workoutExercises,
    exercises,
    exerciseLogs,
    achievements,
    getStudentScoreCard,
  } = useStore();

  const studentId = currentStudent?.id || currentProfile?.id;
  const studentProfile = profiles.find((p) => p.id === studentId) || currentProfile;
  const studentName = studentProfile?.name || 'Aluno';
  const firstName = studentName.split(/\s+/)[0] || studentName;

  const activeWorkouts = useMemo(
    () => workouts.filter((w) => w.student_id === studentId && w.is_active),
    [workouts, studentId]
  );
  const activeWorkout = activeWorkouts[0];

  const days = useMemo(
    () => workoutDays.filter((d) => activeWorkouts.some((w) => w.id === d.workout_id)),
    [workoutDays, activeWorkouts]
  );

  const todayDayIndex = getWeekdayIndex();
  const todayDay = useMemo(() => {
    if (!days.length) return undefined;
    const weekdayNames = [
      'segunda', 'terça', 'terca', 'quarta', 'quinta', 'sexta', 'sábado', 'sabado', 'domingo',
    ];
    const todayName = weekdayNames[todayDayIndex] || '';
    const match = days.find((d) => d.day_name.toLowerCase().includes(todayName));
    return match || days[todayDayIndex % days.length] || days[0];
  }, [days, todayDayIndex]);

  const myLogs = useMemo(
    () => exerciseLogs.filter((l) => l.student_id === studentId),
    [exerciseLogs, studentId]
  );

  const weekStart = startOfWeek();
  const weekFrequency = useMemo(() => {
    return WEEKDAY_LABELS.map((label, idx) => {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + idx);
      const dateKey = dayDate.toISOString().split('T')[0];
      const trained = myLogs.some((log) => log.date === dateKey || log.date.startsWith(dateKey));
      return { label, trained, isToday: idx === todayDayIndex };
    });
  }, [myLogs, weekStart, todayDayIndex]);

  const sessionsThisWeek = useMemo(() => {
    const uniqueDays = new Set<string>();
    myLogs.forEach((log) => {
      const logDate = new Date(log.date + 'T12:00:00');
      if (logDate >= weekStart) uniqueDays.add(log.date.split('T')[0]);
    });
    return uniqueDays.size;
  }, [myLogs, weekStart]);

  const trainer = useMemo(() => {
    const trainerId = currentStudent?.trainer_id;
    if (!trainerId) return null;
    const prof = profiles.find((p) => p.id === trainerId);
    if (!prof?.name?.trim()) return null;
    return {
      id: trainerId,
      name: prof.name,
      avatarUrl: prof.avatar_url,
    };
  }, [currentStudent?.trainer_id, profiles]);

  const bodyStats = useMemo(() => {
    const s = currentStudent;
    if (!s) return null;
    return {
      initialWeight: s.initial_weight,
      currentWeight: s.current_weight,
      weightDelta: Number((s.current_weight - s.initial_weight).toFixed(1)),
      initialBf: s.body_fat_percentage,
      currentBf: s.body_fat_percentage,
    };
  }, [currentStudent]);

  const score = studentId ? getStudentScoreCard(studentId) : null;

  const loadEvolution = useMemo(() => {
    const byExercise = new Map<string, { name: string; entries: { date: string; load: number }[] }>();
    myLogs.forEach((log) => {
      const we = workoutExercises.find((w) => w.id === log.workout_exercise_id);
      const ex = we ? exercises.find((e) => e.id === we.exercise_id) : null;
      const name = ex?.name || 'Exercício';
      const key = log.workout_exercise_id;
      if (!byExercise.has(key)) byExercise.set(key, { name, entries: [] });
      byExercise.get(key)!.entries.push({ date: log.date, load: log.load_used });
    });
    return [...byExercise.values()]
      .map((item) => {
        const sorted = [...item.entries].sort((a, b) => a.date.localeCompare(b.date));
        const maxLoad = Math.max(...sorted.map((e) => e.load), 0);
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        return {
          name: item.name,
          maxLoad,
          delta: first && last ? last.load - first.load : 0,
          sorted,
        };
      })
      .filter((item) => item.sorted.some((e) => e.load > 0))
      .sort((a, b) => b.maxLoad - a.maxLoad);
  }, [myLogs, workoutExercises, exercises]);

  const userAchievements = useMemo(
    () => achievements.filter((a) => a.student_id === studentId),
    [achievements, studentId]
  );

  const buildExercisesForDay = (dayId?: string) => {
    const day = days.find((d) => d.id === dayId) || todayDay;
    if (!day) return [];
    return workoutExercises
      .filter((we) => we.workout_day_id === day.id)
      .map((we) => {
        const ex = exercises.find((e) => e.id === we.exercise_id);
        const isCardio = isCardioExercise(ex);
        const isTreadmill = isTreadmillExercise(ex);
        return {
          id: we.id,
          workoutExerciseId: we.id,
          name: ex?.name || 'Exercício',
          isCardio,
          isTreadmill,
          durationMinutes: we.reps,
          inclination: Number(we.load_kg || 0),
          observations: we.observations || '',
          cardioLabel: isCardio ? formatCardioPrescription(we, ex) : undefined,
          sets: isCardio ? 1 : we.series,
          reps: we.reps,
          weight: isCardio ? '—' : we.load_kg ? `${we.load_kg}kg` : '—',
          loadKg: isCardio ? 0 : Number(we.load_kg || 0),
          rest: isCardio ? 0 : we.rest_seconds,
          parseReps: () => (isCardio ? parseDurationMinutes(we.reps) : parseReps(we.reps)),
        };
      });
  };

  return {
    studentId,
    studentProfile,
    studentName,
    firstName,
    currentStudent,
    activeWorkout,
    days,
    todayDay,
    myLogs,
    weekFrequency,
    sessionsThisWeek,
    trainer,
    bodyStats,
    score,
    loadEvolution,
    userAchievements,
    buildExercisesForDay,
    parseReps,
  };
}

export type StudentExerciseRow = ReturnType<ReturnType<typeof useStudentData>['buildExercisesForDay']>[number];
