
import React, { useState, useEffect } from 'react';
import { fetchTopTokensByMarketCap, fetchTokensAbove10kMarketCap, fetchTokensAbove15kMarketCap, BitqueryToken } from '@/services/bitqueryService';
import TokenList from './TokenList';
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-dream-accent2" />
          <h2 className="text-xl font-semibold">PumpFun Tokens</h2>
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

      <Tabs defaultValue="top" className="w-full" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="top">
            <TrendingUp className="w-4 h-4 mr-2" />
            Top Tokens
          </TabsTrigger>
          <TabsTrigger value="10k">
            <ChevronsUp className="w-4 h-4 mr-2" />
            Above 10k MCAP
          </TabsTrigger>
          <TabsTrigger value="15k">
            <BarChart3 className="w-4 h-4 mr-2" />
            Above 15k MCAP
          </TabsTrigger>
        </TabsList>

        <TabsContent value="top" className="mt-4">
          <TokenList 
            tokens={topTokens} 
            loading={loading} 
            emptyMessage="No tokens found" 
          />
        </TabsContent>

        <TabsContent value="10k" className="mt-4">
          <TokenList 
            tokens={tokensWith10kMcap} 
            loading={loading} 
            emptyMessage="No tokens found above 10k MCAP" 
          />
        </TabsContent>

        <TabsContent value="15k" className="mt-4">
          <TokenList 
            tokens={tokensWith15kMcap} 
            loading={loading} 
            emptyMessage="No tokens found above 15k MCAP" 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PumpFunTokens;
