import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { rewardGameCoins } from "@/lib/games.functions";
import { AppHeader } from "@/components/AppHeader";
import { ArrowLeft, Play, ShieldAlert, Sparkles, Trophy, Timer, Volume2, BookOpen, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { getQuestionsByFilters, type Question, type Level } from "@/lib/question-engine";
import { analyticsEngine } from "@/lib/analytics-engine";

export const Route = createFileRoute("/_authenticated/games/simulador-examenes")({
  head: () => ({ meta: [{ title: "Simulador de Exámenes — Lybanhi" }] }),
  component: SimuladorExamenesGame,
});

interface ExamConfig {
  id: string;
  name: string;
  level: Level;
  subjectFilters?: string[];
  description: string;
  durationSeconds: number;
}

const EXAMS_DB: ExamConfig[] = [
  { id: "sec", name: "Secundaria (Prueba de Egreso)", level: "secundaria", description: "Mide competencias básicas en Matemáticas, Geografía y Lógica.", durationSeconds: 120 },
  { id: "prep", name: "Preparatoria (Examen de Colocación)", level: "preparatoria", description: "Evaluación avanzada de Álgebra y Comprensión Lectora.", durationSeconds: 180 },
  { id: "adm", name: "Admisión Universitaria (PAA / EXANI-II)", level: "admision", description: "Simulación de admisión con secciones de Lógica, Matemáticas y Biología.", durationSeconds: 240 },
  { id: "toefl", name: "TOEFL (Test of English as a Foreign Language)", level: "toefl", description: "Preparación oficial para certificación TOEFL con audios de Listening.", durationSeconds: 300 },
  { id: "cambridge", name: "Cambridge Certificate (First/Advanced)", level: "cambridge", description: "Examen de certificación de Cambridge enfocado en Grammar y Listening.", durationSeconds: 300 },
  { id: "univ", name: "Universidad (Evaluación Profesional)", level: "universidad", description: "Desafío de grado superior en Termodinámica y Algoritmos de Programación.", durationSeconds: 360 },
];

function SimuladorExamenesGame() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const rewardCoins = useServerFn(rewardGameCoins);

  const [gameState, setGameState] = useState<"setup" | "active" | "report">("setup");
  const [selectedExam, setSelectedExam] = useState<ExamConfig | null>(null);

  // Exam variables
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  
  // Answers sheet: questionId -> userAnswer representation
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(300);

  // Drag & drop selection state
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragDropAnswers, setDragDropAnswers] = useState<Record<string, string>>({}); // zoneId -> item
  // Match concepts
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [matchAnswers, setMatchAnswers] = useState<Record<string, string>>({}); // term -> definition
  // Fill blanks
  const [fillAnswers, setFillAnswers] = useState<string[]>([]);
  // Order process
  const [orderedSteps, setOrderedSteps] = useState<string[]>([]);
  // Step-by-step
  const [stepIdx, setStepIdx] = useState(0);
  const [stepAnswers, setStepAnswers] = useState<number[]>([]);

  // Analytics session records
  const [sessionStartTime, setSessionStartTime] = useState(0);

  const rewardMutation = useMutation({
    mutationFn: (coins: number) => rewardCoins({ data: { coins } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  // Global Timer effect
  useEffect(() => {
    if (gameState !== "active" || timeLeft <= 0) {
      if (gameState === "active" && timeLeft === 0) {
        handleFinishExam();
      }
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(p => p - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, gameState]);

  const handleStartExam = (exam: ExamConfig) => {
    setSelectedExam(exam);
    const qList = getQuestionsByFilters({ level: exam.level });
    
    if (qList.length === 0) {
      toast.error("No hay preguntas registradas para este nivel en la base de datos.");
      return;
    }

    setQuestions(qList);
    setCurrentQuestionIdx(0);
    setUserAnswers({});
    setTimeLeft(exam.durationSeconds);
    setSessionStartTime(Date.now());
    setGameState("active");

    loadQuestionInteractions(qList[0]);
  };

  const loadQuestionInteractions = (q: Question) => {
    // Reset inputs
    setDragDropAnswers({});
    setMatchAnswers({});
    setSelectedTerm(null);
    setStepIdx(0);
    setStepAnswers([]);
    
    if (!q) return;

    if (q.type === "fill-blanks") {
      setFillAnswers(new Array(q.correctAnswers.length).fill(""));
    } else if (q.type === "order-process") {
      setOrderedSteps([...q.steps]);
    }
  };

  const speakAudio = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  // Safe answers into userAnswers map
  const saveAnswerState = (ans: any) => {
    const q = questions[currentQuestionIdx];
    setUserAnswers(prev => ({
      ...prev,
      [q.id]: ans
    }));
  };

  const handleNextQuestion = () => {
    // Before moving, save current custom interaction answer
    const q = questions[currentQuestionIdx];
    if (q.type === "drag-drop") {
      saveAnswerState(dragDropAnswers);
    } else if (q.type === "match-concepts") {
      saveAnswerState(matchAnswers);
    } else if (q.type === "fill-blanks") {
      saveAnswerState(fillAnswers);
    } else if (q.type === "order-process") {
      saveAnswerState(orderedSteps);
    } else if (q.type === "step-by-step") {
      saveAnswerState(stepAnswers);
    }

    if (currentQuestionIdx < questions.length - 1) {
      const nextQ = questions[currentQuestionIdx + 1];
      setCurrentQuestionIdx(p => p + 1);
      loadQuestionInteractions(nextQ);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIdx > 0) {
      const prevQ = questions[currentQuestionIdx - 1];
      setCurrentQuestionIdx(p => p - 1);
      loadQuestionInteractions(prevQ);
    }
  };

  const handleFinishExam = () => {
    // Save last question answer first
    const q = questions[currentQuestionIdx];
    let finalAnswers = { ...userAnswers };
    if (q.type === "drag-drop") {
      finalAnswers[q.id] = dragDropAnswers;
    } else if (q.type === "match-concepts") {
      finalAnswers[q.id] = matchAnswers;
    } else if (q.type === "fill-blanks") {
      finalAnswers[q.id] = fillAnswers;
    } else if (q.type === "order-process") {
      finalAnswers[q.id] = orderedSteps;
    } else if (q.type === "step-by-step") {
      finalAnswers[q.id] = stepAnswers;
    }
    setUserAnswers(finalAnswers);

    // Calculate score
    let correctCount = 0;
    questions.forEach(quest => {
      const ans = finalAnswers[quest.id];
      if (ans === undefined) return;

      if (quest.type === "multiple-choice" || quest.type === "reading" || quest.type === "listening") {
        if (ans === quest.correctIndex) correctCount++;
      } else if (quest.type === "fill-blanks") {
        let ok = true;
        quest.correctAnswers.forEach((correctVal, index) => {
          if (ans[index]?.trim().toLowerCase() !== correctVal.toLowerCase()) ok = false;
        });
        if (ok) correctCount++;
      } else if (quest.type === "drag-drop") {
        let ok = true;
        quest.dropZones.forEach(zone => {
          if (ans[zone.id] !== zone.expectedItem) ok = false;
        });
        if (ok) correctCount++;
      } else if (quest.type === "match-concepts") {
        let ok = true;
        quest.pairs.forEach(pair => {
          if (ans[pair.term] !== pair.definition) ok = false;
        });
        if (ok) correctCount++;
      } else if (quest.type === "order-process") {
        let ok = true;
        ans.forEach((step: string, index: number) => {
          if (step !== quest.correctOrder[index]) ok = false;
        });
        if (ok) correctCount++;
      } else if (quest.type === "step-by-step") {
        let ok = true;
        quest.steps.forEach((step, index) => {
          if (ans[index] !== step.correctIndex) ok = false;
        });
        if (ok) correctCount++;
      }
    });

    const accuracy = Math.round((correctCount / questions.length) * 100);
    const durationTaken = Math.round((Date.now() - sessionStartTime) / 1000);

    // Track analytics for each question
    questions.forEach(quest => {
      const ans = finalAnswers[quest.id];
      let isCorr = false;
      if (quest.type === "multiple-choice" || quest.type === "reading" || quest.type === "listening") {
        isCorr = ans === quest.correctIndex;
      } else if (quest.type === "fill-blanks") {
        isCorr = ans !== undefined && quest.correctAnswers.every((val, index) => ans[index]?.trim().toLowerCase() === val.toLowerCase());
      } else if (quest.type === "drag-drop") {
        isCorr = ans !== undefined && quest.dropZones.every(zone => ans[zone.id] === zone.expectedItem);
      } else if (quest.type === "match-concepts") {
        isCorr = ans !== undefined && quest.pairs.every(pair => ans[pair.term] === pair.definition);
      } else if (quest.type === "order-process") {
        isCorr = ans !== undefined && ans.every((step: string, idx: number) => step === quest.correctOrder[idx]);
      } else if (quest.type === "step-by-step") {
        isCorr = ans !== undefined && quest.steps.every((step, idx) => ans[idx] === step.correctIndex);
      }

      analyticsEngine.trackAnswer(
        quest.subject,
        quest.topic,
        isCorr,
        Math.round((durationTaken / questions.length) * 1000),
        quest.id
      );
    });

    // Reward coins if accuracy >= 70%
    if (accuracy >= 70) {
      rewardMutation.mutate(12);
      toast.success(`🎉 ¡Examen completado con éxito! Recibes +12 Sombreritos.`);
    } else {
      toast.warning(`Completaste el examen, pero no alcanzaste el 70% de aciertos.`);
    }

    setGameState("report");
  };

  const getScoreSummary = () => {
    let correctCount = 0;
    questions.forEach(quest => {
      const ans = userAnswers[quest.id];
      if (ans === undefined) return;

      if (quest.type === "multiple-choice" || quest.type === "reading" || quest.type === "listening") {
        if (ans === quest.correctIndex) correctCount++;
      } else if (quest.type === "fill-blanks") {
        let ok = true;
        quest.correctAnswers.forEach((correctVal, index) => {
          if (ans[index]?.trim().toLowerCase() !== correctVal.toLowerCase()) ok = false;
        });
        if (ok) correctCount++;
      } else if (quest.type === "drag-drop") {
        let ok = true;
        quest.dropZones.forEach(zone => {
          if (ans[zone.id] !== zone.expectedItem) ok = false;
        });
        if (ok) correctCount++;
      } else if (quest.type === "match-concepts") {
        let ok = true;
        quest.pairs.forEach(pair => {
          if (ans[pair.term] !== pair.definition) ok = false;
        });
        if (ok) correctCount++;
      } else if (quest.type === "order-process") {
        let ok = true;
        ans.forEach((step: string, index: number) => {
          if (step !== quest.correctOrder[index]) ok = false;
        });
        if (ok) correctCount++;
      } else if (quest.type === "step-by-step") {
        let ok = true;
        quest.steps.forEach((step, index) => {
          if (ans[index] !== step.correctIndex) ok = false;
        });
        if (ok) correctCount++;
      }
    });

    return {
      correctCount,
      total: questions.length,
      accuracy: Math.round((correctCount / questions.length) * 100)
    };
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
        <h1 className="font-display text-lg font-bold">Simulador de Exámenes</h1>
        {gameState === "active" && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
            <Timer className="size-4 animate-pulse" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        )}
        {gameState !== "active" && <div className="size-5" />}
      </header>

      <main className="mx-auto max-w-4xl px-5 pt-6 pb-24 text-white min-h-[calc(100vh-64px)] bg-[#080D24] flex flex-col justify-center">
        {gameState === "setup" && (
          <div className="space-y-6">
            <div className="text-center max-w-md mx-auto space-y-3">
              <span className="text-5xl select-none block">📝</span>
              <h2 className="font-display font-black text-2xl">Preparación para Pruebas Estándar</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Entrena bajo condiciones reales de tiempo con simulaciones académicas completas adaptadas a tu nivel escolar o certificación internacional.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {EXAMS_DB.map(exam => (
                <div key={exam.id} className="bg-[#0D1535] border border-[#1E2D5A] rounded-2xl p-5 flex flex-col justify-between min-h-[160px]">
                  <div>
                    <h3 className="font-bold text-sm text-white">{exam.name}</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-1.5">{exam.description}</p>
                    <span className="text-[10px] text-primary font-bold mt-2 block">⏱ Duración: {formatTime(exam.durationSeconds)}</span>
                  </div>
                  <button
                    onClick={() => handleStartExam(exam)}
                    className="w-full h-9 mt-4 bg-primary hover:bg-primary-glow font-bold text-xs rounded-xl cursor-pointer border-none transition"
                  >
                    Iniciar Examen
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {gameState === "active" && questions.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Left Column: Virtual Answer Sheet */}
            <div className="lg:col-span-1 bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-5 h-fit space-y-4">
              <h4 className="text-xs uppercase font-bold text-slate-400 border-b border-[#1E2D5A] pb-2">Hoja de Respuestas</h4>
              <div className="grid grid-cols-4 gap-2">
                {questions.map((q, idx) => {
                  const hasAnswered = userAnswers[q.id] !== undefined;
                  const isCurrent = idx === currentQuestionIdx;
                  
                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        // Save current state first
                        const activeQ = questions[currentQuestionIdx];
                        if (activeQ.type === "drag-drop") saveAnswerState(dragDropAnswers);
                        else if (activeQ.type === "match-concepts") saveAnswerState(matchAnswers);
                        else if (activeQ.type === "fill-blanks") saveAnswerState(fillAnswers);
                        else if (activeQ.type === "order-process") saveAnswerState(orderedSteps);
                        else if (activeQ.type === "step-by-step") saveAnswerState(stepAnswers);

                        setCurrentQuestionIdx(idx);
                        loadQuestionInteractions(questions[idx]);
                      }}
                      className={`size-10 rounded-xl font-bold font-display text-xs border transition cursor-pointer flex items-center justify-center ${
                        isCurrent
                          ? "bg-primary border-primary text-white scale-105"
                          : hasAnswered
                          ? "bg-emerald-600/20 border-emerald-500/30 text-emerald-400"
                          : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={handleFinishExam}
                className="w-full h-10 bg-emerald-600 hover:bg-emerald-500 font-bold text-xs rounded-xl cursor-pointer border-none transition mt-4"
              >
                Terminar Examen
              </button>
            </div>

            {/* Right Column: Interaction Sandbox */}
            <div className="lg:col-span-3 bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-6 space-y-6">
              {(() => {
                const q = questions[currentQuestionIdx];
                return (
                  <>
                    <div className="flex justify-between items-center text-xs text-slate-400 font-bold border-b border-[#1E2D5A] pb-3">
                      <span className="bg-primary/20 text-primary px-2.5 py-0.5 rounded-full uppercase">
                        Pregunta {currentQuestionIdx + 1} · {q.subject}
                      </span>
                      <span className="text-[10px] text-slate-400">Tipo: {q.type}</span>
                    </div>

                    <div className="space-y-4">
                      <p className="text-sm font-bold text-slate-200">{q.prompt}</p>

                      {/* 1. Multiple Choice */}
                      {q.type === "multiple-choice" && (
                        <div className="grid gap-3 pt-3">
                          {q.options.map((option, idx) => {
                            const isSelected = userAnswers[q.id] === idx;
                            return (
                              <button
                                key={idx}
                                onClick={() => {
                                  setUserAnswers(prev => ({ ...prev, [q.id]: idx }));
                                }}
                                className={`w-full py-3 px-4 rounded-xl border text-xs font-semibold text-left transition active:scale-98 cursor-pointer ${
                                  isSelected
                                    ? "border-primary bg-primary/10 text-primary font-bold"
                                    : "border-border bg-card text-foreground hover:bg-muted/40"
                                }`}
                              >
                                {option}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* 2. Drag & Drop */}
                      {q.type === "drag-drop" && (
                        <div className="space-y-4 pt-3">
                          <div className="flex justify-center gap-3">
                            {q.dragItems.map((item, idx) => {
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

                          <div className="grid gap-3 pt-2">
                            {q.dropZones.map((zone, idx) => {
                              const filled = dragDropAnswers[zone.id];
                              return (
                                <div
                                  key={idx}
                                  onClick={() => {
                                    if (draggedItem) {
                                      setDragDropAnswers(prev => ({ ...prev, [zone.id]: draggedItem }));
                                      setDraggedItem(null);
                                    }
                                  }}
                                  className="p-4 rounded-xl border border-dashed border-[#1E2D5A] bg-[#17224D]/30 flex justify-between items-center cursor-pointer"
                                >
                                  <span className="text-xs font-bold text-slate-300">{zone.label}</span>
                                  <div className="px-4 py-2 rounded-lg text-xs font-black bg-slate-800 text-slate-300">
                                    {filled || "Soltar aquí"}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 3. Match Concepts */}
                      {q.type === "match-concepts" && (
                        <div className="space-y-4 pt-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              {q.pairs.map(pair => {
                                const matchedDef = matchAnswers[pair.term];
                                const isSelected = selectedTerm === pair.term;
                                return (
                                  <button
                                    key={pair.term}
                                    onClick={() => setSelectedTerm(pair.term)}
                                    className={`w-full py-2 px-3 rounded-lg border text-xs text-left font-bold transition ${
                                      matchedDef
                                        ? "bg-emerald-600/10 border-emerald-500/30 text-emerald-400 font-bold"
                                        : isSelected
                                        ? "bg-primary border-primary text-white font-bold"
                                        : "bg-[#17224D] border-[#3B6DE8]/10 text-slate-300"
                                    }`}
                                  >
                                    {pair.term} {matchedDef && "✓"}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="space-y-2">
                              {q.pairs.map(pair => {
                                const isMatched = Object.values(matchAnswers).includes(pair.definition);
                                return (
                                  <button
                                    key={pair.definition}
                                    disabled={isMatched}
                                    onClick={() => {
                                      if (selectedTerm) {
                                        setMatchAnswers(prev => ({ ...prev, [selectedTerm]: pair.definition }));
                                        setSelectedTerm(null);
                                      }
                                    }}
                                    className="w-full py-2 px-3 rounded-lg border text-[10px] text-left leading-relaxed transition bg-[#17224D] border-[#3B6DE8]/10 text-slate-300 disabled:opacity-30 cursor-pointer"
                                  >
                                    {pair.definition}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 4. Fill Blanks */}
                      {q.type === "fill-blanks" && (
                        <div className="p-4 rounded-xl border border-[#1E2D5A] bg-[#17224D]/30 leading-relaxed text-sm text-slate-300">
                          {q.textWithBlanks.split(/(\[blank\d+\])/g).map((chunk, idx) => {
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
                                  className="w-24 mx-1.5 h-7 px-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-center text-white focus:outline-none"
                                />
                              );
                            }
                            return <span key={idx}>{chunk}</span>;
                          })}
                        </div>
                      )}

                      {/* 5. Order Process */}
                      {q.type === "order-process" && (
                        <div className="space-y-2">
                          {orderedSteps.map((step, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-[#17224D] border border-[#3B6DE8]/10 rounded-xl flex justify-between items-center"
                            >
                              <span className="text-xs text-slate-300 font-bold">{idx + 1}. {step}</span>
                              <div className="flex gap-1">
                                <button
                                  disabled={idx === 0}
                                  onClick={() => moveStep(idx, idx - 1)}
                                  className="size-7 grid place-items-center bg-slate-800 text-white rounded cursor-pointer border-none font-bold"
                                >
                                  ▲
                                </button>
                                <button
                                  disabled={idx === orderedSteps.length - 1}
                                  onClick={() => moveStep(idx, idx + 1)}
                                  className="size-7 grid place-items-center bg-slate-800 text-white rounded cursor-pointer border-none font-bold"
                                >
                                  ▼
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 6. Step-by-step */}
                      {q.type === "step-by-step" && (
                        <div className="space-y-4">
                          <span className="text-xs text-[#3B6DE8] font-bold block mb-1">Subetapa {stepIdx + 1} de {q.steps.length}</span>
                          <div className="p-3 bg-slate-900 rounded-xl border border-[#1E2D5A]">
                            <p className="text-xs text-slate-300">{q.steps[stepIdx].prompt}</p>
                          </div>
                          <div className="grid gap-2">
                            {q.steps[stepIdx].options.map((option, idx) => {
                              const isSelected = stepAnswers[stepIdx] === idx;
                              return (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    const copy = [...stepAnswers];
                                    copy[stepIdx] = idx;
                                    setStepAnswers(copy);

                                    if (stepIdx < q.steps.length - 1) {
                                      setStepIdx(p => p + 1);
                                    }
                                  }}
                                  className={`w-full py-2.5 px-3 rounded-lg border text-xs text-left transition cursor-pointer active:scale-95 ${
                                    isSelected ? "border-primary bg-primary/20 text-white" : "border-border bg-card text-foreground"
                                  }`}
                                >
                                  {option}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 7. Reading */}
                      {q.type === "reading" && (
                        <div className="space-y-4 pt-3 text-left">
                          <div className="p-4 rounded-xl bg-slate-900 border border-[#1E2D5A] text-xs leading-relaxed text-slate-300 max-h-[160px] overflow-y-auto font-mono scrollbar-thin">
                            {q.readingText}
                          </div>
                          
                          <div className="grid gap-3 pt-2">
                            {q.options.map((option, idx) => {
                              const isSelected = userAnswers[q.id] === idx;
                              return (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    setUserAnswers(prev => ({ ...prev, [q.id]: idx }));
                                  }}
                                  className={`w-full py-3 px-4 rounded-xl border text-xs font-semibold text-left transition active:scale-98 cursor-pointer ${
                                    isSelected
                                      ? "border-primary bg-primary/10 text-primary font-bold"
                                      : "border-border bg-card text-foreground hover:bg-muted/40"
                                  }`}
                                >
                                  {option}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 8. Listening */}
                      {q.type === "listening" && (
                        <div className="space-y-4 pt-3 text-center">
                          <div className="flex justify-center">
                            <button
                              onClick={() => speakAudio(q.audioText)}
                              className="size-14 rounded-full bg-primary/20 border border-primary/40 hover:bg-primary/30 flex items-center justify-center cursor-pointer transition active:scale-90 text-white"
                            >
                              <Volume2 className="size-6 text-primary animate-pulse" />
                            </button>
                          </div>

                          <div className="grid gap-3 pt-2 text-left">
                            {q.options.map((option, idx) => {
                              const isSelected = userAnswers[q.id] === idx;
                              return (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    setUserAnswers(prev => ({ ...prev, [q.id]: idx }));
                                  }}
                                  className={`w-full py-3 px-4 rounded-xl border text-xs font-semibold text-left transition active:scale-98 cursor-pointer ${
                                    isSelected
                                      ? "border-primary bg-primary/10 text-primary font-bold"
                                      : "border-border bg-card text-foreground hover:bg-muted/40"
                                  }`}
                                >
                                  {option}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Pagination Buttons */}
                    <div className="flex justify-between items-center border-t border-[#1E2D5A] pt-4 mt-6">
                      <button
                        disabled={currentQuestionIdx === 0}
                        onClick={handlePrevQuestion}
                        className="h-10 px-4 border border-[#1E2D5A] text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-800 transition disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        Pregunta Anterior
                      </button>
                      <button
                        onClick={handleNextQuestion}
                        className="h-10 px-4 bg-primary hover:bg-primary-glow font-bold text-xs rounded-xl cursor-pointer border-none transition"
                      >
                        Siguiente Pregunta
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {gameState === "report" && selectedExam && (
          <div className="max-w-xl mx-auto bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-6 text-center space-y-6 py-12 animate-in zoom-in-95">
            <div className="size-20 rounded-full bg-emerald-500/10 text-emerald-400 grid place-items-center mx-auto text-5xl">📄</div>
            
            <div>
              <h2 className="font-display font-black text-2xl text-white">Reporte de Evaluación</h2>
              <span className="text-xs text-slate-400 font-bold uppercase block mt-1">{selectedExam.name}</span>
            </div>

            {(() => {
              const summary = getScoreSummary();
              return (
                <>
                  <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto text-xs font-bold pt-2">
                    <div className="bg-[#17224D] p-3 rounded-xl border border-[#3B6DE8]/10">
                      <span className="block text-slate-400">Puntuación de Aciertos</span>
                      <span className="text-lg font-black text-white">{summary.correctCount} / {summary.total}</span>
                    </div>
                    <div className="bg-[#17224D] p-3 rounded-xl border border-[#3B6DE8]/10">
                      <span className="block text-slate-400">Precisión Estimada</span>
                      <span className={`text-lg font-black ${summary.accuracy >= 70 ? "text-emerald-400" : "text-rose-400"}`}>
                        {summary.accuracy}%
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#17224D]/60 p-4 border border-[#3B6DE8]/10 rounded-2xl text-xs text-left max-w-md mx-auto space-y-3">
                    <span className="font-bold text-[#3B6DE8] flex items-center gap-1">
                      <CheckCircle className="size-4" /> Diagnóstico del Simulador:
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      {summary.accuracy >= 85
                        ? "Excelente nivel de competencia académica. Dominas los temas y estás listo para la prueba real oficial."
                        : summary.accuracy >= 70
                        ? "Buen nivel general. Aprobaste el simulador, pero te recomendamos reforzar temas específicos usando el compendio."
                        : "Por debajo del promedio requerido. Te sugerimos repasar a fondo las áreas de estudio débiles e intentarlo nuevamente."}
                    </p>
                  </div>
                </>
              );
            })()}

            <div className="flex gap-3 justify-center pt-4">
              <button
                onClick={() => setGameState("setup")}
                className="h-11 px-5 border border-[#1E2D5A] text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-800 transition"
              >
                Volver a Exámenes
              </button>
              <button
                onClick={() => navigate({ to: "/games" })}
                className="h-11 px-5 bg-primary hover:bg-primary-glow font-bold text-xs rounded-xl cursor-pointer border-none transition"
              >
                Ir a Hub de Juegos
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
