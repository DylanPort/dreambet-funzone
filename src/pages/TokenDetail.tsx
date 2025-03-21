
import React from 'react';
import { useParams } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import TokenMarketCap from '@/components/TokenMarketCap';
import TokenVolume from '@/components/TokenVolume';
import LoadingState from '@/components/TokenDetail/LoadingState';
import ErrorState from '@/components/TokenDetail/ErrorState';
import NotFoundState from '@/components/TokenDetail/NotFoundState';
import TokenInfoTable from '@/components/TokenDetail/TokenInfoTable';
import BettingPanel from '@/components/TokenDetail/BettingPanel';
import { useTokenData } from '@/hooks/useTokenData';

const TokenDetail = () => {
  const { tokenId } = useParams<{ tokenId: string }>();
  const { publicKey } = useWallet();
  const { userProfile, placeBet } = usePXBPoints();
  const { token, tokenMetrics, loading, error } = useTokenData(tokenId);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState errorMessage={error} />;
  }

  if (!token) {
    return <NotFoundState />;
  }

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
            <TokenInfoTable token={token} tokenMetrics={tokenMetrics} />
            <BettingPanel 
              tokenId={tokenId || ''} 
              tokenName={token.token_name}
              tokenSymbol={token.token_symbol}
              userProfile={userProfile}
              placeBet={placeBet}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TokenDetail;
