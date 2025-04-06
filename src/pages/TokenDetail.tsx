import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { ArrowLeft, ExternalLink, Twitter, Share2, Info, Layers, Zap, ArrowUp, ArrowDown, Globe, RefreshCw } from 'lucide-react';
import { fetchDexScreenerData, fetchRealTimeData } from '@/services/tokenDataService';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { calculatePercentageChange } from '@/utils/numberUtils';
import LineChart from '@/components/LineChart';
import TokenPrice from '@/components/TokenPrice';
import TokenTrading from '@/components/TokenTrading';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import TokenMarketCap from '@/components/TokenMarketCap';
import TokenVolume from '@/components/TokenVolume';
import TradeActivity from '@/components/TradeActivity';
import Navbar from '@/components/Navbar';
import OrbitingParticles from '@/components/OrbitingParticles';

interface DexScreenerData {
  pair: {
    baseToken: {
      address: string;
      name: string;
      symbol: string;
    };
    quoteToken: {
      address: string;
      name: string;
      symbol: string;
    };
    priceNative: string;
    priceUsd: string;
    volume: {
      h24: number;
    };
    liquidity: {
      usd: number;
    };
  };
}

interface RealTimeData {
  price: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  priceChange1h: number;
  priceChange6h: number;
}

const TokenDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { publicKey } = useWallet();
  const { userProfile } = usePXBPoints();
  const [tokenDetails, setTokenDetails] = useState<RealTimeData | null>(null);
  const [dexScreenerData, setDexScreenerData] = useState<DexScreenerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

  const fetchTokenData = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const realTimeData = await fetchRealTimeData(id);
      setTokenDetails(realTimeData);

      const dexscreener = await fetchDexScreenerData(id);
      setDexScreenerData(dexscreener);

      if (realTimeData) {
        const initialPrice = realTimeData.price;
        const now = Date.now();
        const interval = 60 * 60 * 1000; // 1 hour
        const numDataPoints = 24;
        const newChartData = Array.from({ length: numDataPoints }, (_, i) => {
          const time = now - (numDataPoints - 1 - i) * interval;
          const randomChange = (Math.random() - 0.5) * 0.1 * initialPrice;
          const value = initialPrice + randomChange;
          return {
            time: new Date(time).toLocaleTimeString(),
            value: value,
          };
        });
        setChartData(newChartData);
      }
    } catch (error) {
      console.error("Error fetching token data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTokenData();
    const intervalId = setInterval(fetchTokenData, 60000);

    return () => clearInterval(intervalId);
  }, [id]);

  useEffect(() => {
    const checkFollowingStatus = async () => {
      if (!userProfile || !id) return;
      try {
        setIsFollowingLoading(true);
        const { data, error } = await supabase
          .from('following_tokens')
          .select('*')
          .eq('user_id', userProfile.id)
          .eq('token_id', id)
          .single();

        if (error && error.code !== '404') {
          console.error('Error checking following status:', error);
        } else {
          setIsFollowing(!!data);
        }
      } catch (error) {
        console.error('Error checking following status:', error);
      } finally {
        setIsFollowingLoading(false);
      }
    };

    const checkFavoriteStatus = async () => {
      if (!userProfile || !id) return;
      try {
        setIsFavoriteLoading(true);
        const { data, error } = await supabase
          .from('favorite_tokens')
          .select('*')
          .eq('user_id', userProfile.id)
          .eq('token_id', id)
          .single();

        if (error && error.code !== '404') {
          console.error('Error checking favorite status:', error);
        } else {
          setIsFavorite(!!data);
        }
      } catch (error) {
        console.error('Error checking favorite status:', error);
      } finally {
        setIsFavoriteLoading(false);
      }
    };

    checkFollowingStatus();
    checkFavoriteStatus();
  }, [userProfile, id]);

  const handleFollow = async () => {
    if (!userProfile || !id) return;
    setIsFollowingLoading(true);
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('following_tokens')
          .delete()
          .eq('user_id', userProfile.id)
          .eq('token_id', id);

        if (error) {
          console.error('Error unfollowing token:', error);
          toast.error('Failed to unfollow token');
        } else {
          setIsFollowing(false);
          toast.success('Token unfollowed');
        }
      } else {
        const { error } = await supabase
          .from('following_tokens')
          .insert({
            user_id: userProfile.id,
            token_id: id,
          });

        if (error) {
          console.error('Error following token:', error);
          toast.error('Failed to follow token');
        } else {
          setIsFollowing(true);
          toast.success('Token followed');
        }
      }
    } catch (error) {
      console.error('Error following/unfollowing token:', error);
      toast.error('Failed to update following status');
    } finally {
      setIsFollowingLoading(false);
    }
  };

  const handleFavorite = async () => {
    if (!userProfile || !id) return;
    setIsFavoriteLoading(true);
    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('favorite_tokens')
          .delete()
          .eq('user_id', userProfile.id)
          .eq('token_id', id);

        if (error) {
          console.error('Error removing token from favorites:', error);
          toast.error('Failed to remove token from favorites');
        } else {
          setIsFavorite(false);
          toast.success('Token removed from favorites');
        }
      } else {
        const { error } = await supabase
          .from('favorite_tokens')
          .insert({
            user_id: userProfile.id,
            token_id: id,
          });

        if (error) {
          console.error('Error adding token to favorites:', error);
          toast.error('Failed to add token to favorites');
        } else {
          setIsFavorite(true);
          toast.success('Token added to favorites');
        }
      }
    } catch (error) {
      console.error('Error adding/removing token from favorites:', error);
      toast.error('Failed to update favorite status');
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  const openDialog = () => {
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
  };

  if (isLoading) {
    return (
      <>
        <OrbitingParticles />
        <Navbar />
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      </>
    );
  }

  if (!tokenDetails || !dexScreenerData) {
    return (
      <>
        <OrbitingParticles />
        <Navbar />
        <div className="flex justify-center items-center h-screen">
          <div>Token not found</div>
        </div>
      </>
    );
  }

  const priceChange24h = tokenDetails?.priceChange24h || 0;
  const isPricePositive = priceChange24h >= 0;

  return (
    <>
      <OrbitingParticles />
      <Navbar />

      <main className="pt-24 min-h-screen overflow-hidden px-4 pb-16">
        <div className="max-w-5xl mx-auto">
          <Link to="/betting" className="inline-flex items-center text-dream-foreground/70 hover:text-dream-foreground mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <img
                src="/lovable-uploads/74707f80-3a88-4b9c-82d2-5a590a3a32df.png"
                alt={tokenDetails.name}
                className="w-12 h-12 mr-4 rounded-full"
              />
              <div>
                <h1 className="text-3xl font-display font-bold">{tokenDetails.name}</h1>
                <p className="text-dream-foreground/60">{tokenDetails.symbol}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleFollow}
                disabled={isFollowingLoading}
              >
                {isFollowingLoading ? (
                  <div className="flex items-center">
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1"></div>
                    <span>Following...</span>
                  </div>
                ) : isFollowing ? (
                  'Unfollow'
                ) : (
                  'Follow'
                )}
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleFavorite}
                disabled={isFavoriteLoading}
              >
                {isFavoriteLoading ? (
                  <div className="flex items-center">
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1"></div>
                    <span>Favoriting...</span>
                  </div>
                ) : isFavorite ? (
                  'Unfavorite'
                ) : (
                  'Favorite'
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-black/60 border-dream-accent1/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">Price</h2>
                    <TokenPrice tokenId={id} />
                  </div>
                  <div className="text-right">
                    <div className={`text-sm ${isPricePositive ? 'text-green-400' : 'text-red-400'}`}>
                      {isPricePositive ? <ArrowUp className="inline-block w-4 h-4 mr-1" /> : <ArrowDown className="inline-block w-4 h-4 mr-1" />}
                      {priceChange24h.toFixed(2)}%
                    </div>
                    <p className="text-xs text-dream-foreground/60">24h Change</p>
                  </div>
                </div>

                <LineChart data={chartData} />

                <div className="flex justify-between mt-4">
                  <TokenMarketCap tokenId={id} />
                  <TokenVolume tokenId={id} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/60 border-dream-accent1/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Token Info</h2>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-dream-foreground/60">Contract Address</span>
                    <span className="font-medium">{dexScreenerData.pair.baseToken.address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dream-foreground/60">Quote Token</span>
                    <span className="font-medium">{dexScreenerData.pair.quoteToken.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dream-foreground/60">Liquidity</span>
                    <span className="font-medium">${dexScreenerData.pair.liquidity.usd.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dream-foreground/60">24h Volume</span>
                    <span className="font-medium">{dexScreenerData.pair.volume.h24.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-6 flex justify-center space-x-3">
                  <a href={`https://twitter.com/search?q=${tokenDetails.name}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="secondary" size="sm">
                      <Twitter className="w-4 h-4 mr-2" />
                      Twitter
                    </Button>
                  </a>
                  <a href={`https://dexscreener.com/solana/${id}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="secondary" size="sm">
                      <Info className="w-4 h-4 mr-2" />
                      DexScreener
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="trade" className="w-full">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="trade">Trade</TabsTrigger>
              <TabsTrigger value="info">Info</TabsTrigger>
              <TabsTrigger value="trades">Trades</TabsTrigger>
            </TabsList>

            <TabsContent value="trade" className="py-4">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openDialog} className="w-full">
                    Trade {tokenDetails.symbol}
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-transparent border-none shadow-none p-0 max-w-3xl">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-dream-background/80 to-blue-900/30 backdrop-blur-xl rounded-2xl z-0 animate-pulse-slow"></div>
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-dream-accent2/20 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-dream-accent1/20 rounded-full blur-3xl"></div>
                    <div className="absolute top-0 left-0 h-full w-full overflow-hidden rounded-2xl pointer-events-none z-10">
                      <div className="absolute h-px w-[120%] bg-gradient-to-r from-transparent via-dream-accent1/50 to-transparent top-[40%] left-[-10%] animate-scan-line"></div>
                    </div>
                    <div className="absolute inset-0 rounded-2xl border border-white/10 z-10"></div>
                    <div className="absolute inset-0 border border-gray-800/60 rounded-2xl z-10"></div>
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-dream-accent2/50 to-transparent z-20"></div>
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-dream-accent1/50 to-transparent z-20"></div>
                    <div className="relative z-30 p-1">
                      <TokenTrading 
                        tokenId={tokenDetails.id}
                        tokenName={tokenDetails.name}
                        tokenSymbol={tokenDetails.symbol}
                        tokenPrice={tokenDetails.price}
                        marketCap={tokenDetails.marketCap}
                        volume24h={tokenDetails.volume24h}
                        onSuccess={closeDialog}
                        onCancel={closeDialog}
                      />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="info" className="py-4">
              <Card className="bg-black/60 border-dream-accent1/30">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Token Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-dream-foreground/60">Name</span>
                      <span className="font-medium">{tokenDetails.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dream-foreground/60">Symbol</span>
                      <span className="font-medium">{tokenDetails.symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dream-foreground/60">Market Cap</span>
                      <span className="font-medium">{tokenDetails.marketCap.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dream-foreground/60">24h Volume</span>
                      <span className="font-medium">{tokenDetails.volume24h.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trades" className="py-4">
              <TradeActivity tokenId={id} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
};

export default TokenDetail;
