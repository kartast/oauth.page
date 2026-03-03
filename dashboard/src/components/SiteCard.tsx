import { useState } from "react";
import { Link } from "react-router-dom";
import { Globe, Users, Clock, Activity, Loader2 } from "lucide-react";
import type { Site } from "../lib/api";
import { getThumbnailUrl } from "../lib/api";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 KB";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb < 1 ? kb.toFixed(1) : Math.round(kb)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}

interface SiteCardProps {
  site: Site;
}

export default function SiteCard({ site }: SiteCardProps) {
  const [imgError, setImgError] = useState(false);
  const hasThumb = site.thumbnail_status === "ready" && !imgError;
  const isPending = site.thumbnail_status === "pending";

  return (
    <Link
      to={`/sites/${site.id}`}
      className="block bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 hover:shadow-md transition-all group"
    >
      {/* Thumbnail area */}
      <div className="aspect-video bg-slate-50 relative overflow-hidden">
        {hasThumb ? (
          <img
            src={`${getThumbnailUrl(site.id)}?t=${site.thumbnail_at ?? ""}`}
            alt={`${site.name} preview`}
            className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
            onError={() => setImgError(true)}
          />
        ) : isPending ? (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 size={24} className="text-slate-300 animate-spin" />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Globe size={32} className="text-slate-300" />
          </div>
        )}
      </div>

      {/* Card content */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-slate-900 group-hover:text-brand transition-colors">
              {site.name}
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">{site.slug}.oauth.page</p>
          </div>
          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
            <Globe size={14} className="text-slate-400" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-500 mt-4">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <Users size={12} className="shrink-0" />
            <span className="truncate">{site.user_count ?? 0} users</span>
          </div>
          {(site.pending_count ?? 0) > 0 && (
            <div className="flex items-center gap-1.5 text-amber-600 whitespace-nowrap">
              <Clock size={12} className="shrink-0" />
              <span className="truncate">{site.pending_count} pending</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <Activity size={12} className="shrink-0" />
            <span className="truncate">{(site.total_requests ?? 0).toLocaleString()} req</span>
          </div>
          <div className="text-slate-400 whitespace-nowrap truncate">
            {formatBytes(site.total_bytes_out ?? 0)}
          </div>
        </div>
      </div>
    </Link>
  );
}
