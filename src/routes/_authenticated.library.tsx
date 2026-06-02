import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { AppHeader } from "@/components/AppHeader";
import { listMyQuizzes } from "@/lib/quiz.functions";
import { TOPICS, type Cat, type Lang } from "@/lib/topics";
import { BookOpen, Brain, Calculator, Languages, GraduationCap, Sparkles, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({ meta: [{ title: "Library — Lybanhi" }] }),
  component: Library,
});

const ICONS = {
  logic: Brain,
  math: Calculator,
  language: Languages,
  toefl: GraduationCap,
  cambridge: BookOpen,
  career: Sparkles,
} as const;

function timeAgo(iso: string, lang: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
  if (diff < 60) return rtf.format(-Math.round(diff), "second");
  if (diff < 3600) return rtf.format(-Math.round(diff / 60), "minute");
  if (diff < 86400) return rtf.format(-Math.round(diff / 3600), "hour");
  return rtf.format(-Math.round(diff / 86400), "day");
}

function localizeTopic(topic: string, targetLang: string): string {
  const prefixRe = /^\s*(Repaso\s*:\s*|Review\s*:\s*|Révision\s*:\s*)+/i;
  const base = topic.replace(prefixRe, "").trim();
  const hadPrefix = base !== topic.trim();
  
  const langKey = ((targetLang || "es").slice(0, 2).toLowerCase() as Lang) || "es";
  let translatedBase = base;

  const cleanStr = (s: string) => (s || "").normalize("NFC").trim().toLowerCase();
  const baseClean = cleanStr(base);

  outerLoop:
  for (const cat of Object.keys(TOPICS) as Cat[]) {
    const translations = TOPICS[cat];
    for (const l of ["es", "en", "fr"] as Lang[]) {
      const idx = translations[l].findIndex(
        t => cleanStr(t) === baseClean
      );
      if (idx !== -1) {
        translatedBase = translations[langKey]?.[idx] || translatedBase;
        break outerLoop;
      }
    }
  }

  if (!hadPrefix) return translatedBase;
  const prefix = langKey === "fr" ? "Révision : " : langKey === "en" ? "Review: " : "Repaso: ";
  return prefix + translatedBase;
}

function Library() {
  const { t, i18n } = useTranslation();
  const list = useServerFn(listMyQuizzes);
  const { data, isLoading } = useQuery({ queryKey: ["myQuizzes"], queryFn: () => list() });

  return (
    <>
      <AppHeader />
      <div className="mx-auto max-w-md px-5 pt-4 pb-24">
        <h1 className="font-display text-2xl font-bold">{t("library.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("library.recentQuizzes")}
        </p>

        {isLoading ? (
          <div className="mt-8 grid place-items-center">
            <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : !data || data.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
            <BookOpen className="mx-auto size-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">{t("library.empty")}</p>
          </div>
        ) : (
          <ul className="mt-5 space-y-2">
            {data.map((q) => {
              const Icon = ICONS[q.category as keyof typeof ICONS] ?? BookOpen;
              return (
                <li key={q.id}>
                  <Link
                    to="/prep/quiz/$quizId"
                    params={{ quizId: q.id }}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)] transition active:scale-[0.99]"
                  >
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-sm font-semibold">{localizeTopic(q.topic, i18n.language)}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {t(`prep.${q.category}`, { defaultValue: q.category })} · {q.questions_count} {t("library.questions")} · {timeAgo(q.created_at, i18n.language)}
                      </p>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
