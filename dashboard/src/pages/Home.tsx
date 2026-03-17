import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Bot, Check, Code2, Globe, Lock, Shield, Terminal, Zap } from "lucide-react";

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.querySelectorAll(".reveal").forEach((c) => c.classList.add("visible"));
      el.classList.add("visible");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            e.target.querySelectorAll(".reveal").forEach((c) => c.classList.add("visible"));
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

export default function Home() {
  const [stats, setStats] = useState<{ sites: number; deploys: number } | null>(null);
  useEffect(() => {
    fetch("/api/stats").then((r) => r.ok ? r.json() : null).then((d) => d && setStats(d)).catch(()    fetch("/api/);

  const heroRef = useReveal();
  const featuresRef = useReveal();
  const aiRef = useReveal();
  const termRef = useReveal  const termRef = useReveal  const termRef = useReveal  const termRef = useRevreen bg-[#0a0a0f] text-white relative overflow-hidden font-sans selection:bg-violet-500/30">

      {/* Navigation */}
      <nav className="fixed w-full z-50 dark-nav transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-900/50 group-hover:bg-violet-500 transition-colors">
                <Shield size={15} className="text-white" />
              </div>
              <span className="font-semibold text-[15px] tracking-tight text-white">OAuthPage</span>
            </Link>
            <div className="hidden md:flex items-baseline space-x-1">
              <a href="#features" className="text-zinc-400 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Features</a>
              <a href="#pricing" className="text-zinc-400 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Pricing</a>
              <Link to="/docs" className="text-zinc-400 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Docs</Link>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-zinc-400 hover:text-white px-4 py-2 text-sm font-medium transition-colors hidden xs:block">Login</Link>
              <Link to="/login" className="bg-white text-zinc-900 hover:bg-zinc-100 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-36 pb-24 md:pt-48 md:pb-36 px-4 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-[400px] h-[400px] bg-indigo-600/8 rounded-full blur-[100px] pointer-events-none" />

        <div ref={heroRef} className="reveal reveal-stagger relative z-10 max-w-5xl mx-auto text-center">
          <div className="reveal inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-zinc-300 mb-8 backdrop-blur-sm">
            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-violet-400"></span>
            </span>
            Private hosting for AI outputs
          </div>

          <h1 className="reveal text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6 text-white">
            Gatekeep any site.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
              Zero code required.
            </span>
          </h1>

          <p className="reveal text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            An edge proxy that puts a secure OAuth layer in front of your website in seconds. No backend changes, no SDKs, no infrastructure.
          </p>

          <div className="reveal flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <Link
              to="/login"
              className="group w-full sm:w-auto bg-violet-600 hover:bg-violet-500 text-white px-7 py-3.5 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-violet-900/40 hover:shadow-violet-900/60 inline-flex items-center justify-center gap-2"
            >
              Start for free
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/docs"
              className="w-full sm:w-auto bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 px-7 py-3.5 rounded-lg text-sm font-semibold transition-all inline-flex items-center justify-center"
            >
              View Docs
            </Link>
          </div>

          {stats && (stats.sites > 0 || stats.deploys > 0) && (
            <div className="reveal inline-flex items-center gap-5 px-5 py-2.5 rounded-full bg-white/5 border border-white/8 text-sm text-zinc-400 backdrop-blur-sm">
              <span className="flex items-center gap-2">
                <Globe size={13} className="text-violet-400" />
                <strong className="text-white font-semibold">{stats.sites}</strong> sites deployed
              </span>
              <span className="w-px h-3.5 bg-white/10" />
              <span className="flex items-center gap-2">
                <Zap size={13} className="text-violet-400" />
                <strong className="text-white font-semibold">{stats.deploys.toLocaleString()}</strong> deployments
              </span>
            </div>
          )}

          {/* Hero UI mockup */}
          <div className="reveal mt-16 md:mt-20 relative mx-auto max-w-3xl">
            <div className="absolute inset-0 bg-gradient-to-b from-violet-600/20 to-transparent rounded-2xl blur-2xl scale-95 opacity-60" />
            <div className="relative rounded-2xl border border-white/10 bg-zinc-900/80 backdrop-blur-md shadow-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8 bg-zinc-950/60">
                <div className="w-3 h-3 rounded-full bg-zinc-700" />
                <div className="w-3 h-3 rounded-full bg-zinc-700" />
                <div className="w-3 h-3 rounded-full bg-zinc-700" />
                <div className="mx-auto bg-zinc-800 text-zinc-500 text-xs px-4 py-1 rounded-md font-mono">
                  dashboard.oauth.page
                </div>
              </div>
              <div className="p-6 md:p-8 text-left">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-semibold text-white text-base">Your Sites</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Manage access controls at the edge</p>
                  </div>
                  <button className="bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                    + New Site
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/8 mb-2.5 hover:bg-white/8 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                      <Globe size={15} className="text-violet-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Internal Wiki</p>
                      <p className="text-xs text-zinc-500 font-mono">wiki.yourcompany.com</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-medium">Live</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/3 border border-white/5 opacity-60">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-700/50 flex items-center justify-center">
                      <Shield size={15} className="text-zinc-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-300">Staging Env</p>
                      <p className="text-xs text-zinc-600 font-mono">staging.yourcompany.com</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-700/50 text-zinc-500 border border-zinc-700 font-medium">Gated</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-28 relative" id="features">
        <div ref={featuresRef} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="reveal text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-400 mb-3">Why OAuthPage</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
              Enterprise access control, zero setup.
            </h2>
            <p className="text-zinc-400 text-base leading-relaxed">
              Stop writing authentication logic for every internal tool. Route your traffic through OAuthPage and secure it at the edge instantly.
            </p>
          </div>
          <div className="reveal-stagger grid md:grid-cols-3 gap-4 md:gap-5">
            <FeatureCard
              icon={<Zap size={20} className="text-violet-400" />}
              iconBg="bg-violet-500/10 border-violet-500/20"
              label="Lightning Fast Edge"
              text="Deployed on Cloudflare Workers. Auth happens at the               text="Deployed on Cloudflare Workers. Auth happens at the                <FeatureCard
              icon={<Lock size={20} className="text-indigo-400" />}
              iconBg="bg-indigo-500/10 border-indigo-500/20"
              label="Bring Your Provider"
              text="GitHub and Google OAuth supported. Approve visitors individually or by email domain. More providers coming soon."
            />
            <FeatureCard
              icon={<Code2 size={20} className="text-emerald-400" />}
              iconBg="bg-emerald-500/10 border-emerald-500/20"
              label="Zero Application Code"
              text="No SDKs. No library updates. The proxy handles the OAuth flow and forwards authenticated requests seamlessly."
            />
          </div>
        </div>
      </section>

      {/* AI Workflows */}
      <section className="py-20 md:py-28 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div ref={aiRef} className="reveal reveal-in relative rounded-2xl border border-white/8 bg-zinc-900/60 backdrop-blur-sm p-8 sm:p-12 overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 blur-[80px] rounded-full pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
                  <Bot size={19} className="text-violet-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-violet-400">AI Workflows</p>
                  <h2 className="text-xl font-bold text-white">Built for AI agents</h2>
                </div>
              </div>
              <p className="text-zinc-400 text-base leading-relaxed max-w-3xl mb-10">
                AI agents generate reports, dashboards, and full  but sharing them securely is still a pain. OAuthPage gives your agents a <span className="text-white font-medium">publish endpoint</span> with access control built in.websites 
              </p>
              <div className="grid sm:grid-cols-3 gap-6 mb-8">
                <AiFeature icon={<Code2 size={15} className="text-violet-400" />} title="Any coding agent" desc="Claude Co                <AiFeature icon={<Code2 size={15} className="text-violet-400" />} title="Any coding agent" desc="Claude size={15} className="text-emerald-400" />} title="CLI-first" desc="One command to deploy. JSON output for piping. Built for scripts and automation." />
                <AiFeature icon={<Shield size={15} className="text-amber-400" />} title="Private by default" desc="No more public Vercel links for sensitive AI outputs. Every page is gated." />
              </div>
              <div className="rounded-xl border border-white/8 bg-white/4 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:bg-white/6 transition-colors">
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div>                  <span className="text-xl">
                    <p className="text-sm font-semibold text-white">Works with OpenClaw</p>
                    <p className="text-xs text-zinc-500">AI assistant framework</p>
                  </div>
                </div>
                <div className="sm:border-l sm:border-white/10 sm:pl-4 flex-1">
                  <p className="text-sm text-zinc-400">
                    OpenClaw agents use <code className="text-violet-300 bg-violet-500/15 px-1.5 py-0.5 rounded text-xs font-mono">oauthpage deploy</code> to publish artifacts and  then share secure links in chat. No manual steps.dashboards 
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Terminal / How It Works */}
      <section id="workflow" className="py-20 md:py-28 relative">
        <div ref={termRef} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="reveal reveal-left space-y-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-violet-400 mb-3">How it works</p>
              <h2 className="text-3xl font-bold text-white tracking-tight mb-4">Three commands. Done.</h2>
              <p className="text-zinc-400 text-base leading-relaxed">No config files. No auth setup. No infrastructure to manage.</p>
            </div>
            <ul className="space-y-5">
              <WorkflowItem num="01" title="Upload anything" desc="HTML, React apps, reports,  if a browser can open it, OAuthPage can host it." />dashboards 
              <WorkflowItem num="02" title="Share the link" desc="Send your URL to a client or teammate. They                that's it." />pprove 
              <WorkflowItem num="03" title="Stay in control" desc="Revoke access anytime. Send one-time links that expire after a single use." />
            </ul>
          </div>
          <div className="reveal reveal-right relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/15 to-transparent rounded-2xl blur-2xl" />
            <div className="relative rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8 bg-zinc-900/80">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-zinc-700" />
                  <div className="w-3 h-3 rounded-full bg-zinc-700" />
                  <div className="w-3 h-3 rounded-full bg-zinc-700" />
                </div>
                <div className="ml-3 flex items-center gap-2">
                  <Terminal size={13} className="text-zinc-500" />
                  <span className="text-xs font-medium text-zinc-500">Terminal</span>
                </div>
              </div>
              <div className="p-6 font-mono text-sm leading-relaxed">
                <p className="text-zinc-500 text-xs mb-4"># Three commands to secure any site</p>
                <div className="space-y-1">
                  <p><span className="text-zinc-500">$</span> <span className="text-violet-300">oauthpage</span> <span className="text-white">login</span></p>
                  <p className="text-emerald-400 pl- Authenticated successfully</p>2">
                </div>
                <div className="space-y-1 mt-4">
                  <p><span className="text-zinc-500">$</span> <span className="text-violet-300">oauthpage</span> <span className="text-white">add</span> <span className="text-amber-300">"My Site"</span> <span className="text-zinc-400">--slug my-site</span></p>
                  <p className="text-emerald-400 pl- Site created</p>2">
                </div>
                <div className="space-y-1 mt-4">
                  <p><span className="text-zinc-500">$</span> <span className="text-violet-300">oauthpage</span> <span className="text-white">deploy</span> <span className="text-amber-300">./dist</span> <span className="text-zinc-400">--site my-site</span></p>
                  <p className="text-zinc-500 pl- Uploading assets...</p>2">
                  <p className="text-emerald-400 pl- Deployed to <span className="text-violet-300">my-site.oauth.page</span></p>2">
                </div>
                <div className="space-y-1 mt-4">
                  <p><span className="text-zinc-500">$</span> <span className="text-violet-300">oauthpage</span> <span className="text-white">link create</span> <span className="text-zinc-400">my-site --ttl 1h</span></p>
                </div>                  <p className="text-indigo-400 pl-2">
              </div>
            </div>
          </div>
        </di        </di        
      {/* Pricing */}
      <section className="py-20 md:py-28 relative" id="pricing">
        <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
          <div ref={pricingRef} className="reveal reveal-in relative rounded-2xl border border-white/10 bg-zinc-900/70 backdrop-blur-sm p-8 sm:p-12 overflow-hidden text-center">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-16 bg-violet-600/10 blur-2xl pointer-events-none" />
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-400 mb-3">Pricing</p>
            <h2 className="text-2xl font-bold text-white mb-2">Free while in beta</h2>
            <p className="text-zinc-400 mb-8 text-sm">No credit card. No trial. Just start building.</p>
            <div className="flex justify-center items-baseline gap-2 mb-8">
              <span className="text-6xl font-bold text-white">$0</span>
              <span className="text-zinc-500 font-medium">/ month</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-2.5 text-left max-w-sm mx-auto mb-10">
              <PricingFeature text="10 sites, 50 MB total" />
              <PricingFeature text="500 deploys / month" />
              <PricingFeature text="1,000 views per site" />
              <PricingFeature text="GitHub + Google OAuth" />
              <PricingFeature text="Site preview screenshots" />
              <PricingFeature text="One-time links (beta)" />
            </div>
            <Link
              to="/login"
              className="group inline-flex items-center justify-ce              className="group inline-flex items-center justify-ce              clase text-sm font-semibold transition-all shadow-lg shadow-violet-900/40"
            >
              Get started free
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <p className="text-xs text-zinc-600 mt-5">Paid plans for teams coming after beta.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t       <footer className="border<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
              <Shield size={13} className="text-white" />
            </div>
            <span className="font-semibold text-sm text-white">OAuthPage</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-500">
            <Link to="/docs" className="hover:text-zinc-200 transition-colors">Documentation</Link>
            <Link to="/docs#status" className="hover:text-zinc-200 transition-colors">Status</Link>
            <Link to="/docs#privacy" className="hover:text-zinc-200 transition-colors">Privacy</Link>
            <Link to="/docs#terms" className="hover:text-zinc-200 transition-colors">Terms</Link>
            <a href="mailto:hello@oauth.page" className="hover:text-zinc-200 transition-colors">Contact</a>
          </div>
          <span className="text-xs text-zinc- {new Date().getFullYear()} OAuthPage</span>600">
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, iconBg, label, text }: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  text: string;
}) {
  return (
    <div className="reveal group rounded-2xl border border-white/8 bg-zinc-900/50 hover:bg    <div clashover:border-white/12 p-7 transition-all cursor-default">
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 ${iconBg}`}>
        {icon}
      </div>
      <h3 className="text-base font-semibold text-white mb-2">{label}</h3>
      <p className="text-zinc-400 text-sm leading-relaxed">{text}</p>
    </div>
  );
}

function AiFeature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        {icon}
        {title}
      </div>
      <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
    </div>
  );
}

function WorkflowItem({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="flex gap-4 group">
      <div c      <div c      <div c      <div c      <div c      <div c      <div c      <div c      <div c      <div c      <div c      <div c      <div c      <div c  nt-bold text-violet-400 font-mono">{num}</span>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-white mb-1 group-hover:text-violet-300 transition-colors">{title}</h4>
        <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function PricingFeature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2.5 py-2 px-3 rounded-lg bg-white/4 border border-white/6 hover:bg-white/6 transition-colors">
      <Check size={13} className="text-violet-400 flex-shrink-0" />
      <span className="text-sm text-zinc-300">{text}</span>
    </div>
  );
}
