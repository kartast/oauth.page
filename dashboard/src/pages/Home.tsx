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
  Sparkles,
  Rocket,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-zinc-950">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[28rem] w-[28rem] rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute top-40 -left-20 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-14">
        {/* Hero */}
        <section className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-700 bg-zinc-900/70 text-xs text-zinc-300 mb-5">
            <Shield size={12} /> OAuthPage · LLM Publishing
          </div>

          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-zinc-100 max-w-5xl mx-auto leading-tight">
            Publish LLM output as
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">
              {" "}private sites
            </span>
            , instantly
          </h1>

          <p className="text-zinc-300/90 mt-5 max-w-2xl mx-auto text-base sm:text-lg">
            Your agents generate pages, reports, and dashboards. OAuthPage deploys them behind OAuth with
            owner controls and one-time reviewer links.
          </p>

          <div className="flex items-center justify-center gap-3 mt-8">
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white text-sm font-medium shadow-lg shadow-violet-500/25"
            >
              Start free
            </Link>
            <Link
              to="/docs"
              className="px-5 py-2.5 rounded-lg border border-zinc-600 hover:border-zinc-500 bg-zinc-900/60 text-zinc-100 text-sm font-medium"
            >
              View docs
            </Link>
          </div>

          <div className="mt-4">
            <a href="#workflow" className="text-xs text-violet-300 hover:text-violet-200">
              See LLM workflow
            </a>
          </div>
        </section>

        {/* Social/trust strip */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
          <Trust label="Built for agents" text="LLM artifacts & reports" icon={<Sparkles size={14} />} />
          <Trust label="Edge runtime" text="Cloudflare delivery" icon={<Cloud size={14} />} />
          <Trust label="Controlled sharing" text="Approve · revoke · one-time" icon={<Users size={14} />} />
        </section>

        {/* Main split */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-10">
          <div className="lg:col-span-3 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/90 to-zinc-900/60 p-6">
            <div className="flex items-center gap-2 text-zinc-200 mb-3">
              <Rocket size={16} />
              <h2 className="text-lg font-medium">What teams use OAuthPage for</h2>
            </div>
            <ul className="space-y-2 text-sm text-zinc-300">
              <li>• Share AI-generated product mockups with clients</li>
              <li>• Publish internal LLM dashboards securely</li>
              <li>• Send one-time reviewer links for sensitive outputs</li>
              <li>• Keep generated reports private by default</li>
            </ul>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Feature icon={<Lock size={16} />} title="OAuth gate" text="GitHub + Google login" />
              <Feature icon={<Link2 size={16} />} title="One-time links (beta)" text="Review once without account" />
              <Feature icon={<Gauge size={16} />} title="Usage dashboard" text="Requests, bandwidth, storage" />
              <Feature icon={<CheckCircle2 size={16} />} title="Owner controls" text="Approve, deny, revoke" />
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
            <h2 className="text-lg font-medium text-zinc-100 mb-2">Free plan</h2>
            <div className="text-4xl font-semibold text-zinc-100 mb-1">$0</div>
            <p className="text-xs text-zinc-500">MVP launch tier</p>
            <ul className="mt-5 space-y-2 text-sm text-zinc-300">
              <li>• Max <span className="text-zinc-100">25 MB</span> per deployment</li>
              <li>• Max <span className="text-zinc-100">10 active deployments</span></li>
              <li>• OAuth access control included</li>
              <li>• One-time links (beta)</li>
            </ul>
            <p className="text-xs text-zinc-500 mt-4">Paid plans coming after beta.</p>
          </div>
        </section>

        {/* Workflow */}
        <section id="workflow" className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 mb-10">
          <h2 className="text-lg font-medium text-zinc-100 mb-4">LLM publishing workflow</h2>
          <WorkflowSvg />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mt-4">
            <Step n="1" title="Generate" text="Agent creates HTML report/site" />
            <Step n="2" title="Deploy" text="opage deploy pushes to private URL" />
            <Step n="3" title="Share securely" text="OAuth approvals or one-time links" />
          </div>
          <div className="mt-5">
            <Link to="/docs" className="inline-flex items-center gap-1 text-sm text-violet-300 hover:text-violet-200">
              Read launch docs <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* CLI */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 mb-10" id="cli">
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
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 mb-10">
          <h2 className="text-lg font-medium text-zinc-100 mb-4">FAQ</h2>
          <Faq q="Is this built for LLM-generated output?" a="Yes. OAuthPage is optimized for publishing AI-generated HTML artifacts securely." />
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
    <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4">
      <div className="w-8 h-8 rounded-md bg-zinc-800 text-zinc-300 flex items-center justify-center mb-2">{icon}</div>
      <h3 className="text-sm font-medium text-zinc-100">{title}</h3>
      <p className="text-xs text-zinc-500 mt-1">{text}</p>
    </div>
  );
}

