import { Home, PhoneCall, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";

interface BottomNavProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

const tabs = [
  { id: "dashboard", label: "Home", icon: Home },
  { id: "calls", label: "Calls", icon: PhoneCall },
  { id: "calendar", label: "Appointments", icon: Calendar },
];

const BottomNav = ({ activePage, onNavigate }: BottomNavProps) => {
  const { isDark } = useTheme();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40"
      style={{
        background: isDark
          ? "hsl(222 22% 8% / 0.75)"
          : "hsl(0 0% 100% / 0.45)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderTop: isDark
          ? "1px solid hsl(220 15% 18% / 0.6)"
          : "1px solid hsl(0 0% 100% / 0.5)",
        boxShadow: isDark
          ? "0 -4px 30px hsl(0 0% 0% / 0.3)"
          : "0 -4px 30px hsl(142 50% 40% / 0.06)",
      }}
    >
      <div className="flex items-center justify-around px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activePage === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors relative"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: "hsl(142 60% 50% / 0.12)",
                    border: "1px solid hsl(142 60% 50% / 0.2)",
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                className={`w-5 h-5 relative z-10 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <span
                className={`text-[10px] font-medium relative z-10 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
