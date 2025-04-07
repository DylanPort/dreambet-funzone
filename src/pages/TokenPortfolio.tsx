
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  Wallet, 
  RefreshCw, 
  DollarSign,
  History
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { formatRelative } from 'date-fns';
import { TokenPortfolio, TokenTransaction } from '@/contexts/pxb/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';

const TokenPortfolioPage = () => {
  const navigate = useNavigate();
  const { connected } = useWallet();
  const { 
    userProfile, 
    tokenPortfolios,
    tokenTransactions,
    fetchTokenPortfolios,
    fetchTokenTransactions,
    isLoadingPortfolios,
    isLoadingTransactions
  } = usePXBPoints();

  useEffect(() => {
    if (connected && userProfile) {
      fetchTokenPortfolios();
      fetchTokenTransactions();
    }
  }, [connected, userProfile, fetchTokenPortfolios, fetchTokenTransactions]);

  const refreshData = () => {
    if (connected && userProfile) {
      fetchTokenPortfolios();
      fetchTokenTransactions();
    }
  };

  // Calculate total portfolio value
  const calculateTotalValue = () => {
    if (!tokenPortfolios || tokenPortfolios.length === 0) return 0;
    return tokenPortfolios.reduce((total, portfolio) => total + portfolio.currentValue, 0);
  };

  // Calculate total profit/loss
  const calculateTotalPnL = () => {
    if (!tokenPortfolios || tokenPortfolios.length === 0) return 0;
    
    const totalInvestment = tokenPortfolios.reduce(
      (total, portfolio) => total + (portfolio.quantity * portfolio.averagePurchasePrice), 
      0
    );
    
    const totalValue = calculateTotalValue();
    return totalValue - totalInvestment;
  };

  if (!connected || !userProfile) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-6">Please connect your wallet to view your token portfolio.</p>
        </div>
      </div>
    );
  }

  const totalValue = calculateTotalValue();
  const totalPnL = calculateTotalPnL();
  const isProfitable = totalPnL >= 0;

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Token Portfolio</h1>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshData}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Portfolio Summary Card */}
        <Card className="p-6 bg-black/20 backdrop-blur-md border-gray-800">
          <h2 className="text-xl font-semibold mb-4">Portfolio Summary</h2>
          
          {isLoadingPortfolios ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : tokenPortfolios && tokenPortfolios.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                  <div className="flex items-center">
                    <Wallet className="h-5 w-5 mr-2 text-gray-400" />
                    <span className="text-gray-300">Total Value</span>
                  </div>
                  <span className="font-medium text-lg">{totalValue.toFixed(2)} PXB</span>
                </div>
                
                <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-gray-400" />
                    <span className="text-gray-300">Profit/Loss</span>
                  </div>
                  <div className="flex items-center">
                    {isProfitable ? (
                      <ArrowUpRight className="h-4 w-4 mr-1 text-green-500" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 mr-1 text-red-500" />
                    )}
                    <span className={isProfitable ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
                      {Math.abs(totalPnL).toFixed(2)} PXB
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                  <div className="flex items-center">
                    <History className="h-5 w-5 mr-2 text-gray-400" />
                    <span className="text-gray-300">Total Assets</span>
                  </div>
                  <span className="font-medium">{tokenPortfolios.length}</span>
                </div>
                
                <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-gray-400" />
                    <span className="text-gray-300">Last Updated</span>
                  </div>
                  <span className="text-sm text-gray-400">
                    {tokenPortfolios.length > 0 
                      ? formatDistanceToNow(
                          new Date(
                            Math.max(...tokenPortfolios.map(p => new Date(p.lastUpdated).getTime()))
                          ), 
                          { addSuffix: true }
                        )
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-400 mb-4">You don't have any tokens in your portfolio yet.</p>
              <Button 
                onClick={() => navigate('/betting')}
                className="bg-green-600 hover:bg-green-700"
              >
                Browse Tokens
              </Button>
            </div>
          )}
        </Card>

        {/* Tabs for Holdings and Transactions */}
        <Tabs defaultValue="holdings" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-900">
            <TabsTrigger value="holdings">Token Holdings</TabsTrigger>
            <TabsTrigger value="transactions">Transaction History</TabsTrigger>
          </TabsList>
          
          {/* Holdings Tab */}
          <TabsContent value="holdings">
            {isLoadingPortfolios ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-64 w-full" />
                ))}
              </div>
            ) : tokenPortfolios && tokenPortfolios.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {tokenPortfolios.map((portfolio: TokenPortfolio) => {
                  const originalInvestment = portfolio.quantity * portfolio.averagePurchasePrice;
                  const pnl = portfolio.currentValue - originalInvestment;
                  const pnlPercentage = (pnl / originalInvestment) * 100;
                  const isProfitable = pnl >= 0;
                  
                  return (
                    <Card 
                      key={portfolio.id} 
                      className="p-4 bg-black/20 backdrop-blur-md border-gray-800 hover:border-gray-600 transition-colors cursor-pointer"
                      onClick={() => navigate(`/token/${portfolio.tokenId}`)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-semibold">{portfolio.tokenName}</h3>
                        <span className="text-sm px-2 py-1 rounded-full bg-gray-800">
                          {portfolio.tokenSymbol}
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">Quantity</span>
                          <span>{portfolio.quantity.toFixed(6)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">Avg. Price</span>
                          <span>{portfolio.averagePurchasePrice.toFixed(8)} PXB</span>
                        </div>
                        
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">Current Value</span>
                          <span className="font-medium">{portfolio.currentValue.toFixed(2)} PXB</span>
                        </div>
                        
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">Profit/Loss</span>
                          <div className="flex items-center">
                            {isProfitable ? (
                              <ArrowUpRight className="h-4 w-4 mr-1 text-green-500" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4 mr-1 text-red-500" />
                            )}
                            <span className={isProfitable ? 'text-green-500' : 'text-red-500'}>
                              {pnl.toFixed(2)} ({Math.abs(pnlPercentage).toFixed(2)}%)
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-2 border-t border-gray-800 text-xs text-gray-500">
                        Last updated {formatDistanceToNow(new Date(portfolio.lastUpdated), { addSuffix: true })}
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 mt-4 border border-gray-800 rounded-lg">
                <p className="text-gray-400">No token holdings found.</p>
              </div>
            )}
          </TabsContent>
          
          {/* Transactions Tab */}
          <TabsContent value="transactions">
            {isLoadingTransactions ? (
              <div className="space-y-4 mt-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : tokenTransactions && tokenTransactions.length > 0 ? (
              <div className="space-y-4 mt-4">
                {tokenTransactions.map((transaction: TokenTransaction) => (
                  <Card 
                    key={transaction.id} 
                    className="p-4 bg-black/20 backdrop-blur-md border-gray-800"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center mb-1">
                          <span className={`text-sm px-2 py-0.5 rounded-full mr-2 ${
                            transaction.type === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {transaction.type === 'buy' ? 'Buy' : 'Sell'}
                          </span>
                          <h3 className="font-medium">{transaction.tokenName} ({transaction.tokenSymbol})</h3>
                        </div>
                        <div className="text-sm text-gray-400">
                          {formatRelative(new Date(transaction.timestamp), new Date())}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {transaction.pxbAmount.toFixed(2)} PXB
                        </div>
                        <div className="text-sm text-gray-400">
                          {transaction.quantity.toFixed(6)} {transaction.tokenSymbol}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 mt-4 border border-gray-800 rounded-lg">
                <p className="text-gray-400">No transaction history found.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TokenPortfolioPage;
