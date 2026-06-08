import { LogOut, Target, Mail } from 'lucide-react';
import { useStudentData } from '../hooks/useStudentData';
import { PremiumSurface } from '../components/PremiumSurface';
import { Avatar } from '../../ui/Avatar';
import { Button } from '../../ui/Button';

interface StudentProfilePageProps {
  onLogout: () => void;
}

export function StudentProfilePage({ onLogout }: StudentProfilePageProps) {
  const { studentProfile, studentName, currentStudent, trainer, score } = useStudentData();

  return (
    <div className="space-y-6">
      <header className="flex flex-col items-center text-center pt-4 pb-2">
        <Avatar name={studentName} src={studentProfile?.avatar_url} size="xl" online />
        <h1 className="text-2xl font-semibold tracking-tight mt-4">{studentName}</h1>
        <p className="text-sm text-muted-foreground mt-1">Atleta AxxosFit</p>
      </header>

      <PremiumSurface className="p-5 space-y-4">
        {studentProfile?.email && (
          <div className="flex items-center gap-3 text-sm">
            <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground truncate">{studentProfile.email}</span>
          </div>
        )}
        {currentStudent?.objective && (
          <div className="flex items-start gap-3 text-sm">
            <Target className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <span className="text-foreground/90">{currentStudent.objective}</span>
          </div>
        )}
        {score && (
          <div className="pt-3 border-t border-white/[0.06] grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-light">{score.streakDays}</p>
              <p className="text-xs text-muted-foreground">Dias seguidos</p>
            </div>
            <div>
              <p className="text-2xl font-light">{score.totalWorkoutsCompleted}</p>
              <p className="text-xs text-muted-foreground">Sessões</p>
            </div>
          </div>
        )}
      </PremiumSurface>

      {trainer && (
        <PremiumSurface className="p-5 flex items-center gap-4">
          <Avatar name={trainer.name} src={trainer.avatarUrl} size="md" />
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Personal</p>
            <p className="font-semibold">{trainer.name}</p>
          </div>
        </PremiumSurface>
      )}

      <Button
        variant="outline"
        fullWidth
        icon={<LogOut className="w-4 h-4" />}
        className="h-12 text-muted-foreground hover:text-destructive hover:border-destructive/30"
        onClick={onLogout}
      >
        Sair da conta
      </Button>
    </div>
  );
}
