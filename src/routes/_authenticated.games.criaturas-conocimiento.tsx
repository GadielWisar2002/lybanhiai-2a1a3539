import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { rewardGameCoins } from "@/lib/games.functions";
import { AppHeader } from "@/components/AppHeader";
import { ArrowLeft, Sword, Sparkles, Trophy, BookOpen, User, Flame } from "lucide-react";
import { toast } from "sonner";
import { getRandomQuestion, type Question } from "@/lib/question-engine";
import { analyticsEngine } from "@/lib/analytics-engine";
import streakCap from "@/assets/streak-cap.png";

export const Route = createFileRoute("/_authenticated/games/criaturas-conocimiento")({
  head: () => ({ meta: [{ title: "Criaturas del Conocimiento — Lybanhi" }] }),
  component: CriaturasConocimientoGame,
});

interface Creature {
  id: string;
  name: string;
  emoji: string;
  rarity: "common" | "rare" | "epic" | "legendary" | "mythic";
  subject: string;
  concept: string;
  description: string;
  evolutionStage: 1 | 2 | 3;
  nextEvoId?: string;
  evoPointsNeeded: number;
}

const CREATURES_DATABASE: Record<string, Creature> = {
  algebron: {
    id: "algebron",
    name: "Algebrón",
    emoji: "📐",
    rarity: "common",
    subject: "math",
    concept: "Ecuaciones Algebraicas",
    description: "Una ecuación algebraica es una igualdad matemática entre dos expresiones algebraicas que contiene una o más incógnitas. Resolverla consiste en encontrar los valores de las incógnitas que satisfacen la igualdad.",
    evolutionStage: 1,
    nextEvoId: "algebrox",
    evoPointsNeeded: 10,
  },
  algebrox: {
    id: "algebrox",
    name: "Algebrox",
    emoji: "📏",
    rarity: "rare",
    subject: "math",
    concept: "Funciones y Gráficas",
    description: "Las funciones matemáticas relacionan un conjunto de entrada (dominio) con un conjunto de salida (codominio). Se representan gráficamente en un plano cartesiano para visualizar el comportamiento de variables.",
    evolutionStage: 2,
    nextEvoId: "algebraon",
    evoPointsNeeded: 25,
  },
  algebraon: {
    id: "algebraon",
    name: "Algebrón Supremo",
    emoji: "👑",
    rarity: "epic",
    subject: "math",
    concept: "Cálculo Diferencial",
    description: "El cálculo diferencial estudia cómo cambian las funciones cuando sus variables cambian de manera continua. El objeto principal de estudio es la derivada, que representa la tasa de cambio instantánea.",
    evolutionStage: 3,
    evoPointsNeeded: 0,
  },
  fisitron: {
    id: "fisitron",
    name: "Fisitrón",
    emoji: "⚛️",
    rarity: "common",
    subject: "physics",
    concept: "Fuerza Electromagnética",
    description: "La fuerza electromagnética describe la interacción entre partículas cargadas eléctricamente. Está regida por la Ley de Coulomb para cargas estáticas y las Leyes de Maxwell para campos dinámicos.",
    evolutionStage: 1,
    nextEvoId: "fisitron_max",
    evoPointsNeeded: 12,
  },
  fisitron_max: {
    id: "fisitron_max",
    name: "Fisitrón Megatrón",
    emoji: "⚡",
    rarity: "epic",
    subject: "physics",
    concept: "Leyes de Maxwell",
    description: "Las cuatro ecuaciones de Maxwell describen por completo cómo interactúan los campos eléctricos y magnéticos y las cargas eléctricas, fundamentando la teoría clásica del electromagnetismo.",
    evolutionStage: 2,
    evoPointsNeeded: 0,
  },
  alquimin: {
    id: "alquimin",
    name: "Alquimín",
    emoji: "🧪",
    rarity: "common",
    subject: "chemistry",
    concept: "Enlaces Químicos",
    description: "Un enlace químico es la fuerza de atracción que mantiene unidos a los átomos para formar compuestos estables. Destacan los enlaces iónicos (transferencia de electrones) y covalentes (compartición de electrones).",
    evolutionStage: 1,
    nextEvoId: "alquimax",
    evoPointsNeeded: 15,
  },
  alquimax: {
    id: "alquimax",
    name: "Alquimax",
    emoji: "🧫",
    rarity: "epic",
    subject: "chemistry",
    concept: "Tabla Periódica y Electronegatividad",
    description: "La tabla periódica organiza los elementos según su número atómico. La electronegatividad mide la capacidad de un átomo para atraer electrones en un enlace, determinando el tipo de molécula resultante.",
    evolutionStage: 2,
    evoPointsNeeded: 0,
  },
  biolon: {
    id: "biolon",
    name: "Biolón",
    emoji: "🧬",
    rarity: "rare",
    subject: "biology",
    concept: "División Celular",
    description: "La mitosis y la meiosis son los procesos de división celular. La mitosis produce células hijas idénticas para crecimiento y reparación, mientras que la meiosis produce gametos con la mitad de carga genética.",
    evolutionStage: 1,
    evoPointsNeeded: 20,
  },
};

