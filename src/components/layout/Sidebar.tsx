import React from 'react';
import { LucideIcon, X, Search, HelpCircle, Bell, LogOut, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Logo } from './Logo';
import { Badge, Avatar } from '../ui';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  highlight?: boolean;
}

interface SidebarProps {
  items: NavItem[];
  activeId: string;
  onNavigate: (id: string) => void;
  userName?: string;
  userPlan?: string;
  userAvatar?: string;
  planBadge?: string;
  onLogout?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  className?: string;
}

export function Sidebar({
  items,
  activeId,
  onNavigate,
  userName,
  userPlan,
  userAvatar,
  planBadge,
  onLogout,
  mobileOpen = false,
  onMobileClose,
  className,
}: SidebarProps) {
  const shellClass = cn(
    'flex flex-col w-[var(--sidebar-width)] h-screen border-r border-sidebar-border bg-sidebar backdrop-blur-xl shrink-0',
    className
  );

  const navContent = (
    <>
      <div className="h-16 flex items-center px-5 border-b border-sidebar-border shrink-0">
        <Logo showBadge={!!planBadge} badgeLabel={planBadge} />
      </div>

      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2.5 h-9 px-3 rounded-lg bg-muted border border-border cursor-pointer hover:border-primary/40 transition-colors">
          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground">Buscar...</span>
          <kbd className="ml-auto text-xs text-muted-foreground/60 font-mono bg-muted-foreground/10 px-1.5 py-0.5 rounded hidden sm:inline">
            ⌘K
          </kbd>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 touch-momentum">
        <div className="px-2 pb-2 pt-1">
          <span className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest">
            Menu Principal
          </span>
        </div>
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeId === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                onMobileClose?.();
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 h-10 rounded-lg text-sm transition-all duration-200 group cursor-pointer',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                  : item.highlight
                    ? 'text-accent hover:bg-muted'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 shrink-0 transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                )}
              />
              <span className="flex-1 text-left truncate">{item.label}</span>
              {item.badge && (
                <Badge variant={item.badge === 'Novo' ? 'accent' : 'ghost'} className="text-[10px] py-0">
                  {item.badge}
                </Badge>
              )}
              {active && <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0" />}
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-2 border-t border-sidebar-border">
        <button className="w-full flex items-center gap-3 px-3 h-9 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
          <HelpCircle className="w-4 h-4 shrink-0" />
          Central de ajuda
        </button>
      </div>

      {userName && (
        <div className="px-3 pb-4 border-t border-sidebar-border pt-3">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-muted transition-all group">
            <Avatar src={userAvatar} name={userName} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{userName}</p>
              <p className="text-xs text-muted-foreground truncate">{userPlan || 'Personal'}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="p-1.5 rounded-lg hover:bg-muted-foreground/10 transition-colors"
                aria-label="Notificações"
              >
                <Bell className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
                  aria-label="Sair"
                >
                  <LogOut className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      <aside className={cn('hidden lg:flex fixed left-0 top-0 z-40', shellClass)}>{navContent}</aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onMobileClose} />
          <aside className={cn('absolute left-0 top-0 h-full z-50 animate-slide-in-left', shellClass)}>
            <button
              onClick={onMobileClose}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg z-10"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
