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
} from "lucide-react";
import {
  getSite,
  deleteSite,
  approveRequest,
  denyRequest,
  revokeAccess,
  listFiles,
  uploadFile,
  deleteFile,
  type Site,
  type AccessRequest,
  type SiteFile,
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
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [files, setFiles] = useState<SiteFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"files" | "approved" | "pending">("files");
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

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

  const fetchFiles = async () => {
    try {
      const data = await listFiles(id!);
      setFiles(data.files);
    } catch {
      // Files listing may fail if no files yet
      setFiles([]);
    }
  };

  useEffect(() => {
    fetchSite();
    fetchFiles();
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
    if (!confirm(`Delete "${site?.name}"? This will remove all files and cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteSite(id!);
      navigate("/sites");
    } catch (err: any) {
      setError(err.message);
      setDeleting(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
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

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const storageUsed = site.storage_bytes ?? 0;
  const storageLimit = 50 * 1024 * 1024;
  const storagePct = Math.min(100, Math.round((storageUsed / storageLimit) * 100));

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

      {error && (
        <div className="bg-red-950/50 border border-red-900 text-red-300 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {/* Usage stats */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
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
              <span className="text-xs text-zinc-600 font-normal"> / 50 MB</span>
            </div>
            <div className="mt-2 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${storagePct > 85 ? "bg-red-500" : storagePct > 65 ? "bg-amber-500" : "bg-brand"}`}
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
          onClick={() => setActiveTab("approved")}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "approved"
              ? "bg-zinc-800 text-zinc-100"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Approved ({approvedUsers.length})
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors relative ${
            activeTab === "pending"
              ? "bg-zinc-800 text-zinc-100"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Pending
          {pendingCount > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-xs bg-amber-600 text-white rounded-full">
              {pendingCount}
            </span>
          )}
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
              className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Upload size={14} />
              {uploading ? uploadProgress || "Uploading..." : "Upload Files"}
            </button>
            {/* Folder upload via webkitdirectory */}
            <label className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg transition-colors cursor-pointer">
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
            Max 25 MB per file · Max 50 MB per site · Blocked: .exe .sh .bat .cmd .ps1 .msi .dll
          </p>

          {/* File list */}
          {files.length === 0 ? (
            <div className="text-center py-12 text-zinc-600">
              <Upload size={32} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">No files yet. Upload your site files to get started.</p>
              <p className="text-xs mt-1">HTML, CSS, JS, images — up to 50 MB total.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {files.map((file) => (
                <div
                  key={file.path}
                  className="flex items-center justify-between py-2.5 group"
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
                    className="text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
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
      {(activeTab === "approved" || activeTab === "pending") && (
        <AccessList
          approvedUsers={approvedUsers}
          requests={requests}
          onApprove={handleApprove}
          onDeny={handleDeny}
          onRevoke={handleRevoke}
          activeTab={activeTab === "approved" ? "approved" : "pending"}
          onTabChange={(tab) => setActiveTab(tab)}
        />
      )}
    </div>
  );
}
