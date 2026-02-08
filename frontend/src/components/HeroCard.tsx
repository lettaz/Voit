import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, SendHorizonal } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface HeroCardProps {
  onSubmit?: (message: string) => void;
  onTalk?: (message: string) => void;
}

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

const HeroCard = ({ onSubmit, onTalk }: HeroCardProps) => {
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<ReturnType<typeof createRecognition> | null>(null);
  const { isDark } = useTheme();

  const handleSubmit = () => {
    if (!inputText.trim()) return;
    onSubmit?.(inputText.trim());
    setInputText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Create a SpeechRecognition instance
  function createRecognition() {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    return recognition;
  }

  const handleMicClick = useCallback(() => {
    // If already listening, stop
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    // If text already typed, submit it
    if (inputText.trim()) {
      onTalk?.(inputText.trim());
      setInputText("");
      return;
    }

    // Start voice recognition
    const recognition = createRecognition();
    if (!recognition) {
      // Speech API not supported, just focus the input
      console.warn("Speech recognition not supported in this browser");
      return;
    }

    recognitionRef.current = recognition;
    setIsListening(true);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");
      setInputText(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.start();
  }, [isListening, inputText, onTalk]);

  return (
    <div className="relative w-full rounded-3xl overflow-hidden" style={{ minHeight: 320 }}>
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? "linear-gradient(160deg, hsl(222 25% 8%) 0%, hsl(222 22% 12%) 40%, hsl(220 28% 15%) 70%, hsl(222 30% 10%) 100%)"
            : "linear-gradient(160deg, hsl(0 0% 100%) 0%, hsl(140 40% 96%) 40%, hsl(142 50% 88%) 70%, hsl(142 55% 78%) 100%)",
        }}
      />

      {/* Subtle texture overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: isDark
            ? "radial-gradient(circle at 50% 40%, hsl(210 60% 50% / 0.1) 0%, transparent 50%)"
            : "radial-gradient(circle at 50% 40%, hsl(142 60% 50% / 0.08) 0%, transparent 50%)",
        }}
      />

      {/* Soundwave lines – left */}
      <svg
        className="absolute left-0 top-1/2 -translate-y-1/2 w-2/5 h-3/4 opacity-25"
        viewBox="0 0 200 200"
        fill="none"
        preserveAspectRatio="none"
      >
        <motion.path
          d="M0,100 Q25,60 50,100 Q75,140 100,100 Q125,60 150,100 Q175,140 200,100"
          stroke={isDark ? "hsl(210, 60%, 55%)" : "hsl(142, 60%, 55%)"}
          strokeWidth="1"
          fill="none"
          animate={{
            d: [
              "M0,100 Q25,60 50,100 Q75,140 100,100 Q125,60 150,100 Q175,140 200,100",
              "M0,100 Q25,80 50,100 Q75,120 100,100 Q125,80 150,100 Q175,120 200,100",
              "M0,100 Q25,50 50,100 Q75,150 100,100 Q125,50 150,100 Q175,150 200,100",
              "M0,100 Q25,60 50,100 Q75,140 100,100 Q125,60 150,100 Q175,140 200,100",
            ],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path
          d="M0,100 Q30,70 60,100 Q90,130 120,100 Q150,70 180,100"
          stroke={isDark ? "hsl(200, 50%, 52%)" : "hsl(142, 50%, 62%)"}
          strokeWidth="0.8"
          fill="none"
          animate={{
            d: [
              "M0,100 Q30,70 60,100 Q90,130 120,100 Q150,70 180,100",
              "M0,100 Q30,90 60,100 Q90,110 120,100 Q150,90 180,100",
              "M0,100 Q30,55 60,100 Q90,145 120,100 Q150,55 180,100",
              "M0,100 Q30,70 60,100 Q90,130 120,100 Q150,70 180,100",
            ],
          }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        />
        <motion.path
          d="M0,100 Q20,75 40,100 Q60,125 80,100 Q100,75 120,100 Q140,125 160,100 Q180,75 200,100"
          stroke={isDark ? "hsl(210, 45%, 50%)" : "hsl(142, 45%, 70%)"}
          strokeWidth="0.6"
          fill="none"
          animate={{
            d: [
              "M0,100 Q20,75 40,100 Q60,125 80,100 Q100,75 120,100 Q140,125 160,100 Q180,75 200,100",
              "M0,100 Q20,85 40,100 Q60,115 80,100 Q100,85 120,100 Q140,115 160,100 Q180,85 200,100",
              "M0,100 Q20,65 40,100 Q60,135 80,100 Q100,65 120,100 Q140,135 160,100 Q180,65 200,100",
              "M0,100 Q20,75 40,100 Q60,125 80,100 Q100,75 120,100 Q140,125 160,100 Q180,75 200,100",
            ],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
        />
      </svg>

      {/* Soundwave lines – right (mirrored) */}
      <svg
        className="absolute right-0 top-1/2 -translate-y-1/2 w-2/5 h-3/4 opacity-25 scale-x-[-1]"
        viewBox="0 0 200 200"
        fill="none"
        preserveAspectRatio="none"
      >
        <motion.path
          d="M0,100 Q25,60 50,100 Q75,140 100,100 Q125,60 150,100 Q175,140 200,100"
          stroke={isDark ? "hsl(210, 60%, 55%)" : "hsl(142, 60%, 55%)"}
          strokeWidth="1"
          fill="none"
          animate={{
            d: [
              "M0,100 Q25,60 50,100 Q75,140 100,100 Q125,60 150,100 Q175,140 200,100",
              "M0,100 Q25,80 50,100 Q75,120 100,100 Q125,80 150,100 Q175,120 200,100",
              "M0,100 Q25,50 50,100 Q75,150 100,100 Q125,50 150,100 Q175,150 200,100",
              "M0,100 Q25,60 50,100 Q75,140 100,100 Q125,60 150,100 Q175,140 200,100",
            ],
          }}
          transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
        />
        <motion.path
          d="M0,100 Q30,70 60,100 Q90,130 120,100 Q150,70 180,100"
          stroke={isDark ? "hsl(200, 45%, 50%)" : "hsl(142, 45%, 68%)"}
          strokeWidth="0.8"
          fill="none"
          animate={{
            d: [
              "M0,100 Q30,70 60,100 Q90,130 120,100 Q150,70 180,100",
              "M0,100 Q30,85 60,100 Q90,115 120,100 Q150,85 180,100",
              "M0,100 Q30,55 60,100 Q90,145 120,100 Q150,55 180,100",
              "M0,100 Q30,70 60,100 Q90,130 120,100 Q150,70 180,100",
            ],
          }}
          transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
      </svg>

      {/* Center orb – clickable Talk/Submit button */}
      <div
        className="absolute inset-0 flex items-center justify-center"
      >
        {/* Ambient glow */}
        <div
          className="absolute rounded-full"
          style={{
            width: 200,
            height: 200,
            background: isDark
              ? "radial-gradient(circle, hsl(142 70% 45% / 0.15) 0%, transparent 70%)"
              : "radial-gradient(circle, hsl(142 70% 45% / 0.1) 0%, transparent 70%)",
          }}
        />

        {/* Outer rotating ring */}
        <motion.svg
          width="160"
          height="160"
          viewBox="0 0 160 160"
          className="absolute"
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        >
          <defs>
            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(142, 70%, 50%)" stopOpacity="0.7" />
              <stop offset="40%" stopColor="hsl(142, 50%, 60%)" stopOpacity="0.4" />
              <stop offset="70%" stopColor={isDark ? "hsl(210, 40%, 50%)" : "hsl(140, 20%, 85%)"} stopOpacity="0.25" />
              <stop offset="100%" stopColor="hsl(142, 70%, 50%)" stopOpacity="0.1" />
            </linearGradient>
            <filter id="ringGlow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle
            cx="80"
            cy="80"
            r="68"
            fill="none"
            stroke="url(#ringGrad)"
            strokeWidth="2"
            filter="url(#ringGlow)"
            strokeDasharray="12 8 4 8"
          />
        </motion.svg>

        {/* Second ring */}
        <motion.svg
          width="140"
          height="140"
          viewBox="0 0 140 140"
          className="absolute"
          animate={{ rotate: -360 }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        >
          <defs>
            <linearGradient id="ringGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(142, 50%, 65%)" stopOpacity="0.3" />
              <stop offset="50%" stopColor="hsl(142, 70%, 50%)" stopOpacity="0.12" />
              <stop offset="100%" stopColor={isDark ? "hsl(210, 40%, 50%)" : "hsl(140, 30%, 80%)"} stopOpacity="0.08" />
            </linearGradient>
          </defs>
          <circle cx="70" cy="70" r="58" fill="none" stroke="url(#ringGrad2)" strokeWidth="1.5" strokeDasharray="6 12" />
        </motion.svg>

        {/* Radio wave pulses */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={`wave-${i}`}
            className="absolute rounded-full"
            style={{ width: 90, height: 90, border: `1px solid ${isDark ? "hsl(142 70% 50% / 0.25)" : "hsl(142 70% 50% / 0.2)"}` }}
            animate={{ scale: [1, 2.2], opacity: [0.4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeOut", delay: i * 0.9 }}
          />
        ))}

        {/* Inner glass sphere – Voice/Submit button */}
        <button
          onClick={handleMicClick}
          className="relative w-20 h-20 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-transform"
          style={{
            background: isDark
              ? "radial-gradient(circle at 40% 30%, hsl(220 20% 25% / 0.6), hsl(222 22% 12% / 0.4))"
              : "radial-gradient(circle at 40% 30%, hsl(0 0% 100% / 0.6), hsl(0 0% 100% / 0.2))",
            border: isListening
              ? "2px solid hsl(0 80% 55% / 0.6)"
              : "1px solid hsl(142 50% 60% / 0.25)",
            boxShadow: isListening
              ? "0 0 30px hsl(0 80% 50% / 0.3), 0 6px 24px hsl(0 0% 0% / 0.3)"
              : isDark
                ? "0 0 30px hsl(142 70% 45% / 0.2), inset 0 1px 0 hsl(220 20% 30% / 0.3), 0 6px 24px hsl(0 0% 0% / 0.3)"
                : "0 0 30px hsl(142 70% 45% / 0.12), inset 0 1px 0 hsl(0 0% 100% / 0.5), 0 6px 24px hsl(0 0% 0% / 0.06)",
          }}
        >
          <motion.div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: isListening
                ? "linear-gradient(135deg, hsl(0 80% 50%), hsl(0 70% 42%))"
                : "linear-gradient(135deg, hsl(142 70% 45%), hsl(155 55% 42%))",
              boxShadow: isListening
                ? "0 0 20px hsl(0 80% 50% / 0.4), 0 0 40px hsl(0 80% 50% / 0.15)"
                : "0 0 20px hsl(142 70% 45% / 0.3), 0 0 40px hsl(142 70% 45% / 0.1)",
            }}
            animate={
              isListening
                ? {
                    scale: [1, 1.15, 1],
                    boxShadow: [
                      "0 0 20px hsl(0 80% 50% / 0.4), 0 0 40px hsl(0 80% 50% / 0.15)",
                      "0 0 36px hsl(0 80% 50% / 0.6), 0 0 60px hsl(0 80% 50% / 0.2)",
                      "0 0 20px hsl(0 80% 50% / 0.4), 0 0 40px hsl(0 80% 50% / 0.15)",
                    ],
                  }
                : {
                    scale: [1, 1.06, 1],
                    boxShadow: [
                      "0 0 20px hsl(142 70% 45% / 0.3), 0 0 40px hsl(142 70% 45% / 0.1)",
                      "0 0 28px hsl(142 70% 45% / 0.4), 0 0 56px hsl(142 70% 45% / 0.15)",
                      "0 0 20px hsl(142 70% 45% / 0.3), 0 0 40px hsl(142 70% 45% / 0.1)",
                    ],
                  }
            }
            transition={{ duration: isListening ? 0.8 : 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            {isListening ? (
              <MicOff className="w-5 h-5 text-primary-foreground" />
            ) : (
              <Mic className="w-5 h-5 text-primary-foreground" />
            )}
          </motion.div>
        </button>
      </div>

      {/* Bottom – always-visible input field */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: isDark
              ? "hsl(222 22% 10% / 0.7)"
              : "hsl(0 0% 100% / 0.55)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: isDark
              ? "1px solid hsl(220 15% 20% / 0.5)"
              : "1px solid hsl(140 20% 80% / 0.5)",
          }}
        >
          <div className="flex items-center gap-2 p-1.5">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="I need a dentist appointment this week..."
              className="flex-1 bg-transparent text-sm px-3 py-2.5 outline-none text-foreground placeholder:text-muted-foreground"
            />
            <button
              onClick={handleSubmit}
              disabled={!inputText.trim()}
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-30"
              style={{
                background: inputText.trim()
                  ? "linear-gradient(135deg, hsl(142 70% 45%), hsl(155 55% 42%))"
                  : isDark
                    ? "hsl(222 15% 18% / 0.5)"
                    : "hsl(140 10% 88% / 0.5)",
                boxShadow: inputText.trim()
                  ? "0 4px 16px hsl(142 70% 45% / 0.25)"
                  : "none",
              }}
            >
              <SendHorizonal className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroCard;
