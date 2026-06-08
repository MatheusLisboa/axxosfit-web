import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, Plus, Filter, MoreHorizontal, Phone, Mail,
  ChevronRight, TrendingUp, Clock, X, Edit, Trash2,
  MessageCircle, FileText, Star, UserX, UserCheck
} from "lucide-react";
import { useStore } from "../../../services/store";
import { nextDueDateFromDay, formatBRL } from "../../../lib/financeUtils";
import { GlassCard } from "../ui/GlassCard";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Avatar } from "../ui/Avatar";
import { toast } from "sonner";
import { AddStudentModal } from "./AddStudentModal";
import { EditStudentModal } from "./EditStudentModal";
import { PlanStudentLimit } from "../plans/PlanStudentLimit";
import { useSubscription } from "../../../hooks/useSubscription";

type StudentRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan: string;
  status: "active" | "overdue" | "paused";
  progress: number;
  weight: string;
  goal: string;
  joined: string;
  nextPayment: string;
  streak: number;
  sessions: number;
};

function mapStatus(s: string): StudentRow["status"] {
  if (s === "inactive" || s === "paused") return "paused";
  if (s === "overdue") return "overdue";
  return "active";
}

interface StudentDrawerProps {
  student: StudentRow | null;
  onClose: () => void;
  onEdit: (studentId: string) => void;
  onRemove: (studentId: string, studentName: string) => void;
  onOpenWorkout: (studentId: string) => void;
  onToggleActive: (studentId: string, studentName: string, activate: boolean) => void;
}

