
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchTokenById } from '@/services/supabaseService';
import { fetchTokenMetrics } from '@/services/tokenDataCache';
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
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge';
import { SparklesIcon, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { BetPrediction } from '@/types/bet';
import { createSupabaseBet } from '@/services/supabaseService';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import TokenMarketCap from '@/components/TokenMarketCap';
import TokenVolume from '@/components/TokenVolume';

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
        // Fetch token details from Supabase
        const tokenData = await fetchTokenById(tokenId);
        
        if (!tokenData) {
          setError(`Token with ID ${tokenId} not found`);
          setLoading(false);
          return;
        }
        
        console.log("Token data fetched:", tokenData);
        setToken(tokenData);

        // Fetch token metrics from TokenDataCache
        const metrics = await fetchTokenMetrics(tokenId);
        console.log("Token metrics fetched:", metrics);
        setTokenMetrics(metrics);
      } catch (error) {
        console.error("Error fetching token data:", error);
        setError("Failed to load token data. Please try again later.");
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
    setAmount(Number(event.target.value));
  };

  const handlePlaceBet = async () => {
    if (!tokenId || !token || !publicKey || !userProfile) {
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
      // Use the placeBet function from the PXBPoints context
      const betResult = await placeBet(
        tokenId,
        token.token_name,
        token.token_symbol,
        amount,
        prediction === 'migrate' ? 'up' : 'down',
        5, // Default percentage change
        duration
      );

      if (betResult) {
        toast.success("Bet placed successfully!");
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
          <p className="text-lg font-medium text-red-600 mb-2">Error</p>
          <p className="text-gray-700">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center p-6 bg-amber-50 rounded-lg border border-amber-200 max-w-md">
          <p className="text-lg font-medium text-amber-600 mb-2">Token Not Found</p>
          <p className="text-gray-700">The token you're looking for doesn't exist or has been removed.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.history.back()}
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="glass-panel border-dream-accent2/20 mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            {token.token_name}
            <Badge className="ml-2">{token.token_symbol}</Badge>
          </CardTitle>
          <CardDescription>
            Explore detailed information and metrics for {token.token_name}
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
                    <TableCell className="break-all">{token.token_mint}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Token Name</TableCell>
                    <TableCell>{token.token_name}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Token Symbol</TableCell>
                    <TableCell>{token.token_symbol}</TableCell>
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
                  className="w-full p-2 border rounded"
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
                <Label htmlFor="amount">Amount</Label>
                <Input
                  type="number"
                  id="amount"
                  className="w-full p-2 border rounded"
                  value={amount}
                  onChange={handleAmountChange}
                  min="1"
                />
              </div>

              <Button 
                onClick={handlePlaceBet} 
                disabled={placingBet || !userProfile} 
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
