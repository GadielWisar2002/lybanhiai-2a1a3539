import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { rewardGameCoins } from "@/lib/games.functions";
import { AppHeader } from "@/components/AppHeader";
import { ArrowLeft, BookOpen, GraduationCap, Laptop, Sparkles, Trophy } from "lucide-react";
import { toast } from "sonner";
import { getRandomQuestion, type Question } from "@/lib/question-engine";
import { analyticsEngine } from "@/lib/analytics-engine";

export const Route = createFileRoute("/_authenticated/games/centro-investigacion")({
  head: () => ({ meta: [{ title: "Centro de Investigación — Lybanhi" }] }),
  component: CentroInvestigacionGame,
});

interface ResearchNode {
  id: string;
  label: string;
  sub: string;
  cost: number;
  unlocked: boolean;
  subject: string;
}

interface Paper {
  id: string;
  title: string;
  subject: string;
  requiredAnswers: number;
  currentAnswers: number;
  rewardCoins: number;
  status: "locked" | "drafting" | "published";
}

function CentroInvestigacionGame() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const rewardCoins = useServerFn(rewardGameCoins);

  const [activeTab, setActiveTab] = useState<"tree" | "papers" | "lab">("tree");
  
  // State for Tree Nodes
  const [nodes, setNodes] = useState<ResearchNode[]>([
    { id: "node1", label: "Aritmética Cuántica", sub: "Matemáticas", cost: 50, unlocked: true, subject: "math" },
    { id: "node2", label: "Cinemática Dinámica", sub: "Física", cost: 100, unlocked: false, subject: "physics" },
    { id: "node3", label: "Enlace Iónico Avanzado", sub: "Química", cost: 150, unlocked: false, subject: "chemistry" },
    { id: "node4", label: "Leyes Mendelianas", sub: "Biología", cost: 200, unlocked: false, subject: "biology" },
  ]);

  // State for Research Papers
  const [papers, setPapers] = useState<Paper[]>([
    { id: "p1", title: "Estudio sobre la Aceleración Constante", subject: "physics", requiredAnswers: 4, currentAnswers: 0, rewardCoins: 12, status: "drafting" },
    { id: "p2", title: "Análisis del Genotipo Recesivo", subject: "biology", requiredAnswers: 5, currentAnswers: 0, rewardCoins: 18, status: "locked" },
  ]);

  // Lab Bench upgrades
  const [labUpgrades, setLabUpgrades] = useState([
    { id: "bench1", name: "Microscopio de Barrido", cost: 15, level: 0, bonus: "+5% XP en Ciencias" },
    { id: "bench2", name: "Calculadora Simbólica", cost: 25, level: 0, bonus: "+10% XP en Matemáticas" },
  ]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAns, setSelectedAns] = useState<number | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState(0);

  const rewardMutation = useMutation({
    mutationFn: (coins: number) => rewardCoins({ data: { coins } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const handleStartNodeUnlock = (node: ResearchNode) => {
    if (node.unlocked) return;
    const q = getRandomQuestion({ subject: node.subject as any });
    setCurrentQuestion(q);
    setSelectedNodeId(node.id);
    setSelectedPaperId(null);
    setSelectedAns(null);
    setQuestionStartTime(Date.now());
  };

  const handleStartPaperDraft = (paper: Paper) => {
    if (paper.status === "locked" || paper.status === "published") return;
    const q = getRandomQuestion({ subject: paper.subject as any });
    setCurrentQuestion(q);
    setSelectedPaperId(paper.id);
    setSelectedNodeId(null);
    setSelectedAns(null);
    setQuestionStartTime(Date.now());
  };

  const handleSubmitAnswer = (idx: number) => {
    if (!currentQuestion) return;
    setSelectedAns(idx);
    const correct = currentQuestion.type === "multiple-choice" ? currentQuestion.correctIndex === idx : false;
    const timeTaken = Date.now() - questionStartTime;

    analyticsEngine.trackAnswer(
      currentQuestion.subject,
      currentQuestion.topic,
      correct,
      timeTaken,
      currentQuestion.id
    );

    setTimeout(() => {
      if (correct) {
        if (selectedNodeId) {
          // Unlock node
          setNodes(prev => prev.map(n => n.id === selectedNodeId ? { ...n, unlocked: true } : n));
          toast.success("¡Pregunta correcta! Nodo de investigación desbloqueado. 🔬");
          // Optionally reward a small XP / Sombrerito
          rewardMutation.mutate(2);
        } else if (selectedPaperId) {
          // Increment paper progress
          setPapers(prev => prev.map(p => {
            if (p.id === selectedPaperId) {
              const nextAns = p.currentAnswers + 1;
              const isDone = nextAns >= p.requiredAnswers;
              if (isDone) {
                rewardMutation.mutate(p.rewardCoins);
                toast.success(`¡Paper publicado con éxito! Recibes +${p.rewardCoins} Sombreritos! 📜`);
                return { ...p, currentAnswers: nextAns, status: "published" };
              }
              toast.success(`¡Respuesta correcta! Progreso de redacción: ${nextAns}/${p.requiredAnswers}`);
              return { ...p, currentAnswers: nextAns };
            }
            return p;
          }));
        }
      } else {
        toast.error("Respuesta incorrecta. El experimento ha fallado. Revisa la explicación e inténtalo de nuevo.");
      }
      setSelectedNodeId(null);
      setSelectedPaperId(null);
      setCurrentQuestion(null);
    }, 1500);
  };

  const handleBuyUpgrade = (upgradeId: string, cost: number) => {
    // Check if player has enough coins (sombreritos)
    // For mockup, let's assume we proceed and upgrade
    setLabUpgrades(prev => prev.map(u => u.id === upgradeId ? { ...u, level: u.level + 1, cost: u.cost + 10 } : u));
    rewardMutation.mutate(-cost);
    toast.success("¡Equipamiento del laboratorio mejorado!");
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#080D24]/90 backdrop-blur-xl border-b border-[#1E2D5A] px-6 py-4 flex items-center justify-between text-white">
        <button onClick={() => navigate({ to: "/games" })} className="text-[#8896B3] hover:text-white font-bold flex items-center gap-1.5 cursor-pointer bg-transparent border-none">
          <ArrowLeft className="size-5" /> Atrás
        </button>
        <h1 className="font-display text-lg font-bold">Centro de Investigación</h1>
        <div className="size-5" />
      </header>

      <main className="mx-auto max-w-4xl px-5 pt-6 pb-24 text-white min-h-[calc(100vh-64px)] bg-[#080D24]">
        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-[#1E2D5A] pb-3 mb-6">
          {(["tree", "papers", "lab"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition ${
                activeTab === tab ? "bg-primary text-white" : "text-[#8896B3] hover:text-white hover:bg-white/5"
              }`}
            >
              {tab === "tree" ? "Árbol de Habilidades" : tab === "papers" ? "Publicación de Papers" : "Equipamiento del Lab"}
            </button>
          ))}
        </div>

        {/* Tab 1: Tree */}
        {activeTab === "tree" && (
          <div className="bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-6">
            <h3 className="font-display font-black text-lg text-primary flex items-center gap-2 mb-4">
              <Laptop className="size-5" /> Árbol de Habilidades Científicas
            </h3>
            <p className="text-xs text-slate-400 mb-6">Desbloquea áreas de especialidad resolviendo preguntas de materias específicas:</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {nodes.map(node => (
                <button
                  key={node.id}
                  disabled={node.unlocked}
                  onClick={() => handleStartNodeUnlock(node)}
                  className={`p-5 rounded-2xl border text-left cursor-pointer transition flex flex-col justify-between min-h-[120px] ${
                    node.unlocked
                      ? "bg-emerald-600/10 border-emerald-500/30 text-emerald-400"
                      : "bg-[#17224D] border-[#3B6DE8]/20 hover:border-primary text-white"
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase">{node.sub}</span>
                    <h4 className="font-bold text-sm mt-1">{node.label}</h4>
                  </div>
                  <div className="mt-4 flex justify-between items-center text-[10px] font-bold">
                    <span>{node.unlocked ? "Desbloqueado" : "Click para desbloquear"}</span>
                    {!node.unlocked && <span className="bg-[#3B6DE8]/20 px-2 py-0.5 rounded">Nodo Cerrado</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Papers */}
        {activeTab === "papers" && (
          <div className="bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-6">
            <h3 className="font-display font-black text-lg text-[#00CC66] flex items-center gap-2 mb-4">
              <BookOpen className="size-5" /> Publicación de Papers Científicos
            </h3>
            <p className="text-xs text-slate-400 mb-6">Redacta y publica investigaciones resolviendo tandas de preguntas del campo seleccionado para generar Sombreritos:</p>

            <div className="space-y-4">
              {papers.map(paper => (
                <div
                  key={paper.id}
                  className="bg-[#17224D] border border-[#3B6DE8]/20 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div>
                    <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded font-bold uppercase">{paper.subject}</span>
                    <h4 className="font-bold text-sm text-white mt-1.5">{paper.title}</h4>
                    <div className="mt-2 flex gap-4 text-[10px] text-slate-400 font-bold">
                      <span>Redacción: {paper.currentAnswers} / {paper.requiredAnswers}</span>
                      <span>Recompensa: +{paper.rewardCoins} Sombreritos</span>
                    </div>
                  </div>
                  {paper.status === "drafting" ? (
                    <button
                      onClick={() => handleStartPaperDraft(paper)}
                      className="h-10 px-5 bg-primary hover:bg-primary-glow font-bold text-xs rounded-xl cursor-pointer border-none transition active:scale-95 whitespace-nowrap"
                    >
                      Redactar Sección
                    </button>
                  ) : paper.status === "published" ? (
                    <span className="bg-emerald-400/20 text-emerald-400 px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider">Publicado</span>
                  ) : (
                    <span className="bg-slate-800 text-slate-500 px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider">Bloqueado</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Lab Upgrades */}
        {activeTab === "lab" && (
          <div className="bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-6">
            <h3 className="font-display font-black text-lg text-amber-500 flex items-center gap-2 mb-4">
              <GraduationCap className="size-5" /> Equipamiento de Laboratorios
            </h3>
            <p className="text-xs text-slate-400 mb-6">Mejora el equipamiento del Centro de Investigación para obtener bonificaciones de progreso general:</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {labUpgrades.map(up => (
                <div
                  key={up.id}
                  className="bg-[#17224D] border border-[#3B6DE8]/20 rounded-2xl p-5 flex justify-between items-center"
                >
                  <div>
                    <h4 className="font-bold text-sm">{up.name}</h4>
                    <span className="text-[10px] text-slate-400 mt-1 block">Nivel: {up.level} · {up.bonus}</span>
                  </div>
                  <button
                    onClick={() => handleBuyUpgrade(up.id, up.cost)}
                    className="h-9 px-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-xs rounded-xl cursor-pointer border-none transition active:scale-95"
                  >
                    Mejorar ({up.cost} 🎓)
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Question Modal */}
      {currentQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-6 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-[#1E2D5A] bg-[#0D1535] p-6 shadow-elegant space-y-4 text-center">
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary border border-primary/30">
              Materia: {currentQuestion.subject} - {currentQuestion.topic}
            </span>
            <p className="text-sm font-bold text-slate-200">{currentQuestion.prompt}</p>

            {currentQuestion.type === "multiple-choice" && (
              <div className="grid gap-3 pt-3 text-left">
                {currentQuestion.options.map((option, idx) => {
                  let btnStyle = "border-border bg-card text-foreground hover:bg-muted/40";
                  if (selectedAns !== null) {
                    if (idx === currentQuestion.correctIndex) {
                      btnStyle = "border-emerald-500 bg-emerald-600/20 text-emerald-400";
                    } else if (idx === selectedAns) {
                      btnStyle = "border-red-500 bg-red-600/20 text-red-400";
                    } else {
                      btnStyle = "opacity-40 border-border bg-card";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={selectedAns !== null}
                      onClick={() => handleSubmitAnswer(idx)}
                      className={`w-full py-3 px-4 rounded-xl border text-xs font-semibold transition active:scale-98 cursor-pointer ${btnStyle}`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
