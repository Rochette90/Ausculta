import { BodyTooLargeError, readLimitedBody } from "@/lib/http/body";
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createClient } from "../../lib/supabase/server";
import { BRAND_NAME } from "@/lib/brand";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly headers?: HeadersInit,
  ) {
    super(message);
  }
}

export async function requireAuthenticatedUser(): Promise<User> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new ApiError(401, "authentication_required", "Connexion requise");
  }
  return data.user;
}

export function assertSameOrigin(request: Request) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    throw new ApiError(403, "cross_site_request", "Requête refusée");
  }

  const origin = request.headers.get("origin");
  if (!origin) return;

  try {
    if (new URL(origin).origin !== new URL(request.url).origin) {
      throw new ApiError(403, "invalid_origin", "Origine refusée");
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(403, "invalid_origin", "Origine refusée");
  }
}

export async function readJsonObject(
  request: Request,
  maxBytes = 16_384,
): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim();
  if (contentType !== "application/json") {
    throw new ApiError(415, "json_required", "Corps JSON requis");
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new ApiError(413, "payload_too_large", "Requête trop volumineuse");
  }

  let text: string;
  try { text = await readLimitedBody(request, maxBytes); }
  catch (error) {
    if (error instanceof BodyTooLargeError) throw new ApiError(413, "payload_too_large", "Requête trop volumineuse");
    throw error;
  }

  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new ApiError(400, "invalid_json", "JSON invalide");
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError(400, "invalid_body", "Corps invalide");
  }
  return value as Record<string, unknown>;
}

export function apiJson(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("cache-control", "no-store");
  return NextResponse.json(data, { ...init, headers });
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return apiJson(
      { error: error.message, code: error.code },
      { status: error.status, headers: error.headers },
    );
  }

  console.error(`${BRAND_NAME} API error`, error);
  return apiJson(
    { error: "Service momentanément indisponible", code: "internal_error" },
    { status: 500 },
  );
}
