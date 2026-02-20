import { VisitorIdentity } from "./types";

interface GatePageOptions {
  siteName: string;
  slug: string;
  visitor?: VisitorIdentity | null;
  requestStatus?: "none" | "pending" | "approved" | "denied";
  error?: string;
}

export function renderGatePage(opts: GatePageOptions): string {
  const { siteName, slug, visitor, requestStatus = "none", error } = opts;

  let bodyContent: string;

  if (!visitor) {
    // Not signed in — show OAuth buttons
    bodyContent = `
      <h1>This site is private</h1>
      <p class="subtitle">Sign in to request access. The owner will review your request.</p>
      ${error ? `<div class="error">${escapeHtml(error)}</div>` : ""}
      <a href="https://app.oauth.page/api/visitor/auth/github?site=${escapeHtml(slug)}" class="oauth-btn github-btn">
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
        Sign in with GitHub
      </a>
      <a href="https://app.oauth.page/api/visitor/auth/google?site=${escapeHtml(slug)}" class="oauth-btn google-btn">
        <svg viewBox="0 0 24 24" width="18" height="18"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
        Sign in with Google
      </a>`;
  } else if (requestStatus === "pending") {
    // Signed in, request pending
    bodyContent = `
      <div class="visitor-info">
        ${visitor.avatar_url ? `<img src="${escapeHtml(visitor.avatar_url)}" alt="" class="avatar">` : `<div class="avatar-placeholder">${escapeHtml(visitor.name[0].toUpperCase())}</div>`}
        <div>
          <div class="visitor-name">${escapeHtml(visitor.name)}</div>
          <div class="visitor-email">${escapeHtml(visitor.email)}</div>
        </div>
      </div>
      <div class="status-box pending">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
        <div>
          <strong>Access Requested</strong>
          <p>Waiting for the owner to approve your request. You can refresh this page to check.</p>
        </div>
      </div>`;
  } else if (requestStatus === "denied") {
    bodyContent = `
      <div class="visitor-info">
        ${visitor.avatar_url ? `<img src="${escapeHtml(visitor.avatar_url)}" alt="" class="avatar">` : `<div class="avatar-placeholder">${escapeHtml(visitor.name[0].toUpperCase())}</div>`}
        <div>
          <div class="visitor-name">${escapeHtml(visitor.name)}</div>
          <div class="visitor-email">${escapeHtml(visitor.email)}</div>
        </div>
      </div>
      <div class="status-box denied">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        <div>
          <strong>Access Denied</strong>
          <p>Your request for access was not approved.</p>
        </div>
      </div>`;
  } else {
    // Signed in, no request yet — show "Request Access" button
    bodyContent = `
      <h1>This site is private</h1>
      <p class="subtitle">You're signed in. Request access to view this site.</p>
      ${error ? `<div class="error">${escapeHtml(error)}</div>` : ""}
      <div class="visitor-info">
        ${visitor.avatar_url ? `<img src="${escapeHtml(visitor.avatar_url)}" alt="" class="avatar">` : `<div class="avatar-placeholder">${escapeHtml(visitor.name[0].toUpperCase())}</div>`}
        <div>
          <div class="visitor-name">${escapeHtml(visitor.name)}</div>
          <div class="visitor-email">${escapeHtml(visitor.email)}</div>
        </div>
      </div>
      <form method="POST" action="https://app.oauth.page/api/access/request">
        <input type="hidden" name="slug" value="${escapeHtml(slug)}">
        <button type="submit" class="btn">Request Access</button>
      </form>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(siteName)} — Request Access</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0b;
      color: #e4e4e7;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      max-width: 420px;
      width: 100%;
      padding: 2rem;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 2rem;
    }
    .logo-icon {
      width: 32px;
      height: 32px;
      background: #8b5cf6;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .logo-icon svg { width: 18px; height: 18px; }
    .logo-text {
      font-size: 1.125rem;
      font-weight: 600;
      color: #fafafa;
    }
    .card {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 12px;
      padding: 2rem;
    }
    h1 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #fafafa;
      margin-bottom: 0.5rem;
    }
    .subtitle {
      color: #71717a;
      font-size: 0.875rem;
      margin-bottom: 1.5rem;
      line-height: 1.5;
    }
    .oauth-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.625rem;
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #27272a;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.15s;
      margin-bottom: 0.75rem;
    }
    .github-btn {
      background: #1f2937;
      color: #f9fafb;
    }
    .github-btn:hover { background: #374151; border-color: #4b5563; }
    .google-btn {
      background: #18181b;
      color: #e4e4e7;
    }
    .google-btn:hover { background: #27272a; border-color: #3f3f46; }
    .visitor-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
      padding: 0.75rem;
      background: #09090b;
      border: 1px solid #27272a;
      border-radius: 8px;
    }
    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
    }
    .avatar-placeholder {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #8b5cf6;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 1rem;
      color: white;
    }
    .visitor-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: #fafafa;
    }
    .visitor-email {
      font-size: 0.75rem;
      color: #71717a;
    }
    .btn {
      width: 100%;
      padding: 0.75rem;
      background: #8b5cf6;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn:hover { background: #7c3aed; }
    .status-box {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      border-radius: 8px;
      font-size: 0.8125rem;
      line-height: 1.5;
    }
    .status-box strong { display: block; margin-bottom: 0.25rem; }
    .status-box p { color: #a1a1aa; }
    .status-box.pending {
      background: #1c1917;
      border: 1px solid #44403c;
      color: #fbbf24;
    }
    .status-box.denied {
      background: #1c1017;
      border: 1px solid #7f1d1d;
      color: #fca5a5;
    }
    .error {
      background: #451a1a;
      border: 1px solid #7f1d1d;
      color: #fca5a5;
      padding: 0.75rem;
      border-radius: 8px;
      font-size: 0.8125rem;
      margin-bottom: 1rem;
    }
    .footer {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.75rem;
      color: #52525b;
    }
    .footer a { color: #8b5cf6; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <div class="logo-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
      <span class="logo-text">${escapeHtml(siteName)}</span>
    </div>
    <div class="card">
      ${bodyContent}
    </div>
    <div class="footer">Protected by <a href="https://oauth.page">OAuthPage</a></div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
