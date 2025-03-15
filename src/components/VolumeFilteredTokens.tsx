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
    <div className="volume-filtered-tokens">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center">
          <BarChart3 className="mr-2 h-5 w-5 text-dream-accent3" />
          <h2 className="text-lg font-bold">Volume Filtered Tokens</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleRefresh(true)} 
            disabled={refreshing}
            className="flex items-center text-xs"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          
          <Button 
            variant={autoRefresh ? "default" : "outline"} 
            size="sm" 
            onClick={toggleAutoRefresh}
            className="text-xs"
          >
            {autoRefresh ? 'Auto-Refresh: ON' : 'Auto-Refresh: OFF'}
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="above15k" className="w-full" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="above15k">15k+ Volume</TabsTrigger>
          <TabsTrigger value="above30k">30k+ Volume</TabsTrigger>
        </TabsList>
        
        <TabsContent value="above15k">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="bg-dream-background/40 rounded-lg p-4 animate-pulse h-44"></div>
              ))}
            </div>
          ) : tokensAbove15k.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {tokensAbove15k.map((token, index) => (
                <TokenCard 
                  key={token.token_mint || index}
                  {...transformSupabaseTokenToCardData(token)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-dream-foreground/60">
              <p>No tokens with 15k+ volume found.</p>
              <p className="text-sm mt-2">Check back later or refresh!</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="above30k">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="bg-dream-background/40 rounded-lg p-4 animate-pulse h-44"></div>
              ))}
            </div>
          ) : tokensAbove30k.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {tokensAbove30k.map((token, index) => (
                <TokenCard 
                  key={token.token_mint || index}
                  {...transformSupabaseTokenToCardData(token)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-dream-foreground/60">
              <p>No tokens with 30k+ volume found.</p>
              <p className="text-sm mt-2">Check back later or refresh!</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VolumeFilteredTokens;
