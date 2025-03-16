
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SolanaWalletProvider from "./providers/SolanaWalletProvider";
import { PXBPointsProvider } from "./contexts/pxb/PXBPointsContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import TokenDetail from "./pages/TokenDetail";
import BettingDashboard from "./pages/BettingDashboard";
import TokenBetting from "./pages/TokenBetting";
import MyBets from "./pages/MyBets";

const queryClient = new QueryClient();

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
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/token/:id" element={<TokenDetail />} />
                <Route path="/betting" element={<BettingDashboard />} />
                <Route path="/betting/token/:id" element={<TokenBetting />} />
                <Route path="/betting/my-bets" element={<MyBets />} />
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
