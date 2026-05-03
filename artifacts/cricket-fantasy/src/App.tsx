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

/* ───────── Lazy-loaded routes ─────────
 * Each page becomes its own JS chunk so the initial bundle is small and
 * routes load on demand. The Suspense fallback below matches the auth
 * loading state so transitions stay calm.
 */
const Dashboard       = lazy(() => import("@/pages/Dashboard"));
const Matches         = lazy(() => import("@/pages/Matches"));
const Players         = lazy(() => import("@/pages/Players"));
const MyTeams         = lazy(() => import("@/pages/MyTeams"));
const Auction         = lazy(() => import("@/pages/Auction"));
const JoinAuction     = lazy(() => import("@/pages/JoinAuction"));
const CreateAuction   = lazy(() => import("@/pages/CreateAuction"));
const AuctionRoom     = lazy(() => import("@/pages/AuctionRoom"));
const AuctionComplete = lazy(() => import("@/pages/AuctionComplete"));
const Predictions     = lazy(() => import("@/pages/Predictions"));
const Guide           = lazy(() => import("@/pages/Guide"));
const Leaderboard     = lazy(() => import("@/pages/Leaderboard"));
const LiveScore       = lazy(() => import("@/pages/LiveScore"));
const Watchlist       = lazy(() => import("@/pages/Watchlist"));
const Profile         = lazy(() => import("@/pages/Profile"));
const AuthPages       = lazy(() => import("@/pages/Auth"));
const NotFound        = lazy(() => import("@/pages/not-found"));

/* ───────── Background chunk prefetch ─────────
 * Fire-and-forget imports after the first paint so all sidebar pages
 * are already in the module cache before the user clicks them.
 * Uses requestIdleCallback when available so it never blocks the UI.
 */
const PAGE_IMPORTS = [
  () => import("@/pages/Matches"),
  () => import("@/pages/Players"),
  () => import("@/pages/MyTeams"),
  () => import("@/pages/Auction"),
  () => import("@/pages/JoinAuction"),
  () => import("@/pages/CreateAuction"),
  () => import("@/pages/AuctionRoom"),
  () => import("@/pages/AuctionComplete"),
  () => import("@/pages/Predictions"),
  () => import("@/pages/Guide"),
  () => import("@/pages/Leaderboard"),
  () => import("@/pages/LiveScore"),
  () => import("@/pages/Watchlist"),
  () => import("@/pages/Profile"),
  () => import("@/pages/Dashboard"),
];

function prefetchChunks() {
  const schedule = (cb: () => void) => {
    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(cb, { timeout: 3000 });
    } else {
      setTimeout(cb, 200);
    }
  };

  PAGE_IMPORTS.forEach((load, i) => {
    schedule(() => {
      setTimeout(() => load().catch(() => {}), i * 80);
    });
  });
}

/* ───────── Query client with sensible defaults ─────────
 * - staleTime 2min so intra-session navigation always hits cache
 * - retry 1 to absorb the occasional flaky request without piling on
 * - refetchOnWindowFocus off — the live ticker / live score do explicit polling
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

/* Prefetch IPL data into the query cache so pages that show
 * matches/standings have data ready before they mount. */
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
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  useEffect(() => {
    prefetchChunks();
    prefetchIplData();
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
