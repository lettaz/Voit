import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Clock, Calendar, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

interface ProfilePageProps {
  onBack: () => void;
}

const ProfilePage = ({ onBack }: ProfilePageProps) => {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { user, convexUserId } = useAuth();
  const updatePreferences = useMutation(api.users.updatePreferences);

  const convexUser = useQuery(
    api.users.getById,
    convexUserId ? { id: convexUserId } : "skip"
  );

  const [area, setArea] = useState("");
  const [maxDistance, setMaxDistance] = useState(25);
  const [preferredTimes, setPreferredTimes] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  // Load existing preferences
  useEffect(() => {
    if (convexUser) {
      setArea(convexUser.location?.area || "");
      setMaxDistance(convexUser.preferences?.maxDistanceMiles || 25);
      setPreferredTimes(convexUser.preferences?.preferredTimes || []);
    }
  }, [convexUser]);

  const toggleTime = (time: string) => {
    setPreferredTimes((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    );
  };

  const handleSave = async () => {
    if (!convexUserId) return;
    try {
      await updatePreferences({
        id: convexUserId,
        location: area ? { area } : undefined,
        preferences: {
          maxDistanceMiles: maxDistance,
          preferredTimes,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save preferences:", err);
    }
  };

  const timeOptions = [
    { key: "morning", label: t("profile.morning"), icon: "🌅" },
    { key: "afternoon", label: t("profile.afternoon"), icon: "☀️" },
    { key: "evening", label: t("profile.evening"), icon: "🌙" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto"
      style={{
        background: isDark
          ? "linear-gradient(180deg, hsl(222 25% 8%) 0%, hsl(222 22% 5%) 100%)"
          : "linear-gradient(180deg, hsl(0 0% 100%) 0%, hsl(140 15% 97%) 100%)",
      }}
    >
      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-5 pt-5 pb-3">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-xl glass flex items-center justify-center hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t("profile.title")}</h2>
          <p className="text-xs text-muted-foreground">{t("profile.subtitle")}</p>
        </div>
      </div>

      <div className="px-5 pb-8 space-y-6">
        {/* User info card */}
        <div className="glass-accent rounded-2xl p-4 shadow-card gradient-border">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-primary-foreground"
              style={{ background: "var(--gradient-primary)" }}
            >
              {user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "??"}
            </div>
            <div>
              <p className="font-semibold text-foreground">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-2 block flex items-center gap-1.5">
            <MapPin className="w-3 h-3" />
            {t("profile.location")}
          </label>
          <input
            type="text"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder={t("profile.locationPlaceholder")}
            className="w-full px-4 py-3 rounded-xl bg-background/60 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
          />
        </div>

        {/* Max distance */}
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-2 block">
            {t("profile.maxDistance")}: {maxDistance}
          </label>
          <input
            type="range"
            min={1}
            max={100}
            value={maxDistance}
            onChange={(e) => setMaxDistance(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        {/* Time preferences */}
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-2 block flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            {t("profile.preferredTimes")}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {timeOptions.map((opt) => {
              const isActive = preferredTimes.includes(opt.key);
              return (
                <button
                  key={opt.key}
                  onClick={() => toggleTime(opt.key)}
                  className={`py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "text-primary-foreground shadow-card"
                      : "glass text-muted-foreground hover:text-foreground"
                  }`}
                  style={isActive ? { background: "var(--gradient-primary)" } : undefined}
                >
                  <span className="block text-lg mb-0.5">{opt.icon}</span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Calendar connection */}
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-2 block flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />
            {t("profile.calendar")}
          </label>
          <button
            className="w-full py-3 rounded-xl text-sm font-medium glass text-muted-foreground border border-border/50 flex items-center justify-center gap-2"
            disabled
          >
            {convexUser?.calendarConnected ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-primary" />
                {t("profile.calendarConnected")}
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4" />
                {t("profile.calendarConnect")}
              </>
            )}
          </button>
          {!convexUser?.calendarConnected && (
            <p className="text-[10px] text-muted-foreground mt-1 text-center">
              Coming soon
            </p>
          )}
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          className="w-full py-3.5 rounded-xl text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity glow-green-strong"
          style={{ background: "var(--gradient-primary)" }}
        >
          {saved ? (
            <span className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {t("profile.saved")}
            </span>
          ) : (
            t("profile.save")
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default ProfilePage;
