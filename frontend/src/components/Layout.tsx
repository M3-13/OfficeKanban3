import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import SearchBar from "./SearchBar";
import ActivityPanel from "./ActivityPanel";
import Toast from "./Toast";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen">
      <aside className="w-[240px] bg-bg_sidebar text-fg_sidebar flex flex-col shrink-0">
        <div className="h-14 flex items-center px-4 border-b border-white/10">
          <span className="font-semibold text-base">OfficeKanban3</span>
        </div>
        <nav className="flex-1 py-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `block px-4 py-2.5 rounded-sm text-sm mx-1 my-0.5 hover:bg-white/[0.08] ${
                isActive ? "bg-accent text-white" : ""
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/boards"
            className={({ isActive }) =>
              `block px-4 py-2.5 rounded-sm text-sm mx-1 my-0.5 hover:bg-white/[0.08] ${
                isActive ? "bg-accent text-white" : ""
              }`
            }
          >
            Boards
          </NavLink>
        </nav>
        <div className="p-3 border-t border-white/10">
          <div className="text-xs text-fg_sidebar/70 mb-1">{user?.email}</div>
          <button
            onClick={handleLogout}
            className="text-sm text-fg_sidebar/70 hover:text-fg_sidebar transition-colors"
          >
            Abmelden
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <header className="h-14 flex items-center px-4 border-b border-border-light bg-card_bg">
          <SearchBar />
        </header>
        <div className="flex">
          <div className="flex-1 p-4">
            <Outlet />
          </div>
          <ActivityPanel />
        </div>
      </main>
      <Toast />
    </div>
  );
}
