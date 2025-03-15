
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

  // Initial data fetch and set up real-time subscriptions
  useEffect(() => {
    console.log("Setting up volume subscriptions");
    setLoading(true);

    // Subscribe to 15k+ volume tokens
    const unsubscribe15k = subscribeToTokenVolumeUpdates('above_15k', tokens => {
      console.log(`Received ${tokens.length} tokens above 15k`);
      setTokensAbove15k(tokens);
      setLoading(false);
    });

    // Subscribe to 30k+ volume tokens
    const unsubscribe30k = subscribeToTokenVolumeUpdates('above_30k', tokens => {
      console.log(`Received ${tokens.length} tokens above 30k`);
      setTokensAbove30k(tokens);
      setLoading(false);
    });

    // Initial data load if needed
    triggerTokenVolumeUpdate();
    return () => {
      unsubscribe15k();
      unsubscribe30k();
    };
  }, []);

  // Auto refresh timer
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
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-display font-bold flex items-center gap-2">
          <BarChart3 className="text-dream-accent3" />
          Volume Filtered Tokens
        </h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleAutoRefresh}
            className={autoRefresh ? "bg-dream-accent3/20" : ""}
          >
            {autoRefresh ? "Auto Refresh: ON" : "Auto Refresh: OFF"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleRefresh()}
            disabled={refreshing}
          >
            <RefreshCw className={refreshing ? "animate-spin" : ""} size={16} />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="above15k" className="mb-6" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="above15k">
            <TrendingUp className="w-4 h-4 mr-2" />
            15k+ Volume
          </TabsTrigger>
          <TabsTrigger value="above30k">
            <ChevronsUp className="w-4 h-4 mr-2" />
            30k+ Volume
          </TabsTrigger>
        </TabsList>

        <TabsContent value="above15k" className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass-panel p-4 animate-pulse h-44" />
              ))}
            </div>
          ) : tokensAbove15k.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tokensAbove15k.map((token, index) => {
                const cardData = transformSupabaseTokenToCardData(token);
                return (
                  <TokenCard
                    key={`${cardData.id}-${index}`}
                    {...cardData}
                    index={index}
                  />
                );
              })}
            </div>
          ) : (
            <div className="glass-panel p-6 text-center">
              <p>No tokens with 15k+ volume found. Try refreshing or check back later.</p>
              <Button onClick={() => handleRefresh()} className="mt-4" disabled={refreshing}>
                {refreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="above30k" className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass-panel p-4 animate-pulse h-44" />
              ))}
            </div>
          ) : tokensAbove30k.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tokensAbove30k.map((token, index) => {
                const cardData = transformSupabaseTokenToCardData(token);
                return (
                  <TokenCard
                    key={`${cardData.id}-${index}`}
                    {...cardData}
                    index={index}
                  />
                );
              })}
            </div>
          ) : (
            <div className="glass-panel p-6 text-center">
              <p>No tokens with 30k+ volume found. Try refreshing or check back later.</p>
              <Button onClick={() => handleRefresh()} className="mt-4" disabled={refreshing}>
                {refreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
};

export default VolumeFilteredTokens;
