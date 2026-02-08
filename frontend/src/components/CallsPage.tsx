import { motion } from "framer-motion";
import AgentCard from "./AgentCard";
import { mockAgents, type Agent } from "@/data/mockData";

interface CallsPageProps {
  onCall: (agent: Agent) => void;
}

const CallsPage = ({ onCall }: CallsPageProps) => {
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-xl font-bold text-foreground">Active Calls</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Your agents and ongoing conversations
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-6"
      >
        <h2 className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-3">
          Your Agents
        </h2>
        <div className="space-y-3">
          {mockAgents.map((agent, i) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i + 0.2 }}
            >
              <AgentCard agent={agent} onCall={onCall} />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default CallsPage;
