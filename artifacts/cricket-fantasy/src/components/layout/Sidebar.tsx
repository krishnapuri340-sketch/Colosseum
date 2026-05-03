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

/* ──────────────────────────────────────────────
   NAV ITEM
   - Active: full-width crimson gradient PILL with a
     circular icon orb on the left and bold white label
   - Inactive: subtle icon tile + soft gray label
────────────────────────────────────────────── */
function NavItem({ href, label, Icon, active, collapsed, onClick }: {
  href: string; label: string; Icon: React.ElementType;
  active: boolean; collapsed: boolean; onClick?: () => void;
}) {
  return (
    <Link href={href} onClick={onClick}>
      <div
        title={collapsed ? label : undefined}
        className="press-sm"
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: collapsed ? 0 : 10,
          padding: collapsed ? "0" : "4px 8px",
          height: 42,
          justifyContent: collapsed ? "center" : "flex-start",
          borderRadius: 11,
          cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
          transition: "background 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease",
          /* Active = glassmorphic crimson-tinted pill (subtle) */
          background: active
            ? "linear-gradient(135deg, rgba(192,25,44,0.18) 0%, rgba(192,25,44,0.10) 60%, rgba(192,25,44,0.06) 100%)"
            : "transparent",
          backdropFilter: active ? "blur(20px) saturate(180%)" : undefined,
          WebkitBackdropFilter: active ? "blur(20px) saturate(180%)" : undefined,
          border: active
            ? "1px solid rgba(192,25,44,0.28)"
            : "1px solid transparent",
          boxShadow: active
            ? "0 1px 0 rgba(255,255,255,0.06) inset, 0 4px 16px rgba(192,25,44,0.10)"
            : "none",
        }}
        onMouseEnter={e => {
          if (!active) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)";
        }}
        onMouseLeave={e => {
          if (!active) (e.currentTarget as HTMLDivElement).style.background = "transparent";
        }}
      >
        {/* Icon orb: tinted crimson glass when active, soft tile when not */}
        <div style={{
          width: 30, height: 30,
          borderRadius: active ? "50%" : 9,
          flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: active
            ? "linear-gradient(135deg, rgba(192,25,44,0.30) 0%, rgba(192,25,44,0.12) 100%)"
            : "rgba(255,255,255,0.04)",
          border: active
            ? "1px solid rgba(192,25,44,0.35)"
            : "1px solid rgba(255,255,255,0.06)",
          boxShadow: active
            ? "0 1px 0 rgba(255,255,255,0.10) inset"
            : "none",
          transition: "all 0.22s ease",
        }}>
          <Icon style={{
            width: 14, height: 14,
            color: active ? "#ff8a99" : "rgba(255,255,255,0.42)",
            transition: "color 0.22s ease",
          }} />
        </div>

        {!collapsed && (
          <span style={{
            fontSize: "0.82rem",
            fontWeight: active ? 700 : 500,
            color: active ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.55)",
            whiteSpace: "nowrap",
            letterSpacing: active ? "-0.01em" : "normal",
            transition: "color 0.22s ease",
          }}>
            {label}
          </span>
        )}

        {/* Subtle right-side accent dot when active */}
        {active && !collapsed && (
          <div style={{
            marginLeft: "auto",
            width: 5, height: 5, borderRadius: "50%",
            background: "rgba(224,85,114,0.85)",
            boxShadow: "0 0 8px rgba(192,25,44,0.5)",
          }} />
        )}
      </div>
    </Link>
  );
}

