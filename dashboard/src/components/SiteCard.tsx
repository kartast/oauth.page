import { Link } from "react-router-dom";
import { Globe, Users, Clock } from "lucide-react";
import type { Site } from "../lib/api";

interface SiteCardProps {
  site: Site;
}

export default function SiteCard({ site }: SiteCardProps) {
  return (
    <Link
      to={`/sites/${site.id}`}
      className="block bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors group"
    >
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

      <p className="text-xs text-zinc-600 truncate mb-4">{site.origin_url}</p>

      <div className="flex items-center gap-4 text-xs text-zinc-500">
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
      </div>
    </Link>
  );
}
