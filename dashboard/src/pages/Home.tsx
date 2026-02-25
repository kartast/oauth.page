import { Link } from "react-router-dom";
import {
  Shield,
  Lock,
  Link2,
  Gauge,
  CheckCircle2,
  ArrowRight,
  Terminal,
  Cloud,
  Users,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-14">
        {/* Hero */}
        <section className="text-center mb-12">
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
              Start free
            </Link>
            <Link to="/docs" className="px-5 py-2.5 rounded-lg border border-zinc-700 hover:border-zinc-600 text-zinc-200 text-sm font-medium">
              View docs
            </Link>
          </div>
          <div className="mt-3">
            <a href="#cli" className="text-xs text-violet-300 hover:text-violet-200">See CLI quickstart</a>
          </div>
        </section>

        {/* Trust strip */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
          <Trust label="Edge delivery" text="Cloudflare network" icon={<Cloud size={14} />} />
          <Trust label="OAuth by default" text="GitHub + Google" icon={<Lock size={14} />} />
          <Trust label="Access control" text="Approve, deny, revoke" icon={<Users size={14} />} />
        </section>

        {/* Feature cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
          <Feature icon={<Lock size={16} />} title="OAuth gate" text="GitHub + Google login" />
          <Feature icon={<Link2 size={16} />} title="One-time links (beta)" text="Share once without login" />
          <Feature icon={<Gauge size={16} />} title="Usage dashboard" text="Requests, bandwidth, storage" />
          <Feature icon={<CheckCircle2 size={16} />} title="Access control" text="Approve, deny, revoke" />
        </section>

        {/* Workflow + pricing */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10">
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
            <p className="text-xs text-zinc-500 mt-4">Paid plans coming soon.</p>
          </div>
        </section>

        {/* CLI quickstart */}
        <section id="cli" className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-10">
          <div className="flex items-center gap-2 mb-3 text-zinc-100">
            <Terminal size={16} />
            <h2 className="text-lg font-medium">CLI quickstart</h2>
          </div>
          <pre className="text-xs text-zinc-300 bg-zinc-950 border border-zinc-800 rounded-lg p-3 overflow-auto">{`opage login
opage add "My Site" --slug my-site
opage deploy ./dist --site my-site
opage link create my-site --ttl 1h`}</pre>
        </section>

        {/* FAQ */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-10">
          <h2 className="text-lg font-medium text-zinc-100 mb-4">FAQ</h2>
          <Faq q="How long do sessions last?" a="Owner and visitor sessions use 30-day cookies, refreshed on active usage." />
          <Faq q="Do one-time links require login?" a="No. One-time links are beta access links and can be consumed once." />
          <Faq q="What are current limits?" a="Free plan supports up to 25 MB per deployment and 10 active deployments." />
          <Faq q="Can I revoke access later?" a="Yes. You can approve, deny, and revoke from the dashboard at any time." />
        </section>

        {/* Footer */}
        <footer className="border-t border-zinc-800 pt-6 flex flex-wrap items-center gap-4 text-sm text-zinc-500">
          <Link to="/docs" className="hover:text-zinc-300">Docs</Link>
          <Link to="/docs#status" className="hover:text-zinc-300">Status</Link>
          <Link to="/docs#privacy" className="hover:text-zinc-300">Privacy</Link>
          <Link to="/docs#terms" className="hover:text-zinc-300">Terms</Link>
          <a href="mailto:hello@oauth.page" className="hover:text-zinc-300">Contact</a>
          <span className="ml-auto text-xs">© {new Date().getFullYear()} OAuthPage</span>
        </footer>
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

function Trust({ icon, label, text }: { icon: React.ReactNode; label: string; text: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex items-center gap-3">
      <div className="w-7 h-7 rounded-md bg-zinc-800 text-zinc-300 flex items-center justify-center">{icon}</div>
      <div>
        <div className="text-xs text-zinc-100 font-medium">{label}</div>
        <div className="text-[11px] text-zinc-500">{text}</div>
      </div>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="mb-3 last:mb-0">
      <p className="text-sm text-zinc-100">{q}</p>
      <p className="text-xs text-zinc-500 mt-1">{a}</p>
    </div>
  );
}
