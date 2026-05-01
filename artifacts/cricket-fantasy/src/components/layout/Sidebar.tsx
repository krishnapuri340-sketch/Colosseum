import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Swords, Users, Gavel,
  BookOpen, LogOut, Settings, ChevronLeft, ChevronRight,
  Target, Trophy, Menu, X, BarChart2, Radio, Star, UserCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";

const NAV = [
  { href:"/",            label:"Dashboard",   icon:LayoutDashboard },
  { href:"/matches",     label:"Matches",     icon:Swords },
  { href:"/players",     label:"Players",     icon:Users },
  { href:"/auction",     label:"Auction",     icon:Gavel },
  { href:"/predictions", label:"Predictions", icon:Target },
  { href:"/leaderboard", label:"Leaderboard", icon:BarChart2 },
  { href:"/live",        label:"Live Score",  icon:Radio },
  { href:"/watchlist",   label:"Watchlist",   icon:Star },
  { href:"/guide",       label:"Guide",       icon:BookOpen },
];

function NavItem({ href, label, Icon, active, collapsed, onClick }:
  { href:string; label:string; Icon:React.ElementType; active:boolean; collapsed:boolean; onClick?:()=>void }) {
  return (
    <Link href={href} onClick={onClick}>
      <div title={collapsed ? label : undefined}
        style={{ display:"flex", alignItems:"center", gap:12,
          padding:collapsed ? "10px 0" : "9px 12px",
          justifyContent:collapsed ? "center" : "flex-start",
          borderRadius:12, cursor:"pointer",
          transition:"background 0.18s, border-color 0.18s",
          background:active ? "rgba(192,25,44,0.1)" : "transparent",
          border:active ? "1px solid rgba(192,25,44,0.22)" : "1px solid transparent",
          WebkitTapHighlightColor:"transparent" }}
        onMouseEnter={e=>{ if(!active)(e.currentTarget as HTMLDivElement).style.background="rgba(255,255,255,0.04)"; }}
        onMouseLeave={e=>{ if(!active)(e.currentTarget as HTMLDivElement).style.background="transparent"; }}>
        <div style={{ width:32, height:32, borderRadius:"50%", flexShrink:0,
          display:"flex", alignItems:"center", justifyContent:"center",
          background:active ? "rgba(192,25,44,0.2)" : "rgba(255,255,255,0.05)",
          border:active ? "1px solid rgba(192,25,44,0.35)" : "1px solid rgba(255,255,255,0.08)",
          transition:"all 0.18s" }}>
          <Icon style={{ width:14, height:14, color:active ? "#f87171" : "rgba(255,255,255,0.45)" }} />
        </div>
        {!collapsed && (
          <span style={{ fontSize:"0.875rem", fontWeight:500,
            color:active ? "#e2e8f0" : "rgba(255,255,255,0.4)", whiteSpace:"nowrap" }}>
            {label}
          </span>
        )}
      </div>
    </Link>
  );
}

