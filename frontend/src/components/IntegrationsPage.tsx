import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, CheckCircle2, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

const IntegrationsPage = () => {
  const { t } = useTranslation();
  const { connectCalendar, calendarConnected, convexUserId } = useAuth();
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  const convexUser = useQuery(
    api.users.getById,
    convexUserId ? { id: convexUserId } : "skip"
  );
  const updatePreferences = useMutation(api.users.updatePreferences);

  const locationConnected = !!(convexUser?.location?.lat && convexUser?.location?.lng);
  const locationArea = convexUser?.location?.area || "";

  const handleEnableLocation = async () => {
    if (!convexUserId) return;
    if (!navigator.geolocation) {
      setLocError(t("integrations.locationUnsupported"));
      return;
    }

    setLocating(true);
    setLocError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Reverse geocode to get a human-readable area name
        let area = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        try {
          const apiKey =
            import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
          if (apiKey) {
            const res = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&result_type=locality|sublocality|neighborhood`
            );
            const data = await res.json();
            if (data.results?.[0]?.formatted_address) {
              area = data.results[0].formatted_address;
            }
          } else {
            // Fallback: use browser Intl or just coordinates
            // Try the free Nominatim API as fallback
            try {
              const nomRes = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=12`,
                { headers: { "User-Agent": "Voit/1.0" } }
              );
              const nomData = await nomRes.json();
              if (nomData.display_name) {
                // Take first 2-3 parts of the address
                const parts = nomData.display_name.split(",").map((s: string) => s.trim());
                area = parts.slice(0, 3).join(", ");
              }
            } catch {
              // Keep coordinates as fallback
            }
          }
        } catch {
          // Keep coordinates as fallback
        }

        try {
          await updatePreferences({
            id: convexUserId,
            location: {
              area,
              lat: latitude,
              lng: longitude,
            },
          });
          console.log(`[Location] Saved: ${area} (${latitude}, ${longitude})`);
        } catch (err) {
          console.error("[Location] Failed to save:", err);
          setLocError(t("integrations.locationSaveFailed"));
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        console.error("[Location] Geolocation error:", err);
        setLocating(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setLocError(t("integrations.locationDenied"));
            break;
          case err.POSITION_UNAVAILABLE:
            setLocError(t("integrations.locationUnavailable"));
            break;
          case err.TIMEOUT:
            setLocError(t("integrations.locationTimeout"));
            break;
          default:
            setLocError(t("integrations.locationError"));
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-xl font-bold text-foreground">{t("integrations.title")}</h1>
      <p className="text-muted-foreground mt-1 text-sm">{t("integrations.subtitle")}</p>

      <div className="mt-6 space-y-3">
        {/* Google Calendar Integration */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="glass rounded-2xl p-4 shadow-card"
        >
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${calendarConnected ? "bg-primary/15" : "glass"}`}>
              <Calendar className={`w-5 h-5 ${calendarConnected ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground text-sm">{t("integrations.calendar")}</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{t("integrations.calendarDesc")}</p>
            </div>
          </div>
          {calendarConnected ? (
            <div className="w-full mt-3 py-2.5 rounded-xl text-xs font-medium text-center text-primary bg-primary/10 border border-primary/20">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t("integrations.calendarConnected")}
              </span>
            </div>
          ) : (
            <button
              onClick={connectCalendar}
              className="w-full mt-3 py-2.5 rounded-xl text-xs font-medium text-primary-foreground border border-primary/20 hover:opacity-90 transition-opacity"
              style={{ background: "var(--gradient-primary)" }}
            >
              {t("integrations.connect")}
            </button>
          )}
        </motion.div>

        {/* Location Integration */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="glass rounded-2xl p-4 shadow-card"
        >
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${locationConnected ? "bg-primary/15" : "glass"}`}>
              <MapPin className={`w-5 h-5 ${locationConnected ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground text-sm">{t("integrations.location")}</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{t("integrations.locationDesc")}</p>
            </div>
          </div>

          {locationConnected ? (
            <div className="w-full mt-3 py-2.5 rounded-xl text-xs font-medium text-center text-primary bg-primary/10 border border-primary/20">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {locationArea || t("integrations.locationEnabled")}
              </span>
            </div>
          ) : (
            <>
              <button
                onClick={handleEnableLocation}
                disabled={locating}
                className="w-full mt-3 py-2.5 rounded-xl text-xs font-medium text-primary-foreground border border-primary/20 hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: "var(--gradient-primary)" }}
              >
                {locating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {t("integrations.locating")}
                  </>
                ) : (
                  t("integrations.enable")
                )}
              </button>
              {locError && (
                <p className="text-[10px] text-destructive mt-2 text-center">{locError}</p>
              )}
            </>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default IntegrationsPage;
