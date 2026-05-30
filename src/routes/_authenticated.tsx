import { createFileRoute, Outlet, Navigate, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { BottomNav } from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_authenticated")({ component: AuthLayout });

function AuthLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { i18n } = useTranslation();

  const { data: onboardingDone, isPending } = useQuery({
    enabled: !!user,
    queryKey: ["onboarding-done", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_profile_data")
        .select("user_id")
        .eq("user_id", user!.id)
        .maybeSingle();
      return !!data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: profile } = useQuery({
    enabled: !!user,
    queryKey: ["profile-lang", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("language")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (profile?.language && i18n.language !== profile.language) {
      i18n.changeLanguage(profile.language);
    }
  }, [profile?.language, i18n]);

  if (loading || (user && (isPending || onboardingDone === undefined))) {
    return <div className="grid min-h-screen place-items-center bg-background text-muted-foreground">…</div>;
  }
  if (!user) return <Navigate to="/login" />;

  const onOnboarding = location.pathname.startsWith("/onboarding");
  if (!onboardingDone && !onOnboarding) return <Navigate to="/onboarding" />;
  if (onboardingDone && onOnboarding) return <Navigate to="/dashboard" />;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Outlet />
      {!onOnboarding && <BottomNav />}
    </div>
  );
}
