import { createFileRoute, Outlet, Navigate, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { BottomNav } from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({ component: AuthLayout });

function AuthLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  const { data: onboardingDone, isLoading: checking } = useQuery({
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
  });

  if (loading || (user && checking)) {
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
