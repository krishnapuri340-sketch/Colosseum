import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Swords, Users, Gavel, BookOpen,
  LogOut, Settings, ChevronLeft, ChevronRight,
  Target, BarChart2, Star, UserCircle, X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";

const NAV = [
  { href: "/",            label: "Dashboard",   icon: LayoutDashboard },
  { href: "/matches",     label: "Matches",     icon: Swords },
  { href: "/players",     label: "Players",     icon: Users },
  { href: "/auction",     label: "Auction",     icon: Gavel },
  { href: "/predictions", label: "Predictions", icon: Target },
  { href: "/leaderboard", label: "Leaderboard", icon: BarChart2 },
  { href: "/watchlist",   label: "Watchlist",   icon: Star },
  { href: "/guide",       label: "Guide",       icon: BookOpen },
];

function NavItem({ href, label, Icon, active, collapsed, onClick }: {
  href: string; label: string; Icon: React.ElementType;
  active: boolean; collapsed: boolean; onClick?: () => void;
}) {
  return (
    <Link href={href} onClick={onClick}>
      <div title={collapsed ? label : undefined} className="press-sm"
        style={{
          display: "flex", alignItems: "center",
          gap: collapsed ? 0 : 11,
          padding: collapsed ? "0" : "0 10px",
          height: 44,
          justifyContent: collapsed ? "center" : "flex-start",
          borderRadius: 12, cursor: "pointer",
          transition: "background 0.18s, box-shadow 0.18s",
          background: active ? "rgba(192,25,44,0.15)" : "transparent",
          boxShadow: active ? "inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 12px rgba(192,25,44,0.12)" : "none",
          WebkitTapHighlightColor: "transparent",
          position: "relative",
        }}
        onMouseEnter={e => {
          if (!active) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.055)";
        }}
        onMouseLeave={e => {
          if (!active) (e.currentTarget as HTMLDivElement).style.background = "transparent";
        }}>

        {/* Active left seam line */}
        {active && (
          <div style={{
            position: "absolute", left: 0, top: "20%", bottom: "20%",
            width: 3, borderRadius: 9999,
            background: "linear-gradient(180deg, #e05572, #c0192c)",
            boxShadow: "0 0 8px rgba(192,25,44,0.6)",
          }} />
        )}

        <div style={{
          width: 32, height: 32, borderRadius: 9, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: active
            ? "linear-gradient(135deg, rgba(192,25,44,0.30), rgba(192,25,44,0.15))"
            : "rgba(255,255,255,0.045)",
          border: active ? "1px solid rgba(192,25,44,0.3)" : "1px solid rgba(255,255,255,0.06)",
          transition: "all 0.18s",
          boxShadow: active ? "0 2px 8px rgba(192,25,44,0.18)" : "none",
        }}>
          <Icon style={{
            width: 15, height: 15,
            color: active ? "#e05572" : "rgba(255,255,255,0.36)",
          }} />
        </div>
        {!collapsed && (
          <span style={{
            fontSize: "0.87rem", fontWeight: active ? 700 : 500,
            color: active ? "#f0eeff" : "rgba(255,255,255,0.42)",
            whiteSpace: "nowrap", transition: "color 0.18s",
          }}>
            {label}
          </span>
        )}
        {active && !collapsed && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 2 }}>
            {/* Cricket seam dots — two small dots like ball seam */}
            <div style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(192,25,44,0.7)" }} />
            <div style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(192,25,44,0.4)" }} />
          </div>
        )}
      </div>
    </Link>
  );
}

