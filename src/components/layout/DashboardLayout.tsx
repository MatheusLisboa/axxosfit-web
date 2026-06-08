import React, { useState } from 'react';
import { Bell, Menu, Search } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Sidebar, NavItem } from './Sidebar';
import { MobileNav, MobileNavItem } from './MobileNav';
import { Avatar, Toast } from '../ui';

interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  navItems: NavItem[];
  mobileNavItems?: MobileNavItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  userName?: string;
  userAvatar?: string;
  userPlan?: string;
  planBadge?: string;
  notificationCount?: number;
  notificationsPanel?: React.ReactNode;
  headerActions?: React.ReactNode;
  onLogout?: () => void;
  toast?: string | null;
  toastIcon?: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardLayout({
  title,
  subtitle,
  navItems,
  mobileNavItems,
  activeTab,
  onTabChange,
  userName,
  userAvatar,
  userPlan,
  planBadge,
  notificationCount = 0,
  notificationsPanel,
  headerActions,
  onLogout,
  toast,
  toastIcon,
  children,
}: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const bottomNav =
    mobileNavItems ||
    navItems.map(({ id, label, icon }) => ({
      id,
      label,
      icon,
      showDot: id === 'upgrades',
    }));

  return (
    <div className="min-h-screen bg-background text-foreground dark">
      <Sidebar
        items={navItems}
        activeId={activeTab}
        onNavigate={onTabChange}
        userName={userName}
        userAvatar={userAvatar}
        userPlan={userPlan}
        planBadge={planBadge}
        onLogout={onLogout}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div className="lg:ml-[var(--sidebar-width)] flex flex-col min-h-screen">
        <header className="h-[var(--header-height)] flex items-center justify-between px-4 lg:px-8 border-b border-border bg-background/95 backdrop-blur-xl sticky top-0 z-30 shrink-0 pt-safe">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="min-w-0">
              <h1 className="font-bold text-foreground text-lg leading-none truncate">{title}</h1>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {headerActions}
            <button
              type="button"
              className="hidden md:flex items-center gap-2 h-9 px-3 rounded-xl bg-muted border border-border text-xs text-muted-foreground hover:border-primary/40 transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Buscar</span>
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl hover:bg-muted transition-colors"
                aria-label="Notificações"
              >
                <Bell className="w-[18px] h-[18px] text-muted-foreground" />
                {notificationCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
                )}
              </button>
              {showNotifications && notificationsPanel && (
                <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-popover border border-border rounded-2xl shadow-xl z-50 animate-slide-up overflow-hidden">
                  {notificationsPanel}
                </div>
              )}
            </div>
            {userName && (
              <div className="hidden lg:block">
                <Avatar src={userAvatar} name={userName} size="sm" />
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-auto pb-[calc(var(--mobile-nav-height)+1rem)] lg:pb-8 touch-momentum">
          <div className="p-4 lg:p-8 animate-fade-in">{children}</div>
        </main>
      </div>

      <MobileNav items={bottomNav} activeId={activeTab} onNavigate={onTabChange} />

      {toast && <Toast message={toast} icon={toastIcon} />}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6',
        className
      )}
    >
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-tight">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
