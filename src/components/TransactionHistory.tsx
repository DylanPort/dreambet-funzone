
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { History, TrendingUp, TrendingDown, ArrowUpDown, RefreshCcw } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getUserTokenTransactions } from '@/services/tokenTradingService';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format, formatDistanceToNow } from 'date-fns';

interface TransactionHistoryProps {
  tokenId?: string;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ tokenId }) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { connected } = useWallet();

  const loadTransactions = async () => {
    if (!connected) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const txs = await getUserTokenTransactions(tokenId);
      setTransactions(txs);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [connected, tokenId]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(2);
  };

  return (
    <Card className="glass-panel">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-display font-bold flex items-center">
            <History size={20} className="mr-2" />
            {tokenId ? 'Trade History' : 'Transaction History'}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadTransactions}
            disabled={loading}
          >
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
        <CardDescription>
          {tokenId 
            ? 'Your trading history for this token' 
            : 'All your token transactions'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!connected ? (
          <div className="text-center py-4 text-dream-foreground/60">
            <p>Connect your wallet to view your transactions</p>
          </div>
        ) : loading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-4 text-dream-foreground/60">
            <p>{tokenId ? 'No trades for this token yet' : 'No transaction history'}</p>
            <p className="text-sm mt-2">Start trading to see your history</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {transactions.map((tx) => (
              <div key={tx.id} className="rounded-md bg-black/20 p-3 hover:bg-black/30 transition-colors">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      tx.type === 'buy' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {tx.type === 'buy' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    </div>
                    <div>
                      <div className="font-medium">
                        {tx.type === 'buy' ? 'Bought' : 'Sold'} {tx.tokensymbol}
                      </div>
                      <div className="text-sm text-dream-foreground/60">
                        {format(new Date(tx.timestamp), 'MMM dd, yyyy HH:mm')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{tx.quantity.toFixed(4)} {tx.tokensymbol}</div>
                    <div className={`text-sm ${
                      tx.type === 'buy' 
                        ? 'text-red-400' 
                        : 'text-green-400'
                    }`}>
                      {tx.type === 'buy' ? '-' : '+'}{tx.pxbamount.toFixed(2)} PXB
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-dream-foreground/60 flex justify-between">
                  <span>Price: ${tx.price.toFixed(6)}</span>
                  <span>{formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;
