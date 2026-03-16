import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Bot, Check, Cloud, Code2, Lock, Shield, Terminal, Zap, Globe } from "lucide-react";

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
  const trustRef = useReveal();
  const aiRef = useReveal();
  const termRef = useReveal();
  const pricingRef = useReveal();

  return (
    <div className="min-h-screen bg-white text-slate-900 relative overflow-hidden font-sans selection:bg-brand-200/50">
      {/* ── Glass Navigation ── */}
      <nav className="fixed w-full z-50 glass-nav transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-blue-700 flex items-center justify-center text-white font-bold shadow-lg">
                <Shield size={16} />
              </div>
              <span className="font-serif font-semibold text-xl tracking-tight text-slate-900">OAuthPage</span>
            </Link>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <a href="#features" className="text-slate-700 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">Features</a>
                <a href="#pricing" className="text-slate-700 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">Pricing</a>
                <Link to="/docs" className="text-slate-700 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">Docs</Link>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-slate-700 hover:text-slate-900 px-4 py-2 text-sm font-medium transition-colors hidden xs:block">Login</Link>
              <Link to="/login" className="bg-slate-900 text-white hover:bg-slate-800 px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">Get Started</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="hero-bg pt-32 pb-20 md:pt-40 md:pb-32 px-4 relative">
        <div ref={heroRef} className="reveal reveal-stagger max-w-5xl mx-auto text-center relative z-10">
          <div className="reveal inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-white/80 shadow-sm text-xs font-medium text-slate-800 mb-8">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-600"></span>
            </span>
            Private hosting for AI outputs
          </div>

          <h1 className="reveal text-5xl md:text-7xl font-serif text-slate-900 tracking-tight leading-tight mb-6">
            Gatekeep any site.<br />
            <span className="italic text-brand-900">Zero code required.</span>
          </h1>

          <p className="reveal text-lg md:text-xl text-slate-700 mb-10 max-w-2xl mx-auto font-light">
            OAuthPage is an edge proxy SaaS that puts a secure authentication layer in front of your website in seconds. No backend changes, no SDKs to install.
          </p>

          <div className="reveal flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link to="/login" className="w-full sm:w-auto bg-slate-900 text-white hover:bg-slate-800 px-8 py-4 rounded-full text-base font-medium transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 inline-flex items-center justify-center gap-2">
              Start Securing for Free <ArrowRight size={18} />
            </Link>
            <Link to="/docs" className="w-full sm:w-auto glass-card text-slate-900 hover:bg-white/60 px-8 py-4 rounded-full text-base font-medium transition-all shadow-md hover:shadow-lg inline-flex items-center justify-center">
              View Documentation
            </Link>
          </div>

          {stats && (stats.sites > 0 || stats.deploys > 0) && (
            <div className="reveal inline-flex items-center gap-6 px-5 py-2.5 rounded-full glass-card text-sm text-slate-600">
              <span className="flex items-center gap-2"><Globe size={14} className="text-brand-600" /><strong className="text-slate-900">{stats.sites}</strong> sites deployed</span>
              <span className="w-px h-4 bg-slate-300" />
              <span className="flex items-center gap-2"><Zap size={14} className="text-emerald-500" /><strong className="text-slate-900">{stats.deploys.toLocaleString()}</strong> deployments</span>
            </div>
          )}

          {/* Floating Browser Mockup */}
          <div className="reveal mt-12 md:mt-20 relative mx-auto max-w-4xl">
            <div className="glass-card rounded-2xl p-2 md:p-4 shadow-2xl relative animate-float">
              {/* Browser Bar */}
              <div className="flex items-center gap-2 px-4 pb-4 border-b border-slate-200/40">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <div className="mx-auto bg-slate-100/80 text-slate-500 text-xs px-3 py-1 rounded-md font-mono">dashboard.oauth.page</div>
              </div>
              {/* App Content */}
              <div className="bg-white/60 rounded-xl p-6 md:p-10 text-left mt-2 backdrop-blur-md">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="font-serif text-2xl text-slate-900">Your Sites</h3>
                    <p className="text-sm text-slate-500">Manage access controls at the edge.</p>
                  </div>
                  <button className="bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm">+ Add Site</button>
                </div>
                {/* Mock List Item */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                      <Globe size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">Internal Wiki</h4>
                      <p className="text-xs text-slate-500 font-mono mt-1">wiki.yourcompany.com</p>
                    </div>
                  </div>
                  <div className="w-12 h-6 bg-brand-500 rounded-full relative shadow-inner">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow"></div>
                  </div>
                </div>
                {/* Mock List Item 2 */}
                <div className="bg-white/50 rounded-xl p-5 border border-slate-100 flex items-center justify-between opacity-70">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <Cloud size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">Staging Env</h4>
                      <p className="text-xs text-slate-500 font-mono mt-1">staging.yourcompany.com</p>
                    </div>
                  </div>
                  <div className="w-12 h-6 bg-slate-200 rounded-full relative shadow-inner">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow"></div>
                  </div>
                </div>
              </div>
            </div>
            {/* Decorative blurred shapes */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-200 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-float-delayed z-[-1]"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-200 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-float z-[-1]"></div>
          </div>
        </div>
      </section>

      {/* ── Features / Value Prop ── */}
      <section className="py-16 md:py-24 bg-white" id="features">
        <div ref={trustRef} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="reveal text-center max-w-3xl mx-auto mb-12 md:mb-16">
            <h2 className="font-serif text-3xl md:text-4xl text-slate-900 mb-4">Enterprise access control, zero setup.</h2>
            <p className="text-base md:text-lg text-slate-600">Stop writing authentication logic for every internal tool. Route your traffic through OAuthPage and secure it at the edge instantly.</p>
          </div>

          <div className="reveal-stagger grid md:grid-cols-3 gap-6 md:gap-8">
            <TrustCard
              icon={<Zap size={24} className="text-brand-600" />}
              label="Lightning Fast Edge"
              text="Deployed on Cloudflare Workers. Authentication happens at the edge, globally distributed, adding virtually zero latency."
              hoverColor="hover:bg-brand-50"
            />
            <TrustCard
              icon={<Lock size={24} className="text-indigo-600" />}
              label="Bring Your Provider"
              text="Connect Google Workspace, GitHub, Okta, or any custom OpenID Connect provider with a few clicks."
              hoverColor="hover:bg-indigo-50"
            />
            <TrustCard
              icon={<Code2 size={24} className="text-emerald-600" />}
              label="Zero Application Code"
              text="No SDKs. No library updates. The proxy handles the OAuth flow and forwards authenticated requests seamlessly."
              hoverColor="hover:bg-emerald-50"
            />
          </div>
        </div>
      </section>


      {/* ── AI Workflows Section ── */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div ref={aiRef} className="reveal reveal-in rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-100 blur-[80px] rounded-full opacity-50" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center"><Bot size={20} className="text-brand-600" /></div>
                <h2 className="text-2xl font-semibold text-slate-900">Built for AI workflows</h2>
              </div>
              <p className="text-slate-600 text-lg leading-relaxed max-w-3xl mb-8">AI agents generate reports, dashboards, and full websites — but sharing them securely is still a pain. OAuthPage gives your agents a <strong className="text-slate-900">publish endpoint</strong> with access control built in.</p>
              <div className="grid sm:grid-cols-3 gap-6 mb-8">
                <div className="space-y-2"><div className="flex items-center gap-2 text-sm font-medium text-slate-900"><Code2 size={16} className="text-brand-600" />Any coding agent</div><p className="text-sm text-slate-500">Claude Code, Codex, Cursor, Devin — any agent that builds HTML can deploy here.</p></div>
                <div className="space-y-2"><div className="flex items-center gap-2 text-sm font-medium text-slate-900"><Terminal size={16} className="text-emerald-500" />CLI-first</div><p className="text-sm text-slate-500">One command to deploy. JSON output for piping. Built for scripts and automation.</p></div>
                <div className="space-y-2"><div className="flex items-center gap-2 text-sm font-medium text-slate-900"><Shield size={16} className="text-amber-500" />Private by default</div><p className="text-sm text-slate-500">No more public Vercel links for sensitive AI outputs. Every page is gated.</p></div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3 flex-shrink-0"><span className="text-2xl">🐾</span><div><p className="text-sm font-semibold text-slate-900">Works with OpenClaw</p><p className="text-xs text-slate-500">AI assistant framework</p></div></div>
                <div className="sm:border-l sm:border-slate-200 sm:pl-4 flex-1"><p className="text-sm text-slate-600">OpenClaw agents use <code className="text-slate-900 bg-slate-200 px-1.5 py-0.5 rounded text-xs">opage deploy</code> to publish artifacts, reports, and dashboards directly — then share secure links in chat. No manual steps.</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Terminal / Features Side-by-Side ── */}
      <section id="workflow" className="py-16 md:py-24 bg-white">
        <div ref={termRef} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <div className="reveal reveal-left space-y-8 pr-0 lg:pr-12">
            <div><h2 className="text-3xl font-serif font-semibold mb-4 text-slate-900">Three commands. Done.</h2><p className="text-slate-600 text-lg leading-relaxed">No config files. No auth setup. No infrastructure to manage.</p></div>
            <ul className="space-y-6">
              <FeatureItem title="Upload anything" desc="HTML, React apps, reports, dashboards — if a browser can open it, OAuthPage can host it." />
              <FeatureItem title="Share the link" desc="Send your URL to a client or teammate. They sign in, you approve — that's it." />
              <FeatureItem title="Stay in control" desc="Revoke access anytime. Send one-time links that expire after a single use." />
            </ul>
          </div>
          <div className="reveal reveal-right relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-100/50 to-transparent rounded-2xl blur-2xl" />
            <div className="relative rounded-2xl border border-slate-200 bg-slate-900 p-1 shadow-2xl hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 bg-slate-900 rounded-t-xl">
                <Terminal size={16} className="text-slate-400" /><span className="text-sm font-medium text-slate-300">Terminal</span>
                <div className="ml-auto flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400" /><div className="w-3 h-3 rounded-full bg-amber-400" /><div className="w-3 h-3 rounded-full bg-green-400" /></div>
              </div>
              <div className="p-6 overflow-auto">
                <p className="text-xs text-slate-500 mb-3">Each line is a separate command:</p>
                <pre className="text-sm text-slate-300 font-mono leading-relaxed whitespace-pre">{`$ opage login\n✔ Authenticated successfully\n\n$ opage add "My Site" --slug my-site\n✔ Site created\n\n$ opage deploy ./dist --site my-site\n⠋ Uploading assets...\n✔ Deployed to my-site.oauth.page\n\n$ opage link create my-site --ttl 1h\n🔗 my-site.oauth.page/_otl/...`}</pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing Section ── */}
      <section className="py-16 md:py-24 bg-slate-50" id="pricing">
        <div className="max-w-3xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div ref={pricingRef} className="reveal reveal-in rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-400/50 to-transparent" />
            <h2 className="text-2xl font-serif font-semibold mb-2 text-slate-900">Free while in beta</h2>
            <p className="text-slate-500 mb-8">No credit card. No trial. Just start building.</p>
            <div className="flex justify-center items-baseline gap-2 mb-8"><span className="text-5xl font-bold text-slate-900">$0</span><span className="text-slate-500 font-medium">/ month</span></div>
            <div className="grid sm:grid-cols-2 gap-4 text-left max-w-xl mx-auto mb-10">
              <PricingFeature text="10 sites, 50 MB total" />
              <PricingFeature text="500 deploys / month" />
              <PricingFeature text="1,000 views per site" />
              <PricingFeature text="GitHub + Google OAuth" />
              <PricingFeature text="Site preview screenshots" />
              <PricingFeature text="One-time links (beta)" />
            </div>
            <Link to="/login" className="group inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 rounded-full bg-slate-900 text-white text-base font-semibold hover:bg-slate-800 hover:scale-[1.02] transition-all shadow-lg">
              Get started free <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="text-xs text-slate-400 mt-6">Paid plans for teams coming after beta.</p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-50 py-12 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-blue-700 flex items-center justify-center text-white shadow-sm">
              <Shield size={13} />
            </div>
            <span className="font-serif font-semibold text-lg text-slate-900">OAuthPage</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
            <Link to="/docs" className="hover:text-slate-900 transition-colors">Documentation</Link>
            <Link to="/docs#status" className="hover:text-slate-900 transition-colors">System Status</Link>
            <Link to="/docs#privacy" className="hover:text-slate-900 transition-colors">Privacy</Link>
            <Link to="/docs#terms" className="hover:text-slate-900 transition-colors">Terms</Link>
            <a href="mailto:hello@oauth.page" className="hover:text-slate-900 transition-colors">Contact</a>
          </div>
          <span className="text-xs text-slate-400">© {new Date().getFullYear()} OAuthPage. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}

function TrustCard({ icon, label, text, hoverColor }: { icon: React.ReactNode; label: string; text: string; hoverColor: string }) {
  return (
    <div className={`reveal bg-slate-50 rounded-2xl p-8 ${hoverColor} transition-colors border border-slate-100 cursor-default group`}>
      <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-3">{label}</h3>
      <p className="text-slate-600 leading-relaxed">{text}</p>
    </div>
  );
}

function FeatureItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex gap-4 group">
      <div className="mt-1 w-6 h-6 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-brand-100 transition-all"><Check size={14} strokeWidth={3} /></div>
      <div><h4 className="text-base font-semibold text-slate-900 mb-1 group-hover:text-brand-700 transition-colors">{title}</h4><p className="text-sm text-slate-500 leading-relaxed">{desc}</p></div>
    </div>
  );
}

function PricingFeature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors"><Check size={16} className="text-brand-600" /><span className="text-sm text-slate-700">{text}</span></div>
  );
}
