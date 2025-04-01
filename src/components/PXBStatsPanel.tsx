
import React, { useState, useEffect } from 'react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { 
  ArrowUp, 
  ArrowDown, 
  BarChart, 
  Calendar, 
  Sparkles, 
  Cake,
  Users,
  Gem,
  Activity,
  Share,
  Gift,
  Trophy
} from 'lucide-react';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const PXBStatsPanel = () => {
  const { 
    userProfile, 
    isLoading, 
    bets, 
    referralStats, 
    isLoadingReferrals, 
    fetchReferralStats 
  } = usePXBPoints();
  
  const [tabValue, setTabValue] = useState('overview');
  
  useEffect(() => {
    if (userProfile && fetchReferralStats) {
      fetchReferralStats();
    }
  }, [userProfile, fetchReferralStats]);
  
  if (isLoading) {
    return (
      <div className="w-full glass-panel p-6 h-[280px] flex items-center justify-center">
        <div className="space-y-4 w-full">
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }
  
  if (!userProfile) {
    return (
      <div className="glass-panel p-6 text-center">
        <div className="mb-4 text-dream-foreground/60">
          <Gem className="h-12 w-12 mx-auto mb-2 text-dream-accent2/40" />
          <p className="text-lg">Connect your wallet to view PXB stats</p>
        </div>
        <p className="text-sm text-dream-foreground/50">
          Track your PXB points, betting stats, and referrals
        </p>
      </div>
    );
  }
  
  // Calculate some stats
  const totalBets = bets?.length || 0;
  const wonBets = bets?.filter(bet => bet.status === 'won').length || 0;
  const lostBets = bets?.filter(bet => bet.status === 'lost').length || 0;
  const pendingBets = bets?.filter(bet => ['pending', 'open'].includes(bet.status)).length || 0;
  
  const winRate = totalBets ? Math.round((wonBets / totalBets) * 100) : 0;
  
  const accountAge = userProfile.createdAt 
    ? Math.ceil((Date.now() - new Date(userProfile.createdAt).getTime()) / (1000 * 60 * 60 * 24)) 
    : 0;
  
  const totalPoints = userProfile.pxbPoints;
  const formattedPoints = totalPoints?.toLocaleString() || '0';
  
  const referralsCount = referralStats?.referrals_count || 0;
  const pointsFromReferrals = referralStats?.pointsEarned || 0;
  
  const StatsTab = (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-dream-foreground/5 p-3 rounded-lg text-center">
        <div className="text-xs text-dream-foreground/60 mb-1 flex items-center justify-center">
          <Activity className="w-3 h-3 mr-1" />
          <span>Win Rate</span>
        </div>
        <div className="text-xl font-bold flex items-center justify-center">
          <span className={winRate > 50 ? 'text-green-400' : winRate > 0 ? 'text-yellow-400' : 'text-dream-foreground/80'}>
            {winRate}%
          </span>
        </div>
      </div>
      
      <div className="bg-dream-foreground/5 p-3 rounded-lg text-center">
        <div className="text-xs text-dream-foreground/60 mb-1 flex items-center justify-center">
          <Trophy className="w-3 h-3 mr-1" />
          <span>Won</span>
        </div>
        <div className="text-xl font-bold flex items-center justify-center">
          <span className="text-green-400">{wonBets}</span>
          <span className="text-xs text-dream-foreground/60 ml-1">/ {totalBets}</span>
        </div>
      </div>
      
      <div className="bg-dream-foreground/5 p-3 rounded-lg text-center">
        <div className="text-xs text-dream-foreground/60 mb-1 flex items-center justify-center">
          <BarChart className="w-3 h-3 mr-1" />
          <span>Pending</span>
        </div>
        <div className="text-xl font-bold flex items-center justify-center">
          <span className="text-blue-400">{pendingBets}</span>
        </div>
      </div>
    </div>
  );
  
  const ReferralsTab = (
    <div className="space-y-4">
      {isLoadingReferrals ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-dream-foreground/5 p-3 rounded-lg">
              <div className="text-xs text-dream-foreground/60 mb-1 flex items-center">
                <Users className="w-3 h-3 mr-1" />
                <span>Total Referrals</span>
              </div>
              <div className="text-xl font-bold">
                {referralsCount}
              </div>
            </div>
            
            <div className="bg-dream-foreground/5 p-3 rounded-lg">
              <div className="text-xs text-dream-foreground/60 mb-1 flex items-center">
                <Gift className="w-3 h-3 mr-1" />
                <span>Points Earned</span>
              </div>
              <div className="text-xl font-bold">
                {pointsFromReferrals.toLocaleString()}
              </div>
            </div>
          </div>
          
          <div>
            <div className="text-xs text-dream-foreground/60 mb-2 flex items-center">
              <Share className="w-3 h-3 mr-1" />
              <span>Your Referral Code</span>
            </div>
            
            {userProfile.referralCode ? (
              <div className="flex items-center">
                <div className="bg-dream-foreground/5 p-2 px-3 rounded-lg text-dream-accent2 font-mono font-bold flex-1">
                  {userProfile.referralCode}
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-2"
                        onClick={() => {
                          navigator.clipboard.writeText(userProfile.referralCode || '');
                        }}
                      >
                        Copy
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy referral code</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ) : (
              <div className="text-dream-foreground/60 text-sm">
                Go to your profile to generate a referral code
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
  
  const handleTabChange = (value: string) => {
    setTabValue(value);
  };
  
  return (
    <div className="glass-panel">
      <div className="p-6 border-b border-dream-foreground/10">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold flex items-center">
              <Sparkles className="mr-2 h-5 w-5 text-yellow-400" />
              <span className="mr-2">PXB Dashboard</span>
              <Badge variant="outline" className="font-normal text-xs">Beta</Badge>
            </h2>
            <p className="text-sm text-dream-foreground/60 mt-1">
              Your PXB points: <span className="text-dream-accent2 font-semibold">{formattedPoints}</span>
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-xs text-dream-foreground/60">
              <Calendar className="inline h-3 w-3 mr-1" />
              Account Age
            </div>
            <div className="text-sm">
              {accountAge} {accountAge === 1 ? 'day' : 'days'}
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <Tabs defaultValue="overview" value={tabValue} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-0 space-y-4">
            {StatsTab}
          </TabsContent>
          
          <TabsContent value="referrals" className="mt-0">
            {ReferralsTab}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PXBStatsPanel;
