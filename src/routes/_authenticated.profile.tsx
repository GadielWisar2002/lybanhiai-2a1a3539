import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { getDashboard } from "@/lib/quiz.functions";
import { updateLanguage } from "@/lib/profile.functions";
import { translateRecommendations } from "@/lib/recommendations.functions";
import { AppHeader } from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { StreakBadge } from "@/components/StreakBadge";
import { LogOut, Globe, Trophy } from "lucide-react";
import { BLOOKS } from "@/lib/games.functions";


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
  const trans = useServerFn(translateRecommendations);
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => fn() });
  
  const [loadingLang, setLoadingLang] = useState(false);

  const setLang = async (l: "es"|"en"|"fr") => {
    setLoadingLang(true);
    i18n.changeLanguage(l);
    try {
      await updLang({ data: { language: l } });
      await trans({ data: { language: l } });
      qc.invalidateQueries({ queryKey: ["profile-lang"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["recs"] });
    } catch (err) {
      console.error("Auto-translation error:", err);
    } finally {
      setLoadingLang(false);
    }
  };
  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/" }); };

  const activeBlook = data?.profile?.active_blook_id ? BLOOKS[data.profile.active_blook_id] : null;

  return (
    <>
      <AppHeader />
      <div className="mx-auto max-w-md px-5 pt-4">
        <h1 className="font-display text-2xl font-bold">{t("profile.title")}</h1>
        
        <Link to="/games" search={{ tab: "locker" }} className="block mt-4 transition hover:opacity-90 active:scale-[0.99]">
          <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] cursor-pointer">
            {activeBlook ? (
              <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 text-3xl select-none">
                {activeBlook.emoji}
              </div>
            ) : (
              <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-muted border border-border text-xl font-bold text-muted-foreground select-none">
                {data?.profile?.full_name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-display font-bold text-lg leading-tight">{data?.profile?.full_name}</p>
              <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1.5">
                {activeBlook ? (
                  <>
                    <span className={`inline-block size-2 rounded-full ${
                      activeBlook.rarity === "legendary" ? "bg-amber-500" :
                      activeBlook.rarity === "epic" ? "bg-purple-500" :
                      activeBlook.rarity === "rare" ? "bg-blue-500" : "bg-emerald-500"
                    }`} />
                    <span className="capitalize">{t(`games.shopSection.rarity.${activeBlook.rarity}`, { defaultValue: activeBlook.rarity })} • {t(`games.blookName.${activeBlook.id}`, { defaultValue: activeBlook.name })}</span>
                  </>
                ) : (
                  <span>{t("profile.noBlook", "No Blook equipped")}</span>
                )}
              </p>
            </div>
          </div>
        </Link>

        <section className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("profile.streak")}</p>
            <div className="mt-2"><StreakBadge days={data?.streak.current_streak ?? 0} active={data?.streak.is_active_today} /></div>
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

      {loadingLang && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-6 py-5 shadow-[var(--shadow-card)]">
            <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm font-medium">{t("common.loading")}</p>
          </div>
        </div>
      )}
    </>
  );
}
