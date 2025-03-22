
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchTokenById, trackTokenSearch } from '@/services/supabaseService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Token {
  tokenMint: string;
  tokenName: string;
  tokenSymbol: string;
  currentMarketCap: number;
  lastTradePrice: number;
}

const TokenDetail: React.FC = () => {
  const { tokenMint } = useParams<{ tokenMint: string }>();
  const [token, setToken] = useState<Token | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (tokenMint) {
        try {
          setLoading(true);
          const tokenData = await fetchTokenById(tokenMint);

          if (tokenData) {
            setToken({
              tokenMint: tokenData.token_mint,
              tokenName: tokenData.token_name,
              tokenSymbol: tokenData.token_symbol,
              currentMarketCap: tokenData.current_market_cap,
              lastTradePrice: tokenData.last_trade_price,
            });
          } else {
            console.log('Token not found');
            setToken(null);
          }
        } catch (error) {
          console.error('Error fetching token details:', error);
          setToken(null);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [tokenMint]);

  // Track token searches when page is loaded
  useEffect(() => {
    if (token && token.tokenMint) {
      trackTokenSearch(token.tokenMint, token.tokenName || 'Unknown', token.tokenSymbol || 'UNKNOWN');
    }
  }, [token]);

  return (
    <div className="container mx-auto py-10">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">
            {loading ? <Skeleton className="h-8 w-[200px]" /> : (token ? token.tokenName : 'Token Not Found')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <>
              <div className="mb-4">
                <Skeleton className="h-4 w-1/2" />
              </div>
              <div className="mb-4">
                <Skeleton className="h-4 w-1/3" />
              </div>
              <Skeleton className="h-4 w-1/4" />
            </>
          ) : token ? (
            <>
              <div className="mb-4">
                <p className="text-lg">
                  <span className="font-semibold">Symbol:</span> {token.tokenSymbol}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-lg">
                  <span className="font-semibold">Mint Address:</span> {token.tokenMint}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-lg">
                  <span className="font-semibold">Market Cap:</span>{' '}
                  {token.currentMarketCap ? `$${token.currentMarketCap.toLocaleString()}` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-lg">
                  <span className="font-semibold">Last Trade Price:</span>{' '}
                  {token.lastTradePrice ? `$${token.lastTradePrice.toFixed(6)}` : 'N/A'}
                </p>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500">Token details not found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TokenDetail;
