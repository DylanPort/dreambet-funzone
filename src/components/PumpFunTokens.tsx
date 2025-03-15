
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

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-display font-bold flex items-center gap-2">
          <ChevronsUp className="text-dream-accent1" />
          PumpFun Tokens
        </h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleAutoRefresh}
            className={autoRefresh ? "bg-dream-accent2/20" : ""}
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

      <Tabs defaultValue="top" className="mb-6" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="top">
            <BarChart3 className="w-4 h-4 mr-2" />
            Top Tokens
          </TabsTrigger>
          <TabsTrigger value="10k">
            <TrendingUp className="w-4 h-4 mr-2" />
            10k+ MCAP
          </TabsTrigger>
          <TabsTrigger value="15k">
            <ChevronsUp className="w-4 h-4 mr-2" />
            15k+ MCAP
          </TabsTrigger>
        </TabsList>

        <TabsContent value="top" className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass-panel p-4 animate-pulse h-44" />
              ))}
            </div>
          ) : topTokens.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topTokens.map((token, index) => {
                const cardData = transformBitqueryTokenToCardData(token);
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
              <p>No tokens found. Try refreshing or check back later.</p>
              <Button onClick={() => handleRefresh()} className="mt-4" disabled={refreshing}>
                {refreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="10k" className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass-panel p-4 animate-pulse h-44" />
              ))}
            </div>
          ) : tokensWith10kMcap.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tokensWith10kMcap.map((token, index) => {
                const cardData = transformBitqueryTokenToCardData(token);
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
              <p>No tokens with 10k+ market cap found. Try refreshing or check back later.</p>
              <Button onClick={() => handleRefresh()} className="mt-4" disabled={refreshing}>
                {refreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="15k" className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass-panel p-4 animate-pulse h-44" />
              ))}
            </div>
          ) : tokensWith15kMcap.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tokensWith15kMcap.map((token, index) => {
                const cardData = transformBitqueryTokenToCardData(token);
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
              <p>No tokens with 15k+ market cap found. Try refreshing or check back later.</p>
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

export default PumpFunTokens;
