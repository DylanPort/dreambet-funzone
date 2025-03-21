
import React, { useEffect } from 'react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { Coins, Trophy, RefreshCw, User } from 'lucide-react';
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
        <div className="w-10 h-10 bg-dream-accent2/20 rounded-full"></div>
        <div className="flex-1">
          <div className="h-4 bg-dream-accent1/20 rounded w-24 mb-2"></div>
          <div className="h-3 bg-dream-accent1/10 rounded w-16"></div>
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
    <div className="glass-panel p-4 rounded-lg relative overflow-hidden bg-[#121a2e] border border-green-500/30">
      <div className="absolute inset-0 bg-gradient-to-r from-[#00ff9d]/10 to-[#00ffe0]/10 animate-gradient-move shadow-[0_0_15px_rgba(0,255,150,0.2)] after:content-[''] after:absolute after:inset-0 after:bg-[#00ff8a]/5 after:z-0"></div>
      
      <div className="flex items-center space-x-4 relative z-10">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00ff9d]/20 to-[#00ffe0]/20 flex items-center justify-center border border-[#00ff9d]/20 shadow-[0_0_10px_rgba(0,255,150,0.2)]">
          <Coins className="w-6 h-6 text-[#00ffe0]" />
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold text-white drop-shadow-[0_0_2px_rgba(0,255,150,0.3)]">{userProfile.pxbPoints.toLocaleString()}</h3>
            <button 
              onClick={handleRefresh} 
              className="p-1 rounded-full hover:bg-[#00ff9d]/10 transition-colors"
              title="Refresh PXB Points"
            >
              <RefreshCw className="w-4 h-4 text-[#00ffe0]" />
            </button>
          </div>
          <p className="text-[#00ffe0]/70 text-sm">PXB Points</p>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-[#00ff9d]/10 flex justify-between items-center text-xs text-dream-foreground/60">
        <div className="flex items-center">
          <User className="w-3 h-3 mr-1 text-[#00ffe0]" />
          <span className="font-medium text-dream-foreground/80">{displayName}</span>
        </div>
        <span>#{userProfile.id.substring(0, 8)}</span>
      </div>
    </div>
  );
};

export default PXBPointsBalance;
