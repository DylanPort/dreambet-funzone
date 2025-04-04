
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import SolanaWalletProvider from "./providers/SolanaWalletProvider";
import { PXBPointsProvider } from "./contexts/pxb/PXBPointsContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import TokenDetail from "./pages/TokenDetail";
import BettingDashboard from "./pages/BettingDashboard";
import TokenBetting from "./pages/TokenBetting";
import PXBSpace from "./pages/MyBets";
import BetDetails from "./pages/BetDetails";
import UserProfile from "./pages/UserProfile";
import Community from "./pages/Community";
import OnlineUsersSidebar from "./components/OnlineUsersSidebar";

// Configure Query Client with retry options for better error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Component to conditionally display OnlineUsersSidebar
const AppContent = () => {
  const location = useLocation();
  const isCommunityPage = location.pathname === "/community";
  
  return (
    <>
      {!isCommunityPage && (
        <div className="fixed right-4 top-24 z-50 hidden lg:block">
          <OnlineUsersSidebar className="w-60" />
        </div>
      )}
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:userId" element={<UserProfile />} />
        <Route path="/token/:id" element={<TokenDetail />} />
        <Route path="/betting" element={<BettingDashboard />} />
        <Route path="/betting/token/:id" element={<TokenBetting />} />
        <Route path="/betting/my-bets" element={<PXBSpace />} />
        <Route path="/betting/bet/:id" element={<BetDetails />} />
        <Route path="/community" element={<Community />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

function App() {
  console.log("App rendering");
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SolanaWalletProvider>
          <PXBPointsProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </PXBPointsProvider>
        </SolanaWalletProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
