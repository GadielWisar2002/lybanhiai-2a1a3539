import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { rewardGameCoins, rewardGameXp } from "@/lib/games.functions";
import { AppHeader } from "@/components/AppHeader";
import { ArrowLeft, Sparkles, BookOpen, Trophy, Compass, User, Wrench, Moon, Sun, CloudRain, Info, Eye, Layers } from "lucide-react";
import { toast } from "sonner";
import { QUESTIONS_DB } from "@/lib/question-engine";
import { analyticsEngine } from "@/lib/analytics-engine";
import streakCap from "@/assets/streak-cap.png";

export const Route = createFileRoute("/_authenticated/games/mundo-constructor")({
  head: () => ({ meta: [{ title: "Mundo Constructor 3D — Lybanhi" }] }),
  component: MundoConstructorGame,
});

// TYPES & INTERFACES
interface Structure {
  id: string;
  type: string;
  x: number;
  y: number;
  z: number;
  rotation: number;
  status: "cimientos" | "completado";
  subject: string;
  subtopic: string;
  questionsSolved: number;
  questionsRequired: number;
  name: string;
}

interface CustomBlock {
  type: "brick" | "wood" | "glass" | "roof";
  x: number;
  y: number;
  z: number;
}

interface GameQuestion {
  id: string;
  subject: string;
  subtopic: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface Quest {
  id: string;
  title: string;
  desc: string;
  progress: number;
  target: number;
  rewardXp: number;
  rewardCoins: number;
  completed: boolean;
}

// 1. EXTENSIVE ACADEMIC QUESTIONS DATABASE
const ACADEMIC_QUESTIONS: GameQuestion[] = [
  // Matemáticas - Álgebra
  {
    id: "alg_1",
    subject: "matemáticas",
    subtopic: "Álgebra",
    prompt: "Resuelve para x: 5x - 12 = 3x + 8",
    options: ["x = 5", "x = 10", "x = 4", "x = 8"],
    correctIndex: 1,
    explanation: "Restamos 3x de ambos lados: 2x - 12 = 8. Sumamos 12: 2x = 20. Dividimos entre 2: x = 10."
  },
  {
    id: "alg_2",
    subject: "matemáticas",
    subtopic: "Álgebra",
    prompt: "¿Cuál es el valor de x en la ecuación cuadrática x² - 9 = 0?",
    options: ["x = 3", "x = -3", "x = 3 y x = -3", "x = 9"],
    correctIndex: 2,
    explanation: "Despejamos x: x² = 9. La raíz cuadrada de 9 tiene dos soluciones reales: 3 y -3."
  },
  // Matemáticas - Geometría
  {
    id: "geo_1",
    subject: "matemáticas",
    subtopic: "Geometría",
    prompt: "¿Cuál es el volumen de un cubo de 4 metros de arista?",
    options: ["16 m³", "48 m³", "64 m³", "24 m³"],
    correctIndex: 2,
    explanation: "El volumen de un cubo se calcula como Lado³: 4 * 4 * 4 = 64 m³."
  },
  {
    id: "geo_2",
    subject: "matemáticas",
    subtopic: "Geometría",
    prompt: "¿Cuál es la suma de los ángulos internos de un hexágono regular?",
    options: ["360°", "540°", "720°", "900°"],
    correctIndex: 2,
    explanation: "La fórmula es (n - 2) * 180. Para un hexágono (n=6): (6-2)*180 = 4*180 = 720°."
  },
  // Matemáticas - Estadística
  {
    id: "est_1",
    subject: "matemáticas",
    subtopic: "Estadística",
    prompt: "Encuentra la mediana de este conjunto de números ordenados: [2, 5, 8, 11, 15, 20]",
    options: ["8", "11", "9.5", "10"],
    correctIndex: 2,
    explanation: "Al haber un número par de elementos, la mediana es el promedio de los dos centrales: (8 + 11) / 2 = 9.5."
  },
  // Matemáticas - Trigonometría
  {
    id: "tri_1",
    subject: "matemáticas",
    subtopic: "Trigonometría",
    prompt: "Si sen(θ) = 3/5 en un triángulo rectángulo, ¿cuál es el valor de cos(θ)?",
    options: ["4/5", "3/4", "5/3", "2/5"],
    correctIndex: 0,
    explanation: "Por identidad pitagórica, cos²(θ) = 1 - sen²(θ) = 1 - 9/25 = 16/25. Por tanto, cos(θ) = 4/5."
  },

  // Ciencias - Física
  {
    id: "fis_1",
    subject: "ciencias",
    subtopic: "Física",
    prompt: "¿Qué fuerza neta se necesita para acelerar un objeto de 10 kg a 5 m/s²?",
    options: ["2 N", "15 N", "50 N", "0.5 N"],
    correctIndex: 2,
    explanation: "Usando la Segunda Ley de Newton F = m * a: F = 10 kg * 5 m/s² = 50 Newtons."
  },
  {
    id: "fis_2",
    subject: "ciencias",
    subtopic: "Física",
    prompt: "¿Cuál es la velocidad de escape de la Tierra aproximadamente?",
    options: ["11.2 km/s", "5.5 km/s", "29.8 km/s", "42.1 km/s"],
    correctIndex: 0,
    explanation: "La velocidad mínima para escapar de la atracción gravitatoria terrestre es de unos 11.2 km/s."
  },
  // Ciencias - Química
  {
    id: "qui_1",
    subject: "ciencias",
    subtopic: "Química",
    prompt: "¿Cuál es la masa molar del agua (H₂O) aproximadamente? (H=1 g/mol, O=16 g/mol)",
    options: ["17 g/mol", "18 g/mol", "20 g/mol", "16 g/mol"],
    correctIndex: 1,
    explanation: "Masa de H₂O = (2 * 1) + 16 = 18 g/mol."
  },
  // Ciencias - Biología
  {
    id: "bio_1",
    subject: "ciencias",
    subtopic: "Biología",
    prompt: "¿En qué organelo celular se realiza la respiración celular y se produce ATP?",
    options: ["Cloroplasto", "Lisosoma", "Mitocondria", "Ribosoma"],
    correctIndex: 2,
    explanation: "La mitocondria es la central de energía de la célula, responsable de sintetizar ATP mediante respiración celular."
  },

  // Programación - Algoritmos y Lógica
  {
    id: "prog_alg_1",
    subject: "programación",
    subtopic: "Algoritmos",
    prompt: "¿Cuál es la complejidad temporal en el peor caso para el ordenamiento QuickSort?",
    options: ["O(n log n)", "O(n²)", "O(n)", "O(log n)"],
    correctIndex: 1,
    explanation: "Aunque su promedio es O(n log n), el peor caso (con pivotes mal elegidos) es O(n²)."
  },
  {
    id: "prog_py_1",
    subject: "programación",
    subtopic: "Python",
    prompt: "En Python, ¿cuál es el resultado de: [1, 2] * 3?",
    options: ["[3, 6]", "[1, 2, 1, 2, 1, 2]", "[1, 2, 3]", "Error de tipo"],
    correctIndex: 1,
    explanation: "Multiplicar una lista por un entero en Python duplica sus elementos secuencialmente."
  },
  {
    id: "prog_js_1",
    subject: "programación",
    subtopic: "JavaScript",
    prompt: "¿Qué devuelve la expresión typeof null en JavaScript?",
    options: ["'null'", "'undefined'", "'object'", "'string'"],
    correctIndex: 2,
    explanation: "Por un error histórico en la implementación de JavaScript, typeof null retorna 'object'."
  },

  // Humanidades - Historia
  {
    id: "hist_1",
    subject: "humanidades",
    subtopic: "Historia",
    prompt: "¿En qué año dio inicio la Revolución Francesa?",
    options: ["1776", "1789", "1812", "1492"],
    correctIndex: 1,
    explanation: "La Revolución Francesa comenzó con la Toma de la Bastilla el 14 de julio de 1789."
  },
  // Humanidades - Geografía
  {
    id: "geo_pais_1",
    subject: "humanidades",
    subtopic: "Geografía",
    prompt: "¿Cuál es el río más largo y caudaloso del mundo?",
    options: ["Río Nilo", "Río Misisipi", "Río Amazonas", "Río Yangtsé"],
    correctIndex: 2,
    explanation: "El río Amazonas es el más largo y con mayor caudal de agua del planeta."
  },
  // Humanidades - Español
  {
    id: "esp_1",
    subject: "humanidades",
    subtopic: "Español",
    prompt: "¿Qué tipo de palabra es 'árbol' según su acentuación?",
    options: ["Aguda", "Grave o llana", "Esdrújula", "Sobreesdrújula"],
    correctIndex: 1,
    explanation: "Es grave porque tiene el acento prosódico en la penúltima sílaba y termina en consonante distinta de 'n' o 's'."
  }
];

// PREFABS FOR STRUCTURE SELECTION
const PREFABS = [
  { id: "dormitorio", name: "Residencia de Estudiantes", subject: "humanidades", subtopic: "Español", cost: { knowledge: 10, science: 0, culture: 5 }, questions: 2, icon: "🏢", desc: "Aumenta la capacidad de ciudadanos en la aldea." },
  { id: "aula", name: "Aula de Matemáticas", subject: "matemáticas", subtopic: "Álgebra", cost: { knowledge: 15, science: 5, culture: 0 }, questions: 3, icon: "🧮", desc: "Genera Conocimiento y permite estudiar Álgebra." },
  { id: "laboratorio", name: "Laboratorio Químico", subject: "ciencias", subtopic: "Química", cost: { knowledge: 10, science: 25, culture: 0 }, questions: 4, icon: "🧪", desc: "Genera Ciencia y desbloquea experimentos." },
  { id: "biblioteca", name: "Biblioteca Histórica", subject: "humanidades", subtopic: "Historia", cost: { knowledge: 20, science: 0, culture: 25 }, questions: 4, icon: "📚", desc: "Genera Cultura y posee interiores llenos de estanterías." },
  { id: "computo", name: "Laboratorio de Programación", subject: "programación", subtopic: "JavaScript", cost: { knowledge: 30, science: 20, culture: 10 }, questions: 5, icon: "💻", desc: "Genera Tecnología. Requerido para automatizaciones." },
  { id: "deportivo", name: "Cancha Multiusos", subject: "matemáticas", subtopic: "Geometría", cost: { knowledge: 25, science: 0, culture: 25 }, questions: 3, icon: "🏀", desc: "Área verde y recreativa de los campus estudiantiles." },
  { id: "auditorio", name: "Auditorio de Ciencias", subject: "ciencias", subtopic: "Física", cost: { knowledge: 50, science: 50, culture: 30 }, questions: 6, icon: "🏛️", desc: "Estructura monumental para debates académicos." }
];

// BIOMES SPECIFICATION
const BIOMES = {
  VALLE: { name: "Valle Matemático", color: 0x388e3c, fog: 0x1b5e20, xRange: [-1000, -350], zRange: [350, 1000] },
  MONTANA: { name: "Montañas Científicas", color: 0x90a4ae, fog: 0xd7ccc8, xRange: [-1000, -350], zRange: [-1000, -350] },
  TECNO: { name: "Ciudad Tecnológica", color: 0x212121, fog: 0x000000, xRange: [350, 1000], zRange: [-1000, -350] },
  HISTORICO: { name: "Distrito Histórico", color: 0x8d6e63, fog: 0x3e2723, xRange: [350, 1000], zRange: [350, 1000] },
  CAMPUS: { name: "Campus Universitario", color: 0x4caf50, fog: 0x2e7d32, xRange: [-350, 350], zRange: [-350, 350] },
  COSTA: { name: "Zona Costera & Lago", color: 0xffd54f, fog: 0xe0f7fa, xRange: [-1000, 1000], zRange: [-1000, 1000] } // Default fallback or water proximity
};

// DETERMINISTIC TERRAIN HEIGHT
function getTerrainHeight(x: number, z: number): number {
  const distFromCenter = Math.sqrt(x * x + z * z);
  
  // Ocean / Central Lake logic
  const lakeDist = Math.sqrt(x * x + (z + 200) * (z + 200));
  let lakeDepth = 0;
  if (lakeDist < 300) {
    const factor = lakeDist / 300;
    lakeDepth = (1 - Math.cos(factor * Math.PI)) * 8 - 16;
  }

  // Winding River
  const riverX = Math.sin(z / 150) * 150;
  const distToRiver = Math.abs(x - riverX);
  let riverDepth = 0;
  if (distToRiver < 60 && distFromCenter < 900) {
    const factor = distToRiver / 60;
    riverDepth = (1 - Math.cos(factor * Math.PI)) * 6 - 12;
  }

  // Mountain boundaries
  let mountainHeight = 0;
  if (distFromCenter > 750) {
    const factor = (distFromCenter - 750) / 250;
    mountainHeight = Math.pow(Math.max(0, factor), 1.8) * 80;
  }

  // Biome-specific noise
  let noise = Math.sin(x / 40) * Math.cos(z / 40) * 3;
  if (x < -350 && z < -350) {
    // Rocky mountains
    noise += Math.sin(x / 15) * Math.cos(z / 15) * 12 + Math.cos(x / 5) * 4;
  } else if (x > 350 && z > 350) {
    // Historic hills
    noise += Math.sin(x / 80) * 8;
  }

  const base = noise + mountainHeight;
  const waterInterference = Math.min(lakeDepth, riverDepth);
  return waterInterference < 0 ? waterInterference : base;
}

// GET BIOME TYPE BASED ON COORDS
function getBiomeAt(x: number, z: number): string {
  const dist = Math.sqrt(x * x + z * z);
  const lakeDist = Math.sqrt(x * x + (z + 200) * (z + 200));
  if (lakeDist < 320 || dist > 950) return "COSTA";

  if (x < -350 && z < -350) return "MONTANA";
  if (x > 350 && z < -350) return "TECNO";
  if (x < -350 && z > 350) return "VALLE";
  if (x > 350 && z > 350) return "HISTORICO";
  return "CAMPUS";
}

function MundoConstructorGame() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const rewardCoins = useServerFn(rewardGameCoins);
  const rewardXp = useServerFn(rewardGameXp);
  const { t } = useTranslation();

