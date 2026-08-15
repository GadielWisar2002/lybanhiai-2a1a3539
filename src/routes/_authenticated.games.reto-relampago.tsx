import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { 
  ArrowLeft, Trophy, Zap, Heart, Timer, Sparkles, 
  RotateCcw, CheckCircle2, XCircle, AlertCircle, 
  BookOpen, Volume2, VolumeX, Flame, ChevronRight,
  Brain, ShieldAlert, Award, Star, Compass, Play
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { rewardGameCoins, rewardGameXp } from "@/lib/games.functions";
import streakCap from "@/assets/streak-cap.png";
import { 
  RETO_CATEGORIES, 
  RETO_QUESTIONS_DB, 
  getRetoQuestions, 
  type RetoCategory, 
  type RetoQuestion, 
  type CategoryInfo 
} from "@/lib/reto-relampago-data";

export const Route = createFileRoute("/_authenticated/games/reto-relampago")({
  head: () => ({ meta: [{ title: "Reto Relámpago — Trivia Educativa — Lybanhi" }] }),
  component: RetoRelampagoGame,
});

type GameMode = "standard" | "unlimited" | "survival";

interface QuestionAnswerRecord {
  question: RetoQuestion;
  selectedOptionIndex: number | null; // null if timed out
  isCorrect: boolean;
  timeSpent: number; // in seconds
  scoreEarned: number;
}

// Synthesizer for lightweight Web Audio Sound FX without external assets
class WebAudioSFX {
  private ctx: AudioContext | null = null;

  private getCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playCorrect() {
    try {
      const ctx = this.getCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5
      osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.25); // C6

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // Audio not supported or blocked
    }
  }

  playIncorrect() {
    try {
      const ctx = this.getCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now); // A3
      osc.frequency.exponentialRampToValueAtTime(146.83, now + 0.25); // D3

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {}
  }

  playStreak() {
    try {
      const ctx = this.getCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      
      const notes = [659.25, 783.99, 987.77, 1318.51]; // E5, G5, B5, E6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + i * 0.06);
        gain.gain.setValueAtTime(0.18, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.06 + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.15);
      });
    } catch {}
  }

  playTick() {
    try {
      const ctx = this.getCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch {}
  }

  playVictory() {
    try {
      const ctx = this.getCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const chords = [523.25, 659.25, 783.99, 1046.50];
      chords.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.8);
      });
    } catch {}
  }
}

const sfx = new WebAudioSFX();

