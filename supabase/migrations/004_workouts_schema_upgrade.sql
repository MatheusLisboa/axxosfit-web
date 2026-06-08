-- Treinos multi-dia: coluna is_active, tabela workout_days e colunas em workout_exercises

ALTER TABLE public.workouts
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE NOT NULL;

CREATE TABLE IF NOT EXISTS public.workout_days (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE NOT NULL,
  day_name TEXT NOT NULL,
  sort_order INT DEFAULT 1 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.workout_days ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'workout_days'
      AND policyname = 'Workout days accessible through workouts'
  ) THEN
    CREATE POLICY "Workout days accessible through workouts"
    ON public.workout_days FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.workouts w
        WHERE w.id = workout_id AND (
          w.trainer_id = auth.uid() OR
          w.student_id = auth.uid()
        )
      ) OR
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;
END $$;

ALTER TABLE public.workout_exercises
  ADD COLUMN IF NOT EXISTS workout_day_id UUID REFERENCES public.workout_days(id) ON DELETE CASCADE;

ALTER TABLE public.workout_exercises
  ADD COLUMN IF NOT EXISTS load_kg NUMERIC;

ALTER TABLE public.workout_exercises
  ADD COLUMN IF NOT EXISTS order_index INT DEFAULT 0;

ALTER TABLE public.workout_exercises
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW());

UPDATE public.workout_exercises
SET created_at = TIMEZONE('utc', NOW())
WHERE created_at IS NULL;

ALTER TABLE public.workout_exercises
  ALTER COLUMN created_at SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_workout_days_workout_id ON public.workout_days(workout_id);
