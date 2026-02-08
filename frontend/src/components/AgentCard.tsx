import { Phone, CheckCircle2, Clock, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import type { Agent } from "@/data/mockData";

interface AgentCardProps {
  agent: Agent;
  onCall: (agent: Agent) => void;
}

const statusConfig = {
  active: {
    label: "Active",
    icon: Phone,
    badgeClass: "bg-primary/15 text-primary border border-primary/20",
    dot: "bg-primary",
  },
  idle: {
    label: "Ready",
    icon: Clock,
    badgeClass: "bg-muted text-muted-foreground border border-border",
    dot: "bg-muted-foreground",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    badgeClass: "bg-muted text-muted-foreground border border-border",
    dot: "bg-muted-foreground",
  },
};

const AgentCard = ({ agent, onCall }: AgentCardProps) => {
  const config = statusConfig[agent.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ duration: 0.25 }}
      onClick={() => onCall(agent)}
      className="relative group cursor-pointer"
    >
      <div className="glass-accent rounded-2xl p-4 shadow-card gradient-border transition-all duration-300 group-hover:glow-green">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="font-semibold text-foreground truncate text-sm">
                {agent.provider}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground truncate">{agent.task}</p>
          </div>

          <div className="flex items-center gap-3 ml-3">
            <span
              className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full ${config.badgeClass}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${agent.status === "active" ? "animate-pulse" : ""}`} />
              {config.label}
            </span>

            {agent.status !== "completed" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCall(agent);
                }}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground glow-green-strong hover:scale-105 transition-transform"
                style={{
                  background: "var(--gradient-primary)",
                }}
              >
                <Phone className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AgentCard;
