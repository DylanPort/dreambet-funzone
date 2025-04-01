
import React, { useEffect, useState } from 'react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { Medal, User, Flame, Star, BarChart, ChevronDown, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const PXBLeaderboard: React.FC = () => {
  const {
    leaderboard,
    winRateLeaderboard,
    fetchLeaderboard,
    fetchWinRateLeaderboard,
    userProfile,
    isLeaderboardLoading,
    isLoadingWinRate
  } = usePXBPoints();
  
  const [animate, setAnimate] = useState(false);
  const [showAllUsers, setShowAllUsers] = useState(false);
  
  useEffect(() => {
    fetchLeaderboard();

    // Set animation state to true after a short delay for entrance animation
    const timer = setTimeout(() => setAnimate(true), 300);
    return () => clearTimeout(timer);
  }, [fetchLeaderboard]);
  
  const handleTabChange = (value: string) => {
    if (value === 'winrate') {
      fetchWinRateLeaderboard();
    }
  };
  
  const getLeaderIcon = (position: number) => {
    switch (position) {
      case 0:
        return <img src="/lovable-uploads/5e3244ff-5cfc-4b57-932a-2befcc6c5ab4.png" className="w-7 h-7 animate-pulse-glow" alt="Trophy" />;
      case 1:
        return <Medal className="w-5 h-5 text-gray-300 animate-bob" />;
      case 2:
        return <Medal className="w-5 h-5 text-amber-600 animate-bob" />;
      default:
        return <User className="w-5 h-5 text-dream-foreground/40" />;
    }
  };

  // Item entry animation delay
  const getAnimationDelay = (index: number) => {
    return {
      animationDelay: `${index * 0.1}s`
    };
  };

  // Get background class based on position
  const getPositionStyle = (position: number, isCurrentUser: boolean) => {
    if (isCurrentUser) return 'bg-dream-accent2/20 border border-dream-accent2/30';
    switch (position) {
      case 0:
        return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border-l-2 border-yellow-400';
      case 1:
        return 'bg-gradient-to-r from-gray-300/20 to-gray-400/10 border-l-2 border-gray-300';
      case 2:
        return 'bg-gradient-to-r from-orange-600/20 to-amber-700/10 border-l-2 border-orange-600';
      default:
        return position % 2 === 0 ? 'bg-dream-foreground/5 hover:bg-dream-foreground/10' : 'bg-black/30 hover:bg-black/40';
    }
  };
  
  // Filter out users with excessive points (greater than 100M PXB)
  const filteredLeaderboard = leaderboard ? leaderboard.filter(user => user.pxbPoints < 100000000) : [];
  
  const displayedPointsUsers = showAllUsers ? filteredLeaderboard : (filteredLeaderboard.slice(0, 10) || []);
  const displayedWinRateUsers = showAllUsers ? winRateLeaderboard : (winRateLeaderboard?.slice(0, 10) || []);
  
  const renderLeaderboardContent = (data: any[], valueKey: string, valueLabel: string, isLoading: boolean) => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-[320px]">
          <div className="animate-spin h-8 w-8 border-4 border-green-500 rounded-full border-t-transparent"></div>
        </div>
      );
    }
    
    if (!data || data.length === 0) {
      return (
        <div className="text-center py-4 text-dream-foreground/60">
          <p className="animate-pulse">No data yet. Be the first on the leaderboard!</p>
          <div className="mt-2 w-32 h-32 mx-auto opacity-20">
            <img 
              src="/lovable-uploads/5e3244ff-5cfc-4b57-932a-2befcc6c5ab4.png" 
              className="w-full h-full text-yellow-400 animate-float" 
              alt="Trophy" 
            />
          </div>
        </div>
      );
    }
    
    return (
      <ScrollArea className={showAllUsers ? "h-[420px] pr-4" : "h-[320px] pr-4"}>
        <div className="space-y-3">
          {data.map((trader, index) => {
            const isCurrentUser = trader.id === userProfile?.id;
            const userId = trader.id || trader.user_id;
            
            // Get the correct value based on whether this is a points or winrate display
            const displayValue = valueKey === 'winRate' 
              ? `${trader[valueKey]}%` 
              : `${trader[valueKey]} ${valueLabel}`;
            
            return (
              <div 
                key={userId} 
                className={cn(
                  `flex items-center p-2 rounded-lg transition-all duration-500 transform ${animate ? 'translate-x-0 opacity-100' : 'translate-x-[-20px] opacity-0'}`, 
                  getPositionStyle(index, isCurrentUser)
                )} 
                style={getAnimationDelay(index)}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center mr-3", 
                  index === 0 ? "bg-yellow-500/20" : 
                  index === 1 ? "bg-gray-300/20" : 
                  index === 2 ? "bg-orange-600/20" : 
                  "bg-dream-foreground/10"
                )}>
                  {getLeaderIcon(index)}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between">
                    <Link 
                      to={`/profile/${userId}`}
                      className="font-medium truncate max-w-[120px] flex items-center gap-1 hover:text-cyan-400 transition-colors" 
                      title={trader.username}
                    >
                      {trader.username}
                      {index < 3 && (
                        <span className="ml-1">
                          {index === 0 && <Flame className="h-3 w-3 text-yellow-400 animate-pulse" />}
                          {index === 1 && <Star className="h-3 w-3 text-gray-300" />}
                          {index === 2 && <Star className="h-3 w-3 text-orange-500" />}
                        </span>
                      )}
                    </Link>
                    <div className={cn(
                      "font-medium", 
                      index === 0 ? "text-yellow-400" : 
                      index === 1 ? "text-gray-300" : 
                      index === 2 ? "text-orange-500" : 
                      "text-green-400"
                    )}>
                      {displayValue}
                    </div>
                  </div>
                </div>
                
                {index < 3 && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
                    <div className={cn(
                      "absolute top-0 left-0 w-full h-full opacity-10", 
                      index === 0 ? "bg-yellow-400" : 
                      index === 1 ? "bg-gray-300" : 
                      "bg-orange-500"
                    )}>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shine"></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    );
  };

  return (
    <div className="glass-panel p-6">
      <h2 className="font-semibold text-lg mb-4 flex items-center">
        <img 
          src="/lovable-uploads/5e3244ff-5cfc-4b57-932a-2befcc6c5ab4.png" 
          className="mr-2 h-6 w-6" 
          alt="Trophy" 
        />
        Leaderboard
      </h2>
      
      <Tabs defaultValue="points" onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="points" className="flex items-center justify-center">
            <Coins className="mr-2 h-4 w-4" />
            <span>Points</span>
          </TabsTrigger>
          <TabsTrigger value="winrate" className="flex items-center justify-center">
            <BarChart className="mr-2 h-4 w-4" />
            <span>Win Rate</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="points" className="mt-0">
          {renderLeaderboardContent(displayedPointsUsers, 'pxbPoints', 'PXB', isLeaderboardLoading)}
        </TabsContent>
        
        <TabsContent value="winrate" className="mt-0">
          {renderLeaderboardContent(displayedWinRateUsers, 'winRate', '', isLoadingWinRate)}
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-center mt-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowAllUsers(!showAllUsers)}
          className="text-xs"
        >
          {showAllUsers ? 'Show Less' : 'Show More'}
          <ChevronDown className={`ml-1 h-3 w-3 transform transition-transform ${showAllUsers ? 'rotate-180' : ''}`} />
        </Button>
      </div>
    </div>
  );
};

export default PXBLeaderboard;
