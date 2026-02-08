import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  MapPin,
  Check,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

// Agent personas — each is a personality archetype linked to a voice preset.
// The customPrompt gives users a head start with instructions tailored to the persona.
const AGENT_PERSONAS = [
  {
    id: "professional",
    name: "Professional",
    voiceId: "rachel",
    emoji: "👔",
    desc: "Formal, precise, corporate tone",
    customPrompt:
      "Maintain a formal and business-like tone at all times. Use precise language. Address the provider respectfully and get straight to the point.",
  },
  {
    id: "friendly",
    name: "Friendly",
    voiceId: "josh",
    emoji: "😊",
    desc: "Warm, casual, approachable",
    customPrompt:
      "Be warm, conversational, and approachable. Use a friendly tone and don't be afraid to be personable. Make the provider feel comfortable.",
  },
  {
    id: "efficient",
    name: "Efficient",
    voiceId: "aria",
    emoji: "⚡",
    desc: "Fast, direct, no fluff",
    customPrompt:
      "Be extremely concise and efficient. Get to the point quickly. Minimize small talk. Aim to complete every call in under 2 minutes.",
  },
  {
    id: "empathetic",
    name: "Empathetic",
    voiceId: "sarah",
    emoji: "💚",
    desc: "Caring, patient, understanding",
    customPrompt:
      "Be patient and understanding. Show empathy when the provider is busy or cannot accommodate. Thank them sincerely. Take your time to listen.",
  },
  {
    id: "multilingual",
    name: "Multilingual",
    voiceId: "aria",
    emoji: "🌍",
    desc: "Adapts to provider's language",
    customPrompt:
      "Prioritize language detection. If the provider speaks a language other than English, switch immediately and continue in their language. Be culturally aware and adapt your tone accordingly.",
  },
  {
    id: "custom",
    name: "Custom",
    voiceId: "rachel",
    emoji: "✏️",
    desc: "Start from scratch",
    customPrompt: "",
  },
];

interface SetupWizardProps {
  onComplete: () => void;
  onSkip: () => void;
  initialStep?: number;
}

const TOTAL_STEPS = 5;

