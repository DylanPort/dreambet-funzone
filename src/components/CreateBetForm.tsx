import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, Clock, RefreshCw } from 'lucide-react';
import { createBet } from '@/api/mockData';
import { useToast } from '@/hooks/use-toast';
import { BetPrediction } from '@/types/bet';
import { Slider } from '@/components/ui/slider';

interface CreateBetFormProps {
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  onBetCreated: () => void;
  token?: any; // Optional token prop for TokenDetail page
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CreateBetForm: React.FC<CreateBetFormProps> = ({
  tokenId,
  tokenName,
  tokenSymbol,
  onBetCreated,
  token,
  onSuccess,
  onCancel
}) => {
  const [amount, setAmount] = useState<string>('0.1');
  const [prediction, setPrediction] = useState<BetPrediction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duration, setDuration] = useState<number>(30); // Default to 30 minutes
  const [transactionStatus, setTransactionStatus] = useState<string>('');
  const [isWalletReady, setIsWalletReady] = useState(false);
  const [walletCheckingInProgress, setWalletCheckingInProgress] = useState(false);
  const [checkAttempts, setCheckAttempts] = useState(0);
  
  const { connected, publicKey, wallet, connecting, disconnect } = useWallet();
  const { toast } = useToast();

  // Check if wallet is actually ready for transactions
  const verifyWalletConnection = useCallback(async () => {
    if (connected && publicKey && wallet && wallet.adapter.publicKey) {
      try {
        setWalletCheckingInProgress(true);
        console.log("Verifying wallet connection in CreateBetForm...");
        
        // Simple check - if publicKeys match, wallet is considered connected
        if (wallet.adapter.publicKey.equals(publicKey)) {
          console.log("Wallet successfully verified - Ready for transactions");
          setIsWalletReady(true);
          return true;
        } else {
          console.warn("Wallet adapter publicKey doesn't match connected publicKey");
          setIsWalletReady(false);
          return false;
        }
      } catch (error) {
        console.error("Error verifying wallet:", error);
        setIsWalletReady(false);
        return false;
      } finally {
        setWalletCheckingInProgress(false);
      }
    } else {
      // Log what's missing for debugging
      console.log("Wallet not ready:", {
        connected,
        hasPublicKey: !!publicKey,
        hasWallet: !!wallet,
        hasWalletPublicKey: !!wallet?.adapter?.publicKey
      });
      setIsWalletReady(false);
      return false;
    }
  }, [connected, publicKey, wallet]);
  
