import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { RightPanel } from "./RightPanel";
import { useLocation } from "wouter";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const showRightPanel = location === "/";

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden selection:bg-primary/30">
      <Sidebar />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ml-20 lg:ml-64 ${showRightPanel ? 'xl:mr-80' : ''}`}>
        <Header />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {showRightPanel && <RightPanel />}
    </div>
  );
}
