import chalk from "chalk";
import { apiFetch } from "../api.js";

export async function addCommand(
  name: string,
  opts: { slug?: string; json?: boolean }
): Promise<void> {
  try {
    if (!name?.trim()) {
      throw new Error("Site name is required");
    }

    const body: any = { name: name.trim() };
    if (opts.slug) body.slug = opts.slug;

    const data = await apiFetch<{ site: any }>("/api/sites", {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (opts.json) {
      console.log(JSON.stringify(data.site, null, 2));
    } else {
      console.log(chalk.green(`✓ Created hosted site: https://${data.site.slug}.oauth.page`));
      console.log(chalk.dim(`  Next: oauthpage deploy . --site ${data.site.slug}`));
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
