
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
        handleRefresh();
      }, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh, activeTab]);

  // Fix: Change the function signature to accept a React MouseEvent instead of boolean
  const handleRefresh = async (event?: React.MouseEvent) => {
    if (refreshing) return;
    setRefreshing(true);
    
    // Determine if we should show a toast based on whether this was triggered by a user click
    const showToast = !!event;
    
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

  const renderTokens = (tokens: BitqueryToken[]) => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, index) => (
            <div key={`skeleton-${index}`} className="relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-dream-accent1/5 to-dream-accent3/5 group-hover:from-dream-accent1/10 group-hover:to-dream-accent3/10 transition-all duration-500"></div>
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-dream-accent2 to-transparent opacity-50"></div>
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-dream-accent1 to-transparent opacity-50"></div>
              <div className="absolute -right-12 -top-12 w-24 h-24 bg-dream-accent2/10 blur-xl rounded-full group-hover:bg-dream-accent2/20 transition-all"></div>
              <div className="absolute -left-12 -bottom-12 w-24 h-24 bg-dream-accent1/10 blur-xl rounded-full group-hover:bg-dream-accent1/20 transition-all"></div>
              
              <div className="glass-panel p-4 relative backdrop-blur-md z-10 border border-white/10 group-hover:border-white/20 transition-all duration-300 animate-pulse">
                <div className="h-10 bg-dream-foreground/5 rounded mb-3"></div>
                <div className="h-6 bg-dream-foreground/5 rounded mb-3"></div>
                <div className="h-20 bg-dream-foreground/5 rounded mb-3"></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-10 bg-dream-foreground/5 rounded"></div>
                  <div className="h-10 bg-dream-foreground/5 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (tokens.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-dream-foreground/60">No tokens found. Try refreshing or changing filters.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tokens.map((token, index) => {
          const cardData = transformBitqueryTokenToCardData(token);
          // Fix: Use the right property for the key (MintAddress from the Trade.Buy.Currency object)
          return (
            <div key={`${token.Trade.Buy.Currency.MintAddress}-${index}`} className="relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-dream-accent1/5 to-dream-accent3/5 group-hover:from-dream-accent1/10 group-hover:to-dream-accent3/10 transition-all duration-500"></div>
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-dream-accent2 to-transparent opacity-50"></div>
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-dream-accent1 to-transparent opacity-50"></div>
              <div className="absolute -right-12 -top-12 w-24 h-24 bg-dream-accent2/10 blur-xl rounded-full group-hover:bg-dream-accent2/20 transition-all"></div>
              <div className="absolute -left-12 -bottom-12 w-24 h-24 bg-dream-accent1/10 blur-xl rounded-full group-hover:bg-dream-accent1/20 transition-all"></div>
              
              <TokenCard
                id={cardData.id}
                name={cardData.name}
                symbol={cardData.symbol}
                price={cardData.price}
                priceChange={cardData.priceChange}
                timeRemaining={0}
                liquidity={cardData.liquidity}
                marketCap={cardData.marketCap}
                volume24h={cardData.volume24h}
                index={index}
              />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-display font-bold text-dream-foreground flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-dream-accent1" />
          <span>TOKEN ANALYTICS</span>
        </h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-1.5 h-8"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-xs">Refresh</span>
          </Button>
          <Button 
            variant={autoRefresh ? "default" : "outline"}
            size="sm" 
            onClick={toggleAutoRefresh}
            className="gap-1.5 h-8"
          >
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">Auto Refresh</span>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="top" className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            <span>Top Tokens</span>
          </TabsTrigger>
          <TabsTrigger value="10k" className="flex items-center gap-1.5">
            <ChevronsUp className="w-4 h-4" />
            <span>Above $10K</span>
          </TabsTrigger>
          <TabsTrigger value="15k" className="flex items-center gap-1.5">
            <ChevronsUp className="w-4 h-4" />
            <span>Above $15K</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="top">
          {renderTokens(topTokens)}
        </TabsContent>
        <TabsContent value="10k">
          {renderTokens(tokensWith10kMcap)}
        </TabsContent>
        <TabsContent value="15k">
          {renderTokens(tokensWith15kMcap)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PumpFunTokens;
