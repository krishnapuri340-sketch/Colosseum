import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { RightPanel } from "./RightPanel";
import { useLocation } from "wouter";
import { useSidebar } from "@/context/SidebarContext";
import { Link } from "wouter";
import { LayoutDashboard, Swords, Gavel, Target, Users } from "lucide-react";

// Bottom nav items for mobile (5 most-used)
const BOTTOM_NAV = [
  { href:"/",            label:"Home",    icon:LayoutDashboard },
  { href:"/matches",     label:"Matches", icon:Swords },
  { href:"/auction",     label:"Auction", icon:Gavel },
  { href:"/predictions", label:"Predict", icon:Target },
  { href:"/players",     label:"Players", icon:Users },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const showRightPanel = location === "/";
  const { collapsed } = useSidebar();

  const sidebarW = collapsed ? 64 : 256;

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location === href || location.startsWith(href + "/");

  return (
    <div
      className="h-screen text-foreground overflow-hidden"
      style={{
        background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.18) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(192,25,44,0.08) 0%, transparent 60%), #07080f",
        display:"flex", flexDirection:"column",
      }}
    >
      {/* ── DESKTOP layout: sidebar + content side by side ── */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        <Sidebar />
        <div
          className={`flex-1 flex flex-col min-w-0 ${showRightPanel ? "xl:mr-80" : ""}`}
          style={{ marginLeft: sidebarW, transition:"margin-left 0.22s ease" }}
        >
          <Header />
          <main
            className="flex-1 overflow-x-hidden overflow-y-auto p-6 xl:p-8"
            style={{ background:"rgba(255,255,255,0.02)" }}
          >
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
        {showRightPanel && <RightPanel />}
      </div>

      {/* ── MOBILE layout: header + scrollable content + bottom nav ── */}
      <div className="md:hidden flex flex-col flex-1 overflow-hidden">
        <Sidebar /> {/* renders mobile drawer when open */}
        <Header />
        <main
          className="flex-1 overflow-x-hidden overflow-y-auto"
          style={{
            background:"rgba(255,255,255,0.02)",
            padding:"16px 16px 80px", // 80px bottom padding for nav bar
          }}
        >
          {children}
        </main>

        {/* ── BOTTOM NAV BAR ── */}
        <nav
          style={{
            position:"fixed", bottom:0, left:0, right:0, zIndex:50,
            height:60, display:"flex", alignItems:"stretch",
            background:"rgba(6,7,14,0.97)",
            borderTop:"1px solid rgba(255,255,255,0.08)",
            backdropFilter:"blur(20px)",
            WebkitBackdropFilter:"blur(20px)",
            // Safe area for iPhone home bar
            paddingBottom:"env(safe-area-inset-bottom)",
          }}
        >
          {BOTTOM_NAV.map(item => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <div
                  style={{
                    flex:1, display:"flex", flexDirection:"column",
                    alignItems:"center", justifyContent:"center", gap:3,
                    padding:"8px 4px", cursor:"pointer", minWidth:0,
                    WebkitTapHighlightColor:"transparent",
                  }}
                >
                  <div style={{
                    width:32, height:32, borderRadius:9,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    background: active ? "rgba(192,25,44,0.18)" : "transparent",
                    transition:"background 0.18s",
                  }}>
                    <item.icon style={{
                      width:18, height:18,
                      color: active ? "#f87171" : "rgba(255,255,255,0.35)",
                    }} />
                  </div>
                  <span style={{
                    fontSize:"0.6rem", fontWeight: active ? 700 : 500,
                    color: active ? "#f87171" : "rgba(255,255,255,0.35)",
                    letterSpacing:"0.02em", lineHeight:1,
                  }}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
