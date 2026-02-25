export function WorkflowAnimation() {
  return (
    <div className="relative w-full aspect-[21/9] sm:aspect-[21/10] md:aspect-[21/8] bg-zinc-950/50 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-zinc-900/50 pointer-events-none" />
      
      <svg className="w-full h-full max-h-[400px]" viewBox="0 0 800 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="1" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
          </linearGradient>

          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="heavy-glow">
            <feGaussianBlur stdDeviation="10" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <linearGradient id="terminal-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#18181b" />
            <stop offset="100%" stopColor="#09090b" />
          </linearGradient>

          <linearGradient id="browser-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#27272a" />
            <stop offset="100%" stopColor="#18181b" />
          </linearGradient>

          <style>
            {`
              @keyframes dash {
                to { stroke-dashoffset: -40; }
              }
              @keyframes type1 {
                0%, 10% { opacity: 0; }
                11%, 100% { opacity: 1; }
              }
              @keyframes type2 {
                0%, 30% { opacity: 0; }
                31%, 100% { opacity: 1; }
              }
              @keyframes type3 {
                0%, 50% { opacity: 0; }
                51%, 100% { opacity: 1; }
              }
              @keyframes pulseLock {
                0%, 100% { transform: scale(1); filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.5)); }
                50% { transform: scale(1.05); filter: drop-shadow(0 0 16px rgba(167, 139, 250, 0.8)); }
              }
              @keyframes beamMove {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
              }
              @keyframes floatApp {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-5px); }
              }
              @keyframes floatMobile {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(5px); }
              }
              @keyframes secureGlow {
                0%, 100% { opacity: 0.3; }
                50% { opacity: 0.8; }
              }
              .beam-line { stroke-dasharray: 10, 10; animation: dash 2s linear infinite; }
              .terminal-text-1 { animation: type1 8s infinite; }
              .terminal-text-2 { animation: type2 8s infinite; }
              .terminal-text-3 { animation: type3 8s infinite; }
              .lock-group { animation: pulseLock 3s ease-in-out infinite; transform-origin: 400px 200px; }
              .beam-animated { animation: beamMove 3s linear infinite; }
              .float-app { animation: floatApp 6s ease-in-out infinite; }
              .float-mobile { animation: floatMobile 7s ease-in-out infinite; }
              .secure-shield { animation: secureGlow 4s ease-in-out infinite; }
            `}
          </style>
        </defs>

        {/* Background Grids */}
        <g stroke="#27272a" strokeWidth="1" opacity="0.4">
          <path d="M0,50 L800,50 M0,150 L800,150 M0,250 L800,250 M0,350 L800,350" />
          <path d="M100,0 L100,400 M300,0 L300,400 M500,0 L500,400 M700,0 L700,400" />
        </g>

        {/* Connection Paths */}
        <path d="M220 200 L580 200" stroke="#3f3f46" strokeWidth="2" />
        <path d="M220 200 L580 200" stroke="#8b5cf6" strokeWidth="2" className="beam-line" filter="url(#glow)" />
        
        {/* Animated Beam */}
        <g clipPath="url(#beam-clip)">
          <rect x="220" y="198" width="100" height="4" fill="url(#beam)" className="beam-animated" />
        </g>
        <clipPath id="beam-clip">
          <rect x="220" y="190" width="360" height="20" />
        </clipPath>

        {/* Left: Terminal */}
        <g transform="translate(40, 100)">
          {/* Terminal Window */}
          <rect width="240" height="200" rx="8" fill="url(#terminal-bg)" stroke="#3f3f46" strokeWidth="1.5" />
          <path d="M0 8 C0 3.58 3.58 0 8 0 L232 0 C236.42 0 240 3.58 240 8 L240 24 L0 24 L0 8 Z" fill="#27272a" />
          <circle cx="16" cy="12" r="4" fill="#ef4444" />
          <circle cx="32" cy="12" r="4" fill="#eab308" />
          <circle cx="48" cy="12" r="4" fill="#22c55e" />
          <text x="120" y="16" fill="#a1a1aa" fontSize="10" textAnchor="middle" fontFamily="monospace">~/project</text>

          {/* Terminal Text */}
          <g fontFamily="monospace" fontSize="12" fill="#e4e4e7">
            <text x="16" y="50" fill="#a1a1aa">$</text>
            <text x="30" y="50" className="terminal-text-1">opage login</text>
            <text x="16" y="70" fill="#10b981" className="terminal-text-1">✔ Authenticated</text>

            <text x="16" y="100" fill="#a1a1aa">$</text>
            <text x="30" y="100" className="terminal-text-2">opage deploy ./dist</text>
            <text x="16" y="120" fill="#8b5cf6" className="terminal-text-2">⠋ Uploading files...</text>
            <text x="16" y="140" fill="#10b981" className="terminal-text-2">✔ Deployed to oauth.page</text>

            <text x="16" y="170" fill="#a1a1aa">$</text>
            <text x="30" y="170" className="terminal-text-3">opage link create</text>
            <text x="16" y="190" fill="#60a5fa" className="terminal-text-3">🔗 oauth.page/x/123</text>
          </g>
        </g>

        {/* Center: Gatekeep / Security */}
        <g className="lock-group" transform="translate(0, 0)">
          <circle cx="400" cy="200" r="50" fill="#09090b" stroke="#3f3f46" strokeWidth="2" />
          <circle cx="400" cy="200" r="45" fill="#18181b" />
          
          {/* Glowing Shield Ring */}
          <circle cx="400" cy="200" r="50" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="15, 10" className="secure-shield" filter="url(#heavy-glow)" />
          
          {/* Shield Icon */}
          <path d="M400 170 C400 170 415 175 420 185 C425 195 420 215 400 230 C380 215 375 195 380 185 C385 175 400 170 400 170 Z" fill="#27272a" stroke="#8b5cf6" strokeWidth="2" filter="url(#glow)" />
          
          {/* Checkmark inside shield */}
          <path d="M392 200 L398 206 L410 190" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          
          {/* Auth Providers floating small */}
          <g transform="translate(350, 140) scale(0.6)">
            <rect width="24" height="24" rx="4" fill="#ffffff" />
            <path d="M12 11 V13 H15.5 C15.2 14.5 13.9 15.6 12 15.6 C9.8 15.6 8 13.8 8 11.6 C8 9.4 9.8 7.6 12 7.6 C13 7.6 13.9 8 14.6 8.6 L16 7.2 C15 6.2 13.6 5.6 12 5.6 C8.7 5.6 6 8.3 6 11.6 C6 14.9 8.7 17.6 12 17.6 C15.3 17.6 17.5 15.3 17.5 12 V11 H12 Z" fill="#000" />
          </g>
          <g transform="translate(426, 140) scale(0.6)">
            <rect width="24" height="24" rx="12" fill="#ffffff" />
            <path d="M12 5.5 C13.5 5.5 14.9 6.1 16 7.1 L18.1 5 C16.5 3.5 14.4 2.5 12 2.5 C7.5 2.5 3.7 5.6 2.4 9.8 L5.1 11.9 C5.8 8.2 9.1 5.5 12 5.5 Z" fill="#ea4335" />
            <path d="M2.4 9.8 C2.1 11 1.9 12.2 1.9 13.5 C1.9 14.8 2.1 16 2.4 17.2 L5.1 15.1 C4.9 14.6 4.9 14 4.9 13.5 C4.9 13 4.9 12.4 5.1 11.9 L2.4 9.8 Z" fill="#fbbc05" />
            <path d="M12 21.5 C14.4 21.5 16.6 20.6 18.2 19 L15.6 17 C14.6 17.7 13.4 18.2 12 18.2 C9.1 18.2 5.8 15.5 5.1 11.8 L2.4 13.9 C3.7 18.1 7.5 21.5 12 21.5 Z" fill="#34a853" />
            <path d="M21.5 13.5 C21.5 12.5 21.3 11.6 21 10.7 H12 V13.9 H17.5 C17.3 15.2 16.6 16.3 15.6 17 L18.2 19 C19.8 17.5 21.5 15.7 21.5 13.5 Z" fill="#4285f4" />
          </g>
        </g>

        {/* Right: Desktop Browser */}
        <g className="float-app" transform="translate(560, 80)">
          <rect width="200" height="140" rx="8" fill="url(#browser-bg)" stroke="#3f3f46" strokeWidth="1.5" />
          {/* Browser Header */}
          <path d="M0 8 C0 3.58 3.58 0 8 0 L192 0 C196.42 0 200 3.58 200 8 L200 24 L0 24 L0 8 Z" fill="#27272a" />
          <circle cx="12" cy="12" r="3" fill="#52525b" />
          <circle cx="22" cy="12" r="3" fill="#52525b" />
          <circle cx="32" cy="12" r="3" fill="#52525b" />
          
          <rect x="50" y="6" width="100" height="12" rx="4" fill="#18181b" />
          <path d="M56 12 A2 2 0 1 1 60 12 A2 2 0 1 1 56 12 Z" fill="#10b981" />
          <text x="64" y="15" fill="#a1a1aa" fontSize="8" fontFamily="sans-serif">🔒 my-site.oauth.page</text>

          {/* Browser Content */}
          <rect x="16" y="40" width="80" height="8" rx="2" fill="#3f3f46" />
          <rect x="16" y="56" width="140" height="4" rx="2" fill="#27272a" />
          <rect x="16" y="66" width="120" height="4" rx="2" fill="#27272a" />
          <rect x="16" y="76" width="160" height="4" rx="2" fill="#27272a" />
          
          <rect x="16" y="96" width="40" height="24" rx="4" fill="#8b5cf6" fillOpacity="0.2" stroke="#8b5cf6" strokeWidth="1" />
          <rect x="64" y="96" width="40" height="24" rx="4" fill="#27272a" />
          <rect x="112" y="96" width="40" height="24" rx="4" fill="#27272a" />
        </g>

        {/* Right: Mobile App Overlay */}
        <g className="float-mobile" transform="translate(710, 160)">
          <rect width="60" height="120" rx="8" fill="#18181b" stroke="#52525b" strokeWidth="2" />
          <rect x="20" y="4" width="20" height="4" rx="2" fill="#27272a" />
          
          {/* Mobile Content */}
          <circle cx="30" cy="30" r="12" fill="#8b5cf6" fillOpacity="0.2" stroke="#8b5cf6" strokeWidth="1" />
          <path d="M26 30 L29 33 L35 27" stroke="#8b5cf6" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          
          <rect x="10" y="55" width="40" height="3" rx="1.5" fill="#3f3f46" />
          <rect x="10" y="65" width="30" height="3" rx="1.5" fill="#27272a" />
          <rect x="10" y="75" width="35" height="3" rx="1.5" fill="#27272a" />
          
          <rect x="10" y="90" width="40" height="15" rx="4" fill="#8b5cf6" />
          <text x="30" y="100" fill="#fff" fontSize="5" textAnchor="middle" fontFamily="sans-serif">Access Granted</text>
        </g>

      </svg>
    </div>
  );
}
