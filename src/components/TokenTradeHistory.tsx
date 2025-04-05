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
  return;
};
export default TokenTradeHistory;