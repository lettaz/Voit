import {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { authClient, useSession } from "@/lib/auth";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  convexUserId: Id<"users"> | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ error?: string }>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, isPending: isLoading } = useSession();
  const upsertUser = useMutation(api.users.upsertFromAuth);
  const [convexUserId, setConvexUserId] = useState<Id<"users"> | null>(null);
  const syncedEmailRef = useRef<string | null>(null);

  const user: User | null = session?.user
    ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image ?? undefined,
      }
    : null;

  // Sync authenticated user to app's Convex users table
  useEffect(() => {
    if (!session?.user) {
      // User logged out — reset
      syncedEmailRef.current = null;
      setConvexUserId(null);
      return;
    }

    const { email, name, image } = session.user;

    // Don't re-sync if we already synced this email in this session
    if (syncedEmailRef.current === email) return;
    syncedEmailRef.current = email;

    upsertUser({
      email,
      name: name || "User",
      avatarUrl: image ?? undefined,
      authProvider: "email", // Better Auth doesn't expose provider in session; default to email
      authProviderId: session.user.id,
    })
      .then((id) => {
        setConvexUserId(id);
      })
      .catch((err) => {
        console.error("[AuthSync] Failed to sync user to Convex:", err);
        // Allow retry on next render
        syncedEmailRef.current = null;
      });
  }, [session?.user, upsertUser]);

  const login = useCallback(
    async (email: string, password: string): Promise<{ error?: string }> => {
      try {
        const result = await authClient.signIn.email({
          email,
          password,
        });
        if (result.error) {
          return { error: result.error.message || "Login failed" };
        }
        return {};
      } catch (err: any) {
        return { error: err?.message || "An unexpected error occurred" };
      }
    },
    []
  );

  const signup = useCallback(
    async (
      name: string,
      email: string,
      password: string
    ): Promise<{ error?: string }> => {
      try {
        const result = await authClient.signUp.email({
          name,
          email,
          password,
        });
        if (result.error) {
          return { error: result.error.message || "Signup failed" };
        }
        return {};
      } catch (err: any) {
        return { error: err?.message || "An unexpected error occurred" };
      }
    },
    []
  );

  const loginWithGoogle = useCallback(async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: window.location.origin,
    });
  }, []);

  const logout = useCallback(async () => {
    await authClient.signOut();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, convexUserId, isLoading, login, signup, loginWithGoogle, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
