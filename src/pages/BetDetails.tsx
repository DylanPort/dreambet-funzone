import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Bet, BetPrediction, BetStatus } from '@/types/bet';
import { formatTimeRemaining, formatAddress, formatNumberWithCommas } from '@/utils/betUtils';
import { ArrowUp, ArrowDown, Clock, User, Calendar, ExternalLink, ArrowLeft, Coins, Trophy, Rocket, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { fetchGMGNTokenData, subscribeToGMGNTokenData } from '@/services/gmgnService';

interface PriceChartDataPoint {
  time: string;
  price: number;
}

const BetDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [bet, setBet] = useState<Bet | null>(null);
  const [tokenDetails, setTokenDetails] = useState<any>(null);
  const [chartData, setChartData] = useState<PriceChartDataPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    const fetchBetDetails = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('bets')
          .select(`
            *,
            tokens (*)
          `)
          .eq('bet_id', id)
          .single();
        
        if (error) {
          console.error('Error fetching bet details:', error);
          toast.error('Failed to load bet details');
          return;
        }
        
        if (data) {
          let predictionValue: BetPrediction;
          if (data.prediction_bettor1 === 'up') {
            predictionValue = 'migrate';
          } else if (data.prediction_bettor1 === 'down') {
            predictionValue = 'die';
          } else {
            predictionValue = data.prediction_bettor1 as BetPrediction;
          }
          
          const status = data.status as BetStatus;
          
          let outcomeValue: 'win' | 'loss' | undefined = undefined;
          if (data.outcome === 'win') {
            outcomeValue = 'win';
          } else if (data.outcome === 'loss') {
            outcomeValue = 'loss';
          }
          
          const betData: Bet = {
            id: data.bet_id,
            tokenId: data.token_mint,
            tokenName: data.tokens?.token_name || 'Unknown Token',
            tokenSymbol: data.tokens?.token_symbol || 'UNKNOWN',
            tokenMint: data.token_mint,
            initiator: data.creator,
            counterParty: data.bettor2_id || undefined,
            amount: data.sol_amount,
            prediction: predictionValue,
            timestamp: new Date(data.created_at).getTime(),
            expiresAt: new Date(data.created_at).getTime() + (data.duration * 1000),
            status: status,
            initialMarketCap: data.initial_market_cap,
            currentMarketCap: data.current_market_cap,
            duration: data.duration,
            winner: data.winner,
            onChainBetId: data.on_chain_id,
            transactionSignature: data.transaction_signature,
            outcome: outcomeValue
          };
          
          setBet(betData);
          setTokenDetails(data.tokens);

          if (data.token_mint) {
            fetchTokenChartData(data.token_mint);
          }
        }
      } catch (error) {
        console.error('Error in fetchBetDetails:', error);
        toast.error('An error occurred while loading the bet details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBetDetails();
  }, [id]);

  const fetchTokenChartData = async (tokenMint: string) => {
    setChartLoading(true);
    try {
      const tokenData = await fetchGMGNTokenData(tokenMint);
      console.log('GMGN token data for chart:', tokenData);
      
      if (tokenData.price) {
        const data: PriceChartDataPoint[] = [];
        const now = new Date();
        
        data.push({
          time: now.toISOString(),
          price: tokenData.price
        });
        
        const priorPrice = tokenData.change24h 
          ? tokenData.price / (1 + (tokenData.change24h / 100))
          : tokenData.price * (0.9 + Math.random() * 0.2);
        
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        
        data.unshift({
          time: yesterday.toISOString(),
          price: priorPrice
        });
        
        for (let i = 1; i <= 10; i++) {
          const hoursPast = 24 * (i / 10);
          const intermediateTime = new Date(now);
          intermediateTime.setHours(now.getHours() - hoursPast);
          
          const ratio = i / 10;
          const intermediatePrice = priorPrice + (tokenData.price - priorPrice) * ratio;
          
          const noise = intermediatePrice * (Math.random() * 0.05 - 0.025);
          
          data.push({
            time: intermediateTime.toISOString(),
            price: intermediatePrice + noise
          });
        }
        
        data.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
        
        setChartData(data);
        console.log('Generated chart data:', data);
      }
    } catch (error) {
      console.error('Error fetching token chart data:', error);
    } finally {
      setChartLoading(false);
    }
  };
  
  useEffect(() => {
    if (!bet?.tokenMint) return;
    
    const unsubscribe = subscribeToGMGNTokenData(bet.tokenMint, (data) => {
      if (data.price && chartData.length > 0) {
        const now = new Date();
        const newPoint = {
          time: now.toISOString(),
          price: data.price
        };
        
        setChartData(prev => {
          const updatedData = [...prev, newPoint].slice(-12);
          return updatedData;
        });
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [bet?.tokenMint, chartData.length]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-dream-background text-dream-foreground p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center p-12">
            <div className="w-10 h-10 border-4 border-dream-accent1 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!bet) {
    return (
      <div className="min-h-screen bg-dream-background text-dream-foreground p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center p-12">
            <h2 className="text-2xl font-bold mb-4">Bet Not Found</h2>
            <p className="mb-6">The bet you're looking for doesn't exist or has been removed.</p>
            <Button asChild>
              <Link to="/betting">Return to Betting</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  const isPredictionUp = ['migrate', 'up', 'moon'].includes(bet.prediction);
  const predictionDisplay = isPredictionUp ? 'MOON' : 'DIE';
  const predictionColor = isPredictionUp ? 'text-green-400' : 'text-red-400';
  const predictionBgColor = isPredictionUp ? 'bg-green-400/10' : 'bg-red-400/10';
  
  let statusDisplay = bet.status.toUpperCase();
  let statusClass = 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30';
  
  if (bet.status === 'pending') {
    statusClass = 'bg-blue-500/20 text-blue-400 border-blue-400/30';
  } else if (bet.status === 'completed' || bet.status === 'closed') {
    if (bet.outcome === 'win') {
      statusDisplay = 'ENDED WIN';
      statusClass = 'bg-green-500/20 text-green-400 border-green-400/30';
    } else {
      statusDisplay = 'ENDED LOSS';
      statusClass = 'bg-red-500/20 text-red-400 border-red-400/30';
    }
  } else if (new Date().getTime() > bet.expiresAt) {
    statusDisplay = 'EXPIRED';
    statusClass = 'bg-red-500/20 text-red-400 border-red-400/30';
  } else if (bet.status === 'matched') {
    statusClass = 'bg-purple-500/20 text-purple-400 border-purple-400/30';
  }
  
  return (
    <div className="min-h-screen bg-dream-background text-dream-foreground p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link to="/betting" className="flex items-center text-dream-foreground/70 hover:text-dream-foreground transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to betting
          </Link>
        </div>
        
        <div className="glass-panel bg-dream-foreground/5 backdrop-blur-lg border border-dream-accent1/20 rounded-xl p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-display font-bold flex items-center gap-2">
                <span>{bet.tokenName}</span>
                <span className="text-lg text-dream-foreground/60">({bet.tokenSymbol})</span>
              </h1>
              <div className="flex items-center mt-2">
                <Badge className={`${predictionBgColor} ${predictionColor} border-none mr-3`}>
                  {predictionDisplay}
                </Badge>
                <Badge variant="outline" className={`border-none ${statusClass}`}>
                  {statusDisplay}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-dream-foreground/60 mb-1">Bet Amount</div>
              <div className="text-2xl font-bold text-dream-accent1 flex items-center justify-end">
                <Coins className="w-5 h-5 mr-2" />
                {bet.amount} PXB
              </div>
            </div>
          </div>
          
          {/* Replacing chart with a futuristic token details button */}
          <div className="mb-8 flex justify-center">
            <Link to={`/token/${bet.tokenMint}`} className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-dream-accent1 to-dream-accent2 rounded-lg blur-lg opacity-60 group-hover:opacity-100 transition-all duration-300"></div>
              <div className="relative flex items-center justify-center px-8 py-4 bg-black/70 rounded-lg border border-dream-accent1/30 overflow-hidden">
                {/* Tech circuits corners */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-dream-accent1/60"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-dream-accent2/60"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-dream-accent1/60"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-dream-accent2/60"></div>
                
                {/* Pulsing background effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-dream-accent1/5 to-dream-accent2/5 opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Futuristic button content */}
                <div className="flex items-center gap-3 text-white">
                  <Rocket className="w-5 h-5 text-dream-accent1 group-hover:animate-pulse" />
                  <span className="font-medium text-lg">View Token Details</span>
                  <Zap className="w-5 h-5 text-dream-accent2 group-hover:animate-pulse" />
                </div>
                
                {/* Animated border light effect */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-dream-accent1 to-transparent opacity-50 group-hover:opacity-100 animate-[border-flow_3s_linear_infinite] transition-opacity duration-300"></div>
                </div>
              </div>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Bet Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-dream-foreground/5 rounded-lg">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2 text-dream-foreground/60" />
                      <span className="text-dream-foreground/70">Initiated by</span>
                    </div>
                    <div className="font-medium">{formatAddress(bet.initiator)}</div>
                  </div>
                  
                  {bet.counterParty && (
                    <div className="flex justify-between items-center p-3 bg-dream-foreground/5 rounded-lg">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2 text-dream-foreground/60" />
                        <span className="text-dream-foreground/70">Counter Party</span>
                      </div>
                      <div className="font-medium">{formatAddress(bet.counterParty)}</div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center p-3 bg-dream-foreground/5 rounded-lg">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-dream-foreground/60" />
                      <span className="text-dream-foreground/70">Created on</span>
                    </div>
                    <div className="font-medium">{new Date(bet.timestamp).toLocaleString()}</div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-dream-foreground/5 rounded-lg">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-dream-foreground/60" />
                      <span className="text-dream-foreground/70">Time Remaining</span>
                    </div>
                    <div className="font-medium">{formatTimeRemaining(bet.expiresAt)}</div>
                  </div>
                </div>
              </div>
              
              {bet.initialMarketCap && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Market Data</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-dream-foreground/5 rounded-lg">
                      <div className="text-dream-foreground/70">Initial Market Cap</div>
                      <div className="font-medium">${formatNumberWithCommas(bet.initialMarketCap)}</div>
                    </div>
                    
                    {bet.currentMarketCap && (
                      <div className="flex justify-between items-center p-3 bg-dream-foreground/5 rounded-lg">
                        <div className="text-dream-foreground/70">Current Market Cap</div>
                        <div className="font-medium">${formatNumberWithCommas(bet.currentMarketCap)}</div>
                      </div>
                    )}
                    
                    {bet.initialMarketCap && bet.currentMarketCap && (
                      <div className="flex justify-between items-center p-3 bg-dream-foreground/5 rounded-lg">
                        <div className="text-dream-foreground/70">Market Cap Change</div>
                        <div className={
                          bet.currentMarketCap > bet.initialMarketCap 
                            ? "text-green-400 font-medium" 
                            : "text-red-400 font-medium"
                        }>
                          {((bet.currentMarketCap - bet.initialMarketCap) / bet.initialMarketCap * 100).toFixed(2)}%
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Token Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-dream-foreground/5 rounded-lg">
                    <div className="text-dream-foreground/70">Name</div>
                    <div className="font-medium">{bet.tokenName}</div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-dream-foreground/5 rounded-lg">
                    <div className="text-dream-foreground/70">Symbol</div>
                    <div className="font-medium">{bet.tokenSymbol}</div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-dream-foreground/5 rounded-lg">
                    <div className="text-dream-foreground/70">Mint Address</div>
                    <div className="font-medium truncate max-w-[200px]" title={bet.tokenMint}>
                      {formatAddress(bet.tokenMint)}
                    </div>
                  </div>
                  
                  {tokenDetails?.total_supply && (
                    <div className="flex justify-between items-center p-3 bg-dream-foreground/5 rounded-lg">
                      <div className="text-dream-foreground/70">Total Supply</div>
                      <div className="font-medium">{formatNumberWithCommas(tokenDetails.total_supply)}</div>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Blockchain Info</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-dream-foreground/5 rounded-lg">
                    <div className="text-dream-foreground/70">Bet ID</div>
                    <div className="font-medium">{bet.id}</div>
                  </div>
                  
                  {bet.onChainBetId && (
                    <div className="flex justify-between items-center p-3 bg-dream-foreground/5 rounded-lg">
                      <div className="text-dream-foreground/70">On-Chain ID</div>
                      <div className="font-medium">{bet.onChainBetId}</div>
                    </div>
                  )}
                  
                  {bet.transactionSignature && (
                    <div className="flex justify-between items-center p-3 bg-dream-foreground/5 rounded-lg">
                      <div className="text-dream-foreground/70">Transaction</div>
                      <a 
                        href={`https://solscan.io/tx/${bet.transactionSignature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-dream-accent1 flex items-center"
                      >
                        {bet.transactionSignature.substring(0, 8)}...
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            {bet.status === 'open' && (
              <Button className="bg-gradient-to-r from-dream-accent2/60 to-dream-accent2/80 hover:from-dream-accent2/70 hover:to-dream-accent2/90">
                <Trophy className="w-4 h-4 mr-2" />
                Accept Challenge
              </Button>
            )}
            
            {(bet.status === 'completed' || bet.status === 'closed') && bet.winner && (
              <div className="p-4 rounded-lg bg-dream-foreground/5">
                <h3 className="text-xl font-semibold mb-2">
                  {bet.winner === bet.initiator 
                    ? "Initiator Won!" 
                    : "Challenger Won!"}
                </h3>
                <p className="text-dream-foreground/70">
                  Winner: {formatAddress(bet.winner)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BetDetails;
