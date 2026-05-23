import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { getQuiz, submitQuizAttempt } from "@/lib/quiz.functions";
import { X, ArrowLeft, ArrowRight, Check, Trophy } from "lucide-react";
import { toast } from "sonner";
import streakCap from "@/assets/streak-cap.png";

export const Route = createFileRoute("/_authenticated/prep/quiz/$quizId")({
  head: () => ({ meta: [{ title: "Quiz — Lybanhi" }] }),
  component: QuizPage,
});

type Q = { q: string; options: string[]; correctIndex: number; explanation: string };

function QuizPage() {
  const { quizId } = Route.useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const get = useServerFn(getQuiz);
  const submit = useServerFn(submitQuizAttempt);
  const { data: quiz, isLoading } = useQuery({ queryKey: ["quiz", quizId], queryFn: () => get({ data: { id: quizId } }) });

  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [done, setDone] = useState<{ score: number; xp: number } | null>(null);

  if (isLoading || !quiz) return <div className="grid min-h-screen place-items-center text-muted-foreground">…</div>;
  const questions = quiz.questions as unknown as Q[];
  const total = questions.length;

  if (done) {
    return (
      <main className="mx-auto max-w-md px-5 pt-12 text-center">
        <img src={streakCap} alt="" width={96} height={96} className="mx-auto size-24" />
        <h1 className="mt-4 font-display text-3xl font-bold">{t("quiz.resultTitle")}</h1>
        <p className="mt-2 text-muted-foreground">{t("quiz.yourScore")}</p>
        <p className="mt-1 font-display text-5xl font-bold text-primary">{done.score}/{total}</p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-gold/20 px-3 py-1.5">
          <Trophy className="size-4 text-gold-foreground" /><span className="font-semibold">+{done.xp} XP</span>
        </div>
        <Link to="/prep" className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary font-semibold text-primary-foreground">
          {t("quiz.backToPrep")}
        </Link>
      </main>
    );
  }

  const current = questions[i];
  const selected = answers[i];
  const percent = Math.round(((i) / total) * 100);

  const next = async () => {
    if (i + 1 < total) { setI(i + 1); return; }
    const score = answers.reduce((acc, a, idx) => acc + (a === questions[idx].correctIndex ? 1 : 0), 0);
    try {
      const r = await submit({ data: { quiz_id: quizId, answers, score, total } });
      setDone({ score, xp: r.xp });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  };

  return (
    <main className="mx-auto max-w-md px-5 pt-4">
      <header className="flex items-center justify-between border-b border-border pb-3">
        <button onClick={() => navigate({ to: "/prep" })}><X className="size-5" /></button>
        <span className="font-display text-sm font-bold text-primary">Lybanhi</span>
        <span className="text-xs font-semibold tracking-wider text-muted-foreground">{t("quiz.questionOf", { n: i+1, total })}</span>
      </header>
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="tracking-wider text-primary">{t("quiz.progress")}</span>
          <span className="text-muted-foreground">{t("quiz.completed", { percent })}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <h2 className="mt-8 text-center font-display text-lg font-semibold leading-snug">{current.q}</h2>

      <ul className="mt-6 space-y-3">
        {current.options.map((opt, idx) => {
          const on = selected === idx;
          return (
            <li key={idx}>
              <button onClick={() => setAnswers(a => { const n = [...a]; n[i] = idx; return n; })}
                className={`flex w-full items-center justify-between gap-3 rounded-2xl border-2 p-4 text-left transition ${on ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                <span className="text-sm font-medium">{opt}</span>
                <span className={`grid size-5 place-items-center rounded-full border-2 ${on ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                  {on && <Check className="size-3" />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 flex gap-3 pb-8">
        <button onClick={() => setI(Math.max(0, i-1))} disabled={i === 0}
          className="inline-flex h-12 items-center gap-2 rounded-2xl border border-border bg-card px-4 font-semibold disabled:opacity-50">
          <ArrowLeft className="size-4" /> {t("common.back")}
        </button>
        <button onClick={next} disabled={selected === undefined}
          className="ml-auto inline-flex h-12 items-center gap-2 rounded-2xl bg-primary px-5 font-semibold text-primary-foreground disabled:opacity-50">
          {i+1 === total ? t("quiz.finish") : t("quiz.next")} <ArrowRight className="size-4" />
        </button>
      </div>
    </main>
  );
}
