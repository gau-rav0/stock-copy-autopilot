"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, next?: string) => Promise<{ error: string | null }>;
  verifyEmailOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithEmail: async () => ({ error: null }),
  verifyEmailOtp: async () => ({ error: null }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  const signInWithEmail = useCallback(
    async (email: string, next?: string) => {
      if (!supabase) {
        return { error: "Authentication is not configured." };
      }

      // Always redirect to the production URL so the magic link works from any environment.
      // NEXT_PUBLIC_SITE_URL should be set to https://fvi-ochre.vercel.app in Vercel env vars.
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        "https://fvi-ochre.vercel.app";

      // Thread the ?next= param through the callback URL so the user lands on the right page
      const callbackUrl = next
        ? `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`
        : `${siteUrl}/auth/callback`;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: callbackUrl,
        },
      });
      return { error: error?.message ?? null };
    },
    [supabase]
  );

  const verifyEmailOtp = useCallback(async (email: string, token: string) => {
    if (!supabase) return { error: "Authentication is not configured." };
    const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    return { error: error?.message ?? null };
  }, [supabase]);

  const signOut = useCallback(async () => {
    if (!supabase) return;

    await supabase.auth.signOut();
    setUser(null);
  }, [supabase]);

  return (
    <AuthContext.Provider value={{ user, loading, signInWithEmail, verifyEmailOtp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
