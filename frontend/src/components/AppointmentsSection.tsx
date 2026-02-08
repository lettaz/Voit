import { Calendar, X, Clock, CheckCircle2, History } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import type { Appointment } from "@/data/mockData";
import { mockAppointments } from "@/data/mockData";

interface AppointmentsSectionProps {
  showHistory?: boolean;
}

const pastAppointments: (Appointment & { cancelledAt?: string })[] = [
  {
    id: "past-1",
    title: "Teeth Cleaning",
    provider: "Dr. Smile – Dental Practice",
    date: "2026-01-20",
    time: "11:00",
    agentName: "Scheduler",
    status: "confirmed",
  },
  {
    id: "past-2",
    title: "Car Insurance",
    provider: "AXA Customer Service",
    date: "2026-01-10",
    time: "15:30",
    agentName: "Insurance Helper",
    status: "confirmed",
    cancelledAt: "2026-01-08",
  },
  {
    id: "past-3",
    title: "Flight Rebooking",
    provider: "Lufthansa Service",
    date: "2025-12-18",
    time: "09:00",
    agentName: "Travel Assistant",
    status: "confirmed",
  },
];

const AppointmentsSection = ({ showHistory = false }: AppointmentsSectionProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [cancelled, setCancelled] = useState<Appointment[]>([]);

  const handleCancel = (id: string) => {
    const apt = appointments.find((a) => a.id === id);
    if (apt) {
      setCancelled((prev) => [...prev, apt]);
    }
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="space-y-6">
      {/* Upcoming */}
      {showHistory && (
        <h2 className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
          Upcoming Appointments
        </h2>
      )}

      {appointments.length === 0 ? (
        <div className="text-center py-6">
          <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
          <p className="text-sm text-muted-foreground">No scheduled appointments</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt, i) => (
            <motion.div
              key={apt.id}
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
                      {apt.title}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        apt.status === "confirmed"
                          ? "bg-primary/15 text-primary border border-primary/20"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      {apt.status === "confirmed" ? (
                        <CheckCircle2 className="w-2.5 h-2.5" />
                      ) : (
                        <Clock className="w-2.5 h-2.5" />
                      )}
                      {apt.status === "confirmed" ? "Confirmed" : "Pending"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {apt.provider}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {formatDate(apt.date)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {apt.time}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleCancel(apt.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 hover:bg-destructive/20 transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Cancelled in this session */}
      {showHistory && cancelled.length > 0 && (
        <>
          <h2 className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mt-4">
            Cancelled Appointments
          </h2>
          <div className="space-y-3">
            {cancelled.map((apt, i) => (
              <motion.div
                key={apt.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * i }}
                className="glass rounded-2xl p-4 shadow-card opacity-60"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground text-sm truncate line-through">
                        {apt.title}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/15">
                        <X className="w-2.5 h-2.5" />
                        Cancelled
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{apt.provider}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {formatDate(apt.date)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {apt.time}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* History */}
      {showHistory && (
        <>
          <h2 className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium flex items-center gap-1.5 mt-4">
            <History className="w-3 h-3" />
            Past Appointments
          </h2>
          <div className="space-y-3">
            {pastAppointments.map((apt, i) => (
              <motion.div
                key={apt.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * i + 0.2 }}
                className="glass rounded-2xl p-4 shadow-card"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3
                        className={`font-semibold text-foreground text-sm truncate ${
                          apt.cancelledAt ? "line-through opacity-60" : ""
                        }`}
                      >
                        {apt.title}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          apt.cancelledAt
                            ? "bg-destructive/10 text-destructive border border-destructive/15"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {apt.cancelledAt ? (
                          <>
                            <X className="w-2.5 h-2.5" />
                            Cancelled
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Done
                          </>
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{apt.provider}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {formatDate(apt.date)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {apt.time}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AppointmentsSection;
