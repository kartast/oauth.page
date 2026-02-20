import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Shield } from "lucide-react";
import { getSites, type Site } from "../lib/api";
import SiteCard from "../components/SiteCard";

export default function Sites() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSites()
      .then((data) => setSites(data.sites))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-zinc-100">Your Sites</h1>
      </div>

      {sites.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield size={28} className="text-zinc-600" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map((site) => (
            <SiteCard key={site.id} site={site} />
          ))}
        </div>
      )}
    </div>
  );
}
