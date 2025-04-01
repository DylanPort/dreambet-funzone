
import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { LeaderboardEntry, WinRateLeaderboardEntry } from '@/types/pxb';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { User, Trophy, Award, Percent } from 'lucide-react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';

interface PXBLeaderboardProps {
  limit?: number;
  className?: string;
}

const PXBLeaderboard: React.FC<PXBLeaderboardProps> = ({ limit = 5, className = '' }) => {
  const { 
    leaderboard, 
    winRateLeaderboard, 
    fetchLeaderboard, 
    fetchWinRateLeaderboard,
    isLeaderboardLoading,
    isLoadingWinRate
  } = usePXBPoints();
  
  const [activeTab, setActiveTab] = useState<string>('points');
  
  useEffect(() => {
    if (fetchLeaderboard) {
      fetchLeaderboard();
    }
  }, [fetchLeaderboard]);
  
  useEffect(() => {
    if (activeTab === 'winrate' && fetchWinRateLeaderboard) {
      fetchWinRateLeaderboard();
    }
  }, [activeTab, fetchWinRateLeaderboard]);

  // Filter out extremely high point values (like 1B supply)
  // Using 100M as a reasonable upper limit for legitimate scores
  const filteredLeaderboard = useMemo(() => {
    if (!leaderboard || !Array.isArray(leaderboard)) return [];
    
    return leaderboard
      .filter(entry => {
        const points = entry.pxbPoints || entry.points || 0;
        return points < 100000000; // Filter out entries with more than 100M points
      })
      .slice(0, limit);
  }, [leaderboard, limit]);
  
  // Also filter the win rate leaderboard with the same logic
  const filteredWinRateLeaderboard = useMemo(() => {
    if (!winRateLeaderboard || !Array.isArray(winRateLeaderboard)) return [];
    
    return winRateLeaderboard
      .filter(entry => {
        const points = entry.pxbPoints || entry.points || 0;
        return points < 100000000; // Filter out entries with more than 100M points
      })
      .slice(0, limit);
  }, [winRateLeaderboard, limit]);

  const getPointsTabContent = () => {
    if (isLeaderboardLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="w-8 h-8 border-4 border-t-transparent border-indigo-500 rounded-full animate-spin"></div>
        </div>
      );
    }
    
    if (!filteredLeaderboard || filteredLeaderboard.length === 0) {
      return (
        <div className="p-4 text-center text-indigo-300/70">
          <p>No leaderboard data available yet.</p>
          <p className="text-sm mt-2">Be the first to earn points!</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4 p-4">
        {filteredLeaderboard.map((entry, index) => (
          <Link
            to={`/profile/${entry.user_id || entry.id}`}
            key={entry.user_id || entry.id || index}
            className="block"
          >
            <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-900/10 hover:bg-indigo-900/20 transition-colors border border-indigo-900/30">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center mr-3 border border-indigo-500/20">
                  {index === 0 ? (
                    <Trophy className="h-4 w-4 text-yellow-400" />
                  ) : index === 1 ? (
                    <Award className="h-4 w-4 text-gray-300" />
                  ) : index === 2 ? (
                    <Award className="h-4 w-4 text-amber-700" />
                  ) : (
                    <User className="h-4 w-4 text-indigo-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-white">
                    {entry.username || `User ${entry.wallet?.slice(0, 6)}...`}
                  </p>
                  <div className="flex space-x-2 text-xs text-indigo-300/70">
                    <span>Rank #{entry.rank || index + 1}</span>
                    <span className="text-indigo-300/40">•</span>
                    <span>{entry.betsWon || 0} wins</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-white">{(entry.pxbPoints || entry.points || 0).toLocaleString()}</p>
                <p className="text-xs text-indigo-300/70">PXB</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    );
  };
  
  const getWinRateTabContent = () => {
    if (isLoadingWinRate) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="w-8 h-8 border-4 border-t-transparent border-indigo-500 rounded-full animate-spin"></div>
        </div>
      );
    }
    
    if (!filteredWinRateLeaderboard || filteredWinRateLeaderboard.length === 0) {
      return (
        <div className="p-4 text-center text-indigo-300/70">
          <p>No win rate data available yet.</p>
          <p className="text-sm mt-2">Place your first bet to get started!</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4 p-4">
        {filteredWinRateLeaderboard.map((entry, index) => (
          <Link
            to={`/profile/${entry.user_id || entry.id}`}
            key={entry.user_id || entry.id || index}
            className="block"
          >
            <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-900/10 hover:bg-indigo-900/20 transition-colors border border-indigo-900/30">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center mr-3 border border-indigo-500/20">
                  {index === 0 ? (
                    <Trophy className="h-4 w-4 text-yellow-400" />
                  ) : index === 1 ? (
                    <Award className="h-4 w-4 text-gray-300" />
                  ) : index === 2 ? (
                    <Award className="h-4 w-4 text-amber-700" />
                  ) : (
                    <User className="h-4 w-4 text-indigo-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-white">
                    {entry.username || `User ${entry.wallet?.slice(0, 6)}...`}
                  </p>
                  <div className="flex space-x-2 text-xs text-indigo-300/70">
                    <span>Rank #{entry.rank || index + 1}</span>
                    <span className="text-indigo-300/40">•</span>
                    <span>{entry.betsWon || 0} wins</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-white">{entry.winRate}%</p>
                <p className="text-xs text-indigo-300/70">Win Rate</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div className={`overflow-hidden rounded-xl border border-indigo-900/30 backdrop-blur-lg bg-[#010608] h-full flex flex-col ${className}`}>
      <div className="p-6 border-b border-indigo-900/30">
        <div className="flex justify-between">
          <h2 className="text-2xl font-bold text-white">Leaderboard</h2>
          <Link to="/leaderboard">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </div>
      </div>
      
      <Tabs
        defaultValue="points"
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-grow flex flex-col"
      >
        <div className="px-6 pt-4 border-b border-indigo-900/30">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="points" className="flex items-center">
              <Trophy className="h-4 w-4 mr-2" />
              <span>Top Points</span>
            </TabsTrigger>
            <TabsTrigger value="winrate" className="flex items-center">
              <Percent className="h-4 w-4 mr-2" />
              <span>Win Rate</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-grow">
          <TabsContent value="points" className="m-0 h-full flex flex-col">
            {getPointsTabContent()}
          </TabsContent>
          <TabsContent value="winrate" className="m-0 h-full flex flex-col">
            {getWinRateTabContent()}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default PXBLeaderboard;
