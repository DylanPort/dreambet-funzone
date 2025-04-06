
import React from 'react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Clock, Zap } from 'lucide-react';
import { TradeHistory } from '@/types/pxb';

const TradeHistoryList = () => {
  const { userTrades, isLoadingTrades } = usePXBPoints();
  
  if (isLoadingTrades) {
    return (
      <Card className="w-full bg-black/60 border-dream-accent1/30">
        <CardHeader>
          <CardTitle>Your Trading History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-dream-accent1"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!userTrades || userTrades.length === 0) {
    return (
      <Card className="w-full bg-black/60 border-dream-accent1/30">
        <CardHeader>
          <CardTitle>Your Trading History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <Zap className="mx-auto h-12 w-12 text-dream-accent1/30 mb-2" />
            <p className="text-dream-foreground/60">No trades yet</p>
            <p className="text-sm text-dream-foreground/40 mt-1">
              Start trading tokens to see your history here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full bg-black/60 border-dream-accent1/30">
      <CardHeader>
        <CardTitle>Your Trading History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {userTrades.map((trade) => (
            <div key={trade.id} className="p-4 bg-dream-foreground/5 rounded-lg border border-dream-foreground/10">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    trade.type === 'buy' ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    {trade.type === 'buy' ? 
                      <ArrowUp className="h-4 w-4 text-green-400" /> : 
                      <ArrowDown className="h-4 w-4 text-red-400" />
                    }
                  </div>
                  <div className="ml-3">
                    <div className="font-medium">{trade.tokenName}</div>
                    <div className="text-xs text-dream-foreground/60">{trade.tokenSymbol}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`${
                    trade.type === 'buy' ? 'text-green-400' : 'text-red-400'
                  } font-medium`}>
                    {trade.type === 'buy' ? '+' : '-'}{trade.quantity.toLocaleString()}
                  </div>
                  <div className="text-xs text-dream-foreground/60">{trade.pxbAmount.toLocaleString()} PXB</div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-dream-foreground/40">
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {new Date(trade.timestamp).toLocaleString()}
                </div>
                <div>Price: {trade.price.toFixed(6)} PXB</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TradeHistoryList;
