import { Link } from "react-router-dom";
import { Shield, Lock, Link2, Gauge, CheckCircle2, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-14">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 text-xs text-zinc-400 mb-4">
            <Shield size={12} /> OAuthPage
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-zinc-100">
            Private pages for any website
          </h1>
          <p className="text-zinc-400 mt-4 max-w-2xl mx-auto">
            Upload static files, protect access with OAuth, and share safely with approve/revoke controls.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8">
            <Link to="/login" className="px-5 py-2.5 rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-medium">
              Sign in
            </Link>
            <Link to="/docs" className="px-5 py-2.5 rounded-lg border border-zinc-700 hover:border-zinc-600 text-zinc-200 text-sm font-medium">
              Docs
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
          <Feature icon={<Lock size={16} />} title="OAuth gate" text="GitHub + Google login" />
          <Feature icon={<Link2 size={16} />} title="One-time links (beta)" text="Share once without login" />
          <Feature icon={<Gauge size={16} />} title="Usage dashboard" text="Requests, bandwidth, storage" />
          <Feature icon={<CheckCircle2 size={16} />} title="Access control" text="Approve, deny, revoke" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-medium text-zinc-100 mb-3">How it works</h2>
            <ol className="space-y-2 text-sm text-zinc-300">
              <li>1. Create a deployment at <span className="text-zinc-100">&lt;slug&gt;.oauth.page</span></li>
              <li>2. Upload your static files (HTML/CSS/JS/assets)</li>
              <li>3. Share privately with OAuth approvals or one-time links</li>
            </ol>
            <div className="mt-4">
              <Link to="/docs" className="inline-flex items-center gap-1 text-sm text-violet-300 hover:text-violet-200">
                Read launch docs <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-medium text-zinc-100 mb-2">Pricing</h2>
            <div className="text-3xl font-semibold text-zinc-100">Free</div>
            <p className="text-xs text-zinc-500 mt-1">Single plan for MVP</p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-300">
              <li>• Max <span className="text-zinc-100">25 MB</span> per deployment</li>
              <li>• Max <span className="text-zinc-100">10 active deployments</span></li>
              <li>• OAuth access control included</li>
              <li>• One-time links (beta)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="w-8 h-8 rounded-md bg-zinc-800 text-zinc-300 flex items-center justify-center mb-2">{icon}</div>
      <h3 className="text-sm font-medium text-zinc-100">{title}</h3>
      <p className="text-xs text-zinc-500 mt-1">{text}</p>
    </div>
  );
}
