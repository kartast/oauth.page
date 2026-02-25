import { Link } from "react-router-dom";
import { ArrowRight, Check, Cloud, Lock, Shield, Terminal } from "lucide-react";
import { WorkflowAnimation } from "../components/WorkflowAnimation";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 relative overflow-hidden font-sans selection:bg-violet-500/30">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-brand-light/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-blue-500/5 blur-[100px] rounded-full mix-blend-screen" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-8 sm:py-12 lg:px-8">
        {/* Nav */}
        <header className="flex items-center justify-between mb-16 lg:mb-24">
          <div className="inline-flex items-center gap-2.5 text-base font-medium text-zinc-200">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 flex items-center justify-center shadow-inner">
              <Shield size={16} className="text-brand-light" />
            </div>
            OAuthPage
          </div>

          <div className="flex items-center gap-6 text-sm font-medium">
            <Link to="/docs" className="text-zinc-400 hover:text-zinc-200 transition-colors">
              Documentation
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/80 text-zinc-100 transition-all shadow-sm"
            >
              Sign in
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section className="mb-20 lg:mb-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand/30 bg-brand/10 text-brand-light text-xs font-semibold uppercase tracking-wider mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-light opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
              </span>
              Secure LLM Publishing
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl tracking-tight font-semibold mb-8 text-zinc-100">
              Publish AI sites with{" "}
              <span className="block mt-2 bg-gradient-to-br from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent pb-2">
                startup-grade security
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-10">
              Deploy LLM reports, dashboards, and microsites to private URLs.
              Control every viewer with OAuth approvals, revokes, and one-time links.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/login"
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-100 text-zinc-950 text-base font-semibold hover:bg-white hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              >
                Start building free
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#workflow"
                className="px-6 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-base font-medium hover:bg-zinc-800 hover:text-zinc-100 transition-all"
              >
                Explore workflow
              </a>
            </div>
          </div>
        </section>

        {/* SVG Animation Hero Banner */}
        <section className="mb-24 lg:mb-32 max-w-5xl mx-auto">
          <WorkflowAnimation />
        </section>

        {/* Value Proposition Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24 lg:mb-32 max-w-6xl mx-auto">
          <TrustCard 
            icon={<Cloud size={20} className="text-blue-400" />} 
            label="Edge infrastructure" 
            text="Deployed globally on Cloudflare runtime with R2 storage for millisecond latency." 
          />
          <TrustCard 
            icon={<Lock size={20} className="text-brand-light" />} 
            label="OAuth by default" 
            text="Every site is secured behind GitHub or Google authentication instantly." 
          />
          <TrustCard 
            icon={<Shield size={20} className="text-emerald-400" />} 
            label="Owner controls" 
            text="Manage access explicitly. Approve, revoke, or issue self-destructing links." 
          />
        </section>

        {/* Two-column feature showcase */}
        <section id="workflow" className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center mb-24 lg:mb-32">
          <div className="space-y-8 pr-0 lg:pr-12">
            <div>
              <h2 className="text-3xl font-semibold mb-4 text-zinc-100">Built for modern AI workflows</h2>
              <p className="text-zinc-400 text-lg leading-relaxed">
                Stop exposing sensitive AI-generated content on public links or wrestling with complex auth setups.
              </p>
            </div>
            
            <ul className="space-y-6">
              <FeatureItem 
                title="Publish in minutes" 
                desc="Push LLM-generated artifacts to private URLs directly from your terminal."
              />
              <FeatureItem 
                title="Seamless Sharing" 
                desc="Share with clients and teammates securely without exposing raw outputs publicly."
              />
              <FeatureItem 
                title="Granular Control" 
                desc="Keep absolute control over your intellectual property with explicit access decisions."
              />
            </ul>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-brand/10 to-transparent rounded-2xl blur-2xl" />
            <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/60 p-1 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800/80 bg-zinc-900/80 rounded-t-xl">
                <Terminal size={16} className="text-zinc-400" />
                <span className="text-sm font-medium text-zinc-300">Terminal</span>
                <div className="ml-auto flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-zinc-700" />
                  <div className="w-3 h-3 rounded-full bg-zinc-700" />
                  <div className="w-3 h-3 rounded-full bg-zinc-700" />
                </div>
              </div>
              <div className="p-6 overflow-auto">
                <pre className="text-sm text-zinc-300 font-mono leading-relaxed">
<span className="text-zinc-500">$</span> opage login
<span className="text-emerald-400">✔</span> Authenticated successfully

<span className="text-zinc-500">$</span> opage add "My Site" --slug my-site
<span className="text-emerald-400">✔</span> Site created

<span className="text-zinc-500">$</span> opage deploy ./dist --site my-site
<span className="text-brand-light">⠋</span> Uploading assets...
<span className="text-emerald-400">✔</span> Deployed to <span className="underline decoration-zinc-700 underline-offset-4">my-site.oauth.page</span>

<span className="text-zinc-500">$</span> opage link create my-site --ttl 1h
<span className="text-blue-400">🔗</span> <span className="underline decoration-zinc-700 underline-offset-4">my-site.oauth.page/_otl/...</span>
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing MVP */}
        <section className="max-w-3xl mx-auto text-center mb-24 lg:mb-32">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-8 sm:p-12 relative overflow-hidden backdrop-blur-sm">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-brand/50 to-transparent" />
            
            <h2 className="text-2xl font-semibold mb-2 text-zinc-100">Start with our MVP Tier</h2>
            <p className="text-zinc-400 mb-8">Everything you need to secure your AI artifacts today.</p>
            
            <div className="flex justify-center items-baseline gap-2 mb-8">
              <span className="text-5xl font-bold text-zinc-100">$0</span>
              <span className="text-zinc-500 font-medium">/ month</span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-left max-w-xl mx-auto mb-10">
              <PricingFeature text="25 MB per deployment" />
              <PricingFeature text="10 active deployments" />
              <PricingFeature text="OAuth access control" />
              <PricingFeature text="One-time links (beta)" />
            </div>

            <Link
              to="/login"
              className="inline-block w-full sm:w-auto px-8 py-3.5 rounded-xl bg-zinc-100 text-zinc-900 text-sm font-semibold hover:bg-white transition-colors"
            >
              Create free account
            </Link>
            <p className="text-xs text-zinc-500 mt-6">Paid plans for teams coming after beta.</p>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-8 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-zinc-500">
          <div className="flex items-center gap-2 text-zinc-400">
            <Shield size={16} />
            <span className="font-medium">OAuthPage</span>
          </div>
          
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
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-6 hover:bg-zinc-900/50 transition-colors">
      <div className="w-12 h-12 rounded-xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center mb-5 shadow-inner">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-zinc-100 mb-2">{label}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{text}</p>
    </div>
  );
}

function FeatureItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="mt-1 w-6 h-6 rounded-full bg-brand/10 text-brand-light flex items-center justify-center flex-shrink-0">
        <Check size={14} strokeWidth={3} />
      </div>
      <div>
        <h4 className="text-base font-semibold text-zinc-200 mb-1">{title}</h4>
        <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function PricingFeature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/30 border border-zinc-800/50">
      <Check size={16} className="text-brand-light" />
      <span className="text-sm text-zinc-300">{text}</span>
    </div>
  );
}
