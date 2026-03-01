import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Book,
  ChevronRight,
  Cloud,
  Code2,
  FileText,
  Key,
  LayoutDashboard,
  Link2,
  Lock,
  Menu,
  Shield,
  Terminal,
  Upload,
  Users,
  X,
  Zap,
} from "lucide-react";

/* ─── section registry ─── */
const sections = [
  { id: "getting-started", label: "Getting Started", icon: Zap },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "cli", label: "CLI Reference", icon: Terminal },
  { id: "deploying", label: "Deploying Sites", icon: Upload },
  { id: "access-control", label: "Access Control", icon: Users },
  { id: "one-time-links", label: "One-Time Links", icon: Link2 },
  { id: "api", label: "API Reference", icon: Code2 },
  { id: "security", label: "Security", icon: Lock },
  { id: "limits", label: "Limits & Pricing", icon: Cloud },
  { id: "troubleshooting", label: "Troubleshooting", icon: FileText },
  { id: "privacy", label: "Privacy Policy", icon: Shield },
  { id: "terms", label: "Terms of Service", icon: Book },
];

/* ─── helpers ─── */
function CodeBlock({ children, title }: { children: string; title?: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden my-4">
      {title && (
        <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/60 text-xs text-zinc-400 font-mono">
          {title}
        </div>
      )}
      <pre className="p-4 text-sm text-zinc-300 font-mono leading-relaxed overflow-x-auto whitespace-pre">
        {children}
      </pre>
    </div>
  );
}

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-2xl font-semibold text-zinc-100 mt-16 mb-4 scroll-mt-20 flex items-center gap-3">
      {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-semibold text-zinc-200 mt-8 mb-3">{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-zinc-400 leading-relaxed mb-4">{children}</p>;
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2 text-sm text-zinc-300 leading-relaxed">
      <span className="text-brand-light mt-0.5">•</span>
      <span>{children}</span>
    </li>
  );
}

