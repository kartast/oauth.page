import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Globe,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Activity,
  Upload,
  File,
  FolderUp,
  Link as LinkIcon,
  RefreshCw,
  Camera,
  Loader2,
} from "lucide-react";
import {
  getSite,
  deleteSite,
  revokeAccess,
  approveRequest,
  denyRequest,
  listFiles,
  uploadFile,
  deleteFile,
  getFlags,
  createOneTimeLink,
  listOneTimeLinks,
  revokeOneTimeLink,
  triggerScreenshot,
  getThumbnailUrl,
  type Site,
  type SiteFile,
  type OneTimeLink,
} from "../lib/api";
import AccessList from "../components/AccessList";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 KB";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb < 1 ? kb.toFixed(1) : Math.round(kb)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}

export default function SiteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [site, setSite] = useState<Site | null>(null);
  const [approvedUsers, setApprovedUsers] = useState<{ email: string }[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [files, setFiles] = useState<SiteFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"files" | "access">("files");
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [oneTimeEnabled, setOneTimeEnabled] = useState(false);
  const [oneTimeLinks, setOneTimeLinks] = useState<OneTimeLink[]>([]);
  const [creatingLink, setCreatingLink] = useState(false);
  const [newOneTimeUrl, setNewOneTimeUrl] = useState<string | null>(null);
  const [copiedNewLink, setCopiedNewLink] = useState(false);
  const [capturingScreenshot, setCapturingScreenshot] = useState(false);
  const [screenshotMsg, setScreenshotMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [accessSubTab, setAccessSubTab] = useState<"approved" | "pending">("approved");
  const [imgError, setImgError] = useState(false);

  const fetchSite = async () => {
    try {
      const data = await getSite(id!);
      setSite(data.site);
      setApprovedUsers(data.approved_users);
      setRequests(data.requests || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFiles = async () => {
    try {
      const data = await listFiles(id!);
      setFiles(data.files);
    } catch {
      // Files listing may fail if no files yet
      setFiles([]);
    }
  };

  const fetchOneTimeLinks = async () => {
    try {
      const flags = await getFlags();
      const enabled = !!flags.beta?.one_time_links;
      setOneTimeEnabled(enabled);
      if (!enabled) {
        setOneTimeLinks([]);
        return;
      }
      const data = await listOneTimeLinks(id!);
      setOneTimeLinks(data.links || []);
    } catch {
      setOneTimeEnabled(false);
      setOneTimeLinks([]);
    }
  };

  useEffect(() => {
    fetchSite();
    fetchFiles();
    fetchOneTimeLinks();
  }, [id]);

  const handleRevoke = async (email: string) => {
    if (!confirm(`Revoke access for ${email}?`)) return;
    await revokeAccess(id!, email);
    await fetchSite();
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteSite(id!);
      navigate("/sites");
    } catch (err: any) {
      setError(err.message);
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleUpload = async (fileList: FileList) => {
    setUploading(true);
    setError(null);
    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const path = (file as any).webkitRelativePath || file.name;
        setUploadProgress(`Uploading ${i + 1}/${fileList.length}: ${path}`);
        await uploadFile(id!, path, file);
      }
      setUploadProgress("");
      await fetchFiles();
      await fetchSite(); // refresh storage_bytes
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  };

  const handleDeleteFile = async (path: string) => {
    if (!confirm(`Delete ${path}?`)) return;
    try {
      await deleteFile(id!, path);
      await fetchFiles();
      await fetchSite();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(`https://${site?.slug}.oauth.page`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateOneTimeLink = async () => {
    setCreatingLink(true);
    setError(null);
    try {
      const created = await createOneTimeLink(id!, { ttl_seconds: 3600, path: "/" });
      setNewOneTimeUrl(created.link.url);
      setCopiedNewLink(false);
      await fetchOneTimeLinks();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreatingLink(false);
    }
  };

  const handleCopyNewOneTimeLink = async () => {
    if (!newOneTimeUrl) return;
    await navigator.clipboard.writeText(newOneTimeUrl);
    setCopiedNewLink(true);
    setTimeout(() => setCopiedNewLink(false), 2000);
  };

  const handleRevokeOneTimeLink = async (linkId: string) => {
    if (!confirm("Revoke this one-time link?")) return;
    try {
      await revokeOneTimeLink(id!, linkId);
      await fetchOneTimeLinks();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      await approveRequest(id!, requestId);
      await fetchSite();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeny = async (requestId: string) => {
    try {
      await denyRequest(id!, requestId);
      await fetchSite();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleScreenshot = async () => {
    setCapturingScreenshot(true);
    setScreenshotMsg(null);
    setError(null);
    try {
      await triggerScreenshot(id!);
      // Poll for completion (up to 30s)
      for (let i = 0; i < 15; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const data = await getSite(id!);
        if (data.site.thumbnail_status === "ready") {
          setSite(data.site);
          setScreenshotMsg({ type: "success", text: "Preview updated!" });
          setTimeout(() => setScreenshotMsg(null), 3000);
          return;
        }
        if (data.site.thumbnail_status === "failed") {
          setSite(data.site);
          setScreenshotMsg({ type: "error", text: "Preview generation failed" });
          setTimeout(() => setScreenshotMsg(null), 5000);
          return;
        }
      }
      setScreenshotMsg({ type: "error", text: "Preview timed out — try again" });
      setTimeout(() => setScreenshotMsg(null), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCapturingScreenshot(false);
    }
  };

  if (loading) {
    return (
      <div className="page-enter max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between mb-8">
          <div className="h-8 w-48 skeleton"></div>
          <div className="h-8 w-24 skeleton"></div>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="h-64 skeleton"></div>
          <div className="h-64 skeleton"></div>
        </div>
      </div>
    );
  }

  if (error && !site) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!site) return null;

  const hasThumb = site.thumbnail_status === "ready" && !imgError;
  const isPending = site.thumbnail_status === "pending";

  const storageUsed = site.storage_bytes ?? 0;
  const storageLimit = 25 * 1024 * 1024;
  const storagePct = Math.min(100, Math.round((storageUsed / storageLimit) * 100));

  return (
    <div>
      <button
        onClick={() => navigate("/sites")}
        className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 btn-press mb-6"
      >
        <ArrowLeft size={14} />
        Back to sites
      </button>

      {/* Site header */}
      {/* Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* Site header */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
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
                      className="text-zinc-600 hover:text-zinc-400 btn-press"
                      title="Copy URL"
                    >
                      {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                    </button>
                    <a
                      href={`https://${site.slug}.oauth.page`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-600 hover:text-zinc-400 btn-press"
                      title="Open site"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-950/50 border border-red-900 text-red-300 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {/* Usage stats */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
              <Activity size={14} />
              Usage
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-zinc-800/50 rounded-lg p-3">
                <div className="text-xs text-zinc-500 mb-1">Files</div>
                <div className="text-lg font-semibold text-zinc-100">{files.length}</div>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-3">
                <div className="text-xs text-zinc-500 mb-1">Storage</div>
                <div className="text-lg font-semibold text-zinc-100">
                  {formatBytes(storageUsed)}
                  <span className="text-xs text-zinc-600 font-normal"> / 25 MB</span>
                </div>
                <div className="mt-2 progress-track">
                  <div
                    className={`progress-fill ${storagePct > 85 ? "danger" : storagePct > 65 ? "warning" : ""}`}
                    style={{ width: `${storagePct}%` }}
                  />
                </div>
                <div className="text-[10px] text-zinc-500 mt-1">{storagePct}% used</div>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-3">
                <div className="text-xs text-zinc-500 mb-1">Requests</div>
                <div className="text-lg font-semibold text-zinc-100">
                  {(site.total_requests ?? 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-3">
                <div className="text-xs text-zinc-500 mb-1">Bandwidth</div>
                <div className="text-lg font-semibold text-zinc-100">
                  {formatBytes(site.total_bytes_out ?? 0)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Thumbnail Preview Box */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col h-full min-h-[280px]">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <Camera size={14} />
              Live Preview
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleScreenshot}
                disabled={capturingScreenshot}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-500 hover:text-brand hover:bg-brand/10 rounded-lg btn-press disabled:opacity-50 disabled:hover:scale-100"
                title="Refresh site preview">
                {capturingScreenshot ? (
                  <div className="w-3 h-3 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                ) : (
                  <RefreshCw size={12} />
                )}
                {capturingScreenshot ? "Updating..." : "Refresh"}
              </button>
            </div>
          </div>
          
          {screenshotMsg && (
            <div className="px-4 pt-3 pb-1">
              <span className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1.5 rounded-md border ${screenshotMsg.type === "success" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                {screenshotMsg.type === "success" ? <Check size={12} /> : null} {screenshotMsg.text}
              </span>
            </div>
          )}

          <div className="flex-1 bg-zinc-800/20 relative flex items-center justify-center p-4">
            <div className="w-full aspect-video rounded-lg overflow-hidden border border-zinc-700/50 bg-zinc-800/50 relative shadow-sm">
              {hasThumb ? (
                <img
                  src={`${getThumbnailUrl(site.id)}?t=${site.thumbnail_at ?? ""}`}
                  alt={`${site.name} preview`}
                  className="w-full h-full object-cover object-top"
                  onError={() => setImgError(true)}
                />
              ) : isPending ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                  <Loader2 size={24} className="text-brand animate-spin" />
                  <span className="text-xs text-zinc-500">Generating preview...</span>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                  <Globe size={32} className="text-zinc-600" />
                  <span className="text-xs text-zinc-500">No preview available</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 mb-4 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
        <button
          onClick={() => setActiveTab("files")}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "files"
              ? "bg-zinc-800 text-zinc-100"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Files
        </button>
        <button
          onClick={() => setActiveTab("access")}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "access"
              ? "bg-zinc-800 text-zinc-100"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Access {requests.length > 0 && <span className="ml-1.5 w-2 h-2 rounded-full bg-amber-500 inline-block"></span>}
        </button>
      </div>

      {/* Files tab */}
      {activeTab === "files" && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          {/* Upload buttons */}
          <div className="flex gap-2 mb-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleUpload(e.target.files)}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-sm font-medium rounded-lg btn-press disabled:hover:scale-100"
            >
              <Upload size={14} />
              {uploading ? uploadProgress || "Uploading..." : "Upload Files"}
            </button>
            {/* Folder upload via webkitdirectory */}
            <label className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg btn-press cursor-pointer">
              <FolderUp size={14} />
              Upload Folder
              <input
                type="file"
                // @ts-ignore webkitdirectory is non-standard
                webkitdirectory=""
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleUpload(e.target.files)}
              />
            </label>
          </div>
          <p className="text-xs text-zinc-500 mb-4">
            Max 25 MB per file · Max 25 MB per deployment · Blocked: .exe .sh .bat .cmd .ps1 .msi .dll
          </p>

          {oneTimeEnabled && (
            <div className="mb-5 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <LinkIcon size={14} className="text-violet-300" />
                  <p className="text-sm font-medium text-zinc-100">One-time links <span className="text-[10px] text-amber-300 border border-amber-700/60 rounded px-1.5 py-0.5 ml-1">BETA</span></p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCreateOneTimeLink}
                    disabled={creatingLink}
                    className="px-3 py-1.5 text-xs rounded-md bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white btn-press disabled:hover:scale-100"
                  >
                    {creatingLink ? "Creating..." : "Create one-time link"}
                  </button>
                  <button
                    onClick={fetchOneTimeLinks}
                    className="p-1.5 rounded-md border border-zinc-700 text-zinc-300 hover:text-white btn-press hover:bg-zinc-800"
                    title="Refresh links"
                  >
                    <RefreshCw size={12} />
                  </button>
                </div>
              </div>

              {newOneTimeUrl && (
                <div className="mb-3 rounded-md border border-violet-700/40 bg-violet-900/20 p-2.5">
                  <p className="text-[11px] text-zinc-300 mb-1">New link (copy now — shown once):</p>
                  <div className="flex gap-2">
                    <input readOnly value={newOneTimeUrl} className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200" />
                    <button onClick={handleCopyNewOneTimeLink} className="px-2 py-1 text-xs rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 btn-press">
                      {copiedNewLink ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              )}

              {oneTimeLinks.length === 0 ? (
                <p className="text-xs text-zinc-500">No one-time links yet.</p>
              ) : (
                <div className="space-y-2">
                  {oneTimeLinks.map((l) => (
                    <div key={l.id} className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-xs text-zinc-300 truncate">id: {l.id}</p>
                        <p className="text-[11px] text-zinc-500">path {l.path} · {l.status} · exp {new Date(l.expires_at * 1000).toLocaleString()}</p>
                      </div>
                      {l.status === "active" && (
                        <button
                          onClick={() => handleRevokeOneTimeLink(l.id)}
                          className="px-2 py-1 text-[11px] rounded border border-zinc-700 text-zinc-300 hover:text-red-300 hover:bg-red-950/30 hover:border-red-700 btn-press"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* File list */}
          {files.length === 0 ? (
            <div className="text-center py-12 text-zinc-600">
              <Upload size={32} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">No files yet. Upload your site files to get started.</p>
              <p className="text-xs mt-1">HTML, CSS, JS, images — up to 25 MB total.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {files.map((file) => (
                <div
                  key={file.path}
                  className="flex items-center justify-between py-2.5 group row-hover rounded-lg px-2 -mx-2 page-enter"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <File size={14} className="text-zinc-600 shrink-0" />
                    <span className="text-sm text-zinc-300 truncate">{file.path}</span>
                    <span className="text-xs text-zinc-600 shrink-0">
                      {formatBytes(file.size)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteFile(file.path)}
                    className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 btn-press p-1 hover:bg-red-500/10 rounded"
                    title="Delete file"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Access tabs */}
      {activeTab === "access" && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 page-enter">
          <AccessList
          approvedUsers={approvedUsers}
          requests={requests}
          onApprove={handleApprove}
          onDeny={handleDeny}
          activeTab={accessSubTab}
          onTabChange={setAccessSubTab}
          onRevoke={handleRevoke}
          />
        </div>
      )}

      {/* Danger Zone */}
      <div className="mt-8 bg-zinc-900 border border-red-900/50 rounded-xl p-6">
        <h2 className="text-sm font-medium text-red-400 mb-2">Danger Zone</h2>
        <p className="text-xs text-zinc-500 mb-4">
          Permanently delete this site, all its files, access lists, and configuration. This action cannot be undone.
        </p>
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg btn-press"
          >
            <Trash2 size={14} />
            Delete this site
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-bold rounded-lg btn-press ring-2 ring-red-400 ring-offset-2 ring-offset-zinc-900"
            >
              <Trash2 size={14} />
              {deleting ? "Deleting..." : `Yes, delete "${site.name}"`}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
