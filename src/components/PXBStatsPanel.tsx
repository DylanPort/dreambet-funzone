
import React from 'react';
import { UserProfile } from '@/types/pxb';
import { Trophy } from 'lucide-react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';

interface PXBStatsPanelProps {
  userProfile: UserProfile | null;
}

const PXBStatsPanel: React.FC<PXBStatsPanelProps> = ({ userProfile }) => {
  const { bets, leaderboard, fetchLeaderboard } = usePXBPoints();
  
  const [totalBets, setTotalBets] = React.useState(0);
  const [winRate, setWinRate] = React.useState(0);
  const [ranking, setRanking] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (bets && bets.length > 0) {
      setTotalBets(bets.length);
      
      const wins = bets.filter(bet => bet.status === 'won').length;
      const calculatedWinRate = Math.round((wins / bets.length) * 100);
      setWinRate(calculatedWinRate);
    }
  }, [bets]);

  React.useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  React.useEffect(() => {
    if (userProfile && leaderboard && leaderboard.length > 0) {
      const userRanking = leaderboard.findIndex(user => user.id === userProfile.id);
      if (userRanking !== -1) {
        setRanking(userRanking + 1);
      }
    }
  }, [userProfile, leaderboard]);

  return (
    <div className="glass-panel p-6 rounded-lg bg-gray-900/50 border border-green-800">
      <h2 className="text-2xl font-bold mb-1">Betting Stats</h2>
      <p className="text-green-400 mb-6">Your betting performance</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-green-900/30 rounded-lg">
          <p className="text-green-400 text-sm mb-1">Total Bets</p>
          <p className="text-3xl font-bold">{totalBets}</p>
        </div>
        
        <div className="p-4 bg-green-900/30 rounded-lg">
          <p className="text-green-400 text-sm mb-1">Win Rate</p>
          <p className="text-3xl font-bold">{winRate}%</p>
        </div>
        
        <div className="p-4 bg-green-900/30 rounded-lg">
          <p className="text-green-400 text-sm mb-1">PXB Points</p>
          <p className="text-3xl font-bold">{userProfile?.pxbPoints.toLocaleString() || 0}</p>
        </div>
        
        <div className="p-4 bg-green-900/30 rounded-lg">
          <p className="text-green-400 text-sm mb-1">Ranking</p>
          <p className="text-3xl font-bold flex items-center">
            <Trophy className="text-green-500 w-5 h-5 mr-1" />
            #{ranking || '--'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PXBStatsPanel;
