import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Bot, Check, Cloud, Code2, Lock, Shield, Terminal, Zap, Globe, FileText, Copy, Sparkles } from "lucide-react";
import { WorkflowAnimation } from "../components/WorkflowAnimation";

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
    fetch("/api/stats").then((r) => r.ok ? r.json() : null).then((d) => d && setStats(d)).catch(() => {});
  }, []);

  const heroRef = useReveal();
  const workflowRef = useReveal();
  const trustRef = useReveal();
  const aiRef = useReveal();
  const useCaseRef = useReveal();
  const featRef = useReveal();
  const termRef = useReveal();
  const pricingRef = useReveal();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 relative overflow-hidden font-sans selection:bg-brand/30">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="hero-glow-1 absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-brand/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="hero-glow-2 absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-blue-500/5 blur-[100px] rounded-full mix-blend-screen" />
      </div>

      <header className="fixed top-4 left-0 right-0 mx-auto w-[calc(100%-2rem)] max-w-6xl z-50 flex items-center justify-between px-6 py-3 rounded-2xl glass-nav gap-2" style={{ animation: "fade-down 0.5s ease-out forwards" }}>
        <Link to="/" className="inline-flex items-center gap-2.5 group shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-brand to-brand-hover flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <Shield size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white group-hover:text-brand-light transition-colors hidden sm:block">OAuthPage</span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-8 shrink-0">
          <Link to="/docs" className="hidden md:block text-sm font-medium text-zinc-400 hover:text-white transition-colors">Docs</Link>
          <Link to="/login" className="hidden xs:block text-sm font-medium text-zinc-400 hover:text-white transition-colors whitespace-nowrap">Sign in</Link>
          <Link to="/login" className="px-4 py-2 rounded-xl bg-white text-zinc-950 text-xs sm:text-sm font-bold hover:bg-zinc-100 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] whitespace-nowrap">
            Get started
          </Link>
        </div>
      </header>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12 lg:px-8">
        <section className="pt-24 pb-20 lg:pt-32 lg:pb-36">
          <div ref={heroRef} className="reveal reveal-stagger text-center max-w-4xl mx-auto">
            <div className="reveal inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand/30 bg-brand/10 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
              </span>
              Built for the AI era
            </div>
            <h1 className="reveal text-5xl sm:text-6xl md:text-7xl tracking-tight font-bold mb-6 text-white leading-[1.1]">
              Gatekeep any site.<br />
              <span className="block mt-2 bg-gradient-to-br from-brand-400 via-white to-zinc-500 bg-clip-text text-transparent pb-2 italic">Zero code required.</span>
            </h1>
            <p className="reveal text-lg sm:text-xl text-zinc-100 font-semibold max-w-2xl mx-auto leading-relaxed mb-10 shadow-black/50 drop-shadow-sm">
              The easiest way to host private AI outputs, reports, and internal tools. Secure any website at the edge in seconds.
            </p>
            <div className="reveal flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link to="/login" className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-zinc-100 text-zinc-950 text-base font-semibold hover:bg-white hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                Start Securing for Free <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/docs" className="px-8 py-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-base font-medium hover:bg-zinc-800 hover:text-zinc-100 transition-all">View Documentation</Link>
            </div>
            {stats && (stats.sites > 0 || stats.deploys > 0) && (
              <div className="reveal inline-flex items-center gap-6 px-5 py-2.5 rounded-full border border-zinc-800 bg-zinc-900/40 text-sm text-zinc-400">
                <span className="flex items-center gap-2"><Globe size={14} className="text-brand-light" /><strong className="text-zinc-200">{stats.sites}</strong> sites deployed</span>
                <span className="w-px h-4 bg-zinc-700" />
                <span className="flex items-center gap-2"><Zap size={14} className="text-emerald-400" /><strong className="text-zinc-200">{stats.deploys.toLocaleString()}</strong> deployments</span>
              </div>
            )}

            {/* Floating Browser Mockup (Dark Version) */}
            <div className="reveal mt-10 md:mt-14 relative mx-auto max-w-4xl">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-2 md:p-3 shadow-2xl relative backdrop-blur-sm overflow-hidden">
                {/* Browser Bar */}
                <div className="flex items-center gap-2 px-4 pb-3 border-b border-zinc-800/60">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-zinc-800" />
                    <div className="w-3 h-3 rounded-full bg-zinc-800" />
                    <div className="w-3 h-3 rounded-full bg-zinc-800" />
                  </div>
                  <div className="mx-auto bg-zinc-800/80 text-zinc-500 text-[10px] px-3 py-1 rounded-md font-mono">dashboard.oauth.page</div>
                </div>
                {/* App Content */}
                <div className="bg-zinc-950/40 rounded-xl p-6 md:p-8 text-left mt-2 backdrop-blur-md border border-zinc-800/30">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-100">Your Sites</h3>
                      <p className="text-xs text-zinc-500">Manage access controls at the edge.</p>
                    </div>
                    <button className="bg-brand hover:bg-brand-hover text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors">+ Add Site</button>
                  </div>
                  {/* Mock List Item */}
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10 flex items-center justify-between mb-3 hover:border-brand/50 transition-colors group/item">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand/20 flex items-center justify-center text-brand-light border border-brand/30 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                        <Globe size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">Internal Wiki</h4>
                        <p className="text-[10px] text-zinc-400 font-mono mt-0.5">wiki.yourcompany.com</p>
                      </div>
                    </div>
                    <div className="w-10 h-5 bg-brand rounded-full relative shadow-[0_0_10px_rgba(139,92,246,0.5)]">
                      <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                    </div>
                  </div>
                  {/* Mock List Item 2 */}
                  <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.05] flex items-center justify-between opacity-60">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-zinc-800/50 flex items-center justify-center text-zinc-500 border border-zinc-700/30">
                        <Cloud size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-zinc-300">Staging Env</h4>
                        <p className="text-[10px] text-zinc-600 font-mono mt-0.5">staging.yourcompany.com</p>
                      </div>
                    </div>
                    <div className="w-10 h-5 bg-zinc-800 rounded-full relative">
                      <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-zinc-600 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Decorative blurred shapes */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand/20 rounded-full filter blur-3xl opacity-30 z-[-1]" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full filter blur-3xl opacity-20 z-[-1]" />
            </div>
          </div>
        </section>

        <section className="mb-16 lg:mb-24 max-w-6xl mx-auto">
          <p className="text-center text-sm font-medium text-zinc-500 uppercase tracking-wider mb-8">Why OAuthPage</p>
          <div ref={trustRef} className="reveal reveal-stagger grid grid-cols-1 md:grid-cols-3 gap-6">
            <TrustCard icon={<Cloud size={20} className="text-blue-400" />} label="Fast everywhere" text="Your sites load instantly from 300+ edge locations worldwide. No server to manage." />
            <TrustCard icon={<Lock size={20} className="text-brand-light" />} label="Private by default" text="Every page is locked until you approve someone. Visitors sign in with GitHub or Google." />
            <TrustCard icon={<Shield size={20} className="text-emerald-400" />} label="You decide who sees what" text="Approve, revoke, or send a self-destructing link. Full control, no guesswork." />
          </div>
        </section>

        <section id="workflow" className="mb-24 lg:mb-32 max-w-5xl mx-auto relative">
          <div className="absolute inset-0 -m-8 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.08)_0%,transparent_70%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(63,63,70,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(63,63,70,0.12)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />
          </div>
          <div ref={workflowRef} className="reveal reveal-in"><WorkflowAnimation /></div>
        </section>

        <section className="mb-8 lg:mb-12 max-w-6xl mx-auto">
          <div ref={useCaseRef} className="reveal-stagger">
            <p className="reveal text-center text-sm font-medium text-zinc-500 uppercase tracking-wider mb-6">What can you build?</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <UseCaseCard icon={<Zap size={20} className="text-brand-light" />} title="AI Dashboards" desc="Host agent-generated reports and data visualizations with built-in SSO." />
              <UseCaseCard icon={<Shield size={20} className="text-emerald-400" />} title="Internal Tools" desc="Securely share admin panels, internal prototypes, or data explorers." />
              <UseCaseCard icon={<FileText size={20} className="text-blue-400" />} title="Secure Docs" desc="Turn simple markdown files into professional, gated documentation sites." />
            </div>
          </div>
        </section>

        <section className="mb-8 lg:mb-12 max-w-5xl mx-auto">
          <div ref={aiRef} className="reveal reveal-in rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/5 via-zinc-900/50 to-zinc-950 p-8 sm:p-10 relative overflow-hidden shadow-2xl shadow-brand/5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand/10 blur-[80px] rounded-full" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/30 flex items-center justify-center"><Bot size={20} className="text-brand-light" /></div>
                <h2 className="text-2xl font-semibold text-zinc-100">Built for AI workflows</h2>
              </div>
              <p className="text-zinc-400 text-lg leading-relaxed max-w-3xl mb-8">AI agents generate reports, dashboards, and full websites — but sharing them securely is still a pain. OAuthPage gives your agents a <strong className="text-zinc-200">publish endpoint</strong> with access control built in.</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="space-y-2"><div className="flex items-center gap-2 text-sm font-medium text-zinc-200"><Code2 size={16} className="text-brand-light" />Any coding agent</div><p className="text-sm text-zinc-500">Claude Code, Codex, Cursor, Devin — any agent that builds HTML can deploy here.</p></div>
                <div className="space-y-2"><div className="flex items-center gap-2 text-sm font-medium text-zinc-200"><FileText size={16} className="text-blue-400" />Save output tokens</div><p className="text-sm text-zinc-500">Ask your AI for just Markdown. We'll render it as a professional site automatically.</p></div>
                <div className="space-y-2"><div className="flex items-center gap-2 text-sm font-medium text-zinc-200"><Terminal size={16} className="text-emerald-400" />CLI-first</div><p className="text-sm text-zinc-500">One command to deploy. JSON output for piping. Built for scripts and automation.</p></div>
                <div className="space-y-2"><div className="flex items-center gap-2 text-sm font-medium text-zinc-200"><Shield size={16} className="text-amber-400" />Private by default</div><p className="text-sm text-zinc-500">No more public Vercel links for sensitive AI outputs. Every page is gated.</p></div>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:bg-zinc-800/60 transition-colors">
                <div className="flex items-center gap-3 flex-shrink-0"><span className="text-2xl">🐾</span><div><p className="text-sm font-semibold text-zinc-200">Works with OpenClaw</p><p className="text-xs text-zinc-500">AI assistant framework</p></div></div>
                <div className="sm:border-l sm:border-zinc-700 sm:pl-4 flex-1"><p className="text-sm text-zinc-400">OpenClaw agents use <code className="text-zinc-300 bg-zinc-800 px-1.5 py-0.5 rounded text-xs">opage deploy</code> to publish artifacts, reports, and dashboards directly — then share secure links in chat. No manual steps.</p></div>
              </div>
            </div>
          </div>
        </section>

        <section id="workflow-steps" className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center mb-24 lg:mb-32">
          <div ref={featRef} className="reveal reveal-left space-y-8 pr-0 lg:pr-12">
            <div><h2 className="text-3xl font-semibold mb-4 text-zinc-100">Three commands. Done.</h2><p className="text-zinc-400 text-lg leading-relaxed">No config files. No auth setup. No infrastructure to manage.</p></div>
            <ul className="space-y-6">
              <FeatureItem title="Upload anything" desc="HTML, React apps, reports, dashboards — if a browser can open it, OAuthPage can host it." />
              <FeatureItem title="Share the link" desc="Send your URL to a client or teammate. They sign in, you approve — that's it." />
              <FeatureItem title="Stay in control" desc="Revoke access anytime. Send one-time links that expire after a single use." />
            </ul>
          </div>
          <div ref={termRef} className="reveal reveal-right relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-brand/10 to-transparent rounded-2xl blur-2xl" />
            <div className="relative rounded-2xl border border-zinc-700/60 bg-zinc-900/60 p-1 shadow-2xl hover:border-zinc-600/60 transition-colors">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800/80 bg-zinc-900/80 rounded-t-xl">
                <Terminal size={16} className="text-zinc-400" /><span className="text-sm font-medium text-zinc-300">Terminal</span>
                <div className="ml-auto flex gap-1.5"><div className="w-3 h-3 rounded-full bg-zinc-700" /><div className="w-3 h-3 rounded-full bg-zinc-700" /><div className="w-3 h-3 rounded-full bg-zinc-700" /></div>
              </div>
              <div className="p-6 overflow-auto">
                <p className="text-xs text-zinc-500 mb-3">Each line is a separate command:</p>
                <pre className="text-sm text-zinc-300 font-mono leading-relaxed whitespace-pre">{`$ opage login\n✔ Authenticated successfully\n\n$ opage add "My Site" --slug my-site\n✔ Site created\n\n$ opage deploy ./dist --site my-site\n⠋ Uploading assets...\n✔ Deployed to my-site.oauth.page\n\n$ opage link create my-site --ttl 1h\n🔗 my-site.oauth.page/_otl/...`}</pre>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-3xl mx-auto text-center mb-24 lg:mb-32">
          <div ref={pricingRef} className="reveal reveal-in rounded-3xl border border-zinc-800 bg-zinc-900/30 p-8 sm:p-12 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-brand/50 to-transparent" />
            <h2 className="text-2xl font-semibold mb-2 text-zinc-100">Free while in beta</h2>
            <p className="text-zinc-400 mb-8">No credit card. No trial. Just start building.</p>
            <div className="flex justify-center items-baseline gap-2 mb-8"><span className="text-5xl font-bold text-zinc-100">$0</span><span className="text-zinc-500 font-medium">/ month</span></div>
            <div className="grid sm:grid-cols-2 gap-4 text-left max-w-xl mx-auto mb-10">
              <PricingFeature text="100 sites, 50 MB total" />
              <PricingFeature text="500 deploys / month" />
              <PricingFeature text="1,000 views per site" />
              <PricingFeature text="GitHub + Google OAuth" />
              <PricingFeature text="Site preview screenshots" />
              <PricingFeature text="One-time links (beta)" />
            </div>
            <Link to="/login" className="group inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 rounded-xl bg-zinc-100 text-zinc-950 text-base font-semibold hover:bg-white hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              Get started free <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="text-xs text-zinc-500 mt-6">Paid plans for teams coming after beta.</p>
          </div>
        </section>

        <footer className="pt-8 border-t border-zinc-700/50 flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-zinc-500">
          <div className="flex items-center gap-2 text-zinc-400 hover:text-zinc-300 transition-colors"><Shield size={16} /><span className="font-medium">OAuthPage</span></div>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link to="/docs" className="hover:text-zinc-300 transition-colors">Documentation</Link>
            <Link to="/docs#status" className="hover:text-zinc-300 transition-colors">System Status</Link>
            <Link to="/docs#privacy" className="hover:text-zinc-300 transition-colors">Privacy</Link>
            <Link to="/docs#terms" className="hover:text-zinc-300 transition-colors">Terms</Link>
            <a href="mailto:hello@oauth.page" className="hover:text-zinc-300 transition-colors">Contact</a>
          </div>
          <span className="text-xs">© {new Date().getFullYear()} OAuthPage. All rights reserved.</span>
        </footer>
      </div>
    </div>
  );
}

