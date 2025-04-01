
import { useEffect } from 'react';
import { PXBBet, UserProfile } from '@/types/pxb';
import { supabase } from '@/integrations/supabase/client';

export const useBetProcessor = (
  bets: PXBBet[],
  userProfile: UserProfile | null,
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>,
  setBets: React.Dispatch<React.SetStateAction<PXBBet[]>>
) => {
  useEffect(() => {
    if (!userProfile || !Array.isArray(bets) || bets.length === 0) {
      return;
    }

    // Function to process expired bets
    const processExpiredBets = async () => {
      const now = new Date();
      
      // Find expired pending bets that need to be resolved
      const expiredBets = bets.filter(bet => 
        (bet.status === 'pending' || bet.status === 'open') && 
        new Date(bet.expiresAt) < now
      );
      
      if (expiredBets.length === 0) return;
      
      console.log(`Found ${expiredBets.length} expired bets to process`);
      
      // Process each expired bet
      for (const bet of expiredBets) {
        try {
          // Get current token price/market cap from database
          const { data: tokenData, error: tokenError } = await supabase
            .from('tokens')
            .select('current_market_cap')
            .eq('token_mint', bet.tokenMint)
            .single();
          
          if (tokenError) {
            console.error(`Error fetching token data for ${bet.tokenMint}:`, tokenError);
            continue;
          }
          
          const initialMarketCap = bet.initialMarketCap || 0;
          const currentMarketCap = tokenData?.current_market_cap || 0;
          
          // Calculate actual percentage change
          let percentageChange = 0;
          if (initialMarketCap > 0) {
            percentageChange = ((currentMarketCap - initialMarketCap) / initialMarketCap) * 100;
          }
          
          // Determine if bet is won or lost
          let status: 'won' | 'lost' = 'lost';
          if (
            (bet.betType === 'up' && percentageChange >= bet.percentageChange) ||
            (bet.betType === 'down' && percentageChange <= -bet.percentageChange)
          ) {
            status = 'won';
          }
          
          // Calculate points won
          const pointsWon = status === 'won' ? Math.floor(bet.betAmount * 1.95) : 0;
          
          // Update bet status in database
          const { error: updateError } = await supabase
            .from('bets')
            .update({
              status: status,
              points_won: pointsWon,
              current_market_cap: currentMarketCap
            })
            .eq('bet_id', bet.id);
          
          if (updateError) {
            console.error(`Error updating bet ${bet.id}:`, updateError);
            continue;
          }
          
          // If bet is won, add points to user
          if (status === 'won' && pointsWon > 0) {
            try {
              // Use a parameterized query instead of raw SQL
              const { data, error } = await supabase
                .from('users')
                .update({ 
                  points: userProfile.pxbPoints + pointsWon 
                })
                .eq('id', userProfile.id)
                .select();
              
              if (error) {
                console.error(`Error adding points to user ${userProfile.id}:`, error);
              } else {
                // Update user profile in state
                setUserProfile({
                  ...userProfile,
                  pxbPoints: userProfile.pxbPoints + pointsWon
                });
                
                // Record the transaction in points history
                await supabase.from('points_history').insert({
                  user_id: userProfile.id,
                  amount: pointsWon,
                  action: 'bet_win',
                  reference_id: bet.id
                });
                
                console.log(`Added ${pointsWon} points to user ${userProfile.id} for winning bet ${bet.id}`);
              }
            } catch (error) {
              console.error(`Error processing points for winning bet ${bet.id}:`, error);
            }
          }
          
          // Update bet in state
          setBets(currentBets => 
            currentBets.map(b => 
              b.id === bet.id
                ? {
                    ...b,
                    status: status,
                    pointsWon,
                    currentMarketCap
                  }
                : b
            )
          );
          
          console.log(`Processed expired bet ${bet.id}: ${status}, points won: ${pointsWon}`);
        } catch (error) {
          console.error(`Error processing bet ${bet.id}:`, error);
        }
      }
    };
    
    // Process expired bets initially
    processExpiredBets();
    
    // Set up interval to check for expired bets periodically (every minute)
    const intervalId = setInterval(processExpiredBets, 60000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [bets, userProfile, setUserProfile, setBets]);
};
