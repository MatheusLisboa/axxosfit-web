import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface MobileNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  showDot?: boolean;
}

interface MobileNavProps {
  items: MobileNavItem[];
  activeId: string;
  onNavigate: (id: string) => void;
}

export function MobileNav({ items, activeId, onNavigate }: MobileNavProps) {
  const tabs = items.slice(0, 5);

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-xl pb-safe"
      aria-label="Navegação principal"
    >
      <div className="flex items-center justify-around h-[var(--mobile-nav-height)] px-2">
        {tabs.map(({ id, label, icon: Icon, showDot }) => {
          const active = activeId === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-0 flex-1 cursor-pointer',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <div className={cn('relative p-2 rounded-xl transition-all', active && 'bg-primary/15')}>
                <Icon className="w-5 h-5" />
                {showDot && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent" />
                )}
              </div>
              <span className={cn('text-xs font-medium', active ? 'opacity-100' : 'opacity-60')}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
