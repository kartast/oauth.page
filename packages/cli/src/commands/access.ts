import chalk from "chalk";
import { apiFetch } from "../api.js";
import { resolveSlug } from "./status.js";

export async function accessCommand(
  slug: string,
  opts: { json?: boolean }
): Promise<void> {
  try {
    const siteId = await resolveSlug(slug);
    const data = await apiFetch<{ site: any; approved_users: any[]; requests: any[] }>(
      `/api/sites/${siteId}`
    );

    if (opts.json) {
      console.log(JSON.stringify({
        approved_users: data.approved_users,
        pending: data.requests.filter((r: any) => r.status === "pending"),
        denied: data.requests.filter((r: any) => r.status === "denied"),
      }, null, 2));
      return;
    }

    // Approved users
    console.log(chalk.bold("Approved Users:"));
    if (data.approved_users.length === 0) {
      console.log(chalk.dim("  (none)"));
    } else {
      for (const u of data.approved_users) {
        console.log(`  • ${u.email}`);
      }
    }

    // Pending requests
    const pending = data.requests.filter((r: any) => r.status === "pending");
    console.log();
    console.log(chalk.bold("Pending Requests:"));
    if (pending.length === 0) {
      console.log(chalk.dim("  (none)"));
    } else {
      for (const r of pending) {
        console.log(`  • ${r.email} ${chalk.dim(`(id: ${r.id})`)}`);
      }
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
