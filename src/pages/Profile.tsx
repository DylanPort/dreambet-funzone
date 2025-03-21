
import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { toast } from 'sonner';
import { formatTimeRemaining } from '@/utils/betUtils';
import { supabase } from '@/integrations/supabase/client';
import PXBProfilePanel from '@/components/PXBProfilePanel';
import PXBStatsPanel from '@/components/PXBStatsPanel';
import PXBBetsHistory from '@/components/PXBBetsHistory';
import PXBWallet from '@/components/PXBWallet';

const Profile = () => {
  const { connected, publicKey } = useWallet();
  const { userProfile, isLoading, fetchUserProfile, fetchUserBets } = usePXBPoints();
  const [localPxbPoints, setLocalPxbPoints] = useState<number | null>(null);

  useEffect(() => {
    if (connected && publicKey) {
      fetchUserProfile();
    }
  }, [connected, publicKey, fetchUserProfile]);

  useEffect(() => {
    if (connected && publicKey) {
      const walletAddress = publicKey.toString();
      const usersSubscription = supabase.channel('users-points-changes')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `wallet_address=eq.${walletAddress}`
        }, payload => {
          if (payload.new && typeof payload.new.points === 'number') {
            setLocalPxbPoints(payload.new.points);
          }
        })
        .subscribe();
      
      return () => {
        supabase.removeChannel(usersSubscription);
      };
    }
  }, [connected, publicKey]);

  useEffect(() => {
    if (userProfile && userProfile.pxbPoints !== undefined) {
      setLocalPxbPoints(userProfile.pxbPoints);
    }
  }, [userProfile]);

  if (!connected || !publicKey) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-24 px-4 md:px-8 max-w-7xl mx-auto flex justify-center items-center bg-black">
          <div className="glass-panel p-10 flex flex-col items-center">
            <div className="w-20 h-20 mb-6 bg-dream-foreground/10 rounded-full flex items-center justify-center">
              <img src="/lovable-uploads/575dd9fd-27d8-443c-8167-0af64089b9cc.png" alt="Profile" className="w-12 h-12" />
            </div>
            <h2 className="text-xl font-display font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-dream-foreground/70 text-center mb-6">You need to connect your wallet to access your profile.</p>
          </div>
        </main>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-24 px-4 md:px-8 max-w-7xl mx-auto flex justify-center items-center bg-black">
          <div className="glass-panel p-10 flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-t-transparent border-dream-accent1 rounded-full animate-spin mb-4"></div>
            <p className="text-dream-foreground/70">Loading profile...</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 px-4 md:px-8 max-w-7xl mx-auto bg-black">
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
          {/* Left column - Profile info */}
          <div className="lg:col-span-3">
            <PXBProfilePanel 
              userProfile={userProfile} 
              publicKey={publicKey} 
              localPxbPoints={localPxbPoints || userProfile?.pxbPoints || 0} 
            />
          </div>
          
          {/* Right column - PXB Wallet and Stats */}
          <div className="lg:col-span-4 space-y-6">
            {/* Add PXB Wallet at the top */}
            <div className="block w-full">
              <PXBWallet />
            </div>
            
            {/* PXB Stats Panel */}
            <div className="block w-full">
              <PXBStatsPanel userProfile={userProfile} />
            </div>
            
            {/* Betting History */}
            <PXBBetsHistory />
          </div>
        </div>
      </main>
    </>
  );
};

export default Profile;
