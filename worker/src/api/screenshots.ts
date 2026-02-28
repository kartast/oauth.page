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

  // Enqueue screenshot job
  await c.env.SCREENSHOT_QUEUE.send({
    siteId,
    slug: site.slug as string,
    ownerId: site.owner_id as string,
  });

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
const SLOW_THRESHOLD_MS = 25000; // warn if screenshot takes >25s

export async function captureScreenshot(
  env: Env,
  siteId: string,
  slug: string,
  ownerId: string
): Promise<void> {
  const t0 = Date.now();
  const timings: Record<string, number> = {};
  let browser;
  try {
    const token = crypto.randomUUID();
    await env.KV.put(`ss:${token}`, siteId, { expirationTtl: 60 });

    timings.tokenMs = Date.now() - t0;

    const tLaunch = Date.now();
    browser = await puppeteer.launch(env.BROWSER);
    timings.launchMs = Date.now() - tLaunch;

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setExtraHTTPHeaders({ "X-GK-Screenshot": token });

    const siteUrl = `https://${slug}.oauth.page/`;
    const tNav = Date.now();
    await page.goto(siteUrl, { waitUntil: "networkidle0", timeout: 30000 });
    timings.navigationMs = Date.now() - tNav;

    const tSnap = Date.now();
    const png = await page.screenshot({ type: "png" });
    timings.screenshotMs = Date.now() - tSnap;

    // Store in R2
    const key = `u_${ownerId}/s_${siteId}/.gk/thumbnail.png`;
    const tStore = Date.now();
    await env.STORAGE.put(key, png, {
      httpMetadata: { contentType: "image/png" },
    });
    timings.storeMs = Date.now() - tStore;

    // Update DB — success
    const now = Math.floor(Date.now() / 1000);
    await env.DB.prepare(
      "UPDATE sites SET thumbnail_status = 'ready', thumbnail_at = ? WHERE id = ?"
    )
      .bind(now, siteId)
      .run();

    const totalMs = Date.now() - t0;
    timings.totalMs = totalMs;

    const logData = { event: "screenshot_ok", slug, siteId, ...timings, pngKB: Math.round(png.byteLength / 1024) };

    if (totalMs > SLOW_THRESHOLD_MS) {
      console.warn("[SLOW_SCREENSHOT]", JSON.stringify(logData));
    } else {
      console.log("[SCREENSHOT]", JSON.stringify(logData));
    }
  } catch (err) {
    const totalMs = Date.now() - t0;
    console.error("[SCREENSHOT_FAIL]", JSON.stringify({
      event: "screenshot_fail",
      slug,
      siteId,
      totalMs,
      ...timings,
      error: err instanceof Error ? err.message : String(err),
    }));

    await env.DB.prepare(
      "UPDATE sites SET thumbnail_status = 'failed' WHERE id = ?"
    )
      .bind(siteId)
      .run();
    throw err; // re-throw so queue marks it for retry
  } finally {
    if (browser) {
      try { await browser.close(); } catch {}
    }
  }
}

export default screenshotsApi;
