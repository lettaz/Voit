import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import ActiveCall from "./ActiveCall";
import HeroCard from "./HeroCard";
import CallsPage from "./CallsPage";
import AppointmentsSection from "./AppointmentsSection";
import BottomNav from "./BottomNav";
import SettingsDropdown from "./SettingsDropdown";
import { useAuth } from "@/contexts/AuthContext";
import { mockAgents, type Agent } from "@/data/mockData";
import { useTheme } from "@/contexts/ThemeContext";

const useGreeting = () => {
  const { t } = useTranslation();
  const h = new Date().getHours();
  if (h < 12) return t("dashboard.goodMorning");
  if (h < 18) return t("dashboard.goodAfternoon");
  return t("dashboard.goodEvening");
};

const Dashboard = () => {
  const [activePage, setActivePage] = useState("dashboard");
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const greeting = useGreeting();
  const firstName = user?.name?.split(" ")[0] || "Alex";

  if (activeAgent) {
    return (
      <ActiveCall agent={activeAgent} onClose={() => setActiveAgent(null)} />
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
      <div
        className="fixed top-[10%] left-[15%] w-[250px] h-[250px] pointer-events-none rounded-full"
        style={{
          background: isDark
            ? "radial-gradient(circle, hsl(142 55% 40% / 0.1) 0%, transparent 60%)"
            : "radial-gradient(circle, hsl(155 65% 50% / 0.2) 0%, transparent 60%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="fixed bottom-[20%] right-[10%] w-[300px] h-[300px] pointer-events-none rounded-full"
        style={{
          background: isDark
            ? "radial-gradient(circle, hsl(210 55% 45% / 0.1) 0%, transparent 55%)"
            : "radial-gradient(circle, hsl(140 60% 55% / 0.18) 0%, transparent 55%)",
          filter: "blur(45px)",
        }}
      />

      {/* Header */}
      <header className="relative z-30 flex items-center justify-between px-5 pt-5 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-foreground">VoIt</span>
        </div>
        <SettingsDropdown />
      </header>

      {/* Content */}
      <main className="relative z-10 px-5 pt-6 pb-24">
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
              <HeroCard onTalk={() => {
                const idleAgent = mockAgents.find(a => a.status === "idle") || mockAgents[0];
                setActiveAgent(idleAgent);
              }} />
            </motion.div>

            {/* Stats bar */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mt-6 grid grid-cols-3 gap-3"
            >
              {[
                { label: t("dashboard.active"), value: "1", accent: true },
                { label: t("dashboard.today"), value: "4" },
                { label: t("dashboard.success"), value: "92%" },
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

          </>
        )}

        {activePage === "calls" && (
          <CallsPage onCall={setActiveAgent} />
        )}

        {activePage === "calendar" && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-xl font-bold text-foreground">{t("dashboard.scheduledAppointments")}</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("dashboard.appointmentsOverview")}
            </p>
            <div className="mt-6">
              <AppointmentsSection showHistory />
            </div>
          </motion.div>
        )}

      </main>

      {/* Bottom Navigation */}
      <BottomNav activePage={activePage} onNavigate={setActivePage} />
    </div>
  );
};

export default Dashboard;
