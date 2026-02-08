import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import HeroCard from "./HeroCard";
import CallsPage from "./CallsPage";
import AppointmentsSection from "./AppointmentsSection";
import IntegrationsPage from "./IntegrationsPage";
import BottomNav from "./BottomNav";
import SettingsDropdown from "./SettingsDropdown";
import ThemeToggle from "./ThemeToggle";
import CampaignFlow, { type CampaignFlowState } from "./CampaignFlow";
import CampaignProgress from "./CampaignProgress";
import CampaignResults from "./CampaignResults";
import SetupWizard from "./SetupWizard";
import AgentSettingsPage from "./AgentSettingsPage";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import type { Id } from "@convex/_generated/dataModel";
import { X, Sparkles, Bot, ChevronRight } from "lucide-react";

const useGreeting = () => {
  const { t } = useTranslation();
  const h = new Date().getHours();
  if (h < 12) return t("dashboard.goodMorning");
  if (h < 18) return t("dashboard.goodAfternoon");
  return t("dashboard.goodEvening");
};

const Dashboard = () => {
  const [activePage, setActivePage] = useState("dashboard");
  const [campaignState, setCampaignState] = useState<CampaignFlowState | null>(null);
  const [viewCampaignId, setViewCampaignId] = useState<Id<"campaigns"> | null>(null);
  const [viewCampaignStep, setViewCampaignStep] = useState<"progress" | "results">("progress");
  const [showAgentSettings, setShowAgentSettings] = useState(false);

  // Onboarding state
  const onboardingCompleted = localStorage.getItem("voit_onboarding_completed") === "true";
  const [showWizard, setShowWizard] = useState(!onboardingCompleted);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const { user, convexUserId } = useAuth();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const greeting = useGreeting();
  const firstName = user?.name?.split(" ")[0] || t("common.defaultName");

  // Real-time stats
  const stats = useQuery(
    api.campaigns.getStats,
    convexUserId ? { userId: convexUserId } : "skip"
  );

  // Show onboarding badge on integrations tab if not completed
  const showIntegrationsBadge = !onboardingCompleted && !showWizard;

  // Campaign creation from HeroCard
  const handleHeroSubmit = useCallback((input: string) => {
    setCampaignState({ step: "parsing", input });
  }, []);

  // View a specific campaign (from Calls tab)
  const handleViewCampaign = useCallback((id: Id<"campaigns">, step?: "progress" | "results") => {
    setViewCampaignId(id);
    setViewCampaignStep(step || "progress");
  }, []);

  // Wizard handlers
  const handleWizardComplete = () => {
    setShowWizard(false);
  };

  const handleWizardSkip = () => {
    localStorage.setItem("voit_onboarding_step", "0");
    setShowWizard(false);
  };

  const handleReopenWizard = () => {
    setShowWizard(true);
  };

  // Agent settings full-page overlay
  if (showAgentSettings) {
    return <AgentSettingsPage onBack={() => setShowAgentSettings(false)} />;
  }

  // Setup wizard overlay
  if (showWizard) {
    const lastStep = Number(localStorage.getItem("voit_onboarding_step") || "0");
    return (
      <SetupWizard
        onComplete={handleWizardComplete}
        onSkip={handleWizardSkip}
        initialStep={lastStep}
      />
    );
  }

  // Campaign flow overlay
  if (campaignState) {
    return (
      <CampaignFlow
        state={campaignState}
        onStateChange={setCampaignState}
        onClose={() => setCampaignState(null)}
      />
    );
  }

  // Viewing a specific campaign
  if (viewCampaignId) {
    if (viewCampaignStep === "results") {
      return (
        <CampaignResults
          campaignId={viewCampaignId}
          onClose={() => setViewCampaignId(null)}
        />
      );
    }
    return (
      <CampaignProgress
        campaignId={viewCampaignId}
        onClose={() => setViewCampaignId(null)}
        onViewResults={() => setViewCampaignStep("results")}
      />
    );
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden"
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
      <div
        className="fixed top-[30%] left-[50%] -translate-x-1/2 w-[800px] h-[500px] pointer-events-none"
        style={{
          background: isDark
            ? "radial-gradient(ellipse at 50% 50%, hsl(210 60% 45% / 0.08) 0%, transparent 60%)"
            : "radial-gradient(ellipse at 50% 50%, hsl(145 55% 60% / 0.15) 0%, transparent 60%)",
          filter: "blur(80px)",
        }}
      />

      {/* Header: Logo | ThemeToggle | AvatarMenu */}
      <header className="relative z-30 flex items-center justify-between px-5 pt-5 pb-2">
        <div className="flex items-center gap-2">
          <img src="/voit.png" alt="Voit" className="w-7 h-7" />
          <span className="text-lg font-bold text-foreground">Voit</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <SettingsDropdown />
        </div>
      </header>

      {/* Onboarding reminder banner */}
      <AnimatePresence>
        {!onboardingCompleted && !bannerDismissed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative z-20 mx-5 mb-2"
          >
            <div className="glass rounded-xl p-3 flex items-center gap-3 border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              <p className="text-xs text-foreground flex-1">
                {t("wizard.bannerText")}
                <button
                  onClick={handleReopenWizard}
                  className="ml-1 text-primary font-semibold hover:underline"
                >
                  {t("wizard.completeSetup")}
                </button>
              </p>
              <button
                onClick={() => setBannerDismissed(true)}
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <main className="relative z-10 px-5 pt-4 pb-24">
        {activePage === "dashboard" && (
          <>
            {/* Greeting */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-xl font-bold text-foreground">
                {greeting},{" "}
                <span className="text-gradient">{firstName}</span>.
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                {t("dashboard.whoShouldICall")}
              </p>
            </motion.div>

            {/* Hero Card */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="mt-5"
            >
              <HeroCard onSubmit={handleHeroSubmit} onTalk={handleHeroSubmit} />
            </motion.div>

            {/* Stats bar */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mt-6 grid grid-cols-3 gap-3"
            >
              {[
                {
                  label: t("dashboard.active"),
                  value: stats ? String(stats.activeCampaigns) : "—",
                  accent: true,
                },
                {
                  label: t("dashboard.today"),
                  value: stats ? String(stats.todayCampaigns) : "—",
                },
                {
                  label: t("dashboard.success"),
                  value: stats ? `${stats.successRate}%` : "—",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={`glass rounded-xl p-3 text-center shadow-card ${stat.accent ? "gradient-border" : ""}`}
                >
                  <p
                    className={`text-xl font-bold ${
                      stat.accent ? "text-gradient" : "text-foreground"
                    }`}
                  >
                    {stat.value}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                    {stat.label}
                  </p>
                </div>
              ))}
            </motion.div>

            {/* Agent setup CTA card */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="mt-4"
            >
              <button
                onClick={() => setShowAgentSettings(true)}
                className="w-full glass-accent rounded-2xl p-4 shadow-card gradient-border text-left group hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-primary-foreground shrink-0"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    <Bot className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm">
                      {t("dashboard.agentCardTitle")}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("dashboard.agentCardDesc")}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </div>
              </button>
            </motion.div>
          </>
        )}

        {activePage === "calls" && (
          <CallsPage onViewCampaign={handleViewCampaign} />
        )}

        {activePage === "calendar" && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-xl font-bold text-foreground">
              {t("dashboard.scheduledAppointments")}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("dashboard.appointmentsOverview")}
            </p>
            <div className="mt-6">
              <AppointmentsSection showHistory />
            </div>
          </motion.div>
        )}

        {activePage === "integrations" && <IntegrationsPage />}
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        activePage={activePage}
        onNavigate={setActivePage}
        showIntegrationsBadge={showIntegrationsBadge}
      />
    </div>
  );
};

export default Dashboard;
