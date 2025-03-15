
import React, { useState, useEffect } from 'react';
import { fetchTopTokensByMarketCap, fetchTokensAbove10kMarketCap, fetchTokensAbove15kMarketCap, transformBitqueryTokenToCardData, BitqueryToken } from '@/services/bitqueryService';
import TokenCard from './TokenCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, RefreshCw, ChevronsUp } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from "sonner";

const PumpFunTokens: React.FC = () => {
  const [topTokens, setTopTokens] = useState<BitqueryToken[]>([]);
  const [tokensWith10kMcap, setTokensWith10kMcap] = useState<BitqueryToken[]>([]);
  const [tokensWith15kMcap, setTokensWith15kMcap] = useState<BitqueryToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('top');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch data based on active tab to optimize performance
      if (activeTab === 'top') {
        const topTokensData = await fetchTopTokensByMarketCap();
        setTopTokens(topTokensData);
      } else if (activeTab === '10k') {
        const tokens10kData = await fetchTokensAbove10kMarketCap();
        setTokensWith10kMcap(tokens10kData);
      } else if (activeTab === '15k') {
        const tokens15kData = await fetchTokensAbove15kMarketCap();
        setTokensWith15kMcap(tokens15kData);
      }
    } catch (error) {
      console.error("Error fetching PumpFun token data:", error);
      toast.error("Failed to fetch token data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Auto refresh timer
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      intervalId = setInterval(() => {
        handleRefresh(false);
      }, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh, activeTab]);

  const handleRefresh = async (showToast = true) => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await fetchData();
      if (showToast) {
        toast.success("Token data refreshed successfully!");
      }
    } catch (error) {
      if (showToast) {
        toast.error("Failed to refresh token data.");
      }
    } finally {
      setRefreshing(false);
    }
  };

  // Fix for the MouseEventHandler issue - we need to handle the event correctly
  const handleRefreshClick = () => {
    handleRefresh(true);
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    toast.info(`Auto refresh ${!autoRefresh ? 'enabled' : 'disabled'}`);
  };

  return (
    <div className="pump-fun-tokens">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center">
          <ChevronsUp className="mr-2 h-5 w-5 text-dream-accent2" />
          <h2 className="text-lg font-bold">PumpFun Token Rankings</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefreshClick} 
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
      
      <Tabs defaultValue="top" className="w-full" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="top">Top by Market Cap</TabsTrigger>
          <TabsTrigger value="10k">+10k MCAP</TabsTrigger>
          <TabsTrigger value="15k">+15k MCAP</TabsTrigger>
        </TabsList>
        
        <TabsContent value="top">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="bg-dream-background/40 rounded-lg p-4 animate-pulse h-44"></div>
              ))}
            </div>
          ) : topTokens.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {topTokens.map((token, index) => (
                <TokenCard 
                  key={token.Trade?.Buy?.Currency?.MintAddress || `top-token-${index}`}
                  {...transformBitqueryTokenToCardData(token)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-dream-foreground/60">
              <p>No top tokens found at the moment.</p>
              <p className="text-sm mt-2">Check back later or refresh!</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="10k">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="bg-dream-background/40 rounded-lg p-4 animate-pulse h-44"></div>
              ))}
            </div>
          ) : tokensWith10kMcap.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {tokensWith10kMcap.map((token, index) => (
                <TokenCard 
                  key={token.Trade?.Buy?.Currency?.MintAddress || `10k-token-${index}`}
                  {...transformBitqueryTokenToCardData(token)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-dream-foreground/60">
              <p>No tokens with 10k+ market cap found.</p>
              <p className="text-sm mt-2">Check back later or refresh!</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="15k">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="bg-dream-background/40 rounded-lg p-4 animate-pulse h-44"></div>
              ))}
            </div>
          ) : tokensWith15kMcap.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {tokensWith15kMcap.map((token, index) => (
                <TokenCard 
                  key={token.Trade?.Buy?.Currency?.MintAddress || `15k-token-${index}`}
                  {...transformBitqueryTokenToCardData(token)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-dream-foreground/60">
              <p>No tokens with 15k+ market cap found.</p>
              <p className="text-sm mt-2">Check back later or refresh!</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PumpFunTokens;
