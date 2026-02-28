import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import * as Sentry from "@sentry/react";
import App from "./App";
import "./index.css";

Sentry.init({
  dsn: "https://39a8ba08d8a5b3d684bca5b9817c0862@o4510961134665728.ingest.us.sentry.io/4510961135976448",
  sendDefaultPii: true,
  enableLogs: true,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
  ],
  tracesSampleRate: 1.0,
  ignoreErrors: [
    // Browser extensions
    "runtime.sendMessage",
    "Extension context invalidated",
    // Sentry internals
    "updateFrom",
  ],
  denyUrls: [
    // Browser extensions
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
    /^moz-extension:\/\//i,
  ],
});

// Auto-reload on chunk load failures (stale JS after deploy)
window.addEventListener("error", (e) => {
  if (
    e.message?.includes("Failed to fetch dynamically imported module") ||
    e.message?.includes("Load failed") ||
    e.message?.includes("Loading chunk") ||
    e.message?.includes("Loading CSS chunk")
  ) {
    window.location.reload();
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ error }) => (
        <div style={{ padding: 32, fontFamily: "monospace", color: "#f87171", background: "#18181b", minHeight: "100vh" }}>
          <h1 style={{ fontSize: 20, marginBottom: 12 }}>App crashed</h1>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 14, color: "#fbbf24" }}>
            {(error as Error)?.message}
          </pre>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, color: "#a1a1aa", marginTop: 12 }}>
            {(error as Error)?.stack}
          </pre>
        </div>
      )}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
