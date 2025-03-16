
import React, { useEffect, useState } from 'react';
import PriceChart from '@/components/PriceChart';
import { subscribeToPrice } from '@/services/dexScreenerService';

interface TokenPriceChartProps {
  tokenId: string;
}

const TokenPriceChart: React.FC<TokenPriceChartProps> = ({ tokenId }) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!tokenId) return;
    
    setIsLoading(true);
    
    // Generate some sample data for now
    // In a real implementation, you would fetch historical price data
    const generateSampleData = () => {
      const data = [];
      let price = 1.0 + Math.random() * 0.5;
      
      for (let i = -30; i <= 0; i++) {
        // Create some random movement
        price = price + (Math.random() - 0.5) * 0.2;
        // Make sure price doesn't go below 0.1
        price = Math.max(0.1, price);
        
        const date = new Date();
        date.setMinutes(date.getMinutes() + i * 30);
        
        data.push({
          time: date.toISOString(),
          price,
        });
      }
      
      return data;
    };
    
    // Simulate loading delay
    const timeoutId = setTimeout(() => {
      setChartData(generateSampleData());
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [tokenId]);

  return <PriceChart data={chartData} isLoading={isLoading} />;
};

export default TokenPriceChart;
