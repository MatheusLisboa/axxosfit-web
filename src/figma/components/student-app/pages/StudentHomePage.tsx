import { Flame, ChevronRight } from 'lucide-react';
import { PremiumSurface } from '../components/PremiumSurface';
import { useStudentData } from '../hooks/useStudentData';
import { getMotivationalQuote, getTimeGreeting } from '../lib/studentCopy';
import { Avatar } from '../../ui/Avatar';
import type { StudentTab } from '../components/StudentBottomNav';

interface StudentHomePageProps {
  onNavigate: (tab: StudentTab) => void;
}

export function StudentHomePage({ onNavigate }: StudentHomePageProps) {
  const {
    firstName,
    activeWorkout,
    todayDay,
    sessionsThisWeek,
    weekFrequency,
    trainer,
    bodyStats,
  } = useStudentData();

  const greeting = getTimeGreeting();
  const quote = getMotivationalQuote();

  return (
    <div className="space-y-6">
      <header className="pt-2 pb-1">
        <p className="text-sm text-muted-foreground font-medium tracking-wide">
          {greeting}, {firstName} 👋
        </p>
        <h1 className="text-3xl font-semibold tracking-tight mt-1 text-foreground">
          Pronto para evoluir?
        </h1>
      </header>

      <PremiumSurface delay={0.05} className="p-6 overflow-hidden relative">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Seu treino de hoje</p>
        <p className="text-2xl font-semibold tracking-tight mt-2 text-foreground">
          {activeWorkout?.name || 'Aguardando treino'}
        </p>
        {todayDay && (
          <p className="text-sm text-muted-foreground mt-1">{todayDay.day_name}</p>
        )}
        <button
          type="button"
          onClick={() => onNavigate('workout')}
          disabled={!activeWorkout}
          className="mt-6 w-full h-14 rounded-2xl bg-foreground text-background font-bold text-sm tracking-[0.12em] uppercase transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Iniciar treino
        </button>
      </PremiumSurface>

      <PremiumSurface delay={0.1} className="p-5 flex items-center gap-4">
        <div className="w-11 h-11 rounded-2xl bg-amber-500/15 flex items-center justify-center shrink-0">
          <Flame className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Esta semana</p>
          <p className="text-lg font-semibold tracking-tight">
            Você treinou {sessionsThisWeek} {sessionsThisWeek === 1 ? 'vez' : 'vezes'} 🔥
          </p>
        </div>
      </PremiumSurface>

      {bodyStats && (
        <PremiumSurface delay={0.15} className="p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-4">Evolução</p>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Peso</p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg text-muted-foreground tabular-nums">{bodyStats.initialWeight}kg</span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-2xl font-semibold tabular-nums">{bodyStats.currentWeight}kg</span>
              </div>
              {bodyStats.weightDelta !== 0 && (
                <p className={`text-xs mt-1 ${bodyStats.weightDelta < 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {bodyStats.weightDelta > 0 ? '+' : ''}{bodyStats.weightDelta} kg
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Gordura (%)</p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg text-muted-foreground tabular-nums">
                  {bodyStats.initialBf != null ? `${bodyStats.initialBf}%` : '—'}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-2xl font-semibold tabular-nums">
                  {bodyStats.currentBf != null ? `${bodyStats.currentBf}%` : '—'}
                </span>
              </div>
            </div>
          </div>
        </PremiumSurface>
      )}

      <PremiumSurface delay={0.2} className="p-5">
        <p className="text-base font-medium leading-relaxed text-foreground/90 italic">&ldquo;{quote}&rdquo;</p>
      </PremiumSurface>

      <PremiumSurface delay={0.25} className="p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-4">Frequência</p>
        <div className="flex justify-between gap-1">
          {weekFrequency.map(({ label, trained, isToday }) => (
            <div key={label} className="flex flex-col items-center gap-2 flex-1">
              <span className={`text-[10px] font-semibold tracking-wider ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                {label}
              </span>
              <span
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm ${
                  trained
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-muted/60 text-muted-foreground/50'
                } ${isToday ? 'ring-1 ring-primary/30' : ''}`}
              >
                {trained ? '✓' : '·'}
              </span>
            </div>
          ))}
        </div>
      </PremiumSurface>

      {trainer && (
        <PremiumSurface delay={0.3} className="p-5 flex items-center gap-4">
          <Avatar name={trainer.name} src={trainer.avatarUrl} size="md" />
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Seu personal</p>
            <p className="text-lg font-semibold truncate">{trainer.name}</p>
          </div>
        </PremiumSurface>
      )}
    </div>
  );
}
