import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset Password — Lybanhi" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error(t("profile.passwordsDontMatch"));
    }
    if (password.length < 6) {
      return toast.error(t("profile.passwordMinLength"));
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("profile.passwordUpdateSuccess"));
      navigate({ to: "/dashboard" });
    }
  };

  return (
    <main className="min-h-screen bg-background px-5 py-10">
      <div className="mx-auto max-w-md">
        <h1 className="font-display text-3xl font-bold text-foreground">Restablecer contraseña</h1>
        <p className="mt-2 text-sm text-muted-foreground">Escribe tu nueva contraseña a continuación para recuperar el acceso a tu cuenta.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={t("profile.newPassword")}
            className="h-12 w-full rounded-2xl border border-input bg-card px-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <input
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder={t("profile.confirmPassword")}
            className="h-12 w-full rounded-2xl border border-input bg-card px-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <button disabled={busy} className="h-12 w-full rounded-2xl bg-primary font-semibold text-primary-foreground disabled:opacity-60">
            {busy ? t("common.loading") : "Actualizar contraseña"}
          </button>
        </form>
      </div>
    </main>
  );
}
