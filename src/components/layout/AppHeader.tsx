import React, { useState } from 'react';
import { Bell, LogOut, Menu } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Logo } from './Logo';
import { Avatar, Badge } from '../ui';

interface AppHeaderProps {
  subtitle?: string;
  userName?: string;
  userAvatar?: string;
  planBadge?: { label: string; className?: string };
  notificationCount?: number;
  onNotificationsClick?: () => void;
  notificationsPanel?: React.ReactNode;
  onLogout?: () => void;
  onMenuClick?: () => void;
  rightContent?: React.ReactNode;
  className?: string;
}

export function AppHeader({
  subtitle,
  userName,
  userAvatar,
  planBadge,
  notificationCount = 0,
  onNotificationsClick,
  notificationsPanel,
  onLogout,
  onMenuClick,
  rightContent,
  className,
}: AppHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  const handleNotifClick = () => {
    setShowNotifications(!showNotifications);
    onNotificationsClick?.();
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 pt-safe',
        className
      )}
    >
      <div className="h-[var(--header-height)] max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 -ml-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <Logo subtitle={subtitle} size="sm" className="hidden sm:flex" />
          <Logo size="sm" className="sm:hidden" />
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {rightContent}

          {(onNotificationsClick || notificationsPanel) && (
            <div className="relative">
              <button
                onClick={handleNotifClick}
                className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
                aria-label="Notificações"
              >
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </button>
              {showNotifications && notificationsPanel && (
                <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-2xl shadow-lg z-50 animate-slide-up">
                  {notificationsPanel}
                </div>
              )}
            </div>
          )}

          {userName && (
            <div className="hidden md:flex items-center gap-2.5 border-l border-slate-200 pl-3">
              <Avatar src={userAvatar} name={userName} size="sm" />
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-800 truncate max-w-[120px]">{userName}</span>
                  {planBadge && (
                    <Badge variant="brand" className={planBadge.className}>
                      {planBadge.label}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {onLogout && (
            <button
              onClick={onLogout}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
              title="Sair"
              aria-label="Sair"
            >
              <LogOut className="w-[18px] h-[18px]" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
