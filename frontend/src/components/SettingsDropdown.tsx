import { useState, useRef, useEffect } from "react";
import { Settings, LogOut, User, Bell, HelpCircle, Shield, Moon, Sun } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";

const SettingsDropdown = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme, isDark } = useTheme();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuItems = [
    { icon: User, label: "Profile", action: () => {} },
    { icon: Bell, label: "Notifications", action: () => {} },
    { icon: isDark ? Sun : Moon, label: isDark ? "Light Mode" : "Dark Mode", action: toggleTheme },
    { icon: Shield, label: "Privacy", action: () => {} },
    { icon: HelpCircle, label: "Help & Support", action: () => {} },
    { divider: true },
    { icon: LogOut, label: "Abmelden", action: () => { logout(); navigate("/auth"); }, destructive: true },
  ] as const;

  return (
    <div ref={ref} className="relative" style={{ zIndex: 9999 }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-primary-foreground hover:scale-105 transition-transform"
        style={{ background: "var(--gradient-primary)" }}
      >
        {user?.name ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "??"}
      </button>

      {open && (
        <div
          className="absolute right-0 top-12 w-52 rounded-2xl overflow-hidden py-1.5"
          style={{
            zIndex: 9999,
            background: isDark
              ? "hsl(222 22% 10% / 0.95)"
              : "hsl(0 0% 100% / 0.95)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: isDark
              ? "1px solid hsl(220 15% 20% / 0.6)"
              : "1px solid hsl(0 0% 100% / 0.6)",
            boxShadow: isDark
              ? "0 12px 40px hsl(0 0% 0% / 0.5), 0 4px 12px hsl(0 0% 0% / 0.3)"
              : "0 12px 40px hsl(0 0% 0% / 0.15), 0 4px 12px hsl(0 0% 0% / 0.08)",
          }}
        >
          {/* User info */}
          <div className="px-4 py-3 border-b border-border/50">
            <p className="text-sm font-semibold text-foreground">{user?.name || "Benutzer"}</p>
            <p className="text-xs text-muted-foreground">{user?.email || ""}</p>
          </div>

          {menuItems.map((item, i) => {
            if ("divider" in item) {
              return <div key={i} className="my-1.5 border-t border-border/50" />;
            }
            const Icon = item.icon;
            return (
              <button
                key={i}
                onClick={() => {
                  item.action();
                  if (!("label" in item && (item.label === "Dark Mode" || item.label === "Light Mode"))) {
                    setOpen(false);
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  "destructive" in item && item.destructive
                    ? "text-destructive hover:bg-destructive/10"
                    : "text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SettingsDropdown;
