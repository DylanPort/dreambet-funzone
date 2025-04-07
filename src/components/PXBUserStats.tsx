import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { usePXBPoints } from '@/contexts/pxb/PXBPointsContext';
import { Lock, ArrowUpRight, Award, Trophy, Users, Clock, Info, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Link } from 'react-router-dom';

interface UserStats {
  totalPoints: number;
  weeklyPoints: number[];
  weeklyLabels: string[];
  totalBets: number;
  wonBets: number;
  lostBets: number;
  winRate: number;
  averageBetAmount: number;
}

const initialUserStats: UserStats = {
  totalPoints: 0,
  weeklyPoints: [],
  weeklyLabels: [],
  totalBets: 0,
  wonBets: 0,
  lostBets: 0,
  winRate: 0,
  averageBetAmount: 0
};

const PXBUserStats = () => {
  const { userProfile } = usePXBPoints();
  const { toast } = useToast();
  const [userStats, setUserStats] = useState<UserStats>(initialUserStats);
  const [loadingUserStats, setLoadingUserStats] = useState(true);
  const [historyChartData, setHistoryChartData] = useState([]);

  const fetchUserStats = async () => {
    if (!userProfile?.id) {
      setLoadingUserStats(false);
      return;
    }

    setLoadingUserStats(true);
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userProfile.id)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setUserStats({
          totalPoints: data.total_points || 0,
          weeklyPoints: data.weekly_points || [],
          weeklyLabels: data.weekly_labels || [],
          totalBets: data.total_bets || 0,
          wonBets: data.won_bets || 0,
          lostBets: data.lost_bets || 0,
          winRate: data.win_rate || 0,
          averageBetAmount: data.average_bet_amount || 0
        });

        // Prepare chart data
        const chartData = data.weekly_points?.map((points: number, index: number) => ({
          name: data.weekly_labels?.[index] || `Week ${index + 1}`,
          points
        })) || [];
        setHistoryChartData(chartData);
      }
    } catch (error: any) {
      console.error("Failed to fetch user stats:", error);
      toast({
        title: "Error",
        description: "Failed to load user stats. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingUserStats(false);
    }
  };

  useEffect(() => {
    fetchUserStats();
  }, [userProfile?.id]);

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };
  
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold flex items-center">
          <Trophy className="h-5 w-5 mr-2 text-amber-400" />
          Your PXB Stats
        </h3>
        {loadingUserStats ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div> : null}
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/10 group flex flex-col items-center justify-center relative overflow-hidden">
          {/* Shimmering background effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-600/5 to-amber-400/10 animate-gradient-move transition-all duration-500 group-hover:opacity-50 opacity-30"></div>
          
          <div className="relative z-10 text-xs text-dream-foreground/60 mb-1 flex items-center">
            Total PXB Points
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 ml-1 text-dream-foreground/40" />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs max-w-[200px]">
                    <p className="font-semibold mb-1">PXB Points Capped</p>
                    <p>The PXB total supply has been fully minted. This value is now fixed.</p>
                  </div>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </div>
          
          <div className="text-2xl font-display font-bold text-white drop-shadow-[0_0_2px_rgba(255,138,0,0.5)] group-hover:scale-102 transition-transform relative">
            {formatNumber(userStats.totalPoints)}
            <span className="absolute -top-1 -right-3">
              <AlertTriangle className="h-3 w-3 text-amber-400" />
            </span>
            <div className="absolute -bottom-4 -right-1 text-[10px] bg-amber-500/30 rounded px-1 text-amber-300">
              CAPPED
            </div>
          </div>
        </div>
        
        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/10 group flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 to-green-400/10 animate-gradient-move transition-all duration-500 group-hover:opacity-50 opacity-30"></div>
          <div className="relative z-10 text-xs text-dream-foreground/60 mb-1">Total Bets Placed</div>
          <div className="text-2xl font-display font-bold text-white drop-shadow-[0_0_2px_rgba(0,255,138,0.5)] group-hover:scale-102 transition-transform">{formatNumber(userStats.totalBets)}</div>
        </div>
        
        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/10 group flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-blue-400/10 animate-gradient-move transition-all duration-500 group-hover:opacity-50 opacity-30"></div>
          <div className="relative z-10 text-xs text-dream-foreground/60 mb-1">Bets Won</div>
          <div className="text-2xl font-display font-bold text-white drop-shadow-[0_0_2px_rgba(0,138,255,0.5)] group-hover:scale-102 transition-transform">{formatNumber(userStats.wonBets)}</div>
        </div>
        
        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/10 group flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/5 to-red-400/10 animate-gradient-move transition-all duration-500 group-hover:opacity-50 opacity-30"></div>
          <div className="relative z-10 text-xs text-dream-foreground/60 mb-1">Bets Lost</div>
          <div className="text-2xl font-display font-bold text-white drop-shadow-[0_0_2px_rgba(255,0,69,0.5)] group-hover:scale-102 transition-transform">{formatNumber(userStats.lostBets)}</div>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-md font-semibold mb-2 flex items-center">
          <Clock className="h-4 w-4 mr-2 text-blue-400" />
          PXB Point History
        </h4>
        <Card className="bg-black/30 backdrop-blur-sm border border-white/10">
          <CardContent className="p-2">
            {historyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={historyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="name" stroke="#ffffff80" tickSize={8} tickMargin={5} />
                  <YAxis stroke="#ffffff80" tickSize={8} tickMargin={5} />
                  <Tooltip />
                  <Line type="monotone" dataKey="points" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-dream-foreground/60">No PXB point history available.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Button asChild className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
          <Link to="/profile" className="flex items-center">
            View Full Profile <ArrowUpRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default PXBUserStats;
