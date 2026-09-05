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
  Heart, AlertCircle, FileText, PlusCircle, BatteryCharging, Battery
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
  groundColor: string;
  roadColor: string;
  roadLineColor: string;
  skyTopColor: string;
  skyBottomColor: string;
  monsterName: string;
  monsterEmoji: string;
  monsterColor: string;
  monsterSecondary: string;
}

const WORLDS: Record<WorldId, WorldTheme> = {
  quimica: {
    id: "quimica",
    name: "Laboratorio Neón",
    icon: "🧪",
    badge: "Química",
    desc: "Materia, estados de agregación, mezclas y reacciones.",
    groundColor: "#052e16",
    roadColor: "#0f172a",
    roadLineColor: "#10b981",
    skyTopColor: "#022c22",
    skyBottomColor: "#064e3b",
    monsterName: "Nebulón Químico",
    monsterEmoji: "🧪",
    monsterColor: "#10b981",
    monsterSecondary: "#047857",
  },
  matematicas: {
    id: "matematicas",
    name: "Cyber Matrix",
    icon: "🔢",
    badge: "Matemáticas",
    desc: "Operaciones básicas, jerarquía PEMDAS, fracciones y álgebra.",
    groundColor: "#0f172a",
    roadColor: "#1e293b",
    roadLineColor: "#38bdf8",
    skyTopColor: "#020617",
    skyBottomColor: "#0f172a",
    monsterName: "Gorgon Glitch",
    monsterEmoji: "👾",
    monsterColor: "#06b6d4",
    monsterSecondary: "#0891b2",
  },
  biologia: {
    id: "biologia",
    name: "Microcosmos Celular",
    icon: "🧬",
    badge: "Biología",
    desc: "La célula, fotosíntesis, ADN y biodiversidad.",
    groundColor: "#2e1065",
    roadColor: "#1e1b4b",
    roadLineColor: "#ec4899",
    skyTopColor: "#170529",
    skyBottomColor: "#4c0519",
    monsterName: "Virus Voraz",
    monsterEmoji: "🦠",
    monsterColor: "#ec4899",
    monsterSecondary: "#be185d",
  },
  historia: {
    id: "historia",
    name: "Ruinas Ancestrales",
    icon: "🏛️",
    badge: "Historia",
    desc: "Culturas prehispánicas, Independencia y Revolución.",
    groundColor: "#451a03",
    roadColor: "#292524",
    roadLineColor: "#f59e0b",
    skyTopColor: "#1c1917",
    skyBottomColor: "#78350f",
    monsterName: "Coloso del Tiempo",
    monsterEmoji: "🗿",
    monsterColor: "#f59e0b",
    monsterSecondary: "#b45309",
  },
  ingles: {
    id: "ingles",
    name: "Metrópolis Neón",
    icon: "🇬🇧",
    badge: "Inglés",
    desc: "Gramática, tiempos verbales y vocabulario clave.",
    groundColor: "#1e1b4b",
    roadColor: "#0f172a",
    roadLineColor: "#a855f7",
    skyTopColor: "#0f172a",
    skyBottomColor: "#3b0764",
    monsterName: "Grammar Phantom",
    monsterEmoji: "👻",
    monsterColor: "#a855f7",
    monsterSecondary: "#7e22ce",
  },
  paa: {
    id: "paa",
    name: "Simulador PAA College Board",
    icon: "🏆",
    badge: "Admisión Universitaria",
    desc: "Lectura crítica, redacción y razonamiento oficial.",
    groundColor: "#0f172a",
    roadColor: "#1e293b",
    roadLineColor: "#3b82f6",
    skyTopColor: "#030712",
    skyBottomColor: "#1e3a8a",
    monsterName: "Cronos PAA",
    monsterEmoji: "⚡",
    monsterColor: "#3b82f6",
    monsterSecondary: "#1d4ed8",
  },
  exani: {
    id: "exani",
    name: "Simulador EXANI-II Ceneval",
    icon: "🎓",
    badge: "Admisión Ceneval 2025",
    desc: "Comprensión lectora, redacción indirecta y pensamiento matemático.",
    groundColor: "#180828",
    roadColor: "#1e1b4b",
    roadLineColor: "#c084fc",
    skyTopColor: "#090214",
    skyBottomColor: "#4a044e",
    monsterName: "Cénit Ceneval",
    monsterEmoji: "🔮",
    monsterColor: "#c084fc",
    monsterSecondary: "#9333ea",
  },
  custom: {
    id: "custom",
    name: "Mis Apuntes y Documentos",
    icon: "✨",
    badge: "Material Subido",
    desc: "Preguntas generadas 100% sobre tu propio texto o PDF.",
    groundColor: "#1e1b4b",
    roadColor: "#0f172a",
    roadLineColor: "#818cf8",
    skyTopColor: "#020617",
    skyBottomColor: "#312e81",
    monsterName: "Sombra del Examen",
    monsterEmoji: "😈",
    monsterColor: "#818cf8",
    monsterSecondary: "#4f46e5",
  },
};

