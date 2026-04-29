import { createContext, useContext, useState, useEffect } from "react";

interface SidebarContextValue {
  collapsed: boolean;   // desktop: icon-only mode
  mobileOpen: boolean;  // mobile: drawer open
  toggle: () => void;
  openMobile: () => void;
  closeMobile: () => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  collapsed: false, mobileOpen: false,
  toggle: () => {}, openMobile: () => {}, closeMobile: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("sidebar_collapsed") === "1"; } catch { return false; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    const close = () => setMobileOpen(false);
    window.addEventListener("popstate", close);
    return () => window.removeEventListener("popstate", close);
  }, []);

  const toggle = () => setCollapsed(v => {
    const next = !v;
    try { localStorage.setItem("sidebar_collapsed", next ? "1" : "0"); } catch {}
    return next;
  });

  return (
    <SidebarContext.Provider value={{
      collapsed, mobileOpen,
      toggle,
      openMobile:  () => setMobileOpen(true),
      closeMobile: () => setMobileOpen(false),
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() { return useContext(SidebarContext); }
