
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTrendingTokensFromApify } from '@/services/apifyService';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';

const TrendingTokens = () => {
  const { data: tokens, isLoading, error } = useQuery({
    queryKey: ['trendingTokens'],
    queryFn: fetchTrendingTokensFromApify,
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="w-full">
            <CardContent className="p-4">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return <div>Error loading trending tokens</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tokens?.map((token) => (
        <Card key={token.address} className="w-full hover:bg-gray-100/5 transition-colors">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{token.name}</h3>
                <p className="text-sm text-gray-400">{token.symbol}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">${token.priceUsd.toFixed(6)}</p>
                <p className={`text-sm flex items-center ${
                  token.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {token.priceChange24h >= 0 ? (
                    <ArrowUpIcon className="w-4 h-4 mr-1" />
                  ) : (
                    <ArrowDownIcon className="w-4 h-4 mr-1" />
                  )}
                  {Math.abs(token.priceChange24h).toFixed(2)}%
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-400">Volume 24h</p>
                <p className="font-medium">${token.volume24h.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-400">Market Cap</p>
                <p className="font-medium">${token.marketCap.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TrendingTokens;
