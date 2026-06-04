import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { rewardGameCoins } from "@/lib/games.functions";
import { AppHeader } from "@/components/AppHeader";
import { ArrowLeft, Heart, Zap } from "lucide-react";
import { toast } from "sonner";
import { getRandomQuestion, type Question } from "@/lib/question-engine";
import { analyticsEngine } from "@/lib/analytics-engine";

export const Route = createFileRoute("/_authenticated/games/runner-conocimiento")({
  head: () => ({ meta: [{ title: "Runner del Conocimiento — Lybanhi" }] }),
  component: RunnerConocimientoGame,
});

interface Pet {
  id: string;
  name: string;
  emoji: string;
  bonus: string;
  cost: number;
  unlocked: boolean;
}

function RunnerConocimientoGame() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const rewardCoins = useServerFn(rewardGameCoins);

  const [gameState, setGameState] = useState<"lobby" | "playing" | "gameover" | "victory">("lobby");
  
  // Game metrics
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [speed, setSpeed] = useState(1);
  const [distance, setDistance] = useState(0);

  // Active question and lanes
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [laneOptions, setLaneOptions] = useState<string[]>([]);
  const [correctLaneIdx, setCorrectLaneIdx] = useState(0);
  const [playerLane, setPlayerLane] = useState(1); // 0 = Left, 1 = Center, 2 = Right
  const [obstaclePosition, setObstaclePosition] = useState(0); // 0% (top) to 100% (bottom, collision)

  // Pets logic
  const [pets, setPets] = useState<Pet[]>([
    { id: "owl", name: "Búho Sabio", emoji: "🦉", bonus: "Vida extra (+1 Vida)", cost: 10, unlocked: false },
    { id: "dog", name: "Cachorro Lógico", emoji: "🐶", bonus: "+5% Puntos de Velocidad", cost: 20, unlocked: false },
    { id: "fox", name: "Zorro del Código", emoji: "🦊", bonus: "Mitiga un impacto de obstáculo", cost: 35, unlocked: false },
  ]);
  const [activePetId, setActivePetId] = useState<string | null>(null);

  const rewardMutation = useMutation({
    mutationFn: (coins: number) => rewardCoins({ data: { coins } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  // Load a new question and map it to 3 lanes
  const loadQuestionForRunner = () => {
    const q = getRandomQuestion({
      difficulty: "easy",
    });
    if (!q) return;

    setCurrentQuestion(q);
    setObstaclePosition(0);

    // Extract options depending on type
    let options: string[] = [];
    let correctIdx = 0;
    if (q.type === "multiple-choice" || q.type === "reading" || q.type === "listening") {
      options = [...q.options].slice(0, 3);
      correctIdx = q.correctIndex;
    } else if (q.type === "fill-blanks") {
      options = [q.correctAnswers[0], "Fuerza", "Gravedad"];
      correctIdx = 0;
    } else if (q.type === "drag-drop") {
      options = [q.dragItems[0], "Neutrón", "Protón"];
      correctIdx = 0;
    } else {
      options = ["Respuesta Correcta", "Opción Incorrecta", "Falsa"];
      correctIdx = 0;
    }

    // Shuffle options so it's not always in the same lane
    const mapped = options.map((opt, i) => ({ opt, isCorrect: i === correctIdx }));
    for (let i = mapped.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [mapped[i], mapped[j]] = [mapped[j], mapped[i]];
    }

    setLaneOptions(mapped.map(m => m.opt));
    setCorrectLaneIdx(mapped.findIndex(m => m.isCorrect));
  };

  // Runner loop (distance & obstacle progression)
  useEffect(() => {
    if (gameState !== "playing") return;

    const interval = setInterval(() => {
      setDistance(d => d + 5 * speed);
      
      // Progress obstacle downwards
      setObstaclePosition(pos => {
        const nextPos = pos + 10 * speed;
        if (nextPos >= 100) {
          // Collision Check!
          if (playerLane === correctLaneIdx) {
            // Success! Correct lane
            setScore(s => s + 10);
            toast.success("¡Excelente! Concepto recolectado correctamente.");
            
            // Speed up slightly
            setSpeed(sp => Math.min(2.5, sp + 0.1));
            
            // Check victory condition
            if (score >= 100) {
              setGameState("victory");
              rewardMutation.mutate(8);
              toast.success("¡Felicidades! Completaste la carrera del conocimiento.");
            } else {
              loadQuestionForRunner();
            }
          } else {
            // Collision with wrong concept!
            setLives(l => {
              const nextL = l - 1;
              if (nextL <= 0) {
                setGameState("gameover");
                toast.error("Tu avatar se ha quedado sin vidas.");
              } else {
                toast.error("¡Impacto! Chocaste contra un concepto erróneo.");
                loadQuestionForRunner();
              }
              return nextL;
            });
          }
          return 0;
        }
        return nextPos;
      });

    }, 250);

    return () => clearInterval(interval);
  }, [gameState, playerLane, correctLaneIdx, speed, score]);

  const handleStartGame = () => {
    setScore(0);
    setDistance(0);
    setSpeed(1);
    setLives(activePetId === "owl" ? 4 : 3);
    setGameState("playing");
    loadQuestionForRunner();
  };

  const handleBuyPet = (pet: Pet) => {
    // Deduct coins (assuming they have enough for mockup)
    setPets(prev => prev.map(p => p.id === pet.id ? { ...p, unlocked: true } : p));
    rewardMutation.mutate(-pet.cost);
    toast.success(`¡Desbloqueaste a ${pet.name}!`);
  };

  const handleEquipPet = (petId: string) => {
    setActivePetId(activePetId === petId ? null : petId);
    toast.success("Mascota equipada.");
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;
      if (e.key === "ArrowLeft") {
        setPlayerLane(p => Math.max(0, p - 1));
      } else if (e.key === "ArrowRight") {
        setPlayerLane(p => Math.min(2, p + 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState]);

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#080D24]/90 backdrop-blur-xl border-b border-[#1E2D5A] px-6 py-4 flex items-center justify-between text-white">
        <button onClick={() => navigate({ to: "/games" })} className="text-[#8896B3] hover:text-white font-bold flex items-center gap-1.5 cursor-pointer bg-transparent border-none">
          <ArrowLeft className="size-5" /> Atrás
        </button>
        <h1 className="font-display text-lg font-bold">Runner del Conocimiento</h1>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-rose-400">
            {new Array(Math.max(0, lives)).fill(0).map((_, i) => (
              <Heart key={i} className="size-4 fill-rose-500 text-rose-500" />
            ))}
          </span>
          <span className="text-cyan-400 flex items-center gap-1"><Zap className="size-4" /> {distance}m</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 pt-6 pb-24 text-white min-h-[calc(100vh-64px)] bg-[#080D24]">
        {gameState === "lobby" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Play Panel */}
            <div className="md:col-span-2 bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <span className="text-xs bg-primary/20 text-primary border border-primary/30 px-3 py-0.5 rounded-full font-bold uppercase">
                  Acción y Reflejos
                </span>
                <h2 className="mt-3 font-display font-black text-2xl">Pista de Carreras de Conceptos</h2>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Corre por los carriles académicos. Lee la pregunta o concepto en la parte superior, esquiva las barreras incorrectas y choca contra la respuesta correcta.
                </p>
                <div className="mt-4 pt-2 text-[10px] text-slate-400 font-bold uppercase">
                  Usa las teclas de dirección ← y → de tu teclado para moverte.
                </div>
              </div>
              <button
                onClick={handleStartGame}
                className="w-full h-12 mt-8 bg-primary hover:bg-primary-glow font-bold text-xs tracking-wider rounded-2xl cursor-pointer border-none transition"
              >
                Iniciar Carrera
              </button>
            </div>

            {/* Pets Upgrades Panel */}
            <div className="bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-5 space-y-4">
              <h3 className="font-display font-bold text-sm text-[#8896B3] border-b border-[#1E2D5A] pb-2">Mascotas de Compañía</h3>
              <div className="space-y-3">
                {pets.map(pet => (
                  <div key={pet.id} className="p-3 bg-[#17224D] border border-[#3B6DE8]/10 rounded-xl flex justify-between items-center text-xs">
                    <div className="flex gap-2.5 items-center">
                      <span className="text-3xl select-none">{pet.emoji}</span>
                      <div>
                        <h4 className="font-bold">{pet.name}</h4>
                        <span className="text-[9px] text-slate-400 block mt-0.5">{pet.bonus}</span>
                      </div>
                    </div>
                    {pet.unlocked ? (
                      <button
                        onClick={() => handleEquipPet(pet.id)}
                        className={`px-3 py-1.5 font-bold text-[10px] rounded-lg cursor-pointer transition border-none ${
                          activePetId === pet.id ? "bg-emerald-600 text-white" : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                        }`}
                      >
                        {activePetId === pet.id ? "Equipado" : "Equipar"}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBuyPet(pet)}
                        className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-[10px] rounded-lg cursor-pointer border-none transition"
                      >
                        Comprar ({pet.cost} 🎓)
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {gameState === "playing" && currentQuestion && (
          <div className="space-y-6">
            {/* Current Question panel */}
            <div className="bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-6 text-center space-y-2 relative overflow-hidden">
              <span className="absolute top-3 left-4 text-[9px] bg-primary/20 text-primary border border-primary/30 px-2.5 py-0.5 rounded-full font-bold uppercase">
                {currentQuestion.subject} - {currentQuestion.topic}
              </span>
              <span className="absolute top-3 right-4 text-xs font-bold text-cyan-400">
                Puntaje: {score}/100
              </span>
              <p className="mt-4 text-sm font-bold text-slate-200">{currentQuestion.prompt}</p>
            </div>

            {/* Lane Track Visualizer */}
            <div className="relative h-64 bg-slate-900 border border-[#1E2D5A] rounded-3xl overflow-hidden flex">
              {/* Lane Dividers */}
              <div className="absolute inset-y-0 left-1/3 border-l border-dashed border-[#1E2D5A]/40" />
              <div className="absolute inset-y-0 left-2/3 border-l border-dashed border-[#1E2D5A]/40" />

              {/* Lane Items */}
              {laneOptions.map((opt, laneIdx) => {
                const isObstacleActive = true;
                return (
                  <div
                    key={laneIdx}
                    onClick={() => setPlayerLane(laneIdx)}
                    className="flex-1 relative flex flex-col justify-between items-center py-6 cursor-pointer hover:bg-white/[0.02]"
                  >
                    {/* Obstacle falling down */}
                    {isObstacleActive && (
                      <div
                        className="absolute transition-all duration-300 transform -translate-x-1/2 left-1/2 bg-[#17224D] border border-[#3B6DE8]/20 px-3 py-1.5 rounded-xl text-[10px] font-bold text-center text-slate-300 max-w-[100px] break-words shadow-md"
                        style={{ top: `${obstaclePosition}%` }}
                      >
                        {opt}
                      </div>
                    )}

                    {/* Bottom: Player Avatar */}
                    <div className="h-12 flex items-end">
                      {playerLane === laneIdx && (
                        <div className="text-3xl select-none animate-bounce">
                          {activePetId ? pets.find(p => p.id === activePetId)?.emoji : "🏃"}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center text-xs text-slate-500 px-4">
              <span>💡 Haz clic en un carril o usa las flechas ← / → de tu teclado para moverte.</span>
              <span>Velocidad de carrera: x{speed.toFixed(1)}</span>
            </div>
          </div>
        )}

        {gameState === "victory" && (
          <div className="max-w-md mx-auto bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-6 text-center space-y-6 py-12 animate-in zoom-in-95">
            <div className="size-20 rounded-full bg-emerald-500/10 text-emerald-400 grid place-items-center mx-auto text-5xl">🏃</div>
            <h2 className="font-display font-black text-2xl text-emerald-400">¡Llegaste a la Meta!</h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              Has recorrido toda la autopista de conocimientos sin perder tus vidas. ¡Una mente a máxima velocidad!
            </p>
            <div className="bg-[#17224D] max-w-xs mx-auto p-4 rounded-2xl border border-[#3B6DE8]/10 text-xs font-bold text-slate-300">
              Recompensa Global: +8 Sombreritos
            </div>
            <button
              onClick={() => setGameState("lobby")}
              className="h-11 px-6 bg-primary hover:bg-primary-glow font-bold text-xs rounded-xl cursor-pointer border-none transition"
            >
              Cerrar y Salir
            </button>
          </div>
        )}

        {gameState === "gameover" && (
          <div className="max-w-md mx-auto bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-6 text-center space-y-6 py-12">
            <div className="size-20 rounded-full bg-red-500/10 text-red-400 grid place-items-center mx-auto text-5xl">💥</div>
            <h2 className="font-display font-black text-2xl text-red-400">Choque de Conceptos</h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              Te quedaste sin vidas durante la carrera. Repasa las materias y vuelve a entrenar tu agilidad conceptual.
            </p>
            <button
              onClick={handleStartGame}
              className="h-11 px-6 bg-[#1E3A8A] hover:bg-[#2D5BE3] border border-[#3B6DE8] rounded-xl font-bold text-xs tracking-wider transition cursor-pointer text-white"
            >
              Reiniciar Carrera
            </button>
          </div>
        )}
      </main>
    </>
  );
}
