import { useLocation } from "wouter";
import { ChevronRight, Search, Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const PAGE_LABELS: Record<string, string> = {
  "/":               "Dashboard",
  "/matches":        "Matches",
  "/players":        "Players",
  "/my-teams":       "My Teams",
  "/auction":        "Auction",
  "/auction/create": "Create Auction",
  "/auction/room":   "Auction Room",
  "/predictions":    "Predictions",
  "/guide":          "Guide",
};

export function Header() {
  const [location] = useLocation();
  const { user }   = useAuth();

  const label = PAGE_LABELS[location] ?? location
    .split("/").filter(Boolean)
    .map(w => w.split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" "))
    .join(" · ");

  const displayName = user?.name ?? "Guest";
  const avatarSeed  = displayName.replace(/\s+/g, "");

  // Breadcrumb segments
  const parts = location.split("/").filter(Boolean);
  const crumbs: { label:string; href:string }[] = [{ label:"Colosseum", href:"/" }];
  if (parts[0]) {
    crumbs.push({ label: PAGE_LABELS[`/${parts[0]}`] ?? parts[0], href:`/${parts[0]}` });
  }
  if (parts[1]) {
    crumbs.push({ label: PAGE_LABELS[location] ?? parts[1], href: location });
  }

  return (
    <header className="flex items-center justify-between px-8 border-b border-white/5 bg-background/80 backdrop-blur-sm sticky top-0 z-40"
      style={{ height:70 }}>
      <div className="flex items-center gap-2 text-sm">
        {crumbs.map((c, i) => (
          <span key={c.href} className="flex items-center gap-2">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
            <span className={i === crumbs.length-1 ? "font-semibold text-foreground" : "text-muted-foreground"}>
              {c.label}
            </span>
          </span>
        ))}
      </div>

      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search matches, players..."
            className="w-64 h-10 bg-white/5 border border-white/10 rounded-full pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-white placeholder:text-muted-foreground"
          />
        </div>

        <button className="relative p-2 text-muted-foreground hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-background" />
        </button>

        <div className="flex items-center gap-3 pl-6 border-l border-white/10">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium">{displayName}</span>
            <span className="text-xs text-muted-foreground">{user?.email ?? ""}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-600 p-[2px]">
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
