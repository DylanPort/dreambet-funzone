
import { useEffect, useCallback } from 'react';
import { UserProfile, PXBBet, SupabaseBetsRow } from '@/types/pxb';
import { supabase } from '@/integrations/supabase/client';
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
    const pendingBets = bets.filter(bet => 
      bet.status === 'pending' || 
      (bet.status === 'open' && new Date() >= new Date(bet.expiresAt))
    );
    console.log(`Found ${pendingBets.length} pending bets to process`);
    
    // Check for any high-value active bets (1000+ PXB) and log them
    const highValueActiveBets = bets.filter(bet => 
      bet.status === 'open' && 
      bet.betAmount >= 1000 && 
      new Date() < new Date(bet.expiresAt)
    );

    if (highValueActiveBets.length > 0) {
      highValueActiveBets.forEach(bet => {
        console.log(`High Value Bet Active: ${bet.betAmount} PXB on ${bet.tokenSymbol}!`);
      });
    }
    
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
            
            // If we don't have an initial market cap but have current market cap data,
            // this means we might need to use the stored initial value
            if (initialMarketCap === 0 && currentMarketCap) {
              console.log(`No initial market cap recorded for ${bet.tokenSymbol}, checking database...`);
              
              // Try to get the bet with initial market cap from database
              const { data: betData, error: betError } = await supabase
                .from('bets')
                .select('initial_market_cap')
                .eq('bet_id', bet.id)
                .single();
                
              if (!betError && betData && betData.initial_market_cap) {
                initialMarketCap = betData.initial_market_cap;
                console.log(`Found initial market cap in database: ${initialMarketCap}`);
              } else {
                // If still no initial market cap, we'll use a fallback approach
                console.log(`No initial market cap found in database either, using fallback...`);
                initialMarketCap = currentMarketCap; // This will effectively result in a 0% change
              }
            }
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
          const newStatus = betWon ? 'won' : 'lost';

          // Check if the bet might have expired without reaching target before being processed
          const betExpired = bet.status === 'open' && !betWon;
          const finalStatus = betExpired ? 'expired' : newStatus;
          
          // Update bet status in database - using database column naming convention but with type assertion
          const { error: betUpdateError } = await supabase
            .from('bets')
            .update({
              status: finalStatus,
              points_won: pointsWon,
              current_market_cap: currentMarketCap,
              initial_market_cap: initialMarketCap // Ensure initial market cap is saved
            } as Partial<SupabaseBetsRow>)
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
              action: finalStatus === 'expired' ? 'bet_expired' : (betWon ? 'bet_won' : 'bet_lost'),
              details: {
                initial_market_cap: initialMarketCap,
                final_market_cap: currentMarketCap,
                percentage_change_actual: actualChange,
                percentage_change_predicted: bet.percentageChange,
                prediction: bet.betType,
                points_won: pointsWon,
                supply_impact: finalStatus === 'expired' ? 0 : (betWon ? -pointsWon : bet.betAmount) // Track impact on total supply
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
            
            // Log win
            console.log(`🎉 Your bet on ${bet.tokenSymbol} won! You earned ${pointsWon} PXB Points from the house.`);
          } else if (finalStatus === 'expired') {
            // Log expired
            console.log(`Your bet on ${bet.tokenSymbol} has expired.`);
          } else {
            // Log loss
            console.log(`Your bet on ${bet.tokenSymbol} didn't win this time.`);
          }
          
          // Update bet in state
          setBets(prevBets => prevBets.map(b => 
            b.id === bet.id 
              ? { 
                  ...b, 
                  status: finalStatus, 
                  pointsWon, 
                  currentMarketCap,
                  initialMarketCap // Ensure initial market cap is updated in state
                } 
              : b
          ));
        } else {
          // For active bets, update the current market cap for progress tracking
          try {
            const tokenData = await fetchDexScreenerData(bet.tokenMint);
            if (tokenData && tokenData.marketCap) {
              // If we don't have an initial market cap yet, set it now
              let initialMarketCap = bet.initialMarketCap;
              if (!initialMarketCap) {
                // Check if we have it in the database
                const { data: betData, error: betError } = await supabase
                  .from('bets')
                  .select('initial_market_cap')
                  .eq('bet_id', bet.id)
                  .single();
                  
                if (!betError && betData && betData.initial_market_cap) {
                  initialMarketCap = betData.initial_market_cap;
                } else {
                  // If not in database, use current as initial (this is a new bet)
                  initialMarketCap = tokenData.marketCap;
                  
                  // Save initial market cap to database
                  await supabase
                    .from('bets')
                    .update({
                      initial_market_cap: initialMarketCap
                    } as Partial<SupabaseBetsRow>)
                    .eq('bet_id', bet.id);
                }
              }
              
              // Update the current market cap in state for progress tracking
              setBets(prevBets => prevBets.map(b => 
                b.id === bet.id 
                  ? { 
                      ...b, 
                      currentMarketCap: tokenData.marketCap,
                      initialMarketCap: initialMarketCap || b.initialMarketCap
                    } 
                  : b
              ));
              
              // Update in database
              await supabase
                .from('bets')
                .update({
                  current_market_cap: tokenData.marketCap,
                  initial_market_cap: initialMarketCap
                } as Partial<SupabaseBetsRow>)
                .eq('bet_id', bet.id);
            }
          } catch (error) {
            // Silent error handling for market cap updates
            console.error(`Error updating current market cap for bet ${bet.id}:`, error);
          }
        }
      } catch (error) {
        console.error(`Error processing bet ${bet.id}:`, error);
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
