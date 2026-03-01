import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Shield, Check, X, BarChart3 } from "lucide-react";
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
        getSites(),
        getGlobalRequests(),
        getUsage(),
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

  useEffect(() => {
    fetchData();
  }, []);

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
        <div className="flex justify-between items-center mb-6">
          <div className="w-32 h-6 skeleton"></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden h-64 border-zinc-800/50">
              <div className="h-40 skeleton rounded-none border-b border-zinc-800/50"></div>
              <div className="p-4 space-y-3">
                <div className="h-5 w-3/4 skeleton"></div>
                <div className="h-4 w-1/2 skeleton"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 empty-state max-w-md mx-auto mt-10">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="page-enter">
      {usage && (
        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-brand-light" />
            <h2 className="text-sm font-medium text-zinc-200">Current Usage</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span>Sites</span>
                <span>{usage.usage.sites} / {usage.limits.sites}</span>
              </div>
              <div className="progress-track"><div className={`progress-fill ${percent(usage.usage.sites, usage.limits.sites) > 90 ? "danger" : percent(usage.usage.sites, usage.limits.sites) > 75 ? "warning" : ""}`} style={{ width: `${percent(usage.usage.sites, usage.limits.sites)}%` }} /></div>
            </div>
            <div>
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span>Storage</span>
                <span>{formatBytes(usage.usage.storage_bytes)} / {usage.limits.storageMb} MB</span>
              </div>
              <div className="progress-track"><div className={`progress-fill ${percent(usage.usage.storage_bytes, usage.limits.storageMb * 1024 * 1024) > 90 ? "danger" : percent(usage.usage.storage_bytes, usage.limits.storageMb * 1024 * 1024) > 75 ? "warning" : ""}`} style={{ width: `${percent(usage.usage.storage_bytes, usage.limits.storageMb * 1024 * 1024)}%` }} /></div>
            </div>
            <div>
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span>Deploys this month</span>
                <span>{usage.usage.deploys_this_month} / {usage.limits.deploysPerMonth}</span>
              </div>
              <div className="progress-track"><div className={`progress-fill ${percent(usage.usage.deploys_this_month, usage.limits.deploysPerMonth) > 90 ? "danger" : percent(usage.usage.deploys_this_month, usage.limits.deploysPerMonth) > 75 ? "warning" : ""}`} style={{ width: `${percent(usage.usage.deploys_this_month, usage.limits.deploysPerMonth)}%` }} /></div>
            </div>
            <div>
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span>One-time links</span>
                <span>{usage.usage.one_time_links_active} / {usage.limits.oneTimeLinks}</span>
              </div>
              <div className="progress-track"><div className={`progress-fill ${percent(usage.usage.one_time_links_active, usage.limits.oneTimeLinks) > 90 ? "danger" : percent(usage.usage.one_time_links_active, usage.limits.oneTimeLinks) > 75 ? "warning" : ""}`} style={{ width: `${percent(usage.usage.one_time_links_active, usage.limits.oneTimeLinks)}%` }} /></div>
            </div>
          </div>
        </div>
      )}

      {requests.length > 0 && (
        <div className="mb-10 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
          <h2 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
            Pending Approvals
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs bg-amber-600 text-white rounded-full">
              {requests.length}
            </span>
          </h2>
          <div className="space-y-2">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3"
              >
                <div className="overflow-hidden">
                  <div className="flex items-center gap-3">
                    {req.avatar_url ? (
                      <img
                        src={req.avatar_url}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 bg-brand/20 rounded-full flex items-center justify-center text-brand text-sm font-medium shrink-0">
                        {(req.name || req.email)[0].toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-zinc-200 truncate">
                          {req.name || "Unknown"}
                        </span>
                        <ProviderIcon provider={req.provider ?? undefined} />
                      </div>
                      <span className="text-xs text-zinc-500 block truncate">{req.email}</span>
                      <p className="text-xs text-zinc-500 mt-1">
                        Requested access to <Link to={`/sites/${req.site_id}`} className="text-brand hover:underline font-medium">{req.site_name}</Link>
                        {req.message && <span className="italic ml-2">"{req.message}"</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 ml-12">
                    <button
                      onClick={() => handleApprove(req.site_id, req.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-brand hover:bg-brand-hover text-white text-xs font-medium rounded-md btn-press"
                    >
                      <Check size={12} />
                      Approve
                    </button>
                    <button
                      onClick={() => handleDeny(req.site_id, req.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-medium rounded-md btn-press"
                    >
                      <X size={12} />
                      Deny
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-zinc-100">Your Sites</h1>
      </div>

      {sites.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand/20">
            <Shield size={28} className="text-brand" />
          </div>
          <h2 className="text-zinc-300 font-medium mb-1">No sites yet</h2>
          <p className="text-zinc-600 text-sm mb-6">
            Protect your first website with OAuthPage
          </p>
          <Link
            to="/sites/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-hover text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={16} />
            Create your first site
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map((site) => (
            <SiteCard key={site.id} site={site} />
          ))}
        </div>
      )}
    </div>
  );
}
