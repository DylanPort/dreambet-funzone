import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import BettingDashboard from './pages/BettingDashboard';
import TokenDetail from './pages/TokenDetail';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import MyBets from './pages/MyBets';
import PointsBettingDashboard from './pages/PointsBettingDashboard';
import BetDetails from './pages/BetDetails';
import UserProfile from './pages/UserProfile';
import { Toaster } from '@/components/ui/toaster';
import { PXBPointsProvider } from '@/contexts/pxb/PXBPointsContext';
import { SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { mainnet, goerli } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import Portfolio from './pages/Portfolio';

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [
    mainnet,
    ...(process.env.NODE_ENV === 'development' ? [goerli] : []),
  ],
  [
    publicProvider(),
  ]
);

const config = createConfig({
  autoConnect: true,
  publicClient,
  webSocketPublicClient,
})

function App() {
  return (
    <SolanaWalletProvider>
      <WagmiConfig config={config}>
        <PXBPointsProvider>
          <BrowserRouter>
            <div className="bg-dream-background text-dream-foreground min-h-screen">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/betting" element={<BettingDashboard />} />
                <Route path="/token/:id" element={<TokenDetail />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/portfolio" element={<Portfolio />} /> {/* New Portfolio route */}
                <Route path="/bets" element={<MyBets />} />
                <Route path="/points-betting" element={<PointsBettingDashboard />} />
                <Route path="/bet/:id" element={<BetDetails />} />
                <Route path="/user/:id" element={<UserProfile />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
            </div>
          </BrowserRouter>
        </PXBPointsProvider>
      </WagmiConfig>
    </SolanaWalletProvider>
  );
}

export default App;
