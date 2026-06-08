import { useState, useRef, useEffect, useMemo, type Key } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Send, Zap, Dumbbell, Apple, TrendingUp, ChevronRight,
  Sparkles, RotateCcw, Copy, ThumbsUp, ThumbsDown, Bot,
} from "lucide-react";
import { useStore } from "../../../services/store";
import { GlassCard } from "../ui/GlassCard";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Avatar } from "../ui/Avatar";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

function MessageBubble({ message, trainerName }: { key?: Key; message: Message; trainerName: string }) {
  const isAssistant = message.role === "assistant";

  const formatContent = (content: string) => {
    return content.split("\n").map((line, i) => {
      if (line.startsWith("**") && line.endsWith("**")) {
        return <p key={i} className="font-bold text-foreground my-1">{line.slice(2, -2)}</p>;
      }
      if (line.startsWith("• ") || line.match(/^\d+\. /)) {
        const text = line.replace(/\*\*(.*?)\*\*/g, (_, p1) => `<strong>${p1}</strong>`);
        return <li key={i} className="ml-4 text-sm text-foreground list-disc" dangerouslySetInnerHTML={{ __html: text }} />;
      }
      if (line === "") return <div key={i} className="h-1" />;
      const text = line.replace(/\*\*(.*?)\*\*/g, (_, p1) => `<strong>${p1}</strong>`);
      return <p key={i} className="text-sm text-foreground" dangerouslySetInnerHTML={{ __html: text }} />;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isAssistant ? "" : "flex-row-reverse"}`}
    >
      {isAssistant ? (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
      ) : (
        <Avatar name={trainerName} size="sm" />
      )}
      <div className={`max-w-[85%] flex flex-col gap-1 ${isAssistant ? "" : "items-end"}`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${isAssistant ? "bg-card border border-border text-foreground rounded-tl-sm" : "bg-primary text-white rounded-tr-sm"}`}>
          <div className="space-y-1">{formatContent(message.content)}</div>
        </div>
      </div>
    </motion.div>
  );
}

export function AIAssistantPage() {
  const { currentProfile, students, profiles, askAIChat } = useStore();
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "0",
      role: "assistant",
      content: `Olá, **${currentProfile?.name?.split(" ")[0] || "Personal"}**! Sou sua IA assistente.\n\nSelecione um aluno abaixo para sugestões de treino personalizadas ou faça uma pergunta geral.`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const trainerStudents = useMemo(() => {
    return students
      .filter((s) => s.trainer_id === currentProfile?.id)
      .map((s) => ({
        id: s.id,
        name: profiles.find((p) => p.id === s.id)?.name || "Aluno",
        objective: s.objective,
      }));
  }, [students, profiles, currentProfile?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const suggestions = useMemo(() => {
    const st = trainerStudents.find((s) => s.id === selectedStudentId);
    const name = st?.name || "aluno";
    return [
      { icon: Dumbbell, label: `Montar treino para ${name}`, category: "Treino" },
      { icon: TrendingUp, label: `Analisar progresso de ${name}`, category: "Análise" },
      { icon: Sparkles, label: "Exercícios para dor lombar", category: "Adaptação" },
      { icon: Apple, label: "Sugestão de macros peri-treino", category: "Nutrição" },
    ];
  }, [trainerStudents, selectedStudentId]);

  const sendMessage = async (content?: string) => {
    const text = content || input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const result = await askAIChat(text, selectedStudentId || undefined);

    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: result.suggestion + (result.isAI ? "" : "\n\n_Resposta local — configure Gemini em server.ts para IA completa._"),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 4rem)" }}>
      <div className="p-4 lg:px-8 lg:pt-6 border-b border-border bg-background">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">IA Assistente AxxosFit</p>
            <p className="text-xs text-muted-foreground">Gemini · dados reais dos alunos</p>
          </div>
          <Badge variant="accent" className="ml-auto">Beta</Badge>
        </div>

        {trainerStudents.length > 0 && (
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full mb-3 h-10 px-3 rounded-xl border border-border bg-input-background text-sm text-foreground"
          >
            <option value="">Pergunta geral (sem aluno)</option>
            {trainerStudents.map((s) => (
              <option key={s.id} value={s.id}>{s.name} — {s.objective}</option>
            ))}
          </select>
        )}

        <div className="flex gap-2 overflow-x-auto pb-1">
          {suggestions.map(({ icon: Icon, label }) => (
            <button
              key={label}
              onClick={() => sendMessage(label)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border text-xs text-muted-foreground hover:border-primary/40 whitespace-nowrap shrink-0"
            >
              <Icon className="w-3.5 h-3.5" />
              {label.slice(0, 40)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:px-8 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} trainerName={currentProfile?.name || "Personal"} />
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Bot className="w-4 h-4 text-white animate-pulse" />
            </div>
            <GlassCard className="px-4 py-3 text-sm text-muted-foreground">Gerando resposta…</GlassCard>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 lg:px-8 border-t border-border bg-background">
        <form
          onSubmit={(e) => { e.preventDefault(); void sendMessage(); }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte sobre treinos, avaliações ou retenção…"
            className="flex-1 h-11 px-4 rounded-xl border border-border bg-input-background text-sm text-foreground placeholder:text-muted-foreground"
            disabled={loading}
          />
          <Button type="submit" variant="primary" icon={<Send className="w-4 h-4" />} loading={loading} />
        </form>
      </div>
    </div>
  );
}
