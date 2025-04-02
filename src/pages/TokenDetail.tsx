
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { AnimatePresence, motion } from 'framer-motion';

// UI Components
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

// Icons
import { ArrowLeft, ArrowUp, ArrowDown, Copy, Zap, ExternalLink, AlertTriangle, Clock, Hourglass, ChevronDown, ChevronUp, Ban, ShieldCheck, Globe, Search, BarChart4, Sparkles, ListFilter } from 'lucide-react';

// Custom components
import TokenComments from '@/components/TokenComments';
import PriceChart from '@/components/PriceChart';
import WalletConnectButton from '@/components/WalletConnectButton';
import BetCard from '@/components/BetCard';
import CountdownTimer from '@/components/CountdownTimer';
import TokenMarketCap from '@/components/TokenMarketCap';
import TokenVolume from '@/components/TokenVolume';

// Contexts and hooks
import { usePXBPoints } from '@/contexts/pxb/PXBPointsContext';
import { useSolanaBalance } from '@/hooks/useSolanaBalance';

// Services
import { fetchTokenMetrics, TokenMetrics } from '@/services/tokenDataCache';
import { useEffect as useEffectOriginal } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Types
import { Bet, BetPrediction } from '@/types/bet';
import { PXBBet } from '@/types/pxb';

