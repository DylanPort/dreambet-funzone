import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Award, Plus, Search, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navbar from '@/components/Navbar';

type Bounty = {
  id: string;
  title: string;
  description: string;
  required_proof: string;
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
  task_type: string;
};

const PXBBountyPage = () => {
  const navigate = useNavigate();
  const { userProfile } = usePXBPoints();
  const { connected } = useWallet();
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [filteredBounties, setFilteredBounties] = useState<Bounty[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchBounties();
  }, [userProfile]);

  useEffect(() => {
    let filtered = bounties;
    
    if (searchTerm) {
      filtered = filtered.filter(bounty => 
        bounty.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bounty.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bounty.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (activeTab === 'open') {
      filtered = filtered.filter(bounty => bounty.status === 'open');
    } else if (activeTab === 'created' && userProfile) {
      filtered = filtered.filter(bounty => bounty.creator_id === userProfile.id);
    }
    
    setFilteredBounties(filtered);
  }, [bounties, searchTerm, activeTab, userProfile]);

  const fetchBounties = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bounties')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      const typedBounties: Bounty[] = data?.map(bounty => ({
        ...bounty,
        status: bounty.status as 'open' | 'closed' | 'expired'
      })) || [];
      
      setBounties(typedBounties);
      setFilteredBounties(typedBounties);
    } catch (error) {
      console.error('Error fetching bounties:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeLeft = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) {
      return 'Expired';
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} left`;
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} left`;
    }
    
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes} minute${minutes > 1 ? 's' : ''} left`;
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-dream-foreground mb-2 flex items-center gap-2">
              <Award className="h-8 w-8 text-yellow-400" />
              Bounties
            </h1>
            <p className="text-dream-foreground/70 max-w-2xl">
              Complete tasks to earn PXB points. Promote your project by creating bounties for users to earn rewards.
            </p>
          </div>
          
          <Button 
            onClick={() => navigate('/bounties/create')}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Bounty
          </Button>
        </div>
        
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dream-foreground/50 h-4 w-4" />
            <Input
              placeholder="Search bounties by title or project name..."
              className="pl-10 bg-dream-card/30"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="bg-dream-background/50">
            <TabsTrigger value="all">All Bounties</TabsTrigger>
            <TabsTrigger value="open">Active Only</TabsTrigger>
            {userProfile && (
              <TabsTrigger value="created">Created by Me</TabsTrigger>
            )}
          </TabsList>
        </Tabs>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="border-dream-border bg-dream-card/30 animate-pulse">
                <CardHeader className="bg-dream-background/20 h-32">
                  <div className="h-6 bg-dream-background/30 w-1/2 rounded mb-2"></div>
                  <div className="h-4 bg-dream-background/30 w-1/4 rounded"></div>
                </CardHeader>
                <CardContent className="py-6">
                  <div className="h-4 bg-dream-background/30 w-3/4 rounded mb-3"></div>
                  <div className="h-4 bg-dream-background/30 w-1/2 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredBounties.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-dream-border rounded-lg">
            <Award className="h-16 w-16 mx-auto text-dream-foreground/20 mb-4" />
            <h2 className="text-xl font-semibold text-dream-foreground mb-2">No bounties found</h2>
            <p className="text-dream-foreground/70 mb-6">
              {activeTab === 'created' 
                ? "You haven't created any bounties yet."
                : "There are no bounties matching your search criteria."}
            </p>
            {activeTab === 'created' && (
              <Button 
                onClick={() => navigate('/bounties/create')}
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Bounty
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBounties.map((bounty) => (
              <Card key={bounty.id} className="border-dream-border bg-dream-card/30 hover:bg-dream-card/50 transition-colors">
                <CardHeader className="relative pb-3">
                  <div className="flex justify-between items-start mb-2">
                    {bounty.status === 'open' ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">
                        {bounty.status === 'expired' ? 'Expired' : 'Closed'}
                      </Badge>
                    )}
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                      {bounty.task_type === 'website_visit' ? 'Visit Website' : 
                       bounty.task_type === 'telegram_join' ? 'Join Telegram' :
                       bounty.task_type === 'twitter_follow' ? 'Follow Twitter' : 'Multiple Tasks'}
                    </Badge>
                  </div>
                  
                  <CardTitle className="text-lg">{bounty.title}</CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    {bounty.project_logo ? (
                      <img 
                        src={bounty.project_logo} 
                        alt={bounty.project_name} 
                        className="w-4 h-4 rounded-full object-cover mr-1"
                      />
                    ) : null}
                    {bounty.project_name}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <p className="text-dream-foreground/80 text-sm line-clamp-2 mb-3">
                    {bounty.description}
                  </p>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <img 
                        src="/lovable-uploads/be886d35-fbcb-4675-926c-38691ad3e311.png" 
                        alt="PXB Coin" 
                        className="w-5 h-5 mr-1" 
                      />
                      <span className="font-medium text-yellow-400">{bounty.pxb_reward} PXB</span>
                    </div>
                    
                    <div className="text-xs text-dream-foreground/50">
                      {formatTimeLeft(bounty.end_date)}
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="pt-0">
                  <Button 
                    asChild
                    className="w-full"
                    variant="outline"
                  >
                    <Link to={`/bounties/${bounty.id}`}>
                      View Details
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default PXBBountyPage;
