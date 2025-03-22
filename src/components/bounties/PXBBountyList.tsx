
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@solana/wallet-adapter-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, MessageCircle, CheckCircle2, Clock, Coins } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

interface Bounty {
  id: string;
  project_name: string;
  project_description: string;
  project_logo: string;
  task_type: string;
  pxb_reward: number;
  project_url: string;
  telegram_url: string;
  twitter_url: string;
  status: string;
  created_at: string;
  creator_id: string;
  submissions_count?: number;
  hasSubmitted?: boolean;
}

export function PXBBountyList() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [filteredBounties, setFilteredBounties] = useState<Bounty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { connected, publicKey } = useWallet();
  const { userProfile } = usePXBPoints();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBounties();
  }, [connected, publicKey]);

  useEffect(() => {
    if (filter === 'all') {
      setFilteredBounties(bounties);
    } else if (filter === 'completed') {
      setFilteredBounties(bounties.filter(b => b.hasSubmitted));
    } else if (filter === 'available') {
      setFilteredBounties(bounties.filter(b => !b.hasSubmitted && b.status === 'open'));
    }
  }, [filter, bounties]);

  const fetchBounties = async () => {
    setIsLoading(true);
    try {
      const { data: bountiesData, error } = await supabase
        .from('bounties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // If user is connected, check which bounties they've submitted to
      let bountiesWithStatus = bountiesData as Bounty[];
      
      if (connected && publicKey && userProfile) {
        // Get submission counts for each bounty
        const { data: submissionCountsData } = await supabase
          .from('bounties')
          .select('id, submissions(count)')
          .in('id', bountiesWithStatus.map(b => b.id));

        // Get user's submissions
        const { data: userSubmissions } = await supabase
          .from('submissions')
          .select('bounty_id')
          .eq('submitter_id', userProfile.id);

        const submittedBountyIds = userSubmissions?.map(s => s.bounty_id) || [];
        const submissionCountMap = submissionCountsData?.reduce((acc, item) => {
          acc[item.id] = (item.submissions as any[])[0]?.count || 0;
          return acc;
        }, {} as Record<string, number>) || {};

        bountiesWithStatus = bountiesWithStatus.map(bounty => ({
          ...bounty,
          submissions_count: submissionCountMap[bounty.id] || 0,
          hasSubmitted: submittedBountyIds.includes(bounty.id)
        }));
      }

      setBounties(bountiesWithStatus);
    } catch (error) {
      console.error('Error fetching bounties:', error);
      toast.error('Failed to load bounties');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewBounty = (bounty: Bounty) => {
    navigate(`/bounties/${bounty.id}`);
  };

  const getTaskTypeLabel = (type: string) => {
    switch (type) {
      case 'website_visit': return 'Visit Website';
      case 'telegram_join': return 'Join Telegram';
      case 'twitter_follow': return 'Follow Twitter';
      case 'multiple': return 'Multiple Tasks';
      default: return type;
    }
  };

  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case 'website_visit': return 'bg-blue-500';
      case 'telegram_join': return 'bg-indigo-500';
      case 'twitter_follow': return 'bg-sky-500';
      case 'multiple': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="w-full">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-10 w-16 rounded-full" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-28" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">PXB Bounties</h2>
        <div className="flex gap-2">
          <Button 
            variant={filter === 'all' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button 
            variant={filter === 'available' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setFilter('available')}
          >
            Available
          </Button>
          <Button 
            variant={filter === 'completed' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setFilter('completed')}
          >
            Completed
          </Button>
        </div>
      </div>

      {filteredBounties.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-gray-500">No bounties found</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBounties.map((bounty) => (
            <Card key={bounty.id} className="overflow-hidden hover:shadow-md transition-shadow border border-slate-200/80">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-bold">{bounty.project_name}</CardTitle>
                    <CardDescription className="text-xs">
                      {new Date(bounty.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge 
                    className={`${getTaskTypeColor(bounty.task_type)} text-white`}
                  >
                    {getTaskTypeLabel(bounty.task_type)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {bounty.project_description || "Complete tasks to earn PXB points"}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Coins className="h-4 w-4 text-amber-500" />
                  <span className="font-medium">{bounty.pxb_reward} PXB</span>
                </div>
                {bounty.submissions_count !== undefined && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Submissions</span>
                      <span>{bounty.submissions_count}</span>
                    </div>
                    <Progress value={Math.min(bounty.submissions_count * 10, 100)} />
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-2">
                <Button 
                  variant={bounty.hasSubmitted ? "secondary" : "default"} 
                  className="w-full"
                  onClick={() => handleViewBounty(bounty)}
                >
                  {bounty.hasSubmitted ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Completed
                    </>
                  ) : bounty.status === 'open' ? (
                    'View Bounty'
                  ) : (
                    <>
                      <Clock className="mr-2 h-4 w-4" />
                      Closed
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
