import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { generateQuiz } from "@/lib/quiz.functions";
import { AppHeader } from "@/components/AppHeader";
import { Brain, Calculator, Languages, GraduationCap, BookOpen, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/prep")({
  head: () => ({ meta: [{ title: "Prep — Lybanhi" }] }),
  component: Prep,
});

function Prep() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const gen = useServerFn(generateQuiz);
  const lang = i18n.language.slice(0,2) as "es"|"en"|"fr";

  const mut = useMutation({
    mutationFn: (vars: { category: "career"|"toefl"|"cambridge"|"logic"|"math"|"language"; topic: string }) =>
      gen({ data: { ...vars, language: lang } }),
    onSuccess: ({ quizId }) => navigate({ to: "/prep/quiz/$quizId", params: { quizId } }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  const cats = [
    { Icon: Brain, label: t("prep.logic"), topic: "Logic puzzles and reasoning", cat: "logic" as const, color: "bg-primary/10 text-primary" },
    { Icon: Calculator, label: t("prep.math"), topic: "Algebra and arithmetic", cat: "math" as const, color: "bg-gold/20 text-gold-foreground" },
    { Icon: Languages, label: t("prep.language"), topic: "Reading comprehension", cat: "language" as const, color: "bg-success/15 text-success" },
    { Icon: GraduationCap, label: "TOEFL", topic: "TOEFL grammar and vocabulary", cat: "toefl" as const, color: "bg-primary/10 text-primary" },
    { Icon: BookOpen, label: "Cambridge", topic: "Cambridge B2 reading", cat: "cambridge" as const, color: "bg-gold/20 text-gold-foreground" },
    { Icon: Sparkles, label: t("prep.career"), topic: "General career aptitude", cat: "career" as const, color: "bg-success/15 text-success" },
  ];

  return (
    <>
      <AppHeader />
      <div className="mx-auto max-w-md px-5 pt-4">
        <h1 className="font-display text-2xl font-bold">{t("prep.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("prep.subtitle")}</p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {cats.map(c => (
            <button key={c.label} disabled={mut.isPending}
              onClick={() => mut.mutate({ category: c.cat, topic: c.topic })}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-5 text-center shadow-[var(--shadow-card)] transition active:scale-95 disabled:opacity-60">
              <div className={`grid size-12 place-items-center rounded-2xl ${c.color}`}><c.Icon className="size-6" /></div>
              <span className="font-display font-semibold">{c.label}</span>
              <span className="text-[11px] text-muted-foreground">{t("prep.generateQuiz")}</span>
            </button>
          ))}
        </div>
        {mut.isPending && <p className="mt-4 text-center text-sm text-muted-foreground">{t("recs.generating")}</p>}
      </div>
    </>
  );
}
