/**
 * Carrega dados reais do Supabase para o store local.
 */
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type {
  Profile,
  Student,
  Trainer,
  Workout,
  WorkoutDay,
  WorkoutExercise,
  Exercise,
  Payment,
  Notification,
} from '../types';
import { mapDbExercise } from './storeMaps';
import { nextDueDateFromDay } from '../lib/financeUtils';

export interface LoadedPlatformData {
  profiles: Profile[];
  trainers: Trainer[];
  students: Student[];
  exercises: Exercise[];
  workouts: Workout[];
  workoutDays: WorkoutDay[];
  workoutExercises: WorkoutExercise[];
  payments: Payment[];
  notifications: Notification[];
}

export function profileFromRow(row: Record<string, unknown>): Profile {
  return {
    id: String(row.id),
    name: String(row.full_name || row.name || row.email),
    email: String(row.email),
    role: row.role as Profile['role'],
    avatar_url: row.avatar_url as string | undefined,
    created_at: String(row.created_at || new Date().toISOString()),
    status: (row.status as Profile['status']) || 'active',
    phone: (row.phone || row.whatsapp) as string | undefined,
    cpf: row.cpf as string | undefined,
    address: row.address as string | undefined,
    birthdate: row.birthdate as string | undefined,
    gender: row.gender as Profile['gender'],
  };
}

function profileDisplayName(row: Record<string, unknown>): string {
  return String(row.full_name || row.name || row.email || '').trim();
}

function pickBestAuthProfile(
  userId: string,
  rows: Record<string, unknown>[]
): Record<string, unknown> | null {
  const unique = new Map<string, Record<string, unknown>>();
  for (const row of rows) {
    if (row?.id) unique.set(String(row.id), row);
  }
  const candidates = [...unique.values()];
  if (!candidates.length) return null;

  return candidates.sort((a, b) => {
    const aName = profileDisplayName(a);
    const bName = profileDisplayName(b);
    if (aName && !bName) return -1;
    if (bName && !aName) return 1;
    if (String(a.id) === userId) return -1;
    if (String(b.id) === userId) return 1;
    return 0;
  })[0];
}

/** Aguarda JWT no cliente (queries com RLS falham sem sessão). */
export async function ensureSupabaseSession(maxWaitMs = 8000): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) return true;
    await new Promise((resolve) => setTimeout(resolve, 75));
  }
  console.warn('ensureSupabaseSession: timeout aguardando sessão');
  return false;
}

/** Perfil do usuário autenticado (auth.uid = profiles.id). */
export async function fetchProfileForAuthUser(
  userId: string,
  email: string
): Promise<Profile | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  await ensureSupabaseSession();

  const normalizedEmail = email.toLowerCase().trim();
  const [byIdRes, byEmailRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    normalizedEmail
      ? supabase.from('profiles').select('*').eq('email', normalizedEmail).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const best = pickBestAuthProfile(
    userId,
    [byIdRes.data, byEmailRes.data].filter(Boolean) as Record<string, unknown>[]
  );
  if (!best) return null;

  const profile = profileFromRow(best);
  // Sempre usar auth.uid() no app — alunos e RLS dependem de trainer_id = auth.uid()
  if (profile.id !== userId) {
    return { ...profile, id: userId };
  }
  return profile;
}

function studentFromRow(row: Record<string, unknown>): Student {
  return {
    id: String(row.id),
    trainer_id: String(row.trainer_id),
    objective: String(row.objective || 'Condicionamento'),
    initial_height: Number(row.initial_height || 170),
    initial_weight: Number(row.initial_weight || row.current_weight || 70),
    current_height: Number(row.current_height || 170),
    current_weight: Number(row.current_weight || 70),
    body_fat_percentage: Number(row.body_fat_percentage || 0) || undefined,
    injuries_restrictions: String(row.injuries_restrictions || ''),
    status: row.active === false || row.status === 'inactive' ? 'inactive' : 'active',
    created_at: String(row.created_at || new Date().toISOString()),
    phone: row.phone as string | undefined,
    gender: row.gender as Student['gender'],
    monthly_fee: Number(row.monthly_fee || 0),
    due_day: Number(row.due_day || 10),
    next_due_date: row.next_due_date as string | undefined,
  };
}

