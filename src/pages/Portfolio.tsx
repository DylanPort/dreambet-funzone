
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Wallet, Clock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import OrbitingParticles from '@/components/OrbitingParticles';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { TradeHistory } from '@/types/pxb';
import Loading from '@/components/Loading';
import TradeActivity from '@/components/TradeActivity';

const Portfolio = () => {
  const { userProfile } = usePXBPoints();
  const [isLoading, setIsLoading] = useState(true);
  const [tradeHistory, setTradeHistory] = useState<TradeHistory[]>([]);
  const [portfolioSummary, setPortfolioSummary] = useState<{
    totalValue: number;
    totalProfitLoss: number;
    totalTokens: number;
  }>({
    totalValue: 0,
    totalProfitLoss: 0,
    totalTokens: 0,
  });

  useEffect(() => {
    const fetchPortfolioData = async () => {
      if (!userProfile) return;
      
      setIsLoading(true);
      try {
        // Fetch user's token transactions
        const { data: transactions, error: txError } = await supabase
          .from('token_transactions')
          .select('*')
          .eq('userid', userProfile.id)
          .order('timestamp', { ascending: false });
          
        if (txError) {
          console.error('Error fetching token transactions:', txError);
          return;
        }
        
        if (transactions) {
          // Convert to the TradeHistory format
          const history: TradeHistory[] = transactions.map(tx => ({
            id: tx.id,
            userId: tx.userid,
            tokenId: tx.tokenid,
            tokenName: tx.tokenname,
            tokenSymbol: tx.tokensymbol,
            type: tx.type as 'buy' | 'sell',
            quantity: tx.quantity,
            price: tx.price,
            pxbAmount: tx.pxbamount,
            timestamp: tx.timestamp
          }));
          
          setTradeHistory(history);
          
          // Calculate portfolio summary (simplified for this demo)
          const buyTransactions = transactions.filter(tx => tx.type === 'buy');
          const totalTokens = buyTransactions.length;
          const totalValue = buyTransactions.reduce((sum, tx) => sum + tx.pxbamount, 0);
          
          // Random profit/loss for demo
          const profitLossPercent = (Math.random() * 40) - 20; // Between -20% and +20%
          const totalProfitLoss = totalValue * (profitLossPercent / 100);
          
          setPortfolioSummary({
            totalValue,
            totalProfitLoss,
            totalTokens
          });
        }
      } catch (error) {
        console.error('Error in fetchPortfolioData:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPortfolioData();
  }, [userProfile]);

  if (!userProfile) {
    return (
      <>
        <OrbitingParticles />
        <Navbar />
        <main className="pt-24 min-h-screen overflow-hidden px-4 pb-16">
          <div className="max-w-3xl mx-auto text-center py-10">
            <Wallet className="w-12 h-12 mx-auto text-dream-foreground/30 mb-4" />
            <h1 className="text-2xl font-bold mb-2">Connect Your Wallet</h1>
            <p className="text-dream-foreground/60 mb-6">
              Connect your wallet to view your portfolio and trading history
            </p>
            <Link 
              to="/" 
              className="inline-flex items-center px-4 py-2 bg-dream-accent1/20 hover:bg-dream-accent1/30 rounded-md text-dream-accent1"
            >
              Go to Homepage
            </Link>
          </div>
        </main>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <OrbitingParticles />
        <Navbar />
        <main className="pt-24 min-h-screen overflow-hidden px-4 pb-16">
          <Loading message="Loading your portfolio data..." />
        </main>
      </>
    );
  }

  return (
    <>
      <OrbitingParticles />
      <Navbar />
      
      <main className="pt-24 min-h-screen overflow-hidden px-4 pb-16">
        <div className="max-w-5xl mx-auto">
          <Link to="/" className="inline-flex items-center text-dream-foreground/70 hover:text-dream-foreground mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          
          <h1 className="text-3xl font-display font-bold mb-6">Your Portfolio</h1>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-black/60 border-dream-accent1/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-dream-foreground/70">Portfolio Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{portfolioSummary.totalValue.toLocaleString()} PXB</div>
              </CardContent>
            </Card>
            
            <Card className="bg-black/60 border-dream-accent1/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-dream-foreground/70">Profit/Loss</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  portfolioSummary.totalProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {portfolioSummary.totalProfitLoss >= 0 ? '+' : ''}
                  {portfolioSummary.totalProfitLoss.toLocaleString()} PXB
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-black/60 border-dream-accent1/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-dream-foreground/70">Total Tokens</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{portfolioSummary.totalTokens}</div>
              </CardContent>
            </Card>
          </div>
          
          <Tabs defaultValue="activity" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="holdings">Holdings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="activity">
              <TradeActivity userId={userProfile.id} limit={20} />
            </TabsContent>
            
            <TabsContent value="holdings">
              <Card className="bg-black/60 border-dream-accent1/30">
                <CardHeader>
                  <CardTitle>Your Holdings</CardTitle>
                </CardHeader>
                <CardContent>
                  {tradeHistory.length === 0 ? (
                    <div className="text-center py-6">
                      <Clock className="w-12 h-12 mx-auto text-dream-foreground/30 mb-4" />
                      <p className="text-dream-foreground/60">No token holdings yet</p>
                      <p className="text-sm text-dream-foreground/40 mt-1">
                        Start trading tokens to build your portfolio
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-dream-foreground/60 text-center">
                        Portfolio tracking is under development. Check back soon!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
};

export default Portfolio;
