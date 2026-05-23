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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    navigate({ to: "/dashboard" });
  };

  const onGoogle = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("Google sign-in failed");
    else if (!r.redirected) navigate({ to: "/dashboard" });
  };

  return (
    <main className="min-h-screen bg-background px-5 py-10">
      <div className="mx-auto max-w-md">
        <h1 className="font-display text-3xl font-bold text-foreground">{t("auth.loginTitle")}</h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder={t("auth.email")}
            className="h-12 w-full rounded-2xl border border-input bg-card px-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
          <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder={t("auth.password")}
            className="h-12 w-full rounded-2xl border border-input bg-card px-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
          <button disabled={busy} className="h-12 w-full rounded-2xl bg-primary font-semibold text-primary-foreground disabled:opacity-60">
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
