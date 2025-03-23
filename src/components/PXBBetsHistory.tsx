
import React, { useEffect, useState } from 'react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { PXBBet } from '@/types/pxb';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { formatTimeRemaining } from '@/utils/betUtils';

interface PXBBetsHistoryProps {
  userId?: string;
}

const PXBBetsHistory: React.FC<PXBBetsHistoryProps> = ({ userId }) => {
  const { userProfile, userBets, fetchUserBets, isLoadingBets } = usePXBPoints();
  const [otherUserBets, setOtherUserBets] = useState<PXBBet[]>([]);
  const [isLoadingOtherBets, setIsLoadingOtherBets] = useState(false);
  
  // Fetch bets for current user
  useEffect(() => {
    if (!userId && userProfile) {
      fetchUserBets();
    }
  }, [userProfile, fetchUserBets, userId]);
  
  // Fetch bets for other user if userId is provided
  useEffect(() => {
    const fetchOtherUserBets = async () => {
      if (!userId) return;
      
      setIsLoadingOtherBets(true);
      try {
        const { data, error } = await supabase
          .from('bets')
          .select('*')
          .eq('bettor1_id', userId)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching user bets:', error);
          return;
        }
        
        // Transform the data to match PXBBet format
        const formattedBets: PXBBet[] = data.map(bet => ({
          id: bet.bet_id,
          tokenMint: bet.token_mint,
          tokenName: bet.token_name || 'Unknown Token',
          tokenSymbol: bet.token_symbol || 'UNKNOWN',
          betAmount: Number(bet.sol_amount),
          betType: bet.prediction_bettor1 as 'up' | 'down',
          percentageChange: Number(bet.percentage_change || 0),
          status: bet.status as 'pending' | 'won' | 'lost',
          timestamp: new Date(bet.created_at).getTime(),
          expiresAt: new Date(bet.end_time || Date.now()).getTime(),
          owner: userId
        }));
        
        setOtherUserBets(formattedBets);
      } catch (error) {
        console.error('Error fetching bets:', error);
      } finally {
        setIsLoadingOtherBets(false);
      }
    };
    
    fetchOtherUserBets();
  }, [userId]);
  
  // Display the appropriate bets depending on whether we're viewing the current user or another user
  const betsToShow = userId ? otherUserBets : userBets || [];
  const isLoading = userId ? isLoadingOtherBets : isLoadingBets;

  const activeBets = betsToShow.filter(bet => 
    bet.status === 'pending' && bet.expiresAt > Date.now()
  );
  
  const completedBets = betsToShow.filter(bet => 
    bet.status === 'won' || bet.status === 'lost' || 
    (bet.status === 'pending' && bet.expiresAt <= Date.now())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[200px]">
        <div className="animate-spin h-8 w-8 border-4 border-green-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <Tabs defaultValue="active" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="active">Active Bets</TabsTrigger>
        <TabsTrigger value="completed">Completed Bets</TabsTrigger>
      </TabsList>
      
      <TabsContent value="active">
        <ScrollArea className="h-[300px]">
          {activeBets.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p>No active bets found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeBets.map(bet => (
                <div key={bet.id} className="flex items-center p-3 rounded-lg bg-[#0f1628]/80 backdrop-blur-lg border border-indigo-900/30">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center mr-2">
                        {bet.betType === 'up' ? (
                          <ArrowUp className="h-4 w-4 text-green-400" />
                        ) : (
                          <ArrowDown className="h-4 w-4 text-red-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{bet.tokenName}</h3>
                        <p className="text-xs text-indigo-300/70">{bet.tokenSymbol}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-medium text-white">{bet.betAmount} PXB</p>
                    <p className="text-xs text-indigo-300/70">
                      Expires in {formatTimeRemaining(bet.expiresAt - Date.now())}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </TabsContent>
      
      <TabsContent value="completed">
        <ScrollArea className="h-[300px]">
          {completedBets.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p>No completed bets found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedBets.map(bet => (
                <div 
                  key={bet.id} 
                  className={`flex items-center p-3 rounded-lg bg-[#0f1628]/80 backdrop-blur-lg border ${
                    bet.status === 'won' 
                      ? 'border-green-500/30' 
                      : bet.status === 'lost' 
                        ? 'border-red-500/30' 
                        : 'border-indigo-900/30'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                        bet.status === 'won' 
                          ? 'bg-green-500/20' 
                          : bet.status === 'lost' 
                            ? 'bg-red-500/20' 
                            : 'bg-gray-500/20'
                      }`}>
                        {bet.betType === 'up' ? (
                          <ArrowUp className={`h-4 w-4 ${
                            bet.status === 'won' ? 'text-green-400' : 'text-gray-400'
                          }`} />
                        ) : (
                          <ArrowDown className={`h-4 w-4 ${
                            bet.status === 'won' ? 'text-green-400' : 'text-gray-400'
                          }`} />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{bet.tokenName}</h3>
                        <p className="text-xs text-indigo-300/70">{bet.tokenSymbol}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-medium text-white">{bet.betAmount} PXB</p>
                    <p className={`text-xs ${
                      bet.status === 'won' 
                        ? 'text-green-400' 
                        : bet.status === 'lost' 
                          ? 'text-red-400' 
                          : 'text-gray-400'
                    }`}>
                      {bet.status === 'won' ? 'WON' : bet.status === 'lost' ? 'LOST' : 'EXPIRED'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
};

export default PXBBetsHistory;
