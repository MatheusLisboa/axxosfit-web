import { motion } from 'motion/react';
import { PremiumSurface } from './PremiumSurface';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';

export type PendingSet = {
  key: string;
  exName: string;
  setIdx: number;
  weId: string;
  prescribedLoad: number;
  reps: string;
  restSeconds: number;
};

interface SetLoadModalProps {
  pending: PendingSet;
  loadInput: string;
  repsInput: string;
  onLoadChange: (v: string) => void;
  onRepsChange: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SetLoadModal({
  pending,
  loadInput,
  repsInput,
  onLoadChange,
  onRepsChange,
  onConfirm,
  onCancel,
}: SetLoadModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ y: 32 }}
        animate={{ y: 0 }}
        exit={{ y: 32 }}
        className="w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <PremiumSurface className="p-6 space-y-5 rounded-t-3xl sm:rounded-3xl">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Série {pending.setIdx + 1}</p>
            <p className="text-xl font-semibold tracking-tight mt-1">{pending.exName}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Carga (kg)"
              type="number"
              min={0}
              step="0.5"
              value={loadInput}
              onChange={(e) => onLoadChange(e.target.value)}
              fullWidth
            />
            <Input
              label="Reps"
              type="number"
              min={1}
              value={repsInput}
              onChange={(e) => onRepsChange(e.target.value)}
              fullWidth
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Prescrito: {pending.reps}
            {pending.prescribedLoad > 0 ? ` · ${pending.prescribedLoad} kg` : ''}
          </p>
          <Button variant="primary" size="lg" fullWidth onClick={onConfirm} className="h-14 text-base font-semibold tracking-wide">
            Concluir série
          </Button>
        </PremiumSurface>
      </motion.div>
    </motion.div>
  );
}
