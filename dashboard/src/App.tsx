import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, createContext, useContext } from "react";
import { getMe } from "./lib/api";
import Layout from "./components/Layout";
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

  const refresh = async () => {
    try {
      const data = await getMe();
      setUser(data.user);
    } catch {
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, refresh }}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/sites" /> : <Login />} />
        <Route element={user ? <Layout /> : <Navigate to="/login" />}>
          <Route path="/sites" element={<Sites />} />
          <Route path="/sites/new" element={<CreateSite />} />
          <Route path="/sites/:id" element={<SiteDetail />} />
        </Route>
        <Route path="*" element={<Navigate to={user ? "/sites" : "/login"} />} />
      </Routes>
    </AuthContext.Provider>
  );
}
