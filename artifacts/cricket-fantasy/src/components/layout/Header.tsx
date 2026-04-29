import { useLocation } from "wouter";
import { Menu, Search, Bell, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";

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
  "/leaderboard":    "Leaderboard",
};

export function Header() {
  const [location] = useLocation();
  const { user }   = useAuth();
  const { openMobile } = useSidebar();

  const displayName = user?.name ?? "Guest";
  const avatarSeed  = displayName.replace(/\s+/g, "");

  const parts = location.split("/").filter(Boolean);
  const crumbs: { label:string }[] = [{ label:"Colosseum" }];
  if (parts[0]) crumbs.push({ label: PAGE_LABELS[`/${parts[0]}`] ?? parts[0] });
  if (parts[1]) crumbs.push({ label: PAGE_LABELS[location] ?? parts[1] });

  return (
    <header
      className="flex items-center justify-between border-b border-white/5 bg-background/80 backdrop-blur-sm sticky top-0 z-40"
      style={{ height:60, padding:"0 16px" }}
    >
      {/* Left: hamburger (mobile) + breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          className="md:hidden flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl"
          style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)" }}
          onClick={openMobile}
        >
          <Menu className="w-4 h-4 text-white/70" />
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm min-w-0">
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && <ChevronRight className="w-3 h-3 text-white/30 flex-shrink-0" />}
              <span className={`truncate ${i === crumbs.length - 1
                ? "font-semibold text-white"
                : "text-white/40 hidden sm:block"}`}>
                {c.label}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Search — hidden on mobile */}
        <div className="relative hidden lg:block">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search players, matches..."
            className="w-56 h-9 bg-white/5 border border-white/10 rounded-full pl-9 pr-4 text-sm
              focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30
              text-white placeholder:text-white/30 transition-all"
          />
        </div>

        {/* Bell */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl"
          style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)" }}>
          <Bell className="w-4 h-4 text-white/50" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full
            ring-2 ring-background" />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-600 p-[2px]">
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`}
            alt={displayName}
            className="w-full h-full rounded-full bg-background object-cover"
          />
        </div>
      </div>
    </header>
  );
}
