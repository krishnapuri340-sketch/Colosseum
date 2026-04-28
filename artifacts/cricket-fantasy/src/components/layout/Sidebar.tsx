import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Trophy,
  Swords,
  Users,
  UsersRound,
  BarChart3,
  BookOpen,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contests", label: "Contests", icon: Trophy },
  { href: "/matches", label: "Matches", icon: Swords },
  { href: "/players", label: "Players", icon: Users },
  { href: "/my-teams", label: "My Teams", icon: UsersRound },
  { href: "/leaderboard", label: "Leaderboard", icon: BarChart3 },
  { href: "/guide", label: "Guide", icon: BookOpen },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className="w-20 lg:w-64 h-screen fixed left-0 top-0 border-r border-white/5 bg-background flex flex-col transition-all duration-300 z-50">
      <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-xl hidden lg:block bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            CricStrat
          </span>
        </div>
      </div>

      <div className="flex-1 py-8 px-4 flex flex-col gap-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group",
                  isActive
                    ? "bg-primary/15 text-primary border border-primary/20 shadow-[0_0_15px_-3px_rgba(6,182,212,0.1)]"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-primary" : "group-hover:text-primary/70"
                  )}
                />
                <span className="hidden lg:block font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 flex flex-col gap-2 border-t border-white/5">
        {user && (
          <div className="hidden lg:flex items-center gap-3 px-4 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div className="text-xs font-semibold text-foreground truncate">{user.name}</div>
              <div className="text-xs text-muted-foreground truncate">{user.email}</div>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-4 px-4 py-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 group w-full text-left"
        >
          <LogOut className="w-5 h-5 group-hover:text-destructive/70 transition-colors" />
          <span className="hidden lg:block font-medium">Log out</span>
        </button>
      </div>
    </aside>
  );
}
