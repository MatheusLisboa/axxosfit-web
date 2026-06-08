import { useEffect, useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../../../services/store';
import { maskPhone } from '../../../lib/masks';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export interface EditStudentModalProps {
  open: boolean;
  studentId: string | null;
  onClose: () => void;
}

export function EditStudentModal({ open, studentId, onClose }: EditStudentModalProps) {
  const { students, profiles, updateStudent } = useStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [objective, setObjective] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [monthlyFee, setMonthlyFee] = useState('');
  const [dueDay, setDueDay] = useState('10');

  useEffect(() => {
    if (!open || !studentId) return;
    const student = students.find((s) => s.id === studentId);
    const profile = profiles.find((p) => p.id === studentId);
    if (!student) return;
    setName(profile?.name || '');
    setPhone(profile?.phone || student.phone || '');
    setObjective(student.objective || '');
    setStatus(student.status === 'inactive' ? 'inactive' : 'active');
    setHeight(String(student.current_height || student.initial_height || ''));
    setWeight(String(student.current_weight || student.initial_weight || ''));
    setMonthlyFee(student.monthly_fee ? String(student.monthly_fee) : '');
    setDueDay(String(student.due_day || 10));
  }, [open, studentId, students, profiles]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!studentId || !name.trim()) {
      toast.error('Informe o nome do aluno.');
      return;
    }
    updateStudent(studentId, {
      name: name.trim(),
      phone,
      objective: objective.trim(),
      status,
      current_height: Number(height) || undefined,
      current_weight: Number(weight) || undefined,
      monthly_fee: Number(monthlyFee.replace(',', '.')) || 0,
      due_day: Number(dueDay) || 10,
    });
    toast.success('Aluno atualizado com sucesso.');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && studentId && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-popover p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-foreground">Editar aluno</h2>
                <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-muted">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} fullWidth required />
                <Input
                  label="Telefone / WhatsApp"
                  value={phone}
                  onChange={(e) => setPhone(maskPhone(e.target.value))}
                  fullWidth
                />
                <Input
                  label="Objetivo"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  fullWidth
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Altura (cm)"
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    fullWidth
                  />
                  <Input
                    label="Peso (kg)"
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    fullWidth
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Mensalidade (R$)"
                    type="number"
                    min={0}
                    step="0.01"
                    value={monthlyFee}
                    onChange={(e) => setMonthlyFee(e.target.value)}
                    fullWidth
                  />
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Dia do vencimento</label>
                    <select
                      value={dueDay}
                      onChange={(e) => setDueDay(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-border bg-input-background text-sm text-foreground"
                    >
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={String(d)}>Dia {d}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as typeof status)}
                    className="w-full h-11 px-3 rounded-xl border border-border bg-input-background text-sm text-foreground"
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" fullWidth onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="primary" fullWidth>
                    Salvar
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
