import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import ParentDashboard from "@/pages/parent-dashboard";
import Login from "@/pages/login";
import Chores from "@/pages/chores";
import Wishlist from "@/pages/wishlist";
import Transactions from "@/pages/transactions";
import BonusManagement from "@/pages/bonus-management";
import DebugPage from "@/pages/debug";
import { useAuthStore } from "./store/auth-store";
import { Sidebar } from "./components/layout/sidebar";
import { MobileNav } from "./components/layout/mobile-nav";

function ProtectedRoute({ component: Component, ...rest }) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const user = useAuthStore(state => state.user);
  const isViewingAsChild = useAuthStore(state => state.isViewingAsChild);
  
  if (!isAuthenticated) {
    return <Route path="*" component={Login} />;
  }
  
  // Special case for the Dashboard to show parent-specific dashboard
  if (Component === Dashboard && user?.role === 'parent' && !isViewingAsChild()) {
    return <ParentDashboard {...rest} />;
  }
  
  return <Component {...rest} />;
}

function AppLayout({ children }) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return children;
  }
  
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/chores">
        <ProtectedRoute component={Chores} />
      </Route>
      <Route path="/wishlist">
        <ProtectedRoute component={Wishlist} />
      </Route>
      <Route path="/transactions">
        <ProtectedRoute component={Transactions} />
      </Route>
      <Route path="/bonus-management">
        <ProtectedRoute component={BonusManagement} />
      </Route>
      <Route path="/debug">
        <ProtectedRoute component={DebugPage} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { checkAuth, autoLoginEnabled } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check if user is authenticated on app load
    const init = async () => {
      try {
        console.log('Checking authentication status, auto-login:', autoLoginEnabled);
        await checkAuth();
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    init();
  }, [checkAuth, autoLoginEnabled]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="ticket-tracker-theme">
        <TooltipProvider>
          <Toaster />
          <AppLayout>
            <Router />
          </AppLayout>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
