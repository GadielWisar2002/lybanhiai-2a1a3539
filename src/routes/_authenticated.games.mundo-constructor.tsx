import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { rewardGameCoins, rewardGameXp } from "@/lib/games.functions";
import { AppHeader } from "@/components/AppHeader";
import { ArrowLeft, Sparkles, Trophy, HelpCircle, Hammer, Brush, Home, Library, FlaskConical, School, Landmark, CheckCircle2, XCircle, ShieldAlert, Award, Play } from "lucide-react";
import { toast } from "sonner";
import { QUESTIONS_DB } from "@/lib/question-engine";
import { analyticsEngine } from "@/lib/analytics-engine";
import streakCap from "@/assets/streak-cap.png";

export const Route = createFileRoute("/_authenticated/games/mundo-constructor")({
  head: () => ({ meta: [{ title: "Mundo Constructor — Lybanhi" }] }),
  component: MundoConstructorGame,
});

// Grid Dimension
const GRID_SIZE = 6;

// Localized question bank for constructor
interface ConstructorQuestion {
  id: string;
  subject: "matemáticas" | "ciencias" | "historia" | "inglés" | "lógica";
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const CONSTRUCTOR_QUESTIONS: ConstructorQuestion[] = [
  // Matemáticas -> Bloques Estructurales
  {
    id: "mc_m_1",
    subject: "matemáticas",
    prompt: "Si un rectángulo tiene 10 cm de base y 5 cm de altura, ¿cuál es su área?",
    options: ["15 cm²", "30 cm²", "50 cm²", "25 cm²"],
    correctIndex: 2,
    explanation: "El área de un rectángulo se obtiene multiplicando la base por la altura: 10 * 5 = 50 cm²."
  },
  {
    id: "mc_m_2",
    subject: "matemáticas",
    prompt: "¿Cuál es el valor de x en la ecuación: 3x - 7 = 14?",
    options: ["x = 5", "x = 7", "x = 6", "x = 8"],
    correctIndex: 1,
    explanation: "Sumamos 7 a ambos lados: 3x = 21. Dividimos entre 3: x = 7."
  },
  {
    id: "mc_m_3",
    subject: "matemáticas",
    prompt: "¿Qué número representa el término x en la proporción: 2/5 = x/20?",
    options: ["4", "8", "10", "6"],
    correctIndex: 1,
    explanation: "Multiplicamos cruzado: 2 * 20 = 5 * x -> 40 = 5x -> x = 8."
  },

  // Ciencias -> Materiales Tecnológicos
  {
    id: "mc_c_1",
    subject: "ciencias",
    prompt: "¿Qué estado de la materia se caracteriza por tener volumen y forma definidos?",
    options: ["Líquido", "Gaseoso", "Sólido", "Plasma"],
    correctIndex: 2,
    explanation: "Los sólidos tienen sus partículas fuertemente unidas, manteniendo forma y volumen constantes."
  },
  {
    id: "mc_c_2",
    subject: "ciencias",
    prompt: "¿Cuál es la velocidad aproximada de la luz en el vacío?",
    options: ["300,000 km/s", "150,000 km/s", "1,000,000 km/s", "30,000 km/s"],
    correctIndex: 0,
    explanation: "La luz viaja en el vacío a aproximadamente 299,792 kilómetros por segundo (redondeado a 300,000 km/s)."
  },
  {
    id: "mc_c_3",
    subject: "ciencias",
    prompt: "¿Qué gas es el más abundante en la atmósfera terrestre?",
    options: ["Oxígeno (O2)", "Dióxido de Carbono (CO2)", "Nitrógeno (N2)", "Argón (Ar)"],
    correctIndex: 2,
    explanation: "El nitrógeno compone aproximadamente el 78% de la atmósfera terrestre, seguido por el oxígeno con un 21%."
  },

  // Historia -> Edificios Culturales
  {
    id: "mc_h_1",
    subject: "historia",
    prompt: "¿Qué civilización construyó las pirámides de Guiza en la antigüedad?",
    options: ["Los Mayas", "Los Egipcios", "Los Incas", "Los Griegos"],
    correctIndex: 1,
    explanation: "Los antiguos egipcios construyeron las pirámides de Guiza como tumbas monumentales para sus faraones."
  },
  {
    id: "mc_h_2",
    subject: "historia",
    prompt: "¿Quién es reconocido como el autor de la famosa pintura 'La Mona Lisa'?",
    options: ["Miguel Ángel", "Rafael Sanzio", "Leonardo da Vinci", "Donatello"],
    correctIndex: 2,
    explanation: "Leonardo da Vinci pintó 'La Gioconda' o 'Mona Lisa' a principios del siglo XVI."
  },

  // Inglés -> Mejoras de Eficiencia
  {
    id: "mc_i_1",
    subject: "inglés",
    prompt: "Choose the correct preposition: 'She is interested _____ learning code.'",
    options: ["on", "at", "in", "for"],
    correctIndex: 2,
    explanation: "The adjective 'interested' is always paired with the preposition 'in'."
  },
  {
    id: "mc_i_2",
    subject: "inglés",
    prompt: "What is the past participle form of the verb 'WRITE'?",
    options: ["Wrote", "Written", "Writing", "Writes"],
    correctIndex: 1,
    explanation: "The conjugation is write (present), wrote (past), and written (past participle)."
  },

  // Lógica -> Planos Especiales
  {
    id: "mc_l_1",
    subject: "lógica",
    prompt: "Si A es mayor que B, y B es mayor que C. ¿Cuál afirmación es lógicamente correcta?",
    options: ["C es mayor que A", "A es mayor que C", "B es menor que C", "A y C son iguales"],
    correctIndex: 1,
    explanation: "Por propiedad transitiva: si A > B y B > C, entonces necesariamente A > C."
  },
  {
    id: "mc_l_2",
    subject: "lógica",
    prompt: "Un tren eléctrico viaja hacia el norte a 100 km/h. ¿Hacia dónde va el humo?",
    options: ["Hacia el sur", "Hacia el este", "No echa humo", "Hacia atrás"],
    correctIndex: 2,
    explanation: "Los trenes eléctricos no generan humo."
  }
];

function MundoConstructorGame() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const rewardCoins = useServerFn(rewardGameCoins);
  const rewardXp = useServerFn(rewardGameXp);

