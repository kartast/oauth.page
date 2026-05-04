import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, createContext, useContext } from "react";
import * as Sentry from "@sentry/react";
import { getMe, SilentError } from "./lib/api";
import { ToastProvider } from "./components/Toast";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Docs from "./pages/Docs";
import Login from "./pages/Login";
import Sites from "./pages/Sites";
import SiteDetail from "./pages/SiteDetail";
import CreateSite from "./pages/CreateSite";

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refresh: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const { logger } = Sentry;

  const refresh = async () => {
    try {
      logger.info("Auth refresh: fetching /api/auth/me");
      const data = await getMe();
      setUser(data.user);
      if (data.user) {
        Sentry.setUser({ id: data.user.id, email: data.user.email });
        logger.info(logger.fmt`Auth: logged in as ${data.user.email}`);
      } else {
        logger.info("Auth: no active session");
      }
    } catch (err) {
      if (!(err instanceof SilentError)) {
        logger.error(logger.fmt`Auth refresh failed: ${String(err)}`);
        Sentry.captureException(err);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-zinc-500 font-mono">Loading auth...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, refresh }}>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/login" element={user ? <Navigate to="/sites" /> : <Login />} />
          <Route element={user ? <Layout /> : <Navigate to="/login" />}>
            <Route path="/sites" element={<Sites />} />
            <Route path="/sites/new" element={<CreateSite />} />
            <Route path="/sites/:id" element={<SiteDetail />} />
          </Route>
          <Route path="*" element={<Navigate to={user ? "/sites" : "/"} />} />
        </Routes>
      </ToastProvider>
    </AuthContext.Provider>
  );
}
