import { X, Mic, MicOff, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import VoiceBubble from "./VoiceBubble";
import type { Agent } from "@/data/mockData";
import { mockCallSession } from "@/data/mockData";
import { useTheme } from "@/contexts/ThemeContext";

interface ActiveCallProps {
  agent: Agent;
  onClose: () => void;
}

const ActiveCall = ({ agent, onClose }: ActiveCallProps) => {
  const [muted, setMuted] = useState(false);
  const session = mockCallSession;
  const { isDark } = useTheme();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col"
        style={{
          background: isDark
            ? "linear-gradient(180deg, hsl(222 25% 8%) 0%, hsl(222 22% 5%) 100%)"
            : "linear-gradient(180deg, hsl(0 0% 100%) 0%, hsl(140 15% 97%) 100%)",
        }}
      >
        {/* Ambient glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[400px] pointer-events-none"
          style={{
            background: isDark
              ? "radial-gradient(ellipse at center, hsl(142 60% 50% / 0.1) 0%, transparent 70%)"
              : "radial-gradient(ellipse at center, hsl(142 60% 50% / 0.08) 0%, transparent 70%)",
          }}
        />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-5 pt-5 pb-2">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
              Active Call
            </p>
            <h2 className="text-lg font-semibold text-foreground mt-0.5">
              {agent.provider}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl glass flex items-center justify-center hover:bg-muted/50 transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Voice Bubble Area */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-5">
          <VoiceBubble isActive />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-sm font-semibold text-gradient"
          >
            {session.status === "negotiating"
              ? "Negotiating..."
              : "Connected"}
          </motion.p>
          <p className="text-xs text-muted-foreground mt-1.5">{agent.task}</p>
        </div>

        {/* Transcript */}
        <div className="relative z-10 px-5 pb-4">
          <div className="glass-accent rounded-2xl p-4 max-h-44 overflow-y-auto shadow-card gradient-border">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-3">
              Live Transcript
            </p>
            <div className="space-y-2.5">
              {session.transcript.map((line, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className={`text-sm leading-relaxed ${
                    i === session.transcript.length - 1
                      ? "text-gradient font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {line}
                </motion.p>
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="relative z-10 flex items-center justify-center gap-6 pb-10 pt-2">
          <button
            onClick={() => setMuted(!muted)}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 ${
              muted
                ? "bg-destructive/15 text-destructive border border-destructive/20"
                : "glass text-foreground"
            }`}
          >
            {muted ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>

          <button
            onClick={onClose}
            className="w-16 h-16 rounded-2xl bg-destructive text-destructive-foreground flex items-center justify-center hover:scale-105 transition-transform"
            style={{
              boxShadow: "0 0 20px hsl(0 72% 55% / 0.2)",
            }}
          >
            <X className="w-6 h-6" />
          </button>

          <button className="w-14 h-14 rounded-2xl glass text-foreground flex items-center justify-center">
            <Volume2 className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ActiveCall;
