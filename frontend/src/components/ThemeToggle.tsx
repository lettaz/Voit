import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="w-9 h-9 rounded-xl glass flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
      aria-label="Toggle theme"
    >
      <motion.div
        key={isDark ? "moon" : "sun"}
        initial={{ rotate: -30, opacity: 0, scale: 0.8 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        exit={{ rotate: 30, opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.2 }}
      >
        {isDark ? (
          <Sun className="w-4.5 h-4.5 text-yellow-400" />
        ) : (
          <Moon className="w-4.5 h-4.5 text-muted-foreground" />
        )}
      </motion.div>
    </button>
  );
};

export default ThemeToggle;
