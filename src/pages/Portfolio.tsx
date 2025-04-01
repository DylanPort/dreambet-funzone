
import React from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PortfolioSection from '@/components/PortfolioSection';
import { usePXBPoints } from '@/contexts/pxb/PXBPointsContext';
import OrbitingParticles from '@/components/OrbitingParticles';
import { Wallet, History, TrendingUp, TrendingDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PXBPointsBalance from '@/components/PXBPointsBalance';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

const Portfolio = () => {
  const { userProfile } = usePXBPoints();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = "PumpFun - Portfolio";
    
    const fetchTransactions = async () => {
      if (!userProfile) {
        setIsLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('token_transactions')
          .select('*')
          .eq('userid', userProfile.id)
          .order('timestamp', { ascending: false })
          .limit(50);
          
        if (error) throw error;
        
        setTransactions(data || []);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTransactions();
  }, [userProfile]);

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="min-h-screen">
      <OrbitingParticles />
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 flex items-center">
            <Wallet className="mr-3 h-7 w-7" />
            Token Portfolio
          </h1>
          
          <div className="mb-6">
            <PXBPointsBalance />
          </div>
          
          <Tabs defaultValue="portfolio" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="portfolio" className="flex items-center">
                <TrendingUp className="mr-2 h-4 w-4" />
                Portfolio
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center">
                <History className="mr-2 h-4 w-4" />
                Trade History
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="portfolio">
              <PortfolioSection />
              
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    Trading Guide
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p>
                      You can trade any token using your PXB points. Each trade follows the real-time market data from DexScreener.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-black/20 p-4 rounded-lg">
                        <h3 className="text-green-400 font-medium mb-2 flex items-center">
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Buying Tokens
                        </h3>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          <li>Visit any token page</li>
                          <li>Enter amount of PXB to spend</li>
                          <li>Click "Buy" to purchase tokens</li>
                          <li>Your portfolio value follows real market price</li>
                        </ul>
                      </div>
                      
                      <div className="bg-black/20 p-4 rounded-lg">
                        <h3 className="text-red-400 font-medium mb-2 flex items-center">
                          <TrendingDown className="mr-2 h-4 w-4" />
                          Selling Tokens
                        </h3>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          <li>Visit the token page of your holding</li>
                          <li>Enter quantity of tokens to sell</li>
                          <li>Click "Sell" to convert back to PXB</li>
                          <li>PXB is credited based on current market price</li>
                        </ul>
                      </div>
                    </div>
                    
                    <p className="text-sm text-dream-foreground/70">
                      Note: These are virtual trades that follow real market data. You don't own the actual tokens on-chain, but your portfolio value will reflect real market performance.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="history">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <History className="mr-2 h-5 w-5" />
                    Transaction History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="w-8 h-8 border-2 border-dream-accent2 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : !userProfile ? (
                    <div className="text-center py-6">
                      <p className="text-dream-foreground/70">Connect your wallet to view transaction history</p>
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-dream-foreground/70">No transactions found</p>
                      <p className="text-sm text-dream-foreground/50 mt-2">Start trading to see your history here</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-dream-foreground/10">
                              <th className="text-left pb-2 font-medium text-sm">Type</th>
                              <th className="text-left pb-2 font-medium text-sm">Token</th>
                              <th className="text-right pb-2 font-medium text-sm">Quantity</th>
                              <th className="text-right pb-2 font-medium text-sm">Price</th>
                              <th className="text-right pb-2 font-medium text-sm">PXB Amount</th>
                              <th className="text-right pb-2 font-medium text-sm">Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {transactions.map((tx) => (
                              <tr key={tx.id} className="border-b border-dream-foreground/5 hover:bg-dream-foreground/5">
                                <td className="py-3">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                    tx.type === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                  }`}>
                                    {tx.type === 'buy' ? (
                                      <><TrendingUp className="mr-1 h-3 w-3" /> Buy</>
                                    ) : (
                                      <><TrendingDown className="mr-1 h-3 w-3" /> Sell</>
                                    )}
                                  </span>
                                </td>
                                <td className="py-3">{tx.tokensymbol}</td>
                                <td className="py-3 text-right">{tx.quantity.toFixed(6)}</td>
                                <td className="py-3 text-right">${tx.price.toFixed(6)}</td>
                                <td className={`py-3 text-right ${tx.type === 'buy' ? 'text-red-400' : 'text-green-400'}`}>
                                  {tx.type === 'buy' ? '-' : '+'}{formatCurrency(tx.pxbamount)}
                                </td>
                                <td className="py-3 text-right text-sm text-dream-foreground/70">
                                  {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Portfolio;
