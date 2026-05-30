import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { getQuiz, submitQuizAttempt, regenerateFromWrong } from "@/lib/quiz.functions";
import { X, ArrowLeft, ArrowRight, Check, Trophy, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import streakCap from "@/assets/streak-cap.png";

export const Route = createFileRoute("/_authenticated/prep_/quiz/$quizId")({
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
  const regen = useServerFn(regenerateFromWrong);
  const { data: quiz, isLoading } = useQuery({ queryKey: ["quiz", quizId], queryFn: () => get({ data: { id: quizId } }) });

  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [done, setDone] = useState<{ score: number; xp: number; answers: number[] } | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [retrying, setRetrying] = useState(false);

  if (isLoading || !quiz) return <div className="grid min-h-screen place-items-center text-muted-foreground">…</div>;
  const questions = quiz.questions as unknown as Q[];
  const total = questions.length;

  if (done) {
    const wrongIndexes = done.answers
      .map((a, idx) => (a !== questions[idx].correctIndex ? idx : -1))
      .filter((x) => x >= 0);

    const handleRetry = async () => {
      if (!wrongIndexes.length) return;
      setRetrying(true);
      try {
        const r = await regen({ data: { quizId, wrongIndexes } });
        navigate({ to: "/prep/quiz/$quizId", params: { quizId: r.quizId } });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error");
        setRetrying(false);
      }
    };

    return (
      <main className="mx-auto max-w-md px-5 pt-12 pb-12 text-center">
        <img src={streakCap} alt="" width={96} height={96} className="mx-auto size-24" />
        <h1 className="mt-4 font-display text-3xl font-bold">{t("quiz.resultTitle")}</h1>
        <p className="mt-2 text-muted-foreground">{t("quiz.yourScore")}</p>
        <p className="mt-1 font-display text-5xl font-bold text-primary">{done.score}/{total}</p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-gold/20 px-3 py-1.5">
          <Trophy className="size-4 text-gold-foreground" /><span className="font-semibold">+{done.xp} XP</span>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={() => setShowReview((s) => !s)}
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-border bg-card font-semibold"
          >
            {showReview ? t("quiz.hideAnswers") : t("quiz.viewAnswers")}
          </button>

          {wrongIndexes.length > 0 && (
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gold px-5 font-semibold text-gold-foreground disabled:opacity-60"
            >
              {retrying ? (
                <><Loader2 className="size-4 animate-spin" /> {t("quiz.generatingRetry")}</>
              ) : (
                t("quiz.retryWrong", { count: wrongIndexes.length })
              )}
            </button>
          )}

          <Link to="/prep" className="inline-flex h-12 items-center justify-center rounded-2xl bg-primary font-semibold text-primary-foreground">
            {t("quiz.backToPrep")}
          </Link>
        </div>

        {showReview && (
          <ul className="mt-8 space-y-4 text-left">
            {questions.map((q, idx) => {
              const userAns = done.answers[idx];
              const isCorrect = userAns === q.correctIndex;
              return (
                <li key={idx} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-start gap-2">
                    {isCorrect ? (
                      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" />
                    ) : (
                      <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
                    )}
                    <p className="text-sm font-semibold leading-snug">
                      {idx + 1}. {q.q}
                    </p>
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {q.options.map((opt, oi) => {
                      const isAnswer = oi === q.correctIndex;
                      const isUserPick = oi === userAns;
                      const cls = isAnswer
                        ? "border-emerald-500/60 bg-emerald-500/10"
                        : isUserPick
                        ? "border-destructive/60 bg-destructive/10"
                        : "border-border";
                      return (
                        <li
                          key={oi}
                          className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs ${cls}`}
                        >
                          <span>{opt}</span>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {isAnswer && t("quiz.correctAnswer")}
                            {!isAnswer && isUserPick && t("quiz.yourAnswer")}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  {q.explanation && (
                    <p className="mt-3 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{t("quiz.explanation")}: </span>
                      {q.explanation}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
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
      setDone({ score, xp: r.xp, answers });
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
