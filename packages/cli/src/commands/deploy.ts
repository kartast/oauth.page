import chalk from "chalk";
import { readFileSync, writeFileSync, mkdirSync, statSync, readdirSync, existsSync } from "node:fs";
import { join, relative, basename, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { apiFetch } from "../api.js";

type Site = { id: string; slug: string; name: string };

type DeployOpts = {
  site?: string;
  name?: string;
  slug?: string;
  title?: string;
  json?: boolean;
};

export async function deployCommand(dir: string, opts: DeployOpts): Promise<void> {
  try {
    // Detect markdown mode: single .md file or dir with .md files
    const stat = statSync(dir);
    const isMarkdown = stat.isFile() && extname(dir) === ".md";
    const isDirWithMd = stat.isDirectory() && readdirSync(dir).some((f) => f.endsWith(".md"));

    let files: { absPath: string; path: string; size: number }[];

    if (isMarkdown || isDirWithMd) {
      files = buildMarkdownSite(dir, opts);
      console.log(chalk.dim(`  📝 Markdown mode: ${files.filter((f) => f.path.endsWith(".md")).length} doc(s) + template`));
    } else {
      files = collectFiles(dir);
    }

    if (files.length === 0) throw new Error("No files found to deploy");

    const payloadFiles = files.map((f) => ({
      path: f.path,
      content_base64: readFileSync(f.absPath).toString("base64"),
      size: f.size,
    }));

    const totalSize = payloadFiles.reduce((s, f) => s + f.size, 0);

    const site = await resolveOrCreateSite(
      isMarkdown ? basename(dir, ".md") : dir,
      opts
    );

    const data = await apiFetch<{ ok: boolean; count: number; totalSize: number }>(
      `/api/sites/${site.id}/deploy`,
      {
        method: "POST",
        body: JSON.stringify({
          files: payloadFiles.map(({ path, content_base64 }) => ({
            path,
            content_base64,
          })),
        }),
      }
    );

    if (opts.json) {
      console.log(
        JSON.stringify(
          {
            ok: data.ok,
            site: {
              id: site.id,
              slug: site.slug,
              url: `https://${site.slug}.oauth.page`,
            },
            files: files.length,
            totalSize,
            markdown: isMarkdown || isDirWithMd,
          },
          null,
          2
        )
      );
      return;
    }

    console.log(
      chalk.green(
        `✓ Deployed ${data.count} file(s) to https://${site.slug}.oauth.page`
      )
    );
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

function buildMarkdownSite(
  input: string,
  opts: DeployOpts
): { absPath: string; path: string; size: number }[] {
  const files: { absPath: string; path: string; size: number }[] = [];
  const stat = statSync(input);

  // Locate template directory
  const __filename = fileURLToPath(import.meta.url);
  const templateDir = join(dirname(__filename), "..", "templates", "md");

  // Generate index.html from Docsify template
  const title = opts.title || opts.name || basename(stat.isFile() ? dirname(input) : input) || "Docs";
  let indexHtml = readFileSync(join(templateDir, "index.html"), "utf8");
  indexHtml = indexHtml.replace(/\{\{TITLE\}\}/g, escapeHtml(title));

  const tmpDir = join(templateDir, ".tmp");
  if (!existsSync(tmpDir)) { mkdirSync(tmpDir, { recursive: true }); }
  const tmpIndex = join(tmpDir, "index.html");
  writeFileSync(tmpIndex, indexHtml);
  files.push({ absPath: tmpIndex, path: "index.html", size: Buffer.byteLength(indexHtml) });

  if (stat.isFile()) {
    // Single .md file → deploy as README.md
    files.push({ absPath: input, path: "README.md", size: stat.size });
  } else {
    // Directory: collect all files
    const allFiles = collectFilesFiltered(input, (name, isDir) => {
      if (isDir) return !["node_modules", ".git", ".next", "dist"].includes(name);
      return true;
    });

    // Auto-generate _sidebar.md if user didn't provide one
    const hasSidebar = allFiles.some((f) => f.path === "_sidebar.md");
    if (!hasSidebar) {
      const sidebar = generateSidebar(allFiles);
      const tmpSidebar = join(tmpDir, "_sidebar.md");
      writeFileSync(tmpSidebar, sidebar);
      files.push({ absPath: tmpSidebar, path: "_sidebar.md", size: Buffer.byteLength(sidebar) });
    }

    for (const f of allFiles) {
      files.push(f);
    }
  }

  return files;
}

function generateSidebar(files: { path: string }[]): string {
  const mdFiles = files
    .filter((f) => f.path.endsWith(".md") && !f.path.startsWith("_"))
    .map((f) => f.path);

  const lines: string[] = [];

  for (const file of mdFiles.sort()) {
    const name = file.replace(/\.md$/, "");
    if (name === "README") {
      lines.push("- [Home](/)");
    } else {
      // Convert kebab-case/snake_case to Title Case
      const title = name
        .split("/")
        .pop()!
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      const link = name === "README" ? "/" : name;
      lines.push(`- [${title}](${link})`);
    }
  }

  return lines.join("\n") + "\n";
}

function collectFilesFiltered(
  root: string,
  filter: (name: string, isDir: boolean) => boolean
): { absPath: string; path: string; size: number }[] {
  const out: { absPath: string; path: string; size: number }[] = [];

  function walk(cur: string) {
    for (const entry of readdirSync(cur, { withFileTypes: true })) {
      if (entry.name === ".DS_Store") continue;
      const abs = join(cur, entry.name);
      const rel = relative(root, abs).replace(/\\/g, "/");

      if (entry.isDirectory()) {
        if (!filter(entry.name, true)) continue;
        walk(abs);
      } else if (entry.isFile() && filter(entry.name, false)) {
        const size = statSync(abs).size;
        out.push({ absPath: abs, path: rel, size });
      }
    }
  }

  walk(root);
  return out;
}

async function resolveOrCreateSite(
  dir: string,
  opts: DeployOpts
): Promise<Site> {
  const { sites } = await apiFetch<{ sites: Site[] }>("/api/sites");

  if (opts.site) {
    const found = sites.find(
      (s) => s.slug === opts.site || s.id === opts.site
    );
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

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
