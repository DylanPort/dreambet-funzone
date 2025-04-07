
import React, { useState, useEffect } from 'react';
import { usePumpPortal } from '@/hooks/usePumpPortal';
import { ArrowUpRight, ArrowDownRight, Clock, User, ExternalLink } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface TokenTransaction {
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
  isDemo?: boolean;
}

const RecentTokenTrades: React.FC = () => {
  const { isConnected } = usePumpPortal();
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchRecentTransactions();
    
    // Set up a subscription to token_transactions for real-time updates
    const channel = supabase
      .channel('public:token_transactions')
      .on('postgres_changes', 
        {
          event: 'INSERT',
          schema: 'public',
          table: 'token_transactions'
        }, 
        (payload) => {
          const newTx = payload.new as any;
          const formattedTx: TokenTransaction = {
            id: newTx.id,
            timestamp: newTx.timestamp,
            type: newTx.type,
            tokenAmount: newTx.quantity,
            price: newTx.price,
            pxbAmount: newTx.pxbamount,
            userId: newTx.userid,
            tokenId: newTx.tokenid,
            tokenName: newTx.tokenname || '',
            tokenSymbol: newTx.tokensymbol || '',
            username: newTx.username || `User-${newTx.userid.substring(0, 6)}`
          };
          
          setTransactions(prev => [formattedTx, ...prev].slice(0, 20));
        })
      .subscribe();
      
    // Refresh transactions every 60 seconds
    const refreshInterval = setInterval(fetchRecentTransactions, 60000);
    
    return () => {
      clearInterval(refreshInterval);
      supabase.removeChannel(channel);
    };
  }, [isConnected]);

  const fetchRecentTransactions = async () => {
    setIsLoading(true);
    try {
      // Fetch transactions from Supabase
      const { data, error } = await supabase
        .from('token_transactions')
        .select(`
          id, 
          timestamp, 
          type, 
          quantity, 
          price, 
          pxbamount, 
          userid, 
          tokenid, 
          tokenname, 
          tokensymbol,
          users (username)
        `)
        .order('timestamp', { ascending: false })
        .limit(20);
      
      if (error) {
        console.error('Error fetching token transactions:', error);
        setIsLoading(false);
        return;
      }
      
      // Format the transactions for display
      const formattedTxs = data.map(tx => ({
        id: tx.id,
        timestamp: tx.timestamp,
        type: tx.type,
        tokenAmount: tx.quantity,
        price: tx.price,
        pxbAmount: tx.pxbamount,
        userId: tx.userid,
        tokenId: tx.tokenid,
        tokenName: tx.tokenname || '',
        tokenSymbol: tx.tokensymbol || '',
        username: tx.users?.username || `User-${tx.userid.substring(0, 6)}`
      }));
      
      setTransactions(formattedTxs);
    } catch (error) {
      console.error('Error in fetchRecentTransactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (e) {
      return 'recently';
    }
  };

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

  if (isLoading) {
    return (
      <div className="bg-dream-foreground/5 backdrop-blur-sm p-4 rounded-lg border border-dream-accent1/20">
        <div className="text-center py-4">
          <p className="text-dream-foreground/60">Loading recent transactions...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="bg-dream-foreground/5 backdrop-blur-sm p-4 rounded-lg border border-dream-accent1/20">
        <div className="text-center py-4">
          <p className="text-dream-foreground/60">Connecting to Pump Portal...</p>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-dream-foreground/5 backdrop-blur-sm rounded-lg border border-dream-accent1/20 overflow-hidden">
        <div className="p-4 border-b border-dream-accent1/20 flex justify-between items-center">
          <h3 className="font-display font-semibold text-lg">
            Recent Transactions
          </h3>
        </div>
        <div className="p-4 text-center">
          <p className="text-dream-foreground/60">No recent transactions found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dream-foreground/5 backdrop-blur-sm rounded-lg border border-dream-accent1/20 overflow-hidden">
      <div className="p-4 border-b border-dream-accent1/20 flex justify-between items-center">
        <h3 className="font-display font-semibold text-lg">
          Recent Transactions
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-purple-400 text-xs flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
            Live from PumpXBounty
          </span>
        </div>
      </div>
      
      <ScrollArea className="max-h-[400px]">
        <div className="divide-y divide-dream-accent1/10">
          {transactions.map((tx) => (
            <Link key={tx.id} to={`/token/${tx.tokenId}`} className="block">
              <div className="p-4 hover:bg-dream-accent1/5 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-medium text-dream-foreground flex items-center gap-1">
                      <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-green-300 to-emerald-500">
                        {tx.tokenName}
                      </span>
                      <span className="text-xs text-dream-foreground/60">{tx.tokenSymbol}</span>
                    </div>
                    <div className="text-xs text-dream-foreground/60 flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(tx.timestamp)}
                      </span>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                    tx.type === 'buy' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {tx.type === 'buy' ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    <span>{tx.type.toUpperCase()}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <div className="text-dream-foreground/70 text-xs mb-1">Amount</div>
                    <div className="font-medium">{formatAmount(tx.tokenAmount)} tokens</div>
                  </div>
                  <div>
                    <div className="text-dream-foreground/70 text-xs mb-1">Price</div>
                    <div className="font-medium">${formatPrice(tx.price)}</div>
                  </div>
                  <div>
                    <div className="text-dream-foreground/70 text-xs mb-1">Total</div>
                    <div className="font-medium">{formatAmount(tx.pxbAmount)} PXB</div>
                  </div>
                  <div>
                    <div className="text-dream-foreground/70 text-xs mb-1">Trader</div>
                    <div className="font-medium truncate max-w-[120px]">
                      {tx.username || tx.userId.substring(0, 8) + '...'}
                    </div>
                  </div>
                </div>
                
                <div className="mt-2 text-xs">
                  <div className="truncate text-dream-foreground/40">
                    Token: {tx.tokenId}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </ScrollArea>
      
      <div className="p-3 text-center border-t border-dream-accent1/20">
        <Link to="/betting" className="text-dream-accent1 text-sm hover:underline flex items-center justify-center gap-2 w-full">
          View all transactions
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default RecentTokenTrades;
