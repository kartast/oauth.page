import chalk from "chalk";
import { clearConfig } from "../auth.js";

export async function logoutCommand(opts: { json?: boolean }): Promise<void> {
  clearConfig();
  if (opts.json) {
    console.log(JSON.stringify({ ok: true }));
  } else {
    console.log(chalk.green("✓ Logged out"));
  }
}
