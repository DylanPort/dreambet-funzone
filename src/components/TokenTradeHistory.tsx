
import React, { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, ExternalLink, Wallet } from 'lucide-react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';

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
  isInitialMarketBuy?: boolean;
  buyerAddress?: string;
  sellerAddress?: string;  // Added seller address field
  currentPxbValue?: number;
}

const shortenAddress = (address: string) => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

const TokenTradeHistory: React.FC<TokenTradeHistoryProps> = ({
  tokenId
}) => {
  const pxbContext = usePXBPoints();
  const [transactions, setTransactions] = useState<PXBTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTransactions = async () => {
      setLoading(true);
      try {
        if (pxbContext.fetchTokenTransactions) {
          // Fetch PXB transactions for this token
          const txs = await pxbContext.fetchTokenTransactions(tokenId);
          setTransactions(txs || []);
        }
      } catch (error) {
        console.error("Error fetching PXB token trades:", error);
      } finally {
        setLoading(false);
      }
    };
    loadTransactions();

    // Refresh transactions every 30 seconds
    const interval = setInterval(loadTransactions, 30000);
    return () => clearInterval(interval);
  }, [tokenId, pxbContext.fetchTokenTransactions]);

  return <div className="space-y-4 max-h-96 overflow-y-auto">
      {loading && <div className="text-center py-8 text-dream-foreground/70">
          <p>Loading PXB transaction history...</p>
        </div>}
      
      {!loading && transactions.length === 0 ? <div className="text-center py-8 text-dream-foreground/70">
          <p>No PXB trade history available for this token yet.</p>
          <p className="text-sm mt-2">Be the first to trade this token with PXB points!</p>
        </div> : transactions.map((trade, index) => <div key={`${trade.id}-${index}`} className="glass-panel border border-dream-accent1/20 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                {trade.type === 'buy' ? <ArrowUpRight className="w-4 h-4 text-green-400 mr-2" /> : <ArrowDownRight className="w-4 h-4 text-red-400 mr-2" />}
                <span className={`font-semibold ${trade.type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                  {trade.isInitialMarketBuy ? 'Initial Market Buy' : trade.type === 'buy' ? 'Buy' : 'Sell'}
                </span>
              </div>
              <span className="text-xs text-dream-foreground/70">
                {formatDistanceToNow(new Date(trade.timestamp), {
                  addSuffix: true
                })}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm mb-2">
              <div>
                <div className="text-dream-foreground/70">PXB Spent</div>
                <div className="font-medium">{formatAmount(trade.pxbAmount)} PXB</div>
              </div>
              <div>
                <div className="text-dream-foreground/70">Current PXB Value</div>
                <div className="font-medium">{formatAmount(trade.currentPxbValue || trade.pxbAmount)} PXB</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs bg-black/20 p-2 rounded">
              <div className="flex items-center">
                <Wallet className="w-3 h-3 mr-1 text-dream-foreground/60" />
                <span className="text-dream-foreground/70">
                  {trade.type === 'buy' ? 'Buyer: ' : 'Seller: '}
                  {shortenAddress(trade.type === 'buy' ? 
                    (trade.buyerAddress || trade.userId) : 
                    (trade.sellerAddress || trade.userId))}
                </span>
              </div>
              <div className={`font-medium ${trade.type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                {trade.type.charAt(0).toUpperCase() + trade.type.slice(1)}
              </div>
            </div>
          </div>)}
    </div>;
};

export default TokenTradeHistory;
