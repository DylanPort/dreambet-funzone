
import React, { useState, useEffect } from 'react';
import { fetchMigratingTokens } from '@/api/mockData';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, Clock, AlertCircle, Zap, Sparkles, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePumpPortalWebSocket, formatWebSocketTokenData } from '@/services/pumpPortalWebSocketService';
import { Button } from '@/components/ui/button';

const MigratingTokenList = () => {
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const pumpPortal = usePumpPortalWebSocket();
  
  // Subscribe to new token events
  useEffect(() => {
    if (pumpPortal.connected) {
      pumpPortal.subscribeToNewTokens();
    }
  }, [pumpPortal.connected]);

  // Initial load from Supabase
  useEffect(() => {
    const loadTokens = async () => {
      try {
        const data = await fetchMigratingTokens();
        setTokens(data);
      } catch (error) {
        console.error('Error loading tokens:', error);
        toast({
          title: "Failed to load tokens",
          description: "There was an error loading token data from Pump.fun.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadTokens();
    // Refresh data every 2 minutes from Supabase as a fallback
    const interval = setInterval(loadTokens, 120000);
    return () => clearInterval(interval);
  }, [toast]);
  
  // Listen for real-time token updates
  useEffect(() => {
    if (pumpPortal.recentTokens.length > 0) {
      // Convert WebSocket token data to our format and merge with existing tokens
      const newTokens = pumpPortal.recentTokens.map(formatWebSocketTokenData);
      
      // Merge with existing tokens, avoiding duplicates
      setTokens(currentTokens => {
        const existingIds = new Set(currentTokens.map(t => t.id));
        const newUniqueTokens = newTokens.filter(t => !existingIds.has(t.id));
        
        // Show toast for new tokens if any
        if (newUniqueTokens.length > 0) {
          toast({
            title: "New tokens created!",
            description: `${newUniqueTokens.length} new tokens from Pump.fun`,
            variant: "default"
          });
        }
        
        return [...newUniqueTokens, ...currentTokens];
      });
      
      // If we were in loading state, exit it
      if (loading) {
        setLoading(false);
      }
    }
  }, [pumpPortal.recentTokens, loading, toast]);

  // Function to format time since migration
  const formatTimeSince = (timestamp: number) => {
    const now = new Date().getTime();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m ago`;
    }
  };

  // Get tokenSymbol first letter or emoji for display
  const getTokenIcon = (symbol: string) => {
    if (!symbol) return '🪙';
    return symbol.charAt(0);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold text-dream-foreground">
          Migrating Tokens
        </h2>
        
        <div className="flex items-center text-sm">
          <span className={`flex items-center gap-1 ${pumpPortal.connected ? 'text-green-400' : 'text-yellow-400'}`}>
            <Zap className="w-4 h-4" />
            {pumpPortal.connected ? 'Live' : 'Connecting...'}
          </span>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-dream-accent2 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : tokens.length === 0 ? (
        <div className="glass-panel p-8 text-center">
          {pumpPortal.connected && pumpPortal.recentTokens.length > 0 ? (
            <>
              <Sparkles className="w-12 h-12 text-dream-accent2/70 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">New Pump.fun Tokens</h3>
              <div className="space-y-4 mt-4">
                {pumpPortal.recentTokens.slice(0, 5).map((token, index) => (
                  <div key={token.token_mint} className="glass-panel p-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dream-accent1/20 to-dream-accent3/20 flex items-center justify-center text-lg border border-white/10">
                        {token.token_symbol ? token.token_symbol.charAt(0) : '🪙'}
                      </div>
                      <div className="ml-2">
                        <h4 className="font-semibold">{token.token_name || 'Unknown Token'}</h4>
                        <p className="text-xs text-dream-foreground/70">{token.token_symbol || '???'}</p>
                      </div>
                    </div>
                    <span className="text-xs text-dream-foreground/70 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatTimeSince(new Date(token.created_time).getTime())}
                    </span>
                  </div>
                ))}
              </div>
              <Button 
                className="mt-4 bg-dream-accent1/20 hover:bg-dream-accent1/40 px-3 py-1 text-sm transition-colors"
                onClick={() => window.open('https://pump.fun', '_blank')}
              >
                Visit Pump.fun <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </>
          ) : (
            <>
              <AlertCircle className="w-12 h-12 text-dream-accent2/70 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Tokens Found</h3>
              <p className="text-dream-foreground/70">
                No migrating tokens from Pump.fun are currently available.
                Check back soon for updates.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tokens.map(token => (
            <Link
              key={token.id}
              to={`/token/${token.id}`}
              className="glass-panel p-4 hover:shadow-neon transition-all duration-300"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dream-accent1/20 to-dream-accent3/20 flex items-center justify-center text-xl border border-white/10">
                    {getTokenIcon(token.symbol)}
                  </div>
                  <div className="ml-2">
                    <h3 className="font-display font-semibold">{token.name || 'Unknown Token'}</h3>
                    <p className="text-sm text-dream-foreground/70">{token.symbol || '???'}</p>
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  <Clock className="w-3 h-3 mr-1 text-dream-foreground/70" />
                  <span className="text-dream-foreground/70">
                    {formatTimeSince(token.migrationTime)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center mt-3 justify-between">
                <div>
                  <div className="text-lg font-bold">${token.currentPrice.toFixed(6)}</div>
                  <div className={`text-sm flex items-center ${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {token.change24h >= 0 ? (
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 mr-1" />
                    )}
                    {Math.abs(token.change24h || 0).toFixed(1)}%
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button className="bg-dream-accent1/20 hover:bg-dream-accent1/40 px-3 py-1 rounded text-sm transition-colors">
                    Bet
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MigratingTokenList;
