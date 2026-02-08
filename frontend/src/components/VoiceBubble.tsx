import { motion } from "framer-motion";

interface VoiceBubbleProps {
  isActive?: boolean;
}

const VoiceBubble = ({ isActive = true }: VoiceBubbleProps) => {
  return (
    <div className="relative flex items-center justify-center w-64 h-64">
      {/* Background ambient glow */}
      <div
        className="absolute w-full h-full rounded-full opacity-30"
        style={{
          background:
            "radial-gradient(circle, hsl(142 70% 49% / 0.2) 0%, hsl(210 80% 60% / 0.05) 50%, transparent 70%)",
        }}
      />

      {/* Outer glow rings */}
      {isActive && (
        <>
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 220,
              height: 220,
              background:
                "radial-gradient(circle, hsl(142 70% 49% / 0.1) 0%, hsl(210 80% 60% / 0.03) 50%, transparent 70%)",
            }}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.4, 0.1, 0.4],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 180,
              height: 180,
              background:
                "radial-gradient(circle, hsl(170 60% 50% / 0.08) 0%, transparent 70%)",
            }}
            animate={{
              scale: [1.1, 0.9, 1.1],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
          />
        </>
      )}

      {/* Outer ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 150,
          height: 150,
          background:
            "linear-gradient(135deg, hsl(142 70% 49% / 0.08), hsl(210 80% 60% / 0.05))",
          border: "1px solid hsl(142 70% 49% / 0.1)",
        }}
        animate={
          isActive
            ? {
                scale: [1, 1.06, 1],
              }
            : {}
        }
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Main blob */}
      <motion.div
        className="relative z-10 rounded-full"
        style={{
          width: 110,
          height: 110,
          background:
            "linear-gradient(135deg, hsl(142 70% 49%), hsl(170 60% 45%), hsl(210 80% 60%))",
          boxShadow:
            "0 0 40px hsl(142 70% 49% / 0.3), 0 0 80px hsl(142 70% 49% / 0.1), inset 0 -4px 12px hsl(0 0% 0% / 0.2)",
        }}
        animate={
          isActive
            ? {
                scale: [1, 1.1, 0.95, 1.05, 1],
                borderRadius: [
                  "50%",
                  "45% 55% 52% 48%",
                  "53% 47% 46% 54%",
                  "48% 52% 54% 46%",
                  "50%",
                ],
              }
            : { scale: 1 }
        }
        transition={{
          duration: 4.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Inner highlight / reflection */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 35% 30%, hsl(0 0% 100% / 0.35) 0%, transparent 50%)",
          }}
        />
        {/* Bottom reflection */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 60% 80%, hsl(210 80% 60% / 0.3) 0%, transparent 40%)",
          }}
        />
      </motion.div>

      {/* Wave rings */}
      {isActive &&
        [0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 110,
              height: 110,
              border: "1px solid hsl(142 70% 49% / 0.25)",
            }}
            animate={{
              scale: [1, 2.5],
              opacity: [0.5, 0],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "easeOut",
              delay: i * 1.1,
            }}
          />
        ))}
    </div>
  );
};

export default VoiceBubble;