const TokenDetail = () => {
  const { tokenId } = useParams();
  const navigate = useNavigate();
  const { publicKey, connected } = useWallet();
  const { balance, isLoading, error } = useSolanaBalance();
  const { userProfile, mintPoints, placeBet, userBets, fetchUserBets, addPointsToUser } = usePXBPoints();

  // State variables
  const [token, setToken] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokenBets, setTokenBets] = useState<Bet[]>([]);
  const [tokenMetrics, setTokenMetrics] = useState<TokenMetrics | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [betAmount, setBetAmount] = useState(0.1);
  const [betPrediction, setBetPrediction] = useState<BetPrediction>('up');
  const [betDuration, setBetDuration] = useState(3600 * 24); // 24 hours in seconds
  const [creatingBet, setCreatingBet] = useState(false);
  const [pxbBetAmount, setPxbBetAmount] = useState(100);
  const [pxbPrediction, setPxbPrediction] = useState<'up' | 'down'>('up');
  const [pxbPercentageChange, setPxbPercentageChange] = useState(10);
  const [pxbDuration, setPxbDuration] = useState(60); // 60 minutes
  const [placingPxbBet, setPlacingPxbBet] = useState(false);
  const [betTabView, setBetTabView] = useState('all');

  // Fetch token data on component mount
  useEffect(() => {
    const loadTokenData = async () => {
      if (!tokenId) return;
      
      try {
        setLoading(true);
        
        // Fetch token details from Supabase
        const { data: tokenData, error: tokenError } = await supabase
          .from('tokens')
          .select('*')
          .eq('token_mint', tokenId)
          .maybeSingle();
          
        if (tokenError) throw tokenError;
        setToken(tokenData);
        
        // Fetch token bets from Supabase
        const { data: bets, error: betsError } = await supabase
          .from('bets')
          .select('*')
          .eq('token_mint', tokenId)
          .order('created_at', { ascending: false });
          
        if (betsError) throw betsError;
        
        // Transform the bets to match our frontend Bet type
        const transformedBets = bets.map(bet => ({
          id: bet.bet_id,
          tokenId: bet.token_mint,
          tokenName: bet.token_name || 'Unknown Token',
          tokenSymbol: bet.token_symbol || 'UNKNOWN',
          tokenMint: bet.token_mint,
          initiator: bet.creator || 'Unknown',
          counterParty: bet.bettor2_id || undefined,
          amount: bet.sol_amount,
          prediction: bet.prediction_bettor1 as BetPrediction,
          timestamp: new Date(bet.created_at).getTime(),
          expiresAt: new Date(bet.created_at).getTime() + (bet.duration * 1000),
          status: bet.status as any,
          initialMarketCap: bet.initial_market_cap || undefined,
          currentMarketCap: bet.current_market_cap || undefined,
          duration: bet.duration,
          winner: bet.winner || undefined,
          onChainBetId: bet.on_chain_id || undefined,
          transactionSignature: bet.transaction_signature || undefined,
          outcome: bet.outcome as any || undefined,
          isPXB: false
        }));
        
        setTokenBets(transformedBets);
        
        // Fetch token metrics
        const metrics = await fetchTokenMetrics(tokenId);
        setTokenMetrics(metrics);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading token data:', error);
        setLoading(false);
      }
    };
    
    loadTokenData();
  }, [tokenId]);

  // Convert PXB bets to the Bet format for uniform display
  const convertPXBToBet = useCallback((pxbBet: PXBBet): Bet => {
    return {
      id: pxbBet.id,
      tokenId: tokenId || '',
      tokenName: pxbBet.tokenName,
      tokenSymbol: pxbBet.tokenSymbol,
      tokenMint: pxbBet.tokenMint,
      initiator: pxbBet.creator || pxbBet.userId || '',
      amount: pxbBet.betAmount,
      prediction: pxbBet.betType as BetPrediction,
      timestamp: Date.parse(pxbBet.createdAt),
      expiresAt: Date.parse(pxbBet.expiresAt),
      status: pxbBet.status,
      initialMarketCap: pxbBet.initialMarketCap || 0,
      currentMarketCap: pxbBet.currentMarketCap || 0,
      duration: pxbBet.timeframe ? pxbBet.timeframe * 60 : 3600, // Convert minutes to seconds
      isPXB: true,
      percentageChange: pxbBet.percentageChange,
      pointsWon: pxbBet.pointsWon
    };
  }, [tokenId]);

  // Combine Solana bets and PXB bets into a unified array
  const allBets = useCallback(() => {
    const pxbBets = userBets 
      ? userBets
          .filter(bet => bet.tokenMint === token?.token_mint)
          .map(convertPXBToBet)
      : [];
    
    const combinedBets = [...tokenBets, ...pxbBets];
    
    // Sort by most recent first
    return combinedBets.sort((a, b) => b.timestamp - a.timestamp);
  }, [tokenBets, userBets, token, convertPXBToBet]);

  // Filter bets based on tab selection
  const filteredBets = useCallback(() => {
    const bets = allBets();
    
    if (betTabView === 'pxb') {
      return bets.filter(bet => bet.isPXB);
    } else if (betTabView === 'solana') {
      return bets.filter(bet => !bet.isPXB);
    }
    
    return bets;
  }, [allBets, betTabView]);

  // Handle bet creation
  const handleCreateBet = async () => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet to create a bet');
      return;
    }
    
    if (!token) {
      toast.error('Token data not available');
      return;
    }
    
    if (betAmount <= 0) {
      toast.error('Bet amount must be greater than 0');
      return;
    }
    
    try {
      setCreatingBet(true);
      
      // Create bet in Supabase
      const { data, error } = await supabase
        .from('bets')
        .insert({
          token_mint: token.token_mint,
          token_name: token.token_name,
          token_symbol: token.token_symbol,
          creator: publicKey.toString(),
          prediction_bettor1: betPrediction,
          sol_amount: betAmount,
          duration: betDuration,
          status: 'open'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Transform the new bet to match our frontend Bet type
      const newBet: Bet = {
        id: data.bet_id,
        tokenId: data.token_mint,
        tokenName: data.token_name || 'Unknown Token',
        tokenSymbol: data.token_symbol || 'UNKNOWN',
        tokenMint: data.token_mint,
        initiator: data.creator || 'Unknown',
        amount: data.sol_amount,
        prediction: data.prediction_bettor1 as BetPrediction,
        timestamp: new Date(data.created_at).getTime(),
        expiresAt: new Date(data.created_at).getTime() + (data.duration * 1000),
        status: data.status as any,
        duration: data.duration,
        isPXB: false
      };
      
      setTokenBets(prev => [newBet, ...prev]);
      toast.success('Bet created successfully!');
      
      // Refresh token bets
      const { data: updatedBets, error: betsError } = await supabase
        .from('bets')
        .select('*')
        .eq('token_mint', token.token_mint)
        .order('created_at', { ascending: false });
        
      if (!betsError && updatedBets) {
        // Transform the bets to match our frontend Bet type
        const transformedBets = updatedBets.map(bet => ({
          id: bet.bet_id,
          tokenId: bet.token_mint,
          tokenName: bet.token_name || 'Unknown Token',
          tokenSymbol: bet.token_symbol || 'UNKNOWN',
          tokenMint: bet.token_mint,
          initiator: bet.creator || 'Unknown',
          counterParty: bet.bettor2_id || undefined,
          amount: bet.sol_amount,
          prediction: bet.prediction_bettor1 as BetPrediction,
          timestamp: new Date(bet.created_at).getTime(),
          expiresAt: new Date(bet.created_at).getTime() + (bet.duration * 1000),
          status: bet.status as any,
          initialMarketCap: bet.initial_market_cap || undefined,
          currentMarketCap: bet.current_market_cap || undefined,
          duration: bet.duration,
          winner: bet.winner || undefined,
          onChainBetId: bet.on_chain_id || undefined,
          transactionSignature: bet.transaction_signature || undefined,
          outcome: bet.outcome as any || undefined,
          isPXB: false
        }));
        
        setTokenBets(transformedBets);
      }
    } catch (error) {
      console.error('Error creating bet:', error);
      toast.error('Failed to create bet');
    } finally {
      setCreatingBet(false);
    }
  };

  // Handle PXB bet placement
  const handlePXBBetAction = async () => {
    if (!connected || !publicKey || !userProfile) {
      toast.error('Please connect your wallet to place a PXB bet');
      return;
    }
    
    if (!token) {
      toast.error('Token data not available');
      return;
    }
    
    if (pxbBetAmount <= 0) {
      toast.error('Bet amount must be greater than 0');
      return;
    }
    
    if (pxbBetAmount > (userProfile?.pxbPoints || 0)) {
      toast.error('Insufficient PXB points');
      return;
    }
    
    try {
      setPlacingPxbBet(true);
      
      // Use the placeBet function from the PXB context
      const pxbBet = await placeBet(
        token.token_mint,
        token.token_name,
        token.token_symbol,
        pxbBetAmount,
        pxbPrediction,
        pxbPercentageChange,
        pxbDuration * 60 // Convert to seconds
      );
      
      if (pxbBet) {
        toast.success('PXB bet placed successfully!');
        // Fetch user bets to update the UI
        await fetchUserBets();
      }
    } catch (error) {
      console.error('Error placing PXB bet:', error);
      toast.error('Failed to place PXB bet');
    } finally {
      setPlacingPxbBet(false);
    }
  };

  // Handle accepting Solana bets
  const handleAcceptBet = async (bet: Bet) => {
    // Handle accepting the bet logic here
    console.log('Accepting bet:', bet);
    // Implement the logic to accept a bet
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-[200px] w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-[150px]" />
            <Skeleton className="h-[150px]" />
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Token not found</h2>
        <Button onClick={() => navigate('/betting')} variant="outline">
          <ArrowLeft className="mr-2" /> Back to Tokens
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Back button and token info */}
      <div className="mb-6">
        <Button
          onClick={() => navigate('/betting')}
          variant="ghost"
          className="mb-4"
        >
          <ArrowLeft className="mr-2" /> Back to Tokens
        </Button>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              {token.token_name}
              <span className="text-dream-foreground/50">({token.token_symbol})</span>
              
              {token.verified && (
                <ShieldCheck className="h-5 w-5 text-green-500" />
              )}
            </h1>
            
            <div className="flex items-center gap-2 mt-1 text-dream-foreground/70">
              <span className="font-mono text-sm">{token.token_mint}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(token.token_mint);
                  toast.success('Address copied to clipboard');
                }}
                className="hover:text-dream-accent1 transition-colors"
              >
                <Copy className="h-3 w-3" />
              </button>
              
              <a
                href={`https://solscan.io/token/${token.token_mint}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-dream-accent1 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {tokenMetrics?.marketCap && tokenMetrics.marketCap > 0 && (
              <Badge variant="outline" className="text-xs py-1 px-3">
                MCap: ${(tokenMetrics.marketCap / 1000000).toFixed(2)}M
              </Badge>
            )}
            
            {tokenMetrics?.volume24h && tokenMetrics.volume24h > 0 && (
              <Badge variant="outline" className="text-xs py-1 px-3">
                Vol 24h: ${(tokenMetrics.volume24h / 1000).toFixed(2)}K
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      {/* Main tabs */}
      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="bg-transparent border-b border-dream-foreground/10 w-full justify-start rounded-none gap-2 pb-0">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:border-b-2 data-[state=active]:border-dream-accent1 rounded-none px-4 py-2"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="bets"
            className="data-[state=active]:border-b-2 data-[state=active]:border-dream-accent1 rounded-none px-4 py-2"
          >
            Bets
          </TabsTrigger>
          <TabsTrigger
            value="comments"
            className="data-[state=active]:border-b-2 data-[state=active]:border-dream-accent1 rounded-none px-4 py-2"
          >
            Comments
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-6">
          {/* Token metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="backdrop-blur-md bg-black/20 border border-white/10 rounded-xl overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-medium mb-4">Price Chart</h3>
                <PriceChart />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <div className="backdrop-blur-md bg-black/20 border border-white/10 rounded-xl overflow-hidden">
                <div className="p-6">
                  <h3 className="text-lg font-medium mb-4">Market Cap</h3>
                  <TokenMarketCap />
                </div>
              </div>
              
              <div className="backdrop-blur-md bg-black/20 border border-white/10 rounded-xl overflow-hidden">
                <div className="p-6">
                  <h3 className="text-lg font-medium mb-4">Volume</h3>
                  <TokenVolume />
                </div>
              </div>
            </div>
          </div>
          
          {/* Recent Bets Section */}
          <div className="backdrop-blur-md bg-black/20 border border-white/10 rounded-xl overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Recent Bets</h3>
                <Button
                  variant="ghost"
                  onClick={() => setActiveTab('bets')}
                  className="text-dream-accent1 hover:text-dream-accent2"
                >
                  View All
                </Button>
              </div>
              
              <div className="space-y-4">
                {filteredBets().slice(0, 3).map((bet) => (
                  <BetCard
                    key={bet.id}
                    bet={bet}
                    connected={connected}
                    publicKeyString={publicKey?.toString() || null}
                    onAcceptBet={handleAcceptBet}
                  />
                ))}
                
                {filteredBets().length === 0 && (
                  <div className="text-center py-6 text-dream-foreground/60">
                    <p>No bets yet</p>
                    <p className="text-sm mt-2">Be the first to bet on this token!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
        
        {/* Bets Tab */}
        <TabsContent value="bets" className="space-y-6 mt-6">
          {/* Bet creation forms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Solana Bet Form */}
            <div className="backdrop-blur-md bg-black/20 border border-white/10 rounded-xl overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-medium mb-4">Create Solana Bet</h3>
                
                {connected ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-dream-foreground/70 mb-1">
                        Bet Amount (SOL)
                      </label>
                      <div className="flex">
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={betAmount}
                          onChange={(e) => setBetAmount(Number(e.target.value))}
                          className="flex-1 bg-black/30 border border-dream-foreground/20 rounded-l-md p-2 focus:outline-none focus:border-dream-accent1"
                        />
                        <div className="bg-dream-foreground/10 border border-dream-foreground/20 rounded-r-md p-2 text-dream-foreground/70">
                          SOL
                        </div>
                      </div>
                      <div className="text-xs mt-1 text-dream-foreground/50">
                        Balance: {balance ?? 0} SOL
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-dream-foreground/70 mb-1">
                        Your Prediction
                      </label>
                      <div className="flex gap-2">
                        <Button
                          variant={betPrediction === 'up' ? 'default' : 'outline'}
                          className={`flex-1 ${
                            betPrediction === 'up'
                              ? 'bg-green-600 hover:bg-green-700'
                              : ''
                          }`}
                          onClick={() => setBetPrediction('up')}
                        >
                          <ArrowUp className="mr-1" /> MOON
                        </Button>
                        <Button
                          variant={betPrediction === 'down' ? 'default' : 'outline'}
                          className={`flex-1 ${
                            betPrediction === 'down'
                              ? 'bg-red-600 hover:bg-red-700'
                              : ''
                          }`}
                          onClick={() => setBetPrediction('down')}
                        >
                          <ArrowDown className="mr-1" /> DUST
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-dream-foreground/70 mb-1">
                        Bet Duration
                      </label>
                      <div className="flex gap-2">
                        <Button
                          variant={betDuration === 3600 ? 'default' : 'outline'}
                          className="flex-1"
                          onClick={() => setBetDuration(3600)}
                        >
                          1 Hour
                        </Button>
                        <Button
                          variant={betDuration === 3600 * 24 ? 'default' : 'outline'}
                          className="flex-1"
                          onClick={() => setBetDuration(3600 * 24)}
                        >
                          1 Day
                        </Button>
                        <Button
                          variant={betDuration === 3600 * 24 * 7 ? 'default' : 'outline'}
                          className="flex-1"
                          onClick={() => setBetDuration(3600 * 24 * 7)}
                        >
                          1 Week
                        </Button>
                      </div>
                    </div>
                    
                    <Button
                      className="w-full mt-4 bg-gradient-to-r from-dream-accent1 to-dream-accent2 hover:from-dream-accent1/90 hover:to-dream-accent2/90"
                      onClick={handleCreateBet}
                      disabled={creatingBet || betAmount <= 0}
                    >
                      {creatingBet ? 'Creating Bet...' : 'Create Bet'}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-dream-foreground/70 mb-4">
                      Connect your wallet to create a bet
                    </p>
                    <WalletConnectButton />
                  </div>
                )}
              </div>
            </div>
            
            {/* PXB Bet Form */}
            <div className="backdrop-blur-md bg-black/20 border border-white/10 rounded-xl overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-medium mb-4">Place PXB Bet</h3>
                
                {connected && userProfile ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-dream-foreground/70 mb-1">
                        Bet Amount (PXB)
                      </label>
                      <div className="flex">
                        <input
                          type="number"
                          min="10"
                          step="10"
                          value={pxbBetAmount}
                          onChange={(e) => setPxbBetAmount(Number(e.target.value))}
                          className="flex-1 bg-black/30 border border-dream-foreground/20 rounded-l-md p-2 focus:outline-none focus:border-dream-accent1"
                        />
                        <div className="bg-dream-foreground/10 border border-dream-foreground/20 rounded-r-md p-2 text-dream-foreground/70">
                          PXB
                        </div>
                      </div>
                      <div className="text-xs mt-1 text-dream-foreground/50">
                        Balance: {userProfile?.pxbPoints || 0} PXB
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-dream-foreground/70 mb-1">
                        Your Prediction
                      </label>
                      <div className="flex gap-2">
                        <Button
                          variant={pxbPrediction === 'up' ? 'default' : 'outline'}
                          className={`flex-1 ${
                            pxbPrediction === 'up'
                              ? 'bg-green-600 hover:bg-green-700'
                              : ''
                          }`}
                          onClick={() => setPxbPrediction('up')}
                        >
                          <ArrowUp className="mr-1" /> UP
                        </Button>
                        <Button
                          variant={pxbPrediction === 'down' ? 'default' : 'outline'}
                          className={`flex-1 ${
                            pxbPrediction === 'down'
                              ? 'bg-red-600 hover:bg-red-700'
                              : ''
                          }`}
                          onClick={() => setPxbPrediction('down')}
                        >
                          <ArrowDown className="mr-1" /> DOWN
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-dream-foreground/70 mb-1">
                        Percentage Change
                      </label>
                      <div className="flex gap-2">
                        <Button
                          variant={pxbPercentageChange === 5 ? 'default' : 'outline'}
                          className="flex-1"
                          onClick={() => setPxbPercentageChange(5)}
                        >
                          5%
                        </Button>
                        <Button
                          variant={pxbPercentageChange === 10 ? 'default' : 'outline'}
                          className="flex-1"
                          onClick={() => setPxbPercentageChange(10)}
                        >
                          10%
                        </Button>
                        <Button
                          variant={pxbPercentageChange === 20 ? 'default' : 'outline'}
                          className="flex-1"
                          onClick={() => setPxbPercentageChange(20)}
                        >
                          20%
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-dream-foreground/70 mb-1">
                        Bet Duration
                      </label>
                      <div className="flex gap-2">
                        <Button
                          variant={pxbDuration === 60 ? 'default' : 'outline'}
                          className="flex-1"
                          onClick={() => setPxbDuration(60)}
                        >
                          1 Hour
                        </Button>
                        <Button
                          variant={pxbDuration === 60 * 24 ? 'default' : 'outline'}
                          className="flex-1"
                          onClick={() => setPxbDuration(60 * 24)}
                        >
                          1 Day
                        </Button>
                        <Button
                          variant={pxbDuration === 60 * 24 * 7 ? 'default' : 'outline'}
                          className="flex-1"
                          onClick={() => setPxbDuration(60 * 24 * 7)}
                        >
                          1 Week
                        </Button>
                      </div>
                    </div>
                    
                    <Button
                      className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      onClick={handlePXBBetAction}
                      disabled={placingPxbBet || pxbBetAmount <= 0 || pxbBetAmount > (userProfile?.pxbPoints || 0)}
                    >
                      {placingPxbBet ? 'Placing Bet...' : 'Place PXB Bet'}
                    </Button>
                    
                    {/* Mint PXB button */}
                    {userProfile?.pxbPoints === 0 && (
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => mintPoints(1000)}
                        >
                          <Sparkles className="mr-2 h-4 w-4" /> Mint 1000 PXB
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-dream-foreground/70 mb-4">
                      Connect your wallet to place PXB bets
                    </p>
                    <WalletConnectButton />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* All Bets Section */}
          <div className="backdrop-blur-md bg-black/20 border border-white/10 rounded-xl overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-medium">All Bets</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant={betTabView === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setBetTabView('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={betTabView === 'solana' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setBetTabView('solana')}
                  >
                    Solana
                  </Button>
                  <Button
                    variant={betTabView === 'pxb' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setBetTabView('pxb')}
                  >
                    PXB
                  </Button>
                </div>
              </div>
              
              <div className="space-y-5">
                <AnimatePresence>
                  {filteredBets().map((bet, index) => (
                    <motion.div
                      key={bet.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                    >
                      <BetCard
                        bet={bet}
                        connected={connected}
                        publicKeyString={publicKey?.toString() || null}
                        onAcceptBet={handleAcceptBet}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {filteredBets().length === 0 && (
                  <div className="text-center py-8 text-dream-foreground/60">
                    <p>No bets found</p>
                    <p className="text-sm mt-2">Be the first to bet on this token!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
        
        {/* Comments Tab */}
        <TabsContent value="comments" className="space-y-4 mt-6">
          <div className="backdrop-blur-md bg-black/20 border border-white/10 rounded-xl overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Community Comments</h3>
              <TokenComments />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TokenDetail;
