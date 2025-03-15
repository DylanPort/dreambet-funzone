
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

  // Add the JSX return statement
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 overflow-hidden">
      <div className="p-4 bg-black/30 border-b border-white/10">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">PumpFun Tokens</h2>
          <div className="flex space-x-2">
            <Button
              variant="outline" 
              size="sm"
              onClick={() => handleRefresh()}
              disabled={refreshing}
              className="flex items-center"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={toggleAutoRefresh}
              className="flex items-center"
            >
              <ChevronsUp className="w-4 h-4 mr-1" />
              Auto {autoRefresh ? 'ON' : 'OFF'}
            </Button>
          </div>
        </div>
      </div>
      <div className="p-4">
        {/* Placeholder content - you can expand this */}
        <div className="text-center p-4">
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin w-6 h-6 border-2 border-current border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <p>Token data loaded successfully.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PumpFunTokens;
