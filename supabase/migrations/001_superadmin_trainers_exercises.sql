-- AxosFit — Superadmin: tabela trainers, colunas extras em exercises, políticas admin
-- Execute no SQL Editor do Supabase se ainda não existir.

-- Extensão trainers (metadados do personal além de profiles)
CREATE TABLE IF NOT EXISTS public.trainers (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  cref TEXT NOT NULL DEFAULT '',
  specialties TEXT[] NOT NULL DEFAULT '{}',
  bio TEXT,
  whatsapp TEXT,
  plan TEXT DEFAULT 'Bronze' CHECK (plan IN ('Bronze', 'Silver', 'Gold', 'starter', 'pro', 'studio')),
  cpf TEXT,
  city TEXT,
  state TEXT,
  instagram TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;

-- Colunas extras em exercises (compatível com app legado category/description)
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS equipment TEXT;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS difficulty TEXT;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS instructions TEXT;

-- Função: admin da plataforma (e-mail fixo ou role admin)
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

-- Profiles: admin pode inserir/atualizar qualquer perfil
DROP POLICY IF EXISTS "Platform admin manage profiles" ON public.profiles;
CREATE POLICY "Platform admin manage profiles"
ON public.profiles FOR ALL
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

-- Trainers
DROP POLICY IF EXISTS "Trainers readable" ON public.trainers;
CREATE POLICY "Trainers readable"
ON public.trainers FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Platform admin manage trainers" ON public.trainers;
CREATE POLICY "Platform admin manage trainers"
ON public.trainers FOR ALL
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS "Trainer updates own row" ON public.trainers;
CREATE POLICY "Trainer updates own row"
ON public.trainers FOR UPDATE
USING (auth.uid() = id);

-- Exercises: admin gerencia biblioteca global (trainer_id IS NULL)
DROP POLICY IF EXISTS "Platform admin manage global exercises" ON public.exercises;
CREATE POLICY "Platform admin manage global exercises"
ON public.exercises FOR ALL
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

-- Garantir perfil admin para superadmin (ajuste manual se necessário)
UPDATE public.profiles
SET role = 'admin', updated_at = NOW()
WHERE lower(email) IN (
  'matheus.fillipe@hotmail.com',
  'matheus.fillipe.farias.lisboa@gmail.com'
);
