import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — Lybanhi" }, { name: "description", content: "Create your Lybanhi account" }] }),
  component: Signup,
});

function Signup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other">("other");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { 
        emailRedirectTo: window.location.origin, 
        data: { full_name: fullName, gender } 
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (data.session) navigate({ to: "/onboarding" });
    else toast.success(t("auth.checkEmail"));
  };

  const onGoogle = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("Google sign-in failed");
    else if (!r.redirected) navigate({ to: "/onboarding" });
  };

  return (
    <main className="min-h-screen bg-background px-5 py-10">
      <div className="mx-auto max-w-md">
        <h1 className="font-display text-3xl font-bold text-foreground">{t("auth.signupTitle")}</h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <input required value={fullName} onChange={e => setFullName(e.target.value)} placeholder={t("auth.fullName")} maxLength={80}
            className="h-12 w-full rounded-2xl border border-input bg-card px-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
          
          {/* Selector de Género */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground block px-1">Género</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "male", name: "Hombre" },
                { id: "female", name: "Mujer" },
                { id: "other", name: "Prefiero no decir" }
              ].map(opt => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setGender(opt.id as any)}
                  className={`h-11 rounded-xl border font-semibold text-xs transition ${
                    gender === opt.id
                      ? "border-primary bg-primary/5 text-primary shadow-sm"
                      : "border-input bg-card text-foreground hover:bg-muted/30"
                  }`}
                >
                  {opt.name}
                </button>
              ))}
            </div>
          </div>

          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder={t("auth.email")}
            className="h-12 w-full rounded-2xl border border-input bg-card px-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
          <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder={t("auth.password")}
            className="h-12 w-full rounded-2xl border border-input bg-card px-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
          <button disabled={busy} className="h-12 w-full rounded-2xl bg-primary font-semibold text-primary-foreground disabled:opacity-60">
            {busy ? t("common.loading") : t("auth.signup")}
          </button>
        </form>
        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />{t("auth.or")}<div className="h-px flex-1 bg-border" /></div>
        <button onClick={onGoogle} className="h-12 w-full rounded-2xl border border-border bg-card font-semibold text-foreground">{t("auth.google")}</button>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("auth.haveAccount")} <Link to="/login" className="font-semibold text-primary">{t("auth.login")}</Link>
        </p>
      </div>
    </main>
  );
}
