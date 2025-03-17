
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Rocket, Skull } from 'lucide-react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fetchDexScreenerData } from '@/services/dexScreenerService';
import { usePumpPortal } from '@/hooks/usePumpPortal';

// Mock implementation if not available in pumpPortalService
const fetchPumpFunTokens = async () => {
  return [];
};

const MigratingTokenList = () => {
  const { recentTokens } = usePumpPortal();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tokenMetrics, setTokenMetrics] = useState({});
  const { userProfile, bets: userPXBBets } = usePXBPoints();
  
  useEffect(() => {
    const loadTokens = async () => {
      try {
        setLoading(true);
        
        // Use recentTokens from usePumpPortal or fetch from API
        let tokenData = [];
        if (recentTokens && recentTokens.length > 0) {
          tokenData = [...recentTokens];
        } else {
          const fetchedTokens = await fetchPumpFunTokens();
          tokenData = fetchedTokens || [];
        }
        
        // Sort tokens by created_time (most recent first)
        tokenData.sort((a, b) => {
          const dateA = new Date(a.created_time || 0);
          const dateB = new Date(b.created_time || 0);
          return dateB.getTime() - dateA.getTime();
        });
        
        // Take top 10 most recent tokens
        const recentMigratingTokens = tokenData.slice(0, 10);
        
        setTokens(recentMigratingTokens);
        
        // Fetch market data for each token
        for (const token of recentMigratingTokens) {
          if (token.token_mint) {
            try {
              const dexScreenerData = await fetchDexScreenerData(token.token_mint);
              if (dexScreenerData) {
                setTokenMetrics(prevMetrics => ({
                  ...prevMetrics,
                  [token.token_mint]: {
                    marketCap: dexScreenerData.marketCap,
                    priceUsd: dexScreenerData.priceUsd,
                    volume24h: dexScreenerData.volume24h,
                    priceChange24h: dexScreenerData.priceChange24h,
                    liquidity: dexScreenerData.liquidity
                  }
                }));
              }
            } catch (metricError) {
              console.error(`Error fetching metrics for ${token.token_name}:`, metricError);
            }
          }
        }
      } catch (err) {
        console.error('Error loading migrating tokens:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadTokens();
  }, [recentTokens]);
  
  // Calculate betting stats
  const getBettingStats = (tokenMint) => {
    if (!userPXBBets || !Array.isArray(userPXBBets)) return { total: 0, up: 0, down: 0 };
    
    const tokenBets = userPXBBets.filter(bet => bet.tokenMint === tokenMint);
    const upBets = tokenBets.filter(bet => bet.betType === 'up');
    const downBets = tokenBets.filter(bet => bet.betType === 'down');
    
    return {
      total: tokenBets.length,
      up: upBets.length,
      down: downBets.length,
      volume: tokenBets.reduce((sum, bet) => sum + (bet.betAmount || 0), 0)
    };
  };
  
  const formatLargeNumber = (num) => {
    if (num === undefined || num === null) return "-";
    
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(2)}B`;
    }
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    }
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    }
    return `$${num.toFixed(2)}`;
  };
  
  const renderTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const now = new Date();
    const tokenTime = new Date(timestamp);
    const diffMs = now - tokenTime;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffMins < 24 * 60) {
      const hours = Math.floor(diffMins / 60);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffMins / (60 * 24));
      return `${days}d ago`;
    }
  };
  
  return (
    <div className="w-full pb-6 overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-display font-bold">Recently Migrated Tokens</h2>
        <Link to="/betting">
          <Button variant="outline" className="text-dream-accent2 border-dream-accent2/30 hover:bg-dream-accent2/10">
            View All
          </Button>
        </Link>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-dream-accent2 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-400">
          <p>Error loading tokens: {error}</p>
        </div>
      ) : tokens.length === 0 ? (
        <div className="text-center py-8 text-dream-foreground/70">
          <p>No recently migrated tokens found</p>
        </div>
      ) : (
        <div className="glass-panel p-4 overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="border-b border-white/10">
                <TableHead className="py-3 px-4 text-left text-dream-foreground/70">Token</TableHead>
                <TableHead className="py-3 px-4 text-center text-dream-foreground/70">Migrated</TableHead>
                <TableHead className="py-3 px-4 text-right text-dream-foreground/70">Market Cap</TableHead>
                <TableHead className="py-3 px-4 text-center text-dream-foreground/70">Betting Stats</TableHead>
                <TableHead className="py-3 px-4 text-right text-dream-foreground/70">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tokens.map((token, index) => {
                const tokenMetric = tokenMetrics[token.token_mint] || {};
                const bettingStats = getBettingStats(token.token_mint);
                const totalUpPercentage = bettingStats.total > 0 ? (bettingStats.up / bettingStats.total) * 100 : 50;
                
                return (
                  <TableRow 
                    key={token.token_mint || index} 
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <TableCell className="py-3 px-4">
                      <Link to={`/token/${token.token_mint}`} className="flex items-center group">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dream-accent1/20 to-dream-accent3/20 flex items-center justify-center text-xl border border-white/10 mr-3">
                          {token.token_symbol ? token.token_symbol.charAt(0) : '🪙'}
                        </div>
                        <div>
                          <div className="font-medium group-hover:text-dream-accent2 transition-colors">
                            {token.token_name || "Unknown Token"}
                          </div>
                          <div className="text-sm text-dream-foreground/60 flex items-center">
                            {token.token_symbol || "???"}
                            <a 
                              href={`https://solscan.io/token/${token.token_mint}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="ml-2 text-dream-foreground/40 hover:text-dream-accent2"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-center text-dream-foreground/60">
                      {renderTimeAgo(token.created_time)}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      {formatLargeNumber(tokenMetric.marketCap || 0)}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center">
                        <div className="text-sm font-medium">
                          {bettingStats.total} Bets ({formatLargeNumber(bettingStats.volume || 0)} volume)
                        </div>
                        <div className="w-full h-2 bg-dream-foreground/10 rounded-full mt-1 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-500 to-green-400" 
                            style={{ width: `${totalUpPercentage}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between w-full text-xs mt-1">
                          <div className="flex items-center">
                            <Rocket className="w-3 h-3 mr-1 text-green-500" />
                            <span>{bettingStats.up}</span>
                          </div>
                          <div className="flex items-center">
                            <Skull className="w-3 h-3 mr-1 text-red-500" />
                            <span>{bettingStats.down}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      <Link to={`/token/${token.token_mint}`}>
                        <Button size="sm" className="bg-dream-accent2/20 text-dream-accent2 hover:bg-dream-accent2/30 border border-dream-accent2/30">
                          View Token
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default MigratingTokenList;
