
import React, { useEffect, useState } from 'react';
import { UserProfile } from '@/types/pxb';
import { Trophy } from 'lucide-react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { supabase } from '@/integrations/supabase/client';

interface PXBStatsPanelProps {
  userProfile: UserProfile | null;
}

const PXBStatsPanel: React.FC<PXBStatsPanelProps> = ({ userProfile }) => {
  const { bets, leaderboard, fetchLeaderboard } = usePXBPoints();
  
  const [totalBets, setTotalBets] = useState(0);
  const [winRate, setWinRate] = useState(0);
  const [ranking, setRanking] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch actual bet stats from Supabase
  useEffect(() => {
    const fetchUserBetStats = async () => {
      if (!userProfile) return;
      
      setIsLoading(true);
      
      try {
        // Get total number of bets
        const { count: totalCount, error: countError } = await supabase
          .from('bets')
          .select('*', { count: 'exact', head: true })
          .or(`bettor1_id.eq.${userProfile.id},bettor2_id.eq.${userProfile.id}`);
          
        if (countError) {
          console.error('Error fetching total bets count:', countError);
          return;
        }
        
        // Get won bets count
        const { data: wonBets, error: wonError } = await supabase
          .from('bets')
          .select('bet_id')
          .or(`bettor1_id.eq.${userProfile.id},bettor2_id.eq.${userProfile.id}`)
          .eq('status', 'won');
          
        if (wonError) {
          console.error('Error fetching won bets:', wonError);
          return;
        }
        
        // Calculate stats
        const totalBetsCount = totalCount || 0;
        const wonBetsCount = wonBets?.length || 0;
        const calculatedWinRate = totalBetsCount > 0 ? Math.round((wonBetsCount / totalBetsCount) * 100) : 0;
        
        setTotalBets(totalBetsCount);
        setWinRate(calculatedWinRate);
        
        console.log(`User stats: ${totalBetsCount} total bets, ${wonBetsCount} won, ${calculatedWinRate}% win rate`);
      } catch (error) {
        console.error('Error calculating user bet statistics:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserBetStats();
  }, [userProfile]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    if (userProfile && leaderboard && leaderboard.length > 0) {
      const userRanking = leaderboard.findIndex(user => user.id === userProfile.id);
      if (userRanking !== -1) {
        setRanking(userRanking + 1);
      }
    }
  }, [userProfile, leaderboard]);

  return (
    <div className="glass-panel p-6 rounded-lg bg-gray-900/50 border border-gray-800">
      <h2 className="text-2xl font-bold mb-1">Betting Stats</h2>
      <p className="text-gray-400 mb-6">Your betting performance</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-gray-800/70 rounded-lg">
          <p className="text-gray-400 text-sm mb-1">Total Bets</p>
          <p className="text-3xl font-bold">
            {isLoading ? (
              <span className="inline-block w-8 h-6 bg-gray-700 animate-pulse rounded"></span>
            ) : (
              totalBets
            )}
          </p>
        </div>
        
        <div className="p-4 bg-gray-800/70 rounded-lg">
          <p className="text-gray-400 text-sm mb-1">Win Rate</p>
          <p className="text-3xl font-bold">
            {isLoading ? (
              <span className="inline-block w-16 h-6 bg-gray-700 animate-pulse rounded"></span>
            ) : (
              `${winRate}%`
            )}
          </p>
        </div>
        
        <div className="p-4 bg-gray-800/70 rounded-lg">
          <p className="text-gray-400 text-sm mb-1">PXB Points</p>
          <p className="text-3xl font-bold">{userProfile?.pxbPoints.toLocaleString() || 0}</p>
        </div>
        
        <div className="p-4 bg-gray-800/70 rounded-lg">
          <p className="text-gray-400 text-sm mb-1">Ranking</p>
          <p className="text-3xl font-bold flex items-center">
            <Trophy className="text-yellow-500 w-5 h-5 mr-1" />
            #{ranking || '--'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PXBStatsPanel;
