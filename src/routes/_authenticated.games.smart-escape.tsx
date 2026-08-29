import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { rewardGameCoins, rewardGameXp } from "@/lib/games.functions";
import { extractTextFromMedia } from "@/lib/quiz.functions";
import { analyzeStudyMaterial, generateStudyGameQuestions } from "@/lib/study-game.functions";
import { SCHOOL_SUBJECTS, type SchoolSubject } from "@/lib/school-subjects-data";
import { PAA_OFFICIAL_QUESTIONS } from "@/lib/paa-official-bank";
import { EXANI_OFFICIAL_QUESTIONS } from "@/lib/exani-official-bank";
import {
  ArrowLeft, Flame, Trophy, Sparkles, RotateCcw, Volume2, VolumeX,
  Play, Pause, Zap, Shield, Clock, Magnet, Snowflake, CheckCircle2,
  XCircle, Award, GraduationCap, ChevronRight, Upload, Shirt,
  Lock, Check, Star, RefreshCw, BookOpen, AlertTriangle, ArrowUp,
  Heart, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import streakCap from "@/assets/streak-cap.png";

export const Route = createFileRoute("/_authenticated/games/smart-escape")({
  head: () => ({ meta: [{ title: "Smart Escape — Videojuego Premium Educativo" }] }),
  component: SmartEscapeGame,
});

// ========================================================
// TIPOS Y MODELOS
// ========================================================
export type WorldId = "math" | "chem" | "history" | "bio" | "english" | "paa" | "exani" | "custom";

export interface GameQuestion {
  id: string;
  question: string;
  options: [string, string, string, string];
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
  skyColor: string;
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
    skyColor: "#030712",
    monsterName: "Gorgon Glitch",
    monsterEmoji: "👾",
    monsterColor: "#06b6d4",
  },
  chem: {
    id: "chem",
    name: "Laboratorio Neón",
    icon: "🧪",
    badge: "Química",
    desc: "Plataformas químicas flotantes con matraces y sustancias.",
    trackColor: "#062817",
    gridColor: "#10b981",
    skyColor: "#021209",
    monsterName: "Nebulón Químico",
    monsterEmoji: "🧪",
    monsterColor: "#10b981",
  },
  history: {
    id: "history",
    name: "Ruinas Ancestrales",
    icon: "🏛️",
    badge: "Historia",
    desc: "Caminos de piedra entre templos y pirámides históricas.",
    trackColor: "#271705",
    gridColor: "#f59e0b",
    skyColor: "#0f0701",
    monsterName: "Coloso del Tiempo",
    monsterEmoji: "🗿",
    monsterColor: "#f59e0b",
  },
  bio: {
    id: "bio",
    name: "Microcosmos Celular",
    icon: "🧬",
    badge: "Biología",
    desc: "Circuito dentro de una arteria celular microscópica.",
    trackColor: "#290c29",
    gridColor: "#ec4899",
    skyColor: "#110211",
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
    trackColor: "#150d33",
    gridColor: "#a855f7",
    skyColor: "#080417",
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
    trackColor: "#0a1931",
    gridColor: "#3b82f6",
    skyColor: "#030b17",
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
    trackColor: "#1d0c33",
    gridColor: "#c084fc",
    skyColor: "#0b0314",
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
    trackColor: "#170a31",
    gridColor: "#818cf8",
    skyColor: "#070211",
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

  // Vistas de la aplicación
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

  // Monedas y Armario
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

  // Estrellas por nivel
  const [levelStars, setLevelStars] = useState<Record<string, number>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("smart_escape_level_stars");
      return saved ? JSON.parse(saved) : { "math-1": 3, "math-2": 2 };
    }
    return {};
  });

  // In-Game State & Metrics
  const [questionsPool, setQuestionsPool] = useState<GameQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<GameQuestion | null>(null);
  const [qTimer, setQTimer] = useState(10);
  const [qTimerMax, setQTimerMax] = useState(10);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerFeedback, setAnswerFeedback] = useState<"correct" | "wrong" | null>(null);

  // Runner In-Game Metrics
  const [lives, setLives] = useState(3);
  const [playerLane, setPlayerLane] = useState<number>(1); // 0 = Left, 1 = Center, 2 = Right
  const [isJumping, setIsJumping] = useState(false);
  const [playerDistanceMeters, setPlayerDistanceMeters] = useState(0);
  const [creatureDistanceMeters, setCreatureDistanceMeters] = useState(40); // 0 (caught) to 80m
  const [playerSpeed, setPlayerSpeed] = useState(1.0);
  const [gameXp, setGameXp] = useState(0);
  const [collectedCoins, setCollectedCoins] = useState(0);
  const [collectedStars, setCollectedStars] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [wrongAnswersCount, setWrongAnswersCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Power-ups
  const [activeTurboTime, setActiveTurboTime] = useState(0);
  const [hasShield, setHasShield] = useState(false);
  const [activeMagnetTime, setActiveMagnetTime] = useState(0);
  const [activeFreezeTime, setActiveFreezeTime] = useState(0);

  // Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<any>(null);

  // Web Audio Synth
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
        osc.frequency.exponentialRampToValueAtTime(650, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === "coin") {
        osc.frequency.setValueAtTime(987.77, ctx.currentTime);
        osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.08);
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
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === "turbo") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(950, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === "freeze") {
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
        osc.frequency.linearRampToValueAtTime(60, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch {
      // Audio not supported
    }
  };

  // Jump trigger
  const triggerJump = useCallback(() => {
    if (isJumping) return;
    setIsJumping(true);
    playSfx("jump");
    setTimeout(() => {
      setIsJumping(false);
    }, 550);
  }, [isJumping, soundEnabled]);

  // Keyboard controls
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
        e.preventDefault();
        const optIdx = parseInt(e.key, 10) - 1;
        if (selectedOption === null && currentQuestion && optIdx < 4) {
          handleAnswerOption(optIdx);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [screen, isPaused, selectedOption, currentQuestion, triggerJump]);

  // ========================================================
  // GENERADOR ESTRICTO DE PREGUNTAS SEGÚN MATERIAL
  // ========================================================
  const buildQuestionsForWorld = (worldId: WorldId, count: number): GameQuestion[] => {
    let pool: GameQuestion[] = [];

    if (worldId === "paa") {
      pool = PAA_OFFICIAL_QUESTIONS.map((q, idx) => {
        let opts: [string, string, string, string] = ["A", "B", "C", "D"];
        if (q.options.length >= 4) {
          opts = [q.options[0], q.options[1], q.options[2], q.options[3]];
        } else if (q.options.length === 3) {
          opts = [q.options[0], q.options[1], q.options[2], "Ninguna de las anteriores"];
        }
        return {
          id: `paa-${idx}`,
          question: q.q,
          options: opts,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          topic: q.subtopic,
        };
      });
    } else if (worldId === "exani") {
      pool = EXANI_OFFICIAL_QUESTIONS.map((q, idx) => {
        let opts: [string, string, string, string] = ["A", "B", "C", "D"];
        if (q.options.length >= 4) {
          opts = [q.options[0], q.options[1], q.options[2], q.options[3]];
        } else if (q.options.length === 3) {
          opts = [q.options[0], q.options[1], q.options[2], "No aplica para este caso"];
        }
        return {
          id: `exani-${idx}`,
          question: q.q,
          options: opts,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          topic: q.subtopic,
        };
      });
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
            let opts: [string, string, string, string] = ["A", "B", "C", "D"];
            if (pq.options.length >= 4) {
              opts = [pq.options[0], pq.options[1], pq.options[2], pq.options[3]];
            } else if (pq.options.length === 3) {
              opts = [pq.options[0], pq.options[1], pq.options[2], "Opción adicional"];
            }
            pool.push({
              id: `${tp.id}-${idx}`,
              question: pq.question,
              options: opts,
              correctIndex: pq.correctIndex,
              explanation: pq.explanation || tp.explanation,
              topic: tp.name,
            });
          });
        });
      }
    }

    if (pool.length === 0) {
      // Robust fallback preguntas
      pool = [
        {
          id: "fb-1",
          question: "¿Cuál es el resultado de la operación 8 × 7?",
          options: ["54", "56", "58", "62"],
          correctIndex: 1,
          explanation: "8 × 7 = 56",
          topic: "Multiplicación",
        },
        {
          id: "fb-2",
          question: "¿Qué operación se resuelve PRIMERO según la jerarquía PEMDAS?",
          options: ["Sumas y restas", "Paréntesis", "Multiplicaciones", "Divisiones externas"],
          correctIndex: 1,
          explanation: "Primero se resuelven los paréntesis.",
          topic: "Jerarquía de Operaciones",
        },
        {
          id: "fb-3",
          question: "¿Cuál es el resultado de (-6) × (-4)?",
          options: ["-24", "-10", "24", "10"],
          correctIndex: 2,
          explanation: "Signos iguales multiplicados dan positivo (- × - = +).",
          topic: "Leyes de Signos",
        },
        {
          id: "fb-4",
          question: "Cualquier número multiplicado por cero es igual a:",
          options: ["1", "Infinito", "0", "El mismo número"],
          correctIndex: 2,
          explanation: "a × 0 = 0.",
          topic: "Propiedad del Cero",
        },
        {
          id: "fb-5",
          question: "¿Cuál es el valor de x en: 2x = 10?",
          options: ["2", "5", "8", "20"],
          correctIndex: 1,
          explanation: "x = 10 / 2 = 5.",
          topic: "Ecuaciones Lineales",
        },
      ];
    }

    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  // ========================================================
  // INICIAR PARTIDA
  // ========================================================
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
      const toastId = toast.loading("Analizando tus apuntes y creando Smart Escape con IA...");
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
        questions = aiQuestions.map((q, idx) => {
          let opts: [string, string, string, string] = ["A", "B", "C", "D"];
          if (q.options.length >= 4) {
            opts = [q.options[0], q.options[1], q.options[2], q.options[3]];
          } else if (q.options.length === 3) {
            opts = [q.options[0], q.options[1], q.options[2], "Opción D"];
          }
          return {
            id: `ai-${idx}`,
            question: q.question,
            options: opts,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
            topic: analysis.title || "Apuntes",
          };
        });
        toast.success("¡Preguntas listas!", { id: toastId });
      } catch {
        toast.error("Error al generar con IA. Usando temas del material.");
        questions = buildQuestionsForWorld("math", lvlConfig.reqQuestions);
      } finally {
        setIsGeneratingAi(false);
      }
    } else {
      questions = buildQuestionsForWorld(worldId, lvlConfig.reqQuestions);
    }

    if (questions.length === 0) {
      questions = buildQuestionsForWorld("math", lvlConfig.reqQuestions);
    }

    // Inicializar estado del juego
    setQuestionsPool(questions);
    setCurrentQIndex(0);
    setCurrentQuestion(questions[0]);
    setQTimer(lvlConfig.timePerQ);
    setQTimerMax(lvlConfig.timePerQ);
    setSelectedOption(null);
    setAnswerFeedback(null);

    setLives(3);
    setPlayerLane(1);
    setIsJumping(false);
    setPlayerDistanceMeters(0);
    setCreatureDistanceMeters(45);
    setPlayerSpeed(1.0);
    setGameXp(0);
    setCollectedCoins(0);
    setCollectedStars(0);
    setCorrectAnswersCount(0);
    setWrongAnswersCount(0);
    setStreak(0);
    setMaxStreak(0);
    setTimeElapsed(0);
    setIsPaused(false);
    setActiveTurboTime(0);
    setHasShield(false);
    setActiveMagnetTime(0);
    setActiveFreezeTime(0);

    setScreen("playing");
  };

  // ========================================================
  // CUENTA REGRESIVA DE PREGUNTAS (TICKER)
  // ========================================================
  useEffect(() => {
    if (screen !== "playing" || isPaused || selectedOption !== null) return;

    timerIntervalRef.current = setInterval(() => {
      setQTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerIntervalRef.current);
  }, [screen, isPaused, selectedOption, currentQuestion]);

  const handleTimeOut = () => {
    if (selectedOption !== null || !currentQuestion) return;
    handleAnswerOption(-1); // Timeout
  };

  // ========================================================
  // RESPUESTA DE PREGUNTA & EFECTOS EN GAMEPLAY
  // ========================================================
  const handleAnswerOption = (optionIndex: number) => {
    if (selectedOption !== null || !currentQuestion) return;
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
      setGameXp((xp) => xp + 50 + streak * 10);
      setCollectedCoins((c) => c + 2);

      // Boost inmediato de velocidad y la criatura retrocede
      setPlayerSpeed((sp) => Math.min(2.5, sp + 0.4));
      setCreatureDistanceMeters((dist) => Math.min(75, dist + 18));
      toast.success("¡CORRECTO! ⚡ +50 XP y velocidad aumentada", { duration: 1200 });
    } else {
      if (hasShield) {
        setHasShield(false);
        setAnswerFeedback("correct");
        toast.info("🛡️ ¡El Escudo absorbió el fallo!");
      } else {
        playSfx("wrong");
        setAnswerFeedback("wrong");
        setWrongAnswersCount((w) => w + 1);
        setStreak(0);
        setLives((l) => Math.max(0, l - 1));

        // Personaje pierde velocidad y la criatura se acerca
        setPlayerSpeed(0.6);
        setCreatureDistanceMeters((dist) => {
          const next = dist - 20;
          if (next <= 0) {
            triggerGameOver();
            return 0;
          }
          return next;
        });

        toast.error("❌ ¡Incorrecto! La criatura se acerca...", { duration: 1200 });
      }
    }

    // Verificar si se acabaron las vidas
    if (!isCorrect && !hasShield && lives <= 1) {
      setTimeout(() => {
        triggerGameOver();
      }, 800);
      return;
    }

    // Avanzar a la siguiente pregunta automáticamente tras 1 segundo
    setTimeout(() => {
      const nextIdx = currentQIndex + 1;
      if (nextIdx >= questionsPool.length) {
        // Meta alcanzada
        triggerVictory();
      } else {
        setCurrentQIndex(nextIdx);
        setCurrentQuestion(questionsPool[nextIdx]);
        setQTimer(lvlConfig.timePerQ);
        setQTimerMax(lvlConfig.timePerQ);
        setSelectedOption(null);
        setAnswerFeedback(null);
      }
    }, 1100);
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

    const accuracy = questionsPool.length > 0 ? (correctAnswersCount / questionsPool.length) * 100 : 100;
    const stars = accuracy >= 85 ? 3 : accuracy >= 60 ? 2 : 1;

    const key = `${selectedWorld}-${selectedLevel}`;
    const newStars = { ...levelStars, [key]: Math.max(levelStars[key] || 0, stars) };
    setLevelStars(newStars);
    if (typeof window !== "undefined") {
      localStorage.setItem("smart_escape_level_stars", JSON.stringify(newStars));
    }

    const newCoinBal = coinsBalance + earnedCoins;
    setCoinsBalance(newCoinBal);
    if (typeof window !== "undefined") {
      localStorage.setItem("smart_escape_coins", newCoinBal.toString());
    }

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

    interface TrackItem {
      lane: number;
      z: number; // 0 (horizon) to 1 (near)
      type: "coin" | "star" | "obstacle" | "turbo" | "shield" | "freeze";
    }

    let trackItems: TrackItem[] = [
      { lane: 0, z: 0.2, type: "coin" },
      { lane: 1, z: 0.4, type: "obstacle" },
      { lane: 2, z: 0.6, type: "star" },
      { lane: 1, z: 0.85, type: "turbo" },
    ];

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = Math.min(0.1, (timestamp - lastTimeRef.current) / 1000);
      lastTimeRef.current = timestamp;

      if (!isPaused) {
        const effectiveSpeed = activeTurboTime > 0 ? playerSpeed * 1.5 : playerSpeed;
        setPlayerDistanceMeters((d) => d + effectiveSpeed * 14 * dt);
        setTimeElapsed((t) => t + dt);

        // Criatura aproximándose si no está congelada
        if (activeFreezeTime <= 0) {
          const creatureApproach = lvlConfig.creatureSpeed * (effectiveSpeed < 1 ? 4.5 : 1.8) * dt;
          setCreatureDistanceMeters((dist) => {
            const next = dist - creatureApproach;
            if (next <= 0) {
              triggerGameOver();
              return 0;
            }
            return next;
          });
        }

        // Power-ups temporizadores
        if (activeTurboTime > 0) setActiveTurboTime((t) => Math.max(0, t - dt));
        if (activeMagnetTime > 0) setActiveMagnetTime((t) => Math.max(0, t - dt));
        if (activeFreezeTime > 0) setActiveFreezeTime((t) => Math.max(0, t - dt));

        // Desplazamiento de carretera
        roadOffset += effectiveSpeed * 400 * dt;
        if (roadOffset > 1000) roadOffset = 0;

        // Desplazar objetos en la pista
        trackItems.forEach((item) => {
          item.z += effectiveSpeed * 0.48 * dt;

          // Magnet
          if (activeMagnetTime > 0 && (item.type === "coin" || item.type === "star")) {
            item.lane += (playerLane - item.lane) * 0.15;
          }

          // Colisión con el jugador
          if (item.z >= 0.92 && item.z <= 1.06) {
            if (Math.round(item.lane) === playerLane) {
              if (item.type === "coin") {
                playSfx("coin");
                setCollectedCoins((c) => c + 1);
                setGameXp((xp) => xp + 15);
                item.z = 2;
              } else if (item.type === "star") {
                playSfx("star");
                setCollectedStars((s) => s + 1);
                setGameXp((xp) => xp + 40);
                item.z = 2;
              } else if (item.type === "turbo") {
                playSfx("turbo");
                setActiveTurboTime(4);
                item.z = 2;
              } else if (item.type === "shield") {
                setHasShield(true);
                item.z = 2;
              } else if (item.type === "freeze") {
                playSfx("freeze");
                setActiveFreezeTime(4);
                item.z = 2;
              } else if (item.type === "obstacle") {
                if (!isJumping) {
                  if (hasShield) {
                    setHasShield(false);
                    item.z = 2;
                    toast.info("🛡️ ¡Escudo absorbió el choque!");
                  } else {
                    playSfx("wrong");
                    setPlayerSpeed(0.65);
                    setCreatureDistanceMeters((d) => Math.max(1, d - 8));
                    setLives((l) => Math.max(0, l - 1));
                    item.z = 2;
                  }
                }
              }
            }
          }
        });

        // Filtrar y reaparecer
        trackItems = trackItems.filter((it) => it.z < 1.15);
        if (trackItems.length < 4) {
          const types: TrackItem["type"][] = ["coin", "coin", "star", "obstacle", "turbo", "shield", "freeze"];
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
      // RENDERIZADO VISUAL DEL CANVAS
      // ==========================================
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Horizonte y cielo
      const horizonY = h * 0.38;
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      skyGrad.addColorStop(0, "#020617");
      skyGrad.addColorStop(1, theme.trackColor);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, horizonY);

      // Cuadrícula Neón en el fondo
      ctx.strokeStyle = theme.gridColor;
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = 0.25;
      for (let i = 0; i < w; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(w / 2, horizonY);
        ctx.stroke();
      }
      ctx.globalAlpha = 1.0;

      // Carretera 3D
      const roadTopW = w * 0.25;
      const roadBottomW = w * 0.92;
      const roadTopX = (w - roadTopW) / 2;
      const roadBottomX = (w - roadBottomW) / 2;

      const roadGrad = ctx.createLinearGradient(0, horizonY, 0, h);
      roadGrad.addColorStop(0, "#090d16");
      roadGrad.addColorStop(1, "#030712");
      ctx.fillStyle = roadGrad;
      ctx.beginPath();
      ctx.moveTo(roadTopX, horizonY);
      ctx.lineTo(roadTopX + roadTopW, horizonY);
      ctx.lineTo(roadBottomX + roadBottomW, h);
      ctx.lineTo(roadBottomX, h);
      ctx.closePath();
      ctx.fill();

      // Bordes exteriores Neón
      ctx.strokeStyle = theme.gridColor;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = theme.gridColor;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(roadTopX, horizonY);
      ctx.lineTo(roadBottomX, h);
      ctx.moveTo(roadTopX + roadTopW, horizonY);
      ctx.lineTo(roadBottomX + roadBottomW, h);
      ctx.stroke();

      // Líneas divisorias de los 3 carriles
      const lane1Top = roadTopX + roadTopW * 0.33;
      const lane1Bot = roadBottomX + roadBottomW * 0.33;
      const lane2Top = roadTopX + roadTopW * 0.66;
      const lane2Bot = roadBottomX + roadBottomW * 0.66;

      ctx.lineWidth = 1.5;
      ctx.setLineDash([10, 10]);
      ctx.lineDashOffset = -roadOffset;
      ctx.beginPath();
      ctx.moveTo(lane1Top, horizonY);
      ctx.lineTo(lane1Bot, h);
      ctx.moveTo(lane2Top, horizonY);
      ctx.lineTo(lane2Bot, h);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      // Meta a lo lejos (Finish Line Banner)
      const progressToGoal = Math.min(1, (currentQIndex + 1) / Math.max(1, questionsPool.length));
      if (progressToGoal > 0.8) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(roadTopX - 10, horizonY - 14, roadTopW + 20, 8);
        ctx.fillStyle = "#10b981";
        ctx.font = "bold 8px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🏁 META", w / 2, horizonY - 7);
      }

      // Dibujar Objetos en pista (ordenados por profundidad Z)
      const sortedItems = [...trackItems].sort((a, b) => a.z - b.z);
      sortedItems.forEach((item) => {
        const itemY = horizonY + (h - horizonY) * item.z;
        const currentRoadW = roadTopW + (roadBottomW - roadTopW) * item.z;
        const currentRoadX = (w - currentRoadW) / 2;
        const laneWidth = currentRoadW / 3;
        const itemX = currentRoadX + laneWidth * item.lane + laneWidth / 2;
        const scale = 0.35 + item.z * 0.75;

        ctx.save();
        ctx.translate(itemX, itemY);
        ctx.scale(scale, scale);

        if (item.type === "coin") {
          ctx.fillStyle = "#facc15";
          ctx.beginPath();
          ctx.arc(0, -10, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ca8a04";
          ctx.font = "bold 11px sans-serif";
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
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(-18, -18, 36, 12);
          ctx.fillStyle = "#fca5a5";
          ctx.fillRect(-14, -16, 28, 8);
          ctx.fillStyle = "#991b1b";
          ctx.fillRect(-16, -6, 6, 6);
          ctx.fillRect(10, -6, 6, 6);
        }
        ctx.restore();
      });

      // ==========================================
      // DIBUJAR PERSONAJE DEL JUGADOR
      // ==========================================
      const playerZ = 0.95;
      const playerRoadW = roadTopW + (roadBottomW - roadTopW) * playerZ;
      const playerRoadX = (w - playerRoadW) / 2;
      const pLaneW = playerRoadW / 3;
      const targetPlayerX = playerRoadX + pLaneW * playerLane + pLaneW / 2;
      const playerBaseY = h - 45 - (isJumping ? 55 : 0);

      // Sombra
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.beginPath();
      ctx.ellipse(targetPlayerX, h - 38, 20, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Aura Turbo / Escudo
      if (activeTurboTime > 0) {
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.ellipse(targetPlayerX, playerBaseY + 8, 24, 30, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      if (hasShield) {
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(targetPlayerX, playerBaseY + 8, 26, 32, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Personaje Runner
      const equippedOutfit = CLOSET_ITEMS.find((c) => c.id === equippedItems.outfit) || CLOSET_ITEMS[4];
      const equippedHair = CLOSET_ITEMS.find((c) => c.id === equippedItems.hair) || CLOSET_ITEMS[0];

      ctx.save();
      ctx.translate(targetPlayerX, playerBaseY);

      const legOffset = Math.sin(timestamp * 0.015) * 5;

      // Piernas y tenis
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(-7, 16 + legOffset, 5, 10);
      ctx.fillRect(2, 16 - legOffset, 5, 10);
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(-8, 24 + legOffset, 7, 5);
      ctx.fillRect(1, 24 - legOffset, 7, 5);

      // Torso y Traje
      ctx.fillStyle = equippedOutfit.color;
      ctx.beginPath();
      ctx.roundRect(-10, 0, 20, 18, 4);
      ctx.fill();

      // Cabeza y Rostro
      ctx.fillStyle = "#fcd34d";
      ctx.beginPath();
      ctx.arc(0, -7, 9, 0, Math.PI * 2);
      ctx.fill();

      // Pelo
      ctx.fillStyle = equippedHair.color;
      ctx.beginPath();
      ctx.arc(0, -10, 10, Math.PI, Math.PI * 2);
      ctx.fill();

      // Ojos
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(-3.5, -7, 2, 2);
      ctx.fillRect(1.5, -7, 2, 2);

      ctx.restore();

      // ==========================================
      // DIBUJAR PERSEGUIDOR (CRIATURA DETRÁS)
      // ==========================================
      const creatureZ = Math.max(0.08, 1 - creatureDistanceMeters / 55);
      const cRoadW = roadTopW + (roadBottomW - roadTopW) * creatureZ;
      const cRoadX = (w - cRoadW) / 2;
      const cX = cRoadX + cRoadW / 2;
      const cY = horizonY + (h - horizonY) * creatureZ;
      const cScale = 0.35 + creatureZ * 0.85;

      ctx.save();
      ctx.translate(cX, cY - 16);
      ctx.scale(cScale, cScale);

      // Efecto congelado
      if (activeFreezeTime > 0) {
        ctx.fillStyle = "rgba(56, 189, 248, 0.4)";
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2;
        ctx.strokeRect(-22, -22, 44, 44);
        ctx.fillRect(-22, -22, 44, 44);
      }

      // Cuerpo monstruoso
      ctx.fillStyle = theme.monsterColor;
      ctx.shadowColor = theme.monsterColor;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Ojos brillantes
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(-7, -3, 5, 0, Math.PI * 2);
      ctx.arc(7, -3, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(-7, -3, 2.5, 0, Math.PI * 2);
      ctx.arc(7, -3, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Dientes
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(-8, 6);
      ctx.lineTo(-4, 12);
      ctx.lineTo(0, 6);
      ctx.lineTo(4, 12);
      ctx.lineTo(8, 6);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      animFrameIdRef.current = requestAnimationFrame(gameLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [screen, isPaused, selectedWorld, selectedLevel, playerLane, isJumping, playerSpeed, activeTurboTime, hasShield, activeMagnetTime, activeFreezeTime, creatureDistanceMeters, currentQIndex, questionsPool.length]);

  const handleBuyItem = (item: CustomizationItem) => {
    if (coinsBalance < item.cost) {
      toast.error("¡Monedas insuficientes! Gana más en las carreras.");
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
  const timerPercentage = qTimerMax > 0 ? (qTimer / qTimerMax) * 100 : 0;

  return (
    <div className="fixed inset-0 w-full h-full max-h-screen bg-slate-950 text-foreground flex flex-col font-sans select-none overflow-hidden">
      {/* ======================================================== */}
      {/* 1. LOBBY PRINCIPAL */}
      {/* ======================================================== */}
      {screen === "home" && (
        <div className="flex-1 w-full h-full overflow-y-auto p-4 md:p-6 flex flex-col justify-between max-w-lg mx-auto animate-fade-in">
          <div className="space-y-4 text-center">
            {/* Top Bar */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate({ to: "/games" })}
                className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition cursor-pointer"
              >
                <ArrowLeft className="size-4" />
                <span>Volver a Juegos</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-muted-foreground hover:text-foreground"
                >
                  {soundEnabled ? <Volume2 className="size-4 text-emerald-400" /> : <VolumeX className="size-4" />}
                </button>
                <div className="flex items-center gap-1 bg-gold/15 border border-gold/30 px-3 py-1 rounded-full text-xs font-bold text-gold-foreground">
                  <img src={streakCap} alt="" className="size-3.5" />
                  <span>{coinsBalance}</span>
                </div>
              </div>
            </div>

            {/* Logo */}
            <div className="pt-2 space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-black uppercase tracking-widest">
                <span>✨ Videojuego Premium Educativo</span>
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
                SMART ESCAPE
              </h1>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                ¡Corre, esquiva obstáculos y responde antes de que la criatura te alcance!
              </p>
            </div>

            {/* Avatar Podium Card */}
            <div className="relative rounded-3xl border border-purple-500/30 bg-gradient-to-b from-slate-900 via-purple-950/20 to-slate-900 p-5 shadow-xl overflow-hidden">
              <div className="absolute top-3 right-3">
                <button
                  onClick={() => setScreen("closet")}
                  className="flex items-center gap-1 bg-purple-500/20 border border-purple-500/30 text-purple-300 px-3 py-1.5 rounded-2xl text-xs font-bold hover:bg-purple-500/30 transition cursor-pointer"
                >
                  <Shirt className="size-3.5" />
                  <span>Armario</span>
                </button>
              </div>

              <div className="py-4 flex flex-col items-center justify-center">
                <div className="size-24 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shadow-inner">
                  <span className="text-5xl animate-bounce">🏃</span>
                </div>
                <span className="mt-2 text-xs font-bold text-cyan-400">Runner Personalizado</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-4">
            <button
              onClick={() => setScreen("world_select")}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 text-white font-display text-base font-black flex items-center justify-center gap-3 shadow-lg shadow-purple-500/30 hover:brightness-110 active:scale-95 transition cursor-pointer"
            >
              <Play className="size-5 fill-white" />
              <span>JUGAR SMART ESCAPE</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setScreen("closet")}
                className="h-11 rounded-2xl border border-slate-800 bg-slate-900 hover:border-purple-500/40 text-foreground text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Shirt className="size-4 text-purple-400" />
                <span>Personalizar</span>
              </button>

              <button
                onClick={() => {
                  setSelectedWorld("custom");
                  setScreen("upload");
                }}
                className="h-11 rounded-2xl border border-slate-800 bg-slate-900 hover:border-cyan-500/40 text-foreground text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Upload className="size-4 text-cyan-400" />
                <span>Subir Apuntes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. SELECCIÓN DE MUNDO / MATERIA */}
      {/* ======================================================== */}
      {screen === "world_select" && (
        <div className="flex-1 w-full h-full overflow-y-auto p-4 md:p-6 max-w-lg mx-auto space-y-4 animate-fade-in">
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

          <div>
            <h2 className="font-display text-xl font-bold text-foreground">Elige la Materia o Escenario</h2>
            <p className="text-xs text-muted-foreground">Cada mundo tiene su propio entorno visual y criatura perseguidora:</p>
          </div>

          <div className="grid grid-cols-1 gap-2.5 pb-12">
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
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MAPA DE NIVELES */}
      {/* ======================================================== */}
      {screen === "level_map" && (
        <div className="flex-1 w-full h-full overflow-y-auto p-4 md:p-6 max-w-lg mx-auto space-y-4 animate-fade-in">
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

          <div className="p-4 rounded-3xl border border-purple-500/30 bg-purple-950/30 flex items-center gap-3">
            <span className="text-3xl">{currentTheme.icon}</span>
            <div>
              <h3 className="text-sm font-bold text-foreground">{currentTheme.name}</h3>
              <p className="text-[11px] text-muted-foreground">
                Perseguidor: <strong className="text-rose-400">{currentTheme.monsterName}</strong> {currentTheme.monsterEmoji}
              </p>
            </div>
          </div>

          <div className="space-y-3 pb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-0.5 block">
              Selecciona tu Nivel:
            </span>

            {LEVELS_CONFIG.map((lvl) => {
              const starKey = `${selectedWorld}-${lvl.level}`;
              const stars = levelStars[starKey] || 0;
              return (
                <div
                  key={lvl.level}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-2.5 hover:border-cyan-500/40 transition"
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
                    className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer hover:brightness-110"
                  >
                    <Play className="size-3.5 fill-current" />
                    <span>Iniciar Carrera (Nivel {lvl.level})</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. SUBIR APUNTES CON IA */}
      {/* ======================================================== */}
      {screen === "upload" && (
        <div className="flex-1 w-full h-full overflow-y-auto p-4 md:p-6 max-w-lg mx-auto space-y-4 animate-fade-in">
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
                  El juego creará preguntas basadas <strong>únicamente</strong> en este documento.
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
                        toast.error("Error al extraer texto.", { id: toastId });
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
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. PANTALLA COMPLETA DE PARTIDA (RUNNER + HUD + PREGUNTAS) */}
      {/* 100% VISIBLE SIN SCROLL EN CUALQUIER DISPOSITIVO */}
      {/* ======================================================== */}
      {screen === "playing" && (
        <div className="flex-1 w-full h-full max-h-screen flex flex-col justify-between overflow-hidden bg-slate-950 relative select-none">
          {/* ========================================== */}
          {/* PARTE SUPERIOR: STATS, VIDAS & RADAR */}
          {/* ========================================== */}
          <header className="h-12 w-full shrink-0 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur px-3 flex items-center justify-between gap-2 z-30">
            {/* Vidas & XP */}
            <div className="flex items-center gap-2.5">
              {/* Hearts */}
              <div className="flex items-center gap-0.5" title="Vidas">
                {[1, 2, 3].map((hIdx) => (
                  <Heart
                    key={hIdx}
                    className={`size-4 ${
                      hIdx <= lives ? "fill-rose-500 text-rose-500 animate-pulse" : "text-slate-700"
                    }`}
                  />
                ))}
              </div>

              {/* XP */}
              <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1">
                <Star className="size-3 fill-cyan-400" />
                <span>{gameXp} XP</span>
              </span>

              {/* Coins */}
              <span className="text-[11px] font-bold text-gold-foreground flex items-center gap-1">
                <img src={streakCap} alt="" className="size-3" />
                <span>{collectedCoins}</span>
              </span>
            </div>

            {/* Radar Center: Distancia Jugador <-> Monstruo */}
            <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded-full text-[10px] font-bold">
              <span className="text-cyan-400">🏃 {Math.round(playerDistanceMeters)}m</span>
              <span className="text-slate-600">|</span>
              <span
                className={`flex items-center gap-1 ${
                  creatureDistanceMeters < 15 ? "text-rose-400 font-black animate-pulse" : "text-amber-400"
                }`}
              >
                <span>{currentTheme.monsterEmoji}</span>
                <span>{Math.round(creatureDistanceMeters)}m</span>
              </span>
            </div>

            {/* Tiempo & Pausa */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-muted-foreground font-mono">
                ⏱️ {Math.floor(timeElapsed / 60)}:{(Math.floor(timeElapsed) % 60).toString().padStart(2, "0")}
              </span>
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="size-7 rounded-lg bg-slate-800 grid place-items-center text-slate-300 hover:text-white"
              >
                {isPaused ? <Play className="size-3 fill-current" /> : <Pause className="size-3" />}
              </button>
            </div>
          </header>

          {/* ========================================== */}
          {/* CENTRO: ESCENARIO RUNNER 3D CANVAS */}
          {/* ========================================== */}
          <div className="flex-1 w-full min-h-[160px] max-h-[38vh] md:max-h-[44vh] relative overflow-hidden bg-slate-950">
            <canvas ref={canvasRef} width={420} height={280} className="w-full h-full object-cover block" />

            {/* Alerta de Perseguidor cuando está muy cerca */}
            {creatureDistanceMeters < 16 && (
              <div className="absolute top-2 inset-x-3 pointer-events-none z-20">
                <div className="bg-rose-500/25 border border-rose-500/50 text-rose-300 text-[10px] font-black px-3 py-0.5 rounded-full flex items-center justify-center gap-1.5 animate-pulse backdrop-blur">
                  <AlertTriangle className="size-3" />
                  <span>¡{currentTheme.monsterName} ESTÁ A {Math.round(creatureDistanceMeters)} METROS!</span>
                </div>
              </div>
            )}
          </div>

          {/* ========================================== */}
          {/* PARTE INFERIOR: PREGUNTA, OPCIONES & TIMER */}
          {/* ========================================== */}
          <div className="w-full shrink-0 border-t border-slate-800/80 bg-slate-900/95 backdrop-blur px-3 pt-2.5 pb-3 space-y-2 z-30 max-w-xl mx-auto">
            {/* Header de la Pregunta + Temporizador */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                Pregunta {currentQIndex + 1} de {questionsPool.length}
              </span>

              {/* Countdown Timer */}
              <div className="flex items-center gap-1.5 font-bold">
                <Clock className="size-3.5 text-amber-400" />
                <span className={`text-xs font-mono ${qTimer <= 3 ? "text-rose-400 font-black animate-pulse" : "text-amber-400"}`}>
                  {qTimer}s
                </span>
              </div>
            </div>

            {/* Barra de tiempo de la pregunta */}
            <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  qTimer <= 3 ? "bg-rose-500" : "bg-gradient-to-r from-purple-500 to-cyan-400"
                }`}
                style={{ width: `${timerPercentage}%` }}
              />
            </div>

            {/* Texto de la Pregunta */}
            {currentQuestion ? (
              <h3 className="text-xs font-bold text-foreground leading-snug px-1 line-clamp-2 min-h-[32px] flex items-center">
                {currentQuestion.question}
              </h3>
            ) : (
              <div className="text-xs text-muted-foreground italic min-h-[32px] flex items-center">
                Cargando siguiente pregunta...
              </div>
            )}

            {/* 4 Opciones de Respuesta en Cuadrícula 2x2 */}
            {currentQuestion && (
              <div className="grid grid-cols-2 gap-1.5">
                {currentQuestion.options.map((opt, idx) => {
                  const letters = ["A", "B", "C", "D"];
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === currentQuestion.correctIndex;

                  let optClass = "border-slate-800 bg-slate-950/80 text-foreground hover:border-purple-500/40";
                  if (selectedOption !== null) {
                    if (isCorrect) {
                      optClass = "border-emerald-500 bg-emerald-500/25 text-emerald-300 font-bold";
                    } else if (isSelected) {
                      optClass = "border-rose-500 bg-rose-500/25 text-rose-300 font-bold";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={selectedOption !== null}
                      onClick={() => handleAnswerOption(idx)}
                      className={`p-2 rounded-xl border text-left text-[11px] leading-tight transition active:scale-95 cursor-pointer flex items-center gap-2 ${optClass}`}
                    >
                      <span className="size-5 rounded-lg bg-slate-800/80 font-black text-[10px] grid place-items-center shrink-0">
                        {letters[idx]}
                      </span>
                      <span className="line-clamp-2 flex-1">{opt}</span>
                      {selectedOption !== null && isCorrect && (
                        <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Controles de Movimiento en Pantalla (◀, ▶, SALTAR) */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex gap-1.5">
                <button
                  onClick={() => setPlayerLane((p) => Math.max(0, p - 1))}
                  className="size-11 rounded-xl bg-slate-800 border border-slate-700 active:bg-purple-600 text-white font-black text-sm flex items-center justify-center transition active:scale-90 cursor-pointer"
                  title="Mover Izquierda (A)"
                >
                  ◀
                </button>
                <button
                  onClick={() => setPlayerLane((p) => Math.min(2, p + 1))}
                  className="size-11 rounded-xl bg-slate-800 border border-slate-700 active:bg-purple-600 text-white font-black text-sm flex items-center justify-center transition active:scale-90 cursor-pointer"
                  title="Mover Derecha (D)"
                >
                  ▶
                </button>
              </div>

              <button
                onClick={triggerJump}
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 active:brightness-125 text-white font-display text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer"
                title="Saltar (Espacio / W)"
              >
                <ArrowUp className="size-3.5" />
                <span>SALTAR</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. PANTALLA DE DERROTA (💀 TE ALCANZARON) */}
      {/* ======================================================== */}
      {screen === "gameover" && (
        <div className="flex-1 w-full h-full overflow-y-auto p-4 md:p-6 max-w-md mx-auto flex flex-col justify-center text-center space-y-5 animate-fade-in">
          <div className="space-y-1">
            <span className="text-5xl animate-bounce block">💀</span>
            <h2 className="font-display text-2xl font-black text-rose-500">¡Te alcanzaron!</h2>
            <p className="text-xs text-muted-foreground">
              {currentTheme.monsterName} corrió más rápido esta vez. ¡Repasa tus conceptos y vuelve a escapar!
            </p>
          </div>

          <div className="p-4 rounded-3xl border border-slate-800 bg-slate-900 space-y-2 text-xs text-left">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-muted-foreground">Distancia recorrida:</span>
              <span className="font-bold text-foreground">{Math.round(playerDistanceMeters)} metros</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-muted-foreground">Preguntas acertadas:</span>
              <span className="font-bold text-emerald-400">{correctAnswersCount} correctas</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Monedas ganadas:</span>
              <span className="font-bold text-gold-foreground">+{collectedCoins} 🪙</span>
            </div>
          </div>

          <div className="space-y-2">
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
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. PANTALLA DE VICTORIA (🏁 ESCAPE EXITOSO) */}
      {/* ======================================================== */}
      {screen === "victory" && (
        <div className="flex-1 w-full h-full overflow-y-auto p-4 md:p-6 max-w-md mx-auto flex flex-col justify-center text-center space-y-5 animate-fade-in">
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1 text-amber-400">
              <Star className="size-7 fill-amber-400" />
              <Star className="size-9 fill-amber-400 animate-pulse" />
              <Star className="size-7 fill-amber-400" />
            </div>
            <h2 className="font-display text-2xl font-black bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              ¡ESCAPE EXITOSO! 🏆
            </h2>
            <p className="text-xs text-muted-foreground">
              ¡Has escapado de {currentTheme.monsterName} y completado el Nivel {selectedLevel}!
            </p>
          </div>

          <div className="p-4 rounded-3xl border border-emerald-500/30 bg-emerald-950/20 space-y-2 text-xs text-left">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-muted-foreground">⭐ Experiencia:</span>
              <span className="font-bold text-cyan-400">+{currentLvlConfig.bonusXp + correctAnswersCount * 25} XP</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-muted-foreground">🪙 Monedas:</span>
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

          <div className="space-y-2">
            {selectedLevel < 4 && (
              <button
                onClick={() => startGame(selectedWorld, selectedLevel + 1)}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
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
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. ARMARIO / TIENDA DE PERSONALIZACIÓN */}
      {/* ======================================================== */}
      {screen === "closet" && (
        <div className="flex-1 w-full h-full overflow-y-auto p-4 md:p-6 max-w-lg mx-auto space-y-4 animate-fade-in">
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

          <div>
            <h2 className="font-display text-xl font-bold">Armario y Personalización</h2>
            <p className="text-xs text-muted-foreground">Desbloquea atuendos con las monedas ganadas en tus carreras:</p>
          </div>

          <div className="space-y-2.5 pb-12">
            {CLOSET_ITEMS.map((item) => {
              const isUnlocked = unlockedClosetIds.includes(item.id);
              const isEquipped = (equippedItems as any)[item.category] === item.id;

              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                    isEquipped ? "border-purple-500 bg-purple-500/10" : "border-slate-800 bg-slate-900"
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
        </div>
      )}
    </div>
  );
}
