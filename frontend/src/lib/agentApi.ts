/**
 * Frontend API client for the ElevenLabs Agent configuration routes.
 * All requests go through the Vite proxy → Fastify backend → ElevenLabs API.
 */

const BASE = "/api/agent";

// ─── Types ───────────────────────────────────────────────

export interface AgentVoice {
  voice_id: string;
  name: string;
  category?: string;
  description?: string;
  labels?: Record<string, string>;
  preview_url?: string;
  fine_tuning?: {
    is_allowed_to_fine_tune: boolean;
    state?: Record<string, unknown>;
  };
}

export interface VoicesResponse {
  voices: AgentVoice[];
  has_more?: boolean;
  next_page_token?: string;
}

export interface KBDocument {
  type: string;
  id: string;
  name: string;
  metadata?: Record<string, unknown>;
  dependent_agents?: { agent_id: string; agent_name: string }[];
}

export interface KBListResponse {
  documents: KBDocument[];
  has_more: boolean;
  next_cursor?: string;
}

export interface AgentConfig {
  agent_id: string;
  name?: string;
  conversation_config?: {
    agent?: {
      prompt?: {
        prompt?: string;
        llm?: string;
        temperature?: number;
        knowledge_base?: { type: string; id: string; name?: string }[];
        tools?: unknown[];
      };
      first_message?: string;
      language?: string;
    };
    asr?: {
      quality?: string;
      provider?: string;
      user_input_audio_format?: string;
      keywords?: string[];
    };
    tts?: {
      model_id?: string;
      voice_id?: string;
      agent_output_audio_format?: string;
      optimize_streaming_latency?: number;
      stability?: number;
      speed?: number;
      similarity_boost?: number;
    };
    turn?: {
      turn_timeout?: number;
      silence_end_call_timeout?: number;
      mode?: string;
    };
    conversation?: {
      max_duration_seconds?: number;
    };
  };
  platform_settings?: {
    tools?: unknown[];
    [key: string]: unknown;
  };
  metadata?: Record<string, unknown>;
}

// ─── API Methods ─────────────────────────────────────────

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

/** Get the current ElevenLabs agent configuration */
export async function getAgent(): Promise<AgentConfig> {
  const res = await fetch(BASE);
  return handleResponse<AgentConfig>(res);
}

/** Update agent configuration (partial patch) */
export async function updateAgent(
  body: Partial<Pick<AgentConfig, "name" | "conversation_config" | "platform_settings">>
): Promise<AgentConfig> {
  const res = await fetch(BASE, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handleResponse<AgentConfig>(res);
}

/** List available ElevenLabs voices */
export async function listVoices(opts?: {
  search?: string;
  page_size?: number;
  category?: string;
}): Promise<VoicesResponse> {
  const params = new URLSearchParams();
  if (opts?.search) params.set("search", opts.search);
  if (opts?.page_size) params.set("page_size", String(opts.page_size));
  if (opts?.category) params.set("category", opts.category);
  const res = await fetch(`${BASE}/voices?${params}`);
  return handleResponse<VoicesResponse>(res);
}

/** Clone a voice from an audio file */
export async function cloneVoice(
  file: File,
  name: string,
  description?: string
): Promise<{ voice_id: string }> {
  const form = new FormData();
  form.append("file", file);
  form.append("name", name);
  if (description) form.append("description", description);
  const res = await fetch(`${BASE}/voices/clone`, {
    method: "POST",
    body: form,
  });
  return handleResponse<{ voice_id: string }>(res);
}

/** Delete a custom voice */
export async function deleteVoice(voiceId: string): Promise<{ success: boolean }> {
  const res = await fetch(`${BASE}/voices/${voiceId}`, { method: "DELETE" });
  return handleResponse<{ success: boolean }>(res);
}

/** List knowledge base documents */
export async function listKBDocs(opts?: {
  search?: string;
  page_size?: number;
}): Promise<KBListResponse> {
  const params = new URLSearchParams();
  if (opts?.search) params.set("search", opts.search);
  if (opts?.page_size) params.set("page_size", String(opts.page_size));
  const res = await fetch(`${BASE}/kb?${params}`);
  return handleResponse<KBListResponse>(res);
}

/** Upload a KB document */
export async function uploadKBDoc(
  file: File,
  name?: string
): Promise<{ id: string; name: string }> {
  const form = new FormData();
  form.append("file", file);
  if (name) form.append("name", name);
  const res = await fetch(`${BASE}/kb`, {
    method: "POST",
    body: form,
  });
  return handleResponse<{ id: string; name: string }>(res);
}

/** Delete a KB document */
export async function deleteKBDoc(docId: string): Promise<{ success: boolean }> {
  const res = await fetch(`${BASE}/kb/${docId}`, { method: "DELETE" });
  return handleResponse<{ success: boolean }>(res);
}
