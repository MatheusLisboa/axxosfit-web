/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Dumbbell, Flame, Trophy, Award, TrendingUp, Calendar, 
  Check, Play, ArrowLeft, History, Users, Image as ImageIcon,
  CheckCircle2, Plus, MessageCircle, AlertCircle, RefreshCw, Star, X, Activity, Lock, Settings
} from 'lucide-react';
import { useStore } from '../services/store';
import { DashboardLayout, type NavItem } from './layout';
import { Button, EmptyState, Toast, GlassCard } from './ui';

export default function StudentDashboard() {
  const { 
    currentProfile, 
    currentStudent, 
    logout, 
    workouts, 
    workoutDays, 
    workoutExercises, 
    exercises, 
    addExerciseLog, 
    exerciseLogs, 
    progressPhotos, 
    achievements,
    getStudentScoreCard,
    bodyMeasurements,
    updatePassword,
    updateProfile
  } = useStore();

  const [activeTab, setActiveTab] = useState<'today' | 'evolution' | 'gamification' | 'history' | 'settings'>('today');
  const studentId = currentProfile?.id || 's2';
  
  // METRICAS DO ALUNO (GAMIFICAÇÃO PREMIUM)
  const scorecard = getStudentScoreCard(studentId);

  // LOG REGISTRATION HOVER STATES
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [logReps, setLogReps] = useState('10');
  const [logSeries, setLogSeries] = useState('4');
  const [logLoad, setLogLoad] = useState('40');
  const [logDifficulty, setLogDifficulty] = useState<'easy' | 'moderate' | 'hard' | 'extreme'>('moderate');
  const [logComments, setLogComments] = useState('');

  // PROGRESS PHOTOS GALLERY STATE
  const [newPhotoType, setNewPhotoType] = useState<'front' | 'side' | 'back'>('front');
  const [newPhotoUrl, setNewPhotoUrl] = useState('https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=300');
  const [toast, setToast] = useState<string | null>(null);

  const activeWorkouts = workouts.filter(w => w.student_id === studentId && w.is_active);
  const activeWorkout = activeWorkouts[0];
  const activeDays = workoutDays.filter(d => activeWorkouts.some((w) => w.id === d.workout_id));
  const [selectedDayId, setSelectedDayId] = useState<string>(activeDays[0]?.id || '');

  // Atualiza dia selecionado se mudar de dia
  React.useEffect(() => {
    if (activeDays.length > 0 && !selectedDayId) {
      setSelectedDayId(activeDays[0].id);
    }
  }, [activeDays, selectedDayId]);

  const activeExercises = selectedDayId 
    ? workoutExercises.filter(we => we.workout_day_id === selectedDayId) 
    : [];

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // STUDENT PROFILE STATE
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileCpf, setProfileCpf] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [profileBirthdate, setProfileBirthdate] = useState('');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState('');

  // Sync state with currentProfile
  React.useEffect(() => {
    if (currentProfile) {
      setProfileName(currentProfile.name || '');
      setProfilePhone(currentProfile.phone || '');
      setProfileCpf(currentProfile.cpf || '');
      setProfileAddress(currentProfile.address || '');
      setProfileBirthdate(currentProfile.birthdate || '');
      setProfileAvatarUrl(currentProfile.avatar_url || '');
    }
  }, [currentProfile]);

  const formatCPF = (val: string) => {
    const v = val.replace(/\D/g, '');
    return v
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .substring(0, 14);
  };

  const formatPhone = (val: string) => {
    const v = val.replace(/\D/g, '');
    if (v.length <= 10) {
      return v
        .replace(/^(\d{2})(\d)/g, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .substring(0, 14);
    }
    return v
      .replace(/^(\d{2})(\d)/g, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 15);
  };

  const resizeAndSetAvatar = (file: File, callback: (base64: string) => void) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const max_size = 120; // light-weight tiny profile photo
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > max_size) {
            height *= max_size / width;
            width = max_size;
          }
        } else {
          if (height > max_size) {
            width *= max_size / height;
            height = max_size;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          callback(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRegisterLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExercise) return;

    const currentWe = workoutExercises.find(we => we.id === selectedExercise);
    const currentEx = currentWe ? exercises.find(ex => ex.id === currentWe.exercise_id) : null;
    const isCardio = currentEx?.category === 'Cardio';

    addExerciseLog({
      student_id: studentId,
      workout_exercise_id: selectedExercise,
      load_used: isCardio ? 0 : Number(logLoad),
      completed_series: isCardio ? 1 : Number(logSeries),
      completed_reps: Number(logReps),
      difficulty: logDifficulty,
      feedback_text: logComments
    });

    setSelectedExercise(null);
    setLogComments('');
    triggerToast('🔥 Repetição registrada! Você ganhou +15 Pontos de Glória!');
  };

  const navItems: NavItem[] = [
    { id: 'today', label: 'Treino', icon: Dumbbell },
    { id: 'evolution', label: 'Evolução', icon: TrendingUp },
    { id: 'gamification', label: 'Medalhas', icon: Trophy },
    { id: 'history', label: 'Histórico', icon: History },
    { id: 'settings', label: 'Perfil', icon: Settings },
  ];

  const pageMeta: Record<string, { title: string; subtitle: string }> = {
    today: { title: 'Treino do Dia', subtitle: 'Exercícios e registros de hoje' },
    evolution: { title: 'Evolução', subtitle: 'Fotos e métricas corporais' },
    gamification: { title: 'Medalhas', subtitle: 'Conquistas e pontos' },
    history: { title: 'Histórico', subtitle: 'Cargas e feedbacks anteriores' },
    settings: { title: 'Meu Perfil', subtitle: 'Dados e configurações' },
  };

  const { title: pageTitle, subtitle: pageSubtitle } = pageMeta[activeTab] || pageMeta.today;

  const headerActions = (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 px-2.5 py-1 bg-rose-500/15 border border-rose-500/20 rounded-full text-rose-400 text-[10px] font-bold">
        <Flame className="w-3.5 h-3.5 fill-current" />
        <span>{scorecard.streakDays}d</span>
      </div>
      <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-primary/15 border border-primary/20 rounded-full text-primary text-[10px] font-semibold">
        <Star className="w-3.5 h-3.5 fill-current" />
        <span>LV {scorecard.level}</span>
      </div>
    </div>
  );

  return (
    <>
      <DashboardLayout
        title={pageTitle}
        subtitle={pageSubtitle}
        navItems={navItems}
        mobileNavItems={navItems}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as typeof activeTab)}
        userName={currentProfile?.name}
        userAvatar={currentProfile?.avatar_url}
        userPlan="Aluno Ativo"
        onLogout={logout}
        headerActions={headerActions}
      >
          <GlassCard className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 text-xs">
            <div>
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Frequência Semanal</div>
              <p className="text-foreground font-bold mt-1 text-sm">Próximo Nível: {scorecard.nextMilestonePoints} PTS</p>
            </div>
            <div className="w-full sm:w-auto sm:text-right">
              <span className="text-[10px] text-primary font-semibold">{scorecard.retentionProbability}% Aderência</span>
              <div className="w-full sm:w-28 h-2 bg-muted rounded-full overflow-hidden mt-1.5">
                <div
                  className="bg-gradient-to-r from-primary to-accent h-full transition-all duration-500 rounded-full"
                  style={{ width: `${100 - (scorecard.nextMilestonePoints / 1.5)}%` }}
                />
              </div>
            </div>
          </GlassCard>

          {/* TAB 1: TREINO DO DIA */}
          {activeTab === 'today' && (
            <div className="space-y-6">
              {!activeWorkout ? (
                <EmptyState
                  icon={<Activity className="w-7 h-7" />}
                  title="Nenhum treino ativo"
                  description="Seu personal está preparando o ciclo de exercícios. Aguarde notificações!"
                />
              ) : (
                <div className="space-y-6">
                  
                  {/* DIA DO TREINO DETALHE HEADER */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{activeWorkout.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 font-light">{activeWorkout.description}</p>
                  </div>

                  {/* SELECIONAR DIVISÃO DO DIA */}
                  <div className="flex gap-2 p-1 bg-slate-100 border border-slate-200 rounded-xl overflow-x-auto">
                    {activeDays.map(d => (
                      <button
                        key={d.id}
                        onClick={() => setSelectedDayId(d.id)}
                        className={`px-4 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
                          selectedDayId === d.id ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                        }`}
                      >
                        {d.day_name}
                      </button>
                    ))}
                  </div>

                  {/* EXERCÍCIOS LIST */}
                  <div className="space-y-4">
                    {activeExercises.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 font-mono">Sem exercícios cadastrados para este dia.</p>
                    ) : (
                      activeExercises.map(we => {
                        const ex = exercises.find(e => e.id === we.exercise_id);
                        const isLoggedToday = exerciseLogs.some(l => l.workout_exercise_id === we.id && l.date === new Date().toISOString().split('T')[0]);

                        return (
                          <div 
                            key={we.id} 
                            className={`p-5 rounded-2xl border transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                              isLoggedToday ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex gap-4">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-900 border border-slate-200">
                                <Dumbbell className="w-5 h-5 text-indigo-600" />
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-slate-900">{ex?.name || 'Exercício'}</h4>
                                <p className="text-xs text-slate-500 font-light mt-0.5">{we.observations || 'Sem observações'}</p>
                                
                                {ex?.category === 'Cardio' ? (
                                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] mt-2.5">
                                    <span className="bg-indigo-50 border border-indigo-150 px-2.5 py-1 rounded-lg text-indigo-700 font-extrabold flex items-center gap-1 font-sans">
                                      ⏱️ {we.reps} min
                                      {(ex.name.toLowerCase().includes('esteira') || ex.name.toLowerCase().includes('treadmill')) && (we.load_kg ?? 0) > 0
                                        ? ` · ${we.load_kg}% incl.`
                                        : ''}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-mono text-slate-500 mt-2.5">
                                    <span>Séries: <strong className="text-slate-950">{we.series}</strong></span>
                                    <span>Reps: <strong className="text-slate-950">{we.reps}</strong></span>
                                    <span>Descanso: <strong className="text-slate-600">{we.rest_seconds}s</strong></span>
                                    <span>Sugerido: <strong className="text-indigo-600">{we.load_kg || 0}kg</strong></span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="w-full sm:w-auto text-right">
                              {isLoggedToday ? (
                                <div className="text-xs text-emerald-600 font-bold font-mono flex items-center gap-1 justify-end">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> CONCLUÍDO
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedExercise(we.id);
                                    setLogLoad(String(we.load_kg || 10));
                                    setLogSeries(String(we.series));
                                    setLogReps(we.reps.split('-')[0] || '10');
                                  }}
                                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow cursor-pointer"
                                >
                                  Marcar Feito / Relatar
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                </div>
              )}

            </div>
          )}

          {/* TAB 2: EVOLUÇÃO E FOTOS COMPARATIVAS */}
          {activeTab === 'evolution' && (
            <div className="space-y-8 text-xs font-mono text-slate-500">
              <h2 className="text-lg font-bold font-sans text-slate-900 border-b border-slate-200 pb-4">Acompanhamento Antropométrico</h2>

              {/* GRÁFICOS DE PESO E GORDURA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* GRÁFICO EVOLUÇÃO DE PESO */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <h3 className="text-xs text-slate-900 font-sans font-bold mb-1 col-span-2">Curva de Peso Corporal (Últimos Pesos)</h3>
                  <span className="text-[10px] text-slate-400 block mb-6 font-sans">Métrica registrada pelas avaliações físicas.</span>

                  <div className="h-32 w-full flex items-end gap-3 justify-between pt-6 font-sans">
                    {[
                      { l: 'Fev', w: 58.5, perc: 'h-1/5 bg-indigo-200' },
                      { l: 'Maio', w: 61.2, perc: 'h-full bg-indigo-600 shadow-sm' }
                    ].map((item, id) => (
                      <div key={id} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] font-mono text-slate-900 font-bold">{item.w}kg</span>
                        <div className={`w-12 rounded-t-lg ${item.perc}`}></div>
                        <span className="text-[9px] font-mono mt-1 text-slate-500">{item.l}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* GRÁFICO PERCENTUAL GORDURA */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <h3 className="text-xs text-slate-900 font-sans font-bold mb-1">Evolução Gordura Corporal (BF)</h3>
                  <span className="text-[10px] text-slate-400 block mb-6 font-sans">Redução de massa adiposa em consultoria.</span>

                  <div className="h-32 w-full flex items-end gap-3 justify-between pt-6 font-sans">
                    {[
                      { l: 'Fev', bf: 22.5, perc: 'h-full bg-slate-200' },
                      { l: 'Maio', bf: 19.5, perc: 'h-4/5 bg-indigo-600' }
                    ].map((item, id) => (
                      <div key={id} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] font-mono text-slate-900 font-bold">{item.bf}% BF</span>
                        <div className={`w-12 rounded-t-lg ${item.perc}`}></div>
                        <span className="text-[9px] font-mono mt-1 text-slate-500">{item.l}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* FOTOS DE EVOLUÇÃO COMPARATIVA */}
              <div className="space-y-4 border-t border-slate-200 pt-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs uppercase font-bold text-slate-950 tracking-widest flex items-center gap-1.5 font-sans">
                    <ImageIcon className="w-4 h-4 text-indigo-600" /> Galeria Comparativa de Fotos
                  </h3>
                  
                  {/* SIMULAÇÃO DE SUBIDA DE FOTO */}
                  <button 
                    onClick={() => { 
                      triggerToast('📸 Foto cadastrada no histórico comparativo.'); 
                    }}
                    className="border border-slate-200 text-[10px] bg-white hover:bg-slate-100 text-slate-800 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-indigo-600" /> Adicionar Foto
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {progressPhotos.filter(p => p.student_id === studentId).map(photo => (
                    <div key={photo.id} className="bg-white p-3 rounded-2xl border border-slate-200 relative group overflow-hidden shadow-xs hover:border-slate-300 transition-all">
                      <img 
                        src={photo.photo_url} 
                        alt={photo.caption} 
                        className="w-full h-40 object-cover rounded-xl mb-2"
                      />
                      <span className="absolute top-4 left-4 bg-indigo-600 text-white font-extrabold text-[9px] uppercase px-1.5 py-0.5 rounded">
                        {photo.type}
                      </span>
                      <div className="text-[10px] font-mono font-bold text-slate-900 mb-0.5">{photo.caption}</div>
                      <span className="text-[9px] text-slate-400">{new Date(photo.date).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: GAMIFICAÇÃO / HISTORICO DE MEDALHAS */}
          {activeTab === 'gamification' && (
            <div className="space-y-6 animate-fade-in text-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Minhas Conquistas & Medalhas</h2>
                <p className="text-xs text-slate-500 font-light mt-1">Acumule pontos completando treinos para vencer novos campeonatos!</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {achievements.filter(a => a.student_id === studentId).map(ach => (
                  <div key={ach.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                      <Trophy className="w-6 h-6 fill-current text-amber-500" />
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{ach.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 font-light leading-relaxed">{ach.description}</p>
                      
                      <div className="flex items-center gap-3 text-[10px] font-mono text-slate-405 mt-3 pt-2 border-t border-slate-205">
                        <span className="text-indigo-600 font-bold">+{ach.score_points} PTS de Glória</span>
                        <span>Faturado: {new Date(ach.date_earned).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: HISTÓRICO DE CARGAS E FEEDBACKS */}
          {activeTab === 'history' && (
            <div className="space-y-6 animate-fade-in text-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Prontuário Histórico de Cargas</h2>
                <p className="text-xs text-slate-500">Acompanhe seu avanço de força de musculação consolidado.</p>
              </div>

              <div className="space-y-3">
                {exerciseLogs.filter(el => el.student_id === studentId).length === 0 ? (
                  <p className="text-xs text-slate-400 font-mono py-10 text-center">Nenhum feedback de carga emitido ainda.</p>
                ) : (
                  exerciseLogs
                    .filter(el => el.student_id === studentId)
                    .map(el => (
                      <div key={el.id} className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200 flex items-center justify-between text-xs shadow-xs hover:border-slate-300 transition-all">
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            🎯 {exercises.find(ex => ex.id === workoutExercises.find(we => we.id === el.workout_exercise_id)?.exercise_id)?.name || 'Agachamento Livre com Barra'}
                          </div>
                          {el.feedback_text && (
                            <p className="text-slate-600 text-[11px] font-light mt-1 italic">"{el.feedback_text}"</p>
                          )}
                          <span className="text-[10px] font-mono text-slate-400 block mt-1.5 font-light">Registrado em {new Date(el.date).toLocaleDateString()}</span>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-indigo-600 font-mono text-sm">{el.load_used} kg</div>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 block mt-1 uppercase font-bold text-center">
                            {el.difficulty}
                          </span>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {/* TAB: MEU PERFIL */}
          {activeTab === 'settings' && (
            <div className="space-y-8 animate-fade-in text-slate-800">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900 border-b border-slate-200 pb-4 font-sans">Meu Perfil</h2>
                <p className="text-xs text-slate-500 mt-1 font-sans font-normal">Visualize sua ficha cadastral de faturamento, dados de contato e redefine sua senha de acesso.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* COL 1: FOTO DO PERFIL */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shrink-0 shadow-sm flex flex-col items-center text-center space-y-4">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-widest font-mono">Foto do Perfil</span>
                  
                  <div className="relative group w-24 h-24 rounded-full overflow-hidden border-2 border-indigo-100 shadow-inner">
                    <img 
                      src={profileAvatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profileName || 'A')}`} 
                      alt="Avatar" 
                      className="w-full h-full object-cover select-none"
                      referrerPolicy="no-referrer"
                    />
                    <label className="absolute inset-0 bg-slate-950/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer text-[10px] font-extrabold text-white">
                      <span>Alterar Foto</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            resizeAndSetAvatar(file, (base64) => {
                              setProfileAvatarUrl(base64);
                              triggerToast('📸 Pré-visualização da foto carregada! Toque em "Salvar Informações" para gravar permanentemente.');
                            });
                          }
                        }}
                      />
                    </label>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-bold text-slate-9 tracking-tight font-sans">{profileName || currentProfile?.name}</h3>
                    <p className="text-[10px] font-mono text-indigo-600 uppercase mt-0.5 tracking-wider font-semibold">Aluno(a) Ativo</p>
                  </div>
                  
                  <div className="w-full border-t border-slate-100 pt-3 text-[10px] text-slate-400 font-light flex flex-col space-y-1">
                    <span>E-mail: {currentProfile?.email}</span>
                    <span>Tipo de Acesso: Portal do Aluno</span>
                  </div>
                </div>

                {/* COL 2 & 3: FORMULÁRIO DE DADOS CADASTRAIS */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest font-mono border-b border-slate-100 pb-2.5">Dados Cadastrais</h3>
                  
                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!profileName.trim()) {
                        triggerToast('⚠️ Digite o seu nome completo.');
                        return;
                      }
                      
                      try {
                        const success = await updateProfile(currentProfile!.id, {
                          name: profileName,
                          phone: profilePhone,
                          whatsapp: profilePhone,
                          cpf: profileCpf,
                          address: profileAddress,
                          birthdate: profileBirthdate,
                          avatar_url: profileAvatarUrl
                        });
                        
                        if (success !== false) {
                          triggerToast('💾 Seus dados cadastrais foram salvos com sucesso!');
                        }
                      } catch (err) {
                        triggerToast('⚠️ Falha ao salvar alterações de perfil.');
                      }
                    }} 
                    className="space-y-4 text-slate-800"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Seu Nome Completo*</label>
                        <input 
                          type="text" 
                          required
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          placeholder="Ex: Matheus Lisboa"
                          className="w-full text-xs px-3.5 py-2.5 bg-slate-50/50 border border-slate-250 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-505 text-slate-900 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">E-mail (Login de Acesso - Bloqueado)</label>
                        <input 
                          type="text" 
                          disabled
                          value={currentProfile?.email || ''}
                          className="w-full text-xs px-3.5 py-2.5 bg-slate-100/85 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed font-medium font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">WhatsApp / Telefone</label>
                        <input 
                          type="text" 
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(formatPhone(e.target.value))}
                          placeholder="Ex: (82) 99999-9999"
                          className="w-full text-xs px-3.5 py-2.5 bg-slate-50/50 border border-slate-250 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-505 text-slate-900 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">CPF</label>
                        <input 
                          type="text" 
                          value={profileCpf}
                          onChange={(e) => setProfileCpf(formatCPF(e.target.value))}
                          placeholder="Ex: 000.000.000-00"
                          className="w-full text-xs px-3.5 py-2.5 bg-slate-50/50 border border-slate-250 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-505 text-slate-900 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">Data de Nascimento</label>
                        <input 
                          type="date" 
                          value={profileBirthdate}
                          onChange={(e) => setProfileBirthdate(e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 bg-slate-50/50 border border-slate-250 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-505 text-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">Endereço Completo</label>
                      <input 
                        type="text" 
                        value={profileAddress}
                        onChange={(e) => setProfileAddress(e.target.value)}
                        placeholder="Ex: Av. Governador Afrânio Lages, Jatiúca, Maceió - AL"
                        className="w-full text-xs px-3.5 py-2.5 bg-slate-50/50 border border-slate-250 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-505 text-slate-900 font-medium"
                      />
                    </div>

                    <div className="flex justify-end pt-4">
                      <button 
                        type="submit"
                        className="bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        <Check className="w-4 h-4 text-white" /> Salvar Informações do Perfil
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* FICHA DE TREINO COMPLETA E ATUALIZADA DO ALUNO */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 mt-6 space-y-4 shadow-sm text-left">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3 gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-indigo-650 uppercase tracking-wider font-sans flex items-center gap-1.5">
                      <Dumbbell className="w-5 h-5 text-indigo-600 animate-pulse" /> Meu Cronograma de Treino Ativo
                    </h3>
                    <p className="text-[11px] text-slate-500 font-sans mt-0.5">Montado e atualizado pelo seu personal trainer.</p>
                  </div>
                  {activeWorkout && (
                    <span className="text-[10px] bg-indigo-50 border border-indigo-150 text-indigo-700 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                      🎯 {activeWorkout.name} (Ativo)
                    </span>
                  )}
                </div>

                {!activeWorkout ? (
                  <div className="p-8 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-xl">
                    <p className="text-xs text-slate-500 font-sans">Você não possui nenhum treino ativo no momento. Entre em contato com seu personal trainer.</p>
                  </div>
                ) : (
                  <div className="space-y-4 font-sans text-left">
                    {activeWorkout.description && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs italic text-slate-650 font-sans">
                        <strong>🎯 Observação Geral:</strong> {activeWorkout.description}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeDays.map((docDay) => {
                        const docExercises = workoutExercises.filter(we => we.workout_day_id === docDay.id);
                        return (
                          <div key={docDay.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                            <div>
                              <div className="border-b border-indigo-100 pb-2 mb-3 flex items-center justify-between">
                                <span className="font-extrabold text-xs text-indigo-950 uppercase tracking-wide">
                                  ⚡ {docDay.day_name}
                                </span>
                                <span className="text-[9px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-150">
                                  {docExercises.length} exercícios
                                </span>
                              </div>

                              <div className="space-y-3">
                                {docExercises.map((we, index) => {
                                  const exObj = exercises.find(e => e.id === we.exercise_id);
                                  const isCardio = exObj?.category === 'Cardio';

                                  return (
                                    <div key={we.id} className="bg-white p-2.5 rounded-lg border border-slate-150 text-xs space-y-1 text-left">
                                      <div className="flex items-start justify-between gap-1">
                                        <span className="font-bold text-slate-900 leading-tight">
                                          {index + 1}. {exObj?.name || 'Exercício'}
                                        </span>
                                        <span className="text-[9px] font-mono text-slate-500 shrink-0 uppercase bg-slate-100 px-1 rounded">
                                          {exObj?.category || 'Geral'}
                                        </span>
                                      </div>
                                      
                                      {we.observations && (
                                        <p className="text-[10px] text-slate-500 leading-relaxed italic bg-slate-50/50 p-1.5 rounded border border-slate-100 mb-1">
                                          📝 {we.observations}
                                        </p>
                                      )}

                                      {isCardio ? (
                                        <div className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded inline-block font-extrabold">
                                          ⏱️ Tempo Sugerido: {we.reps} minutos
                                        </div>
                                      ) : (
                                        <div className="flex flex-wrap gap-x-2.5 gap-y-1 text-[10px] font-mono text-slate-500">
                                          <span>Séries: <strong className="text-slate-900">{we.series}</strong></span>
                                          <span>Reps: <strong className="text-slate-900">{we.reps}</strong></span>
                                          {we.load_kg !== undefined && we.load_kg > 0 && (
                                            <span>Carga: <strong className="text-indigo-600">{we.load_kg}kg</strong></span>
                                          )}
                                          <span>Descanso: <strong className="text-slate-500">{we.rest_seconds}s</strong></span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}

                                {docExercises.length === 0 && (
                                  <p className="text-[10px] text-slate-400 italic font-sans">Sem exercícios cadastrados.</p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* CARD DE SEGURANÇA / SENHA */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 mt-6 space-y-4 shadow-sm">
                <h3 className="text-xs font-bold text-rose-600 uppercase tracking-widest font-mono border-b border-slate-100 pb-2.5">Alterar Senha de Acesso</h3>
                
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const newPwVal = (form.elements.namedItem('newPassword') as HTMLInputElement).value;
                    const confirmPwVal = (form.elements.namedItem('confirmPassword') as HTMLInputElement).value;

                    if (newPwVal.length < 5) {
                      triggerToast('⚠️ A nova senha deve ter no mínimo 5 caracteres.');
                      return;
                    }
                    if (newPwVal !== confirmPwVal) {
                      triggerToast('⚠️ As senhas digitadas não coincidem.');
                      return;
                    }

                    try {
                      await updatePassword(currentProfile!.id, newPwVal);
                      triggerToast('🛡️ Sua senha de acesso foi redefinida com sucesso!');
                      form.reset();
                    } catch (err: any) {
                      triggerToast('⚠️ Falha ao redefinir sua senha.');
                    }
                  }} 
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nova Senha</label>
                      <input 
                        type="password" 
                        name="newPassword"
                        placeholder="Mínimo 5 caracteres"
                        required
                        className="w-full text-xs px-3.5 py-2.5 bg-slate-50/50 border border-slate-250 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-505 text-slate-900 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Confirmar Nova Senha</label>
                      <input 
                        type="password" 
                        name="confirmPassword"
                        placeholder="Repita a nova senha"
                        required
                        className="w-full text-xs px-3.5 py-2.5 bg-slate-50/50 border border-slate-250 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-505 text-slate-900 font-medium"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button 
                      type="submit"
                      className="bg-slate-900 hover:bg-slate-950 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Lock className="w-4 h-4 text-white" /> Atualizar Minha Senha de Acesso
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

      </DashboardLayout>

      {toast && (
        <Toast message={toast} icon={<Trophy className="w-5 h-5" />} variant="default" />
      )}

      {/* ==================================== MODAL: EXERCISE FEEDBACK SUBMIT ==================================== */}
      {selectedExercise && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 sm:p-8 relative text-xs text-slate-700 shadow-2xl">
            <button 
              onClick={() => setSelectedExercise(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 font-sans mb-1">Registrar Carga / Desempenho</h3>
            <p className="text-slate-500 leading-normal mb-6 font-light font-sans">Forneça o feedback da carga real e percepção de esforço ao seu personal felipe.</p>

            <form onSubmit={handleRegisterLogSubmit} className="space-y-4">
              {(() => {
                const currentWe = workoutExercises.find(we => we.id === selectedExercise);
                const currentEx = currentWe ? exercises.find(ex => ex.id === currentWe.exercise_id) : null;
                const isCardio = currentEx?.category === 'Cardio';

                if (isCardio) {
                  return (
                    <div>
                      <label className="block text-slate-500 uppercase mb-2 text-[10px] font-semibold">🕒 Tempo Praticado (Minutos)</label>
                      <input 
                        type="number"
                        value={logReps}
                        onChange={(e) => setLogReps(e.target.value)}
                        placeholder="Ex: 30"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-205 border-indigo-200 text-indigo-600 font-extrabold rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        required
                      />
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-slate-500 uppercase mb-2 text-[10px] font-semibold">Séries Feitas</label>
                      <input 
                        type="number"
                        value={logSeries}
                        onChange={(e) => setLogSeries(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 uppercase mb-2 text-[10px] font-semibold">Reps Feitas</label>
                      <input 
                        type="number"
                        value={logReps}
                        onChange={(e) => setLogReps(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 uppercase mb-2 text-[10px] font-semibold">Carga Usada (kg)</label>
                      <input 
                        type="number"
                        value={logLoad}
                        onChange={(e) => setLogLoad(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-indigo-600 rounded-lg font-extrabold focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block text-slate-500 uppercase mb-2 text-[10px] font-semibold">Percepção de Dificuldade</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { v: 'easy', l: 'Fácil' },
                    { v: 'moderate', l: 'Moderado' },
                    { v: 'hard', l: 'Difícil' },
                    { v: 'extreme', l: 'Extremo' }
                  ].map(dif => (
                    <button
                      key={dif.v}
                      type="button"
                      onClick={() => setLogDifficulty(dif.v as any)}
                      className={`py-2 px-1 text-[11px] font-semibold border rounded-lg transition cursor-pointer ${
                        logDifficulty === dif.v ? 'bg-indigo-600 text-white border-indigo-600 font-bold' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {dif.l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-500 uppercase mb-2 text-[10px] font-semibold">Comentários (Opcional)</label>
                <textarea
                  value={logComments}
                  onChange={(e) => setLogComments(e.target.value)}
                  placeholder="Ex: Lombar correu 100%, sem incômodo articular..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-sans focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                ></textarea>
              </div>

              <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3.5 rounded-xl font-sans text-xs tracking-wider uppercase shadow-md cursor-pointer transition-colors"
              >
                Enviar Feedback
              </button>
            </form>
          </div>
        </div>
      )}

    </>
  );
}
