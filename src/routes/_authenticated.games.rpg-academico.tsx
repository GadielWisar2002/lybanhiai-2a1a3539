import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { rewardGameCoins } from "@/lib/games.functions";
import { AppHeader } from "@/components/AppHeader";
import { ArrowLeft, MapPin, Compass, ShieldAlert, Award, ChevronRight, User } from "lucide-react";
import { toast } from "sonner";
import { getRandomQuestion, type Question } from "@/lib/question-engine";
import { analyticsEngine } from "@/lib/analytics-engine";

export const Route = createFileRoute("/_authenticated/games/rpg-academico")({
  head: () => ({ meta: [{ title: "RPG Académico — Lybanhi" }] }),
  component: RpgAcademicoGame,
});

interface Quest {
  id: string;
  title: string;
  npc: string;
  npcAvatar: string;
  desc: string;
  subject: string;
  xpReward: number;
  coinReward: number;
  repReward: number;
}

const REGIONS = [
  { id: "math", name: "Valle de los Números", icon: "📐", subject: "math", color: "from-blue-600 to-indigo-800" },
  { id: "lang", name: "Archipiélago del Lenguaje", icon: "📚", subject: "spanish", color: "from-teal-600 to-emerald-800" },
  { id: "history", name: "Páramo del Tiempo", icon: "⏳", subject: "history", color: "from-amber-600 to-orange-800" },
  { id: "prog", name: "Ciudad de Silicio", icon: "💻", subject: "programming", color: "from-purple-600 to-violet-800" },
  { id: "science", name: "Laboratorio del Éter", icon: "🧪", subject: "physics", color: "from-pink-600 to-rose-800" },
];

const QUESTS_DATABASE: Record<string, Quest[]> = {
  math: [
    { id: "q_m1", title: "El Teorema de los Susurros", npc: "Profesor Euclides", npcAvatar: "👴", desc: "El antiguo monumento de Euclides tiene inscripciones numéricas incompletas. Ayuda a restaurar el Teorema resolviendo ecuaciones.", subject: "math", xpReward: 120, coinReward: 5, repReward: 15 },
  ],
  lang: [
    { id: "q_l1", title: "La Metáfora Perdida", npc: "Bibliotecaria Virginia", npcAvatar: "👵", desc: "Una página crucial del manuscrito original ha desaparecido. Analiza la estructura gramatical del fragmento restante para deducir la palabra faltante.", subject: "spanish", xpReward: 100, coinReward: 4, repReward: 12 },
  ],
  history: [
    { id: "q_h1", title: "La Cápsula del Tiempo del Plan de San Luis", npc: "Historiador Justo", npcAvatar: "👨‍🏫", desc: "Hemos descubierto un cofre maderista sellado con candado de combinación cronológica. Ordena los eventos de la revolución para abrirlo.", subject: "history", xpReward: 150, coinReward: 6, repReward: 20 },
  ],
  prog: [
    { id: "q_p1", title: "La Recursión del Laberinto", npc: "Científico Turing", npcAvatar: "🧑‍💻", desc: "El robot de exploración ha quedado atrapado en un bucle infinito en el sector de silicio. Resuelve el flujo lógico de Quicksort para liberarlo.", subject: "programming", xpReward: 180, coinReward: 7, repReward: 25 },
  ],
  science: [
    { id: "q_s1", title: "El Reactor del Éter", npc: "Investigadora Curie", npcAvatar: "👩‍🔬", desc: "El condensador de partículas experimenta fluctuaciones de energía. Resuelve los reactivos químicos y equilibra la ecuación para estabilizar el reactor.", subject: "physics", xpReward: 200, coinReward: 8, repReward: 30 },
  ],
};

