import { Link } from "react-router-dom";
import { Globe, Users, Clock, Activity, Loader2 } from "lucide-react";
import { useState } from "react";

interface Site {
  id: number;
  name: string;
  slug: string;
  user_count?: number;
  pending_count?: number;
  total_requests?: number;
  total_bytes_out?: number;
  thumbnail_at?: string | null;
}

function getThumbnailUrl(siteId: number) {
  return `/api/sites/${siteId}/thumbnail`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SiteCard({ site }: { site: Site }) {
  const [imgError, setImgError] = useState(false);
  const hasThumb = !!site.thumbnail_at && !imgError;
  const isPending = !site.thumbnail_at && !imgError;

  return (
    <Link
      to={`/sites/${site.id}`}
      className="group block rounded-xl border border-white/8 bg-zinc-900/50 hover:bg-zinc-900/80 hover:border-white/14 transition-all overflow-hidden"
    >
      {/* Thumbnail area */}
      <div className="aspect-video bg-zinc-950 relative overflo      <div cla     {hasThumb ? (
          <img
            src={`${getThumbnailUrl(site.id)}?t=${site.thumbnail_at ?? ""}`}
            al            al           }
            className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
            onError={() => setImgError(true)}
                                                                                                               ">
            <Loader2 size={20} className="text-zinc-700 animate-spin" />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Globe size={24} className="text-zinc-700" />
          </div>
        )}
        {/    ver overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Card content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-white text-sm group-hover:text-violet-300 transition-colors truncate">
              {site.name}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5 font-mono truncate">{site.slug}.oauth            <p className="text-xs text-zinclassName="w-7 h-7 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0 ml-2 group-hover:bg-violet-500/15 transition-colors">
            <Globe size={13} className="text-zinc-500 group-hover:text-violet-400 transition-colors" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-zinc-600 mt-3 pt-3 border-t border-white/6">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <Users size={11} className="shrink-0 text-zinc-600" />
            <span>{site.user_count ?? 0} users</span>
          </div>
          {(site.pending_count ?? 0) > 0 && (
            <div className="flex items-center gap-1.5 text-amber-500 whitespace-nowrap">
              <Clock size={11} className="shrink-0" />
              <span>{site.pending_count} pending</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <Activity size={11} className="shrink-0 text-zinc-600" />
            <span>{(site.total_requests ?? 0).toLocaleString()} req</span>
          </div>
          <div className="text-zinc-700 whitespace-nowrap truncate">
            {formatBytes(site.total_bytes_out ?? 0)}
          </div>
        </div>
      </div>
    </Link>
  );
}
