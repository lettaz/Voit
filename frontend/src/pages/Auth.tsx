import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
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
  const [loading, setLoading] = useState(false);
  const { login, signup, loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { t } = useTranslation();

  // Redirect if already logged in
  if (user) {
    navigate("/", { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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

  const handleGoogleLogin = async () => {
    setError("");
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err?.message || t("auth.googleError"));
    }
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
          <img
            src="/voit.png"
            alt="VoiT Logo"
            className="w-16 h-16 mx-auto mb-3 rounded-2xl object-cover"
          />
          <h1 className="text-2xl font-bold text-foreground">VoiT</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "login" ? t("auth.welcomeBack") : t("auth.createAccount")}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="glass rounded-2xl p-1 flex mb-6">
          {(["login", "signup"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setMode(tab);
                setError("");
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
              {tab === "login" ? t("auth.signIn") : t("auth.signUp")}
            </button>
          ))}
        </div>

        {/* Form Card */}
        <div className="glass-strong rounded-3xl p-6 shadow-elevated">
          <AnimatePresence mode="wait">
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
                    {t("auth.name")}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("auth.namePlaceholder")}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-background/60 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
                    />
                  </div>
                </motion.div>
              )}

              {/* Email */}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  {t("auth.email")}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("auth.emailPlaceholder")}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-background/60 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  {t("auth.password")}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("auth.passwordPlaceholder")}
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
                    {mode === "login" ? t("auth.signIn") : t("auth.createAccount")}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 border-t border-border/50" />
                <span className="text-xs text-muted-foreground">{t("auth.or")}</span>
                <div className="flex-1 border-t border-border/50" />
              </div>

              {/* Google OAuth */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-3 border border-border/50 bg-background/60 text-foreground hover:bg-muted/50 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {t("auth.continueWithGoogle")}
              </button>
            </motion.form>
          </AnimatePresence>
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          {mode === "login"
            ? t("auth.noAccount")
            : t("auth.hasAccount")}
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
