import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { generateQuiz, listBooks, generateBookQuiz, generateCustomQuiz, extractTextFromMedia } from "@/lib/quiz.functions";
import { AppHeader } from "@/components/AppHeader";
import { Brain, Calculator, Languages, GraduationCap, BookOpen, Sparkles, X, ArrowUpRight, FlaskConical } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/prep")({
  head: () => ({ meta: [{ title: "Prep — Lybanhi" }] }),
  component: Prep,
});

import { LEVELS, TOPICS, type Cat, type Lang } from "@/lib/topics";

const COUNTS = [3, 5, 8, 10];

function Prep() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const gen = useServerFn(generateQuiz);
  const genBook = useServerFn(generateBookQuiz);
  const genCustom = useServerFn(generateCustomQuiz);
  const listBks = useServerFn(listBooks);
  const getExtractTextFn = useServerFn(extractTextFromMedia);
  const lang = (i18n.language.slice(0, 2) as Lang) in TOPICS.math ? (i18n.language.slice(0, 2) as Lang) : "es";

  const [openCat, setOpenCat] = useState<Cat | "book" | null>(null);
  const [level, setLevel] = useState(LEVELS[lang][1].value);
  const [count, setCount] = useState<number>(5);
  const [topic, setTopic] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");

  // Grado and Objetivo states based on flowchart
  const [selectedGrade, setSelectedGrade] = useState<"secundaria" | "preparatoria">(() => {
    if (typeof window !== "undefined") {
      const g = window.localStorage.getItem("lybanhi_grade");
      if (g === "secundaria" || g === "preparatoria") return g;
    }
    return "preparatoria";
  });
  const [selectedObjective, setSelectedObjective] = useState<"estudiar" | "admision">(() => {
    if (typeof window !== "undefined") {
      const o = window.localStorage.getItem("lybanhi_objective");
      if (o === "estudiar" || o === "admision") return o;
    }
    return "estudiar";
  });

  // Custom study materials states (PRO Feature)
  const [isPro, setIsPro] = useState(false);
  const [activeTab, setActiveTab] = useState<"school" | "custom">("school");
  const [customType, setCustomType] = useState<"text" | "file" | "link">("text");
  const [customText, setCustomText] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [materialName, setMaterialName] = useState("");

  useEffect(() => {
    let initialLevel = LEVELS[lang][1].value;
    if (typeof window !== "undefined") {
      const savedGrade = window.localStorage.getItem("lybanhi_grade");
      if (savedGrade === "secundaria") {
        initialLevel = "3º secundaria";
      }
    }
    setLevel(initialLevel);

    if (openCat) {
      if (openCat !== "book") {
        setTopic(TOPICS[openCat][lang][0]);
      } else {
        setSelectedSubject("");
        setSelectedChapterId("");
        
        let initialGrade: "secundaria" | "preparatoria" = "preparatoria";
        let initialObjective: "estudiar" | "admision" = "estudiar";
        if (typeof window !== "undefined") {
          const savedGrade = window.localStorage.getItem("lybanhi_grade") as "secundaria" | "preparatoria" | null;
          const savedObj = window.localStorage.getItem("lybanhi_objective") as "estudiar" | "admision" | null;
          if (savedGrade) initialGrade = savedGrade;
          if (savedObj) initialObjective = savedObj;
        }
        setSelectedGrade(initialGrade);
        setSelectedObjective(initialObjective);
        
        // Sync PRO plan status and reset values when opening Books drawer
        const proStatus = typeof window !== "undefined" && window.localStorage.getItem("lybanhi_pro_status") === "true";
        setIsPro(proStatus);
        setActiveTab("school");
        setCustomType("text");
        setCustomText("");
        setCustomUrl("");
        setMaterialName("");
      }
    }
  }, [lang, openCat]);

  const { data: books, isLoading: loadingBks } = useQuery({
    queryKey: ["books"],
    queryFn: () => listBks(),
    enabled: openCat === "book",
  });

  const SUBJECTS = [
    { value: "math", label: t("prep.math") },
    { value: "logic", label: t("prep.logic") },
    { value: "language", label: t("prep.language") },
    { value: "chemistry", label: t("prep.chemistry", { defaultValue: "Química" }) },
    { value: "toefl", label: "TOEFL" },
    { value: "cambridge", label: "Cambridge" },
    { value: "career", label: t("prep.career") },
  ];

  // Filter books directly by level and subject
  const filteredTexts = (books ?? []).filter(b => {
    const matchesGrade = !level || b.grade === level;
    const matchesSubject = !selectedSubject || b.subject === selectedSubject;
    return matchesGrade && matchesSubject;
  });

  const mut = useMutation({
    mutationFn: (vars: { category: Cat; topic: string; level: string; count: number }) =>
      gen({ data: { ...vars, language: lang } }),
    onSuccess: ({ quizId }) => {
      setOpenCat(null);
      navigate({ to: "/prep/quiz/$quizId", params: { quizId } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  const mutBook = useMutation({
    mutationFn: (vars: { bookId: string; count: number; level: string }) =>
      genBook({ data: { ...vars, language: lang } }),
    onSuccess: ({ quizId }) => {
      setOpenCat(null);
      navigate({ to: "/prep/quiz/$quizId", params: { quizId } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  const mutCustom = useMutation({
    mutationFn: (vars: { content: string; count: number; level: string; subject: string; sourceType: "text" | "file" | "link"; sourceName: string }) =>
      genCustom({ data: vars }),
    onSuccess: ({ quizId }) => {
      setOpenCat(null);
      navigate({ to: "/prep/quiz/$quizId", params: { quizId } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  const cats: { Icon: typeof Brain; label: string; cat: Cat | "book"; color: string }[] = [
    { Icon: Brain, label: t("prep.logic"), cat: "logic", color: "bg-primary/10 text-primary" },
    { Icon: Calculator, label: t("prep.math"), cat: "math", color: "bg-gold/20 text-gold-foreground" },
    { Icon: Languages, label: t("prep.language"), cat: "language", color: "bg-success/15 text-success" },
    { Icon: FlaskConical, label: t("prep.chemistry", { defaultValue: "Química" }), cat: "chemistry", color: "bg-purple-500/10 text-purple-500" },
    { Icon: GraduationCap, label: "TOEFL", cat: "toefl", color: "bg-primary/10 text-primary" },
    { Icon: BookOpen, label: "Cambridge", cat: "cambridge", color: "bg-gold/20 text-gold-foreground" },
    { Icon: Sparkles, label: t("prep.career"), cat: "career", color: "bg-success/15 text-success" },
    { Icon: BookOpen, label: t("prep.book", { defaultValue: "Mis Libros" }), cat: "book", color: "bg-primary/10 text-primary" },
  ];

  const openForm = (cat: Cat | "book") => {
    setOpenCat(cat);
    if (cat !== "book") {
      setTopic(TOPICS[cat][lang][0]);
    } else {
      setTopic("");
      setSelectedChapterId("");
    }
  };

  const activeCatLabel = openCat ? cats.find((c) => c.cat === openCat)?.label ?? "" : "";

  return (
    <>
      <AppHeader />
      <div className="mx-auto max-w-md px-5 pt-4">
        <h1 className="font-display text-2xl font-bold">{t("prep.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("prep.subtitle")}</p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {cats.map((c) => (
            <button
              key={c.cat}
              onClick={() => openForm(c.cat)}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-5 text-center shadow-[var(--shadow-card)] transition active:scale-95"
            >
              <div className={`grid size-12 place-items-center rounded-2xl ${c.color}`}>
                <c.Icon className="size-6" />
              </div>
              <span className="font-display font-semibold">{c.label}</span>
              <span className="text-[11px] text-muted-foreground">{t("prep.generateQuiz")}</span>
            </button>
          ))}
        </div>
      </div>

      {openCat && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={() => !mut.isPending && setOpenCat(null)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-md flex-col overflow-y-auto rounded-t-3xl border border-border bg-card p-5 pb-8 shadow-[var(--shadow-card)] sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold">
                  {t("prep.formTitle", { defaultValue: "Generador de quizzes" })} — {activeCatLabel}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("prep.formSubtitle", { defaultValue: "Personaliza tu quiz · Impulsado por IA" })}
                </p>
              </div>
              <button
                onClick={() => !mut.isPending && setOpenCat(null)}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>

            {openCat === "book" ? (
              <div className="space-y-4 mt-4 animate-fade-in">
                {/* Grado Selector */}
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground block mb-2 uppercase px-0.5">Grado</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGrade("secundaria");
                        setLevel("3º secundaria");
                        setSelectedChapterId("");
                        window.localStorage.setItem("lybanhi_grade", "secundaria");
                      }}
                      className={`flex items-center justify-center gap-1.5 h-10 rounded-xl border text-xs font-semibold transition cursor-pointer active:scale-95 ${
                        selectedGrade === "secundaria"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Secundaria
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGrade("preparatoria");
                        setLevel("1º preparatoria");
                        setSelectedChapterId("");
                        window.localStorage.setItem("lybanhi_grade", "preparatoria");
                      }}
                      className={`flex items-center justify-center gap-1.5 h-10 rounded-xl border text-xs font-semibold transition cursor-pointer active:scale-95 ${
                        selectedGrade === "preparatoria"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Preparatoria
                    </button>
                  </div>
                </div>

                {/* Objetivo Selector */}
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground block mb-2 uppercase px-0.5">Objetivo</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedObjective("estudiar");
                        window.localStorage.setItem("lybanhi_objective", "estudiar");
                      }}
                      className={`flex items-center justify-center gap-1.5 h-10 rounded-xl border text-xs font-semibold transition cursor-pointer active:scale-95 ${
                        selectedObjective === "estudiar"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Estudiar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedObjective("admision");
                        window.localStorage.setItem("lybanhi_objective", "admision");
                      }}
                      className={`flex items-center justify-center gap-1.5 h-10 rounded-xl border text-xs font-semibold transition cursor-pointer active:scale-95 ${
                        selectedObjective === "admision"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Examen de Admisión
                    </button>
                  </div>
                </div>

                {/* Explicación de la selección del objetivo */}
                <div className="bg-[#17224D]/5 border border-[#3B6DE8]/10 rounded-xl p-3 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedObjective === "estudiar" ? (
                    <span>
                      📚 <strong>Modo Estudio:</strong> Practica quizzes por temas y capítulos. En la versión Pro podrás subir tu propio material para estudiar libremente.
                    </span>
                  ) : (
                    <span>
                      🎯 <strong>Preparación de Admisión:</strong> Enfocado en exámenes de admisión {selectedGrade === "preparatoria" ? "universitaria (PAA / EXANI-II)" : "a preparatoria (tipo COMIPEMS)"}. Estudia con material de la app y agrega material propio en Pro.
                    </span>
                  )}
                </div>

                <div className="border-t border-border/60 my-1" />

                {/* Tab selector */}
                <div className="grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1 text-xs font-semibold">
                  <button
                    onClick={() => {
                      setActiveTab("school");
                      setSelectedSubject("");
                      setSelectedChapterId("");
                    }}
                    className={`rounded-xl py-2 transition active:scale-[0.98] ${
                      activeTab === "school" 
                        ? "bg-card text-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Material escolar
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("custom");
                      setSelectedSubject("");
                      setSelectedChapterId("");
                    }}
                    className={`rounded-xl py-2 transition active:scale-[0.98] flex items-center justify-center gap-1 ${
                      activeTab === "custom" 
                        ? "bg-card text-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Mi Material {!isPro && "🔒"}
                  </button>
                </div>

                {activeTab === "school" ? (
                  <>
                    {loadingBks ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-2" />
                        {t("prep.loadingBooks", { defaultValue: "Cargando libros..." })}
                      </div>
                    ) : !books || books.length === 0 ? (
                      <div className="py-6 text-center text-sm text-muted-foreground border border-dashed border-border rounded-2xl p-4">
                        {t("prep.noBooksAvailable", { defaultValue: "No hay libros disponibles. Súbelos desde el panel de administración de libros." })}
                      </div>
                    ) : (
                      <>
                        {/* Nivel escolar (Grado) */}
                        <label className="block rounded-2xl border border-border p-3">
                          <span className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                            {t("prep.level", { defaultValue: "Nivel escolar" })}
                          </span>
                          <select
                            value={level}
                            onChange={(e) => {
                              setLevel(e.target.value);
                              setSelectedChapterId("");
                            }}
                            className="mt-1 w-full bg-transparent text-sm font-medium outline-none cursor-pointer"
                          >
                            {LEVELS[lang]
                              .filter((l) => {
                                if (selectedGrade === "secundaria") {
                                  return l.value.toLowerCase().includes("secundaria");
                                } else {
                                  return l.value.toLowerCase().includes("prepara");
                                }
                              })
                              .map((l) => (
                                <option key={l.value} value={l.value}>{l.label}</option>
                              ))}
                          </select>
                        </label>

                        {/* Materia (Categoría) */}
                        <label className="block rounded-2xl border border-border p-3">
                          <span className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                            {t("prep.selectSubject", { defaultValue: "Seleccionar materia" })}
                          </span>
                          <select
                            value={selectedSubject}
                            onChange={(e) => {
                              setSelectedSubject(e.target.value);
                              setSelectedChapterId("");
                            }}
                            className="mt-1 w-full bg-transparent text-sm font-medium outline-none cursor-pointer"
                          >
                            <option value="">-- {t("prep.selectSubject", { defaultValue: "Seleccionar materia" })} --</option>
                            {SUBJECTS.map(s => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                        </label>

                        {/* Texto de estudio */}
                        {selectedSubject && (
                          <label className="block rounded-2xl border border-border p-3 animate-fade-in">
                            <span className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                              {t("prep.selectText", { defaultValue: "Texto de estudio" })}
                            </span>
                            <select
                              value={selectedChapterId}
                              onChange={(e) => setSelectedChapterId(e.target.value)}
                              className="mt-1 w-full bg-transparent text-sm font-medium outline-none cursor-pointer"
                            >
                              <option value="">-- {t("prep.selectTextPlaceholder", { defaultValue: "Seleccionar texto de estudio" })} --</option>
                              {filteredTexts.map((txt, index) => {
                                const contentSnippet = txt.content.length > 50 
                                  ? txt.content.slice(0, 50) + "..." 
                                  : txt.content;
                                return (
                                  <option key={txt.id} value={txt.id}>
                                    Texto #{index + 1} ({contentSnippet})
                                  </option>
                                );
                              })}
                            </select>
                          </label>
                        )}

                        <div className="mt-3">
                          <label className="block rounded-2xl border border-border p-3">
                            <span className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                              {t("prep.count", { defaultValue: "Número de preguntas" })}
                            </span>
                            <select
                              value={count}
                              onChange={(e) => setCount(Number(e.target.value))}
                              className="mt-1 w-full bg-transparent text-sm font-medium outline-none cursor-pointer"
                            >
                              {COUNTS.map((n) => (
                                <option key={n} value={n}>
                                  {n} {t("prep.questionsWord", { defaultValue: "preguntas" })}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>

                        <button
                          disabled={mutBook.isPending || !selectedChapterId}
                          onClick={() => {
                            const finalLevel = selectedObjective === "admision"
                              ? `${level} (Preparación para Examen de Admisión ${selectedGrade === "preparatoria" ? "Universitaria PAA/EXANI-II" : "a Preparatoria"})`
                              : level;
                            mutBook.mutate({ bookId: selectedChapterId, count, level: finalLevel });
                          }}
                          className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card font-semibold transition active:scale-[0.99] disabled:opacity-60 cursor-pointer animate-fade-in"
                        >
                          <Sparkles className="size-4" />
                          {t("prep.generateQuiz")}
                          <ArrowUpRight className="size-4" />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  /* Custom Material (PRO Feature) */
                  <>
                    {!isPro ? (
                      <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-[var(--shadow-card)] space-y-4 py-8 animate-fade-in">
                        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                          <Sparkles className="size-6 animate-pulse" />
                        </div>
                        <h3 className="font-display font-bold text-lg">Estudia a tu manera con Lybanhi Pro ✨</h3>
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                          Sube tus propios archivos PDF, fotos de tus cuadernos/libros, copia y pega textos o ingresa enlaces de páginas web educativas.
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-left text-[11px] font-semibold text-slate-600 dark:text-slate-300 max-w-xs mx-auto py-2">
                          <div className="flex items-center gap-1.5">📸 Fotos e imágenes</div>
                          <div className="flex items-center gap-1.5">📄 Documentos PDF</div>
                          <div className="flex items-center gap-1.5">🔗 Enlaces Web</div>
                          <div className="flex items-center gap-1.5">✍️ Copia y pega</div>
                        </div>
                        <button
                          onClick={() => {
                            window.localStorage.setItem("lybanhi_pro_status", "true");
                            setIsPro(true);
                            toast.success("¡Plan Lybanhi Pro activado con éxito! ✨ (Modo pruebas)");
                          }}
                          className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition hover:opacity-90 active:scale-95 flex items-center justify-center gap-2"
                        >
                          <Sparkles className="size-4" />
                          Probar Pro Gratis
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4 animate-fade-in">
                        {/* Selector de tipo de material */}
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground block mb-2 uppercase px-0.5">Tipo de entrada</label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: "text", label: "Texto", icon: Sparkles },
                              { id: "file", label: "Foto / PDF", icon: BookOpen },
                              { id: "link", label: "Enlace Web", icon: ArrowUpRight }
                            ].map(type => (
                              <button
                                key={type.id}
                                onClick={() => {
                                  setCustomType(type.id as any);
                                  setCustomText("");
                                  setCustomUrl("");
                                }}
                                className={`flex items-center justify-center gap-1.5 h-10 rounded-xl border text-xs font-semibold transition ${
                                  customType === type.id 
                                    ? "border-primary bg-primary/10 text-primary" 
                                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                <type.icon className="size-3.5" />
                                {type.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Input de Nombre del Material */}
                        <label className="block rounded-2xl border border-border p-3">
                          <span className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                            Nombre del material
                          </span>
                          <input
                            type="text"
                            value={materialName}
                            onChange={(e) => setMaterialName(e.target.value)}
                            placeholder="Ej. Apuntes de Biología, Tarea de Química..."
                            className="mt-1 w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
                          />
                        </label>

                        {/* Contexto a la IA */}
                        <div className="grid grid-cols-2 gap-2">
                          <label className="block rounded-2xl border border-border p-3">
                            <span className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                              Nivel escolar
                            </span>
                            <select
                              value={level}
                              onChange={(e) => setLevel(e.target.value)}
                              className="mt-1 w-full bg-transparent text-sm font-medium outline-none cursor-pointer"
                            >
                              {LEVELS[lang]
                                .filter((l) => {
                                  if (selectedGrade === "secundaria") {
                                    return l.value.toLowerCase().includes("secundaria");
                                  } else {
                                    return l.value.toLowerCase().includes("prepara");
                                  }
                                })
                                .map((l) => (
                                  <option key={l.value} value={l.value}>{l.label}</option>
                                ))}
                            </select>
                          </label>
                          <label className="block rounded-2xl border border-border p-3">
                            <span className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                              Asignatura
                            </span>
                            <input
                              type="text"
                              value={selectedSubject}
                              onChange={(e) => setSelectedSubject(e.target.value)}
                              placeholder="Ej. Biología, Química..."
                              className="mt-1 w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
                            />
                          </label>
                        </div>

                        {/* Formulario según tipo de material */}
                        {customType === "text" && (
                          <div className="space-y-1.5 animate-fade-in">
                            <label className="text-[10px] font-bold text-muted-foreground block uppercase px-1">Pega tus apuntes o texto</label>
                            <textarea
                              required
                              value={customText}
                              onChange={(e) => setCustomText(e.target.value)}
                              placeholder="Pega aquí el contenido que deseas estudiar..."
                              className="h-32 w-full rounded-2xl border border-border bg-card p-3.5 text-sm text-foreground focus:border-primary focus:outline-none resize-none font-sans"
                            />
                          </div>
                        )}

                        {customType === "file" && (
                          <div className="space-y-2 animate-fade-in">
                            <div className="flex justify-between items-center px-1">
                              <label className="text-[10px] font-bold text-muted-foreground block uppercase">Subir foto o PDF</label>
                              <label className={`text-xs font-bold text-primary flex items-center gap-1 cursor-pointer hover:underline ${isExtracting ? "opacity-50 pointer-events-none" : ""}`}>
                                <BookOpen className="size-3.5" />
                                {isExtracting ? "Procesando..." : "Subir Archivo (Foto, PDF, TXT)"}
                                <input
                                  type="file"
                                  accept=".txt,.pdf,.png,.jpg,.jpeg,.webp"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const name = file.name.toLowerCase();
                                    const isTxt = name.endsWith(".txt");
                                    const isImage = /\.(png|jpe?g|webp)$/i.test(name);
                                    const isPdf = name.endsWith(".pdf");

                                    if (!isTxt && !isImage && !isPdf) {
                                      toast.error("Formatos permitidos: .txt, .pdf, .png, .jpg, .jpeg, .webp");
                                      return;
                                    }

                                    if (file.size > 10 * 1024 * 1024) {
                                      toast.error("El archivo no debe superar los 10MB");
                                      return;
                                    }

                                    if (!materialName) {
                                      setMaterialName(file.name.replace(/\.[^/.]+$/, ""));
                                    }

                                    if (isTxt) {
                                      const reader = new FileReader();
                                      reader.onload = (evt) => {
                                        setCustomText(evt.target?.result as string);
                                        toast.success("Archivo de texto cargado con éxito");
                                      };
                                      reader.readAsText(file);
                                    } else {
                                      setIsExtracting(true);
                                      const toastId = toast.loading("Extrayendo texto con Gemini...");
                                      try {
                                        const reader = new FileReader();
                                        reader.onload = async (evt) => {
                                          try {
                                            const dataUrl = evt.target?.result as string;
                                            const base64Parts = dataUrl.split(",");
                                            const mType = base64Parts[0].match(/:(.*?);/)?.[1] || file.type;
                                            const base64Data = base64Parts[1];

                                            const result = await getExtractTextFn({ data: { base64Data, mimeType: mType } });
                                            if (result?.text) {
                                              setCustomText(result.text);
                                              toast.success("Texto extraído con éxito", { id: toastId });
                                            } else {
                                              toast.error("No se pudo extraer texto del archivo.", { id: toastId });
                                            }
                                          } catch (err) {
                                            toast.error(err instanceof Error ? err.message : "Error al procesar", { id: toastId });
                                          } finally {
                                            setIsExtracting(false);
                                          }
                                        };
                                        reader.readAsDataURL(file);
                                      } catch (err) {
                                        toast.error("Error al leer el archivo", { id: toastId });
                                        setIsExtracting(false);
                                      }
                                    }
                                  }}
                                  disabled={isExtracting}
                                  className="hidden"
                                />
                              </label>
                            </div>
                            <textarea
                              required
                              value={customText}
                              onChange={(e) => setCustomText(e.target.value)}
                              disabled={isExtracting}
                              placeholder={isExtracting ? "Extrayendo texto con la IA de Gemini..." : "Sube una imagen o PDF y se mostrará el texto aquí..."}
                              className="h-32 w-full rounded-2xl border border-border bg-card p-3.5 text-sm text-foreground focus:border-primary focus:outline-none resize-none disabled:opacity-75 font-sans leading-relaxed"
                            />
                          </div>
                        )}

                        {customType === "link" && (
                          <div className="space-y-1.5 animate-fade-in">
                            <label className="text-[10px] font-bold text-muted-foreground block uppercase px-1">Enlace de página web</label>
                            <input
                              type="url"
                              required
                              value={customUrl}
                              onChange={(e) => setCustomUrl(e.target.value)}
                              placeholder="Pega la URL de Wikipedia, artículo o blog..."
                              className="h-11 w-full rounded-2xl border border-border bg-card px-3.5 text-sm text-foreground focus:border-primary focus:outline-none"
                            />
                          </div>
                        )}

                        {/* Número de preguntas */}
                        <label className="block rounded-2xl border border-border p-3">
                          <span className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                            Número de preguntas
                          </span>
                          <select
                            value={count}
                            onChange={(e) => setCount(Number(e.target.value))}
                            className="mt-1 w-full bg-transparent text-sm font-medium outline-none cursor-pointer"
                          >
                            {COUNTS.map((n) => (
                              <option key={n} value={n}>
                                {n} preguntas
                              </option>
                            ))}
                          </select>
                        </label>

                        {/* Botón de Generar Quiz */}
                        <button
                          disabled={
                            mutCustom.isPending || 
                            isExtracting || 
                            (customType === "link" ? !customUrl : !customText)
                          }
                          onClick={() => {
                            const contentStr = customType === "link" ? customUrl : customText;
                            const finalLevel = selectedObjective === "admision"
                              ? `${level} (Preparación para Examen de Admisión ${selectedGrade === "preparatoria" ? "Universitaria PAA/EXANI-II" : "a Preparatoria"})`
                              : level;
                            mutCustom.mutate({
                              content: contentStr,
                              count,
                              level: finalLevel,
                              subject: selectedSubject || "General",
                              sourceType: customType,
                              sourceName: materialName.trim() || ""
                            });
                          }}
                          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card font-semibold transition active:scale-[0.99] disabled:opacity-60 cursor-pointer shadow-sm animate-fade-in"
                        >
                          <Sparkles className="size-4" />
                          Generar Quiz con mi Material ✨
                          <ArrowUpRight className="size-4" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <label className="rounded-2xl border border-border p-3">
                    <span className="block text-[10px] font-semibold tracking-wider text-muted-foreground">
                      {t("prep.level", { defaultValue: "NIVEL ESCOLAR" }).toUpperCase()}
                    </span>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      className="mt-1 w-full bg-transparent text-sm font-medium outline-none"
                    >
                      {LEVELS[lang].map((l) => (
                        <option key={l.value} value={l.value}>{l.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="rounded-2xl border border-border p-3">
                    <span className="block text-[10px] font-semibold tracking-wider text-muted-foreground">
                      {t("prep.count", { defaultValue: "NÚMERO DE PREGUNTAS" }).toUpperCase()}
                    </span>
                    <select
                      value={count}
                      onChange={(e) => setCount(Number(e.target.value))}
                      className="mt-1 w-full bg-transparent text-sm font-medium outline-none"
                    >
                      {COUNTS.map((n) => (
                        <option key={n} value={n}>
                          {n} {t("prep.questionsWord", { defaultValue: "preguntas" })}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="mt-3 rounded-2xl border border-border p-3">
                  <span className="block text-[10px] font-semibold tracking-wider text-muted-foreground">
                    {t("prep.topicPick", { defaultValue: "TEMA (ELIGE UNO)" }).toUpperCase()}
                  </span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {TOPICS[openCat as Cat][lang].map((tp) => {
                      const on = topic === tp;
                      return (
                        <button
                          key={tp}
                          onClick={() => setTopic(tp)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                            on ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground"
                          }`}
                        >
                          {tp}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  disabled={mut.isPending || !topic}
                  onClick={() => mut.mutate({ category: openCat as Cat, topic, level, count })}
                  className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card font-semibold transition active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                >
                  <Sparkles className="size-4" />
                  {t("prep.generateQuiz")}
                  <ArrowUpRight className="size-4" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {(mut.isPending || mutBook.isPending || mutCustom.isPending) && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-6 py-5 shadow-[var(--shadow-card)]">
            <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm font-medium">{t("recs.generating")}</p>
          </div>
        </div>
      )}
    </>
  );
}
