
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryClient } from '@/services/queryClient';

interface TokenTradeHistoryProps {
  tokenId: string;
}

const formatAmount = (amount: number) => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(2)}M`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(2)}K`;
  }
  return amount.toLocaleString();
};

const formatPrice = (price: number) => {
  if (price < 0.000001) return price.toExponential(2);
  if (price < 0.001) return price.toFixed(9);
  if (price < 0.01) return price.toFixed(6);
  if (price < 1) return price.toFixed(4);
  return price.toFixed(2);
};

interface PXBTransaction {
  id: string;
  timestamp: string;
  type: string;
  tokenAmount: number;
  price: number;
  pxbAmount: number;
  userId: string;
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  username?: string;
}

const TokenTradeHistory: React.FC<TokenTradeHistoryProps> = ({ tokenId }) => {
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['tokenTradeHistory', tokenId],
    queryFn: async () => {
      // Fetch all transactions for this token from Supabase
      const { data: tokenTxs, error } = await supabase
        .from('token_transactions')
        .select(`
          id, 
          type, 
          price, 
          timestamp, 
          quantity, 
          pxbamount, 
          userid, 
          tokenid, 
          tokenname, 
          tokensymbol,
          users (username)
        `)
        .eq('tokenid', tokenId)
        .order('timestamp', { ascending: false });
      
      if (error) {
        console.error("Error fetching token transactions:", error);
        throw error;
      }
      
      // Transform to the format needed by the component
      const txs = tokenTxs.map(tx => ({
        id: tx.id,
        timestamp: tx.timestamp,
        type: tx.type,
        tokenAmount: tx.quantity,
        price: tx.price,
        pxbAmount: tx.pxbamount,
        userId: tx.userid,
        tokenId: tx.tokenid,
        tokenName: tx.tokenname,
        tokenSymbol: tx.tokensymbol,
        username: tx.users?.username
      }));
      
      return txs;
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Set up real-time subscription to token transactions
  React.useEffect(() => {
    const channel = supabase
      .channel('token-transactions')
      .on('postgres_changes', 
        {
          event: '*', 
          schema: 'public',
          table: 'token_transactions',
          filter: `tokenid=eq.${tokenId}`
        },
        (payload) => {
          // When a new transaction is detected, invalidate the query to trigger a refetch
          queryClient.invalidateQueries({ queryKey: ['tokenTradeHistory', tokenId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tokenId]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold mb-4">Recent Trades</h3>
      
      {isLoading && (
        <div className="text-center py-8 text-dream-foreground/70">
          <p>Loading transaction history...</p>
        </div>
      )}
      
      {!isLoading && transactions.length === 0 ? (
        <div className="text-center py-8 text-dream-foreground/70">
          <p>No trade history available for this token yet.</p>
          <p className="text-sm mt-2">Be the first to trade this token with PXB points!</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {transactions.map((trade, index) => (
            <div key={`${trade.id}-${index}`} className="glass-panel border border-dream-accent1/20 p-3 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  {trade.type === 'buy' ? (
                    <ArrowUpRight className="w-4 h-4 text-green-400 mr-2" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-400 mr-2" />
                  )}
                  <span className={`font-semibold ${trade.type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                    {trade.type === 'buy' ? 'Buy' : 'Sell'}
                  </span>
                </div>
                <span className="text-xs text-dream-foreground/70">
                  {formatDistanceToNow(new Date(trade.timestamp), { addSuffix: true })}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-dream-foreground/70">Amount</div>
                  <div className="font-medium">{formatAmount(trade.tokenAmount)}</div>
                </div>
                <div>
                  <div className="text-dream-foreground/70">Price</div>
                  <div className="font-medium">${formatPrice(trade.price)}</div>
                </div>
                <div>
                  <div className="text-dream-foreground/70">PXB Spent</div>
                  <div className="font-medium">{formatAmount(trade.pxbAmount)} PXB</div>
                </div>
                <div>
                  <div className="text-dream-foreground/70">Trader</div>
                  <div className="font-medium truncate">
                    {trade.username || trade.userId.substring(0, 6) + '...'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TokenTradeHistory;
