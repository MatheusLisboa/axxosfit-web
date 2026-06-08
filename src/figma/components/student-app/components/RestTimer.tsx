import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { PremiumSurface } from './PremiumSurface';
import { Button } from '../../ui/Button';

export function RestTimer({ seconds, onComplete }: { seconds: number; onComplete: () => void }) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    setTimeLeft(seconds);
    setRunning(true);
  }, [seconds]);

  useEffect(() => {
    if (!running) return;
    if (timeLeft === 0) {
      onComplete();
      return;
    }
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, running, onComplete]);

  const pct = seconds > 0 ? ((seconds - timeLeft) / seconds) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-6"
    >
      <PremiumSurface className="p-8 text-center max-w-xs w-full">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-8">Descanso</p>
        <div className="relative w-36 h-36 mx-auto mb-8">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="currentColor"
              className="text-primary"
              strokeWidth="2"
              strokeDasharray={`${pct} ${100 - pct}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-light tabular-nums tracking-tight">{timeLeft}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            fullWidth
            icon={running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            onClick={() => setRunning(!running)}
          >
            {running ? 'Pausar' : 'Retomar'}
          </Button>
          <Button variant="ghost" icon={<RotateCcw className="w-4 h-4" />} onClick={onComplete}>
            Pular
          </Button>
        </div>
      </PremiumSurface>
    </motion.div>
  );
}
