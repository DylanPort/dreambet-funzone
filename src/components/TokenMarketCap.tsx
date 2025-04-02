
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { fetchTokenMetrics } from '@/services/tokenDataCache';

interface TokenMarketCapProps {
  tokenMint?: string;
}

const TokenMarketCap: React.FC<TokenMarketCapProps> = ({ tokenMint }) => {
  const [marketCap, setMarketCap] = useState<number | null>(null);
  const [previousMarketCap, setPreviousMarketCap] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!tokenMint) return;
      
      setIsLoading(true);
      try {
        const tokenData = await fetchTokenMetrics(tokenMint);
        if (tokenData && tokenData.marketCap !== null) {
          setPreviousMarketCap(marketCap);
          setMarketCap(tokenData.marketCap);
        }
      } catch (error) {
        console.error('Error fetching market cap:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
    // Poll for updates
    const intervalId = setInterval(fetchData, 30000);
    return () => clearInterval(intervalId);
  }, [tokenMint]);

  const formatMarketCap = (value: number | null) => {
    if (value === null) return 'N/A';
    
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(2)}B`;
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    } else {
      return `$${value.toFixed(2)}`;
    }
  };

  const isIncreasing = marketCap !== null && 
                      previousMarketCap !== null && 
                      marketCap > previousMarketCap;

  if (isLoading && marketCap === null) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="w-8 h-8 border-4 border-dream-accent1 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-40 flex flex-col justify-center">
      <div className="text-center">
        <div className="text-dream-foreground/70 text-sm mb-1">Market Cap</div>
        <motion.div 
          className="flex justify-center items-center gap-2"
          initial={{ scale: 0.95, opacity: 0.8 }}
          animate={{ 
            scale: isIncreasing ? [1, 1.05, 1] : 1,
            opacity: 1
          }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-3xl font-bold">
            {formatMarketCap(marketCap)}
          </span>
          {isIncreasing !== undefined && (
            <span className={isIncreasing ? "text-green-500" : "text-red-500"}>
              {isIncreasing ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            </span>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default TokenMarketCap;
