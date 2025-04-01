
import React, { useState, useEffect, useCallback } from 'react';
import { ArrowUp, ArrowDown, BarChart3, DollarSign, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { usePXBPoints } from '@/contexts/pxb/PXBPointsContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useWallet } from '@solana/wallet-adapter-react';
import { Input } from '@/components/ui/input';

interface TokenTradingPanelProps {
  tokenId: string;
  connected: boolean;
  currentPrice: number;
}

const TokenTradingPanel: React.FC<TokenTradingPanelProps> = ({ tokenId, connected, currentPrice }) => {
  const { userProfile, updateUserPoints, addUserPosition, getUserPositions, userPositions } = usePXBPoints();
  const { toast } = useToast();
  const { publicKey } = useWallet();
  
  const [buyAmount, setBuyAmount] = useState<string>('');
  const [sellAmount, setSellAmount] = useState<string>('');
  const [processing, setProcessing] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<'buy' | 'sell'>('buy');
  const [userTokenBalance, setUserTokenBalance] = useState<number>(0);
  const [averageEntryPrice, setAverageEntryPrice] = useState<number | null>(null);
  const [pnlAmount, setPnlAmount] = useState<number>(0);
  const [pnlPercentage, setPnlPercentage] = useState<number>(0);
  const [positions, setPositions] = useState<any[]>([]);
  
  // Fetch user positions for this token
  useEffect(() => {
    if (userProfile && tokenId) {
      const fetchPositions = async () => {
        const userPositions = await getUserPositions();
        if (userPositions) {
          const tokenPositions = userPositions.filter(pos => pos.tokenId === tokenId);
          setPositions(tokenPositions);
          
          // Calculate total balance and average entry price
          if (tokenPositions.length > 0) {
            const totalTokens = tokenPositions.reduce((sum, pos) => sum + pos.amount, 0);
            setUserTokenBalance(totalTokens);
            
            const weightedSum = tokenPositions.reduce((sum, pos) => sum + (pos.amount * pos.entryPrice), 0);
            const avgEntryPrice = weightedSum / totalTokens;
            setAverageEntryPrice(avgEntryPrice);
            
            // Calculate PnL
            const currentValue = totalTokens * currentPrice;
            const costBasis = totalTokens * avgEntryPrice;
            const pnlValue = currentValue - costBasis;
            setPnlAmount(pnlValue);
            
            const pnlPercent = costBasis > 0 ? (pnlValue / costBasis) * 100 : 0;
            setPnlPercentage(pnlPercent);
          } else {
            setUserTokenBalance(0);
            setAverageEntryPrice(null);
            setPnlAmount(0);
            setPnlPercentage(0);
          }
        }
      };
      
      fetchPositions();
    }
  }, [userProfile, tokenId, currentPrice, getUserPositions]);
  
  // Handle buy token
  const handleBuyToken = useCallback(async () => {
    if (!connected || !userProfile) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to trade",
        variant: "destructive"
      });
      return;
    }
    
    const amount = parseFloat(buyAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }
    
    // Check if user has enough balance
    const userPointsBalance = userProfile.balance || 0;
    if (amount > userPointsBalance) {
      toast({
        title: "Insufficient balance",
        description: `You only have ${userPointsBalance} PXB available`,
        variant: "destructive"
      });
      return;
    }
    
    setProcessing(true);
    
    try {
      // Calculate token amount based on current price
      const tokenAmount = amount / currentPrice;
      
      // Update user points (deduct the points used for purchase)
      await updateUserPoints(-amount, "Purchased virtual tokens");
      
      // Add position to user's portfolio
      await addUserPosition({
        tokenId,
        amount: tokenAmount,
        entryPrice: currentPrice,
        timestamp: Date.now(),
        cost: amount,
      });
      
      // Update UI
      setUserTokenBalance(prev => prev + tokenAmount);
      
      // Success notification
      toast({
        title: "Trade successful!",
        description: `Purchased ${tokenAmount.toFixed(6)} tokens for ${amount} PXB`,
        variant: "default"
      });
      
      // Reset input
      setBuyAmount('');
    } catch (error) {
      console.error("Error purchasing token:", error);
      toast({
        title: "Transaction failed",
        description: "There was an error processing your trade",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  }, [buyAmount, connected, currentPrice, tokenId, userProfile, toast, updateUserPoints, addUserPosition]);
  
  // Handle sell token
  const handleSellToken = useCallback(async () => {
    if (!connected || !userProfile) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to trade",
        variant: "destructive"
      });
      return;
    }
    
    const tokenAmount = parseFloat(sellAmount);
    if (isNaN(tokenAmount) || tokenAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }
    
    // Check if user has enough token balance
    if (tokenAmount > userTokenBalance) {
      toast({
        title: "Insufficient token balance",
        description: `You only have ${userTokenBalance.toFixed(6)} tokens available`,
        variant: "destructive"
      });
      return;
    }
    
    setProcessing(true);
    
    try {
      // Calculate PXB return based on current price
      const pointsReturn = tokenAmount * currentPrice;
      
      // Update user points (add the points from the sale)
      await updateUserPoints(pointsReturn, "Sold virtual tokens");
      
      // Remove position from user's portfolio (or reduce it)
      // Need to implement position selling logic in the context
      const updatedPositions = await getUserPositions();
      const tokenPositions = updatedPositions.filter(pos => pos.tokenId === tokenId);
      
      // Update UI
      setUserTokenBalance(prev => prev - tokenAmount);
      setPositions(tokenPositions);
      
      // Success notification
      toast({
        title: "Trade successful!",
        description: `Sold ${tokenAmount.toFixed(6)} tokens for ${pointsReturn.toFixed(2)} PXB`,
        variant: "default"
      });
      
      // Reset input
      setSellAmount('');
    } catch (error) {
      console.error("Error selling token:", error);
      toast({
        title: "Transaction failed",
        description: "There was an error processing your trade",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  }, [sellAmount, connected, currentPrice, tokenId, userProfile, userTokenBalance, toast, updateUserPoints, getUserPositions]);

  const formatPrice = (price: number) => {
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    if (price < 1000) return price.toFixed(2);
    return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  return (
    <div className="glass-panel p-6 mb-8">
      <h2 className="text-xl font-display font-bold mb-4">Trade Token</h2>
      
      {userTokenBalance > 0 && (
        <div className="mb-6 p-4 bg-black/30 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Your Position</h3>
            <div className={`text-sm ${pnlPercentage >= 0 ? 'text-green-400' : 'text-red-400'} flex items-center`}>
              {pnlPercentage >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
              {Math.abs(pnlPercentage).toFixed(2)}%
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-dream-foreground/70 mb-1">Balance</div>
              <div>{userTokenBalance.toFixed(6)}</div>
            </div>
            <div>
              <div className="text-dream-foreground/70 mb-1">Avg. Entry</div>
              <div>${averageEntryPrice ? formatPrice(averageEntryPrice) : '0.00'}</div>
            </div>
            <div>
              <div className="text-dream-foreground/70 mb-1">PnL</div>
              <div className={pnlAmount >= 0 ? 'text-green-400' : 'text-red-400'}>
                {pnlAmount >= 0 ? '+' : ''}{pnlAmount.toFixed(2)} PXB
              </div>
            </div>
          </div>
          
          <div className="mt-3">
            <Progress 
              value={pnlPercentage >= 0 ? Math.min(pnlPercentage, 100) : 0} 
              className="h-1.5"
            />
          </div>
        </div>
      )}
      
      <div className="flex mb-4 border-b border-dream-foreground/10">
        <button
          className={`px-4 py-2 flex-1 text-center transition-colors ${selectedTab === 'buy' ? 'border-b-2 border-dream-accent2 text-dream-accent2' : 'text-dream-foreground/50 hover:text-dream-foreground/80'}`}
          onClick={() => setSelectedTab('buy')}
        >
          Buy
        </button>
        <button
          className={`px-4 py-2 flex-1 text-center transition-colors ${selectedTab === 'sell' ? 'border-b-2 border-dream-accent3 text-dream-accent3' : 'text-dream-foreground/50 hover:text-dream-foreground/80'}`}
          onClick={() => setSelectedTab('sell')}
          disabled={userTokenBalance <= 0}
        >
          Sell
        </button>
      </div>
      
      {selectedTab === 'buy' ? (
        <div>
          <div className="mb-4">
            <div className="flex justify-between text-sm text-dream-foreground/70 mb-2">
              <span>Amount (PXB)</span>
              <span>Balance: {userProfile && userProfile.balance ? userProfile.balance.toFixed(2) : '0'} PXB</span>
            </div>
            <div className="flex space-x-2">
              <Input
                type="number"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                placeholder="Enter PXB amount"
                className="bg-black/20 border border-dream-foreground/10"
                min="0"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => userProfile && userProfile.balance && setBuyAmount((userProfile.balance / 2).toString())}
              >
                50%
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => userProfile && userProfile.balance && setBuyAmount(userProfile.balance.toString())}
              >
                Max
              </Button>
            </div>
          </div>
          
          <div className="bg-black/20 p-3 rounded-lg mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-dream-foreground/70">Current Price:</span>
              <span>${formatPrice(currentPrice)}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-dream-foreground/70">You'll Receive:</span>
              <span>
                {!isNaN(parseFloat(buyAmount)) && currentPrice > 0
                  ? (parseFloat(buyAmount) / currentPrice).toFixed(6)
                  : '0.000000'} tokens
              </span>
            </div>
          </div>
          
          <Button
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={handleBuyToken}
            disabled={!connected || processing || !buyAmount || parseFloat(buyAmount) <= 0 || !userProfile}
          >
            {processing ? 'Processing...' : 'Buy Token'}
          </Button>
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <div className="flex justify-between text-sm text-dream-foreground/70 mb-2">
              <span>Amount (Tokens)</span>
              <span>Balance: {userTokenBalance.toFixed(6)} tokens</span>
            </div>
            <div className="flex space-x-2">
              <Input
                type="number"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                placeholder="Enter token amount"
                className="bg-black/20 border border-dream-foreground/10"
                min="0"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSellAmount((userTokenBalance / 2).toString())}
              >
                50%
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSellAmount(userTokenBalance.toString())}
              >
                Max
              </Button>
            </div>
          </div>
          
          <div className="bg-black/20 p-3 rounded-lg mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-dream-foreground/70">Current Price:</span>
              <span>${formatPrice(currentPrice)}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-dream-foreground/70">You'll Receive:</span>
              <span>
                {!isNaN(parseFloat(sellAmount)) && currentPrice > 0
                  ? (parseFloat(sellAmount) * currentPrice).toFixed(2)
                  : '0.00'} PXB
              </span>
            </div>
          </div>
          
          <Button
            className="w-full bg-red-600 hover:bg-red-700"
            onClick={handleSellToken}
            disabled={!connected || processing || !sellAmount || parseFloat(sellAmount) <= 0 || userTokenBalance <= 0}
          >
            {processing ? 'Processing...' : 'Sell Token'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default TokenTradingPanel;