  // Always verify wallet when connection state changes
  useEffect(() => {
    // Add a small delay to give the wallet adapter time to fully connect
    const timeoutId = setTimeout(() => {
      verifyWalletConnection();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [verifyWalletConnection, connected, publicKey, wallet, checkAttempts]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setAmount(value);
  };

  const handleDurationChange = (value: number[]) => {
    setDuration(value[0]);
  };

  const handleRetryWalletConnection = async () => {
    try {
      if (disconnect) {
        await disconnect();
        toast({
          title: "Reconnect wallet",
          description: "Please reconnect your wallet to continue",
        });
      }
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  };

  const handleCheckWalletAgain = () => {
    setCheckAttempts(prev => prev + 1);
    toast({
      title: "Checking wallet connection",
      description: "Verifying your wallet connection status...",
    });
  };

  const handleCreateBet = async () => {
    // Verify wallet connection one more time before proceeding
    const isWalletVerified = await verifyWalletConnection();
    
    if (!isWalletVerified) {
      toast({
        title: "Wallet not connected properly",
        description: "Please ensure your wallet is fully connected and try again",
        variant: "destructive",
      });
      return;
    }

    if (!prediction) {
      toast({
        title: "Select a prediction",
        description: "Please choose whether the token will migrate or die",
        variant: "destructive",
      });
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid bet amount",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setTransactionStatus('Preparing transaction...');
      
      // Log for debugging
      console.log(`Creating bet with: 
        token: ${tokenId} (${tokenName})
        wallet: ${publicKey?.toString()}
        wallet connected: ${connected}
        wallet adapter ready: ${wallet?.adapter?.publicKey ? 'Yes' : 'No'}
        wallet verified: ${isWalletReady ? 'Yes' : 'No'}
        amount: ${parseFloat(amount)} SOL
        prediction: ${prediction}
        duration: ${duration} minutes
        RPC endpoint: ${(wallet?.adapter as any)?.connection?.rpcEndpoint || 'Not available'}
      `);
      
      setTransactionStatus('Sending transaction to Solana...');
      
      if (!wallet) {
        throw new Error("Wallet instance is not available");
      }
      
      await createBet(
        tokenId,
        tokenName,
        tokenSymbol,
        publicKey!.toString(),
        parseFloat(amount),
        prediction!,
        wallet,
        duration
      );
      
      setTransactionStatus('Transaction confirmed!');
      
      toast({
        title: "Bet created successfully!",
        description: `Your ${parseFloat(amount)} SOL bet that ${tokenSymbol} will ${prediction} is now live on-chain`,
      });
      
      // Reset form
      setAmount('0.1');
      setPrediction(null);
      setDuration(30);
      setTransactionStatus('');
      
      // Notify parent component
      if (onSuccess) {
        onSuccess();
      } else {
        onBetCreated();
      }
    } catch (error: any) {
      console.error('Error creating bet:', error);
      setTransactionStatus('');
      
      // Extract meaningful error message
      let errorMessage = "Something went wrong with the blockchain transaction.";
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: "Failed to create bet",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel p-6 space-y-4">
      <h3 className="text-xl font-display font-semibold">Create a New Bet</h3>
      
      <div>
        <label className="block text-sm text-dream-foreground/70 mb-1">
          Your Prediction
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setPrediction('migrate')}
            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-md border transition-colors ${
              prediction === 'migrate'
                ? 'bg-green-500/20 border-green-500 text-green-400'
                : 'border-dream-foreground/20 hover:bg-green-500/10'
            }`}
          >
            <ArrowUp size={18} />
            <span>MIGRATE 🚀</span>
          </button>
          
          <button
            type="button"
            onClick={() => setPrediction('die')}
            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-md border transition-colors ${
              prediction === 'die'
                ? 'bg-red-500/20 border-red-500 text-red-400'
                : 'border-dream-foreground/20 hover:bg-red-500/10'
            }`}
          >
            <ArrowDown size={18} />
            <span>DIE 💀</span>
          </button>
        </div>
      </div>
      
      <div>
        <label className="block text-sm text-dream-foreground/70 mb-1">
          Bet Amount (SOL)
        </label>
        <div className="relative">
          <input
            type="text"
            value={amount}
            onChange={handleAmountChange}
            className="w-full p-3 bg-dream-surface border border-dream-foreground/20 rounded-md focus:outline-none focus:border-dream-accent2"
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dream-foreground/50">
            SOL
          </span>
        </div>
        <p className="text-xs text-dream-foreground/50 mt-1">
          Min: 0.01 SOL | Max: 10 SOL
        </p>
      </div>
      
      <div>
        <label className="flex items-center text-sm text-dream-foreground/70 mb-2">
          <Clock className="w-4 h-4 mr-1" />
          Bet Duration: <span className="ml-2 font-semibold">{duration} minutes</span>
        </label>
        <Slider
          value={[duration]}
          min={10}
          max={60}
          step={5}
          onValueChange={handleDurationChange}
          className="py-4"
        />
        <div className="flex justify-between text-xs text-dream-foreground/50 mt-1">
          <span>10m</span>
          <span>30m</span>
          <span>60m</span>
        </div>
      </div>
      
      {transactionStatus && (
        <div className="bg-dream-accent2/10 p-3 rounded-md">
          <p className="flex items-center text-sm text-dream-accent2">
            <div className="w-4 h-4 border-2 border-dream-accent2 border-t-transparent rounded-full animate-spin mr-2"></div>
            {transactionStatus}
          </p>
        </div>
      )}
      
      <div className="flex gap-3">
        <Button
          onClick={handleCreateBet}
          disabled={!isWalletReady || isSubmitting || !prediction || !amount || walletCheckingInProgress}
          className="flex-1 bg-gradient-to-r from-dream-accent1 to-dream-accent3"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-dream-foreground border-t-transparent rounded-full animate-spin"></div>
              Creating Bet...
            </span>
          ) : (
            "Create Bet"
          )}
        </Button>
        
        {onCancel && (
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
      </div>
      
      {!isWalletReady && (
        <div className="flex flex-col items-center text-sm p-3 bg-dream-surface/30 rounded-md">
          {connecting ? (
            <p className="text-yellow-400 flex items-center">
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse mr-2"></span>
              Connecting wallet...
            </p>
          ) : !connected ? (
            <p className="text-dream-foreground/70">Connect your wallet to create bets</p>
          ) : walletCheckingInProgress ? (
            <p className="text-yellow-400 flex items-center">
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse mr-2"></span>
              Verifying wallet connection...
            </p>
          ) : (
            <>
              <p className="text-red-400 flex items-center mb-2">
                <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                Wallet not properly connected
              </p>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleRetryWalletConnection}
                  className="text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Reconnect Wallet
                </Button>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  onClick={handleCheckWalletAgain}
                  className="text-xs"
                >
                  Check Again
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CreateBetForm;
