import { lazy, Suspense, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppProvider } from "@/context/AppContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { apiJson } from "@/lib/api";
import { IPL_MATCHES_KEY, IPL_STANDINGS_KEY } from "@/hooks/use-ipl-data";

/* ───────── Eagerly-imported sidebar pages ─────────
 * These are the pages users visit via the sidebar constantly.
 * Importing them eagerly means no Suspense fallback on navigation —
 * switching tabs is instant because the code is already in the bundle.
 */
import Dashboard   from "@/pages/Dashboard";
import Matches     from "@/pages/Matches";
import Players     from "@/pages/Players";
import MyTeams     from "@/pages/MyTeams";
import Auction     from "@/pages/Auction";
import Predictions from "@/pages/Predictions";
import Guide       from "@/pages/Guide";
import Leaderboard from "@/pages/Leaderboard";
import LiveScore   from "@/pages/LiveScore";
import Watchlist   from "@/pages/Watchlist";
import Profile     from "@/pages/Profile";

/* ───────── Lazy-loaded sub-pages ─────────
 * Less-visited flows that are fine to load on demand.
 */
const ResetPassword   = lazy(() => import("@/pages/ResetPassword"));
const JoinAuction     = lazy(() => import("@/pages/JoinAuction"));
const CreateAuction   = lazy(() => import("@/pages/CreateAuction"));
const AuctionRoom     = lazy(() => import("@/pages/AuctionRoom"));
const AuctionComplete = lazy(() => import("@/pages/AuctionComplete"));
const AuthPages       = lazy(() => import("@/pages/Auth"));
const NotFound        = lazy(() => import("@/pages/not-found"));

/* ───────── Query client ─────────
 * - staleTime 2 min so intra-session navigation always hits cache
 * - refetchOnWindowFocus off — live score does its own polling
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60_000,
      gcTime: 10 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/* Prefetch IPL data into cache on app load so Matches/Dashboard
 * pages render with data immediately. */
function prefetchIplData() {
  queryClient.prefetchQuery({
    queryKey: IPL_MATCHES_KEY,
    queryFn: () => apiJson<{ matches: unknown[] }>("/ipl/matches"),
    staleTime: 2 * 60_000,
  }).catch(() => {});
  queryClient.prefetchQuery({
    queryKey: IPL_STANDINGS_KEY,
    queryFn: () => apiJson<{ standings: unknown[] }>("/ipl/standings"),
    staleTime: 5 * 60_000,
  }).catch(() => {});
}

/* Prefetch lazy sub-page chunks in idle time so even those are fast. */
function prefetchLazyChunks() {
  const schedule = (fn: () => void) =>
    typeof requestIdleCallback !== "undefined"
      ? requestIdleCallback(fn, { timeout: 4000 })
      : setTimeout(fn, 500);

  [
    () => import("@/pages/JoinAuction"),
    () => import("@/pages/CreateAuction"),
    () => import("@/pages/AuctionRoom"),
    () => import("@/pages/AuctionComplete"),
  ].forEach((load, i) => schedule(() => setTimeout(() => load().catch(() => {}), i * 100)));
}

function AppFallback() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#07080f",
      color: "rgba(255,255,255,0.4)", fontSize: "0.9rem",
    }}>
      Loading…
    </div>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();
  if (loading) return <AppFallback />;
  if (!user) return <Redirect to="/login" />;
  return <Component />;
}

function AppRoutes() {
  const [location] = useLocation();
  const isAuthRoute = location === "/login" || location === "/register";

  if (isAuthRoute) {
    return (
      <>
        <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
          <img
            src="/register-bg.jpeg"
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
          />
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(135deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.55) 100%)",
          }} />
        </div>
        <Suspense fallback={<AppFallback />}>
          <AuthPages mode={location === "/register" ? "register" : "login"} />
        </Suspense>
      </>
    );
  }

  return (
    <Suspense fallback={<AppFallback />}>
      <Switch>
        <Route path="/"                 component={() => <ProtectedRoute component={Dashboard} />} />
        <Route path="/matches"          component={() => <ProtectedRoute component={Matches} />} />
        <Route path="/players"          component={() => <ProtectedRoute component={Players} />} />
        <Route path="/my-teams"         component={() => <ProtectedRoute component={MyTeams} />} />
        <Route path="/auction"          component={() => <ProtectedRoute component={Auction} />} />
        <Route path="/auction/join"     component={() => <ProtectedRoute component={JoinAuction} />} />
        <Route path="/auction/create"   component={() => <ProtectedRoute component={CreateAuction} />} />
        <Route path="/auction/room"     component={() => <ProtectedRoute component={AuctionRoom} />} />
        <Route path="/auction/complete" component={() => <ProtectedRoute component={AuctionComplete} />} />
        <Route path="/predictions"      component={() => <ProtectedRoute component={Predictions} />} />
        <Route path="/guide"            component={() => <ProtectedRoute component={Guide} />} />
        <Route path="/leaderboard"      component={() => <ProtectedRoute component={Leaderboard} />} />
        <Route path="/live"             component={() => <ProtectedRoute component={LiveScore} />} />
        <Route path="/watchlist"        component={() => <ProtectedRoute component={Watchlist} />} />
        <Route path="/profile"          component={() => <ProtectedRoute component={Profile} />} />
        <Route path="/reset-password"   component={ResetPassword} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  useEffect(() => {
    prefetchIplData();
    prefetchLazyChunks();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <AppProvider>
              <SidebarProvider>
                <AppRoutes />
              </SidebarProvider>
            </AppProvider>
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
