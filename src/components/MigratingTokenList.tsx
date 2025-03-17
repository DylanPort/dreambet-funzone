import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMigratingTokens } from '@/api/mockData';
// Remove this import: import { fetchPumpFunTokens } from '@/services/pumpPortalService';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowUp, ArrowDown, ExternalLink, BarChart3, Users, TrendingUp, PiggyBank } from 'lucide-react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatePresence, motion } from 'framer-motion';

// Add a mock function for fetchPumpFunTokens
const fetchPumpFunTokens = async () => {
  return [];
};

const MigratingTokenList = () => {
  const {
    userProfile,
    bets: pxbBets, 
    userBets
  } = usePXBPoints();

  const [migratingTokens, setMigratingTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState('migrationTime');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    const fetchTokens = async () => {
      setLoading(true);
      try {
        const tokens = await fetchMigratingTokens();
        setMigratingTokens(tokens);
      } catch (error) {
        console.error('Error fetching migrating tokens:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, []);

  const sortedTokens = [...migratingTokens].sort((a, b) => {
    const order = sortOrder === 'asc' ? 1 : -1;

    if (sortKey === 'name') {
      return a.name.localeCompare(b.name) * order;
    } else if (sortKey === 'currentPrice') {
      return (a.currentPrice - b.currentPrice) * order;
    } else if (sortKey === 'migrationTime') {
      return (new Date(a.migrationTime).getTime() - new Date(b.migrationTime).getTime()) * order;
    }

    return 0;
  });

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // Fix the issues with unknown types
  const calculateBettingStatsByToken = () => {
    if (!pxbBets || !Array.isArray(pxbBets)) return {};
    
    const stats: Record<string, {
      totalBets: number;
      upBets: number;
      downBets: number;
      upPercentage: number;
      downPercentage: number;
      totalVolume: number;
    }> = {};
    
    pxbBets.forEach(bet => {
      if (!bet.tokenMint) return;
      
      if (!stats[bet.tokenMint]) {
        stats[bet.tokenMint] = {
          totalBets: 0,
          upBets: 0,
          downBets: 0,
          upPercentage: 0,
          downPercentage: 0,
          totalVolume: 0
        };
      }
      
      stats[bet.tokenMint].totalBets += 1;
      stats[bet.tokenMint].totalVolume += bet.betAmount;
      
      if (bet.betType === 'up') {
        stats[bet.tokenMint].upBets += 1;
      } else {
        stats[bet.tokenMint].downBets += 1;
      }
    });
    
    // Calculate percentages
    Object.keys(stats).forEach(tokenMint => {
      const total = stats[tokenMint].totalBets;
      if (total > 0) {
        stats[tokenMint].upPercentage = Math.round((stats[tokenMint].upBets / total) * 100);
        stats[tokenMint].downPercentage = Math.round((stats[tokenMint].downBets / total) * 100);
      }
    });
    
    return stats;
  };
  
  const bettingStats = calculateBettingStatsByToken();

  // Fix the find method on unknown type
  const renderTokenRow = (token: any) => {
    const tokenStats = bettingStats && token.id ? bettingStats[token.id] : null;

    return (
      <motion.tr
        key={token.id}
        className="group transition-colors duration-200 hover:bg-black/20"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        <td className="px-4 py-3 relative">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dream-accent1/20 to-dream-accent3/20 flex items-center justify-center border border-white/10">
              <span className="font-display font-bold text-sm">{token.symbol.charAt(0)}</span>
            </div>
            <Link to={`/token/${token.id}`} className="flex items-center gap-1 group-hover:text-dream-accent2 transition-colors duration-300">
              <span className="font-medium">{token.name}</span>
              <ExternalLink className="w-3 h-3 text-dream-foreground/40" />
            </Link>
          </div>
        </td>
        <td className="px-4 py-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="flex items-center gap-1 hover:text-dream-accent2 transition-colors duration-300">
                  <span className="font-medium">{token.currentPrice ? `$${token.currentPrice.toFixed(2)}` : 'N/A'}</span>
                  <BarChart3 className="w-3.5 h-3.5 text-dream-foreground/40" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                Current Price
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </td>
        <td className="px-4 py-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="flex items-center gap-1 hover:text-dream-accent2 transition-colors duration-300">
                  <span className="font-medium">{new Date(token.migrationTime).toLocaleDateString()}</span>
                  <ClockIcon className="w-3.5 h-3.5 text-dream-foreground/40" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                Migration Time
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </td>
        <td className="px-4 py-3">
          {tokenStats ? (
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-1 text-xs">
                  <ArrowUp className="w-3 h-3 text-green-400" />
                  <span className="font-medium text-green-400">{tokenStats.upPercentage}%</span>
                </div>
                <Progress value={tokenStats.upPercentage} className="h-1.5 w-24 bg-black/30" />
              </div>
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-1 text-xs">
                  <ArrowDown className="w-3 h-3 text-red-400" />
                  <span className="font-medium text-red-400">{tokenStats.downPercentage}%</span>
                </div>
                <Progress value={tokenStats.downPercentage} className="h-1.5 w-24 bg-black/30" />
              </div>
            </div>
          ) : (
            <span className="text-sm text-gray-400 italic">No betting data yet</span>
          )}
        </td>
      </motion.tr>
    );
  };
  
  // Fix the length property on unknown type
  const renderTokensTable = () => {
    // Check if migratingTokens is null or undefined
    if (!migratingTokens) {
      return <div className="glass-panel p-6 text-center">
        <p className="text-dream-foreground/80 mb-2">No tokens available</p>
        <p className="text-dream-foreground/60 text-sm">
          Please check back later.
        </p>
      </div>;
    }
    
    if (!migratingTokens || !Array.isArray(migratingTokens) || migratingTokens.length === 0) {
      return <div className="glass-panel p-6 text-center">
        <p className="text-dream-foreground/80 mb-2">No tokens available</p>
        <p className="text-dream-foreground/60 text-sm">
          Please check back later.
        </p>
      </div>;
    }

    return (
      <div className="w-full overflow-x-auto">
        <table className="futuristic-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('name')}>
                Token Name
                {sortKey === 'name' && (sortOrder === 'asc' ? ' ▲' : ' ▼')}
              </th>
              <th onClick={() => handleSort('currentPrice')}>
                Price
                {sortKey === 'currentPrice' && (sortOrder === 'asc' ? ' ▲' : ' ▼')}
              </th>
              <th onClick={() => handleSort('migrationTime')}>
                Migration Time
                {sortKey === 'migrationTime' && (sortOrder === 'asc' ? ' ▲' : ' ▼')}
              </th>
              <th>Betting Stats</th>
            </tr>
          </thead>
          <AnimatePresence>
            <tbody>
              {sortedTokens.map(token => renderTokenRow(token))}
            </tbody>
          </AnimatePresence>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-display font-bold text-dream-foreground flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-dream-accent2" />
          <span>Migrating Tokens</span>
        </h2>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-panel p-4 animate-pulse">
              <div className="h-5 w-32 bg-gray-700/50 rounded mb-2"></div>
              <div className="h-4 w-16 bg-gray-700/50 rounded mb-4"></div>
              <div className="h-8 bg-gray-700/50 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        renderTokensTable()
      )}
    </div>
  );
};

function ClockIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export default MigratingTokenList;