function RpgAcademicoGame() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const rewardCoins = useServerFn(rewardGameCoins);

  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [activeQuest, setActiveQuest] = useState<Quest | null>(null);
  const [questStep, setQuestStep] = useState<"intro" | "challenge" | "success" | "failure">("intro");
  
  // Character Progression State (saved locally)
  const [stats, setStats] = useState({ level: 1, xp: 0, rep: 0, logic: 10, wisdom: 10, agility: 10 });
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAns, setSelectedAns] = useState<number | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState(0);

  const rewardMutation = useMutation({
    mutationFn: (coins: number) => rewardCoins({ data: { coins } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const handleSelectRegion = (rid: string) => {
    setSelectedRegion(rid);
    setActiveQuest(null);
  };

  const handleStartQuest = (quest: Quest) => {
    setActiveQuest(quest);
    setQuestStep("intro");
  };

  const handleLoadChallenge = () => {
    if (!activeQuest) return;
    const q = getRandomQuestion({
      subject: activeQuest.subject as any,
    });
    setCurrentQuestion(q);
    setSelectedAns(null);
    setQuestStep("challenge");
    setQuestionStartTime(Date.now());
  };

  const handleSubmitAnswer = (idx: number) => {
    if (!currentQuestion || !activeQuest) return;
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
        setQuestStep("success");
        // Grant rewards
        rewardMutation.mutate(activeQuest.coinReward);
        setStats(prev => {
          const nextXp = prev.xp + activeQuest.xpReward;
          const levelUp = nextXp >= prev.level * 300;
          return {
            ...prev,
            xp: levelUp ? nextXp - prev.level * 300 : nextXp,
            level: levelUp ? prev.level + 1 : prev.level,
            rep: prev.rep + activeQuest.repReward,
            logic: prev.logic + (activeQuest.subject === "math" || activeQuest.subject === "programming" ? 2 : 0),
            wisdom: prev.wisdom + (activeQuest.subject === "physics" || activeQuest.subject === "biology" ? 2 : 0),
            agility: prev.agility + (activeQuest.subject === "spanish" || activeQuest.subject === "history" ? 2 : 0),
          };
        });
        toast.success(`Misión Completada! +${activeQuest.xpReward} XP y +${activeQuest.coinReward} Sombreritos!`);
      } else {
        setQuestStep("failure");
        toast.error("Misión Fallida. ¡Estudia el concepto y vuelve a intentarlo!");
      }
    }, 1500);
  };

  const getStudentRank = (lvl: number) => {
    if (lvl >= 10) return "Catedrático Honorario";
    if (lvl >= 6) return "Maestro de Ciencias";
    if (lvl >= 3) return "Bachiller";
    return "Principiante Académico";
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#080D24]/90 backdrop-blur-xl border-b border-[#1E2D5A] px-6 py-4 flex items-center justify-between text-white">
        <button onClick={() => navigate({ to: "/games" })} className="text-[#8896B3] hover:text-white font-bold flex items-center gap-1.5 cursor-pointer bg-transparent border-none">
          <ArrowLeft className="size-5" /> Atrás
        </button>
        <h1 className="font-display text-lg font-bold">RPG Académico</h1>
        <div className="size-5" />
      </header>

      <main className="mx-auto max-w-5xl px-5 pt-6 pb-24 text-white min-h-[calc(100vh-64px)] bg-[#080D24]">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar: Character Sheet */}
          <div className="bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-5 space-y-5 h-fit">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-2xl bg-primary/10 text-primary grid place-items-center text-2xl">
                <User className="size-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Expediente de Estudiante</h3>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{getStudentRank(stats.level)}</span>
              </div>
            </div>

            <div className="space-y-1.5 border-t border-[#1E2D5A] pt-4">
              <div className="flex justify-between text-xs font-bold text-slate-300">
                <span>Nivel de Rango {stats.level}</span>
                <span>{stats.xp} / {stats.level * 300} XP</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="bg-primary h-full transition-all duration-300" style={{ width: `${(stats.xp / (stats.level * 300)) * 100}%` }} />
              </div>
            </div>

            {/* Attributes */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Atributos Mentales</h4>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 flex items-center gap-1">📐 Fuerza Lógica</span>
                <span className="font-bold text-white">{stats.logic}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 flex items-center gap-1">🔬 Sabiduría Científica</span>
                <span className="font-bold text-white">{stats.wisdom}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 flex items-center gap-1">⚡ Agilidad Lingüística</span>
                <span className="font-bold text-white">{stats.agility}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-[#1E2D5A] pt-3">
                <span className="text-slate-400 flex items-center gap-1">⭐ Reputación General</span>
                <span className="font-bold text-orange-400">{stats.rep} pts</span>
              </div>
            </div>
          </div>

          {/* Main Area: Map / Quests / Active Quest */}
          <div className="lg:col-span-3 space-y-6">
            {!selectedRegion ? (
              // Map View
              <div className="bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-6">
                <h3 className="font-display font-black text-lg text-primary flex items-center gap-2 mb-4">
                  <Compass className="size-5" /> Mapa de Regiones Académicas
                </h3>
                <p className="text-xs text-slate-400 mb-6">Selecciona una facultad en el mapa para explorar misiones activas y hablar con los docentes encargados:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {REGIONS.map(reg => (
                    <button
                      key={reg.id}
                      onClick={() => handleSelectRegion(reg.id)}
                      className={`h-24 rounded-2xl bg-gradient-to-r ${reg.color} p-4 text-left border-none cursor-pointer hover:scale-[1.02] active:scale-95 transition flex justify-between items-center shadow-lg`}
                    >
                      <div>
                        <span className="text-3xl select-none">{reg.icon}</span>
                        <h4 className="font-bold text-sm text-white mt-1">{reg.name}</h4>
                      </div>
                      <ChevronRight className="size-5 text-white/70" />
                    </button>
                  ))}
                </div>
              </div>
            ) : !activeQuest ? (
              // Quests List View
              <div className="bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-display font-black text-lg text-primary flex items-center gap-2">
                    <MapPin className="size-5" /> Misiones en {REGIONS.find(r => r.id === selectedRegion)?.name}
                  </h3>
                  <button
                    onClick={() => setSelectedRegion(null)}
                    className="text-xs font-bold text-slate-400 hover:text-white cursor-pointer bg-transparent border-none"
                  >
                    Volver al mapa
                  </button>
                </div>

                <div className="space-y-4">
                  {(QUESTS_DATABASE[selectedRegion] ?? []).map(quest => (
                    <div
                      key={quest.id}
                      className="bg-[#17224D]/50 border border-[#3B6DE8]/10 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                    >
                      <div className="space-y-1">
                        <h4 className="font-bold text-base text-white">{quest.title}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed max-w-lg">{quest.desc}</p>
                        <div className="flex gap-4 text-[10px] font-bold text-slate-400 pt-2 uppercase">
                          <span>Recompensa: {quest.xpReward} XP</span>
                          <span>{quest.coinReward} Sombreritos</span>
                          <span>+{quest.repReward} Reputación</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleStartQuest(quest)}
                        className="h-10 px-5 bg-primary hover:bg-primary-glow font-bold text-xs rounded-xl cursor-pointer border-none transition active:scale-95 whitespace-nowrap"
                      >
                        Aceptar Misión
                      </button>
                    </div>
                  ))}
                  {(QUESTS_DATABASE[selectedRegion] ?? []).length === 0 && (
                    <p className="text-xs text-slate-400">No hay misiones disponibles en esta región temporalmente.</p>
                  )}
                </div>
              </div>
            ) : (
              // Active Quest Dialog View
              <div className="bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-6 min-h-[350px] flex flex-col justify-between">
                {/* NPC Dialog */}
                {questStep === "intro" && (
                  <div className="space-y-6">
                    <div className="flex gap-4 items-start border-b border-[#1E2D5A] pb-4">
                      <span className="text-5xl select-none">{activeQuest.npcAvatar}</span>
                      <div>
                        <h4 className="font-bold text-base text-white">{activeQuest.npc}</h4>
                        <span className="text-xs text-[#3B6DE8] font-semibold">Región: {REGIONS.find(r => r.id === selectedRegion)?.name}</span>
                      </div>
                    </div>
                    <div className="bg-[#17224D]/30 border border-[#3B6DE8]/10 rounded-2xl p-5">
                      <p className="text-sm italic leading-relaxed text-slate-200">
                        "Estudiante, nos encontramos frente a un grave obstáculo en nuestro sector de investigación. El conocimiento está distorsionado en esta zona y requerimos tu intervención inmediata. ¿Estás listo para resolver este desafío?"
                      </p>
                    </div>
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => setActiveQuest(null)}
                        className="h-10 px-5 border border-[#1E2D5A] text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-800 transition"
                      >
                        Abandonar
                      </button>
                      <button
                        onClick={handleLoadChallenge}
                        className="h-10 px-5 bg-orange-600 hover:bg-orange-500 font-bold text-xs rounded-xl cursor-pointer border-none transition"
                      >
                        Comenzar Desafío
                      </button>
                    </div>
                  </div>
                )}

                {/* Challenge Question */}
                {questStep === "challenge" && currentQuestion && (
                  <div className="space-y-5 text-center">
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
                )}

                {/* Quest Success */}
                {questStep === "success" && (
                  <div className="text-center space-y-6 py-6">
                    <div className="size-16 rounded-full bg-emerald-500/10 text-emerald-400 grid place-items-center mx-auto text-3xl">🏆</div>
                    <h3 className="font-display font-black text-xl text-emerald-400">¡Misión Completada con Éxito!</h3>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                      El profesor agradece tu increíble agilidad mental. Los datos se han restaurado correctamente y has ganado reputación académica.
                    </p>
                    <div className="flex gap-4 justify-center text-xs font-bold text-slate-300 bg-[#17224D] max-w-sm mx-auto p-4 rounded-2xl border border-[#3B6DE8]/10">
                      <span>+{activeQuest.xpReward} XP</span>
                      <span>+{activeQuest.coinReward} Sombreritos</span>
                      <span>+{activeQuest.repReward} Reputación</span>
                    </div>
                    <button
                      onClick={() => setActiveQuest(null)}
                      className="h-10 px-6 bg-primary hover:bg-primary-glow font-bold text-xs rounded-xl cursor-pointer border-none transition"
                    >
                      Volver a la Región
                    </button>
                  </div>
                )}

                {/* Quest Failure */}
                {questStep === "failure" && (
                  <div className="text-center space-y-6 py-6">
                    <div className="size-16 rounded-full bg-red-500/10 text-red-400 grid place-items-center mx-auto text-3xl">
                      <ShieldAlert className="size-8 text-red-400 animate-pulse" />
                    </div>
                    <h3 className="font-display font-black text-xl text-red-400">¡Misión Fallida!</h3>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                      La respuesta introducida fue incorrecta y la distorsión del conocimiento persiste. Estudia el concepto e inténtalo de nuevo.
                    </p>
                    <button
                      onClick={handleLoadChallenge}
                      className="h-10 px-6 bg-orange-600 hover:bg-orange-500 font-bold text-xs rounded-xl cursor-pointer border-none transition"
                    >
                      Reintentar Desafío
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