function TrustCard({ icon, label, text }: { icon: React.ReactNode; label: string; text: string }) {
  return (
    <div className="reveal group rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-8 hover:bg-zinc-900/50 hover:border-zinc-700/80 transition-all cursor-default">
      <div className="relative w-12 h-12 rounded-xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center mb-5 shadow-inner group-hover:scale-110 transition-transform duration-300"><div className="relative">{icon}</div></div>
      <h3 className="text-lg font-semibold text-zinc-100 mb-2 group-hover:text-brand-light transition-colors">{label}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{text}</p>
    </div>
  );
}

function FeatureItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex gap-4 group">
      <div className="mt-1 w-6 h-6 rounded-full bg-brand/10 text-brand-light flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-brand/20 transition-all"><Check size={14} strokeWidth={3} /></div>
      <div><h4 className="text-base font-semibold text-zinc-200 mb-1 group-hover:text-white transition-colors">{title}</h4><p className="text-sm text-zinc-400 leading-relaxed">{desc}</p></div>
    </div>
  );
}

function UseCaseCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="reveal group rounded-2xl border border-zinc-800/80 bg-zinc-900/10 p-6 hover:bg-zinc-900/30 transition-all">
      <div className="w-10 h-10 rounded-lg bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-lg font-semibold text-zinc-100 mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function PricingFeature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/30 border border-zinc-800/50 hover:bg-zinc-800/50 transition-colors"><Check size={16} className="text-brand-light" /><span className="text-sm text-zinc-300">{text}</span></div>
  );
}
