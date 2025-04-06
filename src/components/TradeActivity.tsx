
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, Clock, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TradeHistory } from '@/types/pxb';
import { Button } from '@/components/ui/button';

interface TradeActivityProps {
  userId?: string;
  walletAddress?: string;
  limit?: number;
  publicOnly?: boolean;
  title?: string;
}

const TradeActivity: React.FC<TradeActivityProps> = ({ 
  userId, 
  walletAddress, 
  limit = 10,
  publicOnly = false,
  title = "Trading Activity"
}) => {
  const [trades, setTrades] = useState<TradeHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(limit);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        setLoading(true);
        
        let query = supabase
          .from('token_transactions')
          .select(`
            id,
            userid,
            tokenid,
            tokenname,
            tokensymbol,
            type,
            quantity,
            price,
            pxbamount,
            timestamp,
            users!token_transactions_userid_fkey (username, avatar_url)
          `)
          .order('timestamp', { ascending: false });
        
        // If not public only, filter by user
        if (!publicOnly && userId) {
          query = query.eq('userid', userId);
        }
        
        // Limit number of results
        query = query.limit(50);
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching trades:', error);
          setLoading(false);
          return;
        }
        
        if (!data || data.length === 0) {
          setTrades([]);
          setLoading(false);
          return;
        }
        
        // Transform data to match TradeHistory interface
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
          timestamp: trade.timestamp,
          username: trade.users?.username,
          avatar: trade.users?.avatar_url
        }));
        
        setTrades(formattedTrades);
      } catch (error) {
        console.error('Error fetching trades:', error);
      } finally {
        setLoading(false);
      }
    };

    // Set up subscription for real-time updates
    const subscription = supabase
      .channel('token_transactions_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'token_transactions',
      }, (payload) => {
        // Handle new trade
        const newTrade = payload.new as any;
        
        // Add the new trade to our list
        setTrades(prevTrades => {
          const trade: TradeHistory = {
            id: newTrade.id,
            userId: newTrade.userid,
            tokenId: newTrade.tokenid,
            tokenName: newTrade.tokenname,
            tokenSymbol: newTrade.tokensymbol,
            type: newTrade.type as 'buy' | 'sell',
            quantity: newTrade.quantity,
            price: newTrade.price,
            pxbAmount: newTrade.pxbamount,
            timestamp: newTrade.timestamp,
            username: 'New Trader', // Will be updated on next full refresh
            avatar: null
          };
          
          return [trade, ...prevTrades].slice(0, 50); // Keep list at max 50 items
        });
      })
      .subscribe();
    
    fetchTrades();
    
    // Clean up subscription
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userId, walletAddress, publicOnly, limit]);

  const getTradeStatusClass = (trade: TradeHistory) => {
    if (trade.type === 'buy') {
      return 'bg-green-500/20 text-green-400';
    } else {
      return 'bg-red-500/20 text-red-400';
    }
  };

  const showMore = () => {
    setVisibleCount(prev => prev + 10);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-2 border-dream-accent2 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-dream-foreground/70">Loading trades...</p>
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-dream-foreground/70">No trades found</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-5">{title}</h2>
      <div className="space-y-4">
        {trades.slice(0, visibleCount).map((trade) => (
          <Link key={trade.id} to={`/token/${trade.tokenId}`} className="block">
            <div className="p-4 hover:bg-dream-accent1/5 transition-colors border border-dream-foreground/10 rounded-md backdrop-blur-lg bg-black/20 hover:border-dream-accent1/30">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${trade.type === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {trade.type === 'buy' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  </div>
                  <span className="font-semibold">
                    {trade.pxbAmount} PXB
                  </span>
                </div>
                <div className={`text-xs px-2 py-0.5 rounded-full ${getTradeStatusClass(trade)}`}>
                  {trade.type === 'buy' ? 'Buy' : 'Sell'}
                </div>
              </div>
              
              <div className="mb-1 hover:underline text-dream-accent2">
                <div className="text-sm flex items-center">
                  <LinkIcon className="w-3 h-3 mr-1" />
                  {trade.tokenName} ({trade.tokenSymbol})
                </div>
              </div>
              
              <div className="text-sm text-dream-foreground/70 mb-1">
                {trade.type === 'buy' 
                  ? `Purchased ${trade.quantity.toLocaleString(undefined, {maximumFractionDigits: 2})} tokens @ ${trade.price.toFixed(6)}` 
                  : `Sold ${trade.quantity.toLocaleString(undefined, {maximumFractionDigits: 2})} tokens @ ${trade.price.toFixed(6)}`
                }
              </div>
              
              <div className="text-xs text-dream-foreground/60 mb-2">
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDistanceToNow(new Date(trade.timestamp), { addSuffix: true })}
                  {trade.username && <span className="ml-1">by {trade.username}</span>}
                </div>
              </div>
            </div>
          </Link>
        ))}
        
        {trades.length > visibleCount && (
          <div className="text-center pt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={showMore}
              className="text-xs bg-dream-background/40 hover:bg-dream-accent1/10"
            >
              Show More
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradeActivity;
