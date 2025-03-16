
import React, { useState, useEffect } from 'react';
import { TokenVolumeData, fetchTokensByVolumeCategory, subscribeToTokenVolumeUpdates, triggerTokenVolumeUpdate } from '@/services/tokenVolumeService';
import TokenCard from './TokenCard';
import { RefreshCw, Rocket } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from "sonner";
import { transformSupabaseTokenToCardData } from '@/services/bitqueryService';

const VolumeFilteredTokens: React.FC = () => {
  const [tokensAbove15k, setTokensAbove15k] = useState<TokenVolumeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    console.log("Setting up PumpFun tokens subscription");
    setLoading(true);
    const unsubscribe = subscribeToTokenVolumeUpdates('above_15k', tokens => {
      console.log(`Received ${tokens.length} PumpFun tokens above 15k MCAP`);
      setTokensAbove15k(tokens);
      setLoading(false);
    });
    triggerTokenVolumeUpdate();
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      intervalId = setInterval(() => {
        handleRefresh(false);
      }, 60000); // Refresh every minute
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh]);

  const handleRefresh = async (showToast = true) => {
    if (refreshing) return;
    setRefreshing(true);
    if (showToast) toast.info("Refreshing PumpFun token data...");
    try {
      const success = await triggerTokenVolumeUpdate();
      if (success && showToast) {
        toast.success("PumpFun token data refreshed");
      }
    } catch (error) {
      console.error("Error refreshing token data:", error);
      if (showToast) toast.error("Failed to refresh token data");
    } finally {
      setRefreshing(false);
    }
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    toast.info(`Auto refresh ${!autoRefresh ? 'enabled' : 'disabled'}`);
  };

  return (
    <div className="glass-panel p-6 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold bg-gradient-to-r from-dream-accent2 to-dream-accent1 bg-clip-text text-transparent">
          Top PumpFun Tokens by Volume
        </h2>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            size="sm"
            className={`${autoRefresh ? 'bg-dream-accent1/20 text-dream-accent1' : ''} transition-all duration-300`}
            onClick={toggleAutoRefresh}
          >
            {autoRefresh ? 'Auto-refreshing' : 'Auto-refresh'}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleRefresh()}
            disabled={refreshing}
            className="relative overflow-hidden"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-pulse text-dream-accent1">Loading tokens data...</div>
        </div>
      ) : tokensAbove15k.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tokensAbove15k.map((token) => (
            <TokenCard 
              key={token.token_mint} 
              {...transformSupabaseTokenToCardData(token)} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Rocket className="mx-auto h-10 w-10 text-dream-accent2 mb-2 animate-float" />
          <p className="text-dream-foreground/70">No tokens found in this category</p>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleRefresh()}
            className="mt-2"
          >
            Refresh Data
          </Button>
        </div>
      )}
    </div>
  );
};

export default VolumeFilteredTokens;
