
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
    const unsubscribe15k = subscribeToTokenVolumeUpdates('above_15k', (tokens) => {
      console.log(`Received ${tokens.length} tokens above 15k`);
      setTokensAbove15k(tokens);
      setLoading(false);
    });
    
    // Subscribe to 30k+ volume tokens
    const unsubscribe30k = subscribeToTokenVolumeUpdates('above_30k', (tokens) => {
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
    <div className="glass-panel p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-display font-bold text-dream-foreground">
          Volume-Filtered Tokens <span className="text-xs bg-dream-accent1/20 text-dream-accent1 px-2 py-1 rounded-full ml-2">Live Data</span>
        </h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={toggleAutoRefresh}
            className={`text-xs ${autoRefresh ? 'bg-dream-accent2/20 text-dream-accent2' : ''}`}
          >
            {autoRefresh ? 'Auto Refreshing' : 'Auto Refresh'}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleRefresh()}
            disabled={refreshing}
            className="text-xs"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="above15k" onValueChange={setActiveTab}>
        <TabsList className="w-full mb-6 bg-dream-foreground/5">
          <TabsTrigger value="above15k" className="flex items-center gap-2">
            <TrendingUp size={16} />
            <span>Above 15k Volume</span>
            {tokensAbove15k.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-dream-accent1/20 text-dream-accent1 rounded-full text-xs">
                {tokensAbove15k.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="above30k" className="flex items-center gap-2">
            <ChevronsUp size={16} />
            <span>Above 30k Volume</span>
            {tokensAbove30k.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-dream-accent2/20 text-dream-accent2 rounded-full text-xs">
                {tokensAbove30k.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="above15k">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin w-8 h-8 border-2 border-dream-accent1 border-t-transparent rounded-full"></div>
            </div>
          ) : tokensAbove15k.length === 0 ? (
            <div className="text-center py-10 text-dream-foreground/60">
              No tokens found with volume above 15,000. Try refreshing later.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tokensAbove15k.map((token, index) => (
                <TokenCard 
                  key={`15k-${token.token_mint}-${index}`}
                  {...transformSupabaseTokenToCardData(token)}
                  index={index}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="above30k">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin w-8 h-8 border-2 border-dream-accent1 border-t-transparent rounded-full"></div>
            </div>
          ) : tokensAbove30k.length === 0 ? (
            <div className="text-center py-10 text-dream-foreground/60">
              No tokens found with volume above 30,000. Try refreshing later.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tokensAbove30k.map((token, index) => (
                <TokenCard 
                  key={`30k-${token.token_mint}-${index}`}
                  {...transformSupabaseTokenToCardData(token)}
                  index={index}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VolumeFilteredTokens;
