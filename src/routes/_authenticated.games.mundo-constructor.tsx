import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { rewardGameCoins, rewardGameXp } from "@/lib/games.functions";
import { AppHeader } from "@/components/AppHeader";
import { ArrowLeft, Sparkles, Trophy, BookOpen, Compass, User, Wrench, Layers, Sun, Moon, Info, Plus, RotateCw, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { QUESTIONS_DB } from "@/lib/question-engine";

// Sub-systems imports
import { WorldGenerator, getTerrainHeight, getBiomeAt } from "@/components/mundo-constructor/WorldGenerator";
import { AvatarSelector } from "@/components/mundo-constructor/AvatarSelector";
import { CameraController } from "@/components/mundo-constructor/CameraController";
import { CharacterController } from "@/components/mundo-constructor/CharacterController";
import { createPrefabBuilding } from "@/components/mundo-constructor/PrefabBuildings";
import { Minimap } from "@/components/mundo-constructor/Minimap";
import { NPCSystem } from "@/components/mundo-constructor/NPCSystem";
import { ConstructionSystem, PlacedBlock } from "@/components/mundo-constructor/ConstructionSystem";
import { MissionSystem, Quest, Achievement, INITIAL_QUESTS } from "@/components/mundo-constructor/MissionSystem";

export const Route = createFileRoute("/_authenticated/games/mundo-constructor")({
  head: () => ({ meta: [{ title: "Mundo Constructor 3D — Lybanhi" }] }),
  component: MundoConstructorGame,
});

// PREFABS LIST
const PREFABS = [
  { id: "dormitorio", name: "Residencia Estudiantil", subject: "humanidades", subtopic: "Español", cost: { knowledge: 10, science: 0, culture: 5 }, questions: 2, icon: "🏢", desc: "Permite alojar más estudiantes en el campus." },
  { id: "aula", name: "Aula Primaria", subject: "matemáticas", subtopic: "Álgebra", cost: { knowledge: 15, science: 5, culture: 0 }, questions: 3, icon: "🧮", desc: "Genera Conocimiento pasivo constantemente." },
  { id: "laboratorio", name: "Laboratorio Químico", subject: "ciencias", subtopic: "Química", cost: { knowledge: 10, science: 25, culture: 0 }, questions: 4, icon: "🧪", desc: "Genera Ciencia para desbloqueos avanzados." },
  { id: "biblioteca", name: "Biblioteca Central", subject: "humanidades", subtopic: "Historia", cost: { knowledge: 20, science: 0, culture: 25 }, questions: 4, icon: "📚", desc: "Estructura académica de alta cultura." },
  { id: "computo", name: "Laboratorio de Programación", subject: "programación", subtopic: "JavaScript", cost: { knowledge: 30, science: 20, culture: 10 }, questions: 5, icon: "💻", desc: "Aporta puntos de Tecnología." },
  { id: "deportivo", name: "Gimnasio & Canchas", subject: "matemáticas", subtopic: "Geometría", cost: { knowledge: 25, science: 0, culture: 25 }, questions: 3, icon: "🏀", desc: "Canchas deportivas al aire libre." },
  { id: "auditorio", name: "Auditorio de Ciencias", subject: "ciencias", subtopic: "Física", cost: { knowledge: 50, science: 50, culture: 30 }, questions: 6, icon: "🏛️", desc: "Monumento educativo a gran escala." }
];

// PRE-MADE QUESTIONS BANK
const QUESTION_LIST = [
  { id: "mc_q1", subject: "matemáticas", prompt: "Resuelve para x: 3x - 7 = 14", options: ["x = 5", "x = 7", "x = 6", "x = 8"], correctIndex: 1, explanation: "3x = 21, dividiendo por 3 resulta x = 7." },
  { id: "mc_q2", subject: "ciencias", prompt: "¿Cuál es la velocidad de la luz en el vacío?", options: ["300,000 km/s", "150,000 km/s", "1,000,000 km/s", "30,000 km/s"], correctIndex: 0, explanation: "La luz viaja a aprox. 299,792 km/s en el vacío." },
  { id: "mc_q3", subject: "humanidades", prompt: "¿En qué año se firmó la Declaración de Independencia de EE.UU.?", options: ["1789", "1776", "1812", "1492"], correctIndex: 1, explanation: "La declaración se firmó el 4 de julio de 1776." },
  { id: "mc_q4", subject: "programación", prompt: "¿Qué representa la notación O(1)?", options: ["Tiempo lineal", "Tiempo cuadrático", "Tiempo constante", "Tiempo logarítmico"], correctIndex: 2, explanation: "O(1) denota complejidad temporal constante." }
];

// BUILD PRIMITIVE MODEL FOR AVATARS (<500 Polygons)
function buildAvatarMesh(playerGroup: THREE.Group, config: any) {
  // Clear existing child elements
  while (playerGroup.children.length > 0) {
    playerGroup.remove(playerGroup.children[0]);
  }

  const matSkin = new THREE.MeshLambertMaterial({ color: config.skinColor || "#ffcc99" });
  const matShirt = new THREE.MeshLambertMaterial({ color: config.clothesColor || "#1976d2" });
  const matPants = new THREE.MeshLambertMaterial({ color: config.pantsColor || "#37474f" });
  const matHair = new THREE.MeshLambertMaterial({ color: config.hairColor || "#000000" });
  const matAccessory = new THREE.MeshLambertMaterial({ color: 0x3e2723 });
  const matGlass = new THREE.MeshLambertMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.6 });

  if (config.type === "human") {
    // 1. Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), matSkin);
    head.position.y = 1.3;
    playerGroup.add(head);

    // 2. Hair types
    if (config.hairStyle === "corto") {
      const hair = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.15, 0.42), matHair);
      hair.position.set(0, 1.48, 0);
      playerGroup.add(hair);
    } else if (config.hairStyle === "largo") {
      const hairT = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.15, 0.42), matHair);
      hairT.position.set(0, 1.48, 0);
      const hairB = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.3, 0.15), matHair);
      hairB.position.set(0, 1.25, -0.18);
      playerGroup.add(hairT, hairB);
    } else if (config.hairStyle === "birrete") {
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.5), new THREE.MeshLambertMaterial({ color: 0x000000 }));
      cap.position.set(0, 1.52, 0);
      playerGroup.add(cap);
    } else if (config.hairStyle === "casco") {
      const helmet = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.15, 8), new THREE.MeshLambertMaterial({ color: 0xffd54f }));
      helmet.position.set(0, 1.52, 0);
      playerGroup.add(helmet);
    }

    // Glasses
    if (config.hasGlasses) {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.1), new THREE.MeshLambertMaterial({ color: 0x000000 }));
      frame.position.set(0, 1.3, 0.22);
      playerGroup.add(frame);
    }

    // Hat
    if (config.hasHat) {
      const hatBase = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 0.6), matAccessory);
      hatBase.position.set(0, 1.55, 0);
      const hatTop = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.25, 8), matAccessory);
      hatTop.position.set(0, 1.68, 0);
      playerGroup.add(hatBase, hatTop);
    }

    // 3. Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.35), matShirt);
    torso.position.y = 0.65;
    playerGroup.add(torso);

    // Backpack
    if (config.hasBackpack) {
      const pack = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.15), new THREE.MeshLambertMaterial({ color: 0xc62828 }));
      pack.position.set(0, 0.65, -0.25);
      playerGroup.add(pack);
    }

    // 4. Limbs (Swing reference by names)
    const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5, 0.18), matShirt);
    lArm.name = "leftArm";
    lArm.position.set(-0.4, 0.65, 0);
    playerGroup.add(lArm);

    const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5, 0.18), matShirt);
    rArm.name = "rightArm";
    rArm.position.set(0.4, 0.65, 0);
    playerGroup.add(rArm);

    const lLeg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.45, 0.22), matPants);
    lLeg.name = "leftLeg";
    lLeg.position.set(-0.16, 0.225, 0);
    playerGroup.add(lLeg);

    const rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.45, 0.22), matPants);
    rLeg.name = "rightLeg";
    rLeg.position.set(0.16, 0.225, 0);
    playerGroup.add(rLeg);
  } else {
    // Objects primitives
    if (config.gender === "libro") {
      const cover = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.18), new THREE.MeshLambertMaterial({ color: 0xc62828 }));
      cover.position.y = 0.55;
      playerGroup.add(cover);

      const pages = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.86, 0.16), new THREE.MeshLambertMaterial({ color: 0xffffff }));
      pages.position.set(0.04, 0.55, 0);
      playerGroup.add(pages);
    } 
    else if (config.gender === "lapiz") {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.0, 6), new THREE.MeshLambertMaterial({ color: 0xffeb3b }));
      body.position.y = 0.7;
      playerGroup.add(body);

      const eraser = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.18, 6), new THREE.MeshLambertMaterial({ color: 0xe91e63 }));
      eraser.position.y = 1.25;
      playerGroup.add(eraser);
    }
    else if (config.gender === "robot") {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.6, 0.45), matSteel);
      body.position.y = 0.6;
      playerGroup.add(body);

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.3, 0.3), matSteel);
      head.position.set(0, 1.05, 0);
      playerGroup.add(head);

      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.08), matGlass);
      eye.position.set(0, 1.05, 0.16);
      playerGroup.add(eye);
    }
    else if (config.gender === "computadora") {
      const screen = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.1), new THREE.MeshLambertMaterial({ color: 0x212121 }));
      screen.position.y = 0.6;
      playerGroup.add(screen);
    }
    else if (config.gender === "microscopio") {
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.08, 0.45), matSteel);
      base.position.y = 0.04;
      playerGroup.add(base);

      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 6), matSteel);
      arm.position.set(0.08, 0.4, 0);
      arm.rotation.z = -Math.PI / 6;
      playerGroup.add(arm);
    }
    else if (config.gender === "globo") {
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 10), new THREE.MeshLambertMaterial({ color: 0x00bcd4 }));
      ball.name = "globeBall";
      ball.position.y = 0.5;
      playerGroup.add(ball);
    }
  }
}

