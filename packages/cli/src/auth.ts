import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

export interface Config {
  token?: string;
  email?: string;
  name?: string;
}

function getConfigPaths() {
  const baseDir = process.env.OAUTHPAGE_CONFIG_DIR || join(homedir(), ".oauthpage");
  return {
    dir: baseDir,
    file: join(baseDir, "config.json"),
  };
}

export function loadConfig(): Config {
  const { file } = getConfigPaths();
  try {
    if (existsSync(file)) {
      return JSON.parse(readFileSync(file, "utf-8"));
    }
  } catch {}
  return {};
}

export function saveConfig(config: Config): void {
  const { dir, file } = getConfigPaths();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(file, JSON.stringify(config, null, 2) + "\n", { mode: 0o600 });
}

export function clearConfig(): void {
  const { file } = getConfigPaths();
  try {
    if (existsSync(file)) {
      unlinkSync(file);
    }
  } catch {}
}
