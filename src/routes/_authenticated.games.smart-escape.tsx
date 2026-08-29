import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { rewardGameCoins, rewardGameXp } from "@/lib/games.functions";
import { extractTextFromMedia } from "@/lib/quiz.functions";
import { analyzeStudyMaterial, generateStudyGameQuestions } from "@/lib/study-game.functions";
import { SCHOOL_SUBJECTS, type SchoolSubject, type SubjectTopic } from "@/lib/school-subjects-data";
import { PAA_OFFICIAL_QUESTIONS } from "@/lib/paa-official-bank";
import { EXANI_OFFICIAL_QUESTIONS } from "@/lib/exani-official-bank";
import {
  ArrowLeft, Flame, Trophy, Sparkles, RotateCcw, Volume2, VolumeX,
  Play, Pause, Zap, Shield, Clock, Magnet, Snowflake, CheckCircle2,
  XCircle, Award, GraduationCap, ChevronRight, Upload, Shirt,
  Lock, Check, Star, RefreshCw, BookOpen, AlertTriangle, ArrowUp,
  Heart, AlertCircle, FileText, PlusCircle
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
export type WorldId = "quimica" | "matematicas" | "biologia" | "historia" | "ingles" | "paa" | "exani" | "custom";

export interface GameQuestion {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  topic: string;
  sourceExcerpt?: string;
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
  sceneryItem: string; // 'tree' | 'pillar' | 'lab' | 'crystal'
  monsterName: string;
  monsterEmoji: string;
  monsterColor: string;
}

const WORLDS: Record<WorldId, WorldTheme> = {
  quimica: {
    id: "quimica",
    name: "Laboratorio Neón",
    icon: "🧪",
    badge: "Química",
    desc: "Materia, estados de agregación, mezclas y reacciones.",
    trackColor: "#062817",
    gridColor: "#10b981",
    skyColor: "#021209",
    sceneryItem: "lab",
    monsterName: "Nebulón Químico",
    monsterEmoji: "🧪",
    monsterColor: "#10b981",
  },
  matematicas: {
    id: "matematicas",
    name: "Cyber Matrix",
    icon: "🔢",
    badge: "Matemáticas",
    desc: "Operaciones básicas, jerarquía PEMDAS, fracciones y álgebra.",
    trackColor: "#0f172a",
    gridColor: "#38bdf8",
    skyColor: "#030712",
    sceneryItem: "pillar",
    monsterName: "Gorgon Glitch",
    monsterEmoji: "👾",
    monsterColor: "#06b6d4",
  },
  biologia: {
    id: "biologia",
    name: "Microcosmos Celular",
    icon: "🧬",
    badge: "Biología",
    desc: "La célula, fotosíntesis, ADN y biodiversidad.",
    trackColor: "#290c29",
    gridColor: "#ec4899",
    skyColor: "#110211",
    sceneryItem: "tree",
    monsterName: "Virus Voraz",
    monsterEmoji: "🦠",
    monsterColor: "#ec4899",
  },
  historia: {
    id: "historia",
    name: "Ruinas Ancestrales",
    icon: "🏛️",
    badge: "Historia",
    desc: "Culturas prehispánicas, Independencia y Revolución.",
    trackColor: "#271705",
    gridColor: "#f59e0b",
    skyColor: "#0f0701",
    sceneryItem: "pillar",
    monsterName: "Coloso del Tiempo",
    monsterEmoji: "🗿",
    monsterColor: "#f59e0b",
  },
  ingles: {
    id: "ingles",
    name: "Metrópolis Neón",
    icon: "🇬🇧",
    badge: "Inglés",
    desc: "Gramática, tiempos verbales y vocabulario clave.",
    trackColor: "#150d33",
    gridColor: "#a855f7",
    skyColor: "#080417",
    sceneryItem: "pillar",
    monsterName: "Grammar Phantom",
    monsterEmoji: "👻",
    monsterColor: "#a855f7",
  },
  paa: {
    id: "paa",
    name: "Simulador PAA College Board",
    icon: "🏆",
    badge: "Admisión Universitaria",
    desc: "Lectura crítica, redacción y razonamiento oficial.",
    trackColor: "#0a1931",
    gridColor: "#3b82f6",
    skyColor: "#030b17",
    sceneryItem: "pillar",
    monsterName: "Cronos PAA",
    monsterEmoji: "⚡",
    monsterColor: "#3b82f6",
  },
  exani: {
    id: "exani",
    name: "Simulador EXANI-II Ceneval",
    icon: "🎓",
    badge: "Admisión Ceneval 2025",
    desc: "Comprensión lectora, redacción indirecta y pensamiento matemático.",
    trackColor: "#1d0c33",
    gridColor: "#c084fc",
    skyColor: "#0b0314",
    sceneryItem: "pillar",
    monsterName: "Cénit Ceneval",
    monsterEmoji: "🔮",
    monsterColor: "#c084fc",
  },
  custom: {
    id: "custom",
    name: "Mis Apuntes y Documentos",
    icon: "✨",
    badge: "Material Subido",
    desc: "Preguntas generadas 100% sobre tu propio texto o PDF.",
    trackColor: "#170a31",
    gridColor: "#818cf8",
    skyColor: "#070211",
    sceneryItem: "pillar",
    monsterName: "Sombra del Examen",
    monsterEmoji: "😈",
    monsterColor: "#818cf8",
  },
};

const LEVELS_CONFIG = [
  { level: 1, name: "Principiante", reqQuestions: 5, targetDistance: 450, timePerQ: 10, creatureBaseSpeed: 0.85, bonusCoins: 5, bonusXp: 50 },
  { level: 2, name: "Explorador", reqQuestions: 8, targetDistance: 650, timePerQ: 8, creatureBaseSpeed: 1.0, bonusCoins: 10, bonusXp: 100 },
  { level: 3, name: "Experto", reqQuestions: 10, targetDistance: 850, timePerQ: 7, creatureBaseSpeed: 1.15, bonusCoins: 15, bonusXp: 175 },
  { level: 4, name: "Maestro", reqQuestions: 12, targetDistance: 1000, timePerQ: 5, creatureBaseSpeed: 1.35, bonusCoins: 25, bonusXp: 250 },
];

function SmartEscapeGame() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const rewardXpFn = useServerFn(rewardGameXp);
  const rewardCoinsFn = useServerFn(rewardGameCoins);
  const extractMediaFn = useServerFn(extractTextFromMedia);
  const analyzeMaterialFn = useServerFn(analyzeStudyMaterial);
  const generateQuestionsFn = useServerFn(generateStudyGameQuestions);

  // Vistas
  const [screen, setScreen] = useState<
    "home" | "world_select" | "material_select" | "level_map" | "upload" | "playing" | "gameover" | "victory" | "closet"
  >("home");

  // Configuración de partida
  const [selectedWorld, setSelectedWorld] = useState<WorldId>("quimica");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("materia-mezclas");
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
      return saved ? JSON.parse(saved) : { "quimica-1": 3, "matematicas-1": 2 };
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

  // Runner In-Game Metrics & Smooth Physics
  const [lives, setLives] = useState(3);
  const [playerLane, setPlayerLane] = useState<number>(1); // 0 = Left, 1 = Center, 2 = Right
  const [playerDistanceMeters, setPlayerDistanceMeters] = useState(0);
  const [creatureDistanceMeters, setCreatureDistanceMeters] = useState(48); // Distancia 0 a 70m
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

  // Smooth Movement Refs (Mutable for 60fps rendering without react state lag)
  const playerLaneRef = useRef<number>(1);
  const playerXRef = useRef<number>(0);
  const jumpYRef = useRef<number>(0);
  const jumpVelRef = useRef<number>(0);
  const isJumpingRef = useRef<boolean>(false);
  const currentSpeedRef = useRef<number>(1.0);
  const targetSpeedRef = useRef<number>(1.0);
  const creatureDistRef = useRef<number>(48);
  const distanceRef = useRef<number>(0);
  const screenShakeRef = useRef<number>(0);

  // Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<any>(null);

  // Sincronizar lane
  useEffect(() => {
    playerLaneRef.current = playerLane;
  }, [playerLane]);

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
        osc.frequency.setValueAtTime(260, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.16);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.16);
        osc.start();
        osc.stop(ctx.currentTime + 0.16);
      } else if (type === "coin") {
        osc.frequency.setValueAtTime(987.77, ctx.currentTime);
        osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.16);
        osc.start();
        osc.stop(ctx.currentTime + 0.16);
      } else if (type === "correct") {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16);
        osc.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.24);
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

  // Jump con física de arco suave
  const triggerJump = useCallback(() => {
    if (isJumpingRef.current) return;
    isJumpingRef.current = true;
    jumpVelRef.current = 420; // velocidad de impulso vertical
    playSfx("jump");
  }, [soundEnabled]);

  // Teclado
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

  // Identificar materiales guardados
  const getSubjectMaterials = (worldId: WorldId): SubjectTopic[] => {
    const subject = SCHOOL_SUBJECTS.find((s) => s.id === worldId);
    if (subject && subject.topics.length > 0) {
      return subject.topics;
    }
    return [];
  };

  // Generar preguntas estrictas
  const buildQuestionsFromMaterial = (
    worldId: WorldId,
    topicId: string,
    count: number
  ): GameQuestion[] => {
    let rawQuestions: GameQuestion[] = [];

    if (worldId === "paa") {
      rawQuestions = PAA_OFFICIAL_QUESTIONS.map((q, idx) => {
        const opts: [string, string, string, string] = [
          q.options[0] || "Opción A",
          q.options[1] || "Opción B",
          q.options[2] || "Opción C",
          q.options[3] || "Opción D",
        ];
        return {
          id: `paa-${idx}`,
          question: q.q,
          options: opts,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          topic: "PAA College Board",
          sourceExcerpt: "Guía Oficial PAA College Board",
        };
      });
    } else if (worldId === "exani") {
      rawQuestions = EXANI_OFFICIAL_QUESTIONS.map((q, idx) => {
        const opts: [string, string, string, string] = [
          q.options[0] || "Opción A",
          q.options[1] || "Opción B",
          q.options[2] || "Opción C",
          q.options[3] || "Opción D",
        ];
        return {
          id: `exani-${idx}`,
          question: q.q,
          options: opts,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          topic: "EXANI-II Ceneval",
          sourceExcerpt: "Temario Oficial EXANI-II 2025",
        };
      });
    } else {
      const subject = SCHOOL_SUBJECTS.find((s) => s.id === worldId);
      if (subject) {
        const topic = subject.topics.find((t) => t.id === topicId) || subject.topics[0];
        if (topic && topic.presetQuestions && topic.presetQuestions.length > 0) {
          rawQuestions = topic.presetQuestions.map((pq, idx) => {
            const opts: [string, string, string, string] = [
              pq.options[0] || "A",
              pq.options[1] || "B",
              pq.options[2] || "C",
              pq.options[3] || "D",
            ];
            return {
              id: `${topic.id}-${idx}`,
              question: pq.question,
              options: opts,
              correctIndex: pq.correctIndex !== undefined ? pq.correctIndex : 0,
              explanation: pq.explanation || `Basado en: "${topic.explanation.slice(0, 100)}..."`,
              topic: `${subject.name}: ${topic.name}`,
              sourceExcerpt: topic.explanation,
            };
          });
        }
      }
    }

    if (rawQuestions.length === 0) return [];
    const shuffled = [...rawQuestions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  // Iniciar partida con el material
  const startGameWithMaterial = async (worldId: WorldId, topicId: string, levelNum: number) => {
    const lvlConfig = LEVELS_CONFIG[levelNum - 1] || LEVELS_CONFIG[0];
    let questions: GameQuestion[] = [];

    if (worldId === "custom") {
      if (!customText.trim()) {
        toast.error("Primero agrega material de estudio para poder generar las preguntas de este juego.");
        setScreen("upload");
        return;
      }

      setIsGeneratingAi(true);
      const toastId = toast.loading("Analizando tu documento y creando preguntas exclusivas...");
      try {
        const aiResponse = await generateQuestionsFn({
          data: {
            materialText: customText,
            count: lvlConfig.reqQuestions,
            difficulty: "easy",
          },
        });

        if (aiResponse?.questions && aiResponse.questions.length > 0) {
          questions = aiResponse.questions.map((q, idx) => {
            const opts: [string, string, string, string] = [
              q.options[0] || "A",
              q.options[1] || "B",
              q.options[2] || "C",
              q.options[3] || "D",
            ];
            return {
              id: `custom-q-${idx}`,
              question: q.question,
              options: opts,
              correctIndex: q.correctIndex !== undefined ? q.correctIndex : 0,
              explanation: q.explanation || "Respuesta extraída de tus apuntes.",
              topic: "Mis Apuntes",
              sourceExcerpt: customText.slice(0, 120) + "...",
            };
          });
        }
        toast.success("¡Preguntas generadas desde tu material!", { id: toastId });
      } catch {
        toast.error("Error al procesar con IA.", { id: toastId });
        setIsGeneratingAi(false);
        return;
      } finally {
        setIsGeneratingAi(false);
      }
    } else {
      questions = buildQuestionsFromMaterial(worldId, topicId, lvlConfig.reqQuestions);
    }

    if (!questions || questions.length === 0) {
      toast.error("Primero agrega material de estudio para poder generar las preguntas de este juego.");
      return;
    }

    setSelectedWorld(worldId);
    setSelectedTopicId(topicId);
    setSelectedLevel(levelNum);

    setQuestionsPool(questions);
    setCurrentQIndex(0);
    setCurrentQuestion(questions[0]);
    setQTimer(lvlConfig.timePerQ);
    setQTimerMax(lvlConfig.timePerQ);
    setSelectedOption(null);
    setAnswerFeedback(null);

    setLives(3);
    setPlayerLane(1);
    playerLaneRef.current = 1;
    playerXRef.current = 0;
    jumpYRef.current = 0;
    jumpVelRef.current = 0;
    isJumpingRef.current = false;
    currentSpeedRef.current = 1.0;
    targetSpeedRef.current = 1.0;
    creatureDistRef.current = 48;
    distanceRef.current = 0;
    screenShakeRef.current = 0;

    setPlayerDistanceMeters(0);
    setCreatureDistanceMeters(48);
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

  // Temporizador de preguntas
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
    handleAnswerOption(-1);
  };

  // Respuesta & Efectos en Gameplay Suaves
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

      // Aumento gradual de velocidad (+15% temporal) y la criatura se retrasa suavemente
      targetSpeedRef.current = 1.18;
      creatureDistRef.current = Math.min(65, creatureDistRef.current + 12);
      setCreatureDistanceMeters(Math.round(creatureDistRef.current));

      // Volver a velocidad normal tras 2.8s
      setTimeout(() => {
        targetSpeedRef.current = 1.0;
      }, 2800);

      toast.success("¡CORRECTO! ⚡ +15% Velocidad y alejaste al perseguidor", { duration: 1200 });
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

        // Reducción gradual de velocidad (-15% temporal) y la criatura se acerca
        targetSpeedRef.current = 0.85;
        creatureDistRef.current = creatureDistRef.current - 12;
        setCreatureDistanceMeters(Math.max(0, Math.round(creatureDistRef.current)));
        screenShakeRef.current = 6;

        if (creatureDistRef.current <= 0) {
          triggerGameOver();
          return;
        }

        setTimeout(() => {
          targetSpeedRef.current = 1.0;
        }, 2800);

        toast.error("❌ ¡Incorrecto! La criatura se acerca...", { duration: 1200 });
      }
    }

    if (!isCorrect && !hasShield && lives <= 1) {
      setTimeout(() => {
        triggerGameOver();
      }, 800);
      return;
    }

    setTimeout(() => {
      const nextIdx = currentQIndex + 1;
      if (nextIdx >= questionsPool.length) {
        triggerVictory();
      } else {
        setCurrentQIndex(nextIdx);
        setCurrentQuestion(questionsPool[nextIdx]);
        setQTimer(lvlConfig.timePerQ);
        setQTimerMax(lvlConfig.timePerQ);
        setSelectedOption(null);
        setAnswerFeedback(null);
      }
    }, 1000);
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
  // MOTOR CANVAS RUNNER 3D CON PERSPECTIVA Y MOVIMIENTO FLUIDO
  // ========================================================
  useEffect(() => {
    if (screen !== "playing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let roadOffset = 0;
    const theme = WORLDS[selectedWorld] || WORLDS.quimica;
    const lvlConfig = LEVELS_CONFIG[selectedLevel - 1] || LEVELS_CONFIG[0];

    interface TrackItem {
      id: number;
      lane: number;
      z: number;
      type: "coin" | "star" | "obstacle" | "turbo" | "shield";
    }

    interface SceneryPillar {
      side: "left" | "right";
      z: number;
    }

    let trackItems: TrackItem[] = [
      { id: 1, lane: 0, z: 0.25, type: "coin" },
      { id: 2, lane: 1, z: 0.5, type: "obstacle" },
      { id: 3, lane: 2, z: 0.75, type: "star" },
      { id: 4, lane: 0, z: 0.95, type: "coin" },
    ];

    let sceneryPillars: SceneryPillar[] = [
      { side: "left", z: 0.1 },
      { side: "right", z: 0.1 },
      { side: "left", z: 0.35 },
      { side: "right", z: 0.35 },
      { side: "left", z: 0.6 },
      { side: "right", z: 0.6 },
      { side: "left", z: 0.85 },
      { side: "right", z: 0.85 },
    ];

    let nextItemId = 10;

    const resizeCanvas = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = Math.min(0.08, (timestamp - lastTimeRef.current) / 1000);
      lastTimeRef.current = timestamp;

      if (!isPaused) {
        // 1. Suave interpolación de velocidad
        currentSpeedRef.current += (targetSpeedRef.current - currentSpeedRef.current) * Math.min(1, dt * 3.5);
        const speed = currentSpeedRef.current;

        // 2. Distancia recorrida
        const metersAdvanced = speed * 16 * dt;
        distanceRef.current += metersAdvanced;
        setPlayerDistanceMeters(Math.round(distanceRef.current));
        setTimeElapsed((t) => t + dt);

        // 3. Física de Salto del Jugador (Gravedad suave)
        if (isJumpingRef.current) {
          jumpYRef.current += jumpVelRef.current * dt;
          jumpVelRef.current -= 980 * dt; // gravedad
          if (jumpYRef.current <= 0) {
            jumpYRef.current = 0;
            jumpVelRef.current = 0;
            isJumpingRef.current = false;
          }
        }

        // 4. Perseguidor dinámico físico
        if (activeFreezeTime <= 0) {
          const creatureApproach = (lvlConfig.creatureBaseSpeed * 1.5 - (speed - 1.0) * 2.0) * dt;
          creatureDistRef.current -= creatureApproach;
          setCreatureDistanceMeters(Math.max(0, Math.round(creatureDistRef.current)));

          if (creatureDistRef.current <= 0) {
            triggerGameOver();
            return;
          }
        }

        // 5. Pantalla temblor
        if (screenShakeRef.current > 0) {
          screenShakeRef.current = Math.max(0, screenShakeRef.current - dt * 15);
        }

        // 6. Temporizadores de powerups
        if (activeTurboTime > 0) setActiveTurboTime((t) => Math.max(0, t - dt));
        if (activeMagnetTime > 0) setActiveMagnetTime((t) => Math.max(0, t - dt));
        if (activeFreezeTime > 0) setActiveFreezeTime((t) => Math.max(0, t - dt));

        // 7. Desplazamiento continuo del camino y escenario
        roadOffset = (roadOffset + speed * 300 * dt) % 1000;

        // Desplazar pilares y árboles del escenario
        sceneryPillars.forEach((p) => {
          p.z += speed * 0.45 * dt;
          if (p.z > 1.2) p.z = 0.05;
        });

        // 8. Desplazar objetos y chequear colisiones
        trackItems.forEach((item) => {
          item.z += speed * 0.45 * dt;

          if (activeMagnetTime > 0 && (item.type === "coin" || item.type === "star")) {
            item.lane += (playerLaneRef.current - item.lane) * 0.18;
          }

          // Rango de colisión con el jugador
          if (item.z >= 0.88 && item.z <= 1.02) {
            if (Math.round(item.lane) === playerLaneRef.current) {
              if (item.type === "coin") {
                playSfx("coin");
                setCollectedCoins((c) => c + 1);
                setGameXp((xp) => xp + 15);
                item.z = 2.5;
              } else if (item.type === "star") {
                playSfx("star");
                setCollectedStars((s) => s + 1);
                setGameXp((xp) => xp + 40);
                item.z = 2.5;
              } else if (item.type === "turbo") {
                playSfx("turbo");
                setActiveTurboTime(4);
                item.z = 2.5;
              } else if (item.type === "shield") {
                setHasShield(true);
                item.z = 2.5;
              } else if (item.type === "obstacle") {
                // Si está en el aire (saltando alto), salta el obstáculo con éxito
                if (jumpYRef.current > 18) {
                  playSfx("star");
                  setGameXp((xp) => xp + 20);
                  item.z = 2.5;
                } else {
                  // Choque
                  if (hasShield) {
                    setHasShield(false);
                    item.z = 2.5;
                    toast.info("🛡️ ¡El Escudo absorbió el choque!");
                  } else {
                    playSfx("wrong");
                    targetSpeedRef.current = 0.85;
                    creatureDistRef.current = Math.max(1, creatureDistRef.current - 6);
                    setCreatureDistanceMeters(Math.round(creatureDistRef.current));
                    setLives((l) => Math.max(0, l - 1));
                    screenShakeRef.current = 5;
                    item.z = 2.5;
                    setTimeout(() => {
                      targetSpeedRef.current = 1.0;
                    }, 2200);
                  }
                }
              }
            }
          }
        });

        // Limpiar y spawnear nuevos items con espacio generoso para esquivar
        trackItems = trackItems.filter((it) => it.z < 1.15);
        if (trackItems.length < 4) {
          const types: TrackItem["type"][] = ["coin", "coin", "star", "obstacle", "turbo", "shield"];
          const spawnType = types[Math.floor(Math.random() * types.length)];
          const spawnLane = Math.floor(Math.random() * 3);
          trackItems.push({
            id: ++nextItemId,
            lane: spawnLane,
            z: 0.05,
            type: spawnType,
          });
        }
      }

      // ==========================================
      // RENDERIZADO VISUAL EN EL CANVAS (60 FPS)
      // ==========================================
      const w = canvas.width || 400;
      const h = canvas.height || 220;
      ctx.clearRect(0, 0, w, h);

      ctx.save();
      // Screen Shake
      if (screenShakeRef.current > 0) {
        const shakeX = (Math.random() - 0.5) * screenShakeRef.current;
        const shakeY = (Math.random() - 0.5) * screenShakeRef.current;
        ctx.translate(shakeX, shakeY);
      }

      // 1. Cielo y Horizonte
      const horizonY = h * 0.34;
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      skyGrad.addColorStop(0, "#020617");
      skyGrad.addColorStop(1, theme.trackColor);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, horizonY);

      // Cyber Grid en el horizonte
      ctx.strokeStyle = theme.gridColor;
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = 0.3;
      for (let i = 0; i < w; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(w / 2, horizonY);
        ctx.stroke();
      }
      ctx.globalAlpha = 1.0;

      // 2. Geometría de la Carretera 3D
      const roadTopW = Math.max(70, w * 0.2);
      const roadBottomW = Math.min(w * 0.92, 540);
      const roadTopX = (w - roadTopW) / 2;
      const roadBottomX = (w - roadBottomW) / 2;

      // Asfalto
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

      // Bordes Neón
      ctx.strokeStyle = theme.gridColor;
      ctx.lineWidth = 3;
      ctx.shadowColor = theme.gridColor;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(roadTopX, horizonY);
      ctx.lineTo(roadBottomX, h);
      ctx.moveTo(roadTopX + roadTopW, horizonY);
      ctx.lineTo(roadBottomX + roadBottomW, h);
      ctx.stroke();

      // Líneas divisorias de los 3 carriles con desplazamiento continuo
      const lane1Top = roadTopX + roadTopW * 0.33;
      const lane1Bot = roadBottomX + roadBottomW * 0.33;
      const lane2Top = roadTopX + roadTopW * 0.66;
      const lane2Bot = roadBottomX + roadBottomW * 0.66;

      ctx.lineWidth = 2;
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

      // 3. Elementos del Escenario Lateral (Pilares / Árboles Neón en movimiento)
      sceneryPillars.forEach((p) => {
        const itemY = horizonY + (h - horizonY) * p.z;
        const currentRoadW = roadTopW + (roadBottomW - roadTopW) * p.z;
        const currentRoadX = (w - currentRoadW) / 2;
        const itemX = p.side === "left" ? currentRoadX - 18 * (1 + p.z) : currentRoadX + currentRoadW + 18 * (1 + p.z);
        const scale = 0.3 + p.z * 0.8;

        ctx.save();
        ctx.translate(itemX, itemY);
        ctx.scale(scale, scale);
        ctx.fillStyle = theme.gridColor;
        ctx.globalAlpha = 0.45;
        // Dibujar poste neón / árbol
        ctx.fillRect(-3, -24, 6, 24);
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(0, -24, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 4. Meta al final de la carrera (0m -> targetDistance)
      const progressToGoal = Math.min(1, distanceRef.current / (lvlConfig.targetDistance || 500));
      if (progressToGoal > 0.85) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(roadTopX - 12, horizonY - 14, roadTopW + 24, 8);
        ctx.fillStyle = "#10b981";
        ctx.font = "bold 9px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🏁 META", w / 2, horizonY - 7);
      }

      // 5. Dibujar Items en Pista (Monedas, Estrellas, Obstáculos)
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
        } else if (item.type === "obstacle") {
          // Obstáculo Cyber Valla
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(-18, -16, 36, 12);
          ctx.fillStyle = "#fca5a5";
          ctx.fillRect(-14, -14, 28, 8);
          ctx.fillStyle = "#991b1b";
          ctx.fillRect(-16, -4, 6, 6);
          ctx.fillRect(10, -4, 6, 6);
        }
        ctx.restore();
      });

      // 6. Posición Suave del Jugador (Suave Lerp en X)
      const playerZ = 0.94;
      const playerRoadW = roadTopW + (roadBottomW - roadTopW) * playerZ;
      const playerRoadX = (w - playerRoadW) / 2;
      const pLaneW = playerRoadW / 3;
      const targetPlayerX = playerRoadX + pLaneW * playerLaneRef.current + pLaneW / 2;

      // Interpolación fluida hacia el carril destino
      if (playerXRef.current === 0) playerXRef.current = targetPlayerX;
      playerXRef.current += (targetPlayerX - playerXRef.current) * 0.22;

      const playerBaseY = h - 38 - jumpYRef.current;

      // Sombra en el suelo (se encoge al saltar)
      const shadowScale = Math.max(0.3, 1 - jumpYRef.current / 80);
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.beginPath();
      ctx.ellipse(playerXRef.current, h - 30, 20 * shadowScale, 6 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();

      // Aura Turbo / Escudo
      if (activeTurboTime > 0) {
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.ellipse(playerXRef.current, playerBaseY + 6, 22, 26, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      if (hasShield) {
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(playerXRef.current, playerBaseY + 6, 24, 28, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Animación fluida de correr (Ciclos de piernas y brazos)
      const runCycle = timestamp * 0.016 * currentSpeedRef.current;
      const legOffset = Math.sin(runCycle) * 6;
      const bodyBob = Math.abs(Math.sin(runCycle)) * 2;

      const equippedOutfit = CLOSET_ITEMS.find((c) => c.id === equippedItems.outfit) || CLOSET_ITEMS[4];
      const equippedHair = CLOSET_ITEMS.find((c) => c.id === equippedItems.hair) || CLOSET_ITEMS[0];

      ctx.save();
      ctx.translate(playerXRef.current, playerBaseY - bodyBob);

      // Piernas y Tenis
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(-6, 12 + legOffset, 4, 9);
      ctx.fillRect(2, 12 - legOffset, 4, 9);
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(-7, 19 + legOffset, 6, 4);
      ctx.fillRect(1, 19 - legOffset, 6, 4);

      // Torso / Traje
      ctx.fillStyle = equippedOutfit.color;
      ctx.beginPath();
      ctx.roundRect(-8, 0, 16, 14, 3);
      ctx.fill();

      // Mochila
      ctx.fillStyle = "#475569";
      ctx.fillRect(-10, 2, 3, 10);

      // Cabeza y Rostro
      ctx.fillStyle = "#fcd34d";
      ctx.beginPath();
      ctx.arc(0, -6, 7, 0, Math.PI * 2);
      ctx.fill();

      // Pelo
      ctx.fillStyle = equippedHair.color;
      ctx.beginPath();
      ctx.arc(0, -8, 8, Math.PI, Math.PI * 2);
      ctx.fill();

      // Ojos
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(-3, -6, 1.5, 1.5);
      ctx.fillRect(1.5, -6, 1.5, 1.5);

      ctx.restore();

      // 7. PERSEGUIDOR FÍSICO DENTRO DEL ESCENARIO (VISIBLE DETRÁS DEL JUGADOR)
      // La posición Z depende directamente de creatureDistRef (0 a 60m)
      const creatureNormalizedZ = Math.max(0.12, 0.98 - (creatureDistRef.current / 55) * 0.85);
      const cRoadW = roadTopW + (roadBottomW - roadTopW) * creatureNormalizedZ;
      const cRoadX = (w - cRoadW) / 2;
      const cX = cRoadX + cRoadW / 2;
      const cY = horizonY + (h - horizonY) * creatureNormalizedZ;
      const cScale = 0.35 + creatureNormalizedZ * 0.85;

      const monsterCycle = timestamp * 0.014;
      const monsterBob = Math.sin(monsterCycle) * 3;

      ctx.save();
      ctx.translate(cX, cY - 14 - monsterBob);
      ctx.scale(cScale, cScale);

      // Efecto congelado
      if (activeFreezeTime > 0) {
        ctx.fillStyle = "rgba(56, 189, 248, 0.4)";
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2;
        ctx.strokeRect(-22, -22, 44, 44);
        ctx.fillRect(-22, -22, 44, 44);
      }

      // Sombra del monstruo
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.beginPath();
      ctx.ellipse(0, 16, 18, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cuerpo del monstruo
      ctx.fillStyle = theme.monsterColor;
      ctx.shadowColor = theme.monsterColor;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(0, 0, 19, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Ojos brillantes
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(-7, -4, 5, 0, Math.PI * 2);
      ctx.arc(7, -4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(-7, -4, 2.5, 0, Math.PI * 2);
      ctx.arc(7, -4, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Dientes
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(-7, 6);
      ctx.lineTo(-4, 11);
      ctx.lineTo(0, 6);
      ctx.lineTo(4, 11);
      ctx.lineTo(7, 6);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      ctx.restore();

      animFrameIdRef.current = requestAnimationFrame(gameLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [screen, isPaused, selectedWorld, selectedLevel, activeTurboTime, hasShield, activeMagnetTime, activeFreezeTime]);

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

  const currentTheme = WORLDS[selectedWorld] || WORLDS.quimica;
  const currentLvlConfig = LEVELS_CONFIG[selectedLevel - 1] || LEVELS_CONFIG[0];
  const timerPercentage = qTimerMax > 0 ? (qTimer / qTimerMax) * 100 : 0;
  const availableTopics = getSubjectMaterials(selectedWorld);

  return (
    <div className="fixed inset-0 z-50 w-full h-full max-h-screen bg-slate-950 text-white flex flex-col font-sans select-none overflow-hidden">
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
                className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
              >
                <ArrowLeft className="size-4" />
                <span>Volver a Juegos</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
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
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                ¡Corre, esquiva a la criatura y responde preguntas basadas en tu material guardado!
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
              <span>ELEGIR MATERIA & JUGAR</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setScreen("closet")}
                className="h-11 rounded-2xl border border-slate-800 bg-slate-900 hover:border-purple-500/40 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Shirt className="size-4 text-purple-400" />
                <span>Personalizar</span>
              </button>

              <button
                onClick={() => {
                  setSelectedWorld("custom");
                  setScreen("upload");
                }}
                className="h-11 rounded-2xl border border-slate-800 bg-slate-900 hover:border-cyan-500/40 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Upload className="size-4 text-cyan-400" />
                <span>Subir Apuntes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. SELECCIÓN DE MATERIA */}
      {/* ======================================================== */}
      {screen === "world_select" && (
        <div className="flex-1 w-full h-full overflow-y-auto p-4 md:p-6 max-w-lg mx-auto space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setScreen("home")}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="size-4" />
              <span>Atrás</span>
            </button>
            <span className="text-xs font-bold text-purple-400">Paso 1: Elige Materia</span>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold text-white">Elige la Materia a Estudiar</h2>
            <p className="text-xs text-slate-400">El juego cargará el material guardado de esa materia para generar las preguntas:</p>
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
                    } else if (w.id === "paa" || w.id === "exani") {
                      setSelectedTopicId(w.id);
                      setScreen("level_map");
                    } else {
                      setScreen("material_select");
                    }
                  }}
                  className="group flex items-center justify-between p-3.5 rounded-2xl border border-slate-800 bg-slate-900/70 hover:border-purple-500/50 hover:bg-purple-950/20 text-left transition active:scale-98 cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{w.icon}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                          {w.badge}
                        </span>
                        <span className="text-[9px] font-semibold px-2 py-0.2 rounded-full bg-slate-800 text-slate-300">
                          {w.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block line-clamp-1">{w.desc}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-rose-400 flex items-center gap-0.5">
                      <span>{w.monsterEmoji}</span>
                    </span>
                    <ChevronRight className="size-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2.1 SELECCIÓN DE MATERIAL GUARDADO */}
      {/* ======================================================== */}
      {screen === "material_select" && (
        <div className="flex-1 w-full h-full overflow-y-auto p-4 md:p-6 max-w-lg mx-auto space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setScreen("world_select")}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="size-4" />
              <span>Cambiar Materia</span>
            </button>
            <span className="text-xs font-bold text-cyan-400">{currentTheme.badge}</span>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold text-white">Material de Estudio Guardado</h2>
            <p className="text-xs text-slate-400">
              Selecciona el tema cuyo contenido se usará para formular las preguntas del juego:
            </p>
          </div>

          {availableTopics.length === 0 ? (
            <div className="p-6 rounded-3xl border border-amber-500/40 bg-amber-950/20 text-center space-y-4 my-4">
              <div className="size-12 rounded-2xl bg-amber-500/20 text-amber-400 grid place-items-center mx-auto">
                <BookOpen className="size-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">
                  📚 Primero agrega material de estudio para poder generar las preguntas de este juego.
                </h3>
                <p className="text-xs text-slate-400">
                  Para cumplir con la regla pedagógica, las preguntas solo pueden formularse a partir de un texto real.
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedWorld("custom");
                  setScreen("upload");
                }}
                className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <PlusCircle className="size-4" />
                <span>Agregar o Pegar Material de Estudio</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3 pb-12">
              {availableTopics.map((topic) => (
                <div
                  key={topic.id}
                  className="p-4 rounded-2xl border border-slate-800 bg-slate-900/80 hover:border-purple-500/50 transition space-y-2.5 text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-white">{topic.name}</h4>
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{topic.summary}</p>
                    </div>
                    <span className="text-xl shrink-0">{currentTheme.icon}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[10px] text-slate-300 font-mono line-clamp-2 leading-relaxed">
                    📖 "{topic.explanation.slice(0, 140)}..."
                  </div>

                  <button
                    onClick={() => {
                      setSelectedTopicId(topic.id);
                      setScreen("level_map");
                    }}
                    className="w-full h-10 rounded-xl bg-primary text-white text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer hover:brightness-110"
                  >
                    <span>Usar este Material en Smart Escape</span>
                    <ChevronRight className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MAPA DE NIVELES */}
      {/* ======================================================== */}
      {screen === "level_map" && (
        <div className="flex-1 w-full h-full overflow-y-auto p-4 md:p-6 max-w-lg mx-auto space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <button
              onClick={() => (selectedWorld === "paa" || selectedWorld === "exani" ? setScreen("world_select") : setScreen("material_select"))}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="size-4" />
              <span>Cambiar Material</span>
            </button>
            <span className="text-xs font-bold text-cyan-400">{currentTheme.badge}</span>
          </div>

          <div className="p-4 rounded-3xl border border-purple-500/30 bg-purple-950/30 flex items-center gap-3">
            <span className="text-3xl">{currentTheme.icon}</span>
            <div>
              <h3 className="text-sm font-bold text-white">
                {selectedWorld === "paa"
                  ? "Simulador PAA College Board"
                  : selectedWorld === "exani"
                  ? "Simulador EXANI-II Ceneval"
                  : availableTopics.find((t) => t.id === selectedTopicId)?.name || currentTheme.name}
              </h3>
              <p className="text-[11px] text-slate-400">
                Perseguidor: <strong className="text-rose-400">{currentTheme.monsterName}</strong> {currentTheme.monsterEmoji}
              </p>
            </div>
          </div>

          <div className="space-y-3 pb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 px-0.5 block">
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
                      <span className="text-xs font-bold text-white">
                        Nivel {lvl.level} — {lvl.name}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span>🏁 Meta: {lvl.targetDistance}m</span>
                        <span>📚 {lvl.reqQuestions} preguntas</span>
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
                    onClick={() => startGameWithMaterial(selectedWorld, selectedTopicId, lvl.level)}
                    className="w-full h-11 rounded-xl bg-primary text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer hover:brightness-110"
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
              className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="size-4" />
              <span>Atrás</span>
            </button>
            <span className="text-xs font-bold text-cyan-400">Subir Material Propio</span>
          </div>

          <div className="p-4 rounded-3xl border border-slate-800 bg-slate-900 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <Upload className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Sube tus apuntes para Smart Escape</h3>
                <p className="text-[11px] text-slate-400">
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
              placeholder="O pega aquí el texto o resumen que deseas estudiar..."
              className="h-32 w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white focus:border-primary focus:outline-none resize-none leading-relaxed"
            />

            <button
              onClick={() => startGameWithMaterial("custom", "custom", 1)}
              disabled={isExtracting || isGeneratingAi || !customText.trim()}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="size-4" />
              <span>Generar Preguntas y Empezar Carrera</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. PANTALLA COMPLETA DE PARTIDA (RUNNER + PERSPECTIVA 3D) */}
      {/* ======================================================== */}
      {screen === "playing" && (
        <div className="fixed inset-0 z-50 w-full h-full max-h-screen flex flex-col justify-between overflow-hidden bg-slate-950 text-white select-none">
          {/* Header Superior con Meta y Radar */}
          <header className="h-12 w-full shrink-0 border-b border-slate-800 bg-slate-900/95 backdrop-blur px-3 flex items-center justify-between gap-2 z-30">
            {/* Vidas & XP */}
            <div className="flex items-center gap-2.5">
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

              <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1">
                <Star className="size-3 fill-cyan-400" />
                <span>{gameXp} XP</span>
              </span>

              <span className="text-[11px] font-bold text-gold-foreground flex items-center gap-1">
                <img src={streakCap} alt="" className="size-3" />
                <span>{collectedCoins}</span>
              </span>
            </div>

            {/* Radar: Distancia a la Meta + Distancia al Monstruo */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1 rounded-full text-[11px] font-bold">
              <span className="text-cyan-300 font-mono">
                🏃 {Math.round(playerDistanceMeters)}m / {currentLvlConfig.targetDistance || 500}m 🏁
              </span>
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
              <span className="text-[11px] font-bold text-slate-400 font-mono">
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

          {/* Centro: Escenario 3D Runner Canvas (Fluidos 60 FPS) */}
          <div className="flex-1 w-full min-h-[140px] max-h-[40vh] md:max-h-[46vh] relative overflow-hidden bg-slate-950">
            <canvas ref={canvasRef} className="w-full h-full block" />

            {/* Alerta de Perseguidor cuando está muy cerca */}
            {creatureDistanceMeters < 15 && (
              <div className="absolute top-2 inset-x-3 pointer-events-none z-20">
                <div className="bg-rose-600/90 border border-rose-400 text-white text-[11px] font-black px-3 py-1 rounded-full flex items-center justify-center gap-1.5 animate-pulse shadow-lg backdrop-blur">
                  <AlertTriangle className="size-3.5" />
                  <span>¡{currentTheme.monsterName.toUpperCase()} ESTÁ A {Math.round(creatureDistanceMeters)} METROS!</span>
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* PARTE INFERIOR: PREGUNTA & OPCIONES (ALTO CONTRASTE) */}
          {/* ======================================================== */}
          <div className="w-full shrink-0 border-t-2 border-purple-500/40 bg-slate-900 p-3 sm:p-4 space-y-2.5 z-30 max-w-2xl mx-auto shadow-2xl">
            {/* Header de la Pregunta + Temporizador */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-purple-600 text-white shadow-sm line-clamp-1 max-w-[280px]">
                📖 {currentQuestion?.topic || `Pregunta ${currentQIndex + 1}`}
              </span>

              {/* Countdown Timer */}
              <div className="flex items-center gap-1.5 font-black bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
                <Clock className="size-3.5 text-amber-400" />
                <span className={`text-xs font-mono ${qTimer <= 3 ? "text-rose-400 font-black animate-pulse" : "text-amber-300"}`}>
                  {qTimer}s
                </span>
              </div>
            </div>

            {/* Barra de tiempo */}
            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-300 ${
                  qTimer <= 3 ? "bg-rose-500" : "bg-gradient-to-r from-purple-500 via-cyan-400 to-emerald-400"
                }`}
                style={{ width: `${timerPercentage}%` }}
              />
            </div>

            {/* Texto de la Pregunta */}
            {currentQuestion ? (
              <h3 className="text-sm sm:text-base font-extrabold text-white leading-snug px-1 line-clamp-2 min-h-[36px] flex items-center drop-shadow-sm">
                {currentQuestion.question}
              </h3>
            ) : (
              <div className="text-xs text-slate-400 italic min-h-[36px] flex items-center">
                Cargando siguiente pregunta del material...
              </div>
            )}

            {/* 4 Opciones de Respuesta */}
            {currentQuestion && (
              <div className="grid grid-cols-2 gap-2">
                {currentQuestion.options.map((opt, idx) => {
                  const letters = ["A", "B", "C", "D"];
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === currentQuestion.correctIndex;

                  let optClass = "border-2 border-slate-700 bg-slate-800 hover:bg-slate-700 hover:border-purple-400 text-white";
                  let badgeClass = "bg-slate-700 text-cyan-300 border border-slate-600";

                  if (selectedOption !== null) {
                    if (isCorrect) {
                      optClass = "border-2 border-emerald-400 bg-emerald-600 text-white font-black shadow-lg shadow-emerald-500/20";
                      badgeClass = "bg-emerald-800 text-white border-emerald-300";
                    } else if (isSelected) {
                      optClass = "border-2 border-rose-400 bg-rose-600 text-white font-black shadow-lg shadow-rose-500/20";
                      badgeClass = "bg-rose-800 text-white border-rose-300";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={selectedOption !== null}
                      onClick={() => handleAnswerOption(idx)}
                      className={`p-2.5 sm:p-3 rounded-xl text-left text-xs sm:text-sm font-bold leading-tight transition active:scale-95 cursor-pointer flex items-center gap-2.5 shadow-md ${optClass}`}
                    >
                      <span className={`size-6 rounded-lg font-black text-xs grid place-items-center shrink-0 ${badgeClass}`}>
                        {letters[idx]}
                      </span>
                      <span className="line-clamp-2 flex-1 text-white font-bold">{opt}</span>
                      {selectedOption !== null && isCorrect && (
                        <CheckCircle2 className="size-4 text-white shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Controles de Movimiento y Salto */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex gap-2">
                <button
                  onClick={() => setPlayerLane((p) => Math.max(0, p - 1))}
                  className="size-11 rounded-xl bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 active:bg-purple-600 text-white font-black text-base flex items-center justify-center transition active:scale-90 cursor-pointer shadow-md"
                  title="Mover Izquierda (A)"
                >
                  ◀
                </button>
                <button
                  onClick={() => setPlayerLane((p) => Math.min(2, p + 1))}
                  className="size-11 rounded-xl bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 active:bg-purple-600 text-white font-black text-base flex items-center justify-center transition active:scale-90 cursor-pointer shadow-md"
                  title="Mover Derecha (D)"
                >
                  ▶
                </button>
              </div>

              <button
                onClick={triggerJump}
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 active:brightness-125 text-white font-display text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 shadow-lg transition active:scale-95 cursor-pointer"
                title="Saltar (Espacio / W)"
              >
                <ArrowUp className="size-4" />
                <span>SALTAR (ESPACIO)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. PANTALLA DE DERROTA */}
      {/* ======================================================== */}
      {screen === "gameover" && (
        <div className="flex-1 w-full h-full overflow-y-auto p-4 md:p-6 max-w-md mx-auto flex flex-col justify-center text-center space-y-5 animate-fade-in">
          <div className="space-y-1">
            <span className="text-5xl animate-bounce block">💀</span>
            <h2 className="font-display text-2xl font-black text-rose-500">¡Te alcanzaron!</h2>
            <p className="text-xs text-slate-400">
              {currentTheme.monsterName} corrió más rápido esta vez. ¡Repasa tus conceptos y vuelve a escapar!
            </p>
          </div>

          <div className="p-4 rounded-3xl border border-slate-800 bg-slate-900 space-y-2 text-xs text-left">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Distancia recorrida:</span>
              <span className="font-bold text-white">{Math.round(playerDistanceMeters)} metros</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Preguntas acertadas:</span>
              <span className="font-bold text-emerald-400">{correctAnswersCount} correctas</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Monedas ganadas:</span>
              <span className="font-bold text-gold-foreground">+{collectedCoins} 🪙</span>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => startGameWithMaterial(selectedWorld, selectedTopicId, selectedLevel)}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
            >
              <RotateCcw className="size-4" />
              <span>Intentar de nuevo</span>
            </button>

            <button
              onClick={() => navigate({ to: "/study" })}
              className="w-full h-12 rounded-2xl border border-slate-800 bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2 hover:border-purple-500/40 transition active:scale-95 cursor-pointer"
            >
              <BookOpen className="size-4 text-purple-400" />
              <span>Repasar material en Estudio</span>
            </button>

            <button
              onClick={() => setScreen("level_map")}
              className="w-full h-12 rounded-2xl border border-slate-800 text-slate-400 font-bold text-xs flex items-center justify-center gap-2 hover:text-white transition cursor-pointer"
            >
              <span>Volver al mapa</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. PANTALLA DE VICTORIA */}
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
              ¡MISIÓN COMPLETADA! 🏆
            </h2>
            <p className="text-xs text-slate-400">
              ¡Llegaste a la meta, escapaste de {currentTheme.monsterName} y completaste el Nivel {selectedLevel}!
            </p>
          </div>

          <div className="p-4 rounded-3xl border border-emerald-500/30 bg-emerald-950/20 space-y-2 text-xs text-left">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">⭐ Experiencia:</span>
              <span className="font-bold text-cyan-400">+{currentLvlConfig.bonusXp + correctAnswersCount * 25} XP</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">🪙 Monedas:</span>
              <span className="font-bold text-gold-foreground">+{currentLvlConfig.bonusCoins + collectedCoins} Monedas</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">📚 Aciertos:</span>
              <span className="font-bold text-emerald-400">{correctAnswersCount} / {questionsPool.length}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">🔥 Racha Máxima:</span>
              <span className="font-bold text-purple-400">{maxStreak} seguidas</span>
            </div>
          </div>

          <div className="space-y-2">
            {selectedLevel < 4 && (
              <button
                onClick={() => startGameWithMaterial(selectedWorld, selectedTopicId, selectedLevel + 1)}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
              >
                <span>Siguiente Nivel (Nivel {selectedLevel + 1})</span>
                <ChevronRight className="size-4" />
              </button>
            )}

            <button
              onClick={() => setScreen("level_map")}
              className="w-full h-12 rounded-2xl border border-slate-800 bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <span>Volver al Mapa de Niveles</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. ARMARIO / TIENDA */}
      {/* ======================================================== */}
      {screen === "closet" && (
        <div className="flex-1 w-full h-full overflow-y-auto p-4 md:p-6 max-w-lg mx-auto space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setScreen("home")}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
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
            <h2 className="font-display text-xl font-bold text-white">Armario y Personalización</h2>
            <p className="text-xs text-slate-400">Desbloquea atuendos con las monedas ganadas en tus carreras:</p>
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
                      <span className="text-xs font-bold text-white block">{item.name}</span>
                      <span className="text-[10px] text-slate-400 capitalize">{item.category}</span>
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
