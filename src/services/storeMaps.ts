import type { Exercise } from '../types';

export function mapDbExercise(row: Record<string, unknown>): Exercise {
  return {
    id: String(row.id),
    name: String(row.name),
    category: String(row.muscle_group ?? row.category ?? 'Geral'),
    description: String(row.description ?? ''),
    video_url: String(row.video_url ?? ''),
    equipment: row.equipment as string | undefined,
    difficulty: row.difficulty as Exercise['difficulty'],
    instructions: row.instructions as string | undefined,
    is_global: row.trainer_id == null,
    trainer_id: (row.trainer_id as string) || null,
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}
