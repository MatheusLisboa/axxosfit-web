import { Home, Dumbbell, TrendingUp, User } from 'lucide-react';
import { cn } from '../../ui/utils';

export type StudentTab = 'home' | 'workout' | 'evolution' | 'profile';

const tabs: { id: StudentTab; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'workout', label: 'Treino', icon: Dumbbell },
  { id: 'evolution', label: 'Evolução', icon: TrendingUp },
  { id: 'profile', label: 'Perfil', icon: User },
];

interface StudentBottomNavProps {
  current: StudentTab;
  onChange: (tab: StudentTab) => void;
}

export function StudentBottomNav({ current, onChange }: StudentBottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.06] bg-background/90 backdrop-blur-2xl pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-lg flex items-stretch justify-around min-h-[4.25rem] px-2">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = current === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 touch-manipulation transition-colors',
                active ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              <div
                className={cn(
                  'p-2.5 rounded-2xl transition-all duration-300',
                  active && 'bg-primary/15 text-primary'
                )}
              >
                <Icon className="w-5 h-5" strokeWidth={active ? 2.25 : 1.75} />
              </div>
              <span className={cn('text-[10px] font-medium tracking-wide', active && 'text-foreground')}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
