import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { rewardGameCoins } from "@/lib/games.functions";
import { AppHeader } from "@/components/AppHeader";
import { ArrowLeft, BookOpen, Atom, Sparkles, Trophy, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { getRandomQuestion, type Question } from "@/lib/question-engine";
import { analyticsEngine } from "@/lib/analytics-engine";

export const Route = createFileRoute("/_authenticated/games/laboratorio-inventores")({
  head: () => ({ meta: [{ title: "Laboratorio de Inventores — Lybanhi" }] }),
  component: LaboratorioInventoresGame,
});

interface ElementItem {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

interface Recipe {
  elementA: string;
  elementB: string;
  resultName: string;
  resultEmoji: string;
  subject: "math" | "physics" | "chemistry" | "biology" | "programming";
  patentValue: number;
}

const ELEMENTS: ElementItem[] = [
  { id: "h", name: "Hidrógeno", emoji: "🎈", description: "El elemento químico más abundante y ligero del universo." },
  { id: "o", name: "Oxígeno", emoji: "💨", description: "Gas altamente reactivo esencial para la respiración aeróbica." },
  { id: "c", name: "Carbono", emoji: "💎", description: "Base de la química orgánica y de toda la vida conocida." },
  { id: "si", name: "Silicio", emoji: "🖲️", description: "Semiconductor clave para la electrónica y microchips." },
  { id: "fe", name: "Hierro", emoji: "🔩", description: "Metal dúctil utilizado en aleaciones estructurales." },
];

const RECIPES: Recipe[] = [
  { elementA: "h", elementB: "o", resultName: "Agua Molecular", resultEmoji: "💧", subject: "chemistry", patentValue: 5 },
  { elementA: "c", elementB: "fe", resultName: "Acero Forjado", resultEmoji: "⚔️", subject: "physics", patentValue: 8 },
  { elementA: "si", elementB: "c", resultName: "Microprocesador Semis", resultEmoji: "💾", subject: "programming", patentValue: 12 },
];

function LaboratorioInventoresGame() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const rewardCoins = useServerFn(rewardGameCoins);

  const [activeTab, setActiveTab] = useState<"combine" | "patents">("combine");
  const [selectedA, setSelectedA] = useState<string | null>(null);
  const [selectedB, setSelectedB] = useState<string | null>(null);

  // Invented items state (saved in local memory)
  const [discoveredPatents, setDiscoveredPatents] = useState<string[]>([]);
  
  // Question State
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAns, setSelectedAns] = useState<number | null>(null);
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState(0);

  const rewardMutation = useMutation({
    mutationFn: (coins: number) => rewardCoins({ data: { coins } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const handleCombine = () => {
    if (!selectedA || !selectedB) return;
    if (selectedA === selectedB) {
      toast.error("Debes seleccionar dos elementos diferentes.");
      return;
    }

    // Find if a recipe exists
    const recipe = RECIPES.find(
      r => (r.elementA === selectedA && r.elementB === selectedB) ||
           (r.elementA === selectedB && r.elementB === selectedA)
    );

    if (!recipe) {
      toast.error("Combinación fallida. Esos elementos no reaccionan entre sí.");
      return;
    }

    setActiveRecipe(recipe);
    setSelectedAns(null);
    setQuestionStartTime(Date.now());

    // Load question related to the recipe subject
    const q = getRandomQuestion({ subject: recipe.subject });
    setCurrentQuestion(q);
  };

  const handleSubmitAnswer = (idx: number) => {
    if (!currentQuestion || !activeRecipe) return;
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
        if (!discoveredPatents.includes(activeRecipe.resultName)) {
          setDiscoveredPatents(prev => [...prev, activeRecipe.resultName]);
          // Reward coins for patent discovery
          rewardMutation.mutate(activeRecipe.patentValue);
          toast.success(`¡Éxito científico! Descubriste: ${activeRecipe.resultName} ${activeRecipe.resultEmoji} y cobraste la patente (+${activeRecipe.patentValue} Sombreritos)`);
        } else {
          toast.info("Ya habías patentado esta invención.");
        }
      } else {
        toast.error("La combinación estalló por respuesta incorrecta.");
      }
      setSelectedA(null);
      setSelectedB(null);
      setActiveRecipe(null);
      setCurrentQuestion(null);
    }, 1500);
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#080D24]/90 backdrop-blur-xl border-b border-[#1E2D5A] px-6 py-4 flex items-center justify-between text-white">
        <button onClick={() => navigate({ to: "/games" })} className="text-[#8896B3] hover:text-white font-bold flex items-center gap-1.5 cursor-pointer bg-transparent border-none">
          <ArrowLeft className="size-5" /> Atrás
        </button>
        <h1 className="font-display text-lg font-bold">Laboratorio de Inventores</h1>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-yellow-400">
          <Lightbulb className="size-4 animate-pulse" />
          <span>{discoveredPatents.length} patentes activas</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 pt-6 pb-24 text-white min-h-[calc(100vh-64px)] bg-[#080D24]">
        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-[#1E2D5A] pb-3 mb-6">
          {(["combine", "patents"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition ${
                activeTab === tab ? "bg-primary text-white" : "text-[#8896B3] hover:text-white hover:bg-white/5"
              }`}
            >
              {tab === "combine" ? "Matraz de Fusión" : "Registro de Patentes"}
            </button>
          ))}
        </div>

        {/* Tab 1: Combine Elements */}
        {activeTab === "combine" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Elements Roster */}
            <div className="md:col-span-2 bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-6">
              <h3 className="font-display font-black text-lg text-primary flex items-center gap-2 mb-4">
                <Atom className="size-5" /> Elementos Físico-Químicos
              </h3>
              <p className="text-xs text-slate-400 mb-6">Selecciona dos elementos distintos de la lista para fusionarlos en el matraz:</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ELEMENTS.map(el => {
                  const isA = selectedA === el.id;
                  const isB = selectedB === el.id;
                  const isSelected = isA || isB;

                  return (
                    <button
                      key={el.id}
                      onClick={() => {
                        if (isA) setSelectedA(null);
                        else if (isB) setSelectedB(null);
                        else if (!selectedA) setSelectedA(el.id);
                        else if (!selectedB) setSelectedB(el.id);
                        else toast.error("Ya seleccionaste dos elementos.");
                      }}
                      className={`p-4 rounded-xl border text-center transition flex flex-col items-center justify-between cursor-pointer ${
                        isSelected
                          ? "bg-primary/20 border-primary text-primary"
                          : "bg-[#17224D] border-[#3B6DE8]/10 text-white"
                      }`}
                    >
                      <span className="text-3xl select-none">{el.emoji}</span>
                      <h4 className="font-bold text-xs mt-2">{el.name}</h4>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fusion Crucible */}
            <div className="bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-5 flex flex-col justify-between min-h-[300px]">
              <div className="text-center space-y-4">
                <h3 className="font-display font-bold text-sm text-[#8896B3] border-b border-[#1E2D5A] pb-2">Matraz de Reacción</h3>
                
                <div className="flex justify-center items-center gap-4 py-6">
                  <div className="size-16 rounded-full border-2 border-dashed border-[#1E2D5A] grid place-items-center text-2xl font-bold bg-[#17224D]/30">
                    {selectedA ? ELEMENTS.find(e => e.id === selectedA)?.emoji : "?"}
                  </div>
                  <span className="text-xl font-black text-slate-500">+</span>
                  <div className="size-16 rounded-full border-2 border-dashed border-[#1E2D5A] grid place-items-center text-2xl font-bold bg-[#17224D]/30">
                    {selectedB ? ELEMENTS.find(e => e.id === selectedB)?.emoji : "?"}
                  </div>
                </div>
              </div>

              <button
                disabled={!selectedA || !selectedB}
                onClick={handleCombine}
                className="w-full h-12 bg-primary hover:bg-primary-glow font-bold text-xs tracking-wider rounded-2xl cursor-pointer border-none transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Girar Matraz de Fusión
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Patents */}
        {activeTab === "patents" && (
          <div className="bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-6">
            <h3 className="font-display font-black text-lg text-[#00CC66] flex items-center gap-2 mb-4">
              <BookOpen className="size-5" /> Registro Oficial de Patentes
            </h3>
            <p className="text-xs text-slate-400 mb-6">Lista de inventos científicos registrados y patentados por ti:</p>

            <div className="space-y-4">
              {RECIPES.map((recipe, idx) => {
                const isDiscovered = discoveredPatents.includes(recipe.resultName);
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border flex justify-between items-center ${
                      isDiscovered ? "bg-emerald-600/10 border-emerald-500/20 text-emerald-400" : "bg-[#17224D]/30 border-[#1E2D5A]/50 text-slate-500"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl select-none">{isDiscovered ? recipe.resultEmoji : "❓"}</span>
                      <div>
                        <h4 className="font-bold text-sm">{isDiscovered ? recipe.resultName : "Invención Desconocida"}</h4>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Disciplina: {recipe.subject}</span>
                      </div>
                    </div>
                    {isDiscovered ? (
                      <span className="text-xs font-bold text-emerald-400">Patente Activa (+{recipe.patentValue} 🎓)</span>
                    ) : (
                      <span className="text-xs font-bold text-slate-500">No Descubierto</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Question Modal */}
      {currentQuestion && activeRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-6 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-[#1E2D5A] bg-[#0D1535] p-6 shadow-elegant space-y-4 text-center">
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary border border-primary/30">
              Validación Científica para: {activeRecipe.resultName}
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
