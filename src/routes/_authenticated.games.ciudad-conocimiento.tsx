import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";
import { rewardGameCoins, rewardGameXp } from "@/lib/games.functions";
import { AppHeader } from "@/components/AppHeader";
import { ArrowLeft, Sparkles, Trophy, BookOpen, Compass, Shield, User, Wrench, Layers, Sun, Moon, Info, Play, Pause, FastForward, Check } from "lucide-react";
import { toast } from "sonner";
import streakCap from "@/assets/streak-cap.png";

export const Route = createFileRoute("/_authenticated/games/ciudad-conocimiento")({
  head: () => ({ meta: [{ title: "Ciudad del Conocimiento — Lybanhi" }] }),
  component: CiudadConocimientoGame,
});

// INTERFACES & STRUCTS
interface Building {
  id: string;
  type: "school" | "university" | "hospital" | "lab" | "library" | "research" | "museum";
  x: number;
  y: number;
  assignedTeacherIds: string[];
}

interface Teacher {
  id: string;
  name: string;
  specialty: "Ciencias" | "Artes" | "Tecnología" | "Salud" | "Humanidades" | "Negocios";
  level: number;
  salary: number;
  experience: number;
  assignedBuildingId: string | null;
}

interface Degree {
  id: string;
  name: string;
  area: "Ciencias" | "Artes" | "Tecnología" | "Salud" | "Humanidades" | "Negocios";
  teacherId: string | null;
  tuition: number;
  students: number;
  duration: number; // semesters
}

interface ResearchProject {
  id: string;
  name: string;
  desc: string;
  cost: number;
  durationSeconds: number;
  progress: number; // 0 to 100
  started: boolean;
  completed: boolean;
  unlocksType: string;
}

interface GameEvent {
  id: string;
  title: string;
  desc: string;
  options: {
    text: string;
    consequences: { economy: number; happiness: number; science: number; culture: number; desc: string };
  }[];
}

const LANGUAGES = {
  es: {
    back: "Regresar al Hub",
    title: "Ciudad del Conocimiento",
    subtitle: "Construye y administra tu propia urbe académica.",
    economy: "Economía",
    science: "Ciencia",
    culture: "Cultura",
    happiness: "Felicidad",
    level: "Nivel de Ciudad",
    population: "Población",
    month: "Mes",
    teachers: "Profesores",
    degrees: "Carreras",
    research: "Investigación",
    buildMenu: "Construcción",
    hire: "Contratar",
    assign: "Asignar",
    createDegree: "Nueva Carrera",
    tuition: "Matrícula",
    noTeacher: "Sin profesor asignado",
    reputation: "Reputación",
    startProject: "Iniciar Proyecto",
    monthlyReport: "Informe Mensual",
    completed: "Completado",
    locked: "Bloqueado",
    insufficientFunds: "Presupuesto insuficiente.",
  },
  en: {
    back: "Back to Hub",
    title: "Knowledge City",
    subtitle: "Build and manage your own academic metropolis.",
    economy: "Economy",
    science: "Science",
    culture: "Culture",
    happiness: "Happiness",
    level: "City Level",
    population: "Population",
    month: "Month",
    teachers: "Teachers",
    degrees: "Degrees",
    research: "Research",
    buildMenu: "Build",
    hire: "Hire",
    assign: "Assign",
    createDegree: "New Degree",
    tuition: "Tuition",
    noTeacher: "No teacher assigned",
    reputation: "Reputation",
    startProject: "Start Project",
    monthlyReport: "Monthly Report",
    completed: "Completed",
    locked: "Locked",
    insufficientFunds: "Insufficient funds.",
  },
  pt: {
    back: "Voltar ao Hub",
    title: "Cidade do Conhecimento",
    subtitle: "Construa e gerencie sua própria metrópole acadêmica.",
    economy: "Economia",
    science: "Ciência",
    culture: "Cultura",
    happiness: "Felicidade",
    level: "Nível da Cidade",
    population: "População",
    month: "Mês",
    teachers: "Professores",
    degrees: "Cursos",
    research: "Pesquisa",
    buildMenu: "Construção",
    hire: "Contratar",
    assign: "Atribuir",
    createDegree: "Novo Curso",
    tuition: "Mensalidade",
    noTeacher: "Sem professor atribuído",
    reputation: "Reputação",
    startProject: "Iniciar Projeto",
    monthlyReport: "Relatório Mensal",
    completed: "Concluído",
    locked: "Bloqueado",
    insufficientFunds: "Orçamento insuficiente.",
  }
};

