import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Matches from "@/pages/Matches";
import Contests from "@/pages/Contests";
import Players from "@/pages/Players";
import MyTeams from "@/pages/MyTeams";
import Leaderboard from "@/pages/Leaderboard";
import Guide from "@/pages/Guide";
import AuthPages from "@/pages/Auth";
import { AuthProvider, useAuth } from "@/context/AuthContext";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0f1e",
        color: "rgba(255,255,255,0.5)",
        fontSize: "0.9rem",
      }}>
        Loading…
      </div>
    );
  }

  if (!user) return <Redirect to="/login" />;
  return <Component />;
}

function AppRoutes() {
  const [location] = useLocation();
  const isAuthRoute = location === "/login" || location === "/register";

  if (isAuthRoute) {
    return (
      <>
        {/* Fixed background — never remounts while on any auth route */}
        <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
          <img
            src="/register-bg.jpeg"
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.55) 100%)" }} />
        </div>
        {/* Card — rendered once, switches form internally without remounting */}
        <AuthPages mode={location === "/register" ? "register" : "login"} />
      </>
    );
  }

  return (
    <Switch>
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/contests" component={() => <ProtectedRoute component={Contests} />} />
      <Route path="/matches" component={() => <ProtectedRoute component={Matches} />} />
      <Route path="/players" component={() => <ProtectedRoute component={Players} />} />
      <Route path="/my-teams" component={() => <ProtectedRoute component={MyTeams} />} />
      <Route path="/leaderboard" component={() => <ProtectedRoute component={Leaderboard} />} />
      <Route path="/guide" component={() => <ProtectedRoute component={Guide} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
