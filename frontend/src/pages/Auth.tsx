import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const Auth = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { login, signup, user } = useAuth();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  // Redirect if already logged in
  if (user) {
    navigate("/", { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const result =
      mode === "login"
        ? await login(email, password)
        : await signup(name, email, password);

    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      navigate("/", { replace: true });
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Bitte gib eine gültige E-Mail-Adresse ein.");
      return;
    }
    setSuccess("Falls ein Konto mit dieser E-Mail existiert, wurde ein Link zum Zurücksetzen gesendet.");
    setTimeout(() => setShowForgotPassword(false), 3000);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-5 py-10 relative overflow-hidden"
      style={{
        background: isDark
          ? "linear-gradient(155deg, hsl(222 30% 8%) 0%, hsl(222 25% 5%) 30%, hsl(225 28% 10%) 50%, hsl(222 25% 5%) 70%, hsl(220 30% 8%) 100%)"
          : "linear-gradient(155deg, hsl(142 50% 85%) 0%, hsl(0 0% 100%) 30%, hsl(150 45% 88%) 50%, hsl(0 0% 100%) 70%, hsl(142 55% 82%) 100%)",
      }}
    >
      {/* Background ambient effects */}
      <div
        className="fixed top-[-120px] right-[-80px] w-[600px] h-[600px] pointer-events-none rounded-full"
        style={{
          background: isDark
            ? "radial-gradient(circle at 60% 40%, hsl(210 70% 40% / 0.15) 0%, hsl(200 50% 45% / 0.06) 40%, transparent 70%)"
            : "radial-gradient(circle at 60% 40%, hsl(142 70% 55% / 0.3) 0%, hsl(155 55% 60% / 0.12) 40%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      <div
        className="fixed bottom-[-100px] left-[-60px] w-[550px] h-[550px] pointer-events-none rounded-full"
        style={{
          background: isDark
            ? "radial-gradient(circle at 40% 60%, hsl(142 50% 35% / 0.12) 0%, hsl(200 40% 45% / 0.06) 45%, transparent 70%)"
            : "radial-gradient(circle at 40% 60%, hsl(142 60% 50% / 0.25) 0%, hsl(160 45% 60% / 0.1) 45%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">VoIt</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "login" ? "Willkommen zurück" : "Erstelle dein Konto"}
          </p>
        </div>

        {/* Tab Switcher */}
        {!showForgotPassword && (
          <div className="glass rounded-2xl p-1 flex mb-6">
            {(["login", "signup"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setMode(tab);
                  setError("");
                  setSuccess("");
                }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                  mode === tab
                    ? "text-primary-foreground shadow-card"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                style={
                  mode === tab
                    ? { background: "var(--gradient-primary)" }
                    : undefined
                }
              >
                {tab === "login" ? "Anmelden" : "Registrieren"}
              </button>
            ))}
          </div>
        )}

        {/* Form Card */}
        <div className="glass-strong rounded-3xl p-6 shadow-elevated">
          <AnimatePresence mode="wait">
            {showForgotPassword ? (
              <motion.form
                key="forgot"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleForgotPassword}
                className="space-y-4"
              >
                <div className="text-center mb-2">
                  <h2 className="text-base font-semibold text-foreground">Passwort vergessen?</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Gib deine E-Mail ein und wir senden dir einen Link zum Zurücksetzen.
                  </p>
                </div>

                {/* Email */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    E-Mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@beispiel.de"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-background/60 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
                    />
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-2.5"
                  >
                    {error}
                  </motion.p>
                )}

                {/* Success */}
                {success && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-primary bg-primary/10 rounded-xl px-4 py-2.5"
                  >
                    {success}
                  </motion.p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl text-sm font-semibold text-primary-foreground flex items-center justify-center gap-2 hover:opacity-90 transition-opacity glow-green-strong"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  Link senden
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Back to login */}
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setError("");
                    setSuccess("");
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Zurück zur Anmeldung
                </button>
              </motion.form>
            ) : (
              <motion.form
                key={mode}
                initial={{ opacity: 0, x: mode === "login" ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === "login" ? 20 : -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {/* Name field (signup only) */}
                {mode === "signup" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                      Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Dein Name"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-background/60 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Email */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    E-Mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@beispiel.de"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-background/60 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Passwort
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mindestens 6 Zeichen"
                      className="w-full pl-10 pr-11 py-3 rounded-xl bg-background/60 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Forgot Password Link (login only) */}
                {mode === "login" && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(true);
                        setError("");
                        setSuccess("");
                      }}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      Passwort vergessen?
                    </button>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-2.5"
                  >
                    {error}
                  </motion.p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-primary-foreground flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 glow-green-strong"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    <>
                      {mode === "login" ? "Anmelden" : "Konto erstellen"}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          {showForgotPassword
            ? ""
            : mode === "login"
              ? "Noch kein Konto? Wechsle zu Registrieren."
              : "Bereits registriert? Wechsle zu Anmelden."}
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
