import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  MapPin,
  Volume2,
  PhoneForwarded,
  Check,
  ChevronRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";

const VOICES = [
  { id: "rachel", name: "Rachel", desc: "Warm, professional" },
  { id: "josh", name: "Josh", desc: "Friendly, casual" },
  { id: "aria", name: "Aria", desc: "Clear, confident" },
  { id: "marcus", name: "Marcus", desc: "Deep, authoritative" },
  { id: "sarah", name: "Sarah", desc: "Calm, empathetic" },
  { id: "adam", name: "Adam", desc: "Energetic, upbeat" },
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

  const localSettings = JSON.parse(
    localStorage.getItem("voit_agent_settings") || "{}"
  );
  const [selectedVoice, setSelectedVoice] = useState(localSettings.voiceId || "rachel");
  const [humanHandoff, setHumanHandoff] = useState(localSettings.humanHandoff ?? false);

  const saveAndNext = () => {
    // Persist agent settings at step 3
    if (step === 3) {
      const stored = JSON.parse(
        localStorage.getItem("voit_agent_settings") || "{}"
      );
      stored.voiceId = selectedVoice;
      stored.humanHandoff = humanHandoff;
      localStorage.setItem("voit_agent_settings", JSON.stringify(stored));
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
              <div className="w-16 h-16 rounded-2xl glass mx-auto mb-6 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                {t("wizard.locationTitle")}
              </h2>
              <p className="text-muted-foreground text-sm mb-8">
                {t("wizard.locationDesc")}
              </p>
              <button
                disabled
                className="w-full py-3.5 rounded-xl text-sm font-medium glass text-muted-foreground border border-border/50 opacity-50 cursor-not-allowed mb-4"
              >
                {t("integrations.enable")}
              </button>
              <p className="text-[10px] text-muted-foreground mb-8">
                {t("integrations.comingSoon")}
              </p>
              <button
                onClick={handleSkipStep}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("wizard.skip")}
              </button>
            </motion.div>
          )}

          {/* ── Step 3: Agent Setup ── */}
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

              {/* Voice picker */}
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-2.5 flex items-center gap-1.5">
                <Volume2 className="w-3 h-3" />
                {t("integrations.voiceLabel")}
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide mb-5">
                {VOICES.map((voice) => {
                  const isSelected = selectedVoice === voice.id;
                  return (
                    <button
                      key={voice.id}
                      onClick={() => setSelectedVoice(voice.id)}
                      className={`shrink-0 w-[88px] rounded-xl p-3 text-center transition-all ${
                        isSelected ? "shadow-card" : "glass opacity-70 hover:opacity-100"
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
                      <div
                        className="w-8 h-8 rounded-full mx-auto mb-1.5 flex items-center justify-center text-[10px] font-bold text-primary-foreground"
                        style={{ background: "var(--gradient-primary)" }}
                      >
                        {voice.name[0]}
                      </div>
                      <p className="text-xs font-semibold text-foreground">{voice.name}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">
                        {voice.desc}
                      </p>
                      {isSelected && (
                        <Check className="w-3 h-3 text-primary mx-auto mt-1" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Human handoff toggle */}
              <div className="flex items-center justify-between glass rounded-xl p-3 mb-8">
                <div className="flex items-center gap-3">
                  <PhoneForwarded className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t("integrations.humanHandoff")}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {t("integrations.humanHandoffDesc")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setHumanHandoff(!humanHandoff)}
                  className={`w-11 h-6 rounded-full transition-all relative ${
                    humanHandoff ? "" : "bg-muted"
                  }`}
                  style={humanHandoff ? { background: "var(--gradient-primary)" } : undefined}
                >
                  <motion.div
                    className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
                    animate={{ left: humanHandoff ? 22 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

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
