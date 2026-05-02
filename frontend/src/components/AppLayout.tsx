import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, FolderKanban, CheckSquare, LogOut, ListTodo } from "lucide-react";
import { useApp } from "@/store/AppContext";
import { UserAvatar } from "./UserAvatar";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/my-tasks", label: "My Tasks", icon: CheckSquare },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen flex w-full bg-background">
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="px-6 h-16 flex items-center gap-2 border-b border-sidebar-border">
          <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center shadow-glow">
            <ListTodo className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">TaskFlow</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white",
                )
              }
            >
              <it.icon className="h-4 w-4" />
              {it.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
            <UserAvatar user={currentUser} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{currentUser?.name}</div>
              <div className="text-[11px] uppercase tracking-wide text-sidebar-foreground/70">
                {currentUser?.role}
              </div>
            </div>
            <button
              onClick={() => { logout(); navigate("/login"); }}
              className="p-2 rounded-md hover:bg-sidebar-accent text-sidebar-foreground hover:text-white transition-colors"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 h-14 bg-sidebar text-white px-4 flex items-center justify-between z-20 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg gradient-primary flex items-center justify-center">
            <ListTodo className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold tracking-tight">TaskFlow</span>
        </div>
        <div className="flex gap-1">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              className={({ isActive }) =>
                cn("p-2 rounded-md", isActive ? "bg-sidebar-accent" : "text-sidebar-foreground")
              }
              aria-label={it.label}
            >
              <it.icon className="h-4 w-4" />
            </NavLink>
          ))}
          <button onClick={() => { logout(); navigate("/login"); }} className="p-2 rounded-md text-sidebar-foreground" aria-label="Log out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      <main className="flex-1 min-w-0 md:pt-0 pt-14" key={location.pathname}>
        <div className="animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
