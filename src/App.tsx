
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SolanaWalletProvider from "./providers/SolanaWalletProvider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import BettingDashboard from "./pages/BettingDashboard";
import TokenBetting from "./pages/TokenBetting";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SolanaWalletProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/betting" element={<BettingDashboard />} />
            <Route path="/token/:id" element={<TokenBetting />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SolanaWalletProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
