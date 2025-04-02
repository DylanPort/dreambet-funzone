
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

  return (
    <div className="space-y-4">
      {bets.slice(0, visibleCount).map((bet) => (
        <div key={bet.id} className="glass-panel p-6 group hover:border-dream-accent1/30 transition-all duration-300 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-dream-accent1/5 to-dream-accent3/5 opacity-50 group-hover:opacity-70 transition-opacity"></div>
          <div className="absolute -right-6 -top-6 w-16 h-16 bg-dream-accent2/10 blur-lg rounded-full"></div>
          <div className="absolute -left-6 -bottom-6 w-16 h-16 bg-dream-accent1/10 blur-lg rounded-full"></div>
          
          <div className="flex justify-between items-start mb-4 relative z-10">
            {/* Token Info */}
            <Link to={`/token/${bet.tokenMint}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-full bg-dream-accent1/10 flex items-center justify-center text-xl font-bold">
                {bet.tokenSymbol?.charAt(0) || '?'}
              </div>
              <div>
                <h3 className="font-bold">{bet.tokenName}</h3>
                <p className="text-dream-foreground/60 text-sm">{bet.tokenSymbol}</p>
              </div>
            </Link>
            
            {/* Bet Status */}
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${getBetStatusClass(bet)}`}>
              {getBetStatusText(bet)}
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4 relative z-10">
            {/* Bet Amount */}
            <div className="bg-dream-foreground/5 p-3 rounded-md">
              <p className="text-dream-foreground/50 text-xs mb-1">Amount</p>
              <p className="font-bold">{bet.betAmount} PXB</p>
            </div>
            
            {/* Prediction */}
            <div className="bg-dream-foreground/5 p-3 rounded-md">
              <p className="text-dream-foreground/50 text-xs mb-1">Prediction</p>
              <div className="flex items-center gap-1 font-medium">
                {bet.betType === 'up' ? (
                  <>
                    <ArrowUpRight className="w-4 h-4 text-green-400" />
                    <span className="text-green-400">Up {bet.percentageChange}%</span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="w-4 h-4 text-red-400" />
                    <span className="text-red-400">Down {bet.percentageChange}%</span>
                  </>
                )}
              </div>
            </div>
            
            {/* Time */}
            <div className="bg-dream-foreground/5 p-3 rounded-md sm:col-span-1 col-span-2">
              <p className="text-dream-foreground/50 text-xs mb-1">Created</p>
              <div className="flex items-center gap-1 text-dream-foreground/80">
                <Clock className="w-4 h-4" />
                <span>{formatDistanceToNow(new Date(bet.createdAt), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
          
          {bet.pointsWon > 0 && (
            <div className="relative z-10 p-3 bg-green-500/10 rounded-md border border-green-500/20 text-green-400 flex justify-between items-center mb-4">
              <span className="font-medium">Points Won</span>
              <span className="font-bold">{bet.pointsWon} PXB</span>
            </div>
          )}
          
          <Link to={`/betting/bet/${bet.id}`} className="text-dream-accent2 text-sm hover:text-dream-accent2/80 transition-colors flex items-center justify-end relative z-10">
            <span>View Details</span>
            <ArrowUpRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
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
