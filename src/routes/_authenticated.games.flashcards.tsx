import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  ArrowLeft, Trophy, Sparkles, RotateCcw, CheckCircle2, 
  XCircle, BookOpen, Flame, ChevronRight, Layers,
  Upload, Shuffle, Check, ArrowRight, Lightbulb,
  Award, GraduationCap, RefreshCw, Star, Play
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { rewardGameCoins, rewardGameXp } from "@/lib/games.functions";
import { extractTextFromMedia } from "@/lib/quiz.functions";
import { analyzeStudyMaterial, generateStudyGameQuestions, type StudyQuestion } from "@/lib/study-game.functions";
import { SCHOOL_SUBJECTS, type SchoolSubject, type SubjectTopic } from "@/lib/school-subjects-data";
import { PAA_OFFICIAL_QUESTIONS } from "@/lib/paa-official-bank";
import { EXANI_OFFICIAL_QUESTIONS } from "@/lib/exani-official-bank";
import streakCap from "@/assets/streak-cap.png";

export const Route = createFileRoute("/_authenticated/games/flashcards")({
  head: () => ({ meta: [{ title: "Flashcards de Estudio — Lybanhi" }] }),
  component: FlashcardsGame,
});

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  explanation: string;
  category: string;
  topic: string;
}

function FlashcardsGame() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const rewardXpFn = useServerFn(rewardGameXp);
  const rewardCoinsFn = useServerFn(rewardGameCoins);
  const extractMediaFn = useServerFn(extractTextFromMedia);
  const analyzeMaterialFn = useServerFn(analyzeStudyMaterial);
  const generateQuestionsFn = useServerFn(generateStudyGameQuestions);

  // Navigation states
  const [view, setView] = useState<"select_topic" | "playing" | "results">("select_topic");
  const [activeCategoryTab, setActiveCategoryTab] = useState<"admision" | "materias" | "custom">("admision");

  // Selection states
  const [selectedSubject, setSelectedSubject] = useState<SchoolSubject | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<SubjectTopic | null>(null);
  const [selectedExamSection, setSelectedExamSection] = useState<"paa" | "exani">("paa");
  const [selectedExamSubtopic, setSelectedExamSubtopic] = useState<string>("all");

  // Custom AI materials state
  const [customText, setCustomText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Active game deck state
  const [deck, setDeck] = useState<FlashcardItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState<FlashcardItem[]>([]);
  const [learningCards, setLearningCards] = useState<FlashcardItem[]>([]);
  const [streak, setStreak] = useState(0);
  const [earnedXp, setEarnedXp] = useState(0);

  // Play subtle sound using Web Audio API
  const playSound = (type: "flip" | "correct" | "review" | "complete") => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "flip") {
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === "correct") {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === "review") {
        osc.frequency.setValueAtTime(329.63, ctx.currentTime);
        osc.frequency.setValueAtTime(261.63, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else if (type === "complete") {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
        osc.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      }
    } catch {
      // Audio not supported or blocked
    }
  };

  // Build deck from School Subject
  const startSubjectDeck = (subject: SchoolSubject, topic: SubjectTopic) => {
    setSelectedSubject(subject);
    setSelectedTopic(topic);

    const cards: FlashcardItem[] = topic.presetQuestions.map((q, idx) => ({
      id: `${topic.id}-${idx}`,
      front: q.question,
      back: q.correctAnswer,
      explanation: q.explanation || topic.explanation,
      category: subject.name,
      topic: topic.name,
    }));

    // Add key points as extra concept flashcards
    topic.keyPoints.forEach((kp, idx) => {
      const parts = kp.split(":");
      if (parts.length === 2) {
        cards.push({
          id: `${topic.id}-kp-${idx}`,
          front: `Concepto Clave: ${parts[0].trim()}`,
          back: parts[1].trim(),
          explanation: topic.explanation,
          category: subject.name,
          topic: topic.name,
        });
      }
    });

    initGame(cards);
  };

  // Build deck from PAA Exam
  const startPaaDeck = (subtopicFilter: string) => {
    let pool = [...PAA_OFFICIAL_QUESTIONS];
    if (subtopicFilter !== "all") {
      pool = pool.filter(q => q.subtopic.toLowerCase().includes(subtopicFilter.toLowerCase()) || q.section.toLowerCase().includes(subtopicFilter.toLowerCase()));
    }

    const cards: FlashcardItem[] = pool.map((q, idx) => ({
      id: `paa-${idx}`,
      front: q.q,
      back: q.options[q.correctIndex],
      explanation: q.explanation,
      category: "College Board PAA",
      topic: q.subtopic,
    }));

    initGame(cards);
  };

  // Build deck from EXANI-II Exam
  const startExaniDeck = (subtopicFilter: string) => {
    let pool = [...EXANI_OFFICIAL_QUESTIONS];
    if (subtopicFilter !== "all") {
      pool = pool.filter(q => q.subtopic.toLowerCase().includes(subtopicFilter.toLowerCase()) || q.section.toLowerCase().includes(subtopicFilter.toLowerCase()));
    }

    const cards: FlashcardItem[] = pool.map((q, idx) => ({
      id: `exani-${idx}`,
      front: q.q,
      back: q.options[q.correctIndex],
      explanation: q.explanation,
      category: "Ceneval EXANI-II",
      topic: q.subtopic,
    }));

    initGame(cards);
  };

  // Build deck from Custom Uploaded Material with IA
  const handleGenerateCustomDeck = async () => {
    if (!customText.trim()) {
      toast.error("Por favor escribe o sube tus apuntes primero.");
      return;
    }

    setIsGeneratingAi(true);
    const toastId = toast.loading("Analizando tus apuntes y creando Flashcards con IA...");

    try {
      const analysis = await analyzeMaterialFn({ data: { text: customText } });
      const questions = await generateQuestionsFn({
        data: {
          materialText: customText,
          selectedTopics: analysis.detectedTopics.length > 0 ? analysis.detectedTopics : ["Conceptos Clave"],
          questionCount: 8,
          gameType: "trivia",
        },
      });

      const cards: FlashcardItem[] = questions.map((q, idx) => ({
        id: `custom-${idx}`,
        front: q.question,
        back: q.correctAnswer,
        explanation: q.explanation,
        category: "Mi Material",
        topic: analysis.title || "Apuntes Personales",
      }));

      toast.success("¡Flashcards generadas con éxito!", { id: toastId });
      initGame(cards);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al generar Flashcards con IA", { id: toastId });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const initGame = (cards: FlashcardItem[]) => {
    if (!cards || cards.length === 0) {
      toast.error("No se encontraron tarjetas para este tema.");
      return;
    }
    // Shuffle cards
    const shuffled = [...cards].sort(() => 0.5 - Math.random());
    setDeck(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setMasteredCards([]);
    setLearningCards([]);
    setStreak(0);
    setEarnedXp(0);
    setView("playing");
  };

  // Handle User Action: Mastered Card
  const handleCardMastered = () => {
    const currentCard = deck[currentIndex];
    playSound("correct");

    const newMastered = [...masteredCards, currentCard];
    setMasteredCards(newMastered);
    setStreak(s => s + 1);
    setEarnedXp(x => x + 15);

    advanceCard();
  };

  // Handle User Action: Needs Review
  const handleCardNeedsReview = () => {
    const currentCard = deck[currentIndex];
    playSound("review");

    setStreak(0);
    // Add to learning cards and re-queue at end of deck
    setLearningCards(prev => (prev.some(c => c.id === currentCard.id) ? prev : [...prev, currentCard]));
    setDeck(prev => [...prev, currentCard]);

    advanceCard();
  };

  const advanceCard = () => {
    setIsFlipped(false);
    if (currentIndex + 1 >= deck.length) {
      finishDeck();
    } else {
      setCurrentIndex(i => i + 1);
    }
  };

  const finishDeck = async () => {
    playSound("complete");
    setView("results");

    const finalXp = Math.max(20, (masteredCards.length + 1) * 15);
    try {
      await rewardXpFn({ data: { xp: finalXp } });
      await rewardCoinsFn({ data: { coins: 1 } });
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(`¡Mazo completado! Ganaste +${finalXp} XP y +1 Sombrerito 🎓`);
    } catch {
      // ignore
    }
  };

  const handleShuffleDeck = () => {
    playSound("flip");
    setDeck(prev => [...prev].sort(() => 0.5 - Math.random()));
    setCurrentIndex(0);
    setIsFlipped(false);
    toast.success("Baraja mezclada aleatoriamente 🔀");
  };

  const handleRetryLearningOnly = () => {
    if (learningCards.length === 0) {
      initGame(deck);
      return;
    }
    initGame(learningCards);
  };

  const currentCard = deck[currentIndex];
  const progressPercent = deck.length > 0 ? Math.round(((currentIndex) / deck.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/90 px-4 py-3 backdrop-blur">
        <button
          onClick={() => {
            if (view === "playing") {
              if (confirm("¿Deseas salir de la sesión de flashcards?")) {
                setView("select_topic");
              }
            } else if (view === "results") {
              setView("select_topic");
            } else {
              navigate({ to: "/games" });
            }
          }}
          className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition cursor-pointer"
        >
          <ArrowLeft className="size-4" />
          <span>{view === "select_topic" ? "Volver a Juegos" : "Cambiar Tema"}</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-bold text-primary flex items-center gap-1.5">
            <span>🃏</span> Flashcards de Estudio
          </span>
        </div>

        {view === "playing" && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold/20 text-gold-foreground flex items-center gap-1">
              <Flame className="size-3 text-amber-500 fill-amber-500" />
              <span>{streak} Racha</span>
            </span>
          </div>
        )}
      </header>

      {/* ======================================================== */}
      {/* 1. SELECCIÓN DE TEMA (TOPIC SELECT) */}
      {/* ======================================================== */}
      {view === "select_topic" && (
        <main className="mx-auto max-w-md w-full px-5 pt-5 pb-24 space-y-6 animate-fade-in flex-1">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold">
              <Sparkles className="size-3" />
              <span>Memoria y Repaso Activo</span>
            </div>
            <h1 className="font-display text-2xl font-bold">Elige un tema para estudiar</h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Practica volteando tarjetas interactivas. Elige exámenes oficiales, materias o sube tus apuntes:
            </p>
          </div>

          {/* Categorías Principales */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/60 rounded-2xl border border-border">
            <button
              onClick={() => setActiveCategoryTab("admision")}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeCategoryTab === "admision"
                  ? "bg-card text-primary shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Award className="size-3.5" />
              <span>Admisión</span>
            </button>
            <button
              onClick={() => setActiveCategoryTab("materias")}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeCategoryTab === "materias"
                  ? "bg-card text-primary shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="size-3.5" />
              <span>Materias</span>
            </button>
            <button
              onClick={() => setActiveCategoryTab("custom")}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeCategoryTab === "custom"
                  ? "bg-card text-primary shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="size-3.5" />
              <span>Mi Material</span>
            </button>
          </div>

          {/* 1.1 EXÁMENES DE ADMISIÓN */}
          {activeCategoryTab === "admision" && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedExamSection("paa")}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    selectedExamSection === "paa"
                      ? "border-blue-500/50 bg-blue-500/10 text-foreground shadow-sm"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  <div className="grid size-8 place-items-center rounded-xl bg-blue-500/15 text-blue-500 mb-1.5">
                    <Award className="size-4" />
                  </div>
                  <span className="block text-xs font-bold text-foreground">Examen PAA</span>
                  <span className="block text-[10px] text-muted-foreground">College Board</span>
                </button>

                <button
                  onClick={() => setSelectedExamSection("exani")}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    selectedExamSection === "exani"
                      ? "border-purple-500/50 bg-purple-500/10 text-foreground shadow-sm"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  <div className="grid size-8 place-items-center rounded-xl bg-purple-500/15 text-purple-500 mb-1.5">
                    <GraduationCap className="size-4" />
                  </div>
                  <span className="block text-xs font-bold text-foreground">Examen EXANI-II</span>
                  <span className="block text-[10px] text-muted-foreground">Ceneval 2025</span>
                </button>
              </div>

              {selectedExamSection === "paa" ? (
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-0.5 block">
                    Módulos Oficiales de PAA:
                  </span>
                  {[
                    { id: "all", title: "🏆 Todas las secciones PAA (Simulador Completo)", count: "20 tarjetas" },
                    { id: "lectura", title: "📖 Lectura, Vocabulario e Inferencias", count: "5 tarjetas" },
                    { id: "redaccion", title: "✍️ Redacción (Generalizar, Omitir, Adición)", count: "3 tarjetas" },
                    { id: "matematicas", title: "➗ Matemáticas (Descuentos, Pendientes, Álgebra)", count: "7 tarjetas" },
                    { id: "ingles", title: "🇬🇧 Inglés (Concordancia y Comprensión)", count: "5 tarjetas" },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => startPaaDeck(sub.id)}
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-border bg-card hover:border-primary/50 text-left transition active:scale-98 cursor-pointer shadow-sm group"
                    >
                      <div>
                        <span className="block text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                          {sub.title}
                        </span>
                        <span className="block text-[10px] text-muted-foreground">{sub.count}</span>
                      </div>
                      <div className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary group-hover:translate-x-1 transition-transform">
                        <Play className="size-3.5 fill-primary" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-0.5 block">
                    Módulos Oficiales de EXANI-II:
                  </span>
                  {[
                    { id: "all", title: "🎓 Todas las áreas EXANI-II (Simulador Ceneval)", count: "48 tarjetas" },
                    { id: "comprension", title: "📖 Comprensión Lectora", count: "4 tarjetas" },
                    { id: "redaccion", title: "✍️ Redacción Indirecta (Normativa DPD)", count: "4 tarjetas" },
                    { id: "pensamiento", title: "➗ Pensamiento Matemático", count: "4 tarjetas" },
                    { id: "salud", title: "🧬 Ciencias de la Salud & Premedicina", count: "6 tarjetas" },
                    { id: "fisica", title: "⚡ Física e Ingenierías", count: "4 tarjetas" },
                    { id: "administracion", title: "💼 Administración y Economía", count: "4 tarjetas" },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => startExaniDeck(sub.id)}
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-border bg-card hover:border-primary/50 text-left transition active:scale-98 cursor-pointer shadow-sm group"
                    >
                      <div>
                        <span className="block text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                          {sub.title}
                        </span>
                        <span className="block text-[10px] text-muted-foreground">{sub.count}</span>
                      </div>
                      <div className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary group-hover:translate-x-1 transition-transform">
                        <Play className="size-3.5 fill-primary" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 1.2 MATERIAS ESCOLARES */}
          {activeCategoryTab === "materias" && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-3 gap-2">
                {SCHOOL_SUBJECTS.map((sub) => {
                  const on = selectedSubject?.id === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedSubject(sub)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center transition cursor-pointer ${
                        on
                          ? "border-primary bg-primary/10 text-primary shadow-sm"
                          : "border-border bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span className="text-2xl">{sub.icon}</span>
                      <span className="text-[11px] font-bold leading-tight">{sub.name}</span>
                    </button>
                  );
                })}
              </div>

              {selectedSubject && (
                <div className="space-y-2.5 pt-2 border-t border-border animate-fade-in">
                  <div className="flex items-center justify-between px-0.5">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span>{selectedSubject.icon}</span> Temas de {selectedSubject.name}:
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {selectedSubject.topics.length} temas
                    </span>
                  </div>

                  {selectedSubject.topics.map((tp) => (
                    <button
                      key={tp.id}
                      onClick={() => startSubjectDeck(selectedSubject, tp)}
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-border bg-card hover:border-primary/50 text-left transition active:scale-98 cursor-pointer shadow-sm group"
                    >
                      <div>
                        <span className="block text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                          {tp.name}
                        </span>
                        <span className="block text-[10px] text-muted-foreground line-clamp-1">
                          {tp.summary}
                        </span>
                      </div>
                      <div className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary group-hover:translate-x-1 transition-transform shrink-0">
                        <Play className="size-3.5 fill-primary" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 1.3 MI MATERIAL CON IA */}
          {activeCategoryTab === "custom" && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl border border-border bg-card space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Sparkles className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Sube tus apuntes para crear Flashcards</h3>
                    <p className="text-[11px] text-muted-foreground">
                      La IA extraerá las preguntas y conceptos clave en tarjetas giratorias.
                    </p>
                  </div>
                </div>

                <label className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-dashed border-primary/40 bg-primary/5 text-primary text-xs font-semibold hover:bg-primary/10 cursor-pointer transition">
                  <Upload className="size-4" />
                  <span>Subir PDF, Word o Foto</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsExtracting(true);
                      const toastId = toast.loading("Extrayendo texto de tus apuntes...");
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
                              toast.success("¡Texto extraído con éxito!", { id: toastId });
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
                  placeholder="Pega aquí el contenido de tus apuntes, resúmenes o capítulos..."
                  className="h-32 w-full rounded-xl border border-border bg-muted/40 p-3 text-xs text-foreground focus:border-primary focus:outline-none resize-none leading-relaxed"
                />

                <button
                  type="button"
                  onClick={handleGenerateCustomDeck}
                  disabled={isExtracting || isGeneratingAi || !customText.trim()}
                  className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="size-4" />
                  <span>Crear Mazo de Flashcards con IA</span>
                </button>
              </div>
            </div>
          )}
        </main>
      )}

      {/* ======================================================== */}
      {/* 2. MODO DE JUEGO (PLAYING DECK) */}
      {/* ======================================================== */}
      {view === "playing" && currentCard && (
        <main className="mx-auto max-w-md w-full px-5 pt-4 pb-12 flex-1 flex flex-col justify-between animate-fade-in">
          {/* Progress and Deck Stats */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground px-1">
              <span>
                Tarjeta {currentIndex + 1} de {deck.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShuffleDeck}
                  title="Mezclar baraja"
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
                >
                  <Shuffle className="size-3.5" />
                </button>
                <span className="text-primary">{progressPercent}%</span>
              </div>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Flashcard 3D Interactive Container */}
          <div
            className="my-auto py-4 cursor-pointer perspective-1000 select-none"
            onClick={() => {
              playSound("flip");
              setIsFlipped(!isFlipped);
            }}
          >
            <div
              className={`relative min-h-[340px] w-full rounded-3xl border border-border bg-card p-6 shadow-xl transition-all duration-500 flex flex-col justify-between overflow-hidden ${
                isFlipped
                  ? "bg-gradient-to-b from-card via-purple-500/5 to-card border-purple-500/30"
                  : "bg-gradient-to-b from-card to-muted/20 border-primary/20"
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                  {currentCard.category} · {currentCard.topic}
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                  <RotateCcw className="size-3" /> Toca para voltear
                </span>
              </div>

              {/* Card Body */}
              <div className="my-auto py-6 text-center space-y-3">
                {!isFlipped ? (
                  <div className="space-y-3 animate-fade-in">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Pregunta / Concepto:
                    </span>
                    <h2 className="font-display text-lg font-bold text-foreground leading-snug px-2">
                      {currentCard.front}
                    </h2>
                  </div>
                ) : (
                  <div className="space-y-3 animate-fade-in text-left">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-success block">
                      ✓ Respuesta / Definición:
                    </span>
                    <div className="p-3.5 rounded-2xl bg-success/10 border border-success/20 text-foreground font-display font-bold text-base leading-snug">
                      {currentCard.back}
                    </div>

                    {currentCard.explanation && (
                      <div className="p-3 rounded-xl bg-muted/60 border border-border text-xs text-muted-foreground space-y-1">
                        <span className="font-bold text-foreground block text-[10px] uppercase">
                          📌 Lo que debes saber:
                        </span>
                        <p className="leading-relaxed">{currentCard.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer Hint */}
              <div className="text-center text-[10px] text-muted-foreground font-medium pt-2 border-t border-border/60">
                {!isFlipped ? "💡 Piensa la respuesta antes de girar" : "Evalúa si dominas este concepto abajo"}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            {!isFlipped ? (
              <button
                type="button"
                onClick={() => {
                  playSound("flip");
                  setIsFlipped(true);
                }}
                className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95 cursor-pointer"
              >
                <RotateCcw className="size-4" />
                <span>Voltear Tarjeta para Ver Respuesta</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleCardNeedsReview}
                  className="h-12 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-500 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer hover:bg-rose-500/20"
                >
                  <XCircle className="size-4" />
                  <span>Aún me cuesta (Repasar)</span>
                </button>

                <button
                  type="button"
                  onClick={handleCardMastered}
                  className="h-12 rounded-2xl bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95 cursor-pointer hover:bg-emerald-600"
                >
                  <CheckCircle2 className="size-4" />
                  <span>¡Me la sé! (+15 XP)</span>
                </button>
              </div>
            )}
          </div>
        </main>
      )}

      {/* ======================================================== */}
      {/* 3. RESULTADOS DE LA SESIÓN (RESULTS) */}
      {/* ======================================================== */}
      {view === "results" && (
        <main className="mx-auto max-w-md w-full px-5 pt-8 pb-16 flex-1 flex flex-col justify-center text-center space-y-6 animate-fade-in">
          <div className="space-y-2">
            <img src={streakCap} alt="" className="mx-auto size-20 animate-bounce" />
            <h2 className="font-display text-2xl font-black text-foreground">
              ¡Sesión de Flashcards Completada! 🎉
            </h2>
            <p className="text-xs text-muted-foreground">
              Has repasado todos los conceptos clave de esta baraja.
            </p>
          </div>

          {/* Reward Badges */}
          <div className="flex items-center justify-center gap-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 px-3.5 py-1.5 font-display text-sm font-bold text-blue-500 shadow-sm">
              <Trophy className="size-4" />
              <span>+{earnedXp || 60} XP</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 border border-gold/30 px-3.5 py-1.5 font-display text-sm font-bold text-gold-foreground shadow-sm">
              <img src={streakCap} alt="" className="size-4 select-none" />
              <span>+1 Sombrerito</span>
            </div>
          </div>

          {/* Review Summary Breakdown */}
          <div className="p-4 rounded-2xl border border-border bg-card space-y-3 text-left">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-foreground">Dominio de la Baraja:</span>
              <span className="text-emerald-500">{masteredCards.length} dominadas</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <span className="text-[10px] uppercase font-bold block">Dominadas a la 1ª</span>
                <span className="font-bold text-base">{masteredCards.length}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                <span className="text-[10px] uppercase font-bold block">Repasadas</span>
                <span className="font-bold text-base">{learningCards.length}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5">
            {learningCards.length > 0 && (
              <button
                type="button"
                onClick={handleRetryLearningOnly}
                className="w-full h-12 rounded-2xl bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95 cursor-pointer hover:bg-amber-600"
              >
                <RefreshCw className="size-4" />
                <span>Repasar solo las {learningCards.length} tarjetas difíciles</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => initGame(deck)}
              className="w-full h-12 rounded-2xl border border-border bg-card text-foreground font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer hover:bg-muted/50"
            >
              <RotateCcw className="size-4" />
              <span>Reiniciar esta misma baraja</span>
            </button>

            <button
              type="button"
              onClick={() => setView("select_topic")}
              className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <BookOpen className="size-4" />
              <span>Elegir otro tema de estudio</span>
            </button>
          </div>
        </main>
      )}
    </div>
  );
}
