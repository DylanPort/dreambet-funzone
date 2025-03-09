
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchOpenBets } from '@/services/supabaseService';
import { Bet } from '@/types/bet';
import { useWallet } from '@solana/wallet-adapter-react';
import { useToast } from '@/hooks/use-toast';
import { Zap, ArrowUp, ArrowDown, Wallet, Clock, ExternalLink, Filter } from 'lucide-react';
import { formatTimeRemaining } from '@/utils/betUtils';
import { Link } from 'react-router-dom';

const OpenBetsList = () => {
  const { data: openBets = [], isLoading, error } = useQuery({
    queryKey: ['openBets'],
    queryFn: fetchOpenBets,
  });
  
  const { connected, publicKey } = useWallet();
  const { toast } = useToast();
  
  const [filter, setFilter] = useState('all');
  
  const filteredBets = openBets.filter(bet => {
    if (filter === 'all') return true;
    return filter === bet.prediction;
  });

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-display font-bold text-dream-foreground flex items-center gap-2">
            <span>ACTIVE BETS</span>
          </h2>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center text-sm bg-dream-background/50 backdrop-blur-sm px-3 py-1 rounded-full border border-dream-accent1/30">
              <Filter className="w-3.5 h-3.5 mr-1.5 text-dream-accent1" />
              <span className="font-medium">Filter 3</span>
            </div>
            
            <div className="flex items-center text-sm bg-dream-background/30 backdrop-blur-sm px-3 py-1 rounded-full border border-dream-accent2/20">
              <Zap className="w-4 h-4 text-dream-accent2" />
              <span>0.6</span>
            </div>
          </div>
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass-panel p-4 animate-pulse">
              <div className="h-5 w-32 bg-gray-700/50 rounded mb-2"></div>
              <div className="h-4 w-16 bg-gray-700/50 rounded mb-4"></div>
              <div className="h-8 bg-gray-700/50 rounded mb-2"></div>
              <div className="h-8 bg-gray-700/50 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-6 text-center">
        <p className="text-red-400 mb-2">Failed to load open bets</p>
        <p className="text-dream-foreground/60 text-sm">
          There was an error fetching the open bets. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-display font-bold text-dream-foreground flex items-center gap-2">
          <span>ACTIVE BETS</span>
        </h2>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center text-sm bg-dream-background/50 backdrop-blur-sm px-3 py-1 rounded-full border border-dream-accent1/30">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-dream-accent1" />
            <span className="font-medium">Filter 3</span>
          </div>
          
          <div className="flex items-center text-sm bg-dream-background/30 backdrop-blur-sm px-3 py-1 rounded-full border border-dream-accent2/20">
            <Zap className="w-4 h-4 text-dream-accent2" />
            <span>0.6</span>
          </div>
        </div>
      </div>

      {filteredBets.length === 0 ? (
        <div className="glass-panel p-6 text-center">
          <p className="text-dream-foreground/80 mb-2">No open bets available</p>
          <p className="text-dream-foreground/60 text-sm">
            Be the first to create a bet on a token migration!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredBets.map((bet) => (
            <Link 
              key={bet.id} 
              to={`/betting/token/${bet.tokenId}`}
              className="token-card relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-dream-accent1/5 to-dream-accent3/5 group-hover:from-dream-accent1/10 group-hover:to-dream-accent3/10 transition-all duration-500"></div>
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-dream-accent2 to-transparent opacity-50"></div>
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-dream-accent1 to-transparent opacity-50"></div>
              
              <div className="absolute -right-12 -top-12 w-24 h-24 bg-dream-accent2/10 blur-xl rounded-full group-hover:bg-dream-accent2/20 transition-all"></div>
              <div className="absolute -left-12 -bottom-12 w-24 h-24 bg-dream-accent1/10 blur-xl rounded-full group-hover:bg-dream-accent1/20 transition-all"></div>
              
              <div className="glass-panel p-4 relative backdrop-blur-md z-10 border border-white/10 group-hover:border-white/20 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dream-accent1/20 to-dream-accent3/20 flex items-center justify-center border border-white/10">
                      <span className="font-display font-bold text-lg">{bet.tokenSymbol.charAt(0)}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <h3 className="font-display font-semibold text-lg">{bet.tokenName}</h3>
                        <ExternalLink className="w-3.5 h-3.5 text-dream-foreground/40" />
                      </div>
                      <p className="text-dream-foreground/60 text-sm">{bet.tokenSymbol}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 h-6 px-2 rounded-md bg-dream-background/40 text-xs text-dream-foreground/60">
                      <Zap className="w-3 h-3" />
                      <span>0.6</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm
                      ${bet.prediction === 'migrate' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {bet.prediction === 'migrate' 
                        ? <ArrowUp className="h-3.5 w-3.5 mr-1" /> 
                        : <ArrowDown className="h-3.5 w-3.5 mr-1" />}
                      <span>{bet.prediction === 'migrate' ? 'Moon' : 'Die'}</span>
                    </div>
                  </div>
                  <div className="flex items-center text-sm bg-dream-accent2/10 px-2 py-1 rounded-lg">
                    <Wallet className="h-3.5 w-3.5 mr-1.5 text-dream-accent2" />
                    <span className="font-semibold">{bet.amount} SOL</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-dream-foreground/60 mb-3">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeRemaining(bet.expiresAt)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>Created by {bet.initiator.substring(0, 4)}...{bet.initiator.substring(bet.initiator.length - 4)}</span>
                  </div>
                </div>

                <button className="bet-button w-full py-2 text-sm font-semibold">
                  <span className="z-10 relative">Accept Bet</span>
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default OpenBetsList;
