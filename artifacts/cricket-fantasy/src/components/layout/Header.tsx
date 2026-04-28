import { Link, useLocation } from "wouter";
import { ChevronRight, Search, Bell } from "lucide-react";

export function Header() {
  const [location] = useLocation();
  
  const pathParts = location.split('/').filter(Boolean);
  const currentPath = pathParts.length > 0 ? pathParts[0] : 'Dashboard';
  const capitalizedPath = currentPath.charAt(0).toUpperCase() + currentPath.slice(1);

  return (
    <header className="h-20 flex items-center justify-between px-8 border-b border-white/5 bg-background/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Pages</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium text-foreground">{capitalizedPath.replace('-', ' ')}</span>
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
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-background"></span>
        </button>

        <div className="flex items-center gap-3 pl-6 border-l border-white/10">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium">Alex Strat</span>
            <span className="text-xs text-muted-foreground">Pro Member</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-600 p-[2px]">
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Alex`} 
              alt="User" 
              className="w-full h-full rounded-full bg-background object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
