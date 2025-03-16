import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { ArrowLeft, ExternalLink, RefreshCw, Clock, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { fetchTokenById } from '@/services/supabaseService';
import { fetchDexScreenerData } from '@/services/dexScreenerService';
import { fetchBetsByToken } from '@/api/mockData';
import TokenPriceChart from '@/components/TokenPriceChart';
import TokenMarketCap from '@/components/TokenMarketCap';
import CreateBetForm from '@/components/CreateBetForm';
import BetsList from '@/components/BetsList';
import TokenTrades from '@/components/TokenTrades';
import TokenHolders from '@/components/TokenHolders';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import YourLatestBet from '@/components/YourLatestBet';

const TokenDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [tokenData, setTokenData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bets, setBets] = useState<any[]>([]);
  const [isLoadingBets, setIsLoadingBets] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { connected } = useWallet();

  const fetchTokenData = useCallback(async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      // Try to get token from Supabase first
      const supabaseToken = await fetchTokenById(id);
      
      // Then get real-time data from DexScreener
      const dexScreenerData = await fetchDexScreenerData(id);
      
      if (!dexScreenerData && !supabaseToken) {
        toast.error('Token data not found');
        setIsLoading(false);
        return;
      }
      
      // Combine data, preferring DexScreener for real-time metrics
      const combinedData = {
        id: id,
        name: dexScreenerData?.name || supabaseToken?.token_name || 'Unknown Token',
        symbol: dexScreenerData?.symbol || supabaseToken?.token_symbol || 'UNKNOWN',
        price: dexScreenerData?.price || 0,
        priceChange: dexScreenerData?.priceChange || 0,
        volume24h: dexScreenerData?.volume || 0,
        liquidity: dexScreenerData?.liquidity || 0,
        marketCap: dexScreenerData?.marketCap || supabaseToken?.current_market_cap || 0,
        pairAddress: dexScreenerData?.pairAddress || id,
        lastUpdated: dexScreenerData?.lastUpdated || supabaseToken?.last_updated_time || new Date().toISOString(),
        fdv: dexScreenerData?.fdv || 0,
        createdAt: supabaseToken?.created_at || null,
      };
      
      setTokenData(combinedData);
    } catch (error) {
      console.error('Error fetching token data:', error);
      toast.error('Failed to load token data');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const fetchBets = useCallback(async () => {
    if (!id) return;
    
    setIsLoadingBets(true);
    try {
      const tokenBets = await fetchBetsByToken(id);
      setBets(tokenBets);
    } catch (error) {
      console.error('Error fetching bets:', error);
    } finally {
      setIsLoadingBets(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTokenData();
    fetchBets();
  }, [fetchTokenData, fetchBets]);

  const refreshData = () => {
    toast.loading('Refreshing token data...');
    Promise.all([fetchTokenData(), fetchBets()])
      .then(() => toast.success('Data refreshed successfully'))
      .catch(() => toast.error('Failed to refresh data'));
  };

  const refreshBets = () => {
    fetchBets();
  };

  if (isLoading) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="mb-6">
          <Link to="/betting" className="flex items-center text-dream-foreground/60 hover:text-dream-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tokens
          </Link>
        </div>
        
        <div className="mb-6">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-6 w-1/4 mt-2" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Skeleton className="h-[300px] w-full rounded-md" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-[150px] w-full rounded-md" />
            <Skeleton className="h-[300px] w-full rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  if (!tokenData) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="mb-6">
          <Link to="/betting" className="flex items-center text-dream-foreground/60 hover:text-dream-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tokens
          </Link>
        </div>
        
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Token Not Found</h1>
          <p className="text-dream-foreground/60 mb-6">The token you're looking for doesn't exist or couldn't be loaded.</p>
          <Button asChild>
            <Link to="/betting">Browse Available Tokens</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-6">
        <Link to="/betting" className="flex items-center text-dream-foreground/60 hover:text-dream-foreground transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tokens
        </Link>
      </div>
      
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 flex items-center justify-center">
              <img 
                src="/lovable-uploads/74707f80-3a88-4b9c-82d2-5a590a3a32df.png" 
                alt={tokenData.name} 
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-3xl font-display font-bold">{tokenData.name}</h1>
            <div className="flex items-center gap-1 h-6 px-2 rounded-md bg-dream-background/40 text-xs text-dream-foreground/60">
              <Flame className="w-3 h-3" />
              <span>{tokenData.symbol}</span>
            </div>
            <a 
              href={`https://dexscreener.com/solana/${tokenData.pairAddress || id}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-dream-foreground/40 hover:text-dream-foreground/60 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${tokenData.priceChange >= 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className={`${tokenData.priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {tokenData.priceChange >= 0 ? '+' : ''}{tokenData.priceChange?.toFixed(2)}%
              </span>
            </div>
            <div className="text-dream-foreground/60 text-sm flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1" />
              Updated {formatDistanceToNow(new Date(tokenData.lastUpdated), { addSuffix: true })}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshData}
              className="flex items-center gap-1 text-xs"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </Button>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold">${tokenData.price?.toFixed(6)}</div>
          <div className="text-dream-foreground/60 text-sm">Current Price</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Tabs defaultValue="price" className="glass-panel">
            <TabsList className="p-1 mb-4">
              <TabsTrigger value="price">Price Chart</TabsTrigger>
              <TabsTrigger value="trades">Recent Trades</TabsTrigger>
              <TabsTrigger value="holders">Top Holders</TabsTrigger>
            </TabsList>
            <TabsContent value="price" className="p-4">
              <TokenPriceChart tokenId={id || ''} />
            </TabsContent>
            <TabsContent value="trades" className="p-4">
              <TokenTrades tokenId={id || ''} />
            </TabsContent>
            <TabsContent value="holders" className="p-4">
              <TokenHolders tokenId={id || ''} />
            </TabsContent>
          </Tabs>
          
          <div className="mt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="bets">Open Bets</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="glass-panel p-6">
                  <h2 className="text-xl font-display font-semibold mb-4">Token Overview</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-dream-foreground/60 mb-1">Market Cap</div>
                      <div className="text-lg font-medium">${tokenData.marketCap?.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-dream-foreground/60 mb-1">Fully Diluted Valuation</div>
                      <div className="text-lg font-medium">${tokenData.fdv?.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-dream-foreground/60 mb-1">24h Volume</div>
                      <div className="text-lg font-medium">${tokenData.volume24h?.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-dream-foreground/60 mb-1">Liquidity</div>
                      <div className="text-lg font-medium">${tokenData.liquidity?.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
                
                <div className="glass-panel p-6">
                  <h2 className="text-xl font-display font-semibold mb-4">About {tokenData.name}</h2>
                  <p className="text-dream-foreground/80">
                    {tokenData.name} ({tokenData.symbol}) is a token on the Solana blockchain.
                    {tokenData.createdAt && (
                      <span> It was created {formatDistanceToNow(new Date(tokenData.createdAt), { addSuffix: true })}.</span>
                    )}
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="bets">
                <div className="glass-panel p-6">
                  <h2 className="text-xl font-display font-semibold mb-4">Open Bets for {tokenData.symbol}</h2>
                  <BetsList 
                    bets={bets} 
                    isLoading={isLoadingBets} 
                    onRefresh={refreshBets} 
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        <div className="flex-1 space-y-6">
          <TokenMarketCap tokenData={tokenData} />
          
          {/* Add the YourLatestBet component if user is connected */}
          {connected && (
            <YourLatestBet tokenId={tokenData.id} tokenSymbol={tokenData.symbol} />
          )}
          
          {/* Continue with the rest of the components */}
          <CreateBetForm
            tokenId={tokenData.id}
            tokenName={tokenData.name}
            tokenSymbol={tokenData.symbol}
            onBetCreated={refreshBets}
            token={tokenData}
          />
          
          <div className="glass-panel p-6">
            <h2 className="text-xl font-display font-semibold mb-4">Token Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-dream-foreground/60">Token Address</span>
                <a 
                  href={`https://solscan.io/token/${id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center hover:text-dream-accent2 transition-colors"
                >
                  <span className="truncate max-w-[150px]">{id?.substring(0, 8)}...{id?.substring(id.length - 8)}</span>
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-dream-foreground/60">Pair Address</span>
                <a 
                  href={`https://solscan.io/account/${tokenData.pairAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center hover:text-dream-accent2 transition-colors"
                >
                  <span className="truncate max-w-[150px]">{tokenData.pairAddress?.substring(0, 8)}...{tokenData.pairAddress?.substring(tokenData.pairAddress.length - 8)}</span>
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-dream-foreground/60">DexScreener</span>
                <a 
                  href={`https://dexscreener.com/solana/${tokenData.pairAddress || id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center hover:text-dream-accent2 transition-colors"
                >
                  <span>View</span>
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenDetail;
