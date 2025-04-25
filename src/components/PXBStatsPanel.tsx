import React, { useState, useEffect } from 'react';
import { ArrowUp, Percent, Coins, Award, CircleDollarSign, Users } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { UserProfile } from '@/types/pxb';

interface PXBStatsPanelProps {
  userProfile: UserProfile | null;
}

const PXBStatsPanel: React.FC<PXBStatsPanelProps> = ({ userProfile }) => {
  const { bets, isLoadingBets, fetchUserBets, fetchReferralStats, referralStats, isLoadingReferrals } = usePXBPoints();
  const [winRate, setWinRate] = useState(0);
  const [totalBets, setTotalBets] = useState(0);
  const [totalPointsWon, setTotalPointsWon] = useState(0);
  const [avgBetAmount, setAvgBetAmount] = useState(0);

  useEffect(() => {
    if (userProfile) {
      fetchUserBets();
      fetchReferralStats();
    }
  }, [userProfile, fetchUserBets, fetchReferralStats]);

  useEffect(() => {
    if (bets && bets.length > 0) {
      const completedBets = bets.filter(bet => bet.status === 'won' || bet.status === 'lost');
      const wonBets = bets.filter(bet => bet.status === 'won');
      
      setTotalBets(bets.length);
      setWinRate(completedBets.length > 0 ? (wonBets.length / completedBets.length) * 100 : 0);
      
      const totalWon = wonBets.reduce((sum, bet) => sum + (bet.pointsWon || 0), 0);
      setTotalPointsWon(totalWon);
      
      const avgAmount = bets.reduce((sum, bet) => sum + bet.betAmount, 0) / bets.length;
      setAvgBetAmount(avgAmount);
    }
  }, [bets]);

  return (
    <div>
      <h2 className="text-xl font-bold mb-5 text-white">Your PXB Stats</h2>
      <div className="glass-panel p-6 rounded-lg bg-gray-900/50 border border-gray-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center mr-3">
                <Percent className="h-4 w-4 text-indigo-400" />
              </div>
              <span className="text-indigo-200 font-medium">Win Rate</span>
            </div>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold text-white">{winRate.toFixed(1)}%</div>
              {isLoadingBets ? (
                <div className="h-2 w-2 bg-indigo-500 rounded-full animate-pulse"></div>
              ) : (
                <div className="text-sm text-indigo-300/70">{totalBets} trades</div>
              )}
            </div>
            <Progress value={winRate} className="h-1 mt-2" />
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center mr-3">
                <Coins className="h-4 w-4 text-indigo-400" />
              </div>
              <span className="text-indigo-200 font-medium">Avg Bet</span>
            </div>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold text-white">{avgBetAmount.toFixed(0)}</div>
              {isLoadingBets ? (
                <div className="h-2 w-2 bg-indigo-500 rounded-full animate-pulse"></div>
              ) : (
                <div className="text-sm text-indigo-300/70">PXB</div>
              )}
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center mr-3">
                <Award className="h-4 w-4 text-indigo-400" />
              </div>
              <span className="text-indigo-200 font-medium">Points Won</span>
            </div>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold text-white">{totalPointsWon.toLocaleString()}</div>
              {isLoadingBets ? (
                <div className="h-2 w-2 bg-indigo-500 rounded-full animate-pulse"></div>
              ) : (
                <div className="text-sm text-indigo-300/70">PXB</div>
              )}
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center mr-3">
                <CircleDollarSign className="h-4 w-4 text-indigo-400" />
              </div>
              <span className="text-indigo-200 font-medium">Total Bets</span>
            </div>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold text-white">{totalBets}</div>
              {isLoadingBets ? (
                <div className="h-2 w-2 bg-indigo-500 rounded-full animate-pulse"></div>
              ) : (
                <div className="text-sm text-indigo-300/70">Trades</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Referral Stats Section */}
      <h2 className="text-xl font-bold mb-5 mt-8 text-white">Your Referral Stats</h2>
      <div className="glass-panel p-6 rounded-lg bg-gray-900/50 border border-gray-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center mr-3">
                <Users className="h-4 w-4 text-indigo-400" />
              </div>
              <span className="text-indigo-200 font-medium">Total Referrals</span>
            </div>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold text-white">
                {isLoadingReferrals ? (
                  <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  (referralStats?.totalReferrals || referralStats?.referrals_count || 0)
                )}
              </div>
              <div className="text-sm text-indigo-300/70">users</div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center mr-3">
                <Coins className="h-4 w-4 text-indigo-400" />
              </div>
              <span className="text-indigo-200 font-medium">Points Earned</span>
            </div>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold text-white">
                {isLoadingReferrals ? (
                  <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  (referralStats?.pointsEarned || referralStats?.points_earned || 0).toLocaleString()
                )}
              </div>
              <div className="text-sm text-indigo-300/70">PXB</div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-indigo-300/70 text-sm">
            Invite friends using your referral code to earn 10,000 PXB points per referral
          </p>
        </div>
      </div>
    </div>
  );
};

export default PXBStatsPanel;
