
import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from '@/integrations/supabase/client';

interface TokenTransaction {
  id: string;
  timestamp: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  pxbamount: number;
  userid: string;
  tokenid: string;
  tokenname: string;
  tokensymbol: string;
}

interface TokenTransactionsProps {
  tokenId: string;
}

const TokenTransactions: React.FC<TokenTransactionsProps> = ({ tokenId }) => {
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  
  useEffect(() => {
    const loadTransactions = async () => {
      if (!tokenId) return;
      
      try {
        setLoading(true);
        
        // Fetch transactions directly from Supabase
        const { data, error } = await supabase
          .from('token_transactions')
          .select('*')
          .eq('tokenid', tokenId)
          .order('timestamp', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        // Ensure we cast the type field to 'buy' | 'sell' to match our interface
        const typedTransactions = data?.map(tx => ({
          ...tx,
          type: tx.type === 'buy' ? 'buy' : 'sell' // Ensure the type is either 'buy' or 'sell'
        })) as TokenTransaction[];
        
        setTransactions(typedTransactions || []);
        console.log("Fetched token transactions:", typedTransactions);
      } catch (error) {
        console.error('Error loading token transactions:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadTransactions();
    
    // Set up real-time subscription to token transactions
    const channel = supabase
      .channel('token_transactions_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'token_transactions',
        filter: `tokenid=eq.${tokenId}`
      }, (payload) => {
        console.log('Real-time update to token transactions:', payload);
        loadTransactions();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [tokenId]);
  
  const filteredTransactions = transactions.filter(tx => {
    if (activeTab === 'all') return true;
    if (activeTab === 'buys') return tx.type === 'buy';
    if (activeTab === 'sells') return tx.type === 'sell';
    return true;
  });
  
  const getTotalVolume = () => {
    return transactions.reduce((total, tx) => total + (tx.pxbamount || 0), 0);
  };
  
  const getBuyCount = () => {
    return transactions.filter(tx => tx.type === 'buy').length;
  };
  
  const getSellCount = () => {
    return transactions.filter(tx => tx.type === 'sell').length;
  };
  
  const formatPXBAmount = (amount: number) => {
    return Math.round(amount).toLocaleString();
  };
  
  const getHeatLevel = () => {
    const count = transactions.length;
    if (count > 50) return 'Extreme';
    if (count > 20) return 'High';
    if (count > 10) return 'Medium';
    if (count > 0) return 'Low';
    return 'None';
  };
  
  const getHeatLevelClass = () => {
    const count = transactions.length;
    if (count > 50) return 'text-red-500';
    if (count > 20) return 'text-orange-500';
    if (count > 10) return 'text-yellow-500';
    if (count > 0) return 'text-blue-500';
    return 'text-gray-500';
  };
  
  if (loading) {
    return (
      <Card className="glass-panel p-6 mb-8">
        <CardHeader>
          <CardTitle>Token Transactions</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-dream-accent2" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="glass-panel p-6 mb-8">
      <CardHeader>
        <CardTitle>Token Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-black/20 p-4 rounded-lg">
            <div className="text-sm text-dream-foreground/70">Total Volume</div>
            <div className="text-xl font-bold">{formatPXBAmount(getTotalVolume())} PXB</div>
          </div>
          <div className="bg-black/20 p-4 rounded-lg">
            <div className="text-sm text-dream-foreground/70">Buy Count</div>
            <div className="text-xl font-bold text-green-500">{getBuyCount()}</div>
          </div>
          <div className="bg-black/20 p-4 rounded-lg">
            <div className="text-sm text-dream-foreground/70">Sell Count</div>
            <div className="text-xl font-bold text-red-500">{getSellCount()}</div>
          </div>
          <div className="bg-black/20 p-4 rounded-lg">
            <div className="text-sm text-dream-foreground/70">Heat Level</div>
            <div className={`text-xl font-bold ${getHeatLevelClass()}`}>{getHeatLevel()}</div>
          </div>
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="all" className="flex-1">All ({transactions.length})</TabsTrigger>
            <TabsTrigger value="buys" className="flex-1">Buys ({getBuyCount()})</TabsTrigger>
            <TabsTrigger value="sells" className="flex-1">Sells ({getSellCount()})</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="space-y-4 mt-4 max-h-[400px] overflow-y-auto pr-2">
            {filteredTransactions.length > 0 ? filteredTransactions.map(tx => (
              <div key={tx.id} className="bg-black/10 border border-white/5 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <div className="flex items-center">
                    {tx.type === 'buy' ? (
                      <ArrowUp className="text-green-500 mr-2 h-4 w-4" />
                    ) : (
                      <ArrowDown className="text-red-500 mr-2 h-4 w-4" />
                    )}
                    <span className={tx.type === 'buy' ? 'text-green-500' : 'text-red-500'}>
                      {tx.type.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm text-dream-foreground/70 mt-1">
                    {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                  </div>
                </div>
                <div>
                  <div className="text-right font-medium">
                    {formatPXBAmount(tx.pxbamount)} PXB
                  </div>
                  <div className="text-sm text-dream-foreground/70 mt-1">
                    {tx.quantity.toLocaleString()} tokens @ {tx.price.toFixed(6)}
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-6 text-dream-foreground/50">No transactions found</div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TokenTransactions;
