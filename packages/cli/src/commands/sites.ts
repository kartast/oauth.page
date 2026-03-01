import chalk from "chalk";
import Table from "cli-table3";
import { apiFetch } from "../api.js";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function sitesCommand(opts: { json?: boolean }): Promise<void> {
  try {
    const data = await apiFetch<{ sites: any[] }>("/api/sites");

    if (opts.json) {
      console.log(JSON.stringify(data.sites, null, 2));
      return;
    }

    if (data.sites.length === 0) {
      console.log(chalk.dim("No sites yet. Create one with: oauthpage add \"My Site\""));
      return;
    }

    const table = new Table({
      head: ["Name", "URL", "Storage", "Requests", "Pending"],
      style: { head: ["cyan"] },
    });

    for (const site of data.sites) {
      table.push([
        site.name,
        `${site.slug}.oauth.page`,
        formatBytes(site.storage_bytes || 0),
        String(site.total_requests || 0),
        String(site.pending_count || 0),
      ]);
    }

    console.log(table.toString());

    // Usage summary
    try {
      const usage = await apiFetch<any>("/api/sites/usage");
      const u = usage.usage;
      const l = usage.limits;
      console.log(chalk.dim(`
Usage: sites ${u.sites}/${l.sites} · storage ${formatBytes(u.storage_bytes)}/${l.storageMb} MB · deploys ${u.deploys_this_month}/${l.deploysPerMonth} this month`));
    } catch {
      // best effort only
    }
  } catch (err: any) {
    console.error(chalk.red(`✗ ${err.message}`));
    process.exit(1);
  }
}
