import chalk from "chalk";
import { apiFetch } from "../api.js";
import { resolveSlug } from "./status.js";

export async function denyCommand(
  slug: string,
  email: string,
  opts: { json?: boolean }
): Promise<void> {
  try {
    const siteId = await resolveSlug(slug);

    const { requests } = await apiFetch<{ requests: any[] }>(`/api/sites/${siteId}/requests`);
    const request = requests.find(
      (r: any) => r.email === email && r.status === "pending"
    );

    if (!request) {
      throw new Error(`No pending request found for ${email}`);
    }

    await apiFetch(`/api/sites/${siteId}/requests/${request.id}/deny`, {
      method: "POST",
    });

    if (opts.json) {
      console.log(JSON.stringify({ ok: true, email, slug }));
    } else {
      console.log(chalk.green(`✓ Denied ${email} for ${slug}.oauth.page`));
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
