import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { rewardGameCoins } from "@/lib/games.functions";
import { AppHeader } from "@/components/AppHeader";
import { ArrowLeft, User, Users, Timer } from "lucide-react";
import { toast } from "sonner";
import { getRandomQuestion, type Question } from "@/lib/question-engine";
import { analyticsEngine } from "@/lib/analytics-engine";

export const Route = createFileRoute("/_authenticated/games/battle-royale")({
  head: () => ({ meta: [{ title: "Battle Royale Académico — Lybanhi" }] }),
  component: BattleRoyaleGame,
});

const AI_NAMES = [
  "Euclides_AI", "Curie_Lab", "Turing_Logic", "Virginia_Reader", "Madero_Plan", "Einstein_X",
  "Newton_Gravity", "Darwin_Evo", "Hypatia_Math", "Galileo_Scope", "Tesla_Coil", "Lovelace_Ada",
  "Pascal_Code", "Mendel_Genetics", "Pasteur_Med", "Franklin_Dna", "Copernicus_Cosmo", "Socrates_Log"
];

function BattleRoyaleGame() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const rewardCoins = useServerFn(rewardGameCoins);

  const [gameState, setGameState] = useState<"lobby" | "waiting" | "round" | "victory" | "eliminated">("lobby");
  const [activePlayers, setActivePlayers] = useState(50);
  const [currentRound, setCurrentRound] = useState(1);
  const [survivingAiList, setSurvivingAiList] = useState<string[]>([]);

  // Question & Timer State
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [timeLeft, setTimeLeft] = useState(25);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState(0);

  const rewardMutation = useMutation({
    mutationFn: (coins: number) => rewardCoins({ data: { coins } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("+15 Sombreritos ganados! 🎉");
    },
  });

  // Timer loop
  useEffect(() => {
    if (gameState !== "round" || timeLeft <= 0) {
      if (gameState === "round" && timeLeft === 0) {
        handleTimeout();
      }
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(p => p - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, gameState]);

  const handleEnterQueue = () => {
    setGameState("waiting");
    setCurrentRound(1);
    setActivePlayers(50);
    
    // Select 10 names from AI_NAMES list to represent the "top players" remaining
    const shuffled = [...AI_NAMES].sort(() => 0.5 - Math.random());
    setSurvivingAiList(shuffled.slice(0, 15));

    setTimeout(() => {
      startRound(1);
    }, 2000);
  };

  const startRound = (roundNum: number) => {
    setCurrentRound(roundNum);
    setGameState("round");
    setTimeLeft(25);
    setSelectedOption(null);
    setQuestionStartTime(Date.now());

    // Load trivia question
    const q = getRandomQuestion({
      difficulty: roundNum <= 2 ? "easy" : roundNum <= 4 ? "medium" : "hard",
    });
    setCurrentQuestion(q);
  };

  const submitAnswer = (optionIdx: number) => {
    if (!currentQuestion) return;
    setSelectedOption(optionIdx);
    const correct = currentQuestion.type === "multiple-choice" ? currentQuestion.correctIndex === optionIdx : false;
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
        // Player survives round!
        // Simulate other players getting eliminated
        const survivalRate = 0.6 - (currentRound * 0.08); // rounds eliminate more
        const nextPlayers = Math.max(1, Math.round(activePlayers * survivalRate));
        setActivePlayers(nextPlayers);

        // Reduce AI surviving names list
        setSurvivingAiList(prev => prev.slice(0, Math.max(1, Math.round(prev.length * survivalRate))));

        toast.success("¡Respuesta correcta! Has clasificado a la siguiente ronda.");

        if (nextPlayers === 1 || currentRound >= 5) {
          setGameState("victory");
          rewardMutation.mutate(15);
        } else {
          setGameState("waiting");
          setTimeout(() => {
            startRound(currentRound + 1);
          }, 2000);
        }
      } else {
        // Player eliminated!
        setGameState("eliminated");
        toast.error("Eliminado de la arena.");
      }
    }, 1500);
  };

  const handleTimeout = () => {
    setGameState("eliminated");
    toast.error("Tiempo agotado. Fuiste eliminado.");
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#080D24]/90 backdrop-blur-xl border-b border-[#1E2D5A] px-6 py-4 flex items-center justify-between text-white">
        <button onClick={() => navigate({ to: "/games" })} className="text-[#8896B3] hover:text-white font-bold flex items-center gap-1.5 cursor-pointer bg-transparent border-none">
          <ArrowLeft className="size-5" /> Atrás
        </button>
        <h1 className="font-display text-lg font-bold">Battle Royale Académico</h1>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
          <Users className="size-4" />
          <span>{activePlayers} en la arena</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 pt-6 pb-24 text-white min-h-[calc(100vh-64px)] bg-[#080D24] flex flex-col justify-center">
        {gameState === "lobby" && (
          <div className="max-w-md mx-auto bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-6 text-center space-y-6">
            <span className="text-6xl select-none">🎮</span>
            <h2 className="font-display font-black text-2xl">Supervivencia de Trivia</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enfréntate a 49 jugadores simulados en rondas consecutivas de preguntas rápidas. Solo el último en pie se llevará la corona académica de sombreritos.
            </p>
            <button
              onClick={handleEnterQueue}
              className="w-full h-12 bg-primary hover:bg-primary-glow font-bold text-xs tracking-wider rounded-2xl cursor-pointer border-none transition active:scale-95"
            >
              Buscar Partida
            </button>
          </div>
        )}

        {gameState === "waiting" && (
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="relative flex justify-center">
              <div className="size-16 rounded-full bg-primary/20 border border-primary/40 animate-ping absolute" />
              <div className="size-16 rounded-full bg-primary grid place-items-center text-white text-2xl font-bold font-display z-10">
                {activePlayers}
              </div>
            </div>
            <h2 className="font-display font-black text-xl text-primary">
              {currentRound === 1 ? "Buscando oponentes..." : `Clasificando a Ronda ${currentRound}...`}
            </h2>
            <p className="text-xs text-slate-400">Preparando preguntas académicas de dificultad incremental.</p>

            <div className="bg-[#0D1535] border border-[#1E2D5A] rounded-2xl p-4 max-h-[160px] overflow-y-auto scrollbar-thin text-left space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Oponentes sobrevivientes:</span>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                {survivingAiList.map((ai, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <User className="size-3 text-slate-500" />
                    <span>{ai}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {gameState === "round" && currentQuestion && (
          <div className="max-w-2xl mx-auto bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-6 space-y-6">
            <div className="flex justify-between items-center text-xs text-slate-400 font-bold border-b border-[#1E2D5A] pb-3">
              <span className="text-primary font-bold">Ronda {currentRound}</span>
              <span className="flex items-center gap-1 text-cyan-400">
                <Timer className="size-4 animate-pulse" /> {timeLeft}s
              </span>
            </div>

            <div className="space-y-4">
              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20">
                Materia: {currentQuestion.subject} - {currentQuestion.topic}
              </span>
              <p className="text-sm font-bold text-slate-200">{currentQuestion.prompt}</p>

              {currentQuestion.type === "multiple-choice" && (
                <div className="grid gap-3 pt-3 text-left">
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

        {gameState === "victory" && (
          <div className="max-w-md mx-auto bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-6 text-center space-y-6 py-12 animate-in zoom-in-95">
            <div className="size-20 rounded-full bg-emerald-500/10 text-emerald-400 grid place-items-center mx-auto text-5xl">👑</div>
            <h2 className="font-display font-black text-2xl text-emerald-400">¡Victoria Magistral!</h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              Has sobrevivido a todas las rondas y derrotado a los 49 oponentes. Eres el Campeón de la Trivia Académica.
            </p>
            <div className="bg-[#17224D] max-w-xs mx-auto p-4 rounded-2xl border border-[#3B6DE8]/10 text-xs font-bold text-slate-300">
              Recompensa Global: +15 Sombreritos
            </div>
            <button
              onClick={() => setGameState("lobby")}
              className="h-11 px-6 bg-primary hover:bg-primary-glow font-bold text-xs rounded-xl cursor-pointer border-none transition"
            >
              Volver al Lobby
            </button>
          </div>
        )}

        {gameState === "eliminated" && (
          <div className="max-w-md mx-auto bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-6 text-center space-y-6 py-12">
            <div className="size-20 rounded-full bg-red-500/10 text-red-400 grid place-items-center mx-auto text-5xl">☠️</div>
            <h2 className="font-display font-black text-2xl text-red-400">Fuiste Eliminado</h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto font-semibold">
              Clasificaste en la posición #{activePlayers + 1}. ¡Sigue estudiando para llegar al Top 1!
            </p>
            <button
              onClick={handleEnterQueue}
              className="h-11 px-6 bg-[#1E3A8A] hover:bg-[#2D5BE3] border border-[#3B6DE8] rounded-xl font-bold text-xs tracking-wider transition cursor-pointer text-white"
            >
              Jugar otra Partida
            </button>
          </div>
        )}
      </main>
    </>
  );
}
