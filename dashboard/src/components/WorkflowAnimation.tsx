export function WorkflowAnimation() {
  return (
    <div className="relative w-full bg-zinc-950/50 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-zinc-900/50 pointer-events-none" />

      {/* Desktop: horizontal 3-panel flow */}
      <div className="hidden md:flex items-center justify-center gap-4 lg:gap-6 p-6 lg:p-10">
        <Panel1Terminal />
        <FlowArrow />
        <Panel2Shield />
        <FlowArrow />
        <Panel3Output />
      </div>

      {/* Mobile: vertical 3-panel flow */}
      <div className="flex md:hidden flex-col items-center gap-4 p-5">
        <Panel1Terminal />
        <FlowArrowDown />
        <Panel2Shield />
        <FlowArrowDown />
        <Panel3Output />
      </div>

      {/* Labels */}
      <div className="hidden md:flex justify-center gap-4 lg:gap-6 pb-6 px-6 lg:px-10">
        <StepLabel step="1" text="Deploy from CLI" className="w-[240px]" />
        <div className="w-8 lg:w-12" />
        <StepLabel step="2" text="OAuth gate" className="w-[160px]" />
        <div className="w-8 lg:w-12" />
        <StepLabel step="3" text="Private access" className="w-[240px]" />
      </div>
    </div>
  );
}

/* ─── Step label ─── */
function StepLabel({ step, text, className }: { step: string; text: string; className?: string }) {
  return (
    <div className={`text-center ${className || ""}`}>
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500">
        <span className="w-4 h-4 rounded-full bg-brand/20 text-brand-light flex items-center justify-center text-[10px] font-bold">{step}</span>
        {text}
      </span>
    </div>
  );
}

/* ─── Flow arrows ─── */
function FlowArrow() {
  return (
    <div className="flex-shrink-0 w-8 lg:w-12 flex items-center justify-center">
      <svg width="40" height="20" viewBox="0 0 40 20" fill="none" className="w-full">
        <defs>
          <linearGradient id="arrow-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3f3f46" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <line x1="0" y1="10" x2="32" y2="10" stroke="url(#arrow-grad)" strokeWidth="2" strokeDasharray="4,3" />
        <path d="M30 5 L38 10 L30 15" stroke="#8b5cf6" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function FlowArrowDown() {
  return (
    <div className="flex-shrink-0 h-6 flex flex-col items-center justify-center">
      <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
        <line x1="10" y1="0" x2="10" y2="16" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="4,3" />
        <path d="M5 14 L10 22 L15 14" stroke="#8b5cf6" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/* ─── Panel 1: Terminal ─── */
function Panel1Terminal() {
  return (
    <div className="w-full md:w-[240px] flex-shrink-0 rounded-xl border border-zinc-800 bg-zinc-900/80 overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800/80 bg-zinc-900">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        </div>
        <span className="text-[11px] text-zinc-500 font-mono ml-1">~/project</span>
      </div>
      {/* Terminal content */}
      <div className="p-3 font-mono text-[11px] leading-[1.6] text-zinc-300 space-y-2.5">
        <div>
          <div><span className="text-zinc-500">$</span> opage deploy ./dist</div>
          <div className="text-emerald-400">✔ Deployed</div>
        </div>
        <div>
          <div><span className="text-zinc-500">$</span> opage link create</div>
          <div className="text-blue-400">🔗 slug.oauth.page/_otl/...</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Panel 2: Shield ─── */
function Panel2Shield() {
  return (
    <div className="flex-shrink-0 w-[120px] md:w-[160px] h-[120px] md:h-[140px] rounded-xl border border-zinc-800 bg-zinc-900/60 flex flex-col items-center justify-center gap-3 relative overflow-hidden">
      {/* Pulsing ring */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-20 h-20 rounded-full border-2 border-brand/20 animate-ping opacity-20" />
      </div>
      {/* Shield */}
      <div className="relative">
        <svg width="48" height="56" viewBox="0 0 48 56" fill="none">
          <path
            d="M24 2 C24 2 42 10 42 24 C42 38 34 50 24 54 C14 50 6 38 6 24 C6 10 24 2 24 2Z"
            fill="#18181b"
            stroke="#8b5cf6"
            strokeWidth="2"
          />
          <path
            d="M17 28 L22 33 L32 21"
            stroke="#10b981"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {/* Provider badges */}
      <div className="flex gap-2">
        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" fill="#333"/></svg>
        </div>
        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32l3.57 2.77c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
        </div>
      </div>
      {/* Label on mobile */}
      <span className="md:hidden text-[10px] text-zinc-500 font-medium">OAuth Gate</span>
    </div>
  );
}

/* ─── Panel 3: Browser + Mobile ─── */
function Panel3Output() {
  return (
    <div className="w-full md:w-[240px] flex-shrink-0 flex gap-3 items-end">
      {/* Desktop browser */}
      <div className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900/80 overflow-hidden">
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-zinc-800/80 bg-zinc-900">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-zinc-600" />
            <div className="w-2 h-2 rounded-full bg-zinc-600" />
            <div className="w-2 h-2 rounded-full bg-zinc-600" />
          </div>
          <div className="flex-1 mx-2 h-4 rounded bg-zinc-800 flex items-center px-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mr-1" />
            <span className="text-[8px] text-zinc-500 font-mono truncate">my-site.oauth.page</span>
          </div>
        </div>
        <div className="p-3 space-y-2">
          <div className="h-2 w-16 bg-zinc-700 rounded" />
          <div className="h-1.5 w-full bg-zinc-800 rounded" />
          <div className="h-1.5 w-4/5 bg-zinc-800 rounded" />
          <div className="h-1.5 w-full bg-zinc-800 rounded" />
          <div className="flex gap-2 mt-3">
            <div className="h-5 w-12 rounded bg-brand/30 border border-brand/40" />
            <div className="h-5 w-12 rounded bg-zinc-800" />
          </div>
        </div>
      </div>

      {/* Mobile phone */}
      <div className="w-14 flex-shrink-0 rounded-xl border-2 border-zinc-700 bg-zinc-900 overflow-hidden">
        <div className="flex justify-center py-1">
          <div className="w-6 h-1 rounded bg-zinc-700" />
        </div>
        <div className="px-2 pb-2 space-y-1.5">
          <div className="w-6 h-6 mx-auto rounded-full bg-brand/20 border border-brand/40 flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
              <path d="M4 8 L7 11 L12 5" stroke="#8b5cf6" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="h-1 w-full bg-zinc-800 rounded" />
          <div className="h-1 w-3/4 bg-zinc-800 rounded" />
          <div className="h-3 w-full rounded bg-brand text-center">
            <span className="text-[5px] text-white leading-[12px]">Access Granted</span>
          </div>
        </div>
      </div>
    </div>
  );
}
