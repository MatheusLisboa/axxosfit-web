/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'trainer' | 'student' | 'admin';

export interface Profile {
  id: string; // UUID correspondente ao Supabase Auth User ID
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  password?: string;
  is_first_login?: boolean;
  status?: 'active' | 'inactive';
  cpf?: string;
  address?: string;
  birthdate?: string;
  phone?: string;
  gender?: 'M' | 'F';
}

export interface Trainer {
  id: string; // Fkey para profiles.id
  cref: string; // Conselho Regional de Educação Física
  specialties: string[];
  bio?: string;
  whatsapp?: string;
  created_at: string;
  plan?: 'Starter' | 'Pro' | 'Studio';
  cpf?: string;
  address?: string;
  birthdate?: string;
  city?: string;
  state?: string;
  instagram?: string;
  asaas_customer_id?: string;
}

export interface TrainerPayment {
  id: string;
  trainer_id: string;
  plan: 'Starter' | 'Pro' | 'Studio';
  amount: number;
  due_date: string;
  status: 'paid' | 'pending' | 'overdue';
  payment_date?: string;
}

export interface Student {
  id: string; // Fkey para profiles.id
  trainer_id: string; // Fkey para profiles.id (do personal trainer)
  objective: string;
  initial_height: number; // em cm
  initial_weight: number; // em kg
  current_height: number;
  current_weight: number;
  body_fat_percentage?: number;
  injuries_restrictions?: string;
  status: 'active' | 'inactive';
  created_at: string;
  // Campos auxiliares para facilitar UI
  name?: string;
  email?: string;
  avatar_url?: string;
  cpf?: string;
  address?: string;
  birthdate?: string;
  phone?: string;
  gender?: 'M' | 'F';
  monthly_fee?: number;
  due_day?: number;
  next_due_date?: string;
}

export interface Workout {
  id: string;
  student_id: string;
  trainer_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

export interface WorkoutDay {
  id: string;
  workout_id: string;
  day_name: string; // ex: "Segunda-feira", "Treino A", etc.
  sort_order: number;
  created_at: string;
}

export interface Exercise {
  id: string;
  name: string;
  category: string; // grupo muscular (UI) — no Supabase: muscle_group
  description?: string;
  video_url?: string;
  equipment?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  instructions?: string;
  is_global?: boolean;
  trainer_id?: string | null;
  created_at: string;
}

export type TrainerPlanTier = 'Starter' | 'Pro' | 'Studio';

export interface CreateTrainerInput {
  name: string;
  email: string;
  password?: string;
  cref: string;
  specialties: string[];
  bio?: string;
  whatsapp?: string;
  plan?: TrainerPlanTier;
  cpf?: string;
  city?: string;
  state?: string;
  instagram?: string;
  gender?: 'M' | 'F';
  birthdate?: string;
  sendCredentialsNote?: boolean;
}

export interface RegisterTrainerInput {
  name: string;
  email: string;
  password: string;
  cpf?: string;
  cref: string;
  phone?: string;
  birthdate?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  bio?: string;
  specialties?: string[];
}

export interface CreateStudentInput {
  name: string;
  email: string;
  password?: string;
  trainer_id?: string;
  objective?: string;
  initial_height?: number;
  initial_weight?: number;
  body_fat_percentage?: number;
  injuries_restrictions?: string;
  cpf?: string;
  phone?: string;
  birthdate?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  gender?: 'M' | 'F';
  monthly_fee?: number;
  due_day?: number;
}

export interface CreateExerciseInput {
  name: string;
  category: string;
  description?: string;
  video_url?: string;
  equipment?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  instructions?: string;
  is_global?: boolean;
}

export interface WorkoutExercise {
  id: string;
  workout_day_id: string;
  exercise_id: string;
  series: number;
  reps: string; // ex: "12", "10-12", "FALHA"
  rest_seconds: number;
  load_kg?: number;
  order_index?: number;
  observations?: string;
  created_at: string;
  // Atributos denormalizados ou carregados via join:
  exercise_name?: string;
  exercise_category?: string;
  exercise_video_url?: string;
}

export interface ExerciseLog {
  id: string;
  student_id: string;
  workout_exercise_id: string;
  date: string;
  completed_series?: number;
  completed_reps?: number;
  load_used: number; // carga real registrada pelo aluno
  difficulty: 'easy' | 'moderate' | 'hard' | 'extreme';
  feedback_text?: string;
  created_at: string;
  // Auxiliares:
  exercise_name?: string;
  day_name?: string;
}

export interface PhysicalAssessment {
  id: string;
  student_id: string;
  trainer_id: string;
  date: string;
  anamnesis: string; // histórico de saúde
  imc: number;
  body_fat_percentage: number;
  protocol: string; // ex: "Pollock 7 dobras", "Pollock 3 dobras", "Bioimpedância"
  recommendations?: string;
  created_at: string;
}

export interface BodyMeasurement {
  id: string;
  physical_assessment_id?: string; // opcional se feito isoladamente
  student_id: string;
  date: string;
  weight: number;
  height: number;
  neck?: number;
  shoulder?: number;
  chest?: number;
  waist?: number;
  abdomen?: number;
  hips?: number;
  biceps_left?: number;
  biceps_right?: number;
  biceps_left_relaxed?: number;
  biceps_right_relaxed?: number;
  biceps_left_contracted?: number;
  biceps_right_contracted?: number;
  forearm_left?: number;
  forearm_right?: number;
  thigh_left?: number;
  thigh_right?: number;
  calf_left?: number;
  calf_right?: number;
  created_at: string;
}

export interface ProgressPhoto {
  id: string;
  student_id: string;
  date: string;
  photo_url: string;
  type: 'front' | 'side' | 'back';
  caption?: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  trainer_id: string;
  plan_name: 'Starter' | 'Pro' | 'Studio';
  status: 'active' | 'canceled' | 'past_due';
  active_until: string;
  price_monthly: number;
  created_at: string;
}

export interface Payment {
  id: string;
  student_id: string;
  trainer_id: string;
  amount: number;
  description?: string;
  status: 'paid' | 'pending' | 'overdue';
  due_date: string;
  payment_date?: string;
  created_at: string;
  // Auxiliar
  student_name?: string;
}

export interface Notification {
  id: string;
  user_id: string; // Pode ser personal ou aluno
  title: string;
  message: string;
  is_read: boolean;
  type: 'workout' | 'financial' | 'inactive' | 'milestone';
  date: string;
  created_at: string;
}

export interface Achievement {
  id: string;
  student_id: string;
  title: string;
  description: string;
  icon_name: string; // ex: "award", "flame", "trophy", "shield"
  date_earned: string;
  score_points: number;
  created_at: string;
}

// Stats structures for dashboards
export interface DashboardStatsTrainer {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  completedWorkoutsThisWeek: number;
  monthlyRevenue: number;
  weeklyGrowthPercentage: number;
  upcomingRenewals: Array<{
    id: string;
    studentName: string;
    dueDate: string;
    amount: number;
    status: 'pending' | 'overdue';
  }>;
  retentionScore: number; // Extra premium: Score de retenção (0 a 100)
  satisfactionScore: number; // Extra premium: Score de progresso dos alunos
}

export interface StudentScoreCard {
  level: number;
  streakDays: number;
  totalPoints: number;
  activeWorkoutsCount: number;
  totalWorkoutsCompleted: number;
  retentionProbability: number; // Extra premium: % de chance de se manter ativo
  nextMilestonePoints: number;
}
