"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react";
import { supabase } from "@/integrations/supabase/client";
import { useRouter, usePathname } from "next/navigation";

export interface User {
  id: string;
  email?: string;
  name?: string;
  image?: string;
}

type AppRole = "Individual" | "Company" | "Admin";

interface AuthContextType {
  session: any | null;
  user: User | null;
  role: AppRole | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: AppRole, college?: string) => Promise<{ error: Error | null }>;
  signIn: (email?: string, password?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = "govindsingh100bn@gmail.com";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [internalLoading, setInternalLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Guards against firing the redirect more than once per auth session.
  // Reset to false on sign-out so next login triggers a fresh redirect.
  const hasRedirected = useRef(false);

  const loading = status === "loading" || internalLoading;

  const fetchRole = async (id: string) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", id)
        .maybeSingle();
        
      if (data && data.role) {
        setRole(data.role as AppRole);
      } else {
        setRole(null);
      }
    } catch (e) {
      console.error("fetchRole failed", e);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setInternalLoading(true);
      if (session?.user) {
        try {
          // Use the secure session-sync API to resolve the real Supabase UUID and Role.
          const response = await fetch("/api/auth/session-sync");
          const data = await response.json();

          const realId = data.uuid || (session.user as any).id;
          const userRole = data.role;       // already resolved: is_admin → "Admin"
          const isAdmin  = data.is_admin;   // extra flag for safety
          const profileIncomplete = data.profileIncomplete; // Individual with no full_name

          const u: User = {
            id: realId,
            email: session.user.email || "",
            name: session.user.name || "",
            image: session.user.image || "",
          };
          setUser(u);

          // Hard-coded admin email OR is_admin flag OR Admin role in DB → Admin
          if (u.email === ADMIN_EMAIL || isAdmin) {
            setRole("Admin");
          } else if (userRole) {
            setRole(userRole as AppRole);
          } else {
            setRole(null);
          }

          // If the student hasn't filled in their profile details, redirect to onboarding
          if (profileIncomplete && pathname !== "/onboarding" && pathname !== "/join") {
            router.replace("/onboarding");
          }
        } catch (err) {
          console.error("Auth initialization failed:", err);
          setUser({
            id: (session.user as any).id,
            email: session.user.email || "",
            name: session.user.name || "",
          });
          setRole(null);
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setInternalLoading(false);
    };

    if (status !== "loading") {
      initAuth();
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (event === 'SIGNED_IN' && currentSession) {
          // Force a re-evaluation of our session mapping state 
          initAuth();
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [session, status]);

  // ─── SINGLE SOURCE OF TRUTH: centralized role-based redirect ─────────────────
  // Fires exactly once after loading completes. Uses replace (not push) so the
  // browser back-button doesn't loop. The hasRedirected ref prevents re-firing
  // when other state (e.g. pathname) changes mid-session.
  useEffect(() => {
    if (loading) return;                    // wait until fully resolved
    if (!user)  return;                    // unauthenticated — ProtectedRoute handles
    if (hasRedirected.current) return;     // already redirected this session
    if (pathname === "/join") return;       // allow invitation flow to proceed

    const isAdmin = role === "Admin" || user.email === ADMIN_EMAIL;

    // Admin → /admin  (highest priority)
    if (isAdmin) {
      hasRedirected.current = true;
      if (!pathname.startsWith("/admin")) router.replace("/admin");
      return;
    }

    // No role yet → onboarding
    if (!role) {
      hasRedirected.current = true;
      if (pathname !== "/onboarding") router.replace("/onboarding");
      return;
    }

    // Company → company dashboard
    if (role === "Company") {
      hasRedirected.current = true;
      if (!pathname.startsWith("/company")) router.replace("/company/dashboard");
      return;
    }

    // Individual → student dashboard
    if (role === "Individual") {
      hasRedirected.current = true;
      if (!pathname.startsWith("/student")) router.replace("/student/dashboard");
    }
  }, [loading, user, role, pathname, router]);
  // ─────────────────────────────────────────────────────────────────────────────

  const signUp = async (email: string, password: string, fullName: string, role: AppRole, college?: string) => {
    return { error: new Error("Local sign up is disabled. Please use Google OAuth.") };
  };

  const signIn = async (email?: string, password?: string) => {
    await nextAuthSignIn("google", { callbackUrl: window.location.origin });
    return { error: null };
  };

  const signOut = async () => {
    // Clear Supabase client-side auth state (even though we don't use native Supabase auth,
    // the client may have stale tokens in localStorage from previous sessions)
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // Ignore — just a precaution
    }

    // Clear all Supabase-related localStorage keys to prevent ghost sessions
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.startsWith('supabase')) {
          localStorage.removeItem(key);
        }
      });
    }

    // Reset local state immediately
    setUser(null);
    setRole(null);
    hasRedirected.current = false;  // allow fresh redirect on next login

    // Sign out from NextAuth (clears the session cookie)
    await nextAuthSignOut({ callbackUrl: "/" });
  };

  return (
    <AuthContext.Provider value={{ session, user, role, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
