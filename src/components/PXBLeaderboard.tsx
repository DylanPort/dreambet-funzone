
import React, { useEffect } from 'react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { Trophy, Medal, User, ArrowUp } from 'lucide-react';

const PXBLeaderboard: React.FC = () => {
  const { leaderboard, fetchLeaderboard, userProfile } = usePXBPoints();

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const getLeaderIcon = (position: number) => {
    switch(position) {
      case 0:
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      case 1:
        return <Medal className="w-5 h-5 text-gray-300" />;
      case 2:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <User className="w-5 h-5 text-dream-foreground/40" />;
    }
  };

  return (
    <div className="glass-panel p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-dream-accent3/10 to-dream-accent1/10 animate-gradient-move"></div>
      
      <div className="flex items-center mb-4 relative z-10">
        <Trophy className="w-6 h-6 mr-2 text-dream-accent2" />
        <h2 className="text-xl font-bold">Leaderboard</h2>
      </div>
      
      <div className="space-y-3">
        {leaderboard.map((trader, index) => (
          <div key={trader.id} className={`flex items-center p-2 rounded-lg ${
            trader.id === userProfile?.id ? 'bg-dream-accent2/20 border border-dream-accent2/30' : 'bg-dream-foreground/5'
          }`}>
            <div className="w-8 h-8 rounded-full bg-dream-foreground/10 flex items-center justify-center mr-3">
              {getLeaderIcon(index)}
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between">
                <div className="font-medium">{trader.username}</div>
                <div className="text-dream-accent1">{trader.pxbPoints} PXB</div>
              </div>
              
              <div className="flex items-center text-xs text-dream-foreground/60">
                <ArrowUp className="w-3 h-3 mr-1 text-green-400" />
                <span>{trader.reputation} reputation</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PXBLeaderboard;
