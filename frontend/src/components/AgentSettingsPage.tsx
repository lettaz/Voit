import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Volume2,
  Mic,
  FileText,
  Upload,
  Trash2,
  Check,
  X,
  PhoneOff,
  VoicemailIcon,
  PhoneForwarded,
  Languages,
  Loader2,
  Play,
  Search,
  Settings2,
  MessageSquare,
  AlertCircle,
  ArrowRightLeft,
  ChevronDown,
  Phone,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import {
  getAgent,
  updateAgent,
  listVoices,
  cloneVoice,
  deleteVoice,
  listKBDocs,
  uploadKBDoc,
  deleteKBDoc,
  type AgentConfig,
  type AgentVoice,
  type KBDocument,
} from "@/lib/agentApi";

// ─── Sub-section type ────────────────────────────
type Section = "voice" | "kb" | "tools" | "behavior";

interface AgentSettingsPageProps {
  onBack: () => void;
}

// ─── Built-in system tools that ElevenLabs supports ───────
// These are configured via conversation_config.agent.prompt.built_in_tools
// Each key maps to null (disabled) or a config object (enabled)
const SYSTEM_TOOLS = [
  {
    id: "end_call",
    icon: PhoneOff,
    labelKey: "agentSettings.tools.endCall",
    descKey: "agentSettings.tools.endCallDesc",
    configurable: false,
  },
  {
    id: "voicemail_detection",
    icon: VoicemailIcon,
    labelKey: "agentSettings.tools.voicemail",
    descKey: "agentSettings.tools.voicemailDesc",
    configurable: false,
  },
  {
    id: "transfer_to_number",
    icon: PhoneForwarded,
    labelKey: "agentSettings.tools.handoff",
    descKey: "agentSettings.tools.handoffDesc",
    configurable: true,
  },
  {
    id: "language_detection",
    icon: Languages,
    labelKey: "agentSettings.tools.language",
    descKey: "agentSettings.tools.languageDesc",
    configurable: false,
  },
  {
    id: "transfer_to_agent",
    icon: ArrowRightLeft,
    labelKey: "agentSettings.tools.agentTransfer",
    descKey: "agentSettings.tools.agentTransferDesc",
    configurable: false,
  },
  {
    id: "play_keypad_touch_tone",
    icon: Phone,
    labelKey: "agentSettings.tools.dtmf",
    descKey: "agentSettings.tools.dtmfDesc",
    configurable: false,
  },
];

