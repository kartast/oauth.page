import { Shield } from "lucide-react";
import { startGithubAuth, startGoogleAuth, getFlags } from "../lib/api";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Login() {
  const [params] = useSearchParams();
  const error = params.get("error");
  const [googleEnabled, setGoogleEnabled] = useState(true);

  useEffect(() => {
    getFlags()
      .then((f) => setGoogleEnabled(Boolean(f.oauth?.google_enabled ?? true)))
      .catch(() => setGoogleEnabled(true));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0a0a0f]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-violet-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-violet-900/40">
            <Shield size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold text-white">OAuthPage</h1>
          <p className="text-sm text-zinc-500 mt-1">Secure any website with OAuth</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
            Authentication failed. Please try again.
          </div>
        )}

        {/* Auth buttons */}
        <div className="rounded-xl border border-white/10 bg-zinc-900/70 backdrop-blur-sm p-6 space-y-3">
          <button
            onClick={startGithubAuth}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white hover:bg-zinc-100 text-zinc-900 rounded-lg text-sm font-semibold transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Continue with GitHub
          </button>

          {googleEnabled && (
            <button
              onClick={startGoogleAuth}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white/6 hover:bg-white/10 border border-white/10 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
          )}
        </div>

        <p className="text-center text-xs text-zinc-600 mt-6">
          By continuing, you agree to our{" "}
          <a href="/docs#terms" className="text-zinc-400 hover:text-zinc-200 underline">Terms</a>{" "}
          and{" "}
          <a href="/docs#privacy" className="text-zinc-400 hover:text-zinc-200 underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
