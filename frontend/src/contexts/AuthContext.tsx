import {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useMutation, useQuery } from "convex/react";
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
  calendarConnected: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ error?: string }>;
  loginWithGoogle: () => Promise<void>;
  connectCalendar: () => Promise<void>;
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
  const updateCalendarTokens = useMutation(api.users.updateCalendarTokens);
  const [convexUserId, setConvexUserId] = useState<Id<"users"> | null>(null);
  const syncedEmailRef = useRef<string | null>(null);

  // Read calendar status from Convex user data
  const convexUser = useQuery(
    api.users.getById,
    convexUserId ? { id: convexUserId } : "skip"
  );
  const calendarConnected = convexUser?.calendarConnected === true;

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

    // Detect provider: Google users have a profile image from Google
    const isGoogleUser = !!image && image.includes("googleusercontent.com");

    upsertUser({
      email,
      name: name || "User",
      avatarUrl: image ?? undefined,
      authProvider: isGoogleUser ? "google" : "email",
      authProviderId: session.user.id,
    })
      .then(async (id) => {
        setConvexUserId(id);

        // Try to fetch and store Google Calendar tokens
        try {
          const tokenResult = await authClient.getAccessToken({
            providerId: "google",
          });
          if (tokenResult?.data?.accessToken) {
            await updateCalendarTokens({
              id,
              calendarTokens: {
                accessToken: tokenResult.data.accessToken,
                refreshToken: (tokenResult.data as any).refreshToken || "",
                expiresAt: tokenResult.data.accessTokenExpiresAt
                  ? new Date(tokenResult.data.accessTokenExpiresAt).getTime()
                  : Date.now() + 3600000,
              },
            });
            console.log("[AuthSync] Calendar tokens saved to Convex");
          }
        } catch (tokenErr) {
          // Calendar tokens not available (e.g. email login) — that's OK
          console.warn("[AuthSync] Calendar tokens not available:", tokenErr);
        }
      })
      .catch((err) => {
        console.error("[AuthSync] Failed to sync user to Convex:", err);
        // Allow retry on next render
        syncedEmailRef.current = null;
      });
  }, [session?.user, upsertUser, updateCalendarTokens]);

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

  // After redirect back from calendar linking, fetch and store tokens
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("calendarLinked") !== "true") return;
    if (!convexUserId) return;

    // Clean up URL
    window.history.replaceState({}, "", window.location.pathname);

    (async () => {
      try {
        const tokenResult = await authClient.getAccessToken({
          providerId: "google",
        });
        if (tokenResult?.data?.accessToken) {
          await updateCalendarTokens({
            id: convexUserId,
            calendarTokens: {
              accessToken: tokenResult.data.accessToken,
              refreshToken: (tokenResult.data as any).refreshToken || "",
              expiresAt: tokenResult.data.accessTokenExpiresAt
                ? new Date(tokenResult.data.accessTokenExpiresAt).getTime()
                : Date.now() + 3600000,
            },
          });
          console.log("[CalendarLink] Calendar tokens saved to Convex");
        }
      } catch (err) {
        console.warn("[CalendarLink] Failed to save calendar tokens:", err);
      }
    })();
  }, [convexUserId, updateCalendarTokens]);

  const loginWithGoogle = useCallback(async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: window.location.origin,
      scopes: [
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/calendar.events",
      ],
    });
  }, []);

  const connectCalendar = useCallback(async () => {
    await authClient.linkSocial({
      provider: "google",
      scopes: [
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/calendar.events",
      ],
      callbackURL: window.location.origin + "?calendarLinked=true",
    });
  }, []);

  const logout = useCallback(async () => {
    await authClient.signOut();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, convexUserId, isLoading, calendarConnected, login, signup, loginWithGoogle, connectCalendar, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
