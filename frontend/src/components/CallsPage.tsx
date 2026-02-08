import { motion } from "framer-motion";
import { PhoneOff, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import CampaignCard from "./CampaignCard";
import type { Id } from "@convex/_generated/dataModel";

interface CallsPageProps {
  onViewCampaign: (id: Id<"campaigns">, step?: "progress" | "results") => void;
}

const CallsPage = ({ onViewCampaign }: CallsPageProps) => {
  const { t } = useTranslation();
  const { convexUserId } = useAuth();

  const campaigns = useQuery(
    api.campaigns.listWithDetails,
    convexUserId ? { userId: convexUserId } : "skip"
  );

  const isLoading = campaigns === undefined;

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-xl font-bold text-foreground">{t("calls.title")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("calls.subtitle")}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-6"
      >
        <h2 className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-3">
          {t("calls.yourCampaigns")}
        </h2>

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass rounded-2xl p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && campaigns.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium text-foreground">{t("calls.noCampaigns")}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("calls.noCampaignsHint")}</p>
          </div>
        )}

        {/* Campaign list */}
        {!isLoading && campaigns.length > 0 && (
          <div className="space-y-3">
            {campaigns.map((campaign, i) => (
              <motion.div
                key={campaign._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * i + 0.2 }}
              >
                <CampaignCard
                  campaign={campaign as any}
                  onClick={() => {
                    const step =
                      campaign.status === "COMPLETED" || campaign.status === "BOOKED"
                        ? "results"
                        : "progress";
                    onViewCampaign(campaign._id, step);
                  }}
                />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CallsPage;
