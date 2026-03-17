import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { createSite } from "../lib/api";

export default function CreateSite() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [autoSlug, setAutoSlug] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const generatedSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 63);

  const effectiveSlug = autoSlug ? generatedSlug : slug;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await createSite({ name, slug: effectiveSlug || undefined });
      navigate(`/sites/${result.site.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto page-enter">
      <Link to="/sites" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-200 mb-6 transition-colors">
        <ArrowLeft size={15} />
        Back to sites
      </Link>

      <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-6 sm:p-8">
        <h1 className="text-lg font-semibold text-white mb-1">Create a new site</h1>
        <p className="text-sm text-zinc-500 mb-6">Deploy a site and protect it with OAuth in minutes.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Site name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Internal Tool"
              required
              className="w-full px-3.5 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">URL slug</label>
            <div className="flex items-center rounded-lg border border-white/10 bg-white/5 overflow-hidden focus-within:ring-2 focus-within:ring-violet-500/50 focus-within:border-violet-500/50 transition-colors">
              <span className="px-3 py-2.5 text-sm text-zinc-600 bg-white/3 border-r border-white/8 whitespace-nowrap">oauth.page/</span>
              <input
                type="text"
                value={autoSlug ? generatedSlug : slug}
                onChange={(e) => { setAutoSlug(false); setSlug(e.target.value); }}
                onFocus={() => setAutoSlug(false)}
                placeholder="my-internal-tool"
                className="flex-1 px-3 py-2.5 bg-transparent text-white placeholder-zinc-600 text-sm focus:outline-none"
              />
            </div>
            {autoSlug && name && (
              <p className="text-xs text-zinc-600 mt-1.5">Auto-generated from site name</p>
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !name}
            className="w-full px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors btn-press"
          >
            {submitting ? "Creating..." : "Create Site"}
          </button>
        </form>
      </div>
    </div>
  );
}
