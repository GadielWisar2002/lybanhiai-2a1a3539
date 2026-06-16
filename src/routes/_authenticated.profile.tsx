import { createFileRoute, useNavigate, Link, useRouter } from "@tanstack/react-router";
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
import { LogOut, Globe, Trophy, Lock, User, BookOpen } from "lucide-react";
import { BLOOKS, getPrestigeTitle, getPrestigeBadge } from "@/lib/games.functions";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Lybanhi" }] }),
  component: Profile,
});

function Profile() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const fn = useServerFn(getDashboard);
  const updLang = useServerFn(updateLanguage);
  const trans = useServerFn(translateRecommendations);
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => fn() });

  const isDeveloper = user?.email?.toLowerCase() === "debanhivillanueva@colegiomaranatha.edu.mx" || 
                      user?.email?.toLowerCase()?.includes("debanhivillanueva@colegiomaranatha") ||
                      user?.email?.toLowerCase()?.includes("debanhivillanuevacolegiomaranatha") ||
                      data?.email?.toLowerCase() === "debanhivillanueva@colegiomaranatha.edu.mx" ||
                      data?.email?.toLowerCase()?.includes("debanhivillanueva@colegiomaranatha") ||
                      data?.email?.toLowerCase()?.includes("debanhivillanuevacolegiomaranatha") ||
                      data?.isDeveloper === true;

  const [loadingLang, setLoadingLang] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [updatingGender, setUpdatingGender] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [dummyState, setDummyState] = useState(0);

  const currentGender = user?.user_metadata?.gender || "other";

  const handleGenderChange = async (nextGender: "male" | "female" | "other") => {
    setUpdatingGender(true);
    const { error } = await supabase.auth.updateUser({
      data: { gender: nextGender }
    });
    setUpdatingGender(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("profile.genderUpdated"));
      router.invalidate();
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error(t("profile.passwordsDontMatch"));
      return;
    }
    if (newPassword.length < 6) {
      toast.error(t("profile.passwordMinLength"));
      return;
    }
    setUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setUpdatingPassword(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("profile.passwordUpdateSuccess"));
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordFields(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("profile.resetEmailSent"));
    }
  };

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

  if (isLoading) {
    return (
      <>
        <AppHeader />
        <div className="mx-auto max-w-md px-5 pt-4 space-y-6">
          <div className="h-8 w-24 animate-pulse rounded-lg bg-muted" />
          
          <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
            <div className="size-14 animate-pulse rounded-2xl bg-muted" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-32 animate-pulse rounded bg-muted" />
              <div className="h-3.5 w-20 animate-pulse rounded bg-muted" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="h-20 animate-pulse rounded-2xl border border-border bg-card" />
            <div className="h-20 animate-pulse rounded-2xl border border-border bg-card" />
          </div>

          <div className="h-28 animate-pulse rounded-2xl border border-border bg-card" />
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <div className="mx-auto max-w-md px-5 pt-4">
        <h1 className="font-display text-2xl font-bold">{t("profile.title")}</h1>
        
        <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] mt-4">
          <div className="size-14 shrink-0 rounded-2xl bg-primary/10 border border-border overflow-hidden flex items-center justify-center relative">
            <span className="font-display font-bold text-xl text-primary">
              {data?.profile?.full_name?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
          <div>
            <p className="font-display font-bold text-lg leading-tight">{data?.profile?.full_name}</p>
            <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="text-sm leading-none">{getPrestigeBadge(getPrestigeTitle(data?.streak.total_xp ?? 0))}</span>
              <span className="font-bold text-primary">{getPrestigeTitle(data?.streak.total_xp ?? 0)}</span>
              {activeBlook && (
                <span className="text-muted-foreground opacity-80">• {activeBlook.emoji} {t(`games.blookName.${activeBlook.id}`, { defaultValue: activeBlook.name })}</span>
              )}
            </p>
          </div>
        </div>

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

        {/* Sección de Creador de Avatar */}
        <section className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <User className="size-4 text-primary" />
            <h2 className="font-semibold">Creador de Avatares 3D</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            Diseña y personaliza tu propio avatar humanoide articulado en 3D para la plataforma.
          </p>
          <Link
            to="/games"
            search={{ tab: "avatar" }}
            className="flex items-center justify-center gap-2 h-11 w-full rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.99] transition cursor-pointer shadow-sm text-center font-display"
          >
            Personalizar Avatar 3D
          </Link>
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

        {/* Sección de Género */}
        <section className="mt-6 rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <User className="size-4 text-primary" />
            <h2 className="font-semibold">{t("profile.gender")}</h2>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "male", key: "genderMale" },
              { id: "female", key: "genderFemale" },
              { id: "other", key: "genderOther" },
            ].map(opt => (
              <button
                key={opt.id}
                disabled={updatingGender}
                onClick={() => handleGenderChange(opt.id as any)}
                className={`rounded-xl border px-2 py-2.5 text-xs font-semibold transition ${
                  currentGender === opt.id
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-input bg-card text-foreground hover:bg-muted/30"
                } disabled:opacity-60`}
              >
                {t(`profile.${opt.key}`)}
              </button>
            ))}
          </div>
        </section>

        {/* Sección de Suscripción PRO */}
        <section className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 bg-primary/15 text-primary text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
            Simulador
          </div>
          <div className="mb-3 flex items-center gap-2">
            <Trophy className="size-4 text-gold-foreground" />
            <h2 className="font-semibold">Membresía Lybanhi Pro</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            Activa el plan Pro para subir tus propios archivos (PDF, fotos de apuntes, texto copiado, links web) en la sección de quizzes.
          </p>
          <button
            onClick={() => {
              const currentPro = window.localStorage.getItem("lybanhi_pro_status") === "true";
              const nextPro = !currentPro;
              window.localStorage.setItem("lybanhi_pro_status", nextPro ? "true" : "false");
              setDummyState(prev => prev + 1); // trigger state update
              if (nextPro) {
                toast.success("¡Plan Lybanhi Pro activado con éxito! ✨ (Modo pruebas)");
              } else {
                toast.success("Plan Lybanhi Pro desactivado.");
              }
            }}
            className={`h-11 w-full rounded-xl text-sm font-semibold transition active:scale-[0.99] cursor-pointer text-center flex items-center justify-center gap-2 ${
              window.localStorage.getItem("lybanhi_pro_status") === "true"
                ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                : "bg-primary text-primary-foreground hover:opacity-90 shadow-sm"
            }`}
          >
            {window.localStorage.getItem("lybanhi_pro_status") === "true" ? "Plan Pro Activo (Haz clic para desactivar)" : "Activar Plan Pro"}
          </button>
        </section>

        {/* Sección de Seguridad */}
        <section className="mt-6 rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Lock className="size-4 text-primary" />
            <h2 className="font-semibold">{t("profile.security")}</h2>
          </div>

          {!showPasswordFields ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setShowPasswordFields(true)}
                className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.99] cursor-pointer"
              >
                {t("profile.changePassword")}
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-semibold text-primary hover:underline transition cursor-pointer"
                >
                  {t("profile.forgotPassword")}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder={t("profile.newPassword")}
                  className="h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder={t("profile.confirmPassword")}
                  className="h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordFields(false);
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  className="h-11 flex-1 rounded-xl border border-input bg-card text-sm font-semibold text-foreground transition hover:bg-muted/30 cursor-pointer"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={updatingPassword || !newPassword || confirmPassword.length < 6}
                  className="h-11 flex-1 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {updatingPassword ? t("common.loading") : t("common.save")}
                </button>
              </div>
            </form>
          )}
        </section>

        {/* Panel de Administración (Desarrollador) */}
        {isDeveloper && (
          <section className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <BookOpen className="size-4 text-primary" />
              <h2 className="font-semibold">Administración de Libros</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
              Como administrador de Lybanhi, puedes subir y gestionar los libros de texto para la generación automática de quizzes.
            </p>
            <Link
              to="/admin-books"
              className="flex items-center justify-center gap-2 h-11 w-full rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.99] transition cursor-pointer shadow-sm text-center"
            >
              Ir al Administrador de Libros
            </Link>
          </section>
        )}

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
