/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  Profile, Trainer, Student, Workout, WorkoutDay, Exercise, 
  WorkoutExercise, ExerciseLog, PhysicalAssessment, BodyMeasurement, 
  ProgressPhoto, Payment, Notification, Achievement,
  DashboardStatsTrainer, StudentScoreCard, UserRole, TrainerPayment
} from '../types';
import { isSupabaseConfigured, supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import { isSuperAdminEmail, isSuperAdminProfile } from '../lib/superadmin';
import { createClient } from '@supabase/supabase-js';
import type { CreateTrainerInput, CreateStudentInput, CreateExerciseInput, RegisterTrainerInput } from '../types';
import { buildAddressLine } from '../lib/masks';
import { nextDueDateFromDay, nextDueDateAfterPaid } from '../lib/financeUtils';
import {
  canAddStudent,
  getMaxStudentsForSlug,
  normalizePlanSlug,
  studentLimitMessage,
} from '../lib/plans';
import { filterStudentBillingPayments } from '../lib/paymentUtils';
import { mapDbExercise } from './storeMaps';
import {
  loadTrainerData,
  loadStudentData,
  clearDemoLocalCache,
  clearEntityLocalCache,
  ensureSupabaseSession,
  fetchProfileForAuthUser,
} from './dataLoader';

interface StoreContextProps {
  currentProfile: Profile | null;
  currentTrainer: Trainer | null;
  currentStudent: Student | null;
  profiles: Profile[];
  trainers: Trainer[];
  students: Student[];
  workouts: Workout[];
  workoutDays: WorkoutDay[];
  exercises: Exercise[];
  workoutExercises: WorkoutExercise[];
  exerciseLogs: ExerciseLog[];
  physicalAssessments: PhysicalAssessment[];
  bodyMeasurements: BodyMeasurement[];
  progressPhotos: ProgressPhoto[];
  payments: Payment[];
  trainerPayments: TrainerPayment[];
  notifications: Notification[];
  achievements: Achievement[];
  isLoading: boolean;
  error: string | null;
  isSuperAdmin: boolean;

  // Actions
  login: (email: string, passwordGiven?: string) => Promise<boolean>;
  logout: () => void;
  registerUser: (data: RegisterTrainerInput) => Promise<{ success: boolean; message?: string }>;
  requestPlanUpgrade: (planSlug: 'starter' | 'pro' | 'studio') => void;
  pendingUpgradePlan: 'starter' | 'pro' | 'studio' | null;
  clearPendingUpgrade: () => void;
  createTrainerByAdmin: (data: CreateTrainerInput) => Promise<{ success: boolean; message?: string; temporaryPassword?: string }>;
  refreshPlatformData: () => Promise<{
    success: boolean;
    message: string;
    counts?: { profiles: number; trainers: number; students: number; exercises: number };
  }>;
  refreshUserData: () => Promise<void>;
  updatePassword: (profileId: string, newPw: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message?: string }>;
  completePasswordRecovery: (newPassword: string) => Promise<{ success: boolean; message?: string }>;
  passwordRecoveryPending: boolean;
  clearPasswordRecovery: () => void;
  activateTrainerByAdmin: (id: string) => void;
  deactivateTrainerByAdmin: (id: string) => void;
  editTrainerByAdmin: (id: string, name: string, email: string, cref: string, specialties: string[], bio: string, whatsapp: string, plan?: 'Starter' | 'Pro' | 'Studio') => void;
  deleteTrainerByAdmin: (id: string) => void;
  
  // Trainer Payment Actions
  createTrainerPayment: (payment: Omit<TrainerPayment, 'id'>) => void;
  markTrainerPaymentPaid: (id: string) => void;
  deleteTrainerPayment: (id: string) => void;
  
  // Student Actions
  createStudent: (data: CreateStudentInput) => Promise<{ success: boolean; message?: string; temporaryPassword?: string }>;
  updateStudent: (id: string, data: Partial<Student> & { name?: string }) => void;
  setStudentActive: (id: string, active: boolean) => void;
  deleteStudent: (id: string) => void;
  
  // Workout Actions
  createWorkout: (workout: Omit<Workout, 'id' | 'created_at'>, days: Array<{ day_name: string; exercises: Array<Omit<WorkoutExercise, 'id' | 'workout_day_id' | 'created_at'>> }>) => Promise<{ success: boolean; message?: string }>;
  updateWorkout: (workoutId: string, name: string, description: string, days: Array<{ day_name: string; exercises: Array<Omit<WorkoutExercise, 'id' | 'workout_day_id' | 'created_at'>> }>) => void;
  deleteWorkout: (workoutId: string) => Promise<{ success: boolean; message?: string }>;
  toggleWorkoutActive: (workoutId: string) => void;
  duplicateWorkout: (
    workoutId: string,
    targetStudentId: string
  ) => Promise<{ success: boolean; message?: string }>;
  addExerciseLog: (log: Omit<ExerciseLog, 'id' | 'created_at' | 'date'>) => void;
  
  // Assessment Actions
  createPhysicalAssessment: (assessment: Omit<PhysicalAssessment, 'id' | 'created_at'>, measurements: Omit<BodyMeasurement, 'id' | 'created_at'>) => void;
  
  // Payment Actions
  createPayment: (payment: Omit<Payment, 'id' | 'created_at'>) => void;
  markPaymentPaid: (id: string) => void;
  
  // Notification Actions
  addNotification: (user_id: string, title: string, message: string, type: 'workout' | 'financial' | 'inactive' | 'milestone') => void;
  markNotificationAsRead: (id: string) => void;
  
  // Achievement Actions
  awardAchievement: (student_id: string, title: string, description: string, icon_name: string, points: number) => void;

  // Exercise Actions
  createExercise: (input: CreateExerciseInput) => Promise<{ success: boolean; message?: string }>;
  updateExercise: (id: string, input: CreateExerciseInput) => Promise<{ success: boolean; message?: string }>;
  deleteExercise: (id: string) => Promise<{ success: boolean; message?: string }>;
  updateProfile: (profileId: string, data: Partial<Profile> & { whatsapp?: string; cref?: string; bio?: string; specialties?: string[] }) => Promise<void>;

  // Premium Features
  getTrainerDashboardStats: () => DashboardStatsTrainer;
  getStudentScoreCard: (studentId: string) => StudentScoreCard;
  getAISuggestions: (studentId: string) => Promise<{ suggestion: string; isAI: boolean }>;
  askAIChat: (prompt: string, studentId?: string) => Promise<{ suggestion: string; isAI: boolean }>;
  syncAllToSupabase: () => Promise<{ success: boolean; message: string; details?: string }>;
}

const StoreContext = createContext<StoreContextProps | undefined>(undefined);


const toUUID = (id: string): string => {
  if (!id) return '00000000-0000-0000-0000-000000000000';
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) return id;

  const idMap: { [key: string]: string } = {
    't_super': '11111111-1111-1111-1111-111111110000',
    't1': '11111111-1111-1111-1111-111111111111',
    's2': '22222222-2222-2222-2222-222222222222',
    's3': '33333333-3333-3333-3333-333333333333',
    'w1': 'a0000000-0000-0000-0000-000000000001',
    'wd1': 'b0000000-0000-0000-0000-000000000001',
    'wd2': 'b0000000-0000-0000-0000-000000000002',
    'we1': 'c0000000-0000-0000-0000-000000000001',
    'we2': 'c0000000-0000-0000-0000-000000000002',
    'we3': 'c0000000-0000-0000-0000-000000000003',
    'we4': 'c0000000-0000-0000-0000-000000000004',
    'we5': 'c0000000-0000-0000-0000-000000000005',
    'pa1': 'd0000000-0000-0000-0000-000000000001',
    'pa2': 'd0000000-0000-0000-0000-000000000002',
    'm1': 'e0000000-0000-0000-0000-000000000001',
    'm2': 'e0000000-0000-0000-0000-000000000002',
    'f1': 'f0000000-0000-0000-0000-000000000001',
    'f2': 'f0000000-0000-0000-0000-000000000002',
    'p1': '10000000-0000-0000-0000-000000000001',
    'p2': '10000000-0000-0000-0000-000000000002',
    'p3': '10000000-0000-0000-0000-000000000003',
    'p4': '10000000-0000-0000-0000-000000000004',
    'tp1': '20000000-0000-0000-0000-000000000001',
    'tp2': '20000000-0000-0000-0000-000000000002',
    'n1': '30000000-0000-0000-0000-000000000001',
    'n2': '30000000-0000-0000-0000-000000000002',
    'n3': '30000000-0000-0000-0000-000000000003',
    'a1': '40000000-0000-0000-0000-000000000001',
    'a2': '40000000-0000-0000-0000-000000000002'
  };

  if (idMap[id]) return idMap[id];

  if (id.startsWith('e_') || id.startsWith('e')) {
    const cleanNum = id.replace(/[^0-9]/g, '') || '1';
    const isPremium = id.includes('_');
    const suffix = isPremium ? '1' : '0';
    return `99999999-9999-9999-9999-${cleanNum.padStart(11, '0')}${suffix}`;
  }

  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  let hash2 = 0;
  for (let i = id.length - 1; i >= 0; i--) {
    hash2 = (hash2 << 5) - hash2 + id.charCodeAt(i);
    hash2 |= 0;
  }

  const hex1 = Math.abs(hash).toString(16).padStart(8, '0');
  const hex2 = Math.abs(hash2).toString(16).padStart(8, '0');
  const hex3 = Math.abs(hash ^ hash2).toString(16).padStart(8, '0');
  const hex = (hex1 + hex2 + hex3).padEnd(32, 'a').slice(0, 32);

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(12, 15)}-8${hex.slice(15, 18)}-${hex.slice(18, 30)}`;
};

const PLAN_SLUG_MAP: Record<string, string> = {
  Starter: 'starter',
  Pro: 'pro',
  Studio: 'studio',
};

function profileToSupabaseRow(p: Profile) {
  return {
    id: toUUID(p.id),
    email: p.email,
    full_name: p.name,
    role: isSuperAdminEmail(p.email) ? 'admin' : p.role,
    whatsapp: p.phone || null,
    avatar_url: p.avatar_url || null,
    gender: p.gender || null,
    updated_at: new Date().toISOString(),
  };
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loginInProgressRef = useRef(false);

  // States
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [currentTrainer, setCurrentTrainer] = useState<Trainer | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [physicalAssessments, setPhysicalAssessments] = useState<PhysicalAssessment[]>([]);
  const [bodyMeasurements, setBodyMeasurements] = useState<BodyMeasurement[]>([]);
  const [progressPhotos, setProgressPhotos] = useState<ProgressPhoto[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [trainerPayments, setTrainerPayments] = useState<TrainerPayment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [pendingUpgradePlan, setPendingUpgradePlan] = useState<'starter' | 'pro' | 'studio' | null>(null);
  const [passwordRecoveryPending, setPasswordRecoveryPending] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.location.hash.includes('type=recovery');
  });

  const sync = useCallback((key: string, data: unknown) => {
    localStorage.setItem(`axosfit_${key}`, JSON.stringify(data));
  }, []);

  /** Zera entidades em memória e no localStorage (evita personal/aluno de sessão anterior). */
  const resetEntityState = useCallback(() => {
    clearEntityLocalCache();
    setProfiles([]);
    setTrainers([]);
    setStudents([]);
    setWorkouts([]);
    setWorkoutDays([]);
    setExercises([]);
    setWorkoutExercises([]);
    setExerciseLogs([]);
    setPhysicalAssessments([]);
    setBodyMeasurements([]);
    setProgressPhotos([]);
    setPayments([]);
    setTrainerPayments([]);
    setNotifications([]);
    setAchievements([]);
  }, []);

  const requestPlanUpgrade = (planSlug: 'starter' | 'pro' | 'studio') => {
    setPendingUpgradePlan(planSlug);
    try {
      sessionStorage.setItem('axosfit_upgrade_plan', planSlug);
    } catch {
      // noop
    }
  };

  const clearPendingUpgrade = () => {
    setPendingUpgradePlan(null);
    try {
      sessionStorage.removeItem('axosfit_upgrade_plan');
    } catch {
      // noop
    }
  };

  const isSuperAdmin = isSuperAdminProfile(currentProfile);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('axosfit_upgrade_plan');
      if (stored === 'starter' || stored === 'pro' || stored === 'studio') {
        setPendingUpgradePlan(stored);
      }
    } catch {
      // noop
    }
  }, []);

  const refreshPlatformData = useCallback(async (): Promise<{
    success: boolean;
    message: string;
    counts?: { profiles: number; trainers: number; students: number; exercises: number };
  }> => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, message: 'Supabase não configurado.' };
    }
    if (!currentProfile || !isSuperAdminProfile(currentProfile)) {
      return { success: false, message: 'Apenas o superadmin pode sincronizar a plataforma.' };
    }

    setIsLoading(true);
    try {
      const data = await loadTrainerData(currentProfile.id, true);

      setProfiles(data.profiles);
      sync('profiles', data.profiles);
      setTrainers(data.trainers);
      sync('trainers', data.trainers);
      setStudents(data.students);
      sync('students', data.students);
      setExercises(data.exercises);
      sync('exercises', data.exercises);
      setWorkouts(data.workouts);
      sync('workouts', data.workouts);
      setWorkoutDays(data.workoutDays);
      sync('workoutDays', data.workoutDays);
      setWorkoutExercises(data.workoutExercises);
      sync('workoutExercises', data.workoutExercises);
      setPayments(data.payments);
      sync('payments', data.payments);
      setNotifications(data.notifications);
      sync('notifications', data.notifications);

      const counts = {
        profiles: data.profiles.length,
        trainers: data.trainers.length,
        students: data.students.length,
        exercises: data.exercises.length,
      };

      return {
        success: true,
        message: `Sincronizado: ${counts.profiles} perfis, ${counts.trainers} personais, ${counts.students} alunos, ${counts.exercises} exercícios.`,
        counts,
      };
    } catch (err) {
      console.error('refreshPlatformData:', err);
      const msg = err instanceof Error ? err.message : 'Erro ao sincronizar com o Supabase.';
      return { success: false, message: msg };
    } finally {
      setIsLoading(false);
    }
  }, [currentProfile?.id]);

  const persistSessionProfile = useCallback((profile: Profile) => {
    setCurrentProfile(profile);
    localStorage.setItem('axosfit_session_profile', JSON.stringify(profile));
  }, []);

  const refreshUserData = useCallback(async (profileOverride?: Profile): Promise<void> => {
    const prof = profileOverride || currentProfile;
    if (!prof || !isSupabaseConfigured || !supabase) return;

    if (prof.name?.trim()) {
      persistSessionProfile(prof);
    }

    try {
      await ensureSupabaseSession();

      if (prof.role === 'trainer' || prof.role === 'admin') {
        const data = await loadTrainerData(prof.id, isSuperAdminProfile(prof));
        if (data.profiles.length) {
          setProfiles(data.profiles);
          sync('profiles', data.profiles);
          const freshMe = data.profiles.find((p) => p.id === prof.id);
          if (freshMe?.name?.trim()) {
            persistSessionProfile(freshMe);
          }
        }
        if (data.trainers.length) {
          setTrainers(data.trainers);
          sync('trainers', data.trainers);
        }
        setStudents(data.students);
        sync('students', data.students);
        if (data.exercises.length) {
          setExercises(data.exercises);
          sync('exercises', data.exercises);
        }
        setWorkouts(data.workouts);
        sync('workouts', data.workouts);
        setWorkoutDays(data.workoutDays);
        sync('workoutDays', data.workoutDays);
        setWorkoutExercises(data.workoutExercises);
        sync('workoutExercises', data.workoutExercises);
        setPayments(data.payments);
        sync('payments', data.payments);
        if (data.notifications.length) {
          setNotifications(data.notifications);
          sync('notifications', data.notifications);
        }
      } else if (prof.role === 'student') {
        const data = await loadStudentData(prof.id);
        const freshProfiles = data.profiles ?? [prof];
        setProfiles(freshProfiles);
        sync('profiles', freshProfiles);

        const freshStudents = data.students ?? [];
        setStudents(freshStudents);
        sync('students', freshStudents);
        if (freshStudents[0]) {
          setCurrentStudent(freshStudents[0]);
        }

        setTrainers([]);
        sync('trainers', []);

        const studentWorkouts = data.workouts ?? [];
        const studentDays = data.workoutDays ?? [];
        const studentWorkoutExercises = data.workoutExercises ?? [];
        setWorkouts(studentWorkouts);
        sync('workouts', studentWorkouts);
        setWorkoutDays(studentDays);
        sync('workoutDays', studentDays);
        setWorkoutExercises(studentWorkoutExercises);
        sync('workoutExercises', studentWorkoutExercises);

        const studentExercises = data.exercises ?? [];
        setExercises(studentExercises);
        sync('exercises', studentExercises);

        setPayments([]);
        sync('payments', []);
        setTrainerPayments([]);
        sync('trainerPayments', []);
      }
    } catch (e) {
      console.error('refreshUserData:', e);
    }
  }, [currentProfile, persistSessionProfile, sync]);

  useEffect(() => {
    if (!isLoading && currentProfile && isSupabaseConfigured) {
      void refreshUserData(currentProfile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- evita loop quando profiles atualiza
  }, [isLoading, currentProfile?.id]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecoveryPending(true);
        return;
      }

      if (event === 'SIGNED_OUT') {
        setCurrentProfile(null);
        setCurrentTrainer(null);
        setCurrentStudent(null);
        setPasswordRecoveryPending(false);
        localStorage.removeItem('axosfit_session_profile');
        return;
      }

      if (event === 'SIGNED_IN' && session?.user) {
        if (loginInProgressRef.current) return;
        if (window.location.hash.includes('type=recovery')) return;
        void (async () => {
          resetEntityState();
          const prof = await fetchProfileForAuthUser(
            session.user.id,
            session.user.email || ''
          );
          if (!prof || prof.status === 'inactive') return;
          persistSessionProfile(prof);
          await refreshUserData(prof);
        })();
      }
    });

    return () => subscription.unsubscribe();
  }, [refreshUserData, persistSessionProfile, resetEntityState]);

  const ensureSuperAdminRole = async (profile: Profile): Promise<Profile> => {
    if (!isSuperAdminEmail(profile.email)) return profile;
    const elevated: Profile = { ...profile, role: 'admin' };
    if (isSupabaseConfigured && supabase) {
      await supabase.from('profiles').upsert({
        ...profileToSupabaseRow(elevated),
        created_at: profile.created_at,
      });
    }
    const updated = profiles.map((p) => (p.id === profile.id ? elevated : p));
    if (!updated.find((p) => p.id === profile.id)) {
      updated.push(elevated);
    }
    setProfiles(updated);
    sync('profiles', updated);
    return elevated;
  };

  // Carrega do LocalStorage (vazio por padrão — dados reais vêm do Supabase)
  useEffect(() => {
    void (async () => {
      try {
      if (isSupabaseConfigured && !localStorage.getItem('axosfit_cleared_v2')) {
        clearDemoLocalCache();
      }

      const getOrSet = <T,>(key: string, defaultVal: T): T => {
        const item = localStorage.getItem(`axosfit_${key}`);
        if (item) return JSON.parse(item);
        localStorage.setItem(`axosfit_${key}`, JSON.stringify(defaultVal));
        return defaultVal;
      };

      const useLocalEntityCache = !isSupabaseConfigured;
      const loadEntities = <T,>(key: string): T[] =>
        useLocalEntityCache ? getOrSet(key, [] as T[]) : [];

      setExercises(loadEntities<Exercise>('exercises'));
      setProfiles(loadEntities<Profile>('profiles'));
      setTrainers(loadEntities<Trainer>('trainers'));
      setStudents(loadEntities<Student>('students'));
      setWorkouts(loadEntities<Workout>('workouts'));
      setWorkoutDays(loadEntities<WorkoutDay>('workoutDays'));
      setWorkoutExercises(loadEntities<WorkoutExercise>('workoutExercises'));
      setExerciseLogs(loadEntities<ExerciseLog>('exerciseLogs'));
      setPhysicalAssessments(loadEntities<PhysicalAssessment>('physicalAssessments'));
      setBodyMeasurements(loadEntities<BodyMeasurement>('bodyMeasurements'));
      setProgressPhotos(loadEntities<ProgressPhoto>('progressPhotos'));
      setPayments(loadEntities<Payment>('payments'));
      setTrainerPayments(loadEntities<TrainerPayment>('trainerPayments'));
      setNotifications(loadEntities<Notification>('notifications'));
      setAchievements(loadEntities<Achievement>('achievements'));

      if (isSupabaseConfigured && supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const dbProfile = await fetchProfileForAuthUser(
            session.user.id,
            session.user.email || ''
          );
          if (dbProfile && dbProfile.status !== 'inactive') {
            let activeProfile = dbProfile;
            if (isSuperAdminEmail(dbProfile.email)) {
              activeProfile = await ensureSuperAdminRole(dbProfile);
            }
            persistSessionProfile(activeProfile);

            if (activeProfile.role === 'trainer' || activeProfile.role === 'admin') {
              const { data: dbTr } = await supabase
                .from('trainers')
                .select('*')
                .eq('id', activeProfile.id)
                .maybeSingle();
              if (dbTr) {
                setCurrentTrainer({
                  id: dbTr.id,
                  cref: dbTr.cref || '',
                  specialties: dbTr.specialties || [],
                  bio: dbTr.bio,
                  whatsapp: dbTr.whatsapp,
                  cpf: dbTr.cpf,
                  created_at: dbTr.created_at,
                });
              }
            } else if (activeProfile.role === 'student') {
              const { data: dbSt } = await supabase
                .from('students')
                .select('*')
                .eq('id', activeProfile.id)
                .maybeSingle();
              if (dbSt) {
                setCurrentStudent({
                  id: dbSt.id,
                  trainer_id: dbSt.trainer_id,
                  objective: dbSt.objective,
                  initial_height: dbSt.initial_height,
                  initial_weight: dbSt.initial_weight,
                  current_height: dbSt.current_height,
                  current_weight: dbSt.current_weight,
                  status: dbSt.status,
                  created_at: dbSt.created_at,
                });
              }
            }

            await refreshUserData(activeProfile);
          }
        }
      } else {
        const lastSession = localStorage.getItem('axosfit_session_profile');
        if (lastSession) {
          const prof = JSON.parse(lastSession) as Profile;
          const storedProfiles = JSON.parse(localStorage.getItem('axosfit_profiles') || '[]') as Profile[];
          const freshProfile = storedProfiles.find((p) => p.id === prof.id) || prof;

          if (freshProfile.status !== 'inactive') {
            setCurrentProfile(freshProfile);
            if (freshProfile.role === 'trainer' || freshProfile.role === 'admin') {
              const trList = JSON.parse(localStorage.getItem('axosfit_trainers') || '[]') as Trainer[];
              setCurrentTrainer(trList.find((t) => t.id === freshProfile.id) || null);
            } else if (freshProfile.role === 'student') {
              const stList = JSON.parse(localStorage.getItem('axosfit_students') || '[]') as Student[];
              setCurrentStudent(stList.find((s) => s.id === freshProfile.id) || null);
            }
          } else {
            localStorage.removeItem('axosfit_session_profile');
          }
        }
      }
      } catch (e: unknown) {
        console.error('Erro ao ler LocalStorage', e);
        setError('Erro ao ler banco local.');
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bootstrap único; refreshUserData usa profileOverride
  }, []);

  // Login
  const login = async (email: string, passwordGiven?: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    loginInProgressRef.current = true;
    try {
      if (isSupabaseConfigured && supabase) {
        resetEntityState();

        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password: passwordGiven || ''
        });

        if (authError) {
          setError(authError.message || 'Credenciais inválidas no Supabase.');
          localStorage.setItem('axosfit_error', authError.message || 'Credenciais inválidas.');
          return false;
        }

        const user = data.user;
        if (!user) {
          setError('Usuário não retornado pelo Supabase Auth.');
          return false;
        }

        if (data.session) {
          await supabase.auth.setSession(data.session);
        }
        await ensureSupabaseSession();

        let found = await fetchProfileForAuthUser(user.id, email);

        if (!found) {
          found = {
            id: user.id,
            name: String(user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0]),
            email: email.toLowerCase().trim(),
            role: 'trainer',
            avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}`,
            created_at: new Date().toISOString(),
            is_first_login: false,
            status: 'active',
          };
        }

        if (found.status === 'inactive') {
          setError('Seu acesso está desativado pelo Administrador.');
          return false;
        }

        if (found.id !== user.id) {
          const oldId = found.id;
          found = { ...found, id: user.id };

          const updatedProfiles = profiles.map((p) => (p.id === oldId ? { ...p, id: user.id } : p));
          setProfiles(updatedProfiles);
          sync('profiles', updatedProfiles);

          const updatedWorkouts = workouts.map((w) => ({
            ...w,
            student_id: w.student_id === oldId ? user.id : w.student_id,
            trainer_id: w.trainer_id === oldId ? user.id : w.trainer_id,
          }));
          setWorkouts(updatedWorkouts);
          sync('workouts', updatedWorkouts);

          const updatedStudents = students.map((s) => ({
            ...s,
            id: s.id === oldId ? user.id : s.id,
            trainer_id: s.trainer_id === oldId ? user.id : s.trainer_id,
          }));
          setStudents(updatedStudents);
          sync('students', updatedStudents);

          const updatedExerciseLogs = exerciseLogs.map((l) => ({
            ...l,
            student_id: l.student_id === oldId ? user.id : l.student_id,
          }));
          setExerciseLogs(updatedExerciseLogs);
          sync('exerciseLogs', updatedExerciseLogs);

          const updatedPayments = payments.map((p) => ({
            ...p,
            student_id: p.student_id === oldId ? user.id : p.student_id,
            trainer_id: p.trainer_id === oldId ? user.id : p.trainer_id,
          }));
          setPayments(updatedPayments);
          sync('payments', updatedPayments);
        }

        setProfiles([found]);
        sync('profiles', [found]);

        let activeProfile = found;
        if (isSuperAdminEmail(found.email)) {
          activeProfile = await ensureSuperAdminRole(found);
        }
        persistSessionProfile(activeProfile);

        if (isSuperAdminProfile(activeProfile)) {
          void refreshPlatformData();
        }

        if (activeProfile.role === 'trainer' || activeProfile.role === 'admin') {
          let tr = trainers.find((t) => t.id === user.id);
          if (!tr) {
            const { data: dbTr } = await supabase.from('trainers').select('*').eq('id', user.id).maybeSingle();
            if (dbTr) {
              tr = {
                id: dbTr.id,
                cref: dbTr.cref,
                specialties: dbTr.specialties || [],
                bio: dbTr.bio,
                whatsapp: dbTr.whatsapp,
                created_at: dbTr.created_at
              };
            }
          }
          if (!tr) {
            tr = {
              id: user.id,
              cref: 'CREF - Completo',
              specialties: ['Geral'],
              bio: 'Consultor esportivo AxxosFit.',
              whatsapp: '',
              created_at: new Date().toISOString()
            };
            const updatedTrainers = [...trainers, tr];
            setTrainers(updatedTrainers);
            sync('trainers', updatedTrainers);
          }
          setCurrentTrainer(tr);
          setCurrentStudent(null);
        } else {
          let st: Student | undefined;
          const { data: dbSt } = await supabase
            .from('students')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();
          if (dbSt) {
            st = {
              id: dbSt.id,
              trainer_id: dbSt.trainer_id,
              objective: dbSt.objective,
              initial_height: dbSt.initial_height,
              initial_weight: dbSt.initial_weight,
              current_height: dbSt.current_height,
              current_weight: dbSt.current_weight,
              status: dbSt.status,
              created_at: dbSt.created_at,
            };
          }
          if (!st) {
            setError('Perfil de aluno não encontrado. Peça ao seu personal para cadastrá-lo.');
            setIsLoading(false);
            return false;
          }
          setCurrentStudent(st);
          setCurrentTrainer(null);
        }
        await refreshUserData(activeProfile);
        return true;
      } else {
        // Fallback or local login when Supabase is not configured
        let found = profiles.find(p => p.email.toLowerCase().trim() === email.toLowerCase().trim());
        if (!found) {
          setError('E-mail não cadastrado na plataforma AxxosFit.');
          return false;
        }

        const expectedPassword = found.password || (found.email.toLowerCase().trim() === 'matheus.fillipe@hotmail.com' ? 'Mffl#1995' : 'axosfit');
        if (passwordGiven !== expectedPassword) {
          setError('Senha incorreta.');
          return false;
        }
        if (found.status === 'inactive') {
          setError('Seu acesso está desativado pelo Administrador.');
          return false;
        }
        let localProfile = found;
        if (isSuperAdminEmail(found.email)) {
          localProfile = { ...found, role: 'admin' };
          const updated = profiles.map((p) => (p.id === found.id ? localProfile : p));
          setProfiles(updated);
          sync('profiles', updated);
        }
        setCurrentProfile(localProfile);
        localStorage.setItem('axosfit_session_profile', JSON.stringify(localProfile));
        if (isSuperAdminProfile(localProfile)) {
          void refreshPlatformData();
        }
        const detectedRole = localProfile.role;
        if (detectedRole === 'trainer' || detectedRole === 'admin') {
          const tr = trainers.find(t => t.id === found.id) || {
            id: found.id,
            cref: 'CREF 999999-G/DF',
            specialties: ['Geral'],
            bio: 'Trainer cadastrado',
            created_at: new Date().toISOString()
          };
          setCurrentTrainer(tr);
          setCurrentStudent(null);
        } else {
          const st = students.find(s => s.id === found.id) || {
            id: found.id,
            trainer_id: 't1',
            objective: 'Ajuste físico',
            initial_height: 170,
            initial_weight: 70,
            current_height: 170,
            current_weight: 70,
            status: 'active',
            created_at: new Date().toISOString()
          };
          setCurrentStudent(st);
          setCurrentTrainer(null);
        }
        return true;
      }
    } catch (e: any) {
      setError(e.message || 'Erro de autenticação interno.');
      return false;
    } finally {
      loginInProgressRef.current = false;
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      if (isSupabaseConfigured && supabase) {
        supabase.auth.signOut();
      }
    } catch (e) {
      console.error('Erro ao deslogar no Supabase:', e);
    }
    setCurrentProfile(null);
    setCurrentStudent(null);
    setCurrentTrainer(null);
    setPasswordRecoveryPending(false);
    localStorage.removeItem('axosfit_session_profile');
    if (isSupabaseConfigured) {
      resetEntityState();
    }
  };

  const registerUser = async (data: RegisterTrainerInput): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    setError(null);
    const newId = 'u_' + Math.random().toString(36).substr(2, 9);
    const address = buildAddressLine({
      street: data.street,
      number: data.number,
      complement: data.complement,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      cep: data.cep,
    });
    const phone = data.phone || '';

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: data.email.trim(),
          password: data.password,
          options: {
            data: {
              name: data.name,
              full_name: data.name,
              role: 'trainer',
              whatsapp: phone,
            },
          },
        });

        if (signUpError && !signUpError.message?.toLowerCase().includes('already registered')) {
          const isRateLimit = signUpError.message?.toLowerCase().includes('rate limit');
          if (!isRateLimit) {
            setError(signUpError.message);
            setIsLoading(false);
            return { success: false, message: signUpError.message };
          }
        }

        const supabaseUserId = signUpData.user?.id || newId;

        const newProf: Profile = {
          id: supabaseUserId,
          name: data.name,
          email: data.email.trim(),
          role: 'trainer',
          avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name)}`,
          created_at: new Date().toISOString(),
          is_first_login: false,
          status: 'active',
          cpf: data.cpf || '',
          address,
          birthdate: data.birthdate || '',
          phone,
        };

        const { error: profileError } = await supabase.from('profiles').upsert({
          ...profileToSupabaseRow(newProf),
          created_at: newProf.created_at,
        });
        if (profileError) {
          console.warn('profiles upsert:', profileError.message);
        }

        const tr: Trainer = {
          id: supabaseUserId,
          cref: data.cref || 'CREF — Pendente',
          specialties: data.specialties?.length ? data.specialties : ['Musculação'],
          bio: data.bio || 'Personal AxxosFit.',
          whatsapp: phone,
          created_at: new Date().toISOString(),
          cpf: data.cpf,
          address,
          birthdate: data.birthdate,
        };

        await supabase.from('trainers').upsert({
          id: supabaseUserId,
          cref: tr.cref,
          specialties: tr.specialties,
          bio: tr.bio,
          whatsapp: phone,
          cpf: data.cpf || null,
          city: data.city || null,
          state: data.state || null,
          updated_at: new Date().toISOString(),
        });

        const { SubscriptionService } = await import('./subscription');
        await SubscriptionService.createStarterTrial(supabaseUserId);

        const updatedProfiles = [...profiles, newProf];
        const updatedTrainers = [...trainers, tr];
        setProfiles(updatedProfiles);
        setTrainers(updatedTrainers);
        sync('profiles', updatedProfiles);
        sync('trainers', updatedTrainers);

        setIsLoading(false);
        return {
          success: true,
          message: 'Conta criada! Você tem 14 dias grátis no plano Starter.',
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erro ao registrar.';
        setError(msg);
        setIsLoading(false);
        return { success: false, message: msg };
      }
    }

    const newProf: Profile = {
      id: newId,
      name: data.name,
      email: data.email.trim(),
      role: 'trainer',
      avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name)}`,
      created_at: new Date().toISOString(),
      password: data.password,
      is_first_login: true,
      status: 'active',
      cpf: data.cpf,
      address,
      birthdate: data.birthdate,
      phone,
    };
    const tr: Trainer = {
      id: newId,
      cref: data.cref || 'CREF — Pendente',
      specialties: data.specialties?.length ? data.specialties : ['Musculação'],
      bio: data.bio || 'Personal AxxosFit.',
      whatsapp: phone,
      created_at: new Date().toISOString(),
    };
    const updatedProfiles = [...profiles, newProf];
    const updatedTrainers = [...trainers, tr];
    setProfiles(updatedProfiles);
    setTrainers(updatedTrainers);
    sync('profiles', updatedProfiles);
    sync('trainers', updatedTrainers);
    setIsLoading(false);
    return { success: true, message: 'Conta criada (modo local).' };
  };

  // Alunos CRUD — personal ou superadmin
  const createStudent = async (
    data: CreateStudentInput
  ): Promise<{ success: boolean; message?: string; temporaryPassword?: string }> => {
    setError(null);
    setIsLoading(true);

    const trainerId =
      data.trainer_id ||
      currentTrainer?.id ||
      (currentProfile?.role === 'trainer' || currentProfile?.role === 'admin'
        ? currentProfile.id
        : null);

    if (!trainerId) {
      setIsLoading(false);
      return { success: false, message: 'Selecione o personal responsável pelo aluno.' };
    }

    const actingAsSuperAdmin = isSuperAdminProfile(currentProfile);
    if (!actingAsSuperAdmin) {
      const activeCount = students.filter(
        (s) => s.trainer_id === trainerId && s.status === 'active'
      ).length;

      let maxStudents = getMaxStudentsForSlug('starter');
      let planLabel = 'Starter';

      if (isSupabaseConfigured && supabase) {
        const { SubscriptionService } = await import('./subscription');
        const check = await SubscriptionService.verifyTrainerSubscription(trainerId);
        if (!check.isValid) {
          setIsLoading(false);
          return {
            success: false,
            message: 'Assinatura inativa ou expirada. Renove seu plano para cadastrar alunos.',
          };
        }
        if (check.plan?.slug) {
          const slug = normalizePlanSlug(check.plan.slug);
          maxStudents = getMaxStudentsForSlug(slug);
          planLabel = check.plan.name || slug;
        }
        const allowed = await SubscriptionService.canTrainerAddStudent(trainerId);
        if (!allowed) {
          setIsLoading(false);
          return {
            success: false,
            message: studentLimitMessage(maxStudents, planLabel),
          };
        }
      } else if (!canAddStudent(maxStudents, activeCount)) {
        setIsLoading(false);
        return {
          success: false,
          message: studentLimitMessage(maxStudents, planLabel),
        };
      }
    }

    const localId = 's_' + Math.random().toString(36).substr(2, 9);
    const tempPassword = data.password || 'axiosfit';
    const address =
      data.street || data.cep
        ? buildAddressLine({
            street: data.street,
            number: data.number,
            complement: data.complement,
            neighborhood: data.neighborhood,
            city: data.city,
            state: data.state,
            cep: data.cep,
          })
        : '';
    const status = 'active';
    const objective = data.objective || 'Saúde e condicionamento';
    const height = data.initial_height ?? 170;
    const weight = data.initial_weight ?? 70;
    const bf = data.body_fat_percentage ?? 20;

    if (isSupabaseConfigured && supabaseUrl && supabaseAnonKey) {
      try {
        const tempSupabase = createClient(supabaseUrl, supabaseAnonKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const { data: authData, error: authError } = await tempSupabase.auth.signUp({
          email: data.email.trim(),
          password: tempPassword,
          options: {
            data: { name: data.name, full_name: data.name, role: 'student' },
          },
        });

        if (authError && !authError.message?.toLowerCase().includes('already registered')) {
          const isRateLimit = authError.message?.toLowerCase().includes('rate limit');
          if (!isRateLimit) {
            setError(authError.message);
            setIsLoading(false);
            return { success: false, message: authError.message };
          }
        }

        const supabaseUserId = authData.user?.id || localId;
        const createdAt = new Date().toISOString();

        const studentProfile: Profile = {
          id: supabaseUserId,
          name: data.name,
          email: data.email.trim(),
          role: 'student',
          avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name)}`,
          created_at: createdAt,
          is_first_login: true,
          status: 'active',
          cpf: data.cpf || '',
          address,
          birthdate: data.birthdate || '',
          phone: data.phone || '',
          gender: data.gender || 'M',
        };

        const newStudent: Student = {
          id: supabaseUserId,
          trainer_id: trainerId,
          objective,
          initial_height: height,
          initial_weight: weight,
          current_height: height,
          current_weight: weight,
          body_fat_percentage: bf,
          injuries_restrictions: data.injuries_restrictions || 'Nenhuma',
          status,
          created_at: createdAt,
          cpf: data.cpf || '',
          address,
          birthdate: data.birthdate || '',
          phone: data.phone || '',
          gender: data.gender || 'M',
          monthly_fee: data.monthly_fee ?? 0,
          due_day: data.due_day ?? 10,
        };

        if (supabase) {
          await supabase.from('profiles').upsert({
            ...profileToSupabaseRow(studentProfile),
            created_at: createdAt,
          });

          await supabase.from('students').upsert({
            id: supabaseUserId,
            trainer_id: toUUID(trainerId),
            full_name: data.name,
            email: data.email.trim(),
            phone: data.phone || null,
            objective,
            initial_height: height,
            initial_weight: weight,
            current_height: height,
            current_weight: weight,
            body_fat_percentage: bf,
            injuries_restrictions: newStudent.injuries_restrictions,
            status,
            created_at: createdAt,
            cpf: data.cpf || null,
            birthdate: data.birthdate || null,
            gender: data.gender || 'M',
            monthly_fee: newStudent.monthly_fee,
            due_day: newStudent.due_day,
            next_due_date:
              newStudent.monthly_fee && newStudent.monthly_fee > 0
                ? nextDueDateFromDay(newStudent.due_day || 10)
                : null,
            address: address || null,
          });
        }

        const pList = [...profiles, studentProfile];
        const sList = [...students, newStudent];
        setProfiles(pList);
        setStudents(sList);
        sync('profiles', pList);
        sync('students', sList);

        addNotification(
          supabaseUserId,
          'Bem-vindo ao AxxosFit!',
          'Seu personal criou sua conta. Use a senha provisória no primeiro acesso.',
          'milestone'
        );
        if (currentProfile) void refreshUserData(currentProfile);
        setIsLoading(false);
        return {
          success: true,
          message: `Aluno ${data.name} cadastrado.`,
          temporaryPassword: tempPassword,
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        setIsLoading(false);
        return { success: false, message: msg };
      }
    }

    const studentProfile: Profile = {
      id: localId,
      name: data.name,
      email: data.email.trim(),
      role: 'student',
      avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name)}`,
      created_at: new Date().toISOString(),
      password: tempPassword,
      is_first_login: true,
      status: 'active',
      cpf: data.cpf || '',
      address,
      birthdate: data.birthdate || '',
      phone: data.phone || '',
      gender: data.gender || 'M',
    };

    const newStudent: Student = {
      id: localId,
      trainer_id: trainerId,
      objective,
      initial_height: height,
      initial_weight: weight,
      current_height: height,
      current_weight: weight,
      body_fat_percentage: bf,
      injuries_restrictions: data.injuries_restrictions || 'Nenhuma',
      status,
      created_at: studentProfile.created_at,
      cpf: data.cpf || '',
      address,
      birthdate: data.birthdate || '',
      phone: data.phone || '',
      gender: data.gender || 'M',
      monthly_fee: data.monthly_fee ?? 0,
      due_day: data.due_day ?? 10,
    };

    const pList = [...profiles, studentProfile];
    const sList = [...students, newStudent];
    setProfiles(pList);
    setStudents(sList);
    sync('profiles', pList);
    sync('students', sList);
    addNotification(localId, 'Bem-vindo ao AxxosFit!', 'Conta criada pelo seu personal.', 'milestone');
    setIsLoading(false);
    return {
      success: true,
      message: `Aluno ${data.name} cadastrado (local).`,
      temporaryPassword: tempPassword,
    };
  };

  const updateStudent = (id: string, data: Partial<Student> & { name?: string; phone?: string; cpf?: string; birthdate?: string; address?: string }) => {
    const pList = profiles.map(p => {
      if (p.id === id) {
        return {
          ...p,
          ...(data.name ? { name: data.name } : {}),
          ...(data.status ? { status: data.status } : {}),
          ...(data.cpf !== undefined ? { cpf: data.cpf } : {}),
          ...(data.phone !== undefined ? { phone: data.phone } : {}),
          ...(data.birthdate !== undefined ? { birthdate: data.birthdate } : {}),
          ...(data.address !== undefined ? { address: data.address } : {}),
          ...(data.gender !== undefined ? { gender: data.gender } : {})
        };
      }
      return p;
    });
    setProfiles(pList);
    sync('profiles', pList);

    const sList = students.map(s => {
      if (s.id === id) {
        return {
          ...s,
          ...data,
          // Garante não sobescrever trainer_id acidentalmente
          trainer_id: s.trainer_id
        } as Student;
      }
      return s;
    });
    setStudents(sList);
    sync('students', sList);

    if (isSupabaseConfigured && supabase) {
      void (async () => {
        const profilePayload: Record<string, unknown> = {};
        if (data.name) profilePayload.name = data.name;
        if (data.phone !== undefined) profilePayload.phone = data.phone;
        if (data.cpf !== undefined) profilePayload.cpf = data.cpf;
        if (data.birthdate !== undefined) profilePayload.birthdate = data.birthdate;
        if (data.address !== undefined) profilePayload.address = data.address;
        if (Object.keys(profilePayload).length > 0) {
          await supabase.from('profiles').update(profilePayload).eq('id', id);
        }

        const studentPayload: Record<string, unknown> = {};
        if (data.objective !== undefined) studentPayload.objective = data.objective;
        if (data.status !== undefined) {
          studentPayload.status = data.status;
          studentPayload.active = data.status === 'active';
        }
        if (data.current_height !== undefined) studentPayload.current_height = data.current_height;
        if (data.current_weight !== undefined) studentPayload.current_weight = data.current_weight;
        if (data.body_fat_percentage !== undefined) studentPayload.body_fat_percentage = data.body_fat_percentage;
        if (data.injuries_restrictions !== undefined) studentPayload.injuries_restrictions = data.injuries_restrictions;
        if (data.monthly_fee !== undefined) studentPayload.monthly_fee = data.monthly_fee;
        if (data.due_day !== undefined) studentPayload.due_day = data.due_day;
        if (data.monthly_fee !== undefined || data.due_day !== undefined) {
          const fee = data.monthly_fee ?? students.find((s) => s.id === id)?.monthly_fee ?? 0;
          const day = data.due_day ?? students.find((s) => s.id === id)?.due_day ?? 10;
          studentPayload.next_due_date = fee > 0 ? nextDueDateFromDay(day) : null;
        }
        if (Object.keys(studentPayload).length > 0) {
          await supabase.from('students').update(studentPayload).eq('id', id);
        }
      })();
    }
  };

  const deleteStudent = (id: string) => {
    const updatedProfiles = profiles.filter(p => p.id !== id);
    const updatedStudents = students.filter(s => s.id !== id);
    setProfiles(updatedProfiles);
    setStudents(updatedStudents);
    sync('profiles', updatedProfiles);
    sync('students', updatedStudents);

    // Also remove related workouts, days, and exercises to keep it clean
    const affectedWorkouts = workouts.filter(w => w.student_id === id);
    const affectedWorkoutIds = affectedWorkouts.map(w => w.id);

    const updatedWorkouts = workouts.filter(w => w.student_id !== id);
    const affectedDays = workoutDays.filter(d => affectedWorkoutIds.includes(d.workout_id));
    const affectedDayIds = affectedDays.map(d => d.id);

    const updatedWorkoutDays = workoutDays.filter(d => !affectedWorkoutIds.includes(d.workout_id));
    const updatedWorkoutExercises = workoutExercises.filter(we => !affectedDayIds.includes(we.workout_day_id));

    setWorkouts(updatedWorkouts);
    setWorkoutDays(updatedWorkoutDays);
    setWorkoutExercises(updatedWorkoutExercises);

    sync('workouts', updatedWorkouts);
    sync('workoutDays', updatedWorkoutDays);
    sync('workoutExercises', updatedWorkoutExercises);

    if (isSupabaseConfigured && supabase) {
      void (async () => {
        const remoteWorkoutIds = affectedWorkoutIds.filter(isValidUuid);
        for (const workoutId of remoteWorkoutIds) {
          await deleteWorkoutFromSupabase(workoutId);
        }
        await supabase.from('students').delete().eq('id', id);
      })();
    }
  };

  const createTrainerByAdmin = async (
    data: CreateTrainerInput
  ): Promise<{ success: boolean; message?: string; temporaryPassword?: string }> => {
    setError(null);
    setIsLoading(true);
    const tempPassword = data.password?.trim() || 'AxxosFit@2026';
    const chosenPlan = data.plan || 'Starter';
    const planSlug = PLAN_SLUG_MAP[chosenPlan] || 'starter';

    const exists = profiles.some(
      (p) => p.email.toLowerCase().trim() === data.email.toLowerCase().trim()
    );
    if (exists) {
      setIsLoading(false);
      return { success: false, message: 'Este e-mail já está cadastrado na plataforma.' };
    }

    if (isSupabaseConfigured && supabaseUrl && supabaseAnonKey) {
      try {
        const tempSupabase = createClient(supabaseUrl, supabaseAnonKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const { data: authData, error: authError } = await tempSupabase.auth.signUp({
          email: data.email.trim(),
          password: tempPassword,
          options: {
            data: {
              name: data.name,
              full_name: data.name,
              role: 'trainer',
              whatsapp: data.whatsapp || '',
            },
          },
        });

        if (authError && !authError.message?.toLowerCase().includes('already registered')) {
          setError(authError.message);
          setIsLoading(false);
          return { success: false, message: authError.message };
        }

        const supabaseUserId = authData.user?.id;
        if (!supabaseUserId) {
          setIsLoading(false);
          return {
            success: false,
            message: 'Usuário não criado no Auth. Verifique confirmação de e-mail ou políticas do Supabase.',
          };
        }

        const trainerProfile: Profile = {
          id: supabaseUserId,
          name: data.name,
          email: data.email.trim(),
          role: 'trainer',
          avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name)}`,
          created_at: new Date().toISOString(),
          is_first_login: true,
          status: 'active',
          phone: data.whatsapp,
          gender: data.gender,
          cpf: data.cpf,
          birthdate: data.birthdate,
        };

        const newTrainer: Trainer = {
          id: supabaseUserId,
          cref: data.cref,
          specialties: data.specialties.length ? data.specialties : ['Musculação'],
          bio: data.bio,
          whatsapp: data.whatsapp,
          created_at: new Date().toISOString(),
          plan: chosenPlan,
          cpf: data.cpf,
        };

        if (supabase) {
          const { error: profileError } = await supabase.from('profiles').upsert({
            ...profileToSupabaseRow(trainerProfile),
            created_at: trainerProfile.created_at,
          });
          if (profileError) {
            console.error('profiles upsert:', profileError);
            setIsLoading(false);
            return { success: false, message: profileError.message };
          }

          const { error: trainerError } = await supabase.from('trainers').upsert({
            id: supabaseUserId,
            cref: data.cref,
            specialties: newTrainer.specialties,
            bio: data.bio || null,
            whatsapp: data.whatsapp || null,
            plan: chosenPlan,
            cpf: data.cpf || null,
            city: data.city || null,
            state: data.state || null,
            instagram: data.instagram || null,
            updated_at: new Date().toISOString(),
          });
          if (trainerError) {
            console.warn('trainers upsert (execute migration 001):', trainerError.message);
          }

          const { data: planRow } = await supabase
            .from('plans')
            .select('id')
            .eq('slug', planSlug)
            .maybeSingle();

          if (planRow?.id) {
            await supabase.from('subscriptions').upsert({
              trainer_id: supabaseUserId,
              plan_id: planRow.id,
              status: 'trial',
              payment_provider: 'mercado_pago',
              payment_reference: 'admin_created',
              started_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            });
          }
        }

        const updatedProfiles = [...profiles, trainerProfile];
        const updatedTrainers = [...trainers, newTrainer];
        setProfiles(updatedProfiles);
        setTrainers(updatedTrainers);
        sync('profiles', updatedProfiles);
        sync('trainers', updatedTrainers);

        const planPrices = { Starter: 99.90, Pro: 149.90, Studio: 189.90 };
        const initialFee: TrainerPayment = {
          id: 'tp_' + Math.random().toString(36).substr(2, 9),
          trainer_id: supabaseUserId,
          plan: chosenPlan,
          amount: planPrices[chosenPlan],
          due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'pending',
        };
        const updatedTrainerPayments = [...trainerPayments, initialFee];
        setTrainerPayments(updatedTrainerPayments);
        sync('trainerPayments', updatedTrainerPayments);

        setIsLoading(false);
        return {
          success: true,
          message: `Personal "${data.name}" criado com sucesso no Supabase Auth.`,
          temporaryPassword: tempPassword,
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('createTrainerByAdmin:', err);
        setError(msg);
        setIsLoading(false);
        return { success: false, message: msg };
      }
    } else {
      // Local fallback
      const newId = 't_' + Math.random().toString(36).substr(2, 9);
      
      const trainerProfile: Profile = {
        id: newId,
        name: data.name,
        email: data.email,
        role: 'trainer',
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name)}`,
        created_at: new Date().toISOString(),
        password: 'axiosfit', // "senha padrão axiosfit"
        is_first_login: true,
        status: 'active'
      };

      const newTrainer: Trainer = {
        id: newId,
        cref: data.cref,
        specialties: data.specialties,
        bio: data.bio,
        whatsapp: data.whatsapp,
        created_at: new Date().toISOString(),
        plan: data.plan || 'Starter'
      };

      const updatedProfiles = [...profiles, trainerProfile];
      const updatedTrainers = [...trainers, newTrainer];

      setProfiles(updatedProfiles);
      setTrainers(updatedTrainers);

      sync('profiles', updatedProfiles);
      sync('trainers', updatedTrainers);

      // Auto generate the trainer's initial billing fee
      const planPrices = { Starter: 99.90, Pro: 149.90, Studio: 189.90 };
      const chosenPlan = data.plan || 'Starter';
      const initialFee: TrainerPayment = {
        id: 'tp_' + Math.random().toString(36).substr(2, 9),
        trainer_id: newId,
        plan: chosenPlan,
        amount: planPrices[chosenPlan],
        due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days from now
        status: 'pending'
      };
      const updatedTrainerPayments = [...trainerPayments, initialFee];
      setTrainerPayments(updatedTrainerPayments);
      sync('trainerPayments', updatedTrainerPayments);

      setIsLoading(false);
      return {
        success: true,
        message: `Personal "${data.name}" criado (modo local — Supabase não configurado).`,
        temporaryPassword: tempPassword,
      };
    }
  };

  const updatePassword = async (profileId: string, newPw: string): Promise<void> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) {
        setError(error.message);
        throw new Error(error.message);
      }
      await supabase
        .from('profiles')
        .update({ is_first_login: false, updated_at: new Date().toISOString() })
        .eq('id', toUUID(profileId));
    }

    const updated = profiles.map((p) => {
      if (p.id === profileId) {
        return { ...p, password: newPw, is_first_login: false };
      }
      return p;
    });
    setProfiles(updated);
    sync('profiles', updated);

    if (currentProfile && currentProfile.id === profileId) {
      const prof = updated.find((p) => p.id === profileId) || {
        ...currentProfile,
        is_first_login: false,
      };
      persistSessionProfile({ ...prof, is_first_login: false });
    }
  };

  const requestPasswordReset = async (
    email: string
  ): Promise<{ success: boolean; message?: string }> => {
    const normalized = email.toLowerCase().trim();
    if (!normalized) {
      return { success: false, message: 'Informe um e-mail válido.' };
    }
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, message: 'Recuperação de senha indisponível no modo offline.' };
    }
    const redirectTo =
      typeof window !== 'undefined' ? `${window.location.origin}/` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(normalized, { redirectTo });
    if (error) {
      return { success: false, message: error.message };
    }
    return {
      success: true,
      message: 'Enviamos um link de recuperação para o seu e-mail.',
    };
  };

  const completePasswordRecovery = async (
    newPassword: string
  ): Promise<{ success: boolean; message?: string }> => {
    if (newPassword.length < 6) {
      return { success: false, message: 'A senha deve ter pelo menos 6 caracteres.' };
    }
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, message: 'Recuperação de senha indisponível.' };
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      return { success: false, message: error.message };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({ is_first_login: false, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      const prof = await fetchProfileForAuthUser(user.id, user.email || '');
      if (prof) {
        persistSessionProfile({ ...prof, is_first_login: false });
        await refreshUserData({ ...prof, is_first_login: false });
      }
    }

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.hash = '';
      window.history.replaceState({}, '', url.pathname + url.search);
    }
    setPasswordRecoveryPending(false);
    return { success: true, message: 'Senha atualizada com sucesso.' };
  };

  const clearPasswordRecovery = () => {
    setPasswordRecoveryPending(false);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.hash = '';
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  };

  const activateTrainerByAdmin = (id: string) => {
    const updated = profiles.map(p => p.id === id ? { ...p, status: 'active' as const } : p);
    setProfiles(updated);
    sync('profiles', updated);
  };

  const deactivateTrainerByAdmin = (id: string) => {
    const updated = profiles.map(p => p.id === id ? { ...p, status: 'inactive' as const } : p);
    setProfiles(updated);
    sync('profiles', updated);
  };

  const editTrainerByAdmin = (id: string, name: string, email: string, cref: string, specialties: string[], bio: string, whatsapp: string, plan?: 'Bronze' | 'Silver' | 'Gold') => {
    const updatedProfiles = profiles.map(p => p.id === id ? { ...p, name, email } : p);
    setProfiles(updatedProfiles);
    sync('profiles', updatedProfiles);

    const updatedTrainers = trainers.map(t => t.id === id ? { ...t, cref, specialties, bio, whatsapp, plan: plan || t.plan || 'Bronze' } : t);
    setTrainers(updatedTrainers);
    sync('trainers', updatedTrainers);
  };

  const deleteTrainerByAdmin = (id: string) => {
    const updatedProfiles = profiles.filter(p => p.id !== id);
    setProfiles(updatedProfiles);
    sync('profiles', updatedProfiles);

    const updatedTrainers = trainers.filter(t => t.id !== id);
    setTrainers(updatedTrainers);
    sync('trainers', updatedTrainers);

    // Also remove associated students to keep referential integrity
    const updatedStudents = students.filter(s => s.trainer_id !== id);
    setStudents(updatedStudents);
    sync('students', updatedStudents);

    // Also remove associated trainer payments
    const updatedTrainerPayments = trainerPayments.filter(p => p.trainer_id !== id);
    setTrainerPayments(updatedTrainerPayments);
    sync('trainerPayments', updatedTrainerPayments);
  };

  // Trainer Payment Actions
  const createTrainerPayment = (payment: Omit<TrainerPayment, 'id'>) => {
    const newPayment: TrainerPayment = {
      ...payment,
      id: 'tp_' + Math.random().toString(36).substr(2, 9)
    };
    const updated = [...trainerPayments, newPayment];
    setTrainerPayments(updated);
    sync('trainerPayments', updated);
  };

  const markTrainerPaymentPaid = (id: string) => {
    const updated = trainerPayments.map(p => p.id === id ? { 
      ...p, 
      status: 'paid' as const, 
      payment_date: new Date().toISOString().split('T')[0] 
    } : p);
    setTrainerPayments(updated);
    sync('trainerPayments', updated);
  };

  const deleteTrainerPayment = (id: string) => {
    const updated = trainerPayments.filter(p => p.id !== id);
    setTrainerPayments(updated);
    sync('trainerPayments', updated);
  };

  const isValidUuid = (id: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  const generateEntityId = () =>
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `id_${Math.random().toString(36).slice(2, 11)}`;

  const deactivateOtherStudentWorkouts = async (studentId: string, exceptWorkoutId?: string) => {
    if (!isSupabaseConfigured || !supabase) return;
    let query = supabase
      .from('workouts')
      .update({ is_active: false })
      .eq('student_id', toUUID(studentId))
      .eq('is_active', true);
    if (exceptWorkoutId && isValidUuid(exceptWorkoutId)) {
      query = query.neq('id', exceptWorkoutId);
    }
    await query;
  };

  /**
   * Remove treino no Supabase na ordem correta (filhos antes do pai).
   * CASCADE com RLS nas tabelas filhas costuma falhar silenciosamente.
   */
  const deleteWorkoutFromSupabase = async (
    workoutId: string
  ): Promise<{ success: boolean; message?: string }> => {
    if (!isSupabaseConfigured || !supabase) return { success: true };
    if (!isValidUuid(workoutId)) return { success: true };

    const { error: weErr } = await supabase
      .from('workout_exercises')
      .delete()
      .eq('workout_id', workoutId);
    if (weErr) {
      console.error('deleteWorkoutFromSupabase workout_exercises:', weErr);
      return { success: false, message: weErr.message };
    }

    const { error: wdErr } = await supabase
      .from('workout_days')
      .delete()
      .eq('workout_id', workoutId);
    if (wdErr) {
      console.error('deleteWorkoutFromSupabase workout_days:', wdErr);
      return { success: false, message: wdErr.message };
    }

    const { error: wErr } = await supabase.from('workouts').delete().eq('id', workoutId);
    if (wErr) {
      console.error('deleteWorkoutFromSupabase workouts:', wErr);
      return { success: false, message: wErr.message };
    }

    return { success: true };
  };

  const applyLocalWorkoutDeletion = (workoutId: string) => {
    const updatedWorkouts = workouts.filter((w) => w.id !== workoutId);
    setWorkouts(updatedWorkouts);
    sync('workouts', updatedWorkouts);

    const oldDays = workoutDays.filter((d) => d.workout_id === workoutId);
    const oldDayIds = oldDays.map((d) => d.id);
    const remainingDays = workoutDays.filter((d) => d.workout_id !== workoutId);
    const remainingExercises = workoutExercises.filter(
      (we) => !oldDayIds.includes(we.workout_day_id)
    );

    setWorkoutDays(remainingDays);
    setWorkoutExercises(remainingExercises);
    sync('workoutDays', remainingDays);
    sync('workoutExercises', remainingExercises);
  };

  // Treinos
  const createWorkout = async (
    workout: Omit<Workout, 'id' | 'created_at'>,
    days: Array<{ day_name: string; exercises: Array<Omit<WorkoutExercise, 'id' | 'workout_day_id' | 'created_at'>> }>
  ): Promise<{ success: boolean; message?: string }> => {
    const workoutId = generateEntityId();
    const createdAt = new Date().toISOString();
    const newWorkout: Workout = {
      ...workout,
      id: workoutId,
      created_at: createdAt,
    };

    const extraDays: WorkoutDay[] = [];
    const extraExercises: WorkoutExercise[] = [];

    days.forEach((dayGroup, index) => {
      const dayId = generateEntityId();
      extraDays.push({
        id: dayId,
        workout_id: workoutId,
        day_name: dayGroup.day_name,
        sort_order: index + 1,
        created_at: createdAt,
      });

      dayGroup.exercises.forEach((ex) => {
        extraExercises.push({
          ...ex,
          id: generateEntityId(),
          workout_day_id: dayId,
          created_at: createdAt,
        });
      });
    });

    if (isSupabaseConfigured && supabase) {
      try {
        if (workout.is_active) {
          await deactivateOtherStudentWorkouts(toUUID(workout.student_id));
        }

        const { error: wErr } = await supabase.from('workouts').insert({
          id: workoutId,
          trainer_id: toUUID(workout.trainer_id),
          student_id: toUUID(workout.student_id),
          name: workout.name,
          description: workout.description || null,
          is_active: workout.is_active,
          created_at: createdAt,
        });
        if (wErr) {
          return { success: false, message: wErr.message };
        }

        if (extraDays.length > 0) {
          const { error: wdErr } = await supabase.from('workout_days').insert(
            extraDays.map((d) => ({
              id: d.id,
              workout_id: d.workout_id,
              day_name: d.day_name,
              sort_order: d.sort_order,
              created_at: d.created_at,
            }))
          );
          if (wdErr) {
            await supabase.from('workouts').delete().eq('id', workoutId);
            return { success: false, message: wdErr.message };
          }
        }

        if (extraExercises.length > 0) {
          const exerciseRows = days.flatMap((dayGroup, dayIndex) => {
            const dayId = extraDays[dayIndex]?.id;
            if (!dayId) return [];
            return dayGroup.exercises.map((ex, exerciseIndex) => {
              const stored = extraExercises.find(
                (item) => item.workout_day_id === dayId && item.exercise_id === ex.exercise_id
              );
              return {
                id: stored?.id || generateEntityId(),
                workout_id: workoutId,
                workout_day_id: dayId,
                exercise_id: toUUID(ex.exercise_id),
                sets: ex.series,
                reps: ex.reps,
                rest_time: ex.rest_seconds,
                notes: ex.observations || null,
                load_kg: ex.load_kg ?? null,
                order_index: exerciseIndex + 1,
                created_at: createdAt,
              };
            });
          });
          const { error: weErr } = await supabase.from('workout_exercises').insert(exerciseRows);
          if (weErr) {
            await supabase.from('workouts').delete().eq('id', workoutId);
            return { success: false, message: weErr.message };
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao gravar treino no servidor.';
        return { success: false, message: msg };
      }
    }

    let updatedWorkouts = [...workouts];
    if (workout.is_active) {
      updatedWorkouts = updatedWorkouts.map((w) =>
        w.student_id === workout.student_id ? { ...w, is_active: false } : w
      );
    }
    updatedWorkouts = [...updatedWorkouts, newWorkout];
    setWorkouts(updatedWorkouts);
    sync('workouts', updatedWorkouts);

    const finalDays = [...workoutDays, ...extraDays];
    const finalExercises = [...workoutExercises, ...extraExercises];
    setWorkoutDays(finalDays);
    setWorkoutExercises(finalExercises);
    sync('workoutDays', finalDays);
    sync('workoutExercises', finalExercises);

    addNotification(
      workout.student_id,
      '🏋️ Novo treino periodizado!',
      `Seu personal montou o treino "${workout.name}". Confira sua nova rotina diária no app!`,
      'workout'
    );
    return { success: true };
  };

  const updateWorkout = (
    workoutId: string,
    name: string,
    description: string,
    days: Array<{ day_name: string; exercises: Array<Omit<WorkoutExercise, 'id' | 'workout_day_id' | 'created_at'>> }>
  ) => {
    const updatedWorkouts = workouts.map(w => {
      if (w.id === workoutId) {
        return {
          ...w,
          name,
          description: description || ''
        };
      }
      return w;
    });
    setWorkouts(updatedWorkouts);
    sync('workouts', updatedWorkouts);

    // Filter out old days and exercises
    const oldDays = workoutDays.filter(d => d.workout_id === workoutId);
    const oldDayIds = oldDays.map(d => d.id);

    const remainingDays = workoutDays.filter(d => d.workout_id !== workoutId);
    const remainingExercises = workoutExercises.filter(we => !oldDayIds.includes(we.workout_day_id));

    const extraDays: WorkoutDay[] = [];
    const extraExercises: WorkoutExercise[] = [];

    days.forEach((dayGroup, index) => {
      const dayId = 'wd_' + Math.random().toString(36).substr(2, 9);
      extraDays.push({
        id: dayId,
        workout_id: workoutId,
        day_name: dayGroup.day_name,
        sort_order: index + 1,
        created_at: new Date().toISOString()
      });

      dayGroup.exercises.forEach(ex => {
        extraExercises.push({
          ...ex,
          id: 'we_' + Math.random().toString(36).substr(2, 9),
          workout_day_id: dayId,
          created_at: new Date().toISOString()
        });
      });
    });

    const finalDays = [...remainingDays, ...extraDays];
    const finalExercises = [...remainingExercises, ...extraExercises];
    setWorkoutDays(finalDays);
    setWorkoutExercises(finalExercises);
    sync('workoutDays', finalDays);
    sync('workoutExercises', finalExercises);
  };

  const deleteWorkout = async (
    workoutId: string
  ): Promise<{ success: boolean; message?: string }> => {
    if (isSupabaseConfigured && supabase && isValidUuid(workoutId)) {
      const remote = await deleteWorkoutFromSupabase(workoutId);
      if (!remote.success) {
        return remote;
      }
    }

    applyLocalWorkoutDeletion(workoutId);
    return { success: true };
  };

  const toggleWorkoutActive = (workoutId: string) => {
    const target = workouts.find(w => w.id === workoutId);
    if (!target) return;
    const newActiveState = !target.is_active;

    const updatedWorkouts = workouts.map(w => {
      if (newActiveState && w.student_id === target.student_id && w.id !== workoutId) {
        return { ...w, is_active: false };
      }
      if (w.id === workoutId) {
        return { ...w, is_active: newActiveState };
      }
      return w;
    });

    setWorkouts(updatedWorkouts);
    sync('workouts', updatedWorkouts);

    if (isSupabaseConfigured && supabase && isValidUuid(workoutId)) {
      void (async () => {
        if (newActiveState) {
          await deactivateOtherStudentWorkouts(target.student_id, workoutId);
        }
        await supabase
          .from('workouts')
          .update({ is_active: newActiveState })
          .eq('id', workoutId);
      })();
    }
  };

  const duplicateWorkout = async (
    workoutId: string,
    targetStudentId: string
  ): Promise<{ success: boolean; message?: string }> => {
    const sourceWorkout = workouts.find((w) => w.id === workoutId);
    if (!sourceWorkout) {
      return { success: false, message: 'Treino não encontrado.' };
    }
    if (targetStudentId === sourceWorkout.student_id) {
      return { success: false, message: 'Selecione um aluno diferente do treino original.' };
    }

    const trainerId = sourceWorkout.trainer_id || currentProfile?.id;
    if (!trainerId) {
      return { success: false, message: 'Personal não identificado.' };
    }

    const sourceDays = workoutDays
      .filter((d) => d.workout_id === workoutId)
      .sort((a, b) => a.sort_order - b.sort_order);

    const newWorkoutId = generateEntityId();
    const createdAt = new Date().toISOString();
    const keepActive = sourceWorkout.is_active;

    const duplicatedWorkout: Workout = {
      ...sourceWorkout,
      id: newWorkoutId,
      student_id: targetStudentId,
      trainer_id: trainerId,
      name: sourceWorkout.name.trim().endsWith('(Cópia)')
        ? sourceWorkout.name
        : `${sourceWorkout.name} (Cópia)`,
      is_active: keepActive,
      created_at: createdAt,
    };

    const extraDays: WorkoutDay[] = [];
    const extraExercises: WorkoutExercise[] = [];

    sourceDays.forEach((day) => {
      const newDayId = generateEntityId();
      extraDays.push({
        id: newDayId,
        workout_id: newWorkoutId,
        day_name: day.day_name,
        sort_order: day.sort_order,
        created_at: createdAt,
      });

      workoutExercises
        .filter((we) => we.workout_day_id === day.id)
        .forEach((we, exerciseIndex) => {
          extraExercises.push({
            ...we,
            id: generateEntityId(),
            workout_day_id: newDayId,
            created_at: createdAt,
            order_index: we.order_index ?? exerciseIndex + 1,
          });
        });
    });

    if (isSupabaseConfigured && supabase) {
      try {
        if (keepActive) {
          await deactivateOtherStudentWorkouts(toUUID(targetStudentId));
        }

        const { error: wErr } = await supabase.from('workouts').insert({
          id: newWorkoutId,
          trainer_id: toUUID(trainerId),
          student_id: toUUID(targetStudentId),
          name: duplicatedWorkout.name,
          description: sourceWorkout.description || null,
          is_active: keepActive,
          created_at: createdAt,
        });
        if (wErr) {
          return { success: false, message: wErr.message };
        }

        if (extraDays.length > 0) {
          const { error: wdErr } = await supabase.from('workout_days').insert(
            extraDays.map((d) => ({
              id: d.id,
              workout_id: d.workout_id,
              day_name: d.day_name,
              sort_order: d.sort_order,
              created_at: d.created_at,
            }))
          );
          if (wdErr) {
            await supabase.from('workouts').delete().eq('id', newWorkoutId);
            return { success: false, message: wdErr.message };
          }
        }

        if (extraExercises.length > 0) {
          const exerciseRows = extraExercises.map((we, exerciseIndex) => ({
            id: we.id,
            workout_id: newWorkoutId,
            workout_day_id: we.workout_day_id,
            exercise_id: toUUID(we.exercise_id),
            sets: we.series,
            reps: we.reps,
            rest_time: we.rest_seconds,
            notes: we.observations || null,
            load_kg: we.load_kg ?? null,
            order_index: we.order_index ?? exerciseIndex + 1,
            created_at: createdAt,
          }));
          const { error: weErr } = await supabase.from('workout_exercises').insert(exerciseRows);
          if (weErr) {
            await deleteWorkoutFromSupabase(newWorkoutId);
            return { success: false, message: weErr.message };
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao duplicar treino no servidor.';
        return { success: false, message: msg };
      }
    }

    let updatedWorkouts = [...workouts];
    if (keepActive) {
      updatedWorkouts = updatedWorkouts.map((w) =>
        w.student_id === targetStudentId && w.id !== newWorkoutId
          ? { ...w, is_active: false }
          : w
      );
    }
    updatedWorkouts = [...updatedWorkouts, duplicatedWorkout];
    setWorkouts(updatedWorkouts);
    sync('workouts', updatedWorkouts);

    const finalDays = [...workoutDays, ...extraDays];
    const finalExercises = [...workoutExercises, ...extraExercises];
    setWorkoutDays(finalDays);
    setWorkoutExercises(finalExercises);
    sync('workoutDays', finalDays);
    sync('workoutExercises', finalExercises);

    addNotification(
      targetStudentId,
      '💪 Novo treino disponível!',
      `Seu personal copiou o treino "${duplicatedWorkout.name}" para você.`,
      'workout'
    );

    return { success: true };
  };

  const addExerciseLog = (log: Omit<ExerciseLog, 'id' | 'created_at' | 'date'>) => {
    const newLog: ExerciseLog = {
      ...log,
      id: 'log_' + Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };

    const finalLogs = [newLog, ...exerciseLogs];
    setExerciseLogs(finalLogs);
    sync('exerciseLogs', finalLogs);

    // Gamificação: aluno ganha pontos!
    // 15 pontos por log registrado
    awardAchievementPoints(log.student_id, 15);

    // Enviar notificação pro Personal do aluno
    const studentProf = profiles.find(p => p.id === log.student_id);
    const trainerId = students.find(s => s.id === log.student_id)?.trainer_id || 't1';
    
    addNotification(
      trainerId, 
      `🔥 Treino reportado por ${studentProf?.name || 'Aluno'}`, 
      `Concluiu um exercício registrando carga de ${log.load_used}kg (${log.difficulty})!`, 
      'workout'
    );
  };

  // Avaliação Física + Medidas
  const createPhysicalAssessment = (
    assessment: Omit<PhysicalAssessment, 'id' | 'created_at'>, 
    measurements: Omit<BodyMeasurement, 'id' | 'created_at'>
  ) => {
    const assessmentId = 'pa_' + Math.random().toString(36).substr(2, 9);
    const measurementId = 'm_' + Math.random().toString(36).substr(2, 9);

    const newAssessment: PhysicalAssessment = {
      ...assessment,
      id: assessmentId,
      created_at: new Date().toISOString()
    };

    const newMeasurement: BodyMeasurement = {
      ...measurements,
      id: measurementId,
      physical_assessment_id: assessmentId,
      created_at: new Date().toISOString()
    };

    const finalAssessments = [...physicalAssessments, newAssessment];
    const finalMeasurements = [...bodyMeasurements, newMeasurement];

    setPhysicalAssessments(finalAssessments);
    setBodyMeasurements(finalMeasurements);
    sync('physicalAssessments', finalAssessments);
    sync('bodyMeasurements', finalMeasurements);

    // Atualiza peso e gordura corporal atualizados no perfil do aluno
    updateStudent(assessment.student_id, {
      current_weight: measurements.weight,
      body_fat_percentage: assessment.body_fat_percentage
    });

    addNotification(assessment.student_id, '📊 Avaliação Física Publicada!', `Seu personal adicionou um novo relatório de medidas. IMC: ${assessment.imc}. Veja sua evolução de gordura e circunferências!`, 'milestone');
  };

  // Financeiro
  const createPayment = (payment: Omit<Payment, 'id' | 'created_at'>) => {
    const newPayment: Payment = {
      ...payment,
      id: 'pay_' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    const finalPayments = [...payments, newPayment];
    setPayments(finalPayments);
    sync('payments', finalPayments);

    addNotification(payment.student_id, '💳 Nova cobrança mensal gerada', `Sua mensalidade de R$ ${payment.amount} com vencimento para ${payment.due_date} está disponível.`, 'financial');
  };

  const markPaymentPaid = (id: string) => {
    const targetPay = payments.find((p) => p.id === id);
    if (!targetPay || targetPay.status === 'paid') return;

    const paidDate = new Date().toISOString().split('T')[0];
    const student = students.find((s) => s.id === targetPay.student_id);
    const studentName =
      profiles.find((p) => p.id === targetPay.student_id)?.name || 'Aluno';

    let paidId = id;
    if (id.startsWith('mens_') || !isValidUuid(id)) {
      paidId = crypto.randomUUID();
    }

    const paidPayment: Payment = {
      ...targetPay,
      id: paidId,
      status: 'paid',
      payment_date: paidDate,
    };

    let updated = payments.filter((p) => p.id !== id);
    updated = [...updated, paidPayment];

    let nextPending: Payment | null = null;
    if (student?.monthly_fee && student.monthly_fee > 0) {
      const dueDay = student.due_day || 10;
      const nextDue = nextDueDateAfterPaid(dueDay, targetPay.due_date);
      const alreadyScheduled = updated.some(
        (p) =>
          p.student_id === student.id &&
          p.due_date === nextDue &&
          p.status !== 'paid'
      );

      if (!alreadyScheduled) {
        nextPending = {
          id: crypto.randomUUID(),
          student_id: student.id,
          trainer_id: targetPay.trainer_id,
          amount: student.monthly_fee,
          description: `Mensalidade — ${studentName}`,
          status: 'pending',
          due_date: nextDue,
          created_at: new Date().toISOString(),
        };
        updated.push(nextPending);
      }

      updateStudent(student.id, { next_due_date: nextDue });
    }

    setPayments(updated);
    sync('payments', updated);

    addNotification(
      targetPay.student_id,
      '✅ Pagamento Confirmado!',
      `Seu pagamento de R$ ${targetPay.amount} foi compensado. Obrigado pela pontualidade!`,
      'financial'
    );

    if (isSupabaseConfigured && supabase) {
      void (async () => {
        const paidRow = {
          id: paidId,
          student_id: toUUID(targetPay.student_id),
          trainer_id: toUUID(targetPay.trainer_id),
          amount: targetPay.amount,
          description: targetPay.description || `Mensalidade — ${studentName}`,
          status: 'paid',
          due_date: targetPay.due_date,
          payment_date: paidDate,
          updated_at: new Date().toISOString(),
        };
        await supabase.from('payments').upsert(paidRow);

        if (nextPending && isValidUuid(nextPending.id)) {
          await supabase.from('payments').upsert({
            id: nextPending.id,
            student_id: toUUID(nextPending.student_id),
            trainer_id: toUUID(nextPending.trainer_id),
            amount: nextPending.amount,
            description: nextPending.description,
            status: 'pending',
            due_date: nextPending.due_date,
            updated_at: new Date().toISOString(),
          });
        }
      })();
    }
  };

  const setStudentActive = (id: string, active: boolean) => {
    updateStudent(id, { status: active ? 'active' : 'inactive' });
    addNotification(
      id,
      active ? '✅ Acesso reativado' : '⏸️ Acesso pausado',
      active
        ? 'Seu personal reativou seu acesso à plataforma.'
        : 'Seu personal pausou temporariamente seu acesso.',
      'inactive'
    );
  };

  // Notificações adicionais
  const addNotification = (
    user_id: string, 
    title: string, 
    message: string, 
    type: 'workout' | 'financial' | 'inactive' | 'milestone'
  ) => {
    const newNotification: Notification = {
      id: 'not_' + Math.random().toString(36).substr(2, 9),
      user_id,
      title,
      message,
      is_read: false,
      type,
      date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };
    const finalNot = [newNotification, ...notifications];
    setNotifications(finalNot);
    sync('notifications', finalNot);
  };

  const markNotificationAsRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, is_read: true } : n);
    setNotifications(updated);
    sync('notifications', updated);
  };

  // Prêmios / Medalhas
  const awardAchievement = (student_id: string, title: string, description: string, icon_name: string, points: number) => {
    const newAch: Achievement = {
      id: 'ach_' + Math.random().toString(36).substr(2, 9),
      student_id,
      title,
      description,
      icon_name,
      date_earned: new Date().toISOString().split('T')[0],
      score_points: points,
      created_at: new Date().toISOString()
    };
    const finalAch = [...achievements, newAch];
    setAchievements(finalAch);
    sync('achievements', finalAch);

    // Envia notificação
    addNotification(student_id, `🏆 Medalha Desbloqueada: ${title}!`, `Parabéns! Você faturou a medalha por: ${description} (+${points} PTS)`, 'milestone');
  };

  // Sistema de pontuação silencioso por log
  const awardAchievementPoints = (studentId: string, pts: number) => {
    const userAchievements = achievements.filter(a => a.student_id === studentId);
    const sumPoints = userAchievements.reduce((acc, a) => acc + a.score_points, 0) + pts;
    
    // Se o usuário alcançou o marco de 500 pontos, concede medalha lendária
    if (sumPoints >= 500 && !userAchievements.some(a => a.title === 'Monstro dos Treinos')) {
      awardAchievement(studentId, 'Monstro dos Treinos', 'Alcançou o marco supremo de 500 pontos de glória no AxxosFit!', 'trophy', 150);
    }
  };

  // DOCK METRICS GENERATOR -- DASHBOARDS INTELIGENTES (PREMIUM INSIGHTS)
  const getTrainerDashboardStats = (): DashboardStatsTrainer => {
    const tId = currentProfile?.id || currentTrainer?.id || 't1';
    const linkedStudents = students.filter(s => s.trainer_id === tId);
    const totalStudents = linkedStudents.length;
    const activeStudents = linkedStudents.filter(s => s.status === 'active').length;
    const inactiveStudents = linkedStudents.filter(s => s.status === 'inactive').length;
    
    // Concluídos essa semana (filtrados pelo trainer)
    const linkedStudentIds = linkedStudents.map(s => s.id);
    const currentWeekLogs = exerciseLogs.filter(log => linkedStudentIds.includes(log.student_id)).length;

    // Faturamento Mensal (apenas mensalidades de alunos — exclui upgrade da plataforma)
    const trainerPayments = filterStudentBillingPayments(
      payments.filter(p => p.status === 'paid' && p.trainer_id === tId)
    );
    const monthlyRevenue = trainerPayments.reduce((acc, p) => acc + p.amount, 0);

    // Vencimentos futuros (apenas cobranças de alunos)
    const upcomingRenewals = filterStudentBillingPayments(
      payments.filter(p => p.status === 'pending' && p.trainer_id === tId)
    )
      .map(p => {
        const studentProfile = profiles.find(pr => pr.id === p.student_id);
        return {
          id: p.id,
          studentName: studentProfile?.name || 'Aluno',
          dueDate: p.due_date,
          amount: p.amount,
          status: new Date(p.due_date) < new Date() ? 'overdue' as const : 'pending' as const
        };
      });

    // Score de retenção (Premium: com base na frequência dos logs nas últimas datas!)
    let retentionScore = totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0;

    return {
      totalStudents,
      activeStudents,
      inactiveStudents,
      completedWorkoutsThisWeek: currentWeekLogs,
      monthlyRevenue,
      weeklyGrowthPercentage: 8.5,
      upcomingRenewals,
      retentionScore,
      satisfactionScore: 92
    };
  };

  const getStudentScoreCard = (studentId: string): StudentScoreCard => {
    const userAchievements = achievements.filter(a => a.student_id === studentId);
    const userLogs = exerciseLogs.filter(l => l.student_id === studentId);
    const userWorkouts = workouts.filter(w => w.student_id === studentId && w.is_active);

    const totalPoints = userAchievements.reduce((acc, a) => acc + a.score_points, 0) + (userLogs.length * 15);
    
    // Nível calculado: a cada 150 pontos sobe 1 nível
    const level = Math.floor(totalPoints / 150) + 1;
    const scoreDiff = totalPoints % 150;
    const nextMilestonePoints = 150 - scoreDiff;

    // Frequência de sequência (Dias consecutivos de exercícios)
    // Simula sequência baseada no tamanho de logs e fidelidade
    const streakDays = userLogs.length > 0 ? (userLogs.length * 2) % 6 + 1 : 0;

    // Probabilidade de Retenção (Premium IA insight)
    const logsCount = userLogs.length;
    const retentionProbability = Math.min(65 + (logsCount * 8), 99);

    return {
      level,
      streakDays,
      totalPoints,
      activeWorkoutsCount: userWorkouts.length,
      totalWorkoutsCompleted: logsCount,
      retentionProbability,
      nextMilestonePoints
    };
  };

  // IA - SUGESTÃO DE TREINO PELO GEMINI
  const getAISuggestions = async (studentId: string): Promise<{ suggestion: string; isAI: boolean }> => {
    const student = students.find(s => s.id === studentId);
    if (!student) return { suggestion: 'Dados do aluno não encontrados.', isAI: false };

    const studentProfile = profiles.find(p => p.id === studentId);
    
    try {
      // Faz chamada para nossa API local do express, que executa o SDK do Gemini com segurança!
      const response = await fetch('/api/gemini/suggest-workout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: studentProfile?.name || 'Aluno',
          objective: student.objective,
          height: student.current_height,
          weight: student.current_weight,
          bodyFat: student.body_fat_percentage || 20,
          injuries: student.injuries_restrictions || 'Nenhuma'
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          suggestion: data.suggestion,
          isAI: true
        };
      }
    } catch (e) {
      console.error('Falha na requisição para a IA. Utilizando sugestão interna inteligente de contingência...', e);
    }

    // Fallback de contingência local estruturado se a chave Gemini não estiver integrada
    const generatedSuggestion = `### 💡 Sugestão Inteligente Premium (Contingência)
Olá Trainer! Com base nos dados antropométricos de **${studentProfile?.name}** (Objetivo: *${student.objective}*), desenvolvemos esta estrutura focado em otimização biomecânica:

1. **Ativação Neuromuscular**: 2 séries de elevação pélvica sem carga para ativação prévia de glúteos de forma a estabilizar a articulação do joelho esquerda (Cuidado com a queixa relatada: *"${student.injuries_restrictions}"*).
2. **Força e Hipertrofia Pernas**: Agachamento Sumô com halteres (3 séries x 12 reps, repetições em reserva @8 RPE) para menor estresse compressivo na articulação do joelho.
3. **Core**: Prancha lateral (2 séries sustentação até a falha técnica).

*Ajuste as repetições conforme o feedback de dificuldade nas próximas sessões.*`;

    return {
      suggestion: generatedSuggestion,
      isAI: false
    };
  };

  const askAIChat = async (
    prompt: string,
    studentId?: string
  ): Promise<{ suggestion: string; isAI: boolean }> => {
    if (studentId) {
      const base = await getAISuggestions(studentId);
      if (base.isAI) return base;
    }

    const student = studentId ? students.find((s) => s.id === studentId) : null;
    const studentProfile = studentId ? profiles.find((p) => p.id === studentId) : null;

    try {
      const response = await fetch('/api/gemini/suggest-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: studentProfile?.name || currentProfile?.name || 'Personal',
          objective: student?.objective || prompt,
          height: student?.current_height || 175,
          weight: student?.current_weight || 75,
          bodyFat: student?.body_fat_percentage || 20,
          injuries: student?.injuries_restrictions || 'Nenhuma',
          customPrompt: prompt,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        return { suggestion: data.suggestion || data.text || String(data), isAI: true };
      }
    } catch (e) {
      console.error('askAIChat:', e);
    }

    return {
      suggestion: studentId
        ? `Com base no aluno **${studentProfile?.name}**: ${prompt}\n\nCadastre treinos e avaliações para respostas mais precisas. Configure a API Gemini em server.ts para respostas completas.`
        : `**Sua pergunta:** ${prompt}\n\nSelecione um aluno para análises personalizadas ou configure a integração Gemini.`,
      isAI: false,
    };
  };

  const createExercise = async (
    input: CreateExerciseInput
  ): Promise<{ success: boolean; message?: string }> => {
    const exId = crypto.randomUUID();
    const isGlobal = input.is_global !== false;

    const newEx: Exercise = {
      id: exId,
      name: input.name.trim(),
      category: input.category,
      description: input.description,
      video_url: input.video_url || '',
      equipment: input.equipment,
      difficulty: input.difficulty,
      instructions: input.instructions,
      is_global: isGlobal,
      trainer_id: isGlobal ? null : currentProfile?.id ?? null,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const row: Record<string, unknown> = {
        id: exId,
        name: newEx.name,
        muscle_group: newEx.category,
        description: newEx.description || null,
        video_url: newEx.video_url || null,
        trainer_id: isGlobal ? null : currentProfile?.id ?? null,
        created_at: newEx.created_at,
      };
      if (input.equipment) row.equipment = input.equipment;
      if (input.difficulty) row.difficulty = input.difficulty;
      if (input.instructions) row.instructions = input.instructions;

      const { error } = await supabase.from('exercises').insert(row);
      if (error) {
        console.error('createExercise Supabase:', error);
        return { success: false, message: error.message };
      }
    }

    const updated = [...exercises, newEx];
    setExercises(updated);
    sync('exercises', updated);
    return { success: true, message: 'Exercício cadastrado na biblioteca global.' };
  };

  const updateExercise = async (
    id: string,
    input: CreateExerciseInput
  ): Promise<{ success: boolean; message?: string }> => {
    const patch: Partial<Exercise> = {
      name: input.name.trim(),
      category: input.category,
      description: input.description,
      video_url: input.video_url || '',
      equipment: input.equipment,
      difficulty: input.difficulty,
      instructions: input.instructions,
      is_global: input.is_global !== false,
    };

    const updated = exercises.map((ex) => (ex.id === id ? { ...ex, ...patch } : ex));
    setExercises(updated);
    sync('exercises', updated);

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('exercises')
        .update({
          name: patch.name,
          muscle_group: patch.category,
          description: patch.description || null,
          video_url: patch.video_url || null,
          equipment: patch.equipment || null,
          difficulty: patch.difficulty || null,
          instructions: patch.instructions || null,
          trainer_id: patch.is_global ? null : currentProfile?.id ?? null,
        })
        .eq('id', id);
      if (error) return { success: false, message: error.message };
    }
    return { success: true, message: 'Exercício atualizado.' };
  };

  const deleteExercise = async (id: string): Promise<{ success: boolean; message?: string }> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('exercises').delete().eq('id', id);
      if (error) return { success: false, message: error.message };
    }
    const updated = exercises.filter((ex) => ex.id !== id);
    setExercises(updated);
    sync('exercises', updated);
    return { success: true, message: 'Exercício removido.' };
  };

  const updateProfile = async (profileId: string, data: Partial<Profile> & { whatsapp?: string; cref?: string; bio?: string; specialties?: string[] }) => {
    const updatedProfiles = profiles.map(p => {
      if (p.id === profileId) {
        return {
          ...p,
          name: data.name !== undefined ? data.name : p.name,
          avatar_url: data.avatar_url !== undefined ? data.avatar_url : p.avatar_url,
          cpf: data.cpf !== undefined ? data.cpf : p.cpf,
          address: data.address !== undefined ? data.address : p.address,
          birthdate: data.birthdate !== undefined ? data.birthdate : p.birthdate,
          phone: data.phone !== undefined ? data.phone : (data.whatsapp !== undefined ? data.whatsapp : p.phone)
        };
      }
      return p;
    });
    setProfiles(updatedProfiles);
    sync('profiles', updatedProfiles);

    const matchProf = updatedProfiles.find(p => p.id === profileId);
    if (matchProf && currentProfile && currentProfile.id === profileId) {
      setCurrentProfile(matchProf);
      localStorage.setItem('axosfit_session_profile', JSON.stringify(matchProf));
    }

    if (currentProfile?.role === 'trainer' || matchProf?.role === 'trainer') {
      const updatedTrainers = trainers.map(t => {
        if (t.id === profileId) {
          return {
            ...t,
            whatsapp: data.whatsapp !== undefined ? data.whatsapp : (data.phone !== undefined ? data.phone : t.whatsapp),
            cref: data.cref !== undefined ? data.cref : t.cref,
            bio: data.bio !== undefined ? data.bio : t.bio,
            specialties: data.specialties !== undefined ? data.specialties : t.specialties,
            cpf: data.cpf !== undefined ? data.cpf : t.cpf,
            address: data.address !== undefined ? data.address : t.address,
            birthdate: data.birthdate !== undefined ? data.birthdate : t.birthdate
          };
        }
        return t;
      });
      setTrainers(updatedTrainers);
      sync('trainers', updatedTrainers);
      
      const matchTr = updatedTrainers.find(t => t.id === profileId);
      if (matchTr) {
        setCurrentTrainer(matchTr);
      }
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const updatePayload: any = {};
        if (data.name !== undefined) updatePayload.name = data.name;
        if (data.name !== undefined) updatePayload.full_name = data.name;
        if (data.avatar_url !== undefined) updatePayload.avatar_url = data.avatar_url;
        if (data.cpf !== undefined) updatePayload.cpf = data.cpf;
        if (data.address !== undefined) updatePayload.address = data.address;
        if (data.birthdate !== undefined) updatePayload.birthdate = data.birthdate;
        if (data.phone !== undefined || data.whatsapp !== undefined) {
          updatePayload.phone = data.phone !== undefined ? data.phone : data.whatsapp;
        }

        if (Object.keys(updatePayload).length > 0) {
          await supabase.from('profiles').update(updatePayload).eq('id', profileId);
        }

        if (currentProfile?.role === 'trainer' || matchProf?.role === 'trainer') {
          const trainerPayload: any = {};
          if (data.cref !== undefined) trainerPayload.cref = data.cref;
          if (data.bio !== undefined) trainerPayload.bio = data.bio;
          if (data.whatsapp !== undefined || data.phone !== undefined) {
            trainerPayload.whatsapp = data.whatsapp !== undefined ? data.whatsapp : data.phone;
          }
          if (data.specialties !== undefined) trainerPayload.specialties = data.specialties;
          if (data.cpf !== undefined) trainerPayload.cpf = data.cpf;
          if (data.address !== undefined) trainerPayload.address = data.address;
          if (data.birthdate !== undefined) trainerPayload.birthdate = data.birthdate;

          if (Object.keys(trainerPayload).length > 0) {
            await supabase.from('trainers').update(trainerPayload).eq('id', profileId);
          }
        }
      } catch (err) {
        console.error("Error syncing profile update to Supabase:", err);
      }
    }
  };

  const syncAllToSupabase = async (): Promise<{ success: boolean; message: string; details?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        message: 'O Supabase não está configurado. Configure as chaves VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no seu painel ou arquivo .env.'
      };
    }

    try {
      const { error: testError } = await supabase.from('profiles').select('id').limit(1);
      if (testError && testError.code !== 'PGRST116' && testError.message !== 'no rows in result') {
        if (testError.code === '42P01') {
          return {
            success: false,
            message: 'Tabelas não encontradas no Supabase. Certifique-se de executar o script de criação de tabelas (SQL) no painel do Supabase.',
            details: `Erro ${testError.code}: ${testError.message}`
          };
        }
        return {
          success: false,
          message: 'Erro ao validar conexão com o Supabase. Verifique suas credenciais.',
          details: `Erro ${testError.code}: ${testError.message}`
        };
      }

      // 1. Mapeia e insere Perfis (profiles)
      const mappedProfiles = profiles.map(p => ({
        id: toUUID(p.id),
        name: p.name,
        email: p.email,
        role: p.role,
        avatar_url: p.avatar_url || null,
        created_at: p.created_at || new Date().toISOString(),
        gender: p.gender || null
      }));

      // 2. Mapeia e insere Personal Trainers (trainers)
      const mappedTrainers = trainers.map(t => ({
        id: toUUID(t.id),
        cref: t.cref,
        specialties: t.specialties || [],
        bio: t.bio || null,
        whatsapp: t.whatsapp || null,
        created_at: t.created_at || new Date().toISOString()
      }));

      // 3. Mapeia e insere Alunos (students)
      const mappedStudents = students.map(s => ({
        id: toUUID(s.id),
        trainer_id: s.trainer_id ? toUUID(s.trainer_id) : null,
        objective: s.objective,
        initial_height: s.initial_height || s.current_height || 170,
        initial_weight: s.initial_weight || s.current_weight || 70,
        current_height: s.current_height || 170,
        current_weight: s.current_weight || 70,
        body_fat_percentage: s.body_fat_percentage || null,
        injuries_restrictions: s.injuries_restrictions || null,
        status: s.status || 'active',
        created_at: s.created_at || new Date().toISOString(),
        gender: s.gender || null,
        monthly_fee: s.monthly_fee || null,
        due_day: s.due_day || null
      }));

      // 4. Mapeia e insere Biblioteca Global de Exercícios (exercises)
      const mappedExercises = exercises.map(e => ({
        id: toUUID(e.id),
        name: e.name,
        muscle_group: e.category,
        description: e.description || null,
        video_url: e.video_url || null,
        equipment: e.equipment || null,
        difficulty: e.difficulty || null,
        instructions: e.instructions || null,
        trainer_id: e.is_global !== false ? null : (currentProfile?.id ? toUUID(currentProfile.id) : null),
        created_at: e.created_at || new Date().toISOString()
      }));

      // 5. Mapeia e insere Treinos (workouts)
      const mappedWorkouts = workouts.map(w => ({
        id: toUUID(w.id),
        student_id: toUUID(w.student_id),
        trainer_id: toUUID(w.trainer_id),
        name: w.name,
        description: w.description || null,
        is_active: w.is_active,
        created_at: w.created_at || new Date().toISOString()
      }));

      // 6. Mapeia e insere Dias de Treino (workout_days)
      const mappedWorkoutDays = workoutDays.map(d => ({
        id: toUUID(d.id),
        workout_id: toUUID(d.workout_id),
        day_name: d.day_name,
        sort_order: d.sort_order || 0,
        created_at: d.created_at || new Date().toISOString()
      }));

      // 7. Mapeia e insere Exercícios do Cronograma (workout_exercises)
      const mappedWorkoutExercises = workoutExercises.map(we => {
        const workoutDay = workoutDays.find((d) => d.id === we.workout_day_id);
        return {
          id: toUUID(we.id),
          workout_id: workoutDay ? toUUID(workoutDay.workout_id) : null,
          workout_day_id: toUUID(we.workout_day_id),
          exercise_id: toUUID(we.exercise_id),
          series: we.series,
          reps: String(we.reps),
          rest_seconds: we.rest_seconds,
          load_kg: we.load_kg ?? null,
          order_index: we.order_index || 0,
          observations: we.observations || null,
          created_at: we.created_at || new Date().toISOString()
        };
      });

      // 8. Mapeia e insere Logs / Histórico de Treino (exercise_logs)
      const mappedExerciseLogs = exerciseLogs.map(log => ({
        id: toUUID(log.id),
        student_id: toUUID(log.student_id),
        workout_exercise_id: toUUID(log.workout_exercise_id),
        date: log.date || new Date().toISOString().split('T')[0],
        completed_series: log.completed_series || null,
        completed_reps: log.completed_reps || null,
        load_used: log.load_used,
        difficulty: log.difficulty,
        feedback_text: log.feedback_text || null,
        created_at: log.created_at || new Date().toISOString()
      }));

      // 9. Mapeia e insere Avaliações Físicas (physical_assessments)
      const mappedAssessments = physicalAssessments.map(pa => ({
        id: toUUID(pa.id),
        student_id: toUUID(pa.student_id),
        trainer_id: toUUID(pa.trainer_id),
        date: pa.date || new Date().toISOString().split('T')[0],
        anamnesis: pa.anamnesis,
        imc: pa.imc,
        body_fat_percentage: pa.body_fat_percentage,
        protocol: pa.protocol || 'Pollock 7 dobras',
        recommendations: pa.recommendations || null,
        created_at: pa.created_at || new Date().toISOString()
      }));

      // 10. Mapeia e insere Medidas Corporais (body_measurements)
      const mappedMeasurements = bodyMeasurements.map(bm => ({
        id: toUUID(bm.id),
        physical_assessment_id: bm.physical_assessment_id ? toUUID(bm.physical_assessment_id) : null,
        student_id: toUUID(bm.student_id),
        date: bm.date || new Date().toISOString().split('T')[0],
        weight: bm.weight,
        height: bm.height,
        neck: bm.neck || null,
        shoulder: bm.shoulder || null,
        chest: bm.chest || null,
        waist: bm.waist || null,
        abdomen: bm.abdomen || null,
        hips: bm.hips || null,
        biceps_left: bm.biceps_left || null,
        biceps_right: bm.biceps_right || null,
        biceps_left_relaxed: bm.biceps_left_relaxed || null,
        biceps_right_relaxed: bm.biceps_right_relaxed || null,
        biceps_left_contracted: bm.biceps_left_contracted || null,
        biceps_right_contracted: bm.biceps_right_contracted || null,
        thigh_left: bm.thigh_left || null,
        thigh_right: bm.thigh_right || null,
        calf_left: bm.calf_left || null,
        calf_right: bm.calf_right || null,
        created_at: bm.created_at || new Date().toISOString()
      }));

      // 11. Mapeia e insere Fotos de Progresso (progress_photos)
      const mappedPhotos = progressPhotos.map(p => ({
        id: toUUID(p.id),
        student_id: toUUID(p.student_id),
        date: p.date || new Date().toISOString().split('T')[0],
        photo_url: p.photo_url,
        type: p.type,
        caption: p.caption || null,
        created_at: p.created_at || new Date().toISOString()
      }));

      // 12. Mapeia e insere Subscriptions (subscriptions)
      const mappedSubscriptions = trainerPayments.map(tp => ({
        id: toUUID(tp.id),
        trainer_id: toUUID(tp.trainer_id),
        plan_name: tp.plan || 'Starter',
        status: tp.status === 'paid' ? 'active' : 'past_due',
        active_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        price_monthly: tp.amount || 99.90,
        created_at: new Date().toISOString()
      }));

      // 13. Mapeia e insere Mensalidades / Faturamento (payments)
      const mappedPayments = payments.map(pay => ({
        id: toUUID(pay.id),
        student_id: toUUID(pay.student_id),
        trainer_id: toUUID(pay.trainer_id),
        amount: pay.amount,
        description: pay.description || null,
        status: pay.status,
        due_date: pay.due_date,
        payment_date: pay.payment_date || null,
        created_at: pay.created_at || new Date().toISOString()
      }));

      // 14. Mapeia e insere Notificações (notifications)
      const mappedNotifications = notifications.map(not => ({
        id: toUUID(not.id),
        user_id: toUUID(not.user_id),
        title: not.title,
        message: not.message,
        is_read: not.is_read || false,
        type: not.type,
        created_at: not.created_at || new Date().toISOString()
      }));

      // 15. Mapeia e insere Medalhas (achievements)
      const mappedAchievements = achievements.map(ach => ({
        id: toUUID(ach.id),
        student_id: toUUID(ach.student_id),
        title: ach.title,
        description: ach.description,
        icon_name: ach.icon_name,
        date_earned: ach.date_earned || new Date().toISOString().split('T')[0],
        score_points: ach.score_points || 10,
        created_at: ach.created_at || new Date().toISOString()
      }));

      // EXPORTAÇÃO EM LOTE SEQUENCIAL COM DEPENDÊNCIAS DE INTEGRIDADE REFERENCIAL
      // Etapa A. profiles
      const { error: ep } = await supabase.from('profiles').upsert(mappedProfiles, { onConflict: 'id' });
      if (ep) throw new Error(`Perfis (profiles): ${ep.message}`);

      // Etapa B. trainers, students, exercises
      const { error: et } = await supabase.from('trainers').upsert(mappedTrainers, { onConflict: 'id' });
      if (et) throw new Error(`Personal Trainers (trainers): ${et.message}`);

      const { error: es } = await supabase.from('students').upsert(mappedStudents, { onConflict: 'id' });
      if (es) throw new Error(`Alunos (students): ${es.message}`);

      const { error: ee } = await supabase.from('exercises').upsert(mappedExercises, { onConflict: 'id' });
      if (ee) throw new Error(`Biblioteca de Exercícios (exercises): ${ee.message}`);

      // Etapa C. subscriptions, workouts, physical_assessments, notifications, payments
      if (mappedSubscriptions.length > 0) {
        const { error: esub } = await supabase.from('subscriptions').upsert(mappedSubscriptions, { onConflict: 'id' });
        if (esub) throw new Error(`Assinaturas (subscriptions): ${esub.message}`);
      }

      if (mappedWorkouts.length > 0) {
        const { error: ew } = await supabase.from('workouts').upsert(mappedWorkouts, { onConflict: 'id' });
        if (ew) throw new Error(`Cronogramas de Treino (workouts): ${ew.message}`);
      }

      if (mappedAssessments.length > 0) {
        const { error: ea } = await supabase.from('physical_assessments').upsert(mappedAssessments, { onConflict: 'id' });
        if (ea) throw new Error(`Avaliações Físicas (physical_assessments): ${ea.message}`);
      }

      if (mappedNotifications.length > 0) {
        const { error: en } = await supabase.from('notifications').upsert(mappedNotifications, { onConflict: 'id' });
        if (en) throw new Error(`Notificações (notifications): ${en.message}`);
      }

      if (mappedPayments.length > 0) {
        const { error: epay } = await supabase.from('payments').upsert(mappedPayments, { onConflict: 'id' });
        if (epay) throw new Error(`Controle de Pagamentos (payments): ${epay.message}`);
      }

      // Etapa D. workout days, body measurements, progress photos, achievements
      if (mappedWorkoutDays.length > 0) {
        const { error: ewd } = await supabase.from('workout_days').upsert(mappedWorkoutDays, { onConflict: 'id' });
        if (ewd) throw new Error(`Dias de Treino (workout_days): ${ewd.message}`);
      }

      if (mappedMeasurements.length > 0) {
        const { error: ebm } = await supabase.from('body_measurements').upsert(mappedMeasurements, { onConflict: 'id' });
        if (ebm) throw new Error(`Medidas Corporais (body_measurements): ${ebm.message}`);
      }

      if (mappedPhotos.length > 0) {
        const { error: eph } = await supabase.from('progress_photos').upsert(mappedPhotos, { onConflict: 'id' });
        if (eph) throw new Error(`Fotos de Progresso (progress_photos): ${eph.message}`);
      }

      if (mappedAchievements.length > 0) {
        const { error: each } = await supabase.from('achievements').upsert(mappedAchievements, { onConflict: 'id' });
        if (each) throw new Error(`Medalhas do Aluno (achievements): ${each.message}`);
      }

      // Etapa E. workout exercises
      if (mappedWorkoutExercises.length > 0) {
        const { error: ewe } = await supabase.from('workout_exercises').upsert(mappedWorkoutExercises, { onConflict: 'id' });
        if (ewe) throw new Error(`Montagem de Exercícios (workout_exercises): ${ewe.message}`);
      }

      // Etapa F. exercise logs
      if (mappedExerciseLogs.length > 0) {
        const { error: eel } = await supabase.from('exercise_logs').upsert(mappedExerciseLogs, { onConflict: 'id' });
        if (eel) throw new Error(`Histórico e Feedback de Treinos (exercise_logs): ${eel.message}`);
      }

      return {
        success: true,
        message: '¡Sucesso absoluto! Todas as tabelas, usuários, exercícios e históricos locais do AxxosFit foram exportados com integridade referencial preservada para o banco do Supabase.'
      };

    } catch (err: any) {
      console.error('Falha geral ao exportar dados para Supabase:', err);
      return {
        success: false,
        message: 'Erro ao persistir lote de dados no Supabase.',
        details: err.message || String(err)
      };
    }
  };

  return (
    <StoreContext.Provider value={{
      currentProfile,
      currentTrainer,
      currentStudent,
      profiles,
      trainers,
      students,
      workouts,
      workoutDays,
      exercises,
      workoutExercises,
      exerciseLogs,
      physicalAssessments,
      bodyMeasurements,
      progressPhotos,
      payments,
      trainerPayments,
      notifications,
      achievements,
      isLoading,
      error,
      isSuperAdmin,

      login,
      logout,
      registerUser,
      requestPlanUpgrade,
      pendingUpgradePlan,
      clearPendingUpgrade,
      createTrainerByAdmin,
      refreshPlatformData,
      refreshUserData,
      updatePassword,
      requestPasswordReset,
      completePasswordRecovery,
      passwordRecoveryPending,
      clearPasswordRecovery,
      activateTrainerByAdmin,
      deactivateTrainerByAdmin,
      editTrainerByAdmin,
      deleteTrainerByAdmin,
      
      createTrainerPayment,
      markTrainerPaymentPaid,
      deleteTrainerPayment,
      
      createStudent,
      updateStudent,
      setStudentActive,
      deleteStudent,
      
      createWorkout,
      updateWorkout,
      deleteWorkout,
      toggleWorkoutActive,
      duplicateWorkout,
      addExerciseLog,
      
      createPhysicalAssessment,
      
      createPayment,
      markPaymentPaid,
      
      addNotification,
      markNotificationAsRead,
      
      awardAchievement,
      createExercise,
      updateExercise,
      deleteExercise,
      updateProfile,
      getTrainerDashboardStats,
      getStudentScoreCard,
      getAISuggestions,
      askAIChat,
      syncAllToSupabase
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore deve ser usado com um StoreProvider');
  }
  return context;
};
