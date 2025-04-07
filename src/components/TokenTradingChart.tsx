
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { subscribeToGMGNTokenData } from '@/services/gmgnService';
import { formatNumber } from '@/utils/betUtils';

interface TokenTradingChartProps {
  tokenId: string;
  onMetricsUpdate?: (metrics: any) => void;
}

const TokenTradingChart: React.FC<TokenTradingChartProps> = ({ 
  tokenId,
  onMetricsUpdate
}) => {
  const [timeframe, setTimeframe] = useState<'24h'|'7d'|'30d'>('24h');
  const [chartData, setChartData] = useState<any[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Generate some fake chart data for now since we don't have real historical data
  useEffect(() => {
    if (!tokenId) return;
    
    setIsLoading(true);
    
    // This is placeholder data - in a real app, you would fetch historical data
    const generateChartData = (currentPrice: number) => {
      if (!currentPrice) return [];
      
      const now = new Date();
      const data: any[] = [];
      
      let points = 0;
      let timeIncrement = 0;
      
      switch(timeframe) {
        case '24h':
          points = 24;
          timeIncrement = 60 * 60 * 1000; // 1 hour
          break;
        case '7d':
          points = 7;
          timeIncrement = 24 * 60 * 60 * 1000; // 1 day
          break;
        case '30d':
          points = 30;
          timeIncrement = 24 * 60 * 60 * 1000; // 1 day
          break;
        default:
          points = 24;
          timeIncrement = 60 * 60 * 1000; // 1 hour
      }
      
      const volatility = 0.05; // 5% volatility
      let price = currentPrice * 0.95; // Start slightly below current price
      
      for (let i = points; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - (i * timeIncrement));
        const change = (Math.random() - 0.5) * volatility;
        price = price * (1 + change);
        
        data.push({
          timestamp,
          price,
          formattedTime: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
      
      return data;
    };
    
    // Subscribe to GMGN real-time data
    const unsubscribe = subscribeToGMGNTokenData(tokenId, (data) => {
      setCurrentMetrics(data);
      
      // Pass metrics up to parent component if callback is provided
      if (onMetricsUpdate) {
        onMetricsUpdate(data);
      }
      
      // Generate chart data based on current price
      if (data.price) {
        setChartData(generateChartData(data.price));
      }
      
      setIsLoading(false);
    });
    
    return () => {
      unsubscribe();
    };
  }, [tokenId, timeframe, onMetricsUpdate]);
  
  const formatXAxis = (timestamp: Date) => {
    if (!timestamp) return '';
    
    switch(timeframe) {
      case '24h':
        return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case '7d':
      case '30d':
        return timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' });
      default:
        return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };
  
  const getChartColor = () => {
    if (!chartData || chartData.length < 2) return '#22c55e';
    
    const firstPrice = chartData[0]?.price;
    const lastPrice = chartData[chartData.length - 1]?.price;
    
    return firstPrice <= lastPrice ? '#22c55e' : '#ef4444';
  };

  return (
    <Card className="bg-black/20 backdrop-blur-md border-gray-800">
      <CardContent className="pt-6">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Price Chart</h2>
          <div className="flex gap-2">
            <Button 
              variant={timeframe === '24h' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setTimeframe('24h')}
            >
              24H
            </Button>
            <Button 
              variant={timeframe === '7d' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setTimeframe('7d')}
            >
              7D
            </Button>
            <Button 
              variant={timeframe === '30d' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setTimeframe('30d')}
            >
              30D
            </Button>
          </div>
        </div>
        
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatXAxis}
                  stroke="#666"
                />
                <YAxis 
                  domain={['auto', 'auto']}
                  tickFormatter={(value) => formatNumber(value)}
                  stroke="#666"
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-gray-800 border border-gray-700 p-2 rounded shadow text-white">
                          <p className="font-medium">
                            {formatXAxis(payload[0].payload.timestamp)}
                          </p>
                          <p className="text-sm">
                            Price: {formatNumber(payload[0].value)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke={getChartColor()} 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {currentMetrics && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/50 p-3 rounded">
              <div className="text-sm text-gray-400">Current Price</div>
              <div className="font-medium">{formatNumber(currentMetrics.price || 0)}</div>
            </div>
            <div className="bg-gray-800/50 p-3 rounded">
              <div className="text-sm text-gray-400">Market Cap</div>
              <div className="font-medium">{formatNumber(currentMetrics.marketCap || 0)}</div>
            </div>
            <div className="bg-gray-800/50 p-3 rounded">
              <div className="text-sm text-gray-400">24h Volume</div>
              <div className="font-medium">{formatNumber(currentMetrics.volume24h || 0)}</div>
            </div>
            <div className="bg-gray-800/50 p-3 rounded">
              <div className="text-sm text-gray-400">24h Change</div>
              <div className={`font-medium ${(currentMetrics.change24h || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {(currentMetrics.change24h || 0) >= 0 ? '+' : ''}{formatNumber((currentMetrics.change24h || 0) * 100, 2)}%
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TokenTradingChart;
