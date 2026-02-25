import { Link } from "react-router-dom";
import { ArrowRight, Check, Cloud, Lock, Shield, Terminal } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 relative overflow-hidden">
      {/* soft ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[680px] h-[380px] bg-violet-600/15 blur-3xl rounded-full" />
      </div>

      <div className="relative max-w-6xl mx-auto px-5 py-14">
        {/* Nav */}
        <header className="flex items-center justify-between mb-14">
          <div className="inline-flex items-center gap-2 text-sm text-zinc-300">
            <Shield size={14} className="text-zinc-400" />
            OAuthPage
          </div>

          <div className="flex items-center gap-4 text-sm">
            <Link to="/docs" className="text-zinc-400 hover:text-zinc-200 transition-colors">
              Docs
            </Link>
            <Link
              to="/login"
              className="px-3 py-1.5 rounded-md border border-zinc-700 hover:border-zinc-500 text-zinc-100 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </header>

        {/* Hero */}
        <section className="mb-14">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.15em] text-zinc-500 mb-4">Secure LLM publishing</p>

            <h1 className="text-4xl sm:text-6xl tracking-tight leading-[1.05] font-semibold max-w-5xl mx-auto">
              Publish AI-generated sites with
              <span className="block bg-gradient-to-r from-zinc-100 via-violet-200 to-zinc-100 bg-clip-text text-transparent">
                startup-grade security
              </span>
            </h1>

            <p className="mt-6 text-zinc-400 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
              Deploy LLM reports, dashboards, and microsites to private URLs. Control every viewer with OAuth approvals,
              revokes, and one-time links.
            </p>

            <div className="mt-8 flex items-center justify-center gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-zinc-100 text-zinc-900 text-sm font-medium hover:bg-white transition-colors"
              >
                Start free
                <ArrowRight size={14} />
              </Link>
              <a href="#workflow" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
                See workflow
              </a>
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
          <TrustCard icon={<Cloud size={14} />} label="Edge infrastructure" text="Cloudflare runtime + R2 storage" />
          <TrustCard icon={<Lock size={14} />} label="OAuth by default" text="GitHub and Google authentication" />
          <TrustCard icon={<Shield size={14} />} label="Owner controls" text="Approve, revoke, one-time links" />
        </section>

        {/* Main value + pricing */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-12">
          <div className="lg:col-span-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
            <h2 className="text-lg font-medium mb-3">Built for modern AI workflows</h2>
            <ul className="space-y-2 text-sm text-zinc-300">
              <li>• Publish LLM-generated artifacts to private URLs in minutes</li>
              <li>• Share with clients and teammates without exposing raw outputs publicly</li>
              <li>• Keep control with explicit access decisions</li>
              <li>• Use CLI-first flow with opage deploy</li>
            </ul>
          </div>

          <aside className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <p className="text-sm text-zinc-300 mb-2">Free plan</p>
            <p className="text-4xl font-semibold mb-1">$0</p>
            <p className="text-xs text-zinc-500 mb-5">MVP tier</p>
            <ul className="space-y-2 text-sm text-zinc-300">
              <li>• 25 MB per deployment</li>
              <li>• 10 active deployments</li>
              <li>• OAuth access control</li>
              <li>• One-time links (beta)</li>
            </ul>
            <p className="text-xs text-zinc-500 mt-4">Paid plans coming after beta.</p>
          </aside>
        </section>

        {/* Workflow */}
        <section id="workflow" className="mb-12">
          <h2 className="text-lg font-medium mb-4">LLM publishing workflow</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Step n="01" title="Generate" text="Agent creates HTML reports, dashboards, or pages." />
            <Step n="02" title="Deploy" text="opage deploy publishes to a private oauth.page URL." />
            <Step n="03" title="Control access" text="Approve, revoke, or issue one-time review links." />
          </div>
        </section>

        {/* CLI */}
        <section className="mb-12 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div className="flex items-center gap-2 mb-3 text-zinc-200">
            <Terminal size={15} />
            <h2 className="text-sm font-medium">CLI quickstart</h2>
          </div>
          <pre className="text-xs text-zinc-300 bg-zinc-950 border border-zinc-800 rounded-lg p-4 overflow-auto">{`opage login
opage add "My Site" --slug my-site
opage deploy ./dist --site my-site
opage link create my-site --ttl 1h`}</pre>
        </section>

        {/* Benefits */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Benefit
            title="Built for agent artifacts"
            points={[
              "LLM-generated reports",
              "Internal dashboards",
              "Client review mockups",
            ]}
          />
          <Benefit
            title="Security by default"
            points={[
              "GitHub / Google OAuth",
              "Owner-controlled approvals",
              "One-time links for external review",
            ]}
          />
        </section>

        {/* Footer */}
        <footer className="pt-6 border-t border-zinc-800 flex flex-wrap items-center gap-4 text-sm text-zinc-500">
          <Link to="/docs" className="hover:text-zinc-300">
            Docs
          </Link>
          <Link to="/docs#status" className="hover:text-zinc-300">
            Status
          </Link>
          <Link to="/docs#privacy" className="hover:text-zinc-300">
            Privacy
          </Link>
          <Link to="/docs#terms" className="hover:text-zinc-300">
            Terms
          </Link>
          <a href="mailto:hello@oauth.page" className="hover:text-zinc-300">
            Contact
          </a>
          <span className="ml-auto text-xs">© {new Date().getFullYear()} OAuthPage</span>
        </footer>
      </div>
    </div>
  );
}

function TrustCard({ icon, label, text }: { icon: React.ReactNode; label: string; text: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/35 p-3 flex items-center gap-3">
      <div className="w-7 h-7 rounded-md bg-zinc-800 text-zinc-300 flex items-center justify-center">{icon}</div>
      <div>
        <p className="text-xs text-zinc-100 font-medium">{label}</p>
        <p className="text-[11px] text-zinc-500">{text}</p>
      </div>
    </div>
  );
}

function Step({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <article className="rounded-xl border border-zinc-800 bg-zinc-900/35 p-5">
      <p className="text-xs text-zinc-500 mb-2">{n}</p>
      <h3 className="text-sm font-medium text-zinc-100 mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{text}</p>
    </article>
  );
}

function Benefit({ title, points }: { title: string; points: string[] }) {
  return (
    <article className="rounded-xl border border-zinc-800 bg-zinc-900/35 p-6">
      <h3 className="text-sm font-medium text-zinc-100 mb-3">{title}</h3>
      <ul className="space-y-2 text-sm text-zinc-400">
        {points.map((p) => (
          <li key={p} className="flex items-center gap-2">
            <Check size={14} className="text-zinc-500" />
            {p}
          </li>
        ))}
      </ul>
    </article>
  );
}
