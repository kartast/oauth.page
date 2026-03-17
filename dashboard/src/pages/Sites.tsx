import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Check, X, BarChart3, Sparkles, FileText, Globe } from "lucide-react";
import { getSites, getGlobalRequests, getUsage, approveRequest, denyRequest, type Site, type GlobalAccessRequest, type UsageSnapshot } from "../lib/api";
import SiteCard from "../components/SiteCard";

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-zinc-400">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

function ProviderIcon({ provider }: { provider?: string }) {
  if (provider === "github") return <GitHubIcon />;
  if (provider === "google") return <GoogleIcon />;
  return null;
}

export default function Sites() {
  const [sites, setSites] = useState<Site[]>([]);
  const [requests, setRequests] = useState<GlobalAccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageSnapshot | null>(null);

  const fetchData = async () => {
    try {
      const [sitesData, requestsData, usageData] = await Promise.all([
        getSites(), getGlobalRequests(), getUsage(),
      ]);
      setSites(sitesData.sites);
      setRequests(requestsData.requests);
      setUsage(usageData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleApprove = async (siteId: string, requestId: string) => {
    await approveRequest(siteId, requestId);
    await fetchData();
  };

  const handleDeny = async (siteId: string, requestId: string) => {
    await denyRequest(siteId, requestId);
    await fetchData();
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const percent = (used: number, max: number) => {
    if (!max || max <= 0) return 0;
    return Math.min(100, Math.round((used / max) * 100));
  };

  if (loading) {
    return (
      <div className="page-enter">
        <div className="w-32 h-5 skeleton-dark rounded-lg mb-6"></div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-white/8 bg-zinc-900/50 overflow-hidden h-60">
              <div className="h-36 skeleton-dark rounded-none"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 w-3/4 skeleton-dark rounded"></div>
                <div className="h-3 w-1/2 skeleton-dark rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-20"><p className="text-red-400 text-sm">{error}</p></div>;
  }

  return (
    <div className="page-enter">
      {usage && (
        <div className="mb-6 rounded-xl border border-white/8 bg-zinc-900/50 p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={14} className="text-violet-400" />
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Usage</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <UsageStat label="Sites" value={`${usage.usage.sites} / ${usage.limits.sites}`} pct={percent(usage.usage.sites, usage.limits.sites)} />
            <UsageStat label="Storage" value={`${formatBytes(usage.usage.storage_bytes)} / ${usage.limits.storageMb} MB`} pct={percent(usage.usage.storage_bytes, usage.limits.storageMb * 1024 * 1024)} />
            <UsageStat label="Deploys" value={`${usage.usage.deploys_this_month} / ${usage.limits.deploysPerMonth}`} pct={percent(usage.usage.deploys_this_month, usage.limits.deploysPerMonth)} />
            <UsageStat label="One-time links" value={`${usage.usage.one_time_links_active} / ${usage.limits.oneTimeLinks}`} pct={percent(usage.usage.one_time_links_active, usage.limits.oneTimeLinks)} />
          </div>
        </div>
      )}

      {requests.length > 0 && (
        <div className="mb-8 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-0.5 h-full bg-amber-500/60 rounded-l-xl" />
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2 pl-2">
            Pending Approvals
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs bg-amber-500 text-white rounded-full font-bold">{requests.length}</span>
          </h2>
          <div className="space-y-2 pl-2">
            {requests.map((req) => (
              <div key={req.id} className="rounded-lg border border-white/8 bg-zinc-900/60 px-4 py-3">
                <div className="flex items-center gap-3">
                  {req.avatar_url ? (
                    <img src={req.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 bg-violet-500/20 rounded-full flex items-center justify-center text-violet-300 text-xs font-semibold shrink-0">
                      {(req.name || req.email)[0].toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-white truncate">{req.name || "Unknown"}</span>
                      <ProviderIcon provider={req.provider ?? undefined} />
                    </div>
                    <span className="text-xs text-zinc-500 block truncate">{req.email}</span>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Requested access to{" "}
                      <Link to={`/sites/${req.site_id}`} className="text-violet-400 hover:underline font-medium">{req.site_name}</Link>
                      {req.message && <span className="italic ml-2 text-zinc-600">"{req.message}"</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-2.5 ml-11">
                  <button onClick={() => handleApprove(req.site_id, req.id)} className="flex items-center gap-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg btn-press transition-colors">
                    <Check size={11} />Approve
                  </button>
                  <button onClick={() => handleDeny(req.site_id, req.id)} className="flex items-center gap-1 px-3 py-1.5 bg-white/6 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 text-xs font-semibold rounded-lg btn-press transition-colors">
                    <X size={11} />Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-5">
        <h1 className="text-sm font-semibold text-zinc-300">
          {sites.length > 0 ? `${sites.length} site${sites.length !== 1 ? "s" : ""}` : "Your Sites"}
                                                                     v className="py-8 max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-white mb-2">No sites yet</h2>
            <p className="text-zinc-500 text-sm">Here are a few ways to get started.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <OnboardCard icon={<Sparkles size={18} className="text-violet-400" />} iconBg="bg-violet-500/10 border-violet-500/20" title="1. Build with AI" desc="Tell Cursor, Claude, or Bolt to build a web app in a folder, then protect it instantly." code="npx oauthpage deploy ./dist" />
            <OnboardCard icon={<FileText size={18} className="text-emerald-400" />} iconBg="bg-emerald-500/10 border-emerald-500/20" title="2. Publish Markdown" desc="Turn any Markdown file or folder into a beautifully rendered, secure documentation site." code="npx oauthpage deploy README.md" />
            <div className="rounded-xl border border-white/8 bg-zinc-900/50 p-6 flex flex-col">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                <Globe size={18} className="text-indigo-400" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-2">3. Manual Setup</h3>
              <p className="text-sm text-zinc-500 mb-5 flex-grow leading-relaxed">Create a site manually and configure your origin URL from the dashboard.</p>
              <Link to="/sites/new" className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/8 hover:bg-white/12 border border-white/10 text-white text-sm font-semibold rounded-lg transition-colors w-full">
                <Plus size={15} />Create Site Manually
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map((site) => <SiteCard key={site.id} site={site} />)}
        </div>
      )}
    </div>
  );
}

function UsageStat({ label, value, pct }: { label: string; value: string; pct: number }) {
  const color = pct > 90 ? "bg-red-500" : pct > 75 ? "bg-amber-500" : "bg-violet-500";
  return (
    <div>
      <div className="flex items-center justify-between text-zinc-500 mb-1.5">
        <span>{label}</span>
        <span className="text-zinc-400">{value}</span>
      </div>
      <div className="h-1 bg-white/8 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function OnboardCard({ icon, iconBg, title, desc, code }: { icon: React.ReactNode; iconBg: string; title: string; desc: string; code: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-zinc-900/50 p-6">
      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center mb-4 ${iconBg}`}>{icon}</div>
      <h3 className="text-sm font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-zinc-500 mb-4 leading-relaxed">{desc}</p>
      <div className="bg-zinc-950 rounded-lg p-3 font-mono text-xs text-zinc-400 border border-white/6 overflow-x-auto whitespace-nowrap">
        <span className="text-violet-400">npx</span> {code.replace("npx ", "")}
      </div>
    </div>
  );
}
