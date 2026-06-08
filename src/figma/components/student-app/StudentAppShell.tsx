import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { StudentBottomNav, type StudentTab } from './components/StudentBottomNav';
import { StudentHomePage } from './pages/StudentHomePage';
import { StudentWorkoutPage } from './pages/StudentWorkoutPage';
import { StudentEvolutionPage } from './pages/StudentEvolutionPage';
import { StudentProfilePage } from './pages/StudentProfilePage';

export interface StudentAppShellProps {
  onLogout: () => void;
}

export function StudentAppShell({ onLogout }: StudentAppShellProps) {
  const [tab, setTab] = useState<StudentTab>('home');

  return (
    <div className="min-h-screen bg-background text-foreground dark">
      <main className="mx-auto max-w-lg px-5 pt-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {tab === 'home' && <StudentHomePage onNavigate={setTab} />}
            {tab === 'workout' && <StudentWorkoutPage />}
            {tab === 'evolution' && <StudentEvolutionPage />}
            {tab === 'profile' && <StudentProfilePage onLogout={onLogout} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <StudentBottomNav current={tab} onChange={setTab} />
    </div>
  );
}