function SidebarContent({ collapsed, isMobile, onClose }:
  { collapsed:boolean; isMobile:boolean; onClose?:()=>void }) {
  const [location] = useLocation();
  const { logout } = useAuth();
  const { toggle } = useSidebar();

  const isActive = (href:string) =>
    href==="/" ? location==="/" : location===href || location.startsWith(href+"/");

  return (
    <div style={{ width:isMobile?260:(collapsed?64:256), height:"100%",
      display:"flex", flexDirection:"column",
      background:"rgba(6,7,14,0.97)",
      borderRight:"1px solid rgba(255,255,255,0.07)",
      position:"relative" }}>

      {/* Logo */}
      <div style={{ height:64, display:"flex", alignItems:"center",
        justifyContent:(!isMobile&&collapsed)?"center":"space-between",
        padding:(!isMobile&&collapsed)?"0":"0 16px",
        borderBottom:"1px solid rgba(255,255,255,0.05)", flexShrink:0 }}>
        {(isMobile||!collapsed) && (
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:30, height:30, borderRadius:9,
              background:"linear-gradient(135deg,rgba(192,25,44,0.35),rgba(192,25,44,0.12))",
              border:"1px solid rgba(192,25,44,0.35)",
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Trophy style={{ width:14, height:14, color:"#f87171" }} />
            </div>
            <span style={{ fontWeight:700, fontSize:"0.95rem",
              color:"#f1f5f9", letterSpacing:"-0.02em" }}>Colosseum</span>
          </div>
        )}
        {!isMobile&&collapsed && (
          <div style={{ width:30, height:30, borderRadius:9,
            background:"linear-gradient(135deg,rgba(192,25,44,0.35),rgba(192,25,44,0.12))",
            border:"1px solid rgba(192,25,44,0.35)",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Trophy style={{ width:14, height:14, color:"#f87171" }} />
          </div>
        )}
        {isMobile&&onClose && (
          <button onClick={onClose}
            style={{ width:32, height:32, borderRadius:8,
              background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
              display:"flex", alignItems:"center", justifyContent:"center",
              cursor:"pointer", color:"rgba(255,255,255,0.5)" }}>
            <X style={{ width:15, height:15 }} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:"12px 10px", display:"flex",
        flexDirection:"column", gap:3, overflowY:"auto", overflowX:"hidden" }}>
        {NAV.map(item => (
          <NavItem key={item.href} href={item.href} label={item.label}
            Icon={item.icon} active={isActive(item.href)}
            collapsed={!isMobile&&collapsed}
            onClick={isMobile?onClose:undefined} />
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ padding:"10px", borderTop:"1px solid rgba(255,255,255,0.05)",
        display:"flex", flexDirection:"column", gap:3 }}>
        <NavItem href="#" label="Settings" Icon={Settings}
          active={false} collapsed={!isMobile&&collapsed} />
        <button onClick={logout}
          style={{ display:"flex", alignItems:"center", gap:12,
            padding:(!isMobile&&collapsed)?"10px 0":"9px 12px",
            justifyContent:(!isMobile&&collapsed)?"center":"flex-start",
            borderRadius:12, cursor:"pointer", width:"100%",
            background:"transparent", border:"1px solid transparent",
            transition:"background 0.18s", WebkitTapHighlightColor:"transparent" }}
          onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(220,38,38,0.07)";}}
          onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="transparent";}}>
          <div style={{ width:32, height:32, borderRadius:"50%", flexShrink:0,
            display:"flex", alignItems:"center", justifyContent:"center",
            background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.09)" }}>
            <LogOut style={{ width:14, height:14, color:"rgba(255,255,255,0.45)" }} />
          </div>
          {(isMobile||!collapsed) && (
            <span style={{ fontSize:"0.875rem", fontWeight:500,
              color:"rgba(255,255,255,0.4)" }}>Log out</span>
          )}
        </button>
      </div>

      {/* Desktop collapse toggle */}
      {!isMobile && (
        <button onClick={toggle}
          style={{ position:"absolute", right:-12, top:"50%", transform:"translateY(-50%)",
            width:24, height:24, borderRadius:"50%",
            background:"rgba(15,16,24,0.9)", border:"1px solid rgba(255,255,255,0.13)",
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", zIndex:10, boxShadow:"0 2px 8px rgba(0,0,0,0.4)",
            transition:"background 0.2s, border-color 0.2s" }}
          onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(192,25,44,0.25)";(e.currentTarget as HTMLButtonElement).style.borderColor="rgba(192,25,44,0.4)";}}
          onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(15,16,24,0.9)";(e.currentTarget as HTMLButtonElement).style.borderColor="rgba(255,255,255,0.13)";}}>
          {collapsed
            ? <ChevronRight style={{ width:12, height:12, color:"rgba(255,255,255,0.6)" }} />
            : <ChevronLeft  style={{ width:12, height:12, color:"rgba(255,255,255,0.6)" }} />}
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
      <aside className="hidden lg:block"
        style={{ width:collapsed?64:256, minWidth:collapsed?64:256,
          height:"100vh", position:"fixed", left:0, top:0,
          transition:"width 0.22s ease, min-width 0.22s ease",
          zIndex:50, overflow:"visible",
          backdropFilter:"blur(20px) saturate(140%)",
          WebkitBackdropFilter:"blur(20px) saturate(140%)" }}>
        <SidebarContent collapsed={collapsed} isMobile={false} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden" style={{ position:"fixed", inset:0, zIndex:100 }}>
          <div onClick={closeMobile}
            style={{ position:"absolute", inset:0,
              background:"rgba(0,0,0,0.65)", backdropFilter:"blur(3px)" }} />
          <div style={{ position:"absolute", left:0, top:0, bottom:0, width:260,
            animation:"slideInLeft 0.22s ease" }}>
            <SidebarContent collapsed={false} isMobile={true} onClose={closeMobile} />
          </div>
        </div>
      )}

      <style>{`@keyframes slideInLeft{from{transform:translateX(-100%)}to{transform:translateX(0)}}`}</style>
    </>
  );
}
