
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Bookmark, Share2, ExternalLink, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PriceChart from '@/components/PriceChart';
import TokenVolume from '@/components/TokenVolume';
import TokenMarketCap from '@/components/TokenMarketCap';
import RecentTokenTrades from '@/components/RecentTokenTrades';
import TokenComments from '@/components/TokenComments';
import BetsList from '@/components/BetsList';
import FuturisticTokenDisplay from '@/components/FuturisticTokenDisplay';
import OpenBetsList from '@/components/OpenBetsList';
import ActiveBetsList from '@/components/ActiveBetsList';
import PXBBetsList from '@/components/PXBBetsList';
import { useWallet } from '@solana/wallet-adapter-react';

const TokenDetail = () => {
  const { tokenId } = useParams();
  const { connected } = useWallet();
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Token data would be fetched here in a real app
    if (tokenId) {
      // Mock data
      setToken({
        name: "Sample Token",
        symbol: "STKN",
        price: 0.000023,
        change24h: 12.5,
        marketCap: 1245000,
        volume24h: 523000
      });
    }
  }, [tokenId]);

  if (!token) {
    return (
      <div className="min-h-screen bg-dream-backdrop">
        <Navbar />
        <div className="container mx-auto pt-24 px-4">
          <div className="text-center py-20">
            <div className="animate-pulse">Loading token details...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dream-backdrop pb-20">
      <Navbar />
      
      <div className="container mx-auto pt-24 px-4">
        <Link to="/dashboard" className="inline-flex items-center text-dream-foreground/70 hover:text-dream-foreground mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <FuturisticTokenDisplay tokenId={tokenId} />
            
            <div className="glass-panel p-6">
              <Tabs defaultValue="price">
                <TabsList className="mb-4">
                  <TabsTrigger value="price">Price Chart</TabsTrigger>
                  <TabsTrigger value="volume">Volume</TabsTrigger>
                  <TabsTrigger value="marketcap">Market Cap</TabsTrigger>
                </TabsList>
                <TabsContent value="price" className="h-80">
                  <PriceChart tokenId={tokenId} />
                </TabsContent>
                <TabsContent value="volume" className="h-80">
                  <TokenVolume tokenId={tokenId} />
                </TabsContent>
                <TabsContent value="marketcap" className="h-80">
                  <TokenMarketCap tokenId={tokenId} />
                </TabsContent>
              </Tabs>
            </div>
            
            <div className="glass-panel p-6">
              <Tabs defaultValue="trades">
                <TabsList className="mb-4">
                  <TabsTrigger value="trades">Recent Trades</TabsTrigger>
                  <TabsTrigger value="comments">Comments</TabsTrigger>
                </TabsList>
                <TabsContent value="trades">
                  <RecentTokenTrades tokenId={tokenId} />
                </TabsContent>
                <TabsContent value="comments">
                  <TokenComments tokenId={tokenId} tokenName={token.name} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
          
          {/* Right Column */}
          <div className="space-y-6">
            <div className="glass-panel p-6">
              <h2 className="text-xl font-bold mb-4">Place a Bet</h2>
              <div className="space-y-4">
                <Button className="w-full flex items-center justify-center gap-2" asChild>
                  <Link to={`/betting/token/${tokenId}`}>
                    <ArrowUpRight className="h-4 w-4" />
                    Bet this token will MOON
                  </Link>
                </Button>
                
                <Button className="w-full flex items-center justify-center gap-2" variant="destructive" asChild>
                  <Link to={`/betting/token/${tokenId}`}>
                    <ArrowDownRight className="h-4 w-4" />
                    Bet this token will DIE
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="glass-panel p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Clock className="mr-2 h-5 w-5 text-dream-accent1" />
                Active Bets
              </h2>
              <OpenBetsList />
            </div>
            
            {connected && (
              <PXBBetsList maxItems={3} compact={true} />
            )}
            
            <div className="glass-panel p-6">
              <h2 className="text-lg font-semibold mb-4">Your Active Bets</h2>
              <ActiveBetsList />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenDetail;
