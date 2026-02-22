import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
      const result = await createSite({
        name,
        slug: effectiveSlug || undefined,
      });
      navigate(`/sites/${result.site.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <button
        onClick={() => navigate("/sites")}
        className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        Back to sites
      </button>

      <h1 className="text-lg font-semibold text-zinc-100 mb-6">Create a new site</h1>

      {error && (
        <div className="bg-red-950/50 border border-red-900 text-red-300 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1.5">Site Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Private Site"
            required
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-brand transition-colors"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-zinc-400">Subdomain</label>
            <button
              type="button"
              onClick={() => {
                setAutoSlug(!autoSlug);
                if (!autoSlug) setSlug("");
              }}
              className="text-xs text-brand hover:text-brand-light transition-colors"
            >
              {autoSlug ? "Customize" : "Auto-generate"}
            </button>
          </div>
          <div className="flex items-center gap-0">
            <input
              type="text"
              value={autoSlug ? generatedSlug : slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              disabled={autoSlug}
              className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-l-lg text-zinc-100 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-brand transition-colors disabled:opacity-50"
            />
            <span className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-r-lg text-sm text-zinc-500">
              .oauth.page
            </span>
          </div>
        </div>

        <p className="text-xs text-zinc-600 bg-zinc-900/50 rounded-lg px-3 py-2">
          You'll upload files after creating the site. Visitors will need to sign in with OAuth to access them.
        </p>

        <button
          type="submit"
          disabled={submitting || !name}
          className="w-full py-2.5 bg-brand hover:bg-brand-hover disabled:opacity-50 disabled:hover:bg-brand text-white text-sm font-medium rounded-lg transition-colors mt-2"
        >
          {submitting ? "Creating..." : "Create Site"}
        </button>
      </form>
    </div>
  );
}
