import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { parseIntent, type ParsedIntent } from "@/lib/intentParser";
import ProviderPreview from "./ProviderPreview";
import CampaignProgress from "./CampaignProgress";
import CampaignResults from "./CampaignResults";
import type { Id, Doc } from "@convex/_generated/dataModel";

export type CampaignFlowState =
  | { step: "parsing"; input: string }
  | { step: "preview"; intent: ParsedIntent; providers: Doc<"providers">[] }
  | { step: "progress"; campaignId: Id<"campaigns"> }
  | { step: "results"; campaignId: Id<"campaigns"> };

interface CampaignFlowProps {
  state: CampaignFlowState;
  onStateChange: (state: CampaignFlowState | null) => void;
  onClose: () => void;
}

const CampaignFlow = ({ state, onStateChange, onClose }: CampaignFlowProps) => {
  const { convexUserId } = useAuth();
  const createCampaign = useMutation(api.campaigns.create);
  const [launching, setLaunching] = useState(false);

  // When in parsing step, parse intent and fetch providers
  const intent = state.step === "parsing" ? parseIntent(state.input) : null;
  const providers = useQuery(
    api.providers.listByCategory,
    intent ? { category: intent.category } : "skip"
  );

  // Transition from parsing -> preview when providers load
  useEffect(() => {
    if (state.step === "parsing" && intent && providers) {
      if (providers.length === 0) {
        // Also try "general" or list all if no category match
      }
      onStateChange({
        step: "preview",
        intent,
        providers,
      });
    }
  }, [state.step, intent, providers, onStateChange]);

  // Handle campaign launch
  const handleLaunch = useCallback(
    async (selectedProviderIds: string[]) => {
      if (!convexUserId || state.step !== "preview" || launching) return;

      setLaunching(true);
      try {
        const campaignId = await createCampaign({
          userId: convexUserId,
          request: {
            raw: state.intent.raw,
            category: state.intent.category,
            specifics: state.intent.specifics,
            timeframe: state.intent.timeframe,
            preferredTime: state.intent.preferredTime,
          },
          providerIds: selectedProviderIds as Id<"providers">[],
        });

        // POST to backend to launch the batch calls
        try {
          await fetch(`/api/campaigns/launch`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ campaignId }),
          });
        } catch (err) {
          console.error("Backend launch failed (campaign created in Convex):", err);
        }

        onStateChange({ step: "progress", campaignId });
      } catch (err) {
        console.error("Failed to create campaign:", err);
      } finally {
        setLaunching(false);
      }
    },
    [convexUserId, state, launching, createCampaign, onStateChange]
  );

  return (
    <AnimatePresence mode="wait">
      {/* Parsing / loading state */}
      {state.step === "parsing" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Finding providers...</p>
          </div>
        </div>
      )}

      {/* Provider preview */}
      {state.step === "preview" && (
        <ProviderPreview
          intent={state.intent}
          providers={state.providers}
          onLaunch={handleLaunch}
          onBack={onClose}
          loading={launching}
        />
      )}

      {/* Campaign progress */}
      {state.step === "progress" && (
        <CampaignProgress
          campaignId={state.campaignId}
          onClose={onClose}
          onViewResults={() =>
            onStateChange({ step: "results", campaignId: state.campaignId })
          }
        />
      )}

      {/* Results */}
      {state.step === "results" && (
        <CampaignResults campaignId={state.campaignId} onClose={onClose} />
      )}
    </AnimatePresence>
  );
};

export default CampaignFlow;
