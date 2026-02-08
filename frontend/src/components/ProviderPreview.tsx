import { useState } from "react";
import { motion } from "framer-motion";
import { Star, MapPin, Check, ArrowLeft, Phone, DollarSign } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import type { ParsedIntent, CATEGORY_LABELS } from "@/lib/intentParser";
import type { Doc } from "@convex/_generated/dataModel";

interface ProviderPreviewProps {
  intent: ParsedIntent;
  providers: Doc<"providers">[];
  onLaunch: (selectedProviderIds: string[]) => void;
  onBack: () => void;
  loading?: boolean;
}

const ProviderPreview = ({ intent, providers, onLaunch, onBack, loading }: ProviderPreviewProps) => {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(providers.map((p) => p._id))
  );
  const { t } = useTranslation();
  const { isDark } = useTheme();

  const toggleProvider = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const priceLabel = (level?: number) => {
    if (!level) return null;
    return "$".repeat(level);
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
      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-5 pt-5 pb-3">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-xl glass flex items-center justify-center hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {t("campaign.selectProviders")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t("campaign.selectProvidersHint")}
          </p>
        </div>
      </div>

      {/* Request summary */}
      <div className="px-5 pb-3">
        <div className="glass rounded-xl p-3">
          <p className="text-sm text-foreground font-medium">&ldquo;{intent.raw}&rdquo;</p>
          <p className="text-xs text-muted-foreground mt-1">
            {intent.category} &middot; {intent.timeframe}
            {intent.preferredTime && ` &middot; ${intent.preferredTime}`}
          </p>
        </div>
      </div>

      {/* Provider count */}
      <div className="px-5 pb-2">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
          {t("campaign.providerCount", { count: providers.length })}
        </p>
      </div>

      {/* Provider list */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <div className="space-y-2.5">
          {providers.map((provider, i) => {
            const isSelected = selected.has(provider._id);
            return (
              <motion.div
                key={provider._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * i }}
              >
                <button
                  onClick={() => toggleProvider(provider._id)}
                  className={`w-full text-left rounded-2xl p-4 transition-all duration-200 ${
                    isSelected
                      ? "glass-accent shadow-card gradient-border"
                      : "glass opacity-60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                        isSelected
                          ? "text-primary-foreground"
                          : "border-2 border-border bg-background/50"
                      }`}
                      style={
                        isSelected
                          ? { background: "var(--gradient-primary)" }
                          : undefined
                      }
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm truncate">
                        {provider.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        {provider.rating && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            {provider.rating.toFixed(1)}
                          </span>
                        )}
                        {provider.priceLevel && (
                          <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                            <DollarSign className="w-3 h-3" />
                            {priceLabel(provider.priceLevel)}
                          </span>
                        )}
                      </div>
                      {provider.phone && (
                        <p className="text-xs text-muted-foreground mt-1 truncate flex items-center gap-1">
                          <Phone className="w-3 h-3 shrink-0" />
                          {provider.phone}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5 truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {provider.address}, {provider.city}
                      </p>
                    </div>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Launch button */}
      <div className="relative z-10 px-5 pb-8 pt-3">
        <button
          onClick={() => onLaunch(Array.from(selected))}
          disabled={selected.size === 0 || loading}
          className="w-full py-4 rounded-2xl text-sm font-semibold text-primary-foreground flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40 glow-green-strong"
          style={{ background: "var(--gradient-primary)" }}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <>
              <Phone className="w-4 h-4" />
              {t("campaign.launch", { count: selected.size })}
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default ProviderPreview;
