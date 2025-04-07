
import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { fetchTokenMetrics } from '@/services/tokenDataCache';
import usePumpPortal from '@/hooks/usePumpPortal';
import { formatDistanceToNow } from 'date-fns';

// Format time for chart display
const formatChartTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Custom tooltip component for the chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/80 border border-gray-700 rounded p-2 shadow-md">
        <p className="text-gray-300">{`Time: ${label}`}</p>
        <p className="text-green-400">{`Price: ${payload[0].value.toFixed(8)} PXB`}</p>
        {payload[1] && (
          <p className="text-blue-400">{`Volume: ${payload[1].value.toFixed(2)} PXB`}</p>
        )}
      </div>
    );
  }
  return null;
};

interface TokenTradingChartProps {
  tokenId: string;
  onMetricsUpdate?: (metrics: any) => void;
}

const TokenTradingChart: React.FC<TokenTradingChartProps> = ({ 
  tokenId,
  onMetricsUpdate
}) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('1h');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [marketCap, setMarketCap] = useState<number | null>(null);
  const [volume24h, setVolume24h] = useState<number | null>(null);
  
  // Use pump portal hook to get real-time data
  const pumpPortal = usePumpPortal(tokenId);
  
  // Refresh metrics with the latest data
  const refreshMetrics = useCallback(async () => {
    try {
      const metrics = await fetchTokenMetrics(tokenId);
      if (metrics) {
        // Update market cap and other metrics
        setMarketCap(metrics.marketCap || null);
        setVolume24h(metrics.volume24h || null);
        
        if (metrics.priceHistory && metrics.priceHistory.length > 0) {
          const sortedPrices = [...metrics.priceHistory].sort((a, b) => a.timestamp - b.timestamp);
          
          // Calculate price change percentage
          if (sortedPrices.length >= 2) {
            const oldestPrice = sortedPrices[0].price;
            const latestPrice = sortedPrices[sortedPrices.length - 1].price;
            setCurrentPrice(latestPrice);
            
            if (oldestPrice > 0) {
              const changePercent = ((latestPrice - oldestPrice) / oldestPrice) * 100;
              setPriceChange(changePercent);
            }
          } else if (sortedPrices.length === 1) {
            setCurrentPrice(sortedPrices[0].price);
          }
          
          // Format data for chart
          const formattedData = sortedPrices.map(point => ({
            time: formatChartTime(point.timestamp),
            price: point.price,
            volume: point.volume || 0,
            timestamp: point.timestamp
          }));
          
          setChartData(formattedData);
        }
        
        setLastUpdated(new Date());
        if (onMetricsUpdate) {
          onMetricsUpdate(metrics);
        }
      }
    } catch (error) {
      console.error('Error refreshing metrics:', error);
    } finally {
      setLoading(false);
    }
  }, [tokenId, onMetricsUpdate]);
  
  // Initial data load and periodic refresh
  useEffect(() => {
    refreshMetrics();
    
    // Set up 5-second refresh interval
    const intervalId = setInterval(() => {
      refreshMetrics();
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [refreshMetrics]);
  
  // Filter data based on selected time range
  const filteredChartData = chartData.filter(point => {
    if (!point.timestamp) return false;
    
    const now = Date.now();
    const pointTime = new Date(point.timestamp).getTime();
    
    switch (timeRange) {
      case '1h':
        return (now - pointTime) <= 3600000; // 1 hour in ms
      case '24h':
        return (now - pointTime) <= 86400000; // 24 hours in ms
      case '7d':
        return (now - pointTime) <= 604800000; // 7 days in ms
      default:
        return true;
    }
  });
  
  return (
    <Card className="p-6 bg-black/20 backdrop-blur-md border-gray-800">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">Price Chart</h2>
          <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as '1h' | '24h' | '7d')}>
            <TabsList className="grid grid-cols-3 w-[180px]">
              <TabsTrigger value="1h">1H</TabsTrigger>
              <TabsTrigger value="24h">24H</TabsTrigger>
              <TabsTrigger value="7d">7D</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-900/50 p-3 rounded-md">
            <p className="text-sm text-gray-400">Current Price</p>
            {loading ? (
              <Skeleton className="h-6 w-20 mt-1" />
            ) : (
              <p className="text-lg font-medium">
                {currentPrice !== null ? `${currentPrice.toFixed(8)} PXB` : 'N/A'}
              </p>
            )}
          </div>
          
          <div className="bg-gray-900/50 p-3 rounded-md">
            <p className="text-sm text-gray-400">Price Change</p>
            {loading ? (
              <Skeleton className="h-6 w-20 mt-1" />
            ) : (
              <p className={`text-lg font-medium ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {priceChange !== null ? `${priceChange.toFixed(2)}%` : 'N/A'}
              </p>
            )}
          </div>
          
          <div className="bg-gray-900/50 p-3 rounded-md">
            <p className="text-sm text-gray-400">24h Volume</p>
            {loading ? (
              <Skeleton className="h-6 w-20 mt-1" />
            ) : (
              <p className="text-lg font-medium">
                {volume24h !== null ? `${volume24h.toFixed(2)} PXB` : 'N/A'}
              </p>
            )}
          </div>
        </div>
        
        <div className="h-[300px] w-full">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Skeleton className="h-[250px] w-full" />
            </div>
          ) : filteredChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                <XAxis 
                  dataKey="time" 
                  stroke="#a0aec0" 
                  tick={{ fill: '#a0aec0' }} 
                />
                <YAxis 
                  stroke="#a0aec0" 
                  tick={{ fill: '#a0aec0' }} 
                  domain={['auto', 'auto']}
                  tickFormatter={(value) => `${Number(value).toFixed(8)}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine 
                  y={currentPrice || 0} 
                  stroke="#4c1d95" 
                  strokeDasharray="3 3" 
                  label={{ 
                    value: "Current", 
                    position: "insideBottomRight",
                    fill: "#a855f7",
                    fontSize: 12
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  dot={false} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-400">No price data available</p>
            </div>
          )}
        </div>
        
        {lastUpdated && (
          <div className="text-xs text-gray-500 mt-2 text-right">
            Last updated: {formatDistanceToNow(lastUpdated, { addSuffix: true })}
          </div>
        )}
      </div>
    </Card>
  );
};

export default TokenTradingChart;
