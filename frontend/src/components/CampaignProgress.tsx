import { motion } from "framer-motion";
import { ArrowLeft, X, Phone, CheckCircle2, XCircle, Clock, Loader2, MessageSquare, VoicemailIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id, Doc } from "@convex/_generated/dataModel";

interface CampaignProgressProps {
  campaignId: Id<"campaigns">;
  onClose: () => void;
  onViewResults: () => void;
}

const callStatusConfig: Record<string, { icon: typeof Phone; color: string; pulse?: boolean }> = {
  QUEUED: { icon: Clock, color: "text-muted-foreground" },
  RINGING: { icon: Phone, color: "text-yellow-500", pulse: true },
  CONNECTED: { icon: Phone, color: "text-primary", pulse: true },
  NEGOTIATING: { icon: MessageSquare, color: "text-primary", pulse: true },
  ON_HOLD: { icon: Clock, color: "text-yellow-500", pulse: true },
  COMPLETED: { icon: CheckCircle2, color: "text-primary" },
  FAILED: { icon: XCircle, color: "text-destructive" },
  NO_ANSWER: { icon: XCircle, color: "text-muted-foreground" },
  VOICEMAIL: { icon: VoicemailIcon, color: "text-yellow-500" },
  CANCELLED: { icon: XCircle, color: "text-muted-foreground" },
};

const CampaignProgress = ({ campaignId, onClose, onViewResults }: CampaignProgressProps) => {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  const campaign = useQuery(api.campaigns.get, { campaignId });
  const calls = useQuery(api.agentCalls.getByCampaign, { campaignId });

  // We need provider info for each call
  const providerIds = campaign?.providerIds || [];

  const terminalStatuses = ["COMPLETED", "FAILED", "NO_ANSWER", "VOICEMAIL", "CANCELLED"];
  const completedCount = calls?.filter((c) => terminalStatuses.includes(c.status)).length || 0;
  const totalCount = calls?.length || 0;
  const isFinished = totalCount > 0 && completedCount === totalCount;
  const slotsFound = calls?.filter((c) => c.slotsFound && c.slotsFound.length > 0).length || 0;

  const handleCancel = async () => {
    if (!campaign?.batchId) return;
    try {
      await fetch(`/api/campaigns/${campaignId}/cancel`, { method: "POST" });
    } catch (err) {
      console.error("Failed to cancel campaign:", err);
    }
  };

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
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl glass flex items-center justify-center hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {t("campaign.progress")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {campaign?.request.raw}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-xl glass flex items-center justify-center hover:bg-muted/50 transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Progress summary */}
      <div className="relative z-10 px-5 py-3">
        <div className="glass-accent rounded-2xl p-4 shadow-card gradient-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">
              {t("campaign.progressCount", { completed: completedCount, total: totalCount })}
            </span>
            {slotsFound > 0 && (
              <span className="text-sm font-semibold text-gradient">
                {slotsFound} {t("calls.slotsFound")}
              </span>
            )}
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "var(--gradient-primary)" }}
              animate={{
                width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Call list */}
      <div className="relative z-10 flex-1 overflow-y-auto px-5 pb-4">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-3">
          {t("campaign.callingProviders", { total: totalCount })}
        </p>
        <div className="space-y-2">
          {calls?.map((call, i) => {
            const config = callStatusConfig[call.status] || callStatusConfig.QUEUED;
            const Icon = config.icon;
            const statusKey = call.status.toLowerCase().replace("_", "");
            const statusMap: Record<string, string> = {
              queued: "queued", ringing: "ringing", connected: "connected",
              negotiating: "negotiating", on_hold: "onHold", completed: "completed",
              failed: "failed", no_answer: "noAnswer", voicemail: "voicemail",
              cancelled: "cancelled",
            };
            const statusLabel = t(`campaign.${statusMap[call.status.toLowerCase()] || call.status.toLowerCase()}`, call.status);

            return (
              <motion.div
                key={call._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 * i }}
                className="glass rounded-xl p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`${config.color}`}>
                      <Icon className={`w-4 h-4 ${config.pulse ? "animate-pulse" : ""}`} />
                    </div>
                    <div className="min-w-0">
                      <CallProviderName providerId={call.providerId} />
                      {call.slotsFound && call.slotsFound.length > 0 && (
                        <p className="text-[10px] text-primary font-medium mt-0.5">
                          {call.slotsFound.length} slot(s) found
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`text-[10px] font-medium ${config.color}`}>
                    {statusLabel}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="relative z-10 px-5 pb-8 pt-3 flex gap-3">
        {!isFinished && campaign?.status === "ACTIVE" && (
          <button
            onClick={handleCancel}
            className="flex-1 py-3.5 rounded-xl text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 hover:bg-destructive/20 transition-colors"
          >
            {t("campaign.cancelCampaign")}
          </button>
        )}
        {isFinished && (
          <button
            onClick={onViewResults}
            className="flex-1 py-3.5 rounded-2xl text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity glow-green-strong"
            style={{ background: "var(--gradient-primary)" }}
          >
            {t("campaign.results")}
          </button>
        )}
      </div>
    </motion.div>
  );
};

/** Small helper to display provider name from ID using a Convex query. */
function CallProviderName({ providerId }: { providerId: Id<"providers"> }) {
  const provider = useQuery(api.providers.getById, { id: providerId });
  return (
    <p className="text-sm font-medium text-foreground truncate">
      {provider?.name || "Loading..."}
    </p>
  );
}

export default CampaignProgress;
