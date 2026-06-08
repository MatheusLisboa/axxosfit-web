import { cn } from "../ui/utils";
import { LayoutDashboard, Users, Dumbbell, LineChart, CreditCard, Settings } from "lucide-react";
import { useSubscription } from "../../../hooks/useSubscription";
import type { AppPage } from "./Sidebar";

interface BottomNavProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  activeStudentsCount?: number;
}

export function BottomNav({ currentPage, onNavigate, activeStudentsCount }: BottomNavProps) {
  const { canAccess } = useSubscription();
  const hasFinancial = canAccess("financial");

  const tabs: { id: AppPage; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "dashboard", label: "Início", icon: LayoutDashboard },
    { id: "students", label: "Alunos", icon: Users },
    { id: "workouts", label: "Treinos", icon: Dumbbell },
    ...(hasFinancial
      ? [{ id: "financial" as AppPage, label: "Finanças", icon: CreditCard }]
      : [{ id: "assessment" as AppPage, label: "Avaliação", icon: LineChart }]),
    { id: "settings", label: "Config", icon: Settings },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch justify-around min-h-16 px-1">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = currentPage === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl transition-all duration-200 min-w-0 flex-1 touch-manipulation",
                active ? "text-primary" : "text-muted-foreground active:opacity-80"
              )}
            >
              <div className={cn("relative p-2 rounded-xl transition-all duration-200", active && "bg-primary/15")}>
                <Icon className="w-5 h-5" />
                {id === "students" && activeStudentsCount !== undefined && (
                  <span className="absolute -top-1 -right-1 min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center tabular-nums">
                    {activeStudentsCount > 99 ? "99+" : activeStudentsCount}
                  </span>
                )}
              </div>
              <span className={cn("text-[10px] sm:text-xs font-medium transition-all truncate max-w-full px-0.5", active ? "opacity-100" : "opacity-60")}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
