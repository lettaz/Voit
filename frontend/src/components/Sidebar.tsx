import { LayoutDashboard, PhoneCall, Calendar, Settings, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  activePage: string;
  onNavigate: (page: string) => void;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "calls", label: "Active Calls", icon: PhoneCall },
  { id: "calendar", label: "Appointments", icon: Calendar },
  { id: "settings", label: "Settings", icon: Settings },
];

const Sidebar = ({ open, onClose, activePage, onNavigate }: SidebarProps) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40"
            style={{
              background: "hsl(220 15% 15% / 0.25)",
              backdropFilter: "blur(4px)",
            }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.aside
            initial={{ x: "-100%", opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0.5 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 z-50 w-72 flex flex-col rounded-r-3xl overflow-hidden"
          >
            {/* Glass background with gradient */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, hsl(0 0% 100% / 0.97), hsl(140 15% 97% / 0.98))",
                backdropFilter: "blur(30px)",
              }}
            />
            {/* Gradient glow at top */}
            <div
              className="absolute top-0 left-0 right-0 h-40 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 30% 0%, hsl(142 60% 50% / 0.06) 0%, transparent 60%)",
              }}
            />
            {/* Border */}
            <div
              className="absolute inset-0 rounded-r-3xl pointer-events-none"
              style={{
                border: "1px solid hsl(140 10% 88%)",
                borderLeft: "none",
              }}
            />

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between px-5 pt-6 pb-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    <PhoneCall className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="text-lg font-bold text-foreground">
                    VoIt
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <nav className="flex-1 px-3 mt-6">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium px-4 mb-3">
                  Navigation
                </p>
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        onClose();
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      style={
                        isActive
                          ? {
                              background:
                                "linear-gradient(135deg, hsl(142 60% 50% / 0.1), hsl(142 50% 55% / 0.05))",
                              border: "1px solid hsl(142 60% 50% / 0.18)",
                            }
                          : undefined
                      }
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>

              <div className="px-4 pb-6">
                <div
                  className="rounded-2xl p-4 gradient-border"
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(0 0% 100% / 0.8), hsl(140 15% 96% / 0.9))",
                  }}
                >
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Logged in as
                  </p>
                  <p className="text-sm font-semibold text-foreground mt-1">
                    Alex Weber
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    alex@callpilot.de
                  </p>
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