function MundoConstructorGame() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const rewardCoins = useServerFn(rewardGameCoins);
  const rewardXp = useServerFn(rewardGameXp);

  // COORDINATOR REFS
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Systems Instances Refs
  const worldGenRef = useRef<WorldGenerator | null>(null);
  const cameraCtrlRef = useRef<CameraController | null>(null);
  const charCtrlRef = useRef<CharacterController | null>(null);
  const npcSysRef = useRef<NPCSystem | null>(null);
  const constSysRef = useRef<ConstructionSystem | null>(null);
  const missionSysRef = useRef<MissionSystem | null>(null);

  const playerGroupRef = useRef<THREE.Group | null>(null);
  const renderLoopId = useRef<number>(0);

  // REACT STATES
  const [gameStarted, setGameStarted] = useState(false);
  const [avatarConfig, setAvatarConfig] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<"explorer" | "build" | "custom_blocks" | "quests" | "stats">("explorer");

  // Economy & Progression
  const [knowledge, setKnowledge] = useState(60);
  const [science, setScience] = useState(30);
  const [culture, setCulture] = useState(30);
  const [technology, setTechnology] = useState(20);
  const [history, setHistory] = useState(15);
  const [cityLevel, setCityLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [experience, setExperience] = useState(0);

  // World structures lists
  const [structures, setStructures] = useState<any[]>([]);
  const [customBlocks, setCustomBlocks] = useState<PlacedBlock[]>([]);
  const [questsList, setQuestsList] = useState<Quest[]>(INITIAL_QUESTS);

  // Selection configurations
  const [blockBuildMode, setBlockBuildMode] = useState<PlacedBlock["type"] | null>(null);
  const [activeRotation, setActiveRotation] = useState(0); // 0 to 3PI/2
  const [activeScale, setActiveScale] = useState(1);       // 1 to 3

  // Sub-HUD info
  const [activeBiome, setActiveBiome] = useState("CAMPUS");
  const [playerCoords, setPlayerCoords] = useState({ x: 0, z: 0 });
  const [interactionPrompt, setInteractionPrompt] = useState<string | null>(null);
  
  // Time and Weather
  const [timeOfDay, setTimeOfDay] = useState(120); // cycle 0 to 240
  const [weather, setWeather] = useState<"sunny" | "rainy">("sunny");

  // Interactive Question modal
  const [activeQuestion, setActiveQuestion] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [roundFeedback, setRoundFeedback] = useState<boolean | null>(null);
  const [targetQuizId, setTargetQuizId] = useState<string | null>(null);

  const coinsMutation = useMutation({
    mutationFn: (coins: number) => rewardCoins({ data: { coins } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard"] }),
  });

  const xpMutation = useMutation({
    mutationFn: (xp: number) => rewardXp({ data: { amount: xp } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard"] }),
  });

  // 1. RE-LOAD DATA FROM STORAGE
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedStructs = localStorage.getItem("mc_v3_structures");
      const savedBlocks = localStorage.getItem("mc_v3_blocks");
      const savedEconomy = localStorage.getItem("mc_v3_economy");
      
      if (savedStructs) setStructures(JSON.parse(savedStructs));
      if (savedBlocks) setCustomBlocks(JSON.parse(savedBlocks));
      if (savedEconomy) {
        const parsed = JSON.parse(savedEconomy);
        setKnowledge(parsed.knowledge ?? 60);
        setScience(parsed.science ?? 30);
        setCulture(parsed.culture ?? 30);
        setTechnology(parsed.technology ?? 20);
        setHistory(parsed.history ?? 15);
        setCityLevel(parsed.cityLevel ?? 1);
        setStreak(parsed.streak ?? 0);
        setExperience(parsed.experience ?? 0);
      }
    }
  }, []);

  // 2. AUTO-SAVE DATA TO STORAGE
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("mc_v3_structures", JSON.stringify(structures));
      localStorage.setItem("mc_v3_blocks", JSON.stringify(customBlocks));
      localStorage.setItem("mc_v3_economy", JSON.stringify({
        knowledge, science, culture, technology, history, cityLevel, streak, experience
      }));
    }
  }, [structures, customBlocks, knowledge, science, culture, technology, history, cityLevel, streak, experience]);

  // 3. START WORLD LIFECYCLE
  const handleStartGame = (config: any) => {
    setAvatarConfig(config);
    setGameStarted(true);
  };

  useEffect(() => {
    if (!gameStarted || !canvasRef.current) return;

    const width = canvasRef.current.clientWidth;
    const height = canvasRef.current.clientHeight;

    // A. Create Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.005);

    // B. Setup Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    const cameraController = new CameraController(camera, canvasRef.current);
    cameraCtrlRef.current = cameraController;

    // C. Setup Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff8e1, 1.0);
    dirLight.position.set(100, 300, 100);
    scene.add(dirLight);

    // D. Setup Player Group
    const playerGroup = new THREE.Group();
    scene.add(playerGroup);
    playerGroupRef.current = playerGroup;

    // Build optimized mesh (<500 Polygons)
    buildAvatarMesh(playerGroup, avatarConfig);

    // Place player at terrain center Y
    playerGroup.position.set(0, getTerrainHeight(0, 0), 0);

    // E. Initialize Systems
    const worldGen = new WorldGenerator(scene);
    worldGenRef.current = worldGen;

    const charController = new CharacterController(playerGroup);
    charCtrlRef.current = charController;

    const constSystem = new ConstructionSystem(scene, customBlocks);
    constSysRef.current = constSystem;

    const npcSystem = new NPCSystem(scene);
    npcSysRef.current = npcSystem;

    const missionSystem = new MissionSystem();
    missionSysRef.current = missionSystem;

    // Weather rain particle setup
    const rainCount = 400;
    const geomRain = new THREE.BufferGeometry();
    const rainPos = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount * 3; i += 3) {
      rainPos[i] = (Math.random() - 0.5) * 80;
      rainPos[i + 1] = Math.random() * 40;
      rainPos[i + 2] = (Math.random() - 0.5) * 80;
    }
    geomRain.setAttribute("position", new THREE.BufferAttribute(rainPos, 3));
    const matRain = new THREE.PointsMaterial({ color: 0x90caf9, size: 0.12, transparent: true, opacity: 0.6 });
    const rainPoints = new THREE.Points(geomRain, matRain);
    rainPoints.visible = false;
    scene.add(rainPoints);

    // F. Key bindings listener
    const handleKeys = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "v") {
        cameraController.toggleViewMode();
        // Hide mesh if first person
        playerGroup.visible = !cameraController.isFirstPerson;
      }
    };
    window.addEventListener("keydown", handleKeys);

    // G. RENDER AND ANIMATION LOOP
    let lastTime = Date.now();
    let clock = 0;

    const animate = () => {
      const id = requestAnimationFrame(animate);
      renderLoopId.current = id;

      const time = Date.now();
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      clock += dt;

      // Update Time of Day clock
      setTimeOfDay(t => {
        const next = t + 5 * dt;
        return next > 240 ? 0 : next;
      });

      // Update chunks around player (LOD & Occlusion)
      worldGen.update(playerGroup.position.x, playerGroup.position.z);

      // Update Character Movement & Snap to custom blocks
      charController.update(dt, cameraController.yaw, constSystem.placedBlocks, false);

      // Update Camera Tracking
      cameraController.update(playerGroup.position, playerGroup.rotation.y);

      // Update NPC routines
      npcSystem.update(dt, timeOfDay, structures);

      // Animate Globe rotation if active
      if (avatarConfig.gender === "globo") {
        const ball = playerGroup.getObjectByName("globeBall");
        if (ball) ball.rotation.y += 1.0 * dt;
      }

      // Rain particle animation
      if (rainPoints.visible) {
        const posArr = rainPoints.geometry.attributes.position.array as Float32Array;
        for (let i = 1; i < posArr.length; i += 3) {
          posArr[i] -= 22 * dt;
          if (posArr[i] < getTerrainHeight(posArr[i - 1] + playerGroup.position.x, posArr[i + 1] + playerGroup.position.z) - playerGroup.position.y) {
            posArr[i] = 30 + Math.random() * 10;
          }
        }
        rainPoints.geometry.attributes.position.needsUpdate = true;
      }

      // Render
      cameraController.camera.aspect = canvasRef.current!.clientWidth / canvasRef.current!.clientHeight;
      cameraController.camera.updateProjectionMatrix();
      cameraController.domElement.width = canvasRef.current!.clientWidth;
      cameraController.domElement.height = canvasRef.current!.clientHeight;
      cameraController.camera.updateProjectionMatrix();
      
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      renderer.setSize(canvasRef.current!.clientWidth, canvasRef.current!.clientHeight, false);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("keydown", handleKeys);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(renderLoopId.current);
      renderer.dispose();
      worldGen.disposeAll();
      constSystem.dispose();
      npcSystem.dispose();
    };
  }, [gameStarted]);

  // WEATHER CLIMATE SYNC
  useEffect(() => {
    if (!gameStarted || !worldGenRef.current) return;
    const scene = worldGenRef.current.scene;
    const rainPoints = scene.children.find(c => c instanceof THREE.Points);
    
    if (rainPoints) {
      rainPoints.visible = weather === "rainy";
      if (weather === "rainy") {
        scene.fog = new THREE.FogExp2(0x546e7a, 0.012);
        toast.info("🌧️ Comenzó a llover en el campus.");
      } else {
        scene.fog = new THREE.FogExp2(0x87ceeb, 0.005);
        toast.info("☀️ Clima despejado.");
      }
    }
  }, [weather]);

  // PROXIMITY CHECKER FOR NPC & CIMENTACIONES
  useEffect(() => {
    if (!gameStarted) return;

    const interval = setInterval(() => {
      if (!playerGroupRef.current) return;
      const player = playerGroupRef.current;

      // 1. Biome Check
      const bKey = getBiomeAt(player.position.x, player.position.z);
      setActiveBiome(bKey);
      setPlayerCoords({ x: Math.round(player.position.x), z: Math.round(player.position.z) });

      // 2. Struct check
      let closeS: any = null;
      let minDist = 15;
      structures.forEach(s => {
        const dx = s.x - player.position.x;
        const dz = s.z - player.position.z;
        const dist = Math.sqrt(dx*dx + dz*dz);
        if (dist < minDist) {
          minDist = dist;
          closeS = s;
        }
      });

      if (closeS) {
        if (closeS.status === "cimientos") {
          setInteractionPrompt(`Presiona 'Resolver' para completar los cimientos del ${closeS.name} (${closeS.questionsSolved}/${closeS.questionsRequired} Preguntas)`);
        } else {
          setInteractionPrompt(`Bienvenido al interior de ${closeS.name}.`);
        }
      } else {
        setInteractionPrompt(null);
      }
    }, 600);

    return () => clearInterval(interval);
  }, [gameStarted, structures]);

  // TRIGGER QUIZ FOR BUILDING CIMENTACIONES
  const handleTriggerInteraction = () => {
    if (!playerGroupRef.current) return;
    const player = playerGroupRef.current;

    let closeS: any = null;
    let minDist = 12;
    structures.forEach(s => {
      const dx = s.x - player.position.x;
      const dz = s.z - player.position.z;
      const dist = Math.sqrt(dx*dx + dz*dz);
      if (dist < minDist) {
        minDist = dist;
        closeS = s;
      }
    });

    if (closeS && closeS.status === "cimientos") {
      setTargetQuizId(closeS.id);
      // Retrieve subject questions
      const filter = QUESTION_LIST.filter(q => q.subject === closeS.subject);
      if (filter.length > 0) {
        setActiveQuestion(filter[Math.floor(Math.random() * filter.length)]);
        setSelectedOption(null);
        setRoundFeedback(null);
      } else {
        toast.error("No hay preguntas disponibles para esta academia.");
      }
    }
  };

  // PLACING PREFAB BUILDINGS
  const handlePlacePrefab = (prefab: typeof PREFABS[0]) => {
    if (knowledge < prefab.cost.knowledge || science < prefab.cost.science) {
      toast.error("❌ Recursos insuficientes en el Almacén.");
      return;
    }

    if (!playerGroupRef.current || !worldGenRef.current) return;
    const player = playerGroupRef.current;
    const scene = worldGenRef.current.scene;

    const rad = player.rotation.y;
    const px = player.position.x - Math.sin(rad) * 14;
    const pz = player.position.z - Math.cos(rad) * 14;
    const py = getTerrainHeight(px, pz);

    const newStruct = {
      id: "struct_" + Date.now(),
      type: prefab.id,
      name: prefab.name,
      x: px,
      y: py,
      z: pz,
      status: "cimientos",
      subject: prefab.subject,
      questionsSolved: 0,
      questionsRequired: prefab.questions
    };

    setKnowledge(k => k - prefab.cost.knowledge);
    setScience(s => s - prefab.cost.science);
    setStructures(prev => [...prev, newStruct]);

    // Render cimientos Group mesh
    const model = createPrefabBuilding(prefab.id);
    model.position.set(px, py, pz);
    scene.add(model);

    toast.success(`🏗️ Cimientos de ${prefab.name} colocados. Resuelve las preguntas para terminarlo.`);
  };

  // SUBMIT TRIVIA ANSWER
  const handleQuizAnswer = (optionIdx: number) => {
    if (!activeQuestion || selectedOption !== null) return;
    setSelectedOption(optionIdx);

    const isCorrect = activeQuestion.correctIndex === optionIdx;
    setRoundFeedback(isCorrect);

    if (isCorrect) {
      setStreak(s => s + 1);
      setExperience(e => e + 50);

      // Check level up
      if (experience + 50 >= cityLevel * 1000 && cityLevel < 5) {
        setCityLevel(l => l + 1);
        toast.success(`⭐️ ¡Tu Ciudad Académica subió al Nivel ${cityLevel + 1}!`);
      }

      // Check structure progress
      if (targetQuizId) {
        setStructures(prev => prev.map(s => {
          if (s.id === targetQuizId) {
            const solved = s.questionsSolved + 1;
            if (solved >= s.questionsRequired) {
              toast.success(`🎉 ¡${s.name} construido por completo!`);
              return { ...s, questionsSolved: solved, status: "completado" };
            }
            return { ...s, questionsSolved: solved };
          }
          return s;
        }));
      }

      // Reward points
      if (activeQuestion.subject === "matemáticas") setKnowledge(k => k + 10);
      if (activeQuestion.subject === "ciencias") setScience(s => s + 10);
      
      coinsMutation.mutate(4);
      xpMutation.mutate(40);
    } else {
      setStreak(0);
      toast.error("❌ Respuesta incorrecta. La racha se reinició.");
    }
  };

  // BLOCK PLACEMENT TRIGGERS (Rotate R, Scale T, Delete Q, Duplicate C)
  useEffect(() => {
    if (!gameStarted) return;

    const handleBlockKeys = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (!constSysRef.current || !playerGroupRef.current) return;
      const sys = constSysRef.current;
      const player = playerGroupRef.current;
      const yaw = cameraCtrlRef.current?.yaw || 0;

      if (k === "r") {
        setActiveRotation(r => {
          const next = r + Math.PI / 2;
          return next >= Math.PI * 2 ? 0 : next;
        });
        toast.info("🔄 Bloque rotado 90°");
      }
      else if (k === "t") {
        setActiveScale(s => s >= 3 ? 1 : s + 1);
        toast.info("📐 Escala de bloque modificada");
      }
      else if (k === "q") {
        const deleted = sys.deleteBlockAt(player.position, yaw);
        if (deleted) {
          setCustomBlocks([...sys.placedBlocks]);
          toast.info("🧹 Bloque eliminado.");
        }
      }
      else if (k === "c") {
        const dup = sys.duplicateBlockAt(player.position, yaw);
        if (dup) {
          setBlockBuildMode(dup.type);
          setActiveRotation(dup.rotation);
          setActiveScale(dup.scale);
          toast.success(`📋 Bloque duplicado: ${dup.type}`);
        }
      }
    };

    window.addEventListener("keydown", handleBlockKeys);
    return () => window.removeEventListener("keydown", handleBlockKeys);
  }, [gameStarted]);

  // LIVE HOLOGRAM UPDATE LOOP
  useEffect(() => {
    if (!gameStarted || !blockBuildMode) return;

    const interval = setInterval(() => {
      if (!constSysRef.current || !playerGroupRef.current) return;
      constSysRef.current.updatePreview(
        playerGroupRef.current.position,
        cameraCtrlRef.current?.yaw || 0,
        blockBuildMode,
        activeRotation,
        activeScale
      );
    }, 100);

    return () => {
      clearInterval(interval);
      constSysRef.current?.hidePreview();
    };
  }, [gameStarted, blockBuildMode, activeRotation, activeScale]);

  const handlePlaceBlock = () => {
    if (!blockBuildMode || !constSysRef.current || !playerGroupRef.current) return;
    if (knowledge < 2) {
      toast.error("Se necesitan 2 de Conocimiento para ubicar bloques.");
      return;
    }

    const b = constSysRef.current.placeBlock(
      playerGroupRef.current.position,
      cameraCtrlRef.current?.yaw || 0,
      blockBuildMode,
      activeRotation,
      activeScale
    );

    setCustomBlocks([...constSysRef.current.placedBlocks]);
    setKnowledge(k => k - 2);
    toast.success("🧱 Bloque colocado.");
  };

  // RENDER CUSTOMIZER MENU
  if (!gameStarted) {
    return <AvatarSelector onStartGame={handleStartGame} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-hidden select-none font-sans">
      {/* COORDINATOR APPMENU HEADER */}
      <header className="bg-[#050c0a] border-b border-[#143224] px-6 py-4 flex items-center justify-between z-30 shadow-md">
        <button onClick={() => navigate({ to: "/games" })} className="text-emerald-400 hover:text-white font-bold flex items-center gap-1.5 cursor-pointer bg-transparent border-none">
          <ArrowLeft className="size-5" /> Regresar al Hub
        </button>
        
        {/* City Rank status */}
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏛️</span>
          <div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Nivel del Campus</div>
            <div className="text-sm font-black text-emerald-400 uppercase tracking-widest">Lv.{cityLevel} · {activeBiome}</div>
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

      {/* RENDER CANVAS CONTAINER */}
      <main className="flex-1 grid grid-cols-12 relative overflow-hidden">
        {/* LEFT COLUMN: VISUAL ENGINE SCREEN (9 COLS) */}
        <div className="col-span-12 lg:col-span-9 relative bg-[#020504] overflow-hidden flex flex-col">
          <canvas ref={canvasRef} className="w-full h-full block touch-none" />

          {/* CLIMATE CONTROLLERS HUD */}
          <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none z-10 font-bold">
            {/* Coordinates overlay */}
            <div className="bg-slate-950/80 border border-emerald-500/20 backdrop-blur px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 text-slate-200">
              <Compass className="size-4 text-emerald-400" />
              <span>Coords: ({playerCoords.x}, {playerCoords.z})</span>
            </div>

            <div className="flex gap-2 pointer-events-auto">
              <button
                onClick={() => setWeather(w => w === "sunny" ? "rainy" : "sunny")}
                className="bg-slate-950/80 hover:bg-slate-900 border border-[#143224] p-2 rounded-xl text-xs cursor-pointer flex items-center gap-1"
              >
                {weather === "sunny" ? <Sun className="size-4 text-yellow-400" /> : <Moon className="size-4 text-blue-400" />}
                <span className="hidden sm:inline">Clima</span>
              </button>
            </div>
          </div>

          {/* INTERACTION PROMPTS OVERLAY */}
          {interactionPrompt && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 px-6 py-3 rounded-full text-xs font-black tracking-widest shadow-2xl z-20 animate-bounce flex items-center gap-2 border border-slate-950">
              <Info className="size-4" />
              <span>{interactionPrompt}</span>
              <button
                onClick={handleTriggerInteraction}
                className="bg-slate-950 text-white px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-wider cursor-pointer ml-3 border-none hover:bg-slate-900"
              >
                [ Resolver ]
              </button>
            </div>
          )}

          {/* BOTTOM CONTROLS MENU */}
          <div className="absolute bottom-6 left-4 right-4 bg-slate-950/90 border border-slate-800 backdrop-blur p-3.5 rounded-2xl flex items-center justify-between z-10 text-xs font-bold shadow-2xl">
            <div className="flex gap-2">
              <button
                onClick={() => { setActiveTab("explorer"); setBlockBuildMode(null); }}
                className={`px-4 py-2 rounded-xl transition cursor-pointer ${activeTab === "explorer" && !blockBuildMode ? "bg-emerald-500 text-slate-950" : "bg-slate-900 hover:bg-slate-800"}`}
              >
                Explorar (V)
              </button>
              <button
                onClick={() => { setActiveTab("build"); setBlockBuildMode(null); }}
                className={`px-4 py-2 rounded-xl transition cursor-pointer ${activeTab === "build" ? "bg-emerald-500 text-slate-950" : "bg-slate-900 hover:bg-slate-800"}`}
              >
                Edificios
              </button>
              <button
                onClick={() => { setActiveTab("custom_blocks"); setBlockBuildMode("brick"); }}
                className={`px-4 py-2 rounded-xl transition cursor-pointer ${activeTab === "custom_blocks" ? "bg-emerald-500 text-slate-950" : "bg-slate-900 hover:bg-slate-800"}`}
              >
                Construcción
              </button>
            </div>
            
            <div className="text-[10px] text-slate-400 select-none hidden md:block">
              ⌨️ R: Rotar bloque · T: Escalar bloque · Q: Eliminar bloque · C: Duplicar bloque
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: RESOURCE HUDS & TAB SYSTEMS (3 COLS) */}
        <div className="col-span-12 lg:col-span-3 border-l border-slate-900 bg-[#060c0a] flex flex-col justify-between overflow-y-auto max-h-[calc(100vh-68px)]">
          {/* Minimap card */}
          <div className="p-4 border-b border-slate-900 flex justify-center">
            <Minimap
              playerX={playerCoords.x}
              playerZ={playerCoords.z}
              cameraYaw={cameraCtrlRef.current?.yaw || 0}
              activeBiome={activeBiome}
            />
          </div>

          {/* Resources inventory */}
          <div className="px-6 py-2">
            <h3 className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2">Recursos Almacén</h3>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <div className="bg-slate-950 p-2 border border-[#143224] rounded-xl flex justify-between">
                <span>📚 Con.</span>
                <span className="text-emerald-400">{Math.floor(knowledge)}</span>
              </div>
              <div className="bg-slate-950 p-2 border border-[#143224] rounded-xl flex justify-between">
                <span>🧪 Cie.</span>
                <span className="text-indigo-400">{Math.floor(science)}</span>
              </div>
              <div className="bg-slate-950 p-2 border border-[#143224] rounded-xl flex justify-between">
                <span>🎨 Cult.</span>
                <span className="text-purple-400">{Math.floor(culture)}</span>
              </div>
              <div className="bg-slate-950 p-2 border border-[#143224] rounded-xl flex justify-between">
                <span>💻 Tec.</span>
                <span className="text-yellow-400">{Math.floor(technology)}</span>
              </div>
            </div>
          </div>

          {/* Tabs render content */}
          <div className="flex-1 p-6">
            {activeTab === "explorer" && (
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-400">Campus Universitario</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Carga dinámica de chunks activa. Acércate a los cimientos amarillos para responder trivias y completar facultades.
                </p>

                <div className="pt-2 space-y-2">
                  <h5 className="text-[10px] font-black uppercase text-slate-500">Misiones Activas</h5>
                  {questsList.slice(0, 3).map(q => (
                    <div key={q.id} className="bg-slate-950 border border-slate-900 p-2 rounded-xl text-[10px] space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className={q.completed ? "text-emerald-400 line-through" : ""}>{q.title}</span>
                        <span>{q.progress}/{q.target}</span>
                      </div>
                      <p className="text-slate-400">{q.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "build" && (
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-400">Planos de Edificios</h4>
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {PREFABS.map(p => (
                    <div key={p.id} className="bg-slate-950 border border-[#143224] p-3 rounded-xl space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span>{p.icon} {p.name}</span>
                        <button
                          onClick={() => handlePlacePrefab(p)}
                          className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[9px] uppercase rounded border-none cursor-pointer"
                        >
                          Ubicar
                        </button>
                      </div>
                      <div className="flex gap-2 text-[9px] font-black uppercase text-slate-500">
                        <span>📚 {p.cost.knowledge} Con.</span>
                        <span>🧪 {p.cost.science} Cie.</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "custom_blocks" && (
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-400">Bloques de Construcción</h4>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Consume 2 de Conocimiento por bloque colocado.
                </p>

                <div className="grid grid-cols-2 gap-2">
                  {(["brick", "wood", "glass", "roof", "concrete", "steel", "marble", "asphalt", "solar"] as const).map(bt => (
                    <button
                      key={bt}
                      onClick={() => setBlockBuildMode(bt)}
                      className={`p-2 border rounded-xl font-black capitalize text-[10px] transition cursor-pointer flex flex-col items-center gap-1 ${blockBuildMode === bt ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" : "border-slate-800 bg-slate-950 hover:bg-slate-900"}`}
                    >
                      {bt}
                    </button>
                  ))}
                </div>

                {blockBuildMode && (
                  <button
                    onClick={handlePlaceBlock}
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl border-none cursor-pointer"
                  >
                    Colocar Bloque (Click)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* TRIVIA POPUP */}
      {activeQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#091512] border-2 border-emerald-500/25 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-white">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-indigo-500" />
            
            <div className="flex justify-between items-center border-b border-[#143224] pb-3 text-xs text-slate-400 font-bold">
              <span>Desafío: Cimientos Académicos</span>
              <span className="text-emerald-400">Racha: {streak} 🔥</span>
            </div>

            <div className="mt-5 space-y-4">
              <p className="text-sm font-bold text-slate-200 leading-relaxed">{activeQuestion.prompt}</p>

              {roundFeedback !== null && (
                <div className="p-4 rounded-xl text-xs bg-[#040908] border border-[#143224] space-y-1">
                  <div className="font-bold text-emerald-400">Explicación:</div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">{activeQuestion.explanation}</p>
                </div>
              )}

              <div className="grid gap-2 text-left pt-2">
                {activeQuestion.options.map((option: string, idx: number) => {
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
                      onClick={() => handleQuizAnswer(idx)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition cursor-pointer text-left ${btnStyle}`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              {selectedOption !== null && (
                <div className="pt-3 border-t border-[#143224] flex justify-end">
                  <button
                    onClick={() => {
                      setActiveQuestion(null);
                      setTargetQuizId(null);
                    }}
                    className="h-9 px-6 bg-emerald-500 hover:bg-emerald-400 text-[#040908] font-bold text-xs rounded-lg border-none cursor-pointer"
                  >
                    Continuar
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
export default MundoConstructorGame;
