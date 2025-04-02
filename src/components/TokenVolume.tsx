import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchTokenMetrics } from '@/services/tokenDataCache';
import { BarChart, Activity } from 'lucide-react';

interface TokenVolumeProps {
  tokenMint?: string;
}

const TokenVolume: React.FC<TokenVolumeProps> = ({ tokenMint }) => {
  const [volume, setVolume] = useState<number | null>(null);
  const [prevVolume, setPrevVolume] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!tokenMint) return;
      
      setIsLoading(true);
      try {
        const tokenData = await fetchTokenMetrics(tokenMint);
        if (tokenData && tokenData.volume24h !== null) {
          setPrevVolume(volume);
          setVolume(tokenData.volume24h);
        }
      } catch (error) {
        console.error('Error fetching volume data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
    // Poll for updates
    const intervalId = setInterval(fetchData, 30000);
    return () => clearInterval(intervalId);
  }, [tokenMint]);

  const formatVolume = (value: number | null) => {
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

  const isIncreasing = volume !== null && 
                      prevVolume !== null && 
                      volume > prevVolume;

  if (isLoading && volume === null) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="w-8 h-8 border-4 border-dream-accent1 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-40 flex flex-col justify-center">
      <div className="text-center">
        <div className="text-dream-foreground/70 text-sm mb-1">24h Volume</div>
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
            {formatVolume(volume)}
          </span>
          <Activity size={20} className={isIncreasing ? "text-green-500" : "text-dream-foreground/70"} />
        </motion.div>
      </div>
    </div>
  );
};

export default TokenVolume;
