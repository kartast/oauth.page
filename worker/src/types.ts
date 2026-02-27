export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  STORAGE: R2Bucket;
  APP_URL: string;
  BETA_ONE_TIME_LINKS?: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  JWT_SECRET: string;
  RESEND_API_KEY?: string;
}

export interface SiteConfig {
  id: string;
  slug: string;
  name: string;
  owner_id: string;
}

export interface SessionData {
  id: string;
  email: string;
  site_id: string;
  expires_at: number;
}

export interface OwnerSession {
  user_id: string;
  email: string;
  name: string;
  exp: number;
}

export interface VisitorIdentity {
  email: string;
  name: string;
  avatar_url: string;
  provider: "github" | "google";
}
