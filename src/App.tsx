import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import PointsBettingDashboard from '@/pages/PointsBettingDashboard';
import Profile from '@/pages/Profile';
import PointsCommunity from '@/pages/PointsCommunity';
import BetDetails from '@/pages/BetDetails';
import UserProfile from '@/pages/UserProfile';
import TokenBetting from '@/pages/TokenBetting';
import TokenDetail from '@/pages/TokenDetail';
import MyBets from '@/pages/MyBets';
import NotFound from '@/pages/NotFound';
import { SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { PXBPointsProvider } from '@/contexts/PXBPointsContext';
import Trading from '@/pages/Trading';
import TokenTrading from '@/pages/TokenTrading';
import TokenPortfolio from '@/pages/TokenPortfolio';

function App() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  const closeMobileMenu = () => {
    setShowMobileMenu(false);
  };

  return (
    <SolanaWalletProvider>
      <PXBPointsProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/points-betting" element={<PointsBettingDashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/community" element={<PointsCommunity />} />
          <Route path="/bets/:id" element={<BetDetails />} />
          <Route path="/user/:id" element={<UserProfile />} />
          <Route path="/token-betting/:id" element={<TokenBetting />} />
          <Route path="/token/:id" element={<TokenDetail />} />
          <Route path="/bets" element={<MyBets />} />
          <Route path="/trading" element={<Trading />} />
          <Route path="/trading/token/:id" element={<TokenTrading />} />
          <Route path="/trading/portfolio" element={<TokenPortfolio />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </PXBPointsProvider>
    </SolanaWalletProvider>
  );
}

export default App;
