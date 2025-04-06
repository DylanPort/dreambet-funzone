import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Navbar from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { TradeHistory } from '@/types/pxb';
import { Link } from 'react-router-dom';
import { Clock, Link as LinkIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const Portfolio = () => {
  const { connected, publicKey } = useWallet();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!connected || !publicKey) {
        setTransactions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userId = publicKey.toString();

        const { data, error } = await supabase
          .from('token_transactions')
          .select('*')
          .eq('userid', userId)
          .order('timestamp', { ascending: false });

        if (error) {
          console.error('Error fetching transactions:', error);
          setLoading(false);
          return;
        }

        if (data) {
          const formattedTrades: TradeHistory[] = data.map(tx => ({
            ...tx,
            type: tx.type as 'buy' | 'sell'
          }));
          setTransactions(formattedTrades);
        } else {
          setTransactions([]);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [connected, publicKey]);

  const getTradeStatusClass = (trade: TradeHistory) => {
    if (trade.type === 'buy') {
      return 'bg-green-500/20 text-green-400';
    } else {
      return 'bg-red-500/20 text-red-400';
    }
  };

  if (!connected || !publicKey) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[#080b16] bg-gradient-to-b from-[#0a0e1c] to-[#070a14]">
          <div className="max-w-7xl mx-auto px-4 md:px-8 pt-24 pb-16 flex justify-center items-center min-h-[80vh]">
            <div className="w-full max-w-md p-8 rounded-2xl bg-[#0f1628]/80 backdrop-blur-lg border border-indigo-900/30 text-center">
              <div className="w-20 h-20 mb-6 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto">
                <img src="/lovable-uploads/575dd9fd-27d8-443c-8167-0af64089b9cc.png" alt="Portfolio" className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-display font-bold mb-4 text-white">Connect Your Wallet</h2>
              <p className="text-indigo-300/70 mb-6">You need to connect your wallet to view your portfolio.</p>
              <button
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-md transition-colors"
              >
                Connect Wallet
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[#080b16] bg-gradient-to-b from-[#0a0e1c] to-[#070a14]">
          <div className="max-w-7xl mx-auto px-4 md:px-8 pt-24 pb-16 flex justify-center items-center min-h-[80vh]">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-t-transparent border-indigo-500 rounded-full animate-spin mb-4"></div>
              <p className="text-indigo-300/70">Loading portfolio...</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#080b16] bg-gradient-to-b from-[#0a0e1c] to-[#070a14]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-24 pb-16">
          <h1 className="text-3xl font-bold text-white mb-8">Your Portfolio</h1>

          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-indigo-300/70">No transactions found in your portfolio.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((trade) => (
                <div key={trade.id} className="p-4 hover:bg-dream-accent1/5 transition-colors border border-dream-foreground/10 rounded-md backdrop-blur-lg bg-black/20 hover:border-dream-accent1/30">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${getTradeStatusClass(trade)}`}>
                        {trade.type === 'buy' ? <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-up-right"><path d="M7 17 17 7M7 7h10v10"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-down-right"><path d="M7 7 17 17M7 17h10V7"/></svg>}
                      </div>
                      <span className="font-semibold">
                        {trade.pxbamount} PXB
                      </span>
                    </div>
                    <div className={`text-xs px-2 py-0.5 rounded-full ${getTradeStatusClass(trade)}`}>
                      {trade.type === 'buy' ? 'Buy' : 'Sell'}
                    </div>
                  </div>

                  <div className="mb-1 hover:underline text-dream-accent2">
                    <div className="text-sm flex items-center">
                      <LinkIcon className="w-3 h-3 mr-1" />
                      {trade.tokenname} ({trade.tokensymbol})
                    </div>
                  </div>

                  <div className="text-sm text-dream-foreground/70 mb-1">
                    {trade.type === 'buy'
                      ? `Purchased ${trade.quantity.toLocaleString(undefined, { maximumFractionDigits: 2 })} tokens @ ${trade.price.toFixed(6)}`
                      : `Sold ${trade.quantity.toLocaleString(undefined, { maximumFractionDigits: 2 })} tokens @ ${trade.price.toFixed(6)}`
                    }
                  </div>

                  <div className="text-xs text-dream-foreground/60 mb-2">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDistanceToNow(new Date(trade.timestamp), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default Portfolio;
