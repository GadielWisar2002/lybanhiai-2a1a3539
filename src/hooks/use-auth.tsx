import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";

type AuthCtx = { session: Session | null; user: User | null; loading: boolean };
const Ctx = createContext<AuthCtx>({ session: null, user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const qc = useQueryClient();
  const prevUserId = useRef<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((evt, s) => {
      setSession(s);
      const nextUserId = s?.user?.id ?? null;
      // Only invalidate on real identity changes — ignore INITIAL_SESSION and TOKEN_REFRESHED
      // which fire frequently and would abort any in-flight mutation/fetch.
      const identityChanged = prevUserId.current !== nextUserId;
      if (identityChanged && (evt === "SIGNED_IN" || evt === "SIGNED_OUT" || evt === "USER_UPDATED")) {
        prevUserId.current = nextUserId;
        router.invalidate();
        qc.invalidateQueries({ queryKey: ["onboarding-done"] });
      } else {
        prevUserId.current = nextUserId;
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      prevUserId.current = data.session?.user?.id ?? null;
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [router, qc]);

  return <Ctx.Provider value={{ session, user: session?.user ?? null, loading }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