const BUILDING_METADATA = {
  school: { name: "Escuela Primaria", cost: 1200, maintenance: 80, radius: 2, icon: "🏫", desc: "Aumenta la felicidad y la educación básica." },
  university: { name: "Universidad Central", cost: 3500, maintenance: 250, radius: 4, icon: "🎓", desc: "Permite impartir carreras y generar ingresos masivos." },
  hospital: { name: "Hospital Académico", cost: 2800, maintenance: 200, radius: 3, icon: "🏥", desc: "Mantiene la felicidad alta ante epidemias." },
  lab: { name: "Laboratorio de Química", cost: 1800, maintenance: 120, radius: 2, icon: "🧪", desc: "Genera Ciencia y desbloquea proyectos de investigación." },
  library: { name: "Biblioteca Pública", cost: 1000, maintenance: 50, radius: 3, icon: "📚", desc: "Aporta Cultura y Happiness." },
  research: { name: "Centro de Investigación", cost: 4500, maintenance: 300, radius: 4, icon: "📡", desc: "Generación avanzada de Ciencia y patentes tecnológicas." },
  museum: { name: "Museo de Historia", cost: 2200, maintenance: 100, radius: 3, icon: "🏛️", desc: "Aumenta la Cultura de toda la urbe." }
};

const INITIAL_TEACHERS: Teacher[] = [
  { id: "prof_1", name: "Dra. Elena Rostova", specialty: "Ciencias", level: 1, salary: 200, experience: 0, assignedBuildingId: null },
  { id: "prof_2", name: "Prof. Marcos Aurelio", specialty: "Humanidades", level: 1, salary: 180, experience: 0, assignedBuildingId: null },
  { id: "prof_3", name: "Ing. Sarah Connor", specialty: "Tecnología", level: 2, salary: 300, experience: 0, assignedBuildingId: null }
];

const TEACHERS_MARKET: Omit<Teacher, "assignedBuildingId">[] = [
  { id: "market_1", name: "Prof. Alberto Einstein", specialty: "Ciencias", level: 3, salary: 450, experience: 0 },
  { id: "market_2", name: "Dra. Marie Curie", specialty: "Salud", level: 4, salary: 600, experience: 0 },
  { id: "market_3", name: "Lic. Ada Lovelace", specialty: "Tecnología", level: 2, salary: 320, experience: 0 },
  { id: "market_4", name: "Dr. Sigmund Freud", specialty: "Humanidades", level: 2, salary: 280, experience: 0 },
  { id: "market_5", name: "Mtro. Warren Buffett", specialty: "Negocios", level: 3, salary: 500, experience: 0 }
];

const EVENTS_POOL: GameEvent[] = [
  {
    id: "evt_1",
    title: "🏥 Brote de Influenza Escolar",
    desc: "Un fuerte brote vírico afecta a los estudiantes de la primaria. Las escuelas operan al mínimo de capacidad.",
    options: [
      {
        text: "Financiar vacunas para todos ($1,500)",
        consequences: { economy: -1500, happiness: 15, science: 5, culture: 0, desc: "Invertiste en salud pública. La felicidad y la ciencia médica suben." }
      },
      {
        text: "Dejar que se recupere sola (-25 Felicidad)",
        consequences: { economy: 0, happiness: -25, science: 0, culture: 0, desc: "La negligencia causó malestar masivo en la población estudiantil." }
      }
    ]
  },
  {
    id: "evt_2",
    title: "📚 Descubrimiento en Biblioteca",
    desc: "Los historiadores hallaron manuscritos inéditos de la época precolombina bajo los archivos centrales.",
    options: [
      {
        text: "Exhibir en el Museo ($500)",
        consequences: { economy: -500, happiness: 10, science: 0, culture: 25, desc: "La riqueza cultural del museo sube notablemente." }
      },
      {
        text: "Vender la patente a coleccionistas (+$1,200)",
        consequences: { economy: 1200, happiness: -5, science: 0, culture: -15, desc: "Ganaste presupuesto pero dañaste el patrimonio cultural." }
      }
    ]
  },
  {
    id: "evt_3",
    title: "🎓 Huelga de Profesores Universitarios",
    desc: "El profesorado exige un bono por alto rendimiento debido a las largas jornadas de clases.",
    options: [
      {
        text: "Aprobación del bono ($1,000)",
        consequences: { economy: -1000, happiness: 15, science: 0, culture: 0, desc: "El profesorado retoma actividades felices. Sube la reputación." }
      },
      {
        text: "Rechazar la demanda (-20 Felicidad)",
        consequences: { economy: 0, happiness: -20, science: -10, culture: 0, desc: "La eficiencia del campus cae por la huelga en las aulas." }
      }
    ]
  }
];

