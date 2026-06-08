-- Superadmin: leitura de exercícios globais + gestão completa pela plataforma

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (
        p.role = 'admin'
        OR lower(p.email) IN (
          'matheus.fillipe@hotmail.com',
          'matheus.fillipe.farias.lisboa@gmail.com'
        )
      )
  );
$$;

DROP POLICY IF EXISTS "trainers_can_view_exercises" ON public.exercises;
CREATE POLICY "trainers_can_view_exercises"
ON public.exercises FOR SELECT
USING (trainer_id IS NULL OR auth.uid() = trainer_id OR public.is_platform_admin());

DROP POLICY IF EXISTS "Platform admin manage global exercises" ON public.exercises;
CREATE POLICY "Platform admin manage global exercises"
ON public.exercises FOR ALL
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS "Platform admin manage profiles" ON public.profiles;
CREATE POLICY "Platform admin manage profiles"
ON public.profiles FOR ALL
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS "Platform admin manage trainers" ON public.trainers;
CREATE POLICY "Platform admin manage trainers"
ON public.trainers FOR ALL
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());
