import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Wallet } from 'lucide-react';
import Navbar from '@/components/Navbar';
import OrbitingParticles from '@/components/OrbitingParticles';
import { supabase } from '@/integrations/supabase/client';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TradeHistory } from '@/types/pxb';
import Loading from '@/components/Loading';

const Portfolio = () => {
  const { userProfile } = usePXBPoints();
  const [tradeHistory, setTradeHistory] = useState<TradeHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('token_transactions')
          .select('*')
          .eq('userid', userProfile?.id || '')
          .order('timestamp', { ascending: false });

        if (error) {
          console.error('Error fetching trade history:', error);
        } else {
          // Transform the data to match TradeHistory interface
          const formattedData: TradeHistory[] = data.map(tx => ({
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
          setTradeHistory(formattedData);
        }
      } catch (err) {
        console.error('Error in fetchTransactions:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (userProfile) {
      fetchTransactions();
    }
  }, [userProfile]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

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
            <h1 className="text-3xl font-display font-bold">Portfolio</h1>
          </div>

          {userProfile ? (
            <div className="grid md:grid-cols-1 gap-6">
              <Card className="bg-black/60 border-dream-accent1/30">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Wallet className="mr-2 h-5 w-5 text-dream-accent1" />
                    Trade History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Loading />
                  ) : tradeHistory.length > 0 ? (
                    <ScrollArea className="h-[400px] w-full">
                      <div className="space-y-4">
                        {tradeHistory.map((trade) => (
                          <div key={trade.id} className="p-4 rounded-lg bg-dream-foreground/5 border border-dream-foreground/10">
                            <div className="flex justify-between items-center mb-2">
                              <div>
                                <div className="font-medium">{trade.tokenName}</div>
                                <div className="text-xs text-dream-foreground/60">{trade.tokenSymbol}</div>
                              </div>
                              <div className="text-right">
                                <div className={`${trade.type === 'buy' ? 'text-green-400' : 'text-red-400'} font-medium`}>
                                  {trade.type === 'buy' ? '+' : '-'}{trade.quantity.toLocaleString()}
                                </div>
                                <div className="text-xs text-dream-foreground/60">{trade.pxbAmount.toLocaleString()} PXB</div>
                              </div>
                            </div>
                            <div className="flex justify-between text-xs text-dream-foreground/40">
                              <div>{formatDate(trade.timestamp)}</div>
                              <div>Price: {trade.price.toFixed(6)} PXB</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-dream-foreground/60">No trade history yet</p>
                      <p className="text-sm text-dream-foreground/40 mt-1">Start trading tokens to see your history here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="glass-panel p-8 text-center">
              <p className="text-xl text-dream-foreground/70 mb-4">Connect your wallet to view your portfolio</p>
              <p className="text-dream-foreground/50 mb-6">Your trade history and token balances will be displayed here</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default Portfolio;
