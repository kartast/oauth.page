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
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/sites" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 flex items-center justify-center shadow-inner group-hover:border-zinc-700 transition-colors">
              <Shield size={18} className="text-brand-light" />
            </div>
            <span className="font-bold text-zinc-100 tracking-tight">OAuthPage</span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link 
              to="/docs" 
              className="hidden sm:block text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Docs
            </Link>
            <Link
              to="/sites/new"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand hover:bg-brand-hover text-white text-sm font-semibold rounded-lg transition-all shadow-sm active:scale-95"
            >
              <Plus size={14} />
              <span className="hidden xs:inline">New Site</span>
              <span className="xs:hidden">New</span>
            </Link>
            <div className="flex items-center gap-1 sm:gap-2 pl-2 border-l border-zinc-800">
              <span className="hidden md:inline text-sm text-zinc-400 font-medium truncate max-w-[100px]">
                {user?.name}
              </span>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 hover:text-zinc-300"
                title="Log out"
              >
                <LogOut size={18} />
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
