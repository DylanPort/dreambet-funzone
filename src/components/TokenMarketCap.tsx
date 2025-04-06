
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TokenMarketCapProps {
  tokenId: string;
}

const TokenMarketCap: React.FC<TokenMarketCapProps> = ({ tokenId }) => {
  const [marketCap, setMarketCap] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMarketCap = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('tokens')
          .select('current_market_cap')
          .eq('token_mint', tokenId)
          .single();

        if (error) {
          console.error('Error fetching market cap:', error);
          return;
        }

        if (data) {
          setMarketCap(data.current_market_cap);
        }
      } catch (error) {
        console.error('Error in fetchMarketCap:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarketCap();
    const interval = setInterval(fetchMarketCap, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [tokenId]);

  const formatMarketCap = (value: number | null) => {
    if (value === null) return 'N/A';
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(2)}B`;
    }
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div>
        <span className="text-sm text-dream-foreground/70">Market Cap</span>
        <div className="h-6 w-24 animate-pulse bg-dream-foreground/10 rounded mt-1"></div>
      </div>
    );
  }

  return (
    <div>
      <span className="text-sm text-dream-foreground/70">Market Cap</span>
      <div className="font-medium mt-1">{formatMarketCap(marketCap)}</div>
    </div>
  );
};

export default TokenMarketCap;
