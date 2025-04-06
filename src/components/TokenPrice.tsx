
import React, { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TokenPriceProps {
  tokenId: string;
}

const TokenPrice: React.FC<TokenPriceProps> = ({ tokenId }) => {
  const [price, setPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('tokens')
          .select('current_market_cap, last_trade_price, total_supply')
          .eq('token_mint', tokenId)
          .single();

        if (error) {
          console.error('Error fetching token price:', error);
          return;
        }

        if (data) {
          setPrice(data.last_trade_price || data.current_market_cap / data.total_supply);
          // Simulate price change percentage for demo
          setPriceChange(Math.random() * 20 - 10); // Random between -10% and +10%
        }
      } catch (error) {
        console.error('Error in fetchPrice:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [tokenId]);

  if (isLoading) {
    return (
      <div className="h-8 animate-pulse bg-dream-foreground/10 rounded"></div>
    );
  }

  const isPricePositive = priceChange >= 0;

  return (
    <div className="flex flex-col">
      <div className="text-2xl font-bold">
        ${price ? price.toFixed(6) : '0.00'}
      </div>
      <div className={`flex items-center ${isPricePositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPricePositive ? (
          <ArrowUp className="w-4 h-4 mr-1" />
        ) : (
          <ArrowDown className="w-4 h-4 mr-1" />
        )}
        {Math.abs(priceChange).toFixed(2)}%
      </div>
    </div>
  );
};

export default TokenPrice;
