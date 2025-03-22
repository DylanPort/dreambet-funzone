
import React, { useEffect, useState } from 'react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { Trophy, Medal, User, ArrowUp, Flame, Star, BarChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const PXBLeaderboard: React.FC = () => {
  const { leaderboard, fetchLeaderboard, userProfile } = usePXBPoints();
  const [animate, setAnimate] = useState(false);
  const [leaderboardTab, setLeaderboardTab] = useState<'points' | 'winrate'>('points');

  useEffect(() => {
    fetchLeaderboard();
    
    // Set animation state to true after a short delay for entrance animation
    const timer = setTimeout(() => setAnimate(true), 300);
    
    return () => clearTimeout(timer);
  }, [fetchLeaderboard]);

  // This is a placeholder for winrate data - in a real implementation
  // this would be fetched from your backend
  const winrateLeaderboard = leaderboard.map(user => ({
    ...user,
    winRate: Math.round(Math.random() * 100) // Replace with actual win rate data
  })).sort((a, b) => b.winRate - a.winRate);

  const getLeaderIcon = (position: number) => {
    switch(position) {
      case 0:
        return <Trophy className="w-5 h-5 text-yellow-400 animate-pulse-glow" />;
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
    return { animationDelay: `${index * 0.1}s` };
  };

  // Get background class based on position
  const getPositionStyle = (position: number, isCurrentUser: boolean) => {
    if (isCurrentUser) return 'bg-dream-accent2/20 border border-dream-accent2/30';
    
    switch(position) {
      case 0:
        return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border-l-2 border-yellow-400';
      case 1:
        return 'bg-gradient-to-r from-gray-300/20 to-gray-400/10 border-l-2 border-gray-300';
      case 2:
        return 'bg-gradient-to-r from-orange-600/20 to-amber-700/10 border-l-2 border-orange-600';
      default:
        return position % 2 === 0 
          ? 'bg-dream-foreground/5 hover:bg-dream-foreground/10' 
          : 'bg-black/30 hover:bg-black/40';
    }
  };

  const renderLeaderboardContent = (data: any[], valueKey: string, valueLabel: string) => (
    <ScrollArea className="h-[320px] pr-4">
      <div className="space-y-3">
        {data.map((trader, index) => {
          const isCurrentUser = trader.id === userProfile?.id;
          
          return (
            <div 
              key={trader.id} 
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
                  <div className="font-medium truncate max-w-[120px] flex items-center gap-1" title={trader.username}>
                    {trader.username}
                    {index < 3 && (
                      <span className="ml-1">
                        {index === 0 && <Flame className="h-3 w-3 text-yellow-400 animate-pulse" />}
                        {index === 1 && <Star className="h-3 w-3 text-gray-300" />}
                        {index === 2 && <Star className="h-3 w-3 text-orange-500" />}
                      </span>
                    )}
                  </div>
                  <div className={cn(
                    "font-medium",
                    index === 0 ? "text-yellow-400" : 
                    index === 1 ? "text-gray-300" : 
                    index === 2 ? "text-orange-500" : 
                    "text-green-400"
                  )}>
                    {valueKey === 'winRate' ? `${trader[valueKey]}%` : `${trader[valueKey]} ${valueLabel}`}
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

        {data.length === 0 && (
          <div className="text-center py-4 text-dream-foreground/60">
            <p className="animate-pulse">No data yet. Be the first on the leaderboard!</p>
            <div className="mt-2 w-32 h-32 mx-auto opacity-20">
              <Trophy className="w-full h-full text-yellow-400 animate-float" />
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );

  return (
    <div className="glass-panel p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-green-500/5 to-yellow-500/5 animate-gradient-move"></div>
      
      <div className="flex items-center mb-4 relative z-10">
        <Trophy className="w-6 h-6 mr-2 text-yellow-400 animate-bob" />
        <h2 className="text-xl font-bold bg-gradient-to-r from-green-400 via-yellow-300 to-orange-500 bg-clip-text text-transparent">Leaderboard</h2>
      </div>
      
      <Tabs defaultValue="points" className="w-full" onValueChange={(value) => setLeaderboardTab(value as 'points' | 'winrate')}>
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="points" className="flex items-center gap-1">
            <Star className="w-4 h-4" /> PXB Points
          </TabsTrigger>
          <TabsTrigger value="winrate" className="flex items-center gap-1">
            <BarChart className="w-4 h-4" /> Win Rate
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="points" className="mt-0">
          {renderLeaderboardContent(leaderboard, 'pxbPoints', 'PXB')}
        </TabsContent>
        
        <TabsContent value="winrate" className="mt-0">
          {renderLeaderboardContent(winrateLeaderboard, 'winRate', '')}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PXBLeaderboard;
