import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "./services/queryClient";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SolanaWalletProvider from "./providers/SolanaWalletProvider";
import { PXBPointsProvider } from "./contexts/pxb/PXBPointsContext";
import RouteGuard from "./components/RouteGuard";
import Home from "./pages/Home";
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
import ImagePage from "./pages/ImagePage";

// Use the createQueryClient function for better error handling
const queryClient = createQueryClient();

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
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/image" element={<ImagePage />} />
                
                {/* Protected routes - will redirect to home */}
                <Route path="/index" element={<RouteGuard><Index /></RouteGuard>} />
                <Route path="/profile" element={<RouteGuard><Profile /></RouteGuard>} />
                <Route path="/profile/:userId" element={<RouteGuard><UserProfile /></RouteGuard>} />
                <Route path="/token/:id" element={<RouteGuard><TokenDetail /></RouteGuard>} />
                <Route path="/betting" element={<RouteGuard><BettingDashboard /></RouteGuard>} />
                <Route path="/betting/token/:id" element={<RouteGuard><TokenBetting /></RouteGuard>} />
                <Route path="/betting/my-bets" element={<RouteGuard><PXBSpace /></RouteGuard>} />
                <Route path="/betting/bet/:id" element={<RouteGuard><BetDetails /></RouteGuard>} />
                <Route path="/community" element={<RouteGuard><Community /></RouteGuard>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </PXBPointsProvider>
        </SolanaWalletProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