const AgentSettingsPage = ({ onBack }: AgentSettingsPageProps) => {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  // ─── State ──────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<Section>("voice");

  // Agent config
  const [agent, setAgent] = useState<AgentConfig | null>(null);

  // Voice state
  const [voices, setVoices] = useState<AgentVoice[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(false);
  const [voiceSearch, setVoiceSearch] = useState("");
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("");
  const [showCloneForm, setShowCloneForm] = useState(false);
  const [cloneFile, setCloneFile] = useState<File | null>(null);
  const [cloneName, setCloneName] = useState("");
  const [cloning, setCloning] = useState(false);
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // KB state
  const [kbDocs, setKbDocs] = useState<KBDocument[]>([]);
  const [kbLoading, setKbLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cloneInputRef = useRef<HTMLInputElement>(null);

  // System tools state (matches built_in_tools keys from ElevenLabs API)
  const [enabledTools, setEnabledTools] = useState<Record<string, boolean>>({
    end_call: false,
    voicemail_detection: false,
    transfer_to_number: false,
    language_detection: false,
    transfer_to_agent: false,
    play_keypad_touch_tone: false,
  });

  // Transfer-to-number (human handoff) config
  const [handoffExpanded, setHandoffExpanded] = useState(false);
  const [handoffPhone, setHandoffPhone] = useState("");
  const [handoffCondition, setHandoffCondition] = useState("When the user requests to speak with a human agent");

  // Behavior state
  const [firstMessage, setFirstMessage] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");

  // ─── Load agent config ──────────────────────────
  useEffect(() => {
    loadAgent();
  }, []);

  const loadAgent = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAgent();
      setAgent(data);

      // Extract current voice
      const voiceId = data.conversation_config?.tts?.voice_id;
      if (voiceId) setSelectedVoiceId(voiceId);

      // Extract first message & prompt
      setFirstMessage(data.conversation_config?.agent?.first_message || "");
      setSystemPrompt(data.conversation_config?.agent?.prompt?.prompt || "");

      // Extract built-in system tools from agent config
      const builtIn = data.conversation_config?.agent?.prompt?.built_in_tools || {};
      const toolMap: Record<string, boolean> = {
        end_call: false,
        voicemail_detection: false,
        transfer_to_number: false,
        language_detection: false,
        transfer_to_agent: false,
        play_keypad_touch_tone: false,
      };
      for (const key of Object.keys(toolMap)) {
        // A tool is enabled if its value is not null/undefined
        toolMap[key] = builtIn[key] != null;
      }
      // Extract transfer-to-number (human handoff) config
      const transferConfig = builtIn.transfer_to_number;
      if (transferConfig?.params?.transfers?.length > 0) {
        const firstTransfer = transferConfig.params.transfers[0];
        if (firstTransfer.phone_number) setHandoffPhone(firstTransfer.phone_number);
        if (firstTransfer.condition) setHandoffCondition(firstTransfer.condition);
      }
      setEnabledTools(toolMap);
    } catch (err) {
      console.error("Failed to load agent:", err);
      setError(err instanceof Error ? err.message : "Failed to load agent");
    } finally {
      setLoading(false);
    }
  };

  // ─── Load voices ────────────────────────────────
  const loadVoices = useCallback(async (search?: string) => {
    setVoicesLoading(true);
    try {
      const data = await listVoices({ search, page_size: 50 });
      setVoices(data.voices || []);
    } catch (err) {
      console.error("Failed to load voices:", err);
    } finally {
      setVoicesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeSection === "voice") {
      loadVoices();
    }
  }, [activeSection, loadVoices]);

  // Debounced voice search
  useEffect(() => {
    if (activeSection !== "voice") return;
    const timeout = setTimeout(() => {
      loadVoices(voiceSearch || undefined);
    }, 400);
    return () => clearTimeout(timeout);
  }, [voiceSearch, activeSection, loadVoices]);

  // ─── Load KB docs ───────────────────────────────
  useEffect(() => {
    if (activeSection === "kb") {
      loadKBDocs();
    }
  }, [activeSection]);

  const loadKBDocs = async () => {
    setKbLoading(true);
    try {
      const data = await listKBDocs({ page_size: 50 });
      setKbDocs(data.documents || []);
    } catch (err) {
      console.error("Failed to load KB:", err);
    } finally {
      setKbLoading(false);
    }
  };

  // ─── Save handlers ──────────────────────────────
  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  const handleSaveVoice = async () => {
    if (!selectedVoiceId) return;
    setSaving(true);
    try {
      await updateAgent({
        conversation_config: {
          tts: { voice_id: selectedVoiceId },
        } as AgentConfig["conversation_config"],
      });
      showSuccess(t("agentSettings.voiceSaved"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save voice");
    } finally {
      setSaving(false);
    }
  };

  const handleCloneVoice = async () => {
    if (!cloneFile || !cloneName.trim()) return;
    setCloning(true);
    try {
      const result = await cloneVoice(cloneFile, cloneName.trim());
      showSuccess(t("agentSettings.voiceCloned"));
      setShowCloneForm(false);
      setCloneFile(null);
      setCloneName("");
      // Reload voices and select the new one
      await loadVoices();
      setSelectedVoiceId(result.voice_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clone voice");
    } finally {
      setCloning(false);
    }
  };

  const handleDeleteVoice = async (voiceId: string) => {
    if (!confirm(t("agentSettings.deleteVoiceConfirm"))) return;
    try {
      await deleteVoice(voiceId);
      setVoices((prev) => prev.filter((v) => v.voice_id !== voiceId));
      if (selectedVoiceId === voiceId) setSelectedVoiceId("");
      showSuccess(t("agentSettings.voiceDeleted"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete voice");
    }
  };

  const handlePlayPreview = (voice: AgentVoice) => {
    if (playingPreview === voice.voice_id) {
      audioRef.current?.pause();
      setPlayingPreview(null);
      return;
    }
    if (voice.preview_url) {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(voice.preview_url);
      audioRef.current = audio;
      audio.onended = () => setPlayingPreview(null);
      audio.play();
      setPlayingPreview(voice.voice_id);
    }
  };

  const handleUploadKB = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadKBDoc(file, file.name);
      showSuccess(t("agentSettings.docUploaded"));
      await loadKBDocs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload document");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteKB = async (docId: string) => {
    if (!confirm(t("agentSettings.deleteDocConfirm"))) return;
    try {
      await deleteKBDoc(docId);
      setKbDocs((prev) => prev.filter((d) => d.id !== docId));
      showSuccess(t("agentSettings.docDeleted"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete document");
    }
  };

  const handleSaveTools = async () => {
    setSaving(true);
    try {
      // Build built_in_tools object: enabled tools get a config object, disabled get null
      const builtInTools: Record<string, unknown> = {};
      for (const [name, enabled] of Object.entries(enabledTools)) {
        if (!enabled) {
          builtInTools[name] = null;
        } else if (name === "transfer_to_number") {
          // transfer_to_number requires a transfers array with phone_number and condition
          builtInTools[name] = {
            type: "system",
            name,
            description: "Transfer to a human operator",
            params: {
              system_tool_type: "transfer_to_number",
              transfers: handoffPhone
                ? [
                    {
                      phone_number: handoffPhone,
                      condition: handoffCondition || "When the user requests to speak with a human agent",
                    },
                  ]
                : [],
            },
          };
        } else {
          builtInTools[name] = {
            type: "system",
            name,
            description: "",
            params: { system_tool_type: name },
          };
        }
      }

      await updateAgent({
        conversation_config: {
          agent: {
            prompt: {
              built_in_tools: builtInTools,
            },
          },
        } as AgentConfig["conversation_config"],
      });
      showSuccess(t("agentSettings.toolsSaved"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save tools");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBehavior = async () => {
    setSaving(true);
    try {
      await updateAgent({
        conversation_config: {
          agent: {
            first_message: firstMessage,
            prompt: {
              prompt: systemPrompt,
            },
          },
        } as AgentConfig["conversation_config"],
      });
      showSuccess(t("agentSettings.behaviorSaved"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save behavior");
    } finally {
      setSaving(false);
    }
  };

  // ─── Section nav items ──────────────────────────
  const sections: { id: Section; icon: typeof Volume2; labelKey: string }[] = [
    { id: "voice", icon: Volume2, labelKey: "agentSettings.sectionVoice" },
    { id: "kb", icon: FileText, labelKey: "agentSettings.sectionKB" },
    { id: "tools", icon: Settings2, labelKey: "agentSettings.sectionTools" },
    { id: "behavior", icon: MessageSquare, labelKey: "agentSettings.sectionBehavior" },
  ];

  // ─── Render ─────────────────────────────────────
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{
          background: isDark
            ? "hsl(222 25% 6%)"
            : "hsl(140 15% 97%)",
        }}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">{t("agentSettings.loading")}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{
        background: isDark
          ? "linear-gradient(180deg, hsl(222 25% 8%) 0%, hsl(222 22% 5%) 100%)"
          : "linear-gradient(180deg, hsl(0 0% 100%) 0%, hsl(140 15% 97%) 100%)",
      }}
    >
      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-5 pt-5 pb-3 shrink-0">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-xl glass flex items-center justify-center hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-foreground">{t("agentSettings.title")}</h2>
          <p className="text-xs text-muted-foreground truncate">
            {agent?.name || "Voit Agent"} &middot; {agent?.agent_id?.slice(0, 8)}
          </p>
        </div>
      </div>

      {/* Success / Error banners */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-5 mb-2 p-3 rounded-xl bg-primary/15 border border-primary/20 flex items-center gap-2"
          >
            <Check className="w-4 h-4 text-primary" />
            <p className="text-xs text-foreground">{successMsg}</p>
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-5 mb-2 p-3 rounded-xl bg-destructive/15 border border-destructive/20 flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-destructive" />
            <p className="text-xs text-foreground flex-1">{error}</p>
            <button onClick={() => setError(null)}>
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section tabs */}
      <div className="flex gap-1 px-5 pb-3 shrink-0 overflow-x-auto scrollbar-hide">
        {sections.map((s) => {
          const Icon = s.icon;
          const active = activeSection === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium shrink-0 transition-all ${
                active
                  ? "text-primary-foreground shadow-card"
                  : "glass text-muted-foreground hover:text-foreground"
              }`}
              style={active ? { background: "var(--gradient-primary)" } : undefined}
            >
              <Icon className="w-3.5 h-3.5" />
              {t(s.labelKey)}
            </button>
          );
        })}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {/* ═══ VOICE SECTION ═══ */}
        {activeSection === "voice" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Current voice indicator */}
            {selectedVoiceId && (
              <div className="glass-accent rounded-xl p-3 gradient-border flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-primary-foreground text-xs font-bold"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <Volume2 className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{t("agentSettings.currentVoice")}</p>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {voices.find((v) => v.voice_id === selectedVoiceId)?.name || selectedVoiceId.slice(0, 12)}
                  </p>
                </div>
                <button
                  onClick={handleSaveVoice}
                  disabled={saving}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : t("agentSettings.applyVoice")}
                </button>
              </div>
            )}

            {/* Clone voice */}
            <div className="glass rounded-xl p-3">
              {!showCloneForm ? (
                <button
                  onClick={() => setShowCloneForm(true)}
                  className="w-full flex items-center gap-3 text-left"
                >
                  <div className="w-9 h-9 rounded-lg glass flex items-center justify-center">
                    <Mic className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t("agentSettings.cloneVoice")}</p>
                    <p className="text-[10px] text-muted-foreground">{t("agentSettings.cloneVoiceDesc")}</p>
                  </div>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{t("agentSettings.cloneVoice")}</p>
                    <button onClick={() => { setShowCloneForm(false); setCloneFile(null); setCloneName(""); }}>
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder={t("agentSettings.cloneNamePlaceholder")}
                    value={cloneName}
                    onChange={(e) => setCloneName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background/60 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => cloneInputRef.current?.click()}
                      className="flex-1 py-2 rounded-lg text-xs font-medium glass text-muted-foreground border border-border/50 hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Upload className="w-3 h-3" />
                      {cloneFile ? cloneFile.name : t("agentSettings.uploadAudio")}
                    </button>
                    <input
                      ref={cloneInputRef}
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => setCloneFile(e.target.files?.[0] || null)}
                    />
                    <button
                      onClick={handleCloneVoice}
                      disabled={!cloneFile || !cloneName.trim() || cloning}
                      className="px-4 py-2 rounded-lg text-xs font-semibold text-primary-foreground disabled:opacity-50 hover:opacity-90 transition-opacity"
                      style={{ background: "var(--gradient-primary)" }}
                    >
                      {cloning ? <Loader2 className="w-3 h-3 animate-spin" /> : t("agentSettings.clone")}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Voice search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("agentSettings.searchVoices")}
                value={voiceSearch}
                onChange={(e) => setVoiceSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-background/60 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
            </div>

            {/* Voice grid */}
            {voicesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {voices.map((voice) => {
                  const isSelected = voice.voice_id === selectedVoiceId;
                  const isPlaying = playingPreview === voice.voice_id;
                  const category = voice.labels?.accent || voice.category || "";
                  return (
                    <button
                      key={voice.voice_id}
                      onClick={() => setSelectedVoiceId(voice.voice_id)}
                      className={`rounded-xl p-3 text-left transition-all relative group ${
                        isSelected ? "shadow-card" : "glass hover:shadow-card"
                      }`}
                      style={
                        isSelected
                          ? {
                              background: isDark
                                ? "hsl(142 50% 30% / 0.15)"
                                : "hsl(142 50% 90% / 0.5)",
                              border: "1px solid hsl(142 60% 50% / 0.3)",
                            }
                          : undefined
                      }
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {voice.name}
                          </p>
                          {category && (
                            <p className="text-[9px] text-muted-foreground mt-0.5">{category}</p>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0 ml-1">
                          {voice.preview_url && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlayPreview(voice);
                              }}
                              className="w-6 h-6 rounded-md glass flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
                            >
                              <Play className={`w-3 h-3 ${isPlaying ? "text-primary" : "text-muted-foreground"}`} />
                            </button>
                          )}
                          {voice.category === "cloned" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteVoice(voice.voice_id);
                              }}
                              className="w-6 h-6 rounded-md glass flex items-center justify-center opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </button>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="absolute bottom-2 right-2">
                          <Check className="w-3.5 h-3.5 text-primary" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {voices.length === 0 && !voicesLoading && (
              <p className="text-center text-xs text-muted-foreground py-8">
                {t("agentSettings.noVoices")}
              </p>
            )}
          </motion.div>
        )}

        {/* ═══ KNOWLEDGE BASE SECTION ═══ */}
        {activeSection === "kb" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="glass rounded-xl p-4">
              <p className="text-sm font-medium text-foreground mb-1">
                {t("agentSettings.kbTitle")}
              </p>
              <p className="text-[10px] text-muted-foreground mb-3">
                {t("agentSettings.kbDesc")}
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full py-3 rounded-xl text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "var(--gradient-primary)" }}
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    {t("agentSettings.uploadDoc")}
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md,.doc,.docx,.csv"
                className="hidden"
                onChange={handleUploadKB}
              />
            </div>

            {kbLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : kbDocs.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">{t("agentSettings.noDocs")}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {kbDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="glass rounded-xl p-3 flex items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-lg glass flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                      <p className="text-[9px] text-muted-foreground">{doc.type} &middot; {doc.id.slice(0, 8)}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteKB(doc.id)}
                      className="w-8 h-8 rounded-lg glass flex items-center justify-center hover:bg-destructive/10 transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ═══ SYSTEM TOOLS SECTION ═══ */}
        {activeSection === "tools" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <p className="text-xs text-muted-foreground">
              {t("agentSettings.toolsDesc")}
            </p>

            <div className="space-y-2">
              {SYSTEM_TOOLS.map((tool) => {
                const Icon = tool.icon;
                const enabled = enabledTools[tool.id] ?? false;
                const isHandoff = tool.id === "transfer_to_number";
                return (
                  <div key={tool.id} className="glass rounded-xl overflow-hidden">
                    <div className="p-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg glass flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{t(tool.labelKey)}</p>
                        <p className="text-[10px] text-muted-foreground">{t(tool.descKey)}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isHandoff && enabled && (
                          <button
                            onClick={() => setHandoffExpanded(!handoffExpanded)}
                            className="w-6 h-6 rounded-md glass flex items-center justify-center"
                          >
                            <ChevronDown
                              className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${handoffExpanded ? "rotate-180" : ""}`}
                            />
                          </button>
                        )}
                        <button
                          onClick={() =>
                            setEnabledTools((prev) => ({ ...prev, [tool.id]: !prev[tool.id] }))
                          }
                          className={`w-11 h-6 rounded-full transition-all relative ${
                            enabled ? "" : "bg-muted"
                          }`}
                          style={enabled ? { background: "var(--gradient-primary)" } : undefined}
                        >
                          <motion.div
                            className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
                            animate={{ left: enabled ? 22 : 2 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Handoff expanded config */}
                    {isHandoff && enabled && handoffExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-border/30 px-3 pb-3"
                      >
                        {/* Phone number */}
                        <div className="mt-3">
                          <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-1.5 flex items-center gap-1 block">
                            <Phone className="w-3 h-3" />
                            {t("agentSettings.tools.handoffPhone")}
                          </label>
                          <input
                            type="tel"
                            value={handoffPhone}
                            onChange={(e) => setHandoffPhone(e.target.value)}
                            placeholder={t("agentSettings.tools.handoffPhonePlaceholder")}
                            className="w-full px-3 py-2 rounded-lg bg-background/60 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                          />
                        </div>

                        {/* Transfer condition */}
                        <div className="mt-3">
                          <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-1.5 block">
                            {t("agentSettings.tools.transferCondition")}
                          </label>
                          <textarea
                            value={handoffCondition}
                            onChange={(e) => setHandoffCondition(e.target.value)}
                            rows={2}
                            placeholder={t("agentSettings.tools.transferConditionPlaceholder")}
                            className="w-full px-3 py-2 rounded-lg bg-background/60 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none"
                          />
                          <p className="text-[9px] text-muted-foreground mt-1.5">
                            {t("agentSettings.tools.transferConditionDesc")}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleSaveTools}
              disabled={saving}
              className="w-full py-3 rounded-xl text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: "var(--gradient-primary)" }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t("agentSettings.saveTools")}
            </button>
          </motion.div>
        )}

        {/* ═══ BEHAVIOR SECTION ═══ */}
        {activeSection === "behavior" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* First message */}
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-2 block">
                {t("agentSettings.firstMessage")}
              </label>
              <textarea
                value={firstMessage}
                onChange={(e) => setFirstMessage(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl bg-background/60 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none"
                placeholder={t("agentSettings.firstMessagePlaceholder")}
              />
            </div>

            {/* System prompt */}
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-2 block">
                {t("agentSettings.systemPrompt")}
              </label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={24}
                className="w-full px-3 py-2.5 rounded-xl bg-background/60 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-y font-mono text-[11px] leading-relaxed min-h-[400px]"
                placeholder={t("agentSettings.systemPromptPlaceholder")}
              />
            </div>

            <button
              onClick={handleSaveBehavior}
              disabled={saving}
              className="w-full py-3 rounded-xl text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: "var(--gradient-primary)" }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t("agentSettings.saveBehavior")}
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default AgentSettingsPage;
