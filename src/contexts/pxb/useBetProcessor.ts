
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PXBBet, UserProfile } from '@/types/pxb';
import { toast } from 'sonner';

export const useBetProcessor = (
  bets: PXBBet[],
  userProfile: UserProfile | null,
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>,
  setBets: React.Dispatch<React.SetStateAction<PXBBet[]>>
) => {
  useEffect(() => {
    if (!bets.length) return;
    
    const interval = setInterval(async () => {
      const now = new Date();
      const pendingBets = bets.filter(bet => 
        bet.status === 'pending' && new Date(bet.expiresAt) < now
      );
      
      if (!pendingBets.length) return;
      
      for (const bet of pendingBets) {
        try {
          const won = Math.random() > 0.5;
          const pointsWon = won ? bet.betAmount * 2 : 0;
          const newStatus = won ? 'won' as const : 'lost' as const;
          
          await supabase
            .from('bets')
            .update({ 
              status: newStatus,
              points_won: pointsWon 
            })
            .eq('bet_id', bet.id);
          
          if (won && userProfile) {
            await supabase
              .from('users')
              .update({ 
                points: userProfile.pxbPoints + pointsWon
              })
              .eq('id', userProfile.id);
            
            setUserProfile({
              ...userProfile,
              pxbPoints: userProfile.pxbPoints + pointsWon
            });
            
            toast.success(`Your bet on ${bet.tokenSymbol} won! +${pointsWon} PXB Points`);
          } else {
            toast.error(`Your bet on ${bet.tokenSymbol} lost!`);
          }
          
          setBets(prevBets => prevBets.map(b => 
            b.id === bet.id 
              ? { ...b, status: newStatus, pointsWon } 
              : b
          ));
        } catch (error) {
          console.error(`Error processing bet ${bet.id}:`, error);
        }
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [bets, userProfile, setBets, setUserProfile]);
};
