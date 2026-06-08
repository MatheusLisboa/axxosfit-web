/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { PLAN_FEATURE_LISTS, UNLIMITED_STUDENTS, PLAN_PRICES } from '../lib/plans';

export interface PlanData {
  id: string;
  name: string;
  slug: 'starter' | 'pro' | 'studio';
  price: number;
  max_students: number;
  features: string[] | string;
  created_at?: string;
}

export interface SubscriptionData {
  id: string;
  trainer_id: string;
  plan_id: string;
  status: 'active' | 'past_due' | 'trial' | 'pending' | 'canceled';
  payment_provider: string;
  payment_reference: string;
  started_at: string;
  expires_at: string;
  created_at?: string;
  plans?: PlanData; // optional join
}

export interface StudentDB {
  id: string;
  trainer_id: string;
  full_name: string;
  email: string;
  phone?: string;
  objective?: string;
  active: boolean;
  created_at?: string;
}

export interface WorkoutDB {
  id: string;
  trainer_id: string;
  student_id: string;
  name: string;
  description?: string;
  created_at?: string;
}

export interface ExerciseDB {
  id: string;
  trainer_id?: string;
  name: string;
  muscle_group: string;
  video_url?: string;
  created_at?: string;
}

export interface WorkoutExerciseDB {
  id: string;
  workout_id: string;
  exercise_id: string;
  sets: number;
  reps: string;
  rest_time?: number;
  notes?: string;
}

export interface PaymentDB {
  id: string;
  trainer_id: string;
  subscription_id?: string;
  amount: number;
  status: 'paid' | 'pending' | 'refunded' | 'failed';
  provider: string;
  provider_reference?: string;
  created_at?: string;
}

export interface NotificationDB {
  id: string;
  trainer_id: string;
  title: string;
  message: string;
  read: boolean;
  created_at?: string;
}

/**
 * Core Database Service
 */
export const SupabaseService = {
  // 1. Core Profile Handlers
  async getProfile(userId: string) {
    if (!isSupabaseConfigured || !supabase) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      console.error('Error fetching profile:', error.message);
      return null;
    }
    return data;
  },

  async updateProfile(userId: string, updates: any) {
    if (!isSupabaseConfigured || !supabase) return false;
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
    if (error) {
      console.error('Error updating profile:', error.message);
      return false;
    }
    return true;
  },

  // 2. Plans Handlers
  async getPlans(): Promise<PlanData[]> {
    if (!isSupabaseConfigured || !supabase) {
      // Fallback local static plans
      return [
        { id: 'p1', name: 'Starter', slug: 'starter', price: PLAN_PRICES.starter, max_students: 10, features: [...PLAN_FEATURE_LISTS.starter] },
        { id: 'p2', name: 'Pro', slug: 'pro', price: PLAN_PRICES.pro, max_students: 25, features: [...PLAN_FEATURE_LISTS.pro] },
        { id: 'p3', name: 'Studio', slug: 'studio', price: PLAN_PRICES.studio, max_students: UNLIMITED_STUDENTS, features: [...PLAN_FEATURE_LISTS.studio] },
      ];
    }
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('price', { ascending: true });
    if (error) {
      console.error('Error fetching plans:', error.message);
      return [];
    }
    return data || [];
  },

  // 3. Subscription Handlers
  async getSubscriptionByTrainer(trainerId: string): Promise<SubscriptionData | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, plans(*)')
      .eq('trainer_id', trainerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error('Error getting subscription:', error.message);
      return null;
    }
    return data;
  },

  // 4. Students Operations
  async getStudents(trainerId: string): Promise<StudentDB[]> {
    if (!isSupabaseConfigured || !supabase) return [];
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('trainer_id', trainerId);
    if (error) {
      console.error('Error fetching students:', error.message);
      return [];
    }
    return data || [];
  },

  async createStudent(student: Omit<StudentDB, 'created_at'>) {
    if (!isSupabaseConfigured || !supabase) return null;
    const { data, error } = await supabase
      .from('students')
      .insert([student])
      .select()
      .single();
    if (error) {
      console.error('Error creating student:', error.message);
      return null;
    }
    return data;
  },

  async updateStudent(studentId: string, updates: Partial<StudentDB>) {
    if (!isSupabaseConfigured || !supabase) return false;
    const { error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', studentId);
    return !error;
  },

  // 5. Workouts System
  async getWorkouts(trainerId: string): Promise<WorkoutDB[]> {
    if (!isSupabaseConfigured || !supabase) return [];
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('trainer_id', trainerId);
    return error ? [] : data || [];
  },

  async createWorkout(workout: Omit<WorkoutDB, 'id' | 'created_at'>) {
    if (!isSupabaseConfigured || !supabase) return null;
    const { data, error } = await supabase
      .from('workouts')
      .insert([workout])
      .select()
      .single();
    return error ? null : data;
  },

  // 6. Exercises Operations
  async getExercises(trainerId?: string): Promise<ExerciseDB[]> {
    if (!isSupabaseConfigured || !supabase) return [];
    let query = supabase.from('exercises').select('*');
    if (trainerId) {
      query = query.or(`trainer_id.eq.${trainerId},trainer_id.is.null`);
    }
    const { data, error } = await query;
    return error ? [] : data || [];
  },

  async createExercise(exercise: Omit<ExerciseDB, 'id' | 'created_at'>) {
    if (!isSupabaseConfigured || !supabase) return null;
    const { data, error } = await supabase
      .from('exercises')
      .insert([exercise])
      .select()
      .single();
    return error ? null : data;
  }
};
