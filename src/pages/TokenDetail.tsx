import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  getParsedNftAccountsByOwner,
  isValidSolanaAddress,
} from '@nfteyez/sol-nft-parser';
import { Connection, PublicKey } from '@solana/web3.js';
import {
  getTokenAccountsByOwner,
  parseTokenAccount,
} from '@nx-dapp/solana-utils';
import {
  DEFAULT_STRATEGIES,
  useAssetList,
} from '@solana/wallet-adapter-react-ui';
import {
  useFetchTokenPrice,
  useGetTokenMeta,
  useGetToken মার্কেটCap,
} from '@/hooks';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { CreateBetForm } from '@/components';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
} from '@/components/ui/dialog';

const TokenDetail = () => {
  const { tokenId } = useParams<{ tokenId: string }>();
  const { publicKey, connected } = useWallet();
  const [tokenData, setTokenData] = useState<any>(null);
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
    getToken মার্কেটCap,
    isLoading: isToken মার্কেটCapLoading,
    error: token মার্কেটCapError,
  } = useGetToken মার্কেটCap();

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
      if (isValidSolanaAddress(tokenId)) {
        // Fetch NFT Data
        console.log(`Fetching NFT data for mint address: ${tokenId}`);
        const connection = new Connection(
          process.env.NEXT_PUBLIC_SOLANA_NETWORK_URL!
        );
        const nftArray = await getParsedNftAccountsByOwner({
          publicAddress: publicKey!.toBase58(),
          connection,
        });

        const nft = nftArray.find((nft) => nft.mint === tokenId);

        if (nft) {
          setTokenData({
            name: nft.data.name,
            symbol: nft.data.symbol,
            image: nft.data.uri,
            mint: nft.mint,
          });
        } else {
          toast.error('NFT with specified mint address not found in wallet.');
        }
      } else {
        // Fetch Token Data
        console.log(`Fetching token data for token address: ${tokenId}`);
        const tokenMeta = await getTokenMeta(tokenId);
        const tokenPrice = await getTokenPrice(tokenId);
        const token মার্কেটCap = await getToken মার্কেটCap(tokenId);

        if (tokenMeta) {
          setTokenData({
            ...tokenMeta,
            price: tokenPrice?.price,
            marketCap: token মার্কেটCap?.market_cap,
          });
        } else {
          toast.error('Token with specified address not found.');
        }
      }
    } catch (error: any) {
      console.error('Error fetching token data:', error);
      toast.error(
        error.message || 'Failed to fetch token data. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    tokenId,
    publicKey,
    getTokenMeta,
    getTokenPrice,
    getToken মার্কেটCap,
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
            <DialogContent className="sm:max-w-[550px] p-0 border-dream-foreground/20 bg-dream-background">
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
