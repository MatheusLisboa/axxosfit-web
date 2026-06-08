-- =====================================================================
-- AXOSFIT - COMPREHENSIVE FULL-STACK FIT-SAAS DATABASE SCHEMA
-- Multi-Tenant Architecture, Row Level Security (RLS), Triggers and Seed
-- =====================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
-- Extends Supabase auth.users securely
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    whatsapp TEXT,
    role TEXT NOT NULL CHECK (role IN ('trainer', 'student', 'admin')),
    avatar_url TEXT,
    gender TEXT CHECK (gender IN ('M', 'F')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. PLANS TABLE
-- Defines the tier definitions for SaaS personal trainers
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL CHECK (slug IN ('bronze', 'silver', 'gold', 'teste', 'starter', 'pro', 'studio')),
    price DECIMAL(10, 2) NOT NULL,
    max_students INT NOT NULL, -- Bronze = 10, Silver/Gold = Unlimited, Teste = 2
    ai_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    ai_limit INT DEFAULT 0 NOT NULL,
    financial_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    gamification_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    pdf_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    custom_branding_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    whatsapp_support_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    elite_badge_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable RLS on plans
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- 3. SUBSCRIPTIONS TABLE
-- Contains active subscriptions linked to personal trainers
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES public.plans(id) ON DELETE RESTRICT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'trial', 'pending', 'canceled')),
    payment_provider TEXT NOT NULL DEFAULT 'mercado_pago',
    payment_reference TEXT, -- checkout preference_id / dynamic identification
    started_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable RLS on subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 4. STUDENTS TABLE
-- Links physical assessment tracking and trainer-student association
CREATE TABLE IF NOT EXISTS public.students (
    id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    trainer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    objective TEXT DEFAULT 'Hipertrofia e saúde geral',
    gender TEXT CHECK (gender IN ('M', 'F')),
    monthly_fee NUMERIC DEFAULT 0,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable RLS on students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- 5. WORKOUTS TABLE
-- Plan sheets representing active workout groups
CREATE TABLE IF NOT EXISTS public.workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable RLS on workouts
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

-- 6. WORKOUT_DAYS TABLE
-- Represents schedule entries inside each workout plan
CREATE TABLE IF NOT EXISTS public.workout_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE NOT NULL,
    day_name TEXT NOT NULL,
    sort_order INT DEFAULT 1 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable RLS on workout_days
ALTER TABLE public.workout_days ENABLE ROW LEVEL SECURITY;

-- 7. EXERCISES TABLE
-- Custom exercises created by trainers or generic database
CREATE TABLE IF NOT EXISTS public.exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL means global/system-wide
    name TEXT NOT NULL,
    muscle_group TEXT NOT NULL,
    video_url TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable RLS on exercises
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- 8. WORKOUT_EXERCISES TABLE
-- Join table containing scheduled day exercises with workout and exercise metadata
CREATE TABLE IF NOT EXISTS public.workout_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE NOT NULL,
    workout_day_id UUID REFERENCES public.workout_days(id) ON DELETE CASCADE NOT NULL,
    exercise_id UUID REFERENCES public.exercises(id) ON DELETE RESTRICT NOT NULL,
    sets INT NOT NULL DEFAULT 4,
    reps TEXT NOT NULL DEFAULT '12',
    rest_time INT DEFAULT 60, -- in seconds
    load_kg NUMERIC,
    order_index INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable RLS on workout_exercises
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

-- Ensure existing schema upgrades for multi-day workouts
ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE NOT NULL;
ALTER TABLE public.workout_exercises ADD COLUMN IF NOT EXISTS workout_day_id UUID REFERENCES public.workout_days(id) ON DELETE CASCADE;
ALTER TABLE public.workout_exercises ADD COLUMN IF NOT EXISTS load_kg NUMERIC;
ALTER TABLE public.workout_exercises ADD COLUMN IF NOT EXISTS order_index INT DEFAULT 0;
ALTER TABLE public.workout_exercises ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL;

-- 8. PAYMENTS TABLE
-- Track user invoices and SaaS subscription billing logs
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('paid', 'pending', 'refunded', 'failed')),
    provider TEXT NOT NULL DEFAULT 'mercado_pago',
    provider_reference TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable RLS on payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 9. NOTIFICATIONS TABLE
