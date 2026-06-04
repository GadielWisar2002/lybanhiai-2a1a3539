import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { rewardGameCoins } from "@/lib/games.functions";
import { AppHeader } from "@/components/AppHeader";
import { ArrowLeft, Clock, HelpCircle, Lock, Unlock, Key, Trophy, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { getRandomQuestion, type Question } from "@/lib/question-engine";
import { analyticsEngine } from "@/lib/analytics-engine";

export const Route = createFileRoute("/_authenticated/games/escape-room")({
  head: () => ({ meta: [{ title: "Escape Room Educativo — Lybanhi" }] }),
  component: EscapeRoomGame,
});

interface Puzzle {
  id: string;
  name: string;
  targetObject: string;
  solved: boolean;
  questionSubject: "math" | "physics" | "chemistry" | "biology" | "history" | "programming";
}

interface EscapeRoom {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  puzzles: Puzzle[];
}

const ROOMS_DB: EscapeRoom[] = [
  {
    id: "chemical-lab",
    name: "Laboratorio Químico",
    icon: "🧪",
    color: "from-emerald-900/60 to-cyan-950/80 border-emerald-500/20",
    description: "Una neblina ácida cubre la sala. Debes descifrar los enlaces moleculares y el código de la caja fuerte de reactivos.",
    puzzles: [
      { id: "p_chem_1", name: "La Pizarra de Fórmulas", targetObject: "Pizarra", solved: false, questionSubject: "chemistry" },
      { id: "p_chem_2", name: "La Caja de Reactivos", targetObject: "Caja Fuerte", solved: false, questionSubject: "chemistry" },
    ],
  },
  {
    id: "observatory",
    name: "Gran Observatorio",
    icon: "🔭",
    color: "from-blue-900/60 to-indigo-950/80 border-blue-500/20",
    description: "El telescopio principal está desalineado y la consola lógica bloqueada por ecuaciones de órbitas.",
    puzzles: [
      { id: "p_obs_1", name: "Lente del Telescopio", targetObject: "Lente", solved: false, questionSubject: "physics" },
      { id: "p_obs_2", name: "Consola de Coordenadas", targetObject: "Consola", solved: false, questionSubject: "math" },
    ],
  },
  {
    id: "library",
    name: "Biblioteca Central",
    icon: "📚",
    color: "from-amber-900/60 to-yellow-950/80 border-amber-500/20",
    description: "El diario de Justo Sierra tiene páginas encriptadas. Ordena los eventos de la Revolución para revelar la salida.",
    puzzles: [
      { id: "p_lib_1", name: "El Diario del Historiador", targetObject: "Diario", solved: false, questionSubject: "history" },
      { id: "p_lib_2", name: "El Librero Secreto", targetObject: "Estantería", solved: false, questionSubject: "programming" },
    ],
  },
];

function EscapeRoomGame() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const rewardCoins = useServerFn(rewardGameCoins);

  const [activeRoomIdx, setActiveRoomIdx] = useState(0);
  const [rooms, setRooms] = useState<EscapeRoom[]>(ROOMS_DB);
  const [gameState, setGameState] = useState<"intro" | "exploring" | "puzzle" | "escaped" | "gameover">("intro");
  
  // Active Puzzle States
  const [activePuzzle, setActivePuzzle] = useState<Puzzle | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState(0);
  
  // Custom Interaction States
  // Drag & drop
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragDropAnswers, setDragDropAnswers] = useState<Record<string, string>>({}); // zoneId -> draggedItem
  // Match concepts
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [matchAnswers, setMatchAnswers] = useState<Record<string, string>>({}); // term -> definition
  // Fill blanks
  const [fillAnswers, setFillAnswers] = useState<string[]>([]);
  // Order process
  const [orderedSteps, setOrderedSteps] = useState<string[]>([]);

  // Global Room Timer (300s = 5m)
  const [globalTime, setGlobalTime] = useState(300);

  const activeRoom = rooms[activeRoomIdx];

  const rewardMutation = useMutation({
    mutationFn: (coins: number) => rewardCoins({ data: { coins } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("¡Felicidades! +15 Sombreritos ganados por escapar. 🎓");
    },
  });

  // Global timer effect
  useEffect(() => {
    if (gameState === "intro" || gameState === "escaped" || gameState === "gameover") return;
    if (globalTime <= 0) {
      setGameState("gameover");
      return;
    }
    const timer = setInterval(() => {
      setGlobalTime(p => p - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [globalTime, gameState]);

  const handleStartGame = () => {
    setRooms(JSON.parse(JSON.stringify(ROOMS_DB))); // Reset state
    setActiveRoomIdx(0);
    setGlobalTime(300);
    setGameState("exploring");
  };

  const handleSelectObject = (puzzle: Puzzle) => {
    if (puzzle.solved) return;
    setActivePuzzle(puzzle);
    setGameState("puzzle");
    setSelectedOption(null);
    setQuestionStartTime(Date.now());

    // Pull from question engine
    const q = getRandomQuestion({ subject: puzzle.questionSubject });
    setCurrentQuestion(q);

    // Reset interaction states
    setDragDropAnswers({});
    setMatchAnswers({});
    setSelectedTerm(null);
    if (q) {
      if (q.type === "fill-blanks") {
        setFillAnswers(new Array(q.correctAnswers.length).fill(""));
      } else if (q.type === "order-process") {
        setOrderedSteps([...q.steps]);
      }
    }
  };

  const submitAnswer = (isCorrect: boolean) => {
    const timeTaken = Date.now() - questionStartTime;
    if (currentQuestion) {
      analyticsEngine.trackAnswer(
        currentQuestion.subject,
        currentQuestion.topic,
        isCorrect,
        timeTaken,
        currentQuestion.id
      );
    }

    if (isCorrect) {
      toast.success(`¡Desbloqueado! El acertijo de la ${activePuzzle?.targetObject} se resolvió.`);
      
      // Update puzzle to solved
      const updatedRooms = rooms.map((room, rIdx) => {
        if (rIdx === activeRoomIdx) {
          const updatedPuzzles = room.puzzles.map(p => {
            if (p.id === activePuzzle?.id) {
              return { ...p, solved: true };
            }
            return p;
          });
          return { ...room, puzzles: updatedPuzzles };
        }
        return room;
      });
      setRooms(updatedRooms);
      setGameState("exploring");
      
      // Check if all puzzles in current room are solved
      const allSolved = updatedRooms[activeRoomIdx].puzzles.every(p => p.solved);
      if (allSolved) {
        if (activeRoomIdx === rooms.length - 1) {
          setGameState("escaped");
          rewardMutation.mutate(15);
        } else {
          toast.success(`🚪 ¡Habitación completada! Pasas a la siguiente.`);
          setActiveRoomIdx(p => p + 1);
        }
      }
    } else {
      toast.error("Error. La alarma se activó y perdiste 30 segundos.");
      setGlobalTime(p => Math.max(0, p - 30));
      setGameState("exploring");
    }

    setActivePuzzle(null);
    setCurrentQuestion(null);
  };

  // Multiple Choice handler
  const handleSelectMC = (idx: number) => {
    if (!currentQuestion || currentQuestion.type !== "multiple-choice") return;
    setSelectedOption(idx);
    const correct = currentQuestion.correctIndex === idx;
    setTimeout(() => submitAnswer(correct), 1000);
  };

  // Drag & Drop
  const handleDrop = (zoneId: string, expectedItem: string) => {
    if (!draggedItem) return;
    setDragDropAnswers(prev => ({ ...prev, [zoneId]: draggedItem }));
    setDraggedItem(null);
  };

  const checkDragDrop = () => {
    if (!currentQuestion || currentQuestion.type !== "drag-drop") return;
    let correct = true;
    currentQuestion.dropZones.forEach(zone => {
      if (dragDropAnswers[zone.id] !== zone.expectedItem) {
        correct = false;
      }
    });
    submitAnswer(correct);
  };

  // Match Concepts
  const handleSelectTerm = (term: string) => {
    setSelectedTerm(term);
  };

  const handleSelectDefinition = (def: string) => {
    if (!selectedTerm || !currentQuestion || currentQuestion.type !== "match-concepts") return;
    setMatchAnswers(prev => ({ ...prev, [selectedTerm]: def }));
    setSelectedTerm(null);
  };

  const checkMatchConcepts = () => {
    if (!currentQuestion || currentQuestion.type !== "match-concepts") return;
    let correct = true;
    currentQuestion.pairs.forEach(pair => {
      if (matchAnswers[pair.term] !== pair.definition) {
        correct = false;
      }
    });
    submitAnswer(correct);
  };

  // Fill blanks
  const checkFillBlanks = () => {
    if (!currentQuestion || currentQuestion.type !== "fill-blanks") return;
    let correct = true;
    currentQuestion.correctAnswers.forEach((ans, idx) => {
      if (fillAnswers[idx]?.trim().toLowerCase() !== ans.toLowerCase()) {
        correct = false;
      }
    });
    submitAnswer(correct);
  };

  // Order process
  const moveStep = (fromIdx: number, toIdx: number) => {
    const list = [...orderedSteps];
    const [moved] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, moved);
    setOrderedSteps(list);
  };

  const checkOrderProcess = () => {
    if (!currentQuestion || currentQuestion.type !== "order-process") return;
    let correct = true;
    orderedSteps.forEach((step, idx) => {
      if (step !== currentQuestion.correctOrder[idx]) {
        correct = false;
      }
    });
    submitAnswer(correct);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? "0" : ""}${remainder}`;
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#080D24]/90 backdrop-blur-xl border-b border-[#1E2D5A] px-6 py-4 flex items-center justify-between text-white">
        <button onClick={() => navigate({ to: "/games" })} className="text-[#8896B3] hover:text-white font-bold flex items-center gap-1.5 cursor-pointer bg-transparent border-none">
          <ArrowLeft className="size-5" /> Atrás
        </button>
        <h1 className="font-display text-lg font-bold">Escape Room Educativo</h1>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
          <Clock className="size-4 animate-pulse" />
          <span>{formatTime(globalTime)}</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 pt-6 pb-24 text-white min-h-[calc(100vh-64px)] bg-[#080D24] flex flex-col justify-center">
        {gameState === "intro" && (
          <div className="max-w-md mx-auto bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-6 text-center space-y-6">
            <span className="text-6xl select-none">🗝️</span>
            <h2 className="font-display font-black text-2xl text-white">Escape Room Científico</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Quedaste atrapado en los laboratorios de la universidad. Deberás interactuar con el entorno y resolver los acertijos académicos antes de que el reloj llegue a cero.
            </p>
            <div className="bg-[#17224D]/60 p-4 border border-[#3B6DE8]/10 rounded-2xl text-xs text-left text-slate-300 space-y-2">
              <span className="font-bold text-primary block">Reglas de Juego:</span>
              <p>⏱ 5 minutos en total para escapar de las 3 habitaciones.</p>
              <p>⚠️ Responder incorrectamente activa una alarma y te descuenta 30 segundos.</p>
            </div>
            <button
              onClick={handleStartGame}
              className="w-full h-12 bg-primary hover:bg-primary-glow font-bold text-xs tracking-wider rounded-2xl cursor-pointer border-none transition"
            >
              Comenzar Escape
            </button>
          </div>
        )}

        {gameState === "exploring" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Room description & status */}
            <div className="md:col-span-1 space-y-4">
              <div className={`rounded-3xl border bg-gradient-to-br ${activeRoom.color} p-6 space-y-4`}>
                <span className="text-5xl select-none block">{activeRoom.icon}</span>
                <h3 className="font-display font-black text-xl">{activeRoom.name}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{activeRoom.description}</p>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Habitación {activeRoomIdx + 1} de {rooms.length}
                </div>
              </div>
            </div>

            {/* Room Clickable Objects Canvas */}
            <div className="md:col-span-2 bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-6 flex flex-col justify-between min-h-[320px]">
              <div>
                <h4 className="text-xs uppercase font-bold text-slate-400 border-b border-[#1E2D5A] pb-2 mb-4">
                  Interactúa con los Objetos:
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {activeRoom.puzzles.map(puzzle => (
                    <button
                      key={puzzle.id}
                      onClick={() => handleSelectObject(puzzle)}
                      className={`h-28 rounded-2xl border p-4 text-left transition flex flex-col justify-between cursor-pointer ${
                        puzzle.solved
                          ? "bg-emerald-600/10 border-emerald-500/20 text-emerald-400 cursor-default"
                          : "bg-[#17224D] border-[#3B6DE8]/10 hover:border-primary text-white"
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-xs font-bold uppercase text-slate-400">{puzzle.targetObject}</span>
                        {puzzle.solved ? <Unlock className="size-4" /> : <Lock className="size-4" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">{puzzle.name}</h4>
                        <span className="text-[9px] text-slate-400 block mt-1 uppercase">Materia: {puzzle.questionSubject}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-4">
                💡 Haz clic sobre los objetos bloqueados de la habitación para abrir el panel de acertijos.
              </p>
            </div>
          </div>
        )}

        {gameState === "puzzle" && currentQuestion && (
          <div className="max-w-2xl mx-auto bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-6 space-y-6">
            <div className="flex justify-between items-center text-xs text-slate-400 font-bold border-b border-[#1E2D5A] pb-3">
              <span className="text-[#3B6DE8] font-bold">Acertijo: {activePuzzle?.name} ({activePuzzle?.targetObject})</span>
              <span className="bg-primary/20 text-primary px-2.5 py-0.5 rounded-full uppercase">
                {currentQuestion.subject}
              </span>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-bold text-slate-200">{currentQuestion.prompt}</p>

              {/* Multiple Choice UI */}
              {currentQuestion.type === "multiple-choice" && (
                <div className="grid gap-3 pt-3">
                  {currentQuestion.options.map((option, idx) => {
                    let btnStyle = "border-border bg-card text-foreground hover:bg-muted/40";
                    if (selectedOption !== null) {
                      if (idx === currentQuestion.correctIndex) {
                        btnStyle = "border-emerald-500 bg-emerald-600/20 text-emerald-400";
                      } else if (idx === selectedOption) {
                        btnStyle = "border-red-500 bg-red-600/20 text-red-400";
                      } else {
                        btnStyle = "opacity-40 border-border bg-card";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        disabled={selectedOption !== null}
                        onClick={() => handleSelectMC(idx)}
                        className={`w-full py-3 px-4 rounded-xl border text-xs font-semibold text-left transition active:scale-98 cursor-pointer ${btnStyle}`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Drag & Drop UI */}
              {currentQuestion.type === "drag-drop" && (
                <div className="space-y-4 pt-3">
                  <div className="flex justify-center gap-3">
                    {currentQuestion.dragItems.map((item, idx) => {
                      const isUsed = Object.values(dragDropAnswers).includes(item);
                      return (
                        <div
                          key={idx}
                          onClick={() => setDraggedItem(item)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer select-none ${
                            isUsed ? "opacity-30 pointer-events-none" : "bg-primary border-primary text-white"
                          }`}
                        >
                          {item}
                        </div>
                      );
                    })}
                  </div>

                  {draggedItem && (
                    <p className="text-[10px] text-orange-400 font-bold text-center">
                      Concepto seleccionado: {draggedItem}. Haz clic en la zona vacía abajo para colocarlo.
                    </p>
                  )}

                  <div className="grid gap-3 pt-2">
                    {currentQuestion.dropZones.map((zone, idx) => {
                      const filled = dragDropAnswers[zone.id];
                      return (
                        <div
                          key={idx}
                          onClick={() => handleDrop(zone.id, zone.expectedItem)}
                          className="p-4 rounded-xl border border-dashed border-[#1E2D5A] bg-[#17224D]/30 flex justify-between items-center cursor-pointer hover:bg-[#17224D]/50"
                        >
                          <span className="text-xs font-bold text-slate-300">{zone.label}</span>
                          <div className={`px-4 py-2 rounded-lg text-xs font-black ${
                            filled ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-500 border border-slate-700"
                          }`}>
                            {filled || "Soltar aquí"}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={checkDragDrop}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 font-bold text-xs rounded-xl cursor-pointer border-none transition"
                  >
                    Confirmar Combinación
                  </button>
                </div>
              )}

              {/* Match Concepts UI */}
              {currentQuestion.type === "match-concepts" && (
                <div className="space-y-4 pt-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-400 font-bold block">Términos</span>
                      {currentQuestion.pairs.map(pair => {
                        const matchedDef = matchAnswers[pair.term];
                        const isSelected = selectedTerm === pair.term;
                        return (
                          <button
                            key={pair.term}
                            onClick={() => handleSelectTerm(pair.term)}
                            className={`w-full py-2.5 px-3 rounded-lg border text-xs text-left font-bold transition ${
                              matchedDef
                                ? "bg-emerald-600/10 border-emerald-500/30 text-emerald-400"
                                : isSelected
                                ? "bg-primary border-primary text-white"
                                : "bg-[#17224D] border-[#3B6DE8]/20 text-slate-300"
                            }`}
                          >
                            {pair.term} {matchedDef && "✓"}
                          </button>
                        );
                      })}
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-400 font-bold block">Definición</span>
                      {currentQuestion.pairs.map(pair => {
                        const isMatched = Object.values(matchAnswers).includes(pair.definition);
                        return (
                          <button
                            key={pair.definition}
                            disabled={isMatched}
                            onClick={() => handleSelectDefinition(pair.definition)}
                            className={`w-full py-2.5 px-3 rounded-lg border text-[10px] text-left leading-relaxed transition ${
                              isMatched
                                ? "opacity-30 border-slate-700 bg-slate-800 text-slate-500 cursor-not-allowed"
                                : "bg-[#17224D] border-[#3B6DE8]/20 text-slate-300 hover:border-primary cursor-pointer"
                            }`}
                          >
                            {pair.definition}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={checkMatchConcepts}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 font-bold text-xs rounded-xl cursor-pointer border-none transition"
                  >
                    Verificar Relaciones
                  </button>
                </div>
              )}

              {/* Fill Blanks UI */}
              {currentQuestion.type === "fill-blanks" && (
                <div className="space-y-4 pt-3">
                  <div className="p-4 rounded-xl border border-[#1E2D5A] bg-[#17224D]/30 leading-relaxed text-sm text-slate-300">
                    {currentQuestion.textWithBlanks.split(/(\[blank\d+\])/g).map((chunk, idx) => {
                      const match = chunk.match(/\[blank(\d+)\]/);
                      if (match) {
                        const blankIdx = parseInt(match[1]) - 1;
                        return (
                          <input
                            key={idx}
                            type="text"
                            value={fillAnswers[blankIdx] || ""}
                            onChange={(e) => {
                              const updated = [...fillAnswers];
                              updated[blankIdx] = e.target.value;
                              setFillAnswers(updated);
                            }}
                            className="w-24 mx-1.5 h-7 px-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-center text-white focus:outline-none focus:border-primary"
                          />
                        );
                      }
                      return <span key={idx}>{chunk}</span>;
                    })}
                  </div>

                  <button
                    onClick={checkFillBlanks}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 font-bold text-xs rounded-xl cursor-pointer border-none transition"
                  >
                    Comprobar Texto
                  </button>
                </div>
              )}

              {/* Order Process UI */}
              {currentQuestion.type === "order-process" && (
                <div className="space-y-4 pt-3">
                  <div className="space-y-2">
                    {orderedSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[#17224D] border border-[#3B6DE8]/10 rounded-xl flex justify-between items-center"
                      >
                        <span className="text-xs text-slate-300 font-bold">{idx + 1}. {step}</span>
                        <div className="flex gap-1.5">
                          <button
                            disabled={idx === 0}
                            onClick={() => moveStep(idx, idx - 1)}
                            className="size-7 grid place-items-center bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg cursor-pointer border-none disabled:opacity-30 disabled:cursor-not-allowed font-bold"
                          >
                            ▲
                          </button>
                          <button
                            disabled={idx === orderedSteps.length - 1}
                            onClick={() => moveStep(idx, idx + 1)}
                            className="size-7 grid place-items-center bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg cursor-pointer border-none disabled:opacity-30 disabled:cursor-not-allowed font-bold"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={checkOrderProcess}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 font-bold text-xs rounded-xl cursor-pointer border-none transition"
                  >
                    Comprobar Orden
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {gameState === "escaped" && (
          <div className="max-w-md mx-auto bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-6 text-center space-y-6 py-12 animate-in zoom-in-95">
            <div className="size-20 rounded-full bg-emerald-500/10 text-emerald-400 grid place-items-center mx-auto text-5xl">🗝️</div>
            <h2 className="font-display font-black text-2xl text-emerald-400">¡Has Escapado con Éxito!</h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              Has resuelto todos los misterios académicos de las 3 salas y abierto la puerta del vestíbulo. ¡Un desempeño digno de un maestro!
            </p>
            <div className="bg-[#17224D] max-w-xs mx-auto p-4 rounded-2xl border border-[#3B6DE8]/10 text-xs font-bold text-slate-300">
              Recompensa Global: +15 Sombreritos
            </div>
            <button
              onClick={handleStartGame}
              className="h-11 px-6 bg-primary hover:bg-primary-glow font-bold text-xs rounded-xl cursor-pointer border-none transition"
            >
              Jugar de Nuevo
            </button>
          </div>
        )}

        {gameState === "gameover" && (
          <div className="max-w-md mx-auto bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-6 text-center space-y-6 py-12">
            <div className="size-20 rounded-full bg-red-500/10 text-red-400 grid place-items-center mx-auto text-5xl">⏱️</div>
            <h2 className="font-display font-black text-2xl text-red-400">El Tiempo se Agotó</h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              La alarma de seguridad del campus se activó antes de que pudieras resolver todos los acertijos. ¡No te rindas y repasa las notas de estudio!
            </p>
            <button
              onClick={handleStartGame}
              className="h-11 px-6 bg-[#1E3A8A] hover:bg-[#2D5BE3] border border-[#3B6DE8] rounded-xl font-bold text-xs tracking-wider transition cursor-pointer text-white"
            >
              Volver a Intentar
            </button>
          </div>
        )}
      </main>
    </>
  );
}
