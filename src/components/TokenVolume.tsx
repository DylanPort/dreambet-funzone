
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TokenVolumeProps {
  tokenId: string;
}

const TokenVolume: React.FC<TokenVolumeProps> = ({ tokenId }) => {
  const [volume, setVolume] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVolume = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('tokens')
          .select('volume_24h')
          .eq('token_mint', tokenId)
          .single();

        if (error) {
          console.error('Error fetching volume:', error);
          return;
        }

        if (data) {
          setVolume(data.volume_24h);
        }
      } catch (error) {
        console.error('Error in fetchVolume:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVolume();
    const interval = setInterval(fetchVolume, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [tokenId]);

  const formatVolume = (value: number | null) => {
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
        <span className="text-sm text-dream-foreground/70">24h Volume</span>
        <div className="h-6 w-24 animate-pulse bg-dream-foreground/10 rounded mt-1"></div>
      </div>
    );
  }

  return (
    <div>
      <span className="text-sm text-dream-foreground/70">24h Volume</span>
      <div className="font-medium mt-1">{formatVolume(volume)}</div>
    </div>
  );
};

export default TokenVolume;
