import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import OrbitingParticles from '@/components/OrbitingParticles';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import PXBProfilePanel from '@/components/PXBProfilePanel';
import PXBStatsPanel from '@/components/PXBStatsPanel';
import PXBWallet from '@/components/PXBWallet';
import TradeActivity from '@/components/TradeActivity';
import PXBOnboardingNotice from '@/components/PXBOnboardingNotice';
import { toast } from 'sonner';

const Profile = () => {
  const { userProfile } = usePXBPoints();
  
  useEffect(() => {
    // No need to fetch user bets in trade-focused app
  }, []);
  
  if (!userProfile) {
    return (
      <>
        <OrbitingParticles />
        <Navbar />
        <main className="pt-24 min-h-screen overflow-hidden px-4 pb-16">
          <PXBOnboardingNotice />
        </main>
      </>
    );
  }
  
  return (
    <>
      <OrbitingParticles />
      <Navbar />
      
      <main className="pt-24 min-h-screen overflow-hidden px-4 pb-16">
        <div className="max-w-5xl mx-auto">
          <Link to="/betting" className="inline-flex items-center text-dream-foreground/70 hover:text-dream-foreground mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          
          <div className="grid md:grid-cols-12 gap-6">
            {/* Left Column - Profile & Stats */}
            <div className="md:col-span-4 space-y-6">
              <PXBProfilePanel />
              <PXBStatsPanel />
            </div>
            
            {/* Right Column - Wallet & Activity */}
            <div className="md:col-span-8 space-y-6">
              <PXBWallet />
              <TradeActivity userId={userProfile.id} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Profile;
