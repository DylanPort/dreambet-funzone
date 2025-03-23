
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
  limit?: number;
}

const PXBBetsHistory: React.FC<PXBBetsHistoryProps> = ({ userId, limit = 5 }) => {
  const { publicKey } = useWallet();
  const [bets, setBets] = useState<PXBBet[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(limit);

  useEffect(() => {
    const fetchBets = async () => {
      try {
        setLoading(true);
        
        // Determine which user ID to use
        const targetUserId = userId || publicKey?.toString();
        
        if (!targetUserId) {
          setLoading(false);
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
  }, [publicKey, userId]);

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
        <div key={bet.id} className="border border-dream-foreground/10 rounded-md p-4 backdrop-blur-lg bg-black/20 hover:border-dream-accent1/30 transition-all duration-300">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${bet.betType === 'up' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {bet.betType === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              </div>
              <span className="font-semibold">
                {bet.betAmount} PXB
              </span>
            </div>
            <div className={`text-xs px-2 py-0.5 rounded-full ${getBetStatusClass(bet)}`}>
              {getBetStatusText(bet)}
            </div>
          </div>
          
          <Link to={`/token/${bet.tokenMint}`} className="block mb-1 hover:underline">
            <div className="text-sm flex items-center text-dream-accent2">
              <LinkIcon className="w-3 h-3 mr-1" />
              {bet.tokenName} ({bet.tokenSymbol})
            </div>
          </Link>
          
          <div className="text-sm text-dream-foreground/70 mb-1">
            Prediction: {bet.betType === 'up' ? 'Price will increase' : 'Price will decrease'} by {bet.percentageChange}%
          </div>
          
          <div className="text-xs text-dream-foreground/60 mb-2">
            <div className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              Created {formatDistanceToNow(new Date(bet.createdAt), { addSuffix: true })}
            </div>
          </div>
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
