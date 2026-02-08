import { motion } from "framer-motion";
import { Calendar, MapPin, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";

const IntegrationsPage = () => {
  const { t } = useTranslation();
  const { connectCalendar, calendarConnected } = useAuth();

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-xl font-bold text-foreground">{t("integrations.title")}</h1>
      <p className="text-muted-foreground mt-1 text-sm">{t("integrations.subtitle")}</p>

      <div className="mt-6 space-y-3">
        {/* Google Calendar Integration */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="glass rounded-2xl p-4 shadow-card"
        >
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${calendarConnected ? "bg-primary/15" : "glass"}`}>
              <Calendar className={`w-5 h-5 ${calendarConnected ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground text-sm">{t("integrations.calendar")}</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{t("integrations.calendarDesc")}</p>
            </div>
          </div>
          {calendarConnected ? (
            <div className="w-full mt-3 py-2.5 rounded-xl text-xs font-medium text-center text-primary bg-primary/10 border border-primary/20">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t("integrations.calendarConnected")}
              </span>
            </div>
          ) : (
            <button
              onClick={connectCalendar}
              className="w-full mt-3 py-2.5 rounded-xl text-xs font-medium text-primary-foreground border border-primary/20 hover:opacity-90 transition-opacity"
              style={{ background: "var(--gradient-primary)" }}
            >
              {t("integrations.connect")}
            </button>
          )}
        </motion.div>

        {/* Location Integration (Coming Soon) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="glass rounded-2xl p-4 shadow-card"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl glass flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground text-sm">{t("integrations.location")}</h3>
                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                  {t("integrations.comingSoon")}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{t("integrations.locationDesc")}</p>
            </div>
          </div>
          <button
            disabled
            className="w-full mt-3 py-2.5 rounded-xl text-xs font-medium glass text-muted-foreground border border-border/50 opacity-50 cursor-not-allowed"
          >
            {t("integrations.enable")}
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default IntegrationsPage;