function StudentDrawer({ student, onClose, onEdit, onRemove, onOpenWorkout, onToggleActive }: StudentDrawerProps) {
  const { students } = useStore();
  const studentRecord = students.find((s) => s.id === student?.id);
  const isActive = studentRecord?.status === "active";
  const monthlyFee = studentRecord?.monthly_fee;
  const dueDay = studentRecord?.due_day || 10;
  const nextDue = monthlyFee && monthlyFee > 0
    ? new Date(nextDueDateFromDay(dueDay) + "T12:00:00").toLocaleDateString("pt-BR")
    : null;

  const handleWhatsApp = () => {
    if (!student?.phone) {
      toast.error("Este aluno não tem telefone cadastrado.");
      return;
    }
    const digits = student.phone.replace(/\D/g, "");
    const url = `https://wa.me/55${digits}?text=${encodeURIComponent(`Olá ${student.name}, tudo bem?`)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (!student) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-popover border-l border-border z-50 overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between p-5 border-b border-border bg-popover/95 backdrop-blur-xl">
          <h2 className="font-bold text-foreground">Perfil do Aluno</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <div className="p-5 space-y-6">
          <div className="flex items-center gap-4">
            <Avatar name={student.name} size="xl" />
            <div>
              <h3 className="font-bold text-lg text-foreground">{student.name}</h3>
              <p className="text-sm text-muted-foreground">{student.goal}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="primary">{student.plan}</Badge>
                <Badge variant={isActive ? "success" : "warning"} dot>
                  {isActive ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Progresso", value: `${student.progress}%`, icon: TrendingUp },
              { label: "Peso atual", value: student.weight, icon: Star },
              { label: "Sequência", value: `${student.streak} dias`, icon: Clock },
              { label: "Sessões", value: String(student.sessions), icon: FileText },
            ].map(({ label, value, icon: Icon }) => (
              <GlassCard key={label} className="p-3 text-center">
                <Icon className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </GlassCard>
            ))}
          </div>
          {(monthlyFee && monthlyFee > 0) && (
            <GlassCard className="p-3">
              <p className="text-xs text-muted-foreground">Mensalidade</p>
              <p className="text-lg font-bold text-foreground">{formatBRL(monthlyFee)}</p>
              {nextDue && (
                <p className="text-xs text-muted-foreground mt-1">Próximo vencimento: {nextDue} (dia {dueDay})</p>
              )}
            </GlassCard>
          )}
          <div className="space-y-2">
            <a href={`mailto:${student.email}`} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 text-sm text-foreground">
              <Mail className="w-4 h-4 text-muted-foreground" />
              {student.email}
            </a>
            {student.phone && (
              <a href={`tel:${student.phone}`} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 text-sm text-foreground">
                <Phone className="w-4 h-4 text-muted-foreground" />
                {student.phone}
              </a>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" icon={<MessageCircle className="w-4 h-4" />} fullWidth onClick={handleWhatsApp}>
              WhatsApp
            </Button>
            <Button
              variant="outline"
              icon={<FileText className="w-4 h-4" />}
              fullWidth
              onClick={() => {
                onOpenWorkout(student.id);
                onClose();
              }}
            >
              Treino
            </Button>
            <Button
              variant={isActive ? "outline" : "primary"}
              icon={isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
              fullWidth
              onClick={() => onToggleActive(student.id, student.name, !isActive)}
            >
              {isActive ? "Desativar aluno" : "Reativar aluno"}
            </Button>
            <Button
              variant="primary"
              icon={<Edit className="w-4 h-4" />}
              fullWidth
              onClick={() => {
                onEdit(student.id);
                onClose();
              }}
            >
              Editar
            </Button>
            <Button
              variant="ghost"
              icon={<Trash2 className="w-4 h-4" />}
              className="text-destructive hover:bg-destructive/10"
              fullWidth
              onClick={() => onRemove(student.id, student.name)}
            >
              Remover
            </Button>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}

export interface StudentsPageProps {
  /** Superadmin: escolher personal ao criar aluno */
  isSuperAdmin?: boolean;
  onUpgradePlan?: () => void;
  onNavigateToWorkouts?: (studentId: string) => void;
}

export function StudentsPage({
  isSuperAdmin = false,
  onUpgradePlan,
  onNavigateToWorkouts,
}: StudentsPageProps) {
  const { students, profiles, currentProfile, trainers, deleteStudent, setStudentActive } = useStore();
  const { canCreateStudent } = useSubscription();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "overdue" | "paused">("all");
  const [selected, setSelected] = useState<StudentRow | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  const handleRemoveStudent = (studentId: string, studentName: string) => {
    if (!confirm(`Remover ${studentName} da sua base? Os treinos vinculados também serão excluídos.`)) {
      return;
    }
    deleteStudent(studentId);
    setSelected(null);
    toast.success("Aluno removido.");
  };

  const handleToggleActive = (studentId: string, studentName: string, activate: boolean) => {
    const action = activate ? "reativar" : "desativar";
    if (!confirm(`${activate ? "Reativar" : "Desativar"} o acesso de ${studentName}?`)) {
      return;
    }
    setStudentActive(studentId, activate);
    setSelected((prev) =>
      prev?.id === studentId ? { ...prev, status: activate ? "active" : "paused" } : prev
    );
    toast.success(`Aluno ${action === "reativar" ? "reativado" : "desativado"}.`);
  };

  const trainerId = currentProfile?.role === "trainer" ? currentProfile.id : null;

  const rows: StudentRow[] = useMemo(() => {
    const list = isSuperAdmin
      ? students
      : students.filter((s) => s.trainer_id === trainerId);

    return list.map((s) => {
      const prof = profiles.find((p) => p.id === s.id);
      const joined = s.created_at
        ? new Date(s.created_at).toLocaleDateString("pt-BR")
        : "—";
      return {
        id: s.id,
        name: prof?.name || "Aluno",
        email: prof?.email || "",
        phone: prof?.phone || s.phone || "",
        plan: s.monthly_fee && s.monthly_fee > 0
          ? `R$ ${s.monthly_fee.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
          : "Consultoria",
        status: mapStatus(s.status),
        progress: Math.min(100, Math.round((s.current_weight / Math.max(s.initial_weight, 1)) * 50) || 40),
        weight: `${s.current_weight}kg`,
        goal: s.objective || "—",
        joined,
        nextPayment: "—",
        streak: 0,
        sessions: 0,
      };
    });
  }, [students, profiles, trainerId, isSuperAdmin]);

  const trainerOptions = useMemo(() => {
    if (!isSuperAdmin) return undefined;
    return trainers
      .map((t) => {
        const p = profiles.find((pr) => pr.id === t.id);
        return { id: t.id, name: p?.name || t.id };
      })
      .filter((t) => t.name);
  }, [isSuperAdmin, trainers, profiles]);

  const filtered = rows.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || s.status === filter;
    return matchSearch && matchFilter;
  });

  const counts = {
    all: rows.length,
    active: rows.filter(s => s.status === "active").length,
    overdue: rows.filter(s => s.status === "overdue").length,
    paused: rows.filter(s => s.status === "paused").length,
  };

  const handleAddStudent = () => {
    if (!isSuperAdmin && !canCreateStudent) return;
    setShowAdd(true);
  };

  return (
    <div className="p-4 lg:p-8 space-y-5 pb-24 lg:pb-8">
      {!isSuperAdmin && <PlanStudentLimit onUpgrade={onUpgradePlan} />}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar alunos..."
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-input-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 h-11 px-4 rounded-xl border border-border bg-card text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-all">
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filtros</span>
          </button>
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleAddStudent}
            disabled={!isSuperAdmin && !canCreateStudent}
            title={
              !isSuperAdmin && !canCreateStudent
                ? 'Limite de alunos do plano atingido'
                : undefined
            }
          >
            <span className="hidden sm:inline">Novo Aluno</span>
          </Button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {(
          [
            { id: "all", label: "Todos" },
            { id: "active", label: "Ativos" },
            { id: "overdue", label: "Inadimplentes" },
            { id: "paused", label: "Pausados" },
          ] as const
        ).map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${filter === tab.id ? "bg-primary text-white shadow-sm shadow-primary/30" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === tab.id ? "bg-white/20" : "bg-muted"}`}>
              {counts[tab.id]}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        {filtered.map((student, i) => (
          <motion.div
            key={student.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <GlassCard hover onClick={() => setSelected(student)} className="p-4">
              <div className="flex items-center gap-4">
                <Avatar name={student.name} size="md" online={student.status === "active"} />
                <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{student.name}</p>
                    <p className="text-xs text-muted-foreground truncate hidden sm:block">{student.email}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="ghost">{student.plan}</Badge>
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">{student.goal}</span>
                      <span className="text-xs text-primary font-medium">{student.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                        style={{ width: `${student.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 justify-end">
                    <Badge
                      variant={student.status === "active" ? "success" : student.status === "overdue" ? "danger" : "warning"}
                      dot
                    >
                      {student.status === "active" ? "Ativo" : student.status === "overdue" ? "Inadimplente" : "Pausado"}
                    </Badge>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center mb-4">
            <Search className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground mb-1">Nenhum aluno encontrado</p>
          <p className="text-sm text-muted-foreground">Cadastre um novo aluno para começar</p>
          <Button className="mt-4" variant="primary" onClick={() => setShowAdd(true)}>
            Novo aluno
          </Button>
        </div>
      )}

      <StudentDrawer
        student={selected}
        onClose={() => setSelected(null)}
        onEdit={setEditingStudentId}
        onRemove={handleRemoveStudent}
        onOpenWorkout={(studentId) => onNavigateToWorkouts?.(studentId)}
        onToggleActive={handleToggleActive}
      />
      <EditStudentModal
        open={Boolean(editingStudentId)}
        studentId={editingStudentId}
        onClose={() => setEditingStudentId(null)}
      />
      <AddStudentModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        trainerOptions={trainerOptions}
        defaultTrainerId={trainerId || undefined}
      />
    </div>
  );
}
