import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { getDashboard } from "@/lib/quiz.functions";
import { AppHeader } from "@/components/AppHeader";
import { StreakBadge } from "@/components/StreakBadge";
import { ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Home — Lybanhi" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { t } = useTranslation();
  const fn = useServerFn(getDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => fn() });

  const name = data?.profile?.full_name?.split(" ")[0] ?? "";

  return (
    <>
      <AppHeader right={data ? <StreakBadge days={data.streak.current_streak} /> : null} />
      <div className="mx-auto max-w-md px-5 pt-4">
        <h1 className="font-display text-3xl font-bold leading-tight">{t("dashboard.hello", { name })}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("dashboard.ready")}</p>

        <section className="mt-5 overflow-hidden rounded-3xl bg-[linear-gradient(135deg,_var(--primary),_var(--primary-glow))] p-5 text-primary-foreground shadow-[var(--shadow-elegant)]">
          <span className="inline-block rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider">{t("dashboard.nextChallenge")}</span>
          <h2 className="mt-3 font-display text-2xl font-bold leading-tight">{t("dashboard.recommended")}</h2>
          <p className="mt-2 text-sm text-primary-foreground/85">{t("dashboard.guidanceDesc")}</p>
          <Link to="/prep" className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary">
            {t("common.start")} <ArrowRight className="size-4" />
          </Link>
        </section>

        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">{t("dashboard.recommended")}</h2>
            <Link to="/recommendations" className="text-sm font-semibold text-primary">{t("common.viewAll")}</Link>
          </div>
          {isLoading && <div className="h-24 animate-pulse rounded-2xl bg-muted" />}
          {!isLoading && data && data.recommendations.length === 0 && (
            <Link to="/recommendations" className="flex items-center justify-between rounded-2xl border border-dashed border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-gold/20"><Sparkles className="size-5 text-primary" /></div>
                <div>
                  <p className="font-semibold">{t("dashboard.noRecsYet")}</p>
                  <p className="text-xs text-muted-foreground">{t("dashboard.generateNow")}</p>
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground" />
            </Link>
          )}
          <ul className="space-y-3">
            {data?.recommendations.map(r => (
              <li key={r.id}>
                <Link to="/recommendations" className="block rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display font-semibold">{r.career_name}</h3>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {r.tags?.slice(0,3).map(tg => <span key={tg} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{tg}</span>)}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-success/15 px-2.5 py-1 text-xs font-bold text-success">{r.match_score}% {t("common.match")}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
