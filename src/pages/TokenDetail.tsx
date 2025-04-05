import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';  // Move this import to the top
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ExternalLink, BarChart2, Clock, DollarSign, Layers, Tag, TrendingUp } from 'lucide-react';
import PriceChart from '@/components/PriceChart';
import TokenTrading from '@/components/TokenTrading';
import TokenPortfolio from '@/components/TokenPortfolio';
import TransactionHistory from '@/components/TransactionHistory';
import { usePXBPoints } from '@/contexts/PXBPointsContext';

interface TokenDetailProps {
  // Define any props if needed
}

const TokenDetail: React.FC<TokenDetailProps> = ({ /* props */ }) => {
  const { id } = useParams<{ id: string }>();
  const [tokenData, setTokenData] = useState<{
    name: string;
    symbol: string;
    price: number;
    marketCap: number | null;
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { connected } = useWallet();
  const { userProfile } = usePXBPoints();

  useEffect(() => {
    // Mock API call to fetch token data
    const fetchTokenData = async () => {
      setLoading(true);
      try {
        // Simulate fetching data from an API
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

        // Replace with actual data fetching logic
        const mockTokenData = {
          name: `Token ${id}`,
          symbol: id?.substring(0, 3).toUpperCase() || 'TOK',
          price: Math.random() * 100,
          marketCap: Math.random() > 0.5 ? Math.random() * 1000000000 : null,
        };

        setTokenData(mockTokenData);
      } catch (error) {
        console.error('Error fetching token data:', error);
        toast.error('Failed to load token data');
        setTokenData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTokenData();
  }, [id]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(2);
  };

  return (
    <div className="container py-8">
      <Link to="/" className="inline-flex items-center mb-4 text-sm font-medium hover:underline">
        <ArrowLeft size={16} className="mr-2" />
        Back to Home
      </Link>

      {loading ? (
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              <Skeleton className="h-5 w-40" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-4 w-60" />
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      ) : tokenData ? (
        <div className="grid gap-6">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center">
                {tokenData.name}
                <Badge className="ml-2">{tokenData.symbol}</Badge>
              </CardTitle>
              <CardDescription>
                View detailed information about {tokenData.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-lg font-semibold">${tokenData.price.toFixed(2)}</p>
                  <p className="text-sm text-dream-foreground/60">
                    Market Cap: {tokenData.marketCap ? `$${formatNumber(tokenData.marketCap)}` : 'N/A'}
                  </p>
                </div>
                <Button variant="secondary" size="sm">
                  <ExternalLink size={16} className="mr-2" />
                  View on Explorer
                </Button>
              </div>

              <PriceChart />

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <BarChart2 size={16} className="text-dream-accent1" />
                  <span>Volume: <span className="font-medium">N/A</span></span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock size={16} className="text-dream-accent1" />
                  <span>24h Change: <span className="font-medium">N/A</span></span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign size={16} className="text-dream-accent1" />
                  <span>Circulating Supply: <span className="font-medium">N/A</span></span>
                </div>
                <div className="flex items-center space-x-2">
                  <Layers size={16} className="text-dream-accent1" />
                  <span>Total Supply: <span className="font-medium">N/A</span></span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TokenTrading
              tokenId={id}
              tokenName={tokenData.name}
              tokenSymbol={tokenData.symbol}
              tokenPrice={tokenData.price}
              marketCap={tokenData.marketCap}
              onTradeComplete={() => {
                // Refresh data or provide feedback after trade
              }}
            />
            <TokenPortfolio tokenId={id} />
          </div>

          <TransactionHistory tokenId={id} />
        </div>
      ) : (
        <Card className="glass-panel">
          <CardContent className="text-center py-8">
            <p className="text-lg text-dream-foreground/60">Failed to load token data.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TokenDetail;
