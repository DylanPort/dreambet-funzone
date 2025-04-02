
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@solana/wallet-adapter-react';
import { ArrowUpRight, ArrowDownRight, Clock, Link as LinkIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { PXBBet } from '@/types/pxb';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchTokenMetrics } from '@/services/tokenDataCache';

interface PXBBetsHistoryProps {
  userId?: string;
  walletAddress?: string;
  limit?: number;
}

const PXBBetsHistory: React.FC<PXBBetsHistoryProps> = ({ userId, walletAddress, limit = 5 }) => {
  const { publicKey } = useWallet();
  const [bets, setBets] = useState<PXBBet[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(limit);

  useEffect(() => {
    const fetchBets = async () => {
      try {
        setLoading(true);
        
        // If no userId or walletAddress is provided, use the connected wallet
        const userWalletAddress = walletAddress || publicKey?.toString();
        let targetUserId = userId;
        
        if (!targetUserId && userWalletAddress) {
          // If we only have a wallet address, we need to look up the user ID
          console.log("Looking up user ID for wallet:", userWalletAddress);
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('wallet_address', userWalletAddress)
            .maybeSingle();
          
          if (userError) {
            console.error('Error fetching user by wallet address:', userError);
          } else if (userData) {
            targetUserId = userData.id;
            console.log("Found user ID:", targetUserId, "for wallet:", userWalletAddress);
          } else {
            console.log("No user found for wallet address:", userWalletAddress);
            setLoading(false);
            setBets([]);
            return;
          }
        }
        
        if (!targetUserId && !userWalletAddress) {
          console.log("No user ID or wallet address provided");
          setLoading(false);
          setBets([]);
          return;
        }
        
        // Query the bets from Supabase - joining with tokens table for token info
        let query = supabase
          .from('bets')
          .select(`
            *,
            tokens:token_mint (
              token_name,
              token_symbol
            )
          `)
          .order('created_at', { ascending: false });
        
        // Filter by user ID if provided  
        if (targetUserId) {
          query = query.or(`bettor1_id.eq.${targetUserId},creator.eq.${targetUserId}`);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching bets:', error);
          setLoading(false);
          return;
        }
        
        if (data) {
          console.log('Raw bets data:', data);
          
          // Transform the data to match PXBBet type
          const transformedBets: PXBBet[] = data.map(bet => {
            // Calculate expiration time based on created_at and duration
            const createdTime = new Date(bet.created_at).getTime();
            const expiryTime = new Date(createdTime + (bet.duration * 1000)).toISOString();
            
            // Get token info from tokens relation or fallback to direct fields
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
            
            // Determine bet type
            const betType = bet.prediction_bettor1 === 'up' ? 'up' : 'down';
            
            return {
              id: bet.bet_id,
              userId: bet.bettor1_id,
              tokenMint: bet.token_mint,
              tokenName: tokenName,
              tokenSymbol: tokenSymbol,
              betAmount: bet.sol_amount,
              betType: betType as 'up' | 'down',
              percentageChange: bet.percentage_change || 0,
              status: status,
              pointsWon: bet.points_won || 0,
              timestamp: new Date(bet.created_at).getTime(),
              expiresAt: expiryTime,
              createdAt: bet.created_at,
              creator: bet.creator,
              initialMarketCap: bet.initial_market_cap,
              currentMarketCap: bet.current_market_cap
            };
          });
          
          console.log('Transformed bets:', transformedBets);
          setBets(transformedBets);
        }
      } catch (error) {
        console.error('Error in fetchBets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBets();
  }, [publicKey, userId, walletAddress, limit]);

  const getBetStatusClass = (bet: PXBBet) => {
    const now = Date.now();
    const expiresAtTimestamp = new Date(bet.expiresAt).getTime();
    
    if (bet.status === 'won') {
      return 'bg-green-500/20 text-green-400';
    } else if (bet.status === 'lost') {
      return 'bg-red-500/20 text-red-400';
    } else if (now > expiresAtTimestamp) {
      return 'bg-yellow-500/20 text-yellow-400';
    } else {
      return 'bg-blue-500/20 text-blue-400';
    }
  };

  const getBetStatusText = (bet: PXBBet) => {
    const now = Date.now();
    const expiresAtTimestamp = new Date(bet.expiresAt).getTime();
    
    if (bet.status === 'won') {
      return 'Won';
    } else if (bet.status === 'lost') {
      return 'Lost';
    } else if (bet.status === 'pending') {
      return 'Pending';
    } else if (now > expiresAtTimestamp) {
      return 'Expired';
    } else {
      return 'Active';
    }
  };

  const showMore = () => {
    setVisibleCount(prev => prev + 5);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-2 border-dream-accent2 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-dream-foreground/70">Loading bets...</p>
      </div>
    );
  }

  if (bets.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-dream-foreground/70">No bets found</p>
      </div>
    );
  }

  // Updated rendering to match the Active Bets style
  return (
    <div className="space-y-4">
      {bets.slice(0, visibleCount).map((bet) => (
        <Link key={bet.id} to={`/betting/bet/${bet.id}`} className="block">
          <div className="futuristic-card bg-black/40 border border-gray-800/50 hover:border-dream-accent1/30 p-4 transition-all duration-300 rounded-lg group relative overflow-hidden">
            {/* Glowing effects */}
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-dream-accent2/10 blur-2xl rounded-full"></div>
            <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-dream-accent1/10 blur-2xl rounded-full"></div>
            
            {/* Top row with amount and status */}
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                {bet.betType === 'up' ? (
                  <ArrowUpRight className="text-green-400 h-5 w-5" />
                ) : (
                  <ArrowDownRight className="text-red-400 h-5 w-5" />
                )}
                <span className="font-bold text-xl text-white">{bet.betAmount} PXB</span>
              </div>
              <div className={`py-1 px-3 rounded-full text-xs font-medium ${getBetStatusClass(bet)}`}>
                {getBetStatusText(bet)}
              </div>
            </div>
            
            {/* Prediction info */}
            <div className="mb-3">
              <p className="text-dream-foreground/80 text-sm">
                Prediction: Price will {bet.betType === 'up' ? 'increase' : 'decrease'} by {bet.percentageChange}%
              </p>
            </div>
            
            {/* Bottom row with time and creator */}
            <div className="flex justify-between items-center text-xs text-dream-foreground/60">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                <span>Created {formatDistanceToNow(new Date(bet.createdAt), { addSuffix: true })}</span>
              </div>
              <div>
                Creator: Unknown
              </div>
            </div>
            
            {/* Scan line animation on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none">
              <div className="absolute h-[1px] w-full bg-gradient-to-r from-transparent via-dream-accent1/40 to-transparent top-[30%] -left-full group-hover:animate-scan-line"></div>
            </div>
          </div>
        </Link>
      ))}
      
      {bets.length > visibleCount && (
        <div className="text-center pt-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={showMore}
            className="text-xs bg-dream-background/40 hover:bg-dream-accent1/10"
          >
            Show More
          </Button>
        </div>
      )}
    </div>
  );
};

export default PXBBetsHistory;
