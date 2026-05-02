import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useLocation, Link } from "wouter";
import { useSidebar } from "@/context/SidebarContext";
import { LayoutDashboard, Swords, Gavel, Target, Trophy } from "lucide-react";
import { StadiumAmbient } from "@/components/effects/StadiumAmbient";
import { LiveTicker } from "@/components/effects/LiveTicker";

const BOTTOM_NAV = [
  { href: "/",            label: "Home",    icon: LayoutDashboard },
  { href: "/matches",     label: "Matches", icon: Swords },
  { href: "/auction",     label: "Auction", icon: Gavel },
  { href: "/predictions", label: "Predict", icon: Target },
  { href: "/leaderboard", label: "Ranks",   icon: Trophy },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { collapsed } = useSidebar();
  const sidebarW = collapsed ? 64 : 256;

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location === href || location.startsWith(href + "/");

  return (
    <div className="h-screen text-foreground overflow-hidden flex flex-col relative">

      {/* Ambient stadium background — fixed, behind all content */}
      <StadiumAmbient />

      {/* ── DESKTOP ── */}
      <div className="hidden lg:flex flex-1 overflow-hidden relative" style={{ zIndex: 1 }}>
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0"
          style={{ marginLeft: sidebarW, transition: "margin-left 0.22s ease" }}>
          <Header />
          <LiveTicker />
          <main className="flex-1 overflow-x-hidden overflow-y-auto"
            style={{ padding: "20px 24px 24px" }}>
            <div className="max-w-6xl mx-auto stagger-children">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* ── MOBILE ── */}
      <div className="lg:hidden flex flex-col flex-1 overflow-hidden relative" style={{ zIndex: 1 }}>
        <Sidebar />
        <Header />
        <LiveTicker />
        <main className="flex-1 overflow-x-hidden overflow-y-auto"
          style={{ padding: "14px 14px 88px" }}>
          <div className="stagger-children">
            {children}
          </div>
        </main>

        {/* Bottom nav bar */}
        <nav style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
          paddingBottom: "env(safe-area-inset-bottom)",
          background: "rgba(9,12,24,0.92)",
          backdropFilter: "blur(28px) saturate(200%)",
          WebkitBackdropFilter: "blur(28px) saturate(200%)",
          borderTop: "1px solid rgba(255,255,255,0.07)",
        }}>
          <div style={{
            display: "flex", alignItems: "stretch",
            height: 60, padding: "6px 8px 8px",
          }}>
            {BOTTOM_NAV.map(item => {
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href} style={{
                  flex: 1, display: "flex", minWidth: 0,
                  WebkitTapHighlightColor: "transparent",
                }}>
                  <div className="press" style={{
                    flex: 1, display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    gap: 3, cursor: "pointer", borderRadius: 12,
                    background: active ? "rgba(192,25,44,0.14)" : "transparent",
                    transition: "background 0.2s",
                  }}>
                    <item.icon style={{
                      width: 19, height: 19,
                      color: active ? "#e05572" : "rgba(255,255,255,0.3)",
                      transition: "color 0.2s",
                    }} />
                    <span style={{
                      fontSize: "0.58rem", fontWeight: active ? 800 : 500,
                      color: active ? "#e05572" : "rgba(255,255,255,0.3)",
                      letterSpacing: "0.03em", lineHeight: 1,
                      transition: "color 0.2s",
                    }}>
                      {item.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
