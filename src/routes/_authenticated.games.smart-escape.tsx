import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { rewardGameCoins, rewardGameXp } from "@/lib/games.functions";
import { extractTextFromMedia } from "@/lib/quiz.functions";
import { analyzeStudyMaterial, generateStudyGameQuestions, type StudyQuestion } from "@/lib/study-game.functions";
import { SCHOOL_SUBJECTS, type SchoolSubject } from "@/lib/school-subjects-data";
import { PAA_OFFICIAL_QUESTIONS } from "@/lib/paa-official-bank";
import { EXANI_OFFICIAL_QUESTIONS } from "@/lib/exani-official-bank";
import {
  ArrowLeft, Flame, Trophy, Sparkles, RotateCcw, Volume2, VolumeX,
  Play, Pause, Zap, Shield, Clock, Magnet, Snowflake, CheckCircle2,
  XCircle, Award, GraduationCap, ChevronRight, Upload, Shirt,
  Lock, Check, Star, RefreshCw, BookOpen, AlertTriangle, ArrowUp, ArrowDown
} from "lucide-react";
import { toast } from "sonner";
import streakCap from "@/assets/streak-cap.png";

export const Route = createFileRoute("/_authenticated/games/smart-escape")({
  head: () => ({ meta: [{ title: "Smart Escape — Juego Premium Educativo" }] }),
  component: SmartEscapeGame,
});

// ========================================================
// TIPOS Y DEFINICIONES
// ========================================================
export type WorldId = "math" | "chem" | "history" | "bio" | "english" | "paa" | "exani" | "custom";

export interface GameQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic: string;
}

export interface CustomizationItem {
  id: string;
  name: string;
  category: "hair" | "outfit" | "shoes" | "backpack" | "accessory";
  icon: string;
  color: string;
  cost: number;
}

export const CLOSET_ITEMS: CustomizationItem[] = [
  // Cabello
  { id: "hair-cyber-cyan", name: "Corte Cyber Cyan", category: "hair", icon: "💇", color: "#06b6d4", cost: 0 },
  { id: "hair-neon-pink", name: "Pelo Neón Pink", category: "hair", icon: "✨", color: "#ec4899", cost: 15 },
  { id: "hair-gold-flame", name: "Llama Dorada", category: "hair", icon: "🔥", color: "#eab308", cost: 30 },
  { id: "hair-shadow", name: "Sombra Ninja", category: "hair", icon: "🥷", color: "#334155", cost: 50 },

  // Ropa
  { id: "outfit-runner", name: "Traje Cyber Runner", category: "outfit", icon: "🏃", color: "#3b82f6", cost: 0 },
  { id: "outfit-school-pro", name: "Uniforme Escolar Pro", category: "outfit", icon: "👔", color: "#10b981", cost: 20 },
  { id: "outfit-lab", name: "Bata de Laboratorio Tech", category: "outfit", icon: "🥼", color: "#8b5cf6", cost: 40 },
  { id: "outfit-quantum", name: "Armadura Quantum", category: "outfit", icon: "⚡", color: "#f59e0b", cost: 80 },

  // Zapatos
  { id: "shoes-sport", name: "Tenis Nitro", category: "shoes", icon: "👟", color: "#38bdf8", cost: 0 },
  { id: "shoes-boots", name: "Botas Antigravedad", category: "shoes", icon: "🥾", color: "#a855f7", cost: 25 },
  { id: "shoes-plasma", name: "Zapatillas Plasma", category: "shoes", icon: "⚡", color: "#f43f5e", cost: 60 },

  // Mochila
  { id: "backpack-tech", name: "Mochila Tech", category: "backpack", icon: "🎒", color: "#64748b", cost: 0 },
  { id: "backpack-jetpack", name: "Jetpack Turbo", category: "backpack", icon: "🚀", color: "#ef4444", cost: 45 },
  { id: "backpack-hologram", name: "Matriz Holográfica", category: "backpack", icon: "🌌", color: "#8b5cf6", cost: 75 },

  // Accesorios
  { id: "acc-none", name: "Sin accesorio", category: "accessory", icon: "🚫", color: "#94a3b8", cost: 0 },
  { id: "acc-visor", name: "Visor Holográfico", category: "accessory", icon: "🥽", color: "#06b6d4", cost: 30 },
  { id: "acc-headphones", name: "Audífonos Gamer RGB", category: "accessory", icon: "🎧", color: "#ec4899", cost: 50 },
  { id: "acc-crown", name: "Corona de Campeón", category: "accessory", icon: "👑", color: "#eab308", cost: 100 },
];

interface WorldTheme {
  id: WorldId;
  name: string;
  icon: string;
  badge: string;
  desc: string;
  trackColor: string;
  gridColor: string;
  skyGradient: string;
  monsterName: string;
  monsterEmoji: string;
  monsterColor: string;
}

const WORLDS: Record<WorldId, WorldTheme> = {
  math: {
    id: "math",
    name: "Cyber Matrix",
    icon: "🔢",
    badge: "Matemáticas",
    desc: "Carretera digital futurista con hologramas numéricos.",
    trackColor: "#0f172a",
    gridColor: "#38bdf8",
    skyGradient: "from-slate-950 via-cyan-950/40 to-slate-900",
    monsterName: "Gorgon Glitch",
    monsterEmoji: "👾",
    monsterColor: "#06b6d4",
  },
  chem: {
    id: "chem",
    name: "Laboratorio Neón",
    icon: "🧪",
    badge: "Química",
    desc: "Plataformas químicas flotantes entre matraces gigantes.",
    trackColor: "#091e13",
    gridColor: "#10b981",
    skyGradient: "from-emerald-950 via-teal-950/40 to-slate-900",
    monsterName: "Nebulón Químico",
    monsterEmoji: "🧪",
    monsterColor: "#10b981",
  },
  history: {
    id: "history",
    name: "Ruinas Ancestrales",
    icon: "🏛️",
    badge: "Historia",
    desc: "Caminos de piedra entre columnas romanas y pirámides.",
    trackColor: "#1c1307",
    gridColor: "#f59e0b",
    skyGradient: "from-amber-950 via-orange-950/40 to-slate-900",
    monsterName: "Coloso del Tiempo",
    monsterEmoji: "🗿",
    monsterColor: "#f59e0b",
  },
  bio: {
    id: "bio",
    name: "Microcosmos Celular",
    icon: "🧬",
    badge: "Biología",
    desc: "Circula dentro de una arteria celular llena de mitocondrias.",
    trackColor: "#1e0b1e",
    gridColor: "#ec4899",
    skyGradient: "from-pink-950 via-purple-950/40 to-slate-900",
    monsterName: "Virus Voraz",
    monsterEmoji: "🦠",
    monsterColor: "#ec4899",
  },
  english: {
    id: "english",
    name: "Metrópolis Neón",
    icon: "🇬🇧",
    badge: "Inglés",
    desc: "Autopista nocturna en rascacielos iluminados.",
    trackColor: "#110b28",
    gridColor: "#a855f7",
    skyGradient: "from-indigo-950 via-purple-950/40 to-slate-900",
    monsterName: "Grammar Phantom",
    monsterEmoji: "👻",
    monsterColor: "#a855f7",
  },
  paa: {
    id: "paa",
    name: "Simulador PAA College Board",
    icon: "🏆",
    badge: "Admisión Universitaria",
    desc: "Desafío oficial de razonamiento y lectura crítica.",
    trackColor: "#0c1524",
    gridColor: "#3b82f6",
    skyGradient: "from-blue-950 via-slate-900 to-slate-950",
    monsterName: "Cronos PAA",
    monsterEmoji: "⚡",
    monsterColor: "#3b82f6",
  },
  exani: {
    id: "exani",
    name: "Simulador EXANI-II Ceneval",
    icon: "🎓",
    badge: "Admisión Ceneval 2025",
    desc: "Reactivos de comprensión, redacción y módulos disciplinares.",
    trackColor: "#170c24",
    gridColor: "#c084fc",
    skyGradient: "from-purple-950 via-slate-900 to-slate-950",
    monsterName: "Cénit Ceneval",
    monsterEmoji: "🔮",
    monsterColor: "#c084fc",
  },
  custom: {
    id: "custom",
    name: "Mis Apuntes (con IA)",
    icon: "✨",
    badge: "Material Personal",
    desc: "Preguntas generadas 100% sobre tu propio documento.",
    trackColor: "#130924",
    gridColor: "#818cf8",
    skyGradient: "from-violet-950 via-slate-900 to-slate-950",
    monsterName: "Sombra del Examen",
    monsterEmoji: "😈",
    monsterColor: "#818cf8",
  },
};

