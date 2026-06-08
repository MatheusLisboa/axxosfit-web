import { cn } from "../ui/utils";
import {
  LayoutDashboard, Users, Dumbbell, LineChart,
  CreditCard, Settings, ChevronRight,
  LogOut, HelpCircle, Crown
} from "lucide-react";
import { useSubscription } from "../../../hooks/useSubscription";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Wordmark } from "../../../components/Wordmark";

export type AppPage =
  | "superadmin"
  | "dashboard"
  | "students"
  | "workouts"
  | "assessment"
  | "financial"
  | "settings"
  | "help";

interface SidebarProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  onLogout: () => void;
  userName?: string;
  userAvatar?: string;
  planBadge?: string;
  isSuperAdmin?: boolean;
  /** Alunos ativos do personal (badge dinâmico em "Alunos") */
  activeStudentsCount?: number;
  /** desktop: barra fixa lg+ | mobile: drawer */
  variant?: "desktop" | "mobile";
}

const superAdminNav: { id: AppPage; label: string; icon: typeof Crown; badge?: string }[] = [
  { id: "superadmin", label: "Superadmin", icon: Crown, badge: "Admin" },
];

const navItems: { id: AppPage; label: string; icon: typeof LayoutDashboard; requiresFinancial?: boolean }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "students", label: "Alunos", icon: Users },
  { id: "workouts", label: "Treinos", icon: Dumbbell },
  { id: "assessment", label: "Avaliação Física", icon: LineChart },
  { id: "financial", label: "Financeiro", icon: CreditCard, requiresFinancial: true },
  { id: "settings", label: "Configurações", icon: Settings },
];

function resolveNavBadge(
  id: AppPage,
  activeStudentsCount?: number
): string | undefined {
  if (id === "students" && activeStudentsCount !== undefined) {
    return String(activeStudentsCount);
  }
  return undefined;
}

export function Sidebar({
  currentPage,
  onNavigate,
  onLogout,
  userName,
  userAvatar,
  planBadge = "Pro",
  isSuperAdmin = false,
  activeStudentsCount,
  variant = "desktop",
}: SidebarProps) {
  const displayName = userName ?? "Usuário";
  const { canAccess } = useSubscription();
  const hasFinancial = canAccess("financial");
  const baseItems = isSuperAdmin ? [...superAdminNav, ...navItems] : navItems;
  const items = baseItems.filter((item) => !item.requiresFinancial || hasFinancial);

  return (
    <aside
      className={cn(
        "flex flex-col h-full min-h-screen border-r border-sidebar-border bg-sidebar backdrop-blur-xl",
        variant === "mobile"
          ? "w-[min(100vw-2.5rem,18rem)] max-w-[85vw] shadow-2xl"
          : "hidden lg:flex w-64 fixed left-0 top-0 z-40"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center gap-2 px-5 border-b border-sidebar-border shrink-0 min-w-0">
        <Wordmark size="sm" className="min-w-0 flex-1 max-w-[calc(100%-3rem)]" />
        <Badge variant="primary" className="shrink-0">{planBadge}</Badge>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        <div className="px-2 pb-2 pt-1">
          <span className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest">Menu Principal</span>
        </div>
        {items.map(({ id, label, icon: Icon }) => {
          const active = currentPage === id;
          const badge = resolveNavBadge(id, activeStudentsCount);
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 min-h-11 rounded-lg text-sm transition-all duration-200 group touch-manipulation",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted active:bg-muted"
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0 transition-colors", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              <span className="flex-1 text-left truncate">{label}</span>
              {badge && (
                <Badge
                  variant={badge === "Novo" || badge === "Admin" ? "accent" : "ghost"}
                  className="text-xs shrink-0 tabular-nums"
                >
                  {badge}
                </Badge>
              )}
              {active && <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0" />}
            </button>
          );
        })}
      </nav>

      {/* Help */}
      <div className="px-3 py-2 border-t border-sidebar-border">
        <button
          type="button"
          onClick={() => onNavigate("help")}
          className={cn(
            "w-full flex items-center gap-3 px-3 h-9 rounded-lg text-sm transition-all",
            currentPage === "help"
              ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <HelpCircle className={cn("w-4 h-4 shrink-0", currentPage === "help" && "text-primary")} />
          Central de ajuda
        </button>
      </div>

      {/* User */}
      <div className="px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-sidebar-border pt-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => onNavigate("settings")}
            className={cn(
              "flex flex-1 items-center gap-3 min-h-12 px-2 py-2 rounded-xl hover:bg-muted active:bg-muted transition-all text-left touch-manipulation min-w-0",
              currentPage === "settings" && "bg-sidebar-accent"
            )}
          >
            <Avatar name={displayName} src={userAvatar} size="sm" online className="shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">Plano {planBadge}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 lg:hidden" />
          </button>
          <button
            type="button"
            onClick={onLogout}
            aria-label="Sair"
            className="min-h-11 min-w-11 flex items-center justify-center rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors touch-manipulation shrink-0"
          >
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </aside>
  );
}
