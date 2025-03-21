
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
  const { userProfile } = usePXBPoints();

  useEffect(() => {
    const loadTokenData = async () => {
      setLoading(true);
      try {
        // Fetch token details from Supabase
        const tokenData = await fetchTokenById(tokenId!);
        setToken(tokenData);

        // Fetch token metrics from TokenDataCache
        const metrics = await fetchTokenMetrics(tokenId!);
        setTokenMetrics(metrics);
      } catch (error) {
        console.error("Error fetching token data:", error);
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

  const placeBet = async () => {
    if (!tokenId || !token || !publicKey) return;

    setPlacingBet(true);
    try {
      const creatorWalletAddress = publicKey.toString();
      const success = await createSupabaseBet(
        tokenId,
        token.token_name,
        token.token_symbol,
        prediction,
        duration,
        amount,
        creatorWalletAddress
      );

      if (success) {
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
    return <div className="text-center">Loading token data...</div>;
  }

  if (!token) {
    return <div className="text-center">Token not found</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="glass-panel border-dream-accent2/20">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">Token Information</h3>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Token Mint</TableCell>
                    <TableCell>{token.token_mint}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Token Name</TableCell>
                    <TableCell>{token.token_name}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Token Symbol</TableCell>
                    <TableCell>{token.token_symbol}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Initial Market Cap</TableCell>
                    <TableCell>${token.initial_market_cap}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Current Market Cap</TableCell>
                    <TableCell>${token.current_market_cap}</TableCell>
                  </TableRow>
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
                />
              </div>

              <Button onClick={placeBet} disabled={placingBet} className="w-full">
                {placingBet ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Placing Bet...
                  </>
                ) : (
                  "Place Bet"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TokenDetail;
