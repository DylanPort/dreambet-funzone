
import React, { useState, useEffect } from 'react';
import { fetchTopTokensByMarketCap, fetchTokensAbove10kMarketCap, transformBitqueryTokenToCardData, BitqueryToken } from '@/services/bitqueryService';
import TokenCard from './TokenCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, RefreshCw } from 'lucide-react';

const PumpFunTokens: React.FC = () => {
  const [topTokens, setTopTokens] = useState<BitqueryToken[]>([]);
  const [tokensWith10kMcap, setTokensWith10kMcap] = useState<BitqueryToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [topTokensData, tokens10kData] = await Promise.all([
        fetchTopTokensByMarketCap(),
        fetchTokensAbove10kMarketCap()
      ]);
      
      setTopTokens(topTokensData);
      setTokensWith10kMcap(tokens10kData);
    } catch (error) {
      console.error("Error fetching PumpFun token data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  return (
    <div className="glass-panel p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-display font-bold text-dream-foreground">
          PumpFun Tokens
        </h2>
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center text-dream-accent2 hover:text-dream-accent2/80 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <Tabs defaultValue="top">
        <TabsList className="w-full mb-6 bg-dream-foreground/5">
          <TabsTrigger value="top" className="flex items-center gap-2">
            <BarChart3 size={16} />
            <span>Top by Market Cap</span>
          </TabsTrigger>
          <TabsTrigger value="10k" className="flex items-center gap-2">
            <TrendingUp size={16} />
            <span>Above 10k MCAP</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="top">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin w-8 h-8 border-2 border-dream-accent1 border-t-transparent rounded-full"></div>
            </div>
          ) : topTokens.length === 0 ? (
            <div className="text-center py-10 text-dream-foreground/60">
              No tokens found. Try refreshing later.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topTokens.map((token, index) => (
                <TokenCard 
                  key={`top-${token.Trade.Buy.Currency.MintAddress}-${index}`}
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
              No tokens found. Try refreshing later.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tokensWith10kMcap.map((token, index) => (
                <TokenCard 
                  key={`10k-${token.Trade.Buy.Currency.MintAddress}-${index}`}
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
