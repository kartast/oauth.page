import { Outlet, Link, useNavigate } from "react-router-dom";
import { LogOut, Shield, Plus } from "lucide-react";
import { useAuth } from "../App";
import { logout } from "../lib/api";

export default function Layout() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    await refresh();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/sites" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <span className="font-semibold text-zinc-100">OAuthPage</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/sites/new"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand hover:bg-brand-hover text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus size={14} />
              New Site
            </Link>
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <span>{user?.name}</span>
              <button
                onClick={handleLogout}
                className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 hover:text-zinc-300"
                title="Log out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
