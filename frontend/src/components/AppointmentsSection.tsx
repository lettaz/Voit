import { Calendar, X, Clock, CheckCircle2, History } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";

interface AppointmentsSectionProps {
  showHistory?: boolean;
}

const AppointmentsSection = ({ showHistory = false }: AppointmentsSectionProps) => {
  const { t } = useTranslation();
  const { convexUserId } = useAuth();
  const updateAppointmentStatus = useMutation(api.appointments.updateStatus);

  const appointments = useQuery(
    api.appointments.getByUserWithProviders,
    convexUserId ? { userId: convexUserId } : "skip"
  );

  const isLoading = appointments === undefined;

  const now = new Date();
  const upcoming = (appointments || []).filter(
    (apt) => apt.status === "CONFIRMED" && new Date(apt.datetime) >= now
  );
  const past = (appointments || []).filter(
    (apt) => apt.status === "COMPLETED" || new Date(apt.datetime) < now
  );
  const cancelled = (appointments || []).filter((apt) => apt.status === "CANCELLED");

  const handleCancel = async (id: string) => {
    try {
      await updateAppointmentStatus({ id: id as any, status: "CANCELLED" });
    } catch (err) {
      console.error("Failed to cancel appointment:", err);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="glass rounded-2xl p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upcoming */}
      {showHistory && (
        <h2 className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
          {t("appointments.upcoming")}
        </h2>
      )}

      {upcoming.length === 0 && cancelled.length === 0 && past.length === 0 ? (
        <div className="text-center py-6">
          <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
          <p className="text-sm text-muted-foreground">{t("appointments.noAppointments")}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("appointments.noAppointmentsHint")}</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="space-y-3">
              {upcoming.map((apt, i) => (
                <motion.div
                  key={apt._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: 0.08 * i }}
                  className="glass-accent rounded-2xl p-4 shadow-card gradient-border"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground text-sm truncate">
                          {apt.provider?.name || "Provider"}
                        </h3>
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          {t("appointments.confirmed")}
                        </span>
                      </div>
                      {apt.notes && (
                        <p className="text-xs text-muted-foreground truncate">{apt.notes}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {formatDate(apt.datetime)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatTime(apt.datetime)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCancel(apt._id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 hover:bg-destructive/20 transition-colors shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                      {t("appointments.cancel")}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Cancelled */}
          {showHistory && cancelled.length > 0 && (
            <>
              <h2 className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mt-4">
                {t("appointments.cancelled")}
              </h2>
              <div className="space-y-3">
                {cancelled.map((apt, i) => (
                  <motion.div
                    key={apt._id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 * i }}
                    className="glass rounded-2xl p-4 shadow-card opacity-60"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground text-sm truncate line-through">
                            {apt.provider?.name || "Provider"}
                          </h3>
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/15">
                            <X className="w-2.5 h-2.5" />
                            {t("appointments.cancelled")}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {formatDate(apt.datetime)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}

          {/* Past */}
          {showHistory && past.length > 0 && (
            <>
              <h2 className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium flex items-center gap-1.5 mt-4">
                <History className="w-3 h-3" />
                {t("appointments.past")}
              </h2>
              <div className="space-y-3">
                {past.map((apt, i) => (
                  <motion.div
                    key={apt._id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 * i + 0.2 }}
                    className="glass rounded-2xl p-4 shadow-card"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground text-sm truncate">
                            {apt.provider?.name || "Provider"}
                          </h3>
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            {t("appointments.done")}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {formatDate(apt.datetime)}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {formatTime(apt.datetime)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default AppointmentsSection;