function Trust({ icon, label, text }: { icon: React.ReactNode; label: string; text: string }) {
  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 flex items-center gap-3">
      <div className="w-7 h-7 rounded-md bg-zinc-800 text-zinc-300 flex items-center justify-center">{icon}</div>
      <div>
        <div className="text-xs text-zinc-100 font-medium">{label}</div>
        <div className="text-[11px] text-zinc-500">{text}</div>
      </div>
    </div>
  );
}

function WorkflowSvg() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3 overflow-hidden">
      <svg viewBox="0 0 900 220" className="w-full h-auto" role="img" aria-label="LLM publishing workflow animation">
        <defs>
          <linearGradient id="flow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* rails */}
        <path d="M150 70 C250 70, 250 70, 350 70" stroke="#3f3f46" strokeWidth="2" fill="none" />
        <path d="M450 70 C560 70, 560 70, 680 70" stroke="#3f3f46" strokeWidth="2" fill="none" />
        <path d="M680 70 C760 70, 760 130, 835 130" stroke="#3f3f46" strokeWidth="2" fill="none" />

        {/* active rails */}
        <path d="M150 70 C250 70, 250 70, 350 70" stroke="url(#flow)" strokeOpacity="0.55" strokeWidth="2" fill="none" />
        <path d="M450 70 C560 70, 560 70, 680 70" stroke="url(#flow)" strokeOpacity="0.55" strokeWidth="2" fill="none" />

        {/* nodes */}
        <Node x={70} y={70} label="Agent" sub="LLM output" />
        <Node x={250} y={70} label="Deploy" sub="opage" />
        <Node x={420} y={70} label="Private URL" sub="oauth.page" />
        <Node x={600} y={70} label="Access" sub="approve/revoke" />
        <Node x={835} y={130} label="One-time" sub="review link" small />

        {/* moving pulse */}
        <g filter="url(#softGlow)">
          <circle r="5" fill="#c4b5fd">
            <animateMotion dur="3.4s" repeatCount="indefinite" rotate="auto">
              <mpath href="#mainFlow" />
            </animateMotion>
          </circle>
        </g>

        {/* main path for motion */}
        <path id="mainFlow" d="M70 70 C250 70, 250 70, 420 70 C560 70, 560 70, 600 70" fill="none" />

        {/* branch pulse */}
        <g filter="url(#softGlow)">
          <circle r="4" fill="#f0abfc">
            <animateMotion dur="2.8s" repeatCount="indefinite" begin="0.8s" rotate="auto">
              <mpath href="#branchFlow" />
            </animateMotion>
          </circle>
        </g>
        <path id="branchFlow" d="M600 70 C760 70, 760 130, 835 130" fill="none" />
      </svg>
    </div>
  );
}

function Node({ x, y, label, sub, small = false }: { x: number; y: number; label: string; sub: string; small?: boolean }) {
  const w = small ? 130 : 150;
  const h = small ? 48 : 54;
  return (
    <g transform={`translate(${x - w / 2}, ${y - h / 2})`}>
      <rect width={w} height={h} rx="10" fill="#18181b" stroke="#3f3f46" />
      <text x={12} y={small ? 20 : 21} fill="#f4f4f5" fontSize="12" fontWeight="600">{label}</text>
      <text x={12} y={small ? 34 : 38} fill="#a1a1aa" fontSize="11">{sub}</text>
    </g>
  );
}

function Step({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
      <div className="text-xs text-violet-300 mb-1">Step {n}</div>
      <div className="text-sm text-zinc-100 font-medium">{title}</div>
      <div className="text-xs text-zinc-500 mt-1">{text}</div>
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
