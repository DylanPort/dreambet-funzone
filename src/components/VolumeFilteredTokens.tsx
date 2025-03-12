import React, { useState, useEffect } from 'react';
import { TokenVolumeData, fetchAbove15kTokens, fetchAbove30kTokens, subscribeToTokenVolumeUpdates, triggerTokenVolumeUpdate } from '@/services/tokenVolumeService';
import TokenCard from './TokenCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, RefreshCw, ChevronsUp } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from "sonner";
import { transformSupabaseTokenToCardData } from '@/services/bitqueryService';

const VolumeFilteredTokens: React.FC = () => {
  const [tokensAbove15k, setTokensAbove15k] = useState<TokenVolumeData[]>([]);
  const [tokensAbove30k, setTokensAbove30k] = useState<TokenVolumeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('above15k');
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    console.log("Setting up volume subscriptions");
    setLoading(true);

    const unsubscribe15k = subscribeToTokenVolumeUpdates('above_15k', tokens => {
      console.log(`Received ${tokens.length} tokens above 15k`);
      setTokensAbove15k(tokens);
      setLoading(false);
    });

    const unsubscribe30k = subscribeToTokenVolumeUpdates('above_30k', tokens => {
      console.log(`Received ${tokens.length} tokens above 30k`);
      setTokensAbove30k(tokens);
      setLoading(false);
    });

    triggerTokenVolumeUpdate();
    return () => {
      unsubscribe15k();
      unsubscribe30k();
    };
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      intervalId = setInterval(() => {
        handleRefresh(false);
      }, 60000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh]);

  const handleRefresh = async (showToast = true) => {
    if (refreshing) return;
    setRefreshing(true);
    if (showToast) toast.info("Refreshing token volume data...");
    try {
      const success = await triggerTokenVolumeUpdate();
      if (success && showToast) {
        toast.success("Token volume data refreshed");
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
          <BarChart3 className="w-5 h-5 text-dream-accent2" />
          <h2 className="text-xl font-semibold">Volume Filtered Tokens</h2>
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

      <Tabs defaultValue="above15k" className="w-full" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="above15k">
            <TrendingUp className="w-4 h-4 mr-2" />
            Above 15k MCAP
          </TabsTrigger>
          <TabsTrigger value="above30k">
            <ChevronsUp className="w-4 h-4 mr-2" />
            Above 30k MCAP
          </TabsTrigger>
        </TabsList>

        <TabsContent value="above15k" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <p>Loading...</p>
            ) : tokensAbove15k.length > 0 ? (
              tokensAbove15k.map((token, index) => (
                <TokenCard
                  key={token.token_mint}
                  {...transformSupabaseTokenToCardData(token)}
                  index={index}
                />
              ))
            ) : (
              <p>No tokens found above 15k MCAP</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="above30k" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <p>Loading...</p>
            ) : tokensAbove30k.length > 0 ? (
              tokensAbove30k.map((token, index) => (
                <TokenCard
                  key={token.token_mint}
                  {...transformSupabaseTokenToCardData(token)}
                  index={index}
                />
              ))
            ) : (
              <p>No tokens found above 30k MCAP</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VolumeFilteredTokens;
