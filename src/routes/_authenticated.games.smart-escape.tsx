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
  options: string[];
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

  // Sistema de Combustible Nitro (0% a 100%) - La pregunta aparece SÓLO cuando Nitro <= 20%
  const [energyPercent, setEnergyPercent] = useState<number>(100);
  const energyRef = useRef<number>(100);
  const [showQuestionCard, setShowQuestionCard] = useState<boolean>(false);
  const showQuestionCardRef = useRef<boolean>(false);
  const isQuestionCooldownRef = useRef<boolean>(false);

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
  const [activeMagnetTime, setActiveMagnetTime] = useState(0);
  const [hasShield, setHasShield] = useState(false);

  // Smooth Physics & Game Loop State (Mutable Refs for 60 FPS)
  const playerYOffsetRef = useRef<number>(0);
  const playerYVelRef = useRef<number>(0);
  const isJumpingRef = useRef<boolean>(false);
  const playerXRef = useRef<number>(200);
  const playerTargetXRef = useRef<number>(200);
  const playerStumbleTimerRef = useRef<number>(0);
  const playerDistanceRef = useRef<number>(0);

  // Persecución Suave y con Mucho Más Tiempo
  const relativeMonsterDistanceRef = useRef<number>(240); // Inicia lejos (240px)
  const targetMonsterDistRef = useRef<number>(240);
  const catchingSequenceRef.current = {
    active: false,
    timer: 0,
    duration: 1.4,
  };

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
  const playSfx = (type: "jump" | "coin" | "correct" | "wrong" | "turbo" | "recharge" | "powerup" | "gameover" | "victory") => {
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
      } else if (type === "powerup") {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
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
    playerYVelRef.current = 430;
    playSfx("jump");
  }, [soundEnabled]);

  // Movimiento lateral (⬅️ Izquierda / ➡️ Derecha)
  const moveLeft = useCallback(() => {
    if (catchingSequenceRef.current.active) return;
    playerTargetXRef.current = Math.max(110, playerTargetXRef.current - 45);
  }, []);

  const moveRight = useCallback(() => {
    if (catchingSequenceRef.current.active) return;
    playerTargetXRef.current = Math.min(330, playerTargetXRef.current + 45);
  }, []);

  // Teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (screen !== "playing" || isPaused || catchingSequenceRef.current.active) return;

      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W" || e.key === " ") {
        e.preventDefault();
        triggerJump();
      } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        moveLeft();
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        moveRight();
      } else if (showQuestionCard && (e.key === "1" || e.key === "2" || e.key === "3" || e.key === "4")) {
        e.preventDefault();
        const optIdx = parseInt(e.key, 10) - 1;
        if (selectedOption === null && currentQuestion && optIdx < currentQuestion.options.length) {
          handleAnswerOption(optIdx);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [screen, isPaused, showQuestionCard, selectedOption, currentQuestion, triggerJump, moveLeft, moveRight]);

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
      rawQuestions = PAA_OFFICIAL_QUESTIONS.map((q, idx) => ({
        id: `paa-${idx}`,
        question: q.q,
        options: q.options && q.options.length > 0 ? q.options : ["A", "B", "C", "D"],
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        topic: "PAA College Board",
        sourceExcerpt: "Guía Oficial PAA College Board",
      }));
    } else if (worldId === "exani") {
      rawQuestions = EXANI_OFFICIAL_QUESTIONS.map((q, idx) => ({
        id: `exani-${idx}`,
        question: q.q,
        options: q.options && q.options.length > 0 ? q.options : ["A", "B", "C", "D"],
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        topic: "EXANI-II Ceneval",
        sourceExcerpt: "Temario Oficial EXANI-II 2025",
      }));
    } else {
      const subject = SCHOOL_SUBJECTS.find((s) => s.id === worldId);
      if (subject) {
        const topic = subject.topics.find((t) => t.id === topicId) || subject.topics[0];
        if (topic && topic.presetQuestions && topic.presetQuestions.length > 0) {
          rawQuestions = topic.presetQuestions.map((pq, idx) => ({
            id: `${topic.id}-${idx}`,
            question: pq.question,
            options: pq.options && pq.options.length > 0 ? pq.options : ["A", "B", "C", "D"],
            correctIndex: pq.correctIndex !== undefined ? pq.correctIndex : 0,
            explanation: pq.explanation || `Basado en: "${topic.explanation.slice(0, 100)}..."`,
            topic: `${subject.name}: ${topic.name}`,
            sourceExcerpt: topic.explanation,
          }));
        }

        // Fallback a todos los temas de la materia si estuviera vacío
        if (rawQuestions.length === 0) {
          subject.topics.forEach((t) => {
            if (t.presetQuestions) {
              t.presetQuestions.forEach((pq, idx) => {
                rawQuestions.push({
                  id: `${t.id}-${idx}`,
                  question: pq.question,
                  options: pq.options && pq.options.length > 0 ? pq.options : ["A", "B", "C", "D"],
                  correctIndex: pq.correctIndex !== undefined ? pq.correctIndex : 0,
                  explanation: pq.explanation || `Basado en: "${t.explanation.slice(0, 100)}..."`,
                  topic: `${subject.name}: ${t.name}`,
                  sourceExcerpt: t.explanation,
                });
              });
            }
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

    // Inicia al 100% de combustible Nitro (carrera normal sin preguntas)
    energyRef.current = 100;
    setEnergyPercent(100);
    showQuestionCardRef.current = false;
    setShowQuestionCard(false);
    isQuestionCooldownRef.current = false;

    setLives(3);
    playerYOffsetRef.current = 0;
    playerYVelRef.current = 0;
    isJumpingRef.current = false;
    playerDistanceRef.current = 0;

    // Distancia inicial del enemigo
    targetMonsterDistRef.current = 220;
    relativeMonsterDistanceRef.current = 220;
    catchingSequenceRef.current = { active: false, timer: 0, duration: 1.2 };

    targetSpeedRef.current = 1.0;
    currentSpeedRef.current = 1.0;
    screenShakeRef.current = 0;
    answerBannerRef.current = null;

    setQuestionsPool(questions);
    setCurrentQIndex(0);
    setCurrentQuestion(questions[0]);
    setQTimer(7);
    setQTimerMax(7);
    setSelectedOption(null);

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

  // Temporizador de 10 segundos (activo únicamente cuando la tarjeta de pregunta se abre por Nitro < 30%)
  useEffect(() => {
    if (
      screen !== "playing" ||
      isPaused ||
      !showQuestionCard ||
      selectedOption !== null ||
      catchingSequenceRef.current.active
    )
      return;

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
  }, [screen, isPaused, showQuestionCard, selectedOption, currentQuestion]);

  const handleTimeOut = () => {
    if (selectedOption !== null || !currentQuestion || catchingSequenceRef.current.active) return;
    playSfx("wrong");
    setWrongAnswersCount((w) => w + 1);
    setLives((l) => Math.max(0, l - 1));
    targetMonsterDistRef.current = Math.max(20, targetMonsterDistRef.current - 40);
    answerBannerRef.current = { text: "⏱️ ¡SE ACABÓ EL TIEMPO! 👾 EL ENEMIGO SE ACERCA", color: "#f59e0b", timer: 2.0 };

    // Cooldown para no spamear otra pregunta de inmediato
    isQuestionCooldownRef.current = true;
    setTimeout(() => {
      isQuestionCooldownRef.current = false;
    }, 3000);

    // Cerrar la tarjeta de pregunta y preparar la siguiente
    setTimeout(() => {
      setSelectedOption(null);
      setShowQuestionCard(false);
      showQuestionCardRef.current = false;
      const nextIdx = (currentQIndex + 1) % (questionsPool.length || 1);
      setCurrentQIndex(nextIdx);
      const nextQ = questionsPool[nextIdx] || currentQuestion;
      setCurrentQuestion(nextQ);
      setQTimer(10);
      setQTimerMax(10);
    }, 500);
  };

  // Manejar respuesta
  const handleAnswerOption = (optionIndex: number) => {
    if (selectedOption !== null || !currentQuestion || catchingSequenceRef.current.active) return;
    setSelectedOption(optionIndex);

    const isCorrect = optionIndex === currentQuestion.correctIndex;

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

      // ¡Recupera +30% de Nitro!
      energyRef.current = Math.min(100, energyRef.current + 30);
      setEnergyPercent(Math.round(energyRef.current));
      targetSpeedRef.current = 1.35;
      targetMonsterDistRef.current = Math.min(650, targetMonsterDistRef.current + 90);

      if (energyRef.current >= 70) {
        // Superó el 70%: La pregunta desaparece y vuelve a carrera libre
        answerBannerRef.current = {
          text: `🚀 ¡NITRO AL ${Math.round(energyRef.current)}%! (≥70%) ¡MODO CARRERA LIBRE!`,
          color: "#10b981",
          timer: 2.8,
        };
        showQuestionCardRef.current = false;
        setShowQuestionCard(false);
        isQuestionCooldownRef.current = false;
        setTimeout(() => {
          setSelectedOption(null);
          const nextIdx = (currentQIndex + 1) % (questionsPool.length || 1);
          setCurrentQIndex(nextIdx);
          const nextQ = questionsPool[nextIdx] || currentQuestion;
          setCurrentQuestion(nextQ);
          setQTimer(10);
          setQTimerMax(10);
        }, 500);
      } else {
        // Sigue menor a 70%: Muestra banner de recarga y continúa recarga
        answerBannerRef.current = {
          text: `⚡ ¡+30% NITRO! (${Math.round(energyRef.current)}% / 70% meta)`,
          color: "#38bdf8",
          timer: 2.0,
        };
        isQuestionCooldownRef.current = true;
        setTimeout(() => {
          isQuestionCooldownRef.current = false;
        }, 2000);

        setTimeout(() => {
          setSelectedOption(null);
          if (energyRef.current < 70) {
            const nextIdx = (currentQIndex + 1) % (questionsPool.length || 1);
            setCurrentQIndex(nextIdx);
            const nextQ = questionsPool[nextIdx] || currentQuestion;
            setCurrentQuestion(nextQ);
            setQTimer(10);
            setQTimerMax(10);
          } else {
            setShowQuestionCard(false);
            showQuestionCardRef.current = false;
          }
        }, 500);
      }

      setTimeout(() => {
        targetSpeedRef.current = 1.0;
      }, 2500);
    } else {
      if (hasShield) {
        setHasShield(false);
        toast.info("🛡️ ¡El Escudo absorbió el fallo!");
        answerBannerRef.current = { text: "🛡️ ¡ESCUDO TE PROTEGIÓ!", color: "#38bdf8", timer: 2.0 };
        isQuestionCooldownRef.current = true;
        setTimeout(() => {
          isQuestionCooldownRef.current = false;
        }, 2500);

        setTimeout(() => {
          setSelectedOption(null);
          setShowQuestionCard(false);
          showQuestionCardRef.current = false;
          const nextIdx = (currentQIndex + 1) % (questionsPool.length || 1);
          setCurrentQIndex(nextIdx);
          const nextQ = questionsPool[nextIdx] || currentQuestion;
          setCurrentQuestion(nextQ);
          setQTimer(10);
          setQTimerMax(10);
        }, 500);
      } else {
        playSfx("wrong");
        setWrongAnswersCount((w) => w + 1);
        setStreak(0);
        setLives((l) => Math.max(0, l - 1));

        targetMonsterDistRef.current = Math.max(20, targetMonsterDistRef.current - 40);
        screenShakeRef.current = 7;
        answerBannerRef.current = { text: "❌ ¡INCORRECTO! 👾 EL ENEMIGO SE ACERCA", color: "#ef4444", timer: 2.0 };

        isQuestionCooldownRef.current = true;
        setTimeout(() => {
          isQuestionCooldownRef.current = false;
        }, 3000);

        if (lives <= 1 || energyRef.current <= 0) {
          energyRef.current = 0;
          setEnergyPercent(0);
          targetMonsterDistRef.current = 0;
          return;
        }

        setTimeout(() => {
          setSelectedOption(null);
          setShowQuestionCard(false);
          showQuestionCardRef.current = false;
          const nextIdx = (currentQIndex + 1) % (questionsPool.length || 1);
          setCurrentQIndex(nextIdx);
          const nextQ = questionsPool[nextIdx] || currentQuestion;
          setCurrentQuestion(nextQ);
          setQTimer(10);
          setQTimerMax(10);
        }, 500);
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

    // Tipos de elementos del circuito
    type ObstacleKind = "rock" | "box" | "log" | "barrier" | "pit" | "hazard" | "car";
    type PowerUpKind = "nitro" | "shield" | "freeze" | "magnet";
    type TrackItemType = "coin" | ObstacleKind | PowerUpKind;

    interface TrackItem {
      id: number;
      x: number;
      type: TrackItemType;
    }

    interface SceneryObject {
      x: number;
      type: "tree" | "rock" | "sign" | "pillar" | "flag";
      size: number;
    }

    const getNextSpawnType = (progress: number): TrackItemType => {
      const rand = Math.random();
      if (progress < 0.25) {
        // Zona Normal (0 - 25%)
        if (rand < 0.50) return "coin";
        if (rand < 0.85) {
          const obs: ObstacleKind[] = ["rock", "box", "log"];
          return obs[Math.floor(Math.random() * obs.length)];
        }
        const pups: PowerUpKind[] = ["nitro", "shield", "magnet", "freeze"];
        return pups[Math.floor(Math.random() * pups.length)];
      } else if (progress < 0.50) {
        // Zona Puente (25 - 50%)
        if (rand < 0.40) return "coin";
        if (rand < 0.85) {
          const obs: ObstacleKind[] = ["barrier", "pit", "box", "log"];
          return obs[Math.floor(Math.random() * obs.length)];
        }
        const pups: PowerUpKind[] = ["shield", "nitro", "freeze"];
        return pups[Math.floor(Math.random() * pups.length)];
      } else if (progress < 0.75) {
        // Zona Peligrosa / Cañón (50 - 75%)
        if (rand < 0.30) return "coin";
        if (rand < 0.85) {
          const obs: ObstacleKind[] = ["hazard", "pit", "rock", "car", "barrier"];
          return obs[Math.floor(Math.random() * obs.length)];
        }
        const pups: PowerUpKind[] = ["nitro", "shield", "magnet"];
        return pups[Math.floor(Math.random() * pups.length)];
      } else if (progress < 0.90) {
        // Zona Super Velocidad (75 - 90%)
        if (rand < 0.45) return "coin";
        if (rand < 0.75) {
          const obs: ObstacleKind[] = ["barrier", "car", "rock"];
          return obs[Math.floor(Math.random() * obs.length)];
        }
        const pups: PowerUpKind[] = ["nitro", "magnet", "freeze", "shield"];
        return pups[Math.floor(Math.random() * pups.length)];
      } else {
        // Zona Final Sprint (90 - 100%)
        if (rand < 0.50) return "coin";
        if (rand < 0.85) {
          const obs: ObstacleKind[] = ["rock", "box", "barrier"];
          return obs[Math.floor(Math.random() * obs.length)];
        }
        const pups: PowerUpKind[] = ["nitro", "shield"];
        return pups[Math.floor(Math.random() * pups.length)];
      }
    };

    let sceneryObjects: SceneryObject[] = [
      { x: 100, type: "tree", size: 30 },
      { x: 280, type: "rock", size: 18 },
      { x: 450, type: "tree", size: 36 },
      { x: 620, type: "sign", size: 24 },
      { x: 800, type: "tree", size: 32 },
      { x: 980, type: "pillar", size: 35 },
    ];

    let trackItems: TrackItem[] = [
      { id: 1, x: 340, type: "coin" },
      { id: 2, x: 480, type: "rock" },
      { id: 3, x: 620, type: "nitro" },
      { id: 4, x: 780, type: "coin" },
      { id: 5, x: 940, type: "box" },
      { id: 6, x: 1100, type: "shield" },
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
        // Actualizar temporizadores de Power-Ups
        if (activeTurboTime > 0) setActiveTurboTime((t) => Math.max(0, t - dt));
        if (activeFreezeTime > 0) setActiveFreezeTime((t) => Math.max(0, t - dt));
        if (activeMagnetTime > 0) setActiveMagnetTime((t) => Math.max(0, t - dt));
        if (playerStumbleTimerRef.current > 0) playerStumbleTimerRef.current = Math.max(0, playerStumbleTimerRef.current - dt);

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
          currentSpeedRef.current += (targetSpeedRef.current - currentSpeedRef.current) * Math.min(1, dt * 3.5);
          const speed = currentSpeedRef.current;
          const scrollSpeedPx = speed * 185 * dt;

          // 2. Distancia recorrida
          playerDistanceRef.current += speed * 16 * dt;
          setPlayerDistanceMeters(Math.round(playerDistanceRef.current));
          setTimeElapsed((t) => t + dt);

          const raceProgress = Math.min(1, playerDistanceRef.current / (lvlConfig.targetDistance || 500));

          // Verificar si llegó a la meta
          if (playerDistanceRef.current >= lvlConfig.targetDistance) {
            triggerVictory();
            return;
          }

          // 3. FÍSICA Y CONSUMO DE COMBUSTIBLE NITRO
          energyRef.current = Math.max(0, energyRef.current - 2.5 * dt);
          setEnergyPercent(Math.round(energyRef.current));

          // REGLA: Preguntas SÓLO cuando energía < 30%. Al superar >= 70%, se desaparecen automáticamente.
          if (
            energyRef.current < 30 &&
            energyRef.current > 0 &&
            !showQuestionCardRef.current &&
            !isQuestionCooldownRef.current &&
            !catchingSequenceRef.current.active
          ) {
            showQuestionCardRef.current = true;
            setShowQuestionCard(true);
            setQTimer(10);
            setQTimerMax(10);
          } else if (energyRef.current >= 70 && showQuestionCardRef.current) {
            // Desaparecen automáticamente cuando la energía supera o iguala 70%
            showQuestionCardRef.current = false;
            setShowQuestionCard(false);
          }

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

          // 5. Interpolación de Movimiento Lateral (X)
          playerXRef.current += (playerTargetXRef.current - playerXRef.current) * Math.min(1, dt * 9);

          // 6. Efecto del Imán de Monedas
          if (activeMagnetTime > 0) {
            const pX = playerXRef.current;
            trackItems.forEach((it) => {
              if (it.type === "coin") {
                const diff = pX - it.x;
                if (Math.abs(diff) < 260) {
                  it.x += (diff > 0 ? 1 : -1) * 380 * dt;
                }
              }
            });
          }

          // 7. COMPORTAMIENTO DEL MONSTRUO:
          // - Si Congelar activo: se retrasa fuertemente
          // - Con Nitro >= 30%: Desaparece por completo fuera de pantalla (650px) para enfocarse en la carrera
          // - Con Nitro < 30%: Se asoma amenazante detrás del jugador (190px)
          // - Si Nitro llega a 0%: Se abalanza a toda velocidad (0px) y liquida con ¡PUM!
          if (activeFreezeTime > 0) {
            targetMonsterDistRef.current = 680;
            relativeMonsterDistanceRef.current +=
              (targetMonsterDistRef.current - relativeMonsterDistanceRef.current) * Math.min(1, dt * 1.5);
          } else if (energyRef.current >= 30) {
            if (playerDistanceRef.current > 15) {
              targetMonsterDistRef.current = 650;
            }
            relativeMonsterDistanceRef.current +=
              (targetMonsterDistRef.current - relativeMonsterDistanceRef.current) * Math.min(1, dt * 1.8);
          } else if (energyRef.current > 0) {
            targetMonsterDistRef.current = 190;
            relativeMonsterDistanceRef.current +=
              (targetMonsterDistRef.current - relativeMonsterDistanceRef.current) * Math.min(1, dt * 2.2);
          } else {
            targetSpeedRef.current = 0.5;
            targetMonsterDistRef.current = 0;
            relativeMonsterDistanceRef.current +=
              (0 - relativeMonsterDistanceRef.current) * Math.min(1, dt * 4.5);

            if (relativeMonsterDistanceRef.current <= 20) {
              catchingSequenceRef.current = { active: true, timer: 1.2, duration: 1.2 };
              playSfx("gameover");
              screenShakeRef.current = 16;
            }
          }

          // 8. Screen Shake y Banner timer
          if (screenShakeRef.current > 0) {
            screenShakeRef.current = Math.max(0, screenShakeRef.current - dt * 15);
          }
          if (answerBannerRef.current) {
            answerBannerRef.current.timer -= dt;
            if (answerBannerRef.current.timer <= 0) answerBannerRef.current = null;
          }

          // 9. Desplazamiento del Escenario (Parallax)
          groundOffset = (groundOffset + scrollSpeedPx) % 60;
          bgHillsOffset = (bgHillsOffset + scrollSpeedPx * 0.3) % 400;
          cloudOffset = (cloudOffset + scrollSpeedPx * 0.1) % 600;

          // Desplazar elementos del fondo
          sceneryObjects.forEach((obj) => {
            obj.x -= scrollSpeedPx;
            if (obj.x < -70) {
              obj.x = (canvas.width || 500) + Math.random() * 140;
            }
          });

          // 10. Desplazamiento y Colisiones de Elementos del Camino
          trackItems.forEach((item) => {
            item.x -= scrollSpeedPx;

            const playerScreenX = playerXRef.current;
            const distToPlayer = Math.abs(item.x - playerScreenX);

            if (distToPlayer < 24) {
              if (item.type === "coin") {
                playSfx("coin");
                setCollectedCoins((c) => c + 1);
                setGameXp((xp) => xp + 15);
                energyRef.current = Math.min(100, energyRef.current + 1.5);
                setEnergyPercent(Math.round(energyRef.current));
                item.x = -150;
              } else if (item.type === "nitro") {
                playSfx("turbo");
                energyRef.current = Math.min(100, energyRef.current + 25);
                setEnergyPercent(Math.round(energyRef.current));
                setActiveTurboTime(4.0);
                targetSpeedRef.current = 1.45;
                targetMonsterDistRef.current = Math.min(700, targetMonsterDistRef.current + 120);
                answerBannerRef.current = { text: "🚀 ¡TURBO NITRO +25%! ⚡", color: "#38bdf8", timer: 2.2 };
                item.x = -150;
                setTimeout(() => {
                  targetSpeedRef.current = 1.0;
                }, 4000);
              } else if (item.type === "shield") {
                playSfx("powerup");
                setHasShield(true);
                answerBannerRef.current = { text: "🛡️ ¡ESCUDO DE PROTECCIÓN ACTIVADO!", color: "#34d399", timer: 2.2 };
                item.x = -150;
              } else if (item.type === "freeze") {
                playSfx("correct");
                setActiveFreezeTime(5.0);
                targetMonsterDistRef.current = Math.min(700, targetMonsterDistRef.current + 140);
                answerBannerRef.current = { text: "❄️ ¡ENEMIGO CONGELADO POR 5s!", color: "#67e8f9", timer: 2.2 };
                item.x = -150;
              } else if (item.type === "magnet") {
                playSfx("powerup");
                setActiveMagnetTime(6.0);
                answerBannerRef.current = { text: "🧲 ¡IMÁN DE MONEDAS ACTIVO!", color: "#f472b6", timer: 2.2 };
                item.x = -150;
              } else {
                // Es un obstáculo
                const obstacleHeights: Record<string, number> = {
                  rock: 16,
                  box: 18,
                  log: 15,
                  barrier: 26,
                  pit: 14,
                  hazard: 20,
                  car: 22,
                };
                const reqH = obstacleHeights[item.type] || 16;

                if (playerYOffsetRef.current > reqH) {
                  // Salto exitoso sobre el obstáculo
                  energyRef.current = Math.min(100, energyRef.current + 3);
                  setEnergyPercent(Math.round(energyRef.current));
                  setGameXp((xp) => xp + 20);
                  item.x = -150;
                } else if (playerStumbleTimerRef.current <= 0) {
                  // Colisión con obstáculo
                  if (hasShield) {
                    setHasShield(false);
                    playSfx("wrong");
                    answerBannerRef.current = { text: "🛡️ ¡ESCUDO ABSORBIÓ EL IMPACTO!", color: "#38bdf8", timer: 1.8 };
                    screenShakeRef.current = 4;
                    item.x = -150;
                  } else {
                    playerStumbleTimerRef.current = 0.8;
                    playSfx("wrong");
                    targetSpeedRef.current = 0.65;
                    energyRef.current = Math.max(0, energyRef.current - 10);
                    setEnergyPercent(Math.round(energyRef.current));
                    setLives((l) => Math.max(0, l - 1));

                    targetMonsterDistRef.current = Math.max(25, targetMonsterDistRef.current - 50);
                    relativeMonsterDistanceRef.current = Math.max(25, relativeMonsterDistanceRef.current - 40);
                    screenShakeRef.current = 9;
                    answerBannerRef.current = { text: "💥 ¡CHOQUE CON OBSTÁCULO! 👾 EL ENEMIGO SE ACERCA", color: "#ef4444", timer: 1.8 };
                    item.x = -150;

                    setTimeout(() => {
                      targetSpeedRef.current = 1.0;
                    }, 1200);
                  }
                }
              }
            }

            // Regenerar elementos fuera de pantalla con ritmo uniforme
            if (item.x < -80) {
              const maxX = trackItems.reduce((max, it) => Math.max(max, it.x), 0);
              item.x = Math.max((canvas.width || 450) + 80, maxX + 180 + Math.random() * 120);
              item.type = getNextSpawnType(raceProgress);
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
      const progress = Math.min(1, playerDistanceRef.current / (lvlConfig.targetDistance || 500));

      // Configuración dinámica del bioma / zona según progreso
      let zoneColors = {
        skyTop: theme.skyTopColor,
        skyBottom: theme.skyBottomColor,
        road: theme.roadColor,
        roadLine: theme.roadLineColor,
        hills: theme.groundColor,
      };

      if (progress >= 0.25 && progress < 0.50) {
        // Zona Puente
        zoneColors = {
          skyTop: "#0f172a",
          skyBottom: "#1e1b4b",
          road: "#1e293b",
          roadLine: "#818cf8",
          hills: "#020617",
        };
      } else if (progress >= 0.50 && progress < 0.75) {
        // Zona Peligrosa / Cañón
        zoneColors = {
          skyTop: "#1c1917",
          skyBottom: "#7f1d1d",
          road: "#1c1917",
          roadLine: "#ef4444",
          hills: "#450a0a",
        };
      } else if (progress >= 0.75 && progress < 0.90) {
        // Zona Velocidad Cyber
        zoneColors = {
          skyTop: "#020617",
          skyBottom: "#042f2e",
          road: "#022c22",
          roadLine: "#06b6d4",
          hills: "#111827",
        };
      } else if (progress >= 0.90) {
        // Zona Final Sprint
        zoneColors = {
          skyTop: "#1e1b4b",
          skyBottom: "#78350f",
          road: "#09090b",
          roadLine: "#fbbf24",
          hills: "#172554",
        };
      }

      // 1. Cielo Gradiente Parallax
      const skyGrad = ctx.createLinearGradient(0, 0, 0, roadY);
      skyGrad.addColorStop(0, zoneColors.skyTop);
      skyGrad.addColorStop(1, zoneColors.skyBottom);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, roadY);

      // Nubes y niebla
      ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
      for (let i = 0; i < 4; i++) {
        const cx = ((i * 220 - cloudOffset) % (w + 200)) - 100;
        ctx.beginPath();
        ctx.arc(cx, 30 + (i % 2) * 15, 25, 0, Math.PI * 2);
        ctx.arc(cx + 20, 25 + (i % 2) * 15, 30, 0, Math.PI * 2);
        ctx.arc(cx + 45, 30 + (i % 2) * 15, 22, 0, Math.PI * 2);
        ctx.fill();
      }

      // Fondo del Bioma (Montañas / Torres de Puente / Ciudad Neón)
      ctx.fillStyle = zoneColors.hills;
      ctx.beginPath();
      ctx.moveTo(0, roadY);
      if (progress >= 0.25 && progress < 0.50) {
        // Puente: Pilares y cables
        for (let i = -100; i < w + 200; i += 120) {
          const px = i - bgHillsOffset;
          ctx.fillRect(px, roadY - 60, 14, 60);
          ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(px + 7, roadY - 60);
          ctx.lineTo(px + 60, roadY);
          ctx.stroke();
        }
      } else if (progress >= 0.75 && progress < 0.90) {
        // Cyber: Rascacielos
        for (let i = -100; i < w + 200; i += 60) {
          const bx = i - bgHillsOffset;
          const bH = 35 + ((i * 7) % 35);
          ctx.fillRect(bx, roadY - bH, 50, bH);
          ctx.fillStyle = "rgba(6, 182, 212, 0.3)";
          ctx.fillRect(bx + 6, roadY - bH + 6, 8, 8);
          ctx.fillRect(bx + 20, roadY - bH + 6, 8, 8);
          ctx.fillStyle = zoneColors.hills;
        }
      } else {
        // Colinas normales / volcánicas
        for (let i = -100; i < w + 200; i += 80) {
          const hillX = i - bgHillsOffset;
          ctx.lineTo(hillX, roadY - 45 - Math.sin(i * 0.03) * 20);
        }
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
        } else if (obj.type === "pillar") {
          ctx.fillStyle = "#334155";
          ctx.fillRect(obj.x - 4, roadY - obj.size, 8, obj.size);
          ctx.fillStyle = "#38bdf8";
          ctx.fillRect(obj.x - 2, roadY - obj.size + 4, 4, 10);
        }
      });

      // 3. El Camino Principal (Road)
      ctx.fillStyle = zoneColors.road;
      ctx.fillRect(0, roadY, w, h - roadY);

      // Borde Superior del Camino
      ctx.strokeStyle = zoneColors.roadLine;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, roadY);
      ctx.lineTo(w, roadY);
      ctx.stroke();

      // Líneas punteadas / flechas de velocidad
      if (progress >= 0.75 && progress < 0.90) {
        // Flechas turbo en el suelo
        ctx.fillStyle = "rgba(6, 182, 212, 0.7)";
        ctx.font = "black 14px monospace";
        for (let i = 0; i < w + 80; i += 90) {
          const fx = ((i - groundOffset * 1.5) % (w + 100)) - 20;
          ctx.fillText(">>>", fx, roadY + 22);
        }
      } else {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
        ctx.lineWidth = 2;
        ctx.setLineDash([20, 15]);
        ctx.lineDashOffset = groundOffset;
        ctx.beginPath();
        ctx.moveTo(0, roadY + 18);
        ctx.lineTo(w, roadY + 18);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 4. Dibujar Monedas, Obstáculos y Power-Ups en el Camino
      trackItems.forEach((item) => {
        if (item.x < -60 || item.x > w + 60) return;

        if (item.type === "coin") {
          // 🪙 Moneda Dorada Giratoria 3D
          const coinBob = Math.sin(timestamp * 0.008 + item.x * 0.05) * 3;
          const coinW = Math.abs(Math.cos(timestamp * 0.006 + item.x * 0.02)) * 10 + 2;

          ctx.fillStyle = "rgba(0,0,0,0.3)";
          ctx.beginPath();
          ctx.ellipse(item.x, roadY - 4, 8, 3, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#facc15";
          ctx.strokeStyle = "#ca8a04";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(item.x, roadY - 14 - coinBob, coinW, 10, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          if (coinW > 5) {
            ctx.fillStyle = "#a16207";
            ctx.font = "bold 9px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("★", item.x, roadY - 11 - coinBob);
          }
        } else if (item.type === "nitro") {
          // 🚀 Power-Up Nitro Turbo
          const pupBob = Math.sin(timestamp * 0.007 + item.x * 0.03) * 4;
          ctx.save();
          ctx.translate(item.x, roadY - 18 - pupBob);
          ctx.fillStyle = "rgba(56, 189, 248, 0.25)";
          ctx.beginPath();
          ctx.arc(0, 0, 16, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#0284c7";
          ctx.beginPath();
          ctx.roundRect(-9, -12, 18, 24, 6);
          ctx.fill();
          ctx.fillStyle = "#38bdf8";
          ctx.fillRect(-7, -9, 14, 8);

          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 10px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("🚀", 0, 5);
          ctx.restore();
        } else if (item.type === "shield") {
          // 🛡️ Power-Up Escudo Holográfico
          const pupBob = Math.sin(timestamp * 0.007 + item.x * 0.03) * 4;
          ctx.save();
          ctx.translate(item.x, roadY - 18 - pupBob);
          ctx.fillStyle = "rgba(16, 185, 129, 0.25)";
          ctx.beginPath();
          ctx.arc(0, 0, 16, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#059669";
          ctx.beginPath();
          ctx.arc(0, 0, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 12px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("🛡️", 0, 4);
          ctx.restore();
        } else if (item.type === "freeze") {
          // ❄️ Power-Up Congelar
          const pupBob = Math.sin(timestamp * 0.007 + item.x * 0.03) * 4;
          ctx.save();
          ctx.translate(item.x, roadY - 18 - pupBob);
          ctx.fillStyle = "rgba(6, 182, 212, 0.25)";
          ctx.beginPath();
          ctx.arc(0, 0, 16, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#0891b2";
          ctx.beginPath();
          ctx.arc(0, 0, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 12px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("❄️", 0, 4);
          ctx.restore();
        } else if (item.type === "magnet") {
          // 🧲 Power-Up Imán
          const pupBob = Math.sin(timestamp * 0.007 + item.x * 0.03) * 4;
          ctx.save();
          ctx.translate(item.x, roadY - 18 - pupBob);
          ctx.fillStyle = "rgba(236, 72, 153, 0.25)";
          ctx.beginPath();
          ctx.arc(0, 0, 16, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#db2777";
          ctx.beginPath();
          ctx.arc(0, 0, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 12px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("🧲", 0, 4);
          ctx.restore();
        } else if (item.type === "rock") {
          // 🪨 Obstáculo Roca
          ctx.fillStyle = "#475569";
          ctx.beginPath();
          ctx.ellipse(item.x, roadY - 8, 14, 9, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#64748b";
          ctx.beginPath();
          ctx.ellipse(item.x - 2, roadY - 10, 10, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#cbd5e1";
          ctx.font = "bold 10px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("🪨", item.x, roadY - 5);
        } else if (item.type === "box") {
          // 📦 Obstáculo Caja de Madera
          ctx.fillStyle = "#78350f";
          ctx.fillRect(item.x - 11, roadY - 20, 22, 20);
          ctx.fillStyle = "#b45309";
          ctx.fillRect(item.x - 9, roadY - 18, 18, 16);
          ctx.strokeStyle = "#451a03";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(item.x - 11, roadY - 20, 22, 20);
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 9px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("📦", item.x, roadY - 7);
        } else if (item.type === "log") {
          // 🌳 Obstáculo Tronco
          ctx.fillStyle = "#451a03";
          ctx.beginPath();
          ctx.roundRect(item.x - 15, roadY - 13, 30, 13, 4);
          ctx.fill();
          ctx.fillStyle = "#15803d";
          ctx.fillRect(item.x - 10, roadY - 15, 20, 3);
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 8px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("🪵", item.x, roadY - 3);
        } else if (item.type === "barrier") {
          // 🚧 Obstáculo Barrera de Construcción
          ctx.fillStyle = "#334155";
          ctx.fillRect(item.x - 10, roadY - 28, 4, 28);
          ctx.fillRect(item.x + 6, roadY - 28, 4, 28);

          ctx.fillStyle = "#f59e0b";
          ctx.fillRect(item.x - 12, roadY - 26, 24, 8);
          ctx.fillRect(item.x - 12, roadY - 14, 24, 8);
          ctx.fillStyle = "#0f172a";
          ctx.fillRect(item.x - 6, roadY - 26, 4, 8);
          ctx.fillRect(item.x + 2, roadY - 26, 4, 8);

          ctx.fillStyle = "#ef4444";
          ctx.beginPath();
          ctx.arc(item.x, roadY - 30, 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (item.type === "pit") {
          // 🕳️ Obstáculo Hoyo / Grieta
          ctx.fillStyle = "#020617";
          ctx.beginPath();
          ctx.ellipse(item.x, roadY + 2, 16, 5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#ef4444";
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = "#ef4444";
          ctx.font = "bold 8px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("🕳️", item.x, roadY + 4);
        } else if (item.type === "hazard") {
          // 🔥 Obstáculo Llamas de Fuego
          const flameOffset = Math.sin(timestamp * 0.02 + item.x) * 3;
          ctx.fillStyle = "#ef4444";
          ctx.beginPath();
          ctx.moveTo(item.x - 12, roadY);
          ctx.lineTo(item.x - 4, roadY - 22 + flameOffset);
          ctx.lineTo(item.x, roadY - 12);
          ctx.lineTo(item.x + 6, roadY - 24 - flameOffset);
          ctx.lineTo(item.x + 12, roadY);
          ctx.fill();
          ctx.fillStyle = "#facc15";
          ctx.beginPath();
          ctx.moveTo(item.x - 6, roadY);
          ctx.lineTo(item.x, roadY - 14);
          ctx.lineTo(item.x + 6, roadY);
          ctx.fill();
        } else if (item.type === "car") {
          // 🚗 Obstáculo Chatarra / Bot
          ctx.fillStyle = "#334155";
          ctx.fillRect(item.x - 14, roadY - 18, 28, 18);
          ctx.fillStyle = "#0284c7";
          ctx.fillRect(item.x - 10, roadY - 15, 20, 10);
          ctx.fillStyle = "#f59e0b";
          ctx.font = "bold 9px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("🤖", item.x, roadY - 6);
        }
      });

      // 5. POSICIONES DE LOS PERSONAJES
      const playerScreenX = playerXRef.current;
      const monsterScreenX = playerScreenX - relativeMonsterDistanceRef.current;
      const isCatching = catchingSequenceRef.current.active;
      const isStumbling = playerStumbleTimerRef.current > 0;
      const playerY = roadY - playerYOffsetRef.current + (isCatching ? 12 : 0);

      // ==========================================
      // 👾 DIBUJAR AL PERSEGUIDOR (SOLO SI ESTÁ EN PANTALLA)
      // ==========================================
      if (monsterScreenX > -90 && monsterScreenX < w + 80) {
        const monsterStride = Math.sin(timestamp * 0.018 * (activeFreezeTime > 0 ? 0.3 : currentSpeedRef.current)) * 8;
        const monsterBob = Math.abs(Math.sin(timestamp * 0.018)) * 4;

        ctx.save();
        const catchLungeX = isCatching ? (1.2 - catchingSequenceRef.current.timer) * 25 : 0;
        ctx.translate(monsterScreenX + catchLungeX, roadY - monsterBob - (isCatching ? 15 : 0));

        // Aura de Hielo si está congelado
        if (activeFreezeTime > 0) {
          ctx.fillStyle = "rgba(6, 182, 212, 0.35)";
          ctx.beginPath();
          ctx.arc(0, -30, 36, 0, Math.PI * 2);
          ctx.fill();
        }

        // Sombra del Monstruo
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.beginPath();
        ctx.ellipse(0, 0, 24, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Piernas del Monstruo
        ctx.fillStyle = activeFreezeTime > 0 ? "#0891b2" : theme.monsterSecondary;
        ctx.fillRect(-12, -18 + monsterStride, 8, 18);
        ctx.fillRect(4, -18 - monsterStride, 8, 18);

        // Cuerpo del Monstruo
        ctx.fillStyle = activeFreezeTime > 0 ? "#22d3ee" : theme.monsterColor;
        ctx.shadowColor = activeFreezeTime > 0 ? "#06b6d4" : theme.monsterColor;
        ctx.shadowBlur = isCatching ? 30 : 15;
        ctx.beginPath();
        ctx.roundRect(-20, -50, 40, 36, 10);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Cuernos / Espinas
        ctx.fillStyle = activeFreezeTime > 0 ? "#a5f3fc" : "#f59e0b";
        ctx.beginPath();
        ctx.moveTo(-16, -50);
        ctx.lineTo(-24, -64);
        ctx.lineTo(-10, -50);
        ctx.moveTo(16, -50);
        ctx.lineTo(24, -64);
        ctx.lineTo(10, -50);
        ctx.fill();

        // Brazos y Garras
        ctx.fillStyle = activeFreezeTime > 0 ? "#0891b2" : theme.monsterSecondary;
        ctx.fillRect(8, isCatching ? -50 : -40, isCatching ? 26 : 18, 8);
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(isCatching ? 34 : 26, isCatching ? -52 : -42);
        ctx.lineTo(isCatching ? 44 : 34, isCatching ? -46 : -36);
        ctx.lineTo(isCatching ? 34 : 26, isCatching ? -40 : -30);
        ctx.fill();

        // Ojos
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(-4, -40, 6, 0, Math.PI * 2);
        ctx.arc(8, -40, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = activeFreezeTime > 0 ? "#0284c7" : "#ef4444";
        ctx.beginPath();
        ctx.arc(-3, -40, 3.5, 0, Math.PI * 2);
        ctx.arc(9, -40, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Boca con Colmillos
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
      }

      // ==========================================
      // 🏃 DIBUJAR AL PERSONAJE JUGADOR (CORREDOR)
      // ==========================================
      const runCycle = timestamp * 0.02 * currentSpeedRef.current;
      const legOffset = isCatching ? 0 : Math.sin(runCycle) * 10;
      const armOffset = isCatching ? 0 : Math.sin(runCycle + Math.PI) * 8;
      const playerBob = isCatching ? 0 : Math.abs(Math.sin(runCycle)) * 3;

      const equippedOutfit = CLOSET_ITEMS.find((c) => c.id === equippedItems.outfit) || CLOSET_ITEMS[4];
      const equippedHair = CLOSET_ITEMS.find((c) => c.id === equippedItems.hair) || CLOSET_ITEMS[0];

      ctx.save();
      ctx.translate(playerScreenX, playerY - playerBob);

      // Efecto de parpadeo al tropezar
      if (isStumbling && Math.floor(timestamp / 60) % 2 === 0) {
        ctx.globalAlpha = 0.5;
      }

      if (isCatching) {
        ctx.rotate(0.45);
      }

      // Sombra en el camino
      const shadowScale = Math.max(0.3, 1 - playerYOffsetRef.current / 80);
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.beginPath();
      ctx.ellipse(0, playerYOffsetRef.current, 16 * shadowScale, 5 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();

      // Efecto de Escudo Activo
      if (hasShield && !isCatching) {
        ctx.strokeStyle = "rgba(56, 189, 248, 0.85)";
        ctx.fillStyle = "rgba(56, 189, 248, 0.18)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, -26, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Efecto de Imán Activo (Chispas)
      if (activeMagnetTime > 0 && !isCatching) {
        ctx.strokeStyle = "rgba(244, 114, 182, 0.8)";
        ctx.lineWidth = 1.5;
        const magAngle = timestamp * 0.008;
        ctx.beginPath();
        ctx.arc(0, -24, 22, magAngle, magAngle + Math.PI * 0.5);
        ctx.arc(0, -24, 22, magAngle + Math.PI, magAngle + Math.PI * 1.5);
        ctx.stroke();
      }

      // Estela de Turbo Fuego
      if (activeTurboTime > 0 && !isCatching) {
        ctx.fillStyle = "#f97316";
        ctx.beginPath();
        ctx.moveTo(-16, -26);
        ctx.lineTo(-38, -26 + Math.sin(timestamp * 0.05) * 5);
        ctx.lineTo(-16, -20);
        ctx.fill();
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.moveTo(-16, -24);
        ctx.lineTo(-30, -24);
        ctx.lineTo(-16, -21);
        ctx.fill();
      }

      // Piernas y Tenis
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(-6, -14 + legOffset, 5, 14);
      ctx.fillRect(2, -14 - legOffset, 5, 14);
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

      // Ojos
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

      // 6. Alerta Visual de Nitro Crítico (< 25%) o Sin Nitro (0%)
      if (energyRef.current <= 0 && !isCatching) {
        ctx.save();
        ctx.fillStyle = "rgba(239, 68, 68, 0.3)";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#ef4444";
        ctx.font = "black 13px sans-serif";
        ctx.textAlign = "center";
        ctx.shadowColor = "#ef4444";
        ctx.shadowBlur = 10;
        ctx.fillText(`🚨 ¡SIN NITRO! ¡${theme.monsterName.toUpperCase()} TE ALCANZÓ!`, w / 2, 28);
        ctx.restore();
      } else if (energyRef.current <= 25 && energyRef.current > 0 && !isCatching) {
        ctx.save();
        ctx.fillStyle = "rgba(245, 158, 11, 0.15)";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#f59e0b";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.shadowColor = "#f59e0b";
        ctx.shadowBlur = 6;
        ctx.fillText(`⚠️ NITRO BAJO (${Math.round(energyRef.current)}%) — ¡Acierta para recargar al 100%!`, w / 2, 28);
        ctx.restore();
      }

      // 7. Banner de Secuencia de Impacto ¡PUM!
      if (isCatching) {
        ctx.save();
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#ef4444";
        ctx.font = "black 18px sans-serif";
        ctx.textAlign = "center";
        ctx.shadowColor = "#ef4444";
        ctx.shadowBlur = 16;
        ctx.fillText("💥 ¡PUM! TE QUEDASTE SIN NITRO", w / 2, h / 2 - 10);
        ctx.restore();
      }

      // 8. Banner de Animación de Impacto o Power-up
      if (answerBannerRef.current && !isCatching && energyRef.current > 25) {
        ctx.save();
        ctx.fillStyle = answerBannerRef.current.color;
        ctx.font = "bold 13px sans-serif";
        ctx.textAlign = "center";
        ctx.shadowColor = answerBannerRef.current.color;
        ctx.shadowBlur = 10;
        ctx.fillText(answerBannerRef.current.text, w / 2, 28);
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
  }, [screen, isPaused, selectedWorld, selectedLevel, activeFreezeTime, activeTurboTime, activeMagnetTime, hasShield]);

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
                ¡Corre por el camino, salta obstáculos y responde las preguntas de estudio para activar el Nitro y escapar del monstruo!
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
          {/* Header Superior con Barra de Distancia, Zona y Power-Ups */}
          <header className="h-12 w-full shrink-0 border-b border-slate-800 bg-slate-900/95 backdrop-blur px-3 flex items-center justify-between gap-2 z-30">
            {/* Vidas & XP */}
            <div className="flex items-center gap-2">
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

            {/* Zona Actual y Progreso de la Carrera */}
            <div className="flex items-center gap-2">
              {/* Badge de Bioma / Zona */}
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-black">
                {playerDistanceMeters / (currentLvlConfig.targetDistance || 500) < 0.25
                  ? "🌳 Zona Normal"
                  : playerDistanceMeters / (currentLvlConfig.targetDistance || 500) < 0.50
                  ? "🌉 Gran Puente"
                  : playerDistanceMeters / (currentLvlConfig.targetDistance || 500) < 0.75
                  ? "⚠️ Cañón Peligroso"
                  : playerDistanceMeters / (currentLvlConfig.targetDistance || 500) < 0.90
                  ? "⚡ Pista Neón"
                  : "🏁 ¡Sprint Final!"}
              </span>

              {/* Distancia */}
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-full text-[11px] font-bold">
                <span className="text-cyan-300 font-mono font-black">
                  🏃 {Math.round(playerDistanceMeters)}m / {currentLvlConfig.targetDistance || 500}m
                </span>
              </div>
            </div>

            {/* Badges de Power-Ups Activos & Pausa */}
            <div className="flex items-center gap-1.5">
              {hasShield && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black animate-pulse flex items-center gap-0.5">
                  🛡️ Escudo
                </span>
              )}
              {activeTurboTime > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-black flex items-center gap-0.5">
                  🚀 Turbo {Math.ceil(activeTurboTime)}s
                </span>
              )}
              {activeFreezeTime > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-black flex items-center gap-0.5">
                  ❄️ {Math.ceil(activeFreezeTime)}s
                </span>
              )}
              {activeMagnetTime > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[10px] font-black flex items-center gap-0.5">
                  🧲 {Math.ceil(activeMagnetTime)}s
                </span>
              )}

              <button
                onClick={() => setIsPaused(!isPaused)}
                className="size-7 rounded-lg bg-slate-800 grid place-items-center text-slate-300 hover:text-white ml-1 cursor-pointer"
              >
                {isPaused ? <Play className="size-3 fill-current" /> : <Pause className="size-3" />}
              </button>
            </div>
          </header>

          {/* Centro: Escenario Completo de Persecución (60 FPS) */}
          <div
            onClick={triggerJump}
            onTouchStart={triggerJump}
            className="flex-1 w-full min-h-[160px] relative overflow-hidden bg-slate-950 cursor-pointer"
            title="Toca para saltar"
          >
            <canvas ref={canvasRef} className="w-full h-full block" />
          </div>

          {/* ======================================================== */}
          {/* PARTE INFERIOR: HUD SEGÚN ESTADO DE NITRO */}
          {/* ======================================================== */}
          {!showQuestionCard ? (
            /* 🟢 MODO CARRERA LIBRE (NITRO >= 30%) */
            <div className="w-full shrink-0 border-t-2 border-cyan-500/40 bg-slate-900/98 p-3 sm:p-4 space-y-2.5 z-30 max-w-2xl mx-auto shadow-2xl animate-fade-in backdrop-blur">
              {/* Barra de Nitro Destacada */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Zap className={`size-4 ${energyPercent >= 70 ? "text-emerald-400 fill-emerald-400" : energyPercent >= 30 ? "text-amber-400 fill-amber-400" : "text-rose-400 fill-rose-400 animate-pulse"}`} />
                    <span className="font-black text-sm text-cyan-300">
                      ⚡ ENERGÍA NITRO: {energyPercent}%
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${energyPercent >= 70 ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-amber-500/20 text-amber-300 border-amber-500/30"}`}>
                    {energyPercent >= 70 ? "🟢 CARRERA ACTIVA (≥70%)" : "🟡 ZONA DE CARRERA (≥30%)"}
                  </span>
                </div>

                <div className="h-3.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5 shadow-inner">
                  <div
                    className={`h-full rounded-full transition-all duration-300 shadow-md ${
                      energyPercent >= 70
                        ? "bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 shadow-emerald-500/30"
                        : energyPercent >= 30
                        ? "bg-gradient-to-r from-amber-500 to-amber-400"
                        : "bg-rose-500 animate-pulse"
                    }`}
                    style={{ width: `${energyPercent}%` }}
                  />
                </div>
              </div>

              {/* Botones de Control Completos: ⬅️ Izquierda | ⬆️ SALTAR | ➡️ Derecha */}
              <div className="grid grid-cols-4 gap-2 pt-0.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    moveLeft();
                  }}
                  className="col-span-1 h-13 sm:h-14 rounded-2xl bg-slate-800/90 hover:bg-slate-700 active:scale-95 border border-slate-700 text-white font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-0.5 transition cursor-pointer shadow-md"
                >
                  <span className="text-xl">⬅️</span>
                  <span className="text-[10px] font-black uppercase text-slate-300">Izq (A)</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerJump();
                  }}
                  className="col-span-2 h-13 sm:h-14 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:brightness-110 active:scale-98 text-white font-display text-sm sm:text-base font-black flex items-center justify-center gap-2 border border-cyan-400/40 shadow-xl shadow-purple-500/30 transition cursor-pointer"
                >
                  <ArrowUp className="size-5 stroke-[3]" />
                  <span>SALTAR (ESPACIO / W)</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    moveRight();
                  }}
                  className="col-span-1 h-13 sm:h-14 rounded-2xl bg-slate-800/90 hover:bg-slate-700 active:scale-95 border border-slate-700 text-white font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-0.5 transition cursor-pointer shadow-md"
                >
                  <span className="text-xl">➡️</span>
                  <span className="text-[10px] font-black uppercase text-slate-300">Der (D)</span>
                </button>
              </div>
            </div>
          ) : (
            /* 🚨 TARJETA DE PREGUNTA DE EMERGENCIA (ENERGÍA < 30%) */
            <div className="w-full shrink-0 border-t-2 border-rose-500/70 bg-slate-900/98 p-3 sm:p-4 space-y-2.5 z-30 max-w-2xl mx-auto shadow-2xl animate-fade-in backdrop-blur">
              {/* Top Bar de la Tarjeta: Nitro Crítico + Temporizador 10s */}
              <div className="flex items-center justify-between gap-2 text-xs">
                {/* Barra de Energía Nitro en Alerta */}
                <div className="flex-1 flex items-center gap-2 bg-rose-950/40 px-2.5 py-1 rounded-xl border border-rose-500/40 animate-pulse">
                  <Zap className="size-3.5 text-rose-400 fill-rose-400" />
                  <span className="text-[11px] font-black text-rose-300">
                    🚨 ¡ENERGÍA &lt; 30%! ({energyPercent}%) — Meta: ≥70%
                  </span>
                  <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full bg-rose-500"
                      style={{ width: `${energyPercent}%` }}
                    />
                  </div>
                </div>

                {/* Countdown Timer 10s */}
                <div className="flex items-center gap-1.5 font-black bg-rose-950/60 px-3 py-1 rounded-xl border border-rose-500/50 shrink-0">
                  <Clock className="size-3.5 text-amber-400" />
                  <span
                    className={`text-xs font-mono font-black ${
                      qTimer <= 3 ? "text-rose-400 animate-pulse" : "text-amber-300"
                    }`}
                  >
                    ⏱️ {qTimer}s
                  </span>
                </div>
              </div>

              {/* Barra de tiempo de la pregunta */}
              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-300 ${
                    qTimer <= 3
                      ? "bg-rose-500"
                      : "bg-gradient-to-r from-amber-500 to-rose-400"
                  }`}
                  style={{ width: `${timerPercentage}%` }}
                />
              </div>

              {/* Texto de la Pregunta */}
              {currentQuestion ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold px-0.5">
                    <span className="truncate max-w-[280px] text-rose-300 font-bold">
                      ⚡ Acierta para recargar +30% Nitro: {currentQuestion.topic || currentTheme.badge}
                    </span>
                    <span className="text-cyan-400 font-mono">
                      Pregunta {currentQIndex + 1} de {questionsPool.length}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white leading-snug px-0.5 line-clamp-2 min-h-[38px] flex items-center drop-shadow-sm">
                    {currentQuestion.question}
                  </h3>
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic min-h-[38px] flex items-center">
                  Cargando pregunta de estudio...
                </div>
              )}

              {/* Opciones de Respuesta con letras grandes 🅰️ 🅱️ 🅲️ 🅳️ */}
              {currentQuestion && (
                <div
                  className={`grid gap-2 ${
                    currentQuestion.options.length === 2 ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2"
                  }`}
                >
                  {currentQuestion.options.map((opt, idx) => {
                    const letters = ["🅰️", "🅱️", "🅲️", "🅳️"];
                    const isSelected = selectedOption === idx;
                    const isCorrect = idx === currentQuestion.correctIndex;

                    let optClass =
                      "border-2 border-slate-700 bg-slate-800/90 hover:bg-slate-700 hover:border-purple-400 text-white";

                    if (selectedOption !== null) {
                      if (isCorrect) {
                        optClass =
                          "border-2 border-emerald-400 bg-emerald-600 text-white font-black shadow-lg shadow-emerald-500/30";
                      } else if (isSelected) {
                        optClass =
                          "border-2 border-rose-400 bg-rose-600 text-white font-black shadow-lg shadow-rose-500/30";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        disabled={selectedOption !== null || catchingSequenceRef.current.active}
                        onClick={() => handleAnswerOption(idx)}
                        className={`p-2.5 sm:p-3 rounded-xl text-left text-xs sm:text-sm font-bold leading-tight transition active:scale-95 cursor-pointer flex items-center gap-2.5 shadow-md ${optClass}`}
                      >
                        <span className="text-base shrink-0">
                          {letters[idx] || `${idx + 1}.`}
                        </span>
                        <span className="line-clamp-2 flex-1 font-bold">{opt}</span>
                        {selectedOption !== null && isCorrect && (
                          <CheckCircle2 className="size-4 text-white shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Controles Rápidos mientras respondes */}
              <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    moveLeft();
                  }}
                  className="col-span-1 h-10 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:scale-95 border border-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <span>⬅️</span>
                  <span className="text-[10px]">Izq</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerJump();
                  }}
                  className="col-span-2 h-10 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:brightness-110 active:scale-98 text-white text-xs font-black flex items-center justify-center gap-1.5 border border-purple-400/40 shadow-md transition cursor-pointer"
                >
                  <ArrowUp className="size-3.5" />
                  <span>SALTAR (ESPACIO / W)</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    moveRight();
                  }}
                  className="col-span-1 h-10 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:scale-95 border border-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <span>➡️</span>
                  <span className="text-[10px]">Der</span>
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
            <span className="text-5xl animate-bounce block">💥</span>
            <h2 className="font-display text-2xl font-black text-rose-500">¡PUM! ¡SIN NITRO!</h2>
            <p className="text-xs text-slate-400">
              Te quedaste sin combustible Nitro y {currentTheme.monsterName} te liquidó. ¡Responde correctamente las preguntas para recargar el Nitro al 100% y mantener tu ventaja!
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
