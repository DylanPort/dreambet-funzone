
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, ExternalLink } from 'lucide-react';
import { usePumpPortalWebSocket } from '@/services/pumpPortalWebSocketService';

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

const TokenTradeHistory: React.FC<TokenTradeHistoryProps> = ({ tokenId }) => {
  const pumpPortal = usePumpPortalWebSocket();
  const trades = pumpPortal.recentTrades[tokenId] || [];

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {trades.length === 0 ? (
        <div className="text-center py-8 text-dream-foreground/70">
          <p>No trade history available for this token yet.</p>
          <p className="text-sm mt-2">Trades will appear here in real-time as they happen.</p>
        </div>
      ) : (
        trades.map((trade, index) => (
          <div key={`${trade.timestamp}-${index}`} className="glass-panel border border-dream-accent1/20 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                {trade.side === 'buy' ? (
                  <ArrowUpRight className="w-4 h-4 text-green-400 mr-2" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-400 mr-2" />
                )}
                <span className={`font-semibold ${trade.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                  {trade.side === 'buy' ? 'Buy' : 'Sell'}
                </span>
              </div>
              <span className="text-xs text-dream-foreground/70">
                {formatDistanceToNow(new Date(trade.timestamp), { addSuffix: true })}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-dream-foreground/70">Amount</div>
                <div className="font-medium">{formatAmount(trade.amount)}</div>
              </div>
              <div>
                <div className="text-dream-foreground/70">Price</div>
                <div className="font-medium">${formatPrice(trade.price)}</div>
              </div>
              <div>
                <div className="text-dream-foreground/70">Value</div>
                <div className="font-medium">${formatPrice(trade.price * trade.amount)}</div>
              </div>
              <div>
                <div className="text-dream-foreground/70">Trader</div>
                <div className="font-medium truncate">
                  {trade.side === 'buy' 
                    ? (trade.buyer ? `${trade.buyer.substring(0, 4)}...${trade.buyer.substring(trade.buyer.length - 4)}` : 'Unknown')
                    : (trade.seller ? `${trade.seller.substring(0, 4)}...${trade.seller.substring(trade.seller.length - 4)}` : 'Unknown')
                  }
                </div>
              </div>
            </div>
            
            <div className="mt-2 text-right">
              <a 
                href={`https://solscan.io/tx/${trade.signature || ''}`}
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-dream-accent2 hover:underline text-xs flex items-center justify-end"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                View on Solscan
              </a>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default TokenTradeHistory;
