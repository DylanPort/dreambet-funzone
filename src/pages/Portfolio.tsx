
import React, { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ArrowUp, ArrowDown, Plus, TrendingUp, Wallet, DollarSign, Clock } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import OrbitingParticles from '@/components/OrbitingParticles';
import PXBPointsBalance from '@/components/PXBPointsBalance';
import PXBStatsPanel from '@/components/PXBStatsPanel';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import html2canvas from 'html2canvas';
import { toast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchTokenImage } from '@/services/moralisService';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface TokenHolding {
  id: string;
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  quantity: number;
  averagePurchasePrice: number;
  currentValue: number;
  imageUrl?: string;
}

interface TradeHistory {
  id: string;
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  pxbAmount: number;
  timestamp: string;
  imageUrl?: string;
}

const Portfolio = () => {
  const { connected, publicKey } = useWallet();
  const { userProfile } = usePXBPoints();
  const [holdings, setHoldings] = useState<TokenHolding[]>([]);
  const [tradeHistory, setTradeHistory] = useState<TradeHistory[]>([]);
  const [loadingHoldings, setLoadingHoldings] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  // Calculate portfolio stats
  const totalPortfolioValue = holdings.reduce((sum, token) => sum + token.currentValue, 0);
  const totalInvested = holdings.reduce((sum, token) => sum + (token.quantity * token.averagePurchasePrice), 0);
  const totalProfit = totalPortfolioValue - totalInvested;
  const profitPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  useEffect(() => {
    if (!connected || !publicKey || !userProfile) return;
    
    // Fetch user's token holdings
    const fetchHoldings = async () => {
      setLoadingHoldings(true);
      try {
        const { data, error } = await supabase
          .from('token_portfolios')
          .select('*')
          .eq('userid', userProfile.id);
        
        if (error) {
          console.error('Error fetching token holdings:', error);
          return;
        }
        
        const formattedHoldings: TokenHolding[] = data.map(item => ({
          id: item.id,
          tokenId: item.tokenid,
          tokenName: item.tokenname,
          tokenSymbol: item.tokensymbol,
          quantity: item.quantity,
          averagePurchasePrice: item.averagepurchaseprice,
          currentValue: item.currentvalue
        }));
        
        // Fetch token images for all holdings
        const holdingsWithImages = await Promise.all(
          formattedHoldings.map(async (holding) => {
            try {
              const imageUrl = await fetchTokenImage(holding.tokenId, holding.tokenSymbol);
              return { ...holding, imageUrl };
            } catch (error) {
              return holding;
            }
          })
        );
        
        setHoldings(holdingsWithImages);
      } catch (error) {
        console.error('Error in fetchHoldings:', error);
      } finally {
        setLoadingHoldings(false);
      }
    };
    
    // Fetch user's trade history
    const fetchTradeHistory = async () => {
      setLoadingHistory(true);
      try {
        const { data, error } = await supabase
          .from('token_transactions')
          .select('*')
          .eq('userid', userProfile.id)
          .order('timestamp', { ascending: false });
        
        if (error) {
          console.error('Error fetching trade history:', error);
          return;
        }
        
        const formattedHistory: TradeHistory[] = data.map(item => ({
          id: item.id,
          tokenId: item.tokenid,
          tokenName: item.tokenname,
          tokenSymbol: item.tokensymbol,
          type: item.type,
          quantity: item.quantity,
          price: item.price,
          pxbAmount: item.pxbamount,
          timestamp: item.timestamp
        }));
        
        // Fetch token images for all trades
        const historyWithImages = await Promise.all(
          formattedHistory.map(async (trade) => {
            try {
              const imageUrl = await fetchTokenImage(trade.tokenId, trade.tokenSymbol);
              return { ...trade, imageUrl };
            } catch (error) {
              return trade;
            }
          })
        );
        
        setTradeHistory(historyWithImages);
      } catch (error) {
        console.error('Error in fetchTradeHistory:', error);
      } finally {
        setLoadingHistory(false);
      }
    };
    
    fetchHoldings();
    fetchTradeHistory();
    
    // Set up realtime subscriptions for portfolio and trade history
    const portfolioChannel = supabase
      .channel('portfolio-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'token_portfolios', filter: `userid=eq.${userProfile.id}` },
        () => fetchHoldings()
      )
      .subscribe();
      
    const tradeChannel = supabase
      .channel('trade-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'token_transactions', filter: `userid=eq.${userProfile.id}` },
        () => fetchTradeHistory()
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(portfolioChannel);
      supabase.removeChannel(tradeChannel);
    };
  }, [connected, publicKey, userProfile]);
  
  const takePortfolioScreenshot = async () => {
    const portfolioElement = document.getElementById('portfolio-summary');
    if (!portfolioElement) return;
    
    try {
      const canvas = await html2canvas(portfolioElement);
      const image = canvas.toDataURL('image/png');
      
      // Create link and trigger download
      const link = document.createElement('a');
      link.href = image;
      link.download = `pxb-portfolio-${new Date().getTime()}.png`;
      link.click();
      
      toast({
        title: "Portfolio Screenshot Saved",
        description: "Your portfolio snapshot has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error taking screenshot:', error);
      toast({
        title: "Screenshot Failed",
        description: "There was an error taking the screenshot. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  if (!connected) {
    return (
      <>
        <OrbitingParticles />
        <Navbar />
        <main className="pt-24 min-h-screen overflow-hidden px-4 pb-16">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-3xl font-display font-bold mb-6">Your Portfolio</h1>
            <div className="glass-panel p-8 max-w-md mx-auto">
              <Wallet className="w-12 h-12 text-dream-accent1 mx-auto mb-4" />
              <p className="text-dream-foreground/70 mb-4">Connect your wallet to view your portfolio</p>
              <Button asChild variant="default" className="bg-dream-accent1 hover:bg-dream-accent1/80">
                <Link to="/">Connect Wallet</Link>
              </Button>
            </div>
          </div>
        </main>
      </>
    );
  }
  
  return (
    <>
      <OrbitingParticles />
      <Navbar />
      <main className="pt-24 min-h-screen overflow-hidden px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between mb-6">
            <h1 className="text-3xl font-display font-bold">Your Portfolio</h1>
            <div className="flex gap-3 mt-3 md:mt-0">
              <Button onClick={takePortfolioScreenshot} variant="outline" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>Take Screenshot</span>
              </Button>
              <Button asChild className="bg-dream-accent1 hover:bg-dream-accent1/80">
                <Link to="/trading" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  <span>Trade Tokens</span>
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <div id="portfolio-summary" className="glass-panel p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-dream-accent1/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-dream-accent3/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                
                <h2 className="text-xl font-bold mb-4 relative z-10">Portfolio Summary</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 relative z-10">
                  <div className="bg-black/30 rounded-lg p-4 border border-white/10">
                    <div className="text-dream-foreground/60 text-sm mb-1">Total Portfolio Value</div>
                    <div className="text-2xl font-bold">{totalPortfolioValue.toLocaleString()} PXB</div>
                    <div className="flex items-center mt-2">
                      <Wallet className="w-4 h-4 text-dream-accent2 mr-1" />
                      <span className="text-sm text-dream-foreground/60">
                        {holdings.length} token{holdings.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-black/30 rounded-lg p-4 border border-white/10">
                    <div className="text-dream-foreground/60 text-sm mb-1">Total Profit/Loss</div>
                    <div className={`text-2xl font-bold flex items-center ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {totalProfit >= 0 ? <ArrowUp className="w-5 h-5 mr-1" /> : <ArrowDown className="w-5 h-5 mr-1" />}
                      {Math.abs(totalProfit).toLocaleString()} PXB
                    </div>
                    <div className={`text-sm ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {profitPercentage.toFixed(2)}%
                    </div>
                  </div>
                </div>
                
                <div className="relative z-10">
                  <div className="mb-3 flex justify-between items-center">
                    <h3 className="font-semibold">Your Holdings</h3>
                    <div className="text-sm text-dream-foreground/60">
                      Last updated: {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                  
                  {loadingHoldings ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="bg-black/20 rounded-lg p-3 border border-white/5">
                          <div className="flex items-center">
                            <Skeleton className="w-8 h-8 rounded-full mr-3" />
                            <div className="flex-1">
                              <Skeleton className="h-4 w-28 mb-1" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                            <div className="text-right">
                              <Skeleton className="h-4 w-20 mb-1" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : holdings.length === 0 ? (
                    <div className="text-center py-6 bg-black/20 rounded-lg border border-white/5">
                      <DollarSign className="w-10 h-10 text-dream-foreground/30 mx-auto mb-2" />
                      <p className="text-dream-foreground/70 mb-3">You don't have any tokens yet</p>
                      <Button asChild variant="outline" size="sm">
                        <Link to="/trading">Start Trading</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {holdings.map(token => {
                        const profit = token.currentValue - (token.quantity * token.averagePurchasePrice);
                        const profitPercent = (token.averagePurchasePrice > 0)
                          ? (profit / (token.quantity * token.averagePurchasePrice)) * 100
                          : 0;
                        
                        return (
                          <Link 
                            key={token.id} 
                            to={`/token/${token.tokenId}`}
                            className="block bg-black/20 hover:bg-black/30 transition-colors rounded-lg p-3 border border-white/5"
                          >
                            <div className="flex items-center">
                              {token.imageUrl ? (
                                <Avatar className="w-8 h-8 mr-3">
                                  <AvatarImage src={token.imageUrl} alt={token.tokenSymbol} />
                                  <AvatarFallback>{token.tokenSymbol[0]}</AvatarFallback>
                                </Avatar>
                              ) : (
                                <div className="w-8 h-8 bg-dream-accent1/20 rounded-full flex items-center justify-center mr-3">
                                  <span>{token.tokenSymbol[0]}</span>
                                </div>
                              )}
                              
                              <div className="flex-1">
                                <div className="font-medium">{token.tokenName}</div>
                                <div className="text-sm text-dream-foreground/60">
                                  {token.quantity.toLocaleString()} {token.tokenSymbol}
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <div className="font-medium">{token.currentValue.toLocaleString()} PXB</div>
                                <div className={`text-sm ${profit >= 0 ? 'text-green-400' : 'text-red-400'} flex items-center justify-end`}>
                                  {profit >= 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                                  {Math.abs(profitPercent).toFixed(2)}%
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div>
              <PXBPointsBalance />
              
              {userProfile && (
                <div className="mt-6">
                  <PXBStatsPanel userProfile={userProfile} />
                </div>
              )}
            </div>
          </div>
          
          <div className="glass-panel p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Trade History</h2>
            
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Trades</TabsTrigger>
                <TabsTrigger value="buy">Buy Orders</TabsTrigger>
                <TabsTrigger value="sell">Sell Orders</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                {renderTradeHistory(tradeHistory, loadingHistory)}
              </TabsContent>
              
              <TabsContent value="buy">
                {renderTradeHistory(tradeHistory.filter(trade => trade.type === 'buy'), loadingHistory)}
              </TabsContent>
              
              <TabsContent value="sell">
                {renderTradeHistory(tradeHistory.filter(trade => trade.type === 'sell'), loadingHistory)}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </>
  );
};

const renderTradeHistory = (trades: TradeHistory[], loading: boolean) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-black/20 rounded-lg p-4 border border-white/5">
            <div className="flex items-center">
              <Skeleton className="w-10 h-10 rounded-full mr-3" />
              <div className="flex-1">
                <Skeleton className="h-4 w-28 mb-2" />
                <Skeleton className="h-3 w-40" />
              </div>
              <div className="text-right">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (trades.length === 0) {
    return (
      <div className="text-center py-8 bg-black/20 rounded-lg border border-white/5">
        <Clock className="w-10 h-10 text-dream-foreground/30 mx-auto mb-2" />
        <p className="text-dream-foreground/70 mb-3">No trade history available</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/trading">Start Trading</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
      {trades.map(trade => (
        <Link
          key={trade.id}
          to={`/token/${trade.tokenId}`}
          className="block bg-black/20 hover:bg-black/30 transition-colors rounded-lg p-4 border border-white/5"
        >
          <div className="flex items-center">
            <div className="mr-3">
              {trade.imageUrl ? (
                <Avatar className="w-10 h-10">
                  <AvatarImage src={trade.imageUrl} alt={trade.tokenSymbol} />
                  <AvatarFallback>{trade.tokenSymbol[0]}</AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-10 h-10 bg-dream-accent1/20 rounded-full flex items-center justify-center">
                  <span>{trade.tokenSymbol[0]}</span>
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center">
                <span className="font-medium">{trade.tokenName}</span>
                <span className="ml-2 text-sm text-dream-foreground/60">{trade.tokenSymbol}</span>
              </div>
              <div className="flex items-center mt-1">
                <div className={`text-sm px-2 py-0.5 rounded ${trade.type === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {trade.type.toUpperCase()}
                </div>
                <div className="text-sm text-dream-foreground/60 ml-2">
                  {formatDistanceToNow(new Date(trade.timestamp), { addSuffix: true })}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-medium">{trade.quantity.toLocaleString()} {trade.tokenSymbol}</div>
              <div className="text-sm text-dream-foreground/60 mt-1">
                {trade.pxbAmount.toLocaleString()} PXB at ${trade.price.toFixed(6)}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default Portfolio;
