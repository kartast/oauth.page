import chalk from "chalk";
import { apiFetch } from "../api.js";
import { resolveSlug } from "./status.js";

export function parseTtlToSeconds(input: string): number {
  const v = input.trim().toLowerCase();
  const m = v.match(/^(\d+)(s|m|h|d)?$/);
  if (!m) throw new Error("Invalid TTL format. Use values like 30m, 1h, 1d");
  const n = Number(m[1]);
  const unit = m[2] || "s";
  const mul = unit === "s" ? 1 : unit === "m" ? 60 : unit === "h" ? 3600 : 86400;
  return n * mul;
}

export async function linkCreateCommand(
  slug: string,
  opts: { ttl?: string; path?: string; json?: boolean }
): Promise<void> {
  try {
    const siteId = await resolveSlug(slug);
    const ttlSeconds = parseTtlToSeconds(opts.ttl || "1h");

    const data = await apiFetch<{ beta: boolean; link: any }>(`/api/sites/${siteId}/links`, {
      method: "POST",
      body: JSON.stringify({
        ttl_seconds: ttlSeconds,
        path: opts.path || "/",
      }),
    });

    if (opts.json) {
      console.log(JSON.stringify(data, null, 2));
      return;
    }

    const exp = new Date((data.link.expires_at || 0) * 1000).toLocaleString();
    console.log(chalk.yellow("BETA: One-time access link"));
    console.log(chalk.green(`✓ ${data.link.url}`));
    console.log(chalk.dim(`  Path: ${data.link.path}`));
    console.log(chalk.dim(`  Expires: ${exp}`));
    console.log(chalk.dim(`  Uses: one-time`));
  } catch (err: any) {
    if (opts.json) {
      console.log(JSON.stringify({ error: err.message }));
    } else {
      console.error(chalk.red(`✗ ${err.message}`));
    }
    process.exit(1);
  }
}

export async function linkListCommand(
  slug: string,
  opts: { json?: boolean }
): Promise<void> {
  try {
    const siteId = await resolveSlug(slug);
    const data = await apiFetch<{ beta: boolean; links: any[] }>(`/api/sites/${siteId}/links`);

    if (opts.json) {
      console.log(JSON.stringify(data, null, 2));
      return;
    }

    if (!data.links.length) {
      console.log(chalk.dim("No one-time links."));
      return;
    }

    console.log(chalk.yellow("BETA: One-time links"));
    for (const l of data.links) {
      const exp = new Date((l.expires_at || 0) * 1000).toLocaleString();
      console.log(`• ${l.id}  ${chalk.dim(l.status)}  path=${l.path}  exp=${exp}`);
    }
  } catch (err: any) {
    if (opts.json) {
      console.log(JSON.stringify({ error: err.message }));
    } else {
      console.error(chalk.red(`✗ ${err.message}`));
    }
    process.exit(1);
  }
}

export async function linkRevokeCommand(
  slug: string,
  linkId: string,
  opts: { json?: boolean }
): Promise<void> {
  try {
    const siteId = await resolveSlug(slug);
    await apiFetch<{ ok: boolean }>(`/api/sites/${siteId}/links/${linkId}/revoke`, { method: "POST" });

    if (opts.json) {
      console.log(JSON.stringify({ ok: true, linkId }, null, 2));
      return;
    }

    console.log(chalk.green(`✓ Revoked one-time link ${linkId}`));
  } catch (err: any) {
    if (opts.json) {
      console.log(JSON.stringify({ error: err.message }));
    } else {
      console.error(chalk.red(`✗ ${err.message}`));
    }
    process.exit(1);
  }
}
