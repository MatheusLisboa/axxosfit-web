import { Trophy, Star } from 'lucide-react';
import { useStudentData } from '../hooks/useStudentData';
import { PremiumSurface } from '../components/PremiumSurface';
import { Badge } from '../../ui/Badge';

export function StudentEvolutionPage() {
  const { score, bodyStats, loadEvolution, myLogs, userAchievements, sessionsThisWeek } = useStudentData();

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Sua jornada</p>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">Evolução</h1>
      </header>

      {score && (
        <div className="grid grid-cols-2 gap-3">
          <PremiumSurface className="p-5 text-center">
            <p className="text-3xl font-light tabular-nums">{sessionsThisWeek}</p>
            <p className="text-xs text-muted-foreground mt-1">Treinos na semana</p>
          </PremiumSurface>
          <PremiumSurface className="p-5 text-center">
            <p className="text-3xl font-light tabular-nums">Nível {score.level}</p>
            <p className="text-xs text-muted-foreground mt-1">{score.totalPoints} pontos</p>
          </PremiumSurface>
        </div>
      )}

      {bodyStats && (
        <PremiumSurface className="p-5 space-y-4">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Corpo</p>
          <div className="space-y-3">
            <div className="flex justify-between items-end border-b border-white/[0.06] pb-3">
              <span className="text-sm text-muted-foreground">Peso</span>
              <span className="text-lg font-semibold tabular-nums">
                {bodyStats.initialWeight} → {bodyStats.currentWeight} kg
              </span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-sm text-muted-foreground">% Gordura</span>
              <span className="text-lg font-semibold tabular-nums">
                {bodyStats.initialBf ?? '—'} → {bodyStats.currentBf ?? '—'}%
              </span>
            </div>
          </div>
        </PremiumSurface>
      )}

      {loadEvolution.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground px-1">Carga por exercício</p>
          {loadEvolution.map((item) => (
            <div key={item.name}>
            <PremiumSurface className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">{item.name}</p>
                <Badge variant={item.delta > 0 ? 'success' : 'ghost'}>
                  {item.delta > 0 ? `+${item.delta} kg` : item.delta < 0 ? `${item.delta} kg` : '—'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Recorde: <span className="text-foreground font-medium">{item.maxLoad} kg</span>
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {item.sorted.slice(-5).map((entry, idx) => (
                  <span
                    key={`${entry.date}-${idx}`}
                    className="text-[10px] px-2.5 py-1 rounded-full bg-muted/80 text-muted-foreground"
                  >
                    {new Date(entry.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} · {entry.load}kg
                  </span>
                ))}
              </div>
            </PremiumSurface>
            </div>
          ))}
        </div>
      ) : (
        <PremiumSurface className="p-8 text-center text-sm text-muted-foreground">
          Complete séries com carga para ver sua evolução aqui.
        </PremiumSurface>
      )}

      {userAchievements.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground px-1 flex items-center gap-2">
            <Trophy className="w-3.5 h-3.5" /> Conquistas
          </p>
          <div className="grid grid-cols-2 gap-3">
            {userAchievements.map((a) => (
              <div key={a.id}>
              <PremiumSurface className="p-4 text-center">
                <Star className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                <p className="text-sm font-medium">{a.title}</p>
                <Badge variant="accent" className="mt-2 text-[10px]">+{a.score_points}</Badge>
              </PremiumSurface>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground pb-2">
        {myLogs.length} registros no histórico
      </p>
    </div>
  );
}
