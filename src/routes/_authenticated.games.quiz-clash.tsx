import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { rewardGameCoins } from "@/lib/games.functions";
import { AppHeader } from "@/components/AppHeader";
import { ArrowLeft, Gamepad2, Lock, Sparkles, Trophy, User, Users, Timer, HelpCircle, Swords, Zap, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { getRandomQuestion, type Question } from "@/lib/question-engine";
import { analyticsEngine } from "@/lib/analytics-engine";
import streakCap from "@/assets/streak-cap.png";

export const Route = createFileRoute("/_authenticated/games/quiz-clash")({
  head: () => ({ meta: [{ title: "Quiz Clash — Lybanhi" }] }),
  component: QuizClashGame,
});

const DIVISIONS = ["Bronce V", "Bronce I", "Plata V", "Plata I", "Oro III", "Oro I", "Platino", "Diamante", "Maestro"];
const BOT_NAMES = [
  "Alexis_Quantum", "Clara_Genetica", "Mateo_Algoritmos", 
  "Valeria_Newton", "Hugo_Socrates", "Elena_Calculo",
  "Diego_Darwin", "Sofia_Química", "Lucas_Algebra"
];

function QuizClashGame() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const rewardCoins = useServerFn(rewardGameCoins);

  // Persistent stats in LocalStorage
  const [divisionIdx, setDivisionIdx] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("quiz_clash_division");
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  const [lp, setLp] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("quiz_clash_lp");
      return saved ? parseInt(saved, 10) : 20;
    }
    return 20;
  });

  const [winStreak, setWinStreak] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("quiz_clash_streak");
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  // Game States
  const [gameState, setGameState] = useState<"lobby" | "queue" | "match" | "postmatch">("lobby");
  const [opponentName, setOpponentName] = useState("");
  const [opponentDivision, setOpponentDivision] = useState("");
  const [matchRound, setMatchRound] = useState(1);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [outcome, setOutcome] = useState<"victory" | "defeat" | "draw">("victory");

  // Question Engine States
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [timeLeft, setTimeLeft] = useState(15); // Fast-paced 15 seconds!
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [roundFeedback, setRoundFeedback] = useState<{ playerCorrect: boolean; opponentCorrect: boolean } | null>(null);

  // Sync stats to LocalStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("quiz_clash_division", divisionIdx.toString());
      localStorage.setItem("quiz_clash_lp", lp.toString());
      localStorage.setItem("quiz_clash_streak", winStreak.toString());
    }
  }, [divisionIdx, lp, winStreak]);

  const rewardMutation = useMutation({
    onMutate: () => {},
    mutationFn: (coins: number) => rewardCoins({ data: { coins } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  // Timer Countdown
  useEffect(() => {
    if (gameState !== "match" || timeLeft <= 0) {
      if (gameState === "match" && timeLeft === 0) {
        // Force wrap up round if timeout
        handleRoundTimeout();
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
    // Select a bot
    const bot = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
    const spread = Math.floor(Math.random() * 3) - 1; // -1, 0, +1 division range
    const opponentDivIdx = Math.max(0, Math.min(DIVISIONS.length - 1, divisionIdx + spread));
    
    setOpponentName(bot);
    setOpponentDivision(DIVISIONS[opponentDivIdx]);

    setTimeout(() => {
      setPlayerScore(0);
      setOpponentScore(0);
      setMatchRound(1);
      setGameState("match");
      loadQuestionForRound(1);
    }, 2500);
  };

  const loadQuestionForRound = (roundNum: number) => {
    setMatchRound(roundNum);
    setTimeLeft(15);
    setSelectedOption(null);
    setRoundFeedback(null);
    setQuestionStartTime(Date.now());

    // Higher divisions load harder questions
    let difficulty: "easy" | "medium" | "hard" = "easy";
    if (divisionIdx >= 3 && divisionIdx <= 6) difficulty = "medium";
    if (divisionIdx > 6) difficulty = "hard";

    const q = getRandomQuestion({ difficulty });
    setCurrentQuestion(q);
  };

  const handleRoundTimeout = () => {
    if (!currentQuestion) return;
    setSelectedOption(-1); // Marked as incorrect/unanswered

    const aiCorrect = Math.random() > 0.45; // AI has ~55% accuracy
    const aiPoints = aiCorrect ? Math.floor(Math.random() * 30) + 70 : 0;
    
    setRoundFeedback({
      playerCorrect: false,
      opponentCorrect: aiCorrect
    });

    setTimeout(() => {
      setOpponentScore(o => o + aiPoints);
      processNextStep(false, 0, aiPoints);
    }, 1800);
  };

  const submitAnswer = (optionIdx: number) => {
    if (!currentQuestion || selectedOption !== null) return;
    setSelectedOption(optionIdx);

    const correct = currentQuestion.type === "multiple-choice" && currentQuestion.correctIndex === optionIdx;
    const timeTaken = Date.now() - questionStartTime;

    analyticsEngine.trackAnswer(
      currentQuestion.subject,
      currentQuestion.topic,
      correct,
      timeTaken,
      currentQuestion.id
    );

    // Simulated AI response speed and accuracy
    const aiCorrect = Math.random() > (divisionIdx > 5 ? 0.35 : 0.5); // Higher divisions mean smarter AI
    const aiPoints = aiCorrect ? Math.round((Math.random() * 30 + 70) * (Math.random() * 0.4 + 0.6)) : 0;
    
    const playerPoints = correct ? Math.round((timeLeft / 15) * 100) + 50 : 0;

    setRoundFeedback({
      playerCorrect: correct,
      opponentCorrect: aiCorrect
    });

    setTimeout(() => {
      setPlayerScore(p => p + playerPoints);
      setOpponentScore(o => o + aiPoints);
      processNextStep(correct, playerPoints, aiPoints);
    }, 1500);
  };

  const processNextStep = (playerCorrect: boolean, pPoints: number, oPoints: number) => {
    if (matchRound >= 3) {
      // End of Match
      const finalPlayer = playerScore + pPoints;
      const finalOpponent = opponentScore + oPoints;

      let matchOutcome: "victory" | "defeat" | "draw" = "draw";
      let lpChange = 0;
      let coinReward = 0;

      if (finalPlayer > finalOpponent) {
        matchOutcome = "victory";
        lpChange = 25;
        // Streak bonus sombreritos
        const newStreak = winStreak + 1;
        setWinStreak(newStreak);
        coinReward = 10 + (newStreak >= 3 ? 5 : 0);
        rewardMutation.mutate(coinReward);
        if (newStreak >= 3) {
          toast.success(`🔥 ¡Racha de victorias x${newStreak}! +5 Sombreritos de bonificación.`);
        }
      } else if (finalPlayer < finalOpponent) {
        matchOutcome = "defeat";
        lpChange = -15;
        setWinStreak(0);
      } else {
        matchOutcome = "draw";
        lpChange = 5;
        coinReward = 3;
        rewardMutation.mutate(3);
        setWinStreak(0);
      }

      setOutcome(matchOutcome);
      setGameState("postmatch");

      // Update league points and handle promotions/demotions
      setLp(prev => {
        let nextLp = prev + lpChange;
        if (nextLp >= 100) {
          if (divisionIdx < DIVISIONS.length - 1) {
            setDivisionIdx(d => d + 1);
            toast.success(`🎉 ¡PROMOCIÓN! Has ascendido a la división: ${DIVISIONS[divisionIdx + 1]}!`);
          }
          return 0;
        } else if (nextLp < 0) {
          if (divisionIdx > 0) {
            setDivisionIdx(d => d - 1);
            toast.error(`⚠️ DESCENSO: Has bajado a la división: ${DIVISIONS[divisionIdx - 1]}`);
            return 60;
          }
          return 0;
        }
        return nextLp;
      });
    } else {
      loadQuestionForRound(matchRound + 1);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#0E0B1E] border-b border-[#2D1B4E] px-6 py-4 flex items-center justify-between text-white">
        <button onClick={() => navigate({ to: "/games" })} className="text-purple-400 hover:text-white font-bold flex items-center gap-1.5 cursor-pointer bg-transparent border-none">
          <ArrowLeft className="size-5" /> Regresar
        </button>
        <div className="flex items-center gap-2">
          <Swords className="size-5 text-purple-400 animate-pulse" />
          <h1 className="font-display text-lg font-black tracking-wide bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Quiz Clash Arena</h1>
        </div>
        <div className="flex items-center gap-2 bg-[#2D1B4E]/40 border border-[#4C2E85] px-3.5 py-1.5 rounded-full text-xs font-bold text-purple-300">
          <Trophy className="size-3.5 text-purple-400" />
          <span>{DIVISIONS[divisionIdx]} · {lp} LP</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 pt-6 pb-24 text-white min-h-[calc(100vh-68px)] bg-[#0B0816] flex flex-col justify-center relative overflow-hidden">
        {/* Glow ambient effects */}
        <div className="absolute top-1/4 left-1/4 size-80 rounded-full bg-purple-600/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 size-80 rounded-full bg-pink-600/5 blur-[120px] pointer-events-none" />

        {/* LOBBY STATE */}
        {gameState === "lobby" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {/* Left League Info */}
            <div className="bg-[#140F27] border-2 border-purple-500/10 rounded-3xl p-6 flex flex-col justify-between items-center text-center shadow-lg relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-purple-500 to-pink-500" />
              <div>
                <span className="text-4xl block mt-2">🏆</span>
                <h3 className="mt-4 font-display font-black text-xl text-purple-300">{DIVISIONS[divisionIdx]}</h3>
                
                {winStreak > 0 && (
                  <span className="inline-flex items-center gap-1.5 mt-2 bg-pink-500/25 border border-pink-500/40 text-pink-400 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                    <Zap className="size-3 text-pink-400 animate-bounce" /> Racha x{winStreak}
                  </span>
                )}

                {/* Progress bar to promotion */}
                <div className="mt-8 space-y-2 w-full">
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <span>Progreso de Ascenso</span>
                    <span>{lp}/100 LP</span>
                  </div>
                  <div className="w-full bg-[#0B0816] h-2.5 rounded-full overflow-hidden border border-[#2D1B4E]">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-500" style={{ width: `${lp}%` }} />
                  </div>
                </div>
              </div>
              
              <p className="text-[10px] text-slate-400 leading-relaxed mt-8 max-w-[200px]">
                Enfréntate a rivales 1v1. Suma LP ganando para ascender. El descenso está activo si bajas de 0 LP.
              </p>
            </div>

            {/* Right Battle Panel */}
            <div className="md:col-span-2 bg-[#140F27] border-2 border-purple-500/10 rounded-3xl p-8 flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-purple-500 to-pink-500" />
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full font-black uppercase tracking-wider">
                    Arena Premium 1v1
                  </span>
                  <span className="text-xs bg-gradient-to-r from-pink-500 to-purple-500 text-white px-2.5 py-1 rounded-full font-black uppercase tracking-wider animate-pulse">
                    En Vivo ⚔️
                  </span>
                </div>
                <h2 className="font-display font-black text-3xl text-slate-100 mt-2">Duelos de Arena Académica</h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Competencia intensa en tiempo real contra los mejores perfiles estudiantiles. Responde correctamente y a gran velocidad para ganar el choque del Quiz.
                </p>
                <div className="grid grid-cols-2 gap-4 pt-4 text-xs font-bold text-slate-300">
                  <div className="flex items-center gap-2 bg-[#0B0816] p-3 rounded-xl border border-purple-500/10">
                    <Zap className="size-4 text-pink-400" />
                    <span>Duelo Rápido (3 Rondas)</span>
                  </div>
                  <div className="flex items-center gap-2 bg-[#0B0816] p-3 rounded-xl border border-purple-500/10">
                    <HelpCircle className="size-4 text-purple-400" />
                    <span>Materias Escolares Reales</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleStartQueue}
                className="w-full h-12 mt-8 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 font-black text-xs uppercase tracking-widest rounded-2xl cursor-pointer border-none transition active:scale-98 shadow-md shadow-purple-500/20"
              >
                Buscar Rival y Entrar a Arena
              </button>
            </div>
          </div>
        )}

        {/* MATCHMAKING QUEUE STATE */}
        {gameState === "queue" && (
          <div className="max-w-md mx-auto text-center space-y-6 relative z-10">
            <div className="relative flex justify-center">
              <div className="size-20 rounded-full bg-purple-500/10 border border-purple-500/30 animate-ping absolute" />
              <div className="size-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 grid place-items-center text-white text-3xl font-bold shadow-lg shadow-purple-500/30 z-10">
                ⚔️
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="font-display font-black text-xl text-purple-300">Buscando Contrincante...</h2>
              <p className="text-xs text-slate-400">Matchmaking inteligente buscando un oponente en {DIVISIONS[divisionIdx]}...</p>
            </div>
          </div>
        )}

        {/* ACTIVE MATCH STATE */}
        {gameState === "match" && currentQuestion && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
            {/* Scoreboard Left */}
            <div className="md:col-span-1 bg-[#140F27] border border-purple-500/10 rounded-3xl p-5 text-center flex flex-col justify-between min-h-[250px] shadow-md">
              <div>
                <span className="text-[10px] font-black uppercase text-purple-400 tracking-widest">Choque de Arena</span>
                
                <div className="mt-4 space-y-3">
                  <div className="bg-[#0B0816] p-3 rounded-xl border border-purple-500/20 text-xs">
                    <span className="block text-slate-400 font-bold uppercase">Tú</span>
                    <span className="text-xl font-black text-white">{playerScore} pts</span>
                  </div>
                  <div className="bg-[#0B0816] p-3 rounded-xl border border-[#4C2E85]/30 text-xs">
                    <span className="block text-slate-400 font-bold uppercase truncate max-w-[120px] mx-auto">{opponentName}</span>
                    <span className="text-xs text-purple-400 font-bold block mb-1">{opponentDivision}</span>
                    <span className="text-xl font-black text-slate-400">{opponentScore} pts</span>
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-purple-300 font-black uppercase tracking-wider border-t border-purple-500/10 pt-3">
                Ronda {matchRound} de 3
              </div>
            </div>

            {/* Question Center Right */}
            <div className="md:col-span-3 bg-[#140F27] border border-purple-500/10 rounded-3xl p-6 space-y-6 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center text-xs text-slate-400 font-bold border-b border-purple-500/10 pb-3">
                  <span className="bg-purple-500/10 text-purple-300 border border-purple-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
                    {currentQuestion.subject} - {currentQuestion.topic}
                  </span>
                  <span className="flex items-center gap-1.5 text-pink-400 font-black">
                    <Timer className="size-4 animate-pulse text-pink-500" /> {timeLeft}s
                  </span>
                </div>

                <div className="mt-6 space-y-4">
                  <p className="text-base font-black text-slate-100 leading-relaxed">{currentQuestion.prompt}</p>

                  {/* Feedback overlay */}
                  {roundFeedback && (
                    <div className="flex items-center gap-4 bg-[#0B0816]/70 border border-purple-500/20 p-3.5 rounded-xl text-xs font-bold text-slate-300 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center gap-1">
                        <span>Tú:</span>
                        {roundFeedback.playerCorrect ? (
                          <CheckCircle2 className="size-4 text-emerald-400" />
                        ) : (
                          <XCircle className="size-4 text-rose-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 border-l border-purple-500/20 pl-4">
                        <span>{opponentName}:</span>
                        {roundFeedback.opponentCorrect ? (
                          <CheckCircle2 className="size-4 text-emerald-400" />
                        ) : (
                          <XCircle className="size-4 text-rose-500" />
                        )}
                      </div>
                    </div>
                  )}

                  {currentQuestion.type === "multiple-choice" && (
                    <div className="grid gap-3 pt-3 text-left">
                      {currentQuestion.options.map((option, idx) => {
                        let btnStyle = "border-[#2D1B4E] bg-[#0B0816] hover:bg-[#1C1538] text-slate-200 border";
                        if (selectedOption !== null) {
                          if (idx === currentQuestion.correctIndex) {
                            btnStyle = "border-emerald-500 bg-emerald-500/20 text-emerald-400 border-2";
                          } else if (idx === selectedOption) {
                            btnStyle = "border-rose-500 bg-rose-500/20 text-rose-400 border-2";
                          } else {
                            btnStyle = "opacity-30 border-[#2D1B4E] bg-[#0B0816]";
                          }
                        }

                        return (
                          <button
                            key={idx}
                            disabled={selectedOption !== null}
                            onClick={() => submitAnswer(idx)}
                            className={`w-full py-3.5 px-5 rounded-2xl text-xs font-bold transition active:scale-[0.99] cursor-pointer text-left ${btnStyle}`}
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
          </div>
        )}

        {/* POST MATCH / RESULTS STATE */}
        {gameState === "postmatch" && (
          <div className="max-w-md mx-auto bg-[#140F27] border-2 border-purple-500/25 rounded-3xl p-8 text-center space-y-6 py-12 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-purple-500 to-pink-500" />
            <div className="size-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white grid place-items-center mx-auto text-4xl shadow-lg shadow-purple-500/20">
              🏁
            </div>
            
            <div className="space-y-1.5">
              <h2 className="font-display font-black text-2xl text-slate-100 uppercase tracking-wide">
                {outcome === "victory" ? "¡Victoria Magistral!" : outcome === "defeat" ? "Derrota" : "Empate de Arena"}
              </h2>
              <p className="text-xs text-slate-400">
                Choque Arena 1v1 contra <strong>{opponentName}</strong> finalizado.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto text-xs font-black pt-2">
              <div className="bg-[#0B0816] p-3.5 rounded-xl border border-purple-500/10">
                <span className="block text-slate-400 text-[10px] uppercase mb-1">Puntaje Final</span>
                <span className="text-lg font-black text-slate-100">{playerScore} vs {opponentScore}</span>
              </div>
              <div className="bg-[#0B0816] p-3.5 rounded-xl border border-purple-500/10">
                <span className="block text-slate-400 text-[10px] uppercase mb-1">Resultado LP</span>
                <span className={`text-lg font-black ${outcome === "victory" ? "text-emerald-400" : outcome === "defeat" ? "text-rose-400" : "text-purple-400"}`}>
                  {outcome === "victory" ? "+25 LP" : outcome === "defeat" ? "-15 LP" : "+5 LP"}
                </span>
              </div>
            </div>

            {outcome === "victory" && (
              <div className="flex items-center justify-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 py-2.5 px-4 rounded-xl text-xs font-bold text-emerald-400 max-w-xs mx-auto">
                <img src={streakCap} alt="" className="size-4 shrink-0 select-none animate-bounce" />
                <span>+10 Sombreritos de recompensa directa</span>
              </div>
            )}

            <button
              onClick={() => setGameState("lobby")}
              className="h-11 px-8 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer border-none transition shadow-md shadow-purple-500/20"
            >
              Cerrar y Regresar
            </button>
          </div>
        )}
      </main>
    </>
  );
}
