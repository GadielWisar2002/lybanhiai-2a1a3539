import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import streakCap from "@/assets/streak-cap.png";
import { Sparkles, GraduationCap, Trophy } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lybanhi — Discover what to study" },
      { name: "description", content: "Find the right career, universities for your budget, and prepare for admission and English exams." },
      { property: "og:title", content: "Lybanhi — Discover what to study" },
      { property: "og:description", content: "AI-powered career guidance and exam prep for teenagers." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { t, i18n } = useTranslation();
  const { user, loading } = useAuth();

  if (!loading && user) return <Navigate to="/dashboard" />;

  const setLang = (lng: string) => i18n.changeLanguage(lng);

  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-md items-center justify-between px-5 pt-6">
        <div className="flex items-center gap-2">
          <img src={streakCap} alt="" width={32} height={32} className="size-8" />
          <span className="font-display text-xl font-bold text-primary">Lybanhi</span>
        </div>
        <div className="flex gap-1 text-xs">
          {(["es","en","fr"] as const).map(l => (
            <button key={l} onClick={() => setLang(l)}
              className={`rounded-full px-2.5 py-1 font-semibold uppercase ${i18n.language.startsWith(l) ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
              {l}
            </button>
          ))}
        </div>
      </header>

      <section className="mx-auto max-w-md px-5 pt-10 pb-6">
        <h1 className="font-display text-4xl font-bold leading-tight text-foreground">{t("landing.title")}</h1>
        <p className="mt-3 text-base text-muted-foreground">{t("landing.subtitle")}</p>
        <div className="mt-7 flex flex-col gap-3">
          <Link to="/signup" className="inline-flex h-12 items-center justify-center rounded-2xl bg-primary px-5 font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] transition hover:bg-primary-glow">
            {t("landing.cta")}
          </Link>
          <Link to="/login" className="inline-flex h-12 items-center justify-center rounded-2xl border border-border bg-card px-5 font-semibold text-foreground">
            {t("landing.login")}
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-md space-y-3 px-5 pb-12">
        {[
          { Icon: Sparkles, t: t("landing.f1Title"), d: t("landing.f1Desc") },
          { Icon: GraduationCap, t: t("landing.f2Title"), d: t("landing.f2Desc") },
          { Icon: Trophy, t: t("landing.f3Title"), d: t("landing.f3Desc") },
        ].map(({ Icon, t: ti, d }) => (
          <div key={ti} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
            <div className="grid size-10 place-items-center rounded-xl bg-gold/20 text-gold-foreground">
              <Icon className="size-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground">{ti}</h3>
              <p className="text-sm text-muted-foreground">{d}</p>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
