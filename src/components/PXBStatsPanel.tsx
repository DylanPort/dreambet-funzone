
import React, { useState, useEffect } from 'react';
import { ArrowUp, Percent, Coins, Award, CircleDollarSign, Users } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { UserProfile } from '@/types/pxb';

interface PXBStatsPanelProps {
  userProfile: UserProfile | null;
}

const PXBStatsPanel: React.FC<PXBStatsPanelProps> = ({ userProfile }) => {
  const { fetchReferralStats, referralStats, isLoadingReferrals, fetchTokenTransactions } = usePXBPoints();
  const [winRate, setWinRate] = useState(0);
  const [totalTrades, setTotalTrades] = useState(0);
  const [totalProfits, setTotalProfits] = useState(0);
  const [avgTradeAmount, setAvgTradeAmount] = useState(0);
  const [isLoadingTrades, setIsLoadingTrades] = useState(true);

  useEffect(() => {
    if (userProfile) {
      fetchReferralStats();
      loadTradeStats();
    }
  }, [userProfile, fetchReferralStats]);

  const loadTradeStats = async () => {
    setIsLoadingTrades(true);
    try {
      // This will be all trades for all tokens
      const allTokenTransactions = await fetchTokenTransactions('all');
      
      if (allTokenTransactions && allTokenTransactions.length > 0) {
        const buyTrades = allTokenTransactions.filter(trade => trade.type === 'buy');
        const sellTrades = allTokenTransactions.filter(trade => trade.type === 'sell');
        
        setTotalTrades(allTokenTransactions.length);
        
        // Calculate success rate (profitable trades)
        // In a real app, this would be more sophisticated - comparing buy/sell prices
        // For now we'll use a simple ratio of sells to buys as a proxy for "success"
        const successRate = sellTrades.length > 0 ? 
          (sellTrades.length / allTokenTransactions.length) * 100 : 0;
        setWinRate(successRate);
        
        // Calculate total profits (in a real app this would be more complex)
        // For simplicity, we'll just sum all sell amounts
        const profits = sellTrades.reduce((sum, trade) => sum + trade.pxbAmount, 0);
        setTotalProfits(profits);
        
        // Calculate average trade amount
        const avgAmount = allTokenTransactions.reduce((sum, trade) => sum + trade.pxbAmount, 0) / 
          (allTokenTransactions.length || 1);
        setAvgTradeAmount(avgAmount);
      }
    } catch (error) {
      console.error("Error loading trade stats:", error);
    } finally {
      setIsLoadingTrades(false);
    }
  };

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
              <span className="text-indigo-200 font-medium">Success Rate</span>
            </div>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold text-white">{winRate.toFixed(1)}%</div>
              {isLoadingTrades ? (
                <div className="h-2 w-2 bg-indigo-500 rounded-full animate-pulse"></div>
              ) : (
                <div className="text-sm text-indigo-300/70">{totalTrades} trades</div>
              )}
            </div>
            <Progress value={winRate} className="h-1 mt-2" />
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center mr-3">
                <Coins className="h-4 w-4 text-indigo-400" />
              </div>
              <span className="text-indigo-200 font-medium">Avg Trade</span>
            </div>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold text-white">{avgTradeAmount.toFixed(0)}</div>
              {isLoadingTrades ? (
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
              <span className="text-indigo-200 font-medium">Total Profits</span>
            </div>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold text-white">{totalProfits.toLocaleString()}</div>
              {isLoadingTrades ? (
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
              <span className="text-indigo-200 font-medium">Total Trades</span>
            </div>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold text-white">{totalTrades}</div>
              {isLoadingTrades ? (
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
