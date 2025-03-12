
import React, { useState, useEffect } from 'react';
import { TokenVolumeData, subscribeToTokenVolumeUpdates, triggerTokenVolumeUpdate } from '@/services/tokenVolumeService';
import { transformSupabaseTokenToCardData } from '@/services/bitqueryService';
import TokenList from './TokenList';
import { RefreshCw, Rocket } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from "sonner";

const VolumeFilteredTokens: React.FC = () => {
  const [tokens, setTokens] = useState<TokenVolumeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    console.log("Setting up PumpFun tokens subscription");
    setLoading(true);

    const unsubscribe = subscribeToTokenVolumeUpdates('above_15k', tokens => {
      console.log(`Received ${tokens.length} PumpFun tokens above 15k MCAP`);
      setTokens(tokens);
      setLoading(false);
    });

    triggerTokenVolumeUpdate();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      intervalId = setInterval(() => handleRefresh(false), 60000); // Refresh every minute
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

      <TokenList 
        tokens={tokens} 
        loading={loading} 
        transformFn={transformSupabaseTokenToCardData}
        emptyMessage="No PumpFun tokens found above 15k MCAP"
      />
    </div>
  );
};

export default VolumeFilteredTokens;
