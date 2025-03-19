
import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Wallet, Clock, Sparkles, Zap, ExternalLink, Flame, BarChart } from 'lucide-react';
import { Bet, BetPrediction, BetStatus } from '@/types/bet';
import { formatTimeRemaining, formatAddress } from '@/utils/betUtils';
import { Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { fetchTrendingTokens } from "@/services/supabaseService";
import { toast } from 'sonner';

interface TrendingToken {
  tokenMint: string;
  tokenName: string;
  tokenSymbol: string;
  betCount: number;
  totalAmount: number;
}

const BetReel: React.FC = () => {
  const [trendingTokens, setTrendingTokens] = useState<TrendingToken[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        setLoading(true);
        const tokens = await fetchTrendingTokens(15);
        setTrendingTokens(tokens);
      } catch (error) {
        console.error('Error fetching trending tokens for reel:', error);
        toast.error('Error loading trending tokens');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTokens();
    
    // Set up a channel to listen for new bets
    const channel = supabase.channel('public:bets').on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'bets'
    }, async payload => {
      console.log('New bet inserted, refreshing trending tokens:', payload);
      fetchTokens();
    }).subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return <div className="bet-reel-container fixed top-16 left-0 right-0 z-40 bg-black/40 backdrop-blur-md border-b border-white/10 py-2 overflow-hidden">
        <div className="flex items-center">
          <div className="flex-shrink-0 px-3 py-1 bg-dream-accent3/40 border-r border-white/10 flex items-center">
            <Flame className="h-4 w-4 text-dream-accent2 mr-1.5 animate-pulse" />
            <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-dream-accent2 to-dream-accent1">TRENDING TOKENS</span>
          </div>
          <div className="overflow-hidden mx-4 flex-1">
            <div className="text-sm text-gray-400">Loading trending tokens...</div>
          </div>
        </div>
      </div>;
  }

  if (trendingTokens.length === 0) {
    return <div className="bet-reel-container fixed top-16 left-0 right-0 z-40 bg-black/40 backdrop-blur-md border-b border-white/10 overflow-hidden py-[3px] my-[36px]">
        <div className="flex items-center">
          <div className="flex-shrink-0 px-3 py-1 bg-dream-accent3/40 border-r border-white/10 flex items-center">
            <Flame className="h-4 w-4 text-dream-accent2 mr-1.5 animate-pulse" />
            <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-dream-accent2 to-dream-accent1">TRENDING TOKENS</span>
          </div>
          <div className="overflow-hidden mx-4 flex-1">
            <div className="text-sm text-gray-400 italic">No trending tokens at the moment</div>
          </div>
        </div>
      </div>;
  }

  // Get heat color based on bet count
  const getHeatColor = (betCount: number) => {
    if (betCount > 10) return "text-red-400 bg-red-500/20";
    if (betCount > 5) return "text-amber-400 bg-amber-500/20";
    return "text-green-400 bg-green-500/20";
  };

  return <div className="bet-reel-container fixed top-16 left-0 right-0 z-40 bg-black/40 backdrop-blur-md border-b border-white/10 overflow-hidden py-0 my-[27px]">
      <div className="flex items-center">
        <div className="flex-shrink-0 px-3 py-1 bg-dream-accent3/40 border-r border-white/10 flex items-center">
          <Flame className="h-4 w-4 text-dream-accent2 mr-1.5 animate-pulse" />
          <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-dream-accent2 to-dream-accent1">TRENDING TOKENS</span>
        </div>
        
        <div className="overflow-hidden mx-4 flex-1">
          <div className="flex gap-4 items-center animate-scroll">
            {trendingTokens.map((token, index) => (
              <Link key={`${token.tokenMint}-${index}`} to={`/betting/token/${token.tokenMint}`} className="flex-shrink-0 flex items-center glass-panel px-3 py-2 rounded-md border border-dream-accent1/30 bg-dream-accent1/5 transition-all duration-500 hover:bg-black/40">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dream-accent1/20 to-dream-accent3/20 flex items-center justify-center border border-white/10">
                    <span className="font-display font-bold text-sm">{token.tokenSymbol.charAt(0)}</span>
                  </div>
                  
                  <div className="mr-3">
                    <div className="flex items-center gap-1">
                      <div className="text-sm font-semibold">{token.tokenName}</div>
                      <ExternalLink className="w-3 h-3 text-dream-foreground/40" />
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-dream-foreground/60">
                      <span>{token.tokenSymbol}</span>
                      <span className="flex items-center">
                        <span>{formatAddress(token.tokenMint)}</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 items-center">
                    <div className={`flex items-center px-2 py-0.5 rounded-md text-xs ${getHeatColor(token.betCount)}`}>
                      <BarChart className="h-3 w-3 mr-1" />
                      <span>{token.betCount} bets</span>
                    </div>
                    
                    <div className="flex items-center text-xs bg-dream-accent2/10 px-2 py-0.5 rounded-md">
                      <Wallet className="h-3 w-3 mr-1 text-dream-accent2" />
                      <span className="font-semibold">{token.totalAmount.toFixed(2)} SOL</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>;
};

export default BetReel;