function CriaturasConocimientoGame() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const rewardCoins = useServerFn(rewardGameCoins);

  const [activeTab, setActiveTab] = useState<"battle" | "compendium" | "train">("battle");
  const [playerCreatures, setPlayerCreatures] = useState<string[]>(["algebron", "fisitron"]);
  const [creatureEvoPoints, setCreatureEvoPoints] = useState<Record<string, number>>({ algebron: 2, fisitron: 0 });

  // Battle State
  const [wildCreature, setWildCreature] = useState<Creature>(CREATURES_DATABASE.alquimin);
  const [wildHp, setWildHp] = useState(100);
  const [playerCreatureId, setPlayerCreatureId] = useState("algebron");
  const [playerHp, setPlayerHp] = useState(100);
  const [battleLog, setBattleLog] = useState<string[]>(["¡Un Alquimín salvaje ha aparecido!"]);

  // Question State
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState(0);

  const rewardMutation = useMutation({
    mutationFn: (coins: number) => rewardCoins({ data: { coins } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("+3 Sombreritos ganados! 🎓");
    },
    onError: () => toast.error(t("common.error")),
  });

  const activePlayerCreature = CREATURES_DATABASE[playerCreatureId] || CREATURES_DATABASE.algebron;

  const loadNewQuestion = () => {
    const q = getRandomQuestion({
      subject: wildCreature.subject as any,
    });
    setCurrentQuestion(q);
    setSelectedOption(null);
    setQuestionStartTime(Date.now());
  };

  const handleStartAttack = () => {
    loadNewQuestion();
    setShowQuestionModal(true);
  };

  const submitAnswer = (optionIdx: number) => {
    if (!currentQuestion) return;
    setSelectedOption(optionIdx);
    const correct = currentQuestion.type === "multiple-choice" ? currentQuestion.correctIndex === optionIdx : false;
    const timeTaken = Date.now() - questionStartTime;

    // Track in analytics
    analyticsEngine.trackAnswer(
      currentQuestion.subject,
      currentQuestion.topic,
      correct,
      timeTaken,
      currentQuestion.id
    );

    setTimeout(() => {
      setShowQuestionModal(false);
      if (correct) {
        // Player attacks
        const damage = Math.floor(Math.random() * 20) + 20;
        const newWildHp = Math.max(0, wildHp - damage);
        setWildHp(newWildHp);
        
        // Add evolution point to active creature
        setCreatureEvoPoints(prev => ({
          ...prev,
          [playerCreatureId]: (prev[playerCreatureId] || 0) + 2
        }));

        setBattleLog(prev => [
          ...prev,
          `¡Contestaste correctamente! ${activePlayerCreature.name} usa un ataque académico de ${activePlayerCreature.subject} y hace ${damage} de daño a ${wildCreature.name}.`
        ]);

        if (newWildHp <= 0) {
          setBattleLog(prev => [...prev, `¡Has derrotado a ${wildCreature.name}! Puedes intentar capturarlo.`]);
        }
      } else {
        // Enemy counter attacks
        const damage = Math.floor(Math.random() * 15) + 15;
        const newPlayerHp = Math.max(0, playerHp - damage);
        setPlayerHp(newPlayerHp);
        setBattleLog(prev => [
          ...prev,
          `Respuesta incorrecta. ${wildCreature.name} contraataca e inflige ${damage} de daño a ${activePlayerCreature.name}.`
        ]);

        if (newPlayerHp <= 0) {
          setBattleLog(prev => [...prev, `¡${activePlayerCreature.name} se ha debilitado! La batalla ha terminado.`]);
        }
      }
    }, 1500);
  };

  const handleCapture = () => {
    if (wildHp > 0) {
      toast.error("Debes debilitar a la criatura antes de intentar capturarla.");
      return;
    }
    // Attempt capture (costs 5 sombreritos / or free in this mockup)
    const success = Math.random() > 0.2;
    if (success) {
      if (!playerCreatures.includes(wildCreature.id)) {
        setPlayerCreatures(prev => [...prev, wildCreature.id]);
        setCreatureEvoPoints(prev => ({ ...prev, [wildCreature.id]: 0 }));
      }
      toast.success(`¡Felicidades! Has capturado a ${wildCreature.name} 🎉`);
      rewardMutation.mutate(3); // Reward sombreritos
      resetBattle();
    } else {
      toast.error("La criatura escapó de la esfera. ¡Intenta de nuevo!");
    }
  };

  const resetBattle = () => {
    const list = Object.values(CREATURES_DATABASE).filter(c => c.evolutionStage === 1);
    const nextWild = list[Math.floor(Math.random() * list.length)];
    setWildCreature(nextWild);
    setWildHp(100);
    setPlayerHp(100);
    setBattleLog([`¡Un ${nextWild.name} salvaje ha aparecido!`]);
  };

  const handleEvolve = (cid: string) => {
    const creature = CREATURES_DATABASE[cid];
    if (!creature.nextEvoId) return;

    const currentPoints = creatureEvoPoints[cid] || 0;
    if (currentPoints < creature.evoPointsNeeded) {
      toast.error("No tienes suficientes puntos de evolución aún.");
      return;
    }

    const nextEvo = CREATURES_DATABASE[creature.nextEvoId];
    if (nextEvo) {
      setPlayerCreatures(prev => prev.map(id => id === cid ? nextEvo.id : id));
      setCreatureEvoPoints(prev => {
        const next = { ...prev };
        delete next[cid];
        next[nextEvo.id] = 0;
        return next;
      });
      toast.success(`¡Espectacular! ${creature.name} ha evolucionado en ${nextEvo.name}! ✨`);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#080D24]/90 backdrop-blur-xl border-b border-[#1E2D5A] px-6 py-4 flex items-center justify-between text-white">
        <button onClick={() => navigate({ to: "/games" })} className="text-[#8896B3] hover:text-white font-bold flex items-center gap-1.5 cursor-pointer bg-transparent border-none">
          <ArrowLeft className="size-5" /> Atrás
        </button>
        <h1 className="font-display text-lg font-bold">Criaturas del Conocimiento</h1>
        <div className="size-5" />
      </header>

      <main className="mx-auto max-w-4xl px-5 pt-6 pb-24 text-white min-h-[calc(100vh-64px)] bg-[#080D24]">
        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-[#1E2D5A] pb-3 mb-6">
          {(["battle", "compendium", "train"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition ${
                activeTab === tab ? "bg-primary text-white" : "text-[#8896B3] hover:text-white hover:bg-white/5"
              }`}
            >
              {tab === "battle" ? "Combate" : tab === "compendium" ? "Compendio" : "Evolución / Entrenamiento"}
            </button>
          ))}
        </div>

        {/* Tab 1: Battle */}
        {activeTab === "battle" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Arena Board */}
            <div className="md:col-span-2 bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-6 flex flex-col justify-between min-h-[400px]">
              {/* Opponent Row */}
              <div className="flex justify-between items-start">
                <div className="bg-[#17224D] px-4 py-2 rounded-2xl border border-[#3B6DE8]/20 min-w-[150px]">
                  <span className="text-xs uppercase font-bold text-orange-400">{wildCreature.rarity}</span>
                  <h4 className="font-bold text-sm">{wildCreature.name}</h4>
                  <div className="mt-1.5 w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-red-500 h-full transition-all duration-300" style={{ width: `${wildHp}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-400">{wildHp}/100 HP</span>
                </div>
                <div className="text-6xl animate-bounce duration-1000 select-none mr-8 mt-2">{wildCreature.emoji}</div>
              </div>

              {/* Player Row */}
              <div className="flex justify-between items-end mt-12">
                <div className="text-6xl animate-pulse select-none ml-8 mb-2">{activePlayerCreature.emoji}</div>
                <div className="bg-[#17224D] px-4 py-2 rounded-2xl border border-[#3B6DE8]/20 min-w-[150px] text-right">
                  <span className="text-xs uppercase font-bold text-emerald-400">Tu Criatura</span>
                  <h4 className="font-bold text-sm">{activePlayerCreature.name}</h4>
                  <div className="mt-1.5 w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${playerHp}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-400">{playerHp}/100 HP</span>
                </div>
              </div>

              {/* Controls */}
              <div className="mt-6 flex gap-3">
                <button
                  disabled={playerHp <= 0 || wildHp <= 0}
                  onClick={handleStartAttack}
                  className="flex-1 h-12 bg-orange-600 hover:bg-orange-500 font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed border-none"
                >
                  <Sword className="size-4" /> Lanzar Ataque
                </button>
                <button
                  disabled={wildHp > 0}
                  onClick={handleCapture}
                  className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-500 font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed border-none"
                >
                  <Sparkles className="size-4 animate-pulse" /> Capturar (3 sombreritos)
                </button>
                {(playerHp <= 0 || wildHp <= 0) && (
                  <button
                    onClick={resetBattle}
                    className="px-4 h-12 bg-slate-700 hover:bg-slate-600 font-bold rounded-2xl cursor-pointer border-none"
                  >
                    Siguiente batalla
                  </button>
                )}
              </div>
            </div>

            {/* Battle Logs */}
            <div className="bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-5 flex flex-col justify-between">
              <div>
                <h3 className="font-display font-bold text-sm text-[#8896B3] border-b border-[#1E2D5A] pb-2 mb-3">Historial de Combate</h3>
                <div className="space-y-3 overflow-y-auto max-h-[250px] scrollbar-thin text-xs text-slate-300">
                  {battleLog.map((log, idx) => (
                    <p key={idx} className="leading-relaxed border-l-2 border-primary pl-2">{log}</p>
                  ))}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[#1E2D5A] text-xs text-slate-400">
                💡 Consejo: Responde rápido e inteligentemente para maximizar el poder de tu criatura y evolucionarla más velozmente.
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Compendium */}
        {activeTab === "compendium" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.values(CREATURES_DATABASE).map(c => {
                const isOwned = playerCreatures.includes(c.id);
                return (
                  <div
                    key={c.id}
                    className={`bg-[#0D1535] border rounded-2xl p-4 text-center transition flex flex-col justify-between min-h-[160px] ${
                      isOwned ? "border-[#1E2D5A]" : "border-slate-800 opacity-60"
                    }`}
                  >
                    <div className="text-5xl mb-2 select-none">{isOwned ? c.emoji : "❓"}</div>
                    <div>
                      <h4 className="font-bold text-sm">{isOwned ? c.name : "Desconocido"}</h4>
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">{c.subject}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Educational Info Detail */}
            <div className="bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-6">
              <h3 className="font-display font-black text-lg text-primary flex items-center gap-2">
                <BookOpen className="size-5" /> Contenido Educativo Asociado
              </h3>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.values(CREATURES_DATABASE).filter(c => playerCreatures.includes(c.id)).map(c => (
                  <div key={c.id} className="bg-[#17224D]/50 border border-[#3B6DE8]/10 rounded-2xl p-4">
                    <span className="text-2xl">{c.emoji}</span>
                    <h4 className="font-bold text-sm mt-1">{c.name} - Concepto: {c.concept}</h4>
                    <p className="mt-2 text-xs text-slate-400 leading-relaxed">{c.description}</p>
                  </div>
                ))}
                {playerCreatures.length === 0 && (
                  <p className="text-xs text-slate-400 col-span-2">No has capturado ninguna criatura académica todavía. ¡Gana combates en el campo de batalla para coleccionarlas!</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Train / Evolution */}
        {activeTab === "train" && (
          <div className="bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-6">
            <h3 className="font-display font-black text-lg text-[#00CC66] flex items-center gap-2 mb-4">
              <Flame className="size-5" /> Evolución y Entrenamiento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {playerCreatures.map(cid => {
                const creature = CREATURES_DATABASE[cid];
                if (!creature) return null;
                const points = creatureEvoPoints[cid] || 0;
                const canEvolve = creature.nextEvoId && points >= creature.evoPointsNeeded;

                return (
                  <div key={cid} className="bg-[#17224D] border border-[#3B6DE8]/20 rounded-2xl p-5 flex flex-col justify-between min-h-[180px]">
                    <div className="flex gap-4 items-start">
                      <span className="text-5xl select-none">{creature.emoji}</span>
                      <div>
                        <h4 className="font-bold text-base">{creature.name}</h4>
                        <span className="text-xs text-slate-400 capitalize">Materia: {creature.subject}</span>
                        {creature.nextEvoId ? (
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                              <span>Puntos de Evolución</span>
                              <span>{points} / {creature.evoPointsNeeded} XP</span>
                            </div>
                            <div className="w-48 bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-primary h-full transition-all duration-300"
                                style={{ width: `${Math.min(100, (points / creature.evoPointsNeeded) * 100)}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="mt-2 inline-block px-2 py-0.5 rounded bg-amber-400/20 text-amber-500 font-bold text-[9px] uppercase">Evolución Máxima</span>
                        )}
                      </div>
                    </div>
                    {canEvolve && (
                      <button
                        onClick={() => handleEvolve(cid)}
                        className="mt-4 w-full h-10 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer border-none transition active:scale-95"
                      >
                        <Sparkles className="size-4 animate-spin" /> ¡Evolucionar!
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Question Modal */}
      {showQuestionModal && currentQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-6 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-[#1E2D5A] bg-[#0D1535] p-6 shadow-elegant space-y-4 text-center">
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary border border-primary/30">
              Materia: {currentQuestion.subject} - {currentQuestion.topic}
            </span>
            <p className="text-sm font-bold text-slate-200">{currentQuestion.prompt}</p>

            {currentQuestion.type === "multiple-choice" && (
              <div className="grid gap-3 pt-3">
                {currentQuestion.options.map((option, idx) => {
                  let btnStyle = "border-border bg-card text-foreground hover:bg-muted/40";
                  if (selectedOption !== null) {
                    if (idx === currentQuestion.correctIndex) {
                      btnStyle = "border-emerald-500 bg-emerald-600/20 text-emerald-400";
                    } else if (idx === selectedOption) {
                      btnStyle = "border-red-500 bg-red-600/20 text-red-400";
                    } else {
                      btnStyle = "opacity-40 border-border bg-card";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={selectedOption !== null}
                      onClick={() => submitAnswer(idx)}
                      className={`w-full py-3 px-4 rounded-xl border text-xs font-semibold text-left transition active:scale-98 cursor-pointer ${btnStyle}`}
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