export function RetoRelampagoGame() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const rewardCoins = useServerFn(rewardGameCoins);
  const rewardXp = useServerFn(rewardGameXp);

  // Sound preference
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("reto_sound_enabled") !== "false";
    }
    return true;
  });

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("reto_sound_enabled", next ? "true" : "false");
  };

  // Game setup states
  const [gameState, setGameState] = useState<"lobby" | "playing" | "answered" | "gameover">("lobby");
  const [selectedCategory, setSelectedCategory] = useState<RetoCategory | "random">("random");
  const [gameMode, setGameMode] = useState<GameMode>("standard");

  // In-game states
  const [questions, setQuestions] = useState<RetoQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isTimeOut, setIsTimeOut] = useState(false);
  const [answerHistory, setAnswerHistory] = useState<QuestionAnswerRecord[]>([]);
  const [earnedReward, setEarnedReward] = useState<{ xp: number; coins: number } | null>(null);

  // Timer states (20 seconds per question)
  const QUESTION_TIME_LIMIT = 20;
  const [timeLeft, setTimeLeft] = useState<number>(QUESTION_TIME_LIMIT);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTimeRef = useRef<number>(Date.now());

  // Current Question
  const currentQ = questions[currentIndex];

  // Start new game match
  const handleStartGame = (category: RetoCategory | "random", mode: GameMode = "standard") => {
    setSelectedCategory(category);
    setGameMode(mode);

    // Get 10 questions for standard/unlimited, or a large pool for survival
    const totalCount = mode === "survival" ? 50 : 10;
    const initialQuestions = getRetoQuestions(category, totalCount, mode !== "unlimited");

    setQuestions(initialQuestions);
    setCurrentIndex(0);
    setLives(3);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setSelectedOption(null);
    setIsTimeOut(false);
    setAnswerHistory([]);
    setEarnedReward(null);
    setTimeLeft(QUESTION_TIME_LIMIT);
    questionStartTimeRef.current = Date.now();
    setGameState("playing");
  };

  // Timer Tick Hook
  useEffect(() => {
    if (gameState !== "playing" || gameMode === "unlimited") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setTimeLeft(QUESTION_TIME_LIMIT);
    questionStartTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeOut();
          return 0;
        }
        if (prev <= 4 && soundEnabled) {
          sfx.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, gameState, gameMode]);

  // Handle Timeout
  const handleTimeOut = () => {
    if (gameState !== "playing") return;
    setIsTimeOut(true);
    setSelectedOption(null);
    setGameState("answered");

    if (soundEnabled) sfx.playIncorrect();

    const newLives = Math.max(0, lives - 1);
    setLives(newLives);
    setStreak(0);

    const record: QuestionAnswerRecord = {
      question: currentQ,
      selectedOptionIndex: null,
      isCorrect: false,
      timeSpent: QUESTION_TIME_LIMIT,
      scoreEarned: 0,
    };
    setAnswerHistory((prev) => [...prev, record]);

    if (gameMode === "survival" && newLives === 0) {
      setTimeout(() => {
        handleEndGame([...answerHistory, record], score, maxStreak);
      }, 2000);
    }
  };

  // Handle Option Select
  const handleSelectOption = (index: number) => {
    if (gameState !== "playing") return;

    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedOption(index);
    setGameState("answered");
    setIsTimeOut(false);

    const timeSpent = Math.max(0.5, (Date.now() - questionStartTimeRef.current) / 1000);
    const isCorrect = index === currentQ.correctIndex;

    let pointsThisTurn = 0;
    let newStreak = streak;
    let newMaxStreak = maxStreak;
    let newLives = lives;

    if (isCorrect) {
      if (soundEnabled) sfx.playCorrect();

      newStreak = streak + 1;
      if (newStreak > newMaxStreak) newMaxStreak = newStreak;
      setStreak(newStreak);
      setMaxStreak(newMaxStreak);

      // Multiplier based on streak
      let streakMultiplier = 1.0;
      if (newStreak >= 10) streakMultiplier = 3.0;
      else if (newStreak >= 5) streakMultiplier = 2.0;
      else if (newStreak >= 3) streakMultiplier = 1.5;

      // Speed bonus (more points if answered quickly)
      const remainingSeconds = Math.max(0, QUESTION_TIME_LIMIT - timeSpent);
      const speedBonus = gameMode === "unlimited" ? 0 : Math.round(remainingSeconds * 2.5); // Up to 50 pts
      
      const basePoints = 100;
      pointsThisTurn = Math.round((basePoints + speedBonus) * streakMultiplier);

      const nextScore = score + pointsThisTurn;
      setScore(nextScore);

      if ((newStreak === 3 || newStreak === 5 || newStreak === 10) && soundEnabled) {
        sfx.playStreak();
        toast.success(`🔥 ¡Racha x${newStreak}! Multiplicador ${streakMultiplier}x activado`, {
          duration: 2000,
        });
      }
    } else {
      if (soundEnabled) sfx.playIncorrect();
      newLives = Math.max(0, lives - 1);
      setLives(newLives);
      setStreak(0);
    }

    const record: QuestionAnswerRecord = {
      question: currentQ,
      selectedOptionIndex: index,
      isCorrect,
      timeSpent,
      scoreEarned: pointsThisTurn,
    };
    const updatedHistory = [...answerHistory, record];
    setAnswerHistory(updatedHistory);

    // If survival and out of lives, trigger game over after a short view
    if (gameMode === "survival" && newLives === 0) {
      setTimeout(() => {
        handleEndGame(updatedHistory, score + pointsThisTurn, newMaxStreak);
      }, 2000);
    }
  };

  // Move to Next Question or Final Screen
  const handleNextQuestion = () => {
    const isLast = currentIndex >= questions.length - 1;
    if (isLast) {
      handleEndGame(answerHistory, score, maxStreak);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsTimeOut(false);
      setGameState("playing");
    }
  };

  // Keyboard controls for options A/B/C/D or 1/2/3/4 & Enter to next
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === "playing") {
        if (e.key === "1" || e.key.toLowerCase() === "a") handleSelectOption(0);
        else if (e.key === "2" || e.key.toLowerCase() === "b") handleSelectOption(1);
        else if (e.key === "3" || e.key.toLowerCase() === "c") handleSelectOption(2);
        else if (e.key === "4" || e.key.toLowerCase() === "d") handleSelectOption(3);
      } else if (gameState === "answered") {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleNextQuestion();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, currentIndex, questions, score, streak, lives]);

  // End Game and Grant Rewards
  const handleEndGame = async (
    finalHistory: QuestionAnswerRecord[],
    finalScore: number,
    finalMaxStreak: number
  ) => {
    setGameState("gameover");
    if (soundEnabled) sfx.playVictory();

    const correctCount = finalHistory.filter((h) => h.isCorrect).length;
    const totalCount = finalHistory.length;
    const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

    // Calculate XP and Sombreritos
    // Base XP: proportional to score (e.g. 50-250 XP)
    const xpAwarded = Math.min(350, Math.max(30, Math.round(finalScore / 4)));
    const coinsAwarded = accuracy >= 80 ? 3 : accuracy >= 50 ? 2 : 1;

    try {
      await Promise.allSettled([
        rewardXp({ data: { amount: xpAwarded } }),
        rewardCoins({ data: { coins: coinsAwarded } }),
      ]);
      setEarnedReward({ xp: xpAwarded, coins: coinsAwarded });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    } catch {
      // Continue gracefully even if network reward fails
      setEarnedReward({ xp: xpAwarded, coins: coinsAwarded });
    }
  };

  // Breakdown statistics per category
  const getCategoryBreakdown = () => {
    const stats: Record<string, { total: number; correct: number; info: CategoryInfo }> = {};
    answerHistory.forEach((item) => {
      const catId = item.question.category;
      if (!stats[catId]) {
        const catInfo = RETO_CATEGORIES.find((c) => c.id === catId) || {
          id: catId as any,
          name: catId,
          icon: "📚",
          description: "",
          color: "text-primary",
          bgColor: "bg-primary/10",
          borderColor: "border-primary/20",
        };
        stats[catId] = { total: 0, correct: 0, info: catInfo };
      }
      stats[catId].total += 1;
      if (item.isCorrect) stats[catId].correct += 1;
    });
    return Object.values(stats);
  };

  // Average time calculation
  const getAverageTime = () => {
    if (answerHistory.length === 0) return 0;
    const totalSec = answerHistory.reduce((acc, curr) => acc + curr.timeSpent, 0);
    return (totalSec / answerHistory.length).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (gameState === "playing" || gameState === "answered") {
                  if (confirm("¿Deseas salir de la partida actual?")) {
                    setGameState("lobby");
                  }
                } else {
                  navigate({ to: "/games" });
                }
              }}
              className="flex size-9 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition active:scale-95 cursor-pointer border-none"
              title="Volver"
            >
              <ArrowLeft className="size-4" />
            </button>
            <div>
              <h1 className="font-display text-lg font-black tracking-tight text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <Zap className="size-5 text-amber-500 fill-amber-500 animate-pulse" />
                Reto Relámpago
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Trivia educativa rápida y ágil
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleSound}
              className="flex size-9 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition active:scale-95 cursor-pointer border-none"
              title={soundEnabled ? "Silenciar efectos de sonido" : "Activar sonido"}
            >
              {soundEnabled ? <Volume2 className="size-4 text-blue-500" /> : <VolumeX className="size-4 text-slate-400" />}
            </button>
            <Link
              to="/games"
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 transition"
            >
              Hub de Juegos
            </Link>
          </div>
        </div>
      </header>

      {/* Main Game Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        
        {/* ========================================================================= */}
        {/* 1. LOBBY / SELECCIÓN DE CATEGORÍA Y MODO */}
        {/* ========================================================================= */}
        {gameState === "lobby" && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            {/* Hero Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center relative overflow-hidden">
              <div className="absolute -right-12 -top-12 size-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -left-12 -bottom-12 size-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 mb-4 animate-bounce">
                <Brain className="size-9" />
              </div>

              <h2 className="font-display text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                Reto Relámpago
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
                Pon a prueba tus conocimientos en 10 preguntas rápidas con retroalimentación y explicaciones educativas instantáneas.
              </p>

              {/* Game Mode Selector */}
              <div className="mt-6 inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex-wrap justify-center gap-1">
                {[
                  { id: "standard", label: "⚡ Reto Relámpago", desc: "10 preguntas · 20s" },
                  { id: "unlimited", label: "🧠 Sin límite", desc: "Modo estudio libre" },
                  { id: "survival", label: "🔥 Supervivencia", desc: "Hasta 3 vidas" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setGameMode(mode.id as GameMode)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      gameMode === mode.id
                        ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Compass className="size-4 text-blue-500" />
                  Selecciona una materia
                </h3>
                <span className="text-xs text-slate-400 font-medium">
                  {RETO_QUESTIONS_DB.length}+ preguntas disponibles
                </span>
              </div>

              {/* Random / All mixed button */}
              <button
                onClick={() => handleStartGame("random", gameMode)}
                className="w-full group p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold text-left shadow-md shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 transition-all duration-300 flex items-center justify-between cursor-pointer border-none active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <span className="text-3xl sm:text-4xl bg-white/20 p-2.5 rounded-xl backdrop-blur-sm group-hover:rotate-12 transition-transform">
                    🎲
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base sm:text-lg font-black">Modo Aleatorio</span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-white/25 rounded-full tracking-wider">
                        Recomendado
                      </span>
                    </div>
                    <p className="text-xs text-blue-100 font-normal mt-0.5">
                      Mezcla preguntas de todas las ciencias, matemáticas, español, historia e inglés.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm font-black bg-white/20 hover:bg-white/30 px-3.5 py-2 rounded-xl transition">
                  <span>Jugar</span>
                  <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Specific Categories */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {RETO_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleStartGame(cat.id, gameMode)}
                    className={`group p-4 rounded-2xl bg-white dark:bg-slate-900 border ${cat.borderColor} hover:border-blue-400 dark:hover:border-blue-500 shadow-sm hover:shadow-md transition-all text-left flex items-center justify-between cursor-pointer active:scale-[0.98]`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl p-2 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:scale-110 transition-transform">
                        {cat.icon}
                      </span>
                      <div>
                        <h4 className={`text-sm font-bold ${cat.color}`}>
                          {cat.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                          {cat.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. EN JUEGO: PREGUNTA & OPCIONES */}
        {/* ========================================================================= */}
        {(gameState === "playing" || gameState === "answered") && currentQ && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Top Status Bar: Question Progress, Hearts, Streak, Score & Timer */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                {/* Question counter & Category */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    Pregunta {currentIndex + 1} de {gameMode === "survival" ? "∞" : questions.length}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                    {RETO_CATEGORIES.find((c) => c.id === currentQ.category)?.icon}{" "}
                    {RETO_CATEGORIES.find((c) => c.id === currentQ.category)?.name}
                  </span>
                </div>

                {/* Right side stats: Lives, Streak & Score */}
                <div className="flex items-center gap-3">
                  {/* Streak pill */}
                  {streak >= 2 && (
                    <div className="flex items-center gap-1 text-xs font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full animate-bounce">
                      <Flame className="size-3.5 fill-amber-500" />
                      <span>x{streak}</span>
                    </div>
                  )}

                  {/* Hearts */}
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3].map((heartIndex) => (
                      <Heart
                        key={heartIndex}
                        className={`size-4 transition-all duration-300 ${
                          heartIndex <= lives
                            ? "text-rose-500 fill-rose-500 scale-100"
                            : "text-slate-300 dark:text-slate-700 scale-90"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-1 font-display font-black text-sm text-slate-800 dark:text-slate-200">
                    <Trophy className="size-4 text-amber-500" />
                    <span>{score}</span>
                  </div>
                </div>
              </div>

              {/* 20-second Timer Bar */}
              {gameMode !== "unlimited" && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                    <span className="flex items-center gap-1">
                      <Timer className="size-3 text-slate-400" /> Tiempo restante
                    </span>
                    <span className={`font-mono font-bold ${timeLeft <= 5 ? "text-rose-500 font-black animate-pulse" : ""}`}>
                      {timeLeft}s
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                        timeLeft > 10
                          ? "bg-blue-500"
                          : timeLeft > 5
                          ? "bg-amber-500"
                          : "bg-rose-500 animate-pulse"
                      }`}
                      style={{ width: `${(timeLeft / QUESTION_TIME_LIMIT) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Question Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm relative">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Dificultad: {currentQ.difficulty === "easy" ? "Fácil" : currentQ.difficulty === "medium" ? "Media" : "Avanzada"}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  100 pts {gameMode !== "unlimited" && "+ bonus de velocidad"}
                </span>
              </div>

              <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
                {currentQ.question}
              </h2>

              {/* 4 Interactive Answer Options */}
              <div className="mt-6 grid grid-cols-1 gap-3">
                {currentQ.options.map((option, optIdx) => {
                  const letter = ["A", "B", "C", "D"][optIdx];
                  const isChosen = selectedOption === optIdx;
                  const isCorrect = optIdx === currentQ.correctIndex;
                  const isAnswered = gameState === "answered";

                  let buttonStyles = "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-950/30 text-slate-800 dark:text-slate-200";
                  let letterStyles = "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300";

                  if (isAnswered) {
                    if (isCorrect) {
                      buttonStyles = "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold shadow-md shadow-emerald-500/10 scale-[1.01]";
                      letterStyles = "bg-emerald-500 text-white font-bold";
                    } else if (isChosen && !isCorrect) {
                      buttonStyles = "bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-200 font-bold shake-animation";
                      letterStyles = "bg-rose-500 text-white font-bold";
                    } else {
                      buttonStyles = "bg-slate-50/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-800/50 text-slate-400 opacity-60";
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      disabled={isAnswered}
                      onClick={() => handleSelectOption(optIdx)}
                      className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between text-left cursor-pointer active:scale-[0.99] ${buttonStyles}`}
                    >
                      <div className="flex items-center gap-3.5">
                        <span className={`flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-black ${letterStyles}`}>
                          {letter}
                        </span>
                        <span className="text-sm sm:text-base font-semibold leading-snug">
                          {option}
                        </span>
                      </div>

                      {isAnswered && (
                        <div className="shrink-0 ml-2">
                          {isCorrect && <CheckCircle2 className="size-5 text-emerald-500" />}
                          {isChosen && !isCorrect && <XCircle className="size-5 text-rose-500" />}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Feedback and Educational Explanation Box */}
              {gameState === "answered" && (
                <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  {/* Status Banner */}
                  <div
                    className={`p-3.5 rounded-2xl flex items-center gap-2.5 font-bold text-sm ${
                      selectedOption === currentQ.correctIndex
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                        : isTimeOut
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                        : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                    }`}
                  >
                    {selectedOption === currentQ.correctIndex ? (
                      <>
                        <CheckCircle2 className="size-5 text-emerald-500" />
                        <span>¡Correcto! {streak > 1 && `(🔥 Racha x${streak})`}</span>
                      </>
                    ) : isTimeOut ? (
                      <>
                        <AlertCircle className="size-5 text-amber-500" />
                        <span>⏰ ¡Se acabó el tiempo!</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="size-5 text-rose-500" />
                        <span>¡Respuesta incorrecta!</span>
                      </>
                    )}
                  </div>

                  {/* Educational explanation pill */}
                  <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                    <p className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5 mb-1">
                      <BookOpen className="size-4" />
                      Dato educativo:
                    </p>
                    <p>{currentQ.explanation}</p>
                  </div>

                  {/* Next Question Button */}
                  <button
                    onClick={handleNextQuestion}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-display font-bold text-sm sm:text-base tracking-wide transition shadow-lg shadow-blue-500/25 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 border-none"
                  >
                    <span>
                      {currentIndex >= questions.length - 1 ? "Ver resultados finales 🎉" : "Siguiente pregunta"}
                    </span>
                    <ChevronRight className="size-5" />
                  </button>
                  <p className="text-[11px] text-center text-slate-400 font-medium">
                    (o presiona <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono">Enter</kbd> para continuar)
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. PANTALLA FINAL: RESULTADOS & REPASO EDUCATIVO */}
        {/* ========================================================================= */}
        {gameState === "gameover" && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 py-4">
            {/* Header Result Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center relative overflow-hidden">
              <div className="inline-flex size-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-white shadow-xl shadow-yellow-500/20 mb-4 animate-bounce">
                <Trophy className="size-10" />
              </div>

              <h2 className="font-display text-3xl font-black text-slate-900 dark:text-white">
                🎉 ¡Partida terminada!
              </h2>

              {/* Big Score Display */}
              <div className="my-4">
                <span className="font-display text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                  {score}
                </span>
                <span className="block text-xs uppercase tracking-widest font-bold text-slate-400 mt-1">
                  Puntos obtenidos
                </span>
              </div>

              {/* Motivational message */}
              <p className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300 max-w-md mx-auto">
                {(() => {
                  const correct = answerHistory.filter((a) => a.isCorrect).length;
                  const ratio = answerHistory.length > 0 ? correct / answerHistory.length : 0;
                  if (ratio >= 0.9) return "🌟 ¡Excelente trabajo! Tienes muy buen dominio de estos temas.";
                  if (ratio >= 0.7) return "🚀 ¡Gran desempeño! Estás avanzando con pasos firmes.";
                  if (ratio >= 0.5) return "💪 ¡Buen intento! Practica un poco más y podrás mejorar tu puntuación.";
                  return "📚 ¡Sigue practicando! La constancia es la clave del aprendizaje.";
                })()}
              </p>

              {/* Earned Rewards Pill */}
              {earnedReward && (
                <div className="mt-5 inline-flex items-center gap-4 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-700 dark:text-amber-300">
                  <span className="flex items-center gap-1">
                    <Sparkles className="size-3.5 text-amber-500" />
                    +{earnedReward.xp} XP
                  </span>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <img src={streakCap} alt="" className="size-3.5" />
                    +{earnedReward.coins} Sombreritos
                  </span>
                </div>
              )}
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center">
                <Flame className="size-5 text-amber-500 mx-auto mb-1" />
                <span className="text-xs text-slate-400 font-bold uppercase">Racha Máx.</span>
                <p className="font-display text-xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
                  {maxStreak}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center">
                <CheckCircle2 className="size-5 text-emerald-500 mx-auto mb-1" />
                <span className="text-xs text-slate-400 font-bold uppercase">Correctas</span>
                <p className="font-display text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {answerHistory.filter((a) => a.isCorrect).length}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center">
                <XCircle className="size-5 text-rose-500 mx-auto mb-1" />
                <span className="text-xs text-slate-400 font-bold uppercase">Incorrectas</span>
                <p className="font-display text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
                  {answerHistory.filter((a) => !a.isCorrect).length}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center">
                <Timer className="size-5 text-blue-500 mx-auto mb-1" />
                <span className="text-xs text-slate-400 font-bold uppercase">Tiempo Prom.</span>
                <p className="font-display text-xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
                  {getAverageTime()}s
                </p>
              </div>
            </div>

            {/* 📊 Desempeño por Materia */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>📊</span> Tu desempeño por materia
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {getCategoryBreakdown().map(({ info, total, correct }) => {
                  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
                  return (
                    <div key={info.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                          <span>{info.icon}</span> {info.name}
                        </span>
                        <span className={`${pct >= 70 ? "text-emerald-500" : "text-amber-500"}`}>
                          {correct}/{total} ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-rose-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 📖 Sección de Aprendizaje (Preguntas para repasar) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>💡</span> Repaso y Aprendizaje
                </h3>
                <span className="text-xs text-slate-400 font-medium">
                  {answerHistory.filter((a) => !a.isCorrect).length} temas para repasar
                </span>
              </div>

              {answerHistory.filter((a) => !a.isCorrect).length === 0 ? (
                <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-center">
                  <span className="text-3xl mb-2 block">🌟</span>
                  <h4 className="font-bold text-emerald-800 dark:text-emerald-200 text-sm">
                    ¡Impecable! No tuviste ningún error
                  </h4>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    Respondiste todas las preguntas de manera acertada. ¡Sigue así!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {answerHistory
                    .filter((a) => !a.isCorrect)
                    .map((item, idx) => {
                      const userChoice = item.selectedOptionIndex !== null ? item.question.options[item.selectedOptionIndex] : "Se acabó el tiempo (sin respuesta)";
                      const correctChoice = item.question.options[item.question.correctIndex];

                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-2"
                        >
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-start gap-1.5">
                            <span className="text-rose-500 font-bold shrink-0">❌</span>
                            <span>{item.question.question}</span>
                          </p>

                          <div className="text-xs grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300">
                              <span className="font-bold block text-[10px] uppercase text-rose-500">Tu respuesta:</span>
                              {userChoice}
                            </div>
                            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                              <span className="font-bold block text-[10px] uppercase text-emerald-500">Respuesta correcta:</span>
                              {correctChoice}
                            </div>
                          </div>

                          <div className="pt-2 text-xs text-slate-600 dark:text-slate-300 bg-blue-50/50 dark:bg-blue-950/20 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/40 leading-relaxed">
                            <span className="font-bold text-blue-600 dark:text-blue-400">💡 Aprende: </span>
                            {item.question.explanation}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => handleStartGame(selectedCategory, gameMode)}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer flex items-center justify-center gap-2 border-none"
              >
                <RotateCcw className="size-4" />
                <span>Jugar de nuevo</span>
              </button>

              <button
                onClick={() => setGameState("lobby")}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-sm transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Compass className="size-4 text-blue-500" />
                <span>Cambiar categoría / modo</span>
              </button>

              <Link
                to="/games"
                className="py-3.5 px-5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-sm transition flex items-center justify-center"
              >
                Hub de Juegos
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
export default RetoRelampagoGame;
