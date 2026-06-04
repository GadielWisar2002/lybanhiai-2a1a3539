import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { rewardGameCoins, rewardGameXp } from "@/lib/games.functions";
import { AppHeader } from "@/components/AppHeader";
import { ArrowLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { QUESTIONS_DB } from "@/lib/question-engine";
import { analyticsEngine } from "@/lib/analytics-engine";
import streakCap from "@/assets/streak-cap.png";

const GraduationCap = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
    <path d="M21.5 12v6" />
  </svg>
);

export const Route = createFileRoute("/_authenticated/games/mundo-constructor")({
  head: () => ({ meta: [{ title: "Mundo Constructor 3D — Lybanhi" }] }),
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

// Helper to determine zone based on grid index (6x6 subdivided into four 3x3 chunks)
const getCellZone = (r: number, c: number): number => {
  if (r < 3 && c < 3) return 1;
  if (r < 3 && c >= 3) return 2;
  if (r >= 3 && c < 3) return 3;
  return 4;
};

// Logic Questions count required to unlock locked zones
const ZONE_UNLOCK_REQUIREMENTS: Record<number, number> = {
  1: 0,
  2: 1, // requires 1 logical question
  3: 2, // requires 2 logical questions
  4: 3, // requires 3 logical questions
};

function MundoConstructorGame() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const rewardCoins = useServerFn(rewardGameCoins);
  const rewardXp = useServerFn(rewardGameXp);

  // Canvas elements refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    cellsGroup: THREE.Group;
    locksList: THREE.Group[];
    hoverOutline: THREE.LineSegments;
    activeOutline: THREE.LineSegments;
    animateId: number;
    shadowsEnabled: boolean;
    dirLight: THREE.DirectionalLight;
  } | null>(null);

  // Persistent inventories in LocalStorage
  const [blocks, setBlocks] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mc_inv_blocks");
      return saved ? parseInt(saved, 10) : 10;
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

  // Map Unlock quadrant state
  const [unlockedZones, setUnlockedZones] = useState<Record<number, boolean>>(() => {
    if (typeof window !== "undefined") {
      const z2 = localStorage.getItem("mc_zone_2") === "true";
      const z3 = localStorage.getItem("mc_zone_3") === "true";
      const z4 = localStorage.getItem("mc_zone_4") === "true";
      return { 1: true, 2: z2, 3: z3, 4: z4 };
    }
    return { 1: true, 2: false, 3: false, 4: false };
  });

  // UI Panels states
  const [activeCell, setActiveCell] = useState<{ r: number; c: number } | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number } | null>(null);
  const [showBuildMenu, setShowBuildMenu] = useState(false);
  const [academicSubject, setAcademicSubject] = useState<"matemáticas" | "ciencias" | "historia" | "inglés" | "lógica" | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<ConstructorQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [roundFeedback, setRoundFeedback] = useState<boolean | null>(null);

  // State for zone unlocking progress
  const [unlockTargetZone, setUnlockTargetZone] = useState<number | null>(null);
  const [unlockQuestionsSolved, setUnlockQuestionsSolved] = useState<number>(0);

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
      localStorage.setItem("mc_zone_2", unlockedZones[2].toString());
      localStorage.setItem("mc_zone_3", unlockedZones[3].toString());
      localStorage.setItem("mc_zone_4", unlockedZones[4].toString());
    }
  }, [blocks, techMaterials, cultureMaterials, efficiencyUpgrades, blueprints, grid, streak, unlockedZones]);

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
      desc: "Vivienda simple (Cubo + Cono).",
      cost: { blocks: 3, tech: 0, culture: 0, blueprints: 0 },
      reqStreak: 0
    },
    {
      id: "laboratorio",
      name: "Laboratorio de Ciencias",
      icon: "🧪",
      desc: "Estructura moderna (Cubo + Domo).",
      cost: { blocks: 2, tech: 2, culture: 0, blueprints: 0 },
      reqStreak: 0
    },
    {
      id: "biblioteca",
      name: "Biblioteca Histórica",
      icon: "📚",
      desc: "Templo del saber (Pórtico clásico).",
      cost: { blocks: 2, tech: 0, culture: 2, blueprints: 0 },
      reqStreak: 0
    },
    {
      id: "observatorio",
      name: "Observatorio Astrofísico",
      icon: "🔭",
      desc: "Cilindro con cúpula y telescopio.",
      cost: { blocks: 3, tech: 2, culture: 0, blueprints: 1 },
      reqStreak: 0
    },
    {
      id: "universidad",
      name: "Universidad del Saber",
      icon: "🏫",
      desc: "El centro educativo (Bloque + Torre).",
      cost: { blocks: 5, tech: 2, culture: 0, blueprints: 1 },
      reqStreak: 0
    },
    {
      id: "megamonumento",
      name: "Ciudad Escolar Monumental",
      icon: "🏰",
      desc: "Edificación de alto rango (3 Primitivas).",
      cost: { blocks: 10, tech: 4, culture: 4, blueprints: 2 },
      reqStreak: 5
    }
  ];

  // THREE.JS WEBGL SYSTEM RENDERER AND LOOP
  useEffect(() => {
    if (!canvasRef.current) return;

    const width = canvasRef.current.clientWidth;
    const height = canvasRef.current.clientHeight;

    // 1. Initial Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040908); // matches page theme
    scene.fog = new THREE.FogExp2(0x040908, 0.05);

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    
    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // mobile optimization

    // 4. Lights (Rule-Compliant:Sin sombras dinámicas por defecto)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 15, 10);
    scene.add(dirLight);

    // 5. Container groups
    const cellsGroup = new THREE.Group();
    scene.add(cellsGroup);

    const locksList: THREE.Group[] = [];

    // Edges Geometry Highlight meshes
    const hoverOutline = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1.48, 0.15, 1.48)),
      new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 2 }) // emerald-500
    );
    hoverOutline.visible = false;
    scene.add(hoverOutline);

    const activeOutline = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1.5, 0.25, 1.5)),
      new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 2 }) // amber-500
    );
    activeOutline.visible = false;
    scene.add(activeOutline);

    // 6. Camera orbital orbit parameters
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let yaw = 0.78; // 45 degrees
    let pitch = 0.6; // elevation
    let zoom = 14;
    const focus = new THREE.Vector3(0, 0, 0);

    const updateCameraPosition = () => {
      camera.position.x = focus.x + zoom * Math.sin(yaw) * Math.cos(pitch);
      camera.position.z = focus.z + zoom * Math.cos(yaw) * Math.cos(pitch);
      camera.position.y = focus.y + zoom * Math.sin(pitch);
      camera.lookAt(focus);
    };
    updateCameraPosition();

    // 7. Event listeners for Orbiting Camera manually
    let dragMoveThreshold = false;
    let downClientX = 0;
    let downClientY = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      dragMoveThreshold = false;
      downClientX = e.clientX;
      downClientY = e.clientY;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        if (Math.abs(e.clientX - downClientX) > 4 || Math.abs(e.clientY - downClientY) > 4) {
          dragMoveThreshold = true;
        }
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;
        yaw -= deltaX * 0.006;
        pitch = Math.max(0.15, Math.min(Math.PI / 2.2, pitch + deltaY * 0.006));
        previousMousePosition = { x: e.clientX, y: e.clientY };
        updateCameraPosition();
      } else {
        // Raycasting for hover highlight
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(normX, normY), camera);

        const bases: THREE.Object3D[] = [];
        cellsGroup.traverse(child => {
          if (child.userData && child.userData.isCellBase) {
            bases.push(child);
          }
        });

        const intersects = raycaster.intersectObjects(bases);
        if (intersects.length > 0) {
          const hitObj = intersects[0].object;
          setHoveredCell({ r: hitObj.userData.r, c: hitObj.userData.c });
        } else {
          setHoveredCell(null);
        }
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      isDragging = false;
      if (!dragMoveThreshold) {
        // Trigger select raycast click
        const rect = renderer.domElement.getBoundingClientRect();
        const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const normY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(normX, normY), camera);

        const bases: THREE.Object3D[] = [];
        cellsGroup.traverse(child => {
          if (child.userData && child.userData.isCellBase) {
            bases.push(child);
          }
        });

        const intersects = raycaster.intersectObjects(bases);
        if (intersects.length > 0) {
          const hitObj = intersects[0].object;
          const { r, c, zone, isUnlocked } = hitObj.userData;
          if (isUnlocked) {
            setActiveCell({ r, c });
            setShowBuildMenu(true);
          } else {
            handleAttemptUnlockZone(zone);
          }
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoom = Math.max(5, Math.min(30, zoom + e.deltaY * 0.01));
      updateCameraPosition();
    };

    // Keyboard translation (WASD)
    const onKeyDown = (e: KeyboardEvent) => {
      const step = 0.5;
      if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") {
        focus.z -= step;
      } else if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") {
        focus.z += step;
      } else if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") {
        focus.x -= step;
      } else if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") {
        focus.x += step;
      }
      focus.x = Math.max(-6, Math.min(6, focus.x));
      focus.z = Math.max(-6, Math.min(6, focus.z));
      updateCameraPosition();
    };

    canvasRef.current.addEventListener("pointerdown", onPointerDown);
    canvasRef.current.addEventListener("pointermove", onPointerMove);
    canvasRef.current.addEventListener("pointerup", onPointerUp);
    canvasRef.current.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);

    // Save refs
    threeRef.current = {
      scene,
      camera,
      renderer,
      cellsGroup,
      locksList,
      hoverOutline,
      activeOutline,
      animateId: 0,
      shadowsEnabled: false,
      dirLight
    };

    // 8. Animation loop
    const animate = () => {
      const id = requestAnimationFrame(animate);
      threeRef.current!.animateId = id;

      // Bobbing floating locks
      const time = Date.now();
      locksList.forEach(lock => {
        lock.rotation.y += 0.015;
        lock.position.y = 0.8 + Math.sin(time * 0.0035 + lock.userData.phase) * 0.08;
      });

      renderer.render(scene, camera);
    };
    animate();

    // 9. Resize Listener
    const handleResize = () => {
      if (!canvasRef.current || !threeRef.current) return;
      const w = canvasRef.current.clientWidth;
      const h = canvasRef.current.clientHeight;
      threeRef.current.camera.aspect = w / h;
      threeRef.current.camera.updateProjectionMatrix();
      threeRef.current.renderer.setSize(w, h, false);
    };
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", onKeyDown);
      if (canvasRef.current) {
        canvasRef.current.removeEventListener("pointerdown", onPointerDown);
        canvasRef.current.removeEventListener("pointermove", onPointerMove);
        canvasRef.current.removeEventListener("pointerup", onPointerUp);
        canvasRef.current.removeEventListener("wheel", onWheel);
      }
      if (threeRef.current) {
        cancelAnimationFrame(threeRef.current.animateId);
        threeRef.current.renderer.dispose();
      }
    };
  }, []);

  // UPDATE SCENE OBJECTS WHEN GRID / UNLOCKEDZONES STATE UPDATES
  useEffect(() => {
    if (!threeRef.current) return;

    const { scene, cellsGroup, locksList } = threeRef.current;

    // Clear old items
    while (cellsGroup.children.length > 0) {
      const obj = cellsGroup.children[0];
      cellsGroup.remove(obj);
    }
    locksList.length = 0;

    // Materials (Low poly simple colors, no textures)
    const matGrass = new THREE.MeshLambertMaterial({ color: 0x2e7d32 }); // green
    const matDirt = new THREE.MeshLambertMaterial({ color: 0x4e342e }); // dark brown
    const matLocked = new THREE.MeshLambertMaterial({ color: 0x1a237e }); // dark blue
    const matVelo = new THREE.MeshBasicMaterial({ color: 0xe65100, transparent: true, opacity: 0.22 }); // orange-red warning
    const matGold = new THREE.MeshLambertMaterial({ color: 0xffb300 });
    const matSilver = new THREE.MeshLambertMaterial({ color: 0xb0bec5 });
    const matRed = new THREE.MeshLambertMaterial({ color: 0xc62828 });
    const matBeige = new THREE.MeshLambertMaterial({ color: 0xe0cda9 });
    const matBlue = new THREE.MeshLambertMaterial({ color: 0x1565c0 });
    const matDarkGray = new THREE.MeshLambertMaterial({ color: 0x37474f });
    const matCyan = new THREE.MeshLambertMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.75 });
    const matWhite = new THREE.MeshLambertMaterial({ color: 0xf5f5f5 });

    // Geometries references (Frustum culling is enabled by default)
    const geomBase = new THREE.BoxGeometry(1.4, 0.15, 1.4);

    // Build the 6x6 grid cells
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const x = (c - 2.5) * 1.5;
        const z = (r - 2.5) * 1.5;
        const zone = getCellZone(r, c);
        const isUnlocked = unlockedZones[zone];

        // 1. Base floor cell
        const baseMesh = new THREE.Mesh(geomBase, isUnlocked ? matGrass : matLocked);
        baseMesh.position.set(x, -0.075, z);
        baseMesh.userData = { r, c, zone, isUnlocked, isCellBase: true };
        baseMesh.frustumCulled = true;
        cellsGroup.add(baseMesh);

        // 2. Add structural building if unlocked and exists
        const cellType = grid[r][c];
        if (isUnlocked && cellType !== "vacio") {
          const bGroup = new THREE.Group();
          bGroup.position.set(x, 0, z);

          if (cellType === "bloque") {
            // Voxel block: 1 cube primitive
            const m1 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.8, 1.0), matDirt);
            m1.position.y = 0.4;
            m1.frustumCulled = true;
            bGroup.add(m1);
          } else if (cellType === "casa") {
            // 2 Primitives: Cube + Pyramid Roof
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.8), matBeige);
            body.position.y = 0.3;
            body.frustumCulled = true;

            const roof = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.45, 4), matRed);
            roof.position.y = 0.825;
            roof.rotation.y = Math.PI / 4;
            roof.frustumCulled = true;

            bGroup.add(body, roof);
          } else if (cellType === "laboratorio") {
            // 2 Primitives: Tech Voxel + Spherical Dome
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.55, 0.85), matDarkGray);
            body.position.y = 0.275;
            body.frustumCulled = true;

            const dome = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), matCyan);
            dome.position.y = 0.55;
            dome.frustumCulled = true;

            bGroup.add(body, dome);
          } else if (cellType === "biblioteca") {
            // 3 Primitives: Base cube + Columns block + triangular pediment cone
            const base = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.1, 0.85), matWhite);
            base.position.y = 0.05;
            base.frustumCulled = true;

            const hall = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.45, 0.7), matBeige);
            hall.position.y = 0.325;
            hall.frustumCulled = true;

            const pediment = new THREE.Mesh(new THREE.ConeGeometry(0.65, 0.3, 4), matGold);
            pediment.position.y = 0.7;
            pediment.rotation.y = Math.PI / 4;
            pediment.frustumCulled = true;

            bGroup.add(base, hall, pediment);
          } else if (cellType === "observatorio") {
            // 3 Primitives: Base Cylinder + Sphere Dome + Telescope Cylinder
            const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.6, 8), matWhite);
            cyl.position.y = 0.3;
            cyl.frustumCulled = true;

            const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), matSilver);
            sphere.position.y = 0.6;
            sphere.frustumCulled = true;

            const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 6), matBlue);
            scope.position.set(0.15, 0.8, 0.15);
            scope.rotation.x = Math.PI / 4;
            scope.rotation.z = Math.PI / 4;
            scope.frustumCulled = true;

            bGroup.add(cyl, sphere, scope);
          } else if (cellType === "universidad") {
            // 3 Primitives: Large Hall block + Slim Tower + Pyramid roof
            const hall = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.65, 0.75), matWhite);
            hall.position.y = 0.325;
            hall.frustumCulled = true;

            const tower = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.2, 0.35), matBlue);
            tower.position.set(0.3, 0.6, 0);
            tower.frustumCulled = true;

            const roof = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.35, 4), matRed);
            roof.position.set(0.3, 1.375, 0);
            roof.rotation.y = Math.PI / 4;
            roof.frustumCulled = true;

            bGroup.add(hall, tower, roof);
          } else if (cellType === "megamonumento") {
            // 3 Primitives: Castle Fortress Base + Central Spire + Pinnacle Cone
            const castle = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.7, 1.15), matDarkGray);
            castle.position.y = 0.35;
            castle.frustumCulled = true;

            const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 1.2, 6), matGold);
            spire.position.y = 0.95;
            spire.frustumCulled = true;

            const pinnacle = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.45, 4), matRed);
            pinnacle.position.y = 1.775;
            pinnacle.rotation.y = Math.PI / 4;
            pinnacle.frustumCulled = true;

            bGroup.add(castle, spire, pinnacle);
          }

          cellsGroup.add(bGroup);
        }
      }
    }

    // Render transparent quadrants & floating locks for blocked zones
    const unlockCounts = {
      2: unlockedZones[2],
      3: unlockedZones[3],
      4: unlockedZones[4]
    };

    const addLockedIndicator = (zoneId: number, cx: number, cz: number, phase: number) => {
      // 1. Semi transparent red plane warning
      const velo = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.04, 4.4), matVelo);
      velo.position.set(cx, 0.02, cz);
      velo.frustumCulled = true;
      cellsGroup.add(velo);

      // 2. Bobbing floating lock group (Lock Body Cube + Shackle Loop)
      const lockGroup = new THREE.Group();
      lockGroup.position.set(cx, 0.8, cz);
      lockGroup.userData = { phase };

      const body = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.4, 0.25), matGold);
      body.frustumCulled = true;

      const loop = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.05, 4, 10, Math.PI), matSilver);
      loop.position.y = 0.2;
      loop.frustumCulled = true;

      lockGroup.add(body, loop);
      cellsGroup.add(lockGroup);
      locksList.push(lockGroup);
    };

    if (!unlockedZones[2]) addLockedIndicator(2, 2.25, -2.25, 0);
    if (!unlockedZones[3]) addLockedIndicator(3, -2.25, 2.25, Math.PI / 3);
    if (!unlockedZones[4]) addLockedIndicator(4, 2.25, 2.25, (Math.PI * 2) / 3);

  }, [grid, unlockedZones]);

  // UPDATE SELECTOR OUTLINES IN RENDER LOOP
  useEffect(() => {
    if (!threeRef.current) return;
    const { hoverOutline, activeOutline } = threeRef.current;

    if (hoveredCell) {
      hoverOutline.visible = true;
      hoverOutline.position.set((hoveredCell.c - 2.5) * 1.5, 0.08, (hoveredCell.r - 2.5) * 1.5);
    } else {
      hoverOutline.visible = false;
    }

    if (activeCell) {
      activeOutline.visible = true;
      activeOutline.position.set((activeCell.c - 2.5) * 1.5, 0.15, (activeCell.r - 2.5) * 1.5);
    } else {
      activeOutline.visible = false;
    }
  }, [hoveredCell, activeCell]);

  const handleCellClick = (r: number, c: number) => {
    setActiveCell({ r, c });
    setShowBuildMenu(true);
  };

  const handleAttemptUnlockZone = (zoneId: number) => {
    setUnlockTargetZone(zoneId);
    setUnlockQuestionsSolved(0);
  };

  const handleStartZoneUnlockChallenge = () => {
    if (unlockTargetZone === null) return;
    triggerQuestion("lógica");
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
      if (unlockTargetZone !== null) {
        // Solving zone unlock challenge!
        const required = ZONE_UNLOCK_REQUIREMENTS[unlockTargetZone];
        const nextCount = unlockQuestionsSolved + 1;
        setUnlockQuestionsSolved(nextCount);
        
        toast.success(`🧠 ¡Correcto! Progreso de desbloqueo: ${nextCount}/${required}`);

        if (nextCount >= required) {
          setUnlockedZones(prev => ({
            ...prev,
            [unlockTargetZone]: true
          }));
          toast.success(`🎉 ¡Zona ${unlockTargetZone} desbloqueada con éxito! Ahora puedes edificar en este cuadrante.`);
          setUnlockTargetZone(null);
        }
      } else {
        // Normal resource collection
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
      }

      setStreak(s => s + 1);
      coinsMutation.mutate(2);
      xpMutation.mutate(20);
    } else {
      setStreak(0);
      toast.error("❌ Respuesta incorrecta. La racha se ha reiniciado.");
    }
  };

  // Toggle debug shadows optionally (Rule: desactivadas por defecto)
  const toggleShadows = () => {
    if (!threeRef.current) return;
    const { renderer, dirLight } = threeRef.current;
    
    const nextState = !threeRef.current.shadowsEnabled;
    threeRef.current.shadowsEnabled = nextState;
    
    renderer.shadowMap.enabled = nextState;
    dirLight.castShadow = nextState;
    
    if (nextState) {
      toast.info("Sombras activadas (Solo recomendado para computadoras de escritorio).");
    } else {
      toast.info("Sombras desactivadas (Optimizado para móvil y estabilidad).");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#07110E] border-b border-[#143224] px-6 py-4 flex items-center justify-between text-white shadow-md">
        <button onClick={() => navigate({ to: "/games" })} className="text-emerald-400 hover:text-white font-bold flex items-center gap-1.5 cursor-pointer bg-transparent border-none">
          <ArrowLeft className="size-5" /> Regresar al Hub
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl animate-bounce">🔨</span>
          <h1 className="font-display text-lg font-black tracking-wide bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent">Mundo Constructor 3D</h1>
        </div>
        <div className="flex items-center gap-1.5 bg-[#143224]/30 border border-[#1E4A35] px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-300">
          <Sparkles className="size-3.5 text-emerald-400 animate-pulse" />
          <span>Racha: {streak} 🔥</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pt-6 pb-24 text-white min-h-[calc(100vh-68px)] bg-[#040908] grid grid-cols-1 lg:grid-cols-12 gap-8 relative overflow-hidden">
        {/* Decorative Grid Lights */}
        <div className="absolute top-10 left-10 size-80 rounded-full bg-emerald-600/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 size-80 rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />

        {/* LEFT COLUMN: GRID CANVAS (7 COLS) */}
        <div className="lg:col-span-7 bg-[#091512] border border-[#143224] rounded-3xl p-6 shadow-xl relative z-10 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-[#143224] pb-4">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-100">Cuadrícula del Mundo 3D</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Arrastra el mouse/dedo para orbitar. Haz clic sobre cualquier cuadrícula para edificar.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={toggleShadows}
                  className="text-[10px] font-bold bg-[#143224]/40 hover:bg-[#143224]/80 border border-[#1e4a35]/40 px-3 py-1.5 rounded-xl transition cursor-pointer text-slate-400"
                >
                  Modo Sombras
                </button>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
                  Grid 3D
                </span>
              </div>
            </div>

            {/* 3D Canvas Board */}
            <div className="mt-6 w-full aspect-square max-w-[500px] mx-auto bg-[#030605] rounded-2xl border border-[#143224] relative overflow-hidden shadow-inner">
              <canvas ref={canvasRef} className="w-full h-full block touch-none" />
              {/* Overlay controls */}
              <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center bg-slate-950/70 border border-emerald-500/10 px-3 py-1.5 rounded-xl text-[10px] text-slate-400 select-none pointer-events-none">
                <span>🖱️ Arrastrar para rotar · 📜 Scroll zoom</span>
                <span className="font-bold text-emerald-400">WebGL Activo</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#143224] flex justify-between items-center text-[10px] text-slate-400 font-bold">
            <span className="flex items-center gap-1.5"><span className="text-xs">🏠</span> Casas construidas: {grid.flat().filter(x => x === "casa").length}</span>
            <span className="flex items-center gap-1.5"><span className="text-xs">🏫</span> Campus Universitarios: {grid.flat().filter(x => x === "universidad").length}</span>
          </div>
        </div>

        {/* RIGHT COLUMN: RESOURCE & STUDY ACADEMY (5 COLS) */}
        <div className="lg:col-span-5 space-y-6 relative z-10 flex flex-col justify-between">
          
          {/* Inventory Box */}
          <div className="bg-[#091512] border border-[#143224] rounded-3xl p-6 shadow-lg">
            <h3 className="font-display font-bold text-sm text-slate-100 uppercase tracking-widest border-b border-[#143224] pb-3 flex items-center gap-1.5">
              <span className="text-sm">🖌️</span> Almacén de Recursos
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
                  <span className="text-lg">🔨</span> Menú de Edificación (Celda {activeCell.r}, {activeCell.c})
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

        {/* 2. ZONE UNLOCK REQUEST MODAL */}
        {unlockTargetZone !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-[#091512] border-2 border-amber-500/25 rounded-3xl p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 to-red-500" />
              <div className="flex justify-between items-center border-b border-[#143224] pb-3">
                <h3 className="font-display text-base font-bold text-slate-100 flex items-center gap-1.5">
                  <span>🔒 Desbloquear Sector {unlockTargetZone}</span>
                </h3>
                <button
                  onClick={() => setUnlockTargetZone(null)}
                  className="text-slate-400 hover:text-white font-bold bg-transparent border-none cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Este sector del campus se encuentra restringido. Para expandir tu civilización escolar hacia esta área, debes superar una serie de acertijos lógicos.
                </p>
                <div className="p-3 bg-[#11241E]/40 border border-emerald-500/10 rounded-xl flex justify-between items-center text-xs font-bold text-emerald-400">
                  <span>Preguntas requeridas:</span>
                  <span>{unlockQuestionsSolved} / {ZONE_UNLOCK_REQUIREMENTS[unlockTargetZone]}</span>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => setUnlockTargetZone(null)}
                    className="w-1/2 py-2 border border-[#143224] text-xs font-bold rounded-xl text-slate-400 hover:bg-slate-800 transition"
                  >
                    Volver al Mapa
                  </button>
                  <button
                    onClick={handleStartZoneUnlockChallenge}
                    className="w-1/2 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition active:scale-95 cursor-pointer"
                  >
                    Iniciar Desafío
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. ACADEMIC QUESTION OVERLAY */}
        {activeQuestion && academicSubject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-[#091512] border-2 border-emerald-500/25 rounded-3xl p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-indigo-500" />
              
              <div className="flex justify-between items-center border-b border-[#143224] pb-3 text-xs text-slate-400 font-bold">
                <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
                  {unlockTargetZone !== null ? `Desafío de Zona: Lógica` : `Academia: ${academicSubject}`}
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
                      onClick={() => {
                        setActiveQuestion(null);
                        // If it's a zone unlock challenge, do not clear target zone until fully completed
                        if (unlockTargetZone === null) {
                          setAcademicSubject(null);
                        }
                      }}
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
