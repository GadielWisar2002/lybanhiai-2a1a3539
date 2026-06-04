import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { rewardGameCoins } from "@/lib/games.functions";
import { AppHeader } from "@/components/AppHeader";
import { ArrowLeft, Play, ShieldAlert, Trophy, Timer, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { getRandomQuestion, type Question, type Subject, type InteractionType } from "@/lib/question-engine";
import { analyticsEngine } from "@/lib/analytics-engine";

export const Route = createFileRoute("/_authenticated/games/torre-infinita")({
  head: () => ({ meta: [{ title: "Torre Infinita del Saber — Lybanhi" }] }),
  component: TorreInfinitaGame,
});

interface Floor {
  number: number;
  name: string;
  subject: Subject;
  modifier: string;
  modifierDesc: string;
  requiredType?: InteractionType;
  bossEmoji: string;
  bossName: string;
}

const FLOORS_DB: Floor[] = [
  { number: 1, name: "Vestíbulo de Álgebra Básica", subject: "math", modifier: "Tiempo Normal", modifierDesc: "Tienes 45 segundos para contestar.", bossEmoji: "📐", bossName: "Giga-Escuadra" },
  { number: 2, name: "Sótano de Mecánica Clásica", subject: "physics", modifier: "Paso a Paso Obligatorio", modifierDesc: "Debes resolver un problema por partes.", requiredType: "step-by-step", bossEmoji: "🏎️", bossName: "Fisitrón de Fuerza" },
  { number: 3, name: "Laboratorio de Enlaces Químicos", subject: "chemistry", modifier: "Tiempo Acelerado", modifierDesc: "Cuidado: ¡solo tienes 20 segundos!", bossEmoji: "🧪", bossName: "Alquimín de Carga" },
  { number: 4, name: "Jardín Botánico Mendeliando", subject: "biology", modifier: "Relacionar Conceptos", modifierDesc: "Debes unir parejas correctamente.", requiredType: "match-concepts", bossEmoji: "🧬", bossName: "Cromosomín" },
  { number: 5, name: "Cámara del Tiempo Revolucionario", subject: "history", modifier: "Ordenar Procesos", modifierDesc: "Ordena los eventos cronológicamente.", requiredType: "order-process", bossEmoji: "⏳", bossName: "Cronosario Histórico" },
  { number: 6, name: "Observatorio Astrofísico", subject: "physics", modifier: "Comprensión Auditiva", modifierDesc: "Debes escuchar el audio para contestar.", requiredType: "listening", bossEmoji: "🔭", bossName: "Telescopín" },
];

function TorreInfinitaGame() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const rewardCoins = useServerFn(rewardGameCoins);

  const [currentFloorIdx, setCurrentFloorIdx] = useState(0);
  const [gameState, setGameState] = useState<"lobby" | "climbing" | "question" | "victory" | "gameover">("lobby");
  
  // Question & Timer states
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [timeLeft, setTimeLeft] = useState(45);
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
  // Step-by-step
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [stepSelectedOption, setStepSelectedOption] = useState<number | null>(null);

  const currentFloor = FLOORS_DB[currentFloorIdx % FLOORS_DB.length];

  const rewardMutation = useMutation({
    onMutate: () => {},
    mutationFn: (coins: number) => rewardCoins({ data: { coins } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("+10 Sombreritos acumulados en tu cuenta! 🎓");
    },
  });

  // Timer effect
  useEffect(() => {
    if (gameState !== "question" || timeLeft <= 0) {
      if (gameState === "question" && timeLeft === 0) {
        handleIncorrectAnswer();
      }
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(p => p - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, gameState]);

  const speakAudio = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    } else {
      toast.error("Tu navegador no soporta síntesis de voz.");
    }
  };

  const handleStartFloor = () => {
    setGameState("question");
    // Determine timer based on floor modifier
    const limit = currentFloor.modifier === "Tiempo Acelerado" ? 20 : 45;
    setTimeLeft(limit);
    setSelectedOption(null);
    setQuestionStartTime(Date.now());
    
    // Load question based on filters
    const q = getRandomQuestion({
      subject: currentFloor.subject,
      type: currentFloor.requiredType,
    });
    
    setCurrentQuestion(q);

    // Reset interaction states
    setDragDropAnswers({});
    setMatchAnswers({});
    setSelectedTerm(null);
    setStepSelectedOption(null);
    setCurrentStepIdx(0);
    if (q) {
      if (q.type === "fill-blanks") {
        setFillAnswers(new Array(q.correctAnswers.length).fill(""));
      } else if (q.type === "order-process") {
        setOrderedSteps([...q.steps]);
      }
      if (q.type === "listening") {
        // Automatically speak after a delay
        setTimeout(() => speakAudio(q.audioText), 500);
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
      handleCorrectAnswer();
    } else {
      handleIncorrectAnswer();
    }
  };

  const handleCorrectAnswer = () => {
    toast.success("¡Guardión derrotado! Has superado este piso. 🎉");
    if (currentFloorIdx === FLOORS_DB.length - 1) {
      setGameState("victory");
      rewardMutation.mutate(10);
    } else {
      setCurrentFloorIdx(p => p + 1);
      setGameState("climbing");
      setTimeout(() => {
        setGameState("lobby");
      }, 1500);
    }
  };

  const handleIncorrectAnswer = () => {
    toast.error("Respuesta incorrecta. Has caído de la torre.");
    setGameState("gameover");
  };

  // Multiple choice submit
  const handleSelectMC = (idx: number) => {
    if (!currentQuestion || currentQuestion.type !== "multiple-choice") return;
    setSelectedOption(idx);
    const correct = currentQuestion.correctIndex === idx;
    setTimeout(() => submitAnswer(correct), 1000);
  };

  // Drag & Drop handlers
  const handleDrop = (zoneId: string, expectedItem: string) => {
    if (!draggedItem) return;
    setDragDropAnswers(prev => ({
      ...prev,
      [zoneId]: draggedItem
    }));
    setDraggedItem(null);
  };

  const checkDragDrop = () => {
    if (!currentQuestion || currentQuestion.type !== "drag-drop") return;
    let allCorrect = true;
    currentQuestion.dropZones.forEach(zone => {
      if (dragDropAnswers[zone.id] !== zone.expectedItem) {
        allCorrect = false;
      }
    });
    submitAnswer(allCorrect);
  };

  // Match Concepts handlers
  const handleSelectTerm = (term: string) => {
    setSelectedTerm(term);
  };

  const handleSelectDefinition = (def: string) => {
    if (!selectedTerm || !currentQuestion || currentQuestion.type !== "match-concepts") return;
    setMatchAnswers(prev => ({
      ...prev,
      [selectedTerm]: def
    }));
    setSelectedTerm(null);
  };

  const checkMatchConcepts = () => {
    if (!currentQuestion || currentQuestion.type !== "match-concepts") return;
    let allCorrect = true;
    currentQuestion.pairs.forEach(pair => {
      if (matchAnswers[pair.term] !== pair.definition) {
        allCorrect = false;
      }
    });
    submitAnswer(allCorrect);
  };

  // Fill blanks submit
  const checkFillBlanks = () => {
    if (!currentQuestion || currentQuestion.type !== "fill-blanks") return;
    let allCorrect = true;
    currentQuestion.correctAnswers.forEach((ans, idx) => {
      if (fillAnswers[idx]?.trim().toLowerCase() !== ans.toLowerCase()) {
        allCorrect = false;
      }
    });
    submitAnswer(allCorrect);
  };

  // Order process handlers
  const moveStep = (fromIdx: number, toIdx: number) => {
    const list = [...orderedSteps];
    const [moved] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, moved);
    setOrderedSteps(list);
  };

  const checkOrderProcess = () => {
    if (!currentQuestion || currentQuestion.type !== "order-process") return;
    let allCorrect = true;
    orderedSteps.forEach((step, idx) => {
      if (step !== currentQuestion.correctOrder[idx]) {
        allCorrect = false;
      }
    });
    submitAnswer(allCorrect);
  };

  // Step-by-step handlers
  const handleSelectStepOption = (idx: number) => {
    if (!currentQuestion || currentQuestion.type !== "step-by-step") return;
    setStepSelectedOption(idx);
    const step = currentQuestion.steps[currentStepIdx];
    const isCorrect = step.correctIndex === idx;
    
    setTimeout(() => {
      if (isCorrect) {
        if (currentStepIdx === currentQuestion.steps.length - 1) {
          submitAnswer(true);
        } else {
          setCurrentStepIdx(p => p + 1);
          setStepSelectedOption(null);
        }
      } else {
        submitAnswer(false);
      }
    }, 1000);
  };

  // Reading submit
  const handleSelectReading = (idx: number) => {
    if (!currentQuestion || currentQuestion.type !== "reading") return;
    setSelectedOption(idx);
    const correct = currentQuestion.correctIndex === idx;
    setTimeout(() => submitAnswer(correct), 1000);
  };

  // Listening submit
  const handleSelectListening = (idx: number) => {
    if (!currentQuestion || currentQuestion.type !== "listening") return;
    setSelectedOption(idx);
    const correct = currentQuestion.correctIndex === idx;
    setTimeout(() => submitAnswer(correct), 1000);
  };

  const handleResetGame = () => {
    setCurrentFloorIdx(0);
    setGameState("lobby");
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#080D24]/90 backdrop-blur-xl border-b border-[#1E2D5A] px-6 py-4 flex items-center justify-between text-white">
        <button onClick={() => navigate({ to: "/games" })} className="text-[#8896B3] hover:text-white font-bold flex items-center gap-1.5 cursor-pointer bg-transparent border-none">
          <ArrowLeft className="size-5" /> Atrás
        </button>
        <h1 className="font-display text-lg font-bold">Torre Infinita del Saber</h1>
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Trophy className="size-4 text-yellow-400" />
          <span>Supervivencia Vertical</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 pt-6 pb-24 text-white min-h-[calc(100vh-64px)] bg-[#080D24]">
        {gameState === "lobby" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tower visual climb indicator */}
            <div className="md:col-span-1 bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-6 flex flex-col justify-end space-y-4 min-h-[300px]">
              <h4 className="text-xs uppercase font-bold text-slate-400 border-b border-[#1E2D5A] pb-2">Estructura de la Torre</h4>
              <div className="space-y-2 flex flex-col-reverse">
                {FLOORS_DB.map((fl, idx) => {
                  const isActive = idx === currentFloorIdx;
                  const isCompleted = idx < currentFloorIdx;
                  return (
                    <div
                      key={fl.number}
                      className={`p-3 rounded-xl border text-center transition flex justify-between items-center ${
                        isActive
                          ? "bg-primary border-primary text-white scale-105 font-bold shadow-lg"
                          : isCompleted
                          ? "bg-emerald-600/10 border-emerald-500/20 text-emerald-400"
                          : "bg-[#17224D]/30 border-[#1E2D5A]/50 text-slate-400"
                      }`}
                    >
                      <span className="text-xs">Piso {fl.number}</span>
                      <span className="text-xs truncate max-w-[120px]">{fl.name}</span>
                      <span className="text-sm select-none">{fl.bossEmoji}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected floor summary and start game */}
            <div className="md:col-span-2 bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <span className="text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase">
                  Piso Actual: {currentFloor.number}
                </span>
                <h2 className="mt-3 font-display font-black text-2xl text-white">{currentFloor.name}</h2>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Te enfrentarás a <strong>{currentFloor.bossName}</strong> para defender la integridad intelectual de este piso de la torre.
                </p>

                <div className="mt-6 bg-[#17224D]/60 border border-[#3B6DE8]/10 rounded-2xl p-4 space-y-2">
                  <span className="text-xs font-bold text-[#3B6DE8] flex items-center gap-1">
                    ⚡ Modificador Activo: {currentFloor.modifier}
                  </span>
                  <p className="text-xs text-slate-400">{currentFloor.modifierDesc}</p>
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <button
                  onClick={handleStartFloor}
                  className="w-full h-12 bg-primary hover:bg-primary-glow font-bold text-xs tracking-wider rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition border-none"
                >
                  <Play className="size-4" /> Entrar al Piso {currentFloor.number}
                </button>
              </div>
            </div>
          </div>
        )}

        {gameState === "climbing" && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <span className="text-6xl animate-bounce">🚀</span>
            <h2 className="font-display font-black text-2xl text-primary">Asciendes al Piso {currentFloor.number}...</h2>
            <p className="text-xs text-slate-400">Prepara tu mente para el siguiente desafío académico.</p>
          </div>
        )}

        {gameState === "question" && currentQuestion && (
          <div className="max-w-2xl mx-auto bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-6 space-y-6">
            <div className="flex justify-between items-center text-xs text-slate-400 font-bold border-b border-[#1E2D5A] pb-3">
              <span className="bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full uppercase">
                {currentQuestion.subject} - {currentQuestion.topic}
              </span>
              <span className="flex items-center gap-1 text-cyan-400">
                <Timer className="size-4 animate-pulse" /> {timeLeft}s
              </span>
            </div>

            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-200">{currentQuestion.prompt}</h3>

              {/* 1. Multiple choice UI */}
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

              {/* 2. Drag & Drop UI */}
              {currentQuestion.type === "drag-drop" && (
                <div className="space-y-4 pt-3">
                  <div className="flex justify-center gap-3">
                    {currentQuestion.dragItems.map((item, idx) => {
                      const isUsed = Object.values(dragDropAnswers).includes(item);
                      return (
                        <div
                          key={idx}
                          draggable
                          onDragStart={() => setDraggedItem(item)}
                          onClick={() => setDraggedItem(item)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold cursor-grab active:cursor-grabbing select-none ${
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
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => handleDrop(zone.id, zone.expectedItem)}
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

              {/* 3. Match Concepts UI */}
              {currentQuestion.type === "match-concepts" && (
                <div className="space-y-4 pt-3">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Left Column: Terms */}
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

                    {/* Right Column: Definitions */}
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

                  {selectedTerm && (
                    <p className="text-[10px] text-orange-400 font-bold text-center">
                      Uniendo "{selectedTerm}". Haz clic en su definición correcta.
                    </p>
                  )}

                  <button
                    onClick={checkMatchConcepts}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 font-bold text-xs rounded-xl cursor-pointer border-none transition"
                  >
                    Verificar Relaciones
                  </button>
                </div>
              )}

              {/* 4. Fill Blanks UI */}
              {currentQuestion.type === "fill-blanks" && (
                <div className="space-y-4 pt-3">
                  <div className="p-4 rounded-xl border border-[#1E2D5A] bg-[#17224D]/30 leading-relaxed text-sm text-slate-300">
                    {/* Render with input slots */}
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
                            placeholder={`Vacío ${blankIdx + 1}`}
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

              {/* 5. Order Process UI */}
              {currentQuestion.type === "order-process" && (
                <div className="space-y-4 pt-3">
                  <p className="text-[10px] text-slate-400 font-bold">Ordena la secuencia utilizando los botones de movimiento:</p>
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

              {/* 6. Step-by-step UI */}
              {currentQuestion.type === "step-by-step" && (
                <div className="space-y-4 pt-3 text-left">
                  <div className="flex justify-between items-center text-xs text-slate-400 font-semibold mb-2">
                    <span>Etapa {currentStepIdx + 1} de {currentQuestion.steps.length}</span>
                    <span className="text-[#3B6DE8]">Paso a paso</span>
                  </div>
                  
                  <div className="p-4 bg-[#17224D]/40 border border-[#3B6DE8]/10 rounded-xl">
                    <p className="text-xs text-slate-300 font-bold">{currentQuestion.steps[currentStepIdx].prompt}</p>
                  </div>

                  <div className="grid gap-2 pt-2">
                    {currentQuestion.steps[currentStepIdx].options.map((option, idx) => {
                      let btnStyle = "border-border bg-card text-foreground hover:bg-muted/40";
                      if (stepSelectedOption !== null) {
                        if (idx === currentQuestion.steps[currentStepIdx].correctIndex) {
                          btnStyle = "border-emerald-500 bg-emerald-600/20 text-emerald-400";
                        } else if (idx === stepSelectedOption) {
                          btnStyle = "border-red-500 bg-red-600/20 text-red-400";
                        } else {
                          btnStyle = "opacity-40 border-border bg-card";
                        }
                      }

                      return (
                        <button
                          key={idx}
                          disabled={stepSelectedOption !== null}
                          onClick={() => handleSelectStepOption(idx)}
                          className={`w-full py-2.5 px-3 rounded-lg border text-xs text-left font-semibold transition cursor-pointer active:scale-98 ${btnStyle}`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 7. Reading UI */}
              {currentQuestion.type === "reading" && (
                <div className="space-y-4 pt-3 text-left">
                  <div className="p-4 rounded-xl bg-slate-900 border border-[#1E2D5A] text-xs leading-relaxed text-slate-300 max-h-[160px] overflow-y-auto font-mono scrollbar-thin">
                    {currentQuestion.readingText}
                  </div>
                  
                  <div className="grid gap-3 pt-2">
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
                          onClick={() => handleSelectReading(idx)}
                          className={`w-full py-3 px-4 rounded-xl border text-xs font-semibold text-left transition active:scale-98 cursor-pointer ${btnStyle}`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 8. Listening UI */}
              {currentQuestion.type === "listening" && (
                <div className="space-y-4 pt-3 text-center">
                  <div className="flex justify-center">
                    <button
                      onClick={() => speakAudio(currentQuestion.audioText)}
                      className="size-16 rounded-full bg-primary/20 border border-primary/40 hover:bg-primary/30 flex items-center justify-center cursor-pointer transition active:scale-90 text-white"
                    >
                      <Volume2 className="size-8 text-primary animate-pulse" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">Escucha con atención y responde:</p>

                  <div className="grid gap-3 pt-2 text-left">
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
                          onClick={() => handleSelectListening(idx)}
                          className={`w-full py-3 px-4 rounded-xl border text-xs font-semibold text-left transition active:scale-98 cursor-pointer ${btnStyle}`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {gameState === "victory" && (
          <div className="max-w-md mx-auto bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-6 text-center space-y-6 py-12">
            <div className="size-20 rounded-full bg-emerald-500/10 text-emerald-400 grid place-items-center mx-auto text-5xl">🏰</div>
            <h2 className="font-display font-black text-2xl text-emerald-400">¡Torre Conquistada!</h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              Has derrotado a todos los guardianes de los pisos superiores y protegido el ecosistema del conocimiento. ¡Tu agilidad mental es legendaria!
            </p>
            <div className="bg-[#17224D] max-w-xs mx-auto p-4 rounded-2xl border border-[#3B6DE8]/10 text-xs font-bold text-slate-300">
              Recompensa Global: +10 Sombreritos
            </div>
            <button
              onClick={handleResetGame}
              className="h-11 px-6 bg-primary hover:bg-primary-glow font-bold text-xs rounded-xl cursor-pointer border-none transition"
            >
              Comenzar de nuevo
            </button>
          </div>
        )}

        {gameState === "gameover" && (
          <div className="max-w-md mx-auto bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-6 text-center space-y-6 py-12">
            <div className="size-20 rounded-full bg-red-500/10 text-red-400 grid place-items-center mx-auto text-4xl">
              <ShieldAlert className="size-10 text-red-400 animate-pulse" />
            </div>
            <h2 className="font-display font-black text-2xl text-red-400">Has Caído de la Torre</h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              Te quedaste sin tiempo o respondiste incorrectamente. No te preocupes, ¡la torre siempre espera a los estudiosos decididos!
            </p>
            <button
              onClick={handleResetGame}
              className="h-11 px-6 bg-[#1E3A8A] hover:bg-[#2D5BE3] border border-[#3B6DE8] rounded-xl font-bold text-xs tracking-wider transition cursor-pointer text-white"
            >
              Intentar de Nuevo
            </button>
          </div>
        )}
      </main>
    </>
  );
}
