/**
 * Agent Configuration API Routes
 *
 * Full ElevenLabs Conversational AI API integration:
 * - GET    /api/agent                — Get current agent details
 * - PATCH  /api/agent                — Update agent (voice, prompt, tools, name)
 * - GET    /api/agent/voices         — List available ElevenLabs voices
 * - POST   /api/agent/voices/clone   — Clone a voice from uploaded audio
 * - GET    /api/agent/kb             — List knowledge base documents
 * - POST   /api/agent/kb             — Upload a KB document
 * - DELETE /api/agent/kb/:docId      — Delete a KB document
 * - POST   /api/agent/kb/:docId/link — Link a KB doc to the agent
 */

import type { FastifyInstance } from "fastify";

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";

function getHeaders(): Record<string, string> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY is not set");
  return {
    "xi-api-key": apiKey,
    "Content-Type": "application/json",
  };
}

function getAgentId(): string {
  const id = process.env.ELEVENLABS_AGENT_ID;
  if (!id) throw new Error("ELEVENLABS_AGENT_ID is not set");
  return id;
}

export async function agentRoutes(app: FastifyInstance) {
  // ═══════════════════════════════════════════════
  //  GET /api/agent — Retrieve current agent config
  // ═══════════════════════════════════════════════
  app.get("/api/agent", async (_request, reply) => {
    try {
      const agentId = getAgentId();
      const res = await fetch(`${ELEVENLABS_BASE}/convai/agents/${agentId}`, {
        headers: getHeaders(),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error("[Agent] Failed to get agent:", res.status, err);
        return reply.status(res.status).send({ error: "Failed to fetch agent", details: err });
      }

      const agent = await res.json();
      return agent;
    } catch (error) {
      console.error("[Agent] Error:", error);
      return reply.status(500).send({
        error: "Failed to fetch agent config",
        details: error instanceof Error ? error.message : "Unknown",
      });
    }
  });

  // ═══════════════════════════════════════════════
  //  PATCH /api/agent — Update agent configuration
  // ═══════════════════════════════════════════════
  app.patch<{
    Body: {
      name?: string;
      conversation_config?: Record<string, unknown>;
      platform_settings?: Record<string, unknown>;
    };
  }>("/api/agent", async (request, reply) => {
    try {
      const agentId = getAgentId();
      const body = request.body;

      const res = await fetch(`${ELEVENLABS_BASE}/convai/agents/${agentId}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error("[Agent] Failed to update agent:", res.status, err);
        return reply.status(res.status).send({ error: "Failed to update agent", details: err });
      }

      const result = await res.json();
      return result;
    } catch (error) {
      console.error("[Agent] Error updating:", error);
      return reply.status(500).send({
        error: "Failed to update agent",
        details: error instanceof Error ? error.message : "Unknown",
      });
    }
  });

  // ═══════════════════════════════════════════════
  //  GET /api/agent/voices — List available voices
  // ═══════════════════════════════════════════════
  app.get<{
    Querystring: {
      search?: string;
      page_size?: string;
      next_page_token?: string;
      category?: string;
    };
  }>("/api/agent/voices", async (request, reply) => {
    try {
      const { search, page_size, next_page_token, category } = request.query;
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("page_size", page_size || "30");
      if (next_page_token) params.set("next_page_token", next_page_token);
      if (category) params.set("category", category);

      const res = await fetch(`${ELEVENLABS_BASE}/voices?${params}`, {
        headers: getHeaders(),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error("[Agent] Failed to list voices:", res.status, err);
        return reply.status(res.status).send({ error: "Failed to list voices", details: err });
      }

      const data = await res.json();
      return data;
    } catch (error) {
      console.error("[Agent] Error listing voices:", error);
      return reply.status(500).send({
        error: "Failed to list voices",
        details: error instanceof Error ? error.message : "Unknown",
      });
    }
  });

  // ═══════════════════════════════════════════════
  //  POST /api/agent/voices/clone — Instant voice clone
  // ═══════════════════════════════════════════════
  app.post("/api/agent/voices/clone", async (request, reply) => {
    try {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ error: "No file uploaded" });
      }

      const nameField = (request.body as Record<string, { value?: string }>)?.name;
      const descField = (request.body as Record<string, { value?: string }>)?.description;
      const voiceName = nameField?.value || "My Cloned Voice";
      const voiceDesc = descField?.value || "Voice cloned via Voit";

      // Build multipart form for ElevenLabs
      const formData = new FormData();
      formData.append("name", voiceName);
      formData.append("description", voiceDesc);

      // Convert the file stream to a buffer
      const chunks: Buffer[] = [];
      for await (const chunk of data.file) {
        chunks.push(chunk);
      }
      const fileBuffer = Buffer.concat(chunks);
      const blob = new Blob([fileBuffer], { type: data.mimetype });
      formData.append("files", blob, data.filename);

      const apiKey = process.env.ELEVENLABS_API_KEY;
      const res = await fetch(`${ELEVENLABS_BASE}/voices/add`, {
        method: "POST",
        headers: { "xi-api-key": apiKey! },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.text();
        console.error("[Agent] Failed to clone voice:", res.status, err);
        return reply.status(res.status).send({ error: "Failed to clone voice", details: err });
      }

      const result = await res.json();
      return result;
    } catch (error) {
      console.error("[Agent] Error cloning voice:", error);
      return reply.status(500).send({
        error: "Failed to clone voice",
        details: error instanceof Error ? error.message : "Unknown",
      });
    }
  });

  // ═══════════════════════════════════════════════
  //  DELETE /api/agent/voices/:voiceId — Delete a voice
  // ═══════════════════════════════════════════════
  app.delete<{
    Params: { voiceId: string };
  }>("/api/agent/voices/:voiceId", async (request, reply) => {
    try {
      const { voiceId } = request.params;
      const res = await fetch(`${ELEVENLABS_BASE}/voices/${voiceId}`, {
        method: "DELETE",
        headers: getHeaders(),
      });

      if (!res.ok) {
        const err = await res.text();
        return reply.status(res.status).send({ error: "Failed to delete voice", details: err });
      }

      return { success: true, voiceId };
    } catch (error) {
      return reply.status(500).send({
        error: "Failed to delete voice",
        details: error instanceof Error ? error.message : "Unknown",
      });
    }
  });

  // ═══════════════════════════════════════════════
  //  GET /api/agent/kb — List knowledge base documents
  // ═══════════════════════════════════════════════
  app.get<{
    Querystring: { page_size?: string; cursor?: string; search?: string };
  }>("/api/agent/kb", async (request, reply) => {
    try {
      const { page_size, cursor, search } = request.query;
      const params = new URLSearchParams();
      params.set("page_size", page_size || "50");
      if (cursor) params.set("cursor", cursor);
      if (search) params.set("search", search);

      const res = await fetch(
        `${ELEVENLABS_BASE}/convai/knowledge-base?${params}`,
        { headers: getHeaders() }
      );

      if (!res.ok) {
        const err = await res.text();
        console.error("[Agent] Failed to list KB:", res.status, err);
        return reply.status(res.status).send({ error: "Failed to list KB docs", details: err });
      }

      const data = await res.json();
      return data;
    } catch (error) {
      console.error("[Agent] Error listing KB:", error);
      return reply.status(500).send({
        error: "Failed to list KB documents",
        details: error instanceof Error ? error.message : "Unknown",
      });
    }
  });

  // ═══════════════════════════════════════════════
  //  POST /api/agent/kb — Upload a KB document
  // ═══════════════════════════════════════════════
  app.post("/api/agent/kb", async (request, reply) => {
    try {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ error: "No file uploaded" });
      }

      const nameField = (request.body as Record<string, { value?: string }>)?.name;
      const docName = nameField?.value || data.filename;

      // Convert the file stream to a buffer
      const chunks: Buffer[] = [];
      for await (const chunk of data.file) {
        chunks.push(chunk);
      }
      const fileBuffer = Buffer.concat(chunks);
      const blob = new Blob([fileBuffer], { type: data.mimetype });

      const formData = new FormData();
      formData.append("file", blob, data.filename);
      if (docName) formData.append("name", docName);

      const apiKey = process.env.ELEVENLABS_API_KEY;
      const res = await fetch(`${ELEVENLABS_BASE}/convai/knowledge-base`, {
        method: "POST",
        headers: { "xi-api-key": apiKey! },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.text();
        console.error("[Agent] Failed to upload KB doc:", res.status, err);
        return reply.status(res.status).send({ error: "Failed to upload document", details: err });
      }

      const result = await res.json();

      // Auto-link the document to the agent
      const agentId = getAgentId();
      try {
        // Get current agent to read existing KB docs
        const agentRes = await fetch(`${ELEVENLABS_BASE}/convai/agents/${agentId}`, {
          headers: getHeaders(),
        });
        if (agentRes.ok) {
          const agent = await agentRes.json();
          const existingDocs =
            agent.conversation_config?.agent?.prompt?.knowledge_base || [];
          const docIds = existingDocs.map((d: { id: string }) => d.id);

          if (!docIds.includes(result.id)) {
            docIds.push(result.id);
            // Update agent with new KB doc list
            await fetch(`${ELEVENLABS_BASE}/convai/agents/${agentId}`, {
              method: "PATCH",
              headers: getHeaders(),
              body: JSON.stringify({
                conversation_config: {
                  agent: {
                    prompt: {
                      knowledge_base: docIds.map((id: string) => ({
                        type: "file",
                        id,
                      })),
                    },
                  },
                },
              }),
            });
          }
        }
      } catch (linkErr) {
        console.error("[Agent] Failed to auto-link KB doc to agent:", linkErr);
        // Upload succeeded even if linking failed
      }

      return result;
    } catch (error) {
      console.error("[Agent] Error uploading KB:", error);
      return reply.status(500).send({
        error: "Failed to upload document",
        details: error instanceof Error ? error.message : "Unknown",
      });
    }
  });

  // ═══════════════════════════════════════════════
  //  DELETE /api/agent/kb/:docId — Delete a KB document
  // ═══════════════════════════════════════════════
  app.delete<{
    Params: { docId: string };
  }>("/api/agent/kb/:docId", async (request, reply) => {
    try {
      const { docId } = request.params;

      // First unlink from agent
      const agentId = getAgentId();
      try {
        const agentRes = await fetch(`${ELEVENLABS_BASE}/convai/agents/${agentId}`, {
          headers: getHeaders(),
        });
        if (agentRes.ok) {
          const agent = await agentRes.json();
          const existingDocs: { id: string; type: string }[] =
            agent.conversation_config?.agent?.prompt?.knowledge_base || [];
          const filtered = existingDocs.filter((d) => d.id !== docId);

          if (filtered.length !== existingDocs.length) {
            await fetch(`${ELEVENLABS_BASE}/convai/agents/${agentId}`, {
              method: "PATCH",
              headers: getHeaders(),
              body: JSON.stringify({
                conversation_config: {
                  agent: {
                    prompt: {
                      knowledge_base: filtered,
                    },
                  },
                },
              }),
            });
          }
        }
      } catch (unlinkErr) {
        console.error("[Agent] Failed to unlink KB doc from agent:", unlinkErr);
      }

      // Delete the document
      const res = await fetch(
        `${ELEVENLABS_BASE}/convai/knowledge-base/${docId}`,
        {
          method: "DELETE",
          headers: getHeaders(),
        }
      );

      if (!res.ok) {
        const err = await res.text();
        return reply.status(res.status).send({ error: "Failed to delete document", details: err });
      }

      return { success: true, docId };
    } catch (error) {
      console.error("[Agent] Error deleting KB doc:", error);
      return reply.status(500).send({
        error: "Failed to delete document",
        details: error instanceof Error ? error.message : "Unknown",
      });
    }
  });
}
