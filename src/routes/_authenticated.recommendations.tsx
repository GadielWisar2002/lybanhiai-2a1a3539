import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { listRecommendations, generateRecommendations, translateRecommendations } from "@/lib/recommendations.functions";
import { AppHeader } from "@/components/AppHeader";
import { Sparkles, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/recommendations")({
  head: () => ({ meta: [{ title: "Recommendations — Lybanhi" }] }),
  component: Recs,
});

type Uni = { name: string; country: string; estimated_cost_usd: number; type: string; notes: string };

function Recs() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const list = useServerFn(listRecommendations);
  const gen = useServerFn(generateRecommendations);
  const trans = useServerFn(translateRecommendations);
  const { data, isLoading } = useQuery({ queryKey: ["recs"], queryFn: () => list() });
  const currentLang = i18n.language.slice(0, 2) as "es" | "en" | "fr";

  const regen = useMutation({
    mutationFn: () => gen({ data: { language: currentLang } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recs"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("✓");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  const translateMut = useMutation({
    mutationFn: () => trans({ data: { language: currentLang } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recs"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  const storedLang = (data?.[0] as { language?: string } | undefined)?.language;
  const langMismatch = !!storedLang && storedLang !== currentLang;

  useEffect(() => {
    if (langMismatch && !translateMut.isPending) {
      translateMut.mutate();
    }
  }, [langMismatch, translateMut]);

  const uniTypeLabel = (raw: string) => {
    const k = (raw || "").toLowerCase();
    if (/(public|públic|publique)/.test(k)) return t("onboarding.uniPublic");
    if (/(private|privad|privée)/.test(k)) return t("onboarding.uniPrivate");
    if (/(online|línea|ligne)/.test(k)) return t("onboarding.uniOnline");
    return raw;
  };

  return (
    <>
      <AppHeader />
      <div className="mx-auto max-w-md px-5 pt-4">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">{t("recs.title")}</h1>
          <button onClick={() => regen.mutate()} disabled={regen.isPending}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60">
            <Sparkles className="size-3.5" /> {regen.isPending ? t("recs.generating") : t("recs.regen")}
          </button>
        </div>

        {(isLoading || translateMut.isPending) && <div className="mt-6 h-40 animate-pulse rounded-2xl bg-muted" />}
        {!isLoading && !translateMut.isPending && data && data.length === 0 && (
          <p className="mt-8 rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            {t("recs.noResults")} <Link to="/onboarding" className="font-semibold text-primary">→</Link>
          </p>
        )}

        <ul className="mt-5 space-y-4">
          {data?.map(r => (
            <li key={r.id} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display text-lg font-bold">{r.career_name}</h2>
                <span className="shrink-0 rounded-full bg-success/15 px-2.5 py-1 text-xs font-bold text-success">{r.match_score}%</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {r.tags.map(tg => <span key={tg} className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{tg}</span>)}
              </div>
              <p className="mt-3 text-sm text-muted-foreground"><strong className="text-foreground">{t("recs.why")}: </strong>{r.reasoning}</p>
              <div className="mt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("recs.universities")}</h3>
                <ul className="mt-2 space-y-2">
                  {(r.universities as unknown as Uni[]).map((u, i) => (
                    <li key={i} className="rounded-xl bg-muted/40 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-sm">{u.name}</p>
                        <span className="text-[11px] font-semibold text-gold-foreground">${Math.round(u.estimated_cost_usd).toLocaleString()}/yr</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{u.country} · {uniTypeLabel(u.type)}</p>
                      {u.notes && <p className="mt-1 text-xs text-muted-foreground">{u.notes}</p>}
                    </li>
                  ))}
                </ul>
              </div>
              <Link to="/prep" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                {t("prep.startQuiz")} <ChevronRight className="size-4" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
