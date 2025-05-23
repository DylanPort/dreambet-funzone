
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search, Clock, TrendingUp, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchTopSearchedTokens, fetchRecentlySearchedTokens, SearchedToken } from '@/services/supabaseService';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { fetchTokenImage } from '@/services/moralisService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ExtendedSearchedToken extends SearchedToken {
  imageUrl?: string | null;
  imageLoading?: boolean;
}

const SearchedTokensReel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('top');
  const [topTokens, setTopTokens] = useState<ExtendedSearchedToken[]>([]);
  const [recentTokens, setRecentTokens] = useState<ExtendedSearchedToken[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'top') {
          const data = await fetchTopSearchedTokens(10);
          // Mark all tokens as having images loading initially
          const processedData = data.map(token => ({ 
            ...token, 
            imageLoading: true 
          }));
          setTopTokens(processedData);
          
          // Fetch images for each token
          processedData.forEach(async (token, index) => {
            try {
              const imageUrl = await fetchTokenImage(token.token_mint, token.token_symbol);
              setTopTokens(current => {
                const updated = [...current];
                updated[index] = {
                  ...updated[index],
                  imageUrl,
                  imageLoading: false
                };
                return updated;
              });
            } catch (err) {
              console.error(`Error fetching image for ${token.token_mint}:`, err);
              setTopTokens(current => {
                const updated = [...current];
                updated[index] = {
                  ...updated[index],
                  imageLoading: false
                };
                return updated;
              });
            }
          });
        } else {
          const data = await fetchRecentlySearchedTokens(10);
          // Mark all tokens as having images loading initially
          const processedData = data.map(token => ({ 
            ...token, 
            imageLoading: true 
          }));
          setRecentTokens(processedData);
          
          // Fetch images for each token
          processedData.forEach(async (token, index) => {
            try {
              const imageUrl = await fetchTokenImage(token.token_mint, token.token_symbol);
              setRecentTokens(current => {
                const updated = [...current];
                updated[index] = {
                  ...updated[index],
                  imageUrl,
                  imageLoading: false
                };
                return updated;
              });
            } catch (err) {
              console.error(`Error fetching image for ${token.token_mint}:`, err);
              setRecentTokens(current => {
                const updated = [...current];
                updated[index] = {
                  ...updated[index],
                  imageLoading: false
                };
                return updated;
              });
            }
          });
        }
      } catch (error) {
        console.error(`Error loading ${activeTab} tokens:`, error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [activeTab]);
  
  const scrollContainer = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const container = containerRef.current;
      const scrollAmount = direction === 'left' ? -300 : 300;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };
  
  // Generate a color based on token symbol for fallback background
  const generateColorFromSymbol = (symbol: string) => {
    const colors = [
      'from-pink-500 to-purple-500',
      'from-blue-500 to-cyan-500',
      'from-green-500 to-emerald-500',
      'from-yellow-500 to-orange-500',
      'from-red-500 to-pink-500',
      'from-indigo-500 to-blue-500',
    ];
    
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
      hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };
  
  const renderTokenAvatar = (token: ExtendedSearchedToken) => {
    const colorGradient = generateColorFromSymbol(token.token_symbol || '?');
    
    if (token.imageLoading) {
      return <Skeleton className="w-8 h-8 rounded-full" />;
    }
    
    if (token.imageUrl) {
      return (
        <Avatar className="w-8 h-8 border border-white/10">
          <AvatarImage src={token.imageUrl} alt={token.token_symbol} />
          <AvatarFallback className={`bg-gradient-to-br ${colorGradient}`}>
            {token.token_symbol ? token.token_symbol.charAt(0).toUpperCase() : '?'}
          </AvatarFallback>
        </Avatar>
      );
    }
    
    return (
      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${colorGradient} flex items-center justify-center text-white`}>
        {token.token_symbol ? token.token_symbol.charAt(0).toUpperCase() : '?'}
      </div>
    );
  };
  
  const renderTokenCard = (token: ExtendedSearchedToken) => (
    <Link 
      to={`/token/${token.token_mint}`} 
      key={token.id} 
      className="flex-shrink-0 w-[250px] mr-4 glass-panel border border-white/10 p-4 overflow-hidden rounded-xl transition-all duration-300 hover:border-white/20 hover:shadow-glow"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {renderTokenAvatar(token)}
          <div className="overflow-hidden">
            <h3 className="font-semibold truncate max-w-[150px]">{token.token_name}</h3>
            <p className="text-dream-foreground/60 text-xs">{token.token_symbol}</p>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
          {activeTab === 'top' ? (
            <div className="bg-green-500/20 px-2 py-1 rounded text-xs text-green-400 flex items-center">
              <Search className="w-3 h-3 mr-1" /> {token.search_count}
            </div>
          ) : (
            <div className="text-xs text-dream-foreground/60">
              {new Date(token.last_searched_at).toLocaleDateString()}
            </div>
          )}
          <a 
            href={`https://solscan.io/token/${token.token_mint}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-green-400/80 hover:text-green-400 text-xs mt-1 inline-flex items-center" 
            onClick={(e) => e.stopPropagation()}
          >
            SolScan <ExternalLink className="w-3 h-3 ml-1" />
          </a>
        </div>
      </div>
      
      <div className="text-xs text-dream-foreground/60 mt-2 truncate">
        {token.token_mint}
      </div>
    </Link>
  );
  
  const renderSkeletons = () => (
    Array(5).fill(0).map((_, i) => (
      <div key={i} className="flex-shrink-0 w-[250px] mr-4 glass-panel border border-white/10 p-4 overflow-hidden rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div>
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-6 w-10" />
        </div>
        <Skeleton className="h-3 w-full mt-2" />
      </div>
    ))
  );
  
  return (
    <div className="mb-8 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-r from-dream-accent1/5 via-transparent to-dream-accent3/5 blur-xl"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-display font-bold">Searched Tokens</h2>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="grid w-[240px] grid-cols-2 bg-dream-background/30 border border-white/10">
              <TabsTrigger value="top" className="flex items-center gap-1 data-[state=active]:bg-green-500/20">
                <TrendingUp className="w-4 h-4" />
                <span>Top Searched</span>
              </TabsTrigger>
              <TabsTrigger value="recent" className="flex items-center gap-1 data-[state=active]:bg-green-500/20">
                <Clock className="w-4 h-4" />
                <span>Recent</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="relative">
          {!isMobile && (
            <>
              <button 
                onClick={() => scrollContainer('left')}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-dream-background/80 border border-white/10 rounded-full p-1 hover:bg-dream-background/90 backdrop-blur-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => scrollContainer('right')}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-dream-background/80 border border-white/10 rounded-full p-1 hover:bg-dream-background/90 backdrop-blur-sm"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
          
          <Tabs value={activeTab} className="w-full">
            <TabsContent value="top" className="m-0">
              <div 
                ref={containerRef}
                className="flex overflow-x-auto scrollbar-hide pb-4 pt-2 -mx-2 px-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {loading ? renderSkeletons() : (
                  topTokens.length > 0 ? 
                    topTokens.map(renderTokenCard) : 
                    <div className="flex-1 glass-panel p-4 text-center opacity-70">
                      No searched tokens found. Try searching for a token!
                    </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="recent" className="m-0">
              <div 
                ref={containerRef}
                className="flex overflow-x-auto scrollbar-hide pb-4 pt-2 -mx-2 px-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {loading ? renderSkeletons() : (
                  recentTokens.length > 0 ? 
                    recentTokens.map(renderTokenCard) : 
                    <div className="flex-1 glass-panel p-4 text-center opacity-70">
                      No recent searches found. Try searching for a token!
                    </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default SearchedTokensReel;
