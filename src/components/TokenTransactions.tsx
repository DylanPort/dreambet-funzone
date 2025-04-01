
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, ArrowUpRight, ArrowDownRight, ExternalLink } from 'lucide-react';
import { getUserTransactions, TokenTransaction } from '@/services/tokenTradingService';
import { usePXBPoints } from '@/contexts/pxb/PXBPointsContext';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface TokenTransactionsProps {
  tokenId?: string;
  limit?: number;
}

const TokenTransactions: React.FC<TokenTransactionsProps> = ({ tokenId, limit = 5 }) => {
  const { userProfile } = usePXBPoints();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load transaction data
  useEffect(() => {
    const loadTransactions = async () => {
      if (!userProfile) return;
      
      setIsLoading(true);
      try {
        const txs = await getUserTransactions(tokenId, limit);
        setTransactions(txs);
      } catch (error) {
        console.error('Error loading transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTransactions();
  }, [userProfile, tokenId, limit]);

  const refreshTransactions = async () => {
    if (!userProfile) return;
    
    setIsLoading(true);
    try {
      const txs = await getUserTransactions(tokenId, limit);
      setTransactions(txs);
    } catch (error) {
      console.error('Error refreshing transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewToken = (txTokenId: string) => {
    navigate(`/token/${txTokenId}`);
  };

  if (!userProfile) {
    return (
      <Card className="glass-panel border border-dream-accent1/20">
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Connect your wallet to view your transactions</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="glass-panel border border-dream-accent1/20">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-display">
            {tokenId ? 'Token Transactions' : 'Recent Transactions'}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={refreshTransactions}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription>
          {tokenId ? 'Your trade history for this token' : 'Your recent trading activity'}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-6 text-dream-foreground/70">
            <p>No transactions found</p>
            {!tokenId && (
              <p className="text-sm mt-1">Buy or sell tokens to see your transaction history</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map(tx => (
              <div 
                key={tx.id} 
                className={`border ${tx.type === 'buy' ? 'border-green-500/30' : 'border-red-500/30'} p-3 rounded-md hover:border-dream-foreground/30 transition-all cursor-pointer`}
                onClick={() => handleViewToken(tx.tokenId)}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${tx.type === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {tx.type === 'buy' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    </div>
                    <div>
                      <div className="font-semibold">{tx.type === 'buy' ? 'Bought' : 'Sold'} {tx.tokenSymbol}</div>
                      <div className="text-xs text-dream-foreground/70">
                        {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div>{tx.quantity.toFixed(6)} tokens</div>
                    <div className="text-xs text-dream-foreground/70">${tx.price.toFixed(6)} per token</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-dream-foreground/70">Total</span>
                  <div className={`${tx.type === 'buy' ? 'text-red-400' : 'text-green-400'}`}>
                    {tx.type === 'buy' ? '-' : '+'}{tx.pxbAmount.toFixed(0)} PXB
                  </div>
                </div>
                
                {!tokenId && (
                  <div className="flex justify-end mt-1">
                    <Button variant="ghost" size="sm" className="h-6 text-xs flex items-center gap-1 text-dream-accent2">
                      <ExternalLink className="w-3 h-3" />
                      View token
                    </Button>
                  </div>
                )}
              </div>
            ))}
            
            {!tokenId && transactions.length >= limit && (
              <div className="text-center pt-2">
                <Button variant="link" size="sm" onClick={() => navigate('/profile')}>
                  View all transactions
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TokenTransactions;