const LEVELS_CONFIG = [
  { level: 1, name: "Principiante", reqQuestions: 5, timePerQ: 10, creatureSpeed: 0.9, bonusCoins: 5, bonusXp: 50 },
  { level: 2, name: "Explorador", reqQuestions: 8, timePerQ: 8, creatureSpeed: 1.15, bonusCoins: 10, bonusXp: 100 },
  { level: 3, name: "Experto", reqQuestions: 10, timePerQ: 7, creatureSpeed: 1.35, bonusCoins: 15, bonusXp: 175 },
  { level: 4, name: "Maestro", reqQuestions: 12, timePerQ: 5, creatureSpeed: 1.6, bonusCoins: 25, bonusXp: 250 },
];

function SmartEscapeGame() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const rewardXpFn = useServerFn(rewardGameXp);
  const rewardCoinsFn = useServerFn(rewardGameCoins);
  const extractMediaFn = useServerFn(extractTextFromMedia);
  const analyzeMaterialFn = useServerFn(analyzeStudyMaterial);
  const generateQuestionsFn = useServerFn(generateStudyGameQuestions);

  // Pantalla activa
  const [screen, setScreen] = useState<
    "home" | "world_select" | "level_map" | "upload" | "playing" | "gameover" | "victory" | "closet"
  >("home");

  // Configuración de partida
  const [selectedWorld, setSelectedWorld] = useState<WorldId>("math");
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Custom material
  const [customText, setCustomText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Customization & Closet state
  const [coinsBalance, setCoinsBalance] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("smart_escape_coins");
      return saved ? parseInt(saved, 10) : 35;
    }
    return 35;
  });

  const [unlockedClosetIds, setUnlockedClosetIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("smart_escape_unlocked_items");
      return saved ? JSON.parse(saved) : ["hair-cyber-cyan", "outfit-runner", "shoes-sport", "backpack-tech", "acc-none"];
    }
    return ["hair-cyber-cyan", "outfit-runner", "shoes-sport", "backpack-tech", "acc-none"];
  });

  const [equippedItems, setEquippedItems] = useState({
    hair: "hair-cyber-cyan",
    outfit: "outfit-runner",
    shoes: "shoes-sport",
    backpack: "backpack-tech",
    accessory: "acc-none",
  });

  // Estadísticas y progreso de nivel
  const [levelStars, setLevelStars] = useState<Record<string, number>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("smart_escape_level_stars");
      return saved ? JSON.parse(saved) : { "math-1": 3, "math-2": 2 };
    }
    return {};
  });

  // Runner state in-game
  const [questionsPool, setQuestionsPool] = useState<GameQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<GameQuestion | null>(null);
  const [qTimer, setQTimer] = useState(10);
  const [qTimerMax, setQTimerMax] = useState(10);
  const [isQuestionActive, setIsQuestionActive] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerFeedback, setAnswerFeedback] = useState<"correct" | "wrong" | null>(null);

  // Runner In-Game Metrics
  const [playerLane, setPlayerLane] = useState<number>(1); // 0 = Left, 1 = Center, 2 = Right
  const [isJumping, setIsJumping] = useState(false);
  const [playerDistanceMeters, setPlayerDistanceMeters] = useState(0);
  const [creatureDistanceMeters, setCreatureDistanceMeters] = useState(45); // 0 to 80m. (0 = caught)
  const [playerSpeed, setPlayerSpeed] = useState(1.0);
  const [gameScore, setGameScore] = useState(0);
  const [collectedCoins, setCollectedCoins] = useState(0);
  const [collectedStars, setCollectedStars] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [wrongAnswersCount, setWrongAnswersCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [timeSurvived, setTimeSurvived] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Power-ups activos
  const [activeTurboTime, setActiveTurboTime] = useState(0);
  const [hasShield, setHasShield] = useState(false);
  const [activeMagnetTime, setActiveMagnetTime] = useState(0);
  const [activeFreezeTime, setActiveFreezeTime] = useState(0);

  // Canvas Reference & Game Loop
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const questionTimerIntervalRef = useRef<any>(null);

  // Audio synthesizer
  const playSfx = (type: "jump" | "coin" | "star" | "correct" | "wrong" | "turbo" | "freeze" | "gameover" | "victory") => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "jump") {
        osc.frequency.setValueAtTime(250, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === "coin") {
        osc.frequency.setValueAtTime(987.77, ctx.currentTime); // B5
        osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.08); // E6
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.16);
        osc.start();
        osc.stop(ctx.currentTime + 0.16);
      } else if (type === "correct") {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
        osc.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.24); // C6
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === "wrong") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === "turbo") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === "freeze") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(300, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === "victory") {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
        osc.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      } else if (type === "gameover") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(70, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch {
      // Audio not supported
    }
  };

  // Keyboard runner controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (screen !== "playing" || isPaused) return;

      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        setPlayerLane((prev) => Math.max(0, prev - 1));
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        setPlayerLane((prev) => Math.min(2, prev + 1));
      } else if (e.key === "ArrowUp" || e.key === "w" || e.key === "W" || e.key === " ") {
        e.preventDefault();
        triggerJump();
      } else if (e.key === "1" || e.key === "2" || e.key === "3" || e.key === "4") {
        // Quick keyboard answers
        const optIdx = parseInt(e.key, 10) - 1;
        if (isQuestionActive && currentQuestion && optIdx < currentQuestion.options.length) {
          handleAnswerOption(optIdx);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [screen, isPaused, isQuestionActive, currentQuestion]);

  const triggerJump = () => {
    if (isJumping) return;
    setIsJumping(true);
    playSfx("jump");
    setTimeout(() => {
      setIsJumping(false);
    }, 550);
  };

  // ========================================================
  // PREPARAR PREGUNTAS SEGÚN MATERIA / MATERIAL
  // ========================================================
  const buildQuestionsForWorld = (worldId: WorldId, count: number): GameQuestion[] => {
    let pool: GameQuestion[] = [];

    if (worldId === "paa") {
      pool = PAA_OFFICIAL_QUESTIONS.map((q, idx) => ({
        id: `paa-${idx}`,
        question: q.q,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        topic: q.subtopic,
      }));
    } else if (worldId === "exani") {
      pool = EXANI_OFFICIAL_QUESTIONS.map((q, idx) => ({
        id: `exani-${idx}`,
        question: q.q,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        topic: q.subtopic,
      }));
    } else if (worldId === "math" || worldId === "chem" || worldId === "history" || worldId === "bio" || worldId === "english") {
      const subjectMapping: Record<string, string> = {
        math: "matematicas",
        chem: "quimica",
        history: "historia",
        bio: "biologia",
        english: "ingles",
      };
      const sub = SCHOOL_SUBJECTS.find((s) => s.id === subjectMapping[worldId]);
      if (sub) {
        sub.topics.forEach((tp) => {
          tp.presetQuestions.forEach((pq, idx) => {
            pool.push({
              id: `${tp.id}-${idx}`,
              question: pq.question,
              options: pq.options,
              correctIndex: pq.correctIndex,
              explanation: pq.explanation,
              topic: tp.name,
            });
          });
        });
      }
    }

    if (pool.length === 0) {
      // Fallback
      pool = [
        {
          id: "fb-1",
          question: "¿Cuál es el resultado de 8 × 7?",
          options: ["54", "56", "58", "62"],
          correctIndex: 1,
          explanation: "8 × 7 = 56",
          topic: "Multiplicación",
        },
      ];
    }

    // Shuffle and pick required count
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  // Iniciar partida
  const startGame = async (worldId: WorldId, levelNum: number) => {
    setSelectedWorld(worldId);
    setSelectedLevel(levelNum);

    const lvlConfig = LEVELS_CONFIG[levelNum - 1] || LEVELS_CONFIG[0];
    let questions: GameQuestion[] = [];

    if (worldId === "custom") {
      if (!customText.trim()) {
        setScreen("upload");
        return;
      }
      setIsGeneratingAi(true);
      const toastId = toast.loading("La IA está creando las preguntas de Smart Escape con tu material...");
      try {
        const analysis = await analyzeMaterialFn({ data: { text: customText } });
        const aiQuestions = await generateQuestionsFn({
          data: {
            materialText: customText,
            selectedTopics: analysis.detectedTopics.length > 0 ? analysis.detectedTopics : ["Conceptos del documento"],
            questionCount: lvlConfig.reqQuestions,
            gameType: "trivia",
          },
        });
        questions = aiQuestions.map((q, idx) => ({
          id: `ai-${idx}`,
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          topic: analysis.title || "Apuntes",
        }));
        toast.success("¡Preguntas listas!", { id: toastId });
      } catch (err) {
        toast.error("Error al generar preguntas con IA.", { id: toastId });
        setIsGeneratingAi(false);
        return;
      } finally {
        setIsGeneratingAi(false);
      }
    } else {
      questions = buildQuestionsForWorld(worldId, lvlConfig.reqQuestions);
    }

    setQuestionsPool(questions);
    setCurrentQIndex(0);
    setPlayerLane(1);
    setIsJumping(false);
    setPlayerDistanceMeters(0);
    setCreatureDistanceMeters(45);
    setPlayerSpeed(1.0);
    setGameScore(0);
    setCollectedCoins(0);
    setCollectedStars(0);
    setCorrectAnswersCount(0);
    setWrongAnswersCount(0);
    setStreak(0);
    setMaxStreak(0);
    setTimeSurvived(0);
    setIsPaused(false);
    setActiveTurboTime(0);
    setHasShield(false);
    setActiveMagnetTime(0);
    setActiveFreezeTime(0);
    setSelectedOption(null);
    setAnswerFeedback(null);

    // Activar primera pregunta después de 2.5s
    setScreen("playing");
    setTimeout(() => {
      launchQuestion(questions[0], lvlConfig.timePerQ);
    }, 2200);
  };

  const launchQuestion = (q: GameQuestion, durationSec: number) => {
    if (!q) return;
    setCurrentQuestion(q);
    setQTimer(durationSec);
    setQTimerMax(durationSec);
    setSelectedOption(null);
    setAnswerFeedback(null);
    setIsQuestionActive(true);
  };

  // Temporizador de pregunta
  useEffect(() => {
    if (screen !== "playing" || isPaused || !isQuestionActive) return;

    questionTimerIntervalRef.current = setInterval(() => {
      setQTimer((prev) => {
        if (prev <= 1) {
          clearInterval(questionTimerIntervalRef.current);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(questionTimerIntervalRef.current);
  }, [screen, isPaused, isQuestionActive, currentQuestion]);

  const handleTimeOut = () => {
    if (!isQuestionActive) return;
    handleAnswerOption(-1); // Timeout = wrong
  };

  const handleAnswerOption = (optionIndex: number) => {
    if (!isQuestionActive || !currentQuestion) return;
    setIsQuestionActive(false);
    setSelectedOption(optionIndex);

    const isCorrect = optionIndex === currentQuestion.correctIndex;
    const lvlConfig = LEVELS_CONFIG[selectedLevel - 1] || LEVELS_CONFIG[0];

    if (isCorrect) {
      playSfx("correct");
      setAnswerFeedback("correct");
      setCorrectAnswersCount((c) => c + 1);
      setStreak((s) => {
        const next = s + 1;
        if (next > maxStreak) setMaxStreak(next);
        return next;
      });
      setGameScore((sc) => sc + 150 + streak * 25);
      setCollectedCoins((c) => c + 2);

      // Boost speed and push creature back!
      setPlayerSpeed((sp) => Math.min(2.5, sp + 0.35));
      setCreatureDistanceMeters((dist) => Math.min(75, dist + 16));

      toast.success("¡CORRECTO! +50 XP y velocidad aumentada ⚡", { duration: 1500 });
    } else {
      if (hasShield) {
        setHasShield(false);
        toast.info("🛡️ ¡El Escudo te protegió del fallo!");
      } else {
        playSfx("wrong");
        setAnswerFeedback("wrong");
        setWrongAnswersCount((w) => w + 1);
        setStreak(0);

        // Stumble speed and creature closes in!
        setPlayerSpeed(0.65);
        setCreatureDistanceMeters((dist) => {
          const nextDist = dist - 18;
          if (nextDist <= 0) {
            triggerGameOver();
            return 0;
          }
          return nextDist;
        });

        toast.error("❌ ¡Incorrecto! La criatura se acerca...", { duration: 1500 });
      }
    }

    // Avanzar a la siguiente pregunta o meta
    setTimeout(() => {
      const nextIndex = currentQIndex + 1;
      setCurrentQIndex(nextIndex);
      setAnswerFeedback(null);
      setSelectedOption(null);

      if (nextIndex >= questionsPool.length) {
        // Meta alcanzada
        triggerVictory();
      } else {
        // Siguiente pregunta después de una pequeña pausa
        setTimeout(() => {
          launchQuestion(questionsPool[nextIndex], lvlConfig.timePerQ);
        }, 1800);
      }
    }, 1400);
  };

  const triggerGameOver = () => {
    playSfx("gameover");
    setScreen("gameover");
  };

  const triggerVictory = async () => {
    playSfx("victory");
    setScreen("victory");

    const lvlConfig = LEVELS_CONFIG[selectedLevel - 1] || LEVELS_CONFIG[0];
    const earnedXp = lvlConfig.bonusXp + correctAnswersCount * 25;
    const earnedCoins = lvlConfig.bonusCoins + collectedCoins;

    // Calcular estrellas (1 a 3)
    const accuracy = questionsPool.length > 0 ? (correctAnswersCount / questionsPool.length) * 100 : 100;
    const stars = accuracy >= 90 ? 3 : accuracy >= 60 ? 2 : 1;

    // Guardar estrellas
    const key = `${selectedWorld}-${selectedLevel}`;
    const newStars = { ...levelStars, [key]: Math.max(levelStars[key] || 0, stars) };
    setLevelStars(newStars);
    if (typeof window !== "undefined") {
      localStorage.setItem("smart_escape_level_stars", JSON.stringify(newStars));
    }

    // Actualizar monedas locales
    const newCoinBal = coinsBalance + earnedCoins;
    setCoinsBalance(newCoinBal);
    if (typeof window !== "undefined") {
      localStorage.setItem("smart_escape_coins", newCoinBal.toString());
    }

    // Guardar en Supabase
    try {
      await rewardXpFn({ data: { xp: earnedXp } });
      await rewardCoinsFn({ data: { coins: Math.max(1, Math.floor(earnedCoins / 5)) } });
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
    } catch {
      // ignore
    }
  };

  // ========================================================
  // MOTOR CANVAS RUNNER 3D PERSPECTIVA (60 FPS)
  // ========================================================
  useEffect(() => {
    if (screen !== "playing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let roadOffset = 0;
    const theme = WORLDS[selectedWorld] || WORLDS.math;
    const lvlConfig = LEVELS_CONFIG[selectedLevel - 1] || LEVELS_CONFIG[0];

    // Obstacles and collectibles on the track
    interface TrackItem {
      lane: number;
      z: number; // 0 (far) to 1 (near player)
      type: "coin" | "star" | "obstacle" | "turbo" | "shield" | "freeze";
    }

    let trackItems: TrackItem[] = [
      { lane: 0, z: 0.15, type: "coin" },
      { lane: 1, z: 0.35, type: "obstacle" },
      { lane: 2, z: 0.55, type: "star" },
      { lane: 1, z: 0.8, type: "turbo" },
    ];

    let lastSpawnZ = 0.9;

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      if (!isPaused) {
        // Update meters and timers
        const effectiveSpeed = activeTurboTime > 0 ? playerSpeed * 1.6 : playerSpeed;
        setPlayerDistanceMeters((d) => d + effectiveSpeed * 12 * dt);
        setTimeSurvived((t) => t + dt);

        // Creature catch-up dynamics
        if (activeFreezeTime <= 0) {
          const creatureApproach = lvlConfig.creatureSpeed * (effectiveSpeed < 1 ? 5 : 2) * dt;
          setCreatureDistanceMeters((dist) => {
            const next = dist - creatureApproach;
            if (next <= 0) {
              triggerGameOver();
              return 0;
            }
            return next;
          });
        }

        // Decrement powerup timers
        if (activeTurboTime > 0) setActiveTurboTime((t) => Math.max(0, t - dt));
        if (activeMagnetTime > 0) setActiveMagnetTime((t) => Math.max(0, t - dt));
        if (activeFreezeTime > 0) setActiveFreezeTime((t) => Math.max(0, t - dt));

        // Move road & items
        roadOffset += effectiveSpeed * 350 * dt;
        if (roadOffset > 1000) roadOffset = 0;

        // Move track items forward
        trackItems.forEach((item) => {
          item.z += effectiveSpeed * 0.45 * dt;

          // Magnet pull
          if (activeMagnetTime > 0 && (item.type === "coin" || item.type === "star")) {
            item.lane += (playerLane - item.lane) * 0.1;
          }

          // Check player collision
          if (item.z >= 0.92 && item.z <= 1.05) {
            if (Math.round(item.lane) === playerLane) {
              if (item.type === "coin") {
                playSfx("coin");
                setCollectedCoins((c) => c + 1);
                setGameScore((sc) => sc + 20);
                item.z = 2; // remove
              } else if (item.type === "star") {
                playSfx("star");
                setCollectedStars((s) => s + 1);
                setGameScore((sc) => sc + 60);
                item.z = 2;
              } else if (item.type === "turbo") {
                playSfx("turbo");
                setActiveTurboTime(4);
                item.z = 2;
                toast.success("🚀 ¡TURBO ACTIVADO!");
              } else if (item.type === "shield") {
                setHasShield(true);
                item.z = 2;
                toast.info("🛡️ ¡ESCUDO RECOGIDO!");
              } else if (item.type === "freeze") {
                playSfx("freeze");
                setActiveFreezeTime(4);
                item.z = 2;
                toast.success("❄️ ¡CRIATURA CONGELADA!");
              } else if (item.type === "obstacle") {
                if (!isJumping) {
                  if (hasShield) {
                    setHasShield(false);
                    item.z = 2;
                    toast.info("🛡️ ¡Escudo absorbió el choque!");
                  } else {
                    playSfx("wrong");
                    setPlayerSpeed(0.6);
                    setCreatureDistanceMeters((d) => Math.max(1, d - 8));
                    item.z = 2;
                  }
                }
              }
            }
          }
        });

        // Filter off-screen items & spawn new ones
        trackItems = trackItems.filter((it) => it.z < 1.15);
        if (trackItems.length < 5) {
          const types: TrackItem["type"][] = ["coin", "coin", "star", "obstacle", "turbo", "freeze", "shield"];
          const spawnType = types[Math.floor(Math.random() * types.length)];
          const spawnLane = Math.floor(Math.random() * 3);
          trackItems.push({
            lane: spawnLane,
            z: 0.05,
            type: spawnType,
          });
        }
      }

      // ==========================================
      // RENDER CANVAS 3D RUNNER TRACK
      // ==========================================
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Sky & Horizon
      const horizonY = h * 0.42;
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      skyGrad.addColorStop(0, "#030712");
      skyGrad.addColorStop(1, theme.trackColor);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, horizonY);

      // Futuristic Neon Grid on Horizon
      ctx.strokeStyle = theme.gridColor;
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = 0.3;
      for (let i = 0; i < w; i += 25) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(w / 2, horizonY);
        ctx.stroke();
      }
      ctx.globalAlpha = 1.0;

      // Ground 3D Road
      const roadTopW = w * 0.22;
      const roadBottomW = w * 0.88;
      const roadTopX = (w - roadTopW) / 2;
      const roadBottomX = (w - roadBottomW) / 2;

      // Road background
      const roadGrad = ctx.createLinearGradient(0, horizonY, 0, h);
      roadGrad.addColorStop(0, "#090d16");
      roadGrad.addColorStop(1, "#020617");
      ctx.fillStyle = roadGrad;
      ctx.beginPath();
      ctx.moveTo(roadTopX, horizonY);
      ctx.lineTo(roadTopX + roadTopW, horizonY);
      ctx.lineTo(roadBottomX + roadBottomW, h);
      ctx.lineTo(roadBottomX, h);
      ctx.closePath();
      ctx.fill();

      // Road Lane Lines
      ctx.strokeStyle = theme.gridColor;
      ctx.lineWidth = 2;
      ctx.shadowColor = theme.gridColor;
      ctx.shadowBlur = 8;

      // Outer Borders
      ctx.beginPath();
      ctx.moveTo(roadTopX, horizonY);
      ctx.lineTo(roadBottomX, h);
      ctx.moveTo(roadTopX + roadTopW, horizonY);
      ctx.lineTo(roadBottomX + roadBottomW, h);
      ctx.stroke();

      // 3 Lanes Dividers
      const lane1Top = roadTopX + roadTopW * 0.33;
      const lane1Bot = roadBottomX + roadBottomW * 0.33;
      const lane2Top = roadTopX + roadTopW * 0.66;
      const lane2Bot = roadBottomX + roadBottomW * 0.66;

      ctx.lineWidth = 1.5;
      ctx.setLineDash([12, 12]);
      ctx.lineDashOffset = -roadOffset;
      ctx.beginPath();
      ctx.moveTo(lane1Top, horizonY);
      ctx.lineTo(lane1Bot, h);
      ctx.moveTo(lane2Top, horizonY);
      ctx.lineTo(lane2Bot, h);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      // Draw Items on Track (sorted by depth Z)
      const sortedItems = [...trackItems].sort((a, b) => a.z - b.z);
      sortedItems.forEach((item) => {
        const itemY = horizonY + (h - horizonY) * item.z;
        const currentRoadW = roadTopW + (roadBottomW - roadTopW) * item.z;
        const currentRoadX = (w - currentRoadW) / 2;
        const laneWidth = currentRoadW / 3;
        const itemX = currentRoadX + laneWidth * item.lane + laneWidth / 2;
        const scale = 0.3 + item.z * 0.8;

        ctx.save();
        ctx.translate(itemX, itemY);
        ctx.scale(scale, scale);

        if (item.type === "coin") {
          // Animated spinning gold coin
          ctx.fillStyle = "#facc15";
          ctx.beginPath();
          ctx.arc(0, -10, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ca8a04";
          ctx.font = "bold 10px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("🪙", 0, -6);
        } else if (item.type === "star") {
          ctx.font = "20px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("⭐", 0, -6);
        } else if (item.type === "turbo") {
          ctx.font = "22px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("🚀", 0, -8);
        } else if (item.type === "shield") {
          ctx.font = "22px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("🛡️", 0, -8);
        } else if (item.type === "freeze") {
          ctx.font = "22px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("❄️", 0, -8);
        } else if (item.type === "obstacle") {
          // Cyber Barrier
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(-18, -20, 36, 12);
          ctx.fillStyle = "#fca5a5";
          ctx.fillRect(-14, -18, 28, 8);
          ctx.fillStyle = "#991b1b";
          ctx.fillRect(-16, -8, 6, 8);
          ctx.fillRect(10, -8, 6, 8);
        }
        ctx.restore();
      });

      // ==========================================
      // DIBUJAR AL PERSONAJE DEL JUGADOR
      // ==========================================
      const playerZ = 0.95;
      const playerRoadW = roadTopW + (roadBottomW - roadTopW) * playerZ;
      const playerRoadX = (w - playerRoadW) / 2;
      const pLaneW = playerRoadW / 3;
      const targetPlayerX = playerRoadX + pLaneW * playerLane + pLaneW / 2;
      const playerBaseY = h - 55 - (isJumping ? 65 : 0);

      // Player Shadow
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.beginPath();
      ctx.ellipse(targetPlayerX, h - 45, 22, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Turbo / Shield Aura
      if (activeTurboTime > 0) {
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 4;
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.ellipse(targetPlayerX, playerBaseY + 10, 26, 32, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      if (hasShield) {
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(targetPlayerX, playerBaseY + 10, 28, 34, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw Avatar Character
      const equippedOutfit = CLOSET_ITEMS.find((c) => c.id === equippedItems.outfit) || CLOSET_ITEMS[4];
      const equippedHair = CLOSET_ITEMS.find((c) => c.id === equippedItems.hair) || CLOSET_ITEMS[0];

      ctx.save();
      ctx.translate(targetPlayerX, playerBaseY);

      // Running stride bounce
      const legOffset = Math.sin(timestamp * 0.015) * 6;

      // Legs / Shoes
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(-8, 18 + legOffset, 6, 12);
      ctx.fillRect(2, 18 - legOffset, 6, 12);
      ctx.fillStyle = "#38bdf8"; // Shoes
      ctx.fillRect(-9, 28 + legOffset, 8, 5);
      ctx.fillRect(1, 28 - legOffset, 8, 5);

      // Torso / Outfit
      ctx.fillStyle = equippedOutfit.color;
      ctx.beginPath();
      ctx.roundRect(-12, 0, 24, 20, 4);
      ctx.fill();

      // Backpack
      ctx.fillStyle = "#475569";
      ctx.fillRect(-14, 2, 4, 14);

      // Head / Face
      ctx.fillStyle = "#fcd34d"; // Skin
      ctx.beginPath();
      ctx.arc(0, -8, 10, 0, Math.PI * 2);
      ctx.fill();

      // Hair
      ctx.fillStyle = equippedHair.color;
      ctx.beginPath();
      ctx.arc(0, -12, 11, Math.PI, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(-4, -8, 2.5, 2.5);
      ctx.fillRect(2, -8, 2.5, 2.5);

      ctx.restore();

      // ==========================================
      // DIBUJAR AL PERSEGUIDOR (CRIATURA DETRÁS)
      // ==========================================
      // Creature distance visual (close = big at bottom/sides, far = small on horizon)
      const creatureZ = Math.max(0.05, 1 - creatureDistanceMeters / 60);
      const cRoadW = roadTopW + (roadBottomW - roadTopW) * creatureZ;
      const cRoadX = (w - cRoadW) / 2;
      const cX = cRoadX + cRoadW / 2;
      const cY = horizonY + (h - horizonY) * creatureZ;
      const cScale = 0.4 + creatureZ * 0.9;

      ctx.save();
      ctx.translate(cX, cY - 20);
      ctx.scale(cScale, cScale);

      // Freeze ice block effect
      if (activeFreezeTime > 0) {
        ctx.fillStyle = "rgba(56, 189, 248, 0.4)";
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2;
        ctx.strokeRect(-25, -25, 50, 50);
        ctx.fillRect(-25, -25, 50, 50);
      }

      // Creature Body
      ctx.fillStyle = theme.monsterColor;
      ctx.shadowColor = theme.monsterColor;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Glowing Angry/Funny Eyes
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(-8, -4, 6, 0, Math.PI * 2);
      ctx.arc(8, -4, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ef4444"; // Red pupils
      ctx.beginPath();
      ctx.arc(-8, -4, 3, 0, Math.PI * 2);
      ctx.arc(8, -4, 3, 0, Math.PI * 2);
      ctx.fill();

      // Sharp Teeth
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(-10, 8);
      ctx.lineTo(-6, 14);
      ctx.lineTo(-2, 8);
      ctx.lineTo(2, 14);
      ctx.lineTo(6, 8);
      ctx.lineTo(10, 14);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      animFrameIdRef.current = requestAnimationFrame(gameLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [screen, isPaused, selectedWorld, selectedLevel, playerLane, isJumping, playerSpeed, activeTurboTime, hasShield, activeMagnetTime, activeFreezeTime, creatureDistanceMeters]);

  // Handle buy closet item
  const handleBuyItem = (item: CustomizationItem) => {
    if (coinsBalance < item.cost) {
      toast.error("¡Monedas insuficientes! Gana más jugando Smart Escape.");
      return;
    }
    const newCoins = coinsBalance - item.cost;
    const newUnlocked = [...unlockedClosetIds, item.id];
    setCoinsBalance(newCoins);
    setUnlockedClosetIds(newUnlocked);
    setEquippedItems((prev) => ({ ...prev, [item.category]: item.id }));

    if (typeof window !== "undefined") {
      localStorage.setItem("smart_escape_coins", newCoins.toString());
      localStorage.setItem("smart_escape_unlocked_items", JSON.stringify(newUnlocked));
    }
    playSfx("coin");
    toast.success(`¡Desbloqueaste y equipaste ${item.name}! 🎉`);
  };

  const currentTheme = WORLDS[selectedWorld] || WORLDS.math;
  const currentLvlConfig = LEVELS_CONFIG[selectedLevel - 1] || LEVELS_CONFIG[0];

  return (
    <div className="min-h-screen bg-slate-950 text-foreground flex flex-col font-sans select-none overflow-x-hidden">
      {/* ======================================================== */}
      {/* 1. PANTALLA PRINCIPAL (HOME LOBBY) */}
      {/* ======================================================== */}
      {screen === "home" && (
        <main className="mx-auto max-w-md w-full px-5 pt-5 pb-16 flex-1 flex flex-col justify-between animate-fade-in">
          <div className="space-y-4 text-center">
            {/* Top Bar */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate({ to: "/games" })}
                className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition cursor-pointer"
              >
                <ArrowLeft className="size-4" />
                <span>Volver al Hub</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-muted-foreground hover:text-foreground"
                >
                  {soundEnabled ? <Volume2 className="size-4 text-emerald-400" /> : <VolumeX className="size-4" />}
                </button>
                <div className="flex items-center gap-1 bg-gold/15 border border-gold/30 px-3 py-1 rounded-full text-xs font-bold text-gold-foreground">
                  <img src={streakCap} alt="" className="size-3.5" />
                  <span>{coinsBalance}</span>
                </div>
              </div>
            </div>

            {/* Glowing Logo & Title */}
            <div className="pt-3 space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-500/10">
                <span>✨ Videojuego Premium Educativo</span>
              </div>
              <h1 className="font-display text-4xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 bg-clip-text text-transparent drop-shadow-md">
                SMART ESCAPE
              </h1>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                ¡Corre, esquiva obstáculos y responde antes de que la criatura te alcance!
              </p>
            </div>

            {/* 3D Character Podium Card */}
            <div className="relative rounded-3xl border border-purple-500/30 bg-gradient-to-b from-slate-900/90 via-purple-950/20 to-slate-900/90 p-6 shadow-[0_0_40px_-10px_rgba(168,85,247,0.2)] overflow-hidden">
              <div className="absolute top-3 right-3">
                <button
                  onClick={() => setScreen("closet")}
                  className="flex items-center gap-1 bg-purple-500/20 border border-purple-500/30 text-purple-300 px-3 py-1.5 rounded-2xl text-xs font-bold hover:bg-purple-500/30 transition cursor-pointer"
                >
                  <Shirt className="size-3.5" />
                  <span>Armario</span>
                </button>
              </div>

              {/* Avatar Preview */}
              <div className="py-6 flex flex-col items-center justify-center relative">
                <div className="size-28 rounded-full bg-gradient-to-t from-purple-500/20 to-cyan-500/10 border border-purple-500/30 flex items-center justify-center relative shadow-inner">
                  <span className="text-5xl animate-bounce">🏃</span>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-cyan-400">
                  <Sparkles className="size-3.5" />
                  <span>Runner Personalizado</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Menu */}
          <div className="space-y-3 pt-4">
            <button
              onClick={() => setScreen("world_select")}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 text-white font-display text-base font-black flex items-center justify-center gap-3 shadow-lg shadow-purple-500/25 hover:brightness-110 active:scale-95 transition cursor-pointer"
            >
              <Play className="size-5 fill-white" />
              <span>JUGAR SMART ESCAPE</span>
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setScreen("closet")}
                className="h-12 rounded-2xl border border-slate-800 bg-slate-900/80 hover:border-purple-500/40 text-foreground text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Shirt className="size-4 text-purple-400" />
                <span>Personalizar</span>
              </button>

              <button
                onClick={() => {
                  setSelectedWorld("custom");
                  setScreen("upload");
                }}
                className="h-12 rounded-2xl border border-slate-800 bg-slate-900/80 hover:border-cyan-500/40 text-foreground text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Upload className="size-4 text-cyan-400" />
                <span>Subir Apuntes</span>
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ======================================================== */}
      {/* 2. SELECCIÓN DE MUNDO / MATERIA */}
      {/* ======================================================== */}
      {screen === "world_select" && (
        <main className="mx-auto max-w-md w-full px-5 pt-5 pb-20 flex-1 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setScreen("home")}
              className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition cursor-pointer"
            >
              <ArrowLeft className="size-4" />
              <span>Atrás</span>
            </button>
            <span className="text-xs font-bold text-purple-400">Paso 1: Elige el Mundo</span>
          </div>

          <div className="space-y-1">
            <h2 className="font-display text-xl font-bold text-foreground">Elige la Materia o Escenario</h2>
            <p className="text-xs text-muted-foreground">Cada mundo tiene su propio entorno visual y criatura perseguidora:</p>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {(Object.keys(WORLDS) as WorldId[]).map((wId) => {
              const w = WORLDS[wId];
              return (
                <button
                  key={w.id}
                  onClick={() => {
                    setSelectedWorld(w.id);
                    if (w.id === "custom") {
                      setScreen("upload");
                    } else {
                      setScreen("level_map");
                    }
                  }}
                  className="group flex items-center justify-between p-3.5 rounded-2xl border border-slate-800 bg-slate-900/70 hover:border-purple-500/50 hover:bg-purple-950/20 text-left transition active:scale-98 cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{w.icon}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-foreground group-hover:text-purple-300 transition-colors">
                          {w.name}
                        </span>
                        <span className="text-[9px] font-semibold px-2 py-0.2 rounded-full bg-slate-800 text-slate-300">
                          {w.badge}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground block line-clamp-1">{w.desc}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-rose-400 flex items-center gap-0.5">
                      <span>{w.monsterEmoji}</span>
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        </main>
      )}

      {/* ======================================================== */}
      {/* 3. MAPA DE NIVELES Y PROGRESIÓN */}
      {/* ======================================================== */}
      {screen === "level_map" && (
        <main className="mx-auto max-w-md w-full px-5 pt-5 pb-20 flex-1 space-y-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setScreen("world_select")}
              className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition cursor-pointer"
            >
              <ArrowLeft className="size-4" />
              <span>Cambiar Mundo</span>
            </button>
            <span className="text-xs font-bold text-cyan-400">{currentTheme.name}</span>
          </div>

          <div className="p-4 rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-950/30 to-slate-900 flex items-center gap-3">
            <span className="text-3xl">{currentTheme.icon}</span>
            <div>
              <h3 className="text-sm font-bold text-foreground">{currentTheme.name}</h3>
              <p className="text-[11px] text-muted-foreground">
                Perseguidor: <strong className="text-rose-400">{currentTheme.monsterName}</strong> {currentTheme.monsterEmoji}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-0.5 block">
              Selecciona tu Nivel de Dificultad:
            </span>

            {LEVELS_CONFIG.map((lvl) => {
              const starKey = `${selectedWorld}-${lvl.level}`;
              const stars = levelStars[starKey] || 0;
              return (
                <div
                  key={lvl.level}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-2.5 hover:border-cyan-500/40 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-foreground">
                        Nivel {lvl.level} — {lvl.name}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                        <span>📚 {lvl.reqQuestions} preguntas</span>
                        <span>⏱️ {lvl.timePerQ}s por pregunta</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-amber-400">
                      {[1, 2, 3].map((s) => (
                        <Star
                          key={s}
                          className={`size-3.5 ${s <= stars ? "fill-amber-400 text-amber-400" : "text-slate-700"}`}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => startGame(selectedWorld, lvl.level)}
                    className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer hover:brightness-110"
                  >
                    <Play className="size-3.5 fill-current" />
                    <span>Iniciar Carrera (Nivel {lvl.level})</span>
                  </button>
                </div>
              );
            })}
          </div>
        </main>
      )}

      {/* ======================================================== */}
      {/* 4. SUBIR MATERIAL CON IA */}
      {/* ======================================================== */}
      {screen === "upload" && (
        <main className="mx-auto max-w-md w-full px-5 pt-5 pb-20 flex-1 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setScreen("world_select")}
              className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition cursor-pointer"
            >
              <ArrowLeft className="size-4" />
              <span>Atrás</span>
            </button>
            <span className="text-xs font-bold text-cyan-400">Material de Estudio</span>
          </div>

          <div className="p-4 rounded-3xl border border-slate-800 bg-slate-900 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <Upload className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Sube tus apuntes para Smart Escape</h3>
                <p className="text-[11px] text-muted-foreground">
                  El juego creará preguntas basadas <strong>únicamente</strong> en este contenido.
                </p>
              </div>
            </div>

            <label className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border border-dashed border-primary/40 bg-primary/5 text-primary text-xs font-semibold hover:bg-primary/10 cursor-pointer transition">
              <Upload className="size-4" />
              <span>Subir PDF, Word o Foto de Apuntes</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setIsExtracting(true);
                  const toastId = toast.loading("Extrayendo texto del archivo...");
                  try {
                    const reader = new FileReader();
                    reader.onload = async () => {
                      try {
                        const base64Data = (reader.result as string).split(",")[1];
                        const res = await extractMediaFn({
                          data: {
                            fileBase64: base64Data,
                            mimeType: file.type || "application/octet-stream",
                            fileName: file.name,
                          },
                        });
                        if (res.extractedText) {
                          setCustomText(res.extractedText);
                          toast.success("¡Texto extraído!", { id: toastId });
                        }
                      } catch {
                        toast.error("Error al extraer.", { id: toastId });
                      } finally {
                        setIsExtracting(false);
                      }
                    };
                    reader.readAsDataURL(file);
                  } catch {
                    toast.error("Error al leer archivo.", { id: toastId });
                    setIsExtracting(false);
                  }
                }}
                className="hidden"
              />
            </label>

            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="O pega aquí el resumen, temario o capítulo que deseas estudiar..."
              className="h-32 w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-foreground focus:border-primary focus:outline-none resize-none leading-relaxed"
            />

            <button
              onClick={() => startGame("custom", 1)}
              disabled={isExtracting || isGeneratingAi || !customText.trim()}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="size-4" />
              <span>Generar y Empezar Carrera</span>
            </button>
          </div>
        </main>
      )}

      {/* ======================================================== */}
      {/* 5. PANTALLA DE JUEGO (RUNNER + PREGUNTAS EN HUD) */}
      {/* ======================================================== */}
      {screen === "playing" && (
        <main className="relative flex-1 flex flex-col bg-slate-950 overflow-hidden select-none">
          {/* Top HUD Bar */}
          <div className="absolute top-2 inset-x-3 z-30 flex items-center justify-between pointer-events-none">
            {/* Distance Meter & Creature Radar */}
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-2xl backdrop-blur pointer-events-auto">
              <span className="text-[10px] font-bold text-cyan-400">
                🏃 {Math.round(playerDistanceMeters)}m
              </span>
              <span className="text-slate-600">|</span>
              <span
                className={`text-[10px] font-bold flex items-center gap-1 ${
                  creatureDistanceMeters < 15 ? "text-rose-400 animate-pulse" : "text-amber-400"
                }`}
              >
                <span>{currentTheme.monsterEmoji}</span>
                <span>{Math.round(creatureDistanceMeters)}m</span>
              </span>
            </div>

            {/* Score & Coins */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <div className="flex items-center gap-1 bg-gold/15 border border-gold/30 px-2.5 py-1 rounded-full text-xs font-bold text-gold-foreground">
                <img src={streakCap} alt="" className="size-3" />
                <span>{collectedCoins}</span>
              </div>
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="size-8 rounded-xl bg-slate-900/90 border border-slate-800 grid place-items-center text-muted-foreground hover:text-foreground pointer-events-auto"
              >
                {isPaused ? <Play className="size-3.5 fill-current" /> : <Pause className="size-3.5" />}
              </button>
            </div>
          </div>

          {/* Creature Warning Alert Bar when Close */}
          {creatureDistanceMeters < 18 && (
            <div className="absolute top-12 inset-x-4 z-30 pointer-events-none">
              <div className="bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px] font-bold px-3 py-1 rounded-full flex items-center justify-center gap-1.5 animate-pulse backdrop-blur">
                <AlertTriangle className="size-3" />
                <span>¡CUIDADO! {currentTheme.monsterName} está a {Math.round(creatureDistanceMeters)} metros</span>
              </div>
            </div>
          )}

          {/* 3D Runner Canvas */}
          <div className="flex-1 w-full relative">
            <canvas ref={canvasRef} width={400} height={480} className="w-full h-full object-cover block" />
          </div>

          {/* Active Question Prompt Overlay during Race */}
          {isQuestionActive && currentQuestion && (
            <div className="absolute inset-x-3 bottom-24 z-30 animate-in slide-in-from-bottom duration-300">
              <div className="rounded-2xl border border-purple-500/40 bg-slate-900/95 backdrop-blur-md p-3.5 shadow-2xl space-y-2.5">
                {/* Header & Timer Countdown */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                    Pregunta {currentQIndex + 1} de {questionsPool.length}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-black text-amber-400">
                    <Clock className="size-3.5" />
                    <span>{qTimer}s</span>
                  </div>
                </div>

                {/* Question Text */}
                <h3 className="text-xs font-bold text-foreground leading-snug">{currentQuestion.question}</h3>

                {/* Options Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {currentQuestion.options.map((opt, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = idx === currentQuestion.correctIndex;
                    let btnStyle = "border-slate-800 bg-slate-950/80 text-foreground hover:border-purple-500/50";

                    if (selectedOption !== null) {
                      if (isCorrect) {
                        btnStyle = "border-emerald-500 bg-emerald-500/20 text-emerald-400 font-bold";
                      } else if (isSelected) {
                        btnStyle = "border-rose-500 bg-rose-500/20 text-rose-400 font-bold";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        disabled={selectedOption !== null}
                        onClick={() => handleAnswerOption(idx)}
                        className={`p-2.5 rounded-xl border text-left text-[11px] leading-tight transition active:scale-95 cursor-pointer flex items-center justify-between ${btnStyle}`}
                      >
                        <span className="line-clamp-2">{opt}</span>
                        {selectedOption !== null && isCorrect && <CheckCircle2 className="size-3 text-emerald-400 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* On-Screen Mobile Touch Controls */}
          <div className="absolute inset-x-3 bottom-3 z-20 flex items-center justify-between gap-3 pointer-events-auto">
            <div className="flex gap-2">
              <button
                onClick={() => setPlayerLane((p) => Math.max(0, p - 1))}
                className="size-14 rounded-2xl bg-slate-900/90 border border-slate-800 active:bg-purple-600 text-white font-black text-lg flex items-center justify-center shadow-lg transition active:scale-90 cursor-pointer"
              >
                ◀
              </button>
              <button
                onClick={() => setPlayerLane((p) => Math.min(2, p + 1))}
                className="size-14 rounded-2xl bg-slate-900/90 border border-slate-800 active:bg-purple-600 text-white font-black text-lg flex items-center justify-center shadow-lg transition active:scale-90 cursor-pointer"
              >
                ▶
              </button>
            </div>

            <button
              onClick={triggerJump}
              className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 active:from-cyan-500 active:to-blue-600 text-white font-display text-sm font-black flex items-center justify-center gap-1.5 shadow-lg shadow-purple-500/20 transition active:scale-95 cursor-pointer"
            >
              <ArrowUp className="size-4" />
              <span>SALTAR</span>
            </button>
          </div>
        </main>
      )}

      {/* ======================================================== */}
      {/* 6. PANTALLA DE DERROTA (💀 TE ALCANZARON) */}
      {/* ======================================================== */}
      {screen === "gameover" && (
        <main className="mx-auto max-w-md w-full px-5 pt-8 pb-16 flex-1 flex flex-col justify-center text-center space-y-6 animate-fade-in">
          <div className="space-y-2">
            <span className="text-6xl animate-bounce block">💀</span>
            <h2 className="font-display text-3xl font-black text-rose-500">¡Te alcanzaron!</h2>
            <p className="text-xs text-muted-foreground">
              {currentTheme.monsterName} corrió más rápido en esta ocasión. ¡Repasa tus apuntes y vuelve a intentar!
            </p>
          </div>

          <div className="p-4 rounded-3xl border border-slate-800 bg-slate-900 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-muted-foreground">Distancia recorrida:</span>
              <span className="font-bold text-foreground">{Math.round(playerDistanceMeters)} metros</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-muted-foreground">Preguntas acertadas:</span>
              <span className="font-bold text-emerald-400">{correctAnswersCount} correctas</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Monedas recogidas:</span>
              <span className="font-bold text-gold-foreground">+{collectedCoins} 🪙</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => startGame(selectedWorld, selectedLevel)}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
            >
              <RotateCcw className="size-4" />
              <span>Intentar de nuevo</span>
            </button>

            <button
              onClick={() => navigate({ to: "/study" })}
              className="w-full h-12 rounded-2xl border border-slate-800 bg-slate-900 text-foreground font-bold text-xs flex items-center justify-center gap-2 hover:border-purple-500/40 transition active:scale-95 cursor-pointer"
            >
              <BookOpen className="size-4 text-purple-400" />
              <span>Repasar material en Estudio</span>
            </button>

            <button
              onClick={() => setScreen("level_map")}
              className="w-full h-12 rounded-2xl border border-slate-800 text-muted-foreground font-bold text-xs flex items-center justify-center gap-2 hover:text-foreground transition cursor-pointer"
            >
              <span>Volver al mapa</span>
            </button>
          </div>
        </main>
      )}

      {/* ======================================================== */}
      {/* 7. PANTALLA DE VICTORIA (🏁 ESCAPE EXITOSO) */}
      {/* ======================================================== */}
      {screen === "victory" && (
        <main className="mx-auto max-w-md w-full px-5 pt-8 pb-16 flex-1 flex flex-col justify-center text-center space-y-6 animate-fade-in">
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-1 text-amber-400">
              <Star className="size-8 fill-amber-400" />
              <Star className="size-10 fill-amber-400 animate-pulse" />
              <Star className="size-8 fill-amber-400" />
            </div>
            <h2 className="font-display text-3xl font-black bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              ¡ESCAPE EXITOSO! 🏆
            </h2>
            <p className="text-xs text-muted-foreground">
              ¡Has escapado de {currentTheme.monsterName} y completado el Nivel {selectedLevel}!
            </p>
          </div>

          <div className="p-4 rounded-3xl border border-emerald-500/30 bg-emerald-950/20 space-y-2.5 text-xs text-left">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-muted-foreground">⭐ Experiencia Obtenida:</span>
              <span className="font-bold text-cyan-400">+{currentLvlConfig.bonusXp + correctAnswersCount * 25} XP</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-muted-foreground">🪙 Monedas Ganadas:</span>
              <span className="font-bold text-gold-foreground">+{currentLvlConfig.bonusCoins + collectedCoins} Monedas</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-muted-foreground">📚 Aciertos:</span>
              <span className="font-bold text-emerald-400">{correctAnswersCount} / {questionsPool.length}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">🔥 Racha Máxima:</span>
              <span className="font-bold text-purple-400">{maxStreak} seguidas</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {selectedLevel < 4 && (
              <button
                onClick={() => startGame(selectedWorld, selectedLevel + 1)}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-95 cursor-pointer"
              >
                <span>Siguiente Nivel (Nivel {selectedLevel + 1})</span>
                <ChevronRight className="size-4" />
              </button>
            )}

            <button
              onClick={() => setScreen("level_map")}
              className="w-full h-12 rounded-2xl border border-slate-800 bg-slate-900 text-foreground font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <span>Volver al Mapa de Niveles</span>
            </button>
          </div>
        </main>
      )}

      {/* ======================================================== */}
      {/* 8. ARMARIO / TIENDA DE PERSONALIZACIÓN */}
      {/* ======================================================== */}
      {screen === "closet" && (
        <main className="mx-auto max-w-md w-full px-5 pt-5 pb-20 flex-1 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setScreen("home")}
              className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition cursor-pointer"
            >
              <ArrowLeft className="size-4" />
              <span>Atrás</span>
            </button>
            <div className="flex items-center gap-1 bg-gold/15 border border-gold/30 px-3 py-1 rounded-full text-xs font-bold text-gold-foreground">
              <img src={streakCap} alt="" className="size-3.5" />
              <span>{coinsBalance}</span>
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="font-display text-xl font-bold">Armario y Personalización</h2>
            <p className="text-xs text-muted-foreground">Desbloquea atuendos y accesorios con las monedas que ganas jugando:</p>
          </div>

          <div className="space-y-3">
            {CLOSET_ITEMS.map((item) => {
              const isUnlocked = unlockedClosetIds.includes(item.id);
              const isEquipped = (equippedItems as any)[item.category] === item.id;

              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition ${
                    isEquipped
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-slate-800 bg-slate-900/70"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <span className="text-xs font-bold text-foreground block">{item.name}</span>
                      <span className="text-[10px] text-muted-foreground capitalize">{item.category}</span>
                    </div>
                  </div>

                  {isEquipped ? (
                    <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold flex items-center gap-1">
                      <Check className="size-3" /> Equipado
                    </span>
                  ) : isUnlocked ? (
                    <button
                      onClick={() => {
                        setEquippedItems((prev) => ({ ...prev, [item.category]: item.id }));
                        toast.success(`Equipado: ${item.name}`);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-700 hover:border-purple-500 text-xs font-bold text-slate-200 transition active:scale-95 cursor-pointer"
                    >
                      Equipar
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBuyItem(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gold/20 hover:bg-gold/30 text-gold-foreground border border-gold/40 text-xs font-bold transition active:scale-95 cursor-pointer"
                    >
                      <Lock className="size-3" />
                      <span>{item.cost} 🪙</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </main>
      )}
    </div>
  );
}
