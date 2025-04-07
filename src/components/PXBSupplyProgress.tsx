import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Loader2, Sparkles, BarChart, ArrowUp, ArrowDown, Users, CircleDot, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { usePXBAnalytics } from '@/hooks/usePXBAnalytics';
import { usePXBTotalSupply } from '@/hooks/usePXBTotalSupply';
const PXBSupplyProgress = () => {
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [showDistribution, setShowDistribution] = useState<boolean>(false);
  const [showTopHolders, setShowTopHolders] = useState<boolean>(false);
  const [showRecentActivity, setShowRecentActivity] = useState<boolean>(false);
  const {
    analytics,
    isLoading: analyticsLoading,
    error: analyticsError
  } = usePXBAnalytics(86400000);
  const {
    supplyData,
    isLoading: supplyLoading,
    error: supplyError
  } = usePXBTotalSupply(1000); // Update every second

  const isLoading = supplyLoading || analyticsLoading;
  const error = supplyError || analyticsError;
  const maxSupply = 1_000_000_000; // 1 billion maximum supply
  const stakingRewards = 400_000_000; // 400 million reserved for staking rewards
  const additionalBurned = 110_000_000; // 110 million reserved/removed from circulation
  const totalReserved = stakingRewards + additionalBurned;
  const mintedPercentage = supplyData.totalMinted / maxSupply * 100;
  const stakingPercentage = stakingRewards / maxSupply * 100;
  const burnedPercentage = additionalBurned / maxSupply * 100;
  const totalPercentage = mintedPercentage + stakingPercentage + burnedPercentage;

  // Calculate remaining supply
  const remainingSupply = Math.max(0, maxSupply - totalReserved - supplyData.totalMinted);
  const remainingPercentage = remainingSupply / maxSupply * 100;
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };
  useEffect(() => {
    if (!isLoading) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1500);
    }
  }, [isLoading]);
  const getActivityColor = (action: string) => {
    switch (action) {
      case 'mint':
        return 'text-green-400';
      case 'transfer_sent':
        return 'text-amber-400';
      case 'transfer_received':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };
  const getActionLabel = (action: string) => {
    switch (action) {
      case 'mint':
        return 'Minted';
      case 'transfer_sent':
        return 'Sent';
      case 'transfer_received':
        return 'Received';
      case 'bounty_completed':
        return 'Bounty Reward';
      case 'referral_reward':
        return 'Referral Bonus';
      default:
        return action.replace(/_/g, ' ');
    }
  };
  const renderDistributionChart = () => {
    if (analytics.distributionByRange.length === 0) return null;
    return <div className="mt-4 space-y-3 animate-fade-in">
        <h3 className="text-sm font-semibold text-dream-foreground/80 flex items-center">
          <BarChart className="h-4 w-4 mr-2 text-green-400" />
          Point Distribution by Range
        </h3>
        <div className="space-y-2">
          {analytics.distributionByRange.map((range, index) => <div key={range.range} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium">{range.range} PXB</span>
                <div className="flex space-x-2">
                  <span className="text-dream-foreground/60">{range.users} users</span>
                  <span className="text-dream-foreground/80">{formatNumber(range.totalPoints)} PXB</span>
                  <span className="text-green-400">{range.percentage.toFixed(2)}%</span>
                </div>
              </div>
              <div className="h-2 w-full bg-black/20 rounded overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-green-400" style={{
              width: `${range.percentage}%`
            }} />
              </div>
            </div>)}
        </div>
      </div>;
  };
  const renderTopHolders = () => {
    if (analytics.topHolders.length === 0) return null;
    return <div className="mt-4 animate-fade-in">
        <h3 className="text-sm font-semibold text-dream-foreground/80 flex items-center mb-2">
          <Users className="h-4 w-4 mr-2 text-purple-400" />
          Top PXB Holders
        </h3>
        <div className="divide-y divide-white/10">
          {analytics.topHolders.map((holder, index) => <div key={index} className="flex justify-between py-2 text-sm">
              <div className="flex items-center">
                <span className="bg-dream-foreground/10 w-5 h-5 rounded-full flex items-center justify-center mr-2 text-xs">
                  {index + 1}
                </span>
                <span className="font-medium truncate max-w-[150px]">{holder.username}</span>
              </div>
              <div className="flex space-x-3">
                <span className="text-dream-foreground/80">{formatNumber(holder.points)} PXB</span>
                <span className="text-purple-400 w-12 text-right">{holder.percentage.toFixed(2)}%</span>
              </div>
            </div>)}
        </div>
      </div>;
  };
  const renderRecentActivity = () => {
    if (analytics.recentMints.length === 0) return null;
    return <div className="mt-4 animate-fade-in">
        <h3 className="text-sm font-semibold text-dream-foreground/80 flex items-center mb-2">
          <Sparkles className="h-4 w-4 mr-2 text-amber-400" />
          Recent PXB Activity
        </h3>
        <div className="divide-y divide-white/10">
          {analytics.recentMints.map((mint, index) => <div key={index} className="flex justify-between py-2 text-sm">
              <div className="flex items-center">
                <span className={`mr-2 ${getActivityColor(mint.action)}`}>
                  {mint.amount > 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                </span>
                <span className="font-medium">{getActionLabel(mint.action)}</span>
              </div>
              <div className="flex space-x-3">
                <span className={`${mint.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {mint.amount > 0 ? '+' : ''}{formatNumber(mint.amount)} PXB
                </span>
                <span className="text-dream-foreground/60 text-xs">
                  {format(new Date(mint.timestamp), 'MMM d, HH:mm')}
                </span>
              </div>
            </div>)}
        </div>
      </div>;
  };
  return <div className="relative z-10">
      <div className={`absolute inset-0 bg-gradient-to-r from-dream-accent1/30 to-dream-accent3/30 rounded-lg blur-xl transition-opacity duration-300 ${isAnimating ? 'opacity-80' : 'opacity-20'}`}></div>
      
      <div className="relative z-20">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold flex items-center">
            <span className="relative">
              <img alt="Diamond" className="mr-2 h-5 w-5 object-contain animate-pulse-subtle" style={{
              filter: 'drop-shadow(0 0 4px rgba(219, 39, 119, 0.5))'
            }} src="/lovable-uploads/c5a2b975-3b82-4cbf-94db-8cb2fe2be3a6.png" />
              <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-300 animate-pulse" />
            </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-green-300 to-emerald-500 font-bold">
              PXB Total Supply
            </span>
          </h2>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-dream-accent2" /> : error ? <span className="text-red-400 text-sm">{error}</span> : null}
        </div>
        
        <div className="relative transform perspective-1000 rotate-x-1 hover:rotate-x-2 transition-transform duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-dream-accent1/20 via-dream-accent2/20 to-dream-accent3/20 animate-gradient-move rounded-lg blur-sm"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-50 rounded-lg"></div>
          
          <div className="relative z-10 mb-1 transform translate-y-px shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
            <div className="h-7 w-full rounded-lg bg-black/20 backdrop-blur-sm border border-white/10 overflow-hidden relative">
              <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 via-emerald-400 to-teal-500 transition-all duration-300" style={{
              width: `${mintedPercentage}%`
            }}>
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20 animate-shine"></div>
              </div>
              
              <div className="absolute top-0 h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-300" style={{
              left: `${mintedPercentage}%`,
              width: `${stakingPercentage}%`
            }}>
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10 animate-shine" style={{
                animationDelay: '0.5s'
              }}></div>
              </div>
              
              <div className="absolute top-0 h-full bg-gradient-to-r from-yellow-500 to-amber-500 transition-all duration-300" style={{
              left: `${mintedPercentage + stakingPercentage}%`,
              width: `${burnedPercentage}%`
            }}>
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10 animate-shine" style={{
                animationDelay: '1s'
              }}></div>
              </div>
              
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none rounded-lg">
                <div className="absolute top-0 left-0 w-20 h-full bg-white/20 animate-scan-line"></div>
                
                {Array.from({
                length: 5
              }).map((_, i) => <div key={i} className="absolute top-1/2 h-1 w-1 rounded-full bg-white/80 animate-pulse" style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.3}s`,
                transform: 'translateY(-50%)'
              }} />)}
              </div>
              
              {totalPercentage > 5 && <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white drop-shadow-md pointer-events-none">
                  {totalPercentage.toFixed(2)}% of 1B
                </div>}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap justify-between text-sm mt-3 relative z-20">
        <div className="mb-1">
          <span className="text-dream-foreground/60">Minted: </span>
          <span className="text-[#00ff00] font-semibold animate-pulse-subtle">
            {formatNumber(supplyData.totalMinted)} PXB
          </span>
          <span className="text-dream-foreground/40 text-xs ml-1">
            ({mintedPercentage.toFixed(5)}%)
          </span>
        </div>
        <div className="mb-1">
          <span className="text-dream-foreground/60">Staking Rewards: </span>
          <span className="font-medium text-purple-400">{formatNumber(stakingRewards)} PXB</span>
          <span className="text-dream-foreground/40 text-xs ml-1">
            ({stakingPercentage.toFixed(1)}%)
          </span>
        </div>
        <div className="mb-1">
          <span className="text-dream-foreground/60">Burned: </span>
          <span className="font-medium text-yellow-400">{formatNumber(additionalBurned)} PXB</span>
          <span className="text-dream-foreground/40 text-xs ml-1">
            ({burnedPercentage.toFixed(1)}%)
          </span>
        </div>
        <div className="mb-1">
          <span className="text-dream-foreground/60">Remaining: </span>
          <span className="font-medium text-pink-400">{formatNumber(remainingSupply)} PXB</span>
          <span className="text-dream-foreground/40 text-xs ml-1">
            ({remainingPercentage.toFixed(1)}%)
          </span>
          {remainingSupply === 0 && <span className="ml-1 text-xs bg-pink-500/20 px-1 py-0.5 rounded text-pink-300 font-semibold animate-pulse-subtle">
              SOLD OUT
            </span>}
        </div>
        
      </div>
      
      <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
        <div className="bg-black/30 backdrop-blur-sm rounded p-2 border border-white/10">
          <div className="text-dream-foreground/60">Total Users</div>
          <div className="text-lg font-semibold">{formatNumber(supplyData.totalUsers)}</div>
        </div>
        <div className="bg-black/30 backdrop-blur-sm rounded p-2 border border-white/10">
          <div className="text-dream-foreground/60">Users with PXB</div>
          <div className="text-lg font-semibold">{formatNumber(supplyData.usersWithPoints)}</div>
        </div>
        <div className="bg-black/30 backdrop-blur-sm rounded p-2 border border-white/10">
          <div className="text-dream-foreground/60">Avg. per User</div>
          <div className="text-lg font-semibold">{formatNumber(supplyData.averagePerUser)}</div>
        </div>
      </div>
      
      <div className="mt-4 bg-black/30 backdrop-blur-sm rounded p-2 border border-white/10">
        <button onClick={() => setShowDistribution(!showDistribution)} className="w-full flex justify-between items-center focus:outline-none">
          <span className="text-sm font-medium flex items-center">
            <BarChart className="h-4 w-4 mr-2 text-green-400" />
            Point Distribution Analysis
          </span>
          {showDistribution ? <ChevronUp className="h-4 w-4 text-dream-foreground/60" /> : <ChevronDown className="h-4 w-4 text-dream-foreground/60" />}
        </button>
        <AnimatePresence>
          {showDistribution && <motion.div initial={{
          height: 0,
          opacity: 0
        }} animate={{
          height: 'auto',
          opacity: 1
        }} exit={{
          height: 0,
          opacity: 0
        }} transition={{
          duration: 0.3
        }} className="overflow-hidden">
              {renderDistributionChart()}
            </motion.div>}
        </AnimatePresence>
      </div>
      
      <div className="mt-2 bg-black/30 backdrop-blur-sm rounded p-2 border border-white/10">
        <button onClick={() => setShowTopHolders(!showTopHolders)} className="w-full flex justify-between items-center focus:outline-none">
          <span className="text-sm font-medium flex items-center">
            <Users className="h-4 w-4 mr-2 text-purple-400" />
            Top PXB Holders
          </span>
          {showTopHolders ? <ChevronUp className="h-4 w-4 text-dream-foreground/60" /> : <ChevronDown className="h-4 w-4 text-dream-foreground/60" />}
        </button>
        <AnimatePresence>
          {showTopHolders && <motion.div initial={{
          height: 0,
          opacity: 0
        }} animate={{
          height: 'auto',
          opacity: 1
        }} exit={{
          height: 0,
          opacity: 0
        }} transition={{
          duration: 0.3
        }} className="overflow-hidden">
              {renderTopHolders()}
            </motion.div>}
        </AnimatePresence>
      </div>
      
      <div className="mt-2 bg-black/30 backdrop-blur-sm rounded p-2 border border-white/10">
        <button onClick={() => setShowRecentActivity(!showRecentActivity)} className="w-full flex justify-between items-center focus:outline-none">
          <span className="text-sm font-medium flex items-center">
            <Sparkles className="h-4 w-4 mr-2 text-amber-400" />
            Recent PXB Activity
          </span>
          {showRecentActivity ? <ChevronUp className="h-4 w-4 text-dream-foreground/60" /> : <ChevronDown className="h-4 w-4 text-dream-foreground/60" />}
        </button>
        <AnimatePresence>
          {showRecentActivity && <motion.div initial={{
          height: 0,
          opacity: 0
        }} animate={{
          height: 'auto',
          opacity: 1
        }} exit={{
          height: 0,
          opacity: 0
        }} transition={{
          duration: 0.3
        }} className="overflow-hidden">
              {renderRecentActivity()}
            </motion.div>}
        </AnimatePresence>
      </div>
      
      <div className="text-xs text-dream-foreground/50 mt-2 text-center bg-gradient-to-r from-transparent via-white/5 to-transparent p-1 rounded animate-pulse-subtle">
        <span className="inline-flex items-center">
          <Sparkles className="h-3 w-3 mr-1 text-dream-accent2/70" />
          Real-time PXB stats: Supply updated every second from database
        </span>
      </div>
    </div>;
};
export default PXBSupplyProgress;