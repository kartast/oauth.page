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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/sites" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-blue-700 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <Shield size={18} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 tracking-tight">OAuthPage</span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              to="/docs"
              className="hidden sm:block text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              Docs
            </Link>
            <Link
              to="/sites/new"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand hover:bg-brand-hover text-white btn-press text-sm font-semibold rounded-lg transition-all shadow-sm active:scale-95"
            >
              <Plus size={14} />
              <span className="hidden xs:inline">New Site</span>
              <span className="xs:hidden">New</span>
            </Link>
            <div className="flex items-center gap-1 sm:gap-2 pl-2 border-l border-slate-200">
              <span className="hidden md:inline text-sm text-slate-500 font-medium truncate max-w-[100px]">
                {user?.name}
              </span>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-700"
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