export async function loadTrainerData(
  trainerId: string,
  isAdmin = false
): Promise<LoadedPlatformData> {
  const empty: LoadedPlatformData = {
    profiles: [],
    trainers: [],
    students: [],
    exercises: [],
    workouts: [],
    workoutDays: [],
    workoutExercises: [],
    payments: [],
    notifications: [],
  };

  if (!isSupabaseConfigured || !supabase) return empty;

  try {
    await ensureSupabaseSession();

    const { data: trainerProf, error: trainerProfErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', trainerId)
      .maybeSingle();
    if (trainerProfErr) {
      console.warn('trainer profile fetch:', trainerProfErr.message, { trainerId });
    }
    if (trainerProf) {
      empty.profiles = [profileFromRow(trainerProf as Record<string, unknown>)];
    }

    let studentQuery = supabase.from('students').select('*');
    if (!isAdmin) studentQuery = studentQuery.eq('trainer_id', trainerId);
    const { data: studentRows, error: studentErr } = await studentQuery;
    if (studentErr) {
      console.warn('students fetch:', studentErr.message, { trainerId });
    }

    const studentIds = (studentRows || []).map((r) => r.id as string);

    if (studentIds.length) {
      const { data: profRows } = await supabase
        .from('profiles')
        .select('*')
        .in('id', studentIds);
      if (profRows?.length) {
        const byId = new Map(empty.profiles.map((p) => [p.id, p]));
        profRows.forEach((r) => {
          byId.set(String(r.id), profileFromRow(r as Record<string, unknown>));
        });
        empty.profiles = [...byId.values()];
      }
    }

    empty.students = (studentRows || []).map((r) => {
      const st = studentFromRow(r as Record<string, unknown>);
      const prof = empty.profiles.find((p) => p.id === st.id);
      if (prof && r.full_name) {
        prof.name = String(r.full_name);
      }
      return st;
    });

    const { data: trainerRows } = isAdmin
      ? await supabase.from('trainers').select('*')
      : await supabase.from('trainers').select('*').eq('id', trainerId);

    empty.trainers = (trainerRows || []).map((t) => ({
      id: String(t.id),
      cref: String(t.cref || ''),
      specialties: (t.specialties as string[]) || [],
      bio: t.bio as string | undefined,
      whatsapp: t.whatsapp as string | undefined,
      created_at: String(t.created_at || new Date().toISOString()),
      plan: t.plan as Trainer['plan'],
      cpf: t.cpf as string | undefined,
      address: t.address as string | undefined,
      birthdate: t.birthdate as string | undefined,
      city: t.city as string | undefined,
      state: t.state as string | undefined,
      instagram: t.instagram as string | undefined,
    }));

    let exerciseQuery = supabase.from('exercises').select('*').order('name');
    if (!isAdmin) {
      exerciseQuery = exerciseQuery.or(`trainer_id.eq.${trainerId},trainer_id.is.null`);
    }
    const { data: exerciseRows, error: exerciseErr } = await exerciseQuery;
    if (exerciseErr) console.warn('exercises fetch:', exerciseErr.message);
    empty.exercises = (exerciseRows || []).map((r) => mapDbExercise(r as Record<string, unknown>));

    let workoutQuery = supabase.from('workouts').select('*').order('created_at', { ascending: false });
    if (!isAdmin) workoutQuery = workoutQuery.eq('trainer_id', trainerId);
    const { data: workoutRows } = await workoutQuery;

    const workoutIds = (workoutRows || []).map((w) => w.id as string);
    empty.workouts = (workoutRows || []).map((w, idx) => ({
      id: String(w.id),
      student_id: String(w.student_id),
      trainer_id: String(w.trainer_id),
      name: String(w.name),
      description: String(w.description || ''),
      is_active: typeof w.is_active === 'boolean' ? w.is_active : idx === 0,
      created_at: String(w.created_at || new Date().toISOString()),
    }));

    if (workoutIds.length) {
      const { data: workoutDayRows } = await supabase
        .from('workout_days')
        .select('*')
        .in('workout_id', workoutIds)
        .order('sort_order', { ascending: true });

      const { data: weRows } = await supabase
        .from('workout_exercises')
        .select('*')
        .in('workout_id', workoutIds)
        .order('order_index', { ascending: true });

      if (workoutDayRows?.length) {
        empty.workoutDays = workoutDayRows.map((d) => ({
          id: String(d.id),
          workout_id: String(d.workout_id),
          day_name: String(d.day_name),
          sort_order: Number(d.sort_order || 1),
          created_at: String(d.created_at || new Date().toISOString()),
        }));

        (weRows || []).forEach((we) => {
          empty.workoutExercises.push({
            id: String(we.id),
            workout_day_id: String(we.workout_day_id || ''),
            exercise_id: String(we.exercise_id),
            series: Number(we.sets || 3),
            reps: String(we.reps || '12'),
            rest_seconds: Number(we.rest_time || 60),
            load_kg: Number(we.load_kg ?? 0),
            observations: String(we.notes || ''),
            created_at: String(we.created_at || new Date().toISOString()),
          });
        });
      } else {
        for (const w of empty.workouts) {
          const dayId = `day_${w.id}`;
          empty.workoutDays.push({
            id: dayId,
            workout_id: w.id,
            day_name: w.name,
            sort_order: 1,
            created_at: w.created_at,
          });

          (weRows || [])
            .filter((we) => we.workout_id === w.id)
            .forEach((we) => {
              empty.workoutExercises.push({
                id: String(we.id),
                workout_day_id: dayId,
                exercise_id: String(we.exercise_id),
                series: Number(we.sets || 3),
                reps: String(we.reps || '12'),
                rest_seconds: Number(we.rest_time || 60),
                load_kg: Number(we.load_kg ?? 0),
                observations: String(we.notes || ''),
                created_at: w.created_at,
              });
            });
        }
      }
    }

    let payQuery = supabase.from('payments').select('*').order('created_at', { ascending: false });
    if (!isAdmin) payQuery = payQuery.eq('trainer_id', trainerId);
    const { data: payRows, error: payErr } = await payQuery;
    if (payErr) console.warn('payments fetch:', payErr.message);

    empty.payments = (payRows || []).map((p) => ({
      id: String(p.id),
      student_id: p.student_id ? String(p.student_id) : '',
      trainer_id: String(p.trainer_id || trainerId),
      amount: Number(p.amount),
      description: String(p.description || 'Assinatura AxxosFit'),
      status: p.status === 'paid' ? 'paid' : p.status === 'failed' ? 'overdue' : 'pending',
      due_date: String(p.due_date || p.created_at).split('T')[0],
      payment_date: p.status === 'paid' ? String(p.payment_date || p.created_at).split('T')[0] : undefined,
      created_at: String(p.created_at || new Date().toISOString()),
    }));

    for (const st of empty.students) {
      if (!st.monthly_fee || st.monthly_fee <= 0) continue;
      const hasOpenCharge = empty.payments.some(
        (p) =>
          p.student_id === st.id &&
          (p.status === 'pending' || p.status === 'overdue')
      );
      if (hasOpenCharge) continue;

      const dueDate = st.next_due_date || nextDueDateFromDay(st.due_day || 10);
      const today = new Date().toISOString().split('T')[0];
      const isOverdue = dueDate < today;
      empty.payments.push({
        id: `mens_${st.id}_${dueDate}`,
        student_id: st.id,
        trainer_id: trainerId,
        amount: st.monthly_fee,
        description: `Mensalidade — ${empty.profiles.find((p) => p.id === st.id)?.name || 'Aluno'}`,
        status: isOverdue ? 'overdue' : 'pending',
        due_date: dueDate,
        created_at: new Date().toISOString(),
      });
    }

    const { data: notifRows } = await supabase
      .from('notifications')
      .select('*')
      .eq('trainer_id', trainerId)
      .order('created_at', { ascending: false })
      .limit(50);

    empty.notifications = (notifRows || []).map((n) => ({
      id: String(n.id),
      user_id: trainerId,
      title: String(n.title),
      message: String(n.message),
      is_read: Boolean(n.read),
      type: 'workout' as const,
      date: String(n.created_at).split('T')[0],
      created_at: String(n.created_at || new Date().toISOString()),
    }));

    if (isAdmin) {
      const { data: allProfiles } = await supabase.from('profiles').select('*');
      if (allProfiles?.length) {
        const merged = new Map(empty.profiles.map((p) => [p.id, p]));
        allProfiles.forEach((r) => merged.set(String(r.id), profileFromRow(r as Record<string, unknown>)));
        empty.profiles = [...merged.values()];
      }
    }
  } catch (e) {
    console.error('loadTrainerData:', e);
  }

  return empty;
}

export async function loadStudentData(studentId: string): Promise<Partial<LoadedPlatformData>> {
  if (!isSupabaseConfigured || !supabase) return {};

  try {
    const { data: stRow } = await supabase.from('students').select('*').eq('id', studentId).maybeSingle();
    const { data: profRow } = await supabase.from('profiles').select('*').eq('id', studentId).maybeSingle();

    const profiles: Profile[] = profRow ? [profileFromRow(profRow as Record<string, unknown>)] : [];
    const students: Student[] = stRow ? [studentFromRow(stRow as Record<string, unknown>)] : [];

    const trainerId = stRow?.trainer_id as string | undefined;

    if (trainerId) {
      const { data: trainerProf } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', trainerId)
        .maybeSingle();
      if (trainerProf) {
        const trainerProfile = profileFromRow(trainerProf as Record<string, unknown>);
        if (!profiles.some((p) => p.id === trainerId)) {
          profiles.push(trainerProfile);
        }
      }
    }

    const { data: workoutRows } = await supabase
      .from('workouts')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    const workouts: Workout[] = (workoutRows || []).map((w, idx) => ({
      id: String(w.id),
      student_id: studentId,
      trainer_id: String(w.trainer_id),
      name: String(w.name),
      description: String(w.description || ''),
      is_active: typeof w.is_active === 'boolean' ? w.is_active : idx === 0,
      created_at: String(w.created_at || new Date().toISOString()),
    }));

    const workoutDays: WorkoutDay[] = [];
    const workoutExercises: WorkoutExercise[] = [];
    const workoutIds = workouts.map((w) => w.id);

    if (workoutIds.length) {
      const { data: workoutDayRows } = await supabase
        .from('workout_days')
        .select('*')
        .in('workout_id', workoutIds)
        .order('sort_order', { ascending: true });

      const { data: weRows } = await supabase
        .from('workout_exercises')
        .select('*')
        .in('workout_id', workoutIds)
        .order('order_index', { ascending: true });

      if (workoutDayRows?.length) {
        workoutDays.push(...workoutDayRows.map((d) => ({
          id: String(d.id),
          workout_id: String(d.workout_id),
          day_name: String(d.day_name),
          sort_order: Number(d.sort_order || 1),
          created_at: String(d.created_at || new Date().toISOString()),
        })));

        (weRows || []).forEach((we) => {
          workoutExercises.push({
            id: String(we.id),
            workout_day_id: String(we.workout_day_id || ''),
            exercise_id: String(we.exercise_id),
            series: Number(we.sets || 3),
            reps: String(we.reps || '12'),
            rest_seconds: Number(we.rest_time || 60),
            load_kg: Number(we.load_kg ?? 0),
            observations: String(we.notes || ''),
            created_at: String(we.created_at || new Date().toISOString()),
          });
        });
      } else {
        for (const w of workouts) {
          const dayId = `day_${w.id}`;
          workoutDays.push({
            id: dayId,
            workout_id: w.id,
            day_name: w.name,
            sort_order: 1,
            created_at: w.created_at,
          });
          (weRows || [])
            .filter((we) => we.workout_id === w.id)
            .forEach((we) => {
              workoutExercises.push({
                id: String(we.id),
                workout_day_id: dayId,
                exercise_id: String(we.exercise_id),
                series: Number(we.sets || 3),
                reps: String(we.reps || '12'),
                rest_seconds: Number(we.rest_time || 60),
                load_kg: Number(we.load_kg ?? 0),
                observations: String(we.notes || ''),
                created_at: w.created_at,
              });
            });
        }
      }
    }

    let exercises: Exercise[] = [];
    if (trainerId) {
      const { data: exerciseRows } = await supabase
        .from('exercises')
        .select('*')
        .or(`trainer_id.eq.${trainerId},trainer_id.is.null`);
      exercises = (exerciseRows || []).map((r) => mapDbExercise(r as Record<string, unknown>));
    }

    return { profiles, students, workouts, workoutDays, workoutExercises, exercises };
  } catch (e) {
    console.error('loadStudentData:', e);
    return {};
  }
}

const ENTITY_CACHE_KEYS = [
  'profiles', 'trainers', 'students', 'workouts', 'workoutDays', 'workoutExercises',
  'exercises', 'exerciseLogs', 'physicalAssessments', 'bodyMeasurements', 'progressPhotos',
  'payments', 'trainerPayments', 'notifications', 'achievements',
] as const;

/** Limpa cache de entidades no localStorage (evita dados de outro personal). */
export function clearEntityLocalCache(): void {
  ENTITY_CACHE_KEYS.forEach((k) => localStorage.removeItem(`axosfit_${k}`));
}

/** Limpa cache demo do localStorage (dados fictícios antigos). */
export function clearDemoLocalCache(): void {
  clearEntityLocalCache();
  localStorage.setItem('axosfit_cleared_v2', '1');
}
