
import { useEffect, useCallback } from 'react';
import { UserProfile, PXBBet, SupabaseBetsRow } from '@/types/pxb';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { fetchDexScreenerData } from '@/services/dexScreenerService';

export const useBetProcessor = (
  bets: PXBBet[],
  userProfile: UserProfile | null,
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>,
  setBets: React.Dispatch<React.SetStateAction<PXBBet[]>>
) => {
  const processBets = useCallback(async () => {
    if (!bets.length || !userProfile) return;

    console.log('Processing pending bets...', bets.length);
    
    // Get pending bets that need to be checked
    const pendingBets = bets.filter(bet => bet.status === 'pending' || (bet.status === 'open' && new Date() >= new Date(bet.expiresAt)));
    console.log(`Found ${pendingBets.length} pending bets to process`);
    
    // Process each pending bet
    for (const bet of pendingBets) {
      try {
        // Check if bet has expired based on expiresAt timestamp
        const now = new Date();
        const expiresAt = new Date(bet.expiresAt);
        
        if (now >= expiresAt) {
          console.log(`Processing expired bet ${bet.id} for token ${bet.tokenSymbol}`);
          
          // Get the current market cap from DexScreener
          let tokenData;
          let currentMarketCap;
          let initialMarketCap = bet.initialMarketCap || 0;
          
          try {
            tokenData = await fetchDexScreenerData(bet.tokenMint);
            currentMarketCap = tokenData?.marketCap;
          } catch (fetchError) {
            console.error(`Unable to fetch current market cap for ${bet.tokenSymbol}:`, fetchError);
            // If we have initial market cap but no current, use a fallback approach
            if (initialMarketCap === 0) {
              console.log(`Could not process bet for ${bet.tokenSymbol} - insufficient data`);
              continue;
            }
            // If we have initial data, use last known market cap or estimate
            currentMarketCap = bet.currentMarketCap || initialMarketCap;
          }
          
          if (!currentMarketCap) {
            console.error(`Current market cap not available for ${bet.tokenSymbol}`);
            continue;
          }
          
          // Calculate percentage change
          const actualChange = ((currentMarketCap - initialMarketCap) / initialMarketCap) * 100;
          console.log(`${bet.tokenSymbol} market cap change: ${actualChange.toFixed(2)}%, prediction: ${bet.betType === 'up' ? '+' : '-'}${bet.percentageChange}%`);
          
          // Check if bet won based on direction and percentage change
          let betWon = false;
          
          if (bet.betType === 'up' && actualChange >= bet.percentageChange) {
            // Price went up by at least the predicted percentage
            betWon = true;
          } else if (bet.betType === 'down' && actualChange <= -bet.percentageChange) {
            // Price went down by at least the predicted percentage
            betWon = true;
          }
          
          // Calculate points won (double for winning)
          const pointsWon = betWon ? bet.betAmount * 2 : 0;
          
          // Update bet status in database - using database column naming convention but with type assertion
          const { error: betUpdateError } = await supabase
            .from('bets')
            .update({
              status: betWon ? 'won' : 'lost',
              points_won: pointsWon,
              current_market_cap: currentMarketCap
            } as Partial<SupabaseBetsRow>) // Use Partial with SupabaseBetsRow type
            .eq('bet_id', bet.id);
            
          if (betUpdateError) {
            console.error(`Error updating bet ${bet.id}:`, betUpdateError);
            continue;
          }
          
          // Record the bet result in history and update PXB supply stats
          await supabase
            .from('bet_history')
            .insert({
              bet_id: bet.id,
              user_id: userProfile.id,
              action: betWon ? 'bet_won' : 'bet_lost',
              details: {
                initial_market_cap: initialMarketCap,
                final_market_cap: currentMarketCap,
                percentage_change_actual: actualChange,
                percentage_change_predicted: bet.percentageChange,
                prediction: bet.betType,
                points_won: pointsWon,
                supply_impact: betWon ? -pointsWon : bet.betAmount // Track impact on total supply
              },
              market_cap_at_action: currentMarketCap
            });
          
          // If bet won, update user points
          if (betWon) {
            const updatedPoints = userProfile.pxbPoints + pointsWon;
            
            const { error: userUpdateError } = await supabase
              .from('users')
              .update({
                points: updatedPoints
              })
              .eq('id', userProfile.id);
              
            if (userUpdateError) {
              console.error(`Error updating user points for bet ${bet.id}:`, userUpdateError);
              continue;
            }
            
            // Update user profile in state
            setUserProfile({
              ...userProfile,
              pxbPoints: updatedPoints
            });
            
            // Show win notification
            toast.success(`🎉 Your bet on ${bet.tokenSymbol} won! You earned ${pointsWon} PXB Points from the house.`);
          } else {
            // Show loss notification with a less alarming tone
            toast(`Your bet on ${bet.tokenSymbol} didn't win this time.`, {
              description: `Your ${bet.betAmount} PXB Points have returned to the house supply. Market cap changed by ${actualChange.toFixed(2)}%, which didn't meet your ${bet.percentageChange}% prediction.`
            });
          }
          
          // Update bet in state
          setBets(prevBets => prevBets.map(b => 
            b.id === bet.id 
              ? { ...b, status: betWon ? 'won' : 'lost', pointsWon, currentMarketCap } 
              : b
          ));
        } else {
          // For active bets, update the current market cap for progress tracking
          try {
            const tokenData = await fetchDexScreenerData(bet.tokenMint);
            if (tokenData && tokenData.marketCap && bet.initialMarketCap) {
              // Update the current market cap in state for progress tracking
              setBets(prevBets => prevBets.map(b => 
                b.id === bet.id 
                  ? { ...b, currentMarketCap: tokenData.marketCap } 
                  : b
              ));
              
              // Update in database - using the database column name with proper typing
              await supabase
                .from('bets')
                .update({
                  current_market_cap: tokenData.marketCap
                } as Partial<SupabaseBetsRow>) // Use Partial with SupabaseBetsRow type
                .eq('bet_id', bet.id);
            }
          } catch (error) {
            // Silent error handling - no notification for market cap updates
            console.error(`Error updating current market cap for bet ${bet.id}:`, error);
            // Continue processing without showing error toast
          }
        }
      } catch (error) {
        console.error(`Error processing bet ${bet.id}:`, error);
        // Errors are logged to console but no toast is shown
      }
    }
  }, [bets, userProfile, setUserProfile, setBets]);

  // Run the processor every minute
  useEffect(() => {
    const interval = setInterval(processBets, 60000);
    
    // Also run once on component mount
    processBets();
    
    return () => clearInterval(interval);
  }, [processBets]);
};

export default useBetProcessor;
