import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { generateQuiz, listBooks, generateBookQuiz } from "@/lib/quiz.functions";
import { AppHeader } from "@/components/AppHeader";
import { Brain, Calculator, Languages, GraduationCap, BookOpen, Sparkles, X, ArrowUpRight } from "lucide-react";
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
  const listBks = useServerFn(listBooks);
  const lang = (i18n.language.slice(0, 2) as Lang) in TOPICS.math ? (i18n.language.slice(0, 2) as Lang) : "es";

  const [openCat, setOpenCat] = useState<Cat | "book" | null>(null);
  const [level, setLevel] = useState(LEVELS[lang][1].value);
  const [count, setCount] = useState<number>(5);
  const [topic, setTopic] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");

  useEffect(() => {
    setLevel(LEVELS[lang][1].value);
    if (openCat) {
      if (openCat !== "book") {
        setTopic(TOPICS[openCat][lang][0]);
      } else {
        setSelectedSubject("");
        setSelectedChapterId("");
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

  const cats: { Icon: typeof Brain; label: string; cat: Cat | "book"; color: string }[] = [
    { Icon: Brain, label: t("prep.logic"), cat: "logic", color: "bg-primary/10 text-primary" },
    { Icon: Calculator, label: t("prep.math"), cat: "math", color: "bg-gold/20 text-gold-foreground" },
    { Icon: Languages, label: t("prep.language"), cat: "language", color: "bg-success/15 text-success" },
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
              <div className="space-y-4 mt-4">
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
                        {LEVELS[lang].map((l) => (
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
                      onClick={() => mutBook.mutate({ bookId: selectedChapterId, count, level })}
                      className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card font-semibold transition active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                    >
                      <Sparkles className="size-4" />
                      {t("prep.generateQuiz")}
                      <ArrowUpRight className="size-4" />
                    </button>
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

      {(mut.isPending || mutBook.isPending) && (
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
