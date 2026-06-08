import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { TrendingDown, TrendingUp, Activity, Plus, FileText } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { toast } from "sonner";
import { useStore } from "../../../services/store";
import { GlassCard } from "../ui/GlassCard";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Avatar } from "../ui/Avatar";
import { Input } from "../ui/Input";
import { useSubscription } from "../../../hooks/useSubscription";
import { PlanFeatureGate } from "../plans/PlanFeatureGate";
import { exportAssessmentPdf } from "../../../lib/pdfReports";

export function AssessmentPage() {
  const {
    currentProfile,
    students,
    profiles,
    physicalAssessments,
    bodyMeasurements,
    createPhysicalAssessment,
  } = useStore();
  const { canAccess } = useSubscription();
  const hasFullAssessment = canAccess("assessment_full");
  const hasAnamnesis = canAccess("anamnesis");
  const hasEvolution = canAccess("evolution_management");
  const hasPdf = canAccess("pdf");

  const trainerId = currentProfile?.id;
  const myStudents = students.filter((s) => s.trainer_id === trainerId);

  const [selectedId, setSelectedId] = useState(myStudents[0]?.id || "");
  const [showForm, setShowForm] = useState(false);
  const [assessmentDate, setAssessmentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("170");
  const [bodyFat, setBodyFat] = useState("");
  const [shoulder, setShoulder] = useState("");
  const [chest, setChest] = useState("");
  const [armRightRelaxed, setArmRightRelaxed] = useState("");
  const [armLeftRelaxed, setArmLeftRelaxed] = useState("");
  const [armRightContracted, setArmRightContracted] = useState("");
  const [armLeftContracted, setArmLeftContracted] = useState("");
  const [forearmRight, setForearmRight] = useState("");
  const [forearmLeft, setForearmLeft] = useState("");
  const [thighRight, setThighRight] = useState("");
  const [thighLeft, setThighLeft] = useState("");
  const [calfRight, setCalfRight] = useState("");
  const [calfLeft, setCalfLeft] = useState("");
  const [waist, setWaist] = useState("");
  const [hips, setHips] = useState("");
  const [anamnesis, setAnamnesis] = useState("");
  const [showFullAnamnesis, setShowFullAnamnesis] = useState(false);
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [trainingHistory, setTrainingHistory] = useState("");
  const [injuryHistory, setInjuryHistory] = useState("");
  const [nutritionHabits, setNutritionHabits] = useState("");

  const selectedStudent = myStudents.find((s) => s.id === selectedId);
  const selectedName = profiles.find((p) => p.id === selectedId)?.name || "Aluno";

  const assessments = physicalAssessments
    .filter((a) => a.student_id === selectedId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const measurements = bodyMeasurements.filter((m) => m.student_id === selectedId);

  const weightHistory = useMemo(() => {
    return measurements.map((m) => ({
      date: new Date(m.date).toLocaleDateString("pt-BR", { month: "short" }),
      peso: m.weight,
      gordura: assessments.find((a) => a.id === m.physical_assessment_id)?.body_fat_percentage || 0,
    }));
  }, [measurements, assessments]);

  const latest = assessments[assessments.length - 1];
  const prev = assessments[assessments.length - 2];
  const latestM = measurements[measurements.length - 1];

  const bodyMetrics = latest && latestM ? [
    {
      label: "Peso",
      value: `${latestM.weight} kg`,
      prev: prev && measurements[measurements.length - 2] ? `${measurements[measurements.length - 2].weight} kg` : "—",
      change: prev ? `${(latestM.weight - measurements[measurements.length - 2]?.weight).toFixed(1)} kg` : "—",
      positive: !prev || latestM.weight <= measurements[measurements.length - 2]?.weight,
      icon: TrendingDown,
    },
    {
      label: "% Gordura",
      value: `${latest.body_fat_percentage || 0}%`,
      prev: prev ? `${prev.body_fat_percentage || 0}%` : "—",
      change: prev ? `${((latest.body_fat_percentage || 0) - (prev.body_fat_percentage || 0)).toFixed(1)}%` : "—",
      positive: !prev || (latest.body_fat_percentage || 0) <= (prev.body_fat_percentage || 0),
      icon: TrendingDown,
    },
    {
      label: "IMC",
      value: String(latest.imc.toFixed(1)),
      prev: prev ? String(prev.imc.toFixed(1)) : "—",
      change: prev ? (latest.imc - prev.imc).toFixed(1) : "—",
      positive: true,
      icon: Activity,
    },
    {
      label: "Altura",
      value: `${latestM.height} cm`,
      prev: "—",
      change: "—",
      positive: true,
      icon: TrendingUp,
    },
  ] : [];

  const handleSave = () => {
    if (!selectedId || !weight) {
      toast.error("Selecione aluno e informe o peso.");
      return;
    }
    const w = Number(weight);
    const h = Number(height) / 100;
    const imc = w / (h * h);
    const today = new Date().toISOString().split("T")[0];

    const finalAnamnesis = hasAnamnesis && showFullAnamnesis
      ? [
          anamnesis && `Observações gerais: ${anamnesis}`,
          chiefComplaint && `Queixa principal: ${chiefComplaint}`,
          medicalHistory && `Histórico médico: ${medicalHistory}`,
          trainingHistory && `Histórico de treinos: ${trainingHistory}`,
          injuryHistory && `Lesões / limitações: ${injuryHistory}`,
          nutritionHabits && `Hábitos alimentares: ${nutritionHabits}`,
        ]
          .filter(Boolean)
          .join('\n') || anamnesis || "Avaliação de rotina."
      : anamnesis || "Avaliação de rotina.";

    createPhysicalAssessment(
      {
        student_id: selectedId,
        trainer_id: trainerId!,
        date: assessmentDate,
        anamnesis: finalAnamnesis,
        imc,
        body_fat_percentage: Number(bodyFat) || 0,
        protocol: "Manual",
        recommendations: "Acompanhar evolução nas próximas semanas.",
      },
      {
        student_id: selectedId,
        date: assessmentDate,
        weight: w,
        height: Number(height),
        ...(hasFullAssessment ? {
          shoulder: Number(shoulder) || undefined,
          chest: Number(chest) || undefined,
          biceps_left_relaxed: Number(armLeftRelaxed) || undefined,
          biceps_right_relaxed: Number(armRightRelaxed) || undefined,
          biceps_left_contracted: Number(armLeftContracted) || undefined,
          biceps_right_contracted: Number(armRightContracted) || undefined,
          forearm_left: Number(forearmLeft) || undefined,
          forearm_right: Number(forearmRight) || undefined,
          thigh_left: Number(thighLeft) || undefined,
          thigh_right: Number(thighRight) || undefined,
          calf_left: Number(calfLeft) || undefined,
          calf_right: Number(calfRight) || undefined,
          waist: Number(waist) || undefined,
          hips: Number(hips) || undefined,
        } : {}),
        physical_assessment_id: "",
      }
    );
    toast.success("Avaliação registrada!");
    setShowForm(false);
    setAssessmentDate(new Date().toISOString().split('T')[0]);
    setWeight("");
    setHeight("170");
    setBodyFat("");
    setShoulder("");
    setChest("");
    setArmRightRelaxed("");
    setArmLeftRelaxed("");
    setArmRightContracted("");
    setArmLeftContracted("");
    setForearmRight("");
    setForearmLeft("");
    setThighRight("");
    setThighLeft("");
    setCalfRight("");
    setCalfLeft("");
    setWaist("");
    setHips("");
    setAnamnesis("");
    setShowFullAnamnesis(false);
    setChiefComplaint("");
    setMedicalHistory("");
    setTrainingHistory("");
    setInjuryHistory("");
    setNutritionHabits("");
  };

  const handleExportPdf = () => {
    if (!latest || !latestM) return;
    exportAssessmentPdf({
      studentName: selectedName,
      trainerName: currentProfile?.name || "Personal",
      date: new Date(latest.date).toLocaleDateString("pt-BR"),
      imc: latest.imc,
      bodyFat: latest.body_fat_percentage,
      anamnesis: hasAnamnesis ? latest.anamnesis : undefined,
      measurements: hasFullAssessment && latestM ? {
        Peso: `${latestM.weight} kg`,
        Altura: `${latestM.height} cm`,
        ...(latestM.chest ? { Peitoral: `${latestM.chest} cm` } : {}),
        ...(latestM.waist ? { Cintura: `${latestM.waist} cm` } : {}),
        ...(latestM.hips ? { Quadril: `${latestM.hips} cm` } : {}),
      } : { Peso: `${latestM.weight} kg`, Altura: `${latestM.height} cm` },
    });
  };

  return (
    <div className="p-4 lg:p-8 space-y-5 pb-24">
      {!hasFullAssessment && (
        <GlassCard className="p-3 border-primary/20 bg-primary/5">
          <p className="text-xs text-muted-foreground">
            Plano Starter: avaliação básica (peso, altura e % gordura). Faça upgrade para Pro e desbloqueie medidas corporais, anamnese, evolução e PDF.
          </p>
        </GlassCard>
      )}
      <GlassCard className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar name={selectedName} size="md" />
            <div>
              {myStudents.length > 0 ? (
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="font-semibold bg-transparent border-none outline-none text-foreground"
                >
                  {myStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {profiles.find((p) => p.id === s.id)?.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="font-semibold text-foreground">Nenhum aluno</p>
              )}
              <p className="text-xs text-muted-foreground">
                {latest ? `Última avaliação: ${new Date(latest.date).toLocaleDateString("pt-BR")}` : "Sem avaliações"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowForm(true)} disabled={!selectedId}>
              Nova avaliação
            </Button>
            {hasPdf && latest && (
              <Button variant="outline" size="sm" icon={<FileText className="w-3.5 h-3.5" />} onClick={handleExportPdf}>
                Exportar PDF
              </Button>
            )}
          </div>
        </div>
      </GlassCard>

      {showForm && (
        <GlassCard className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="font-semibold">Nova avaliação — {selectedName}</h3>
            {hasAnamnesis && (
              <Button variant="ghost" size="sm" onClick={() => setShowFullAnamnesis((prev) => !prev)}>
                {showFullAnamnesis ? 'Ocultar anamnese completa' : 'Adicionar anamnese completa (opcional)'}
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input label="Data da avaliação" value={assessmentDate} onChange={(e) => setAssessmentDate(e.target.value)} type="date" fullWidth />
            <Input label="Peso (kg)" value={weight} onChange={(e) => setWeight(e.target.value)} type="number" fullWidth />
            <Input label="Altura (cm)" value={height} onChange={(e) => setHeight(e.target.value)} type="number" fullWidth />
            <Input label="% Gordura" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} type="number" fullWidth />
          </div>
          <PlanFeatureGate feature="assessment_full" showCTA={false} fallback={null}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className="space-y-3 rounded-3xl border border-border bg-input-background p-4">
                <p className="text-sm font-medium text-foreground">Tronco</p>
                <div className="grid grid-cols-1 gap-3">
                  <Input label="Peitoral / Tórax" value={chest} onChange={(e) => setChest(e.target.value)} type="number" fullWidth />
                  <Input label="Ombros" value={shoulder} onChange={(e) => setShoulder(e.target.value)} type="number" fullWidth />
                  <Input label="Cintura" value={waist} onChange={(e) => setWaist(e.target.value)} type="number" fullWidth />
                  <Input label="Quadril" value={hips} onChange={(e) => setHips(e.target.value)} type="number" fullWidth />
                </div>
              </div>
              <div className="space-y-3 rounded-3xl border border-border bg-input-background p-4">
                <p className="text-sm font-medium text-foreground">Braços</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Braço direito relaxado" value={armRightRelaxed} onChange={(e) => setArmRightRelaxed(e.target.value)} type="number" fullWidth />
                  <Input label="Braço esquerdo relaxado" value={armLeftRelaxed} onChange={(e) => setArmLeftRelaxed(e.target.value)} type="number" fullWidth />
                  <Input label="Braço direito contraído" value={armRightContracted} onChange={(e) => setArmRightContracted(e.target.value)} type="number" fullWidth />
                  <Input label="Braço esquerdo contraído" value={armLeftContracted} onChange={(e) => setArmLeftContracted(e.target.value)} type="number" fullWidth />
                  <Input label="Antebraço direito" value={forearmRight} onChange={(e) => setForearmRight(e.target.value)} type="number" fullWidth />
                  <Input label="Antebraço esquerdo" value={forearmLeft} onChange={(e) => setForearmLeft(e.target.value)} type="number" fullWidth />
                </div>
              </div>
              <div className="space-y-3 rounded-3xl border border-border bg-input-background p-4">
                <p className="text-sm font-medium text-foreground">Pernas</p>
                <div className="grid grid-cols-1 gap-3">
                  <Input label="Coxa direita" value={thighRight} onChange={(e) => setThighRight(e.target.value)} type="number" fullWidth />
                  <Input label="Coxa esquerda" value={thighLeft} onChange={(e) => setThighLeft(e.target.value)} type="number" fullWidth />
                  <Input label="Panturrilha direita" value={calfRight} onChange={(e) => setCalfRight(e.target.value)} type="number" fullWidth />
                  <Input label="Panturrilha esquerda" value={calfLeft} onChange={(e) => setCalfLeft(e.target.value)} type="number" fullWidth />
                </div>
              </div>
            </div>
          </PlanFeatureGate>
          {hasAnamnesis && (
            <Input label="Anamnese / observações" value={anamnesis} onChange={(e) => setAnamnesis(e.target.value)} fullWidth />
          )}
          {hasAnamnesis && showFullAnamnesis && (
            <div className="space-y-3 rounded-3xl border border-border bg-input-background p-4">
              <p className="text-sm font-medium text-foreground">Detalhes da anamnese</p>
              <div className="grid gap-3">
                <label className="flex flex-col gap-2 text-sm text-foreground">
                  <span>Queixa principal</span>
                  <textarea
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    className="min-h-[92px] w-full resize-none rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Ex: dor nas costas, fadiga, desconforto"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm text-foreground">
                  <span>Histórico médico</span>
                  <textarea
                    value={medicalHistory}
                    onChange={(e) => setMedicalHistory(e.target.value)}
                    className="min-h-[92px] w-full resize-none rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Ex: condições pré-existentes, medicação, cirurgias"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm text-foreground">
                  <span>Histórico de treinamento</span>
                  <textarea
                    value={trainingHistory}
                    onChange={(e) => setTrainingHistory(e.target.value)}
                    className="min-h-[92px] w-full resize-none rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Ex: frequência, modalidade, histórico de treinos"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm text-foreground">
                  <span>Lesões / limitações</span>
                  <textarea
                    value={injuryHistory}
                    onChange={(e) => setInjuryHistory(e.target.value)}
                    className="min-h-[92px] w-full resize-none rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Ex: lesões antigas, inflamações, limitações de movimento"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm text-foreground">
                  <span>Hábitos alimentares</span>
                  <textarea
                    value={nutritionHabits}
                    onChange={(e) => setNutritionHabits(e.target.value)}
                    className="min-h-[92px] w-full resize-none rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Ex: padrão alimentar, suplementos, hidratação"
                  />
                </label>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleSave}>Salvar</Button>
          </div>
        </GlassCard>
      )}

      {bodyMetrics.length === 0 ? (
        <GlassCard className="p-12 text-center text-muted-foreground text-sm">
          {myStudents.length === 0
            ? "Cadastre alunos para registrar avaliações físicas."
            : "Nenhuma avaliação para este aluno. Clique em Nova avaliação."}
        </GlassCard>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {bodyMetrics.map(({ label, value, prev, change, positive, icon: Icon }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <GlassCard className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${positive ? "bg-emerald-500/15" : "bg-rose-500/15"}`}>
                      <Icon className={`w-4 h-4 ${positive ? "text-emerald-400" : "text-rose-400"}`} />
                    </div>
                    <span className={`text-xs font-semibold ${positive ? "text-emerald-400" : "text-rose-400"}`}>{change}</span>
                  </div>
                  <p className="text-xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">antes: {prev}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {weightHistory.length > 1 && (
            <PlanFeatureGate feature="evolution_management">
              <GlassCard className="p-5">
                <h3 className="font-semibold mb-4">Evolução do peso</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weightHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#8585a8" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#8585a8" }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="peso" stroke="#6366f1" fill="#6366f133" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </PlanFeatureGate>
          )}
        </>
      )}
    </div>
  );
}
