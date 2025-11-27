import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import Dashboard from "@/pages/Dashboard";
import ThreatFeeds from "@/pages/ThreatFeeds";
import CVEReports from "@/pages/CVEReports";
import Analytics from "@/pages/Analytics";
import ChatAssistant from "@/pages/ChatAssistant";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/threat-feeds" component={ThreatFeeds} />
      <Route path="/cve-reports" component={CVEReports} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/chat-assistant" component={ChatAssistant} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Switch>
            <Route path="/login" component={Login} />
            <Route path="/signup" component={Signup} />
            <Route>
              <ProtectedRoute>
                <div className="flex h-screen bg-background overflow-hidden">
                  <Sidebar />
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <TopBar />
                    <main className="flex-1 overflow-y-auto">
                      <Router />
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            </Route>
          </Switch>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
