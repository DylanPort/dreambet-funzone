
import React, { useState, useEffect } from 'react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { LeaderboardEntry } from '@/types/pxb';
import { useWallet } from '@solana/wallet-adapter-react';
import { Trophy, ArrowUpRight, User } from 'lucide-react';
import truncateAddress from '@/utils/truncateAddress';

const PXBLeaderboard = () => {
  const { leaderboard, fetchLeaderboard, isLeaderboardLoading } = usePXBPoints();
  const { publicKey } = useWallet();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    if (fetchLeaderboard) {
      fetchLeaderboard();
    }
  }, [fetchLeaderboard]);

  useEffect(() => {
    // Handle leaderboard processing safely
    if (Array.isArray(leaderboard) && leaderboard.length > 0) {
      // Limit to top 10 entries
      const topEntries = leaderboard.slice(0, Math.min(10, leaderboard.length));
      setLeaderboardData(topEntries);

      // Find user's rank if they're connected
      if (publicKey) {
        const userWalletAddress = publicKey.toString();
        const userEntry = leaderboard.find(entry => 
          entry.wallet === userWalletAddress || 
          entry.walletAddress === userWalletAddress
        );
        
        if (userEntry) {
          setUserRank(userEntry.rank);
        } else {
          setUserRank(null);
        }
      }
    } else {
      // Ensure we have an empty array if leaderboard is undefined/null
      setLeaderboardData([]);
      setUserRank(null);
    }
  }, [leaderboard, publicKey]);

  if (isLeaderboardLoading) {
    return (
      <div className="text-center p-6">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-3"></div>
          <p className="text-sm text-dream-foreground/70">Loading leaderboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center">
          <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
          Points Leaderboard
        </h2>
        
        {userRank && (
          <div className="text-sm text-dream-foreground/70">
            Your Rank: <span className="font-bold text-yellow-400">#{userRank}</span>
          </div>
        )}
      </div>
      
      {leaderboardData && leaderboardData.length > 0 ? (
        <div className="space-y-2">
          {leaderboardData.map((entry, index) => (
            <div 
              key={`${entry.id}-${index}`}
              className={`flex items-center justify-between p-3 rounded-lg ${
                publicKey && (entry.wallet === publicKey.toString() || entry.walletAddress === publicKey.toString()) 
                  ? 'bg-yellow-500/10 border border-yellow-500/30' 
                  : 'bg-dream-surface/20 hover:bg-dream-surface/30'
              } transition-colors`}
            >
              <div className="flex items-center">
                <div className={`
                  w-7 h-7 rounded-full flex items-center justify-center mr-3
                  ${index === 0 ? 'bg-yellow-500/20 text-yellow-400' : 
                    index === 1 ? 'bg-slate-300/20 text-slate-300' : 
                    index === 2 ? 'bg-amber-600/20 text-amber-600' : 
                    'bg-dream-surface/30 text-dream-foreground/70'}
                `}>
                  {entry.rank || index + 1}
                </div>
                
                <div>
                  <div className="flex items-center">
                    {entry.username ? (
                      <span className="font-semibold">{entry.username}</span>
                    ) : (
                      <div className="flex items-center">
                        <User className="w-3 h-3 mr-1 text-dream-foreground/50" />
                        <span className="font-mono text-sm text-dream-foreground/80">
                          {truncateAddress(entry.wallet || entry.walletAddress, 4)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-bold">
                  {(entry.points || entry.pxbPoints || 0).toLocaleString()} PXB
                </div>
                {entry.winRate && (
                  <div className="text-xs text-green-400 flex items-center justify-end">
                    {entry.winRate.toFixed(1)}% Win Rate
                    <ArrowUpRight className="w-3 h-3 ml-1" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-6 bg-dream-surface/20 rounded-lg">
          <p className="text-dream-foreground/70">No leaderboard data available</p>
        </div>
      )}
    </div>
  );
};

export default PXBLeaderboard;
