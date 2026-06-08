import type { ReactNode } from "react";
import { Menu } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import type { AppPage } from "./Sidebar";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  currentPage?: AppPage;
  onMenuToggle?: () => void;
  userName?: string;
  userAvatar?: string;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  onMenuToggle,
  userName,
  userAvatar,
}: PageHeaderProps) {
  return (
    <header className="min-h-14 sm:min-h-16 flex items-center justify-between gap-2 px-3 sm:px-4 lg:px-8 border-b border-border bg-background/95 backdrop-blur-xl sticky top-0 z-30 shrink-0 pt-[env(safe-area-inset-top)]">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <button
          type="button"
          onClick={onMenuToggle}
          aria-label="Abrir menu"
          className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-muted active:bg-muted transition-colors touch-manipulation shrink-0"
        >
          <Menu className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-bold text-foreground text-base sm:text-lg leading-tight truncate">{title}</h1>
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate max-sm:hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {actions}
        <div className="hidden lg:block">
          <Avatar name={userName} src={userAvatar} size="sm" />
        </div>
      </div>
    </header>
  );
}
