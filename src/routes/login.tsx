import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Lybanhi" }, { name: "description", content: "Sign in to Lybanhi" }] }),
  component: Login,
});

function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetBusy, setResetBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    navigate({ to: "/onboarding" });
  };

  const onResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: window.location.origin + "/reset-password",
    });
    setResetBusy(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("profile.resetEmailSent"));
      setResetMode(false);
    }
  };

  const onGoogle = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("Google sign-in failed");
    else if (!r.redirected) navigate({ to: "/onboarding" });
  };

  if (resetMode) {
    return (
      <main className="min-h-screen bg-background px-5 py-10">
        <div className="mx-auto max-w-md">
          <h1 className="font-display text-3xl font-bold text-foreground">{t("profile.forgotPassword")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Escribe tu correo electrónico para recibir un enlace y restablecer tu contraseña.</p>
          <form onSubmit={onResetPassword} className="mt-6 space-y-4">
            <input type="email" required value={resetEmail} onChange={e => setResetEmail(e.target.value)} placeholder={t("auth.email")}
              className="h-12 w-full rounded-2xl border border-input bg-card px-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
            <button disabled={resetBusy} className="h-12 w-full rounded-2xl bg-primary font-semibold text-primary-foreground disabled:opacity-60">
              {resetBusy ? t("common.loading") : "Enviar enlace de recuperación"}
            </button>
          </form>
          <button type="button" onClick={() => setResetMode(false)} className="mt-6 text-sm font-semibold text-primary hover:underline w-full text-center">
            Volver a iniciar sesión
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-5 py-10">
      <div className="mx-auto max-w-md">
        <h1 className="font-display text-3xl font-bold text-foreground">{t("auth.loginTitle")}</h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder={t("auth.email")}
            className="h-12 w-full rounded-2xl border border-input bg-card px-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
          
          <div className="space-y-1">
            <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder={t("auth.password")}
              className="h-12 w-full rounded-2xl border border-input bg-card px-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
            <div className="text-right px-1">
              <button type="button" onClick={() => { setResetMode(true); setResetEmail(email); }} className="text-xs font-semibold text-primary hover:underline">
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </div>

          <button disabled={busy} className="h-12 w-full rounded-2xl bg-primary font-semibold text-primary-foreground disabled:opacity-60 mt-2">
            {busy ? t("common.loading") : t("auth.login")}
          </button>
        </form>
        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />{t("auth.or")}<div className="h-px flex-1 bg-border" /></div>
        <button onClick={onGoogle} className="h-12 w-full rounded-2xl border border-border bg-card font-semibold text-foreground">{t("auth.google")}</button>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("auth.noAccount")} <Link to="/signup" className="font-semibold text-primary">{t("auth.signup")}</Link>
        </p>
      </div>
    </main>
  );
}
