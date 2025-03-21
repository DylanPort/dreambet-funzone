
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchTokenById } from '@/services/supabaseService';
import { fetchTokenMetrics, addCustomTokenToCache } from '@/services/tokenDataCache';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge';
import { SparklesIcon, ArrowUp, ArrowDown, Loader2, AlertCircle } from 'lucide-react';
import { BetPrediction } from '@/types/bet';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import TokenMarketCap from '@/components/TokenMarketCap';
import TokenVolume from '@/components/TokenVolume';
import { fetchTokenDataFromSolscan } from '@/services/solscanService';
import { fetchGMGNTokenData } from '@/services/gmgnService';

const TokenDetail = () => {
  const { tokenId } = useParams<{ tokenId: string }>();
  const [token, setToken] = useState<any>(null);
  const [tokenMetrics, setTokenMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [prediction, setPrediction] = useState<BetPrediction>('migrate');
  const [duration, setDuration] = useState(30);
  const [amount, setAmount] = useState(1);
  const [placingBet, setPlacingBet] = useState(false);
  const { publicKey } = useWallet();
  const { userProfile, placeBet } = usePXBPoints();
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadTokenData = async () => {
      if (!tokenId) {
        setError("Token ID is missing from URL parameters");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        console.log("Fetching token details for:", tokenId);
        
        // Try to fetch from Supabase first
        let tokenData = await fetchTokenById(tokenId);
        
        // If token not found in Supabase, try searching on Solscan
        if (!tokenData) {
          console.log(`No token found in database for ID: ${tokenId}, trying Solscan...`);
          const solscanData = await fetchTokenDataFromSolscan(tokenId);
          
          if (solscanData) {
            tokenData = {
              token_mint: tokenId,
              token_name: solscanData.name,
              token_symbol: solscanData.symbol,
              // Add estimated data for metrics
              current_market_cap: null,
              initial_market_cap: null
            };
            
            // Create custom entry in token cache
            addCustomTokenToCache(tokenId, tokenData);
          }
        }
        
        // If still no token, try GMGN service for more info
        if (!tokenData || !tokenData.token_name) {
          console.log(`No complete token data, trying GMGN for: ${tokenId}`);
          try {
            const gmgnData = await fetchGMGNTokenData(tokenId);
            if (gmgnData.marketCap || gmgnData.price) {
              if (!tokenData) {
                tokenData = {
                  token_mint: tokenId,
                  token_name: 'Unknown Token',
                  token_symbol: tokenId.substring(0, 5).toUpperCase(),
                  current_market_cap: gmgnData.marketCap || null,
                  initial_market_cap: null
                };
              } else {
                tokenData.current_market_cap = gmgnData.marketCap || null;
              }
            }
          } catch (gmgnError) {
            console.log("Error getting GMGN data:", gmgnError);
            // Continue with whatever data we have
          }
        }
        
        // If still no token, create a minimal placeholder
        if (!tokenData) {
          console.log(`Creating minimal placeholder for token: ${tokenId}`);
          tokenData = {
            token_mint: tokenId,
            token_name: 'Unknown Token',
            token_symbol: tokenId.substring(0, 5).toUpperCase(),
            current_market_cap: null,
            initial_market_cap: null
          };
        }
        
        // Always ensure we have at least token_name and token_symbol
        if (!tokenData.token_name) {
          tokenData.token_name = 'Unknown Token';
        }
        if (!tokenData.token_symbol) {
          tokenData.token_symbol = tokenId.substring(0, 5).toUpperCase();
        }
        
        console.log("Final token data:", tokenData);
        setToken(tokenData);

        // Fetch token metrics from TokenDataCache
        const metrics = await fetchTokenMetrics(tokenId);
        console.log("Token metrics fetched:", metrics);
        setTokenMetrics(metrics);
      } catch (error: any) {
        console.error("Error fetching token data:", error);
        setError(error?.message || "Failed to load token data. Please try again later.");
        toast.error("Failed to load token data");
      } finally {
        setLoading(false);
      }
    };

    loadTokenData();
  }, [tokenId]);

  const handlePredictionChange = (newPrediction: BetPrediction) => {
    setPrediction(newPrediction);
  };

  const handleDurationChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setDuration(Number(event.target.value));
  };

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = Number(event.target.value);
    if (newAmount >= 0) {
      setAmount(newAmount);
    }
  };

  const handlePlaceBet = async () => {
    if (!tokenId || !token) {
      toast.error("Token information is missing");
      return;
    }
    
    if (!publicKey || !userProfile) {
      toast.error("You need to be logged in with a wallet to place a bet");
      return;
    }

    if (amount <= 0) {
      toast.error("Bet amount must be greater than 0");
      return;
    }

    if (!userProfile.pxbPoints || userProfile.pxbPoints < amount) {
      toast.error(`Not enough PXB points. You have ${userProfile.pxbPoints || 0}, but tried to bet ${amount}.`);
      return;
    }

    setPlacingBet(true);
    try {
      const betResult = await placeBet(
        tokenId,
        token.token_name || "Unknown Token",
        token.token_symbol || "UNKNOWN",
        amount,
        prediction === 'migrate' ? 'up' : 'down',
        10, // Default percentage change (increased from 5 to 10)
        duration
      );

      if (betResult) {
        toast.success(`Bet placed successfully for ${amount} PXB!`);
        // Optionally navigate to bets page
        // navigate('/betting/my-bets');
      } else {
        toast.error("Failed to place bet");
      }
    } catch (error: any) {
      console.error("Error placing bet:", error);
      toast.error(error.message || "Error placing bet");
    } finally {
      setPlacingBet(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-dream-accent2" />
          <p className="text-lg text-dream-foreground/70">Loading token data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200 max-w-md">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
          <p className="text-lg font-medium text-red-600 mb-2">Error</p>
          <p className="text-gray-700">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => navigate('/betting')}
          >
            Return to Betting Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center p-6 bg-amber-50 rounded-lg border border-amber-200 max-w-md">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
          <p className="text-lg font-medium text-amber-600 mb-2">Token Not Found</p>
          <p className="text-gray-700">The token you're looking for doesn't exist or has been removed.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => navigate('/betting')}
          >
            Return to Betting Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Format token mint for display (truncate if too long)
  const formatTokenMint = (mint: string) => {
    if (!mint) return "Unknown";
    if (mint.length > 20) {
      return `${mint.substring(0, 10)}...${mint.substring(mint.length - 10)}`;
    }
    return mint;
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="glass-panel border-dream-accent2/20 mb-6">
        <CardHeader>
          <CardTitle className="flex items-center flex-wrap gap-2">
            {token.token_name || "Unknown Token"}
            {token.token_symbol && (
              <Badge className="ml-2">{token.token_symbol}</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Explore detailed information and metrics for {token.token_name || "this token"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Token metrics grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {tokenId && <TokenMarketCap tokenId={tokenId} />}
            {tokenId && <TokenVolume tokenId={tokenId} />}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">Token Information</h3>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Token Mint</TableCell>
                    <TableCell className="break-all">
                      <div className="max-w-full overflow-hidden text-ellipsis">
                        {token.token_mint}
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Token Name</TableCell>
                    <TableCell>{token.token_name || "Unknown"}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Token Symbol</TableCell>
                    <TableCell>{token.token_symbol || "UNKNOWN"}</TableCell>
                  </TableRow>
                  {token.initial_market_cap && (
                    <TableRow>
                      <TableCell className="font-medium">Initial Market Cap</TableCell>
                      <TableCell>${token.initial_market_cap.toLocaleString()}</TableCell>
                    </TableRow>
                  )}
                  {token.current_market_cap && (
                    <TableRow>
                      <TableCell className="font-medium">Current Market Cap</TableCell>
                      <TableCell>${token.current_market_cap.toLocaleString()}</TableCell>
                    </TableRow>
                  )}
                  {tokenMetrics && tokenMetrics.marketCap && (
                    <TableRow>
                      <TableCell className="font-medium">Market Cap (DexScreener)</TableCell>
                      <TableCell>${tokenMetrics.marketCap.toLocaleString()}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">Betting Details</h3>
              <div className="mb-4">
                <Label htmlFor="prediction">Prediction</Label>
                <div className="flex mt-2">
                  <Button
                    variant={prediction === 'migrate' ? 'default' : 'outline'}
                    onClick={() => handlePredictionChange('migrate')}
                    className="mr-2"
                  >
                    <ArrowUp className="mr-2 h-4 w-4" />
                    Migrate
                  </Button>
                  <Button
                    variant={prediction === 'die' ? 'default' : 'outline'}
                    onClick={() => handlePredictionChange('die')}
                  >
                    <ArrowDown className="mr-2 h-4 w-4" />
                    Die
                  </Button>
                </div>
              </div>

              <div className="mb-4">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <select
                  id="duration"
                  className="w-full p-2 border rounded mt-1"
                  value={duration}
                  onChange={handleDurationChange}
                >
                  <option value="5">5 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                </select>
              </div>

              <div className="mb-4">
                <Label htmlFor="amount">Amount (PXB)</Label>
                <Input
                  type="number"
                  id="amount"
                  className="w-full mt-1"
                  value={amount}
                  onChange={handleAmountChange}
                  min="1"
                />
                {userProfile && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Available: {userProfile.pxbPoints || 0} PXB
                  </p>
                )}
              </div>

              <Button 
                onClick={handlePlaceBet} 
                disabled={placingBet || !userProfile || amount <= 0} 
                className="w-full"
              >
                {placingBet ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Placing Bet...
                  </>
                ) : (
                  `Place Bet (${amount} PXB)`
                )}
              </Button>
              
              {!userProfile && (
                <p className="text-sm text-amber-600 mt-2 text-center">
                  You need to connect your wallet to place bets.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TokenDetail;
