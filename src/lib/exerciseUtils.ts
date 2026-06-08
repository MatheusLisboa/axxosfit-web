import type { Exercise } from '../types';

export const CARDIO_CATEGORY = 'Cardio';

export function isCardioExercise(
  exercise?: Pick<Exercise, 'category'> | null
): boolean {
  return exercise?.category === CARDIO_CATEGORY;
}

/** Esteira / treadmill — exibe campo de inclinação. */
export function isTreadmillExercise(
  exercise?: Pick<Exercise, 'name' | 'equipment'> | null
): boolean {
  if (!exercise) return false;
  const name = exercise.name.toLowerCase();
  const equipment = (exercise.equipment || '').toLowerCase();
  return (
    name.includes('esteira') ||
    name.includes('treadmill') ||
    equipment.includes('esteira') ||
    equipment.includes('treadmill')
  );
}

export function parseDurationMinutes(value: string): number {
  const match = String(value).match(/\d+/);
  return match ? Number(match[0]) : 0;
}

export function defaultStrengthPrescription() {
  return {
    series: 3,
    reps: '10-12',
    rest_seconds: 60,
    load_kg: 0,
    observations: '',
  };
}

export function defaultCardioPrescription() {
  return {
    series: 1,
    reps: '20',
    rest_seconds: 0,
    load_kg: 0,
    observations: '',
  };
}

export function formatCardioPrescription(
  prescription: { reps: string; load_kg?: number; observations?: string },
  exercise?: Pick<Exercise, 'name' | 'equipment' | 'category'> | null
): string {
  const minutes = parseDurationMinutes(prescription.reps);
  const parts: string[] = [`${minutes || prescription.reps} min`];
  if (isTreadmillExercise(exercise) && (prescription.load_kg ?? 0) > 0) {
    parts.push(`${prescription.load_kg}% incl.`);
  }
  return parts.join(' · ');
}
