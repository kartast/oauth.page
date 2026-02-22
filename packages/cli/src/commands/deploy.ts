import chalk from "chalk";
import { readFileSync, statSync, readdirSync } from "node:fs";
import { join, relative, basename } from "node:path";
import { apiFetch } from "../api.js";

type Site = { id: string; slug: string; name: string };

type DeployOpts = {
  site?: string;
  name?: string;
  slug?: string;
  json?: boolean;
};

export async function deployCommand(dir: string, opts: DeployOpts): Promise<void> {
  try {
    const files = collectFiles(dir);
    if (files.length === 0) throw new Error("No files found to deploy");

    const payloadFiles = files.map((f) => ({
      path: f.path,
      content_base64: readFileSync(f.absPath).toString("base64"),
      size: f.size,
    }));

    const totalSize = payloadFiles.reduce((s, f) => s + f.size, 0);

    const site = await resolveOrCreateSite(dir, opts);

    const data = await apiFetch<{ ok: boolean; count: number; totalSize: number }>(
      `/api/sites/${site.id}/deploy`,
      {
        method: "POST",
        body: JSON.stringify({ files: payloadFiles.map(({ path, content_base64 }) => ({ path, content_base64 })) }),
      }
    );

    if (opts.json) {
      console.log(
        JSON.stringify(
          {
            ok: data.ok,
            site: { id: site.id, slug: site.slug, url: `https://${site.slug}.oauth.page` },
            files: files.length,
            totalSize,
          },
          null,
          2
        )
      );
      return;
    }

    console.log(chalk.green(`✓ Deployed ${data.count} file(s) to https://${site.slug}.oauth.page`));
    console.log(chalk.dim(`  Upload size: ${formatBytes(totalSize)}`));
  } catch (err: any) {
    if (opts.json) {
      console.log(JSON.stringify({ error: err.message }));
    } else {
      console.error(chalk.red(`✗ ${err.message}`));
    }
    process.exit(1);
  }
}

async function resolveOrCreateSite(dir: string, opts: DeployOpts): Promise<Site> {
  const { sites } = await apiFetch<{ sites: Site[] }>("/api/sites");

  if (opts.site) {
    const found = sites.find((s) => s.slug === opts.site || s.id === opts.site);
    if (!found) throw new Error(`Site not found: ${opts.site}`);
    return found;
  }

  if (opts.slug) {
    const found = sites.find((s) => s.slug === opts.slug);
    if (found) return found;
  }

  const name = opts.name || basename(dir) || "My Site";
  const created = await apiFetch<{ site: Site }>("/api/sites", {
    method: "POST",
    body: JSON.stringify({ name, slug: opts.slug }),
  });
  return created.site;
}

function collectFiles(root: string) {
  const out: { absPath: string; path: string; size: number }[] = [];
  const skipDirs = new Set([".git", "node_modules", ".next", "dist/.vite"]);

  function walk(cur: string) {
    for (const entry of readdirSync(cur, { withFileTypes: true })) {
      if (entry.name === ".DS_Store") continue;
      const abs = join(cur, entry.name);
      const rel = relative(root, abs).replace(/\\/g, "/");

      if (entry.isDirectory()) {
        if (skipDirs.has(entry.name)) continue;
        walk(abs);
      } else if (entry.isFile()) {
        const size = statSync(abs).size;
        out.push({ absPath: abs, path: rel, size });
      }
    }
  }

  walk(root);
  return out;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
