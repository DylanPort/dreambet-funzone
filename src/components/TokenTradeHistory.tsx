
import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { usePumpPortal } from '@/hooks/usePumpPortal';
import { ArrowUpRight, ArrowDownRight, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatLargeNumber } from '@/utils/formatters';

interface TokenTradeHistoryProps {
  tokenId: string;
}

const TokenTradeHistory: React.FC<TokenTradeHistoryProps> = ({ tokenId }) => {
  const { recentTrades, isConnected, recentRawTrades } = usePumpPortal(tokenId);
  const [trades, setTrades] = useState<any[]>([]);

  useEffect(() => {
    if (tokenId) {
      // Filter raw trades to only show those for the current token
      const tokenTrades = recentRawTrades
        .filter(trade => trade.mint === tokenId)
        .map(trade => ({
          type: trade.txType,
          amount: trade.tokenAmount,
          price: trade.pricePerToken,
          solAmount: trade.solAmount,
          trader: trade.traderPublicKey 
            ? `${trade.traderPublicKey.substring(0, 4)}...${trade.traderPublicKey.substring(trade.traderPublicKey.length - 4)}`
            : 'Unknown',
          timestamp: trade.timestamp || new Date().toISOString(),
          signature: trade.signature
        }));
      
      // Add trades from recentTrades if available
      if (recentTrades && recentTrades.length > 0) {
        const formattedTrades = recentTrades.map(trade => ({
          type: trade.side,
          amount: trade.amount,
          price: trade.price,
          solAmount: trade.price * trade.amount,
          trader: trade.side === 'buy' 
            ? (trade.buyer ? `${trade.buyer.substring(0, 4)}...${trade.buyer.substring(trade.buyer.length - 4)}` : 'Unknown')
            : (trade.seller ? `${trade.seller.substring(0, 4)}...${trade.seller.substring(trade.seller.length - 4)}` : 'Unknown'),
          timestamp: trade.timestamp,
          signature: ''
        }));
        
        // Combine both types of trades
        const allTrades = [...tokenTrades, ...formattedTrades];
        
        // Sort by timestamp (newest first)
        allTrades.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        // Remove duplicates (based on timestamp + type + amount)
        const uniqueTrades = allTrades.filter((trade, index, self) =>
          index === self.findIndex(t => (
            t.timestamp === trade.timestamp && 
            t.type === trade.type && 
            t.amount === trade.amount
          ))
        );
        
        setTrades(uniqueTrades.slice(0, 50)); // Limit to 50 trades
      } else {
        setTrades(tokenTrades.slice(0, 50));
      }
    }
  }, [tokenId, recentTrades, recentRawTrades]);

  const formatPrice = (price: number) => {
    if (price < 0.000001) return price.toExponential(4);
    if (price < 0.0001) return price.toFixed(8);
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    return price.toFixed(2);
  };

  if (!isConnected) {
    return (
      <div className="text-center py-4">
        <p className="text-dream-foreground/60">Connecting to PumpPortal...</p>
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-dream-foreground/60">No trade history available.</p>
        <p className="text-dream-foreground/40 text-sm">Trades will appear here as they happen.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
      {trades.map((trade, index) => (
        <div 
          key={`${trade.timestamp}-${trade.type}-${trade.amount}-${index}`}
          className={`p-3 rounded-md border ${
            trade.type === 'buy' ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'
          } transition-all hover:bg-black/20`}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className={`p-1 rounded-full ${trade.type === 'buy' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                {trade.type === 'buy' ? <ArrowUpRight className="w-4 h-4 text-green-400" /> : <ArrowDownRight className="w-4 h-4 text-red-400" />}
              </div>
              <span className={`font-medium ${trade.type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                {trade.type === 'buy' ? 'Buy' : 'Sell'}
              </span>
            </div>
            <div className="text-xs text-dream-foreground/60">
              {formatDistanceToNow(new Date(trade.timestamp), { addSuffix: true })}
            </div>
          </div>
          
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div>
              <div className="text-xs text-dream-foreground/60">Amount</div>
              <div className="font-medium">{Number(trade.amount).toLocaleString()} tokens</div>
            </div>
            <div>
              <div className="text-xs text-dream-foreground/60">Price</div>
              <div className="font-medium">${formatPrice(trade.price)}</div>
            </div>
            <div>
              <div className="text-xs text-dream-foreground/60">Total</div>
              <div className="font-medium">{formatLargeNumber(trade.solAmount)} SOL</div>
            </div>
            <div>
              <div className="text-xs text-dream-foreground/60">Trader</div>
              <div className="font-medium text-dream-accent2">{trade.trader}</div>
            </div>
          </div>
          
          {trade.signature && (
            <div className="mt-2 text-right">
              <a 
                href={`https://solscan.io/tx/${trade.signature}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs text-dream-accent2 flex items-center justify-end hover:underline"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                View transaction
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default TokenTradeHistory;
