import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { Header } from "./Header";
import { RightPanel } from "./RightPanel";
import { useLocation } from "wouter";
import { useSidebar } from "@/context/SidebarContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const showRightPanel = location === "/";
  const { collapsed } = useSidebar();
  const isMobile = useIsMobile();

  return (
    <div
      className="min-h-screen text-foreground flex overflow-hidden selection:bg-primary/30"
      style={{
        background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.18) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(192,25,44,0.08) 0%, transparent 60%), #07080f",
      }}
    >
      <Sidebar />

      <div
        className={`flex-1 flex flex-col ${showRightPanel && !isMobile ? 'xl:mr-80' : ''}`}
        style={{
          marginLeft: isMobile ? 0 : (collapsed ? 64 : 256),
          transition: "margin-left 0.22s ease",
        }}
      >
        <Header />

        <main
          className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8"
          style={{
            background: "rgba(255,255,255,0.025)",
            backdropFilter: "blur(2px)",
            paddingBottom: isMobile ? "calc(80px + env(safe-area-inset-bottom))" : undefined,
          }}
        >
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {showRightPanel && !isMobile && <RightPanel />}
      {isMobile && <BottomNav />}
    </div>
  );
}
