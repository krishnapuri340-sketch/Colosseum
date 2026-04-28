import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Trophy,
  Swords,
  Users,
  UsersRound,
  Gavel,
  BookOpen,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/contests", label: "Contests", icon: Trophy },
  { href: "/matches", label: "Matches", icon: Swords },
  { href: "/players", label: "Players", icon: Users },
  { href: "/my-teams", label: "Teams", icon: UsersRound },
  { href: "/auction", label: "Auction", icon: Gavel },
  { href: "/guide", label: "Guide", icon: BookOpen },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 60,
        background: "rgba(6,7,14,0.85)",
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        padding: "8px 4px",
        paddingBottom: "calc(8px + env(safe-area-inset-bottom))",
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = location === item.href;
        return (
          <Link key={item.href} href={item.href}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                padding: "6px 10px",
                borderRadius: 12,
                cursor: "pointer",
                minWidth: 44,
                transition: "background 0.18s",
                background: isActive ? "rgba(99,102,241,0.12)" : "transparent",
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: isActive ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)",
                  border: isActive ? "1px solid rgba(99,102,241,0.35)" : "1px solid rgba(255,255,255,0.08)",
                  transition: "background 0.18s, border-color 0.18s",
                }}
              >
                <item.icon
                  style={{
                    width: 16,
                    height: 16,
                    color: isActive ? "#818cf8" : "rgba(255,255,255,0.4)",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: "0.6rem",
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  color: isActive ? "#818cf8" : "rgba(255,255,255,0.35)",
                  whiteSpace: "nowrap",
                }}
              >
                {item.label}
              </span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
