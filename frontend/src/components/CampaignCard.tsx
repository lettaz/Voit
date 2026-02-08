import { Phone, CheckCircle2, Clock, XCircle, Loader2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { Doc, Id } from "@convex/_generated/dataModel";

export interface CampaignWithDetails {
  _id: Id<"campaigns">;
  request: {
    raw: string;
    category: string;
    specifics?: string;
    timeframe: string;
    preferredTime?: string;
  };
  status: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  providers: (Doc<"providers"> | null)[];
  calls: Doc<"agentCalls">[];
  progress: {
    total: number;
    completed: number;
    successful: number;
    slotsFound: Array<{
      datetime: string;
      details?: string;
      providerId: Id<"providers">;
      callId: Id<"agentCalls">;
      confidenceScore?: number;
    }>;
  };
}

interface CampaignCardProps {
  campaign: CampaignWithDetails;
  onClick: () => void;
}

const statusConfig: Record<string, { icon: typeof Phone; badgeClass: string }> = {
  PREVIEW: { icon: Clock, badgeClass: "bg-muted text-muted-foreground border border-border" },
  ACTIVE: { icon: Phone, badgeClass: "bg-primary/15 text-primary border border-primary/20" },
  PAUSED: { icon: Clock, badgeClass: "bg-yellow-500/15 text-yellow-600 border border-yellow-500/20" },
  COMPLETED: { icon: CheckCircle2, badgeClass: "bg-primary/15 text-primary border border-primary/20" },
  BOOKED: { icon: CheckCircle2, badgeClass: "bg-primary/15 text-primary border border-primary/20" },
  CANCELLED: { icon: XCircle, badgeClass: "bg-destructive/10 text-destructive border border-destructive/15" },
  FAILED: { icon: XCircle, badgeClass: "bg-destructive/10 text-destructive border border-destructive/15" },
};

const CampaignCard = ({ campaign, onClick }: CampaignCardProps) => {
  const { t } = useTranslation();
  const config = statusConfig[campaign.status] || statusConfig.PREVIEW;
  const Icon = config.icon;
  const isActive = campaign.status === "ACTIVE";

  const statusLabel = t(`calls.${campaign.status.toLowerCase()}`, campaign.status);

  const timeAgo = (ms: number) => {
    const diff = Date.now() - ms;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ duration: 0.25 }}
      onClick={onClick}
      className="relative group cursor-pointer"
    >
      <div className="glass-accent rounded-2xl p-4 shadow-card gradient-border transition-all duration-300 group-hover:glow-green">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate text-sm">
                {campaign.request.raw}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              {campaign.providers.length} providers &middot; {campaign.request.timeframe}
            </p>

            {/* Progress bar for active campaigns */}
            {campaign.progress.total > 0 && (
              <div className="mt-2.5">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                  <span>
                    {campaign.progress.completed}/{campaign.progress.total}{" "}
                    {t("calls.callsCompleted")}
                  </span>
                  {campaign.progress.successful > 0 && (
                    <span className="text-primary font-medium">
                      {campaign.progress.successful} {t("calls.slotsFound")}
                    </span>
                  )}
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "var(--gradient-primary)" }}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${campaign.progress.total > 0 ? (campaign.progress.completed / campaign.progress.total) * 100 : 0}%`,
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            )}

            <p className="text-[10px] text-muted-foreground mt-2">
              {timeAgo(campaign.createdAt)}
            </p>
          </div>

          <div className="flex items-center gap-2 ml-2 shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full ${config.badgeClass}`}
            >
              {isActive && (
                <Loader2 className="w-3 h-3 animate-spin" />
              )}
              {!isActive && <Icon className="w-3 h-3" />}
              {statusLabel}
            </span>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CampaignCard;
