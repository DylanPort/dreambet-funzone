
import React from 'react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { Coins, Trophy } from 'lucide-react';

const PXBPointsBalance: React.FC = () => {
  const { userProfile, isLoading } = usePXBPoints();

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

  return (
    <div className="glass-panel p-4 rounded-lg relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-dream-accent1/10 to-dream-accent2/10 animate-gradient-move"></div>
      
      <div className="flex items-center space-x-4 relative z-10">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-dream-accent1/30 to-dream-accent2/30 flex items-center justify-center">
          <Coins className="w-6 h-6 text-dream-accent2" />
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">{userProfile.pxbPoints.toLocaleString()}</h3>
            <span className="text-xs text-dream-foreground/60">PXB Points</span>
          </div>
          
          <div className="flex items-center mt-1 text-dream-foreground/80">
            <Trophy className="w-4 h-4 mr-1 text-dream-accent1" />
            <span className="text-sm">{userProfile.reputation} Rep</span>
          </div>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-white/10 flex justify-between text-xs text-dream-foreground/60">
        <span>@{userProfile.username}</span>
        <span>#{userProfile.id.substring(0, 8)}</span>
      </div>
    </div>
  );
};

export default PXBPointsBalance;
