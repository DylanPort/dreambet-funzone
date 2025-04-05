import React, { useState, useEffect } from 'react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { PXBBetCard } from '@/components/PXBBetCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from 'date-fns';
import { Clock } from 'lucide-react';
import { fetchDexScreenerData } from '@/services/dexScreenerService';

const MyBets = () => {
  const { userProfile, bets, isLoadingBets, fetchUserBets, referralStats } = usePXBPoints();
  const [openBets, setOpenBets] = useState([]);
  const [completedBets, setCompletedBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marketCapData, setMarketCapData] = useState({});

  useEffect(() => {
    const loadBets = async () => {
      setLoading(true);
      if (userProfile) {
        await fetchUserBets();
      }
      setLoading(false);
    };

    loadBets();
  }, [userProfile, fetchUserBets]);

  useEffect(() => {
    if (bets) {
      setOpenBets(bets.filter(bet => bet.status === 'open' || bet.status === 'pending'));
      setCompletedBets(bets.filter(bet => bet.status === 'won' || bet.status === 'lost' || bet.status === 'expired'));
    }
  }, [bets]);

  useEffect(() => {
    const fetchMarketCaps = async () => {
      if (bets && bets.length > 0) {
        const marketCapPromises = bets.map(bet =>
          fetchDexScreenerData(bet.tokenMint)
            .then(data => ({ [bet.tokenMint]: data?.marketCap || null }))
            .catch(() => ({ [bet.tokenMint]: null }))
        );

        const marketCapResults = await Promise.all(marketCapPromises);

        const marketCapObject = marketCapResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
        setMarketCapData(marketCapObject);
      }
    };

    fetchMarketCaps();
  }, [bets]);

  const getMarketCap = (tokenMint: string) => {
    return marketCapData[tokenMint] || null;
  };

  const formatTimeAgo = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return formatDistanceToNow(date, {
        addSuffix: true
      });
    } catch (e) {
      return 'recently';
    }
  };

  const referralsCount = referralStats?.referralsCount || 0;

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold text-white mb-6">My PXB Bets</h1>

      <Tabs defaultValue="open" className="w-full">
        <TabsList>
          <TabsTrigger value="open">Open Bets ({openBets.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed Bets ({completedBets.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="open" className="mt-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-900/50 rounded-lg border border-gray-800 p-4">
                  <Skeleton className="w-full h-32 mb-2 rounded-md" />
                  <Skeleton className="w-1/2 h-6 mb-2" />
                  <Skeleton className="w-1/4 h-4" />
                </div>
              ))}
            </div>
          ) : openBets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {openBets.map(bet => (
                <PXBBetCard
                  key={bet.id}
                  bet={bet}
                  marketCapData={{
                    initialMarketCap: bet.initialMarketCap,
                    currentMarketCap: getMarketCap(bet.tokenMint)
                  }}
                  isLoading={isLoadingBets}
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-10">
              No open bets found. Place a bet to get started!
            </div>
          )}
        </TabsContent>
        <TabsContent value="completed" className="mt-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-900/50 rounded-lg border border-gray-800 p-4">
                  <Skeleton className="w-full h-32 mb-2 rounded-md" />
                  <Skeleton className="w-1/2 h-6 mb-2" />
                  <Skeleton className="w-1/4 h-4" />
                </div>
              ))}
            </div>
          ) : completedBets.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>A list of your completed bets.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Token</TableHead>
                    <TableHead>Bet Amount</TableHead>
                    <TableHead>Prediction</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Points Won</TableHead>
                    <TableHead>Time Ago</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedBets.map((bet) => (
                    <TableRow key={bet.id}>
                      <TableCell className="font-medium">{bet.tokenSymbol}</TableCell>
                      <TableCell>{bet.betAmount} PXB</TableCell>
                      <TableCell>{bet.betType}</TableCell>
                      <TableCell>
                        {bet.status === 'won' ? <Badge variant="success">Won</Badge> : bet.status === 'lost' ? <Badge variant="destructive">Lost</Badge> : <Badge>{bet.status}</Badge>}
                      </TableCell>
                      <TableCell>{bet.pointsWon}</TableCell>
                      <TableCell className="text-gray-500">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1 opacity-70" />
                          <span>{formatTimeAgo(bet.createdAt)}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-10">
              No completed bets found. Place a bet to get started!
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyBets;