  // HTML CANVAS REF
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // GAME ENGINE STATE REFS (FOR PHYSICS & THREE LOOP PERFORMANCE)
  const engineRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    player: THREE.Group;
    keys: Record<string, boolean>;
    mouse: { x: number; y: number; isDown: boolean; yaw: number; pitch: number };
    velocity: THREE.Vector3;
    isGrounded: boolean;
    placedModels: Map<string, THREE.Group>;
    buildingPreview: THREE.Group | null;
    customBlockMeshes: Map<string, THREE.InstancedMesh>;
    particles: THREE.Points | null;
    clouds: THREE.Group;
    npcs: Array<{ mesh: THREE.Group; role: string; vx: number; vz: number; tx: number; tz: number; targetTimer: number; isSitting: boolean }>;
    vehicles: Array<{ mesh: THREE.Group; type: string; speed: number; waypoints: THREE.Vector3[]; wpIndex: number }>;
    ridingVehicleIndex: number;
    ambientLight: THREE.AmbientLight;
    dirLight: THREE.DirectionalLight;
    leavesParticles: THREE.Points | null;
  } | null>(null);

  // REACT STATE (UI INTERACTION)
  const [activeTab, setActiveTab] = useState<"explorer" | "build" | "custom_blocks" | "quests" | "stats">("explorer");
  
  // Economy & Resources
  const [knowledge, setKnowledge] = useState(50);
  const [science, setScience] = useState(20);
  const [culture, setCulture] = useState(20);
  const [technology, setTechnology] = useState(10);
  const [history, setHistory] = useState(10);
  const [blueprints, setBlueprints] = useState(1);
  const [streak, setStreak] = useState(0);
  const [cityLevel, setCityLevel] = useState(1);
  const [experience, setExperience] = useState(0);

  // Structure Placements
  const [structures, setStructures] = useState<Structure[]>([]);
  const [customBlocks, setCustomBlocks] = useState<CustomBlock[]>([]);
  const [buildModeActive, setBuildModeActive] = useState(false);
  const [selectedPrefab, setSelectedPrefab] = useState<typeof PREFABS[0] | null>(null);
  const [blockBuildMode, setBlockBuildMode] = useState<"brick" | "wood" | "glass" | "roof" | null>(null);

  // Dialogue & Academy Academic System
  const [activeQuestion, setActiveQuestion] = useState<GameQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [roundFeedback, setRoundFeedback] = useState<boolean | null>(null);
  const [currentQuizTarget, setCurrentQuizTarget] = useState<{ structureId?: string; academySubject?: string } | null>(null);

  // Active Environment states
  const [timeOfDay, setTimeOfDay] = useState(100); // 0 to 240 seconds
  const [weather, setWeather] = useState<"sunny" | "rainy">("sunny");
  const [activeBiome, setActiveBiome] = useState("CAMPUS");

  // Interaction prompts
  const [interactionPrompt, setInteractionPrompt] = useState<string | null>(null);
  const [playerCoordinates, setPlayerCoordinates] = useState({ x: 0, z: 0 });

  // Quests list
  const [quests, setQuests] = useState<Quest[]>([
    { id: "q1", title: "Primer Aula", desc: "Construye una Aula de Matemáticas en el Valle.", progress: 0, target: 1, rewardXp: 100, rewardCoins: 15, completed: false },
    { id: "q2", title: "Campus Vivo", desc: "Consigue que 15 estudiantes vivan en tu campus.", progress: 0, target: 15, rewardXp: 200, rewardCoins: 30, completed: false },
    { id: "q3", title: "Científico Supremo", desc: "Desbloquea y construye el Auditorio de Ciencias.", progress: 0, target: 1, rewardXp: 400, rewardCoins: 60, completed: false },
    { id: "q4", title: "Sabio del Código", desc: "Resuelve 5 preguntas de programación correctamente.", progress: 0, target: 5, rewardXp: 300, rewardCoins: 45, completed: false }
  ]);

  const coinsMutation = useMutation({
    mutationFn: (coins: number) => rewardCoins({ data: { coins } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard"] }),
  });

  const xpMutation = useMutation({
    mutationFn: (xp: number) => rewardXp({ data: { amount: xp } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard"] }),
  });

  // PERSISTENCE FROM LOCALSTORAGE
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedStructures = localStorage.getItem("mc_v2_structures");
      const savedBlocks = localStorage.getItem("mc_v2_blocks");
      const savedResources = localStorage.getItem("mc_v2_res");
      if (savedStructures) setStructures(JSON.parse(savedStructures));
      if (savedBlocks) setCustomBlocks(JSON.parse(savedBlocks));
      if (savedResources) {
        const parsed = JSON.parse(savedResources);
        setKnowledge(parsed.knowledge || 50);
        setScience(parsed.science || 20);
        setCulture(parsed.culture || 20);
        setTechnology(parsed.technology || 10);
        setHistory(parsed.history || 10);
        setBlueprints(parsed.blueprints || 1);
        setStreak(parsed.streak || 0);
        setCityLevel(parsed.cityLevel || 1);
        setExperience(parsed.experience || 0);
      }
    }
  }, []);

  // SAVE TO LOCALSTORAGE
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("mc_v2_structures", JSON.stringify(structures));
      localStorage.setItem("mc_v2_blocks", JSON.stringify(customBlocks));
      localStorage.setItem("mc_v2_res", JSON.stringify({
        knowledge, science, culture, technology, history, blueprints, streak, cityLevel, experience
      }));
    }
  }, [structures, customBlocks, knowledge, science, culture, technology, history, blueprints, streak, cityLevel, experience]);

  // INCREMENTAL PASSIVE ECONOMY TICK
  useEffect(() => {
    const interval = setInterval(() => {
      let dK = 0, dS = 0, dC = 0, dT = 0, dH = 0;
      structures.forEach(s => {
        if (s.status === "completado") {
          if (s.type === "aula") dK += 1;
          if (s.type === "laboratorio") dS += 1;
          if (s.type === "biblioteca") dC += 1;
          if (s.type === "computo") dT += 1;
          if (s.type === "dormitorio") dK += 0.5;
          if (s.type === "auditorio") { dS += 2; dK += 2; }
        }
      });
      if (dK > 0) setKnowledge(k => k + dK);
      if (dS > 0) setScience(s => s + dS);
      if (dC > 0) setCulture(c => c + dC);
      if (dT > 0) setTechnology(t => t + dT);
      if (dH > 0) setHistory(h => h + dH);

      // Quest checks
      setQuests(prev => prev.map(q => {
        if (q.id === "q2") {
          // capacity check
          const dormsCount = structures.filter(s => s.type === "dormitorio" && s.status === "completado").length;
          const currentCapacity = Math.min(q.target, dormsCount * 6);
          if (currentCapacity >= q.target && !q.completed) {
            handleCompleteQuest(q);
            return { ...q, progress: currentCapacity, completed: true };
          }
          return { ...q, progress: currentCapacity };
        }
        return q;
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [structures]);

  const handleCompleteQuest = (q: Quest) => {
    toast.success(`🎉 ¡Misión Completada: ${q.title}! (+${q.rewardXp} XP / +${q.rewardCoins} Monedas)`);
    setExperience(e => e + q.rewardXp);
    coinsMutation.mutate(q.rewardCoins);
    xpMutation.mutate(q.rewardXp);
  };

  // THREE.JS SCENE BOILERPLATE & PHYSICS CYCLE
  useEffect(() => {
    if (!canvasRef.current) return;

    const width = canvasRef.current.clientWidth;
    const height = canvasRef.current.clientHeight;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.005);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff8e1, 1.0);
    dirLight.position.set(100, 300, 100);
    scene.add(dirLight);

    // 5. Procedural 2000x2000 Terrain Mesh
    const terrainSize = 2000;
    const terrainSegments = 120;
    const geomTerrain = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegments, terrainSegments);
    geomTerrain.rotateX(-Math.PI / 2);

    // Paint vertices based on coordinates and slope
    const colors: number[] = [];
    const pos = geomTerrain.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      const vy = getTerrainHeight(vx, vz);
      pos.setY(i, vy);

      // Biome coloring logic
      const biome = getBiomeAt(vx, vz);
      let r = 0.3, g = 0.7, b = 0.3; // Campus grass

      if (vy < -4) {
        // Water bed sand
        r = 0.15; g = 0.25; b = 0.3;
      } else if (vy < 0) {
        // Shore sand
        r = 0.95; g = 0.85; b = 0.5;
      } else if (biome === "MONTANA") {
        if (vy > 35) {
          r = 0.95; g = 0.95; b = 0.95; // Snowy peaks
        } else {
          r = 0.55; g = 0.55; b = 0.55; // Stone grey
        }
      } else if (biome === "TECNO") {
        r = 0.18; g = 0.18; b = 0.22; // Concrete dark
      } else if (biome === "HISTORICO") {
        r = 0.55; g = 0.45; b = 0.35; // Terracotta clay
      } else if (biome === "VALLE") {
        r = 0.25; g = 0.65; b = 0.25; // Rich green
      }
      colors.push(r, g, b);
    }
    geomTerrain.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geomTerrain.computeVertexNormals();

    const matTerrain = new THREE.MeshLambertMaterial({
      vertexColors: true,
      flatShading: true
    });
    const terrainMesh = new THREE.Mesh(geomTerrain, matTerrain);
    scene.add(terrainMesh);

    // Lake / Ocean Water Mesh
    const geomWater = new THREE.PlaneGeometry(2000, 2000);
    geomWater.rotateX(-Math.PI / 2);
    const matWater = new THREE.MeshLambertMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.65
    });
    const waterMesh = new THREE.Mesh(geomWater, matWater);
    waterMesh.position.y = -4.5;
    scene.add(waterMesh);

    // 6. Player 3D Character Model (Minecraft / Roblox Voxel style)
    const playerGroup = new THREE.Group();
    scene.add(playerGroup);

    // Skin & torso mesh setup
    const matSkin = new THREE.MeshLambertMaterial({ color: 0xffcc99 });
    const matShirt = new THREE.MeshLambertMaterial({ color: 0x1976d2 });
    const matPants = new THREE.MeshLambertMaterial({ color: 0x37474f });

    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), matSkin);
    headMesh.position.y = 1.35;
    playerGroup.add(headMesh);

    const capMesh = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.2, 4), new THREE.MeshLambertMaterial({ color: 0x000000 }));
    capMesh.position.set(0, 1.62, 0);
    capMesh.rotation.y = Math.PI / 4;
    playerGroup.add(capMesh);

    const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.4), matShirt);
    torsoMesh.position.y = 0.7;
    playerGroup.add(torsoMesh);

    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.5, 0.25), matPants);
    leftLeg.position.set(-0.2, 0.25, 0);
    playerGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.5, 0.25), matPants);
    rightLeg.position.set(0.2, 0.25, 0);
    playerGroup.add(rightLeg);

    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), matShirt);
    leftArm.position.set(-0.45, 0.7, 0);
    playerGroup.add(leftArm);

    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), matShirt);
    rightArm.position.set(0.45, 0.7, 0);
    playerGroup.add(rightArm);

    playerGroup.position.set(0, getTerrainHeight(0, 0), 0);

    // Keyboard & Controls listeners
    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Mouse movement listeners
    const mouse = { x: 0, y: 0, isDown: false, yaw: 0.78, pitch: 0.6 };
    const handleMouseDown = (e: MouseEvent) => { mouse.isDown = true; };
    const handleMouseUp = (e: MouseEvent) => { mouse.isDown = false; };
    const handleMouseMove = (e: MouseEvent) => {
      if (mouse.isDown) {
        mouse.yaw -= e.movementX * 0.007;
        mouse.pitch = Math.max(0.1, Math.min(Math.PI / 2.2, mouse.pitch + e.movementY * 0.007));
      }
    };
    canvasRef.current.addEventListener("mousedown", handleMouseDown);
    canvasRef.current.addEventListener("mouseup", handleMouseUp);
    canvasRef.current.addEventListener("mousemove", handleMouseMove);

    // Instanced meshes for customization blocks optimization
    const customBlockMeshes = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1.0, 1.0, 1.0),
      new THREE.MeshLambertMaterial({ color: 0x8d6e63 }), // Brick default
      1000
    );
    customBlockMeshes.count = 0;
    scene.add(customBlockMeshes);

    // Weather particles: Rain setup
    const particleCount = 500;
    const geomRain = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      rainPositions[i] = (Math.random() - 0.5) * 80;
      rainPositions[i + 1] = Math.random() * 40;
      rainPositions[i + 2] = (Math.random() - 0.5) * 80;
    }
    geomRain.setAttribute("position", new THREE.BufferAttribute(rainPositions, 3));
    const matRain = new THREE.PointsMaterial({ color: 0x90caf9, size: 0.15, transparent: true, opacity: 0.6 });
    const rainPoints = new THREE.Points(geomRain, matRain);
    rainPoints.visible = false;
    scene.add(rainPoints);

    // Cloud groups
    const clouds = new THREE.Group();
    scene.add(clouds);
    const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
    for (let i = 0; i < 20; i++) {
      const cg = new THREE.Group();
      cg.position.set((Math.random() - 0.5) * 1200, 35 + Math.random() * 10, (Math.random() - 0.5) * 1200);
      const partCount = 3 + Math.floor(Math.random() * 3);
      for (let j = 0; j < partCount; j++) {
        const cloudPart = new THREE.Mesh(new THREE.BoxGeometry(8 + Math.random() * 8, 3, 5 + Math.random() * 5), cloudMat);
        cloudPart.position.set(j * 4 - partCount * 2, 0, (Math.random() - 0.5) * 4);
        cg.add(cloudPart);
      }
      clouds.add(cg);
    }

    // Spawning NPCs
    const npcs: any[] = [];
    const npcRoles = ["Estudiante", "Profesor", "Científico", "Ingeniero"];
    const npcColors = [0xe91e63, 0x9c27b0, 0x00bcd4, 0xffeb3b];
    for (let i = 0; i < 30; i++) {
      const group = new THREE.Group();
      const roleIdx = i % 4;
      const matNpcShirt = new THREE.MeshLambertMaterial({ color: npcColors[roleIdx] });
      
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), matSkin);
      head.position.y = 1.1;
      group.add(head);

      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.3), matNpcShirt);
      torso.position.y = 0.6;
      group.add(torso);

      const legs = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.25), matPants);
      legs.position.y = 0.15;
      group.add(legs);

      const nx = (Math.random() - 0.5) * 300;
      const nz = (Math.random() - 0.5) * 300;
      const ny = getTerrainHeight(nx, nz);
      group.position.set(nx, ny, nz);
      scene.add(group);

      npcs.push({
        mesh: group,
        role: npcRoles[roleIdx],
        vx: 0,
        vz: 0,
        tx: nx + (Math.random() - 0.5) * 50,
        tz: nz + (Math.random() - 0.5) * 50,
        targetTimer: 100,
        isSitting: false
      });
    }

    // Educational Vehicles: Yellow Bus & Bicycles
    const vehicles: any[] = [];
    
    // Yellow School Bus Group
    const busGroup = new THREE.Group();
    const matBusBody = new THREE.MeshLambertMaterial({ color: 0xffeb3b });
    const matWheel = new THREE.MeshLambertMaterial({ color: 0x212121 });
    const matGlass = new THREE.MeshLambertMaterial({ color: 0x90caf9 });

    const busBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 3.8), matBusBody);
    busBody.position.y = 0.8;
    busGroup.add(busBody);

    const busGlass = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.4, 1.5), matGlass);
    busGlass.position.set(0, 1.1, 0.8);
    busGroup.add(busGlass);

    for (let w = 0; w < 4; w++) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.3, 12), matWheel);
      wheel.rotateZ(Math.PI / 2);
      wheel.position.set(w % 2 === 0 ? 0.95 : -0.95, 0.25, w < 2 ? 1.2 : -1.2);
      busGroup.add(wheel);
    }
    busGroup.position.set(20, getTerrainHeight(20, 20), 20);
    scene.add(busGroup);

    // Simple Spline Path for the yellow bus to loop around campus
    const waypoints = [
      new THREE.Vector3(20, getTerrainHeight(20, 20), 20),
      new THREE.Vector3(120, getTerrainHeight(120, -50), -50),
      new THREE.Vector3(-80, getTerrainHeight(-80, -180), -180),
      new THREE.Vector3(-140, getTerrainHeight(-140, 100), 100),
      new THREE.Vector3(-20, getTerrainHeight(-20, 210), 210)
    ];

    vehicles.push({
      mesh: busGroup,
      type: "Autobús",
      speed: 0.15,
      waypoints,
      wpIndex: 0
    });

    // Save Engine Refs
    engineRef.current = {
      scene,
      camera,
      renderer,
      player: playerGroup,
      keys,
      mouse,
      velocity: new THREE.Vector3(),
      isGrounded: true,
      placedModels: new Map(),
      buildingPreview: null,
      customBlockMeshes,
      particles: rainPoints,
      clouds,
      npcs,
      vehicles,
      ridingVehicleIndex: -1,
      ambientLight,
      dirLight,
      leavesParticles: null
    };

    // 7. RENDER & PHYSICS LOOP
    let lastTime = Date.now();
    const animate = () => {
      const id = requestAnimationFrame(animate);
      if (!engineRef.current) return;

      const engine = engineRef.current;
      const time = Date.now();
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      // WEATHER RAIN EFFECT UPDATE
      if (engine.particles && engine.particles.visible) {
        const positions = engine.particles.geometry.attributes.position.array as Float32Array;
        for (let i = 1; i < positions.length; i += 3) {
          positions[i] -= 25 * dt; // gravity speed falling
          if (positions[i] < getTerrainHeight(positions[i - 1] + playerGroup.position.x, positions[i + 1] + playerGroup.position.z) - playerGroup.position.y) {
            positions[i] = 30 + Math.random() * 10;
          }
        }
        engine.particles.geometry.attributes.position.needsUpdate = true;
      }

      // SLOW MOVING CLOUDS
      engine.clouds.children.forEach(cg => {
        cg.position.x += 1.5 * dt;
        if (cg.position.x > 800) cg.position.x = -800;
      });

      // NPC ROUTINE MOVEMENT
      engine.npcs.forEach(npc => {
        if (npc.isSitting) return;

        // Walk to target
        const dx = npc.tx - npc.mesh.position.x;
        const dz = npc.tz - npc.mesh.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > 1) {
          const speed = 2.0 * dt;
          npc.mesh.position.x += (dx / dist) * speed;
          npc.mesh.position.z += (dz / dist) * speed;
          npc.mesh.position.y = getTerrainHeight(npc.mesh.position.x, npc.mesh.position.z);
          npc.mesh.rotation.y = Math.atan2(dx, dz);

          // Limb bobs
          const lLeg = npc.mesh.children[2];
          lLeg.rotation.x = Math.sin(time * 0.008) * 0.4;
        } else {
          npc.targetTimer -= 1;
          if (npc.targetTimer <= 0) {
            npc.tx = npc.mesh.position.x + (Math.random() - 0.5) * 120;
            npc.tz = npc.mesh.position.z + (Math.random() - 0.5) * 120;
            npc.targetTimer = 150 + Math.random() * 100;
          }
        }
      });

      // VEHICLES SPLINE PATH FOLLOWING
      engine.vehicles.forEach((veh, idx) => {
        if (idx === engine.ridingVehicleIndex) return; // Player driving/riding overrides script path

        const target = veh.waypoints[veh.wpIndex];
        const dx = target.x - veh.mesh.position.x;
        const dz = target.z - veh.mesh.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > 2) {
          const step = veh.speed * 60 * dt;
          veh.mesh.position.x += (dx / dist) * step;
          veh.mesh.position.z += (dz / dist) * step;
          veh.mesh.position.y = getTerrainHeight(veh.mesh.position.x, veh.mesh.position.z);
          veh.mesh.rotation.y = Math.atan2(dx, dz);
        } else {
          // next waypoint
          veh.wpIndex = (veh.wpIndex + 1) % veh.waypoints.length;
        }
      });

      // PLAYER PHYSICS AND RIDING INPUTS
      if (engine.ridingVehicleIndex >= 0) {
        // Locked to Bus vehicle position
        const bus = engine.vehicles[engine.ridingVehicleIndex].mesh;
        playerGroup.position.copy(bus.position);
        playerGroup.position.y += 1.2; // Sit inside roof

        // Driving keys
        const speed = 25 * dt;
        if (keys["w"]) {
          bus.translateZ(speed);
        }
        if (keys["s"]) {
          bus.translateZ(-speed);
        }
        if (keys["a"]) {
          bus.rotation.y += 2 * dt;
        }
        if (keys["d"]) {
          bus.rotation.y -= 2 * dt;
        }
        bus.position.y = getTerrainHeight(bus.position.x, bus.position.z);
      } else {
        // Normal character physics
        let moveX = 0;
        let moveZ = 0;
        if (keys["w"]) { moveZ = 1; }
        if (keys["s"]) { moveZ = -1; }
        if (keys["a"]) { moveX = 1; }
        if (keys["d"]) { moveX = -1; }

        const moveDir = new THREE.Vector3(moveX, 0, moveZ).normalize();
        moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), mouse.yaw);

        // Run factor
        const walkSpeed = keys["shift"] ? 16.0 : 8.5;
        engine.velocity.x = moveDir.x * walkSpeed;
        engine.velocity.z = moveDir.z * walkSpeed;

        // Gravity
        if (!engine.isGrounded) {
          engine.velocity.y -= 28.0 * dt; // gravity deceleration
        }

        // Apply velocity Y
        playerGroup.position.x += engine.velocity.x * dt;
        playerGroup.position.z += engine.velocity.z * dt;
        playerGroup.position.y += engine.velocity.y * dt;

        // Terrain snap and jumps
        const tHeight = getTerrainHeight(playerGroup.position.x, playerGroup.position.z);
        if (playerGroup.position.y <= tHeight) {
          playerGroup.position.y = tHeight;
          engine.velocity.y = 0;
          engine.isGrounded = true;
        } else {
          engine.isGrounded = false;
        }

        // Trigger Jump
        if (keys[" "] && engine.isGrounded) {
          engine.velocity.y = 11.0; // Jump force Y
          engine.isGrounded = false;
        }

        // Rotate torso/legs limbs based on motion
        if (moveX !== 0 || moveZ !== 0) {
          playerGroup.rotation.y = Math.atan2(moveDir.x, moveDir.z);
          // bob limbs
          leftLeg.rotation.x = Math.sin(time * 0.012) * 0.6;
          rightLeg.rotation.x = -Math.sin(time * 0.012) * 0.6;
          leftArm.rotation.x = -Math.sin(time * 0.012) * 0.4;
          rightArm.rotation.x = Math.sin(time * 0.012) * 0.4;
        } else {
          leftLeg.rotation.x = 0;
          rightLeg.rotation.x = 0;
          leftArm.rotation.x = 0;
          rightArm.rotation.x = 0;
        }
      }

      // 8. CAMERA ORBIT BEHIND PLAYER (THIRD PERSON Follow)
      const zoomDist = 12.0;
      const targetCamPos = new THREE.Vector3(
        playerGroup.position.x + zoomDist * Math.sin(mouse.yaw) * Math.cos(mouse.pitch),
        playerGroup.position.y + zoomDist * Math.sin(mouse.pitch) + 1.5,
        playerGroup.position.z + zoomDist * Math.cos(mouse.yaw) * Math.cos(mouse.pitch)
      );

      // Smooth camera interpolation
      camera.position.lerp(targetCamPos, 0.15);
      camera.lookAt(playerGroup.position.clone().add(new THREE.Vector3(0, 1, 0)));

      // Dynamic ambient fog and weather updates
      const currentBiome = getBiomeAt(playerGroup.position.x, playerGroup.position.z);
      setPlayerCoordinates({ x: Math.round(playerGroup.position.x), z: Math.round(playerGroup.position.z) });

      // RENDER
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!canvasRef.current || !engineRef.current) return;
      const w = canvasRef.current.clientWidth;
      const h = canvasRef.current.clientHeight;
      engineRef.current.camera.aspect = w / h;
      engineRef.current.camera.updateProjectionMatrix();
      engineRef.current.renderer.setSize(w, h, false);
    };
    window.addEventListener("resize", handleResize);

    // CLEANUP
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (canvasRef.current) {
        canvasRef.current.removeEventListener("mousedown", handleMouseDown);
        canvasRef.current.removeEventListener("mouseup", handleMouseUp);
        canvasRef.current.removeEventListener("mousemove", handleMouseMove);
      }
      if (engineRef.current) {
        engineRef.current.renderer.dispose();
      }
    };
  }, []);

  // ENVIRONMENT/WEATHER MANAGER HOOK
  useEffect(() => {
    if (!engineRef.current) return;
    const { scene, particles } = engineRef.current;
    if (weather === "rainy") {
      particles!.visible = true;
      scene.fog = new THREE.FogExp2(0x546e7a, 0.012);
      toast.info("🌧️ Comenzó a llover en el campus del conocimiento.");
    } else {
      particles!.visible = false;
      scene.fog = new THREE.FogExp2(0x87ceeb, 0.005);
      toast.info("☀️ El clima se ha despejado.");
    }
  }, [weather]);

  // DETECT SURROUNDINGS AND NPC PROMPTS NEAR PLAYER
  useEffect(() => {
    const checkProximity = setInterval(() => {
      if (!engineRef.current) return;
      const player = engineRef.current.player;
      
      // 1. Biome Check
      const biomeKey = getBiomeAt(player.position.x, player.position.z);
      setActiveBiome(BIOMES[biomeKey as keyof typeof BIOMES]?.name || "Desconocido");

      // 2. Structures Check (Interact nearby)
      let closeStructure: Structure | null = null;
      let minDist = 15;
      structures.forEach(s => {
        const dx = s.x - player.position.x;
        const dz = s.z - player.position.z;
        const dist = Math.sqrt(dx*dx + dz*dz);
        if (dist < minDist) {
          minDist = dist;
          closeStructure = s;
        }
      });

      if (closeStructure) {
        const s: Structure = closeStructure;
        if (s.status === "cimientos") {
          setInteractionPrompt(`Presiona 'Resolver Desafío' para completar los cimientos del ${s.name} (${s.questionsSolved}/${s.questionsRequired} Preguntas)`);
        } else {
          setInteractionPrompt(`Entrar a ${s.name} (Explorar interiores y dialogar con NPCs)`);
        }
      } else {
        // 3. Vehicles check
        let nearVehicle = false;
        engineRef.current.vehicles.forEach((veh, idx) => {
          const dx = veh.mesh.position.x - player.position.x;
          const dz = veh.mesh.position.z - player.position.z;
          const dist = Math.sqrt(dx*dx + dz*dz);
          if (dist < 6) {
            nearVehicle = true;
            setInteractionPrompt(`Presiona 'Subirse' para conducir/viajar en el ${veh.type}`);
          }
        });

        if (!nearVehicle) setInteractionPrompt(null);
      }
    }, 500);

    return () => clearInterval(checkProximity);
  }, [structures]);

  // REDRAW STRUCTURE MODELS ON COMPONENT STATE UPDATE
  useEffect(() => {
    if (!engineRef.current) return;
    const { scene, placedModels } = engineRef.current;

    // Materials definitions
    const matWood = new THREE.MeshLambertMaterial({ color: 0x8d6e63 });
    const matBrick = new THREE.MeshLambertMaterial({ color: 0xc62828 });
    const matGlass = new THREE.MeshLambertMaterial({ color: 0xe0f7fa, transparent: true, opacity: 0.5 });
    const matCimientos = new THREE.MeshLambertMaterial({ color: 0xffab00, transparent: true, opacity: 0.8 }); // Orange/amber
    const matRoof = new THREE.MeshLambertMaterial({ color: 0x3e2723 });
    const matSteel = new THREE.MeshLambertMaterial({ color: 0x78909c });
    const matGrass = new THREE.MeshLambertMaterial({ color: 0x4caf50 });

    // Clean deleted
    placedModels.forEach((model, id) => {
      const exists = structures.some(s => s.id === id);
      if (!exists) {
        scene.remove(model);
        placedModels.delete(id);
      }
    });

    // Build/Update
    structures.forEach(s => {
      if (placedModels.has(s.id)) return; // Already exists in 3D

      const bGroup = new THREE.Group();
      bGroup.position.set(s.x, s.y, s.z);

      if (s.status === "cimientos") {
        // Scaffolding representation (cubes and bars)
        const frame = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 4), matCimientos);
        frame.position.y = 1.5;
        bGroup.add(frame);

        // Scaffolding lines
        const wire = new THREE.LineSegments(
          new THREE.EdgesGeometry(new THREE.BoxGeometry(4.2, 3.2, 4.2)),
          new THREE.LineBasicMaterial({ color: 0x000000 })
        );
        wire.position.y = 1.5;
        bGroup.add(wire);
      } else {
        // Completed meshes based on prefab specifications
        if (s.type === "aula") {
          // Classroom Box + Roof
          const base = new THREE.Mesh(new THREE.BoxGeometry(5, 3.2, 5), matBrick);
          base.position.y = 1.6;
          const roof = new THREE.Mesh(new THREE.ConeGeometry(4.2, 2.0, 4), matRoof);
          roof.position.set(0, 4.2, 0);
          roof.rotation.y = Math.PI / 4;
          bGroup.add(base, roof);
        } else if (s.type === "laboratorio") {
          // Circular cylinder observatory or laboratory
          const base = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 3.5, 12), matSteel);
          base.position.y = 1.75;
          const dome = new THREE.Mesh(new THREE.SphereGeometry(2.5, 12, 10, 0, Math.PI*2, 0, Math.PI/2), matGlass);
          dome.position.y = 3.5;
          bGroup.add(base, dome);
        } else if (s.type === "dormitorio") {
          // Tall block
          const base = new THREE.Mesh(new THREE.BoxGeometry(4, 5.5, 4), matWood);
          base.position.y = 2.75;
          bGroup.add(base);
        } else if (s.type === "biblioteca") {
          // Wide library arches
          const base = new THREE.Mesh(new THREE.BoxGeometry(7, 4.0, 5), matWood);
          base.position.y = 2.0;
          const dome = new THREE.Mesh(new THREE.BoxGeometry(6, 1.2, 4), matSteel);
          dome.position.y = 4.6;
          bGroup.add(base, dome);
        } else if (s.type === "computo") {
          // Tech square blocks
          const base = new THREE.Mesh(new THREE.BoxGeometry(5.5, 3.8, 5.5), matSteel);
          base.position.y = 1.9;
          bGroup.add(base);
        } else if (s.type === "deportivo") {
          // Flat green pitch with basketball posts
          const pitch = new THREE.Mesh(new THREE.BoxGeometry(8, 0.1, 12), matGrass);
          pitch.position.y = 0.05;
          bGroup.add(pitch);
        } else if (s.type === "auditorio") {
          // Majestic dome structure
          const base = new THREE.Mesh(new THREE.BoxGeometry(10, 5.0, 10), matBrick);
          base.position.y = 2.5;
          const dome = new THREE.Mesh(new THREE.SphereGeometry(4.8, 12, 12, 0, Math.PI*2, 0, Math.PI/2), matSteel);
          dome.position.y = 5.0;
          bGroup.add(base, dome);
        }
      }

      scene.add(bGroup);
      placedModels.set(s.id, bGroup);
    });

  }, [structures]);

  // REDRAW INSTANCED CUSTOM BLOCKS (MINECRAFT STYLE)
  useEffect(() => {
    if (!engineRef.current) return;
    const { customBlockMeshes } = engineRef.current;
    
    // Set matrices
    const count = customBlocks.length;
    customBlockMeshes.count = count;

    const dummy = new THREE.Object3D();
    customBlocks.forEach((b, idx) => {
      dummy.position.set(b.x, b.y, b.z);
      dummy.updateMatrix();
      customBlockMeshes.setMatrixAt(idx, dummy.matrix);
    });
    customBlockMeshes.instanceMatrix.needsUpdate = true;

  }, [customBlocks]);

  // HANDLE PREFAB CONSTRUCTION
  const handlePlaceStructure = (prefab: typeof PREFABS[0]) => {
    // Check costs
    if (
      knowledge < prefab.cost.knowledge ||
      science < prefab.cost.science ||
      culture < prefab.cost.culture
    ) {
      toast.error("❌ Recursos insuficientes en el Almacén.");
      return;
    }

    if (!engineRef.current) return;
    const player = engineRef.current.player;

    // Calculate place coordinates in front of player
    const rad = player.rotation.y;
    const placeX = player.position.x - Math.sin(rad) * 12;
    const placeZ = player.position.z - Math.cos(rad) * 12;
    const placeY = getTerrainHeight(placeX, placeZ);

    const newStruct: Structure = {
      id: "struct_" + Date.now(),
      type: prefab.id,
      name: prefab.name,
      x: placeX,
      y: placeY,
      z: placeZ,
      rotation: rad,
      status: "cimientos",
      subject: prefab.subject,
      subtopic: prefab.subtopic,
      questionsSolved: 0,
      questionsRequired: prefab.questions
    };

    setKnowledge(k => k - prefab.cost.knowledge);
    setScience(s => s - prefab.cost.science);
    setCulture(c => c - prefab.cost.culture);
    setStructures(prev => [...prev, newStruct]);

    // Check quests
    setQuests(prev => prev.map(q => {
      if (q.id === "q1" && prefab.id === "aula" && !q.completed) {
        handleCompleteQuest(q);
        return { ...q, progress: 1, completed: true };
      }
      return q;
    }));

    toast.success(`🏗️ Cimientos de ${prefab.name} colocados. Dirígete a ellos para resolver los desafíos.`);
  };

  // HANDLE BLOCK PLACEMENT (MINECRAFT STYLE)
  const handlePlaceCustomBlock = () => {
    if (!blockBuildMode) return;
    if (knowledge < 2) {
      toast.error("❌ Se requieren al menos 2 unidades de Conocimiento.");
      return;
    }

    if (!engineRef.current) return;
    const player = engineRef.current.player;

    const rad = player.rotation.y;
    const bx = Math.round(player.position.x - Math.sin(rad) * 3.5);
    const bz = Math.round(player.position.z - Math.cos(rad) * 3.5);
    const by = Math.round(getTerrainHeight(bx, bz) + 0.5);

    const newBlock: CustomBlock = {
      type: blockBuildMode,
      x: bx,
      y: by,
      z: bz
    };

    setCustomBlocks(prev => [...prev, newBlock]);
    setKnowledge(k => k - 2);
    toast.success(`🧱 Bloque de ${blockBuildMode} colocado.`);
  };

  // TRIGGER CIMENTATION ACADEMIC CHALLENGE
  const handleTriggerInteraction = () => {
    if (!engineRef.current) return;
    const player = engineRef.current.player;

    // Check vehicle riding
    const engine = engineRef.current;
    if (engine.ridingVehicleIndex >= 0) {
      // Exit vehicle
      engine.ridingVehicleIndex = -1;
      toast.info("🚌 Bajaste del vehículo.");
      return;
    }

    // Check vehicle nearby to enter
    let busIndex = -1;
    engine.vehicles.forEach((veh, idx) => {
      const dx = veh.mesh.position.x - player.position.x;
      const dz = veh.mesh.position.z - player.position.z;
      const dist = Math.sqrt(dx*dx + dz*dz);
      if (dist < 6) {
        busIndex = idx;
      }
    });

    if (busIndex >= 0) {
      engine.ridingVehicleIndex = busIndex;
      toast.success("🚌 Subiste al Autobús Escolar. ¡Presiona WASD para conducirlo!");
      return;
    }

    // Check closest cimentation structure
    let closeStructure: Structure | null = null;
    let minDist = 12;
    structures.forEach(s => {
      const dx = s.x - player.position.x;
      const dz = s.z - player.position.z;
      const dist = Math.sqrt(dx*dx + dz*dz);
      if (dist < minDist) {
        minDist = dist;
        closeStructure = s;
      }
    });

    if (closeStructure) {
      const s: Structure = closeStructure;
      if (s.status === "cimientos") {
        setCurrentQuizTarget({ structureId: s.id });
        // Retrieve random question from subject
        const filter = ACADEMIC_QUESTIONS.filter(q => q.subject === s.subject);
        if (filter.length > 0) {
          setActiveQuestion(filter[Math.floor(Math.random() * filter.length)]);
          setSelectedOption(null);
          setRoundFeedback(null);
        } else {
          toast.error("No hay preguntas disponibles para este bioma académico.");
        }
      } else {
        toast.info(`🏫 Entrando a ${s.name}... Puedes conversar con los profesores adentro.`);
      }
    }
  };

  // SUBMIT QUIZ ANSWER
  const handleSubmitAnswer = (optionIdx: number) => {
    if (!activeQuestion || selectedOption !== null) return;
    setSelectedOption(optionIdx);

    const isCorrect = activeQuestion.correctIndex === optionIdx;
    setRoundFeedback(isCorrect);

    if (isCorrect) {
      setStreak(s => s + 1);
      setExperience(e => e + 40);
      coinsMutation.mutate(5);

      // Check current level up of city
      const totalScore = experience + 40;
      if (totalScore >= cityLevel * 1000 && cityLevel < 5) {
        setCityLevel(l => l + 1);
        toast.success(`⭐️ ¡Tu Ciudad Educativa subió al Nivel ${cityLevel + 1}!`);
      }

      // Check structure cimentation questions progress
      if (currentQuizTarget?.structureId) {
        setStructures(prev => prev.map(s => {
          if (s.id === currentQuizTarget.structureId) {
            const solved = s.questionsSolved + 1;
            if (solved >= s.questionsRequired) {
              toast.success(`🌟 ¡Cimientos Completados! El ${s.name} ha sido edificado con éxito.`);
              // Remove 3D cimientos and trigger reload
              if (engineRef.current) {
                const model = engineRef.current.placedModels.get(s.id);
                if (model) {
                  engineRef.current.scene.remove(model);
                  engineRef.current.placedModels.delete(s.id);
                }
              }
              return { ...s, questionsSolved: solved, status: "completado" };
            }
            return { ...s, questionsSolved: solved };
          }
          return s;
        }));
      }

      // Check quests logic
      setQuests(prev => prev.map(q => {
        if (q.id === "q4" && activeQuestion.subject === "programación" && !q.completed) {
          const nextProg = q.progress + 1;
          if (nextProg >= q.target) {
            handleCompleteQuest(q);
            return { ...q, progress: nextProg, completed: true };
          }
          return { ...q, progress: nextProg };
        }
        return q;
      }));

      // Reward material resources
      if (activeQuestion.subject === "matemáticas") setKnowledge(k => k + 15);
      if (activeQuestion.subject === "ciencias") setScience(s => s + 15);
      if (activeQuestion.subject === "humanidades") setCulture(c => c + 15);
      if (activeQuestion.subject === "programación") setTechnology(t => t + 15);

      toast.success("✅ ¡Respuesta Correcta! Recursos y experiencia añadidos.");
    } else {
      setStreak(0);
      toast.error("❌ Respuesta Incorrecta. La racha de respuestas ha vuelto a 0.");
    }
  };

  const getCityLevelName = (lvl: number) => {
    const names = [
      "Aldea Educativa",
      "Pueblo del Conocimiento",
      "Ciudad Académica",
      "Metrópolis Escolar",
      "Capital Mundial del Saber"
    ];
    return names[lvl - 1] || names[0];
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-hidden select-none font-sans">
      {/* HEADER HUD BAR */}
      <header className="bg-[#050c0a] border-b border-[#143224] px-6 py-4 flex items-center justify-between z-30 shadow-md">
        <button onClick={() => navigate({ to: "/games" })} className="text-emerald-400 hover:text-white font-bold flex items-center gap-1.5 cursor-pointer bg-transparent border-none">
          <ArrowLeft className="size-5" /> Salir del Sandbox
        </button>
        
        {/* City Rank status */}
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏛️</span>
          <div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Nivel de la Ciudad</div>
            <div className="text-sm font-black text-emerald-400 uppercase tracking-widest">{getCityLevelName(cityLevel)} (Lv.{cityLevel})</div>
          </div>
        </div>

        {/* Global Statistics */}
        <div className="flex items-center gap-4 text-xs font-bold text-slate-300">
          <div className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl flex items-center gap-1">
            <Sparkles className="size-4 text-yellow-400" /> Racha: <span className="text-emerald-400">{streak} 🔥</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl">
            XP: <span className="text-indigo-400">{experience} pts</span>
          </div>
        </div>
      </header>

      {/* GAME LAYOUT CONTAINER */}
      <main className="flex-1 grid grid-cols-12 relative overflow-hidden">
        {/* LEFT COLUMN: VISUAL ENGINE SCREEN (8 COLS) */}
        <div className="col-span-12 lg:col-span-9 relative bg-[#020504] overflow-hidden flex flex-col">
          {/* THREEJS CANVAS ELEMENT */}
          <canvas ref={canvasRef} className="w-full h-full block touch-none" />

          {/* REAL-TIME ENVIRONMENT HUD OVERLAYS */}
          <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none z-10 font-bold select-none">
            {/* Coordinate Tracker & Active Biome */}
            <div className="bg-slate-950/80 border border-emerald-500/20 backdrop-blur px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 text-slate-200">
              <Compass className="size-4 text-emerald-400 animate-spin" />
              <span>Bioma: <span className="text-emerald-400 font-extrabold uppercase">{activeBiome}</span></span>
              <span className="text-slate-400">· Coords: ({playerCoordinates.x}, {playerCoordinates.z})</span>
            </div>

            {/* Time / Climate Manager controller buttons */}
            <div className="flex gap-2 pointer-events-auto">
              <button
                onClick={() => setWeather(w => w === "sunny" ? "rainy" : "sunny")}
                className="bg-slate-950/80 hover:bg-slate-900 border border-[#143224] p-2 rounded-xl text-xs cursor-pointer flex items-center gap-1"
              >
                {weather === "sunny" ? <Sun className="size-4 text-yellow-400" /> : <CloudRain className="size-4 text-blue-400" />}
                <span className="hidden sm:inline">Alternar Clima</span>
              </button>
            </div>
          </div>

          {/* INTERACTION PROMPT ACTION */}
          {interactionPrompt && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 px-6 py-3 rounded-full text-xs font-black tracking-widest shadow-2xl z-20 animate-bounce flex items-center gap-2 border border-slate-950">
              <Info className="size-4 text-slate-950" />
              <span>{interactionPrompt}</span>
              <button
                onClick={handleTriggerInteraction}
                className="bg-slate-950 text-white px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-wider cursor-pointer ml-3 border-none hover:bg-slate-900"
              >
                [ Ejecutar Acción ]
              </button>
            </div>
          )}

          {/* BOTTOM CONTROLS DIRECTORY BUTTONS */}
          <div className="absolute bottom-6 left-4 right-4 bg-slate-950/90 border border-slate-800 backdrop-blur p-3.5 rounded-2xl flex items-center justify-between z-10 text-xs font-bold shadow-2xl">
            <div className="flex gap-2">
              <button
                onClick={() => { setActiveTab("explorer"); setBlockBuildMode(null); }}
                className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${activeTab === "explorer" && !blockBuildMode ? "bg-emerald-500 text-slate-950" : "bg-slate-900 hover:bg-slate-800"}`}
              >
                <User className="size-4" /> Modo Explorar
              </button>
              <button
                onClick={() => { setActiveTab("build"); setBlockBuildMode(null); }}
                className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${activeTab === "build" ? "bg-emerald-500 text-slate-950" : "bg-slate-900 hover:bg-slate-800"}`}
              >
                <Wrench className="size-4" /> Planos Campus
              </button>
              <button
                onClick={() => { setActiveTab("custom_blocks"); setBlockBuildMode("brick"); }}
                className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${activeTab === "custom_blocks" ? "bg-emerald-500 text-slate-950" : "bg-slate-900 hover:bg-slate-800"}`}
              >
                <Layers className="size-4" /> Bloques Libres
              </button>
            </div>
            
            <div className="text-[10px] text-slate-400 select-none hidden md:block">
              ⌨️ Controles: WASD (Movimiento) · Shift (Correr) · Espacio (Saltar) · Mouse (Arrastrar para rotar cámara)
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: RESOURCE ALMACÉN & TABS (4 COLS) */}
        <div className="col-span-12 lg:col-span-3 border-l border-slate-900 bg-[#060c0a] flex flex-col justify-between overflow-y-auto max-h-[calc(100vh-68px)]">
          {/* Inventory Almacén header */}
          <div className="p-6 border-b border-slate-900">
            <h3 className="text-xs uppercase font-black tracking-widest text-slate-400 flex items-center gap-1.5 mb-4">
              <span>🎒</span> Almacén Educativo
            </h3>
            
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <div className="bg-slate-950 border border-[#143224] p-3 rounded-xl flex items-center justify-between">
                <span>📚 Conocimiento</span>
                <span className="text-emerald-400 font-extrabold text-sm">{Math.floor(knowledge)}</span>
              </div>
              <div className="bg-slate-950 border border-[#143224] p-3 rounded-xl flex items-center justify-between">
                <span>🧪 Ciencia</span>
                <span className="text-indigo-400 font-extrabold text-sm">{Math.floor(science)}</span>
              </div>
              <div className="bg-slate-950 border border-[#143224] p-3 rounded-xl flex items-center justify-between">
                <span>🎨 Cultura</span>
                <span className="text-purple-400 font-extrabold text-sm">{Math.floor(culture)}</span>
              </div>
              <div className="bg-slate-950 border border-[#143224] p-3 rounded-xl flex items-center justify-between">
                <span>💻 Tecnología</span>
                <span className="text-yellow-400 font-extrabold text-sm">{Math.floor(technology)}</span>
              </div>
            </div>
          </div>

          {/* Dynamic Tab Contents */}
          <div className="flex-1 p-6">
            {activeTab === "explorer" && (
              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-200">🚩 Estado del Campus</h4>
                <p className="text-xs text-slate-400 leading-normal">
                  Camina libremente con tu avatar. Explora los diferentes biomas, ingresa a las aulas y completa las preguntas de los cimientos amarillos flotantes para edificar.
                </p>

                <div className="bg-slate-950/50 border border-slate-900 rounded-2xl p-4 space-y-3 text-xs">
                  <div className="flex justify-between border-b border-slate-900 pb-2">
                    <span className="text-slate-400 font-medium">Estructuras construidas:</span>
                    <span className="font-extrabold text-emerald-400">{structures.filter(s=>s.status==="completado").length}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-2">
                    <span className="text-slate-400 font-medium">Cimientos activos:</span>
                    <span className="font-extrabold text-yellow-400">{structures.filter(s=>s.status==="cimientos").length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Bloques personalizados:</span>
                    <span className="font-extrabold text-indigo-400">{customBlocks.length}</span>
                  </div>
                </div>

                {/* Quests Summary */}
                <div className="pt-4 space-y-2.5">
                  <h5 className="text-xs font-black uppercase text-slate-400">Objetivos Académicos</h5>
                  {quests.map(q => (
                    <div key={q.id} className="bg-slate-950 border border-slate-900 p-3 rounded-xl space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className={q.completed ? "text-emerald-400 line-through" : "text-slate-200"}>{q.title}</span>
                        <span className="text-slate-400">{q.progress} / {q.target}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">{q.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "build" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-black text-slate-200">🔨 Colocar Planos</h4>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">Planos 3D</span>
                </div>
                <p className="text-xs text-slate-400 leading-normal">
                  Selecciona una estructura para proyectar sus cimientos. Requiere Conocimiento y Ciencia.
                </p>

                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {PREFABS.map(p => (
                    <div key={p.id} className="bg-slate-950 border border-[#143224] p-3.5 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200 flex items-center gap-1">{p.icon} {p.name}</span>
                        <button
                          onClick={() => handlePlaceStructure(p)}
                          className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black uppercase rounded-lg border-none cursor-pointer transition"
                        >
                          Ubicar
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">{p.desc}</p>
                      
                      {/* Cost metrics */}
                      <div className="flex gap-2.5 text-[9px] font-black uppercase text-slate-500">
                        {p.cost.knowledge > 0 && <span className={knowledge >= p.cost.knowledge ? "text-emerald-400" : "text-rose-400"}>📚 {p.cost.knowledge} Con</span>}
                        {p.cost.science > 0 && <span className={science >= p.cost.science ? "text-indigo-400" : "text-rose-400"}>🧪 {p.cost.science} Cie</span>}
                        {p.cost.culture > 0 && <span className={culture >= p.cost.culture ? "text-purple-400" : "text-rose-400"}>🎨 {p.cost.culture} Cult</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "custom_blocks" && (
              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-200">🧱 Construcción de Bloques</h4>
                <p className="text-xs text-slate-400 leading-normal">
                  Coloca bloques de construcción libres en el suelo al estilo Minecraft. Cada bloque colocado consume <span className="text-emerald-400 font-bold">2 de Conocimiento</span>.
                </p>

                <div className="grid grid-cols-2 gap-2">
                  {(["brick", "wood", "glass", "roof"] as const).map(bt => (
                    <button
                      key={bt}
                      onClick={() => setBlockBuildMode(bt)}
                      className={`p-3.5 border rounded-xl font-black capitalize text-xs transition cursor-pointer flex flex-col items-center gap-1.5 ${blockBuildMode === bt ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" : "border-slate-800 bg-slate-950 hover:bg-slate-900"}`}
                    >
                      <span className="text-xl">
                        {bt === "brick" && "🧱"}
                        {bt === "wood" && "🪵"}
                        {bt === "glass" && "🪟"}
                        {bt === "roof" && "🏠"}
                      </span>
                      {bt === "brick" ? "Ladrillo" : bt === "wood" ? "Madera" : bt === "glass" ? "Cristal" : "Techo"}
                    </button>
                  ))}
                </div>

                {blockBuildMode && (
                  <div className="pt-2">
                    <button
                      onClick={handlePlaceCustomBlock}
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl border-none cursor-pointer transition"
                    >
                      Colocar Bloque Actual (E)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-6 border-t border-slate-900 text-center text-[10px] text-slate-500">
            Mundo Constructor 3D v2.0 · Lybanhi Sandbox
          </div>
        </div>
      </main>

      {/* DIALOG ACADEMIC TRIVIA QUESTION MODAL */}
      {activeQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#091512] border-2 border-emerald-500/25 rounded-3xl p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 text-white">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-indigo-500" />
            
            <div className="flex justify-between items-center border-b border-[#143224] pb-3 text-xs text-slate-400 font-bold">
              <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
                Desafío: {activeQuestion.subject} ({activeQuestion.subtopic})
              </span>
              <span className="text-emerald-400">Racha: {streak} 🔥</span>
            </div>

            <div className="mt-5 space-y-4">
              <p className="text-sm font-bold text-slate-200 leading-relaxed">{activeQuestion.prompt}</p>

              {/* Feedback dialog */}
              {roundFeedback !== null && (
                <div className="p-4 rounded-xl text-xs bg-[#040908] border border-[#143224] space-y-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    {roundFeedback ? (
                      <span className="text-emerald-400 text-sm flex items-center gap-1">✅ ¡Correcto!</span>
                    ) : (
                      <span className="text-rose-500 text-sm flex items-center gap-1">❌ Incorrecto</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 font-normal leading-relaxed">
                    <span className="font-bold text-emerald-400 block mb-0.5">Explicación:</span>
                    {activeQuestion.explanation}
                  </p>
                </div>
              )}

              {/* Options */}
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
                      onClick={() => handleSubmitAnswer(idx)}
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
                    onClick={() => {
                      setActiveQuestion(null);
                      setCurrentQuizTarget(null);
                    }}
                    className="h-9 px-6 bg-emerald-500 hover:bg-emerald-400 text-[#040908] font-bold text-xs rounded-lg border-none cursor-pointer transition active:scale-95"
                  >
                    Continuar Construyendo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
