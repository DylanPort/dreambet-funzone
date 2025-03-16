import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchTokenDetails } from '@/services/supabaseService';
import { formatNumber, formatPrice } from '@/utils/formatNumber';
import { Clock, ExternalLink, RefreshCw } from 'lucide-react';
import CreateBetForm from '@/components/CreateBetForm';
import OpenBetsList from '@/components/OpenBetsList';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@solana/wallet-adapter-react';
import { truncatePublicKey } from '@/utils/formatter';
import { usePXBPoints } from '@/contexts/PXBPointsContext';

const TokenDetail = () => {
  const {
    toast
  } = useToast();
  const {
    tokenId
  } = useParams();
  const [showPredictionForm, setShowPredictionForm] = useState<string | null>(null);
  const {
    connected,
    publicKey
  } = useWallet();
  const {
    userProfile
  } = usePXBPoints();

  const {
    data: token,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['tokenDetails', tokenId],
    queryFn: () => fetchTokenDetails(tokenId),
    retry: false
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Error fetching token details",
        description: "Failed to load token details. Please try again."
      });
    }
  }, [error, toast]);

  if (isLoading) {
    return <div className="space-y-5">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-display font-bold text-dream-foreground flex items-center gap-2">
            <img src="/lovable-uploads/74707f80-3a88-4b9c-82d2-5a590a3a32df.png" alt="Crown" className="h-6 w-6" />
            <span>TOKEN DETAILS</span>
          </h2>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center text-sm bg-dream-background/50 backdrop-blur-sm px-3 py-1 rounded-full border border-dream-accent1/30">
              <Clock className="w-3.5 h-3.5 mr-1.5 text-dream-accent1" />
              <span className="font-medium">Loading...</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="glass-panel p-4 animate-pulse">
            <div className="h-5 w-32 bg-gray-700/50 rounded mb-2"></div>
            <div className="h-4 w-16 bg-gray-700/50 rounded mb-4"></div>
            <div className="h-8 bg-gray-700/50 rounded mb-2"></div>
            <div className="h-8 bg-gray-700/50 rounded"></div>
          </div>
        </div>
      </div>;
  }

  if (!token) {
    return <div className="glass-panel p-6 text-center">
        <p className="text-red-400 mb-2">Token not found</p>
        <p className="text-dream-foreground/60 text-sm">
          The requested token could not be found. Please check the token ID and try again.
        </p>
        <Link to="/" className="mt-4 px-4 py-2 bg-dream-accent1/20 border border-dream-accent1/30 text-dream-accent1 rounded-md inline-block">
          Go Back to Home
        </Link>
      </div>;
  }

  const handleBetCreated = () => {
    setShowPredictionForm(null);
  };

  return <div className="space-y-6">
      {/* Token Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-dream-accent1/20 to-dream-accent3/20 flex items-center justify-center border border-white/10">
            <span className="font-display font-bold text-3xl">{token.symbol.charAt(0)}</span>
          </div>
          <div>
            <h1 className="text-2xl font-display font-semibold text-dream-foreground">{token.name}</h1>
            <p className="text-dream-foreground/60">{token.symbol}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a href={`https://solscan.io/token/${token.token_id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-dream-foreground/60 hover:text-dream-foreground transition-colors">
            View on Solscan
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Token Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="glass-panel p-4">
          <h4 className="font-semibold text-dream-foreground">Market Cap</h4>
          <p className="text-dream-foreground/70">
            {token.market_cap ? formatPrice(token.market_cap) : 'N/A'}
          </p>
        </div>
        <div className="glass-panel p-4">
          <h4 className="font-semibold text-dream-foreground">Price</h4>
          <p className="text-dream-foreground/70">
            {token.price ? formatPrice(token.price) : 'N/A'}
          </p>
        </div>
        <div className="glass-panel p-4">
          <h4 className="font-semibold text-dream-foreground">Total Supply</h4>
          <p className="text-dream-foreground/70">{formatNumber(token.total_supply)}</p>
        </div>
      </div>

      {/* Token Actions */}
      <div className="flex flex-col md:flex-row gap-3 mt-6">
        <Button 
          size="lg"
          onClick={() => setShowPredictionForm('migrate')}
          className="relative overflow-hidden group bg-transparent hover:bg-transparent border-none flex items-center justify-center"
        >
          <img 
            src="/lovable-uploads/14b3a60d-3184-4688-87e8-65aa75cd69b1.png" 
            alt="Rocket" 
            className="h-16 w-auto transition-transform duration-300 group-hover:scale-110"
          />
          <span className="absolute bottom-1 text-white font-bold text-lg drop-shadow-md">
            MOON
          </span>
        </Button>

        {connected && publicKey ? <Button size="lg" variant="secondary" onClick={() => setShowPredictionForm('die')}>
            Bet to Die
          </Button> : <Button size="lg" variant="secondary" disabled>
            Connect Wallet to Bet
          </Button>}
      </div>

      {/* Prediction Form */}
      {showPredictionForm && <div className="mt-6">
          <CreateBetForm tokenId={token.token_id} tokenName={token.name} tokenSymbol={token.symbol} onBetCreated={handleBetCreated} />
        </div>}

      {/* Open Bets List */}
      <div className="mt-8">
        <OpenBetsList />
      </div>
    </div>;
};

export default TokenDetail;
