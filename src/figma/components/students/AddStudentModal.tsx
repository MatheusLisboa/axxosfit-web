import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../../../services/store';
import type { CreateStudentInput } from '../../../types';
import { maskCPF, maskPhone, maskCEP, maskDateBR, dateBRToISO } from '../../../lib/masks';
import { useSubscription } from '../../../hooks/useSubscription';
import { formatStudentLimit, isUnlimitedStudents } from '../../../lib/plans';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export interface AddStudentModalProps {
  open: boolean;
  onClose: () => void;
  /** Superadmin: lista de personais para vincular o aluno */
  trainerOptions?: { id: string; name: string }[];
  defaultTrainerId?: string;
}

export function AddStudentModal({
  open,
  onClose,
  trainerOptions,
  defaultTrainerId,
}: AddStudentModalProps) {
  const { createStudent, isLoading } = useStore();
  const { plan, activeStudentsCount, canCreateStudent, remainingStudentsCount } = useSubscription();
  const isSuperAdminFlow = Boolean(trainerOptions?.length);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [objective, setObjective] = useState('');
  const [monthlyFee, setMonthlyFee] = useState('');
  const [dueDay, setDueDay] = useState('10');
  const [trainerId, setTrainerId] = useState(defaultTrainerId || '');

  const reset = () => {
    setName('');
    setEmail('');
    setPhone('');
    setCpf('');
    setBirthdate('');
    setCep('');
    setStreet('');
    setNumber('');
    setObjective('');
    setMonthlyFee('');
    setDueDay('10');
    setTrainerId(defaultTrainerId || '');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload: CreateStudentInput = {
      name,
      email,
      phone,
      cpf,
      birthdate: birthdate.includes('/') ? dateBRToISO(birthdate) : birthdate,
      cep,
      street,
      number,
      objective: objective || 'Saúde e condicionamento',
      monthly_fee: Number(monthlyFee.replace(',', '.')) || 0,
      due_day: Number(dueDay) || 10,
      trainer_id: trainerOptions?.length ? trainerId : undefined,
    };
    if (!isSuperAdminFlow && !canCreateStudent) {
      toast.error('Limite de alunos atingido no seu plano atual.');
      return;
    }

    const result = await createStudent(payload);
    if (result.success) {
      toast.success(result.message || 'Aluno cadastrado', {
        description: result.temporaryPassword
          ? `Senha provisória: ${result.temporaryPassword}`
          : undefined,
      });
      reset();
      onClose();
    } else {
      toast.error(result.message || 'Não foi possível cadastrar o aluno');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-popover p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-foreground">Novo aluno</h2>
                <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-muted">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {trainerOptions && trainerOptions.length > 0 && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Personal responsável</label>
                    <select
                      value={trainerId}
                      onChange={(e) => setTrainerId(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-border bg-input-background text-sm text-foreground"
                      required
                    >
                      <option value="">Selecione…</option>
                      {trainerOptions.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <Input label="Nome completo" value={name} onChange={(e) => setName(e.target.value)} fullWidth required />
                <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth required />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Telefone"
                    value={phone}
                    onChange={(e) => setPhone(maskPhone(e.target.value))}
                    placeholder="(11) 99999-9999"
                    fullWidth
                  />
                  <Input
                    label="CPF"
                    value={cpf}
                    onChange={(e) => setCpf(maskCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    fullWidth
                  />
                </div>
                <Input
                  label="Data de nascimento"
                  value={birthdate}
                  onChange={(e) => setBirthdate(maskDateBR(e.target.value))}
                  placeholder="dd/mm/aaaa"
                  fullWidth
                />
                <Input
                  label="CEP"
                  value={cep}
                  onChange={(e) => setCep(maskCEP(e.target.value))}
                  placeholder="00000-000"
                  fullWidth
                />
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Input label="Endereço" value={street} onChange={(e) => setStreet(e.target.value)} fullWidth />
                  </div>
                  <Input label="Nº" value={number} onChange={(e) => setNumber(e.target.value)} fullWidth />
                </div>
                <Input
                  label="Objetivo"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="Ex: Hipertrofia"
                  fullWidth
                />

                <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-3">
                  <p className="text-xs font-semibold text-foreground">Financeiro do aluno</p>
                  <p className="text-xs text-muted-foreground -mt-2">
                    Usado no controle financeiro (plano Pro/Studio) para cobranças e vencimentos.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Mensalidade (R$)"
                      type="number"
                      min={0}
                      step="0.01"
                      value={monthlyFee}
                      onChange={(e) => setMonthlyFee(e.target.value)}
                      placeholder="199,90"
                      fullWidth
                    />
                    <div>
                      <label className="text-sm font-medium text-foreground">Dia do vencimento</label>
                      <select
                        value={dueDay}
                        onChange={(e) => setDueDay(e.target.value)}
                        className="mt-1.5 w-full h-11 px-3 rounded-xl border border-border bg-input-background text-sm text-foreground"
                      >
                        {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={String(d)}>
                            Dia {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {!isSuperAdminFlow && plan && (
                  <p className="text-xs text-muted-foreground">
                    Alunos ativos: <strong className="text-foreground">{activeStudentsCount}</strong>
                    {isUnlimitedStudents(plan.max_students)
                      ? ' — plano ilimitado'
                      : (
                        <>
                          {' '}de <strong className="text-foreground">{plan.max_students}</strong>
                          {!canCreateStudent
                            ? ' — limite atingido'
                            : ` — restam ${remainingStudentsCount}`}
                        </>
                      )}
                  </p>
                )}

                <p className="text-xs text-muted-foreground">
                  Senha provisória: <strong className="text-foreground">axiosfit</strong> (primeiro acesso).
                  O aluno não paga — apenas o personal assina o plano.
                </p>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" fullWidth onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="primary" fullWidth loading={isLoading}>
                    Cadastrar
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
