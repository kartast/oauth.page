import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Globe, Trash2, ExternalLink, Copy, Check } from "lucide-react";
import {
  getSite,
  deleteSite,
  approveRequest,
  denyRequest,
  revokeAccess,
  type Site,
  type AccessRequest,
} from "../lib/api";
import AccessList from "../components/AccessList";

export default function SiteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [site, setSite] = useState<Site | null>(null);
  const [approvedUsers, setApprovedUsers] = useState<{ email: string }[]>([]);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"approved" | "pending">("approved");
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchSite = async () => {
    try {
      const data = await getSite(id!);
      setSite(data.site);
      setApprovedUsers(data.approved_users);
      setRequests(data.requests);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSite();
  }, [id]);

  const handleApprove = async (requestId: string) => {
    await approveRequest(id!, requestId);
    await fetchSite();
  };

  const handleDeny = async (requestId: string) => {
    await denyRequest(id!, requestId);
    await fetchSite();
  };

  const handleRevoke = async (email: string) => {
    if (!confirm(`Revoke access for ${email}?`)) return;
    await revokeAccess(id!, email);
    await fetchSite();
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${site?.name}"? This action cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteSite(id!);
      navigate("/sites");
    } catch (err: any) {
      setError(err.message);
      setDeleting(false);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(`https://${site?.slug}.oauth.page`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400">{error || "Site not found"}</p>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate("/sites")}
        className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        Back to sites
      </button>

      {/* Site header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-brand/20 rounded-xl flex items-center justify-center">
              <Globe size={20} className="text-brand" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-zinc-100">{site.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-zinc-500">{site.slug}.oauth.page</span>
                <button
                  onClick={copyUrl}
                  className="text-zinc-600 hover:text-zinc-400 transition-colors"
                  title="Copy URL"
                >
                  {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                </button>
                <a
                  href={`https://${site.slug}.oauth.page`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-600 hover:text-zinc-400 transition-colors"
                  title="Open site"
                >
                  <ExternalLink size={12} />
                </a>
              </div>
              <p className="text-xs text-zinc-600 mt-2">
                Origin: {site.origin_url}
              </p>
            </div>
          </div>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-500 hover:text-red-400 hover:bg-red-950/50 rounded-lg transition-colors"
          >
            <Trash2 size={12} />
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      {/* Access management */}
      <AccessList
        approvedUsers={approvedUsers}
        requests={requests}
        onApprove={handleApprove}
        onDeny={handleDeny}
        onRevoke={handleRevoke}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}
