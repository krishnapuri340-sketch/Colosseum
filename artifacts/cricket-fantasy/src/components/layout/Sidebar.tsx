import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Trophy,
  Swords,
  Users,
  UsersRound,
  Gavel,
  BookOpen,
  LogOut,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/matches", label: "Matches", icon: Swords },
  { href: "/players", label: "Players", icon: Users },
  { href: "/my-teams", label: "My Teams", icon: UsersRound },
  { href: "/auction", label: "Auction", icon: Gavel },
  { href: "/guide", label: "Guide", icon: BookOpen },
];

export function Sidebar() {
  const [location] = useLocation();
  const { logout } = useAuth();
  const { collapsed, toggle } = useSidebar();

  return (
    <aside
      style={{
        width: collapsed ? 64 : 256,
        minWidth: collapsed ? 64 : 256,
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        display: "flex",
        flexDirection: "column",
        transition: "width 0.22s ease, min-width 0.22s ease",
        zIndex: 50,
        background: "rgba(6,7,14,0.55)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(20px) saturate(140%)",
        WebkitBackdropFilter: "blur(20px) saturate(140%)",
        overflow: "visible",
      }}
    >
      {/* Logo */}
      <div
        style={{
          height: 70,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          padding: collapsed ? "0" : "0 20px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          flexShrink: 0,
        }}
      >
        {collapsed ? (
          <div
            style={{
              width: 32, height: 32, borderRadius: 10,
              background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(99,102,241,0.1))",
              border: "1px solid rgba(99,102,241,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Trophy style={{ width: 15, height: 15, color: "#818cf8" }} />
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32, height: 32, borderRadius: 10,
                background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(99,102,241,0.1))",
                border: "1px solid rgba(99,102,241,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Trophy style={{ width: 15, height: 15, color: "#818cf8" }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: "1rem", color: "#f1f5f9", letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
              Colosseum
            </span>
          </div>
        )}
      </div>

      {/* Floating collapse toggle — pinned to right edge, vertically centred */}
      <button
        onClick={toggle}
        style={{
          position: "absolute",
          right: -12,
          top: "50%",
          transform: "translateY(-50%)",
          width: 24, height: 24, borderRadius: "50%",
          background: "rgba(15,16,24,0.9)",
          border: "1px solid rgba(255,255,255,0.13)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
          zIndex: 10,
          transition: "background 0.2s, border-color 0.2s",
          boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = "rgba(99,102,241,0.25)";
          e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = "rgba(15,16,24,0.9)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.13)";
        }}
      >
        {collapsed
          ? <ChevronRight style={{ width: 12, height: 12, color: "rgba(255,255,255,0.6)" }} />
          : <ChevronLeft style={{ width: 12, height: 12, color: "rgba(255,255,255,0.6)" }} />
        }
      </button>

      {/* Nav items */}
      <div
        style={{
          flex: 1,
          padding: "20px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          overflowY: "auto",
          overflowX: "hidden",
          background: "linear-gradient(180deg, rgba(255,255,255,0.025) 0%, transparent 100%)",
        }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                title={collapsed ? item.label : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: collapsed ? "10px 0" : "10px 12px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  borderRadius: 12,
                  cursor: "pointer",
                  transition: "background 0.2s, border-color 0.2s",
                  background: isActive ? "rgba(99,102,241,0.12)" : "transparent",
                  border: isActive ? "1px solid rgba(99,102,241,0.2)" : "1px solid transparent",
                }}
              >
                <div
                  style={{
                    width: 32, height: 32, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                    background: isActive ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)",
                    border: isActive ? "1px solid rgba(99,102,241,0.35)" : "1px solid rgba(255,255,255,0.08)",
                    transition: "background 0.2s, border-color 0.2s",
                  }}
                >
                  <item.icon style={{ width: 14, height: 14, color: isActive ? "#818cf8" : "rgba(255,255,255,0.45)" }} />
                </div>
                {!collapsed && (
                  <span style={{ fontSize: "0.875rem", fontWeight: 500, color: isActive ? "#e2e8f0" : "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>
                    {item.label}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Bottom actions */}
      <div style={{ padding: "10px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: 4 }}>
        {/* Settings */}
        <div
          title={collapsed ? "Settings" : undefined}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: collapsed ? "10px 0" : "10px 12px",
            justifyContent: collapsed ? "center" : "flex-start",
            borderRadius: 12, cursor: "pointer",
            border: "1px solid transparent", transition: "background 0.2s, border-color 0.2s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)";
            (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLDivElement).style.background = "transparent";
            (e.currentTarget as HTMLDivElement).style.borderColor = "transparent";
          }}
        >
          <div style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}>
            <Settings style={{ width: 14, height: 14, color: "rgba(255,255,255,0.45)" }} />
          </div>
          {!collapsed && <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>Settings</span>}
        </div>

        {/* Log out */}
        <button
          onClick={logout}
          title={collapsed ? "Log out" : undefined}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: collapsed ? "10px 0" : "10px 12px",
            justifyContent: collapsed ? "center" : "flex-start",
            borderRadius: 12, cursor: "pointer", width: "100%",
            background: "transparent", border: "1px solid transparent",
            transition: "background 0.2s, border-color 0.2s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(220,38,38,0.07)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(220,38,38,0.15)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent";
          }}
        >
          <div style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}>
            <LogOut style={{ width: 14, height: 14, color: "rgba(255,255,255,0.45)" }} />
          </div>
          {!collapsed && <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>Log out</span>}
        </button>
      </div>
    </aside>
  );
}
