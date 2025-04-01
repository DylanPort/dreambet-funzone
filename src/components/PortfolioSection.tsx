
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { usePXBPoints } from '@/contexts/pxb/PXBPointsContext';
import { ArrowUpRight, ArrowDownRight, RefreshCw, Wallet, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { fetchDexScreenerData } from '@/services/dexScreenerService';
import { subscribeToTokenMetric } from '@/services/tokenDataCache';
import { Link } from 'react-router-dom';

interface PortfolioToken {
  id: string;
  tokenid: string;
  tokenname: string;
  tokensymbol: string;
  quantity: number;
  averagepurchaseprice: number;
  currentvalue: number;
  lastupdated: string;
}

const PortfolioSection = () => {
  const { userProfile } = usePXBPoints();
  const [portfolio, setPortfolio] = useState<PortfolioToken[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [totalInvestment, setTotalInvestment] = useState<number>(0);
  const [totalPnL, setTotalPnL] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Helper function to format currency
  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'N/A';
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!userProfile) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('token_portfolios')
          .select('*')
          .eq('userid', userProfile.id)
          .order('currentvalue', { ascending: false });
          
        if (error) throw error;
        
        setPortfolio(data || []);
        
        // Calculate totals
        let investmentTotal = 0;
        let valueTotal = 0;
        
        if (data) {
          data.forEach(token => {
            const investment = token.quantity * token.averagepurchaseprice;
            investmentTotal += investment;
            valueTotal += token.currentvalue;
          });
        }
        
        setTotalInvestment(investmentTotal);
        setTotalValue(valueTotal);
        setTotalPnL(valueTotal - investmentTotal);
      } catch (error) {
        console.error('Error fetching portfolio:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPortfolio();
  }, [userProfile]);
  
  const refreshPortfolioValues = async () => {
    if (!userProfile || portfolio.length === 0) return;
    
    setIsRefreshing(true);
    try {
      let updatedPortfolio = [...portfolio];
      let newValueTotal = 0;
      let newInvestmentTotal = 0;
      
      for (const token of portfolio) {
        try {
          const data = await fetchDexScreenerData(token.tokenid);
          
          if (data && data.priceUsd) {
            const newValue = token.quantity * data.priceUsd;
            const investment = token.quantity * token.averagepurchaseprice;
            
            // Update token in database
            await supabase
              .from('token_portfolios')
              .update({ 
                currentvalue: newValue,
                lastupdated: new Date().toISOString()
              })
              .eq('id', token.id);
              
            // Update local state
            const index = updatedPortfolio.findIndex(t => t.id === token.id);
            if (index >= 0) {
              updatedPortfolio[index] = {
                ...updatedPortfolio[index],
                currentvalue: newValue
              };
            }
            
            newValueTotal += newValue;
            newInvestmentTotal += investment;
          }
        } catch (error) {
          console.error(`Error updating ${token.tokensymbol}:`, error);
        }
      }
      
      setPortfolio(updatedPortfolio);
      setTotalValue(newValueTotal);
      setTotalInvestment(newInvestmentTotal);
      setTotalPnL(newValueTotal - newInvestmentTotal);
    } catch (error) {
      console.error('Error refreshing portfolio:', error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wallet className="mr-2 h-5 w-5" />
            Token Portfolio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-dream-accent2 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!userProfile) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wallet className="mr-2 h-5 w-5" />
            Token Portfolio
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6">
          <p className="text-dream-foreground/70 mb-2">Connect your wallet to view your portfolio</p>
        </CardContent>
      </Card>
    );
  }
  
  if (portfolio.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wallet className="mr-2 h-5 w-5" />
            Token Portfolio
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6">
          <p className="text-dream-foreground/70 mb-2">You don't have any tokens in your portfolio</p>
          <p className="text-sm text-dream-foreground/50">Visit a token page to start trading with PXB points</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <Wallet className="mr-2 h-5 w-5" />
          Token Portfolio
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshPortfolioValues}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Updating...' : 'Refresh'}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Portfolio Summary */}
          <div className="flex flex-col sm:flex-row sm:justify-between gap-4 p-4 bg-black/20 rounded-lg">
            <div>
              <div className="text-sm text-dream-foreground/60">Total Value</div>
              <div className="text-xl font-semibold">{formatCurrency(totalValue)} PXB</div>
            </div>
            <div>
              <div className="text-sm text-dream-foreground/60">Total P&L</div>
              <div className={`text-xl font-semibold flex items-center ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalPnL >= 0 ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                {formatCurrency(totalPnL)} PXB
                <span className="text-sm ml-1">
                  ({totalInvestment > 0 ? ((totalPnL / totalInvestment) * 100).toFixed(2) : 0}%)
                </span>
              </div>
            </div>
          </div>
          
          {/* Token List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {portfolio.map(token => {
              const investment = token.quantity * token.averagepurchaseprice;
              const pnl = token.currentvalue - investment;
              const pnlPercentage = investment > 0 ? (pnl / investment) * 100 : 0;
              
              return (
                <Link
                  key={token.id}
                  to={`/token/${token.tokenid}`}
                  className="block transition-transform hover:scale-[1.01]"
                >
                  <div className="border border-dream-foreground/10 hover:border-dream-foreground/30 rounded-lg p-4">
                    <div className="flex justify-between mb-1">
                      <div className="font-medium flex items-center">
                        {token.tokensymbol}
                        <span className="text-xs text-dream-foreground/50 ml-2">
                          {token.quantity.toFixed(6)}
                        </span>
                      </div>
                      <div className={pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {formatCurrency(token.currentvalue)} PXB
                      </div>
                    </div>
                    
                    <div className="text-xs text-dream-foreground/60 flex justify-between mb-2">
                      <div>Buy avg: ${token.averagepurchaseprice.toFixed(6)}</div>
                      <div className="flex items-center">
                        {pnl >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                        {formatCurrency(pnl)} ({pnlPercentage.toFixed(2)}%)
                      </div>
                    </div>
                    
                    <Progress 
                      value={50 + (pnlPercentage > 100 ? 50 : pnlPercentage < -100 ? -50 : pnlPercentage / 2)} 
                      className="h-1" 
                      indicatorClassName={pnl >= 0 ? "bg-green-500" : "bg-red-500"}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioSection;
