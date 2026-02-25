import { Link } from "react-router-dom";
import { ArrowRight, Check, Shield, Terminal } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-6xl mx-auto px-5 py-16">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-16">
          <div className="inline-flex items-center gap-2 text-sm text-zinc-300">
            <Shield size={14} className="text-zinc-400" />
            OAuthPage
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/docs" className="text-zinc-400 hover:text-zinc-200">
              Docs
            </Link>
            <Link
              to="/login"
              className="px-3 py-1.5 rounded-md border border-zinc-700 hover:border-zinc-500 text-zinc-100"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Hero */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          <div className="lg:col-span-2">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500 mb-4">Secure LLM publishing</p>
            <h1 className="text-4xl sm:text-5xl leading-tight tracking-tight font-semibold max-w-3xl">
              Publish LLM output as private sites.
            </h1>
            <p className="mt-6 text-zinc-400 max-w-2xl text-base leading-relaxed">
              Turn agent-generated pages, reports, and dashboards into private URLs with OAuth access control.
              Approve, revoke, or share one-time reviewer links in seconds.
            </p>

            <div className="mt-8 flex items-center gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-zinc-100 text-zinc-900 text-sm font-medium hover:bg-white"
              >
                Start free
                <ArrowRight size={14} />
              </Link>
              <a href="#workflow" className="text-sm text-zinc-400 hover:text-zinc-200">
                See workflow
              </a>
            </div>
          </div>

          <aside className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <p className="text-sm text-zinc-300 mb-3">Free plan</p>
            <p className="text-3xl font-semibold mb-1">$0</p>
            <p className="text-xs text-zinc-500 mb-5">MVP tier</p>
            <ul className="space-y-2 text-sm text-zinc-300">
              <li>• 25 MB per deployment</li>
              <li>• 10 active deployments</li>
              <li>• OAuth access control</li>
              <li>• One-time links (beta)</li>
            </ul>
          </aside>
        </section>

        {/* Workflow */}
        <section id="workflow" className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Step
              n="01"
              title="Generate"
              text="Your agent produces HTML artifacts, reports, or microsites."
            />
            <Step
              n="02"
              title="Deploy"
              text="Use opage deploy to publish to a private oauth.page URL."
            />
            <Step
              n="03"
              title="Control access"
              text="Approve, revoke, or issue one-time review links on demand."
            />
          </div>
        </section>

        {/* CLI */}
        <section className="mb-16 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
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
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
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
