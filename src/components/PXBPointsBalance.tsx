
import React, { useEffect } from 'react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { Coins, RefreshCw, User } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const PXBPointsBalance: React.FC = () => {
  const { userProfile, isLoading, fetchUserProfile } = usePXBPoints();
  const { connected, publicKey } = useWallet();

  // Fetch user profile when component mounts
  useEffect(() => {
    if (connected) {
      fetchUserProfile();
    }
  }, [connected, fetchUserProfile]);

  const handleRefresh = () => {
    if (!connected) return;
    
    toast.info("Refreshing PXB points...");
    fetchUserProfile();
  };

  if (isLoading) {
    return (
      <div className="glass-panel animate-pulse p-3 rounded-lg flex items-center space-x-3">
        <div className="w-10 h-10 bg-green-500/20 rounded-full"></div>
        <div className="flex-1">
          <div className="h-4 bg-green-500/20 rounded w-24 mb-2"></div>
          <div className="h-3 bg-green-500/10 rounded w-16"></div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="glass-panel p-3 rounded-lg">
        <p className="text-sm text-dream-foreground/70">Connect to see your PXB Points</p>
      </div>
    );
  }

  // Get the display name - use username if available
  const displayName = userProfile.username || 
                     (publicKey ? publicKey.toString().substring(0, 8) : 'User');

  return (
    <div className="rounded-lg relative overflow-hidden border border-green-900/30 bg-[#0f1628] backdrop-blur-lg">
      <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 to-green-600/5"></div>
      
      <div className="p-4 flex items-center space-x-4 relative z-10">
        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
          <Coins className="w-6 h-6 text-green-400" />
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">{userProfile.pxbPoints.toLocaleString()}</h3>
            <button 
              onClick={handleRefresh} 
              className="p-1 rounded-full hover:bg-green-500/10 transition-colors"
              title="Refresh PXB Points"
            >
              <RefreshCw className="w-4 h-4 text-green-400" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-1 pt-2 px-4 pb-3 border-t border-green-900/20 flex justify-between items-center text-xs text-white/60">
        <div className="flex items-center">
          <User className="w-3 h-3 mr-1 text-green-400" />
          <span className="font-medium text-white/80">{displayName}</span>
        </div>
        <span>#{userProfile.id.substring(0, 8)}</span>
      </div>
    </div>
  );
};

export default PXBPointsBalance;