function SidebarContent({ collapsed, isMobile, onClose }: {
  collapsed: boolean; isMobile: boolean; onClose?: () => void;
}) {
  const [location] = useLocation();
  const { logout } = useAuth();
  const { toggle } = useSidebar();
  const isActive = (href: string) =>
    href === "/" ? location === "/" : location === href || location.startsWith(href + "/");

  const w = isMobile ? 260 : collapsed ? 64 : 256;

  return (
    <div style={{
      width: w, height: "100%", display: "flex", flexDirection: "column",
      background: "linear-gradient(180deg, rgba(7,9,26,0.97) 0%, rgba(9,12,24,0.98) 100%)",
      backdropFilter: "blur(36px) saturate(220%)",
      WebkitBackdropFilter: "blur(36px) saturate(220%)",
      borderRight: "1px solid rgba(255,255,255,0.07)",
      position: "relative",
    }}>

      {/* Subtle cricket ball decoration — top corner */}
      <div style={{
        position: "absolute", top: -20, right: -20,
        width: 80, height: 80, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(192,25,44,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Logo row */}
      <div style={{
        height: 70, display: "flex", alignItems: "center",
        justifyContent: (!isMobile && collapsed) ? "center" : "space-between",
        padding: (!isMobile && collapsed) ? "0" : "0 14px",
        borderBottom: "1px solid rgba(255,255,255,0.055)", flexShrink: 0,
      }}>
        {(isMobile || !collapsed) && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0, overflow: "hidden",
              boxShadow: "0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(192,25,44,0.2)",
            }}>
              <img src="/logo.png" alt="Colosseum" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: "0.97rem", color: "#fff", lineHeight: 1.1, letterSpacing: "-0.01em" }}>Colosseum</div>
              <div style={{ fontSize: "0.58rem", color: "rgba(192,25,44,0.85)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>IPL 2026 🏏</div>
            </div>
          </div>
        )}
        {!isMobile && collapsed && (
          <div style={{
            width: 34, height: 34, borderRadius: 10, overflow: "hidden",
            boxShadow: "0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(192,25,44,0.2)",
          }}>
            <img src="/logo.png" alt="Colosseum" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
        {isMobile && onClose && (
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 10,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "rgba(255,255,255,0.5)",
          }}>
            <X size={15} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{
        flex: 1, padding: "12px 10px", display: "flex",
        flexDirection: "column", gap: 2, overflowY: "auto", overflowX: "hidden",
      }}>
        {!collapsed && !isMobile && (
          <div className="section-label" style={{ padding: "4px 10px 8px" }}>Navigation</div>
        )}
        {NAV.map(item => (
          <NavItem key={item.href} href={item.href} label={item.label}
            Icon={item.icon} active={isActive(item.href)}
            collapsed={!isMobile && collapsed}
            onClick={isMobile ? onClose : undefined} />
        ))}
      </nav>

      {/* Bottom */}
      <div style={{
        padding: "10px", borderTop: "1px solid rgba(255,255,255,0.055)",
        display: "flex", flexDirection: "column", gap: 2,
      }}>
        <NavItem href="/profile" label="Profile" Icon={UserCircle}
          active={isActive("/profile")} collapsed={!isMobile && collapsed}
          onClick={isMobile ? onClose : undefined} />
        <NavItem href="#" label="Settings" Icon={Settings}
          active={false} collapsed={!isMobile && collapsed} />
        <button onClick={() => logout()}
          className="press-sm"
          style={{
            display: "flex", alignItems: "center",
            gap: collapsed ? 0 : 11, padding: collapsed ? "0" : "0 10px",
            height: 44, justifyContent: collapsed ? "center" : "flex-start",
            borderRadius: 12, cursor: "pointer", width: "100%",
            background: "transparent", border: "none", transition: "background 0.18s",
            WebkitTapHighlightColor: "transparent",
          }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(220,38,38,0.09)"}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}>
          <div style={{
            width: 32, height: 32, borderRadius: 9, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <LogOut size={14} style={{ color: "rgba(255,100,100,0.55)" }} />
          </div>
          {(isMobile || !collapsed) && (
            <span style={{ fontSize: "0.86rem", fontWeight: 500, color: "rgba(255,100,100,0.55)" }}>
              Sign out
            </span>
          )}
        </button>
      </div>

      {/* Collapse toggle — desktop only */}
      {!isMobile && (
        <button onClick={toggle} style={{
          position: "absolute", right: -13, top: "50%", transform: "translateY(-50%)",
          width: 26, height: 26, borderRadius: "50%",
          background: "rgba(7,9,26,0.98)",
          border: "1px solid rgba(255,255,255,0.13)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", zIndex: 10, transition: "all 0.2s",
          boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
        }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "#c0192c";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#c0192c";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 12px rgba(192,25,44,0.5)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(7,9,26,0.98)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.13)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.4)";
          }}>
          {collapsed
            ? <ChevronRight size={11} style={{ color: "rgba(255,255,255,0.65)" }} />
            : <ChevronLeft  size={11} style={{ color: "rgba(255,255,255,0.65)" }} />}
        </button>
      )}
    </div>
  );
}

export function Sidebar() {
  const { collapsed, mobileOpen, closeMobile } = useSidebar();

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:block" style={{
        width: collapsed ? 64 : 256, minWidth: collapsed ? 64 : 256,
        height: "100vh", position: "fixed", left: 0, top: 0,
        transition: "width 0.22s ease, min-width 0.22s ease",
        zIndex: 50,
      }}>
        <SidebarContent collapsed={collapsed} isMobile={false} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden" style={{ position: "fixed", inset: 0, zIndex: 100 }}>
          <div onClick={closeMobile} style={{
            position: "absolute", inset: 0,
            background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
          }} />
          <div className="anim-slide-left" style={{
            position: "absolute", left: 0, top: 0, bottom: 0, width: 260,
          }}>
            <SidebarContent collapsed={false} isMobile={true} onClose={closeMobile} />
          </div>
        </div>
      )}
    </>
  );
}
