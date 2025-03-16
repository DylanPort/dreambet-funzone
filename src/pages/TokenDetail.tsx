
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
} from '@/components/ui/dialog';

// Mock component for CreateBetForm
const CreateBetForm = ({
  tokenId,
  tokenName,
  tokenSymbol,
  onBetCreated,
  token,
  onSuccess,
  onCancel,
}) => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-dream-foreground mb-4">Create Bet for {tokenName}</h2>
      <p className="mb-4 text-dream-foreground/70">
        Create a new bet for token {tokenSymbol || 'Unknown'}
      </p>
      <Button 
        onClick={onSuccess} 
        className="w-full bg-gradient-to-r from-dream-accent1 to-dream-accent3 text-white"
      >
        Submit Bet
      </Button>
    </div>
  );
};

// Mock hooks for token data
const useGetTokenMeta = () => {
  return {
    getTokenMeta: async (tokenId) => {
      return {
        name: `Token ${tokenId.substring(0, 4)}`,
        symbol: 'TKN',
        decimals: 9,
      };
    },
    isLoading: false,
    error: null,
  };
};

const useFetchTokenPrice = () => {
  return {
    getTokenPrice: async (tokenId) => {
      return {
        price: 1.23,
        change_24h: 5.6,
      };
    },
    isLoading: false,
    error: null,
  };
};

const useGetTokenMarketCap = () => {
  return {
    getTokenMarketCap: async (tokenId) => {
      return {
        market_cap: 1234567,
        volume_24h: 98765,
      };
    },
    isLoading: false,
    error: null,
  };
};

// Mock function for Solana address validation
const isValidSolanaAddress = (address) => {
  try {
    new PublicKey(address);
    return true;
  } catch (error) {
    return false;
  }
};

const TokenDetail = () => {
  const { tokenId } = useParams();
  const { publicKey, connected } = useWallet();
  const [tokenData, setTokenData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const {
    getTokenMeta,
    isLoading: isTokenMetaLoading,
    error: tokenMetaError,
  } = useGetTokenMeta();
  const {
    getTokenPrice,
    isLoading: isTokenPriceLoading,
    error: tokenPriceError,
  } = useFetchTokenPrice();
  const {
    getTokenMarketCap,
    isLoading: isTokenMarketCapLoading,
    error: tokenMarketCapError,
  } = useGetTokenMarketCap();

  const refreshData = () => {
    setRefreshKey((prevKey) => prevKey + 1);
  };

  const fetchTokenData = useCallback(async () => {
    if (!tokenId) {
      toast.error('Token ID is required.');
      return;
    }

    setIsLoading(true);
    try {
      // Simplified token fetching logic
      console.log(`Fetching token data for token address: ${tokenId}`);
      const tokenMeta = await getTokenMeta(tokenId);
      const tokenPrice = await getTokenPrice(tokenId);
      const tokenMarketCap = await getTokenMarketCap(tokenId);

      if (tokenMeta) {
        setTokenData({
          ...tokenMeta,
          price: tokenPrice?.price,
          marketCap: tokenMarketCap?.market_cap,
        });
      } else {
        toast.error('Token with specified address not found.');
      }
    } catch (error) {
      console.error('Error fetching token data:', error);
      toast.error(
        error.message || 'Failed to fetch token data. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    tokenId,
    getTokenMeta,
    getTokenPrice,
    getTokenMarketCap,
  ]);

  useEffect(() => {
    if (tokenId) {
      fetchTokenData();
    }
  }, [tokenId, connected, fetchTokenData, refreshKey]);

  return (
    <div className="container mx-auto mt-8 p-6 glass-panel">
      {isLoading ? (
        <>
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-8 w-1/2 mb-3" />
          <Skeleton className="h-6 w-1/4 mb-6" />
          <Skeleton className="h-40 w-full mb-4" />
          <Skeleton className="h-12 w-full" />
        </>
      ) : tokenData ? (
        <>
          <h1 className="text-3xl font-bold text-dream-foreground mb-4">
            {tokenData.name}
          </h1>
          <p className="text-dream-foreground/70 mb-6">
            Symbol: {tokenData.symbol}
          </p>

          {/* Display image if available */}
          {tokenData.image && (
            <img
              src={tokenData.image}
              alt={tokenData.name}
              className="w-full rounded-md mb-4 max-h-80 object-contain"
            />
          )}

          {/* Display price and market cap if available */}
          {tokenData.price && (
            <p className="text-dream-foreground/70 mb-2">
              Price: ${tokenData.price.toFixed(2)}
            </p>
          )}
          {tokenData.marketCap && (
            <p className="text-dream-foreground/70 mb-4">
              Market Cap: ${tokenData.marketCap.toLocaleString()}
            </p>
          )}

          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full bg-gradient-to-r from-dream-accent1 to-dream-accent3 text-white font-medium py-3 rounded-md mb-4 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                <Sparkles className="w-5 h-5" />
                Create a New Bet
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] p-0 border-dream-foreground/20 bg-dream-background backdrop-blur-md">
              <CreateBetForm
                tokenId={tokenId}
                tokenName={tokenData?.name || ''}
                tokenSymbol={tokenData?.symbol || ''}
                onBetCreated={refreshData}
                token={tokenData}
                onSuccess={() => refreshData()}
                onCancel={() => {}}
              />
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <p className="text-red-500">Token not found.</p>
      )}
    </div>
  );
};

export default TokenDetail;
