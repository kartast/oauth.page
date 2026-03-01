import { Env } from "../types";

export interface OAuthStatePayload {
  type: "owner" | "visitor" | "cli";
  slug?: string;
  code?: string;
}

const OAUTH_STATE_TTL = 300; // 5 minutes

function randomStateToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createOAuthState(env: Env, payload: OAuthStatePayload): Promise<string> {
  const token = randomStateToken();
  await env.KV.put(`oauth_state:${token}`, JSON.stringify(payload), {
    expirationTtl: OAUTH_STATE_TTL,
  });
  return token;
}

export async function consumeOAuthState(env: Env, token: string): Promise<OAuthStatePayload | null> {
  const key = `oauth_state:${token}`;
  const raw = await env.KV.get(key);
  if (!raw) return null;
  await env.KV.delete(key); // one-time use
  try {
    const parsed = JSON.parse(raw) as OAuthStatePayload;
    if (!parsed?.type) return null;
    return parsed;
  } catch {
    return null;
  }
}

// Backward-compatible fallback for already-issued base64 state values.
export function parseLegacyOAuthState(stateParam: string): OAuthStatePayload | null {
  try {
    const parsed = JSON.parse(atob(stateParam));
    if (!parsed?.type) return null;
    return {
      type: parsed.type,
      slug: parsed.slug || "",
      code: parsed.code || "",
    } as OAuthStatePayload;
  } catch {
    return null;
  }
}