function ApiRow({ method, path, desc }: { method: string; path: string; desc: string }) {
  const color =
    method === "GET"
      ? "text-emerald-400 bg-emerald-400/10"
      : method === "POST"
        ? "text-blue-400 bg-blue-400/10"
        : method === "PUT"
          ? "text-amber-400 bg-amber-400/10"
          : "text-red-400 bg-red-400/10";
  return (
    <tr className="border-b border-zinc-800/50 hover:bg-zinc-900/30">
      <td className="py-2.5 px-3">
        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${color}`}>{method}</span>
      </td>
      <td className="py-2.5 px-3 font-mono text-sm text-zinc-300">{path}</td>
      <td className="py-2.5 px-3 text-sm text-zinc-400">{desc}</td>
    </tr>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand/10 text-brand-light border border-brand/30">
      {children}
    </span>
  );
}

/* ─── page ─── */
export default function Docs() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [active, setActive] = useState("getting-started");
  const location = useLocation();

  /* scroll to hash on load */
  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (hash) {
      setActive(hash);
      setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [location.hash]);

  /* intersection observer for active sidebar */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const sidebar = (
    <nav className="space-y-1">
      {sections.map((s) => {
        const Icon = s.icon;
        const isActive = active === s.id;
        return (
          <a
            key={s.id}
            href={`#${s.id}`}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
              isActive
                ? "bg-brand/10 text-brand-light font-medium border border-brand/20"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <Icon size={15} className={isActive ? "text-brand-light" : "text-zinc-500"} />
            {s.label}
          </a>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-violet-500/30">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors">
              <ArrowLeft size={16} />
              <span className="hidden sm:inline text-sm">Back</span>
            </Link>
            <div className="h-5 w-px bg-zinc-800" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 flex items-center justify-center shadow-inner">
                <Shield size={16} className="text-brand-light" />
              </div>
              <span className="font-bold text-sm text-zinc-200 tracking-tight whitespace-nowrap">OAuthPage Docs</span>
            </div>
          </div>
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-zinc-800 text-zinc-400"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-6 px-4 border-r border-zinc-800">
          {sidebar}
        </aside>

        {/* Mobile sidebar drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
            <aside className="absolute left-0 top-14 bottom-0 w-72 bg-zinc-950 border-r border-zinc-800 overflow-y-auto p-4">
              {sidebar}
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 px-6 sm:px-8 lg:px-12 py-8 pb-24 max-w-4xl">
          {/* Hero */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand/30 bg-brand/10 text-brand-light text-xs font-semibold uppercase tracking-wider mb-4">
              <Key size={12} />
              Documentation
            </div>
            <h1 className="text-4xl font-bold text-zinc-100 mb-3">OAuthPage Documentation</h1>
            <P>
              Everything you need to deploy private sites, manage access, and integrate with your AI workflows.
            </P>
          </div>

          {/* ────────── Getting Started ────────── */}
          <H2 id="getting-started">
            <Zap size={22} className="text-brand-light" />
            Getting Started
          </H2>
          <P>
            OAuthPage lets you publish static sites to private URLs protected by OAuth authentication.
            Every site you deploy lives at <code className="text-zinc-200 bg-zinc-800 px-1.5 py-0.5 rounded text-sm">your-slug.oauth.page</code> and
            requires authentication before any content is visible.
          </P>

          <H3>Quick start (60 seconds)</H3>
          <ol className="space-y-3 mb-6">
            {[
              <>Sign in at <code className="text-zinc-200 bg-zinc-800 px-1.5 py-0.5 rounded text-sm">app.oauth.page</code> with GitHub</>,
              "Create a site — choose a name and slug",
              "Upload your files (HTML, CSS, JS, images, fonts)",
              <>Share your URL: <code className="text-zinc-200 bg-zinc-800 px-1.5 py-0.5 rounded text-sm">slug.oauth.page</code></>,
              "Approve or revoke visitors from the dashboard",
            ].map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-zinc-300">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand/10 text-brand-light flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>

          <H3>Quick start (CLI)</H3>
          <CodeBlock title="Terminal">{`$ npx oauthpage login
✔ Authenticated via GitHub

$ npx oauthpage add "My Report" --slug q4-report
✔ Site created: q4-report.oauth.page

$ npx oauthpage deploy ./dist --site q4-report
⠋ Uploading 12 files (1.8 MB)...
✔ Deployed to q4-report.oauth.page

$ npx oauthpage link create q4-report --ttl 24h
🔗 https://oauth.page/x/abc123xyz`}</CodeBlock>

          {/* ────────── Dashboard ────────── */}
          <H2 id="dashboard">
            <LayoutDashboard size={22} className="text-brand-light" />
            Dashboard
          </H2>
          <P>
            The web dashboard at <code className="text-zinc-200 bg-zinc-800 px-1.5 py-0.5 rounded text-sm">app.oauth.page</code> is
            where you manage everything visually.
          </P>

          <H3>Sites overview</H3>
          <P>
            After signing in, you'll see a grid of your sites. Each card shows the site name, slug,
            file count, and storage used. Click any card to manage it.
          </P>

          <H3>Site detail</H3>
          <ul className="space-y-2 mb-4">
            <Li><strong>Files tab</strong> — Upload files, upload folders, delete files. Storage usage bar shows account usage against the 50 MB total free-plan quota.</Li>
            <Li><strong>Access tab</strong> — View pending access requests. Approve or deny with one click. Revoke existing access.</Li>
            <Li><strong>Links tab</strong> — Create one-time links, copy URLs, and revoke active links.</Li>
            <Li><strong>Settings</strong> — Delete the site (removes all files, access, and sessions).</Li>
          </ul>

          <H3>Authentication</H3>
          <P>
            Sign in with GitHub (Google OAuth). Your session persists across browser restarts.
            Sign out from the header menu.
          </P>

          {/* ────────── CLI ────────── */}
          <H2 id="cli">
            <Terminal size={22} className="text-brand-light" />
            CLI Reference
          </H2>
          <P>
            The OAuthPage CLI lets you manage sites, deploy files, and control access from your terminal.
            Available as <code className="text-zinc-200 bg-zinc-800 px-1.5 py-0.5 rounded text-sm">oauthpage</code> or
            the shorter alias <code className="text-zinc-200 bg-zinc-800 px-1.5 py-0.5 rounded text-sm">opage</code>.
          </P>

          <H3>Installation</H3>
          <CodeBlock title="Terminal">{`$ npm install -g oauthpage
# or use npx:
$ npx oauthpage <command>`}</CodeBlock>

          <H3>Authentication</H3>
          <CodeBlock>{`$ opage login      # Opens browser for GitHub OAuth
$ opage logout     # Clear stored credentials`}</CodeBlock>
          <P>
            Credentials are stored at <code className="text-zinc-200 bg-zinc-800 px-1.5 py-0.5 rounded text-sm">~/.oauthpage/config.json</code>.
            Override with <code className="text-zinc-200 bg-zinc-800 px-1.5 py-0.5 rounded text-sm">OAUTHPAGE_CONFIG_DIR</code> env var.
          </P>

          <H3>Commands</H3>
          <div className="rounded-lg border border-zinc-800 overflow-hidden my-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/40">
                  <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Command</th>
                  <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {[
                  ["opage login", "Authenticate via GitHub (device flow)"],
                  ["opage logout", "Clear stored credentials"],
                  ["opage sites", "List all your sites"],
                  ["opage status [slug]", "Show site details (or list sites if no slug)"],
                  ["opage add <name> --slug <slug>", "Create a new site"],
                  ["opage deploy <dir> --site <slug>", "Deploy a directory to a site"],
                  ["opage remove <slug>", "Delete a site and all its files"],
                  ["opage access <slug>", "List access requests for a site"],
                  ["opage approve <slug> <request-id>", "Approve an access request"],
                  ["opage deny <slug> <request-id>", "Deny an access request"],
                  ["opage revoke <slug> <email>", "Revoke a user's access"],
                  ["opage link create <slug>", "Create a one-time access link"],
                  ["opage link list <slug>", "List active one-time links"],
                  ["opage link revoke <slug> <link-id>", "Revoke a one-time link"],
                ].map(([cmd, desc]) => (
                  <tr key={cmd} className="hover:bg-zinc-900/30">
                    <td className="px-4 py-2 font-mono text-zinc-300 whitespace-nowrap">{cmd}</td>
                    <td className="px-4 py-2 text-zinc-400">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <H3>Global flags</H3>
          <ul className="space-y-2 mb-4">
            <Li><code className="text-zinc-200 bg-zinc-800 px-1.5 py-0.5 rounded text-xs">--json</code> — Output JSON on all commands (useful for scripting and AI agents)</Li>
          </ul>

          {/* ────────── Deploying ────────── */}
          <H2 id="deploying">
            <Upload size={22} className="text-brand-light" />
            Deploying Sites
          </H2>

          <H3>From the CLI</H3>
          <CodeBlock title="Terminal">{`$ opage deploy ./my-build --site my-site
⠋ Uploading 24 files (3.2 MB)...
✔ Deployed to my-site.oauth.page`}</CodeBlock>
          <P>
            The CLI walks the directory, uploads all files, and sets proper MIME types automatically.
            Files are stored in Cloudflare R2 and served from the edge globally.
          </P>

          <H3>From the dashboard</H3>
          <P>
            In the site detail view, use the <strong>Upload Files</strong> or <strong>Upload Folder</strong> buttons.
            Drag-and-drop is also supported. Files appear instantly after upload.
          </P>

          <H3>SPA support</H3>
          <P>
            OAuthPage automatically serves <code className="text-zinc-200 bg-zinc-800 px-1.5 py-0.5 rounded text-sm">index.html</code> as
            a fallback for any path that doesn't match an uploaded file. This means React Router,
            Vue Router, and other client-side routers work out of the box.
          </P>

          <H3>Supported file types</H3>
          <P>
            Upload any static file — HTML, CSS, JS, images (PNG, JPG, SVG, WebP, GIF),
            fonts (WOFF, WOFF2, TTF), JSON, PDF, and more. MIME types are detected automatically.
          </P>

          <H3>Blocked extensions</H3>
          <P>
            For security, the following extensions are blocked:
            <code className="text-zinc-200 bg-zinc-800 px-1.5 py-0.5 rounded text-sm ml-1">.exe .sh .bat .cmd .ps1 .msi .dll</code>
          </P>

          <H3>Caching</H3>
          <P>
            Hashed assets (filenames containing content hashes, e.g. <code className="text-zinc-200 bg-zinc-800 px-1.5 py-0.5 rounded text-sm">index-Bl0MRy9g.js</code>)
            are served with immutable cache headers for optimal performance. Non-hashed files use short TTLs.
          </P>

          {/* ────────── Access Control ────────── */}
          <H2 id="access-control">
            <Users size={22} className="text-brand-light" />
            Access Control
          </H2>
          <P>
            Every site is private by default. When someone visits your site URL, they see a gate page
            and must authenticate with GitHub or Google to request access.
          </P>

          <H3>How it works</H3>
          <ol className="space-y-3 mb-6">
            {[
              "Visitor navigates to your-slug.oauth.page",
              "They see a branded gate page with a \"Request Access\" button",
              "They authenticate via GitHub or Google",
              "An access request appears in your dashboard",
              "You approve or deny — they get a session cookie on approval",
            ].map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-zinc-300">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>

          <H3>Owner auto-passthrough</H3>
          <P>
            As the site owner, you're automatically granted access. No approval needed — just sign in
            once and all your sites are accessible.
          </P>

          <H3>Session duration</H3>
          <P>
            Visitor sessions last <strong>30 days</strong> with sliding expiration — the cookie refreshes
            on every authenticated page load. In-app browsers may clear cookies more aggressively.
          </P>

          <H3>Revoking access</H3>
          <P>
            Revoke any user's access from the dashboard or CLI. Their session cookie becomes invalid
            immediately, and they'll see the gate page again.
          </P>
          <CodeBlock>{`$ opage revoke my-site user@example.com
✔ Access revoked for user@example.com`}</CodeBlock>

          {/* ────────── One-Time Links ────────── */}
          <H2 id="one-time-links">
            <Link2 size={22} className="text-brand-light" />
            One-Time Links
            <Badge>Beta</Badge>
          </H2>
          <P>
            One-time links let you share access without requiring the recipient to have a GitHub account.
            Each link can only be used once — after that, it's consumed and cannot be reused.
          </P>

          <H3>Creating links</H3>
          <CodeBlock>{`# From CLI
$ opage link create my-site --ttl 24h
🔗 https://oauth.page/x/abc123xyz

# From dashboard
# Site detail → Links tab → Create Link`}</CodeBlock>

          <H3>How one-time links work</H3>
          <ul className="space-y-2 mb-4">
            <Li>When someone opens the link, they see a <strong>confirmation page</strong> (prevents bot/link-scanner consumption)</Li>
            <Li>After confirming, they receive a session cookie — same as an approved user</Li>
            <Li>The link is permanently consumed — subsequent visits show "Link already used"</Li>
            <Li>You can revoke unused links at any time</Li>
          </ul>

          <H3>Anti-prefetch protection</H3>
          <P>
            Chat apps like Slack, Teams, and iMessage often prefetch URLs to generate previews.
            OAuthPage displays a confirmation interstitial that requires a click, so these bots won't
            accidentally consume your link.
          </P>

          {/* ────────── API ────────── */}
          <H2 id="api">
            <Code2 size={22} className="text-brand-light" />
            API Reference
          </H2>
          <P>
            All API endpoints are available at <code className="text-zinc-200 bg-zinc-800 px-1.5 py-0.5 rounded text-sm">app.oauth.page/api/...</code>.
            Authenticate with a Bearer token (from CLI login) or a session cookie (from dashboard).
          </P>

          <H3>Authentication</H3>
          <div className="rounded-lg border border-zinc-800 overflow-hidden my-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/40">
                  <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Method</th>
                  <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Path</th>
                  <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                <ApiRow method="GET" path="/api/auth/me" desc="Get current user info" />
                <ApiRow method="POST" path="/api/auth/logout" desc="End session" />
                <ApiRow method="GET" path="/api/flags" desc="Get feature flags" />
              </tbody>
            </table>
          </div>

          <H3>Sites</H3>
          <div className="rounded-lg border border-zinc-800 overflow-hidden my-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/40">
                  <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Method</th>
                  <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Path</th>
                  <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                <ApiRow method="GET" path="/api/sites" desc="List all your sites" />
                <ApiRow method="POST" path="/api/sites" desc="Create a new site" />
                <ApiRow method="GET" path="/api/sites/:id" desc="Get site details" />
                <ApiRow method="DELETE" path="/api/sites/:id" desc="Delete a site" />
              </tbody>
            </table>
          </div>

          <H3>Files</H3>
          <div className="rounded-lg border border-zinc-800 overflow-hidden my-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/40">
                  <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Method</th>
                  <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Path</th>
                  <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                <ApiRow method="GET" path="/api/sites/:id/files" desc="List files in a site" />
                <ApiRow method="PUT" path="/api/sites/:id/files/*" desc="Upload a single file" />
                <ApiRow method="DELETE" path="/api/sites/:id/files/*" desc="Delete a file" />
                <ApiRow method="POST" path="/api/sites/:id/deploy" desc="Bulk deploy (multipart)" />
              </tbody>
            </table>
          </div>

          <H3>Access</H3>
          <div className="rounded-lg border border-zinc-800 overflow-hidden my-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/40">
                  <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Method</th>
                  <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Path</th>
                  <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                <ApiRow method="GET" path="/api/sites/:id/requests" desc="List access requests" />
                <ApiRow method="POST" path="/api/sites/:id/requests/:rid/approve" desc="Approve a request" />
                <ApiRow method="POST" path="/api/sites/:id/requests/:rid/deny" desc="Deny a request" />
                <ApiRow method="DELETE" path="/api/sites/:id/access/:email" desc="Revoke user access" />
              </tbody>
            </table>
          </div>

          <H3>One-Time Links</H3>
          <div className="rounded-lg border border-zinc-800 overflow-hidden my-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/40">
                  <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Method</th>
                  <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Path</th>
                  <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                <ApiRow method="POST" path="/api/sites/:id/links" desc="Create a one-time link" />
                <ApiRow method="GET" path="/api/sites/:id/links" desc="List one-time links" />
                <ApiRow method="POST" path="/api/sites/:id/links/:linkId/revoke" desc="Revoke a link" />
              </tbody>
            </table>
          </div>

          <H3>CLI Authentication</H3>
          <div className="rounded-lg border border-zinc-800 overflow-hidden my-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/40">
                  <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Method</th>
                  <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Path</th>
                  <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                <ApiRow method="POST" path="/api/cli/auth" desc="Start device auth flow" />
                <ApiRow method="GET" path="/api/cli/auth/poll" desc="Poll for auth completion" />
                <ApiRow method="GET" path="/api/cli/auth/callback" desc="CLI auth callback page" />
              </tbody>
            </table>
          </div>

          {/* ────────── Security ────────── */}
          <H2 id="security">
            <Lock size={22} className="text-brand-light" />
            Security
          </H2>

          <H3>Architecture</H3>
          <ul className="space-y-2 mb-4">
            <Li><strong>100% Cloudflare stack</strong> — Workers, D1, KV, R2. No external dependencies.</Li>
            <Li><strong>Edge authentication</strong> — OAuth and session checks happen at the edge before any content is served.</Li>
            <Li><strong>No content leaks</strong> — Files are stored in R2 (not publicly accessible). Only the worker can serve them, and only after auth checks.</Li>
            <Li><strong>Session cookies</strong> — HttpOnly, Secure, SameSite=Lax. Cannot be read by JavaScript.</Li>
          </ul>

          <H3>OAuth providers</H3>
          <ul className="space-y-2 mb-4">
            <Li><strong>GitHub OAuth</strong> — Fully supported for both owners and visitors</Li>
            <Li><strong>Google OAuth</strong> — Fully supported for both owners and visitors</Li>
          </ul>

          <H3>Data isolation</H3>
          <P>
            Files are stored in R2 with keys namespaced per user and site:
            <code className="text-zinc-200 bg-zinc-800 px-1.5 py-0.5 rounded text-sm ml-1">u_&#123;userId&#125;/s_&#123;siteId&#125;/&#123;path&#125;</code>.
            There is no cross-tenant access possible — each request verifies ownership.
          </P>

          <H3>Blocked file types</H3>
          <P>
            Executable files are blocked at upload time to prevent misuse:
            <code className="text-zinc-200 bg-zinc-800 px-1.5 py-0.5 rounded text-sm ml-1">.exe .sh .bat .cmd .ps1 .msi .dll</code>
          </P>

          {/* ────────── Limits ────────── */}
          <H2 id="limits">
            <Cloud size={22} className="text-brand-light" />
            Limits & Pricing
          </H2>

          <H3>Free plan (MVP)</H3>
          <div className="rounded-lg border border-zinc-800 overflow-hidden my-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/40">
                  <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Resource</th>
                  <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Limit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {[
                  ["Sites", "10"],
                  ["Storage total", "50 MB"],
                  ["Deploys per month", "500"],
                  ["Page views per site/mo", "1,000"],
                  ["Email notifications/mo", "5"],
                  ["One-time links", "3 active"],
                  ["Preview screenshots", "First deploy only"],
                  ["OAuth providers", "GitHub + Google"],
                  ["Custom domain", "Coming soon"],
                ].map(([resource, limit]) => (
                  <tr key={resource} className="hover:bg-zinc-900/30">
                    <td className="px-4 py-2.5 text-zinc-300">{resource}</td>
                    <td className="px-4 py-2.5 text-zinc-400">{limit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <H3>Paid plans</H3>
          <P>
            OAuthPage is free during beta. Paid plans with higher limits, custom domains, and team support are coming soon. The free plan will always exist.
          </P>

          {/* ────────── Troubleshooting ────────── */}
          <H2 id="troubleshooting">
            <FileText size={22} className="text-brand-light" />
            Troubleshooting
          </H2>

          <div className="space-y-4">
            {[
              {
                q: "I see the gate page on my own site",
                a: "Sign in at app.oauth.page first, then refresh your site URL. As the owner, you're auto-approved after signing in.",
              },
              {
                q: "My visitor had to log in again",
                a: "Session cookies last 30 days, but in-app browsers (Instagram, Telegram, etc.) may clear cookies between sessions. Recommend visitors use a real browser.",
              },
              {
                q: "One-time link says already consumed",
                a: "Each link can only be used once. If a link scanner/bot consumed it, create a new one. The anti-prefetch confirmation page should prevent most bots.",
              },
              {
                q: "Upload was rejected",
                a: "Check the file extension (blocked: .exe .sh .bat .cmd .ps1 .msi .dll) and free-plan storage limit (50 MB total across your sites).",
              },
              {
                q: "CLI login isn't working",
                a: "Ensure your browser can reach app.oauth.page. The CLI uses a device auth flow — it opens a browser tab. If behind a firewall, try on a network with HTTPS access.",
              },
              {
                q: "My site shows 'Site not found'",
                a: "Verify the slug matches exactly. Slugs are case-sensitive and must match what you set during creation.",
              },
              {
                q: "Files not updating after re-deploy",
                a: "Hashed assets are cached aggressively. Non-hashed files (like index.html) use short TTLs — try a hard refresh. For hashed assets, the hash changes on content change.",
              },
            ].map((item) => (
              <div key={item.q} className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
                <div className="flex items-start gap-2 mb-2">
                  <ChevronRight size={16} className="text-brand-light mt-0.5 flex-shrink-0" />
                  <h4 className="text-sm font-semibold text-zinc-200">{item.q}</h4>
                </div>
                <p className="text-sm text-zinc-400 ml-6 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>

          {/* ────────── Privacy ────────── */}
          <H2 id="privacy">
            <Shield size={22} className="text-brand-light" />
            Privacy Policy
          </H2>
          <P>
            OAuthPage collects the minimum data needed to provide the service:
          </P>
          <ul className="space-y-2 mb-4">
            <Li><strong>Account data</strong> — GitHub username, email, and avatar (from OAuth). Used for authentication and to display in the dashboard.</Li>
            <Li><strong>Site data</strong> — Files you upload are stored in Cloudflare R2. Only you and approved visitors can access them.</Li>
            <Li><strong>Access logs</strong> — Request counts and bandwidth per site are tracked for usage display. No individual visitor tracking.</Li>
            <Li><strong>Cookies</strong> — Session cookies (HttpOnly, Secure) for authentication. No third-party tracking cookies.</Li>
          </ul>
          <P>
            We do not sell your data. We do not use third-party analytics. Your files are your files.
          </P>
          <P>
            <strong>Data deletion:</strong> Delete a site from the dashboard or CLI to remove all files,
            access records, and sessions permanently. Delete your account by contacting us at{" "}
            <a href="mailto:hello@oauth.page" className="text-brand-light hover:underline">hello@oauth.page</a>.
          </P>

          {/* ────────── Terms ────────── */}
          <H2 id="terms">
            <Book size={22} className="text-brand-light" />
            Terms of Service
          </H2>
          <P>
            By using OAuthPage, you agree to the following:
          </P>
          <ul className="space-y-2 mb-4">
            <Li><strong>Acceptable use</strong> — Do not host malware, phishing pages, illegal content, or anything that harms others.</Li>
            <Li><strong>Availability</strong> — OAuthPage is provided as-is during the beta period. We aim for high uptime but don't guarantee SLAs yet.</Li>
            <Li><strong>Content ownership</strong> — You own everything you upload. OAuthPage claims no rights to your content.</Li>
            <Li><strong>Account termination</strong> — We reserve the right to suspend accounts violating acceptable use. You'll be notified first when possible.</Li>
            <Li><strong>Liability</strong> — OAuthPage is not liable for data loss. Keep backups of your files.</Li>
          </ul>
          <P>
            Questions? Contact <a href="mailto:hello@oauth.page" className="text-brand-light hover:underline">hello@oauth.page</a>.
          </P>

          {/* Footer spacer */}
          <div className="mt-20 pt-8 border-t border-zinc-800">
            <div className="flex items-center justify-between text-sm text-zinc-500">
              <span>© {new Date().getFullYear()} OAuthPage. All rights reserved.</span>
              <Link to="/" className="hover:text-zinc-300 transition-colors">← Back to home</Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
