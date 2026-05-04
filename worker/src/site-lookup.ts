import { Env, SiteConfig } from "./types";

/**
 * Look up site config by slug: KV first, D1 fallback, re-cache on miss.
 * Makes KV a cache, not a source of truth.
 */
export async function lookupSite(slug: string, env: Env): Promise<SiteConfig | null> {
  // Fast path: KV cache hit
  const cached = await env.KV.get(`site:${slug}`);
  if (cached) {
    return JSON.parse(cached) as SiteConfig;
  }

  // Slow path: D1 fallback
  const row = await env.DB.prepare(
    "SELECT id, slug, name, owner_id FROM sites WHERE slug = ?"
  )
    .bind(slug)
    .first<{ id: string; slug: string; name: string; owner_id: string }>();

  if (!row) {
    return null;
  }

  // Re-cache in KV for future requests
  const config: SiteConfig = {
    id: row.id,
    slug: row.slug,
    name: row.name,
    owner_id: row.owner_id,
  };
  await env.KV.put(`site:${slug}`, JSON.stringify(config));

  return config;
}
