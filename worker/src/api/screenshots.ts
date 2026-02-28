import { Hono } from "hono";
import puppeteer from "@cloudflare/puppeteer";
import { Env, OwnerSession } from "../types";
import { getLimits, limitError } from "../limits";

const screenshotsApi = new Hono<{
  Bindings: Env;
  Variables: { owner: OwnerSession };
}>();

/**
 * POST /api/sites/:id/screenshot — trigger screenshot capture
 */
screenshotsApi.post("/:id/screenshot", async (c) => {
  const owner = c.get("owner");
  const siteId = c.req.param("id");

  const site = await c.env.DB.prepare(
    "SELECT * FROM sites WHERE id = ? AND owner_id = ?"
  )
    .bind(siteId, owner.user_id)
    .first();

  if (!site) return c.json({ error: "Site not found" }, 404);

  // Free plan: only allow screenshot if thumbnail_status IS NULL (first time)
  const { limits } = await getLimits(c.env, owner.user_id);
  if (!limits.screenshotOnEveryDeploy && site.thumbnail_status !== null) {
    return c.json(limitError("screenshots", 1, 1), 403);
  }

  // Mark as pending
  await c.env.DB.prepare(
    "UPDATE sites SET thumbnail_status = 'pending' WHERE id = ?"
  )
    .bind(siteId)
    .run();

  // Run screenshot in background
  c.executionCtx.waitUntil(
    captureScreenshot(c.env, siteId, site.slug as string, site.owner_id as string)
  );

  return c.json({ ok: true, status: "pending" });
});

/**
 * GET /api/sites/:id/thumbnail — serve the thumbnail PNG
 */
screenshotsApi.get("/:id/thumbnail", async (c) => {
  const owner = c.get("owner");
  const siteId = c.req.param("id");

  const site = await c.env.DB.prepare(
    "SELECT * FROM sites WHERE id = ? AND owner_id = ?"
  )
    .bind(siteId, owner.user_id)
    .first();

  if (!site) return c.json({ error: "Site not found" }, 404);

  const key = `u_${site.owner_id}/s_${siteId}/.gk/thumbnail.png`;
  const object = await c.env.STORAGE.get(key);

  if (!object) {
    return c.json({ error: "No thumbnail available" }, 404);
  }

  return new Response(object.body, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=300",
      ETag: object.httpEtag,
    },
  });
});

/**
 * Capture a screenshot of the site using CF Browser Rendering
 */
export async function captureScreenshot(
  env: Env,
  siteId: string,
  slug: string,
  ownerId: string
): Promise<void> {
  let browser;
  try {
    // Generate a one-time bypass token (30s TTL, auto-expires)
    const token = crypto.randomUUID();
    await env.KV.put(`ss:${token}`, siteId, { expirationTtl: 60 });

    browser = await puppeteer.launch(env.BROWSER);
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setExtraHTTPHeaders({ "X-GK-Screenshot": token });

    const siteUrl = `https://${slug}.oauth.page/`;
    await page.goto(siteUrl, { waitUntil: "networkidle0", timeout: 15000 });

    const png = await page.screenshot({ type: "png" });

    // Store in R2
    const key = `u_${ownerId}/s_${siteId}/.gk/thumbnail.png`;
    await env.STORAGE.put(key, png, {
      httpMetadata: { contentType: "image/png" },
    });

    // Update DB
    const now = Math.floor(Date.now() / 1000);
    await env.DB.prepare(
      "UPDATE sites SET thumbnail_status = 'ready', thumbnail_at = ? WHERE id = ?"
    )
      .bind(now, siteId)
      .run();
  } catch (err) {
    console.error("Screenshot capture failed:", err);
    await env.DB.prepare(
      "UPDATE sites SET thumbnail_status = 'failed' WHERE id = ?"
    )
      .bind(siteId)
      .run();
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export default screenshotsApi;