function CiudadConocimientoGame() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const rewardCoins = useServerFn(rewardGameCoins);
  const rewardXp = useServerFn(rewardGameXp);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // LOCALE & TIME STATES
  const [lang, setLang] = useState<"es" | "en" | "pt">("es");
  const [timeSpeed, setTimeSpeed] = useState<"pause" | "normal" | "fast">("normal");
  const [month, setMonth] = useState(1);

  // HUD RESOURCE METRICS
  const [budget, setBudget] = useState(25000);
  const [sciencePoints, setSciencePoints] = useState(15);
  const [culturePoints, setCulturePoints] = useState(15);
  const [happiness, setHappiness] = useState(80);
  const [population, setPopulation] = useState(150);
  const [cityLevel, setCityLevel] = useState(1);
  const [globalXp, setGlobalXp] = useState(0);

  // BUILDINGS & STAFF MANAGEMENT
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuildType, setSelectedBuildType] = useState<keyof typeof BUILDING_METADATA | null>(null);
  const [selectedMapBuilding, setSelectedMapBuilding] = useState<Building | null>(null);

  const [myTeachers, setMyTeachers] = useState<Teacher[]>(INITIAL_TEACHERS);
  const [marketTeachers, setMarketTeachers] = useState<Omit<Teacher, "assignedBuildingId">[]>(TEACHERS_MARKET);

  // UNIVERSITY DEGREES MANAGER
  const [degrees, setDegrees] = useState<Degree[]>([]);
  const [showCreateDegreeModal, setShowCreateDegreeModal] = useState(false);
  const [newDegreeName, setNewDegreeName] = useState("");
  const [newDegreeArea, setNewDegreeArea] = useState<Degree["area"]>("Ciencias");
  const [newDegreeTuition, setNewDegreeTuition] = useState(500);

  // RESEARCH TREE PROJECTS
  const [researchProjects, setResearchProjects] = useState<ResearchProject[]>([
    { id: "res_1", name: "Proyecto Genoma Humano", desc: "Desbloquea el Hospital Académico para el cuidado público.", cost: 3000, durationSeconds: 15, progress: 0, started: false, completed: false, unlocksType: "hospital" },
    { id: "res_2", name: "Restauración Clásica", desc: "Desbloquea el Museo de Historia de la ciudad.", cost: 2000, durationSeconds: 20, progress: 0, started: false, completed: false, unlocksType: "museum" },
    { id: "res_3", name: "Red de Centros Científicos", desc: "Desbloquea los Centros de Investigación de Ciencia.", cost: 4500, durationSeconds: 25, progress: 0, started: false, completed: false, unlocksType: "research" }
  ]);

  // ACTIVE CRISIS EVENTS
  const [activeEvent, setActiveEvent] = useState<GameEvent | null>(null);
  const [eventFeedback, setEventFeedback] = useState<string | null>(null);

  // UI tabs
  const [uiTab, setUiTab] = useState<"build" | "teachers" | "degrees" | "research">("build");

  // Coins rewards mutation
  const coinsMutation = useMutation({
    mutationFn: (coins: number) => rewardCoins({ data: { coins } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard"] }),
  });

  const xpMutation = useMutation({
    mutationFn: (xp: number) => rewardXp({ data: { amount: xp } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard"] }),
  });

  const tText = LANGUAGES[lang];

  // 1. PERSISTENCE LOAD
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mc_tycoon_save");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setMonth(parsed.month || 1);
          setBudget(parsed.budget ?? 25000);
          setSciencePoints(parsed.sciencePoints ?? 15);
          setCulturePoints(parsed.culturePoints ?? 15);
          setHappiness(parsed.happiness ?? 80);
          setPopulation(parsed.population ?? 150);
          setCityLevel(parsed.cityLevel ?? 1);
          setBuildings(parsed.buildings || []);
          setMyTeachers(parsed.myTeachers || INITIAL_TEACHERS);
          setMarketTeachers(parsed.marketTeachers || TEACHERS_MARKET);
          setDegrees(parsed.degrees || []);
          setResearchProjects(parsed.researchProjects || []);
        } catch (e) {}
      }
    }
  }, []);

  // 2. AUTO-SAVE HOOK
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("mc_tycoon_save", JSON.stringify({
        month, budget, sciencePoints, culturePoints, happiness, population, cityLevel,
        buildings, myTeachers, marketTeachers, degrees, researchProjects
      }));
    }
  }, [month, budget, sciencePoints, culturePoints, happiness, population, cityLevel, buildings, myTeachers, marketTeachers, degrees, researchProjects]);

  // 3. ISOMETRIC HTML5 CANVAS RENDERING
  const gridCount = 10;
  const tileWidth = 60;
  const tileHeight = 30;

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    const offsetX = canvas.width / 2;
    const offsetY = 60;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render 2.5D grid back to front
      for (let x = 0; x < gridCount; x++) {
        for (let y = 0; y < gridCount; y++) {
          const isoX = (x - y) * (tileWidth / 2) + offsetX;
          const isoY = (x + y) * (tileHeight / 2) + offsetY;

          // Draw tile grass base
          ctx.beginPath();
          ctx.moveTo(isoX, isoY);
          ctx.lineTo(isoX + tileWidth / 2, isoY + tileHeight / 2);
          ctx.lineTo(isoX, isoY + tileHeight);
          ctx.lineTo(isoX - tileWidth / 2, isoY + tileHeight / 2);
          ctx.closePath();

          ctx.fillStyle = (x + y) % 2 === 0 ? "#4caf50" : "#43a047"; // grass grid color
          ctx.fill();

          ctx.strokeStyle = "#388e3c";
          ctx.lineWidth = 1;
          ctx.stroke();

          // Check if building exists on coordinate
          const b = buildings.find(b => b.x === x && b.y === y);
          if (b) {
            // Draw vector building model block
            ctx.fillStyle = "#cfd8dc"; // Walls
            ctx.beginPath();
            ctx.moveTo(isoX, isoY + tileHeight / 2);
            ctx.lineTo(isoX, isoY - 20); // Height offset
            ctx.lineTo(isoX + tileWidth / 2, isoY + tileHeight / 2 - 20);
            ctx.lineTo(isoX + tileWidth / 2, isoY + tileHeight / 2);
            ctx.closePath();
            ctx.fill();

            // Left wall
            ctx.fillStyle = "#b0bec5";
            ctx.beginPath();
            ctx.moveTo(isoX, isoY + tileHeight / 2);
            ctx.lineTo(isoX, isoY - 20);
            ctx.lineTo(isoX - tileWidth / 2, isoY + tileHeight / 2 - 20);
            ctx.lineTo(isoX - tileWidth / 2, isoY + tileHeight / 2);
            ctx.closePath();
            ctx.fill();

            // Roof
            ctx.fillStyle = b.type === "school" ? "#c62828" : b.type === "university" ? "#1565c0" : "#455a64";
            ctx.beginPath();
            ctx.moveTo(isoX, isoY - 20);
            ctx.lineTo(isoX + tileWidth / 2, isoY + tileHeight / 2 - 20);
            ctx.lineTo(isoX, isoY + tileHeight - 20);
            ctx.lineTo(isoX - tileWidth / 2, isoY + tileHeight / 2 - 20);
            ctx.closePath();
            ctx.fill();

            // Flat icon display
            ctx.fillStyle = "#ffffff";
            ctx.font = "16px sans-serif";
            ctx.fillText(BUILDING_METADATA[b.type].icon, isoX - 8, isoY + 10);
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    // Click coordinates detection
    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left - offsetX;
      const clickY = e.clientY - rect.top - offsetY;

      // Isometric inverse transform
      const mapX = Math.round((clickY / (tileHeight / 2) + clickX / (tileWidth / 2)) / 2);
      const mapY = Math.round((clickY / (tileHeight / 2) - clickX / (tileWidth / 2)) / 2);

      if (mapX >= 0 && mapX < gridCount && mapY >= 0 && mapY < gridCount) {
        // Place building logic
        if (selectedBuildType) {
          handleBuildBuilding(mapX, mapY);
        } else {
          // Select building
          const found = buildings.find(b => b.x === mapX && b.y === mapY);
          setSelectedMapBuilding(found || null);
        }
      }
    };

    canvas.addEventListener("click", handleCanvasClick);
    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener("click", handleCanvasClick);
    };
  }, [buildings, selectedBuildType]);

  // 4. MONTH GAME TICK LOOP (TUITION INCOMES, SALARY OUTFLOW, MAINTENANCE)
  useEffect(() => {
    if (timeSpeed === "pause") return;

    const intervalSec = timeSpeed === "fast" ? 1500 : 4000;
    const interval = setInterval(() => {
      setMonth(m => m + 1);

      // Calculations
      let maintenanceSum = 0;
      let salariesSum = 0;
      let scienceGen = 0;
      let cultureGen = 0;
      let happyModifier = 0;

      // Calculate building inputs
      buildings.forEach(b => {
        const meta = BUILDING_METADATA[b.type];
        maintenanceSum += meta.maintenance;

        // Calculate slots staffing efficiency
        const assignedTeachers = myTeachers.filter(t => t.assignedBuildingId === b.id);
        const efficiency = assignedTeachers.length > 0 ? 1.0 : 0.25;

        if (b.type === "school") {
          happyModifier += 2 * efficiency;
          scienceGen += 1 * efficiency;
        } else if (b.type === "lab") {
          scienceGen += 3 * efficiency;
        } else if (b.type === "library") {
          cultureGen += 2 * efficiency;
          happyModifier += 1 * efficiency;
        } else if (b.type === "museum") {
          cultureGen += 4 * efficiency;
          happyModifier += 2 * efficiency;
        } else if (b.type === "research") {
          scienceGen += 5 * efficiency;
        } else if (b.type === "hospital") {
          happyModifier += 4 * efficiency;
        }
      });

      // Calculate teachers salary
      myTeachers.forEach(t => {
        salariesSum += t.salary;
        // Teachers earn passive experience
        if (t.assignedBuildingId) {
          t.experience += 10;
          if (t.experience >= t.level * 100 && t.level < 5) {
            t.level += 1;
            t.salary = Math.round(t.salary * 1.25);
            toast.info(`🎓 ¡El profesor ${t.name} subió al Nivel ${t.level}! Su salario aumentó.`);
          }
        }
      });

      // Calculate University tuition incomes
      let tuitionIncome = 0;
      degrees.forEach(d => {
        // tuition from students
        tuitionIncome += d.students * (d.tuition / 10);
      });

      // Update Resources
      setBudget(prev => Math.max(0, Math.round(prev + tuitionIncome - maintenanceSum - salariesSum)));
      setSciencePoints(prev => Math.round(prev + scienceGen));
      setCulturePoints(prev => Math.round(prev + cultureGen));

      // Calculate new happiness
      const baseHappy = 80 + happyModifier - (buildings.length * 0.5);
      setHappiness(Math.max(10, Math.min(100, Math.round(baseHappy))));

      // Population auto growth
      const targetPop = Math.round(150 + (buildings.length * 40) + (happiness * 1.5));
      setPopulation(p => p < targetPop ? p + 8 : p > targetPop ? p - 4 : p);

      // Check city level up
      const avgScore = population + sciencePoints + culturePoints;
      if (avgScore >= cityLevel * 1000 && cityLevel < 5) {
        setCityLevel(l => l + 1);
        toast.success(`🎉 ¡Tu Ciudad del Conocimiento alcanzó el Rango Nivel ${cityLevel + 1}!`);
      }

      // Check research progress tick
      setResearchProjects(prev => prev.map(p => {
        if (p.started && !p.completed) {
          const next = p.progress + (100 / p.durationSeconds);
          if (next >= 100) {
            toast.success(`🔬 ¡Investigación Completada: ${p.name}!`);
            return { ...p, progress: 100, completed: true };
          }
          return { ...p, progress: Math.min(100, next) };
        }
        return p;
      }));

      // Fire random crisis events periodically (10% chance per month)
      if (Math.random() < 0.12 && !activeEvent) {
        setActiveEvent(EVENTS_POOL[Math.floor(Math.random() * EVENTS_POOL.length)]);
        setEventFeedback(null);
      }

    }, intervalSec);

    return () => clearInterval(interval);
  }, [timeSpeed, buildings, myTeachers, degrees, activeEvent, experience, cityLevel, population, sciencePoints, culturePoints, happiness]);

  // BUILD FUNCTION
  const handleBuildBuilding = (x: number, y: number) => {
    if (!selectedBuildType) return;
    const meta = BUILDING_METADATA[selectedBuildType];

    if (budget < meta.cost) {
      toast.error(tText.insufficientFunds);
      return;
    }

    // Check overlaps
    const exists = buildings.some(b => b.x === x && b.y === y);
    if (exists) {
      toast.error("Casilla ocupada.");
      return;
    }

    const newBuilding: Building = {
      id: "b_" + Date.now(),
      type: selectedBuildType,
      x,
      y,
      assignedTeacherIds: []
    };

    setBudget(prev => prev - meta.cost);
    setBuildings(prev => [...prev, newBuilding]);
    setSelectedBuildType(null);
    toast.success(`🏗️ ¡${meta.name} construido en la casilla (${x}, ${y})!`);
  };

  // ASSIGN TEACHER TO SELECTED BUILDING
  const handleAssignTeacher = (teacherId: string) => {
    if (!selectedMapBuilding) return;

    setMyTeachers(prev => prev.map(t => {
      if (t.id === teacherId) {
        return { ...t, assignedBuildingId: selectedMapBuilding.id };
      }
      return t;
    }));

    setBuildings(prev => prev.map(b => {
      if (b.id === selectedMapBuilding.id) {
        return { ...b, assignedTeacherIds: [...b.assignedTeacherIds, teacherId] };
      }
      return b;
    }));

    toast.success("👨‍🏫 Profesor asignado con éxito.");
  };

  // HIRE PROFESSOR FROM THE MARKET POOL
  const handleHireTeacher = (teacher: Omit<Teacher, "assignedBuildingId">) => {
    if (budget < teacher.salary * 2) {
      toast.error("❌ Presupuesto insuficiente para contratación (Requiere doble del salario).");
      return;
    }

    const newTeacher: Teacher = {
      ...teacher,
      assignedBuildingId: null
    };

    setBudget(prev => prev - teacher.salary * 2);
    setMyTeachers(prev => [...prev, newTeacher]);
    setMarketTeachers(prev => prev.filter(t => t.id !== teacher.id));
    toast.success(`🤝 ¡Contrataste a ${teacher.name}!`);
  };

  // START RESEARCH PROJECT
  const handleStartResearch = (project: ResearchProject) => {
    if (budget < project.cost) {
      toast.error(tText.insufficientFunds);
      return;
    }

    setBudget(prev => prev - project.cost);
    setResearchProjects(prev => prev.map(p => {
      if (p.id === project.id) {
        return { ...p, started: true };
      }
      return p;
    }));
    toast.info(`🔬 Iniciando investigación: ${project.name}`);
  };

  // LAUNCH NEW DEGREE (CARRERA)
  const handleCreateDegree = () => {
    if (!newDegreeName) {
      toast.error("Asigna un nombre a la carrera.");
      return;
    }

    const newD: Degree = {
      id: "deg_" + Date.now(),
      name: newDegreeName,
      area: newDegreeArea,
      teacherId: null,
      tuition: newDegreeTuition,
      students: 4 + Math.floor(Math.random() * 8), // initial students
      duration: 8
    };

    setDegrees(prev => [...prev, newD]);
    setNewDegreeName("");
    setShowCreateDegreeModal(false);
    toast.success(`🎓 Carrera de ${newDegreeName} creada.`);
  };

  // DECIDE CRISIS EVENT
  const handleSolveEvent = (opt: any) => {
    setBudget(prev => Math.max(0, prev + opt.consequences.economy));
    setHappiness(prev => Math.max(10, Math.min(100, prev + opt.consequences.happiness)));
    setSciencePoints(prev => Math.max(0, prev + opt.consequences.science));
    setCulturePoints(prev => Math.max(0, prev + opt.consequences.culture));

    setEventFeedback(opt.consequences.desc);

    // Global achievements XP reward
    setGlobalXp(x => x + 100);
    xpMutation.mutate(100);
    coinsMutation.mutate(5);

    setTimeout(() => {
      setActiveEvent(null);
      setEventFeedback(null);
    }, 4000);
  };

  const isResearchCompleted = (type: string) => {
    const proj = researchProjects.find(p => p.unlocksType === type);
    return proj ? proj.completed : true;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-hidden select-none font-sans">
      <AppHeader />
      
      {/* coordinador TYCOON MENU HEADER */}
      <header className="bg-[#050c0a] border-b border-[#143224] px-6 py-4 flex items-center justify-between z-30 shadow-md">
        <button onClick={() => navigate({ to: "/games" })} className="text-emerald-400 hover:text-white font-bold flex items-center gap-1.5 cursor-pointer bg-transparent border-none">
          <ArrowLeft className="size-5" /> {tText.back}
        </button>

        {/* Speed controls */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1.5 rounded-xl">
          <button onClick={() => setTimeSpeed("pause")} className={`p-1.5 rounded cursor-pointer ${timeSpeed === "pause" ? "bg-amber-500 text-slate-950" : "hover:bg-slate-800 text-slate-400"}`}>
            <Pause className="size-4" />
          </button>
          <button onClick={() => setTimeSpeed("normal")} className={`p-1.5 rounded cursor-pointer ${timeSpeed === "normal" ? "bg-emerald-500 text-slate-950" : "hover:bg-slate-800 text-slate-400"}`}>
            <Play className="size-4" />
          </button>
          <button onClick={() => setTimeSpeed("fast")} className={`p-1.5 rounded cursor-pointer ${timeSpeed === "fast" ? "bg-emerald-500 text-slate-950" : "hover:bg-slate-800 text-slate-400"}`}>
            <FastForward className="size-4" />
          </button>
        </div>

        {/* Language selector */}
        <div className="flex gap-1.5 text-[10px] font-black uppercase">
          {(["es", "en", "pt"] as const).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-2.5 py-1 rounded border cursor-pointer ${lang === l ? "border-emerald-500 text-emerald-400 bg-emerald-500/5" : "border-slate-800 text-slate-400 hover:bg-slate-900"}`}
            >
              {l}
            </button>
          ))}
        </div>
      </header>

      {/* TYCOON GAME SCREEN */}
      <main className="flex-1 grid grid-cols-12 relative overflow-hidden">
        
        {/* LEFT COLUMN: ISOMETRIC GRID CANVAS (8 COLS) */}
        <div className="col-span-12 lg:col-span-8 relative bg-[#07100c] overflow-hidden flex flex-col justify-between p-6">
          {/* HUD Top Bar metrics */}
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 bg-slate-950/80 border border-[#143224] backdrop-blur p-4 rounded-2xl z-10 text-xs font-bold shadow-md">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">{tText.economy}</span>
              <span className="text-sm text-emerald-400 font-extrabold">${budget.toLocaleString()}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">{tText.science}</span>
              <span className="text-sm text-indigo-400 font-extrabold">{sciencePoints} 🧬</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">{tText.culture}</span>
              <span className="text-sm text-purple-400 font-extrabold">{culturePoints} 🎨</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">{tText.happiness}</span>
              <span className="text-sm text-yellow-400 font-extrabold">{happiness}% 😊</span>
            </div>
            <div className="hidden sm:flex flex-col gap-0.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">{tText.population}</span>
              <span className="text-sm text-sky-400 font-extrabold">{population} habs</span>
            </div>
          </div>

          {/* HTML5 ISOMETRIC CANVAS MAP */}
          <div className="my-auto mx-auto w-full max-w-[620px] aspect-[4/3] bg-slate-950 border border-[#143224]/30 rounded-3xl relative overflow-hidden shadow-inner flex justify-center items-center">
            <canvas ref={canvasRef} width={620} height={420} className="w-full h-full block" />
            
            {/* Building preview overlay indicator */}
            {selectedBuildType && (
              <div className="absolute top-4 left-4 bg-emerald-500 text-slate-950 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse border border-slate-950">
                🔨 Modo Construcción: Haz clic sobre el pasto para colocar {BUILDING_METADATA[selectedBuildType].name}
              </div>
            )}
          </div>

          {/* Sub-HUD Time info status */}
          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl z-10 flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-slate-400 pointer-events-none">
            <span>Rango: <span className="text-emerald-400 font-bold">{getCityLevelName(cityLevel)} (Lv.{cityLevel})</span></span>
            <span>{tText.month}: {month}</span>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTION HUD AND TABS (4 COLS) */}
        <div className="col-span-12 lg:col-span-4 border-l border-slate-900 bg-[#060c0a] flex flex-col justify-between overflow-y-auto max-h-[calc(100vh-130px)]">
          {/* TAB SELECTION HEADER */}
          <div className="flex border-b border-slate-900 pb-px">
            {(["build", "teachers", "degrees", "research"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setUiTab(tab)}
                className={`flex-1 py-3.5 text-xs font-black uppercase transition border-none cursor-pointer ${uiTab === tab ? "bg-slate-950 text-emerald-400 border-b-2 border-emerald-500" : "text-slate-400 hover:bg-slate-900"}`}
              >
                {tText[tab as keyof typeof tText] || tab}
              </button>
            ))}
          </div>

          {/* TAB CONTENTS */}
          <div className="flex-1 p-6">
            
            {/* BUILD PANEL */}
            {uiTab === "build" && (
              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-200">🔨 Catálogo de Edificaciones</h4>
                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {Object.entries(BUILDING_METADATA).map(([key, meta]) => {
                    const isUnlocked = isResearchCompleted(key);
                    return (
                      <div
                        key={key}
                        className={`border p-3.5 rounded-xl space-y-1.5 transition ${isUnlocked ? "bg-slate-950 border-[#143224]" : "bg-slate-950/20 border-slate-900 opacity-50"}`}
                      >
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="flex items-center gap-1.5">{meta.icon} {meta.name}</span>
                          {isUnlocked ? (
                            <button
                              onClick={() => setSelectedBuildType(key as any)}
                              className={`px-3 py-1 font-black text-[9px] uppercase rounded border-none cursor-pointer ${selectedBuildType === key ? "bg-amber-500 text-slate-950" : "bg-emerald-500 hover:bg-emerald-400 text-slate-950"}`}
                            >
                              {selectedBuildType === key ? "Activo" : "Construir"}
                            </button>
                          ) : (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-rose-400">🔒 Bloqueado</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 leading-normal">{meta.desc}</p>
                        <div className="flex gap-3 text-[9px] font-black uppercase text-slate-500">
                          <span>Costo: ${meta.cost}</span>
                          <span>Mant.: ${meta.maintenance}/mes</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TEACHERS STAFFING PANEL */}
            {uiTab === "teachers" && (
              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-200">👨‍🏫 Plantilla de Profesores</h4>
                
                {/* Active employees list */}
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {myTeachers.map(t => (
                    <div key={t.id} className="bg-slate-950 border border-slate-900 p-3 rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <div className="font-bold">{t.name}</div>
                        <div className="text-[10px] text-emerald-400">Especialidad: {t.specialty} · Lv.{t.level}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-extrabold text-slate-300">${t.salary}/mes</div>
                        {selectedMapBuilding && !t.assignedBuildingId && (
                          <button
                            onClick={() => handleAssignTeacher(t.id)}
                            className="mt-1 px-2.5 py-0.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[9px] font-black uppercase rounded border-none cursor-pointer"
                          >
                            Asignar
                          </button>
                        )}
                        {t.assignedBuildingId && <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Asignado</span>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Market pool hiring */}
                <div className="pt-3 border-t border-slate-900 space-y-2">
                  <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Bolsa de Contratación</h5>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {marketTeachers.map(t => (
                      <div key={t.id} className="bg-slate-950 border border-slate-900 p-2.5 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <div className="font-bold">{t.name}</div>
                          <div className="text-[9px] text-indigo-400">{t.specialty} (Nivel {t.level})</div>
                        </div>
                        <button
                          onClick={() => handleHireTeacher(t)}
                          className="px-3 py-1 bg-sky-500 hover:bg-sky-400 text-slate-950 text-[9px] font-black uppercase rounded border-none cursor-pointer"
                        >
                          Hired (${t.salary})
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* UNIVERSITY DEGREES PANEL */}
            {uiTab === "degrees" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-black text-slate-200">🎓 Carreras Universitarias</h4>
                  <button
                    onClick={() => setShowCreateDegreeModal(true)}
                    className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black uppercase rounded border-none cursor-pointer"
                  >
                    Crear
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {degrees.map(d => (
                    <div key={d.id} className="bg-slate-950 border border-[#143224] p-3.5 rounded-xl space-y-1">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span>{d.name}</span>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">{d.area}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Alumnos: {d.students}</span>
                        <span>Matrícula: ${d.tuition}/mes</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* RESEARCH PANEL */}
            {uiTab === "research" && (
              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-200">🔬 Proyectos de Investigación</h4>
                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {researchProjects.map(p => (
                    <div key={p.id} className="bg-slate-950 border border-slate-900 p-3.5 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between font-bold">
                        <span>{p.name}</span>
                        {p.completed ? (
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">Completado</span>
                        ) : p.started ? (
                          <span className="text-[9px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded">Procesando...</span>
                        ) : (
                          <button
                            onClick={() => handleStartResearch(p)}
                            className="px-2.5 py-0.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[9px] font-black uppercase rounded border-none cursor-pointer"
                          >
                            Investigar (${p.cost})
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">{p.desc}</p>
                      {p.started && !p.completed && (
                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${p.progress}%` }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Persistent Save status */}
          <div className="p-4 border-t border-slate-900 text-center text-[9px] text-slate-500">
            Lybanhi Tycoon Engine v1.0
          </div>
        </div>
      </main>

      {/* EVENT POPUP MODAL */}
      {activeEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#0c100e] border-2 border-red-500/25 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-white animate-in zoom-in-95">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 to-amber-500" />
            
            <div className="border-b border-[#321414] pb-3 text-xs text-rose-400 font-black tracking-widest uppercase">
              ⚠️ Alerta de Crisis del Campus
            </div>

            <div className="mt-4 space-y-4">
              <h3 className="font-extrabold text-base text-slate-100">{activeEvent.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{activeEvent.desc}</p>

              {eventFeedback && (
                <div className="p-3 bg-slate-950 border border-slate-800 text-[10px] text-emerald-400 font-bold leading-relaxed rounded-xl">
                  {eventFeedback}
                </div>
              )}

              {!eventFeedback && (
                <div className="grid gap-2 pt-2">
                  {activeEvent.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSolveEvent(opt)}
                      className="w-full py-3 px-4 bg-slate-950 border border-[#143224] hover:bg-[#11241E] text-slate-200 hover:text-white rounded-xl text-xs font-bold transition text-left cursor-pointer"
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE UNIVERSITY DEGREE MODAL */}
      {showCreateDegreeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#091512] border-2 border-emerald-500/25 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-white">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-indigo-500" />
            
            <div className="flex justify-between items-center border-b border-[#143224] pb-3 text-xs font-black uppercase text-slate-300">
              <span>Crear Nueva Carrera</span>
              <button onClick={() => setShowCreateDegreeModal(false)} className="text-slate-400 hover:text-white cursor-pointer bg-transparent border-none font-bold">✕</button>
            </div>

            <div className="mt-4 space-y-4 text-xs font-bold">
              <div>
                <label className="text-slate-400 block mb-1">Nombre de la Carrera</label>
                <input
                  type="text"
                  value={newDegreeName}
                  onChange={e => setNewDegreeName(e.target.value)}
                  placeholder="Ej. Inteligencia Artificial"
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Área Académica</label>
                <select
                  value={newDegreeArea}
                  onChange={e => setNewDegreeArea(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {["Ciencias", "Artes", "Tecnología", "Salud", "Humanidades", "Negocios"].map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Matrícula Escolar mensual (${newDegreeTuition})</label>
                <input
                  type="range"
                  min={200}
                  max={1200}
                  step={50}
                  value={newDegreeTuition}
                  onChange={e => setNewDegreeTuition(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>$200 (Popular)</span>
                  <span>$1200 (Selecto)</span>
                </div>
              </div>

              <button
                onClick={handleCreateDegree}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl cursor-pointer border-none"
              >
                Lanzar Carrera 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default CiudadConocimientoGame;
