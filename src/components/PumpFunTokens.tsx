
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

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    toast.info(`Auto refresh ${!autoRefresh ? 'enabled' : 'disabled'}`);
  };

  // FIX: Return JSX instead of void
  return (
    <div className="glass-panel p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-display font-bold text-dream-foreground">
          PumpFun Tokens <span className="text-xs bg-dream-accent1/20 text-dream-accent1 px-2 py-1 rounded-full ml-2">Bitquery Data</span>
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

      <Tabs defaultValue="top" onValueChange={setActiveTab}>
        <TabsList className="w-full mb-6 bg-dream-foreground/5">
          <TabsTrigger value="top" className="flex items-center gap-2">
            <BarChart3 size={16} />
            <span>Top by Market Cap</span>
          </TabsTrigger>
          <TabsTrigger value="10k" className="flex items-center gap-2">
            <TrendingUp size={16} />
            <span>Above 10k Market Cap</span>
          </TabsTrigger>
          <TabsTrigger value="15k" className="flex items-center gap-2">
            <ChevronsUp size={16} />
            <span>Above 15k Market Cap</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="top">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin w-8 h-8 border-2 border-dream-accent1 border-t-transparent rounded-full"></div>
            </div>
          ) : topTokens.length === 0 ? (
            <div className="text-center py-10 text-dream-foreground/60">
              No top tokens found. Try refreshing later.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topTokens.map((token, index) => (
                <TokenCard 
                  key={`${token.mint}-${index}`}
                  {...transformBitqueryTokenToCardData(token)}
                  index={index}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="10k">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin w-8 h-8 border-2 border-dream-accent1 border-t-transparent rounded-full"></div>
            </div>
          ) : tokensWith10kMcap.length === 0 ? (
            <div className="text-center py-10 text-dream-foreground/60">
              No tokens with market cap above 10,000 found. Try refreshing later.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tokensWith10kMcap.map((token, index) => (
                <TokenCard 
                  key={`${token.mint}-${index}`}
                  {...transformBitqueryTokenToCardData(token)}
                  index={index}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="15k">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin w-8 h-8 border-2 border-dream-accent1 border-t-transparent rounded-full"></div>
            </div>
          ) : tokensWith15kMcap.length === 0 ? (
            <div className="text-center py-10 text-dream-foreground/60">
              No tokens with market cap above 15,000 found. Try refreshing later.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tokensWith15kMcap.map((token, index) => (
                <TokenCard 
                  key={`${token.mint}-${index}`}
                  {...transformBitqueryTokenToCardData(token)}
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

export default PumpFunTokens;
