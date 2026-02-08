import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Star, MapPin, Clock, CheckCircle2, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import type { Id } from "@convex/_generated/dataModel";

interface CampaignResultsProps {
  campaignId: Id<"campaigns">;
  onClose: () => void;
}

const CampaignResults = ({ campaignId, onClose }: CampaignResultsProps) => {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { convexUserId } = useAuth();
  const [bookedSlot, setBookedSlot] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);

  const campaign = useQuery(api.campaigns.get, { campaignId });
  const calls = useQuery(api.agentCalls.getByCampaign, { campaignId });
  const createAppointment = useMutation(api.appointments.create);
  const updateCampaignStatus = useMutation(api.campaigns.updateStatus);

  // Collect all found slots with provider info
  const slotsWithDetails = (calls || [])
    .filter((c) => c.slotsFound && c.slotsFound.length > 0)
    .flatMap((call) =>
      (call.slotsFound || []).map((slot) => ({
        ...slot,
        callId: call._id,
        providerId: call.providerId,
        confidenceScore: call.confidenceScore || 0,
      }))
    );

  const handleBook = async (slot: (typeof slotsWithDetails)[0]) => {
    if (!convexUserId || booking) return;
    setBooking(true);
    try {
      await createAppointment({
        userId: convexUserId,
        campaignId,
        callId: slot.callId,
        providerId: slot.providerId,
        datetime: slot.datetime,
        notes: slot.details,
        confidenceScore: slot.confidenceScore,
        scoringBreakdown: {
          availability: 80,
          distance: 70,
          rating: 85,
          preference: 75,
          total: 78,
        },
      });
      await updateCampaignStatus({ campaignId, status: "BOOKED" });
      setBookedSlot(slot.datetime + slot.providerId);
    } catch (err) {
      console.error("Failed to book:", err);
    } finally {
      setBooking(false);
    }
  };

  const hasSlots = slotsWithDetails.length > 0;

  return (
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
      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-5 pt-5 pb-3">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-xl glass flex items-center justify-center hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {t("campaign.results")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t("campaign.resultsHint")}
          </p>
        </div>
      </div>

      {/* Booked confirmation */}
      {bookedSlot && (
        <div className="relative z-10 px-5 pb-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-accent rounded-2xl p-4 shadow-card gradient-border text-center"
          >
            <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">
              {t("campaign.booked")}
            </p>
          </motion.div>
        </div>
      )}

      {/* Results */}
      <div className="relative z-10 flex-1 overflow-y-auto px-5 pb-4">
        {!hasSlots ? (
          <div className="text-center py-12">
            <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium text-foreground">{t("campaign.noSlots")}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("campaign.noSlotsHint")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {slotsWithDetails.map((slot, i) => (
              <motion.div
                key={`${slot.callId}-${slot.datetime}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * i }}
              >
                <SlotCard
                  slot={slot}
                  rank={i + 1}
                  isBooked={bookedSlot === slot.datetime + slot.providerId}
                  onBook={() => handleBook(slot)}
                  booking={booking}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom */}
      <div className="relative z-10 px-5 pb-8 pt-3">
        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-xl text-sm font-medium glass text-foreground hover:bg-muted/50 transition-colors"
        >
          {bookedSlot ? t("campaign.close") : t("campaign.back")}
        </button>
      </div>
    </motion.div>
  );
};

interface SlotCardProps {
  slot: {
    datetime: string;
    details?: string;
    callId: Id<"agentCalls">;
    providerId: Id<"providers">;
    confidenceScore: number;
  };
  rank: number;
  isBooked: boolean;
  onBook: () => void;
  booking: boolean;
}

function SlotCard({ slot, rank, isBooked, onBook, booking }: SlotCardProps) {
  const { t } = useTranslation();
  const provider = useQuery(api.providers.getById, { id: slot.providerId });

  const formatDateTime = (dt: string) => {
    try {
      const date = new Date(dt);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return dt;
    }
  };

  return (
    <div
      className={`glass-accent rounded-2xl p-4 shadow-card transition-all ${
        isBooked ? "gradient-border" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Rank badge */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold text-primary-foreground"
          style={{ background: rank === 1 ? "var(--gradient-primary)" : undefined }}
        >
          {rank === 1 ? (
            <Trophy className="w-4 h-4" />
          ) : (
            <span className="text-muted-foreground">#{rank}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-sm truncate">
            {provider?.name || "Loading..."}
          </h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {formatDateTime(slot.datetime)}
            </span>
            {provider?.rating && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                {provider.rating.toFixed(1)}
              </span>
            )}
          </div>
          {provider?.address && (
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 shrink-0" />
              {provider.address}, {provider.city}
            </p>
          )}
          {slot.details && (
            <p className="text-xs text-muted-foreground mt-1.5 italic">
              &ldquo;{slot.details}&rdquo;
            </p>
          )}

          {/* Score bar */}
          <div className="mt-2.5">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
              <span>{t("campaign.overallScore")}</span>
              <span className="font-medium text-foreground">{slot.confidenceScore}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  background: "var(--gradient-primary)",
                  width: `${slot.confidenceScore}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Book button */}
      {!isBooked && (
        <button
          onClick={onBook}
          disabled={booking}
          className="w-full mt-3 py-2.5 rounded-xl text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
          style={{ background: "var(--gradient-primary)" }}
        >
          {booking ? (
            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mx-auto" />
          ) : (
            t("campaign.bookSlot")
          )}
        </button>
      )}
      {isBooked && (
        <div className="w-full mt-3 py-2.5 rounded-xl text-xs font-semibold text-primary text-center bg-primary/10 border border-primary/20">
          <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5" />
          {t("campaign.booked")}
        </div>
      )}
    </div>
  );
}

export default CampaignResults;
