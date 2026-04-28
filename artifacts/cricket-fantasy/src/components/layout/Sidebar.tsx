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
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contests", label: "Contests", icon: Trophy },
  { href: "/matches", label: "Matches", icon: Swords },
  { href: "/players", label: "Players", icon: Users },
  { href: "/my-teams", label: "My Teams", icon: UsersRound },
  { href: "/auction", label: "Auction", icon: BarChart3 },
  { href: "/guide", label: "Guide", icon: BookOpen },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside
      className="w-20 lg:w-64 h-screen fixed left-0 top-0 flex flex-col transition-all duration-300 z-50"
      style={{
        background: "rgba(6,7,14,0.55)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(20px) saturate(140%)",
        WebkitBackdropFilter: "blur(20px) saturate(140%)",
      }}
    >
      {/* Logo */}
      <div
        className="h-20 flex items-center justify-center lg:justify-start lg:px-6"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(99,102,241,0.1))",
              border: "1px solid rgba(99,102,241,0.3)",
            }}
          >
            <Trophy className="w-4 h-4" style={{ color: "#818cf8" }} />
          </div>
          <span
            className="font-bold text-lg hidden lg:block"
            style={{ color: "#f1f5f9", letterSpacing: "-0.02em" }}
          >
            Colosseum
          </span>
        </div>
      </div>

      {/* Nav items */}
      <div
        className="flex-1 py-5 px-3 flex flex-col gap-1 overflow-y-auto"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.025) 0%, transparent 100%)",
        }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group"
                style={{
                  background: isActive
                    ? "rgba(99,102,241,0.12)"
                    : "transparent",
                  border: isActive
                    ? "1px solid rgba(99,102,241,0.2)"
                    : "1px solid transparent",
                }}
              >
                {/* Icon circle */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200"
                  style={{
                    background: isActive
                      ? "rgba(99,102,241,0.2)"
                      : "rgba(255,255,255,0.05)",
                    border: isActive
                      ? "1px solid rgba(99,102,241,0.35)"
                      : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <item.icon
                    className="w-3.5 h-3.5 transition-colors"
                    style={{
                      color: isActive ? "#818cf8" : "rgba(255,255,255,0.45)",
                    }}
                  />
                </div>
                <span
                  className="hidden lg:block text-sm font-medium transition-colors"
                  style={{
                    color: isActive ? "#e2e8f0" : "rgba(255,255,255,0.4)",
                  }}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Bottom actions */}
      <div
        className="p-3 flex flex-col gap-1"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        {/* User chip */}
        {user && (
          <div className="hidden lg:flex items-center gap-3 px-3 py-2 mb-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{
                background: "rgba(99,102,241,0.15)",
                border: "1px solid rgba(99,102,241,0.3)",
                color: "#818cf8",
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div className="text-xs font-semibold truncate" style={{ color: "#e2e8f0" }}>
                {user.name}
              </div>
              <div className="text-xs truncate" style={{ color: "rgba(255,255,255,0.35)" }}>
                {user.email}
              </div>
            </div>
          </div>
        )}

        {/* Settings */}
        <div
          className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group"
          style={{ border: "1px solid transparent" }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)";
            (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLDivElement).style.background = "transparent";
            (e.currentTarget as HTMLDivElement).style.borderColor = "transparent";
          }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.09)",
            }}
          >
            <Settings className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.45)" }} />
          </div>
          <span className="hidden lg:block text-sm font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
            Settings
          </span>
        </div>

        {/* Log out */}
        <button
          onClick={logout}
          className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group w-full text-left"
          style={{ background: "transparent", border: "1px solid transparent" }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(220,38,38,0.07)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(220,38,38,0.15)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent";
          }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.09)",
            }}
          >
            <LogOut className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.45)" }} />
          </div>
          <span className="hidden lg:block text-sm font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
            Log out
          </span>
        </button>
      </div>
    </aside>
  );
}
