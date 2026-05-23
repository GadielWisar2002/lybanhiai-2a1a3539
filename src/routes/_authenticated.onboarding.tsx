import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { saveOnboarding } from "@/lib/onboarding.functions";
import { generateRecommendations } from "@/lib/recommendations.functions";
import { AppHeader } from "@/components/AppHeader";
import { Star, ArrowRight, ArrowLeft, Brain, Compass, GraduationCap } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Onboarding — Lybanhi" }] }),
  component: Onboarding,
});

const SKILL_KEYS = ["problemSolving","creativity","leadership","dataAnalysis","communication","teamwork","criticalThinking","adaptability","empathy","discipline"];
const SUBJECT_KEYS = ["math","science","literature","tech","art","history","languages","biology"];

function Onboarding() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const save = useServerFn(saveOnboarding);
  const gen = useServerFn(generateRecommendations);

  const [step, setStep] = useState(0);
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState("");
  const [subjects, setSubjects] = useState<Record<string, number>>({});
  const [budget, setBudget] = useState<string>("");
  const [country, setCountry] = useState("");
  const [uniType, setUniType] = useState<"public" | "private" | "online" | "any">("any");
  const [busy, setBusy] = useState(false);

  const toggleSkill = (k: string) => setSkills(s => s.includes(k) ? s.filter(x => x !== k) : [...s, k]);
  const rate = (k: string, n: number) => setSubjects(p => ({ ...p, [k]: n }));

  const submit = async () => {
    setBusy(true);
    try {
      await save({ data: {
        hobbies: [], skills, interests,
        favorite_subjects: Object.entries(subjects).map(([key, rating]) => ({ key, rating })),
        budget_monthly: budget ? Number(budget) : null,
        country: country || undefined, university_type: uniType,
      }});
      toast.success(t("recs.generating"));
      await gen({ data: { language: i18n.language.slice(0,2) as "es" | "en" | "fr" } });
      navigate({ to: "/recommendations" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally { setBusy(false); }
  };

  const steps = [Brain, Compass, GraduationCap];
  const StepIcon = steps[step];

  return (
    <>
      <AppHeader />
      <div className="mx-auto max-w-md px-5 pt-4">
        <h1 className="font-display text-3xl font-bold leading-tight">{t("onboarding.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("onboarding.subtitle")}</p>
        <div className="mt-4 flex gap-2">
          {[0,1,2].map(i => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="mb-3 flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-lg bg-primary/10"><StepIcon className="size-4 text-primary" /></div>
            <h2 className="font-display text-lg font-semibold">
              {step === 0 ? t("onboarding.skillsTitle") : step === 1 ? t("onboarding.subjectsTitle") : t("onboarding.budgetTitle")}
            </h2>
          </div>

          {step === 0 && (
            <>
              <p className="mb-3 text-sm text-muted-foreground">{t("onboarding.skillsHelp")}</p>
              <div className="flex flex-wrap gap-2">
                {SKILL_KEYS.map(k => {
                  const on = skills.includes(k);
                  return (
                    <button key={k} type="button" onClick={() => toggleSkill(k)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted text-foreground"}`}>
                      {t(`onboarding.skills.${k}`)}
                    </button>
                  );
                })}
              </div>
              <div className="mt-5">
                <label className="text-sm font-medium">{t("onboarding.interestsQ")}</label>
                <textarea value={interests} onChange={e => setInterests(e.target.value)} maxLength={2000} rows={4}
                  placeholder={t("onboarding.interestsPlaceholder")}
                  className="mt-2 w-full rounded-xl border border-input bg-muted/40 p-3 text-sm focus:border-primary focus:outline-none" />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <p className="mb-3 text-sm text-muted-foreground">{t("onboarding.subjectsHelp")}</p>
              <ul className="space-y-2">
                {SUBJECT_KEYS.map(k => {
                  const v = subjects[k] ?? 0;
                  return (
                    <li key={k} className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2.5">
                      <span className="text-sm font-medium">{t(`onboarding.subjects.${k}`)}</span>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(n => (
                          <button key={n} type="button" onClick={() => rate(k, n)} aria-label={`${n} stars`}>
                            <Star className={`size-5 ${n <= v ? "fill-gold text-gold" : "text-muted-foreground/40"}`} />
                          </button>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t("onboarding.budgetTitle")}</label>
                <input type="number" min={0} max={100000} value={budget} onChange={e => setBudget(e.target.value)}
                  className="mt-2 h-12 w-full rounded-xl border border-input bg-card px-3 focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium">{t("onboarding.countryTitle")}</label>
                <input value={country} onChange={e => setCountry(e.target.value)} maxLength={80}
                  className="mt-2 h-12 w-full rounded-xl border border-input bg-card px-3 focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium">{t("onboarding.uniTypeTitle")}</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(["any","public","private","online"] as const).map(k => (
                    <button key={k} type="button" onClick={() => setUniType(k)}
                      className={`rounded-xl border px-3 py-2 text-sm font-medium ${uniType === k ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground"}`}>
                      {t(`onboarding.uni${k.charAt(0).toUpperCase()+k.slice(1)}`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        <div className="mt-6 flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 font-semibold">
              <ArrowLeft className="size-4" /> {t("common.back")}
            </button>
          )}
          {step < 2 ? (
            <button onClick={() => setStep(s => s + 1)} className="ml-auto inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 font-semibold text-primary-foreground">
              {t("common.next")} <ArrowRight className="size-4" />
            </button>
          ) : (
            <button disabled={busy} onClick={submit} className="ml-auto inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 font-semibold text-primary-foreground disabled:opacity-60">
              {busy ? t("common.loading") : t("onboarding.submit")} <ArrowRight className="size-4" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
