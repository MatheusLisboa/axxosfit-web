/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Users,
  Dumbbell,
  TrendingUp,
  DollarSign,
  Activity,
  Award,
  BadgeCheck,
  Trash2,
  Edit,
  Plus,
  Copy,
  Sparkles,
  Send,
  Bell,
  Settings,
  LogOut,
  Check,
  AlertCircle,
  ChevronRight,
  FileText,
  Calendar,
  MessageSquare,
  Menu,
  X,
  Globe,
  UserCheck,
  FolderOpen,
  BookOpen,
  Lock,
  Power,
  CreditCard,
} from "lucide-react";
import { useStore } from "../services/store";
import {
  Student,
  Workout,
  WorkoutDay,
  WorkoutExercise,
  Payment,
} from "../types";
import { useSubscription } from "../hooks/useSubscription";
import FeatureGate from "./FeatureGate";
import UpgradePlanPage from "./UpgradePlanPage";
import { cn } from "../lib/cn";
import { DashboardLayout, type NavItem } from "./layout";
import { Button, StatCard } from "./ui";

export default function TrainerDashboard() {
  const {
    currentProfile,
    logout,
    profiles,
    students,
    workouts,
    workoutDays,
    workoutExercises,
    exercises,
    createStudent,
    updateStudent,
    deleteStudent,
    createWorkout,
    updateWorkout,
    deleteWorkout,
    toggleWorkoutActive,
    duplicateWorkout,
    physicalAssessments,
    bodyMeasurements,
    createPhysicalAssessment,
    payments,
    createPayment,
    markPaymentPaid,
    trainerPayments,
    createTrainerPayment,
    markTrainerPaymentPaid,
    deleteTrainerPayment,
    notifications,
    markNotificationAsRead,
    getTrainerDashboardStats,
    getAISuggestions,
    trainers,
    createTrainerByAdmin,
    updatePassword,
    activateTrainerByAdmin,
    deactivateTrainerByAdmin,
    editTrainerByAdmin,
    deleteTrainerByAdmin,
    createExercise,
    updateExercise,
    deleteExercise,
    updateProfile,
  } = useStore();

  const {
    subscription,
    plan,
    activeStudentsCount,
    remainingStudentsCount,
    limitProgress,
    canAccess,
    canCreateStudent,
    displayBadgeName,
    badgeThemeColor,
    refresh: refreshSubscription,
  } = useSubscription();

  const isSuperAdmin =
    currentProfile?.email?.toLowerCase().trim() ===
      "matheus.fillipe@hotmail.com" ||
    currentProfile?.email?.toLowerCase().trim() ===
      "matheus.fillipe.farias.lisboa@gmail.com";
  const isAdmin = currentProfile?.role === "admin";
  const canManageExercises = isSuperAdmin;
  const [activeTab, setActiveTab] = useState<
    | "stats"
    | "students"
    | "workouts"
    | "assessments"
    | "exercises"
    | "financial"
    | "settings"
    | "superadmin"
    | "upgrades"
  >(isSuperAdmin ? "superadmin" : "stats");

  const formatCPF = (val: string) => {
    const v = val.replace(/\D/g, "");
    return v
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      .substring(0, 14);
  };

  const formatPhone = (val: string) => {
    const v = val.replace(/\D/g, "");
    if (v.length <= 10) {
      return v
        .replace(/^(\d{2})(\d)/g, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2")
        .substring(0, 14);
    }
    return v
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .substring(0, 15);
  };

  const formatCEP = (val: string) => {
    const v = val.replace(/\D/g, "");
    return v.replace(/^(\d{5})(\d)/, "$1-$2").substring(0, 9);
  };

  const resizeAndSetAvatar = (
    file: File,
    callback: (base64: string) => void,
  ) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const max_size = 120; // light-weight tiny profile photo
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > max_size) {
            height *= max_size / width;
            width = max_size;
          }
        } else {
          if (height > max_size) {
            width *= max_size / height;
            height = max_size;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          callback(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Dashboard Metrics
  const stats = getTrainerDashboardStats();

  // Mobile drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // NOTIFICATION WIDGET STATE
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadNotifications = notifications.filter(
    (n) => !n.is_read && n.user_id === currentProfile?.id,
  );

  // SEARCH AND FILTERS (STUDENTS)
  const [searchStudent, setSearchStudent] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");

  // CREATING STUDENT MODAL STATE
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newStudentObjective, setNewStudentObjective] = useState("");
  const [newStudentHeight, setNewStudentHeight] = useState("175");
  const [newStudentWeight, setNewStudentWeight] = useState("80");
  const [newStudentBf, setNewStudentBf] = useState("18");
  const [newStudentRestrictions, setNewStudentRestrictions] = useState("");
  const [newStudentCpf, setNewStudentCpf] = useState("");
  const [newStudentPhone, setNewStudentPhone] = useState("");
  const [newStudentBirthdate, setNewStudentBirthdate] = useState("");
  const [newStudentAddress, setNewStudentAddress] = useState("");
  const [newStudentGender, setNewStudentGender] = useState<"M" | "F">("M");
  const [newStudentMonthlyFee, setNewStudentMonthlyFee] = useState("0");
  const [newStudentDueDay, setNewStudentDueDay] = useState("10");

  // CREATING WORKOUT STATE
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [targetStudentId, setTargetStudentId] = useState("");
  const [workoutTitle, setWorkoutTitle] = useState("");
  const [workoutDesc, setWorkoutDesc] = useState("");
  const [workoutDaysList, setWorkoutDaysList] = useState<
    Array<{
      day_name: string;
      exercises: Array<{
        exercise_id: string;
        series: number;
        reps: string;
        rest_seconds: number;
        load_kg: number;
        observations: string;
      }>;
    }>
  >([
    {
      day_name: "Dia A - Pernas & Abdominais",
      exercises: [
        {
          exercise_id: "e1",
          series: 4,
          reps: "10-12",
          rest_seconds: 90,
          load_kg: 30,
          observations: "",
        },
      ],
    },
  ]);

  // ADVANCED SEARCHABLE EXERCISE SELECTOR STATE
  const [focusedExerciseIndex, setFocusedExerciseIndex] = useState<
    string | null
  >(null);
  const [exerciseSelectSearch, setExerciseSelectSearch] = useState("");
  const [exerciseSelectCategory, setExerciseSelectCategory] = useState("Todos");

  // DUPLICATING WORKOUT STATE
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copySourceId, setCopySourceId] = useState("");
  const [copyTargetStudentId, setCopyTargetStudentId] = useState("");

  // PHYSICAL ASSESSMENT STATE
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [assessDate, setAssessDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );

  // VIEW STUDENT WORKOUTS / ASSESSMENTS STATE
  const [showViewWorkoutModal, setShowViewWorkoutModal] = useState(false);
  const [viewWorkoutStudentId, setViewWorkoutStudentId] = useState("");
  const [showViewAssessmentsModal, setShowViewAssessmentsModal] =
    useState(false);
  const [viewAssessmentsStudentId, setViewAssessmentsStudentId] = useState("");

  // SUPERADMIN CREATE TRAINER STATE
  const [showAddTrainerModal, setShowAddTrainerModal] = useState(false);

  // EXERCISE LIBRARY STATE
  const [newExerciseName, setNewExerciseName] = useState("");
  const [newExerciseCategory, setNewExerciseCategory] = useState("Peito");
  const [newExerciseDescription, setNewExerciseDescription] = useState("");
  const [newExerciseVideoUrl, setNewExerciseVideoUrl] = useState("");
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("Todos");

  // EDIT EXERCISE STATE
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(
    null,
  );
  const [editExerciseName, setEditExerciseName] = useState("");
  const [editExerciseCategory, setEditExerciseCategory] = useState("Peito");
  const [editExerciseDescription, setEditExerciseDescription] = useState("");
  const [editExerciseVideoUrl, setEditExerciseVideoUrl] = useState("");

  // MY PROFILE EDIT STATE
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileCpf, setProfileCpf] = useState("");
  const [profileAddress, setProfileAddress] = useState("");
  const [profileBirthdate, setProfileBirthdate] = useState("");
  const [profileCref, setProfileCref] = useState("");
  const [profileAvatarUrl, setProfileAvatarUrl] = useState("");

  // Password reset inside My Profile
  const [profileNewPassword, setProfileNewPassword] = useState("");
  const [profileConfirmPassword, setProfileConfirmPassword] = useState("");

  // Sync state with currentProfile when it is loaded
  React.useEffect(() => {
    if (currentProfile) {
      setProfileName(currentProfile.name || "");
      setProfilePhone(currentProfile.phone || "");
      setProfileCpf(currentProfile.cpf || "");
      setProfileAddress(currentProfile.address || "");
      setProfileBirthdate(currentProfile.birthdate || "");
      // If trainer info exists, get their cref
      const trainerInfo = trainers?.find?.((t) => t.id === currentProfile.id);
      if (trainerInfo) {
        setProfileCref(trainerInfo.cref || "");
      } else {
        setProfileCref((currentProfile as any).cref || "");
      }
      setProfileAvatarUrl(currentProfile.avatar_url || "");
    }
  }, [currentProfile, trainers]);

  const [assessStudentId, setAssessStudentId] = useState("");
  const [anamnesis, setAnamnesis] = useState("");
  const [assessWeight, setAssessWeight] = useState("");
  const [assessHeight, setAssessHeight] = useState("");
  const [assessBf, setAssessBf] = useState("");
  const [assessProtocol, setAssessProtocol] = useState("Pollock 7 dobras");
  const [recommendations, setRecommendations] = useState("");
  const [measurementMap, setMeasurementMap] = useState({
    neck: "0",
    shoulder: "0",
    chest: "0",
    waist: "0",
    abdomen: "0",
    hips: "0",
    biceps_left: "0",
    biceps_right: "0",
    thigh_left: "0",
    thigh_right: "0",
    calf_left: "0",
    calf_right: "0",
  });

  // FINANCE MODAL STATE
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payStudentId, setPayStudentId] = useState("");
  const [payAmount, setPayAmount] = useState("150");
  const [payDesc, setPayDesc] = useState("Consultoria Mensal Premium");
  const [payDueDate, setPayDueDate] = useState(() => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth.toISOString().split("T")[0];
  });

  // GEMINI AI ADVICE MODAL STATE
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiStudentId, setAiStudentId] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");

  // SUPERADMIN STATES
  const [adminTrainerName, setAdminTrainerName] = useState("");
  const [adminTrainerEmail, setAdminTrainerEmail] = useState("");
  const [adminTrainerCref, setAdminTrainerCref] = useState("");
  const [adminTrainerWhatsapp, setAdminTrainerWhatsapp] = useState("");
  const [adminTrainerSpecialties, setAdminTrainerSpecialties] = useState("");
  const [adminTrainerBio, setAdminTrainerBio] = useState("");
  const [adminTrainerPlan, setAdminTrainerPlan] = useState<
    "Starter" | "Pro" | "Studio"
  >("Starter");
  const [adminSuccess, setAdminSuccess] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);

  // EDITING TRAINER MODAL STATE
  const [editingTrainerId, setEditingTrainerId] = useState<string | null>(null);
  const [editTrainerName, setEditTrainerName] = useState("");
  const [editTrainerEmail, setEditTrainerEmail] = useState("");
  const [editTrainerCref, setEditTrainerCref] = useState("");
  const [editTrainerWhatsapp, setEditTrainerWhatsapp] = useState("");
  const [editTrainerSpecialties, setEditTrainerSpecialties] = useState("");
  const [editTrainerBio, setEditTrainerBio] = useState("");
  const [editTrainerPlan, setEditTrainerPlan] = useState<
    "Starter" | "Pro" | "Studio"
  >("Starter");

  // IN-APP CONFIRMATION MODALS (IFRAME SAFE)
  const [trainerToDeactivate, setTrainerToDeactivate] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [trainerToDelete, setTrainerToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // EDITING STUDENT STATE
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editStudentName, setEditStudentName] = useState("");
  const [editStudentEmail, setEditStudentEmail] = useState("");
  const [editStudentObjective, setEditStudentObjective] = useState("");
  const [editStudentHeight, setEditStudentHeight] = useState("175");
  const [editStudentWeight, setEditStudentWeight] = useState("80");
  const [editStudentBf, setEditStudentBf] = useState("18");
  const [editStudentRestrictions, setEditStudentRestrictions] = useState("");
  const [editStudentStatus, setEditStudentStatus] = useState<
    "active" | "inactive"
  >("active");
  const [editStudentCpf, setEditStudentCpf] = useState("");
  const [editStudentPhone, setEditStudentPhone] = useState("");
  const [editStudentBirthdate, setEditStudentBirthdate] = useState("");
  const [editStudentAddress, setEditStudentAddress] = useState("");
  const [editStudentGender, setEditStudentGender] = useState<"M" | "F">("M");
  const [editStudentMonthlyFee, setEditStudentMonthlyFee] = useState("0");
  const [editStudentDueDay, setEditStudentDueDay] = useState("10");

  // IN-APP CONFIRMATION MODALS FOR STUDENTS, WORKOUTS & EXERCISES (IFRAME SAFE)
  const [studentToDelete, setStudentToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [workoutToDelete, setWorkoutToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [exerciseToDelete, setExerciseToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // EDITING WORKOUT STATE
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);

  // TOAST ALERT SIMULATOR
  const [toast, setToast] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // HANDLERS
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName || !newStudentEmail) return;

    if (!canCreateStudent) {
      triggerToast(
        `⚠️ Limite de alunos atingido! Seu plano ${displayBadgeName} permite no máximo ${plan?.max_students} alunos ativos.`,
      );
      setShowAddStudentModal(false);
      setActiveTab("upgrades");
      return;
    }

    const result = await createStudent({
      trainer_id: currentProfile?.id || "t1",
      objective: newStudentObjective || "Saúde geral",
      initial_height: Number(newStudentHeight),
      initial_weight: Number(newStudentWeight),
      body_fat_percentage: Number(newStudentBf),
      injuries_restrictions: newStudentRestrictions || "Nenhuma",
      name: newStudentName,
      email: newStudentEmail,
      cpf: newStudentCpf,
      phone: newStudentPhone,
      birthdate: newStudentBirthdate,
      street: newStudentAddress,
      gender: newStudentGender,
      monthly_fee: Number(newStudentMonthlyFee) || 0,
      due_day: Number(newStudentDueDay) || 10,
    });

    if (result.success) {
      setShowAddStudentModal(false);
      // Limpa campos
      setNewStudentName("");
      setNewStudentEmail("");
      setNewStudentObjective("");
      setNewStudentRestrictions("");
      setNewStudentCpf("");
      setNewStudentPhone("");
      setNewStudentBirthdate("");
      setNewStudentAddress("");
      setNewStudentGender("M");
      setNewStudentMonthlyFee("0");
      setNewStudentDueDay("10");
      triggerToast(
        "🎉 Aluno cadastrado com sucesso! Credencial de acesso liberada com a senha padrão axiosfit.",
      );
    } else {
      triggerToast("⚠️ Falha ao registrar aluno via Supabase.");
    }
  };

  const handleStartEditStudent = (sId: string) => {
    const s = students.find((stud) => stud.id === sId);
    if (!s) return;
    const prof = profiles.find((p) => p.id === sId);

    setEditingStudentId(sId);
    setEditStudentName(prof?.name || s.name || "");
    setEditStudentEmail(prof?.email || s.email || "");
    setEditStudentObjective(s.objective || "");
    setEditStudentHeight(String(s.current_height || 170));
    setEditStudentWeight(String(s.current_weight || 70));
    setEditStudentBf(String(s.body_fat_percentage || 15));
    setEditStudentRestrictions(s.injuries_restrictions || "");
    setEditStudentStatus(s.status || "active");
    setEditStudentCpf(prof?.cpf || s.cpf || "");
    setEditStudentPhone(prof?.phone || s.phone || "");
    setEditStudentBirthdate(prof?.birthdate || s.birthdate || "");
    setEditStudentAddress(prof?.address || s.address || "");
    setEditStudentGender(prof?.gender || s.gender || "M");
    setEditStudentMonthlyFee(String(s.monthly_fee || 0));
    setEditStudentDueDay(String(s.due_day || 10));
  };

  const handleSaveEditStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudentId || !editStudentName) return;

    updateStudent(editingStudentId, {
      name: editStudentName,
      objective: editStudentObjective,
      current_height: Number(editStudentHeight),
      current_weight: Number(editStudentWeight),
      body_fat_percentage: Number(editStudentBf),
      injuries_restrictions: editStudentRestrictions,
      status: editStudentStatus,
      cpf: editStudentCpf,
      phone: editStudentPhone,
      birthdate: editStudentBirthdate,
      address: editStudentAddress,
      gender: editStudentGender,
      monthly_fee: Number(editStudentMonthlyFee) || 0,
      due_day: Number(editStudentDueDay) || 10,
    });

    setEditingStudentId(null);
    triggerToast("✓ Cadastro do aluno atualizado com sucesso!");
  };

  const handleStartEditWorkout = (wId: string) => {
    const w = workouts.find((work) => work.id === wId);
    if (!w) return;

    setEditingWorkoutId(wId);
    setWorkoutTitle(w.name);
    setWorkoutDesc(w.description || "");
    setTargetStudentId(w.student_id);

    const wDays = workoutDays.filter((d) => d.workout_id === wId);
    const mappedList = wDays.map((day) => {
      const exercisesInDay = workoutExercises.filter(
        (we) => we.workout_day_id === day.id,
      );
      return {
        day_name: day.day_name,
        exercises: exercisesInDay.map((we) => ({
          exercise_id: we.exercise_id,
          series: we.series,
          reps: we.reps,
          rest_seconds: we.rest_seconds,
          load_kg: we.load_kg || 0,
          observations: we.observations || "",
        })),
      };
    });

    setWorkoutDaysList(
      mappedList.length > 0
        ? mappedList
        : [
            {
              day_name: "Dia A - Geral",
              exercises: [
                {
                  exercise_id: "e1",
                  series: 3,
                  reps: "12",
                  rest_seconds: 60,
                  load_kg: 20,
                  observations: "",
                },
              ],
            },
          ],
    );
    setShowWorkoutModal(true);
  };

  const handleCreateWorkout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStudentId || !workoutTitle) return;

    if (editingWorkoutId) {
      updateWorkout(
        editingWorkoutId,
        workoutTitle,
        workoutDesc,
        workoutDaysList,
      );
      triggerToast("🏋️ Plano de treinos atualizado com sucesso!");
    } else {
      createWorkout(
        {
          student_id: targetStudentId,
          trainer_id: currentProfile?.id || "t1",
          name: workoutTitle,
          description: workoutDesc,
          is_active: true,
        },
        workoutDaysList,
      );
      triggerToast("🏋️ Plano de treinos publicado no celular do aluno!");
    }

    setShowWorkoutModal(false);
    setEditingWorkoutId(null);
    setWorkoutTitle("");
    setWorkoutDesc("");
    setWorkoutDaysList([
      {
        day_name: "Dia A - Geral",
        exercises: [
          {
            exercise_id: "e1",
            series: 3,
            reps: "12",
            rest_seconds: 60,
            load_kg: 20,
            observations: "",
          },
        ],
      },
    ]);
  };

  const handleCopyWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!copySourceId || !copyTargetStudentId) return;

    const result = await duplicateWorkout(copySourceId, copyTargetStudentId);
    setShowCopyModal(false);
    if (result.success) {
      triggerToast("📋 Periodização duplicada e adaptada para o novo aluno!");
    } else {
      triggerToast(result.message || "Não foi possível duplicar o treino.");
    }
  };

  const handleCreateAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessStudentId || !assessWeight || !assessHeight || !assessBf) return;

    const w = Number(assessWeight);
    const h = Number(assessHeight) / 105; // cm para metro
    const imcVal = Number(
      (
        w /
        ((Number(assessHeight) / 100) * (Number(assessHeight) / 100))
      ).toFixed(2),
    );

    const assessFields = {
      student_id: assessStudentId,
      trainer_id: currentProfile?.id || "t1",
      date: assessDate || new Date().toISOString().split("T")[0],
      anamnesis,
      imc: imcVal,
      body_fat_percentage: Number(assessBf),
      protocol: assessProtocol,
      recommendations,
    };

    const measurementFields = {
      student_id: assessStudentId,
      date: assessDate || new Date().toISOString().split("T")[0],
      weight: w,
      height: Number(assessHeight),
      neck: Number(measurementMap.neck),
      shoulder: Number(measurementMap.shoulder),
      chest: Number(measurementMap.chest),
      waist: Number(measurementMap.waist),
      abdomen: Number(measurementMap.abdomen),
      hips: Number(measurementMap.hips),
      biceps_left: Number(measurementMap.biceps_left),
      biceps_right: Number(measurementMap.biceps_right),
      thigh_left: Number(measurementMap.thigh_left),
      thigh_right: Number(measurementMap.thigh_right),
      calf_left: Number(measurementMap.calf_left),
      calf_right: Number(measurementMap.calf_right),
    };

    createPhysicalAssessment(assessFields, measurementFields);
    setShowAssessmentModal(false);
    triggerToast("📊 Medidas e Avaliação salva. Aluno notificado!");
  };

  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payStudentId || !payAmount) return;

    createPayment({
      student_id: payStudentId,
      trainer_id: currentProfile?.id || "t1",
      amount: Number(payAmount),
      description: payDesc,
      status: "pending",
      due_date: payDueDate,
    });

    setShowPaymentModal(false);
    triggerToast("💳 Boleto/Lançamento de mensalidade gerado.");
  };

  const handleTriggerAI = async (studentId: string) => {
    setAiStudentId(studentId);
    setShowAIModal(true);
    setAiLoading(true);
    setAiResponse("");

    if (!canAccess("ai")) {
      setAiResponse(
        '⚠️ Relatórios avançados estão disponíveis no plano Studio.\n\nSeu plano atual não inclui este recurso. Acesse "Upgrade de Plano" para desbloquear relatórios avançados e suporte WhatsApp.',
      );
      setAiLoading(false);
      return;
    }

    try {
      const resp = await getAISuggestions(studentId);
      setAiResponse(resp.suggestion);
    } catch {
      setAiResponse("Ocorreu um erro no processamento da IA.");
    } finally {
      setAiLoading(false);
    }
  };

  // FILTRAGEM DE ALUNOS
  const filteredStudents = students.filter((s) => {
    if (s.trainer_id !== (currentProfile?.id || "t1")) return false;

    // Busca por nome ou email mapeado
    const prof = profiles.find((p) => p.id === s.id);
    const matchesSearch = prof
      ? prof.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
        prof.email.toLowerCase().includes(searchStudent.toLowerCase())
      : false;

    if (filterStatus === "all") return matchesSearch;
    return matchesSearch && s.status === filterStatus;
  });

  const navItems: NavItem[] = isSuperAdmin
    ? [
        { id: "superadmin", label: "Superadmin", icon: UserCheck },
        { id: "exercises", label: "Exercícios", icon: FolderOpen },
        { id: "settings", label: "Perfil", icon: Settings },
      ]
    : [
        { id: "stats", label: "Painel", icon: TrendingUp },
        { id: "students", label: "Alunos", icon: Users },
        { id: "workouts", label: "Treinos", icon: Dumbbell },
        { id: "assessments", label: "Avaliação", icon: Activity },
        { id: "exercises", label: "Exercícios", icon: FolderOpen },
        { id: "financial", label: "Financeiro", icon: DollarSign },
        { id: "settings", label: "Perfil", icon: Settings },
        { id: "upgrades", label: "Upgrade", icon: CreditCard, highlight: true },
      ];

  const mobileNavItems = isSuperAdmin
    ? navItems
    : [
        { id: "stats", label: "Painel", icon: TrendingUp },
        { id: "students", label: "Alunos", icon: Users },
        { id: "workouts", label: "Treinos", icon: Dumbbell },
        { id: "assessments", label: "Avaliação", icon: Activity },
        { id: "settings", label: "Perfil", icon: Settings },
      ];

  const pageMeta: Record<string, { title: string; subtitle: string }> = {
    stats: { title: "Dashboard", subtitle: "Visão geral da sua assessoria" },
    students: { title: "Alunos", subtitle: "Gerenciar e acompanhar sua base" },
    workouts: { title: "Treinos", subtitle: "Criar e gerenciar protocolos" },
    assessments: {
      title: "Avaliação Física",
      subtitle: "Métricas e evolução corporal",
    },
    exercises: { title: "Exercícios", subtitle: "Biblioteca de movimentos" },
    financial: {
      title: "Financeiro",
      subtitle: "Receitas, cobranças e planos",
    },
    settings: { title: "Configurações", subtitle: "Perfil e preferências" },
    upgrades: {
      title: "Upgrade de Plano",
      subtitle: "Expanda os limites da sua conta",
    },
    superadmin: {
      title: "Superadmin",
      subtitle: "Gestão global da plataforma",
    },
  };

  const { title: pageTitle, subtitle: pageSubtitle } =
    pageMeta[activeTab] || pageMeta.stats;

  const notificationsPanelContent = (
    <>
      <div className="p-4 border-b border-border flex justify-between items-center">
        <span className="text-xs font-bold text-muted-foreground">
          Notificações
        </span>
        <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
          {unreadNotifications.length} não lidas
        </span>
      </div>
      <div className="p-3 space-y-2 max-h-60 overflow-y-auto touch-momentum">
        {notifications.filter((n) => n.user_id === currentProfile?.id)
          .length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Nenhuma notificação
          </p>
        ) : (
          notifications
            .filter((n) => n.user_id === currentProfile?.id)
            .map((n) => (
              <div
                key={n.id}
                onClick={() => markNotificationAsRead(n.id)}
                className={cn(
                  "p-2.5 rounded-xl text-left transition cursor-pointer text-xs",
                  n.is_read
                    ? "opacity-60 bg-muted/50"
                    : "bg-primary/10 hover:bg-primary/15 border-l-2 border-primary",
                )}
              >
                <div className="font-semibold text-foreground mb-0.5">
                  {n.title}
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed mb-1">
                  {n.message}
                </p>
                <span className="text-[9px] text-muted-foreground/70 block">
                  {new Date(n.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))
        )}
      </div>
    </>
  );

  return (
    <>
      <DashboardLayout
        title={pageTitle}
        subtitle={pageSubtitle}
        navItems={navItems}
        mobileNavItems={mobileNavItems}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as typeof activeTab)}
        userName={currentProfile?.name}
        userAvatar={currentProfile?.avatar_url}
        userPlan={plan?.name}
        planBadge={plan ? displayBadgeName : undefined}
        notificationCount={unreadNotifications.length}
        notificationsPanel={notificationsPanelContent}
        onLogout={logout}
        toast={toast}
        toastIcon={<BadgeCheck className="w-5 h-5 text-emerald-400" />}
        headerActions={
          activeTab === "stats" && !isSuperAdmin ? (
            <Button
              size="sm"
              onClick={() => setShowAddStudentModal(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Novo Aluno
            </Button>
          ) : undefined
        }
      >
        {/* TAB 1: PAINEL DE DESEMPENHO (OVERVIEWSTATS) */}
        {activeTab === "stats" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Alunos"
                value={stats.totalStudents}
                subtext={`${stats.activeStudents} ativos • ${stats.inactiveStudents} inativos`}
                icon={<Users className="w-4 h-4" />}
              />
              <StatCard
                label="Faturado (Mês)"
                value={`R$ ${stats.monthlyRevenue.toFixed(2)}`}
                trend={{ value: "100% adimplência", positive: true }}
                icon={<DollarSign className="w-4 h-4 text-emerald-600" />}
              />
              <StatCard
                label="Logs Semana"
                value={`${stats.completedWorkoutsThisWeek} treinos`}
                subtext="Atividade reportada hoje"
                icon={<Dumbbell className="w-4 h-4" />}
              />
              <StatCard
                label="Retenção Estim."
                value={`${stats.retentionScore}%`}
                subtext="Previsão Excelente por IA ⭐"
                icon={<Award className="w-4 h-4 text-amber-500" />}
              />
            </div>

            {/* SAAS LIMITS COMPONENT */}
            {plan && (
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-3xl border border-slate-200 text-left relative overflow-hidden shadow-xs">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-100/60 text-indigo-700 px-2 py-0.5 rounded-md">
                        Seu Plano Ativo
                      </span>
                      <span
                        className={`text-[9px] font-black border px-1.5 py-0.5 rounded-full uppercase tracking-wider select-none ${badgeThemeColor}`}
                      >
                        {displayBadgeName}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 leading-snug">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-slate-500 max-w-lg leading-relaxed">
                      Sua assinatura está ativa e integrada ao Mercado Pago.
                      Confira abaixo os limites de consumo associados ao seu
                      nível atual de assessoria fitness.
                    </p>
                  </div>

                  <div className="w-full md:w-72 space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-slate-705">
                      <span>Alunos Ativos Utilizados</span>
                      <span className="font-bold">
                        {activeStudentsCount} de{" "}
                        {plan.max_students > 1000
                          ? "Ilimitados"
                          : plan.max_students}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${limitProgress > 80 ? "bg-rose-500" : "bg-indigo-600"}`}
                        style={{
                          width: `${plan.max_students > 1000 ? 5 : limitProgress}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-[10px] text-slate-400 text-right leading-none">
                      {plan.max_students > 1000
                        ? "Espaço de escala ilimitado"
                        : `Restam ${remainingStudentsCount} cadastros`}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-200 text-xs font-medium">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span
                      className={`w-2 h-2 rounded-full ${plan.ai_enabled ? "bg-indigo-500" : "bg-slate-300"}`}
                    ></span>
                    IA Gemini:{" "}
                    {plan.ai_enabled
                      ? plan.ai_limit > 1000
                        ? "Ilimitada"
                        : `${plan.ai_limit}/mês`
                      : "Inativa"}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span
                      className={`w-2 h-2 rounded-full ${plan.financial_enabled ? "bg-indigo-500" : "bg-slate-300"}`}
                    ></span>
                    Financeiro:{" "}
                    {plan.financial_enabled ? "Habilitado" : "Inativo"}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span
                      className={`w-2 h-2 rounded-full ${plan.pdf_enabled ? "bg-indigo-500" : "bg-slate-300"}`}
                    ></span>
                    Avaliações PDF:{" "}
                    {plan.pdf_enabled ? "Habilitada" : "Inativa"}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span
                      className={`w-2 h-2 rounded-full ${plan.custom_branding_enabled ? "bg-indigo-500" : "bg-slate-300"}`}
                    ></span>
                    Custom Branding:{" "}
                    {plan.custom_branding_enabled ? "Habilitado" : "Inativo"}
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <button
                      onClick={() => setActiveTab("upgrades")}
                      className="text-[11px] font-black tracking-wide text-indigo-600 hover:text-indigo-950 flex items-center gap-1 cursor-pointer transition uppercase"
                    >
                      Upgrade de Plano <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* GRÁFICOS E METRICAS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* MATRIZ DE REVOLUÇÃO (GRÁFICO SVG NATIVO) */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-sm">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">
                    Histórico de Faturamento da Assessoria
                  </h3>
                  <p className="text-xs text-slate-500 font-sans">
                    Fluxo de caixa de pagamentos recebidos (Jan - Mai)
                  </p>
                </div>

                <div className="h-44 w-full flex items-end gap-3 justify-between pt-12">
                  {[
                    { m: "Jan", val: 1200, style: "h-1/5 bg-indigo-650/10" },
                    { m: "Fev", val: 2400, style: "h-2/5 bg-indigo-650/20" },
                    { m: "Mar", val: 3100, style: "h-3/5 bg-indigo-650/40" },
                    { m: "Abr", val: 3500, style: "h-4/5 bg-indigo-650/60" },
                    {
                      m: "Mai",
                      val: 3840,
                      style:
                        "h-full bg-indigo-650 shadow-[0_0_15px_rgba(79,70,229,0.2)]",
                    },
                  ].map((item, id) => (
                    <div
                      key={id}
                      className="flex-1 flex flex-col items-center gap-2"
                    >
                      <div className="text-[10px] font-mono text-slate-600 font-bold">
                        R$ {item.val}
                      </div>
                      <div
                        className={`w-full rounded-lg transition-all duration-500 ${item.style}`}
                      ></div>
                      <span className="text-xs text-slate-500 font-mono">
                        {item.m}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* VENCIMENTOS MENSALIDADE */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">
                  Próximos Vencimentos
                </h3>

                <div className="space-y-3">
                  {stats.upcomingRenewals.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">
                      Nenhum vencimento pendente.
                    </p>
                  ) : (
                    stats.upcomingRenewals.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-800">
                            {u.studentName}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Vence: {new Date(u.dueDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-800 font-mono">
                            R$ {u.amount.toFixed(2)}
                          </div>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold capitalize">
                            {u.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* PREMIUM RETENTION SECTION */}
            <div className="p-6 rounded-2xl bg-indigo-50 border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-150 border border-amber-200 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-indigo-950">
                    Análise Preditiva de Adência (Axos IA)
                  </h4>
                  <p className="text-xs text-indigo-800 mt-0.5">
                    Alunos integrados com logs e gamificação apresentam
                    probabilidade de 92% de renovação.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveTab("students");
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition shadow shadow-indigo-600/10 cursor-pointer"
              >
                Analisar Alunos
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: ALUNOS (CRUD & FILTER LIST) */}
        {activeTab === "students" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
                  Gestão Real de Alunos
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Visualize anamnese, medidas físicas e agende avaliações.
                </p>
              </div>

              <button
                onClick={() => setShowAddStudentModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-white" /> Cadastrar Aluno
              </button>
            </div>

            {/* BUSCADO E FILTROS */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                placeholder="Buscar alunos por nome ou e-mail..."
                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition"
              />

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-750 focus:outline-none focus:border-indigo-600"
              >
                <option value="all">Todos os Status</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>
            </div>

            {/* ROSTER TABLE / CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredStudents.length === 0 ? (
                <p className="text-xs text-slate-500 font-sans py-8 col-span-2 text-center">
                  Nenhum aluno encontrado correspondente.
                </p>
              ) : (
                filteredStudents.map((s) => {
                  const prof = profiles.find((p) => p.id === s.id);
                  const currentAssessments = physicalAssessments.filter(
                    (a) => a.student_id === s.id,
                  );
                  const lastAssess =
                    currentAssessments[currentAssessments.length - 1];

                  return (
                    <div
                      key={s.id}
                      className="bg-slate-50 rounded-2xl border border-slate-200 p-5 flex flex-col justify-between hover:border-slate-300 transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              prof?.avatar_url ||
                              "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100"
                            }
                            alt="Avatar"
                            className="w-11 h-11 rounded-xl border border-slate-200 object-cover"
                          />
                          <div>
                            <h4 className="text-sm font-semibold text-slate-900">
                              {prof?.name}
                            </h4>
                            <p className="text-[10px] text-slate-500 font-mono">
                              {prof?.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold tracking-tight uppercase ${
                              s.status === "active"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {s.status === "active" ? "Ativo" : "Inativo"}
                          </span>

                          {/* Toggle status: active/inactive */}
                          <button
                            onClick={() => {
                              const nextStatus =
                                s.status === "active" ? "inactive" : "active";
                              updateStudent(s.id, { status: nextStatus });
                              triggerToast(
                                `✓ Aluno ${nextStatus === "active" ? "ativado" : "desativado"} com sucesso!`,
                              );
                            }}
                            className="text-slate-400 hover:text-indigo-600 hover:bg-slate-200/55 p-1 rounded-md transition cursor-pointer"
                            title={
                              s.status === "active"
                                ? "Desativar Aluno"
                                : "Ativar Aluno"
                            }
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Student */}
                          <button
                            onClick={() => handleStartEditStudent(s.id)}
                            className="text-slate-400 hover:text-indigo-600 hover:bg-slate-200/55 p-1 rounded-md transition cursor-pointer"
                            title="Editar Dados"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Student */}
                          <button
                            onClick={() =>
                              setStudentToDelete({
                                id: s.id,
                                name: prof?.name || s.name || "Aluno",
                              })
                            }
                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-md transition text-rose-500 cursor-pointer"
                            title="Excluir Aluno"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* SEXO E MENSALIDADE */}
                      <div className="flex items-center gap-1.5 text-[11px] mb-1.5 mt-3 text-slate-500 font-sans">
                        <span className="flex items-center gap-1 bg-slate-105 border border-slate-200 px-2.5 py-1 rounded-lg">
                          <span className="font-semibold text-slate-400">
                            Sexo:
                          </span>
                          <span className="font-bold text-slate-700">
                            {s.gender || "M"}
                          </span>
                        </span>
                        {plan?.financial_enabled && (
                          <span className="flex items-center gap-1 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                            <span className="font-semibold text-indigo-400">
                              Mensalidade:
                            </span>
                            <span className="font-bold text-indigo-700">
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(s.monthly_fee || 0)}
                            </span>
                          </span>
                        )}
                      </div>

                      {/* OBJETIVO E LESÃO */}
                      <div className="my-4 space-y-2 border-t border-b border-slate-200/60 py-3 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-mono tracking-wider">
                            Objetivo
                          </span>
                          <span className="text-slate-800 mt-0.5 font-medium block">
                            {s.objective}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center bg-white border border-slate-100 p-2 rounded-lg">
                          <div>
                            <span className="text-[9px] text-slate-400 uppercase font-mono block">
                              Peso
                            </span>
                            <span className="text-slate-900 font-bold font-mono">
                              {s.current_weight}kg
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 uppercase font-mono block">
                              Altura
                            </span>
                            <span className="text-slate-900 font-bold font-mono">
                              {s.current_height}cm
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 uppercase font-mono block">
                              Gordura %
                            </span>
                            <span className="text-indigo-650 font-bold font-mono">
                              {s.body_fat_percentage || "--"}%
                            </span>
                          </div>
                        </div>
                        {s.injuries_restrictions && (
                          <div>
                            <span className="text-rose-600 text-[10px] font-semibold flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" />{" "}
                              Artropatias ou lesões:
                            </span>
                            <p className="text-[11px] text-slate-600 leading-normal">
                              {s.injuries_restrictions}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* INTERAÇÕES RÁPIDAS (EX PREMIUM IA SUGGESTION) */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                        <button
                          onClick={() => handleTriggerAI(s.id)}
                          className="bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-xl px-3 py-1.5 text-[11px] font-semibold transition flex items-center gap-1"
                        >
                          <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-600" />
                          Prescritor IA (Gemini)
                        </button>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setViewAssessmentsStudentId(s.id);
                              setShowViewAssessmentsModal(true);
                            }}
                            className="text-[11px] bg-white hover:bg-slate-100 text-slate-700 font-bold px-2.5 py-1.5 rounded-lg border border-slate-205 cursor-pointer shadow-xs transition"
                            title="Ver Medidas do Aluno"
                          >
                            Ver Medidas
                          </button>
                          <button
                            onClick={() => {
                              setViewWorkoutStudentId(s.id);
                              setShowViewWorkoutModal(true);
                            }}
                            className="text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-2.5 py-1.5 rounded-lg shadow cursor-pointer transition focus:outline-none"
                            title="Ver Treino Ativo do Aluno"
                          >
                            Ver Treino
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: GERENCIAR TREINOS (PERIODIZAÇÃO) */}
        {activeTab === "workouts" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center pb-4 border-b border-slate-205">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
                  Periodizações de Atividade
                </h2>
                <p className="text-xs text-slate-500 font-sans">
                  Monte, publique e replique matrizes de exercícios.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const myStudents = students.filter(
                      (st) => st.trainer_id === (currentProfile?.id || "t1"),
                    );
                    if (myStudents.length > 0) {
                      setCopyTargetStudentId(myStudents[0].id);
                      setShowCopyModal(true);
                    } else {
                      triggerToast("Cadastre um aluno primeiro!");
                    }
                  }}
                  className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-4 h-4 text-indigo-600" /> Duplicar Treino
                </button>
                <button
                  onClick={() => {
                    const myStudents = students.filter(
                      (st) => st.trainer_id === (currentProfile?.id || "t1"),
                    );
                    if (myStudents.length > 0) {
                      setTargetStudentId(myStudents[0].id);
                      setShowWorkoutModal(true);
                    } else {
                      triggerToast("Cadastre um aluno primeiro!");
                    }
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition shadow flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-white" /> Novo Cronograma
                </button>
              </div>
            </div>

            {/* LISTA DE TREINOS EXISTENTES */}
            <div className="space-y-4">
              {workouts.filter((w) => {
                if (isSuperAdmin) return true;
                const s = students.find((stud) => stud.id === w.student_id);
                return s && s.trainer_id === (currentProfile?.id || "t1");
              }).length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-10">
                  Nenhuma periodização ativa cadastrada.
                </p>
              ) : (
                workouts
                  .filter((w) => {
                    if (isSuperAdmin) return true;
                    const s = students.find((stud) => stud.id === w.student_id);
                    return s && s.trainer_id === (currentProfile?.id || "t1");
                  })
                  .map((w) => {
                    const studentProf = profiles.find(
                      (p) => p.id === w.student_id,
                    );
                    const days = workoutDays.filter(
                      (d) => d.workout_id === w.id,
                    );

                    return (
                      <div
                        key={w.id}
                        className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {w.is_active ? (
                                <span className="text-[10px] font-mono text-emerald-800 uppercase bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                                  ATIVA
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono text-slate-605 text-slate-600 uppercase bg-slate-200 px-2 py-0.5 rounded-full font-bold">
                                  INATIVO
                                </span>
                              )}

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    toggleWorkoutActive(w.id);
                                    triggerToast(
                                      `✓ Treino "${w.name}" ${!w.is_active ? "ativado" : "desativado"}!`,
                                    );
                                  }}
                                  className="text-slate-400 hover:text-indigo-600 hover:bg-slate-200/60 p-1 rounded transition cursor-pointer"
                                  title={w.is_active ? "Desativar" : "Ativar"}
                                >
                                  <Power className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => handleStartEditWorkout(w.id)}
                                  className="text-slate-400 hover:text-indigo-600 hover:bg-slate-200/60 p-1 rounded transition cursor-pointer"
                                  title="Editar Treino"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() =>
                                    setWorkoutToDelete({
                                      id: w.id,
                                      name: w.name,
                                    })
                                  }
                                  className="text-slate-500 hover:text-rose-600 hover:bg-rose-50 p-1 rounded transition text-rose-500 cursor-pointer"
                                  title="Excluir Treino"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 mt-1.5">
                              {w.name}
                            </h3>
                            <p className="text-xs text-slate-500 font-light mt-0.5">
                              {w.description || "Sem descrição"}
                            </p>
                          </div>
                          <div className="text-xs text-slate-500 font-mono text-right sm:text-right">
                            <div>
                              Aluno:{" "}
                              <span className="text-slate-900 font-bold">
                                {studentProf?.name || "Inexistente"}
                              </span>
                            </div>
                            <span className="text-[10px] block text-slate-400 whitespace-nowrap mt-1">
                              Registrado{" "}
                              {new Date(w.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* DIAS DE EXERCÍCIOS ASSINALADOS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                          {days.map((d) => {
                            const exerList = workoutExercises.filter(
                              (we) => we.workout_day_id === d.id,
                            );

                            return (
                              <div
                                key={d.id}
                                className="bg-white border border-slate-150 p-4 rounded-xl shadow-xs"
                              >
                                <h4 className="text-xs font-mono font-bold text-slate-900 uppercase border-b border-slate-100 pb-2 mb-2 flex items-center justify-between">
                                  <span>{d.day_name}</span>
                                  <span className="text-[10px] text-slate-400 lowercase">
                                    {exerList.length} exercícios
                                  </span>
                                </h4>

                                <div className="space-y-2">
                                  {exerList.map((we) => {
                                    const exInfo = exercises.find(
                                      (e) => e.id === we.exercise_id,
                                    );
                                    return (
                                      <div
                                        key={we.id}
                                        className="text-xs flex justify-between items-center text-slate-700 py-1 border-b border-slate-100 last:border-0"
                                      >
                                        <div className="font-light">
                                          🏋️{" "}
                                          <span className="font-bold text-slate-800">
                                            {exInfo?.name || "Exercício"}
                                          </span>
                                        </div>
                                        <div className="text-[11px] font-mono font-bold text-indigo-600">
                                          {we.series}x{we.reps} •{" "}
                                          <span className="text-slate-500 font-normal">
                                            {we.load_kg || 0}kg
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}

        {/* TAB 4: AVALIAÇÃO FÍSICA E ANAMNESE */}
        {activeTab === "assessments" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center pb-4 border-b border-slate-205">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Anamnese & Prontuário Antropométrico
                </h2>
                <p className="text-xs text-slate-500">
                  Gere índices de IMC, percentuais e gráficos comparativos.
                </p>
              </div>

              <button
                onClick={() => {
                  const myStudents = students.filter(
                    (st) => st.trainer_id === (currentProfile?.id || "t1"),
                  );
                  if (myStudents.length > 0) {
                    setAssessStudentId(myStudents[0].id);
                    setShowAssessmentModal(true);
                  } else {
                    triggerToast("Cadastre um aluno primeiro!");
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition shadow flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-white" /> Nova Avaliação
              </button>
            </div>

            {/* LISTA HISTORICO AVALIAÇÕES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {physicalAssessments.filter((pa) => {
                if (isSuperAdmin) return true;
                const s = students.find((stud) => stud.id === pa.student_id);
                return s && s.trainer_id === (currentProfile?.id || "t1");
              }).length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-10 col-span-2">
                  Nenhum laudo ou prontuário cadastrado.
                </p>
              ) : (
                physicalAssessments
                  .filter((pa) => {
                    if (isSuperAdmin) return true;
                    const s = students.find(
                      (stud) => stud.id === pa.student_id,
                    );
                    return s && s.trainer_id === (currentProfile?.id || "t1");
                  })
                  .map((pa) => {
                    const studentProf = profiles.find(
                      (p) => p.id === pa.student_id,
                    );
                    const meas =
                      bodyMeasurements.find(
                        (m) => m.physical_assessment_id === pa.id,
                      ) ||
                      bodyMeasurements.find(
                        (m) => m.student_id === pa.student_id,
                      );

                    return (
                      <div
                        key={pa.id}
                        className="bg-slate-50 rounded-2xl border border-slate-200 p-5 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <h4 className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-widest">
                                {pa.protocol}
                              </h4>
                              <span className="text-[10px] text-slate-500">
                                {new Date(pa.date).toLocaleDateString()}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-900 bg-slate-200 px-2 py-1 rounded">
                              IMC: {pa.imc}
                            </span>
                          </div>

                          <div className="text-xs mb-3">
                            <span className="text-slate-500 block text-[10px] uppercase font-mono mb-1">
                              Aluno
                            </span>
                            <span className="text-slate-900 font-bold">
                              {studentProf?.name || "Aluno"}
                            </span>
                          </div>

                          <div className="space-y-2 border-t border-slate-200 pt-3 text-xs">
                            <div>
                              <span className="text-slate-500 block text-[10px] font-mono">
                                HISTÓRICO CLINÍCO (ANAMNESE)
                              </span>
                              <p className="text-slate-700 font-light leading-relaxed mt-0.5">
                                {pa.anamnesis}
                              </p>
                            </div>

                            {pa.recommendations && (
                              <div className="bg-indigo-50 border border-indigo-100 p-2.5 rounded-lg text-[11px] text-indigo-700">
                                <span className="font-bold text-indigo-900 block mb-0.5">
                                  Recomendações:
                                </span>
                                {pa.recommendations}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* EXPORT BUTTON SIMULATION */}
                        <div className="border-t border-slate-202 border-slate-200 mt-4 pt-3 flex items-center justify-between text-xs">
                          <span className="text-slate-600 font-bold font-mono">
                            Fat % : {pa.body_fat_percentage}%
                          </span>

                          <button
                            onClick={() => {
                              const printWindow = window.open("", "_blank");
                              if (!printWindow) {
                                alert(
                                  "Por favor, ative a exibição de pop-ups no seu navegador para imprimir a Avaliação Física.",
                                );
                                return;
                              }

                              const formattedDate = new Date(
                                pa.date || pa.created_at,
                              ).toLocaleDateString("pt-BR");

                              printWindow.document.write(`
                                <!DOCTYPE html>
                                <html>
                                  <head>
                                    <title>Laudo de Avaliação Física - ${studentProf?.name || "Aluno"}</title>
                                    <style>
                                      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
                                      @media print {
                                        body { margin: 0; padding: 20px; }
                                        .no-print { display: none; }
                                      }
                                      body {
                                        font-family: 'Inter', sans-serif;
                                        color: #0f172a;
                                        background-color: #ffffff;
                                        margin: 0;
                                        padding: 40px;
                                        line-height: 1.6;
                                      }
                                      .header {
                                        display: flex;
                                        justify-content: space-between;
                                        align-items: center;
                                        border-bottom: 2px solid #84cc16;
                                        padding-bottom: 20px;
                                        margin-bottom: 25px;
                                      }
                                      .logo {
                                        font-size: 24px;
                                        font-weight: 850;
                                        letter-spacing: -1px;
                                        font-style: italic;
                                        color: #0f171d;
                                      }
                                      .logo span {
                                        color: #84cc16;
                                      }
                                      .doc-info {
                                        text-align: right;
                                        font-size: 11px;
                                        color: #64748b;
                                        font-weight: 500;
                                      }
                                      .title-container {
                                        text-align: center;
                                        margin-bottom: 35px;
                                      }
                                      .title-container h1 {
                                        font-size: 22px;
                                        font-weight: 800;
                                        margin: 0;
                                        text-transform: uppercase;
                                        letter-spacing: 1px;
                                        color: #0f172a;
                                      }
                                      .title-container p {
                                        font-size: 13px;
                                        color: #64748b;
                                        margin: 5px 0 0 0;
                                      }
                                      .grid-group {
                                        display: grid;
                                        grid-template-columns: repeat(2, 1fr);
                                        gap: 20px;
                                        margin-bottom: 25px;
                                      }
                                      .card {
                                        background-color: #f8fafc;
                                        border: 1px solid #e2e8f0;
                                        border-radius: 12px;
                                        padding: 18px;
                                      }
                                      .card-title {
                                        font-size: 11px;
                                        text-transform: uppercase;
                                        letter-spacing: 0.5px;
                                        color: #475569;
                                        font-weight: 700;
                                        border-bottom: 1px solid #e2e8f0;
                                        padding-bottom: 8px;
                                        margin-top: 0;
                                        margin-bottom: 12px;
                                        display: flex;
                                        justify-content: space-between;
                                      }
                                      .full-span {
                                        grid-column: span 2;
                                      }
                                      .row {
                                        display: flex;
                                        justify-content: space-between;
                                        padding: 6px 0;
                                        font-size: 13px;
                                        border-bottom: 1px dashed #f1f5f9;
                                      }
                                      .row:last-child {
                                        border-bottom: none;
                                      }
                                      .row-label {
                                        color: #475569;
                                      }
                                      .row-val {
                                        font-weight: 600;
                                        color: #0f172a;
                                      }
                                      .clinical {
                                        font-size: 13px;
                                        color: #334155;
                                        white-space: pre-line;
                                        margin: 0;
                                        background-color: #f1f5f9;
                                        padding: 12px;
                                        border-radius: 8px;
                                      }
                                      .signatures {
                                        margin-top: 50px;
                                        display: flex;
                                        justify-content: space-between;
                                        font-size: 12px;
                                        color: #475569;
                                      }
                                      .sig-box {
                                        text-align: center;
                                        width: 45%;
                                      }
                                      .sig-line {
                                        border-top: 1px solid #94a3b8;
                                        margin-bottom: 6px;
                                        margin-top: 40px;
                                      }
                                    </style>
                                  </head>
                                  <body>
                                    <div class="header">
                                      <div class="logo">AXXOS<span>FIT</span></div>
                                      <div class="doc-info">
                                        Data do Exame: ${formattedDate}<br />
                                        Protocolo: ${pa.protocol || "Geral"}
                                      </div>
                                    </div>

                                    <div class="title-container">
                                      <h1>Ficha de Avaliação Antropométrica</h1>
                                      <p>Laudo oficial de composição corporal e recomendações técnicas</p>
                                    </div>

                                    <div class="grid-group">
                                      
                                      <div class="card full-span">
                                        <div class="card-title">Identificação do Aluno</div>
                                        <div class="row">
                                          <span class="row-label">Nome Completo</span>
                                          <span class="row-val">${studentProf?.name || "Não informado"}</span>
                                        </div>
                                        <div class="row">
                                          <span class="row-label">E-mail Cadastrado</span>
                                          <span class="row-val">${studentProf?.email || "-"}</span>
                                        </div>
                                        <div class="row">
                                          <span class="row-label">Fórmula Metabólica Aplicada</span>
                                          <span class="row-val">${pa.protocol || "Pollock 7 Dobras"}</span>
                                        </div>
                                      </div>

                                      <div class="card">
                                        <div class="card-title">Composição Corporal</div>
                                        <div class="row">
                                          <span class="row-label">Peso Corporal</span>
                                          <span class="row-val">${pa.weight} kg</span>
                                        </div>
                                        <div class="row">
                                          <span class="row-label">Altura Estatural</span>
                                          <span class="row-val">${pa.height} cm</span>
                                        </div>
                                        <div class="row">
                                          <span class="row-label">IMC Calculado</span>
                                          <span class="row-val">${pa.imc || "Não calculado"}</span>
                                        </div>
                                        <div class="row">
                                          <span class="row-label">Gordura Corporal (BF)</span>
                                          <span class="row-val" style="color: #65a30d;">${pa.body_fat_percentage}%</span>
                                        </div>
                                      </div>

                                      <div class="card">
                                        <div class="card-title">Anamnese de Saúde</div>
                                        <div class="row">
                                          <span class="row-label">Histórico Clínico</span>
                                          <span class="row-val">${pa.anamnesis || "Sem restrições relatadas"}</span>
                                        </div>
                                        <div class="row">
                                          <span class="row-label">Pressão Arterial</span>
                                          <span class="row-val">${pa.blood_pressure || "120x80 mmHg"}</span>
                                        </div>
                                        <div class="row">
                                          <span class="row-label">Frequência de Repouso</span>
                                          <span class="row-val">${pa.resting_heart_rate || "70 bpm"}</span>
                                        </div>
                                      </div>

                                      ${
                                        meas
                                          ? `
                                        <div class="card">
                                          <div class="card-title">Pregas Cutâneas (Dobras)</div>
                                          <div class="row">
                                            <span class="row-label">Peitoral</span>
                                            <span class="row-val">${meas.skinfold_chest || "-"} mm</span>
                                          </div>
                                          <div class="row">
                                            <span class="row-label">Abdominal</span>
                                            <span class="row-val">${meas.skinfold_abdominal || "-"} mm</span>
                                          </div>
                                          <div class="row">
                                            <span class="row-label">Tricipital</span>
                                            <span class="row-val">${meas.skinfold_triceps || "-"} mm</span>
                                          </div>
                                          <div class="row">
                                            <span class="row-label">Supra-ilíaca</span>
                                            <span class="row-val">${meas.skinfold_suprailiac || "-"} mm</span>
                                          </div>
                                        </div>

                                        <div class="card">
                                          <div class="card-title">Perímetros Corporais</div>
                                          <div class="row">
                                            <span class="row-label">Tórax</span>
                                            <span class="row-val">${meas.girth_chest || "-"} cm</span>
                                          </div>
                                          <div class="row">
                                            <span class="row-label">Cintura</span>
                                            <span class="row-val">${meas.girth_waist || "-"} cm</span>
                                          </div>
                                          <div class="row">
                                            <span class="row-label">Quadril</span>
                                            <span class="row-val">${meas.girth_hip || "-"} cm</span>
                                          </div>
                                          <div class="row">
                                            <span class="row-label">Braço E. / Braço D.</span>
                                            <span class="row-val">${meas.girth_arm_left || "-"} / ${meas.girth_arm_right || "-"} cm</span>
                                          </div>
                                        </div>
                                      `
                                          : ""
                                      }

                                      ${
                                        pa.recommendations
                                          ? `
                                        <div class="card full-span">
                                          <div class="card-title">Recomendações Clínicas Avançadas</div>
                                          <p class="clinical">${pa.recommendations}</p>
                                        </div>
                                      `
                                          : ""
                                      }

                                    </div>

                                    <div class="signatures">
                                      <div class="sig-box">
                                        <div class="sig-line"></div>
                                        <strong>${currentProfile?.name || "Avaliador Credenciado"}</strong><br />
                                        Personal Trainer Prescritor
                                      </div>
                                      <div class="sig-box">
                                        <div class="sig-line"></div>
                                        <strong>${studentProf?.name || "Aluno"}</strong><br />
                                        Assinatura do Aluno Avaliado
                                      </div>
                                    </div>

                                    <script>
                                      window.onload = function() {
                                        window.print();
                                      };
                                    </script>
                                  </body>
                                </html>
                              `);
                              printWindow.document.close();
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold text-xs border border-slate-200 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-indigo-650" />
                            Imprimir / PDF
                          </button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}

        {/* TAB 5: MENSALIDADES E EXTRATO FINANCEIRO */}
        {activeTab === "financial" && (
          <FeatureGate feature="financial">
            <div className="space-y-6 animate-fade-in text-slate-800">
              <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 border-none pb-0">
                    Controle de Mensalidades
                  </h2>
                  <p className="text-xs text-slate-500">
                    Acompanhe cobranças, histórico de pagamentos e caixas dos
                    seus alunos.
                  </p>
                </div>

                <button
                  onClick={() => {
                    const myStudents = students.filter(
                      (st) => st.trainer_id === (currentProfile?.id || "t1"),
                    );
                    if (myStudents.length > 0) {
                      setPayStudentId(myStudents[0].id);
                      setShowPaymentModal(true);
                    } else {
                      triggerToast("Cadastre um aluno primeiro!");
                    }
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition shadow flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-white" /> Gerar Mensalidade
                </button>
              </div>

              {/* LISTA FINANCEIRA */}
              <div className="space-y-3">
                {payments.filter(
                  (p) => p.trainer_id === (currentProfile?.id || "t1"),
                ).length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-10">
                    Nenhum lançamento de mensalidade registrado.
                  </p>
                ) : (
                  payments
                    .filter(
                      (p) => p.trainer_id === (currentProfile?.id || "t1"),
                    )
                    .map((p) => {
                      const studentProf = profiles.find(
                        (pr) => pr.id === p.student_id,
                      );

                      return (
                        <div
                          key={p.id}
                          className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between text-xs hover:border-slate-300 transition-all"
                        >
                          <div>
                            <div className="font-semibold text-slate-900">
                              {studentProf?.name}
                            </div>
                            <p className="text-[11px] text-slate-600 mt-0.5">
                              {p.description}
                            </p>
                            <span className="text-[10px] font-mono text-slate-400">
                              Vencimento:{" "}
                              {new Date(p.due_date).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="text-right flex items-center gap-4">
                            <div>
                              <div className="font-bold text-slate-900 font-mono">
                                R$ {p.amount.toFixed(2)}
                              </div>
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold block text-center mt-1 ${
                                  p.status === "paid"
                                    ? "bg-indigo-50 text-indigo-700"
                                    : "bg-rose-50 text-rose-700"
                                }`}
                              >
                                {p.status}
                              </span>
                            </div>

                            {p.status !== "paid" && (
                              <button
                                onClick={() => {
                                  markPaymentPaid(p.id);
                                  triggerToast("✅ Compensado pagamento!");
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg transition cursor-pointer"
                                title="Marcar como Pago"
                              >
                                <Check className="w-4.5 h-4.5 text-white" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </FeatureGate>
        )}

        {/* TAB 6: MEU PERFIL */}
        {activeTab === "settings" && (
          <div className="space-y-8 animate-fade-in text-slate-800">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 border-b border-slate-200 pb-4 font-sans">
                Meu Perfil
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-sans">
                Cadastre seus dados de faturamento, credenciais profissionais,
                visualize seu cadastro ou mude sua senha.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* COL 1: FOTO DO PERFIL */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shrink-0 shadow-sm flex flex-col items-center text-center space-y-4">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-widest font-mono">
                  Foto do Perfil
                </span>

                <div className="relative group w-24 h-24 rounded-full overflow-hidden border-2 border-indigo-100 shadow-inner">
                  <img
                    src={
                      profileAvatarUrl ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profileName || "A")}`
                    }
                    alt="Avatar"
                    className="w-full h-full object-cover select-none"
                    referrerPolicy="no-referrer"
                  />
                  <label className="absolute inset-0 bg-slate-950/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer text-[10px] font-extrabold text-white">
                    <span>Alterar Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          resizeAndSetAvatar(file, (base64) => {
                            setProfileAvatarUrl(base64);
                            triggerToast(
                              '📸 Pré-visualização da foto carregada! Toque em "Salvar Informações" para gravar permanently.',
                            );
                          });
                        }
                      }}
                    />
                  </label>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-9 tracking-tight font-sans">
                    {profileName || currentProfile?.name}
                  </h3>
                  <p className="text-[10px] font-mono text-indigo-600 uppercase mt-0.5 tracking-wider font-semibold">
                    {currentProfile?.role === "trainer"
                      ? "Personal Trainer"
                      : "Superadmin"}
                  </p>
                </div>

                <div className="w-full border-t border-slate-100 pt-3 text-[10px] text-slate-400 font-light flex flex-col space-y-1">
                  <span>E-mail: {currentProfile?.email}</span>
                  <span>
                    Nível de Acesso:{" "}
                    {currentProfile?.role === "admin" || isSuperAdmin
                      ? "Administração Total"
                      : "SaaS Coach"}
                  </span>
                </div>
              </div>

              {/* COL 2 & 3: FORMULÁRIO DE DADOS CADASTRAIS */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest font-mono border-b border-slate-100 pb-2.5">
                  Dados Cadastrais
                </h3>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!profileName.trim()) {
                      triggerToast(
                        "⚠️ Digite o seu nome comercial ou completo.",
                      );
                      return;
                    }

                    try {
                      const success = await updateProfile(currentProfile!.id, {
                        name: profileName,
                        phone: profilePhone,
                        whatsapp: profilePhone,
                        cpf: profileCpf,
                        address: profileAddress,
                        birthdate: profileBirthdate,
                        cref: profileCref,
                        avatar_url: profileAvatarUrl,
                      });

                      if (success !== false) {
                        triggerToast(
                          "💾 Dados cadastrais atualizados com sucesso!",
                        );
                      }
                    } catch (err) {
                      triggerToast("⚠️ Falha ao salvar alterações de perfil.");
                    }
                  }}
                  className="space-y-4 text-slate-800"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Nome Comercial ou Completo*
                      </label>
                      <input
                        type="text"
                        required
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="Ex: Roberto Personal"
                        className="w-full text-xs px-3.5 py-2.5 bg-slate-50/50 border border-slate-250 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">
                        E-mail (Login de Acesso - Bloqueado)
                      </label>
                      <input
                        type="text"
                        disabled
                        value={currentProfile?.email || ""}
                        className="w-full text-xs px-3.5 py-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed font-medium font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">
                        Telefone / WhatsApp
                      </label>
                      <input
                        type="text"
                        value={profilePhone}
                        onChange={(e) =>
                          setProfilePhone(formatPhone(e.target.value))
                        }
                        placeholder="Ex: (11) 99999-9999"
                        className="w-full text-xs px-3.5 py-2.5 bg-slate-50/50 border border-slate-250 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">
                        CPF
                      </label>
                      <input
                        type="text"
                        value={profileCpf}
                        onChange={(e) =>
                          setProfileCpf(formatCPF(e.target.value))
                        }
                        placeholder="Ex: 000.000.000-00"
                        className="w-full text-xs px-3.5 py-2.5 bg-slate-50/50 border border-slate-250 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">
                        Data de Nascimento
                      </label>
                      <input
                        type="date"
                        value={profileBirthdate}
                        onChange={(e) => setProfileBirthdate(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 bg-slate-50/50 border border-slate-250 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">
                        Endereço Completo
                      </label>
                      <input
                        type="text"
                        value={profileAddress}
                        onChange={(e) => setProfileAddress(e.target.value)}
                        placeholder="Ex: Rua João das Chagas, 410, Centro"
                        className="w-full text-xs px-3.5 py-2.5 bg-slate-50/50 border border-slate-250 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">
                        Registro de CREF
                      </label>
                      <input
                        type="text"
                        value={profileCref}
                        onChange={(e) => setProfileCref(e.target.value)}
                        placeholder="Ex: CREF 123456-G/SP"
                        className="w-full text-xs px-3.5 py-2.5 bg-slate-50/50 border border-slate-250 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-505 text-slate-900 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4 text-white" /> Salvar
                      Informações do Perfil
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* CARD INDEPENDENTE DE ALTERAR SENHA */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 mt-6 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-rose-600 uppercase tracking-widest font-mono border-b border-slate-100 pb-2.5">
                Mudar Senha de Acesso
              </h3>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (profileNewPassword.length < 5) {
                    triggerToast(
                      "⚠️ A nova senha deve ter no mínimo 5 caracteres.",
                    );
                    return;
                  }
                  if (profileNewPassword !== profileConfirmPassword) {
                    triggerToast("⚠️ As senhas digitadas não coincidem.");
                    return;
                  }

                  try {
                    await updatePassword(
                      currentProfile!.id,
                      profileNewPassword,
                    );
                    triggerToast(
                      "🛡️ Sua senha de acesso foi redefinida com sucesso!",
                    );
                    setProfileNewPassword("");
                    setProfileConfirmPassword("");
                  } catch (err: any) {
                    triggerToast("⚠️ Falha ao alterar senha.");
                  }
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Nova Senha*
                    </label>
                    <input
                      type="password"
                      required
                      value={profileNewPassword}
                      onChange={(e) => setProfileNewPassword(e.target.value)}
                      placeholder="Mínimo 5 dígitos"
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50/50 border border-slate-250 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Confirmar Nova Senha*
                    </label>
                    <input
                      type="password"
                      required
                      value={profileConfirmPassword}
                      onChange={(e) =>
                        setProfileConfirmPassword(e.target.value)
                      }
                      placeholder="Repita a nova senha"
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50/50 border border-slate-250 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-950 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Lock className="w-4 h-4 text-white" /> Atualizar Minha
                    Senha de Acesso
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === "upgrades" && <UpgradePlanPage />}

        {/* TAB: BIBLIOTECA DE EXERCÍCIOS */}
        {activeTab === "exercises" && (
          <div className="space-y-6 animate-fade-in text-slate-800">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-200 gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
                  Biblioteca de Exercícios
                </h2>
                <p className="text-xs text-slate-500 font-sans">
                  Cadastre e gerencie a lista global de movimentos ou procure
                  movimentos por grupos musculares.
                </p>
              </div>
            </div>

            {/* CARD: REGISTRAR NOVO EXERCÍCIO */}
            {!canManageExercises ? (
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-slate-600 text-xs flex items-center gap-3">
                <Lock className="w-5 h-5 text-indigo-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 block mb-0.5 font-sans">
                    Sugestão de Novo Exercício?
                  </span>
                  Somente o{" "}
                  <span className="font-semibold text-indigo-600">
                    Superadmin ou Admin
                  </span>{" "}
                  do sistema pode cadastrar novos exercícios na Biblioteca
                  Global. Entre em contato com o suporte para propor inclusões
                  de novas metodologias.
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5 font-sans">
                  <Plus className="w-4.5 h-4.5 text-indigo-600" /> Cadastrar
                  Novo Exercício (Acesso Admin / Superadmin)
                </h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newExerciseName.trim()) {
                      triggerToast("Por favor, defina o nome do exercício.");
                      return;
                    }
                    void createExercise({
                      name: newExerciseName,
                      category: newExerciseCategory,
                      description: newExerciseDescription,
                      video_url: newExerciseVideoUrl,
                      is_global: true,
                    });
                    triggerToast(
                      "🏋️ Exercício adicionado à biblioteca com sucesso!",
                    );
                    setNewExerciseName("");
                    setNewExerciseDescription("");
                    setNewExerciseVideoUrl("");
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Nome do Exercício*
                      </label>
                      <input
                        type="text"
                        required
                        value={newExerciseName}
                        onChange={(e) => setNewExerciseName(e.target.value)}
                        placeholder="Ex: Pulldown pegada supinada"
                        className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Grupo Muscular (Categoria)*
                      </label>
                      <select
                        value={newExerciseCategory}
                        onChange={(e) => setNewExerciseCategory(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 font-semibold"
                      >
                        <option value="Peito">Peito (Chest)</option>
                        <option value="Costas">Costas (Back)</option>
                        <option value="Pernas">Pernas (Legs)</option>
                        <option value="Ombros">Ombros (Shoulders)</option>
                        <option value="Biceps">Bíceps (Biceps)</option>
                        <option value="Triceps">Tríceps (Triceps)</option>
                        <option value="Abs">Abdômen (Abs)</option>
                        <option value="Cardio">
                          Cardio / Aeróbico (Cardio)
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Descrição / Orientação Técnica
                      </label>
                      <textarea
                        rows={2}
                        value={newExerciseDescription}
                        onChange={(e) =>
                          setNewExerciseDescription(e.target.value)
                        }
                        placeholder="Ex: Preservar curvatura lombar, puxar com força nos cotovelos..."
                        className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Link de Demonstração (URL de imagem ou vídeo)
                      </label>
                      <input
                        type="url"
                        value={newExerciseVideoUrl}
                        onChange={(e) => setNewExerciseVideoUrl(e.target.value)}
                        placeholder="Ex: https://images.unsplash.com/... ou link de vídeo"
                        className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition shadow cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4 text-white" /> Salvar Exercício
                      na Biblioteca
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* CARD: BUSCA E FILTRAGEM */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Pesquisar Exercícios
                  </h3>
                  <p className="text-[11px] text-slate-500 font-light mt-0.5">
                    Explore os exercícios cadastrados por palavra-chave ou grupo
                    muscular.
                  </p>
                </div>

                {/* SEARCH BAR */}
                <div className="max-w-xs w-full">
                  <input
                    type="text"
                    placeholder="Pesquisar por nome do movimento..."
                    value={exerciseSearchQuery}
                    onChange={(e) => setExerciseSearchQuery(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                  />
                </div>
              </div>

              {/* CATEGORIES BADGES */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Todos",
                  "Peito",
                  "Costas",
                  "Pernas",
                  "Ombros",
                  "Biceps",
                  "Triceps",
                  "Abs",
                  "Cardio",
                ].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition cursor-pointer ${
                      selectedCategoryFilter === cat
                        ? "bg-indigo-600 text-white shadow-sm font-semibold"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat === "Biceps"
                      ? "Bíceps (Biceps)"
                      : cat === "Triceps"
                        ? "Tríceps (Triceps)"
                        : cat === "Abs"
                          ? "Abdômen (Abs)"
                          : cat}
                  </button>
                ))}
              </div>

              {/* EXERCISE GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {exercises
                  .filter((ex) => {
                    const matchesCategory =
                      selectedCategoryFilter === "Todos" ||
                      ex.category === selectedCategoryFilter;
                    const matchesQuery =
                      ex.name
                        .toLowerCase()
                        .includes(exerciseSearchQuery.toLowerCase()) ||
                      (ex.description || "")
                        .toLowerCase()
                        .includes(exerciseSearchQuery.toLowerCase());
                    return matchesCategory && matchesQuery;
                  })
                  .map((ex) => {
                    if (editingExerciseId === ex.id) {
                      return (
                        <div
                          key={ex.id}
                          className="border border-indigo-500 bg-white p-4 rounded-xl flex flex-col justify-between transition shadow-md col-span-1 space-y-3 animate-fade-in text-slate-800"
                        >
                          <div className="space-y-2.5">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                                Nome do Exercício
                              </label>
                              <input
                                type="text"
                                value={editExerciseName}
                                onChange={(e) =>
                                  setEditExerciseName(e.target.value)
                                }
                                className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-250 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-505 text-slate-900"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                                Categoria
                              </label>
                              <select
                                value={editExerciseCategory}
                                onChange={(e) =>
                                  setEditExerciseCategory(e.target.value)
                                }
                                className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-250 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-505 text-slate-900 font-semibold"
                              >
                                <option value="Peito">Peito (Chest)</option>
                                <option value="Costas">Costas (Back)</option>
                                <option value="Pernas">Pernas (Legs)</option>
                                <option value="Ombros">
                                  Ombros (Shoulders)
                                </option>
                                <option value="Biceps">Bíceps (Biceps)</option>
                                <option value="Triceps">
                                  Tríceps (Triceps)
                                </option>
                                <option value="Abs">Abdômen (Abs)</option>
                                <option value="Cardio">
                                  Cardio / Aeróbico (Cardio)
                                </option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                                Descrição
                              </label>
                              <textarea
                                rows={2}
                                value={editExerciseDescription}
                                onChange={(e) =>
                                  setEditExerciseDescription(e.target.value)
                                }
                                className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-250 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-505 text-slate-900"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                                Demonstração URL
                              </label>
                              <input
                                type="text"
                                value={editExerciseVideoUrl}
                                onChange={(e) =>
                                  setEditExerciseVideoUrl(e.target.value)
                                }
                                className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-250 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-505 text-slate-900 font-mono"
                              />
                            </div>
                          </div>

                          <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => setEditingExerciseId(null)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await updateExercise(ex.id, {
                                  name: editExerciseName,
                                  category: editExerciseCategory,
                                  description: editExerciseDescription,
                                  video_url: editExerciseVideoUrl,
                                  is_global: true,
                                });
                                setEditingExerciseId(null);
                                triggerToast(
                                  "✏️ Exercício atualizado na Biblioteca!",
                                );
                              }}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                            >
                              Salvar
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={ex.id}
                        className="border border-slate-200 hover:border-indigo-200 bg-slate-50/50 p-4 rounded-xl flex flex-col justify-between transition group hover:shadow-xs"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              {ex.category === "Biceps"
                                ? "Bíceps"
                                : ex.category === "Triceps"
                                  ? "Tríceps"
                                  : ex.category === "Abs"
                                    ? "Abdômen"
                                    : ex.category}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono font-medium">
                              ID: {ex.id}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors font-sans">
                            {ex.name}
                          </h4>
                          <p className="text-[11px] text-slate-600 leading-relaxed font-light line-clamp-3">
                            {ex.description || "Sem descrição cadastrada."}
                          </p>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between gap-1.5">
                          {ex.video_url ? (
                            <a
                              href={ex.video_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-semibold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              📺 Ver vídeo
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-light">
                              Sem demonstração
                            </span>
                          )}

                          {canManageExercises && (
                            <div className="flex items-center gap-1.5 ml-auto">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingExerciseId(ex.id);
                                  setEditExerciseName(ex.name);
                                  setEditExerciseCategory(ex.category);
                                  setEditExerciseDescription(
                                    ex.description || "",
                                  );
                                  setEditExerciseVideoUrl(ex.video_url || "");
                                }}
                                className="text-[10px] text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded-md transition font-semibold cursor-pointer"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setExerciseToDelete({
                                    id: ex.id,
                                    name: ex.name,
                                  })
                                }
                                className="text-[10px] text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2 py-1 rounded-md transition font-semibold cursor-pointer"
                              >
                                Excluir
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                {exercises.filter((ex) => {
                  const matchesCategory =
                    selectedCategoryFilter === "Todos" ||
                    ex.category === selectedCategoryFilter;
                  const matchesQuery =
                    ex.name
                      .toLowerCase()
                      .includes(exerciseSearchQuery.toLowerCase()) ||
                    (ex.description || "")
                      .toLowerCase()
                      .includes(exerciseSearchQuery.toLowerCase());
                  return matchesCategory && matchesQuery;
                }).length === 0 && (
                  <div className="col-span-full text-center py-12 text-slate-400 text-xs">
                    Nenhum exercício encontrado com os filtros selecionados.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: SUPERADMIN (PERSONAIS) */}
        {activeTab === "superadmin" && (
          <div className="space-y-8 animate-fade-in font-sans">
            {/* HEADER CONTAINER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-5 gap-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900 font-sans">
                  Painel de Controle Superadmin
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Olá,{" "}
                  <strong className="text-indigo-600">
                    {currentProfile?.name}
                  </strong>
                  . Gestão centralizada de credenciamentos, personais,
                  faturamentos e alunos.
                </p>
              </div>
            </div>

            {/* BENTO STATS FOR SUPERADMIN */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden shadow-sm hover:border-slate-300 hover:scale-[1.01] transition-all duration-300">
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-indigo-50 blur-2xl"></div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 tracking-wide font-sans">
                    Personais Credenciados
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <UserCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 tracking-tight">
                    {
                      profiles.filter(
                        (p) =>
                          p.role === "trainer" &&
                          p.email !== "matheus.fillipe@hotmail.com" &&
                          p.status !== "inactive",
                      ).length
                    }
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    /{" "}
                    {
                      profiles.filter(
                        (p) =>
                          p.role === "trainer" &&
                          p.email !== "matheus.fillipe@hotmail.com",
                      ).length
                    }{" "}
                    cadastrados
                  </span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden shadow-sm hover:border-slate-300 hover:scale-[1.01] transition-all duration-300">
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-indigo-50 blur-2xl"></div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 tracking-wide font-sans">
                    Alunos Ativos
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 tracking-tight">
                    {students.length}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium font-sans">
                    alunos ativos na base
                  </span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden shadow-sm hover:border-slate-300 hover:scale-[1.01] transition-all duration-300">
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-indigo-50 blur-2xl"></div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 tracking-wide font-sans">
                    Volume Faturado Geral
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4 flex flex-col">
                  <span className="text-2xl font-black text-indigo-600 tracking-tight">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(
                      trainerPayments
                        .filter((p) => p.status === "paid")
                        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
                    )}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium mt-1">
                    faturado e pago nos planos do AxxosFit
                  </span>
                </div>
              </div>
            </div>

            {adminSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-250 text-emerald-700 text-xs rounded-xl font-semibold mb-4">
                ✓ {adminSuccess}
              </div>
            )}
            {adminError && (
              <div className="p-4 bg-rose-50 border border-rose-250 text-rose-700 text-xs rounded-xl font-semibold mb-4">
                ⚠️ {adminError}
              </div>
            )}

            {/* CONTROL HEADER: CREATE TRIGGER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200">
              <div className="text-left">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 font-sans">
                  Gestão de Professores
                </h3>
                <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                  Credencie novos personais, gerencie permissões e reajuste
                  planos ativos de faturamento.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAdminTrainerName("");
                  setAdminTrainerEmail("");
                  setAdminTrainerCref("");
                  setAdminTrainerWhatsapp("");
                  setAdminTrainerSpecialties("");
                  setAdminTrainerBio("");
                  setAdminTrainerPlan("Starter");
                  setShowAddTrainerModal(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-5 py-3 rounded-2xl shadow-sm text-xs cursor-pointer transition flex items-center gap-1.5 focus:outline-none"
              >
                <Plus className="w-4 h-4 text-white" /> Criar Novo Professor
              </button>
            </div>

            {/* REGISTERED TRAINERS LIST CONTAINER (SPACIOUS FULL WIDTH) */}
            <div className="space-y-4 text-left">
              {/* LIST: REGISTERED TRAINERS */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 font-sans animate-fade-in">
                  Personais Credenciados (
                  {
                    profiles.filter(
                      (p) =>
                        p.role === "trainer" &&
                        p.email !== "matheus.fillipe@hotmail.com",
                    ).length
                  }
                  )
                </h3>

                <div className="space-y-4">
                  {profiles.filter(
                    (p) =>
                      p.role === "trainer" &&
                      p.email !== "matheus.fillipe@hotmail.com",
                  ).length === 0 ? (
                    <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center text-slate-550 text-xs">
                      Nenhum personal trainer credenciado na plataforma.
                      Cadastre um ao lado.
                    </div>
                  ) : (
                    profiles
                      .filter(
                        (p) =>
                          p.role === "trainer" &&
                          p.email !== "matheus.fillipe@hotmail.com",
                      )
                      .map((trainerProf) => {
                        const details = trainers.find(
                          (t) => t.id === trainerProf.id,
                        );

                        // Real-time calculated statistics per trainer
                        const trainerStudents = students.filter(
                          (s) => s.trainer_id === trainerProf.id,
                        );
                        const trainerStudentsIds = trainerStudents.map(
                          (s) => s.id,
                        );
                        const trainerAccumulated = payments
                          .filter(
                            (pay) =>
                              pay.status === "paid" &&
                              trainerStudentsIds.includes(pay.student_id),
                          )
                          .reduce(
                            (sum, pay) => sum + (Number(pay.amount) || 0),
                            0,
                          );

                        const isInactive = trainerProf.status === "inactive";

                        return (
                          <div
                            key={trainerProf.id}
                            className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 hover:border-indigo-305 hover:scale-[1.005] hover:shadow-md transition duration-200"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3">
                                <div className="relative">
                                  <img
                                    src={
                                      trainerProf.avatar_url ||
                                      "https://api.dicebear.com/7.x/initials/svg?seed=" +
                                        encodeURIComponent(trainerProf.name)
                                    }
                                    alt="Avatar"
                                    className="w-12 h-12 rounded-xl object-cover border border-slate-100"
                                  />
                                  <span
                                    className={`absolute -bottom-1 -right-1 flex h-3.5 w-3.5 rounded-full border-2 border-white ${isInactive ? "bg-rose-500" : "bg-emerald-500"}`}
                                  >
                                    <span
                                      className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${isInactive ? "bg-rose-450 animate-pulse" : "bg-emerald-400 animate-ping"}`}
                                    ></span>
                                  </span>
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4
                                      className={`font-black text-sm tracking-tight ${isInactive ? "text-slate-400 line-through" : "text-slate-900"}`}
                                    >
                                      {trainerProf.name}
                                    </h4>
                                    <span
                                      className={`text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                                        isInactive
                                          ? "bg-rose-50 border-rose-100 text-rose-600"
                                          : "bg-emerald-50 border-emerald-100 text-emerald-700"
                                      }`}
                                    >
                                      {isInactive ? "Inativo" : "Ativo"}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                    {trainerProf.email}
                                  </p>

                                  {/* Specialties Badges */}
                                  {details?.specialties &&
                                    details.specialties.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {details.specialties.map(
                                          (spec, idx) => (
                                            <span
                                              key={idx}
                                              className="text-[10px] font-medium text-slate-600 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md"
                                            >
                                              {spec}
                                            </span>
                                          ),
                                        )}
                                      </div>
                                    )}

                                  {/* WhatsApp Direct Action */}
                                  {details?.whatsapp && (
                                    <a
                                      href={`https://wa.me/${details.whatsapp.replace(/\D/g, "")}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1.5 text-[11px] text-indigo-600 hover:text-indigo-700 hover:underline mt-2 font-semibold transition cursor-pointer"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5 text-indigo-650" />
                                      Conversar no WhatsApp
                                    </a>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  title="Editar cadastro completo"
                                  onClick={() => {
                                    setEditingTrainerId(trainerProf.id);
                                    setEditTrainerName(trainerProf.name);
                                    setEditTrainerEmail(trainerProf.email);
                                    setEditTrainerCref(details?.cref || "");
                                    setEditTrainerWhatsapp(
                                      details?.whatsapp || "",
                                    );
                                    setEditTrainerSpecialties(
                                      details?.specialties
                                        ? details.specialties.join(", ")
                                        : "",
                                    );
                                    setEditTrainerBio(details?.bio || "");
                                    setEditTrainerPlan(
                                      details?.plan || "Starter",
                                    );
                                  }}
                                  className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg transition cursor-pointer"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  title={
                                    isInactive
                                      ? "Ativar Personal Trainer"
                                      : "Desativar Personal Trainer"
                                  }
                                  onClick={() => {
                                    if (isInactive) {
                                      activateTrainerByAdmin(trainerProf.id);
                                      triggerToast(
                                        `✓ O acesso de "${trainerProf.name}" foi reativado com sucesso.`,
                                      );
                                    } else {
                                      setTrainerToDeactivate({
                                        id: trainerProf.id,
                                        name: trainerProf.name,
                                      });
                                    }
                                  }}
                                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                                    isInactive
                                      ? "bg-emerald-50 border-emerald-150 text-emerald-700 hover:bg-emerald-600 hover:text-white"
                                      : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                                  }`}
                                >
                                  {isInactive ? "Ativar" : "Desativar"}
                                </button>

                                <button
                                  type="button"
                                  title="Remover Personal Permanentemente"
                                  onClick={() => {
                                    setTrainerToDelete({
                                      id: trainerProf.id,
                                      name: trainerProf.name,
                                    });
                                  }}
                                  className="p-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* CORE DETAILS AND ACCUMULATED VALUES */}
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                              <div className="flex flex-col justify-center">
                                <span className="text-[9px] font-semibold text-slate-400 uppercase">
                                  CREF
                                </span>
                                <span
                                  className="text-xs text-slate-700 font-bold mt-1 truncate"
                                  title={details?.cref}
                                >
                                  {details?.cref || "Sem registro"}
                                </span>
                              </div>
                              <div className="flex flex-col justify-center border-l sm:border-x border-slate-200">
                                <span className="text-[9px] font-semibold text-slate-400 uppercase mb-1">
                                  Plano Ativo
                                </span>
                                <span
                                  className={`mx-auto text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                    details?.plan === "Studio"
                                      ? "bg-amber-50 text-amber-600 border border-amber-250/30"
                                      : details?.plan === "Pro"
                                        ? "bg-purple-50 text-purple-650 border border-purple-250/30"
                                        : "bg-blue-50 text-blue-600 border border-blue-250/30"
                                  }`}
                                >
                                  {details?.plan || "Starter"}
                                </span>
                              </div>
                              <div className="flex flex-col justify-center border-l border-slate-200">
                                <span className="text-[9px] font-semibold text-slate-400 uppercase">
                                  Alunos Ativos
                                </span>
                                <span className="text-sm font-black text-slate-800 mt-1">
                                  {trainerStudents.length}
                                </span>
                              </div>
                              <div className="flex flex-col justify-center border-l border-slate-200">
                                <span className="text-[9px] font-semibold text-slate-400 uppercase">
                                  Faturamento Alunos
                                </span>
                                <span className="text-xs font-bold text-emerald-600 mt-1 font-extrabold truncate">
                                  {new Intl.NumberFormat("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  }).format(trainerAccumulated)}
                                </span>
                              </div>
                            </div>

                            {details?.bio && (
                              <p className="text-xs text-slate-500 leading-relaxed italic border-t border-slate-105 pt-3">
                                "{details.bio}"
                              </p>
                            )}
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>

            {/* GESTÃO FINANCEIRA DE LICENÇAS E ASSINATURAS DOS PERSONAIS */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl mt-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight font-sans flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-indigo-600" />{" "}
                    Financeiro dos Personais (Licenças de Uso)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Lançamento de cobranças e controle de mensalidade de acesso
                    dos personais (Starter R$99,90, Pro R$149,90, Studio R$189,90).
                  </p>
                </div>

                <div className="flex gap-4">
                  <div className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 text-right">
                    <span className="text-[9px] font-semibold text-slate-400 uppercase block">
                      Total Recebido
                    </span>
                    <span className="text-sm font-black text-emerald-650 font-sans">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(
                        trainerPayments
                          .filter((p) => p.status === "paid")
                          .reduce((sum, p) => sum + p.amount, 0),
                      )}
                    </span>
                  </div>
                  <div className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 text-right">
                    <span className="text-[9px] font-semibold text-slate-400 uppercase block">
                      Pendência Ativa
                    </span>
                    <span className="text-sm font-bold text-amber-600 font-sans">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(
                        trainerPayments
                          .filter((p) => p.status === "pending")
                          .reduce((sum, p) => sum + p.amount, 0),
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Formulário de Lançamento Avulso */}
                <div className="lg:col-span-2 bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-4 h-fit">
                  <h4 className="text-xs font-black uppercase text-slate-650 font-sans tracking-wide flex items-center gap-2">
                    <Plus className="w-4 h-4 text-indigo-600" /> Lançar Nova
                    Cobrança
                  </h4>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const trainerId = (
                        form.elements.namedItem(
                          "trainerId",
                        ) as HTMLSelectElement
                      ).value;
                      const planValue = (
                        form.elements.namedItem(
                          "planValue",
                        ) as HTMLSelectElement
                      ).value as "Starter" | "Pro" | "Studio";
                      const amount = Number(
                        (form.elements.namedItem("amount") as HTMLInputElement)
                          .value,
                      );
                      const dueDate = (
                        form.elements.namedItem("dueDate") as HTMLInputElement
                      ).value;

                      if (!trainerId || !dueDate || !amount) {
                        triggerToast(
                          "⚠️ Por favor preencha todos os campos da cobrança.",
                        );
                        return;
                      }

                      createTrainerPayment({
                        trainer_id: trainerId,
                        plan: planValue,
                        amount,
                        due_date: dueDate,
                        status: "pending",
                      });

                      triggerToast(
                        "✓ Nova fatura de assinatura lançada com sucesso.",
                      );
                      form.reset();
                    }}
                    className="space-y-4 text-xs font-semibold"
                  >
                    <div>
                      <label className="block text-slate-500 uppercase mb-1.5">
                        Personal Trainer
                      </label>
                      <select
                        name="trainerId"
                        required
                        className="w-full px-3 py-2.5 bg-white border border-slate-205 rounded-lg text-slate-800 font-sans text-xs focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">-- Selecione o Personal --</option>
                        {profiles
                          .filter(
                            (p) =>
                              p.role === "trainer" &&
                              p.email !== "matheus.fillipe@hotmail.com",
                          )
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-500 uppercase mb-1.5">
                          Plano
                        </label>
                        <select
                          name="planValue"
                          required
                          className="w-full px-3 py-2.5 bg-white border border-slate-205 rounded-lg text-slate-800 font-sans text-xs focus:outline-none focus:border-indigo-500"
                          onChange={(e) => {
                            const prices = {
                              Starter: 99.9,
                              Pro: 149.9,
                              Studio: 189.9,
                            };
                            const priceInput =
                              e.currentTarget.form?.elements.namedItem(
                                "amount",
                              ) as HTMLInputElement;
                            if (priceInput) {
                              priceInput.value = String(
                                prices[
                                  e.currentTarget.value as keyof typeof prices
                                ] || 99,
                              );
                            }
                          }}
                        >
                          <option value="Starter">Starter</option>
                          <option value="Pro">Pro</option>
                          <option value="Studio">Studio</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-500 uppercase mb-1.5">
                          Valor (R$)
                        </label>
                        <input
                          type="number"
                          name="amount"
                          defaultValue={99}
                          required
                          className="w-full px-3 py-2.5 bg-white border border-slate-205 rounded-lg text-slate-800 font-sans text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-500 uppercase mb-1.5">
                        Data de Vencimento
                      </label>
                      <input
                        type="date"
                        name="dueDate"
                        required
                        defaultValue={new Date().toISOString().split("T")[0]}
                        className="w-full px-3 py-2.5 bg-white border border-slate-205 rounded-lg text-slate-800 font-sans text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold tracking-wider text-xs py-3 rounded-lg transition cursor-pointer"
                    >
                      Lançar Cobrança de Licença
                    </button>
                  </form>
                </div>

                {/* Faturas Recentes dos Personais */}
                <div className="lg:col-span-3 bg-slate-50 p-5 rounded-xl border border-slate-100 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-600 font-sans tracking-wide mb-4 flex items-center justify-between border-b border-slate-150 pb-3">
                      <span>Faturas de Licença Geradas</span>
                      <span className="text-[10px] text-slate-400 font-semibold lowercase font-sans">
                        ({trainerPayments.length} faturas)
                      </span>
                    </h4>

                    <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1">
                      {trainerPayments.length === 0 ? (
                        <div className="text-center text-xs text-slate-400 py-12 font-sans">
                          Nenhuma fatura de personal no momento.
                        </div>
                      ) : (
                        [...trainerPayments].reverse().map((payment) => {
                          const personalProf = profiles.find(
                            (p) => p.id === payment.trainer_id,
                          );
                          const isPaid = payment.status === "paid";
                          return (
                            <div
                              key={payment.id}
                              className="bg-white border border-slate-200 p-3 rounded-lg flex items-center justify-between gap-3 hover:border-slate-300 transition"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-extrabold text-slate-800 truncate max-w-[150px]">
                                    {personalProf?.name || "Inativo/Removido"}
                                  </span>
                                  <span
                                    className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md ${
                                      payment.plan === "Studio"
                                        ? "bg-amber-50 text-amber-600 border border-amber-100"
                                        : payment.plan === "Pro"
                                          ? "bg-purple-50 text-purple-600 border border-purple-100"
                                          : "bg-blue-50 text-blue-650 border border-blue-100"
                                    }`}
                                  >
                                    {payment.plan}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-450">
                                  <span>Venc: {payment.due_date}</span>
                                  {payment.payment_date && (
                                    <span className="text-emerald-600 font-semibold">
                                      ✓ Pago: {payment.payment_date}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-800 mr-1">
                                  {new Intl.NumberFormat("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  }).format(payment.amount)}
                                </span>

                                {isPaid ? (
                                  <span className="bg-emerald-50 border border-emerald-100 text-[#047857] text-[9.5px] font-black uppercase px-2 py-1 rounded-md">
                                    Pago
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => {
                                      markTrainerPaymentPaid(payment.id);
                                      triggerToast(
                                        `✓ Mensalidade de ${personalProf?.name || "Personal"} marcada como paga.`,
                                      );
                                    }}
                                    className="bg-amber-50 hover:bg-emerald-600 hover:text-white border border-amber-200 text-amber-700 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md transition cursor-pointer"
                                    title="Receber este pagamento"
                                  >
                                    Pendente
                                  </button>
                                )}

                                <button
                                  onClick={() => {
                                    deleteTrainerPayment(payment.id);
                                    triggerToast("✓ Fatura removida.");
                                  }}
                                  className="p-1 rounded bg-slate-100 border border-slate-250 text-slate-400 hover:text-rose-600 hover:border-rose-100 transition cursor-pointer"
                                  title="Remover fatura"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* MODAL / POPUP: EDIT PERSONAL TRAINER */}
            {editingTrainerId && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl p-6 sm:p-8 relative text-slate-800 shadow-2xl">
                  <button
                    onClick={() => setEditingTrainerId(null)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <h3 className="text-lg font-black text-slate-900 mb-2">
                    Editar Cadastro de Personal Trainer
                  </h3>
                  <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                    Você está alterando as informações cadastrais centrais do
                    profissional na base global.
                  </p>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (
                        !editTrainerName ||
                        !editTrainerEmail ||
                        !editTrainerCref
                      ) {
                        alert("Nome, e-mail e CREF são obrigatórios.");
                        return;
                      }

                      editTrainerByAdmin(
                        editingTrainerId,
                        editTrainerName,
                        editTrainerEmail,
                        editTrainerCref,
                        editTrainerSpecialties.split(",").map((s) => s.trim()),
                        editTrainerBio,
                        editTrainerWhatsapp,
                        editTrainerPlan,
                      );

                      setEditingTrainerId(null);
                      triggerToast(
                        "✓ Cadastro do personal trainer atualizado.",
                      );
                    }}
                    className="space-y-4 text-xs font-semibold text-slate-600"
                  >
                    <div>
                      <label className="block text-slate-500 uppercase mb-2">
                        Nome Completo
                      </label>
                      <input
                        type="text"
                        value={editTrainerName}
                        onChange={(e) => setEditTrainerName(e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-505 focus:border-indigo-500 text-slate-900 font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 uppercase mb-2">
                        E-mail de Acesso
                      </label>
                      <input
                        type="email"
                        value={editTrainerEmail}
                        onChange={(e) => setEditTrainerEmail(e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-505 focus:border-indigo-500 text-slate-900 font-medium"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-500 uppercase mb-2">
                          CREF
                        </label>
                        <input
                          type="text"
                          value={editTrainerCref}
                          onChange={(e) => setEditTrainerCref(e.target.value)}
                          className="w-full px-4 py-2 bg-white border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-505 focus:border-indigo-500 text-slate-900 font-medium"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 uppercase mb-2">
                          WhatsApp de Contato
                        </label>
                        <input
                          type="text"
                          value={editTrainerWhatsapp}
                          onChange={(e) =>
                            setEditTrainerWhatsapp(e.target.value)
                          }
                          className="w-full px-4 py-2 bg-white border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-505 focus:border-indigo-500 text-slate-900 font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-500 uppercase mb-2">
                        Especialidades (separadas por vírgula)
                      </label>
                      <input
                        type="text"
                        value={editTrainerSpecialties}
                        onChange={(e) =>
                          setEditTrainerSpecialties(e.target.value)
                        }
                        className="w-full px-4 py-2 bg-white border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-505 focus:border-indigo-500 text-slate-900 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 uppercase mb-2">
                        Breve Bio Profissional
                      </label>
                      <textarea
                        value={editTrainerBio}
                        onChange={(e) => setEditTrainerBio(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 bg-white border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-505 focus:border-indigo-500 text-slate-900 font-medium"
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-slate-500 uppercase mb-2 font-sans font-semibold text-xs">
                        Plano Escolhido
                      </label>
                      <select
                        value={editTrainerPlan}
                        onChange={(e) =>
                          setEditTrainerPlan(
                            e.target.value as "Starter" | "Pro" | "Studio",
                          )
                        }
                        className="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-slate-900 font-semibold animate-fade-in"
                      >
                        <option value="Starter">
                          🏆 Starter — R$ 99,90/mês
                        </option>
                        <option value="Pro">
                          ⚡ Pro — R$ 149,90/mês
                        </option>
                        <option value="Studio">
                          👑 Studio — R$ 189,90/mês
                        </option>
                      </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 font-sans">
                      <button
                        type="button"
                        onClick={() => setEditingTrainerId(null)}
                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-250 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold transition cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition cursor-pointer"
                      >
                        Salvar Alterações
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* MODAL: CUSTOM CONFIRMATION FOR DEACTIVATING TRAINER */}
            {trainerToDeactivate && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
                <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 relative shadow-2xl">
                  <button
                    onClick={() => setTrainerToDeactivate(null)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
                      <AlertCircle className="w-6 h-6" />
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-base font-extrabold text-slate-900">
                        Desativar Acesso do Personal?
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed text-center">
                        Deseja suspender temporariamente o acesso de{" "}
                        <strong className="text-slate-900">
                          {trainerToDeactivate.name}
                        </strong>
                        ? O perfil ficará marcado como{" "}
                        <span className="text-rose-600 font-bold">Inativo</span>{" "}
                        e o profissional não conseguirá acessar a plataforma.
                      </p>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setTrainerToDeactivate(null)}
                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold transition cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          deactivateTrainerByAdmin(trainerToDeactivate.id);
                          triggerToast(
                            `✓ O acesso de "${trainerToDeactivate.name}" foi desativado.`,
                          );
                          setTrainerToDeactivate(null);
                        }}
                        className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Sim, Desativar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL: CUSTOM CONFIRMATION FOR DELETING TRAINER */}
            {trainerToDelete && (
              <div className="fixed inset-0 bg-neutral-950/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
                <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-6 relative shadow-2xl">
                  <button
                    onClick={() => setTrainerToDelete(null)}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto mb-2">
                      <Trash2 className="w-6 h-6" />
                    </div>

                    <div className="space-y-2 text-center">
                      <h3 className="text-base font-extrabold text-white">
                        Exclusão Permanente Crítica
                      </h3>
                      <p className="text-xs text-zinc-450 leading-relaxed">
                        Deseja{" "}
                        <strong className="text-rose-400">
                          apagar definitivamente
                        </strong>{" "}
                        o personal{" "}
                        <strong className="text-white">
                          {trainerToDelete.name}
                        </strong>
                        ?
                      </p>
                      <div className="text-[11px] text-rose-400 bg-rose-500/5 border border-rose-500/10 p-3.5 rounded-xl leading-relaxed text-left mt-3">
                        ⚠️{" "}
                        <strong>
                          Esta ação vai excluir de forma irreversível:
                        </strong>
                        <ul className="list-disc pl-4 mt-1.5 space-y-1 text-zinc-400">
                          <li>O perfil central de login do personal</li>
                          <li>Todos os alunos vinculados a ele</li>
                          <li>Todas as fichas e treinos montados</li>
                          <li>O histórico completo de mensalidades</li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-zinc-850">
                      <button
                        type="button"
                        onClick={() => setTrainerToDelete(null)}
                        className="flex-1 py-2.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs text-white transition font-medium cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          deleteTrainerByAdmin(trainerToDelete.id);
                          triggerToast(
                            `✓ O personal "${trainerToDelete.name}" e todas as suas contas associadas foram removidos.`,
                          );
                          setTrainerToDelete(null);
                        }}
                        className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition cursor-pointer"
                      >
                        Sim, Excluir Tudo
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </DashboardLayout>

      {/* ==================================== MODAL: ADD STUDENT ==================================== */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl p-6 sm:p-8 relative shadow-2xl text-slate-800">
            <button
              onClick={() => setShowAddStudentModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-2 font-sans">
              Cadastrar Novo Aluno de Consultoria
            </h3>
            <p className="text-xs text-slate-500 mb-6 font-light font-sans text-left">
              Este cadastro criará instantaneamente um perfil de aluno
              correspondente na base do Supabase.
            </p>

            <form
              onSubmit={handleCreateStudent}
              className="space-y-4 text-xs font-semibold text-slate-600"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div>
                  <label className="block text-slate-500 uppercase mb-2 text-[10px]">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="Ex: Clara Ribeiro"
                    className="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-505 text-slate-900 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 uppercase mb-2 text-[10px]">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={newStudentEmail}
                    onChange={(e) => setNewStudentEmail(e.target.value)}
                    placeholder="clara.ribeiro@gmail.com"
                    className="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-505 text-slate-900 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="text-left">
                <label className="block text-slate-500 uppercase mb-2 text-[10px]">
                  Objetivo Esportivo Principal
                </label>
                <input
                  type="text"
                  value={newStudentObjective}
                  onChange={(e) => setNewStudentObjective(e.target.value)}
                  placeholder="Ex: Hipertrofia bíceps e queima gordura localizada"
                  className="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-505 text-slate-900 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left font-sans">
                <div>
                  <label className="block text-slate-500 uppercase mb-2 text-[10px]">
                    WhatsApp / Telefone
                  </label>
                  <input
                    type="text"
                    value={newStudentPhone}
                    onChange={(e) =>
                      setNewStudentPhone(formatPhone(e.target.value))
                    }
                    placeholder="Ex: (82) 99999-9999"
                    className="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-505 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 uppercase mb-2 text-[10px]">
                    CPF
                  </label>
                  <input
                    type="text"
                    value={newStudentCpf}
                    onChange={(e) =>
                      setNewStudentCpf(formatCPF(e.target.value))
                    }
                    placeholder="Ex: 000.000.000-00"
                    className="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-505 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 uppercase mb-2 text-[10px]">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={newStudentBirthdate}
                    onChange={(e) => setNewStudentBirthdate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-505 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-left font-sans">
                <div>
                  <label className="block text-slate-500 uppercase mb-2 text-[10px]">
                    Sexo
                  </label>
                  <select
                    value={newStudentGender}
                    onChange={(e) =>
                      setNewStudentGender(e.target.value as "M" | "F")
                    }
                    className="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-505 text-slate-900 font-medium"
                  >
                    <option value="M">Masculino (M)</option>
                    <option value="F">Feminino (F)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 uppercase mb-2 text-[10px]">
                    Mensalidade (R$)
                  </label>
                  <input
                    type="number"
                    value={newStudentMonthlyFee}
                    onChange={(e) => setNewStudentMonthlyFee(e.target.value)}
                    placeholder="Ex: 150"
                    className="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-505 text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 uppercase mb-2 text-[10px]">
                    Dia de Vencimento
                  </label>
                  <select
                    value={newStudentDueDay}
                    onChange={(e) => setNewStudentDueDay(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-505 text-slate-900 font-medium"
                  >
                    {[1, 5, 10, 15, 20, 25, 28, 30].map((d) => (
                      <option key={d} value={d}>
                        Dia {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-left font-sans">
                <label className="block text-slate-500 uppercase mb-2 text-[10px]">
                  Endereço Completo
                </label>
                <input
                  type="text"
                  value={newStudentAddress}
                  onChange={(e) => setNewStudentAddress(e.target.value)}
                  placeholder="Ex: Av. Governador Afrânio Lages, Maceió"
                  className="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-505 text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-left">
                <div>
                  <label className="block text-slate-500 uppercase mb-2 text-[10px]">
                    Altura (cm)
                  </label>
                  <input
                    type="number"
                    value={newStudentHeight}
                    onChange={(e) => setNewStudentHeight(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-250 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-505 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 uppercase mb-2 text-[10px]">
                    Peso (kg)
                  </label>
                  <input
                    type="number"
                    value={newStudentWeight}
                    onChange={(e) => setNewStudentWeight(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-250 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-505 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 uppercase mb-2 text-[10px]">
                    BF estimado %
                  </label>
                  <input
                    type="number"
                    value={newStudentBf}
                    onChange={(e) => setNewStudentBf(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-250 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-505 focus:outline-none"
                  />
                </div>
              </div>

              <div className="text-left">
                <label className="block text-rose-600 font-bold mb-2 flex items-center gap-1 text-[10px]">
                  <AlertCircle className="w-4 h-4 text-rose-500" /> Lesões,
                  Restrições ou Desvios Posturais
                </label>
                <input
                  type="text"
                  value={newStudentRestrictions}
                  onChange={(e) => setNewStudentRestrictions(e.target.value)}
                  placeholder="Ex: Tendinite rotuliana leve bilateral"
                  className="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-505 text-slate-900 font-medium"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="bg-slate-100 hover:bg-slate-250 text-slate-700 font-bold px-5 py-2.5 rounded-xl block text-center cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-5 py-2.5 rounded-xl block text-center shadow cursor-pointer transition"
                >
                  Confirmar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================== MODAL: EDIT STUDENT ==================================== */}
      {editingStudentId !== null && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl p-6 sm:p-8 relative shadow-2xl text-slate-800">
            <button
              onClick={() => setEditingStudentId(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-2 font-sans">
              Editar Cadastro de Aluno
            </h3>
            <p className="text-xs text-slate-500 mb-6 font-light font-sans text-left">
              Atualize as informações cadastrais, status e métricas físicas
              deste aluno.
            </p>

            <form
              onSubmit={handleSaveEditStudent}
              className="space-y-4 text-xs font-semibold text-slate-600"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div>
                  <label className="block text-slate-500 uppercase mb-2 text-[10px]">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={editStudentName}
                    onChange={(e) => setEditStudentName(e.target.value)}
                    placeholder="Ex: Clara Ribeiro"
                    className="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-505 text-slate-900 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 uppercase mb-2 text-[10px]">
                    E-mail (Não editável)
                  </label>
                  <input
                    type="email"
                    value={editStudentEmail}
                    className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed focus:outline-none"
                    disabled
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div>
                  <label className="block text-slate-500 uppercase mb-2 text-[10px]">
                    Objetivo Esportivo Principal
                  </label>
                  <input
                    type="text"
                    value={editStudentObjective}
                    onChange={(e) => setEditStudentObjective(e.target.value)}
                    placeholder="Ex: Hipertrofia bíceps e queima gordura localizada"
                    className="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-505 text-slate-900 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 uppercase mb-2 text-[10px]">
                    Status do Aluno
                  </label>
                  <select
                    value={editStudentStatus}
                    onChange={(e) =>
                      setEditStudentStatus(
                        e.target.value as "active" | "inactive",
                      )
                    }
                    className="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-505 text-slate-900 font-medium"
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left font-sans">
                <div>
                  <label className="block text-slate-500 uppercase mb-2 text-[10px]">
                    WhatsApp / Telefone
                  </label>
                  <input
                    type="text"
                    value={editStudentPhone}
                    onChange={(e) =>
                      setEditStudentPhone(formatPhone(e.target.value))
                    }
                    placeholder="Ex: (82) 99999-9999"
                    className="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-505 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 uppercase mb-2 text-[10px]">
                    CPF
                  </label>
                  <input
                    type="text"
                    value={editStudentCpf}
                    onChange={(e) =>
                      setEditStudentCpf(formatCPF(e.target.value))
                    }
                    placeholder="Ex: 000.000.000-00"
                    className="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-505 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 uppercase mb-2 text-[10px]">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={editStudentBirthdate}
                    onChange={(e) => setEditStudentBirthdate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-505 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-left font-sans">
                <div>
                  <label className="block text-slate-500 uppercase mb-2 text-[10px]">
                    Sexo
                  </label>
                  <select
                    value={editStudentGender}
                    onChange={(e) =>
                      setEditStudentGender(e.target.value as "M" | "F")
                    }
                    className="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-505 text-slate-900 font-medium"
                  >
                    <option value="M">Masculino (M)</option>
                    <option value="F">Feminino (F)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 uppercase mb-2 text-[10px]">
                    Mensalidade (R$)
                  </label>
                  <input
                    type="number"
                    value={editStudentMonthlyFee}
                    onChange={(e) => setEditStudentMonthlyFee(e.target.value)}
                    placeholder="Ex: 150"
                    className="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-505 text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 uppercase mb-2 text-[10px]">
                    Dia de Vencimento
                  </label>
                  <select
                    value={editStudentDueDay}
                    onChange={(e) => setEditStudentDueDay(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-505 text-slate-900 font-medium"
                  >
                    {[1, 5, 10, 15, 20, 25, 28, 30].map((d) => (
                      <option key={d} value={d}>
                        Dia {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-left font-sans">
                <label className="block text-slate-500 uppercase mb-2 text-[10px]">
                  Endereço Completo
                </label>
                <input
                  type="text"
                  value={editStudentAddress}
                  onChange={(e) => setEditStudentAddress(e.target.value)}
                  placeholder="Ex: Av. Governador Afrânio Lages, Maceió"
                  className="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-505 text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-left">
                <div>
                  <label className="block text-slate-500 uppercase mb-2 text-[10px]">
                    Altura (cm)
                  </label>
                  <input
                    type="number"
                    value={editStudentHeight}
                    onChange={(e) => setEditStudentHeight(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-250 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-505 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 uppercase mb-2 text-[10px]">
                    Peso (kg)
                  </label>
                  <input
                    type="number"
                    value={editStudentWeight}
                    onChange={(e) => setEditStudentWeight(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-250 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-505 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 uppercase mb-2 text-[10px]">
                    BF estimado %
                  </label>
                  <input
                    type="number"
                    value={editStudentBf}
                    onChange={(e) => setEditStudentBf(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-250 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-505 focus:outline-none"
                  />
                </div>
              </div>

              <div className="text-left">
                <label className="block text-rose-600 font-bold mb-2 flex items-center gap-1 text-[10px]">
                  <AlertCircle className="w-4 h-4 text-rose-500" /> Lesões,
                  Restrições ou Desvios Posturais
                </label>
                <input
                  type="text"
                  value={editStudentRestrictions}
                  onChange={(e) => setEditStudentRestrictions(e.target.value)}
                  placeholder="Ex: Tendinite rotuliana leve bilateral"
                  className="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-505 text-slate-900 font-medium"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingStudentId(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl block text-center cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-5 py-2.5 rounded-xl block text-center shadow cursor-pointer transition"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================== MODAL: DELETE STUDENT CONFIRMATION ==================================== */}
      {studentToDelete !== null && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-250 w-full max-w-md rounded-2xl p-6 relative shadow-2xl text-slate-800 text-left">
            <button
              onClick={() => setStudentToDelete(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-rose-600" />
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-2">
              Excluir Aluno de Consultoria?
            </h3>
            <p className="text-xs text-slate-500 mb-6 font-light leading-normal">
              Você tem certeza que deseja excluir permanentemente o cadastro de{" "}
              <strong className="text-slate-900 font-bold">
                {studentToDelete.name}
              </strong>
              ?<br />
              Essa ação excluirá também todos os treinos vinculados, avaliações
              físicas e históricos de logs deste aluno. Esta ação é
              irreversível.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setStudentToDelete(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  deleteStudent(studentToDelete.id);
                  setStudentToDelete(null);
                  triggerToast(
                    "🗑️ Aluno e dados associados excluídos definitivamente!",
                  );
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition shadow cursor-pointer"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================== MODAL: DELETE EXERCISE CONFIRMATION ==================================== */}
      {exerciseToDelete !== null && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-250 w-full max-w-md rounded-2xl p-6 relative shadow-2xl text-slate-800 text-left">
            <button
              onClick={() => setExerciseToDelete(null)}
              className="absolute top-4 right-4 text-slate-404 text-slate-400 hover:text-slate-900 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-rose-600" />
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-2 font-sans">
              Excluir Exercício da Biblioteca?
            </h3>
            <p className="text-xs text-slate-500 mb-6 font-light leading-normal font-sans">
              Você tem certeza que deseja deletar do banco global o exercício{" "}
              <strong className="text-slate-900 font-bold">
                {exerciseToDelete.name}
              </strong>
              ?<br />
              Essa alteração afetará a biblioteca pública de movimentos. Os
              treinos que já usam este exercício não serão excluídos, mas ele
              não aparecerá mais para novas seleções.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setExerciseToDelete(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await deleteExercise(exerciseToDelete.id);
                  setExerciseToDelete(null);
                  triggerToast("🗑️ Exercício excluído da Biblioteca Global!");
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition shadow cursor-pointer"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================== MODAL: DELETE WORKOUT CONFIRMATION ==================================== */}
      {workoutToDelete !== null && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-250 w-full max-w-md rounded-2xl p-6 relative shadow-2xl text-slate-800 text-left">
            <button
              onClick={() => setWorkoutToDelete(null)}
              className="absolute top-4 right-4 text-slate-405 text-slate-400 hover:text-slate-900 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-rose-600" />
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-2">
              Excluir Treinos Periodizados?
            </h3>
            <p className="text-xs text-slate-500 mb-6 font-light leading-normal">
              Deseja realmente remover o cronograma de exercícios{" "}
              <strong className="text-slate-900 font-bold">
                {workoutToDelete.name}
              </strong>
              ?<br />
              Esta ação excluirá todos os dias e exercícios vinculados a esta
              periodização. O aluno deixará de visualizá-la no aplicativo móvel.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setWorkoutToDelete(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  const result = await deleteWorkout(workoutToDelete.id);
                  setWorkoutToDelete(null);
                  if (result.success) {
                    triggerToast("🗑️ Treino periodizado excluído com sucesso!");
                  } else {
                    triggerToast(result.message || "Não foi possível excluir o treino.");
                  }
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition shadow cursor-pointer"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================== MODAL: ADD WORKOUT ==================================== */}
      {showWorkoutModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl p-6 sm:p-8 relative my-8 shadow-2xl text-slate-800">
            <button
              onClick={() => setShowWorkoutModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-950 mb-2 font-sans">
              Criar Novo Treino / Periodização
            </h3>
            <p className="text-xs text-slate-500 mb-6 font-light font-sans text-left">
              Os exercícios adicionados serão sincronizados com a área do aluno
              selecionado.
            </p>

            <form
              onSubmit={handleCreateWorkout}
              className="space-y-4 text-xs font-semibold text-slate-600"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div>
                  <label className="block text-slate-500 uppercase mb-2">
                    Aluno Destinatário
                  </label>
                  <select
                    value={targetStudentId}
                    onChange={(e) => setTargetStudentId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Selecione o Aluno...</option>
                    {students
                      .filter(
                        (st) => st.trainer_id === (currentProfile?.id || "t1"),
                      )
                      .map((st) => {
                        const p = profiles.find((pr) => pr.id === st.id);
                        return (
                          <option key={st.id} value={st.id}>
                            {p?.name}
                          </option>
                        );
                      })}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 uppercase mb-2">
                    Título do Treino
                  </label>
                  <input
                    type="text"
                    value={workoutTitle}
                    onChange={(e) => setWorkoutTitle(e.target.value)}
                    placeholder="Ex: Treino Pernas Pesado - Division A"
                    className="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-505 text-slate-950 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="text-left">
                <label className="block text-slate-500 uppercase mb-2">
                  Observações de Periodização
                </label>
                <input
                  type="text"
                  value={workoutDesc}
                  onChange={(e) => setWorkoutDesc(e.target.value)}
                  placeholder="Ex: Treinar segundas e quintas, 3 séries normais e 1 dropset na última"
                  className="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-505"
                />
              </div>

              {/* DETALHAMENTO DE DIAS E EXERCÍCIOS */}
              <div className="space-y-4 border-t border-slate-200 pt-4 mt-4 text-left">
                <span className="font-bold text-slate-950 block text-sm mb-2 font-sans">
                  Dividir por Dias e Adicionar Exercício
                </span>

                {workoutDaysList.map((dayGroup, dIdx) => (
                  <div
                    key={dIdx}
                    className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3"
                  >
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={dayGroup.day_name}
                        onChange={(e) => {
                          const list = [...workoutDaysList];
                          list[dIdx].day_name = e.target.value;
                          setWorkoutDaysList(list);
                        }}
                        placeholder="Ex: Segunda-feira"
                        className="flex-1 px-4 py-2 bg-white border border-slate-250 rounded-lg text-slate-900 font-semibold"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      {dayGroup.exercises.map((ex, exIdx) => {
                        const selectedEx = exercises.find(
                          (el) => el.id === ex.exercise_id,
                        );
                        const isCardio = selectedEx?.category === "Cardio";
                        const rowKey = `${dIdx}-${exIdx}`;
                        const isDropdownOpen = focusedExerciseIndex === rowKey;

                        return (
                          <div
                            key={exIdx}
                            className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start bg-white p-3 rounded-lg border border-slate-200"
                          >
                            {/* EXERCÍCIO AUTOCOMPLETE SELECTOR */}
                            <div className="sm:col-span-5 relative">
                              <label className="text-[10px] text-slate-500 block mb-1">
                                Exercício (busca + grupo)
                              </label>

                              <button
                                type="button"
                                onClick={() => {
                                  if (focusedExerciseIndex === rowKey) {
                                    setFocusedExerciseIndex(null);
                                  } else {
                                    setFocusedExerciseIndex(rowKey);
                                    setExerciseSelectSearch("");
                                    setExerciseSelectCategory("Todos");
                                  }
                                }}
                                className="w-full text-left px-3 py-2 bg-white border border-slate-250 hover:border-indigo-300 text-slate-900 rounded-lg text-xs font-semibold flex items-center justify-between shadow-sm cursor-pointer transition min-h-[38px]"
                              >
                                <span className="truncate">
                                  {selectedEx ? (
                                    `${selectedEx.name} (${selectedEx.category})`
                                  ) : (
                                    <span className="text-slate-400">
                                      Selecione o Exercício...
                                    </span>
                                  )}
                                </span>
                                <span className="text-slate-400 font-mono text-[9px]">
                                  ▼
                                </span>
                              </button>

                              {isDropdownOpen && (
                                <div className="absolute left-0 mt-1 w-[280px] sm:w-[350px] bg-white border border-slate-205 rounded-xl shadow-xl p-3 z-50 text-left font-sans">
                                  {/* Search bar */}
                                  <div className="mb-2">
                                    <input
                                      type="text"
                                      autoFocus
                                      placeholder="🔍 Pesquisar por nome..."
                                      value={exerciseSelectSearch}
                                      onChange={(e) =>
                                        setExerciseSelectSearch(e.target.value)
                                      }
                                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-950 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium font-sans"
                                    />
                                  </div>

                                  {/* Filter by Muscle Group Buttons */}
                                  <div className="mb-2">
                                    <label className="text-[9px] text-slate-400 font-bold block mb-1 uppercase tracking-wider font-sans">
                                      Grupo Muscular
                                    </label>
                                    <div className="flex flex-wrap gap-1 max-h-[64px] overflow-y-auto pr-1 pb-1">
                                      {[
                                        "Todos",
                                        "Peito",
                                        "Costas",
                                        "Pernas",
                                        "Ombros",
                                        "Biceps",
                                        "Triceps",
                                        "Abs",
                                        "Cardio",
                                      ].map((cat) => (
                                        <button
                                          key={cat}
                                          type="button"
                                          onClick={() =>
                                            setExerciseSelectCategory(cat)
                                          }
                                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer font-sans ${
                                            exerciseSelectCategory === cat
                                              ? "bg-indigo-600 text-white shadow-xs"
                                              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                          }`}
                                        >
                                          {cat}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Exercises List (Filtered) */}
                                  <div className="border-t border-slate-100 pt-2">
                                    <label className="text-[9px] text-slate-400 font-bold block mb-1 uppercase tracking-wider font-sans">
                                      Selecione o Exercício
                                    </label>

                                    <div className="max-h-[140px] overflow-y-auto space-y-0.5 pr-1">
                                      {exercises
                                        .filter((el) => {
                                          const matchesCat =
                                            exerciseSelectCategory ===
                                              "Todos" ||
                                            el.category ===
                                              exerciseSelectCategory;
                                          const matchesSearch = el.name
                                            .toLowerCase()
                                            .normalize("NFD")
                                            .replace(/[\u0300-\u036f]/g, "")
                                            .includes(
                                              exerciseSelectSearch
                                                .toLowerCase()
                                                .normalize("NFD")
                                                .replace(
                                                  /[\u0300-\u036f]/g,
                                                  "",
                                                ),
                                            );
                                          return matchesCat && matchesSearch;
                                        })
                                        .map((el) => (
                                          <button
                                            key={el.id}
                                            type="button"
                                            onClick={() => {
                                              const list = [...workoutDaysList];
                                              list[dIdx].exercises[
                                                exIdx
                                              ].exercise_id = el.id;

                                              // Se for cardio, inicializa com 20 minutos e zera o resto
                                              if (el.category === "Cardio") {
                                                list[dIdx].exercises[exIdx].reps = "20";
                                                list[dIdx].exercises[exIdx].series = 1;
                                                list[dIdx].exercises[exIdx].rest_seconds = 0;
                                                list[dIdx].exercises[exIdx].load_kg = 0;
                                              }

                                              setWorkoutDaysList(list);
                                              setFocusedExerciseIndex(null);
                                            }}
                                            className={`w-full text-left px-2.5 py-1.5 rounded text-xs select-none transition flex items-center justify-between cursor-pointer font-sans ${
                                              ex.exercise_id === el.id
                                                ? "bg-indigo-50 text-indigo-700 font-bold"
                                                : "hover:bg-slate-50 text-slate-800"
                                            }`}
                                          >
                                            <span className="truncate">
                                              {el.name}
                                            </span>
                                            <span className="text-[9px] bg-slate-100 px-1 rounded text-slate-500 ml-2 font-medium shrink-0">
                                              {el.category}
                                            </span>
                                          </button>
                                        ))}

                                      {exercises.filter((el) => {
                                        const matchesCat =
                                          exerciseSelectCategory === "Todos" ||
                                          el.category ===
                                            exerciseSelectCategory;
                                        const matchesSearch = el.name
                                          .toLowerCase()
                                          .normalize("NFD")
                                          .replace(/[\u0300-\u036f]/g, "")
                                          .includes(
                                            exerciseSelectSearch
                                              .toLowerCase()
                                              .normalize("NFD")
                                              .replace(/[\u0300-\u036f]/g, ""),
                                          );
                                        return matchesCat && matchesSearch;
                                      }).length === 0 && (
                                        <p className="text-[11px] text-slate-400 py-3 text-center font-light font-sans">
                                          Nenhum exercício encontrado
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="mt-2 pt-2 border-t border-slate-150 flex justify-end">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setFocusedExerciseIndex(null)
                                      }
                                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold cursor-pointer transition font-sans"
                                    >
                                      Remover Filtros / Fechar
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* CONDITIONAL CARDIO VS REGULAR FIELD VIEW */}
                            {isCardio ? (
                              <>
                                <div className="sm:col-span-2">
                                  <label className="text-[10px] text-indigo-600 font-bold block mb-1">
                                    🕒 Tempo (minutos)
                                  </label>
                                  <input
                                    type="number"
                                    min={1}
                                    placeholder="Ex: 30"
                                    value={ex.reps}
                                    onChange={(e) => {
                                      const list = [...workoutDaysList];
                                      list[dIdx].exercises[exIdx].reps =
                                        e.target.value;
                                      list[dIdx].exercises[exIdx].series = 1;
                                      list[dIdx].exercises[exIdx].rest_seconds = 0;
                                      setWorkoutDaysList(list);
                                    }}
                                    className="w-full px-2 py-1.5 bg-white border border-indigo-200 focus:ring-1 focus:ring-indigo-500 text-slate-900 font-semibold rounded text-xs"
                                    required
                                  />
                                </div>
                                {selectedEx && (selectedEx.name.toLowerCase().includes('esteira') || selectedEx.name.toLowerCase().includes('treadmill') || (selectedEx.equipment || '').toLowerCase().includes('esteira')) && (
                                  <div className="sm:col-span-2">
                                    <label className="text-[10px] text-indigo-600 font-bold block mb-1">
                                      Inclinação (%)
                                    </label>
                                    <input
                                      type="number"
                                      min={0}
                                      max={30}
                                      step={0.5}
                                      placeholder="Ex: 5"
                                      value={ex.load_kg}
                                      onChange={(e) => {
                                        const list = [...workoutDaysList];
                                        list[dIdx].exercises[exIdx].load_kg =
                                          Number(e.target.value);
                                        setWorkoutDaysList(list);
                                      }}
                                      className="w-full px-2 py-1.5 bg-white border border-indigo-200 text-slate-900 rounded text-xs"
                                    />
                                  </div>
                                )}
                                <div className="sm:col-span-4">
                                  <label className="text-[10px] text-slate-500 block mb-1">
                                    Observações
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Ex: ritmo moderado, zona 2, respiração controlada"
                                    value={ex.observations}
                                    onChange={(e) => {
                                      const list = [...workoutDaysList];
                                      list[dIdx].exercises[exIdx].observations =
                                        e.target.value;
                                      setWorkoutDaysList(list);
                                    }}
                                    className="w-full px-2 py-1.5 bg-white border border-slate-250 text-slate-900 rounded text-xs"
                                  />
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="sm:col-span-2">
                                  <label className="text-[10px] text-slate-500 block mb-1">
                                    Séries
                                  </label>
                                  <input
                                    type="number"
                                    value={ex.series}
                                    onChange={(e) => {
                                      const list = [...workoutDaysList];
                                      list[dIdx].exercises[exIdx].series =
                                        Number(e.target.value);
                                      setWorkoutDaysList(list);
                                    }}
                                    className="w-full px-2 bg-white border border-slate-250 text-slate-900 rounded text-xs py-1.5"
                                  />
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="text-[10px] text-slate-500 block mb-1">
                                    Carga (kg)
                                  </label>
                                  <input
                                    type="number"
                                    value={ex.load_kg || ""}
                                    onChange={(e) => {
                                      const list = [...workoutDaysList];
                                      list[dIdx].exercises[exIdx].load_kg =
                                        Number(e.target.value);
                                      setWorkoutDaysList(list);
                                    }}
                                    className="w-full px-2 bg-white border border-slate-250 text-slate-900 rounded text-xs py-1.5"
                                  />
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="text-[10px] text-slate-500 block mb-1">
                                    Reps
                                  </label>
                                  <input
                                    type="text"
                                    value={ex.reps}
                                    onChange={(e) => {
                                      const list = [...workoutDaysList];
                                      list[dIdx].exercises[exIdx].reps =
                                        e.target.value;
                                      setWorkoutDaysList(list);
                                    }}
                                    className="w-full px-2 bg-white border border-slate-250 text-slate-900 rounded text-xs py-1.5"
                                  />
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="text-[10px] text-slate-500 block mb-1">
                                    Descanso (s)
                                  </label>
                                  <input
                                    type="number"
                                    value={ex.rest_seconds}
                                    onChange={(e) => {
                                      const list = [...workoutDaysList];
                                      list[dIdx].exercises[exIdx].rest_seconds =
                                        Number(e.target.value);
                                      setWorkoutDaysList(list);
                                    }}
                                    className="w-full px-2 bg-white border border-slate-250 text-slate-900 rounded text-xs py-1.5"
                                  />
                                </div>
                                <div className="sm:col-span-4">
                                  <label className="text-[10px] text-slate-500 block mb-1">
                                    Observações
                                  </label>
                                  <input
                                    type="text"
                                    value={ex.observations}
                                    onChange={(e) => {
                                      const list = [...workoutDaysList];
                                      list[dIdx].exercises[exIdx].observations =
                                        e.target.value;
                                      setWorkoutDaysList(list);
                                    }}
                                    placeholder="Ex: Pare 30s antes da última série"
                                    className="w-full px-2 bg-white border border-slate-250 text-slate-900 rounded text-xs py-1.5"
                                  />
                                </div>
                              </>
                            )}

                            {/* REMOVE EXERCISE BUTTON ROW */}
                            <div className="sm:col-span-1 flex justify-center items-end h-full pt-4 sm:pt-0 pb-1">
                              <button
                                type="button"
                                onClick={() => {
                                  const list = [...workoutDaysList];
                                  list[dIdx].exercises.splice(exIdx, 1);
                                  setWorkoutDaysList(list);
                                }}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-2 rounded-xl border border-rose-200 transition shrink-0 cursor-pointer"
                                title="Remover exercício da periodização"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const list = [...workoutDaysList];
                        list[dIdx].exercises.push({
                          exercise_id: "e1",
                          series: 3,
                          reps: "10",
                          rest_seconds: 60,
                          load_kg: 10,
                          observations: "",
                        });
                        setWorkoutDaysList(list);
                      }}
                      className="text-[10px] text-indigo-600 hover:underline font-extrabold mt-1 block cursor-pointer"
                    >
                      + Exercício para este dia
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setWorkoutDaysList([
                      ...workoutDaysList,
                      {
                        day_name: `Segunda-feira`,
                        exercises: [
                          {
                            exercise_id: "e1",
                            series: 3,
                            reps: "10",
                            rest_seconds: 60,
                            load_kg: 10,
                            observations: "",
                          },
                        ],
                      },
                    ]);
                  }}
                  className="bg-slate-100 opacity-90 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[11px] px-4 py-2 rounded-xl cursor-pointer"
                >
                  + Adicionar Outro Dia de Treino (Segunda, Terça, ...)
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowWorkoutModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl block text-center cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-5 py-2.5 rounded-xl block text-center shadow cursor-pointer transition"
                >
                  Publicar Treino
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================== MODAL: DUPLICATE WORKOUT ==================================== */}
      {showCopyModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 sm:p-8 relative shadow-2xl text-slate-800">
            <button
              onClick={() => setShowCopyModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-950 mb-2 font-sans">
              Importar / Duplicar Treino
            </h3>
            <p className="text-xs text-slate-500 mb-6 font-light font-sans text-left">
              Copie instantaneamente a periodização de um aluno para o outro
              economizando tempo de digitação.
            </p>

            <form
              onSubmit={handleCopyWorkout}
              className="space-y-4 text-xs font-semibold text-slate-600 text-left"
            >
              <div>
                <label className="block text-slate-500 uppercase mb-2 font-bold text-[10px]">
                  Treino de Origem (Modelo)
                </label>
                <select
                  value={copySourceId}
                  onChange={(e) => setCopySourceId(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-250 rounded-xl text-slate-900"
                  required
                >
                  <option value="">Selecione o Treino...</option>
                  {workouts.map((w) => {
                    const mtProf = profiles.find((p) => p.id === w.student_id);
                    return (
                      <option key={w.id} value={w.id}>
                        {w.name} (Aluno: {mtProf?.name})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 uppercase mb-2 font-bold text-[10px]">
                  Aluno de Destino
                </label>
                <select
                  value={copyTargetStudentId}
                  onChange={(e) => setCopyTargetStudentId(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-250 rounded-xl text-slate-900"
                  required
                >
                  <option value="">Selecione o Aluno...</option>
                  {students
                    .filter(
                      (st) => st.trainer_id === (currentProfile?.id || "t1"),
                    )
                    .map((st) => {
                      const p = profiles.find((pr) => pr.id === st.id);
                      return (
                        <option key={st.id} value={st.id}>
                          {p?.name}
                        </option>
                      );
                    })}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-650 hover:bg-indigo-700 bg-indigo-600 text-white font-extrabold py-3 rounded-xl transition mt-4 shadow cursor-pointer"
              >
                Duplicar Treino Agora
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================================== MODAL: PHYSICAL ASSESSMENT ==================================== */}
      {/* ==================================== MODAL: PHYSICAL ASSESSMENT ==================================== */}
      {showAssessmentModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto font-sans">
          <div className="bg-white border border-slate-200 w-full max-w-xl rounded-2xl p-6 sm:p-8 relative my-8 shadow-2xl text-slate-800">
            <button
              onClick={() => setShowAssessmentModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-950 mb-2">
              Lançamento de Avaliação Física
            </h3>
            <p className="text-xs text-slate-500 mb-6 font-light text-left">
              Os dados biométricos preencherão os gráficos e calcularão o IMC
              automaticamente.
            </p>

            <form
              onSubmit={handleCreateAssessment}
              className="space-y-4 text-xs font-semibold text-slate-650 text-left"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-500 uppercase mb-2">
                    Aluno Avaliado
                  </label>
                  <select
                    value={assessStudentId}
                    onChange={(e) => setAssessStudentId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-905 text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-550"
                    required
                  >
                    <option value="">Escolha...</option>
                    {students
                      .filter(
                        (st) => st.trainer_id === (currentProfile?.id || "t1"),
                      )
                      .map((st) => {
                        const p = profiles.find((pr) => pr.id === st.id);
                        return (
                          <option key={st.id} value={st.id}>
                            {p?.name}
                          </option>
                        );
                      })}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 uppercase mb-2">
                    Protocolo Usado
                  </label>
                  <input
                    type="text"
                    value={assessProtocol}
                    onChange={(e) => setAssessProtocol(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-550"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 uppercase mb-2">
                    Data da Avaliação
                  </label>
                  <input
                    type="date"
                    value={assessDate}
                    onChange={(e) => setAssessDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-550"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-500 uppercase mb-2">
                    Altura (cm)
                  </label>
                  <input
                    type="number"
                    value={assessHeight}
                    onChange={(e) => setAssessHeight(e.target.value)}
                    placeholder="Ex: 168"
                    className="w-full px-3 py-2 bg-white border border-slate-250 rounded-xl text-slate-900 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 uppercase mb-2">
                    Peso Atual (kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={assessWeight}
                    onChange={(e) => setAssessWeight(e.target.value)}
                    placeholder="Ex: 61.2"
                    className="w-full px-3 py-2 bg-white border border-slate-250 rounded-xl text-slate-900 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 uppercase mb-2">
                    Gordura % / BF
                  </label>
                  <input
                    type="number"
                    value={assessBf}
                    onChange={(e) => setAssessBf(e.target.value)}
                    placeholder="Ex: 19"
                    className="w-full px-3 py-2 bg-white border border-slate-250 rounded-xl text-slate-900 font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 uppercase mb-2">
                  Ficha de Anamnese / Comentários
                </label>
                <textarea
                  value={anamnesis}
                  onChange={(e) => setAnamnesis(e.target.value)}
                  placeholder="Fale sobre queixas, dores articulares ou metas de curto prazo..."
                  className="w-full h-18 px-4 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-505"
                  required
                ></textarea>
              </div>

              {/* MEDIDAS DETALHADAS */}
              <div className="border-t border-slate-200 pt-4 mt-4 space-y-3">
                <span className="font-bold text-slate-900 block text-sm">
                  Medidas Perimétricas de Circunferência (Fita Métrica)
                </span>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-center text-[11px]">
                  {Object.keys(measurementMap).map((part) => {
                    const translated: Record<string, string> = {
                      neck: "Pescoço (cm)",
                      shoulder: "Ombro (cm)",
                      chest: "Peito (cm)",
                      waist: "Cintura (cm)",
                      abdomen: "Abdômen (cm)",
                      hips: "Quadril (cm)",
                      biceps_left: "Bíceps E. (cm)",
                      biceps_right: "Bíceps D. (cm)",
                      thigh_left: "Coxa E. (cm)",
                      thigh_right: "Coxa D. (cm)",
                      calf_left: "Pant. E. (cm)",
                      calf_right: "Pant. D. (cm)",
                    };
                    const k = part as keyof typeof measurementMap;

                    return (
                      <div key={part}>
                        <label className="text-slate-500 block mb-1 text-[10px] truncate">
                          {translated[part] || part}
                        </label>
                        <input
                          type="number"
                          value={measurementMap[k]}
                          onChange={(e) =>
                            setMeasurementMap({
                              ...measurementMap,
                              [k]: e.target.value,
                            })
                          }
                          className="w-full px-2 py-1.5 bg-white border border-slate-250 text-slate-900 rounded font-mono font-bold text-center"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-slate-500 uppercase mb-2">
                  Recomendações e Prescrição de Macrociclo
                </label>
                <input
                  type="text"
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  placeholder="Ex: Treinar hipertrofia e focar em repouso ativo aos domingos."
                  className="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAssessmentModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl block text-center cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-5 py-2.5 rounded-xl block text-center shadow cursor-pointer transition"
                >
                  Gravar Avaliação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================== MODAL: ADD PAYMENT ==================================== */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 sm:p-8 relative shadow-2xl text-slate-800 font-sans">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-950 mb-2">
              Lançamento de Mensalidade
            </h3>
            <p className="text-xs text-slate-500 mb-6 font-light text-left">
              Sera emitido um alerta automático sobre cobrança e vencimento na
              conta do aluno.
            </p>

            <form
              onSubmit={handleCreatePayment}
              className="space-y-4 text-xs font-semibold text-slate-650 text-left"
            >
              <div>
                <label className="block text-slate-500 uppercase mb-2 font-bold text-[10px]">
                  Aluno Destinatário
                </label>
                <select
                  value={payStudentId}
                  onChange={(e) => setPayStudentId(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-250 rounded-xl text-slate-900 font-medium"
                  required
                >
                  <option value="">Selecione o Aluno...</option>
                  {students
                    .filter(
                      (st) => st.trainer_id === (currentProfile?.id || "t1"),
                    )
                    .map((st) => {
                      const p = profiles.find((pr) => pr.id === st.id);
                      return (
                        <option key={st.id} value={st.id}>
                          {p?.name}
                        </option>
                      );
                    })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 uppercase mb-2 font-bold text-[10px]">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-900 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 uppercase mb-2 font-bold text-[10px]">
                    Data de Vencimento
                  </label>
                  <input
                    type="date"
                    value={payDueDate}
                    onChange={(e) => setPayDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-900 font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 uppercase mb-2 font-bold text-[10px]">
                  Descrição/Serviço
                </label>
                <input
                  type="text"
                  value={payDesc}
                  onChange={(e) => setPayDesc(e.target.value)}
                  placeholder="Mensalidade consultoria Fit Premium"
                  className="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-900"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-650 hover:bg-indigo-700 bg-indigo-600 text-white font-extrabold py-3.5 rounded-xl text-xs tracking-wider transition uppercase mt-4 shadow cursor-pointer"
              >
                Gerar Cobrança
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================================== MODAL: GEMINI AI COACH RECOMMENDATIONS ==================================== */}
      {showAIModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 w-full max-w-xl rounded-2xl p-6 sm:p-8 relative max-h-[85vh] overflow-y-auto shadow-2xl text-slate-800 font-sans">
            <button
              onClick={() => setShowAIModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center text-indigo-650 border border-indigo-100">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <h3 className="text-md font-bold text-slate-950 leading-none">
                Prescritor Inteligente (Google Gemini AI Model)
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mb-6 font-light text-left">
              Nossa Inteligência Artificial analisa as métricas antropométricas,
              objetivos e as dores relatadas deste aluno para recomendar um
              planejamento de macrociclo perfeito para você validar e publicar.
            </p>

            <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl text-xs leading-relaxed max-h-[50vh] overflow-y-auto text-slate-700">
              {aiLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
                  <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent animate-spin rounded-full"></div>
                  <span className="font-mono text-[10px] animate-pulse">
                    Acessando API do Gemini para estruturar treino...
                  </span>
                </div>
              ) : (
                <div className="space-y-4 whitespace-pre-wrap font-sans text-left">
                  {aiResponse}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-200 text-[10px] text-slate-400 font-mono">
              <span>Modelo: gemini-2.5-flash / gemini-1.5-pro</span>

              <button
                onClick={() => setShowAIModal(false)}
                className="bg-indigo-605 hover:bg-indigo-700 bg-indigo-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition shadow cursor-pointer"
              >
                Concluído / Usar Ideias
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================== MODAL: VIEW STUDENT WORKOUT ==================================== */}
      {showViewWorkoutModal &&
        (() => {
          const studentProfile = profiles.find(
            (p) => p.id === viewWorkoutStudentId,
          );
          const studentActiveWorkouts = workouts.filter(
            (w) => w.student_id === viewWorkoutStudentId && w.is_active,
          );
          const studentActiveWorkout = studentActiveWorkouts[0];
          const studentDays = workoutDays.filter((d) =>
            studentActiveWorkouts.some((aw) => aw.id === d.workout_id),
          );

          return (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto font-sans">
              <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl p-6 sm:p-8 relative my-8 shadow-2xl text-slate-800 text-left">
                <button
                  onClick={() => setShowViewWorkoutModal(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <h2 className="text-lg font-black text-slate-950 mb-1 flex items-center gap-1.5 font-sans">
                  🏋️ Treino de {studentProfile?.name || "Aluno"}
                </h2>
                <p className="text-xs text-slate-500 mb-6 font-light font-sans">
                  Veja o cronograma e a periodização de treino ativa passada
                  para o aluno.
                </p>

                {!studentActiveWorkout ? (
                  <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-4">
                    <p className="text-xs text-slate-500 font-sans">
                      Este aluno não possui nenhum plano de treino ativo no
                      momento.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowViewWorkoutModal(false);
                        setTargetStudentId(viewWorkoutStudentId);
                        setWorkoutDaysList([
                          {
                            day_name: "Dia A - Geral",
                            exercises: [
                              {
                                exercise_id: "e1",
                                series: 3,
                                reps: "12",
                                rest_seconds: 60,
                                load_kg: 20,
                                observations: "",
                              },
                            ],
                          },
                        ]);
                        setShowWorkoutModal(true);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl cursor-pointer shadow transition inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4 text-white" /> Montar Treino
                      Agora
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* WORKOUT INFO CARD */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900">
                          {studentActiveWorkout.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 font-sans">
                          {studentActiveWorkout.description ||
                            "Sem descrição cadastrada"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowViewWorkoutModal(false);
                          setTargetStudentId(viewWorkoutStudentId);
                          setEditingWorkoutId(studentActiveWorkout.id);
                          setWorkoutTitle(studentActiveWorkout.name);
                          setWorkoutDesc(
                            studentActiveWorkout.description || "",
                          );

                          // Map days list to setWorkoutDaysList
                          const wDays = workoutDays.filter(
                            (d) => d.workout_id === studentActiveWorkout.id,
                          );
                          const mappedList = wDays.map((day) => {
                            const exercisesInDay = workoutExercises.filter(
                              (we) => we.workout_day_id === day.id,
                            );
                            return {
                              day_name: day.day_name,
                              exercises: exercisesInDay.map((we) => ({
                                exercise_id: we.exercise_id,
                                series: we.series,
                                reps: we.reps,
                                rest_seconds: we.rest_seconds,
                                load_kg: we.load_kg || 0,
                                observations: we.observations || "",
                              })),
                            };
                          });
                          setWorkoutDaysList(
                            mappedList.length > 0
                              ? mappedList
                              : [
                                  {
                                    day_name: "Dia A - Geral",
                                    exercises: [
                                      {
                                        exercise_id: "e1",
                                        series: 3,
                                        reps: "12",
                                        rest_seconds: 60,
                                        load_kg: 20,
                                        observations: "",
                                      },
                                    ],
                                  },
                                ],
                          );
                          setShowWorkoutModal(true);
                        }}
                        className="bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-250 py-1.5 px-3 rounded-lg text-[11px] cursor-pointer transition shadow-xs"
                      >
                        ✏️ Editar Treino
                      </button>
                    </div>

                    {/* DAYS FLOW */}
                    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                      {studentDays.map((docDay) => {
                        const docExs = workoutExercises.filter(
                          (we) => we.workout_day_id === docDay.id,
                        );

                        return (
                          <div
                            key={docDay.id}
                            className="bg-white border border-slate-200 rounded-2xl p-4"
                          >
                            <h4 className="text-xs font-extrabold text-indigo-700 bg-indigo-50/70 border border-indigo-100/60 px-3 py-1.5 rounded-xl uppercase tracking-wider inline-block mb-3">
                              ⚡ {docDay.day_name}
                            </h4>

                            <div className="divide-y divide-slate-100">
                              {docExs.map((we, exIdx) => {
                                const baseEx = exercises.find(
                                  (e) => e.id === we.exercise_id,
                                );
                                const isCardio = baseEx?.category === "Cardio";

                                return (
                                  <div
                                    key={we.id}
                                    className="py-2.5 flex justify-between items-start text-xs gap-4"
                                  >
                                    <div>
                                      <h5 className="font-bold text-slate-900">
                                        {baseEx?.name || "Exercício"}
                                      </h5>
                                      {we.observations && (
                                        <p className="text-[11px] text-slate-500 italic mt-0.5">
                                          Obs: {we.observations}
                                        </p>
                                      )}
                                    </div>
                                    <div className="shrink-0 text-right font-mono text-[11px]">
                                      {isCardio ? (
                                        <span className="text-indigo-600 font-bold bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded text-xs font-sans">
                                          ⏱️ {we.reps} min
                                          {baseEx && (baseEx.name.toLowerCase().includes('esteira') || baseEx.name.toLowerCase().includes('treadmill')) && (we.load_kg ?? 0) > 0
                                            ? ` · ${we.load_kg}% incl.`
                                            : ''}
                                        </span>
                                      ) : (
                                        <div className="space-x-2 text-slate-500">
                                          <span>
                                            {we.series}x{we.reps}
                                          </span>
                                          <span>•</span>
                                          <span>{we.load_kg || 0}kg</span>
                                          <span>•</span>
                                          <span>
                                            {we.rest_seconds}s descanso
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                              {docExs.length === 0 && (
                                <p className="text-[11px] text-slate-400 py-2 font-sans">
                                  Sem exercícios cadastrados.
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-slate-200 font-sans">
                      <button
                        type="button"
                        onClick={() => {
                          setShowViewWorkoutModal(false);
                          setTargetStudentId(viewWorkoutStudentId);
                          setWorkoutDaysList([
                            {
                              day_name: "Dia A - Geral",
                              exercises: [
                                {
                                  exercise_id: "e1",
                                  series: 3,
                                  reps: "12",
                                  rest_seconds: 60,
                                  load_kg: 20,
                                  observations: "",
                                },
                              ],
                            },
                          ]);
                          setShowWorkoutModal(true);
                        }}
                        className="text-xs text-indigo-600 font-extrabold hover:underline"
                      >
                        + Criar Nova Divisão / Forçar Treino
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowViewWorkoutModal(false)}
                        className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-950 transition cursor-pointer"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

      {/* ==================================== MODAL: VIEW STUDENT ASSESSMENTS ==================================== */}
      {showViewAssessmentsModal &&
        (() => {
          const studentProfile = profiles.find(
            (p) => p.id === viewAssessmentsStudentId,
          );
          const studentAssessments = physicalAssessments.filter(
            (a) => a.student_id === viewAssessmentsStudentId,
          );
          const studentMeasurements = bodyMeasurements.filter(
            (m) => m.student_id === viewAssessmentsStudentId,
          );

          // Sort assessments newer first
          const sortedAssessments = [...studentAssessments].sort(
            (a, b) =>
              new Date(b.date || b.created_at).getTime() -
              new Date(a.date || a.created_at).getTime(),
          );

          return (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto font-sans">
              <div className="bg-white border border-slate-200 w-full max-w-4xl rounded-2xl p-6 sm:p-8 relative my-8 shadow-2xl text-slate-800">
                <button
                  onClick={() => setShowViewAssessmentsModal(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-100 pb-4 text-left">
                  <div>
                    <h2 className="text-lg font-black text-slate-950 flex items-center gap-1.5 font-sans">
                      📊 Histórico de Medidas & Avaliações
                    </h2>
                    <p className="text-xs text-slate-500 font-sans mt-0.5">
                      Aluno(a):{" "}
                      <strong className="text-slate-700">
                        {studentProfile?.name}
                      </strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowViewAssessmentsModal(false);
                      setAssessStudentId(viewAssessmentsStudentId);
                      setAssessDate(new Date().toISOString().split("T")[0]); // pre-fill weight/height
                      const latestMeas =
                        studentMeasurements[studentMeasurements.length - 1];
                      if (latestMeas) {
                        setAssessWeight(String(latestMeas.weight));
                        setAssessHeight(String(latestMeas.height));
                        setMeasurementMap({
                          neck: String(latestMeas.neck || 0),
                          shoulder: String(latestMeas.shoulder || 0),
                          chest: String(latestMeas.chest || 0),
                          waist: String(latestMeas.waist || 0),
                          abdomen: String(latestMeas.abdomen || 0),
                          hips: String(latestMeas.hips || 0),
                          biceps_left: String(latestMeas.biceps_left || 0),
                          biceps_right: String(latestMeas.biceps_right || 0),
                          thigh_left: String(latestMeas.thigh_left || 0),
                          thigh_right: String(latestMeas.thigh_right || 0),
                          calf_left: String(latestMeas.calf_left || 0),
                          calf_right: String(latestMeas.calf_right || 0),
                        });
                      } else {
                        setAssessWeight("");
                        setAssessHeight("");
                        setMeasurementMap({
                          neck: "0",
                          shoulder: "0",
                          chest: "0",
                          waist: "0",
                          abdomen: "0",
                          hips: "0",
                          biceps_left: "0",
                          biceps_right: "0",
                          thigh_left: "0",
                          thigh_right: "0",
                          calf_left: "0",
                          calf_right: "0",
                        });
                      }
                      setShowAssessmentModal(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition flex items-center gap-1 shadow"
                  >
                    <Plus className="w-4 h-4 text-white" /> Cadastrar Nova
                    Avaliação / Medida
                  </button>
                </div>

                {sortedAssessments.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                    <p className="text-xs text-slate-500 font-sans">
                      Nenhum histórico de medidas registrado.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6 max-h-[480px] overflow-y-auto pr-2 text-left">
                    {sortedAssessments.map((assess, idx) => {
                      const nextAssess = sortedAssessments[idx + 1]; // Older assessment (due to newest-first order)
                      const measure = studentMeasurements.find(
                        (m) =>
                          m.student_id === viewAssessmentsStudentId &&
                          m.date === assess.date,
                      );
                      const nextMeasure = nextAssess
                        ? studentMeasurements.find(
                            (m) =>
                              m.student_id === viewAssessmentsStudentId &&
                              m.date === nextAssess.date,
                          )
                        : null;

                      const formattedDate = assess.date
                        ? new Date(assess.date).toLocaleDateString("pt-BR")
                        : "Sem data";

                      // Helpers to render comparison values
                      const getCompStr = (
                        curr: number | undefined,
                        prev: number | undefined,
                        unit: string = "",
                      ) => {
                        if (curr === undefined || prev === undefined)
                          return null;
                        const diff = curr - prev;
                        if (diff === 0)
                          return (
                            <span className="text-[10px] text-slate-400 font-bold font-sans ml-1">
                              (=)
                            </span>
                          );
                        if (diff > 0)
                          return (
                            <span className="text-[10px] text-rose-500 font-bold font-sans ml-1">
                              ↑ +{diff.toFixed(1)}
                              {unit}
                            </span>
                          );
                        return (
                          <span className="text-[10px] text-emerald-600 font-bold font-sans ml-1">
                            ↓ {diff.toFixed(1)}
                            {unit}
                          </span>
                        );
                      };

                      return (
                        <div
                          key={assess.id}
                          className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4"
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-2.5 gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black bg-indigo-600 text-white px-2.5 py-1 rounded-lg">
                                📅 Data da Avaliação: {formattedDate}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono italic">
                                Protocolo:{" "}
                                {assess.protocol || "Não especificado"}
                              </span>
                            </div>
                            <span className="text-xs font-semibold text-slate-500 font-mono">
                              IMC:{" "}
                              <strong className="text-slate-900">
                                {assess.imc || "--"}
                              </strong>
                            </span>
                          </div>

                          {/* BIO STATS ROW */}
                          <div className="grid grid-cols-3 gap-4 text-center bg-white p-3 rounded-xl border border-slate-100">
                            <div>
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono block">
                                Peso Corporal
                              </span>
                              <span className="text-[13px] font-black text-slate-900 font-sans">
                                {measure?.weight || "--"} kg
                                {getCompStr(
                                  measure?.weight,
                                  nextMeasure?.weight,
                                  "kg",
                                )}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono block">
                                Altura
                              </span>
                              <span className="text-[13px] font-black text-slate-900 font-sans">
                                {measure?.height || "--"} cm
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider block">
                                Gordura Corporal (BF)
                              </span>
                              <span className="text-[13px] font-black text-indigo-700 font-sans">
                                {assess.body_fat_percentage || "--"} %
                                {getCompStr(
                                  assess.body_fat_percentage,
                                  nextAssess?.body_fat_percentage,
                                  "%",
                                )}
                              </span>
                            </div>
                          </div>

                          {/* ANAMNESIS & MACRO */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                            {assess.anamnesis && (
                              <div className="bg-white p-3 rounded-xl border border-slate-150">
                                <span className="text-[9px] text-slate-400 uppercase font-black font-mono block mb-1">
                                  Anamnese / Observações
                                </span>
                                <p className="text-slate-700 font-light leading-relaxed whitespace-pre-line">
                                  {assess.anamnesis}
                                </p>
                              </div>
                            )}
                            {assess.recommendations && (
                              <div className="bg-white p-3 rounded-xl border border-slate-150">
                                <span className="text-[9px] text-indigo-500 uppercase font-black font-mono block mb-1">
                                  Recomendações de Treino / Macrociclo
                                </span>
                                <p className="text-slate-700 font-light leading-relaxed">
                                  {assess.recommendations}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* CIRCUMFERENCE TABLE */}
                          {measure && (
                            <div className="bg-white p-4 rounded-xl border border-slate-150 space-y-2">
                              <span className="text-[10px] text-slate-450 uppercase font-black tracking-wider font-mono block">
                                Histórico de Perímetros de Circunferência
                              </span>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2.5 text-xs text-left">
                                {[
                                  { key: "neck", name: "Pescoço" },
                                  { key: "shoulder", name: "Ombro" },
                                  { key: "chest", name: "Peito" },
                                  { key: "waist", name: "Cintura" },
                                  { key: "abdomen", name: "Abdomen" },
                                  { key: "hips", name: "Quadril" },
                                  { key: "biceps_left", name: "Bíceps Esq." },
                                  { key: "biceps_right", name: "Bíceps Dir." },
                                  { key: "thigh_left", name: "Coxa Esq." },
                                  { key: "thigh_right", name: "Coxa Dir." },
                                  {
                                    key: "calf_left",
                                    name: "Panturrilha Esq.",
                                  },
                                  {
                                    key: "calf_right",
                                    name: "Panturrilha Dir.",
                                  },
                                ].map((part) => {
                                  const val = (measure as any)[part.key] as
                                    | number
                                    | undefined;
                                  const prevVal = nextMeasure
                                    ? ((nextMeasure as any)[part.key] as
                                        | number
                                        | undefined)
                                    : undefined;

                                  return (
                                    <div
                                      key={part.key}
                                      className="flex justify-between items-center border-b border-slate-100 pb-1"
                                    >
                                      <span className="text-slate-500 font-sans">
                                        {part.name}:
                                      </span>
                                      <span className="font-extrabold text-slate-800 font-sans">
                                        {val !== undefined && val > 0
                                          ? `${val} cm`
                                          : "--"}
                                        {val !== undefined &&
                                          val > 0 &&
                                          getCompStr(val, prevVal, "cm")}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t border-slate-200 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowViewAssessmentsModal(false)}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Fechar Histórico
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* ==================================== MODAL: ADD TRAINER (SUPERADMIN) ==================================== */}
      {showAddTrainerModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto font-sans text-left">
          <div className="bg-white border border-slate-200 w-full max-w-xl rounded-2xl p-6 sm:p-8 relative my-8 shadow-2xl text-slate-800">
            <button
              onClick={() => setShowAddTrainerModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-950 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-950 mb-1 flex items-center gap-1.5 font-sans">
              👑 Credenciar Novo Professor
            </h3>
            <p className="text-xs text-slate-500 mb-6 font-light font-sans">
              Cadastre o personal trainer na base. Ele receberá uma senha
              temporária padrão{" "}
              <strong className="text-indigo-600 font-mono">"axiosfit"</strong>{" "}
              para efetuar o primeiro acesso e alterar.
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setAdminSuccess(null);
                setAdminError(null);

                if (
                  !adminTrainerName ||
                  !adminTrainerEmail ||
                  !adminTrainerCref
                ) {
                  setAdminError("Nome, E-mail e CREF são campos obrigatórios.");
                  return;
                }

                // Check duplicate email
                const exists = profiles.some(
                  (p) =>
                    p.email.toLowerCase().trim() ===
                    adminTrainerEmail.toLowerCase().trim(),
                );
                if (exists) {
                  setAdminError("Este endereço de e-mail já está cadastrado.");
                  return;
                }

                // Register
                const result = await createTrainerByAdmin({
                  name: adminTrainerName,
                  email: adminTrainerEmail,
                  cref: adminTrainerCref,
                  specialties: adminTrainerSpecialties
                    ? adminTrainerSpecialties.split(",").map((s) => s.trim())
                    : ["Musculação"],
                  bio: adminTrainerBio,
                  whatsapp: adminTrainerWhatsapp,
                  plan: adminTrainerPlan,
                });

                if (result.success) {
                  setAdminSuccess(
                    result.message +
                      (result.temporaryPassword
                        ? ` Senha temporária: ${result.temporaryPassword}`
                        : ""),
                  );
                  // Reset fields & close
                  setAdminTrainerName("");
                  setAdminTrainerEmail("");
                  setAdminTrainerCref("");
                  setAdminTrainerWhatsapp("");
                  setAdminTrainerSpecialties("");
                  setAdminTrainerBio("");
                  setAdminTrainerPlan("Bronze");
                  setShowAddTrainerModal(false);
                } else {
                  setAdminError(
                    result.message ||
                      "Falha ao registrar personal no Supabase.",
                  );
                }
              }}
              className="space-y-4 text-xs font-semibold text-slate-650 font-sans"
            >
              <div>
                <label className="block text-slate-500 uppercase mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={adminTrainerName}
                  onChange={(e) => setAdminTrainerName(e.target.value)}
                  placeholder="Ex: Clara Ribeiro"
                  className="w-full px-4 py-2.5 bg-white border border-slate-205 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-550 text-sm font-medium text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-500 uppercase mb-2">
                  E-mail de Acesso (Credencial única)
                </label>
                <input
                  type="email"
                  value={adminTrainerEmail}
                  onChange={(e) => setAdminTrainerEmail(e.target.value)}
                  placeholder="Ex: clara@axosfit.com"
                  className="w-full px-4 py-2.5 bg-white border border-slate-205 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-550 text-sm font-medium text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 uppercase mb-2">
                    Registro Profissional (CREF)
                  </label>
                  <input
                    type="text"
                    value={adminTrainerCref}
                    onChange={(e) => setAdminTrainerCref(e.target.value)}
                    placeholder="Ex: CREF 098765-G/SP"
                    className="w-full px-4 py-2.5 bg-white border border-slate-205 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-550 text-sm font-medium text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-500 uppercase mb-2">
                    WhatsApp de Contato (Com DDD)
                  </label>
                  <input
                    type="text"
                    value={adminTrainerWhatsapp}
                    onChange={(e) =>
                      setAdminTrainerWhatsapp(formatPhone(e.target.value))
                    }
                    placeholder="Ex: (11) 99999-9999"
                    className="w-full px-4 py-2.5 bg-white border border-slate-205 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-550 text-sm font-mono text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 uppercase mb-2">
                  Especialidades acadêmicas (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={adminTrainerSpecialties}
                  onChange={(e) => setAdminTrainerSpecialties(e.target.value)}
                  placeholder="Ex: Hipertrofia, Biomecânica, Funcional"
                  className="w-full px-4 py-2.5 bg-white border border-slate-205 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-550 text-sm font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-500 uppercase mb-2">
                  Breve Apresentação do Personal
                </label>
                <textarea
                  value={adminTrainerBio}
                  onChange={(e) => setAdminTrainerBio(e.target.value)}
                  placeholder="Fale um pouco sobre a carreira ou formação dele..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white border border-slate-205 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-550 text-sm font-medium text-slate-900"
                ></textarea>
              </div>

              <div>
                <label className="block text-slate-500 uppercase mb-2">
                  Plano Inicial Escolhido
                </label>
                <select
                  value={adminTrainerPlan}
                  onChange={(e) =>
                    setAdminTrainerPlan(
                      e.target.value as "Starter" | "Pro" | "Studio",
                    )
                  }
                  className="w-full px-4 py-2.5 bg-white border border-slate-205 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-550 text-sm font-extrabold text-slate-950 font-sans"
                >
                  <option value="Starter">
                    🏆 Starter — R$ 99,90/mês
                  </option>
                  <option value="Pro">⚡ Pro — R$ 149,90/mês</option>
                  <option value="Studio">
                    👑 Studio — R$ 189,90/mês
                  </option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1 font-light leading-normal">
                  *O plano escolhido dita as liberações de recursos (como
                  inteligência artificial) e volume de alunos do profissional.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddTrainerModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow cursor-pointer transition"
                >
                  Confirmar Credenciamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
