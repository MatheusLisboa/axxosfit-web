import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  TrendingUp, TrendingDown, Users, DollarSign, Activity,
  AlertCircle, ArrowRight, Zap, ChevronRight,
  Calendar, CreditCard, BarChart3,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import { useStore } from "../../../services/store";
import { GlassCard } from "../ui/GlassCard";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Avatar } from "../ui/Avatar";
import { PlanFeatureGate } from "../plans/PlanFeatureGate";
import { useSubscription } from "../../../hooks/useSubscription";
import { filterStudentBillingPayments } from "../../../lib/paymentUtils";
import type { AppPage } from "../layout/Sidebar";

interface DashboardProps {
  onNavigate: (page: AppPage) => void;
}

function StatCard({ label, value, change, positive, icon: Icon, color }: {
  label: string; value: string; change: string; positive: boolean;
  icon: typeof TrendingUp; color: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <GlassCard className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${positive ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"}`}>
            {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {change}
          </div>
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
      </GlassCard>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-xl p-3 shadow-xl">
        <p className="text-xs text-muted-foreground mb-2">{label}</p>
        {payload.map((p) => (
          <p key={p.name} className="text-sm font-semibold" style={{ color: p.color }}>
            R$ {p.value.toLocaleString("pt-BR")}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return "hoje";
  if (days === 1) return "há 1 dia";
  if (days < 7) return `há ${days} dias`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { currentProfile, profiles, students, payments, getTrainerDashboardStats } = useStore();
  const { canAccess } = useSubscription();
  const hasFinancial = canAccess("financial");
  const [chartPeriod, setChartPeriod] = useState<"3m" | "6m" | "12m">("12m");

  const stats = getTrainerDashboardStats();
  const trainerId = currentProfile?.id;

  const studentPayments = useMemo(
    () => filterStudentBillingPayments(payments.filter((p) => p.trainer_id === trainerId)),
    [payments, trainerId]
  );

  const revenueData = useMemo(() => {
    const months: Record<string, number> = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
      months[key] = 0;
    }
    studentPayments
      .filter((p) => p.status === "paid")
      .forEach((p) => {
        const d = new Date(p.payment_date || p.created_at);
        const key = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
        if (key in months) months[key] += p.amount;
      });
    return Object.entries(months).map(([month, receita]) => ({ month, receita, meta: Math.max(receita, 1000) }));
  }, [studentPayments]);

  const displayData = chartPeriod === "3m" ? revenueData.slice(-3) :
    chartPeriod === "6m" ? revenueData.slice(-6) : revenueData;

  const recentStudents = useMemo(() => {
    return [...students]
      .filter((s) => s.trainer_id === trainerId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map((s) => {
        const prof = profiles.find((p) => p.id === s.id);
        return {
          name: prof?.name || "Aluno",
          plan: s.monthly_fee ? `R$ ${s.monthly_fee}` : "Consultoria",
          status: s.status,
          progress: Math.min(100, Math.round((s.current_weight / Math.max(s.initial_weight, 1)) * 50) || 0),
          joined: timeAgo(s.created_at),
        };
      });
  }, [students, profiles, trainerId]);

  const upcoming = useMemo(() => {
    return stats.upcomingRenewals.slice(0, 4).map((r) => ({
      student: r.studentName,
      type: "Vencimento",
      date: new Date(r.dueDate).toLocaleDateString("pt-BR"),
      urgent: r.status === "overdue",
    }));
  }, [stats.upcomingRenewals]);

  const overdueTotal = studentPayments
    .filter((p) => p.status === "overdue" || p.status === "pending")
    .reduce((a, p) => a + p.amount, 0);

  const firstName = currentProfile?.name?.split(" ")[0] || "Personal";
  const pendingCount = stats.upcomingRenewals.filter((r) => r.status === "pending" || r.status === "overdue").length;

  const quickActions = useMemo(() => {
    const base = [
      { label: "Novo Aluno", icon: Users, color: "from-indigo-500 to-violet-600", page: "students" as AppPage },
      { label: "Criar Treino", icon: Zap, color: "from-violet-500 to-purple-600", page: "workouts" as AppPage },
      { label: "Avaliação", icon: Activity, color: "from-emerald-500 to-teal-600", page: "assessment" as AppPage },
    ];
    if (hasFinancial) {
      base.push({ label: "Finanças", icon: CreditCard, color: "from-amber-500 to-orange-600", page: "financial" });
    }
    return base;
  }, [hasFinancial]);

  return (
    <div className="p-4 lg:p-8 space-y-6 pb-24 lg:pb-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary/90 to-accent p-6 text-white"
      >
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm mb-1">Olá, {firstName} 👋</p>
            <h2 className="text-xl font-bold mb-1">
              {hasFinancial && pendingCount > 0
                ? `Você tem ${pendingCount} cobrança(s) pendente(s)`
                : "Seu painel está atualizado"}
            </h2>
            <p className="text-white/70 text-sm">
              {stats.activeStudents} aluno(s) ativo(s) · {stats.completedWorkoutsThisWeek} treino(s) registrados
            </p>
          </div>
          {hasFinancial && pendingCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/15 border-white/20 text-white hover:bg-white/25 shrink-0"
              onClick={() => onNavigate("financial")}
            >
              Ver financeiro
            </Button>
          )}
        </div>
      </motion.div>

      <div className={`grid grid-cols-2 gap-4 ${hasFinancial ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
        {hasFinancial && (
          <StatCard
            label="Receita (pagos)"
            value={`R$ ${stats.monthlyRevenue.toLocaleString("pt-BR")}`}
            change={`${stats.activeStudents} alunos`}
            positive
            icon={DollarSign}
            color="from-indigo-500 to-violet-600"
          />
        )}
        <StatCard
          label="Alunos Ativos"
          value={String(stats.activeStudents)}
          change={`${stats.totalStudents} total`}
          positive={stats.activeStudents > 0}
          icon={Users}
          color="from-violet-500 to-purple-600"
        />
        <StatCard
          label="Retenção"
          value={`${stats.retentionScore}%`}
          change={`${stats.completedWorkoutsThisWeek} logs`}
          positive={stats.retentionScore >= 50}
          icon={Activity}
          color="from-emerald-500 to-teal-600"
        />
        {hasFinancial && (
          <StatCard
            label="Pendências"
            value={`R$ ${overdueTotal.toLocaleString("pt-BR")}`}
            change={`${pendingCount} item(ns)`}
            positive={overdueTotal === 0}
            icon={AlertCircle}
            color="from-rose-500 to-pink-600"
          />
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Atalhos Rápidos</h3>
        <div className={`grid gap-3 ${quickActions.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}>
          {quickActions.map(({ label, icon: Icon, color, page }) => (
            <button
              key={label}
              onClick={() => onNavigate(page)}
              className="flex flex-col items-center gap-2 p-3 lg:p-4 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-medium text-muted-foreground text-center">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {hasFinancial && (
        <GlassCard className="p-5 lg:p-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h3 className="font-semibold text-foreground">Receita mensal</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Mensalidades de alunos confirmadas</p>
            </div>
            <div className="flex gap-1 p-1 rounded-xl bg-muted border border-border">
              {(["3m", "6m", "12m"] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setChartPeriod(period)}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${chartPeriod === period ? "bg-primary text-white" : "text-muted-foreground"}`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          {displayData.some((d) => d.receita > 0) ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#8585a8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#8585a8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="receita" stroke="#6366f1" strokeWidth={2.5} fill="url(#colorReceita)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
              Nenhuma mensalidade registrada ainda. Cadastre alunos com valor mensal.
            </div>
          )}
        </GlassCard>
      )}

      <PlanFeatureGate feature="advanced_reports">
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Relatórios avançados</h3>
            <Badge variant="accent">Studio</Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-border p-3 text-center">
              <p className="text-lg font-bold">{stats.totalStudents}</p>
              <p className="text-[10px] text-muted-foreground">Alunos cadastrados</p>
            </div>
            <div className="rounded-xl border border-border p-3 text-center">
              <p className="text-lg font-bold text-emerald-400">{stats.retentionScore}%</p>
              <p className="text-[10px] text-muted-foreground">Retenção ativa</p>
            </div>
            <div className="rounded-xl border border-border p-3 text-center">
              <p className="text-lg font-bold">{stats.completedWorkoutsThisWeek}</p>
              <p className="text-[10px] text-muted-foreground">Logs esta semana</p>
            </div>
            {hasFinancial && (
              <div className="rounded-xl border border-border p-3 text-center">
                <p className="text-lg font-bold">R$ {stats.monthlyRevenue.toLocaleString("pt-BR")}</p>
                <p className="text-[10px] text-muted-foreground">Receita confirmada</p>
              </div>
            )}
          </div>
        </GlassCard>
      </PlanFeatureGate>

      <div className="grid lg:grid-cols-2 gap-6">
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-foreground">Alunos Recentes</h3>
            <button onClick={() => onNavigate("students")} className="flex items-center gap-1 text-xs text-primary">
              Ver todos <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {recentStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum aluno cadastrado.</p>
          ) : (
            <div className="space-y-3">
              {recentStudents.map((student) => (
                <div key={student.name} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50">
                  <Avatar name={student.name} size="md" online={student.status === "active"} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.joined}</p>
                  </div>
                  <Badge variant={student.status === "active" ? "success" : "warning"}>{student.plan}</Badge>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {hasFinancial ? (
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-foreground">Próximos vencimentos</h3>
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </div>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sem vencimentos próximos.</p>
            ) : (
              <div className="space-y-3">
                {upcoming.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50">
                    <div className={`w-2 h-2 rounded-full ${item.urgent ? "bg-rose-400" : "bg-primary"}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{item.student}</p>
                      <p className="text-xs text-muted-foreground">{item.type}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{item.date}</span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        ) : (
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-foreground">Evolução dos alunos</h3>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Acompanhe peso, composição corporal e histórico na aba Avaliação Física.
            </p>
            <Button variant="outline" size="sm" onClick={() => onNavigate("assessment")}>
              Ir para avaliações
            </Button>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
