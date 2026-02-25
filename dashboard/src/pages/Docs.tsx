import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";

export default function Docs() {
  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200 mb-6">
          <ArrowLeft size={14} /> Back
        </Link>

        <h1 className="text-3xl font-semibold text-zinc-100 mb-2">OAuthPage Docs</h1>
        <p className="text-zinc-400 mb-8">Quick launch guide, limits, and troubleshooting.</p>

        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-4">
          <h2 className="text-lg font-medium text-zinc-100 mb-3">Share privately in 60 seconds</h2>
          <ol className="text-sm text-zinc-300 space-y-2">
            <li>1) Sign in at <code className="text-zinc-100">app.oauth.page</code></li>
            <li>2) Create a deployment (choose your slug)</li>
            <li>3) Upload your static files</li>
            <li>4) Share your URL: <code className="text-zinc-100">https://&lt;slug&gt;.oauth.page</code></li>
            <li>5) Approve or revoke access from dashboard</li>
          </ol>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-4">
          <h2 className="text-lg font-medium text-zinc-100 mb-3">Free plan limits (MVP)</h2>
          <ul className="text-sm text-zinc-300 space-y-2">
            <li>• Max <b>25 MB per deployment</b></li>
            <li>• Max <b>10 active deployments</b> per account</li>
            <li>• File upload support: HTML, CSS, JS, images, fonts</li>
            <li>• Blocked extensions: .exe .sh .bat .cmd .ps1 .msi .dll</li>
          </ul>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-4">
          <h2 className="text-lg font-medium text-zinc-100 mb-3">Troubleshooting</h2>
          <ul className="text-sm text-zinc-300 space-y-2">
            <li>• <b>Seeing gate page as owner:</b> sign in via dashboard once, then refresh your site URL.</li>
            <li>• <b>Had to login again:</b> browser may have cleared cookies (common in in-app browsers).</li>
            <li>• <b>One-time link didn’t work:</b> it may already be consumed, expired, or revoked.</li>
            <li>• <b>Upload rejected:</b> check blocked extension or 25 MB deployment limit.</li>
          </ul>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-4" id="status">
          <h2 className="text-lg font-medium text-zinc-100 mb-3">Status</h2>
          <p className="text-sm text-zinc-300">Status page is coming soon. For now, monitor <code className="text-zinc-100">/health</code> endpoints.</p>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-4" id="privacy">
          <h2 className="text-lg font-medium text-zinc-100 mb-3">Privacy</h2>
          <p className="text-sm text-zinc-300">We use OAuth for authentication and let owners control access. Full policy page coming soon.</p>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-4" id="terms">
          <h2 className="text-lg font-medium text-zinc-100 mb-3">Terms</h2>
          <p className="text-sm text-zinc-300">MVP service terms are being finalized. Contact support for pilot usage terms.</p>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-lg font-medium text-zinc-100 mb-3">CLI</h2>
          <pre className="text-xs text-zinc-300 bg-zinc-950 border border-zinc-800 rounded-lg p-3 overflow-auto">{`opage login
opage add "My Site" --slug my-site
opage deploy ./dist --site my-site
opage status my-site`}</pre>
          <a href="https://app.oauth.page" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-violet-300 mt-3 hover:text-violet-200">
            Open dashboard <ExternalLink size={14} />
          </a>
        </section>
      </div>
    </div>
  );
}
