
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchDexScreenerData } from '@/services/dexScreenerService';
import { usePumpPortal } from '@/hooks/usePumpPortal';
import { Skeleton } from '@/components/ui/skeleton';

interface PriceChartProps {
  tokenMint?: string;
}

const PriceChart: React.FC<PriceChartProps> = ({ tokenMint }) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { subscribeToToken, tokenMetrics } = usePumpPortal(tokenMint);

  useEffect(() => {
    if (tokenMint) {
      subscribeToToken(tokenMint);
      fetchPriceData();
    }
  }, [tokenMint]);

  const fetchPriceData = async () => {
    if (!tokenMint) return;
    
    try {
      setLoading(true);
      
      // Get data from DexScreener
      const dexData = await fetchDexScreenerData(tokenMint);
      
      if (dexData) {
        // Generate some sample chart data based on current price
        // In a real app, you would use historical price data
        const currentPrice = dexData.priceUsd || 0.0001;
        const basePrice = currentPrice * 0.8;
        
        // Generate last 24 hours of simulated data
        const data = Array.from({ length: 24 }, (_, i) => {
          const hourAgo = new Date();
          hourAgo.setHours(hourAgo.getHours() - (23 - i));
          
          // Create some price variation for visualization
          const randomFactor = 0.9 + (Math.random() * 0.2);
          const priceAtHour = basePrice * randomFactor * (1 + (i / 24));
          
          return {
            time: hourAgo.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            price: priceAtHour,
          };
        });
        
        setChartData(data);
      } else {
        // If no real data, create dummy data
        const dummyData = Array.from({ length: 24 }, (_, i) => {
          const hourAgo = new Date();
          hourAgo.setHours(hourAgo.getHours() - (23 - i));
          return {
            time: hourAgo.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            price: 0.0001 * (1 + (i / 100)),
          };
        });
        
        setChartData(dummyData);
      }
    } catch (error) {
      console.error('Error fetching price data:', error);
      setError('Failed to load price chart data');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    if (price < 0.001) return price.toExponential(2);
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    return price.toFixed(2);
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Skeleton className="w-full h-48" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-dream-foreground/50">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="h-64">
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="time" 
              stroke="rgba(255,255,255,0.5)"
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.5)"
              fontSize={12}
              tickFormatter={formatPrice}
              tickLine={false}
              width={60}
            />
            <Tooltip 
              formatter={(value: number) => [`$${formatPrice(value)}`, 'Price']}
              contentStyle={{ 
                background: 'rgba(0,0,0,0.8)', 
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '4px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#8884d8" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-64 flex items-center justify-center">
          <div className="text-dream-foreground/50">
            Price chart data for {tokenMint || 'token'} will appear here
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceChart;
