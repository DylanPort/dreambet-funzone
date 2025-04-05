import React, { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, ExternalLink, Wallet } from 'lucide-react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  sellerAddress?: string;
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

  // Calculate percentage change from original PXB amount to current value
  const calculatePercentageChange = (original: number, current: number | undefined): number => {
    if (!current || original === 0) return 0;
    return (current - original) / original * 100;
  };
  return <div className="space-y-4 max-h-96 overflow-y-auto">
      {loading && <div className="text-center py-8 text-dream-foreground/70">
          <p>Loading PXB transaction history...</p>
        </div>}
      
      {!loading && transactions.length === 0 ? <div className="text-center py-8 text-dream-foreground/70">
          <p>No PXB trade history available for this token yet.</p>
          <p className="text-sm mt-2">Be the first to trade this token with PXB points!</p>
        </div> : <Card className="glass-panel border border-dream-accent1/20 rounded-lg">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-lg">PXB Trade History</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-3">
              {transactions.map((trade, index) => <div key={`${trade.id}-${index}`} className="border-t border-dream-accent1/10 pt-3 first:border-t-0 first:pt-0">
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
                      <div className="text-dream-foreground/70 text-xs">PXB Spent</div>
                      <div className="font-medium">{formatAmount(trade.pxbAmount)} PXB</div>
                    </div>
                    
                  </div>
                  
                  <div className="flex items-center justify-between text-xs bg-black/20 p-2 rounded">
                    <div className="flex items-center">
                      <Wallet className="w-3 h-3 mr-1 text-dream-foreground/60" />
                      <span className="text-dream-foreground/70">
                        {trade.type === 'buy' ? 'Buyer: ' : 'Seller: '}
                        {shortenAddress(trade.type === 'buy' ? trade.buyerAddress || trade.userId : trade.sellerAddress || trade.userId)}
                      </span>
                    </div>
                    <div className={`font-medium ${trade.type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                      {trade.type.charAt(0).toUpperCase() + trade.type.slice(1)}
                    </div>
                  </div>
                </div>)}
            </div>
          </CardContent>
        </Card>}
    </div>;
};
export default TokenTradeHistory;