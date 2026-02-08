import { motion } from "framer-motion";
import { Calendar, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

const IntegrationsPage = () => {
  const { t } = useTranslation();

  const integrations = [
    {
      id: "calendar",
      icon: Calendar,
      name: t("integrations.calendar"),
      desc: t("integrations.calendarDesc"),
      cta: t("integrations.connect"),
    },
    {
      id: "location",
      icon: MapPin,
      name: t("integrations.location"),
      desc: t("integrations.locationDesc"),
      cta: t("integrations.enable"),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-xl font-bold text-foreground">{t("integrations.title")}</h1>
      <p className="text-muted-foreground mt-1 text-sm">{t("integrations.subtitle")}</p>

      <div className="mt-6 space-y-3">
        {integrations.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * (i + 1) }}
              className="glass rounded-2xl p-4 shadow-card"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl glass flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground text-sm">{item.name}</h3>
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                      {t("integrations.comingSoon")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
              <button
                disabled
                className="w-full mt-3 py-2.5 rounded-xl text-xs font-medium glass text-muted-foreground border border-border/50 opacity-50 cursor-not-allowed"
              >
                {item.cta}
              </button>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default IntegrationsPage;
