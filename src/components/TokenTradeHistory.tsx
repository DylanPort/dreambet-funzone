
import React, { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, ExternalLink, Clock, DollarSign, User, Hash } from 'lucide-react';
import { usePXBPoints } from '@/contexts/pxb/PXBPointsContext';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

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
  username?: string;
}

const TokenTradeHistory: React.FC<TokenTradeHistoryProps> = ({ tokenId }) => {
  const pxbContext = usePXBPoints();
  const [transactions, setTransactions] = useState<PXBTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  useEffect(() => {
    const loadTransactions = async () => {
      setLoading(true);
      try {
        // Fetch all transactions for this token from Supabase
        const { data: tokenTxs, error } = await supabase
          .from('token_transactions')
          .select(`
            id, 
            type, 
            price, 
            timestamp, 
            quantity, 
            pxbamount, 
            userid, 
            tokenid, 
            tokenname, 
            tokensymbol,
            users (username)
          `)
          .eq('tokenid', tokenId)
          .order('timestamp', { ascending: false });
        
        if (error) {
          console.error("Error fetching token transactions:", error);
          throw error;
        }
        
        // Transform to the format needed by the component
        const txs = tokenTxs.map(tx => ({
          id: tx.id,
          timestamp: tx.timestamp,
          type: tx.type,
          tokenAmount: tx.quantity,
          price: tx.price,
          pxbAmount: tx.pxbamount,
          userId: tx.userid,
          tokenId: tx.tokenid,
          tokenName: tx.tokenname,
          tokenSymbol: tx.tokensymbol,
          username: tx.users?.username
        }));
        
        setTransactions(txs);
      } catch (error) {
        console.error("Error loading token trade history:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
    
    // Refresh transactions every 5 seconds (reduced from 30 seconds)
    const interval = setInterval(loadTransactions, 5000);
    return () => clearInterval(interval);
  }, [tokenId]);

  const renderTableView = () => (
    <div className="w-full overflow-auto">
      <Table className="w-full">
        <TableHeader>
          <TableRow className="border-b border-dream-accent1/20">
            <TableHead className="text-dream-foreground/70">Type</TableHead>
            <TableHead className="text-dream-foreground/70">Price</TableHead>
            <TableHead className="text-dream-foreground/70">Amount</TableHead>
            <TableHead className="text-dream-foreground/70">PXB</TableHead>
            <TableHead className="text-dream-foreground/70">Trader</TableHead>
            <TableHead className="text-dream-foreground/70 text-right">Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((trade) => (
            <TableRow 
              key={trade.id} 
              className="border-b border-dream-accent1/10 hover:bg-dream-accent1/5"
            >
              <TableCell>
                <div className="flex items-center">
                  {trade.type === 'buy' ? (
                    <ArrowUpRight className="w-4 h-4 text-green-400 mr-2" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-400 mr-2" />
                  )}
                  <span className={trade.type === 'buy' ? 'text-green-400' : 'text-red-400'}>
                    {trade.type === 'buy' ? 'Buy' : 'Sell'}
                  </span>
                </div>
              </TableCell>
              <TableCell>${formatPrice(trade.price)}</TableCell>
              <TableCell>{formatAmount(trade.tokenAmount)}</TableCell>
              <TableCell>{formatAmount(trade.pxbAmount)} PXB</TableCell>
              <TableCell className="truncate max-w-[100px]">
                {trade.username || trade.userId.substring(0, 6) + '...'}
              </TableCell>
              <TableCell className="text-right text-xs text-dream-foreground/60">
                {formatDistanceToNow(new Date(trade.timestamp), { addSuffix: true })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const renderCardView = () => (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {transactions.map((trade, index) => (
        <div key={`${trade.id}-${index}`} className="glass-panel border border-dream-accent1/20 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              {trade.type === 'buy' ? (
                <ArrowUpRight className="w-4 h-4 text-green-400 mr-2" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-400 mr-2" />
              )}
              <span className={`font-semibold ${trade.type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                {trade.type === 'buy' ? 'Buy' : 'Sell'}
              </span>
            </div>
            <span className="text-xs text-dream-foreground/70">
              {formatDistanceToNow(new Date(trade.timestamp), { addSuffix: true })}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-dream-foreground/70">Amount</div>
              <div className="font-medium">{formatAmount(trade.tokenAmount)}</div>
            </div>
            <div>
              <div className="text-dream-foreground/70">Price</div>
              <div className="font-medium">${formatPrice(trade.price)}</div>
            </div>
            <div>
              <div className="text-dream-foreground/70">PXB Spent</div>
              <div className="font-medium">{formatAmount(trade.pxbAmount)} PXB</div>
            </div>
            <div>
              <div className="text-dream-foreground/70">Trader</div>
              <div className="font-medium truncate">
                {trade.username || trade.userId.substring(0, 6) + '...'}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-display font-semibold">Trade History</h3>
        <div className="flex space-x-2">
          <button 
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1 rounded-md text-sm ${viewMode === 'cards' 
              ? 'bg-dream-accent2/20 text-dream-accent2' 
              : 'bg-transparent text-dream-foreground/50 hover:text-dream-foreground'}`}
          >
            Cards
          </button>
          <button 
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 rounded-md text-sm ${viewMode === 'table' 
              ? 'bg-dream-accent2/20 text-dream-accent2' 
              : 'bg-transparent text-dream-foreground/50 hover:text-dream-foreground'}`}
          >
            Table
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8 text-dream-foreground/70">
          <div className="inline-block w-6 h-6 border-2 border-dream-accent2 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p>Loading transaction history...</p>
        </div>
      )}
      
      {!loading && transactions.length === 0 ? (
        <div className="text-center py-8 text-dream-foreground/70">
          <p>No trade history available for this token yet.</p>
          <p className="text-sm mt-2">Be the first to trade this token with PXB points!</p>
        </div>
      ) : (
        viewMode === 'cards' ? renderCardView() : renderTableView()
      )}
    </div>
  );
};

export default TokenTradeHistory;
