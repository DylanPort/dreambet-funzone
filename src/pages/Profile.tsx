
import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { formatTimeRemaining } from '@/utils/betUtils';
import { supabase } from '@/integrations/supabase/client';
import PXBProfilePanel from '@/components/PXBProfilePanel';
import PXBStatsPanel from '@/components/PXBStatsPanel';
import PXBBetsHistory from '@/components/PXBBetsHistory';
import { PXBWallet } from '@/components/PXBWallet';

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
        <main className="min-h-screen bg-[#080b16] bg-gradient-to-b from-[#0a0e1c] to-[#070a14]">
          <div className="max-w-7xl mx-auto px-4 md:px-8 pt-24 pb-16 flex justify-center items-center min-h-[80vh]">
            <div className="w-full max-w-md p-8 rounded-2xl bg-[#0f1628]/80 backdrop-blur-lg border border-indigo-900/30 text-center">
              <div className="w-20 h-20 mb-6 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto">
                <img src="/lovable-uploads/575dd9fd-27d8-443c-8167-0af64089b9cc.png" alt="Profile" className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-display font-bold mb-4 text-white">Connect Your Wallet</h2>
              <p className="text-indigo-300/70 mb-6">You need to connect your wallet to access your profile.</p>
              <Button 
                variant="default" 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2"
              >
                Connect Wallet
              </Button>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[#080b16] bg-gradient-to-b from-[#0a0e1c] to-[#070a14]">
          <div className="max-w-7xl mx-auto px-4 md:px-8 pt-24 pb-16 flex justify-center items-center min-h-[80vh]">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-t-transparent border-indigo-500 rounded-full animate-spin mb-4"></div>
              <p className="text-indigo-300/70">Loading profile...</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#080b16] bg-gradient-to-b from-[#0a0e1c] to-[#070a14]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-24 pb-16 space-y-8">
          <div className="w-full">
            <PXBWallet />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">
            <div className="lg:col-span-3">
              <PXBProfilePanel 
                userProfile={userProfile} 
                publicKey={publicKey} 
                localPxbPoints={localPxbPoints || userProfile?.pxbPoints || 0} 
              />
            </div>
            
            <div className="lg:col-span-4">
              <div className="w-full">
                <PXBStatsPanel userProfile={userProfile} />
              </div>
            </div>
          </div>
          
          <div className="w-full">
            <div className="overflow-hidden rounded-xl border border-indigo-900/30 backdrop-blur-lg bg-[#010608]">
              <div className="p-6 border-b border-indigo-900/30 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Your Betting History</h2>
              </div>
              <div className="p-6">
                <PXBBetsHistory 
                  userId={userProfile?.id} 
                  walletAddress={publicKey.toString()}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Profile;
