import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ArrowUpDown, Zap } from "lucide-react";
import FuturisticTokenDisplay from './FuturisticTokenDisplay';
import usePumpPortal from '@/hooks/usePumpPortal';
import { useToast } from '@/hooks/use-toast';

interface TokenVolumeData {
  token: {
    id: string;
    name: string;
    symbol: string;
    imageUrl?: string;
  };
  volume24h: number;
  currentPrice: number;
  percentChange24h?: number;
}

const VolumeFilteredTokens: React.FC = () => {
  const { recentTokens } = usePumpPortal();
  const [tokenVolumeData, setTokenVolumeData] = useState<TokenVolumeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'volume' | 'price' | 'change'>('volume');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const { toast } = useToast();
  
  // Fetch volume data for tokens
  useEffect(() => {
    const fetchVolumeData = async () => {
      if (!recentTokens.length) return;
      
      setIsLoading(true);
      
      try {
        // Simulate fetching volume data
        const volumeData: TokenVolumeData[] = recentTokens.map(token => {
          // Generate random volume between $1,000 and $1,000,000
          const volume = Math.random() * 999000 + 1000;
          // Generate random price between $0.0001 and $10
          const price = Math.random() * 9.9999 + 0.0001;
          // Generate random percent change between -50% and +100%
          const percentChange = Math.random() * 150 - 50;
          
          return {
            token: {
              id: token.token_mint,
              name: token.token_name,
              symbol: token.token_symbol || '',
              imageUrl: undefined // We don't have image URLs from the websocket
            },
            volume24h: volume,
            currentPrice: price,
            percentChange24h: percentChange
          };
        });
        
        setTokenVolumeData(volumeData);
      } catch (error) {
        console.error('Error fetching volume data:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch token volume data',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchVolumeData();
  }, [recentTokens]);
  
  // Filter and sort tokens
  const filteredTokensWithVolume = tokenVolumeData
    .filter(tv => 
      tv.token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tv.token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'volume') {
        return sortDirection === 'desc' ? b.volume24h - a.volume24h : a.volume24h - b.volume24h;
      } else if (sortBy === 'price') {
        return sortDirection === 'desc' ? b.currentPrice - a.currentPrice : a.currentPrice - b.currentPrice;
      } else {
        // Sort by change
        const changeA = a.percentChange24h || 0;
        const changeB = b.percentChange24h || 0;
        return sortDirection === 'desc' ? changeB - changeA : changeA - changeB;
      }
    });
  
  // Toggle sort direction
  const toggleSort = (newSortBy: 'volume' | 'price' | 'change') => {
    if (sortBy === newSortBy) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDirection('desc');
    }
  };
  
  return (
    <div className="w-full">
      <Tabs defaultValue="trending" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="gainers">Top Gainers</TabsTrigger>
          <TabsTrigger value="new">New Listings</TabsTrigger>
        </TabsList>
        
        <div className="flex mb-4 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tokens..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => toggleSort('volume')}>
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
        
        <TabsContent value="trending" className="mt-0">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dream-accent1"></div>
            </div>
          ) : filteredTokensWithVolume.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTokensWithVolume.map((tv, index) => (
                <FuturisticTokenDisplay 
                  key={tv.token?.id || `token-${index}`} 
                  tokens={[{ 
                    id: tv.token.id,
                    name: tv.token.name,
                    symbol: tv.token.symbol,
                    imageUrl: tv.token.imageUrl,
                    change24h: tv.percentChange24h || 0,
                    currentPrice: tv.currentPrice
                  }]} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No tokens found matching your search.
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="gainers" className="mt-0">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dream-accent1"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTokensWithVolume
                .filter(tv => (tv.percentChange24h || 0) > 0)
                .sort((a, b) => (b.percentChange24h || 0) - (a.percentChange24h || 0))
                .slice(0, 8)
                .map((tv, index) => (
                  <FuturisticTokenDisplay 
                    key={tv.token?.id || `token-${index}`} 
                    tokens={[{ 
                      id: tv.token.id,
                      name: tv.token.name,
                      symbol: tv.token.symbol,
                      imageUrl: tv.token.imageUrl,
                      change24h: tv.percentChange24h || 0,
                      currentPrice: tv.currentPrice
                    }]} 
                  />
                ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="new" className="mt-0">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dream-accent1"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTokensWithVolume
                .slice()
                .sort((a, b) => {
                  // Sort by newest first (assuming we'd have a timestamp)
                  // For now, just use the original order
                  return 0;
                })
                .slice(0, 8)
                .map((tv, index) => (
                  <FuturisticTokenDisplay 
                    key={tv.token?.id || `token-${index}`} 
                    tokens={[{ 
                      id: tv.token.id,
                      name: tv.token.name,
                      symbol: tv.token.symbol,
                      imageUrl: tv.token.imageUrl,
                      change24h: tv.percentChange24h || 0,
                      currentPrice: tv.currentPrice
                    }]} 
                  />
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VolumeFilteredTokens;
