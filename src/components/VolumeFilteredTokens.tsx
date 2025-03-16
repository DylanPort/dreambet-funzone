
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TokenCard from './TokenCard';
import { useQuery } from '@tanstack/react-query';
import { fetchTopTokensByVolume, TokenVolumeData } from '@/services/tokenVolumeService';
import { RefreshCw } from 'lucide-react';

interface VolumeFilteredTokensProps {
  limit?: number;
}

const VolumeFilteredTokens: React.FC<VolumeFilteredTokensProps> = ({ limit = 12 }) => {
  const [selectedTab, setSelectedTab] = useState('1h');
  const [visibleTokens, setVisibleTokens] = useState<TokenVolumeData[]>([]);
  
  const { data: tokensData, isLoading, isError, refetch } = useQuery({
    queryKey: ['topTokensByVolume', selectedTab],
    queryFn: () => fetchTopTokensByVolume(selectedTab, limit * 2),
    staleTime: 60000, // 1 minute
  });
  
  useEffect(() => {
    if (tokensData) {
      // Only show the limit number of tokens
      setVisibleTokens(tokensData.slice(0, limit));
    }
  }, [tokensData, limit]);
  
  const handleTabChange = (value: string) => {
    setSelectedTab(value);
  };
  
  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(2)}M`;
    }
    if (volume >= 1000) {
      return `$${(volume / 1000).toFixed(2)}K`;
    }
    return `$${volume.toFixed(2)}`;
  };
  
  const handleRefresh = () => {
    refetch();
  };
  
  const timeframes = [
    { value: '1h', label: '1H' },
    { value: '6h', label: '6H' },
    { value: '24h', label: '24H' },
    { value: '7d', label: '7D' },
  ];
  
  return (
    <Card className="backdrop-blur-sm bg-black/30 border-white/10">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-display font-bold">Top Tokens by Volume</h2>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              className="h-8 px-2 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Tabs defaultValue="1h" value={selectedTab} onValueChange={handleTabChange} className="w-auto">
              <TabsList className="h-8 bg-black/20">
                {timeframes.map(timeframe => (
                  <TabsTrigger 
                    key={timeframe.value} 
                    value={timeframe.value}
                    className="text-xs px-3 py-1 data-[state=active]:bg-primary/20"
                  >
                    {timeframe.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        {isLoading && (
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-t-transparent border-primary rounded-full"></div>
          </div>
        )}
        
        {isError && (
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-500 mb-2">Failed to load tokens</p>
              <Button variant="outline" size="sm" onClick={handleRefresh}>Try Again</Button>
            </div>
          </div>
        )}
        
        {!isLoading && !isError && visibleTokens.length === 0 && (
          <div className="min-h-[400px] flex items-center justify-center">
            <p className="text-gray-400">No tokens found for this timeframe</p>
          </div>
        )}
        
        {!isLoading && !isError && visibleTokens.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleTokens.map((token, index) => (
              <TokenCard
                key={token.token_mint || `token-${index}`}
                id={token.token_mint || `token-${index}`}
                name={token.name || `Token ${index + 1}`}
                symbol={token.symbol || `T${index + 1}`}
                price={token.price || 0}
                priceChange={token.price_change_percentage || 0}
                volume={token.volume || 0}
                volumeChange={token.volume_change_percentage || 0}
                marketCap={token.market_cap || 0}
                liquidity={token.liquidity || 0}
                imageUrl={token.image_url || ''}
                rank={index + 1}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VolumeFilteredTokens;
