import { motion } from "framer-motion";

export function WorkflowAnimation() {
  return (
    <div className="relative w-full aspect-[16/10] sm:aspect-[21/9] lg:aspect-[24/9] bg-zinc-950/40 rounded-3xl border border-zinc-800/80 overflow-hidden shadow-2xl flex items-center justify-center p-2 sm:p-6 backdrop-blur-sm group">
      
      {/* Dynamic Background Glows */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand/5 via-transparent to-emerald-500/5 pointer-events-none transition-opacity duration-1000 group-hover:opacity-100 opacity-50" />
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-brand/10 blur-[100px] rounded-full -translate-y-1/2" />
      <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -translate-y-1/2" />

      <svg className="w-full h-full drop-shadow-2xl" viewBox="0 0 1000 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="beam-left" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="1" />
            <stop offset="100%" stopColor="#d8b4fe" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="beam-right" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
            <stop offset="50%" stopColor="#34d399" stopOpacity="1" />
            <stop offset="100%" stopColor="#6ee7b7" stopOpacity="0" />
          </linearGradient>

          <filter id="glow-brand" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="glow-emerald" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="heavy-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <linearGradient id="glass-panel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#27272a" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#18181b" stopOpacity="0.9" />
          </linearGradient>

          <linearGradient id="terminal-header" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3f3f46" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#27272a" stopOpacity="0.9" />
          </linearGradient>

          <style>
            {`
              @keyframes dash { to { stroke-dashoffset: -40; } }
              @keyframes type-text {
                0%, 15% { opacity: 0; transform: translateY(4px); }
                16%, 100% { opacity: 1; transform: translateY(0); }
              }
              @keyframes pulse-ring {
                0% { transform: scale(0.95) rotate(0deg); opacity: 0.5; }
                50% { transform: scale(1.05) rotate(180deg); opacity: 1; }
                100% { transform: scale(0.95) rotate(360deg); opacity: 0.5; }
              }
              @keyframes pulse-ring-reverse {
                0% { transform: scale(1.05) rotate(360deg); opacity: 0.8; }
                50% { transform: scale(0.95) rotate(180deg); opacity: 0.3; }
                100% { transform: scale(1.05) rotate(0deg); opacity: 0.8; }
              }
              @keyframes beam-move-left {
                0% { transform: translateX(-100%); opacity: 0; }
                20%, 80% { opacity: 1; }
                100% { transform: translateX(100%); opacity: 0; }
              }
              @keyframes beam-move-right {
                0% { transform: translateX(-100%); opacity: 0; }
                20%, 80% { opacity: 1; }
                100% { transform: translateX(100%); opacity: 0; }
              }
              @keyframes float-1 {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-8px) rotate(-1deg); }
              }
              @keyframes float-2 {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(10px) rotate(1.5deg); }
              }
              @keyframes float-3 {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-6px); }
              }
              @keyframes blink {
                0%, 49% { opacity: 1; }
                50%, 100% { opacity: 0; }
              }
              .anim-dash { stroke-dasharray: 8, 8; animation: dash 1.5s linear infinite; }
              .anim-beam-l { animation: beam-move-left 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
              .anim-beam-r { animation: beam-move-right 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite; animation-delay: 1.25s; }
              .anim-ring-1 { animation: pulse-ring 8s linear infinite; transform-origin: center; }
              .anim-ring-2 { animation: pulse-ring-reverse 12s linear infinite; transform-origin: center; }
              .anim-float-1 { animation: float-1 6s ease-in-out infinite; transform-origin: center; }
              .anim-float-2 { animation: float-2 7.5s ease-in-out infinite; transform-origin: center; }
              .anim-float-3 { animation: float-3 5s ease-in-out infinite; transform-origin: center; }
              .cursor { animation: blink 1s step-end infinite; }
            `}
          </style>
        </defs>

        {/* ────────── Background Grid ────────── */}
        <g stroke="#27272a" strokeWidth="1" strokeDasharray="4 4" opacity="0.3">
          <path d="M0,100 L1000,100 M0,200 L1000,200 M0,300 L1000,300" />
          <path d="M250,0 L250,400 M500,0 L500,400 M750,0 L750,400" />
        </g>

        {/* ────────── Connection Lines ────────── */}
        {/* Left (Terminal -> Gate) */}
        <path d="M280 200 L440 200" stroke="#3f3f46" strokeWidth="2" />
        <path d="M280 200 L440 200" stroke="#8b5cf6" strokeWidth="2" className="anim-dash" filter="url(#glow-brand)" opacity="0.7" />
        <g clipPath="url(#clip-left)">
          <rect x="280" y="198" width="120" height="4" fill="url(#beam-left)" className="anim-beam-l" />
        </g>
        <clipPath id="clip-left"><rect x="280" y="190" width="160" height="20" /></clipPath>

        {/* Right (Gate -> Browsers) */}
        <path d="M560 200 C 620 200, 660 120, 720 120" stroke="#3f3f46" strokeWidth="2" fill="none" />
        <path d="M560 200 C 620 200, 660 120, 720 120" stroke="#10b981" strokeWidth="2" fill="none" className="anim-dash" filter="url(#glow-emerald)" opacity="0.5" />
        
        <path d="M560 200 C 620 200, 660 280, 760 280" stroke="#3f3f46" strokeWidth="2" fill="none" />
        <path d="M560 200 C 620 200, 660 280, 760 280" stroke="#10b981" strokeWidth="2" fill="none" className="anim-dash" filter="url(#glow-emerald)" opacity="0.5" />

        {/* ────────── 1. Left: AI Agent Terminal ────────── */}
        <g transform="translate(40, 90)">
          <g className="anim-float-1">
            {/* Shadow */}
            <rect x="0" y="10" width="280" height="220" rx="12" fill="#000" opacity="0.4" filter="url(#heavy-glow)" />
            {/* Window */}
            <rect width="280" height="220" rx="12" fill="url(#glass-panel)" stroke="#52525b" strokeWidth="1.5" />
            {/* Header */}
            <path d="M0 12 C0 5.37 5.37 0 12 0 L268 0 C274.63 0 280 5.37 280 12 L280 32 L0 32 L0 12 Z" fill="url(#terminal-header)" />
            <circle cx="20" cy="16" r="5" fill="#ef4444" />
            <circle cx="36" cy="16" r="5" fill="#f59e0b" />
            <circle cx="52" cy="16" r="5" fill="#10b981" />
            <rect x="100" y="10" width="80" height="12" rx="4" fill="#18181b" />
            <text x="140" y="20" fill="#a1a1aa" fontSize="10" textAnchor="middle" fontFamily="monospace" letterSpacing="0.5">agent-build</text>

            {/* Code Content */}
            <g fontFamily="monospace" fontSize="13" fill="#e4e4e7">
              {/* Command 1 */}
              <text x="20" y="60" fill="#a1a1aa">❯</text>
              <text x="38" y="60" fill="#f472b6">npm</text>
              <text x="68" y="60">run build</text>
              <text x="20" y="82" fill="#a1a1aa" fontSize="11">✓ Compiled 128 assets</text>
              <text x="20" y="100" fill="#a1a1aa" fontSize="11">✓ Build successful (1.2s)</text>

              {/* Command 2 */}
              <text x="20" y="135" fill="#a1a1aa">❯</text>
              <text x="38" y="135" fill="#38bdf8">opage</text>
              <text x="82" y="135">deploy ./dist --site app</text>
              
              <g style={{ animation: 'type-text 6s infinite' }}>
                <text x="20" y="160" fill="#8b5cf6">⠋</text>
                <text x="38" y="160" fill="#a1a1aa" fontSize="11">Uploading bundle (4.2 MB)...</text>
              </g>

              <g style={{ animation: 'type-text 6s infinite', animationDelay: '2s' }}>
                <text x="20" y="185" fill="#10b981">✔</text>
                <text x="38" y="185" fill="#10b981" fontSize="11" fontWeight="bold">Deployed to app.oauth.page</text>
                <text x="220" y="185" fill="#e4e4e7" className="cursor">█</text>
              </g>
            </g>
          </g>
        </g>

        {/* ────────── 2. Center: OAuthPage Gate ────────── */}
        <g transform="translate(500, 200)">
          {/* Background Ambient */}
          <circle cx="0" cy="0" r="80" fill="#8b5cf6" opacity="0.1" filter="url(#heavy-glow)" />
          
          {/* Rotating Rings */}
          <g className="anim-ring-1">
            <circle cx="0" cy="0" r="75" fill="none" stroke="#8b5cf6" strokeWidth="1" strokeDasharray="8 4 2 4" opacity="0.6" />
            <circle cx="0" cy="0" r="65" fill="none" stroke="#c084fc" strokeWidth="2" strokeDasharray="20 10 5 10" filter="url(#glow-brand)" />
          </g>
          <g className="anim-ring-2">
            <circle cx="0" cy="0" r="85" fill="none" stroke="#3f3f46" strokeWidth="1" strokeDasharray="12 12" />
          </g>

          {/* Core Shield */}
          <circle cx="0" cy="0" r="50" fill="#09090b" stroke="#52525b" strokeWidth="2" />
          <circle cx="0" cy="0" r="45" fill="url(#glass-panel)" />
          
          {/* Shield Graphic */}
          <path d="M0 -25 C 0 -25, 15 -20, 20 -10 C 25 0, 20 20, 0 35 C -20 20, -25 0, -20 -10 C -15 -20, 0 -25, 0 -25 Z" 
                fill="#18181b" stroke="#8b5cf6" strokeWidth="2.5" filter="url(#glow-brand)" />
          <path d="M -8 5 L 0 13 L 12 -2" stroke="#10b981" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />

          {/* Auth Avatars Floating */}
          <g className="anim-float-3">
            <g transform="translate(-40, -60)">
              <rect x="-16" y="-16" width="32" height="32" rx="16" fill="#18181b" stroke="#3f3f46" strokeWidth="2" />
              <path d="M0 -6 C2.5 -6 4.5 -4 4.5 -1.5 C4.5 1 2.5 3 0 3 C-2.5 3 -4.5 1 -4.5 -1.5 C-4.5 -4 -2.5 -6 0 -6 Z M-7 10 C-7 7 0 6 0 6 C0 6 7 7 7 10 L7 12 L-7 12 Z" fill="#a1a1aa" />
            </g>
          </g>
          
          <g className="anim-float-3" style={{ animationDelay: '-2.5s' }}>
            <g transform="translate(45, 55)">
              <rect x="-16" y="-16" width="32" height="32" rx="8" fill="#18181b" stroke="#3f3f46" strokeWidth="2" />
              <path d="M-5 -5 L5 5 M5 -5 L-5 5" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
            </g>
          </g>
        </g>

        {/* ────────── 3. Right Top: Desktop Dashboard ────────── */}
        <g transform="translate(710, 40)">
          <g className="anim-float-2">
            {/* Shadow */}
            <rect x="0" y="10" width="240" height="160" rx="10" fill="#000" opacity="0.3" filter="url(#heavy-glow)" />
            
            <rect width="240" height="160" rx="10" fill="url(#glass-panel)" stroke="#3f3f46" strokeWidth="1.5" />
            {/* Browser Bar */}
            <path d="M0 10 C0 4.47 4.47 0 10 0 L230 0 C235.52 0 240 4.47 240 10 L240 28 L0 28 L0 10 Z" fill="#27272a" />
            <circle cx="16" cy="14" r="4" fill="#52525b" />
            <circle cx="28" cy="14" r="4" fill="#52525b" />
            <circle cx="40" cy="14" r="4" fill="#52525b" />
            <rect x="60" y="8" width="120" height="12" rx="6" fill="#18181b" />
            <path d="M68 14 A2 2 0 1 1 72 14 A2 2 0 1 1 68 14 Z" fill="#10b981" />
            <text x="76" y="17" fill="#a1a1aa" fontSize="8" fontFamily="sans-serif">ai-dash.oauth.page</text>

            {/* Dashboard UI Elements */}
            {/* Sidebar */}
            <rect x="0" y="28" width="45" height="132" fill="#18181b" />
            <rect x="8" y="40" width="28" height="6" rx="3" fill="#3f3f46" />
            <rect x="8" y="54" width="28" height="6" rx="3" fill="#27272a" />
            <rect x="8" y="68" width="28" height="6" rx="3" fill="#27272a" />
            
            {/* Main Content Area */}
            <rect x="55" y="40" width="80" height="8" rx="4" fill="#e4e4e7" opacity="0.8" />
            <rect x="55" y="55" width="170" height="4" rx="2" fill="#3f3f46" />
            <rect x="55" y="65" width="140" height="4" rx="2" fill="#3f3f46" />
            
            {/* Charts/Widgets */}
            <rect x="55" y="85" width="80" height="60" rx="6" fill="#18181b" stroke="#27272a" strokeWidth="1" />
            <path d="M60 135 L75 110 L90 125 L110 95 L125 115" stroke="#8b5cf6" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow-brand)" />
            
            <rect x="145" y="85" width="80" height="60" rx="6" fill="#18181b" stroke="#27272a" strokeWidth="1" />
            <circle cx="185" cy="115" r="20" fill="none" stroke="#27272a" strokeWidth="6" />
            <circle cx="185" cy="115" r="20" fill="none" stroke="#10b981" strokeWidth="6" strokeDasharray="90 120" transform="rotate(-90 185 115)" filter="url(#glow-emerald)" />
          </g>
        </g>

        {/* ────────── 4. Right Bottom: Mobile Device ────────── */}
        <g transform="translate(750, 220)">
          <g className="anim-float-1" style={{ animationDelay: '-3s' }}>
            {/* Shadow */}
            <rect x="0" y="5" width="100" height="160" rx="16" fill="#000" opacity="0.4" filter="url(#heavy-glow)" />
            
            <rect width="100" height="160" rx="16" fill="#09090b" stroke="#52525b" strokeWidth="2" />
            <rect x="35" y="6" width="30" height="6" rx="3" fill="#27272a" />
            
            {/* Mobile Screen UI */}
            <rect x="8" y="24" width="84" height="128" rx="8" fill="url(#glass-panel)" />
            
            {/* Success Banner */}
            <rect x="16" y="32" width="68" height="24" rx="6" fill="#10b981" fillOpacity="0.1" stroke="#10b981" strokeWidth="1" />
            <path d="M22 44 L26 48 L34 38" stroke="#10b981" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <text x="40" y="46.5" fill="#10b981" fontSize="8" fontWeight="bold" fontFamily="sans-serif">Approved</text>
            
            {/* Content lines */}
            <rect x="16" y="68" width="68" height="40" rx="4" fill="#18181b" />
            <rect x="24" y="76" width="40" height="3" rx="1.5" fill="#3f3f46" />
            <rect x="24" y="84" width="52" height="3" rx="1.5" fill="#27272a" />
            <rect x="24" y="92" width="30" height="3" rx="1.5" fill="#27272a" />
            
            {/* Action button */}
            <rect x="16" y="116" width="68" height="24" rx="12" fill="#8b5cf6" />
            <text x="50" y="130" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">View Report</text>
          </g>
        </g>

      </svg>
    </div>
  );
}