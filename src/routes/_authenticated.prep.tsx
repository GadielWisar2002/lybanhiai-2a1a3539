import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { generateQuiz } from "@/lib/quiz.functions";
import { AppHeader } from "@/components/AppHeader";
import { Brain, Calculator, Languages, GraduationCap, BookOpen, Sparkles, X, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/prep")({
  head: () => ({ meta: [{ title: "Prep — Lybanhi" }] }),
  component: Prep,
});

type Cat = "career" | "toefl" | "cambridge" | "logic" | "math" | "language";
type Lang = "es" | "en" | "fr";

const LEVELS: Record<Lang, { value: string; label: string }[]> = {
  es: [
    { value: "3º secundaria", label: "3º Secundaria" },
    { value: "1º preparatoria", label: "1º Preparatoria" },
    { value: "2º preparatoria", label: "2º Preparatoria" },
    { value: "3º preparatoria", label: "3º Preparatoria" },
  ],
  en: [
    { value: "9th grade", label: "9th Grade" },
    { value: "10th grade", label: "10th Grade" },
    { value: "11th grade", label: "11th Grade" },
    { value: "12th grade", label: "12th Grade" },
  ],
  fr: [
    { value: "3e", label: "3e (collège)" },
    { value: "2nde", label: "Seconde" },
    { value: "1ère", label: "Première" },
    { value: "Terminale", label: "Terminale" },
  ],
};

const TOPICS: Record<Cat, Record<Lang, string[]>> = {
  math: {
    es: ["Números reales", "Polinomios", "Factorización", "Ecuaciones cuadráticas", "Funciones lineales", "Razones y proporciones", "Trigonometría básica", "Probabilidad"],
    en: ["Real numbers", "Polynomials", "Factoring", "Quadratic equations", "Linear functions", "Ratios and proportions", "Basic trigonometry", "Probability"],
    fr: ["Nombres réels", "Polynômes", "Factorisation", "Équations quadratiques", "Fonctions linéaires", "Ratios et proportions", "Trigonométrie de base", "Probabilité"],
  },
  logic: {
    es: ["Series numéricas", "Analogías", "Deducción", "Acertijos", "Patrones visuales", "Silogismos"],
    en: ["Number series", "Analogies", "Deduction", "Riddles", "Visual patterns", "Syllogisms"],
    fr: ["Séries numériques", "Analogies", "Déduction", "Énigmes", "Motifs visuels", "Syllogismes"],
  },
  language: {
    es: ["Comprensión lectora", "Sinónimos y antónimos", "Gramática", "Ortografía", "Vocabulario"],
    en: ["Reading comprehension", "Synonyms and antonyms", "Grammar", "Spelling", "Vocabulary"],
    fr: ["Compréhension écrite", "Synonymes et antonymes", "Grammaire", "Orthographe", "Vocabulaire"],
  },
  toefl: {
    es: ["Reading", "Listening", "Grammar", "Vocabulary", "Idioms"],
    en: ["Reading", "Listening", "Grammar", "Vocabulary", "Idioms"],
    fr: ["Reading", "Listening", "Grammar", "Vocabulary", "Idioms"],
  },
  cambridge: {
    es: ["B2 Reading", "B2 Use of English", "C1 Reading", "C1 Writing", "Phrasal verbs"],
    en: ["B2 Reading", "B2 Use of English", "C1 Reading", "C1 Writing", "Phrasal verbs"],
    fr: ["B2 Reading", "B2 Use of English", "C1 Reading", "C1 Writing", "Phrasal verbs"],
  },
  career: {
    es: ["Aptitud general", "Intereses vocacionales", "Habilidades blandas", "Razonamiento abstracto"],
    en: ["General aptitude", "Vocational interests", "Soft skills", "Abstract reasoning"],
    fr: ["Aptitude générale", "Intérêts professionnels", "Compétences interpersonnelles", "Raisonnement abstrait"],
  },
};

const COUNTS = [3, 5, 8, 10];

function Prep() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const gen = useServerFn(generateQuiz);
  const lang = (i18n.language.slice(0, 2) as Lang) in TOPICS.math ? (i18n.language.slice(0, 2) as Lang) : "es";

  const [openCat, setOpenCat] = useState<Cat | null>(null);
  const [level, setLevel] = useState(LEVELS[lang][1].value);
  const [count, setCount] = useState<number>(5);
  const [topic, setTopic] = useState<string>("");

  const mut = useMutation({
    mutationFn: (vars: { category: Cat; topic: string; level: string; count: number }) =>
      gen({ data: { ...vars, language: lang } }),
    onSuccess: ({ quizId }) => {
      setOpenCat(null);
      navigate({ to: "/prep/quiz/$quizId", params: { quizId } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  const cats: { Icon: typeof Brain; label: string; cat: Cat; color: string }[] = [
    { Icon: Brain, label: t("prep.logic"), cat: "logic", color: "bg-primary/10 text-primary" },
    { Icon: Calculator, label: t("prep.math"), cat: "math", color: "bg-gold/20 text-gold-foreground" },
    { Icon: Languages, label: t("prep.language"), cat: "language", color: "bg-success/15 text-success" },
    { Icon: GraduationCap, label: "TOEFL", cat: "toefl", color: "bg-primary/10 text-primary" },
    { Icon: BookOpen, label: "Cambridge", cat: "cambridge", color: "bg-gold/20 text-gold-foreground" },
    { Icon: Sparkles, label: t("prep.career"), cat: "career", color: "bg-success/15 text-success" },
  ];

  const openForm = (cat: Cat) => {
    setOpenCat(cat);
    setTopic(TOPICS[cat][lang][0]);
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
          className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm"
          onClick={() => !mut.isPending && setOpenCat(null)}
        >
          <div
            className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[90vh] max-w-md flex-col overflow-y-auto rounded-t-3xl border border-border bg-card p-5 pb-8 shadow-[var(--shadow-card)]"
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
                {TOPICS[openCat][lang].map((tp) => {
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
              onClick={() => mut.mutate({ category: openCat, topic, level, count })}
              className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card font-semibold transition active:scale-[0.99] disabled:opacity-60"
            >
              <Sparkles className="size-4" />
              {t("prep.generateQuiz")}
              <ArrowUpRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {mut.isPending && (
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
