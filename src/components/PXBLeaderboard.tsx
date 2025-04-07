
import React, { useEffect, useState } from 'react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { Medal, User, Flame, Star, BarChart, ChevronDown, Coins, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
    if (fetchLeaderboard && typeof fetchLeaderboard === 'function') {
      fetchLeaderboard();
    }

    // Set animation state to true after a short delay for entrance animation
    const timer = setTimeout(() => setAnimate(true), 300);
    return () => clearTimeout(timer);
  }, [fetchLeaderboard]);
  
  const handleTabChange = (value: string) => {
    if (value === 'winrate' && fetchWinRateLeaderboard && typeof fetchWinRateLeaderboard === 'function') {
      fetchWinRateLeaderboard();
    }
  };
  
  const getLeaderIcon = (position: number, isSpecial?: boolean) => {
    if (isSpecial) {
      return <Trophy className="w-5 h-5 text-yellow-400 animate-pulse" />;
    }
    
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
  const getPositionStyle = (position: number, isCurrentUser: boolean, isSpecial?: boolean) => {
    if (isSpecial) {
      return 'bg-gradient-to-r from-purple-600/30 to-pink-500/20 border-l-2 border-purple-500 shadow-lg';
    }
    
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
  
  const formatPoints = (points: number) => {
    if (points >= 1000000) {
      return `${(points / 1000000).toFixed(1)}M`;
    } else if (points >= 1000) {
      return `${(points / 1000).toFixed(1)}K`;
    }
    return points;
  };
  
  // Safely handle arrays that might be undefined
  const safeArraySlice = (array: any[] | undefined | null, start: number, end?: number) => {
    if (!array || !Array.isArray(array)) return [];
    return array.slice(start, end);
  };
  
  // Ensure leaderboard and winRateLeaderboard are arrays before attempting to slice them
  const displayedPointsUsers = showAllUsers 
    ? leaderboard || []
    : safeArraySlice(leaderboard, 0, 10);
    
  const displayedWinRateUsers = showAllUsers 
    ? winRateLeaderboard || []
    : safeArraySlice(winRateLeaderboard, 0, 10);
  
  const renderLeaderboardTable = (data: any[], valueKey: string, valueLabel: string, isLoading: boolean) => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-[320px]">
          <div className="animate-spin h-8 w-8 border-4 border-green-500 rounded-full border-t-transparent"></div>
        </div>
      );
    }
    
    if (!data || data.length === 0) {
      return (
        <div className="text-center py-4 text-dream-foreground/60 h-[320px] flex flex-col justify-center">
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Rank</TableHead>
              <TableHead>Player</TableHead>
              <TableHead className="text-right">{valueKey === 'winRate' ? 'Win Rate' : 'Points'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((trader, index) => {
              const isCurrentUser = trader?.id === userProfile?.id;
              const userId = trader?.id || trader?.user_id;
              const isSpecial = trader?.isSpecial === true;
              
              if (!trader) return null;
              
              return (
                <TableRow 
                  key={userId || `trader-${index}`}
                  className={cn(
                    `transition-all duration-500 transform ${animate ? 'translate-x-0 opacity-100' : 'translate-x-[-20px] opacity-0'}`, 
                    getPositionStyle(index, isCurrentUser, isSpecial)
                  )}
                  style={getAnimationDelay(index)}
                >
                  <TableCell className="font-medium">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center", 
                      isSpecial ? "bg-purple-500/30" :
                      index === 0 ? "bg-yellow-500/20" : 
                      index === 1 ? "bg-gray-300/20" : 
                      index === 2 ? "bg-orange-600/20" : 
                      "bg-dream-foreground/10"
                    )}>
                      {getLeaderIcon(index, isSpecial)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {isSpecial ? (
                      <div 
                        className="font-medium truncate max-w-[180px] flex items-center gap-1 text-purple-300"
                        title={trader.username}
                      >
                        {trader.username}
                        <span className="ml-1">
                          <Star className="h-3 w-3 text-pink-400 animate-pulse" />
                        </span>
                      </div>
                    ) : (
                      <Link 
                        to={`/profile/${userId}`}
                        className="font-medium truncate max-w-[120px] flex items-center gap-1 hover:text-cyan-400 transition-colors" 
                        title={trader.username}
                      >
                        {trader.username}
                        {index < 3 && !isSpecial && (
                          <span className="ml-1">
                            {index === 0 && <Flame className="h-3 w-3 text-yellow-400 animate-pulse" />}
                            {index === 1 && <Star className="h-3 w-3 text-gray-300" />}
                            {index === 2 && <Star className="h-3 w-3 text-orange-500" />}
                          </span>
                        )}
                      </Link>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={cn(
                      "font-medium", 
                      isSpecial ? "text-purple-300 animate-pulse" :
                      index === 0 ? "text-yellow-400" : 
                      index === 1 ? "text-gray-300" : 
                      index === 2 ? "text-orange-500" : 
                      "text-green-400"
                    )}>
                      {valueKey === 'winRate' 
                        ? `${trader[valueKey] || 0}%` 
                        : `${formatPoints(trader[valueKey] || 0)} ${valueLabel}`}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
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
          {renderLeaderboardTable(displayedPointsUsers, 'pxbPoints', 'PXB', isLeaderboardLoading || false)}
        </TabsContent>
        
        <TabsContent value="winrate" className="mt-0">
          {renderLeaderboardTable(displayedWinRateUsers, 'winRate', '', isLoadingWinRate || false)}
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
