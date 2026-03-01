import chalk from "chalk";
import { apiFetch } from "../api.js";

export async function statusCommand(
  slug: string | undefined,
  opts: { json?: boolean }
): Promise<void> {
  try {
    if (!slug) {
      const { sites } = await apiFetch<{ sites: any[] }>("/api/sites");
      if (opts.json) {
        console.log(JSON.stringify({ sites }, null, 2));
        return;
      }
      if (!sites.length) {
        console.log(chalk.dim("No sites yet. Create one with: opage add \"My Site\""));
        return;
      }
      console.log(chalk.bold("Your sites:"));
      for (const s of sites) {
        console.log(`  • ${s.slug}  ${chalk.dim(`(${s.name})`)}`);
      }
      console.log(chalk.dim("\nTip: opage status <slug>"));
      return;
    }

    const siteId = await resolveSlug(slug);
    const data = await apiFetch<{ site: any; approved_users: any[]; requests: any[] }>(
      `/api/sites/${siteId}`
    );

    if (opts.json) {
      console.log(JSON.stringify(data, null, 2));
      return;
    }

    const s = data.site;
    console.log(chalk.bold(s.name));
    console.log(`  URL:       https://${s.slug}.oauth.page`);
    console.log(`  Users:     ${s.user_count || 0}`);
    console.log(`  Pending:   ${s.pending_count || 0}`);
    console.log(`  Requests:  ${(s.total_requests || 0).toLocaleString()}`);
    console.log(`  Bandwidth: ${formatBytes(s.total_bytes_out || 0)}`);
    console.log(`  Storage:   ${formatBytes(s.storage_bytes || 0)} / 50 MB`);
    console.log(`  Created:   ${new Date((s.created_at || 0) * 1000).toLocaleDateString()}`);
  } catch (err: any) {
    if (opts.json) {
      console.log(JSON.stringify({ error: err.message }));
    } else {
      console.error(chalk.red(`✗ ${err.message}`));
    }
    process.exit(1);
  }
}

async function resolveSlug(slug: string): Promise<string> {
  const { sites } = await apiFetch<{ sites: any[] }>("/api/sites");
  const site = sites.find((s: any) => s.slug === slug || s.id === slug);
  if (!site) throw new Error(`Site not found: ${slug}`);
  return site.id;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export { resolveSlug };


function progressBar(used: number, max: number, width = 18): string {
  if (!max || max <= 0) return "[------------------]";
  const ratio = Math.max(0, Math.min(1, used / max));
  const filled = Math.round(ratio * width);
  return `[${"#".repeat(filled)}${"-".repeat(width - filled)}]`;
}
