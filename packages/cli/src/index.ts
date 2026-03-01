import { Command } from "commander";
import { loginCommand } from "./commands/login.js";
import { logoutCommand } from "./commands/logout.js";
import { sitesCommand } from "./commands/sites.js";
import { addCommand } from "./commands/add.js";
import { deployCommand } from "./commands/deploy.js";
import { removeCommand } from "./commands/remove.js";
import { statusCommand } from "./commands/status.js";
import { accessCommand } from "./commands/access.js";
import { approveCommand } from "./commands/approve.js";
import { denyCommand } from "./commands/deny.js";
import { revokeCommand } from "./commands/revoke.js";
import { linkCreateCommand, linkListCommand, linkRevokeCommand } from "./commands/link.js";

const program = new Command();

program
  .name("oauthpage")
  .description("CLI for OAuthPage — protect any website with OAuth")
  .version("0.1.0");

program
  .command("login")
  .description("Authenticate with OAuthPage")
  .option("--json", "Output as JSON")
  .action((opts) => loginCommand(opts));

program
  .command("logout")
  .description("Clear stored credentials")
  .option("--json", "Output as JSON")
  .action((opts) => logoutCommand(opts));

program
  .command("sites")
  .description("List your sites")
  .option("--json", "Output as JSON")
  .action((opts) => sitesCommand(opts));

program
  .command("add <name>")
  .description("Create a hosted site")
  .option("-s, --slug <slug>", "Custom subdomain slug")
  .option("--json", "Output as JSON")
  .action((name, opts) => addCommand(name, opts));

program
  .command("deploy [dir]")
  .description("Deploy a folder of static files (Vercel-style)")
  .option("-S, --site <slug-or-id>", "Deploy into an existing site")
  .option("-n, --name <name>", "Site name (when creating a new site)")
  .option("-s, --slug <slug>", "Site slug (when creating a new site)")
  .option("--json", "Output as JSON")
  .action((dir = ".", opts) => deployCommand(dir, opts));

program
  .command("remove <slug>")
  .description("Remove a site")
  .option("--json", "Output as JSON")
  .action((slug, opts) => removeCommand(slug, opts));

program
  .command("status [slug]")
  .description("Show site details and usage")
  .option("--json", "Output as JSON")
  .action((slug, opts) => statusCommand(slug, opts));

program
  .command("access <slug>")
  .description("List who has access to a site")
  .option("--json", "Output as JSON")
  .action((slug, opts) => accessCommand(slug, opts));

program
  .command("approve <slug> <email>")
  .description("Approve a pending access request")
  .option("--json", "Output as JSON")
  .action((slug, email, opts) => approveCommand(slug, email, opts));

program
  .command("deny <slug> <email>")
  .description("Deny a pending access request")
  .option("--json", "Output as JSON")
  .action((slug, email, opts) => denyCommand(slug, email, opts));

program
  .command("revoke <slug> <email>")
  .description("Revoke access for a user")
  .option("--json", "Output as JSON")
  .action((slug, email, opts) => revokeCommand(slug, email, opts));

const link = program.command("link").description("One-time access links (BETA)");

link
  .command("create <slug>")
  .description("Create one-time access link (BETA)")
  .option("--ttl <ttl>", "TTL, e.g. 30m, 1h, 1d", "1h")
  .option("--path <path>", "Site path to open", "/")
  .option("--json", "Output as JSON")
  .action((slug, opts) => linkCreateCommand(slug, opts));

link
  .command("list <slug>")
  .description("List one-time links (BETA)")
  .option("--json", "Output as JSON")
  .action((slug, opts) => linkListCommand(slug, opts));

link
  .command("revoke <slug> <linkId>")
  .description("Revoke one-time link (BETA)")
  .option("--json", "Output as JSON")
  .action((slug, linkId, opts) => linkRevokeCommand(slug, linkId, opts));

program.parse();
