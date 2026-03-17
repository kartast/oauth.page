import { Outlet, Link, useNavigate } from "react-router-dom";
import { LogOut, Shield, Plus, LayoutGrid } from "lucide-react";
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
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="border-b border-white/8 bg-[#0a0a0f]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/sites" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shadow-sm group-hover:bg-violet-500 transition-colors">
              <Shield size={15} className="text-white" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-white">OAuthPage</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              to="/docs"
              className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-200 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              <LayoutGrid size={14} />
              Docs
            </Link>
            <Link
              to="/sites/new"
                                                                                                            btn-press text-sm font-semibold rounded-lg transition-all shadow-sm"
            >
              <Plus size={14} />
              <span className="hidden xs:inline">New Site</span>
              <span className="xs:hidden">New</span>
            </Link>
            <div className="flex items-center gap-1 pl-2 border-l border-white/8">
              <span className="hidden md:inline text-sm text-zinc-500 font-medium truncate max-w-[100px]">
                {user?.name}
              </span>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-white/8 rounded-lg transition-colors text-zinc-600 hover:text-zinc-300"
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
