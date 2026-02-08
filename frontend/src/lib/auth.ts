import { createAuthClient } from "better-auth/react";

// Auth requests go to the same origin (proxied to Convex site URL by Vite/Vercel).
// This avoids cross-origin cookie issues — the browser sees everything as same-origin.
export const authClient = createAuthClient({
  baseURL: window.location.origin,
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient;
