
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { PXBBet } from '@/types/pxb';
import PXBBetCard from '@/components/PXBBetCard';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchTokenMetrics } from '@/services/tokenDataCache';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { useToast } from '@/hooks/use-toast';

const PXBBetsList = () => {
  const { publicKey } = useWallet();
  const { userProfile, fetchUserBets } = usePXBPoints();
  const [bets, setBets] = useState<PXBBet[]>([]);
  const [loading, setLoading] = useState(true);
  const [marketCapData, setMarketCapData] = useState<Record<string, {
    initialMarketCap: number | null;
    currentMarketCap: number | null;
  }>>({});
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchBets = async () => {
      if (!publicKey && !userProfile) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);

        // If we have a user profile, use that ID
        const userId = userProfile?.id;
        if (!userId) {
          setLoading(false);
          return;
        }
        console.log("Fetching PXB bets for user:", userId);
        const {
          data,
          error
        } = await supabase.from('bets').select(`
            *,
            tokens:token_mint (
              token_name,
              token_symbol
            )
          `).or(`creator.eq.${publicKey?.toString()},bettor1_id.eq.${userId}`)
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (error) {
          console.error('Error fetching PXB bets:', error);
          setLoading(false);
          return;
        }
        if (data) {
          console.log("Raw PXB bets data:", data);

          // Transform to PXBBet format
          const transformedBets: PXBBet[] = data.map(bet => {
            // Calculate expiration time
            const createdTime = new Date(bet.created_at).getTime();
            const expiryTime = new Date(createdTime + bet.duration * 1000).toISOString();

            // Get token info from tokens relation
            const tokenName = bet.tokens?.token_name || bet.token_name || 'Unknown Token';
            const tokenSymbol = bet.tokens?.token_symbol || bet.token_symbol || 'UNK';

            // Determine bet status
            let status: 'open' | 'pending' | 'won' | 'lost' | 'expired' = 'open';
            if (bet.status === 'open') {
              const now = new Date().getTime();
              const expiry = new Date(expiryTime).getTime();
              if (now > expiry) {
                status = 'expired';
              } else {
                status = 'open';
              }
            } else if (bet.status === 'matched') {
              status = 'pending';
            } else if (bet.outcome === 'win') {
              status = 'won';
            } else if (bet.outcome === 'loss') {
              status = 'lost';
            }
            
            return {
              id: bet.bet_id,
              userId: bet.bettor1_id,
              creator: bet.creator,
              tokenMint: bet.token_mint,
              tokenName,
              tokenSymbol,
              betAmount: bet.sol_amount,
              betType: bet.prediction_bettor1 === 'up' ? 'up' : 'down',
              percentageChange: bet.percentage_change || 0,
              status,
              pointsWon: bet.points_won || 0,
              timestamp: new Date(bet.created_at).getTime(),
              expiresAt: expiryTime,
              createdAt: bet.created_at,
              initialMarketCap: bet.initial_market_cap,
              currentMarketCap: bet.current_market_cap
            };
          });
          console.log("Transformed PXB bets:", transformedBets);
          setBets(transformedBets);

          // Fetch current market cap data for each token
          transformedBets.forEach(async bet => {
            if (bet.tokenMint) {
              try {
                const metrics = await fetchTokenMetrics(bet.tokenMint);
                if (metrics && metrics.marketCap !== null) {
                  setMarketCapData(prev => ({
                    ...prev,
                    [bet.tokenMint]: {
                      initialMarketCap: bet.initialMarketCap,
                      currentMarketCap: metrics.marketCap
                    }
                  }));
                }
              } catch (error) {
                console.error(`Error fetching market cap for ${bet.tokenMint}:`, error);
              }
            }
          });
        }
      } catch (error) {
        console.error('Error in fetchUserBets:', error);
        toast({
          title: "Error fetching bets",
          description: "Failed to fetch your bets. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (userProfile || publicKey) {
      fetchBets();
    }
  }, [publicKey, userProfile]);

  if (loading) {
    return <div className="glass-panel p-6">
        <h2 className="font-semibold text-xl mb-4">Your PXB Bets</h2>
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="bg-black/40 rounded-lg border border-white/10 p-4">
              <div className="flex justify-between items-center mb-3">
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="h-4 w-32 mb-4" />
              <Skeleton className="h-3 w-full mb-2" />
              <div className="flex justify-between mb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-8 w-full mb-2" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>)}
        </div>
      </div>;
  }

  return (
    <div className="glass-panel p-6">
      <h2 className="font-semibold text-xl mb-4">Your PXB Bets</h2>
      <div className="space-y-4">
        {bets.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-dream-foreground/70 mb-3">You haven't placed any bets yet</p>
            <Button asChild variant="outline">
              <Link to="/betting">Place your first bet</Link>
            </Button>
          </div>
        ) : (
          <>
            {bets.map((bet) => (
              <PXBBetCard 
                key={bet.id} 
                bet={bet} 
                marketCapData={marketCapData[bet.tokenMint]} 
              />
            ))}
            <Button asChild variant="outline" className="w-full">
              <Link to="/betting">Place a new bet</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default PXBBetsList;