/* ──────────────────────────────────────────────
   SIDEBAR CONTENT
────────────────────────────────────────────── */
function SidebarContent({ collapsed, isMobile, onClose }: {
  collapsed: boolean; isMobile: boolean; onClose?: () => void;
}) {
  const [location] = useLocation();
  const { logout } = useAuth();
  const { toggle } = useSidebar();
  const isActive = (href: string) =>
    href === "/" ? location === "/" : location === href || location.startsWith(href + "/");

  const w = isMobile ? 264 : collapsed ? 72 : 252;

  return (
    <div style={{
      width: w, height: "100%",
      display: "flex", flexDirection: "column",
      background:
        "linear-gradient(180deg, rgba(11,14,32,0.96) 0%, rgba(8,10,24,0.98) 50%, rgba(6,8,20,0.99) 100%)",
      backdropFilter: "blur(36px) saturate(220%)",
      WebkitBackdropFilter: "blur(36px) saturate(220%)",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      /* Floating-panel feel: rounded right edge */
      borderTopRightRadius: isMobile ? 0 : 22,
      borderBottomRightRadius: isMobile ? 0 : 22,
      boxShadow: isMobile
        ? "none"
        : "inset -1px 0 0 rgba(255,255,255,0.03), 8px 0 32px rgba(0,0,0,0.35)",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* Crimson glow accent — top */}
      <div style={{
        position: "absolute", top: -40, left: "50%", transform: "translateX(-50%)",
        width: 180, height: 180,
        background: "radial-gradient(circle, rgba(192,25,44,0.15) 0%, transparent 65%)",
        pointerEvents: "none",
        filter: "blur(8px)",
      }} />

      {/* Crimson glow accent — bottom */}
      <div style={{
        position: "absolute", bottom: -60, left: -30,
        width: 160, height: 160,
        background: "radial-gradient(circle, rgba(192,25,44,0.10) 0%, transparent 70%)",
        pointerEvents: "none",
        filter: "blur(12px)",
      }} />

      {/* ═══════════ LOGO ═══════════ */}
      <div style={{
        position: "relative",
        zIndex: 1,
        height: 86,
        display: "flex",
        alignItems: "center",
        justifyContent: (!isMobile && collapsed) ? "center" : "space-between",
        padding: (!isMobile && collapsed) ? "0" : "0 16px",
        flexShrink: 0,
      }}>
        {(isMobile || !collapsed) && (
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <img src="/logo.png" alt="Colosseum" style={{
              width: 42, height: 42,
              borderRadius: "50%",
              flexShrink: 0,
              objectFit: "cover",
              filter: "drop-shadow(0 6px 18px rgba(192,25,44,0.35))",
            }} />
            <div>
              <div style={{
                fontWeight: 900,
                fontSize: "1.05rem",
                color: "#fff",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
              }}>Colosseum</div>
              <div style={{
                fontSize: "0.56rem",
                color: "rgba(192,25,44,0.95)",
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                marginTop: 2,
              }}>IPL 2026 · Fantasy</div>
            </div>
          </div>
        )}
        {!isMobile && collapsed && (
          <img src="/logo.png" alt="Colosseum" style={{
            width: 42, height: 42,
            borderRadius: "50%",
            objectFit: "cover",
            filter: "drop-shadow(0 6px 18px rgba(192,25,44,0.35))",
          }} />
        )}
        {isMobile && onClose && (
          <button onClick={onClose} aria-label="Close menu" style={{
            width: 34, height: 34, borderRadius: 11,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.09)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "rgba(255,255,255,0.55)",
          }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Divider line */}
      <div style={{
        height: 1, margin: "0 16px",
        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
        flexShrink: 0,
      }} />

      {/* ═══════════ NAV ═══════════ */}
      <nav style={{
        position: "relative", zIndex: 1,
        flex: 1,
        padding: "16px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        overflowY: "auto",
        overflowX: "hidden",
      }}>
        {!collapsed && !isMobile && (
          <div style={{
            padding: "2px 12px 10px",
            fontSize: "0.62rem",
            fontWeight: 700,
            color: "rgba(255,255,255,0.28)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}>
            Menu
          </div>
        )}
        {NAV.map(item => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            Icon={item.icon}
            active={isActive(item.href)}
            collapsed={!isMobile && collapsed}
            onClick={isMobile ? onClose : undefined}
          />
        ))}
      </nav>

      {/* ═══════════ BOTTOM (Settings + Logout) ═══════════ */}
      <div style={{
        position: "relative", zIndex: 1,
        margin: "0 12px 14px",
        padding: "10px",
        borderRadius: 16,
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.05)",
        display: "flex", flexDirection: "column", gap: 4,
        flexShrink: 0,
      }}>
        <NavItem
          href="/profile"
          label="Profile"
          Icon={UserCircle}
          active={isActive("/profile")}
          collapsed={!isMobile && collapsed}
          onClick={isMobile ? onClose : undefined}
        />
        <NavItem
          href="/profile"
          label="Settings"
          Icon={Settings}
          active={false}
          collapsed={!isMobile && collapsed}
          onClick={isMobile ? onClose : undefined}
        />
        <button
          onClick={() => logout()}
          aria-label="Sign out"
          className="press-sm"
          style={{
            display: "flex", alignItems: "center",
            gap: collapsed ? 0 : 10,
            padding: collapsed ? "0" : "4px 8px",
            height: 42,
            justifyContent: collapsed ? "center" : "flex-start",
            borderRadius: 11, cursor: "pointer", width: "100%",
            background: "transparent", border: "none",
            transition: "background 0.18s",
            WebkitTapHighlightColor: "transparent",
            fontFamily: "inherit",
          }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(220,38,38,0.10)"}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}
        >
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(220,38,38,0.10)",
            border: "1px solid rgba(220,38,38,0.18)",
          }}>
            <LogOut size={13} style={{ color: "rgba(255,120,130,0.85)" }} />
          </div>
          {(isMobile || !collapsed) && (
            <span style={{
              fontSize: "0.82rem", fontWeight: 600,
              color: "rgba(255,120,130,0.85)",
              letterSpacing: "-0.01em",
            }}>
              Log out
            </span>
          )}
        </button>
      </div>

      {/* ═══════════ COLLAPSE TOGGLE — desktop only ═══════════ */}
      {!isMobile && (
        <button
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            position: "absolute", right: -13, top: 96,
            width: 26, height: 26, borderRadius: "50%",
            background: "rgba(7,9,26,0.98)",
            border: "1px solid rgba(255,255,255,0.13)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", zIndex: 10,
            transition: "all 0.2s",
            boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "#c0192c";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#c0192c";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 14px rgba(192,25,44,0.55)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(7,9,26,0.98)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.13)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 10px rgba(0,0,0,0.5)";
          }}>
          {collapsed
            ? <ChevronRight size={11} style={{ color: "rgba(255,255,255,0.7)" }} />
            : <ChevronLeft  size={11} style={{ color: "rgba(255,255,255,0.7)" }} />}
        </button>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────
   SIDEBAR (desktop fixed + mobile drawer)
────────────────────────────────────────────── */
export function Sidebar() {
  const { collapsed, mobileOpen, closeMobile } = useSidebar();
  const w = collapsed ? 72 : 252;

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:block" style={{
        width: w, minWidth: w,
        height: "100vh",
        position: "fixed", left: 0, top: 0,
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
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }} />
          <div className="anim-slide-left" style={{
            position: "absolute", left: 0, top: 0, bottom: 0, width: 264,
          }}>
            <SidebarContent collapsed={false} isMobile={true} onClose={closeMobile} />
          </div>
        </div>
      )}
    </>
  );
}
