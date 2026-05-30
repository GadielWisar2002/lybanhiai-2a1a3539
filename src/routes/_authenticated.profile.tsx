import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { getDashboard } from "@/lib/quiz.functions";
import { updateLanguage } from "@/lib/profile.functions";
import { AppHeader } from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { StreakBadge } from "@/components/StreakBadge";
import { LogOut, Globe, Trophy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Lybanhi" }] }),
  component: Profile,
});

function Profile() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fn = useServerFn(getDashboard);
  const updLang = useServerFn(updateLanguage);
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => fn() });

  const setLang = (l: "es"|"en"|"fr") => {
    i18n.changeLanguage(l);
    updLang({ data: { language: l } })
      .then(() => {
        qc.invalidateQueries({ queryKey: ["profile-lang"] });
        qc.invalidateQueries({ queryKey: ["dashboard"] });
      })
      .catch(() => {});
  };
  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/" }); };

  return (
    <>
      <AppHeader />
      <div className="mx-auto max-w-md px-5 pt-4">
        <h1 className="font-display text-2xl font-bold">{t("profile.title")}</h1>
        <p className="mt-1 text-muted-foreground">{data?.profile?.full_name}</p>

        <section className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("profile.streak")}</p>
            <div className="mt-2"><StreakBadge days={data?.streak.current_streak ?? 0} /></div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("profile.totalXp")}</p>
            <p className="mt-2 inline-flex items-center gap-1.5 font-display text-xl font-bold"><Trophy className="size-4 text-gold-foreground" />{data?.streak.total_xp ?? 0}</p>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2"><Globe className="size-4 text-primary" /><h2 className="font-semibold">{t("profile.language")}</h2></div>
          <div className="grid grid-cols-3 gap-2">
            {(["es","en","fr"] as const).map(l => (
              <button key={l} onClick={() => setLang(l)}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold ${i18n.language.startsWith(l) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>
                {t(`language.${l}`)}
              </button>
            ))}
          </div>
        </section>

        <button onClick={signOut} className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-card font-semibold text-destructive">
          <LogOut className="size-4" /> {t("common.signOut")}
        </button>
      </div>
    </>
  );
}
