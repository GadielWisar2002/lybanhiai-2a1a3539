import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { rewardGameCoins } from "@/lib/games.functions";
import { AppHeader } from "@/components/AppHeader";
import { ArrowLeft, Trophy, Timer, Swords, Zap, BookOpen, GraduationCap, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { QUESTIONS_DB, type Question } from "@/lib/question-engine";
import { analyticsEngine } from "@/lib/analytics-engine";
import streakCap from "@/assets/streak-cap.png";

export const Route = createFileRoute("/_authenticated/games/quiz-clash")({
  head: () => ({ meta: [{ title: "Quiz Clash — Lybanhi" }] }),
  component: QuizClashGame,
});

const DIVISIONS = ["Bronce V", "Bronce I", "Plata V", "Plata I", "Oro III", "Oro I", "Platino", "Diamante", "Maestro"];
const BOT_NAMES = [
  "Alexis_Quantum", "Clara_Genetica", "Mateo_Algoritmos", 
  "Valeria_Newton", "Hugo_Socrates", "Elena_Calculo",
  "Diego_Darwin", "Sofia_Química", "Lucas_Algebra"
];

// Rich fallback bank of educational questions
interface EducationalQuestion {
  id: string;
  level: "secundaria" | "preparatoria" | "admision" | "toefl" | "cambridge";
  subject: "matemáticas" | "física" | "química" | "biología" | "historia" | "geografía" | "español" | "inglés" | "lógica" | "programación";
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const LOCAL_QUESTIONS_DB: EducationalQuestion[] = [
  // --- MATEMÁTICAS ---
  {
    id: "qc_m_1",
    level: "secundaria",
    subject: "matemáticas",
    topic: "Álgebra",
    difficulty: "easy",
    prompt: "¿Cuánto es el valor de x en la ecuación: 2x + 5 = 15?",
    options: ["x = 5", "x = 3", "x = 10", "x = 7"],
    correctIndex: 0,
    explanation: "Restamos 5 a ambos lados: 2x = 10. Luego dividimos entre 2: x = 5."
  },
  {
    id: "qc_m_2",
    level: "preparatoria",
    subject: "matemáticas",
    topic: "Álgebra",
    difficulty: "medium",
    prompt: "¿Cuál es el valor de x en la ecuación cuadrática x² - 9 = 0?",
    options: ["x = ±3", "x = 3", "x = -9", "x = ±9"],
    correctIndex: 0,
    explanation: "Despejando x² obtenemos x² = 9. Aplicando raíz cuadrada a ambos lados, obtenemos x = ±3."
  },
  {
    id: "qc_m_3",
    level: "admision",
    subject: "matemáticas",
    topic: "Lógica",
    difficulty: "hard",
    prompt: "Si dos pintores tardan 6 horas en pintar una casa, ¿cuánto tardarán 3 pintores al mismo ritmo?",
    options: ["9 horas", "3 horas", "4 horas", "5 horas"],
    correctIndex: 2,
    explanation: "Es una proporción inversa. A más pintores, menos tiempo: (2 pintores * 6 horas) / 3 pintores = 4 horas."
  },
  {
    id: "qc_m_4",
    level: "secundaria",
    subject: "matemáticas",
    topic: "Aritmética",
    difficulty: "easy",
    prompt: "¿Cuál es el resultado de la siguiente operación básica: 15 - 3 * 4 + 2?",
    options: ["5", "50", "14", "9"],
    correctIndex: 0,
    explanation: "Por jerarquía de operaciones, resolvemos primero la multiplicación: 3 * 4 = 12. Luego sumas y restas de izquierda a derecha: 15 - 12 + 2 = 5."
  },
  {
    id: "qc_m_5",
    level: "preparatoria",
    subject: "matemáticas",
    topic: "Aritmética",
    difficulty: "medium",
    prompt: "¿Qué fracción es exactamente equivalente a la expresión decimal 0.875?",
    options: ["5/6", "7/8", "3/4", "9/10"],
    correctIndex: 1,
    explanation: "0.875 se puede expresar como 875/1000, lo cual simplificado entre 125 nos da 7/8."
  },
  {
    id: "qc_m_6",
    level: "admision",
    subject: "matemáticas",
    topic: "Álgebra",
    difficulty: "hard",
    prompt: "¿Cuál es la pendiente de la recta tangente a la curva y = x² - 3x en el punto x = 2?",
    options: ["1", "2", "3", "0"],
    correctIndex: 0,
    explanation: "La derivada es y' = 2x - 3. Evaluando en x = 2: y'(2) = 2(2) - 3 = 1."
  },
  {
    id: "qc_m_7",
    level: "secundaria",
    subject: "matemáticas",
    topic: "Lógica",
    difficulty: "easy",
    prompt: "¿Qué número sigue en la secuencia lógica: 2, 4, 8, 16, ...?",
    options: ["20", "32", "24", "48"],
    correctIndex: 1,
    explanation: "Cada número se multiplica por 2 (progresión geométrica). 16 * 2 = 32."
  },

  // --- CIENCIAS (Física, Química, Biología) ---
  {
    id: "qc_c_1",
    level: "secundaria",
    subject: "química",
    topic: "Química Básica",
    difficulty: "easy",
    prompt: "¿Cuál es la fórmula química del agua común?",
    options: ["CO2", "HO2", "H2O", "H2O2"],
    correctIndex: 2,
    explanation: "El agua contiene dos átomos de Hidrógeno y uno de Oxígeno: H2O."
  },
  {
    id: "qc_c_2",
    level: "preparatoria",
    subject: "física",
    topic: "Leyes del Movimiento",
    difficulty: "medium",
    prompt: "¿Qué ley física explica directamente la relación proporcional entre fuerza y aceleración (F = m*a)?",
    options: ["Segunda Ley de Newton", "Primera Ley de Newton", "Tercera Ley de Newton", "Ley de la Gravitación"],
    correctIndex: 0,
    explanation: "La Segunda Ley de Newton establece que la aceleración es proporcional a la fuerza neta e inversamente proporcional a la masa."
  },
  {
    id: "qc_c_3",
    level: "admision",
    subject: "biología",
    topic: "Biología Celular",
    difficulty: "hard",
    prompt: "¿Qué organelo es responsable de llevar a cabo la respiración celular y producir ATP?",
    options: ["Cloroplasto", "Lisosoma", "Mitocondria", "Aparato de Golgi"],
    correctIndex: 2,
    explanation: "Las mitocondrias son los organelos celulares donde se produce la mayor parte de la energía química (ATP) de la célula."
  },
  {
    id: "qc_c_4",
    level: "secundaria",
    subject: "física",
    topic: "Electricidad",
    difficulty: "easy",
    prompt: "¿Qué unidad se utiliza en física para medir la resistencia eléctrica de un material?",
    options: ["Voltio (V)", "Amperio (A)", "Ohmio (Ω)", "Vatio (W)"],
    correctIndex: 2,
    explanation: "La resistencia eléctrica se mide en Ohmios en honor al físico Georg Simon Ohm."
  },
  {
    id: "qc_c_5",
    level: "preparatoria",
    subject: "química",
    topic: "Tabla Periódica",
    difficulty: "medium",
    prompt: "¿Cuál es el símbolo químico correcto para el elemento Hierro?",
    options: ["H", "Hi", "Fe", "Ir"],
    correctIndex: 2,
    explanation: "El símbolo del Hierro es Fe, proveniente de su nombre en latín 'ferrum'."
  },
  {
    id: "qc_c_6",
    level: "admision",
    subject: "química",
    topic: "Enlaces Químicos",
    difficulty: "hard",
    prompt: "¿Qué tipo de enlace se forma cuando dos átomos comparten electrones de manera equitativa?",
    options: ["Enlace Covalente No Polar", "Enlace Covalente Polar", "Enlace Iónico", "Enlace Metálico"],
    correctIndex: 0,
    explanation: "Cuando los átomos tienen electronegatividades similares, comparten electrones de forma equitativa, resultando en un enlace covalente no polar."
  },

  // --- HISTORIA / GEOGRAFÍA ---
  {
    id: "qc_h_1",
    level: "secundaria",
    subject: "historia",
    topic: "Historia de México",
    difficulty: "easy",
    prompt: "¿En qué año inició el movimiento revolucionario de la Independencia de México?",
    options: ["1810", "1821", "1910", "1776"],
    correctIndex: 0,
    explanation: "Comenzó el 16 de septiembre de 1810 con el Grito de Dolores del cura Miguel Hidalgo."
  },
  {
    id: "qc_h_2",
    level: "preparatoria",
    subject: "historia",
    topic: "Historia Universal",
    difficulty: "medium",
    prompt: "¿Qué evento detonó directamente el inicio de la Primera Guerra Mundial en 1914?",
    options: [
      "La invasión a Polonia", 
      "El asesinato del archiduque Francisco Fernando", 
      "El Tratado de Versalles", 
      "El ataque a Pearl Harbor"
    ],
    correctIndex: 1,
    explanation: "El magnicidio del archiduque de Austria en Sarajevo encendió la red de alianzas que originó el conflicto mundial."
  },
  {
    id: "qc_h_3",
    level: "admision",
    subject: "historia",
    topic: "Historia Contemporánea",
    difficulty: "hard",
    prompt: "¿En qué año cayó el Muro de Berlín, marcando el fin simbólico de la Guerra Fría?",
    options: ["1985", "1991", "1989", "1993"],
    correctIndex: 2,
    explanation: "El muro de Berlín fue derribado el 9 de noviembre de 1989, acelerando la unificación alemana y la disolución del bloque soviético."
  },
  {
    id: "qc_h_4",
    level: "secundaria",
    subject: "geografía",
    topic: "Geografía Física",
    difficulty: "easy",
    prompt: "¿Cuál es el río considerado oficialmente el más largo del mundo?",
    options: ["Río Nilo", "Río Misisipi", "Río Amazonas", "Río Yangtsé"],
    correctIndex: 2,
    explanation: "El Río Amazonas es el más caudaloso y el más largo del mundo, superando al Nilo por margen de estudios recientes."
  },

  // --- INGLÉS / TOEFL / CAMBRIDGE ---
  {
    id: "qc_i_1",
    level: "toefl",
    subject: "inglés",
    topic: "Gramática",
    difficulty: "easy",
    prompt: "Choose the grammatically correct sentence:",
    options: [
      "He go to school every day.", 
      "He goes to school every day.", 
      "He going to school every day.", 
      "He gone to school every day."
    ],
    correctIndex: 1,
    explanation: "In Present Simple, third person singular subjects (he, she, it) require the verb to end in -s or -es."
  },
  {
    id: "qc_i_2",
    level: "toefl",
    subject: "inglés",
    topic: "Vocabulario",
    difficulty: "medium",
    prompt: "What is the synonym of the word 'EPHEMERAL'?",
    options: ["Long-lasting", "Short-lived", "Very bright", "Mysterious"],
    correctIndex: 1,
    explanation: "'Ephemeral' refers to something that lasts for a very short time; transient or fleeting."
  },
  {
    id: "qc_i_3",
    level: "cambridge",
    subject: "inglés",
    topic: "Condicionales",
    difficulty: "hard",
    prompt: "Complete the sentence: 'If I had known about the traffic, I _______ left earlier.'",
    options: ["would have", "will have", "would", "had"],
    correctIndex: 0,
    explanation: "This is a Third Conditional sentence expressing past regret: If + past perfect, would have + past participle."
  },
  {
    id: "qc_i_4",
    level: "toefl",
    subject: "inglés",
    topic: "Comprensión Lectora",
    difficulty: "medium",
    prompt: "Identify the word that means 'to make something better or improve its quality':",
    options: ["Diminish", "Enhance", "Stagnate", "Alleviate"],
    correctIndex: 1,
    explanation: "To 'enhance' means to intensify, increase, or further improve the quality, value, or extent of something."
  },
  {
    id: "qc_i_5",
    level: "cambridge",
    subject: "inglés",
    topic: "Estructuras Gramaticales",
    difficulty: "hard",
    prompt: "Complete: 'Hardly _______ started my presentation when the computer crashed.'",
    options: ["I had", "had I", "was I", "I have"],
    correctIndex: 1,
    explanation: "When starting a sentence with negative adverbials like 'hardly', 'scarcely', or 'no sooner', subject-auxiliary inversion (had I) is required."
  }
];

function QuizClashGame() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const rewardCoins = useServerFn(rewardGameCoins);

  // Persistent stats in LocalStorage
  const [divisionIdx, setDivisionIdx] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("quiz_clash_division");
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  const [lp, setLp] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("quiz_clash_lp");
      return saved ? parseInt(saved, 10) : 20;
    }
    return 20;
  });

  const [winStreak, setWinStreak] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("quiz_clash_streak");
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  // Game Settings & States
  const [gameMode, setGameMode] = useState<"mixto" | "matemáticas" | "inglés">("mixto");
  const [gameState, setGameState] = useState<"lobby" | "queue" | "match" | "postmatch">("lobby");
  const [opponentName, setOpponentName] = useState("");
  const [opponentDivision, setOpponentDivision] = useState("");
  const [matchRound, setMatchRound] = useState(1);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [outcome, setOutcome] = useState<"victory" | "defeat" | "draw">("victory");

  // Question Deck
  const [questionDeck, setQuestionDeck] = useState<EducationalQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<EducationalQuestion | null>(null);
  
  // Timers & Feedbacks
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [roundFeedback, setRoundFeedback] = useState<{ playerCorrect: boolean; opponentCorrect: boolean } | null>(null);

  // Sync stats to LocalStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("quiz_clash_division", divisionIdx.toString());
      localStorage.setItem("quiz_clash_lp", lp.toString());
      localStorage.setItem("quiz_clash_streak", winStreak.toString());
    }
  }, [divisionIdx, lp, winStreak]);

  const rewardMutation = useMutation({
    mutationFn: (coins: number) => rewardCoins({ data: { coins } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  // Timer Countdown
  useEffect(() => {
    if (gameState !== "match" || timeLeft <= 0) {
      if (gameState === "match" && timeLeft === 0) {
        handleRoundTimeout();
      }
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(p => p - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, gameState]);

  // Generates 5 educational questions based on Mode & current Division Difficulty
  const generateDeck = (mode: "mixto" | "matemáticas" | "inglés"): EducationalQuestion[] => {
    // Determine difficulty filter based on league standing
    let difficulty: "easy" | "medium" | "hard" = "easy";
    if (divisionIdx >= 3 && divisionIdx <= 6) difficulty = "medium";
    if (divisionIdx > 6) difficulty = "hard";

    // Combine database sources
    const allCandidates = [...LOCAL_QUESTIONS_DB];
    
    // Attempt to parse global engine questions to enrich our pool
    try {
      QUESTIONS_DB.forEach(q => {
        if (q.type === "multiple-choice" && q.options && q.options.length === 4) {
          // Normalize subjects to translate database naming (e.g. math -> matemáticas)
          let mappedSubject: any = q.subject;
          if (q.subject === "math") mappedSubject = "matemáticas";
          if (q.subject === "physics") mappedSubject = "física";
          if (q.subject === "chemistry") mappedSubject = "química";
          if (q.subject === "biology") mappedSubject = "biología";
          if (q.subject === "english") mappedSubject = "inglés";
          
          allCandidates.push({
            id: q.id,
            level: q.level as any,
            subject: mappedSubject,
            topic: q.topic,
            difficulty: q.difficulty,
            prompt: q.prompt,
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation || "Respuesta correcta determinada por la lógica interna del concepto académico."
          });
        }
      });
    } catch (e) {
      console.warn("Global question database unavailable, relying entirely on Local DB", e);
    }

    const deck: EducationalQuestion[] = [];

    if (mode === "mixto") {
      // 2 Matemáticas, 1 Historia, 1 Inglés, 1 Ciencia (Física/Química/Biología)
      const mathFilter = allCandidates.filter(q => q.subject === "matemáticas");
      const historyFilter = allCandidates.filter(q => q.subject === "historia" || q.subject === "geografía");
      const englishFilter = allCandidates.filter(q => q.subject === "inglés");
      const scienceFilter = allCandidates.filter(q => ["física", "química", "biología"].includes(q.subject));

      const grabRandom = (arr: EducationalQuestion[], targetDiff: string) => {
        let matches = arr.filter(q => q.difficulty === targetDiff);
        if (matches.length === 0) matches = arr; // fallback
        if (matches.length === 0) return LOCAL_QUESTIONS_DB[0]; // absolute fallback
        return matches[Math.floor(Math.random() * matches.length)];
      };

      deck.push(grabRandom(mathFilter, difficulty));
      deck.push(grabRandom(mathFilter, difficulty));
      deck.push(grabRandom(historyFilter, difficulty));
      deck.push(grabRandom(englishFilter, difficulty));
      deck.push(grabRandom(scienceFilter, difficulty));
    } else if (mode === "matemáticas") {
      // 70% Algebra, 20% Aritmética, 10% Lógica
      const algebraFilter = allCandidates.filter(q => q.subject === "matemáticas" && q.topic === "Álgebra");
      const arithmeticFilter = allCandidates.filter(q => q.subject === "matemáticas" && q.topic === "Aritmética");
      const logicFilter = allCandidates.filter(q => q.subject === "matemáticas" && q.topic === "Lógica");

      const grabRandom = (arr: EducationalQuestion[], targetDiff: string) => {
        let matches = arr.filter(q => q.difficulty === targetDiff);
        if (matches.length === 0) matches = arr; // fallback
        if (matches.length === 0) return LOCAL_QUESTIONS_DB[0]; // absolute fallback
        return matches[Math.floor(Math.random() * matches.length)];
      };

      deck.push(grabRandom(algebraFilter, difficulty));
      deck.push(grabRandom(algebraFilter, difficulty));
      deck.push(grabRandom(algebraFilter, difficulty));
      deck.push(grabRandom(arithmeticFilter, difficulty));
      deck.push(grabRandom(logicFilter, difficulty));
    } else {
      // Inglés (TOEFL / Cambridge)
      const englishFilter = allCandidates.filter(q => q.subject === "inglés");
      const grabRandom = (arr: EducationalQuestion[], targetDiff: string) => {
        let matches = arr.filter(q => q.difficulty === targetDiff);
        if (matches.length === 0) matches = arr; // fallback
        if (matches.length === 0) return LOCAL_QUESTIONS_DB[18]; // absolute fallback
        return matches[Math.floor(Math.random() * matches.length)];
      };

      // Generate 5 distinct English questions
      const selected = [...englishFilter];
      for (let j = 0; j < 5; j++) {
        if (selected.length > 0) {
          const idx = Math.floor(Math.random() * selected.length);
          deck.push(selected[idx]);
          selected.splice(idx, 1);
        } else {
          deck.push(LOCAL_QUESTIONS_DB[18 + (j % 5)]);
        }
      }
    }

    return deck;
  };

  const handleStartQueue = () => {
    // Generate the deck of exactly 5 rounds
    const deck = generateDeck(gameMode);
    setQuestionDeck(deck);

    setGameState("queue");
    // Select bot details
    const bot = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
    const spread = Math.floor(Math.random() * 3) - 1; // -1, 0, +1 division range
    const opponentDivIdx = Math.max(0, Math.min(DIVISIONS.length - 1, divisionIdx + spread));
    
    setOpponentName(bot);
    setOpponentDivision(DIVISIONS[opponentDivIdx]);

    setTimeout(() => {
      setPlayerScore(0);
      setOpponentScore(0);
      setMatchRound(1);
      setGameState("match");
      
      // Load first question
      const firstQ = deck[0];
      setCurrentQuestion(firstQ);
      setTimeLeft(15);
      setSelectedOption(null);
      setRoundFeedback(null);
      setQuestionStartTime(Date.now());
    }, 2000);
  };

  const handleRoundTimeout = () => {
    if (!currentQuestion) return;
    setSelectedOption(-1); // marked as timeout

    const aiCorrect = Math.random() > 0.45; // 55% accuracy
    const aiPoints = aiCorrect ? Math.floor(Math.random() * 30) + 70 : 0;

    setRoundFeedback({
      playerCorrect: false,
      opponentCorrect: aiCorrect
    });

    setTimeout(() => {
      setOpponentScore(o => o + aiPoints);
      processNextStep(false, 0, aiPoints);
    }, 1800);
  };

  const submitAnswer = (optionIdx: number) => {
    if (!currentQuestion || selectedOption !== null) return;
    setSelectedOption(optionIdx);

    const correct = currentQuestion.correctIndex === optionIdx;
    const timeTaken = Date.now() - questionStartTime;

    analyticsEngine.trackAnswer(
      currentQuestion.subject,
      currentQuestion.topic,
      correct,
      timeTaken,
      currentQuestion.id
    );

    // AI answer logic: higher division equals smarter and faster AI
    const aiCorrect = Math.random() > (divisionIdx > 5 ? 0.30 : 0.45);
    const aiPoints = aiCorrect ? Math.round((Math.random() * 30 + 70) * (Math.random() * 0.4 + 0.6)) : 0;
    
    // Speed bonus calculation for correct answer (up to 150 points)
    const playerPoints = correct ? Math.round((timeLeft / 15) * 100) + 50 : 0;

    setRoundFeedback({
      playerCorrect: correct,
      opponentCorrect: aiCorrect
    });

    setTimeout(() => {
      setPlayerScore(p => p + playerPoints);
      setOpponentScore(o => o + aiPoints);
      processNextStep(correct, playerPoints, aiPoints);
    }, 2000);
  };

  const processNextStep = (playerCorrect: boolean, pPoints: number, oPoints: number) => {
    if (matchRound >= 5) {
      // Match Finished!
      const finalPlayer = playerScore + pPoints;
      const finalOpponent = opponentScore + oPoints;

      let matchOutcome: "victory" | "defeat" | "draw" = "draw";
      let lpChange = 0;
      let coinReward = 0;

      if (finalPlayer > finalOpponent) {
        matchOutcome = "victory";
        lpChange = 25;
        const newStreak = winStreak + 1;
        setWinStreak(newStreak);
        coinReward = 15 + (newStreak >= 3 ? 10 : 0); // 15 Sombreritos for a win!
        rewardMutation.mutate(coinReward);
        if (newStreak >= 3) {
          toast.success(`🔥 ¡Super Racha x${newStreak}! +10 Sombreritos de bonificación.`);
        }
      } else if (finalPlayer < finalOpponent) {
        matchOutcome = "defeat";
        lpChange = -15;
        setWinStreak(0);
      } else {
        matchOutcome = "draw";
        lpChange = 5;
        coinReward = 5;
        rewardMutation.mutate(5);
        setWinStreak(0);
      }

      setOutcome(matchOutcome);
      setGameState("postmatch");

      // Update persistent standing
      setLp(prev => {
        let nextLp = prev + lpChange;
        if (nextLp >= 100) {
          if (divisionIdx < DIVISIONS.length - 1) {
            setDivisionIdx(d => d + 1);
            toast.success(`🎉 ¡PROMOCIÓN! Has ascendido a la división: ${DIVISIONS[divisionIdx + 1]}!`);
          }
          return 0;
        } else if (nextLp < 0) {
          if (divisionIdx > 0) {
            setDivisionIdx(d => d - 1);
            toast.error(`⚠️ DESCENSO: Has bajado a la división: ${DIVISIONS[divisionIdx - 1]}`);
            return 60;
          }
          return 0;
        }
        return nextLp;
      });
    } else {
      // Load next round question from pre-generated deck
      const nextRound = matchRound + 1;
      const nextQ = questionDeck[nextRound - 1];
      
      setMatchRound(nextRound);
      setTimeLeft(15);
      setSelectedOption(null);
      setRoundFeedback(null);
      setQuestionStartTime(Date.now());
      setCurrentQuestion(nextQ);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#0E0B1E] border-b border-[#2D1B4E] px-6 py-4 flex items-center justify-between text-white shadow-md">
        <button onClick={() => navigate({ to: "/games" })} className="text-purple-400 hover:text-white font-bold flex items-center gap-1.5 cursor-pointer bg-transparent border-none">
          <ArrowLeft className="size-5" /> Regresar al Hub
        </button>
        <div className="flex items-center gap-2">
          <Swords className="size-5 text-purple-400 animate-pulse" />
          <h1 className="font-display text-lg font-black tracking-wide bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Quiz Clash Arena</h1>
        </div>
        <div className="flex items-center gap-2 bg-[#2D1B4E]/40 border border-[#4C2E85] px-3.5 py-1.5 rounded-full text-xs font-bold text-purple-300">
          <Trophy className="size-3.5 text-purple-400" />
          <span>{DIVISIONS[divisionIdx]} · {lp} LP</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 pt-6 pb-24 text-white min-h-[calc(100vh-68px)] bg-[#0B0816] flex flex-col justify-center relative overflow-hidden">
        {/* Glow ambient effects */}
        <div className="absolute top-1/4 left-1/4 size-80 rounded-full bg-purple-600/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 size-80 rounded-full bg-pink-600/5 blur-[120px] pointer-events-none" />

        {/* LOBBY STATE */}
        {gameState === "lobby" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {/* Left League Info */}
            <div className="bg-[#140F27] border-2 border-purple-500/10 rounded-3xl p-6 flex flex-col justify-between items-center text-center shadow-lg relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-purple-500 to-pink-500" />
              <div>
                <span className="text-4xl block mt-2">🏆</span>
                <h3 className="mt-4 font-display font-black text-xl text-purple-300">{DIVISIONS[divisionIdx]}</h3>
                
                {winStreak > 0 && (
                  <span className="inline-flex items-center gap-1.5 mt-2 bg-pink-500/25 border border-pink-500/40 text-pink-400 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                    <Zap className="size-3 text-pink-400 animate-bounce" /> Racha x{winStreak}
                  </span>
                )}

                {/* Progress bar to promotion */}
                <div className="mt-8 space-y-2 w-full">
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <span>Progreso de Ascenso</span>
                    <span>{lp}/100 LP</span>
                  </div>
                  <div className="w-full bg-[#0B0816] h-2.5 rounded-full overflow-hidden border border-[#2D1B4E]">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-500" style={{ width: `${lp}%` }} />
                  </div>
                </div>
              </div>
              
              <p className="text-[10px] text-slate-400 leading-relaxed mt-8 max-w-[200px]">
                Enfréntate a rivales 1v1 en partidas rápidas de 5 preguntas. El nivel de dificultad se adaptará automáticamente a tu división.
              </p>
            </div>

            {/* Right Battle Panel & Mode Selector */}
            <div className="md:col-span-2 bg-[#140F27] border-2 border-purple-500/10 rounded-3xl p-8 flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-purple-500 to-pink-500" />
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full font-black uppercase tracking-wider">
                    Arena Premium 1v1
                  </span>
                  <span className="text-xs bg-gradient-to-r from-pink-500 to-purple-500 text-white px-2.5 py-1 rounded-full font-black uppercase tracking-wider animate-pulse">
                    JUEGO JUGABLE ⚔️
                  </span>
                </div>
                
                <div>
                  <h2 className="font-display font-black text-3xl text-slate-100">Selecciona Categoría del Duelo</h2>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Personaliza tu choque de arena. La distribución de temas variará según el modo de estudio elegido.
                  </p>
                </div>

                {/* Mode Selectors */}
                <div className="grid grid-cols-1 gap-3">
                  {[
                    {
                      id: "mixto",
                      name: "Modo Mixto (Por Defecto)",
                      desc: "2 Matemáticas, 1 Historia/Geografía, 1 Inglés, 1 Ciencia (Física/Química/Biología).",
                      icon: <GraduationCap className="size-5" />
                    },
                    {
                      id: "matemáticas",
                      name: "Especialización Matemática",
                      desc: "70% Álgebra avanzada, 20% Aritmética analítica, 10% Preguntas lógicas de velocidad.",
                      icon: <Zap className="size-5" />
                    },
                    {
                      id: "inglés",
                      name: "Competición de Inglés (TOEFL / Cambridge)",
                      desc: "Duelos de gramática, comprensión rápida, vocabulario contextual y condicionales avanzados.",
                      icon: <BookOpen className="size-5" />
                    }
                  ].map((mode) => {
                    const isSelected = gameMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        onClick={() => setGameMode(mode.id as any)}
                        className={`flex items-start gap-4 p-4 rounded-2xl border text-left transition duration-300 cursor-pointer ${
                          isSelected 
                            ? "border-purple-500 bg-purple-500/10 shadow-[0_0_15px_-3px_rgba(168,85,247,0.3)]" 
                            : "border-[#2D1B4E] bg-[#0B0816] hover:bg-[#120D23]"
                        }`}
                      >
                        <div className={`p-2 rounded-xl mt-0.5 ${isSelected ? "bg-purple-500 text-white animate-pulse" : "bg-[#2D1B4E]/30 text-purple-400"}`}>
                          {mode.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className={`text-xs font-bold ${isSelected ? "text-purple-300" : "text-slate-200"}`}>{mode.name}</h4>
                          <p className="text-[10px] text-slate-400 mt-1 leading-normal">{mode.desc}</p>
                        </div>
                        <ChevronRight className={`size-4 mt-2 transition-transform duration-300 ${isSelected ? "text-purple-400 translate-x-1" : "text-slate-600"}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleStartQueue}
                className="w-full h-12 mt-8 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 font-black text-xs uppercase tracking-widest rounded-2xl cursor-pointer border-none transition active:scale-98 shadow-md shadow-purple-500/20"
              >
                Ingresar al Matchmaking
              </button>
            </div>
          </div>
        )}

        {/* MATCHMAKING QUEUE STATE */}
        {gameState === "queue" && (
          <div className="max-w-md mx-auto text-center space-y-6 relative z-10">
            <div className="relative flex justify-center">
              <div className="size-20 rounded-full bg-purple-500/10 border border-purple-500/30 animate-ping absolute" />
              <div className="size-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 grid place-items-center text-white text-3xl font-bold shadow-lg shadow-purple-500/30 z-10">
                ⚔️
              </div>
            </div>
            <div className="space-y-2 animate-pulse">
              <h2 className="font-display font-black text-xl text-purple-300">Buscando Contrincante...</h2>
              <p className="text-xs text-slate-400">Matchmaking inteligente buscando un oponente en {DIVISIONS[divisionIdx]}...</p>
            </div>
          </div>
        )}

        {/* ACTIVE MATCH STATE */}
        {gameState === "match" && currentQuestion && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
            {/* Scoreboard Left */}
            <div className="md:col-span-1 bg-[#140F27] border border-purple-500/10 rounded-3xl p-5 text-center flex flex-col justify-between min-h-[280px] shadow-md">
              <div>
                <span className="text-[10px] font-black uppercase text-purple-400 tracking-widest">Choque de Arena</span>
                
                <div className="mt-4 space-y-3">
                  <div className="bg-[#0B0816] p-3 rounded-xl border border-purple-500/20 text-xs">
                    <span className="block text-slate-400 font-bold uppercase">Tú</span>
                    <span className="text-xl font-black text-white">{playerScore} pts</span>
                  </div>
                  <div className="bg-[#0B0816] p-3 rounded-xl border border-[#4C2E85]/30 text-xs">
                    <span className="block text-slate-400 font-bold uppercase truncate max-w-[120px] mx-auto">{opponentName}</span>
                    <span className="text-xs text-purple-400 font-bold block mb-1">{opponentDivision}</span>
                    <span className="text-xl font-black text-slate-400">{opponentScore} pts</span>
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-purple-300 font-black uppercase tracking-wider border-t border-purple-500/10 pt-3">
                Ronda {matchRound} de 5
              </div>
            </div>

            {/* Question Center Right */}
            <div className="md:col-span-3 bg-[#140F27] border border-purple-500/10 rounded-3xl p-6 space-y-6 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center text-xs text-slate-400 font-bold border-b border-purple-500/10 pb-3">
                  <span className="bg-purple-500/10 text-purple-300 border border-purple-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
                    {currentQuestion.subject} - {currentQuestion.topic}
                  </span>
                  <span className="flex items-center gap-1.5 text-pink-400 font-black">
                    <Timer className="size-4 animate-pulse text-pink-500" /> {timeLeft}s
                  </span>
                </div>

                <div className="mt-6 space-y-4">
                  <p className="text-base font-black text-slate-100 leading-relaxed">{currentQuestion.prompt}</p>

                  {/* Feedback overlay */}
                  {roundFeedback && (
                    <div className="flex flex-col gap-2.5 bg-[#0B0816]/90 border border-purple-500/25 p-4 rounded-2xl text-xs font-bold text-slate-300 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-1.5">
                          <span>Tú:</span>
                          {roundFeedback.playerCorrect ? (
                            <span className="text-emerald-400 flex items-center gap-1">✅ Correcto</span>
                          ) : (
                            <span className="text-rose-500 flex items-center gap-1">❌ Incorrecto</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 border-l border-purple-500/20 pl-6">
                          <span>{opponentName}:</span>
                          {roundFeedback.opponentCorrect ? (
                            <span className="text-emerald-400 flex items-center gap-1">✅ Correcto</span>
                          ) : (
                            <span className="text-rose-500 flex items-center gap-1">❌ Incorrecto</span>
                          )}
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal leading-relaxed border-t border-purple-500/10 pt-2.5 mt-1">
                        <span className="font-bold text-purple-300 block mb-0.5">Explicación Académica:</span>
                        {currentQuestion.explanation}
                      </div>
                    </div>
                  )}

                  {currentQuestion.options && (
                    <div className="grid gap-3 pt-3 text-left">
                      {currentQuestion.options.map((option, idx) => {
                        let btnStyle = "border-[#2D1B4E] bg-[#0B0816] hover:bg-[#1C1538] text-slate-200 border";
                        if (selectedOption !== null) {
                          if (idx === currentQuestion.correctIndex) {
                            btnStyle = "border-emerald-500 bg-emerald-500/20 text-emerald-400 border-2";
                          } else if (idx === selectedOption) {
                            btnStyle = "border-rose-500 bg-rose-500/20 text-rose-400 border-2";
                          } else {
                            btnStyle = "opacity-30 border-[#2D1B4E] bg-[#0B0816]";
                          }
                        }

                        return (
                          <button
                            key={idx}
                            disabled={selectedOption !== null}
                            onClick={() => submitAnswer(idx)}
                            className={`w-full py-3.5 px-5 rounded-2xl text-xs font-bold transition active:scale-[0.99] cursor-pointer text-left ${btnStyle}`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* POST MATCH / RESULTS STATE */}
        {gameState === "postmatch" && (
          <div className="max-w-md mx-auto bg-[#140F27] border-2 border-purple-500/25 rounded-3xl p-8 text-center space-y-6 py-12 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-purple-500 to-pink-500" />
            <div className="size-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white grid place-items-center mx-auto text-4xl shadow-lg shadow-purple-500/20">
              🏁
            </div>
            
            <div className="space-y-1.5">
              <h2 className="font-display font-black text-2xl text-slate-100 uppercase tracking-wide">
                {outcome === "victory" ? "¡Victoria de Arena!" : outcome === "defeat" ? "Derrota" : "Empate de Arena"}
              </h2>
              <p className="text-xs text-slate-400">
                Choque Arena 1v1 contra <strong>{opponentName}</strong> en {gameMode === "mixto" ? "Modo Mixto" : gameMode === "matemáticas" ? "Modo Matemáticas" : "Modo Inglés"}.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto text-xs font-black pt-2">
              <div className="bg-[#0B0816] p-3.5 rounded-xl border border-purple-500/10">
                <span className="block text-slate-400 text-[10px] uppercase mb-1">Puntaje Final</span>
                <span className="text-lg font-black text-slate-100">{playerScore} vs {opponentScore}</span>
              </div>
              <div className="bg-[#0B0816] p-3.5 rounded-xl border border-purple-500/10">
                <span className="block text-slate-400 text-[10px] uppercase mb-1">Resultado LP</span>
                <span className={`text-lg font-black ${outcome === "victory" ? "text-emerald-400" : outcome === "defeat" ? "text-rose-400" : "text-purple-400"}`}>
                  {outcome === "victory" ? "+25 LP" : outcome === "defeat" ? "-15 LP" : "+5 LP"}
                </span>
              </div>
            </div>

            {outcome === "victory" && (
              <div className="flex items-center justify-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 py-2.5 px-4 rounded-xl text-xs font-bold text-emerald-400 max-w-xs mx-auto">
                <img src={streakCap} alt="" className="size-4 shrink-0 select-none animate-bounce" />
                <span>+{winStreak >= 3 ? "25" : "15"} Sombreritos acumulados</span>
              </div>
            )}

            <button
              onClick={() => setGameState("lobby")}
              className="h-11 px-8 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer border-none transition shadow-md shadow-purple-500/20"
            >
              Cerrar y Regresar
            </button>
          </div>
        )}
      </main>
    </>
  );
}
