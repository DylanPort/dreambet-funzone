
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Award, Globe, ExternalLink, PlusCircle, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useWallet } from '@solana/wallet-adapter-react';

type Bounty = {
  id: string;
  title: string;
  description: string;
  project_name: string;
  project_url?: string;
  telegram_url?: string;
  twitter_url?: string;
  project_logo?: string;
  pxb_reward: number;
  created_at: string;
  end_date: string;
  status: 'open' | 'closed' | 'expired';
  views: number;
  creator_id: string;
};

const PXBBountyPage = () => {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { userProfile } = usePXBPoints();
  const { connected } = useWallet();

  useEffect(() => {
    fetchBounties();
  }, [activeTab]);

  const fetchBounties = async () => {
    setLoading(true);
    try {
      let query = supabase.from('bounties').select('*');
      
      if (activeTab === 'open') {
        query = query.eq('status', 'open');
      } else if (activeTab === 'my-bounties' && userProfile) {
        query = query.eq('creator_id', userProfile.id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setBounties(data || []);
    } catch (error) {
      console.error('Error fetching bounties:', error);
      toast.error('Failed to load bounties');
    } finally {
      setLoading(false);
    }
  };

  // Filter bounties based on search query
  const filteredBounties = bounties.filter(bounty => 
    bounty.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bounty.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bounty.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Increment view count when viewing a bounty
  const incrementViews = async (bountyId: string) => {
    try {
      await supabase.rpc('increment_bounty_views', { bounty_id: bountyId });
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  return (
    <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8 mt-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-dream-foreground mb-2 flex items-center gap-2">
            <Award className="h-8 w-8 text-yellow-400" />
            PXB Bounties
          </h1>
          <p className="text-dream-foreground/70 max-w-2xl">
            Complete tasks for crypto projects to earn PXB points or create bounties to promote your own project.
          </p>
        </div>
        
        <div className="flex gap-3">
          <Link to="/bounties/create">
            <Button className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
              <PlusCircle className="h-4 w-4" />
              Create Bounty
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dream-foreground/50" />
          <Input
            placeholder="Search bounties by title, project or description"
            className="pl-10 bg-dream-background/50 border border-dream-border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <Tabs defaultValue="all" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 bg-dream-background/50">
          <TabsTrigger value="all">All Bounties</TabsTrigger>
          <TabsTrigger value="open">Open Bounties</TabsTrigger>
          {connected && <TabsTrigger value="my-bounties">My Bounties</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="all" className="mt-0">
          {renderBountiesList(filteredBounties, loading, incrementViews)}
        </TabsContent>
        
        <TabsContent value="open" className="mt-0">
          {renderBountiesList(filteredBounties, loading, incrementViews)}
        </TabsContent>
        
        <TabsContent value="my-bounties" className="mt-0">
          {connected ? (
            renderBountiesList(filteredBounties, loading, incrementViews)
          ) : (
            <div className="text-center py-10">
              <p>Please connect your wallet to view your bounties</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {!loading && filteredBounties.length === 0 && (
        <div className="text-center py-10 border border-dashed border-dream-border rounded-lg">
          <Award className="h-12 w-12 mx-auto text-dream-foreground/30 mb-3" />
          <h3 className="text-xl font-medium text-dream-foreground mb-2">No bounties found</h3>
          <p className="text-dream-foreground/70 mb-4">
            {activeTab === 'my-bounties' 
              ? "You haven't created any bounties yet." 
              : "There are no bounties matching your criteria."}
          </p>
          {activeTab === 'my-bounties' && (
            <Link to="/bounties/create">
              <Button>Create Your First Bounty</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

// Helper to render the list of bounties
function renderBountiesList(bounties: Bounty[], loading: boolean, incrementViews: (id: string) => void) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="border-dream-border bg-dream-card/50 animate-pulse">
            <CardHeader className="h-32 bg-dream-background/30"></CardHeader>
            <CardContent className="h-20 mt-4 bg-dream-background/20"></CardContent>
            <CardFooter className="h-10 mt-2 bg-dream-background/10"></CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {bounties.map((bounty) => (
        <Link 
          to={`/bounties/${bounty.id}`} 
          key={bounty.id}
          onClick={() => incrementViews(bounty.id)}
        >
          <Card className="border-dream-border bg-dream-card/50 hover:bg-dream-card/80 transition-all hover:shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {bounty.project_logo ? (
                    <img 
                      src={bounty.project_logo} 
                      alt={bounty.project_name} 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center">
                      <Globe className="h-4 w-4 text-indigo-400" />
                    </div>
                  )}
                  <span className="font-medium text-sm">{bounty.project_name}</span>
                </div>
                <div className="px-2 py-1 text-xs rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                  {bounty.status === 'open' ? 'Active' : bounty.status}
                </div>
              </div>
              <CardTitle className="text-xl leading-tight line-clamp-1">{bounty.title}</CardTitle>
              <CardDescription className="line-clamp-2 mt-1 text-dream-foreground/70">
                {bounty.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {bounty.project_url && (
                  <div className="px-2 py-1 text-xs rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    Website
                  </div>
                )}
                {bounty.telegram_url && (
                  <div className="px-2 py-1 text-xs rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Telegram
                  </div>
                )}
                {bounty.twitter_url && (
                  <div className="px-2 py-1 text-xs rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Twitter
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex items-center">
                <img 
                  src="/lovable-uploads/be886d35-fbcb-4675-926c-38691ad3e311.png" 
                  alt="PXB Points" 
                  className="w-5 h-5 mr-1" 
                />
                <span className="text-yellow-400 font-medium">{bounty.pxb_reward} PXB</span>
              </div>
              <div className="text-dream-foreground/50 text-xs flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                View Details
              </div>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export default PXBBountyPage;
