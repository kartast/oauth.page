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
      className="block bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors group"
    >
      {/* Thumbnail area */}
      <div className="aspect-video bg-zinc-800/50 relative overflow-hidden">
        {hasThumb ? (
          <img
            src={`${getThumbnailUrl(site.id)}?t=${site.thumbnail_at ?? ""}`}
            alt={`${site.name} preview`}
            className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
            onError={() => setImgError(true)}
          />
        ) : isPending ? (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 size={24} className="text-zinc-600 animate-spin" />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Globe size={32} className="text-zinc-700" />
          </div>
        )}
      </div>

      {/* Card content */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-zinc-100 group-hover:text-brand transition-colors">
              {site.name}
            </h3>
            <p className="text-sm text-zinc-500 mt-0.5">{site.slug}.oauth.page</p>
          </div>
          <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center">
            <Globe size={14} className="text-zinc-400" />
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-zinc-500 mt-4">
          <span className="flex items-center gap-1">
            <Users size={12} />
            {site.user_count ?? 0} users
          </span>
          {(site.pending_count ?? 0) > 0 && (
            <span className="flex items-center gap-1 text-amber-400">
              <Clock size={12} />
              {site.pending_count} pending
            </span>
          )}
          <span className="flex items-center gap-1">
            <Activity size={12} />
            {(site.total_requests ?? 0).toLocaleString()} req
          </span>
          <span className="text-zinc-600">
            {formatBytes(site.total_bytes_out ?? 0)}
          </span>
        </div>
      </div>
    </Link>
  );
}