  // Persistent inventories in LocalStorage
  const [blocks, setBlocks] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mc_inv_blocks");
      return saved ? parseInt(saved, 10) : 10; // Start with 10 basic blocks
    }
    return 10;
  });

  const [techMaterials, setTechMaterials] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mc_inv_tech");
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  const [cultureMaterials, setCultureMaterials] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mc_inv_culture");
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  const [efficiencyUpgrades, setEfficiencyUpgrades] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mc_inv_efficiency");
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  const [blueprints, setBlueprints] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mc_inv_blueprints");
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  // Grid Grid Sandbox state (6x6)
  const [grid, setGrid] = useState<string[][]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mc_grid_world");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill("vacio"));
  });

  // Current Streak for consecutive correct answers
  const [streak, setStreak] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mc_streak");
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  // UI Panels states
  const [activeCell, setActiveCell] = useState<{ r: number; c: number } | null>(null);
  const [showBuildMenu, setShowBuildMenu] = useState(false);
  const [academicSubject, setAcademicSubject] = useState<"matemáticas" | "ciencias" | "historia" | "inglés" | "lógica" | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<ConstructorQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [roundFeedback, setRoundFeedback] = useState<boolean | null>(null);

  // Sync state to LocalStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("mc_inv_blocks", blocks.toString());
      localStorage.setItem("mc_inv_tech", techMaterials.toString());
      localStorage.setItem("mc_inv_culture", cultureMaterials.toString());
      localStorage.setItem("mc_inv_efficiency", efficiencyUpgrades.toString());
      localStorage.setItem("mc_inv_blueprints", blueprints.toString());
      localStorage.setItem("mc_grid_world", JSON.stringify(grid));
      localStorage.setItem("mc_streak", streak.toString());
    }
  }, [blocks, techMaterials, cultureMaterials, efficiencyUpgrades, blueprints, grid, streak]);

  const coinsMutation = useMutation({
    mutationFn: (coins: number) => rewardCoins({ data: { coins } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard"] }),
  });

  const xpMutation = useMutation({
    mutationFn: (xp: number) => rewardXp({ data: { amount: xp } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard"] }),
  });

  // Build recipes definitions
  const RECIPES = [
    {
      id: "bloque",
      name: "Bloque Estructural",
      icon: "🧱",
      desc: "Bloque básico de construcción.",
      cost: { blocks: 1, tech: 0, culture: 0, blueprints: 0 },
      reqStreak: 0
    },
    {
      id: "casa",
      name: "Casa Familiar",
      icon: "🏠",
      desc: "Vivienda simple para tus colonos académicos.",
      cost: { blocks: 3, tech: 0, culture: 0, blueprints: 0 },
      reqStreak: 0
    },
    {
      id: "laboratorio",
      name: "Laboratorio de Ciencias",
      icon: "🧪",
      desc: "Instalación de alta tecnología para investigaciones químicas.",
      cost: { blocks: 2, tech: 2, culture: 0, blueprints: 0 },
      reqStreak: 0
    },
    {
      id: "biblioteca",
      name: "Biblioteca Histórica",
      icon: "📚",
      desc: "Alberga la literatura y los planos históricos del saber.",
      cost: { blocks: 2, tech: 0, culture: 2, blueprints: 0 },
      reqStreak: 0
    },
    {
      id: "universidad",
      name: "Universidad del Saber",
      icon: "🏫",
      desc: "El centro definitivo de la enseñanza del campus.",
      cost: { blocks: 5, tech: 2, culture: 0, blueprints: 1 },
      reqStreak: 0
    },
    {
      id: "megamonumento",
      name: "Ciudad Escolar Monumental",
      icon: "🏰",
      desc: "Edificación majestuosa. Demanda conocimientos supremos.",
      cost: { blocks: 10, tech: 4, culture: 4, blueprints: 2 },
      reqStreak: 5 // Requires 5 streak
    }
  ];

  const handleCellClick = (r: number, c: number) => {
    setActiveCell({ r, c });
    setShowBuildMenu(true);
  };

  const handleBuild = (recipe: typeof RECIPES[0]) => {
    if (!activeCell) return;
    
    // Check Resources
    if (
      blocks < recipe.cost.blocks ||
      techMaterials < recipe.cost.tech ||
      cultureMaterials < recipe.cost.culture ||
      blueprints < recipe.cost.blueprints
    ) {
      toast.error("⚠️ Recursos insuficientes. ¡Responde preguntas académicas para ganar más!");
      return;
    }

    // Check Streak
    if (recipe.reqStreak > 0 && streak < recipe.reqStreak) {
      toast.error(`🔒 Requiere una racha de ${recipe.reqStreak} preguntas correctas consecutivas (Racha actual: ${streak}).`);
      return;
    }

    // Apply Costs
    setBlocks(b => b - recipe.cost.blocks);
    setTechMaterials(t => t - recipe.cost.tech);
    setCultureMaterials(c => c - recipe.cost.culture);
    setBlueprints(bl => bl - recipe.cost.blueprints);

    // Apply Grid Change
    const newGrid = [...grid.map(row => [...row])];
    newGrid[activeCell.r][activeCell.c] = recipe.id;
    setGrid(newGrid);

    toast.success(`🏗️ ¡Construiste un ${recipe.name}!`);
    setShowBuildMenu(false);
    setActiveCell(null);
  };

  const handleDemolish = () => {
    if (!activeCell) return;
    const newGrid = [...grid.map(row => [...row])];
    newGrid[activeCell.r][activeCell.c] = "vacio";
    setGrid(newGrid);
    toast.info("🧹 Celda despejada.");
    setShowBuildMenu(false);
    setActiveCell(null);
  };

  const triggerQuestion = (subject: typeof academicSubject) => {
    if (!subject) return;
    setAcademicSubject(subject);
    setSelectedOption(null);
    setRoundFeedback(null);

    // Filter local list
    let list = CONSTRUCTOR_QUESTIONS.filter(q => q.subject === subject);
    
    // Attempt enrichment from main DB
    try {
      QUESTIONS_DB.forEach(q => {
        if (q.type === "multiple-choice" && q.options?.length === 4) {
          let mapped: any = q.subject;
          if (q.subject === "math") mapped = "matemáticas";
          if (["physics", "chemistry", "biology"].includes(q.subject)) mapped = "ciencias";
          if (q.subject === "history" || q.subject === "geography") mapped = "historia";
          if (q.subject === "english") mapped = "inglés";
          if (q.subject === "logic") mapped = "lógica";

          if (mapped === subject) {
            list.push({
              id: q.id,
              subject: mapped,
              prompt: q.prompt,
              options: q.options,
              correctIndex: q.correctIndex,
              explanation: q.explanation || "Concepto resuelto lógicamente."
            });
          }
        }
      });
    } catch (e) {}

    if (list.length === 0) {
      toast.error("No hay preguntas disponibles.");
      return;
    }

    const randomQ = list[Math.floor(Math.random() * list.length)];
    setActiveQuestion(randomQ);
  };

  const submitAnswer = (optionIdx: number) => {
    if (!activeQuestion || selectedOption !== null) return;
    setSelectedOption(optionIdx);

    const isCorrect = activeQuestion.correctIndex === optionIdx;
    setRoundFeedback(isCorrect);

    if (isCorrect) {
      // Award Resources depending on subject
      if (academicSubject === "matemáticas") {
        setBlocks(b => b + 4);
        toast.success("🧠 ¡Correcto! Ganaste: +4 Bloques Estructurales.");
      } else if (academicSubject === "ciencias") {
        setTechMaterials(t => t + 2);
        toast.success("🧪 ¡Correcto! Ganaste: +2 Materiales Tecnológicos.");
      } else if (academicSubject === "historia") {
        setCultureMaterials(c => c + 2);
        toast.success("📚 ¡Correcto! Ganaste: +2 Edificios Culturales.");
      } else if (academicSubject === "inglés") {
        setEfficiencyUpgrades(e => e + 2);
        toast.success("⚡ ¡Correcto! Ganaste: +2 Mejoras de Eficiencia.");
      } else if (academicSubject === "lógica") {
        setBlueprints(bl => bl + 1);
        toast.success("🏛️ ¡Correcto! Ganaste: +1 Planos Especiales.");
      }

      setStreak(s => s + 1);
      // Award Global Currency
      coinsMutation.mutate(2);
      xpMutation.mutate(20);
    } else {
      setStreak(0);
      toast.error("❌ Respuesta incorrecta. La racha se ha reiniciado.");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#07110E] border-b border-[#143224] px-6 py-4 flex items-center justify-between text-white shadow-md">
        <button onClick={() => navigate({ to: "/games" })} className="text-emerald-400 hover:text-white font-bold flex items-center gap-1.5 cursor-pointer bg-transparent border-none">
          <ArrowLeft className="size-5" /> Regresar al Hub
        </button>
        <div className="flex items-center gap-2">
          <Hammer className="size-5 text-emerald-400 animate-bounce" />
          <h1 className="font-display text-lg font-black tracking-wide bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent">Mundo Constructor</h1>
        </div>
        <div className="flex items-center gap-1.5 bg-[#143224]/30 border border-[#1E4A35] px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-300">
          <Sparkles className="size-3.5 text-emerald-400 animate-pulse" />
          <span>Racha: {streak} 🔥</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pt-6 pb-24 text-white min-h-[calc(100vh-68px)] bg-[#040908] grid grid-cols-1 lg:grid-cols-12 gap-8 relative overflow-hidden">
        {/* Decorative Grid Light */}
        <div className="absolute top-10 left-10 size-80 rounded-full bg-emerald-600/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 size-80 rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />

        {/* LEFT COLUMN: GRID CANVAS (7 COLS) */}
        <div className="lg:col-span-7 bg-[#091512] border border-[#143224] rounded-3xl p-6 shadow-xl relative z-10 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-[#143224] pb-4">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-100">Cuadrícula del Mundo</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Haz clic sobre cualquier celda para edificar tu imperio escolar.</p>
              </div>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
                GRID {GRID_SIZE}x{GRID_SIZE}
              </span>
            </div>

            {/* Sandbox Canvas Board */}
            <div className="mt-8 grid grid-cols-6 gap-2.5 max-w-[450px] mx-auto bg-[#040908] p-4 rounded-2xl border border-[#143224]">
              {grid.map((row, r) => 
                row.map((cell, c) => {
                  const isSelected = activeCell?.r === r && activeCell?.c === c;
                  const item = RECIPES.find(rec => rec.id === cell);
                  
                  return (
                    <button
                      key={`${r}-${c}`}
                      onClick={() => handleCellClick(r, c)}
                      className={`aspect-square rounded-xl border flex items-center justify-center text-2xl transition duration-200 hover:scale-105 active:scale-95 cursor-pointer relative group ${
                        isSelected 
                          ? "border-emerald-400 bg-emerald-500/25 ring-2 ring-emerald-500/25" 
                          : cell === "vacio" 
                            ? "border-[#143224]/40 bg-[#06100D] hover:border-[#1E4A35]" 
                            : "border-emerald-500/30 bg-[#0E241E] hover:border-emerald-400"
                      }`}
                    >
                      <span>{item ? item.icon : ""}</span>
                      <span className="absolute -bottom-1 -right-1 text-[8px] bg-slate-950/80 px-1 rounded text-slate-500 font-bold opacity-0 group-hover:opacity-100">
                        {r},{c}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#143224] flex justify-between items-center text-[10px] text-slate-400 font-bold">
            <span className="flex items-center gap-1.5"><Home className="size-3 text-emerald-400" /> Casas construidas: {grid.flat().filter(x => x === "casa").length}</span>
            <span className="flex items-center gap-1.5"><School className="size-3 text-indigo-400" /> Campus Universitarios: {grid.flat().filter(x => x === "universidad").length}</span>
          </div>
        </div>

        {/* RIGHT COLUMN: RESOURCE & STUDY ACADEMY (5 COLS) */}
        <div className="lg:col-span-5 space-y-6 relative z-10 flex flex-col justify-between">
          
          {/* Inventory Box */}
          <div className="bg-[#091512] border border-[#143224] rounded-3xl p-6 shadow-lg">
            <h3 className="font-display font-bold text-sm text-slate-100 uppercase tracking-widest border-b border-[#143224] pb-3 flex items-center gap-1.5">
              <Brush className="size-4 text-emerald-400" /> Almacén de Recursos
            </h3>
            
            <div className="grid grid-cols-2 gap-3 mt-4 text-xs font-bold">
              <div className="bg-[#040908] p-3 rounded-xl border border-[#143224] flex items-center justify-between">
                <span className="flex items-center gap-1.5">🧱 Bloques (Math)</span>
                <span className="text-emerald-400 text-sm font-black">{blocks}</span>
              </div>
              <div className="bg-[#040908] p-3 rounded-xl border border-[#143224] flex items-center justify-between">
                <span className="flex items-center gap-1.5">🧪 Tecnología (Ciencia)</span>
                <span className="text-indigo-400 text-sm font-black">{techMaterials}</span>
              </div>
              <div className="bg-[#040908] p-3 rounded-xl border border-[#143224] flex items-center justify-between">
                <span className="flex items-center gap-1.5">📚 Cultura (Historia)</span>
                <span className="text-purple-400 text-sm font-black">{cultureMaterials}</span>
              </div>
              <div className="bg-[#040908] p-3 rounded-xl border border-[#143224] flex items-center justify-between">
                <span className="flex items-center gap-1.5">⚡ Eficiencia (Inglés)</span>
                <span className="text-yellow-400 text-sm font-black">{efficiencyUpgrades}</span>
              </div>
              <div className="bg-[#040908] p-3 rounded-xl border border-[#143224] flex items-center justify-between col-span-2">
                <span className="flex items-center gap-1.5">🏛️ Planos (Lógica)</span>
                <span className="text-pink-400 text-sm font-black">{blueprints}</span>
              </div>
            </div>
          </div>

          {/* Academic Resource Academy */}
          <div className="bg-[#091512] border border-[#143224] rounded-3xl p-6 shadow-lg">
            <h3 className="font-display font-bold text-sm text-slate-100 uppercase tracking-widest border-b border-[#143224] pb-3 flex items-center gap-1.5">
              <GraduationCap className="size-4 text-emerald-400" /> Academia de Recursos
            </h3>
            <p className="text-[11px] text-slate-400 mt-2">Responde correctamente para añadir materiales a tu inventario.</p>
            
            <div className="flex flex-col gap-2 mt-4 text-xs font-bold">
              <button
                onClick={() => triggerQuestion("matemáticas")}
                className="w-full py-2.5 px-4 bg-[#040908] border border-[#143224] hover:bg-[#11241E] hover:border-emerald-500/40 rounded-xl transition text-left flex justify-between items-center cursor-pointer"
              >
                <span>🧮 Academia de Matemáticas</span>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded">+4 Bloques</span>
              </button>
              <button
                onClick={() => triggerQuestion("ciencias")}
                className="w-full py-2.5 px-4 bg-[#040908] border border-[#143224] hover:bg-[#11241E] hover:border-emerald-500/40 rounded-xl transition text-left flex justify-between items-center cursor-pointer"
              >
                <span>🧪 Academia de Ciencias</span>
                <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 px-2 py-0.5 rounded">+2 Tecnológicos</span>
              </button>
              <button
                onClick={() => triggerQuestion("historia")}
                className="w-full py-2.5 px-4 bg-[#040908] border border-[#143224] hover:bg-[#11241E] hover:border-emerald-500/40 rounded-xl transition text-left flex justify-between items-center cursor-pointer"
              >
                <span>🏛️ Academia de Historia</span>
                <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/25 px-2 py-0.5 rounded">+2 Culturales</span>
              </button>
              <button
                onClick={() => triggerQuestion("inglés")}
                className="w-full py-2.5 px-4 bg-[#040908] border border-[#143224] hover:bg-[#11241E] hover:border-emerald-500/40 rounded-xl transition text-left flex justify-between items-center cursor-pointer"
              >
                <span>🇬🇧 Academia de Inglés</span>
                <span className="text-[9px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/25 px-2 py-0.5 rounded">+2 Eficiencia</span>
              </button>
              <button
                onClick={() => triggerQuestion("lógica")}
                className="w-full py-2.5 px-4 bg-[#040908] border border-[#143224] hover:bg-[#11241E] hover:border-emerald-500/40 rounded-xl transition text-left flex justify-between items-center cursor-pointer"
              >
                <span>🧩 Desafío de Lógica</span>
                <span className="text-[9px] bg-pink-500/10 text-pink-400 border border-pink-500/25 px-2 py-0.5 rounded">+1 Planos</span>
              </button>
            </div>
          </div>
        </div>

        {/* DIALOGS / OVERLAYS MODALS */}

        {/* 1. BUILD MENU OVERLAY */}
        {showBuildMenu && activeCell && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-[#091512] border-2 border-emerald-500/25 rounded-3xl p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-indigo-500" />
              <div className="flex justify-between items-center border-b border-[#143224] pb-3">
                <h3 className="font-display text-lg font-bold text-slate-100 flex items-center gap-1.5">
                  <Hammer className="size-5 text-emerald-400" /> Menú de Edificación (Celda {activeCell.r}, {activeCell.c})
                </h3>
                <button
                  onClick={() => { setShowBuildMenu(false); setActiveCell(null); }}
                  className="text-slate-400 hover:text-white font-bold bg-transparent border-none cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Recipes list */}
              <div className="mt-4 space-y-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                {RECIPES.map((recipe) => {
                  const canAfford = 
                    blocks >= recipe.cost.blocks &&
                    techMaterials >= recipe.cost.tech &&
                    cultureMaterials >= recipe.cost.culture &&
                    blueprints >= recipe.cost.blueprints;
                  const isLockedByStreak = recipe.reqStreak > 0 && streak < recipe.reqStreak;

                  return (
                    <div 
                      key={recipe.id}
                      className={`flex items-center justify-between p-3.5 rounded-xl border ${
                        canAfford && !isLockedByStreak
                          ? "border-[#1E4A35] bg-[#0C1E1A]" 
                          : "border-[#143224]/30 bg-[#06100D] opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{recipe.icon}</span>
                        <div>
                          <h4 className="text-xs font-bold text-slate-200">{recipe.name}</h4>
                          <p className="text-[10px] text-slate-400 leading-normal mt-0.5">{recipe.desc}</p>
                          
                          {/* Cost Badge list */}
                          <div className="flex gap-2 mt-1.5 flex-wrap text-[9px] font-black uppercase text-slate-400">
                            {recipe.cost.blocks > 0 && <span className={blocks >= recipe.cost.blocks ? "text-emerald-400" : "text-rose-400"}>🧱 {recipe.cost.blocks} Bl</span>}
                            {recipe.cost.tech > 0 && <span className={techMaterials >= recipe.cost.tech ? "text-indigo-400" : "text-rose-400"}>🧪 {recipe.cost.tech} Tech</span>}
                            {recipe.cost.culture > 0 && <span className={cultureMaterials >= recipe.cost.culture ? "text-purple-400" : "text-rose-400"}>📚 {recipe.cost.culture} Cult</span>}
                            {recipe.cost.blueprints > 0 && <span className={blueprints >= recipe.cost.blueprints ? "text-pink-400" : "text-rose-400"}>🏛️ {recipe.cost.blueprints} Plan</span>}
                            {recipe.reqStreak > 0 && <span className={streak >= recipe.reqStreak ? "text-yellow-400 font-bold" : "text-rose-400 font-bold"}>🔥 Racha {recipe.reqStreak}</span>}
                          </div>
                        </div>
                      </div>

                      <button
                        disabled={!canAfford || isLockedByStreak}
                        onClick={() => handleBuild(recipe)}
                        className="h-8 px-4 bg-emerald-500 hover:bg-emerald-400 text-[#040908] font-bold text-[10px] rounded-lg border-none transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Construir
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Demolish Button */}
              {grid[activeCell.r][activeCell.c] !== "vacio" && (
                <div className="mt-4 pt-3 border-t border-[#143224]">
                  <button
                    onClick={handleDemolish}
                    className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-400 text-rose-400 font-bold text-[10px] rounded-xl cursor-pointer transition active:scale-95"
                  >
                    Demoler Edificación Actual 🧹
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. ACADEMIC QUESTION OVERLAY */}
        {activeQuestion && academicSubject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-[#091512] border-2 border-emerald-500/25 rounded-3xl p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-indigo-500" />
              
              <div className="flex justify-between items-center border-b border-[#143224] pb-3 text-xs text-slate-400 font-bold">
                <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
                  Academia: {academicSubject}
                </span>
                <span className="text-emerald-400">Racha: {streak} 🔥</span>
              </div>

              <div className="mt-5 space-y-4">
                <p className="text-sm font-bold text-slate-200 leading-relaxed">{activeQuestion.prompt}</p>

                {/* Feedback overlay */}
                {roundFeedback !== null && (
                  <div className="p-4 rounded-xl text-xs bg-[#040908] border border-[#143224] space-y-2">
                    <div className="flex items-center gap-1.5 font-bold">
                      {roundFeedback ? (
                        <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="size-4 animate-pulse" /> ¡Correcto!</span>
                      ) : (
                        <span className="text-rose-500 flex items-center gap-1"><XCircle className="size-4" /> Incorrecto</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-normal leading-relaxed">
                      <span className="font-bold text-emerald-400 block mb-0.5">Explicación:</span>
                      {activeQuestion.explanation}
                    </p>
                  </div>
                )}

                {/* Option list */}
                <div className="grid gap-2.5 text-left pt-2">
                  {activeQuestion.options.map((option, idx) => {
                    let btnStyle = "border-[#143224] bg-[#040908] hover:bg-[#11241E] text-slate-300 border";
                    if (selectedOption !== null) {
                      if (idx === activeQuestion.correctIndex) {
                        btnStyle = "border-emerald-500 bg-emerald-500/20 text-emerald-400 border-2";
                      } else if (idx === selectedOption) {
                        btnStyle = "border-rose-500 bg-rose-500/20 text-rose-400 border-2";
                      } else {
                        btnStyle = "opacity-35 border-[#143224] bg-[#040908]";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        disabled={selectedOption !== null}
                        onClick={() => submitAnswer(idx)}
                        className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition active:scale-[0.99] cursor-pointer text-left ${btnStyle}`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>

                {/* Next button */}
                {selectedOption !== null && (
                  <div className="pt-3 border-t border-[#143224] flex justify-end">
                    <button
                      onClick={() => { setActiveQuestion(null); setAcademicSubject(null); }}
                      className="h-9 px-6 bg-emerald-500 hover:bg-emerald-400 text-[#040908] font-bold text-xs rounded-lg border-none cursor-pointer transition active:scale-95"
                    >
                      Continuar y Cerrar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
