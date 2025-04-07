
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { TokenTransaction } from '@/contexts/pxb/types';

interface TokenTransactionHistoryProps {
  transactions: TokenTransaction[];
  isLoading: boolean;
}

const TokenTransactionHistory: React.FC<TokenTransactionHistoryProps> = ({
  transactions,
  isLoading
}) => {
  if (isLoading) {
    return (
      <Card className="bg-black/20 backdrop-blur-md border-gray-800">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/20 backdrop-blur-md border-gray-800">
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No transactions found
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div 
                key={tx.id}
                className="p-3 rounded-md border border-gray-800 bg-gray-900/50 flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <div className={`rounded-full p-2 ${tx.type === 'buy' ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
                    {tx.type === 'buy' ? (
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{tx.tokenName}</span>
                      <Badge variant="outline" className="text-xs">
                        {tx.tokenSymbol}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-medium ${tx.type === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                    {tx.type === 'buy' ? '-' : '+'}{tx.pxbAmount.toFixed(2)} PXB
                  </div>
                  <div className="text-xs text-gray-400">
                    {tx.type === 'buy' ? '+' : '-'}{tx.quantity.toFixed(6)} {tx.tokenSymbol}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TokenTransactionHistory;
