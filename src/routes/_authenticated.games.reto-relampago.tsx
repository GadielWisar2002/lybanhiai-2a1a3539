import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { 
  ArrowLeft, Trophy, Zap, Heart, Timer, Sparkles, 
  RotateCcw, CheckCircle2, XCircle, AlertCircle, 
  BookOpen, Volume2, VolumeX, Flame, ChevronRight,
  Brain, FileText, Camera, Upload, Link as LinkIcon, 
  Star, Compass, Play, Loader2, Check, RefreshCw,
  HelpCircle, Lightbulb, GraduationCap, ArrowRight,
  Sliders, ShieldCheck, Layers
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { rewardGameCoins, rewardGameXp } from "@/lib/games.functions";
import { extractTextFromMedia } from "@/lib/quiz.functions";
import { 
  analyzeStudyMaterial, 
  generateStudyGameQuestions, 
  generateReviewQuestions,
  type StudyQuestion,
  type StudyAnalysisResult 
} from "@/lib/study-game.functions";
import { PRESET_STUDY_TOPICS, type PresetTopic } from "@/lib/preset-study-materials";
import streakCap from "@/assets/streak-cap.png";

export const Route = createFileRoute("/_authenticated/games/reto-relampago")({
  head: () => ({ meta: [{ title: "Reto Relámpago — Estudio y Juego — Lybanhi" }] }),
  component: RetoRelampagoGame,
});

type AppPhase = 
  | "select_source"       // 1. Elegir o subir material
  | "analyzing"           // 2. IA analizando apuntes...
  | "study_overview"      // 3. Explicación previa + Lo más importante
  | "generating_game"     // 4. IA creando preguntas
  | "playing"             // 5. En partida
  | "question_feedback"   // 6. Retroalimentación inmediata
  | "results"             // 7. Resultados y diagnóstico (Lo que dominas vs Lo que debes repasar)
  | "generating_review";  // 8. IA generando práctica de errores

type GameMode = "fast" | "practice" | "challenge" | "review";
type Difficulty = "easy" | "medium" | "hard";

interface AnswerRecord {
  question: StudyQuestion;
  userChoice: string;
  isCorrect: boolean;
  timeSpent: number;
  scoreEarned: number;
}

// Web Audio API Synthesizer for instant native sound effects
class SoundFX {
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
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.25);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }

  playIncorrect() {
    try {
      const ctx = this.getCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(146.83, now + 0.25);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
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
      osc.frequency.setValueAtTime(750, now);
      gain.gain.setValueAtTime(0.04, now);
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
      [523.25, 659.25, 783.99, 1046.50].forEach((freq) => {
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

const sfx = new SoundFX();

export function RetoRelampagoGame() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const rewardCoins = useServerFn(rewardGameCoins);
  const rewardXp = useServerFn(rewardGameXp);
  const analyzeMaterialFn = useServerFn(analyzeStudyMaterial);
  const generateQuestionsFn = useServerFn(generateStudyGameQuestions);
  const generateReviewFn = useServerFn(generateReviewQuestions);
  const extractMediaFn = useServerFn(extractTextFromMedia);

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

  // Main Flow Phase
  const [phase, setPhase] = useState<AppPhase>("select_source");
  const [sourceTab, setSourceTab] = useState<"preset" | "upload">("preset");

  // Material Upload Form State
  const [uploadType, setUploadType] = useState<"text" | "file" | "camera" | "link">("text");
  const [customText, setCustomText] = useState("");
  const [customLink, setCustomLink] = useState("");
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Active Material & Analysis
  const [analysis, setAnalysis] = useState<StudyAnalysisResult | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>("Todos los temas");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [gameMode, setGameMode] = useState<GameMode>("fast");

  // In-Game States
  const [questions, setQuestions] = useState<StudyQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isTimeOut, setIsTimeOut] = useState(false);
  const [answersHistory, setAnswersHistory] = useState<AnswerRecord[]>([]);
  const [earnedReward, setEarnedReward] = useState<{ xp: number; coins: number } | null>(null);

  // Timer: 20 seconds
  const QUESTION_TIME_LIMIT = 20;
  const [timeLeft, setTimeLeft] = useState<number>(QUESTION_TIME_LIMIT);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTimeRef = useRef<number>(Date.now());

  const currentQ = questions[currentIndex];

  // -------------------------------------------------------------
  // 1. MATERIAL SELECTION / UPLOAD LOGIC
  // -------------------------------------------------------------
  const handleSelectPreset = (preset: PresetTopic) => {
    const res: StudyAnalysisResult = {
      ...preset.preAnalyzed,
      sourceText: preset.content,
      isPreset: true,
      presetId: preset.id,
    };
    setAnalysis(res);
    setSelectedSubtopic(res.detectedTopics[0] || "Todos los temas");
    setPhase("study_overview");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingMedia(true);
    setUploadedFileName(file.name);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const result = event.target?.result as string;
        const base64Data = result.split(",")[1];
        const mimeType = file.type || "application/pdf";

        try {
          const ocrRes = await extractMediaFn({
            data: { base64Data, mimeType },
          });

          if (!ocrRes.text || ocrRes.text.trim().length === 0) {
            throw new Error("No se detectó texto legible en el archivo. Por favor sube un documento con texto claro o copia tus apuntes.");
          }

          setCustomText(ocrRes.text);
          toast.success("¡Texto extraído de tus apuntes con éxito! 📄✨");
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Error al leer el archivo");
        } finally {
          setIsProcessingMedia(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsProcessingMedia(false);
      toast.error("Error al cargar el archivo");
    }
  };

  const handleAnalyzeCustomMaterial = async () => {
    let contentToAnalyze = customText.trim();
    if (uploadType === "link") {
      if (!customLink.trim()) {
        toast.error("Por favor ingresa un enlace válido");
        return;
      }
      contentToAnalyze = customLink.trim();
    }

    if (!contentToAnalyze) {
      toast.error("Por favor ingresa o sube el texto de tus apuntes");
      return;
    }

    setPhase("analyzing");
    try {
      const res = await analyzeMaterialFn({
        data: {
          content: contentToAnalyze,
          sourceName: uploadedFileName || "Mis Apuntes",
        },
      });
      setAnalysis(res);
      setSelectedSubtopic(res.detectedTopics[0] || "Todos los temas");
      setPhase("study_overview");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al analizar el material");
      setPhase("select_source");
    }
  };

  // -------------------------------------------------------------
  // 2. START GAME FROM STUDY OVERVIEW
  // -------------------------------------------------------------
  const handleStartGame = async () => {
    if (!analysis) return;

    setPhase("generating_game");
    const questionCount = gameMode === "fast" ? 5 : 10;

    try {
      const res = await generateQuestionsFn({
        data: {
          materialText: analysis.sourceText,
          topicName: `${analysis.title} (${selectedSubtopic})`,
          difficulty,
          count: questionCount,
        },
      });

      setQuestions(res.questions);
      setCurrentIndex(0);
      setLives(3);
      setScore(0);
      setStreak(0);
      setMaxStreak(0);
      setSelectedChoice(null);
      setIsTimeOut(false);
      setAnswersHistory([]);
      setEarnedReward(null);
      setTimeLeft(QUESTION_TIME_LIMIT);
      questionStartTimeRef.current = Date.now();
      setPhase("playing");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al generar preguntas del material");
      setPhase("study_overview");
    }
  };

  // -------------------------------------------------------------
  // 3. IN-GAME TIMER HOOK
  // -------------------------------------------------------------
  useEffect(() => {
    if (phase !== "playing" || gameMode === "practice") {
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
  }, [currentIndex, phase, gameMode]);

  // Handle Timeout
  const handleTimeOut = () => {
    if (phase !== "playing") return;
    setIsTimeOut(true);
    setSelectedChoice("Sin respuesta (Tiempo agotado)");
    setPhase("question_feedback");

    if (soundEnabled) sfx.playIncorrect();

    const newLives = Math.max(0, lives - 1);
    setLives(newLives);
    setStreak(0);

    const record: AnswerRecord = {
      question: currentQ,
      userChoice: "Tiempo agotado",
      isCorrect: false,
      timeSpent: QUESTION_TIME_LIMIT,
      scoreEarned: 0,
    };
    setAnswersHistory((prev) => [...prev, record]);
  };

  // Handle User Choice Selection
  const handleSelectChoice = (choice: string) => {
    if (phase !== "playing") return;

    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedChoice(choice);
    setPhase("question_feedback");
    setIsTimeOut(false);

    const timeSpent = Math.max(0.5, (Date.now() - questionStartTimeRef.current) / 1000);
    const isCorrect = choice.trim().toLowerCase() === String(currentQ.correctAnswer).trim().toLowerCase();

    let pointsThisTurn = 0;
    let newStreak = streak;
    let newMaxStreak = maxStreak;

    if (isCorrect) {
      if (soundEnabled) sfx.playCorrect();

      newStreak = streak + 1;
      if (newStreak > newMaxStreak) newMaxStreak = newStreak;
      setStreak(newStreak);
      setMaxStreak(newMaxStreak);

      let multiplier = 1.0;
      if (newStreak >= 10) multiplier = 3.0;
      else if (newStreak >= 5) multiplier = 2.0;
      else if (newStreak >= 3) multiplier = 1.5;

      const remainingSec = Math.max(0, QUESTION_TIME_LIMIT - timeSpent);
      const speedBonus = gameMode === "practice" ? 0 : Math.round(remainingSec * 2.5);
      pointsThisTurn = Math.round((100 + speedBonus) * multiplier);

      setScore((s) => s + pointsThisTurn);
    } else {
      if (soundEnabled) sfx.playIncorrect();
      setLives((l) => Math.max(0, l - 1));
      setStreak(0);
    }

    const record: AnswerRecord = {
      question: currentQ,
      userChoice: choice,
      isCorrect,
      timeSpent,
      scoreEarned: pointsThisTurn,
    };
    setAnswersHistory((prev) => [...prev, record]);
  };

  // Next Question or Results
  const handleNextQuestion = () => {
    const isLast = currentIndex >= questions.length - 1;
    if (isLast) {
      handleFinishGame(answersHistory, score);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedChoice(null);
      setIsTimeOut(false);
      setPhase("playing");
    }
  };

  // Keyboard shortcut support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase === "playing" && currentQ) {
        if (currentQ.type === "true_false") {
          if (e.key.toLowerCase() === "v" || e.key === "1") handleSelectChoice("Verdadero");
          if (e.key.toLowerCase() === "f" || e.key === "2") handleSelectChoice("Falso");
        } else if (currentQ.options && currentQ.options.length > 0) {
          if (e.key === "1" || e.key.toLowerCase() === "a") handleSelectChoice(currentQ.options[0]);
          else if (e.key === "2" || e.key.toLowerCase() === "b") handleSelectChoice(currentQ.options[1]);
          else if (e.key === "3" || e.key.toLowerCase() === "c") handleSelectChoice(currentQ.options[2]);
          else if (e.key === "4" || e.key.toLowerCase() === "d") handleSelectChoice(currentQ.options[3]);
        }
      } else if (phase === "question_feedback") {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleNextQuestion();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, currentQ, currentIndex, questions, answersHistory, score]);

  // Finish Game
  const handleFinishGame = async (history: AnswerRecord[], finalScore: number) => {
    setPhase("results");
    if (soundEnabled) sfx.playVictory();

    const correctCount = history.filter((h) => h.isCorrect).length;
    const total = history.length;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    const xpAwarded = Math.min(300, Math.max(30, Math.round(finalScore / 3)));
    const coinsAwarded = accuracy >= 80 ? 3 : accuracy >= 50 ? 2 : 1;

    try {
      await Promise.allSettled([
        rewardXp({ data: { amount: xpAwarded } }),
        rewardCoins({ data: { coins: coinsAwarded } }),
      ]);
      setEarnedReward({ xp: xpAwarded, coins: coinsAwarded });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    } catch {
      setEarnedReward({ xp: xpAwarded, coins: coinsAwarded });
    }
  };

  // -------------------------------------------------------------
  // 4. "PRACTICAR LO QUE FALLÉ" (DYNAMIC ERROR REVIEW ROUND)
  // -------------------------------------------------------------
  const handlePracticeFailed = async () => {
    if (!analysis) return;

    const failed = answersHistory.filter((a) => !a.isCorrect);
    if (failed.length === 0) return;

    setPhase("generating_review");

    try {
      const failedConcepts = Array.from(new Set(failed.map((f) => f.question.concept)));
      const failedSummary = failed.map((f) => ({
        question: f.question.question,
        concept: f.question.concept,
        userAnswer: f.userChoice,
        correctAnswer: String(f.question.correctAnswer),
      }));

      const res = await generateReviewFn({
        data: {
          materialText: analysis.sourceText,
          failedConcepts,
          failedQuestionsSummary: failedSummary,
          count: Math.min(6, Math.max(3, failed.length)),
        },
      });

      setGameMode("review");
      setQuestions(res.questions);
      setCurrentIndex(0);
      setLives(3);
      setScore(0);
      setStreak(0);
      setMaxStreak(0);
      setSelectedChoice(null);
      setIsTimeOut(false);
      setAnswersHistory([]);
      setEarnedReward(null);
      setTimeLeft(QUESTION_TIME_LIMIT);
      questionStartTimeRef.current = Date.now();
      setPhase("playing");
      toast.success("¡Ronda de repaso generada para afianzar tus dudas! 🎯✨");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al generar preguntas de repaso");
      setPhase("results");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (phase === "playing" || phase === "question_feedback") {
                  if (confirm("¿Deseas volver al menú de temas?")) setPhase("select_source");
                } else if (phase === "study_overview" || phase === "results") {
                  setPhase("select_source");
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
                <Brain className="size-5 text-purple-600 dark:text-purple-400 fill-purple-600/20" />
                <span>Estudia y Juega</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20 hidden sm:inline-block">
                  IA Adaptativa
                </span>
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Aprende el tema → Juega con tus apuntes → Repasa lo que falles
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleSound}
              className="flex size-9 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition active:scale-95 cursor-pointer border-none"
              title={soundEnabled ? "Silenciar efectos" : "Activar sonido"}
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

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">

        {/* ========================================================================= */}
        {/* FASE 1: ¿QUÉ QUIERES ESTUDIAR HOY? (SELECCIÓN / SUBIDA) */}
        {/* ========================================================================= */}
        {phase === "select_source" && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            {/* Header Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center relative overflow-hidden">
              <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 mb-3">
                <GraduationCap className="size-8" />
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                ¿Qué quieres estudiar hoy?
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                Selecciona un tema listo o sube tus propios apuntes. La IA te explicará lo más importante y creará un juego para practicar.
              </p>

              {/* Source Tabs */}
              <div className="mt-6 inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex-wrap justify-center gap-1">
                <button
                  onClick={() => setSourceTab("preset")}
                  className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    sourceTab === "preset"
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <BookOpen className="size-4" />
                  <span>📖 Usar un tema</span>
                </button>
                <button
                  onClick={() => setSourceTab("upload")}
                  className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    sourceTab === "upload"
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Upload className="size-4" />
                  <span>📎 Subir mi material</span>
                </button>
              </div>
            </div>

            {/* TAB A: PRESET TOPICS */}
            {sourceTab === "preset" && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-blue-500" /> Temas preparados para estudiar
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PRESET_STUDY_TOPICS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between gap-3 cursor-pointer active:scale-[0.99]"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl p-2 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:scale-110 transition-transform">
                            {preset.icon}
                          </span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60">
                            {preset.badge}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {preset.title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                          {preset.summary}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
                        <span>Estudiar tema</span>
                        <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB B: UPLOAD CUSTOM MATERIAL */}
            {sourceTab === "upload" && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>📎</span> Crea un juego con tus apuntes
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Sube tus apuntes, guía de estudio o material de clase y la IA creará una explicación y un juego para practicar.
                  </p>
                </div>

                {/* Upload Form Type Selector */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "text", label: "✍️ Texto libre", desc: "Copiar / Escribir" },
                    { id: "file", label: "📄 PDF / Doc", desc: "Documentos" },
                    { id: "camera", label: "📸 Foto / Cámara", desc: "Foto a libreta" },
                    { id: "link", label: "🔗 Enlace Web", desc: "Página o artículo" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setUploadType(tab.id as any)}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                        uploadType === tab.id
                          ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-200 shadow-sm"
                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                      }`}
                    >
                      <span className="font-bold text-xs block">{tab.label}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{tab.desc}</span>
                    </button>
                  ))}
                </div>

                {/* Input forms based on uploadType */}
                {uploadType === "text" && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Pega aquí tus apuntes, resumen o texto de estudio:
                    </label>
                    <textarea
                      rows={6}
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      placeholder="Ejemplo: La célula es la unidad básica de los seres vivos. Existen células animales y vegetales. La mitocondria genera energía (ATP)..."
                      className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                    />
                  </div>
                )}

                {uploadType === "file" && (
                  <div className="space-y-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".pdf,.png,.jpg,.jpeg,.txt"
                      className="hidden"
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 p-6 rounded-2xl text-center cursor-pointer bg-slate-50/50 dark:bg-slate-800/40 transition group"
                    >
                      <Upload className="size-8 mx-auto text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {uploadedFileName ? `Archivo: ${uploadedFileName}` : "Haz clic para subir un PDF o archivo"}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">Soporta PDF, imágenes de apuntes o documentos de texto</p>
                    </div>

                    {customText && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs text-emerald-700 dark:text-emerald-300">
                        ✅ Texto extraído listo ({customText.length} caracteres).
                      </div>
                    )}
                  </div>
                )}

                {uploadType === "camera" && (
                  <div className="space-y-3">
                    <input
                      type="file"
                      ref={cameraInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                    />
                    <div
                      onClick={() => cameraInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 p-6 rounded-2xl text-center cursor-pointer bg-slate-50/50 dark:bg-slate-800/40 transition group"
                    >
                      <Camera className="size-8 mx-auto text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        Tomar foto a mi libreta o subir imagen
                      </p>
                      <p className="text-xs text-slate-400 mt-1">La IA transcribirá automáticamente tus notas escritas a mano</p>
                    </div>

                    {customText && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs text-emerald-700 dark:text-emerald-300">
                        ✅ Apuntes escaneados correctamente con OCR.
                      </div>
                    )}
                  </div>
                )}

                {uploadType === "link" && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Enlace de la página o artículo educativo:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={customLink}
                        onChange={(e) => setCustomLink(e.target.value)}
                        placeholder="https://es.wikipedia.org/wiki/Célula"
                        className="flex-1 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* Analyze and start button */}
                <button
                  disabled={isProcessingMedia || (uploadType === "link" ? !customLink.trim() : !customText.trim())}
                  onClick={handleAnalyzeCustomMaterial}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-display font-bold text-sm sm:text-base tracking-wide transition shadow-lg shadow-blue-500/25 active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-none"
                >
                  {isProcessingMedia ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      <span>Extrayendo texto de tus apuntes...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-5" />
                      <span>Analizar apuntes y crear mi juego ✨</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* FASE 2: ANALIZANDO MATERIAL POR IA */}
        {/* ========================================================================= */}
        {phase === "analyzing" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center space-y-4 max-w-lg mx-auto animate-in fade-in duration-300">
            <div className="inline-flex size-20 items-center justify-center rounded-3xl bg-blue-500/10 text-blue-600 dark:text-blue-400 animate-pulse">
              <Brain className="size-10 animate-bounce" />
            </div>
            <h3 className="font-display text-2xl font-black text-slate-900 dark:text-white">
              🧠 Analizando tu material...
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              La IA está identificando los conceptos clave, resumiendo los puntos más importantes y preparando tu explicación didáctica.
            </p>
            <div className="flex justify-center pt-2">
              <Loader2 className="size-6 text-blue-500 animate-spin" />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* FASE 3: EXPLICACIÓN DIDÁCTICA + LO MÁS IMPORTANTE (ESTUDIO PREVIO) */}
        {/* ========================================================================= */}
        {phase === "study_overview" && analysis && (
          <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
            {/* Main Explanation Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold mb-2">
                  <BookOpen className="size-3.5" />
                  <span>Paso 1: Estudia el tema</span>
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  {analysis.title}
                </h2>
              </div>

              {/* Simple Short Explanation */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                  📖 Explicación clara y sencilla
                </h4>
                <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                  {analysis.summaryExplanation}
                </p>
              </div>

              {/* ⭐ Lo más importante */}
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2.5">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <Star className="size-4 fill-amber-500 text-amber-500" />
                  <span>⭐ Lo más importante</span>
                </h4>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium">
                  {analysis.keyPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold shrink-0 mt-0.5">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Detected Subtopics */}
              {analysis.detectedTopics.length > 1 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                    Temas detectados en tus apuntes:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedSubtopic("Todos los temas")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        selectedSubtopic === "Todos los temas"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                      }`}
                    >
                      Todos los temas
                    </button>
                    {analysis.detectedTopics.map((topic, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedSubtopic(topic)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          selectedSubtopic === topic
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                        }`}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Game Mode & Difficulty Settings */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Difficulty */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Nivel de dificultad:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: "easy", label: "🟢 Fácil", desc: "Directo" },
                      { id: "medium", label: "🟡 Medio", desc: "Comprensión" },
                      { id: "hard", label: "🔴 Difícil", desc: "Aplicación" },
                    ].map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setDifficulty(d.id as Difficulty)}
                        className={`p-2 rounded-xl text-xs font-bold transition text-center cursor-pointer ${
                          difficulty === d.id
                            ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Game Mode */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Modo de juego:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: "fast", label: "⚡ Reto rápido", desc: "5 preguntas" },
                      { id: "practice", label: "🧠 Practicar", desc: "Sin tiempo" },
                      { id: "challenge", label: "🔥 Desafío", desc: "10 preguntas" },
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setGameMode(m.id as GameMode)}
                        className={`p-2 rounded-xl text-xs font-bold transition text-center cursor-pointer ${
                          gameMode === m.id
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleStartGame}
                  className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-display font-bold text-base tracking-wide transition shadow-lg shadow-blue-500/25 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 border-none"
                >
                  <Play className="size-5 fill-white" />
                  <span>🎮 Ya entendí, comenzar juego</span>
                </button>
                <button
                  onClick={() => setPhase("select_source")}
                  className="py-4 px-6 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm transition active:scale-[0.99] cursor-pointer"
                >
                  Cambiar tema
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* FASE 4: GENERANDO PREGUNTAS CON IA */}
        {/* ========================================================================= */}
        {(phase === "generating_game" || phase === "generating_review") && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center space-y-4 max-w-lg mx-auto animate-in fade-in duration-300">
            <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 animate-pulse">
              <Sparkles className="size-8 animate-spin-slow" />
            </div>
            <h3 className="font-display text-2xl font-black text-slate-900 dark:text-white">
              {phase === "generating_review" ? "🎯 Creando ejercicios de refuerzo..." : "🎮 Generando preguntas de tu material..."}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {phase === "generating_review"
                ? "La IA está diseñando preguntas específicas sobre los conceptos que necesitas repasar."
                : "Creando preguntas pedagógicas y didácticas ancladas 100% en tu apunte."}
            </p>
            <div className="flex justify-center pt-2">
              <Loader2 className="size-6 text-purple-600 animate-spin" />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* FASE 5 & 6: PREGUNTA EN JUEGO & RETROALIMENTACIÓN */}
        {/* ========================================================================= */}
        {(phase === "playing" || phase === "question_feedback") && currentQ && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Top Game Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    Pregunta {currentIndex + 1} de {questions.length}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold truncate max-w-[150px] sm:max-w-[250px]">
                    {currentQ.concept || analysis?.title}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {streak >= 2 && (
                    <div className="flex items-center gap-1 text-xs font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full animate-bounce">
                      <Flame className="size-3.5 fill-amber-500" />
                      <span>x{streak}</span>
                    </div>
                  )}

                  {/* Hearts */}
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3].map((h) => (
                      <Heart
                        key={h}
                        className={`size-4 transition-all duration-300 ${
                          h <= lives
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

              {/* Timer Bar */}
              {gameMode !== "practice" && (
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
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm relative space-y-6">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {currentQ.type === "true_false" ? "⚖️ Verdadero o Falso" : currentQ.type === "fill_blank" ? "✏️ Completa la frase" : "🅰️ Opción Múltiple"}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  100 pts {gameMode !== "practice" && "+ bonus"}
                </span>
              </div>

              <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
                {currentQ.question}
              </h2>

              {/* RENDER OPTIONS BASED ON QUESTION TYPE */}
              {/* Type 1: Verdadero o Falso */}
              {currentQ.type === "true_false" ? (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {["Verdadero", "Falso"].map((choice) => {
                    const isChosen = selectedChoice === choice;
                    const isCorrect = choice.toLowerCase() === String(currentQ.correctAnswer).toLowerCase();
                    const isAnswered = phase === "question_feedback";

                    let btnCls = "bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 hover:bg-blue-50 text-slate-800 dark:text-slate-200";
                    if (isAnswered) {
                      if (isCorrect) btnCls = "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold shadow-md shadow-emerald-500/10";
                      else if (isChosen && !isCorrect) btnCls = "bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-200 font-bold";
                      else btnCls = "opacity-50";
                    }

                    return (
                      <button
                        key={choice}
                        disabled={isAnswered}
                        onClick={() => handleSelectChoice(choice)}
                        className={`p-5 rounded-2xl border-2 font-display text-lg font-bold text-center transition-all cursor-pointer active:scale-95 ${btnCls}`}
                      >
                        {choice === "Verdadero" ? "✅ Verdadero" : "❌ Falso"}
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Type 2: Multiple Choice / Fill Blank Options */
                <div className="grid grid-cols-1 gap-3 pt-1">
                  {currentQ.options?.map((option, idx) => {
                    const letter = ["A", "B", "C", "D"][idx] || String(idx + 1);
                    const isChosen = selectedChoice === option;
                    const isCorrect = option.trim().toLowerCase() === String(currentQ.correctAnswer).trim().toLowerCase();
                    const isAnswered = phase === "question_feedback";

                    let btnCls = "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-950/30 text-slate-800 dark:text-slate-200";
                    let letterCls = "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300";

                    if (isAnswered) {
                      if (isCorrect) {
                        btnCls = "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold shadow-md shadow-emerald-500/10 scale-[1.01]";
                        letterCls = "bg-emerald-500 text-white font-bold";
                      } else if (isChosen && !isCorrect) {
                        btnCls = "bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-200 font-bold";
                        letterCls = "bg-rose-500 text-white font-bold";
                      } else {
                        btnCls = "opacity-50 border-slate-200 dark:border-slate-800";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        disabled={isAnswered}
                        onClick={() => handleSelectChoice(option)}
                        className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between text-left cursor-pointer active:scale-[0.99] ${btnCls}`}
                      >
                        <div className="flex items-center gap-3.5">
                          <span className={`flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-black ${letterCls}`}>
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
              )}

              {/* Feedback and Educational Explanation ("💡 ¿Por qué?") */}
              {phase === "question_feedback" && (
                <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div
                    className={`p-3.5 rounded-2xl flex items-center gap-2.5 font-bold text-sm ${
                      selectedChoice?.toLowerCase() === String(currentQ.correctAnswer).toLowerCase()
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                        : isTimeOut
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                        : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                    }`}
                  >
                    {selectedChoice?.toLowerCase() === String(currentQ.correctAnswer).toLowerCase() ? (
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

                  {/* 💡 ¿Por qué? Card */}
                  <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                    <p className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5 mb-1">
                      <Lightbulb className="size-4" />
                      💡 ¿Por qué?
                    </p>
                    <p>{currentQ.explanation}</p>
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={handleNextQuestion}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-display font-bold text-sm sm:text-base tracking-wide transition shadow-lg shadow-blue-500/25 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 border-none"
                  >
                    <span>
                      {currentIndex >= questions.length - 1 ? "Ver resultados finales 🎉" : "Siguiente pregunta →"}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* FASE 7: PANTALLA FINAL DE RESULTADOS & DIAGNÓSTICO */}
        {/* ========================================================================= */}
        {phase === "results" && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 py-2">
            {/* Main Result Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center relative overflow-hidden">
              <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-white shadow-xl shadow-yellow-500/20 mb-3">
                <Trophy className="size-8" />
              </div>

              <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                🎉 ¡Terminaste!
              </h2>

              {/* Ratio & Accuracy */}
              <div className="my-4 flex items-center justify-center gap-6">
                <div>
                  <span className="font-display text-4xl sm:text-5xl font-black text-blue-600 dark:text-blue-400">
                    {answersHistory.filter((a) => a.isCorrect).length}/{answersHistory.length}
                  </span>
                  <span className="block text-xs uppercase tracking-widest font-bold text-slate-400 mt-0.5">
                    Correctas
                  </span>
                </div>

                <div className="h-10 w-px bg-slate-200 dark:bg-slate-700" />

                <div>
                  <span className="font-display text-4xl sm:text-5xl font-black text-amber-500">
                    {answersHistory.length > 0
                      ? Math.round((answersHistory.filter((a) => a.isCorrect).length / answersHistory.length) * 100)
                      : 0}
                    %
                  </span>
                  <span className="block text-xs uppercase tracking-widest font-bold text-slate-400 mt-0.5">
                    Precisión
                  </span>
                </div>
              </div>

              {/* Rewards */}
              {earnedReward && (
                <div className="inline-flex items-center gap-4 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-700 dark:text-amber-300 mt-1">
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

            {/* DIAGNOSTIC: LO QUE DOMINAS VS LO QUE DEBES REPASAR */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* ✅ Lo que dominas */}
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-emerald-500/25 shadow-sm space-y-3">
                <h4 className="font-display text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  <span>Lo que dominas</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  {Array.from(new Set(answersHistory.filter((a) => a.isCorrect).map((a) => a.question.concept))).length > 0 ? (
                    Array.from(new Set(answersHistory.filter((a) => a.isCorrect).map((a) => a.question.concept))).map((c, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-emerald-500 font-bold">✅</span>
                        <span>{c}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-400 italic">Sigue practicando para afianzar conceptos.</li>
                  )}
                </ul>
              </div>

              {/* 📚 Lo que debes repasar */}
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-rose-500/25 shadow-sm space-y-3">
                <h4 className="font-display text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                  <BookOpen className="size-4 text-rose-500" />
                  <span>Lo que debes repasar</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  {Array.from(new Set(answersHistory.filter((a) => !a.isCorrect).map((a) => a.question.concept))).length > 0 ? (
                    Array.from(new Set(answersHistory.filter((a) => !a.isCorrect).map((a) => a.question.concept))).map((c, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-rose-500 font-bold">📚</span>
                        <span>{c}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-emerald-600 dark:text-emerald-400 font-medium">
                      🌟 ¡Excelente! Dominas todos los conceptos de esta sesión.
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* ACTION: "PRACTICAR LO QUE FALLÉ" (AI ADAPTIVE REVIEW BUTTON) */}
            {answersHistory.filter((a) => !a.isCorrect).length > 0 && (
              <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white shadow-lg shadow-purple-600/20 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-bold flex items-center gap-2">
                      <Sparkles className="size-5" />
                      <span>¿Quieres dominar este tema al 100%?</span>
                    </h3>
                    <p className="text-xs text-purple-100 mt-1 leading-relaxed">
                      La IA generará una ronda de ejercicios enfocada únicamente en los {answersHistory.filter((a) => !a.isCorrect).length} conceptos que fallaste.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handlePracticeFailed}
                  className="w-full py-3.5 px-4 rounded-2xl bg-white text-purple-900 font-display font-black text-sm tracking-wide transition hover:bg-purple-50 shadow-md active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 border-none"
                >
                  <span>🎯 Practicar lo que fallé</span>
                  <ArrowRight className="size-4" />
                </button>
              </div>
            )}

            {/* DETAILED QUESTION REVIEW */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <h4 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>📖</span> Detalle de tus respuestas y aprendizaje
              </h4>

              <div className="space-y-3">
                {answersHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-2"
                  >
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-start gap-2">
                      <span>{item.isCorrect ? "✅" : "❌"}</span>
                      <span>{item.question.question}</span>
                    </p>

                    {!item.isCorrect && (
                      <div className="text-xs grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                        <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300">
                          <span className="font-bold block text-[10px] uppercase text-rose-500">Tu respuesta:</span>
                          {item.userChoice}
                        </div>
                        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                          <span className="font-bold block text-[10px] uppercase text-emerald-500">Respuesta correcta:</span>
                          {String(item.question.correctAnswer)}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-slate-600 dark:text-slate-300 bg-blue-50/50 dark:bg-blue-950/20 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/40 leading-relaxed">
                      <span className="font-bold text-blue-600 dark:text-blue-400">💡 Aprende: </span>
                      {item.question.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleStartGame}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer flex items-center justify-center gap-2 border-none"
              >
                <RotateCcw className="size-4" />
                <span>Jugar este tema de nuevo</span>
              </button>

              <button
                onClick={() => setPhase("select_source")}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-sm transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <BookOpen className="size-4 text-blue-500" />
                <span>Elegir otro tema</span>
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
