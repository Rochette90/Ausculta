import { buildPatientPrompt, EXAMINER_PREFIX, localPatientReply } from "@/lib/ecos/engine";
import { synthesisStarted } from "@/lib/ecos/sessions";
import { getEcosScenario } from "@/lib/ecos/stations";
import { usesReservedPrefix } from "@/lib/ecos/text";
import { sessionDeadline } from "@/lib/ecos/timing";
import type { EcosScenario } from "@/lib/ecos/types";
import { UUID_PATTERN } from "@/lib/validation";
import {
  ApiError,
  apiJson,
  assertSameOrigin,
  handleApiError,
  readJsonObject,
  requireAuthenticatedUser,
} from "../../../lib/api-security";
import { enforceRateLimit } from "../../../lib/rate-limit";
import { createAdminClient } from "../../../../lib/supabase/server";

type StoredMessage = { role: "patient" | "student" | "system"; content: string };

async function generateReply(scenario: EcosScenario, history: StoredMessage[], message: string) {
  const turn = history.filter((item) => item.role === "student").length;
  const fallback = () => ({ reply: localPatientReply(scenario, message, turn), source: "scenario-engine" as const });
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return fallback();

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL ?? "qwen/qwen3-32b",
        temperature: 0.45,
        max_completion_tokens: 220,
        messages: [
          { role: "system", content: buildPatientPrompt(scenario) },
          // Les messages système de l'interface (erreurs, rappels) ne font pas partie de l'entretien.
          ...history.filter((item) => item.role !== "system").map((item) => ({
            role: item.role === "patient" ? "assistant" : "user",
            content: item.content,
          })),
        ],
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) throw new Error(`Groq ${response.status}`);
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const reply = data.choices?.[0]?.message?.content
      // Certains modèles exposent leur raisonnement entre balises <think>,
      // parfois tronqué par la limite de jetons : on ne garde que la réponse.
      ?.replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, "")
      .trim()
      .slice(0, 1_200);
    if (!reply) throw new Error("Empty model response");
    return { reply: reply.startsWith("Examinateur") ? reply.replace(/^Examinateur\s*:\s*/i, EXAMINER_PREFIX) : reply, source: "groq" as const };
  } catch {
    return fallback();
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    assertSameOrigin(request);
    const body = await readJsonObject(request, 12_000);
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
    if (!message || message.length > 800) {
      throw new ApiError(400, "invalid_message", "Message invalide");
    }
    // Les gestes, le diagnostic et la prise en charge passent par leurs étapes dédiées.
    if (usesReservedPrefix(message)) {
      throw new ApiError(400, "reserved_message", "Utilise l’étape prévue pour les gestes, le diagnostic ou la prise en charge.");
    }
    if (!UUID_PATTERN.test(sessionId)) {
      throw new ApiError(400, "invalid_session", "Session invalide");
    }

    const admin = createAdminClient();
    await enforceRateLimit(admin, user.id, "ecos-chat", 30, 60);
    const { data: session, error: sessionError } = await admin
      .from("ecos_sessions")
      .select("id, status, station_slug, started_at, mode")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (sessionError) throw sessionError;
    if (!session) throw new ApiError(404, "session_not_found", "Session introuvable");
    const scenario = getEcosScenario(String(session.station_slug));
    if (!scenario) throw new ApiError(409, "unsupported_station", "Scénario non disponible.");
    if (session.status !== "active") {
      throw new ApiError(409, "session_not_active", "Session déjà clôturée");
    }

    if (Date.now() > sessionDeadline(session.mode, session.started_at)) {
      throw new ApiError(409, "station_expired", "Le temps est écoulé. Termine la station pour enregistrer le bilan.");
    }
    if (await synthesisStarted(admin, sessionId, user.id)) {
      throw new ApiError(409, "synthesis_started", "La synthèse est commencée : l’entretien est terminé.");
    }

    const { error: studentError } = await admin.rpc("append_ecos_message", {
      p_user_id: user.id,
      p_session_id: sessionId,
      p_role: "student",
      p_content: message,
    });
    if (studentError) throw studentError;

    const { data: historyRows, error: historyError } = await admin
      .from("ecos_messages")
      .select("role, content, sequence")
      .eq("session_id", sessionId)
      .eq("user_id", user.id)
      .order("sequence", { ascending: false })
      .limit(12);
    if (historyError) throw historyError;
    const history = (historyRows ?? []).reverse().map(({ role, content }) => ({
      role,
      content,
    })) as StoredMessage[];

    const result = await generateReply(scenario, history, message);
    const { error: patientError } = await admin.rpc("append_ecos_message", {
      p_user_id: user.id,
      p_session_id: sessionId,
      p_role: "patient",
      p_content: result.reply,
    });
    if (patientError) throw patientError;
    return apiJson(result);
  } catch (error) {
    return handleApiError(error);
  }
}
