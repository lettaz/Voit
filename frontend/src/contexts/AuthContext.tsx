import { createContext, useContext, useState, ReactNode } from "react";

interface User {
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("voit_user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    // Simulate login – accept any valid-looking credentials
    if (!email || !password) return { error: "Bitte E-Mail und Passwort eingeben." };
    if (password.length < 6) return { error: "Passwort muss mindestens 6 Zeichen lang sein." };

    const stored = localStorage.getItem("voit_accounts");
    const accounts: Record<string, { name: string; password: string }> = stored ? JSON.parse(stored) : {};

    const account = accounts[email];
    if (!account) return { error: "Kein Konto mit dieser E-Mail gefunden." };
    if (account.password !== password) return { error: "Falsches Passwort." };

    const u = { name: account.name, email };
    setUser(u);
    localStorage.setItem("voit_user", JSON.stringify(u));
    return {};
  };

  const signup = async (name: string, email: string, password: string): Promise<{ error?: string }> => {
    if (!name.trim()) return { error: "Bitte Namen eingeben." };
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Bitte gültige E-Mail eingeben." };
    if (password.length < 6) return { error: "Passwort muss mindestens 6 Zeichen lang sein." };

    const stored = localStorage.getItem("voit_accounts");
    const accounts: Record<string, { name: string; password: string }> = stored ? JSON.parse(stored) : {};

    if (accounts[email]) return { error: "Ein Konto mit dieser E-Mail existiert bereits." };

    accounts[email] = { name, password };
    localStorage.setItem("voit_accounts", JSON.stringify(accounts));

    const u = { name, email };
    setUser(u);
    localStorage.setItem("voit_user", JSON.stringify(u));
    return {};
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("voit_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