const SetupWizard = ({ onComplete, onSkip, initialStep = 0 }: SetupWizardProps) => {
  const [step, setStep] = useState(initialStep);
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { connectCalendar, calendarConnected } = useAuth();

  const { convexUserId } = useAuth();
  const updateAgentName = useMutation(api.users.updateAgentName);
  const updateCustomPrompt = useMutation(api.users.updateCustomPrompt);
  const updatePreferences = useMutation(api.users.updatePreferences);

  const convexUser = useQuery(
    api.users.getById,
    convexUserId ? { id: convexUserId } : "skip"
  );
  const locationConnected = !!(convexUser?.location?.lat && convexUser?.location?.lng);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  const handleEnableLocation = () => {
    if (!convexUserId || !navigator.geolocation) {
      setLocError("Geolocation not supported");
      return;
    }
    setLocating(true);
    setLocError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let area = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        try {
          const nomRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=12`,
            { headers: { "User-Agent": "Voit/1.0" } }
          );
          const nomData = await nomRes.json();
          if (nomData.display_name) {
            const parts = nomData.display_name.split(",").map((s: string) => s.trim());
            area = parts.slice(0, 3).join(", ");
          }
        } catch { /* keep coords */ }

        try {
          await updatePreferences({
            id: convexUserId,
            location: { area, lat: latitude, lng: longitude },
          });
        } catch (err) {
          console.error("[Wizard] Location save failed:", err);
          setLocError("Failed to save location");
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        setLocError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied"
            : "Could not get location"
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const localSettings = JSON.parse(
    localStorage.getItem("voit_agent_settings") || "{}"
  );
  const [selectedPersona, setSelectedPersona] = useState(localSettings.personaId || "professional");

  const saveAndNext = async () => {
    // Persist agent persona at step 3
    if (step === 3) {
      const persona = AGENT_PERSONAS.find((p) => p.id === selectedPersona);
      const stored = JSON.parse(
        localStorage.getItem("voit_agent_settings") || "{}"
      );
      stored.personaId = selectedPersona;
      stored.voiceId = persona?.voiceId || "rachel";
      localStorage.setItem("voit_agent_settings", JSON.stringify(stored));

      // Save persona's custom prompt and agent name to Convex
      if (convexUserId && persona) {
        try {
          if (persona.customPrompt) {
            await updateCustomPrompt({
              id: convexUserId,
              customPrompt: persona.customPrompt,
            });
          }
        } catch (err) {
          console.error("Failed to save persona to Convex:", err);
        }
      }
    }

    if (step < TOTAL_STEPS - 1) {
      // Save progress
      localStorage.setItem("voit_onboarding_step", String(step + 1));
      setStep(step + 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem("voit_onboarding_completed", "true");
    localStorage.setItem("voit_onboarding_step", String(TOTAL_STEPS));
    onComplete();
  };

  const handleSkipStep = () => {
    saveAndNext();
  };

  const slideVariants = {
    enter: { opacity: 0, x: 60 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -60 },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col"
      style={{
        background: isDark
          ? "linear-gradient(180deg, hsl(222 30% 8%) 0%, hsl(225 28% 12%) 50%, hsl(222 25% 5%) 100%)"
          : "linear-gradient(180deg, hsl(142 50% 95%) 0%, hsl(0 0% 100%) 50%, hsl(150 40% 92%) 100%)",
      }}
    >
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 pt-12 pb-4 px-6">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === step ? 24 : 8,
              background:
                i <= step
                  ? "var(--gradient-primary)"
                  : isDark
                    ? "hsl(220 15% 25%)"
                    : "hsl(0 0% 85%)",
            }}
          />
        ))}
      </div>

      {/* Skip button (top-right) */}
      {step < TOTAL_STEPS - 1 && (
        <button
          onClick={onSkip}
          className="absolute top-12 right-6 text-xs text-muted-foreground hover:text-foreground transition-colors z-10"
        >
          {t("wizard.skipAll")}
        </button>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 overflow-hidden">
        <AnimatePresence mode="wait">
          {/* ── Step 0: Welcome ── */}
          {step === 0 && (
            <motion.div
              key="welcome"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="text-center max-w-sm"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                className="w-24 h-24 mx-auto mb-8"
              >
                <img src="/voit.png" alt="Voit" className="w-full h-full object-contain drop-shadow-lg" />
              </motion.div>
              <h1 className="text-2xl font-bold text-foreground mb-3">
                {t("wizard.welcomeTitle")}
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t("wizard.welcomeDesc")}
              </p>
              <button
                onClick={saveAndNext}
                className="mt-10 w-full py-3.5 rounded-xl text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                style={{ background: "var(--gradient-primary)" }}
              >
                {t("wizard.getStarted")}
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* ── Step 1: Calendar ── */}
          {step === 1 && (
            <motion.div
              key="calendar"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="text-center max-w-sm w-full"
            >
              <div className="w-16 h-16 rounded-2xl glass mx-auto mb-6 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                {t("wizard.calendarTitle")}
              </h2>
              <p className="text-muted-foreground text-sm mb-8">
                {t("wizard.calendarDesc")}
              </p>
              {calendarConnected ? (
                <>
                  <div className="w-full py-3.5 rounded-xl text-sm font-medium text-center text-primary bg-primary/10 border border-primary/20 mb-4 flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" />
                    {t("integrations.calendarConnected")}
                  </div>
                  <button
                    onClick={saveAndNext}
                    className="w-full py-3.5 rounded-xl text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    {t("wizard.continue")}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={connectCalendar}
                    className="w-full py-3.5 rounded-xl text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity mb-4"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    {t("integrations.connect")}
                  </button>
                  <button
                    onClick={handleSkipStep}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t("wizard.skip")}
                  </button>
                </>
              )}
            </motion.div>
          )}

          {/* ── Step 2: Location ── */}
          {step === 2 && (
            <motion.div
              key="location"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="text-center max-w-sm w-full"
            >
              <div className={`w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center ${locationConnected ? "bg-primary/15" : "glass"}`}>
                <MapPin className={`w-8 h-8 ${locationConnected ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                {t("wizard.locationTitle")}
              </h2>
              <p className="text-muted-foreground text-sm mb-8">
                {t("wizard.locationDesc")}
              </p>
              {locationConnected ? (
                <>
                  <div className="w-full py-3.5 rounded-xl text-sm font-medium text-center text-primary bg-primary/10 border border-primary/20 mb-2 flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" />
                    {convexUser?.location?.area || t("integrations.locationEnabled")}
                  </div>
                  <button
                    onClick={saveAndNext}
                    className="w-full py-3.5 rounded-xl text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mt-3"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    {t("wizard.continue")}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleEnableLocation}
                    disabled={locating}
                    className="w-full py-3.5 rounded-xl text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity mb-4 flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    {locating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t("integrations.locating")}
                      </>
                    ) : (
                      t("integrations.enable")
                    )}
                  </button>
                  {locError && (
                    <p className="text-[10px] text-destructive mb-4">{locError}</p>
                  )}
                  <button
                    onClick={handleSkipStep}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t("wizard.skip")}
                  </button>
                </>
              )}
            </motion.div>
          )}

          {/* ── Step 3: Agent Persona Selector ── */}
          {step === 3 && (
            <motion.div
              key="agent"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="max-w-sm w-full"
            >
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-foreground mb-2">
                  {t("wizard.agentTitle")}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {t("wizard.agentDesc")}
                </p>
              </div>

              {/* Persona grid */}
              <div className="grid grid-cols-2 gap-2.5 mb-6">
                {AGENT_PERSONAS.map((persona) => {
                  const isSelected = selectedPersona === persona.id;
                  return (
                    <button
                      key={persona.id}
                      onClick={() => setSelectedPersona(persona.id)}
                      className={`rounded-xl p-3.5 text-left transition-all relative ${
                        isSelected ? "shadow-card" : "glass opacity-80 hover:opacity-100"
                      }`}
                      style={
                        isSelected
                          ? {
                              background: isDark
                                ? "hsl(142 50% 30% / 0.2)"
                                : "hsl(142 50% 90% / 0.6)",
                              border: "1px solid hsl(142 60% 50% / 0.3)",
                            }
                          : undefined
                      }
                    >
                      <span className="text-2xl mb-2 block">{persona.emoji}</span>
                      <p className="text-sm font-semibold text-foreground">
                        {persona.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                        {persona.desc}
                      </p>
                      {isSelected && (
                        <div className="absolute top-2.5 right-2.5">
                          <Check className="w-4 h-4 text-primary" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected persona preview */}
              {selectedPersona && selectedPersona !== "custom" && (
                <div className="glass rounded-xl p-3 mb-6">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-1.5">
                    {t("wizard.personaPreview")}
                  </p>
                  <p className="text-xs text-foreground/80 leading-relaxed italic">
                    "{AGENT_PERSONAS.find((p) => p.id === selectedPersona)?.customPrompt}"
                  </p>
                </div>
              )}

              <button
                onClick={saveAndNext}
                className="w-full py-3.5 rounded-xl text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                style={{ background: "var(--gradient-primary)" }}
              >
                {t("wizard.continue")}
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* ── Step 4: Done ── */}
          {step === 4 && (
            <motion.div
              key="done"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="text-center max-w-sm"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 rounded-full mx-auto mb-8 flex items-center justify-center text-primary-foreground"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Check className="w-10 h-10" />
              </motion.div>
              <h1 className="text-2xl font-bold text-foreground mb-3">
                {t("wizard.doneTitle")}
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t("wizard.doneDesc")}
              </p>
              <button
                onClick={handleComplete}
                className="mt-10 w-full py-3.5 rounded-xl text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                style={{ background: "var(--gradient-primary)" }}
              >
                {t("wizard.startUsing")}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default SetupWizard;