-- Interactive user notification logs
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;


-- =====================================================================
-- MULTI-TENANT ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

-- PROFILES POLICIES
CREATE POLICY "Profiles are readable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Allow users to update their own profiles" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- PLANS POLICIES (Read-only for public, writable by admin/management)
CREATE POLICY "Plans read access for everyone" 
ON public.plans FOR SELECT USING (true);

-- SUBSCRIPTIONS POLICIES (Trainers see their own, admins everything)
CREATE POLICY "Trainers read their own subscription" 
ON public.subscriptions FOR SELECT USING (
    auth.uid() = trainer_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Trainers insert/update subscriptions and sandbox testing"
ON public.subscriptions FOR ALL USING (
    auth.uid() = trainer_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- STUDENTS POLICIES
CREATE POLICY "Trainers access their own students" 
ON public.students FOR ALL USING (
    auth.uid() = trainer_id OR
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- WORKOUTS POLICIES
CREATE POLICY "Trainers/Students access selective workouts" 
ON public.workouts FOR ALL USING (
    auth.uid() = trainer_id OR 
    auth.uid() = student_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- EXERCISES POLICIES
CREATE POLICY "Exercises readable by authenticated users" 
ON public.exercises FOR SELECT USING (true);

CREATE POLICY "Trainers manage their own exercises" 
ON public.exercises FOR ALL USING (
    auth.uid() = trainer_id OR
    trainer_id IS NULL OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- WORKOUT EXERCISES POLICIES
CREATE POLICY "Workout exercises accessible through workouts sheet" 
ON public.workout_exercises FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.workouts w 
        WHERE w.id = workout_id AND (
            w.trainer_id = auth.uid() OR 
            w.student_id = auth.uid()
        )
    ) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- WORKOUT DAYS POLICIES
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

-- PAYMENTS POLICIES
CREATE POLICY "Trainers check their billing payments" 
ON public.payments FOR SELECT USING (
    auth.uid() = trainer_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- NOTIFICATIONS POLICIES
CREATE POLICY "Trainers read their notifications" 
ON public.notifications FOR ALL USING (
    auth.uid() = trainer_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);


-- =====================================================================
-- TRIGGERS: AUTOMATED AUTH TO PROFILE CREATION & UPDATES
-- =====================================================================

-- Automatically create profiles entry on Auth sign up
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
DECLARE
    v_role TEXT := 'trainer';
    v_full_name TEXT := 'Personal Trainer';
BEGIN
    IF new.raw_user_meta_data ? 'role' THEN
        v_role := new.raw_user_meta_data->>'role';
    END IF;
    IF new.raw_user_meta_data ? 'name' THEN
        v_full_name := new.raw_user_meta_data->>'name';
    ELSIF new.raw_user_meta_data ? 'full_name' THEN
        v_full_name := new.raw_user_meta_data->>'full_name';
    END IF;

    INSERT INTO public.profiles (id, email, full_name, whatsapp, role, avatar_url, created_at, updated_at)
    VALUES (
        new.id,
        new.email,
        v_full_name,
        new.raw_user_meta_data->>'whatsapp',
        v_role,
        COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/initials/svg?seed=' || encode(convert_to(v_full_name, 'UTF8'), 'escape')),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        whatsapp = COALESCE(EXCLUDED.whatsapp, public.profiles.whatsapp);
        
    -- If registering as a trainer, automatically initiate a trialed active/pending subscription to premium Bronze plan 
    IF v_role = 'trainer' THEN
        -- Link student limits based on registration
        INSERT INTO public.subscriptions (trainer_id, plan_id, status, payment_provider, payment_reference, started_at, expires_at, created_at)
        SELECT 
            new.id, 
            plans.id, 
            'trial', 
            'mercado_pago', 
            'onboarding_free_trial', 
            NOW(), 
            NOW() + INTERVAL '7 days', 
            NOW()
        FROM public.plans plans 
        WHERE plans.slug = 'bronze' OR plans.slug = 'starter'
        ORDER BY CASE WHEN plans.slug = 'bronze' THEN 0 ELSE 1 END
        LIMIT 1;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Map to trigger
DROP TRIGGER IF EXISTS trigger_on_auth_user_signup ON auth.users;
CREATE TRIGGER trigger_on_auth_user_signup
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();


-- =====================================================================
-- PERFORMANCE CONSTRANTS AND SEARCH INDEXES
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_subscriptions_trainer ON public.subscriptions(trainer_id);
CREATE INDEX IF NOT EXISTS idx_students_trainer ON public.students(trainer_id);
CREATE INDEX IF NOT EXISTS idx_workouts_trainer_student ON public.workouts(trainer_id, student_id);


-- =====================================================================
-- SEED DATA: AUTOMATIC PORTFOLIO RECOVERY & INSERTS
-- =====================================================================

-- Populate Plans
INSERT INTO public.plans (
    name, slug, price, max_students, 
    ai_enabled, ai_limit, financial_enabled, 
    gamification_enabled, pdf_enabled, 
    custom_branding_enabled, whatsapp_support_enabled, 
    elite_badge_enabled, features
) VALUES
('Bronze', 'bronze', 99.00, 10, false, 0, false, false, false, false, false, false, '["até 10 alunos ativos", "editor de treinos padrão", "histórico de medidas básicas", "suporte via email"]'),
('Silver', 'silver', 189.00, 999999, true, 55, true, true, true, false, false, false, '["alunos ilimitados", "prescritor IA (Gemini)", "avaliação física PDF", "sistema de gamificação", "gerenciador financeiro"]'),
('Gold', 'gold', 299.00, 999999, true, 999999, true, true, true, true, true, true, '["tudo do Silver", "suporte avançado", "IA ilimitada", "selo Personal Elite", "custom branding próprio", "suporte whatsapp premium"]'),
('Teste', 'teste', 5.00, 2, true, 5, true, true, true, true, true, true, '["Até 2 alunos ativos", "Editor de treinos clássicos", "Histórico de medidas básicas", "Suporte via WhatsApp", "Plano Teste R$ 5,00"]')
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    max_students = EXCLUDED.max_students,
    ai_enabled = EXCLUDED.ai_enabled,
    ai_limit = EXCLUDED.ai_limit,
    financial_enabled = EXCLUDED.financial_enabled,
    gamification_enabled = EXCLUDED.gamification_enabled,
    pdf_enabled = EXCLUDED.pdf_enabled,
    custom_branding_enabled = EXCLUDED.custom_branding_enabled,
    whatsapp_support_enabled = EXCLUDED.whatsapp_support_enabled,
    elite_badge_enabled = EXCLUDED.elite_badge_enabled,
    features = EXCLUDED.features;

-- Fallbacks for backward compatibility
INSERT INTO public.plans (
    name, slug, price, max_students, 
    ai_enabled, ai_limit, financial_enabled, 
    gamification_enabled, pdf_enabled, 
    custom_branding_enabled, whatsapp_support_enabled, 
    elite_badge_enabled, features
) VALUES
('Bronze Fallback', 'starter', 99.00, 20, false, 0, false, false, false, false, false, false, '["Até 20 alunos ativos", "Editor de treinos clássico", "Histórico de medidas básicas", "Suporte via Email"]'),
('Silver Fallback', 'pro', 189.00, 999999, true, 55, true, true, true, false, false, false, '["Alunos ilimitados", "Prescritor IA (Gemini)", "Avaliação física com PDF", "Sistema de gamificação", "Gerenciador financeiro"]'),
('Gold Fallback', 'studio', 299.00, 999999, true, 999999, true, true, true, true, true, true, '["Tudo das anteriores", "Multi personal integrado", "Fator próprio de faturamento", "WhatsApp Enterprise integrável", "Suporte VIP 24h"]')
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    max_students = EXCLUDED.max_students,
    ai_enabled = EXCLUDED.ai_enabled,
    ai_limit = EXCLUDED.ai_limit,
    financial_enabled = EXCLUDED.financial_enabled,
    gamification_enabled = EXCLUDED.gamification_enabled,
    pdf_enabled = EXCLUDED.pdf_enabled,
    custom_branding_enabled = EXCLUDED.custom_branding_enabled,
    whatsapp_support_enabled = EXCLUDED.whatsapp_support_enabled,
    elite_badge_enabled = EXCLUDED.elite_badge_enabled,
    features = EXCLUDED.features;
