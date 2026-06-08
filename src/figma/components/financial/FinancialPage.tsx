import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  DollarSign, TrendingUp, AlertCircle,
  ArrowUpRight, ArrowDownRight, Check, FileText, MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { useStore } from "../../../services/store";
import { GlassCard } from "../ui/GlassCard";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Avatar } from "../ui/Avatar";
import { filterStudentBillingPayments } from "../../../lib/paymentUtils";
import { buildWhatsAppBillingUrl } from "../../../lib/financeUtils";
import { exportFinancialPdf } from "../../../lib/pdfReports";
import { PlanFeatureGate } from "../plans/PlanFeatureGate";

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-xl p-3 shadow-xl text-xs space-y-1">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-semibold text-emerald-400">Entradas: R$ {payload[0]?.value?.toLocaleString()}</p>
        <p className="font-semibold text-rose-400">Saídas: R$ {payload[1]?.value?.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export function FinancialPage() {
  const { payments, profiles, students, currentProfile, markPaymentPaid } = useStore();
  const [activeTab, setActiveTab] = useState<"overview" | "transactions">("overview");

  const trainerId = currentProfile?.id;
  const myPayments = useMemo(
    () => filterStudentBillingPayments(payments.filter((p) => p.trainer_id === trainerId)),
    [payments, trainerId]
  );

  const transactions = useMemo(() => {
    return myPayments.map((p) => {
      const prof = profiles.find((pr) => pr.id === p.student_id);
      const st = students.find((s) => s.id === p.student_id);
      return {
        id: p.id,
        studentId: p.student_id,
        name: prof?.name || "Aluno",
        phone: prof?.phone || st?.phone || "",
        type: p.description || "Mensalidade",
        amount: p.amount,
        status: p.status,
        date: p.due_date || p.payment_date || p.created_at.split("T")[0],
      };
    });
  }, [myPayments, profiles, students]);

  const handleMarkPaid = (paymentId: string, studentName: string) => {
    markPaymentPaid(paymentId);
    toast.success(`Mensalidade de ${studentName} marcada como paga.`);
  };

  const handleWhatsAppCharge = (t: (typeof transactions)[number]) => {
    const url = buildWhatsAppBillingUrl(t.phone, {
      studentName: t.name,
      amount: t.amount,
      dueDate: t.date,
      trainerName: currentProfile?.name,
    });
    if (!url) {
      toast.error("Cadastre o telefone do aluno para enviar cobrança.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const cashflow = useMemo(() => {
    const months: Record<string, { entradas: number; saidas: number }> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
      months[key] = { entradas: 0, saidas: 0 };
    }
    myPayments.forEach((p) => {
      const d = new Date(p.payment_date || p.created_at);
      const key = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
      if (key in months) {
        if (p.status === "paid") months[key].entradas += p.amount;
        else months[key].saidas += p.amount;
      }
    });
    return Object.entries(months).map(([month, v]) => ({ month, ...v }));
  }, [myPayments]);

  const totalReceived = transactions.filter((t) => t.status === "paid").reduce((a, t) => a + t.amount, 0);
  const totalPending = transactions.filter((t) => t.status === "pending" || t.status === "overdue").reduce((a, t) => a + t.amount, 0);
  const ticketMedio = transactions.filter((t) => t.status === "paid").length
    ? Math.round(totalReceived / transactions.filter((t) => t.status === "paid").length)
    : 0;

  const handleExportPdf = () => {
    exportFinancialPdf({
      trainerName: currentProfile?.name || "Personal",
      periodLabel: `Relatório — ${new Date().toLocaleDateString("pt-BR")}`,
      totalReceived,
      totalPending,
      rows: transactions.map((t) => ({
        name: t.name,
        type: t.type,
        amount: t.amount,
        status: t.status === "paid" ? "Pago" : t.status === "overdue" ? "Atrasado" : "Pendente",
        date: t.date,
      })),
    });
  };

  return (
    <div className="p-4 lg:p-8 space-y-5 pb-24 lg:pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Controle financeiro · Plano Pro+</p>
          <h2 className="text-lg font-semibold text-foreground">Mensalidades dos alunos</h2>
        </div>
        <PlanFeatureGate feature="pdf">
          <Button variant="outline" size="sm" icon={<FileText className="w-4 h-4" />} onClick={handleExportPdf}>
            Exportar PDF
          </Button>
        </PlanFeatureGate>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Recebido", value: `R$ ${totalReceived.toLocaleString("pt-BR")}`, change: `${transactions.filter(t => t.status === "paid").length} pagtos`, positive: true, icon: DollarSign, color: "from-indigo-500 to-violet-600" },
          { label: "Confirmado", value: `R$ ${totalReceived.toLocaleString("pt-BR")}`, change: "total", positive: true, icon: Check, color: "from-emerald-500 to-teal-600" },
          { label: "Pendente", value: `R$ ${totalPending.toLocaleString("pt-BR")}`, change: `${transactions.filter(t => t.status === "overdue").length} atraso`, positive: totalPending === 0, icon: AlertCircle, color: "from-rose-500 to-pink-600" },
          { label: "Ticket Médio", value: ticketMedio ? `R$ ${ticketMedio}` : "—", change: `${transactions.length} lanç.`, positive: true, icon: TrendingUp, color: "from-amber-500 to-orange-600" },
        ].map(({ label, value, change, positive, icon: Icon, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <GlassCard className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
                  <Icon className="w-4.5 h-4.5 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${positive ? "text-emerald-400" : "text-rose-400"}`}>
                  {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {change}
                </div>
              </div>
              <p className="text-xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-muted border border-border">
        {[
          { id: "overview", label: "Visão Geral" },
          { id: "transactions", label: "Transações" },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as "overview" | "transactions")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === id ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-5">
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-foreground">Fluxo de Caixa</h3>
                <p className="text-xs text-muted-foreground">Entradas vs pendências — últimos 7 meses</p>
              </div>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashflow} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#8585a8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#8585a8" }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="entradas" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="saidas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <PlanFeatureGate feature="advanced_reports">
            <GlassCard className="p-5">
              <h3 className="font-semibold text-foreground mb-2">Relatórios avançados</h3>
              <p className="text-xs text-muted-foreground mb-4">Indicadores consolidados da assessoria (Studio).</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
                <div className="rounded-xl border border-border p-3">
                  <p className="text-lg font-bold text-foreground">{transactions.length}</p>
                  <p className="text-[10px] text-muted-foreground">Lançamentos</p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-lg font-bold text-emerald-400">{((totalReceived / Math.max(totalReceived + totalPending, 1)) * 100).toFixed(0)}%</p>
                  <p className="text-[10px] text-muted-foreground">Taxa recebimento</p>
                </div>
                <div className="rounded-xl border border-border p-3 col-span-2 sm:col-span-1">
                  <p className="text-lg font-bold text-foreground">R$ {ticketMedio || 0}</p>
                  <p className="text-[10px] text-muted-foreground">Ticket médio</p>
                </div>
              </div>
            </GlassCard>
          </PlanFeatureGate>
        </div>
      )}

      {activeTab === "transactions" && (
        <div className="space-y-3">
          {transactions.length === 0 ? (
            <GlassCard className="p-8 text-center text-sm text-muted-foreground">
              Nenhuma mensalidade de aluno registrada. Cadastre alunos com valor mensal.
            </GlassCard>
          ) : (
            transactions.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <GlassCard className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={t.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.type} • {t.date}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${t.status === "paid" ? "text-emerald-400" : t.status === "overdue" ? "text-rose-400" : "text-muted-foreground"}`}>
                        R$ {t.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                      <Badge variant={t.status === "paid" ? "success" : t.status === "overdue" ? "danger" : "warning"} dot className="mt-1">
                        {t.status === "paid" ? "Pago" : t.status === "overdue" ? "Atrasado" : "Pendente"}
                      </Badge>
                    </div>
                  </div>
                  {t.status !== "paid" && (
                    <div className="flex flex-wrap gap-2 pt-1 border-t border-border/60">
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<Check className="w-3.5 h-3.5" />}
                        onClick={() => handleMarkPaid(t.id, t.name)}
                      >
                        Marcar como pago
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<MessageCircle className="w-3.5 h-3.5" />}
                        onClick={() => handleWhatsAppCharge(t)}
                      >
                        Cobrar no WhatsApp
                      </Button>
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
