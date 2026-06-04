import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { rewardGameCoins } from "@/lib/games.functions";
import { AppHeader } from "@/components/AppHeader";
import { ArrowLeft, Trophy, Timer } from "lucide-react";
import { toast } from "sonner";
import { getRandomQuestion, type Question } from "@/lib/question-engine";
import { analyticsEngine } from "@/lib/analytics-engine";

export const Route = createFileRoute("/_authenticated/games/ligas-campeones")({
  head: () => ({ meta: [{ title: "Ligas de Campeones — Lybanhi" }] }),
  component: LigasCampeonesGame,
});

const DIVISIONS = ["Bronce", "Plata", "Oro", "Platino", "Diamante", "Leyenda"];

function LigasCampeonesGame() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const rewardCoins = useServerFn(rewardGameCoins);

  // Competitive stats (saved in local memory)
  const [divisionIdx, setDivisionIdx] = useState(0); // 0 = Bronce
  const [lp, setLp] = useState(20); // League Points (0 - 100)
  const [rankPosition, setRankPosition] = useState(78); // Leaderboard placement

  const [gameState, setGameState] = useState<"lobby" | "queue" | "match" | "postmatch">("lobby");
  const [opponentName, setOpponentName] = useState("Calculadora_AI");
  
  // Duel details
  const [matchRound, setMatchRound] = useState(1);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [outcome, setOutcome] = useState<"victory" | "defeat" | "draw">("victory");

  // Question State
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState(0);

  const rewardMutation = useMutation({
    mutationFn: (coins: number) => rewardCoins({ data: { coins } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  // Timer loop
  useEffect(() => {
    if (gameState !== "match" || timeLeft <= 0) {
      if (gameState === "match" && timeLeft === 0) {
        handleNextRound(false, 0);
      }
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(p => p - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, gameState]);

  const handleStartQueue = () => {
    setGameState("queue");
    // Pick AI name
    const names = ["Algebra_Guru", "Fisica_Pro", "Bio_Master", "Logic_Bot", "Histo_Tutor", "Curie_Clone"];
    setOpponentName(names[Math.floor(Math.random() * names.length)]);

    setTimeout(() => {
      // Start match
      setPlayerScore(0);
      setOpponentScore(0);
      setMatchRound(1);
      setGameState("match");
      loadMatchQuestion(1);
    }, 2000);
  };

  const loadMatchQuestion = (roundNum: number) => {
    setMatchRound(roundNum);
    setTimeLeft(20);
    setSelectedOption(null);
    setQuestionStartTime(Date.now());

    // Pull from question engine
    const q = getRandomQuestion({
      difficulty: divisionIdx <= 1 ? "easy" : divisionIdx <= 3 ? "medium" : "hard",
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

    // AI score simulation for round
    const aiCorrect = Math.random() > 0.4;
    const aiPoints = aiCorrect ? Math.floor(Math.random() * 50) + 50 : 0;

    setTimeout(() => {
      // Calculate player points for round
      const playerPoints = correct ? Math.round((timeLeft / 20) * 100) : 0;
      setPlayerScore(p => p + playerPoints);
      setOpponentScore(o => o + aiPoints);

      // Carry on to next round or end match
      handleNextRound(correct, playerPoints);
    }, 1500);
  };

  const handleNextRound = (playerCorrect: boolean, playerPoints: number) => {
    if (matchRound >= 3) {
      // Duel finished!
      // Final outcome calculation
      const finalPlayer = playerScore + playerPoints;
      const finalOpponent = opponentScore;
      
      let matchOutcome: "victory" | "defeat" | "draw" = "draw";
      let lpChange = 0;
      let coinReward = 0;

      if (finalPlayer > finalOpponent) {
        matchOutcome = "victory";
        lpChange = 25;
        coinReward = 8;
        rewardMutation.mutate(8);
      } else if (finalPlayer < finalOpponent) {
        matchOutcome = "defeat";
        lpChange = -15;
      } else {
        matchOutcome = "draw";
        lpChange = 5;
        coinReward = 2;
        rewardMutation.mutate(2);
      }

      setOutcome(matchOutcome);
      setGameState("postmatch");

      // Update LP & Division
      setLp(prev => {
        let nextLp = prev + lpChange;
        if (nextLp >= 100) {
          if (divisionIdx < DIVISIONS.length - 1) {
            setDivisionIdx(d => d + 1);
            setRankPosition(pos => Math.max(1, pos - 15));
            toast.success(`🎉 ¡Felicidades! Promocionaste a la división: ${DIVISIONS[divisionIdx + 1]}!`);
          }
          return 0;
        } else if (nextLp < 0) {
          if (divisionIdx > 0) {
            setDivisionIdx(d => d - 1);
            toast.error(`⚠️ Descendiste a la división: ${DIVISIONS[divisionIdx - 1]}`);
          }
          return 50;
        }
        return nextLp;
      });
    } else {
      loadMatchQuestion(matchRound + 1);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#080D24]/90 backdrop-blur-xl border-b border-[#1E2D5A] px-6 py-4 flex items-center justify-between text-white">
        <button onClick={() => navigate({ to: "/games" })} className="text-[#8896B3] hover:text-white font-bold flex items-center gap-1.5 cursor-pointer bg-transparent border-none">
          <ArrowLeft className="size-5" /> Atrás
        </button>
        <h1 className="font-display text-lg font-bold">Ligas de Campeones</h1>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
          <Trophy className="size-4" />
          <span>{DIVISIONS[divisionIdx]} · {lp} LP</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 pt-6 pb-24 text-white min-h-[calc(100vh-64px)] bg-[#080D24] flex flex-col justify-center">
        {gameState === "lobby" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Division Card & Ladder Status */}
            <div className="md:col-span-1 bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-6 flex flex-col justify-between items-center text-center">
              <div>
                <span className="text-3xl select-none">🎖️</span>
                <h3 className="mt-3 font-display font-black text-xl text-primary">{DIVISIONS[divisionIdx]}</h3>
                <span className="text-[10px] text-slate-400 font-bold block uppercase mt-0.5">Puesto #{rankPosition} en la Liga</span>

                {/* Progress bar to promotion */}
                <div className="mt-6 space-y-1.5 w-full">
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>Progreso a Promoción</span>
                    <span>{lp}%</span>
                  </div>
                  <div className="w-40 bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full transition-all duration-300" style={{ width: `${lp}%` }} />
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed mt-6">
                Completa duelos 1v1 para sumar LP. Llega a 100 LP para ascender a {DIVISIONS[divisionIdx + 1] || "Leyenda"}.
              </p>
            </div>

            {/* Duel start panel */}
            <div className="md:col-span-2 bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <span className="text-xs bg-primary/20 text-primary border border-primary/30 px-3 py-0.5 rounded-full font-bold uppercase">
                  Ranked Matchmaking
                </span>
                <h2 className="mt-3 font-display font-black text-2xl">Duelos de Arena Académica 1v1</h2>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Competirás contra otros estudiantes sobresalientes por la supremacía de la división. Responde rápido y de forma correcta para maximizar tu puntaje de ronda.
                </p>
              </div>

              <button
                onClick={handleStartQueue}
                className="w-full h-12 mt-8 bg-primary hover:bg-primary-glow font-bold text-xs tracking-wider rounded-2xl cursor-pointer border-none transition active:scale-95"
              >
                Buscar Contendiente Ranked
              </button>
            </div>
          </div>
        )}

        {gameState === "queue" && (
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="relative flex justify-center">
              <div className="size-16 rounded-full bg-primary/20 border border-primary/40 animate-ping absolute" />
              <div className="size-16 rounded-full bg-primary grid place-items-center text-white text-3xl font-bold font-display z-10">⚔️</div>
            </div>
            <h2 className="font-display font-black text-xl text-primary">Emparejando oponentes...</h2>
            <p className="text-xs text-slate-400">Buscando un oponente con LP similar en la división {DIVISIONS[divisionIdx]}...</p>
          </div>
        )}

        {gameState === "match" && currentQuestion && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Left Scoreboard */}
            <div className="md:col-span-1 bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-5 text-center flex flex-col justify-between min-h-[220px]">
              <div>
                <span className="text-xs font-bold uppercase text-slate-400">Marcador Duelistas</span>
                <div className="mt-4 space-y-3">
                  <div className="bg-[#17224D] p-2 rounded-xl border border-[#3B6DE8]/10 text-xs">
                    <span className="block text-slate-400 font-semibold">Tú</span>
                    <span className="text-lg font-black text-white">{playerScore} pts</span>
                  </div>
                  <div className="bg-[#17224D] p-2 rounded-xl border border-[#3B6DE8]/10 text-xs">
                    <span className="block text-slate-400 font-semibold">{opponentName}</span>
                    <span className="text-lg font-black text-slate-400">{opponentScore} pts</span>
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 font-bold uppercase mt-4">
                Ronda {matchRound} de 3
              </div>
            </div>

            {/* Right Question runner */}
            <div className="md:col-span-3 bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-6 space-y-6">
              <div className="flex justify-between items-center text-xs text-slate-400 font-bold border-b border-[#1E2D5A] pb-3">
                <span className="bg-primary/20 text-primary border border-primary/30 px-2.5 py-0.5 rounded-full uppercase">
                  {currentQuestion.subject} - {currentQuestion.topic}
                </span>
                <span className="flex items-center gap-1 text-cyan-400">
                  <Timer className="size-4 animate-pulse" /> {timeLeft}s
                </span>
              </div>

              <div className="space-y-4">
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
          </div>
        )}

        {gameState === "postmatch" && (
          <div className="max-w-md mx-auto bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-6 text-center space-y-6 py-12 animate-in zoom-in-95">
            <div className="size-20 rounded-full bg-primary/10 text-primary grid place-items-center mx-auto text-4xl">🏁</div>
            <h2 className="font-display font-black text-2xl">
              {outcome === "victory" ? "¡Victoria Competitiva!" : outcome === "defeat" ? "Derrota" : "Empate en la Arena"}
            </h2>
            
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              El duelo 1v1 contra <strong>{opponentName}</strong> ha concluido.
            </p>

            <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto text-xs font-bold pt-2">
              <div className="bg-[#17224D] p-3 rounded-xl border border-[#3B6DE8]/10">
                <span className="block text-slate-400">Puntaje Final</span>
                <span className="text-lg font-black text-white">{playerScore} vs {opponentScore}</span>
              </div>
              <div className="bg-[#17224D] p-3 rounded-xl border border-[#3B6DE8]/10">
                <span className="block text-slate-400">Variación LP</span>
                <span className={`text-lg font-black ${outcome === "victory" ? "text-emerald-400" : "text-rose-400"}`}>
                  {outcome === "victory" ? "+25 LP" : outcome === "defeat" ? "-15 LP" : "+5 LP"}
                </span>
              </div>
            </div>

            <button
              onClick={() => setGameState("lobby")}
              className="h-11 px-6 bg-primary hover:bg-primary-glow font-bold text-xs rounded-xl cursor-pointer border-none transition"
            >
              Cerrar y Regresar
            </button>
          </div>
        )}
      </main>
    </>
  );
}
