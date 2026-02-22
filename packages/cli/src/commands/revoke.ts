import chalk from "chalk";
import { apiFetch } from "../api.js";
import { resolveSlug } from "./status.js";

export async function revokeCommand(
  slug: string,
  email: string,
  opts: { json?: boolean }
): Promise<void> {
  try {
    const siteId = await resolveSlug(slug);

    await apiFetch(`/api/sites/${siteId}/access/${encodeURIComponent(email)}`, {
      method: "DELETE",
    });

    if (opts.json) {
      console.log(JSON.stringify({ ok: true, email, slug }));
    } else {
      console.log(chalk.green(`✓ Revoked access for ${email} on ${slug}.oauth.page`));
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
