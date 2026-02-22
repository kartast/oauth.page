import { Hono } from "hono";
import { Env } from "../types";
import { createOwnerToken } from "../auth/session";

const cliAuth = new Hono<{ Bindings: Env }>();

const CLI_CODE_TTL = 300; // 5 minutes

function generateCode(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// POST /api/cli/auth — start device auth flow
cliAuth.post("/", async (c) => {
  const code = generateCode();

  // Store pending code in KV
  await c.env.KV.put(
    `cli_auth:${code}`,
    JSON.stringify({ status: "pending", created_at: Date.now() }),
    { expirationTtl: CLI_CODE_TTL }
  );

  const browserUrl = `${c.env.APP_URL || "https://app.oauth.page"}/api/cli/auth/callback?code=${code}`;

  return c.json({
    code,
    poll_url: `/api/cli/auth/poll?code=${code}`,
    browser_url: browserUrl,
  });
});

// GET /api/cli/auth/callback — browser redirect: show GitHub OAuth
// This redirects the user to GitHub OAuth with the CLI code embedded in state
cliAuth.get("/callback", async (c) => {
  const code = c.req.query("code");
  if (!code) return c.text("Missing code", 400);

  // Verify the code exists and is pending
  const data = await c.env.KV.get(`cli_auth:${code}`);
  if (!data) return c.text("Code expired or invalid", 400);

  const parsed = JSON.parse(data);
  if (parsed.status !== "pending") return c.text("Code already used", 400);

  // Redirect to GitHub OAuth using the app's canonical callback to avoid GitHub warning
  const state = btoa(JSON.stringify({ type: "cli", code }));
  const params = new URLSearchParams({
    client_id: c.env.GITHUB_CLIENT_ID,
    redirect_uri: `${c.env.APP_URL || "https://app.oauth.page"}/api/auth/github/callback`,
    scope: "user:email",
    state,
  });

  return c.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

// GET /api/cli/auth/github/callback — GitHub OAuth callback for CLI
cliAuth.get("/github/callback", async (c) => {
  const ghCode = c.req.query("code");
  const state = c.req.query("state"); // This is our CLI auth code
  if (!ghCode || !state) return c.text("Missing parameters", 400);

  // Verify CLI code is still valid
  const cliData = await c.env.KV.get(`cli_auth:${state}`);
  if (!cliData) return c.text("CLI auth code expired", 400);

  // Exchange GitHub code for access token
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: c.env.GITHUB_CLIENT_ID,
      client_secret: c.env.GITHUB_CLIENT_SECRET,
      code: ghCode,
    }),
  });

  const tokenData = (await tokenRes.json()) as any;
  if (!tokenData.access_token) {
    return c.text("GitHub authentication failed", 400);
  }

  // Get user info from GitHub
  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      "User-Agent": "OAuthPage-CLI",
    },
  });
  const ghUser = (await userRes.json()) as any;

  // Get primary email
  const emailRes = await fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      "User-Agent": "OAuthPage-CLI",
    },
  });
  const emails = (await emailRes.json()) as any[];
  const primaryEmail =
    emails.find((e: any) => e.primary && e.verified)?.email || ghUser.email;

  if (!primaryEmail) {
    return c.text("Could not get email from GitHub", 400);
  }

  // Find or create user in DB (same as dashboard flow)
  const name = ghUser.name || ghUser.login;
  const now = Math.floor(Date.now() / 1000);

  const existingUser = await c.env.DB.prepare(
    "SELECT * FROM users WHERE github_id = ? OR email = ?"
  )
    .bind(String(ghUser.id), primaryEmail)
    .first();

  let userId: string;
  if (existingUser) {
    userId = existingUser.id as string;
    await c.env.DB.prepare(
      "UPDATE users SET name = ?, avatar_url = ?, github_id = ?, email = ? WHERE id = ?"
    )
      .bind(name, ghUser.avatar_url, String(ghUser.id), primaryEmail, userId)
      .run();
  } else {
    userId = crypto.randomUUID();
    await c.env.DB.prepare(
      "INSERT INTO users (id, email, name, avatar_url, github_id, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    )
      .bind(userId, primaryEmail, name, ghUser.avatar_url, String(ghUser.id), now)
      .run();
  }

  // Create an owner JWT token
  const token = await createOwnerToken(c.env, {
    id: userId,
    email: primaryEmail,
    name,
  });

  // Store the completed auth in KV for CLI to poll
  await c.env.KV.put(
    `cli_auth:${state}`,
    JSON.stringify({
      status: "complete",
      token,
      email: primaryEmail,
      name,
    }),
    { expirationTtl: CLI_CODE_TTL }
  );

  // Show success page to user
  return c.html(`
    <!DOCTYPE html>
    <html>
    <head><title>OAuthPage CLI</title>
    <style>
      body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #0a0a0a; color: #fff; }
      .card { text-align: center; padding: 2rem; }
      .check { font-size: 3rem; margin-bottom: 1rem; }
      h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
      p { color: #888; }
    </style>
    </head>
    <body>
      <div class="card">
        <div class="check">✓</div>
        <h1>Authenticated!</h1>
        <p>You can close this tab and return to your terminal.</p>
      </div>
    </body>
    </html>
  `);
});

// GET /api/cli/auth/poll — CLI polls this for completion
cliAuth.get("/poll", async (c) => {
  const code = c.req.query("code");
  if (!code) return c.json({ error: "Missing code" }, 400);

  const data = await c.env.KV.get(`cli_auth:${code}`);
  if (!data) {
    return c.json({ status: "expired" });
  }

  const parsed = JSON.parse(data);
  return c.json(parsed);
});

export default cliAuth;
