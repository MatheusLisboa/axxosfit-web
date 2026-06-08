import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Toaster } from "sonner";
import { useSubscription } from "../hooks/useSubscription";
import { useStore } from "../services/store";
import { Sidebar, type AppPage } from "./components/layout/Sidebar";
import { BottomNav } from "./components/layout/BottomNav";
import { PageHeader } from "./components/layout/PageHeader";
import { Dashboard } from "./components/dashboard/Dashboard";
import { StudentsPage } from "./components/students/StudentsPage";
import { WorkoutsPage } from "./components/workouts/WorkoutsPage";
import { AssessmentPage } from "./components/assessment/AssessmentPage";
import { FinancialPage } from "./components/financial/FinancialPage";
import { SettingsPage } from "./components/settings/SettingsPage";
import { SuperadminPage } from "./components/superadmin/SuperadminPage";
import { HelpCenterPage } from "./components/help/HelpCenterPage";

export type { AppPage };

const pageMeta: Record<AppPage, { title: string; subtitle: string }> = {
  superadmin: { title: "Superadmin", subtitle: "Gestão global da plataforma" },
  dashboard: { title: "Dashboard", subtitle: "Visão geral do seu negócio" },
  students: { title: "Alunos", subtitle: "Gerenciar e acompanhar sua base" },
  workouts: { title: "Treinos", subtitle: "Criar e gerenciar protocolos" },
  assessment: { title: "Avaliação Física", subtitle: "Métricas e evolução corporal" },
  financial: { title: "Financeiro", subtitle: "Mensalidades e cobranças dos alunos" },
  settings: { title: "Configurações", subtitle: "Conta, plano e preferências" },
  help: { title: "Central de ajuda", subtitle: "Suporte e perguntas frequentes" },
};

export interface TrainerFigmaAppProps {
  userName: string;
  userAvatar?: string;
  planBadge?: string;
  isSuperAdmin?: boolean;
  onLogout: () => void;
}

export function TrainerFigmaApp({
  userName,
  userAvatar,
  planBadge,
  isSuperAdmin = false,
  onLogout,
}: TrainerFigmaAppProps) {
  const [currentPage, setCurrentPage] = useState<AppPage>(isSuperAdmin ? "superadmin" : "dashboard");
  const [settingsSection, setSettingsSection] = useState<"profile" | "plan" | "security">("profile");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [workoutPrefill, setWorkoutPrefill] = useState<{ studentId: string; openCreate: boolean } | null>(null);
  const {
    plan,
    subscription,
    activeStudentsCount,
    isPaymentPending,
    displayBadgeName,
    isLoading: subscriptionLoading,
  } = useSubscription();
  const { students, currentProfile } = useStore();

  const resolvedUserName = currentProfile?.name?.trim() || userName;
  const resolvedUserAvatar = currentProfile?.avatar_url || userAvatar;

  const sidebarActiveStudents = useMemo(() => {
    if (isSuperAdmin) {
      return students.filter((s) => s.status === "active").length;
    }
    if (currentProfile?.role === "trainer") {
      return students.filter(
        (s) => s.trainer_id === currentProfile.id && s.status === "active"
      ).length;
    }
    return activeStudentsCount;
  }, [isSuperAdmin, students, currentProfile, activeStudentsCount]);

  const { title, subtitle } = pageMeta[currentPage];

  const resolvedPlanBadge = (() => {
    if (isSuperAdmin) return planBadge || "Superadmin";
    if (!displayBadgeName) {
      return subscriptionLoading ? "Carregando…" : planBadge || "—";
    }
    if (isPaymentPending) return `${displayBadgeName} (aguardando pagamento)`;
    return subscription?.status === "trial" ? `${displayBadgeName} Trial` : displayBadgeName;
  })();

  const navigateTo = (page: AppPage, settingsTab?: "profile" | "plan" | "security") => {
    if (page === "settings") {
      setSettingsSection(settingsTab ?? "profile");
    }
    setCurrentPage(page);
    setMobileMenuOpen(false);
  };

  const sidebarProps = {
    currentPage,
    onNavigate: navigateTo,
    onLogout,
    userName: resolvedUserName,
    userAvatar: resolvedUserAvatar,
    planBadge: resolvedPlanBadge,
    isSuperAdmin,
    activeStudentsCount: sidebarActiveStudents,
  };

  return (
    <div className="min-h-screen bg-background text-foreground dark">
      <Toaster theme="dark" position="top-right" />

      <Sidebar {...sidebarProps} />

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 h-full z-50 lg:hidden"
            >
              <Sidebar {...sidebarProps} variant="mobile" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex flex-col min-h-screen lg:ml-64 pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
        <PageHeader
          title={title}
          subtitle={subtitle}
          currentPage={currentPage}
          onMenuToggle={() => setMobileMenuOpen(true)}
          userName={resolvedUserName}
          userAvatar={resolvedUserAvatar}
        />

        <main className="flex-1 min-h-0 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="h-full"
            >
              {currentPage === "superadmin" && isSuperAdmin && <SuperadminPage />}
              {currentPage === "dashboard" && <Dashboard onNavigate={navigateTo} />}
              {currentPage === "students" && (
                <StudentsPage
                  isSuperAdmin={isSuperAdmin}
                  onUpgradePlan={() => navigateTo("settings", "plan")}
                  onNavigateToWorkouts={(studentId) => {
                    setWorkoutPrefill({ studentId, openCreate: true });
                    setCurrentPage("workouts");
                  }}
                />
              )}
              {currentPage === "workouts" && (
                <WorkoutsPage
                  initialStudentId={workoutPrefill?.studentId}
                  autoOpenCreate={workoutPrefill?.openCreate}
                  onPrefillConsumed={() => setWorkoutPrefill(null)}
                />
              )}
              {currentPage === "assessment" && <AssessmentPage />}
              {currentPage === "financial" && <FinancialPage />}
              {currentPage === "settings" && (
                <SettingsPage initialSection={settingsSection} onNavigate={navigateTo} />
              )}
              {currentPage === "help" && <HelpCenterPage onNavigate={navigateTo} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <BottomNav
        currentPage={currentPage}
        onNavigate={navigateTo}
        activeStudentsCount={sidebarActiveStudents}
      />
    </div>
  );
}
