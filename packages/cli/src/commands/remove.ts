import chalk from "chalk";
import { apiFetch } from "../api.js";

export async function removeCommand(
  slugOrId: string,
  opts: { json?: boolean }
): Promise<void> {
  try {
    // First, find the site by slug
    const { sites } = await apiFetch<{ sites: any[] }>("/api/sites");
    const site = sites.find((s: any) => s.slug === slugOrId || s.id === slugOrId);

    if (!site) {
      throw new Error(`Site not found: ${slugOrId}`);
    }

    await apiFetch(`/api/sites/${site.id}`, { method: "DELETE" });

    if (opts.json) {
      console.log(JSON.stringify({ ok: true, slug: site.slug }));
    } else {
      console.log(chalk.green(`✓ Removed site: ${site.slug}.oauth.page`));
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
