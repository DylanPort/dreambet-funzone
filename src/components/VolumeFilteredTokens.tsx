
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
      // Filter tokens specifically by market cap > 15000
      const filteredTokens = tokens.filter(token => token.current_market_cap >= 15000);
      setTokensAbove15k(filteredTokens);
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Rocket className="w-5 h-5 text-dream-accent2" />
          <h2 className="text-xl font-semibold">PumpFun Tokens Above 15k MCAP</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAutoRefresh}
            className={autoRefresh ? 'bg-dream-accent2/10' : ''}
          >
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRefresh(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p>Loading PumpFun tokens...</p>
        ) : tokensAbove15k.length > 0 ? (
          tokensAbove15k.map((token, index) => (
            <TokenCard
              key={token.token_mint}
              {...transformSupabaseTokenToCardData(token)}
              index={index}
            />
          ))
        ) : (
          <p>No PumpFun tokens found above 15k MCAP</p>
        )}
      </div>
    </div>
  );
};

export default VolumeFilteredTokens;