const LEVELS_CONFIG = [
  { level: 1, name: "Principiante", reqQuestions: 5, targetDistance: 500, bonusCoins: 5, bonusXp: 50 },
  { level: 2, name: "Explorador", reqQuestions: 8, targetDistance: 750, bonusCoins: 10, bonusXp: 100 },
  { level: 3, name: "Experto", reqQuestions: 10, targetDistance: 1000, bonusCoins: 15, bonusXp: 175 },
  { level: 4, name: "Maestro", reqQuestions: 12, targetDistance: 1250, bonusCoins: 25, bonusXp: 250 },
];

/**
 * Calcula el tiempo asignado a una pregunta (mínimo 15s, hasta 28s para lecturas/complejas)
 */
function calculateQuestionTime(question: GameQuestion, level: number): number {
  const baseByLevel = [18, 17, 16, 15][Math.max(0, Math.min(3, level - 1))] || 16;
  const qLen = (question.question || "").length;
  const optsLen = (question.options || []).reduce((acc, opt) => acc + opt.length, 0);

  let bonusTime = 0;
  if (qLen > 130) bonusTime += 6;
  else if (qLen > 70) bonusTime += 3;

  if (optsLen > 80) bonusTime += 4;
  else if (optsLen > 40) bonusTime += 2;

  const topicLower = (question.topic || "").toLowerCase();
  if (
    topicLower.includes("matem") ||
    topicLower.includes("quim") ||
    topicLower.includes("fisic") ||
    topicLower.includes("lector") ||
    topicLower.includes("exani") ||
    topicLower.includes("paa")
  ) {
    bonusTime += 3;
  }

  return Math.max(15, Math.min(28, baseByLevel + bonusTime));
}

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
  const [qTimer, setQTimer] = useState(15);
  const [qTimerMax, setQTimerMax] = useState(15);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // Sistema de Energía (0% a 100%) - La pregunta aparece cuando la energía está baja (<= 35%)
  const [energyPercent, setEnergyPercent] = useState<number>(100);
  const energyRef = useRef<number>(100);

  // Runner Gameplay Metrics
  const [lives, setLives] = useState(3);
  const [playerDistanceMeters, setPlayerDistanceMeters] = useState(0);
  const [gameXp, setGameXp] = useState(0);
  const [collectedCoins, setCollectedCoins] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [wrongAnswersCount, setWrongAnswersCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Powerups
  const [activeTurboTime, setActiveTurboTime] = useState(0);
  const [activeFreezeTime, setActiveFreezeTime] = useState(0);
  const [hasShield, setHasShield] = useState(false);

  // Smooth Physics & Game Loop State (Mutable Refs for 60 FPS)
  const playerYOffsetRef = useRef<number>(0);
  const playerYVelRef = useRef<number>(0);
  const isJumpingRef = useRef<boolean>(false);
  const playerDistanceRef = useRef<number>(0);

  // Persecución Suave y con Mucho Más Tiempo
  const relativeMonsterDistanceRef = useRef<number>(240); // Inicia lejos (240px)
  const targetMonsterDistRef = useRef<number>(240);
  const catchingSequenceRef = useRef<{ active: boolean; timer: number; duration: number }>({
    active: false,
    timer: 0,
    duration: 1.4,
  });

  const targetSpeedRef = useRef<number>(1.0);
  const currentSpeedRef = useRef<number>(1.0);
  const screenShakeRef = useRef<number>(0);
  const answerBannerRef = useRef<{ text: string; color: string; timer: number } | null>(null);

  // Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<any>(null);

  // Web Audio Synth
  const playSfx = (type: "jump" | "coin" | "correct" | "wrong" | "turbo" | "recharge" | "gameover" | "victory") => {
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
      } else if (type === "recharge") {
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(920, ctx.currentTime + 0.28);
        gain.gain.setValueAtTime(0.16, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);
        osc.start();
        osc.stop(ctx.currentTime + 0.28);
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
        osc.frequency.linearRampToValueAtTime(60, ctx.currentTime + 0.6);
        gain.gain.setValueAtTime(0.22, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      }
    } catch {}
  };

  // Jump Action (Saltar obstáculo)
  const triggerJump = useCallback(() => {
    if (isJumpingRef.current || catchingSequenceRef.current.active) return;
    isJumpingRef.current = true;
    playerYVelRef.current = 420;
    playSfx("jump");
  }, [soundEnabled]);

  // Teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (screen !== "playing" || isPaused || catchingSequenceRef.current.active) return;

      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W" || e.key === " ") {
        e.preventDefault();
        triggerJump();
      } else if (energyPercent <= 35 && (e.key === "1" || e.key === "2" || e.key === "3" || e.key === "4")) {
        e.preventDefault();
        const optIdx = parseInt(e.key, 10) - 1;
        if (selectedOption === null && currentQuestion && optIdx < 4) {
          handleAnswerOption(optIdx);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [screen, isPaused, energyPercent, selectedOption, currentQuestion, triggerJump]);

  // Identificar materiales guardados
  const getSubjectMaterials = (worldId: WorldId): SubjectTopic[] => {
    const subject = SCHOOL_SUBJECTS.find((s) => s.id === worldId);
    if (subject && subject.topics.length > 0) {
      return subject.topics;
    }
    return [];
  };

  // Generar preguntas estrictas a partir del material
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

  // Iniciar partida
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

    const firstQuestionTime = calculateQuestionTime(questions[0], levelNum);

    setQuestionsPool(questions);
    setCurrentQIndex(0);
    setCurrentQuestion(questions[0]);
    setQTimer(firstQuestionTime);
    setQTimerMax(firstQuestionTime);
    setSelectedOption(null);

    // Inicia al 100% de energía para disfrutar la carrera libre
    energyRef.current = 100;
    setEnergyPercent(100);

    setLives(3);
    playerYOffsetRef.current = 0;
    playerYVelRef.current = 0;
    isJumpingRef.current = false;
    playerDistanceRef.current = 0;

    // Distancia inicial amplia (240px de ventaja para que no atrape rápido)
    targetMonsterDistRef.current = 240;
    relativeMonsterDistanceRef.current = 240;
    catchingSequenceRef.current = { active: false, timer: 0, duration: 1.4 };

    targetSpeedRef.current = 1.0;
    currentSpeedRef.current = 1.0;
    screenShakeRef.current = 0;
    answerBannerRef.current = null;

    setPlayerDistanceMeters(0);
    setGameXp(0);
    setCollectedCoins(0);
    setCorrectAnswersCount(0);
    setWrongAnswersCount(0);
    setStreak(0);
    setMaxStreak(0);
    setTimeElapsed(0);
    setIsPaused(false);
    setActiveTurboTime(0);
    setActiveFreezeTime(0);
    setHasShield(false);

    setScreen("playing");
  };

  // Temporizador de preguntas (activo cuando la energía está baja <= 35%)
  useEffect(() => {
    if (screen !== "playing" || isPaused || energyPercent > 35 || selectedOption !== null || catchingSequenceRef.current.active) return;

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
  }, [screen, isPaused, energyPercent, selectedOption, currentQuestion]);

  const handleTimeOut = () => {
    if (selectedOption !== null || !currentQuestion || catchingSequenceRef.current.active) return;
    handleAnswerOption(-1);
  };

  // Manejar respuesta
  const handleAnswerOption = (optionIndex: number) => {
    if (selectedOption !== null || !currentQuestion || catchingSequenceRef.current.active) return;
    setSelectedOption(optionIndex);

    const isCorrect = optionIndex === currentQuestion.correctIndex;
    const lvlConfig = LEVELS_CONFIG[selectedLevel - 1] || LEVELS_CONFIG[0];

    if (isCorrect) {
      playSfx("correct");
      playSfx("recharge");
      setCorrectAnswersCount((c) => c + 1);
      setStreak((s) => {
        const next = s + 1;
        if (next > maxStreak) setMaxStreak(next);
        return next;
      });
      setGameXp((xp) => xp + 60 + streak * 10);
      setCollectedCoins((c) => c + 3);

      // ¡Recarga 100% de Energía + Mega Nitro Boost!
      energyRef.current = 100;
      setEnergyPercent(100);
      targetSpeedRef.current = 1.35;
      targetMonsterDistRef.current = Math.min(260, targetMonsterDistRef.current + 70);
      answerBannerRef.current = { text: "⚡ ¡ENERGÍA AL 100%! 🚀 NITRO BOOST ACTIVADO", color: "#10b981", timer: 2.2 };

      // Cargar la siguiente pregunta para cuando vuelva a bajar la energía
      setTimeout(() => {
        setSelectedOption(null);
        const nextIdx = (currentQIndex + 1) % questionsPool.length;
        setCurrentQIndex(nextIdx);
        setCurrentQuestion(questionsPool[nextIdx]);
        const nextTime = calculateQuestionTime(questionsPool[nextIdx], selectedLevel);
        setQTimer(nextTime);
        setQTimerMax(nextTime);
      }, 1000);

      setTimeout(() => {
        targetSpeedRef.current = 1.0;
      }, 3500);
    } else {
      if (hasShield) {
        setHasShield(false);
        toast.info("🛡️ ¡El Escudo absorbió el fallo!");
        energyRef.current = 50;
        setEnergyPercent(50);
        answerBannerRef.current = { text: "🛡️ ¡ESCUDO TE PROTEGIÓ! ENERGÍA PARCIAL", color: "#38bdf8", timer: 2.0 };
        setTimeout(() => {
          setSelectedOption(null);
        }, 1000);
      } else {
        playSfx("wrong");
        setWrongAnswersCount((w) => w + 1);
        setStreak(0);
        setLives((l) => Math.max(0, l - 1));

        // Recarga de emergencia moderada (25%) para no atraparlo de la nada
        energyRef.current = 25;
        setEnergyPercent(25);
        targetSpeedRef.current = 0.85;
        targetMonsterDistRef.current = Math.max(20, targetMonsterDistRef.current - 35);
        screenShakeRef.current = 7;
        answerBannerRef.current = { text: "❌ ¡FALLO! 👾 EL ENEMIGO SE ACERCA", color: "#ef4444", timer: 2.0 };

        if (lives <= 1) {
          targetMonsterDistRef.current = 0;
          return;
        }

        setTimeout(() => {
          setSelectedOption(null);
          targetSpeedRef.current = 1.0;
        }, 1000);
      }
    }
  };

  const triggerGameOver = () => {
    playSfx("gameover");
    setScreen("gameover");
  };

  const triggerVictory = async () => {
    playSfx("victory");
    setScreen("victory");

    const lvlConfig = LEVELS_CONFIG[selectedLevel - 1] || LEVELS_CONFIG[0];
    const earnedXp = lvlConfig.bonusXp + correctAnswersCount * 30;
    const earnedCoins = lvlConfig.bonusCoins + collectedCoins;

    const accuracy = questionsPool.length > 0 ? (correctAnswersCount / questionsPool.length) * 100 : 100;
    const stars = accuracy >= 80 ? 3 : accuracy >= 50 ? 2 : 1;

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
    } catch {}
  };

  // ========================================================
  // MOTOR DEL VIDEOJUEGO (60 FPS RUNNER + ENERGÍA Y PERSECUCIÓN)
  // ========================================================
  useEffect(() => {
    if (screen !== "playing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const theme = WORLDS[selectedWorld] || WORLDS.quimica;
    const lvlConfig = LEVELS_CONFIG[selectedLevel - 1] || LEVELS_CONFIG[0];

    let groundOffset = 0;
    let bgHillsOffset = 0;
    let cloudOffset = 0;

    interface SceneryObject {
      x: number;
      type: "tree" | "rock" | "sign";
      size: number;
    }

    interface TrackItem {
      x: number;
      type: "coin" | "obstacle";
    }

    let sceneryObjects: SceneryObject[] = [
      { x: 100, type: "tree", size: 30 },
      { x: 280, type: "rock", size: 18 },
      { x: 450, type: "tree", size: 36 },
      { x: 620, type: "sign", size: 24 },
      { x: 800, type: "tree", size: 32 },
    ];

    let trackItems: TrackItem[] = [
      { x: 350, type: "coin" },
      { x: 500, type: "obstacle" },
      { x: 680, type: "coin" },
      { x: 880, type: "obstacle" },
    ];

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
        // Chequear si estamos en secuencia de captura
        if (catchingSequenceRef.current.active) {
          catchingSequenceRef.current.timer -= dt;
          screenShakeRef.current = Math.min(10, screenShakeRef.current + 0.5);

          if (catchingSequenceRef.current.timer <= 0) {
            triggerGameOver();
            return;
          }
        } else {
          // 1. Interpolación de velocidad fluida
          currentSpeedRef.current += (targetSpeedRef.current - currentSpeedRef.current) * Math.min(1, dt * 3);
          const speed = currentSpeedRef.current;
          const scrollSpeedPx = speed * 180 * dt;

          // 2. Distancia recorrida
          playerDistanceRef.current += speed * 16 * dt;
          setPlayerDistanceMeters(Math.round(playerDistanceRef.current));
          setTimeElapsed((t) => t + dt);

          // Verificar si llegó a la meta
          if (playerDistanceRef.current >= lvlConfig.targetDistance) {
            triggerVictory();
            return;
          }

          // 3. FÍSICA Y CONSUMO DE ENERGÍA (Ritmo suave y generoso: dura ~35s)
          energyRef.current = Math.max(0, energyRef.current - 2.8 * dt);
          setEnergyPercent(Math.round(energyRef.current));

          // 4. Física de Salto del Jugador
          if (isJumpingRef.current) {
            playerYOffsetRef.current += playerYVelRef.current * dt;
            playerYVelRef.current -= 950 * dt; // gravedad
            if (playerYOffsetRef.current <= 0) {
              playerYOffsetRef.current = 0;
              playerYVelRef.current = 0;
              isJumpingRef.current = false;
            }
          }

          // 5. Persecución Suave y con Mucho Más Tiempo
          if (activeFreezeTime <= 0) {
            // El monstruo solo se acerca muy despacio si el jugador va muy lento o sin energía
            if (speed < 1.0 || energyRef.current <= 0) {
              targetMonsterDistRef.current = Math.max(0, targetMonsterDistRef.current - 8 * dt);
            }

            // Lerp de aproximación gradual
            relativeMonsterDistanceRef.current +=
              (targetMonsterDistRef.current - relativeMonsterDistanceRef.current) * Math.min(1, dt * 2.0);

            // Secuencia dramática de captura solo si entra en contacto directo (<= 16px)
            if (relativeMonsterDistanceRef.current <= 16) {
              catchingSequenceRef.current = { active: true, timer: 1.4, duration: 1.4 };
              playSfx("wrong");
              screenShakeRef.current = 12;
            }
          }

          // 6. Screen Shake y Banner timer
          if (screenShakeRef.current > 0) {
            screenShakeRef.current = Math.max(0, screenShakeRef.current - dt * 15);
          }
          if (answerBannerRef.current) {
            answerBannerRef.current.timer -= dt;
            if (answerBannerRef.current.timer <= 0) answerBannerRef.current = null;
          }

          // 7. Desplazamiento del Escenario (Parallax Layers)
          groundOffset = (groundOffset + scrollSpeedPx) % 60;
          bgHillsOffset = (bgHillsOffset + scrollSpeedPx * 0.3) % 400;
          cloudOffset = (cloudOffset + scrollSpeedPx * 0.1) % 600;

          // Desplazar árboles y rocas del fondo
          sceneryObjects.forEach((obj) => {
            obj.x -= scrollSpeedPx;
            if (obj.x < -60) {
              obj.x = (canvas.width || 500) + Math.random() * 120;
            }
          });

          // 8. Desplazar Monedas y Obstáculos en el camino
          trackItems.forEach((item) => {
            item.x -= scrollSpeedPx;

            const playerScreenX = Math.max(160, Math.min((canvas.width || 400) * 0.58, 280));
            if (Math.abs(item.x - playerScreenX) < 22) {
              if (item.type === "coin") {
                playSfx("coin");
                setCollectedCoins((c) => c + 1);
                setGameXp((xp) => xp + 15);
                // Moneda recarga +8% de energía
                energyRef.current = Math.min(100, energyRef.current + 8);
                setEnergyPercent(Math.round(energyRef.current));
                item.x = -100;
              } else if (item.type === "obstacle") {
                if (playerYOffsetRef.current > 20) {
                  // Salto exitoso sobre obstáculo -> +5% energía
                  energyRef.current = Math.min(100, energyRef.current + 5);
                  setEnergyPercent(Math.round(energyRef.current));
                } else {
                  // Golpe con obstáculo
                  playSfx("wrong");
                  targetSpeedRef.current = 0.85;
                  targetMonsterDistRef.current = Math.max(25, targetMonsterDistRef.current - 25);
                  energyRef.current = Math.max(0, energyRef.current - 10);
                  setEnergyPercent(Math.round(energyRef.current));
                  setLives((l) => Math.max(0, l - 1));
                  screenShakeRef.current = 6;
                  item.x = -100;
                  setTimeout(() => {
                    targetSpeedRef.current = 1.0;
                  }, 1800);
                }
              }
            }

            if (item.x < -60) {
              item.x = (canvas.width || 500) + Math.random() * 200 + 150;
              item.type = Math.random() > 0.5 ? "coin" : "obstacle";
            }
          });
        }
      }

      // ==========================================
      // RENDERIZADO DEL VIDEOJUEGO (60 FPS)
      // ==========================================
      const w = canvas.width || 450;
      const h = canvas.height || 220;
      ctx.clearRect(0, 0, w, h);

      ctx.save();
      if (screenShakeRef.current > 0) {
        const shakeX = (Math.random() - 0.5) * screenShakeRef.current;
        const shakeY = (Math.random() - 0.5) * screenShakeRef.current;
        ctx.translate(shakeX, shakeY);
      }

      const roadY = h - 45;

      // 1. Cielo Gradiente Parallax
      const skyGrad = ctx.createLinearGradient(0, 0, 0, roadY);
      skyGrad.addColorStop(0, theme.skyTopColor);
      skyGrad.addColorStop(1, theme.skyBottomColor);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, roadY);

      // Nubes flotantes
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      for (let i = 0; i < 4; i++) {
        const cx = ((i * 220 - cloudOffset) % (w + 200)) - 100;
        ctx.beginPath();
        ctx.arc(cx, 30 + (i % 2) * 15, 25, 0, Math.PI * 2);
        ctx.arc(cx + 20, 25 + (i % 2) * 15, 30, 0, Math.PI * 2);
        ctx.arc(cx + 45, 30 + (i % 2) * 15, 22, 0, Math.PI * 2);
        ctx.fill();
      }

      // Montañas en el fondo
      ctx.fillStyle = theme.groundColor;
      ctx.beginPath();
      ctx.moveTo(0, roadY);
      for (let i = -100; i < w + 200; i += 80) {
        const hillX = i - bgHillsOffset;
        ctx.lineTo(hillX, roadY - 45 - Math.sin(i * 0.03) * 20);
      }
      ctx.lineTo(w, roadY);
      ctx.closePath();
      ctx.fill();

      // 2. Elementos Decorativos del Escenario
      sceneryObjects.forEach((obj) => {
        if (obj.type === "tree") {
          ctx.fillStyle = "#3f2715";
          ctx.fillRect(obj.x - 3, roadY - obj.size, 6, obj.size);
          ctx.fillStyle = theme.monsterColor;
          ctx.beginPath();
          ctx.arc(obj.x, roadY - obj.size - 10, obj.size * 0.45, 0, Math.PI * 2);
          ctx.fill();
        } else if (obj.type === "rock") {
          ctx.fillStyle = "#64748b";
          ctx.beginPath();
          ctx.ellipse(obj.x, roadY - 6, obj.size * 0.6, obj.size * 0.4, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (obj.type === "sign") {
          ctx.fillStyle = "#475569";
          ctx.fillRect(obj.x - 2, roadY - 26, 4, 26);
          ctx.fillStyle = "#f59e0b";
          ctx.fillRect(obj.x - 12, roadY - 26, 24, 14);
          ctx.fillStyle = "#0f172a";
          ctx.font = "bold 8px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("⚡", obj.x, roadY - 16);
        }
      });

      // 3. El Camino Principal (Road)
      ctx.fillStyle = theme.roadColor;
      ctx.fillRect(0, roadY, w, h - roadY);

      // Borde Superior del Camino
      ctx.strokeStyle = theme.roadLineColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, roadY);
      ctx.lineTo(w, roadY);
      ctx.stroke();

      // Líneas punteadas del camino
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 2;
      ctx.setLineDash([20, 15]);
      ctx.lineDashOffset = groundOffset;
      ctx.beginPath();
      ctx.moveTo(0, roadY + 18);
      ctx.lineTo(w, roadY + 18);
      ctx.stroke();
      ctx.setLineDash([]);

      // 4. Dibujar Monedas y Obstáculos
      trackItems.forEach((item) => {
        if (item.type === "coin") {
          ctx.fillStyle = "#facc15";
          ctx.beginPath();
          ctx.arc(item.x, roadY - 14, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ca8a04";
          ctx.font = "bold 11px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("🪙", item.x, roadY - 10);
        } else if (item.type === "obstacle") {
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(item.x - 12, roadY - 18, 24, 18);
          ctx.fillStyle = "#fca5a5";
          ctx.fillRect(item.x - 9, roadY - 15, 18, 12);
          ctx.fillStyle = "#991b1b";
          ctx.font = "bold 9px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("⚠️", item.x, roadY - 6);
        }
      });

      // 5. POSICIONES DE LOS PERSONAJES
      const playerScreenX = Math.max(160, Math.min(w * 0.58, 280));
      const monsterScreenX = playerScreenX - relativeMonsterDistanceRef.current;
      const isCatching = catchingSequenceRef.current.active;
      const playerY = roadY - playerYOffsetRef.current + (isCatching ? 12 : 0);

      // ==========================================
      // 👾 DIBUJAR AL PERSEGUIDOR (ENEMIGO VISIBLE DETRÁS)
      // ==========================================
      const monsterStride = Math.sin(timestamp * 0.018 * currentSpeedRef.current) * 8;
      const monsterBob = Math.abs(Math.sin(timestamp * 0.018)) * 4;

      ctx.save();
      const catchLungeX = isCatching ? (1.4 - catchingSequenceRef.current.timer) * 20 : 0;
      ctx.translate(monsterScreenX + catchLungeX, roadY - monsterBob - (isCatching ? 15 : 0));

      // Sombra del Monstruo
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.beginPath();
      ctx.ellipse(0, 0, 24, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Piernas del Monstruo
      ctx.fillStyle = theme.monsterSecondary;
      ctx.fillRect(-12, -18 + monsterStride, 8, 18);
      ctx.fillRect(4, -18 - monsterStride, 8, 18);

      // Garras de los pies
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(-14, -2 + monsterStride, 12, 4);
      ctx.fillRect(2, -2 - monsterStride, 12, 4);

      // Cuerpo del Monstruo
      ctx.fillStyle = theme.monsterColor;
      ctx.shadowColor = theme.monsterColor;
      ctx.shadowBlur = isCatching ? 25 : 15;
      ctx.beginPath();
      ctx.roundRect(-20, -50, 40, 36, 10);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Cuernos / Espinas
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.moveTo(-16, -50);
      ctx.lineTo(-24, -64);
      ctx.lineTo(-10, -50);
      ctx.moveTo(16, -50);
      ctx.lineTo(24, -64);
      ctx.lineTo(10, -50);
      ctx.fill();

      // Brazos y Garras
      ctx.fillStyle = theme.monsterSecondary;
      ctx.fillRect(8, isCatching ? -50 : -40, isCatching ? 26 : 18, 8);
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(isCatching ? 34 : 26, isCatching ? -52 : -42);
      ctx.lineTo(isCatching ? 44 : 34, isCatching ? -46 : -36);
      ctx.lineTo(isCatching ? 34 : 26, isCatching ? -40 : -30);
      ctx.fill();

      // Ojos Rojos Amenazantes
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(-4, -40, 6, 0, Math.PI * 2);
      ctx.arc(8, -40, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(-3, -40, 3.5, 0, Math.PI * 2);
      ctx.arc(9, -40, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Boca con Colmillos Afilados
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.roundRect(-12, -28, 26, isCatching ? 16 : 10, 4);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(-10, -28);
      ctx.lineTo(-7, -22);
      ctx.lineTo(-4, -28);
      ctx.lineTo(-1, -22);
      ctx.lineTo(2, -28);
      ctx.lineTo(5, -22);
      ctx.lineTo(8, -28);
      ctx.fill();

      ctx.restore();

      // ==========================================
      // 🏃 DIBUJAR AL PERSONAJE JUGADOR (CORREDOR VISIBLE)
      // ==========================================
      const runCycle = timestamp * 0.02 * currentSpeedRef.current;
      const legOffset = isCatching ? 0 : Math.sin(runCycle) * 10;
      const armOffset = isCatching ? 0 : Math.sin(runCycle + Math.PI) * 8;
      const playerBob = isCatching ? 0 : Math.abs(Math.sin(runCycle)) * 3;

      const equippedOutfit = CLOSET_ITEMS.find((c) => c.id === equippedItems.outfit) || CLOSET_ITEMS[4];
      const equippedHair = CLOSET_ITEMS.find((c) => c.id === equippedItems.hair) || CLOSET_ITEMS[0];

      ctx.save();
      ctx.translate(playerScreenX, playerY - playerBob);

      if (isCatching) {
        ctx.rotate(0.45);
      }

      // Sombra en el camino
      const shadowScale = Math.max(0.3, 1 - playerYOffsetRef.current / 80);
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.beginPath();
      ctx.ellipse(0, playerYOffsetRef.current, 16 * shadowScale, 5 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();

      // Estela de velocidad (Speed Lines)
      if (currentSpeedRef.current > 1.05 && !isCatching) {
        ctx.strokeStyle = "rgba(56, 189, 248, 0.6)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-20, -25);
        ctx.lineTo(-45, -25);
        ctx.moveTo(-18, -15);
        ctx.lineTo(-38, -15);
        ctx.stroke();
      }

      // Piernas y Tenis
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(-6, -14 + legOffset, 5, 14);
      ctx.fillRect(2, -14 - legOffset, 5, 14);
      // Tenis de color
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(-7, -2 + legOffset, 8, 4);
      ctx.fillRect(1, -2 - legOffset, 8, 4);

      // Torso
      ctx.fillStyle = equippedOutfit.color;
      ctx.beginPath();
      ctx.roundRect(-8, -32, 16, 20, 4);
      ctx.fill();

      // Mochila
      ctx.fillStyle = "#475569";
      ctx.fillRect(-12, -30, 4, 14);

      // Brazo
      ctx.fillStyle = equippedOutfit.color;
      ctx.fillRect(-4 + armOffset, -28, 5, 12);

      // Cabeza y Rostro
      ctx.fillStyle = "#fcd34d";
      ctx.beginPath();
      ctx.arc(0, -38, 9, 0, Math.PI * 2);
      ctx.fill();

      // Cabello
      ctx.fillStyle = equippedHair.color;
      ctx.beginPath();
      ctx.arc(0, -41, 10, Math.PI * 0.9, Math.PI * 2.1);
      ctx.fill();

      // Ojos y Rostro
      ctx.fillStyle = "#0f172a";
      if (isCatching) {
        ctx.font = "bold 9px sans-serif";
        ctx.fillText("✖", 2, -36);
        ctx.fillText("✖", 6, -36);
      } else {
        ctx.fillRect(2, -39, 2, 3);
        ctx.fillRect(5, -39, 2, 3);
      }

      ctx.restore();

      // 6. Alerta Visual si el Monstruo está muy cerca (< 50px)
      if (relativeMonsterDistanceRef.current < 55 && !isCatching) {
        ctx.save();
        ctx.fillStyle = "rgba(239, 68, 68, 0.25)";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.shadowColor = "#ef4444";
        ctx.shadowBlur = 8;
        ctx.fillText(`⚠️ ¡${theme.monsterName.toUpperCase()} ESTÁ A PUNTO DE ALCANZARTE!`, w / 2, 30);
        ctx.restore();
      }

      // 7. Banner de Secuencia de Captura
      if (isCatching) {
        ctx.save();
        ctx.fillStyle = "rgba(15, 23, 42, 0.7)";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#ef4444";
        ctx.font = "black 16px sans-serif";
        ctx.textAlign = "center";
        ctx.shadowColor = "#ef4444";
        ctx.shadowBlur = 12;
        ctx.fillText("👾 ¡EL PERSEGUIDOR TE ATRAPÓ!", w / 2, h / 2 - 10);
        ctx.restore();
      }

      // 8. Banner de Animación ("¡CORRECTO!" / "¡INCORRECTO!")
      if (answerBannerRef.current && !isCatching && relativeMonsterDistanceRef.current >= 55) {
        ctx.save();
        ctx.fillStyle = answerBannerRef.current.color;
        ctx.font = "bold 13px sans-serif";
        ctx.textAlign = "center";
        ctx.shadowColor = answerBannerRef.current.color;
        ctx.shadowBlur = 10;
        ctx.fillText(answerBannerRef.current.text, w / 2, 30);
        ctx.restore();
      }

      ctx.restore();

      animFrameIdRef.current = requestAnimationFrame(gameLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [screen, isPaused, selectedWorld, selectedLevel, activeFreezeTime]);

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
                ¡Corre libremente por el camino, esquiva obstáculos y responde cuando la energía esté baja para activar el Nitro!
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
                        <span>⚡ Sistema de Energía y Nitro</span>
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
      {/* 5. PANTALLA COMPLETA DE PARTIDA (RUNNER + ENERGÍA) */}
      {/* ======================================================== */}
      {screen === "playing" && (
        <div className="fixed inset-0 z-50 w-full h-full max-h-screen flex flex-col justify-between overflow-hidden bg-slate-950 text-white select-none">
          {/* Header Superior con Barra de Distancia y Stats */}
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

            {/* Barra de Progreso de la Carrera: 🏃 250 m / 1000 m 🏁 */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1 rounded-full text-[11px] font-bold">
              <span className="text-cyan-300 font-mono font-black">
                🏃 {Math.round(playerDistanceMeters)} m / {currentLvlConfig.targetDistance || 500} m 🏁
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

          {/* Centro: Escenario Completo de Persecución (60 FPS) */}
          <div className="flex-1 w-full min-h-[160px] relative overflow-hidden bg-slate-950">
            <canvas ref={canvasRef} className="w-full h-full block" />
          </div>

          {/* ======================================================== */}
          {/* PARTE INFERIOR: HUD DINÁMICO */}
          {/* ======================================================== */}
          {/* SI LA ENERGÍA ES ALTA (> 35%): Panel de Carrera Libre */}
          {energyPercent > 35 ? (
            <div className="w-full shrink-0 border-t-2 border-cyan-500/40 bg-slate-900/98 p-3 sm:p-4 space-y-3 z-30 max-w-2xl mx-auto shadow-2xl animate-fade-in">
              {/* Barra de Energía Nitro */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold flex items-center gap-1.5 text-cyan-300">
                    <Zap className="size-4 text-cyan-400" />
                    <span>ENERGÍA NITRO: {energyPercent}%</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    🪙 Recoge monedas o salta para mantener la energía
                  </span>
                </div>

                <div className="h-3.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
                  <div
                    className="h-full rounded-full transition-all duration-200 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 shadow-lg shadow-cyan-500/50"
                    style={{ width: `${energyPercent}%` }}
                  />
                </div>
              </div>

              {/* Botón de Salto Cómodo */}
              <div>
                <button
                  onClick={triggerJump}
                  className="w-full h-14 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 active:brightness-125 text-white font-display text-sm sm:text-base font-black flex items-center justify-center gap-2.5 shadow-xl shadow-purple-500/30 transition active:scale-95 cursor-pointer"
                  title="Saltar Obstáculo (Espacio / W)"
                >
                  <ArrowUp className="size-5" />
                  <span>SALTAR OBSTÁCULO (ESPACIO / W)</span>
                </button>
              </div>
            </div>
          ) : (
            /* SI LA ENERGÍA ES BAJA (<= 35%): Tarjeta de Pregunta para Recargar */
            <div className="w-full shrink-0 border-t-2 border-purple-500/60 bg-slate-900 p-3 sm:p-4 space-y-2.5 z-30 max-w-2xl mx-auto shadow-2xl animate-fade-in">
              {/* Header de Recarga + Temporizador */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-rose-600 text-white shadow-sm flex items-center gap-1.5 animate-pulse">
                  <Zap className="size-3.5 fill-white text-white" />
                  <span>⚡ ¡ENERGÍA BAJA ({energyPercent}%)! Responde para recargar:</span>
                </span>

                {/* Countdown Timer */}
                <div className="flex items-center gap-1.5 font-black bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
                  <Clock className="size-3.5 text-amber-400" />
                  <span
                    className={`text-xs font-mono ${
                      qTimer <= 4 ? "text-rose-400 font-black animate-pulse" : qTimer <= 8 ? "text-amber-400" : "text-emerald-300"
                    }`}
                  >
                    ⏱️ {qTimer}s
                  </span>
                </div>
              </div>

              {/* Barra de tiempo de la pregunta */}
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-300 ${
                    qTimer <= 4
                      ? "bg-rose-500"
                      : qTimer <= 8
                      ? "bg-amber-400"
                      : "bg-gradient-to-r from-purple-500 via-cyan-400 to-emerald-400"
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
                  Cargando pregunta de recarga...
                </div>
              )}

              {/* 4 Opciones de Respuesta con letras grandes 🅰️ 🅱️ 🅲️ 🅳️ */}
              {currentQuestion && (
                <div className="grid grid-cols-2 gap-2">
                  {currentQuestion.options.map((opt, idx) => {
                    const letters = ["🅰️", "🅱️", "🅲️", "🅳️"];
                    const isSelected = selectedOption === idx;
                    const isCorrect = idx === currentQuestion.correctIndex;

                    let optClass = "border-2 border-slate-700 bg-slate-800 hover:bg-slate-700 hover:border-purple-400 text-white";

                    if (selectedOption !== null) {
                      if (isCorrect) {
                        optClass = "border-2 border-emerald-400 bg-emerald-600 text-white font-black shadow-lg shadow-emerald-500/20";
                      } else if (isSelected) {
                        optClass = "border-2 border-rose-400 bg-rose-600 text-white font-black shadow-lg shadow-rose-500/20";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        disabled={selectedOption !== null || catchingSequenceRef.current.active}
                        onClick={() => handleAnswerOption(idx)}
                        className={`p-2.5 sm:p-3 rounded-xl text-left text-xs sm:text-sm font-bold leading-tight transition active:scale-95 cursor-pointer flex items-center gap-2 shadow-md ${optClass}`}
                      >
                        <span className="text-base shrink-0">
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

              {/* Botón de Salto por si aparece un obstáculo mientras respondes */}
              <div className="pt-0.5">
                <button
                  onClick={triggerJump}
                  className="w-full h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700 transition active:scale-95 cursor-pointer"
                >
                  <ArrowUp className="size-3.5" />
                  <span>SALTAR OBSTÁCULO (ESPACIO)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. PANTALLA DE DERROTA */}
      {/* ======================================================== */}
      {screen === "gameover" && (
        <div className="flex-1 w-full h-full overflow-y-auto p-4 md:p-6 max-w-md mx-auto flex flex-col justify-center text-center space-y-5 animate-fade-in">
          <div className="space-y-1">
            <span className="text-5xl animate-bounce block">👾</span>
            <h2 className="font-display text-2xl font-black text-rose-500">¡TE ATRAPÓ!</h2>
            <p className="text-xs text-slate-400">
              {currentTheme.monsterName} te alcanzó en el camino. ¡Repasa tus apuntes y vuelve a intentar!
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
              ¡NIVEL COMPLETADO! 🏆
            </h2>
            <p className="text-xs text-slate-400">
              ¡Has escapado con éxito de {currentTheme.monsterName} y cruzado la meta!
            </p>
          </div>

          <div className="p-4 rounded-3xl border border-emerald-500/30 bg-emerald-950/20 space-y-2 text-xs text-left">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">⭐ Experiencia:</span>
              <span className="font-bold text-cyan-400">+{currentLvlConfig.bonusXp + correctAnswersCount * 30} XP</span>
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
