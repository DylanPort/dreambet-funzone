
import React, { useEffect, useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { TradeHistory } from '@/types/pxb';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { ArrowDown, ArrowUp } from 'lucide-react';

interface TradeActivityProps {
  userId?: string;
  limit?: number;
}

const TradeActivity: React.FC<TradeActivityProps> = ({ userId, limit = 10 }) => {
  const { userProfile } = usePXBPoints();
  const [trades, setTrades] = useState<TradeHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        setIsLoading(true);
        const id = userId || userProfile?.id;
        
        if (!id) {
          setIsLoading(false);
          return;
        }
        
        const { data, error } = await supabase
          .from('token_transactions')
          .select('*')
          .eq('userid', id)
          .order('timestamp', { ascending: false })
          .limit(limit);
          
        if (error) {
          console.error('Error fetching trade history:', error);
          return;
        }
        
        if (data) {
          const formattedTrades: TradeHistory[] = data.map(trade => ({
            id: trade.id,
            userId: trade.userid,
            tokenId: trade.tokenid,
            tokenName: trade.tokenname,
            tokenSymbol: trade.tokensymbol,
            type: trade.type as 'buy' | 'sell',
            quantity: trade.quantity,
            price: trade.price,
            pxbAmount: trade.pxbamount,
            timestamp: trade.timestamp
          }));
          
          setTrades(formattedTrades);
        }
      } catch (error) {
        console.error('Error in fetchTrades:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTrades();
  }, [userId, userProfile, limit]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="w-full bg-black/60 border-dream-accent1/30">
      <CardHeader>
        <CardTitle>Recent Trading Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center my-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-dream-accent1"></div>
          </div>
        ) : trades.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-dream-foreground/60">No trading activity yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {trades.map(trade => (
              <div 
                key={trade.id}
                className="flex items-center p-3 rounded-lg bg-dream-foreground/5 border border-dream-foreground/10"
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  trade.type === 'buy' ? 'bg-green-500/10' : 'bg-red-500/10'
                }`}>
                  {trade.type === 'buy' ? (
                    <ArrowUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDown className="h-4 w-4 text-red-500" />
                  )}
                </div>
                
                <div className="ml-3 flex-1">
                  <div className="flex justify-between">
                    <span className="font-medium">{trade.tokenName}</span>
                    <span className={`${
                      trade.type === 'buy' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {trade.type === 'buy' ? '+' : '-'}{trade.quantity.toLocaleString()} {trade.tokenSymbol}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-dream-foreground/60">
                    <span>{formatDate(trade.timestamp)}</span>
                    <span>{trade.pxbAmount.toLocaleString()} PXB</span>
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

export default TradeActivity;
