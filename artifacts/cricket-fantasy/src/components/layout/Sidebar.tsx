import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Swords, Users, Gavel, BookOpen,
  LogOut, Settings, ChevronLeft, ChevronRight,
  Target, BarChart2, Star, UserCircle, Radio, X,
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
  { href: "/live",        label: "Live Score",  icon: Radio },
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
          gap: collapsed ? 0 : 10,
          padding: collapsed ? "0" : "0 10px",
          height: 40,
          justifyContent: collapsed ? "center" : "flex-start",
          borderRadius: 12, cursor: "pointer",
          transition: "background 0.18s",
          background: active ? "rgba(124,111,247,0.14)" : "transparent",
          WebkitTapHighlightColor: "transparent",
        }}
        onMouseEnter={e => {
          if (!active) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.05)";
        }}
        onMouseLeave={e => {
          if (!active) (e.currentTarget as HTMLDivElement).style.background = "transparent";
        }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: active ? "rgba(124,111,247,0.22)" : "rgba(255,255,255,0.04)",
          transition: "all 0.18s",
        }}>
          <Icon style={{
            width: 15, height: 15,
            color: active ? "#a89ff9" : "rgba(255,255,255,0.38)",
          }} />
        </div>
        {!collapsed && (
          <span style={{
            fontSize: "0.86rem", fontWeight: active ? 700 : 500,
            color: active ? "#e0ddff" : "rgba(255,255,255,0.45)",
            whiteSpace: "nowrap", transition: "color 0.18s",
          }}>
            {label}
          </span>
        )}
        {active && !collapsed && (
          <div style={{
            width: 4, height: 4, borderRadius: "50%",
            background: "#7C6FF7", marginLeft: "auto",
          }} />
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
      background: "rgba(9,12,24,0.95)",
      backdropFilter: "blur(32px) saturate(200%)",
      WebkitBackdropFilter: "blur(32px) saturate(200%)",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      position: "relative",
    }}>

      {/* Logo row */}
      <div style={{
        height: 62, display: "flex", alignItems: "center",
        justifyContent: (!isMobile && collapsed) ? "center" : "space-between",
        padding: (!isMobile && collapsed) ? "0" : "0 14px",
        borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0,
      }}>
        {(isMobile || !collapsed) && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: "linear-gradient(135deg, #7C6FF7, #6055d8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 16px rgba(124,111,247,0.4)",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 7l9 5 9-5-9-5zM3 17l9 5 9-5M3 12l9 5 9-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#fff", lineHeight: 1.1 }}>Colosseum</div>
              <div style={{ fontSize: "0.6rem", color: "rgba(124,111,247,0.8)", fontWeight: 600, letterSpacing: "0.05em" }}>IPL 2026</div>
            </div>
          </div>
        )}
        {!isMobile && collapsed && (
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "linear-gradient(135deg, #7C6FF7, #6055d8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 16px rgba(124,111,247,0.4)",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7l9 5 9-5-9-5zM3 17l9 5 9-5M3 12l9 5 9-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
        {isMobile && onClose && (
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 10,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "rgba(255,255,255,0.5)",
          }}>
            <X size={15} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{
        flex: 1, padding: "10px 10px", display: "flex",
        flexDirection: "column", gap: 2, overflowY: "auto", overflowX: "hidden",
      }}>
        {!collapsed && !isMobile && (
          <div className="section-label" style={{ padding: "8px 10px 4px" }}>Navigation</div>
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
        padding: "10px", borderTop: "1px solid rgba(255,255,255,0.05)",
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
            gap: collapsed ? 0 : 10, padding: collapsed ? "0" : "0 10px",
            height: 40, justifyContent: collapsed ? "center" : "flex-start",
            borderRadius: 12, cursor: "pointer", width: "100%",
            background: "transparent", border: "none", transition: "background 0.18s",
            WebkitTapHighlightColor: "transparent",
          }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(220,38,38,0.08)"}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}>
          <div style={{
            width: 32, height: 32, borderRadius: 10, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(255,255,255,0.04)",
          }}>
            <LogOut size={14} style={{ color: "rgba(255,100,100,0.6)" }} />
          </div>
          {(isMobile || !collapsed) && (
            <span style={{ fontSize: "0.86rem", fontWeight: 500, color: "rgba(255,100,100,0.6)" }}>
              Sign out
            </span>
          )}
        </button>
      </div>

      {/* Collapse toggle — desktop only */}
      {!isMobile && (
        <button onClick={toggle} style={{
          position: "absolute", right: -12, top: "50%", transform: "translateY(-50%)",
          width: 24, height: 24, borderRadius: "50%",
          background: "rgba(9,12,24,0.95)", border: "1px solid rgba(255,255,255,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", zIndex: 10, transition: "all 0.2s",
        }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "#7C6FF7";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#7C6FF7";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(9,12,24,0.95)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)";
          }}>
          {collapsed
            ? <ChevronRight size={11} style={{ color: "rgba(255,255,255,0.6)" }} />
            : <ChevronLeft  size={11} style={{ color: "rgba(255,255,255,0.6)" }} />}
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
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
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
