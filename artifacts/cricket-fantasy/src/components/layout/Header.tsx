import { useLocation } from "wouter";
import { Search, Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

const ROUTE_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/contests": "Contests",
  "/matches": "Matches",
  "/players": "Players",
  "/my-teams": "My Teams",
  "/auction": "Auction",
  "/guide": "Guide",
};

export function Header() {
  const [location] = useLocation();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const label = ROUTE_LABELS[location] ?? "Dashboard";
  const displayName = user?.name ?? "Guest";
  const avatarSeed = displayName.replace(/\s+/g, "");

  if (isMobile) {
    return (
      <header
        style={{
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(7,8,15,0.8)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 40,
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: "1.05rem", color: "#f1f5f9", letterSpacing: "-0.01em" }}>
          {label}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button style={{ background: "none", border: "none", cursor: "pointer", position: "relative", padding: 4 }}>
            <Bell style={{ width: 20, height: 20, color: "rgba(255,255,255,0.5)" }} />
            <span style={{ position: "absolute", top: 4, right: 4, width: 7, height: 7, borderRadius: "50%", background: "#818cf8", border: "2px solid #07080f" }} />
          </button>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #9333ea)", padding: 2, flexShrink: 0 }}>
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`}
              alt={displayName}
              style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", background: "#07080f" }}
            />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-background/80 backdrop-blur-sm sticky top-0 z-40" style={{ flexShrink: 0 }}>
      <span className="font-semibold text-base text-foreground">{label}</span>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="w-52 h-9 bg-white/5 border border-white/10 rounded-full pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-all text-white placeholder:text-muted-foreground"
          />
        </div>

        <button className="relative p-2 text-muted-foreground hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-background" />
        </button>

        <div className="flex items-center gap-2.5 pl-4 border-l border-white/10">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-medium">{displayName}</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-purple-600 p-[2px]">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`}
              alt={displayName}
              className="w-full h-full rounded-full bg-background object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
