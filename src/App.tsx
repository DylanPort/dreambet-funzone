import React, { Suspense, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import Index from './pages';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import TokenBetting from './pages/TokenBetting';
import TokenDetail from './pages/TokenDetail';
import BettingDashboard from './pages/BettingDashboard';
import MyBets from './pages/MyBets';
import BetDetails from './pages/BetDetails';
import PointsBettingDashboard from './pages/PointsBettingDashboard';
import NotFound from './pages/NotFound';
import { Toaster } from '@/components/ui/sonner';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { checkSupabaseTables } from '@/integrations/supabase/client';
import PXBBountyPage from './pages/PXBBountyPage';
import PXBBountyDetailPage from './pages/PXBBountyDetailPage';

function App() {
  const { connected } = useWallet();
  const { fetchUserProfile } = usePXBPoints();
  const location = useLocation();

  useEffect(() => {
    // Check Supabase tables on app load
    checkSupabaseTables()
      .then(tablesExist => {
        if (tablesExist) {
          console.log('Supabase tables exist, proceeding...');
        } else {
          console.warn('Supabase tables do not exist, some features may not work.');
        }
      });
  }, []);

  useEffect(() => {
    // Fetch user profile when wallet connects
    if (connected) {
      fetchUserProfile();
    }
  }, [connected, fetchUserProfile]);

  // Track route changes for analytics
  useEffect(() => {
    console.log('Route changed to:', location.pathname);
    // You can add your analytics code here
  }, [location]);

  return (
    <div className="relative flex flex-col min-h-screen">
      <Toaster />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/token-betting" element={<TokenBetting />} />
          <Route path="/token/:tokenId" element={<TokenDetail />} />
          <Route path="/betting" element={<BettingDashboard />} />
          <Route path="/betting/mine" element={<MyBets />} />
          <Route path="/betting/my-bets" element={<MyBets />} />
          <Route path="/betting/:betId" element={<BetDetails />} />
          <Route path="/points-betting" element={<PointsBettingDashboard />} />
          <Route path="/bounties" element={<React.Suspense fallback={<div>Loading...</div>}><PXBBountyPage /></React.Suspense>} />
          <Route path="/bounties/:id" element={<React.Suspense fallback={<div>Loading...</div>}><PXBBountyDetailPage /></React.Suspense>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
    </div>
  );
}

export default App;
