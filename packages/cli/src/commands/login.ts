import chalk from "chalk";
import open from "open";
import { saveConfig } from "../auth.js";
import { API_BASE } from "../api.js";

export async function loginCommand(opts: { json?: boolean }): Promise<void> {
  try {
    // Step 1: Request a device code
    const res = await fetch(`${API_BASE}/api/cli/auth`, { method: "POST" });
    if (!res.ok) {
      throw new Error(`Failed to start auth: ${res.status}`);
    }
    const { code, browser_url } = (await res.json()) as {
      code: string;
      browser_url: string;
      poll_url: string;
    };

    if (!opts.json) {
      console.log(`Opening browser for authentication...`);
      console.log(chalk.dim(`If browser doesn't open, visit: ${browser_url}`));
      console.log(chalk.dim(`Your code: ${code}`));
    }

    // Step 2: Open browser
    await open(browser_url);

    // Step 3: Poll for completion
    const pollUrl = `${API_BASE}/api/cli/auth/poll?code=${code}`;
    const maxAttempts = 60; // 5 minutes at 5s intervals

    for (let i = 0; i < maxAttempts; i++) {
      await sleep(5000);
      const pollRes = await fetch(pollUrl);
      if (!pollRes.ok) continue;

      const data = (await pollRes.json()) as {
        status: string;
        token?: string;
        email?: string;
        name?: string;
      };

      if (data.status === "complete" && data.token) {
        saveConfig({
          token: data.token,
          email: data.email,
          name: data.name,
        });

        if (opts.json) {
          console.log(JSON.stringify({ ok: true, email: data.email, name: data.name }));
        } else {
          console.log(chalk.green(`✓ Logged in as ${data.name} (${data.email})`));
        }
        return;
      }

      if (data.status === "expired") {
        throw new Error("Authentication timed out. Please try again.");
      }
    }

    throw new Error("Authentication timed out. Please try again.");
  } catch (err: any) {
    if (opts.json) {
      console.log(JSON.stringify({ ok: false, error: err.message }));
    } else {
      console.error(chalk.red(`✗ ${err.message}`));
    }
    process.exit(1);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
