
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import SolanaWalletProvider from './providers/SolanaWalletProvider';
import Navbar from './components/Navbar';
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import BettingDashboard from './pages/BettingDashboard';
import TokenBetting from './pages/TokenBetting';
import MyBets from './pages/MyBets';
import PointsBettingDashboard from './pages/PointsBettingDashboard';
import TokenDetail from './pages/TokenDetail';
import NotFound from './pages/NotFound';
import BetReel from './components/BetReel';
import PXBBetCreatedAlert from './components/PXBBetCreatedAlert';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SolanaWalletProvider>
        <Router>
          <div className="min-h-screen bg-dream-background text-dream-foreground overflow-x-hidden">
            <Navbar />
            <BetReel />
            
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/betting" element={<BettingDashboard />} />
              <Route path="/betting/token/:tokenId" element={<TokenBetting />} />
              <Route path="/my-bets" element={<MyBets />} />
              <Route path="/betting/points" element={<PointsBettingDashboard />} />
              <Route path="/token/:tokenId" element={<TokenDetail />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            
            <PXBBetCreatedAlert />
            <Toaster position="bottom-right" />
          </div>
        </Router>
      </SolanaWalletProvider>
    </QueryClientProvider>
  );
}

export default App;
