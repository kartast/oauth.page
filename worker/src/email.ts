import { Env } from "./types";

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(env: Env, params: EmailParams): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured — skipping email");
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "OAuthPage <noreply@oauth.page>",
      to: params.to,
      subject: params.subject,
      html: params.html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Resend error (${res.status}):`, body);
  }
}

// --- Templates ---

function wrap(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:520px;margin:40px auto;padding:32px;background:#111;border:1px solid #262626;border-radius:12px;color:#f4f4f5;">
    ${content}
    <hr style="border:none;border-top:1px solid #262626;margin:24px 0"/>
    <p style="font-size:12px;color:#71717a;margin:0;">Sent by <a href="https://oauth.page" style="color:#a78bfa;text-decoration:none;">OAuthPage</a></p>
  </div>
</body>
</html>`;
}

export function accessApprovedEmail(visitorName: string, siteName: string, siteUrl: string): EmailParams {
  return {
    to: "",
    subject: `You've been granted access to ${siteName}`,
    html: wrap(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#fff;">Access Approved</h2>
      <p style="margin:0 0 16px;color:#a1a1aa;">Hi ${esc(visitorName)},</p>
      <p style="margin:0 0 24px;">Your request to access <strong>${esc(siteName)}</strong> has been approved. You can visit the site now.</p>
      <a href="${esc(siteUrl)}" style="display:inline-block;padding:10px 24px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Go to ${esc(siteName)}</a>
    `),
  };
}

export function accessDeniedEmail(visitorName: string, siteName: string): EmailParams {
  return {
    to: "",
    subject: `Access request for ${siteName} was denied`,
    html: wrap(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#fff;">Access Denied</h2>
      <p style="margin:0 0 16px;color:#a1a1aa;">Hi ${esc(visitorName)},</p>
      <p style="margin:0 0 8px;">Your request to access <strong>${esc(siteName)}</strong> has been denied by the site owner.</p>
      <p style="margin:0;color:#a1a1aa;">If you think this is a mistake, contact the site owner directly.</p>
    `),
  };
}

export function newAccessRequestEmail(
  ownerName: string,
  visitorName: string,
  visitorEmail: string,
  siteName: string,
  dashboardUrl: string
): EmailParams {
  return {
    to: "",
    subject: `New access request for ${siteName}`,
    html: wrap(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#fff;">New Access Request</h2>
      <p style="margin:0 0 16px;color:#a1a1aa;">Hi ${esc(ownerName)},</p>
      <p style="margin:0 0 8px;"><strong>${esc(visitorName)}</strong> (${esc(visitorEmail)}) is requesting access to <strong>${esc(siteName)}</strong>.</p>
      <p style="margin:0 0 24px;color:#a1a1aa;">Review and approve or deny from your dashboard.</p>
      <a href="${esc(dashboardUrl)}" style="display:inline-block;padding:10px 24px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Review Request</a>
    `),
  };
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
