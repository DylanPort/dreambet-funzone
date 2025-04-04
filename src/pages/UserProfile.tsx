
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/pxb';
import { User, Trophy, ArrowLeft, CalendarDays, Hash, MessageSquare, Percent } from 'lucide-react';
import PXBBetsHistory from '@/components/PXBBetsHistory';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import OnlineUsersSidebar from '@/components/OnlineUsersSidebar';

const UserProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [winRate, setWinRate] = useState(0);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [totalBets, setTotalBets] = useState(0);
  
  // Fetch the user profile data by ID
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      try {
        // Fetch user data
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (userError) {
          console.error('Error fetching user profile:', userError);
          toast.error('Failed to load user profile');
          return;
        }
        
        // Fetch user leaderboard position
        const { data: leaderboardData, error: leaderboardError } = await supabase
          .from('users')
          .select('id, points')
          .order('points', { ascending: false });
          
        if (leaderboardError) {
          console.error('Error fetching leaderboard data:', leaderboardError);
        } else if (leaderboardData) {
          const userPosition = leaderboardData.findIndex(user => user.id === userId);
          if (userPosition !== -1) {
            setUserRank(userPosition + 1);
          }
        }
        
        // Fetch user's bet count and calculate win rate
        const { data: betsData, error: betsError } = await supabase
          .from('bets')
          .select('*')
          .eq('bettor1_id', userId);
          
        if (betsError) {
          console.error('Error fetching bets data:', betsError);
        } else if (betsData) {
          setTotalBets(betsData.length);
          
          const completedBets = betsData.filter(bet => bet.status === 'won' || bet.status === 'lost');
          const wonBets = betsData.filter(bet => bet.status === 'won');
          setWinRate(completedBets.length > 0 ? (wonBets.length / completedBets.length) * 100 : 0);
        }
        
        if (userData) {
          setProfileData({
            id: userData.id,
            username: userData.username || `User_${userData.id.substring(0, 8)}`,
            pxbPoints: userData.points || 0,
            createdAt: userData.created_at,
          });
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        toast.error('An error occurred while loading the profile');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [userId]);
  
  // Function to format the date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-dream-background">
          <div className="max-w-7xl mx-auto px-4 md:px-8 pt-24 pb-16 flex justify-center items-center min-h-[80vh]">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-t-transparent border-dream-accent1 rounded-full animate-spin mb-4"></div>
              <p className="text-dream-foreground/70">Loading profile...</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!profileData) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-dream-background">
          <div className="max-w-7xl mx-auto px-4 md:px-8 pt-24 pb-16 flex justify-center items-center min-h-[80vh]">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-dream-foreground mb-4">User Not Found</h2>
              <p className="text-dream-foreground/70 mb-6">The user profile you're looking for doesn't exist or has been removed.</p>
              <Link to="/">
                <Button 
                  variant="default" 
                  className="bg-dream-accent1 hover:bg-dream-accent1/80"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Return Home
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-dream-background">
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-24 pb-16">
          {/* Back button */}
          <div className="mb-6">
            <Link to="/community">
              <Button variant="ghost" className="text-dream-foreground/70 hover:text-dream-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Community
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">
            <div className="lg:col-span-5">
              {/* User Profile Header */}
              <Card className="p-6 mb-8 bg-dream-background/30 border border-dream-foreground/10 backdrop-blur-sm">
                <div className="flex items-start sm:items-center flex-col sm:flex-row gap-6">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-dream-accent1/20 to-dream-accent2/20 flex items-center justify-center border border-dream-foreground/10 overflow-hidden">
                    <Avatar className="w-full h-full">
                      <AvatarImage src="/lovable-uploads/ecc52c7d-725c-4ccd-bace-82d464afe6bd.png" alt="User avatar" className="w-full h-full object-cover" />
                      <AvatarFallback className="bg-transparent text-4xl">
                        <User className="w-12 h-12 text-dream-foreground/70" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                      <h1 className="text-3xl font-bold text-dream-foreground font-display">{profileData.username}</h1>
                      {userRank && (
                        <div className="flex items-center px-3 py-1 bg-dream-accent1/10 border border-dream-accent1/20 rounded-full">
                          <Trophy className="w-4 h-4 text-dream-accent1 mr-1" />
                          <span className="text-sm font-medium">Rank #{userRank}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-3 mb-4">
                      <div className="flex items-center text-sm text-dream-foreground/70">
                        <CalendarDays className="w-4 h-4 mr-1 text-dream-foreground/50" />
                        <span>Joined {formatDate(profileData.createdAt)}</span>
                      </div>
                      <div className="flex items-center text-sm text-dream-foreground/70">
                        <Hash className="w-4 h-4 mr-1 text-dream-foreground/50" />
                        <span>ID: {profileData.id.substring(0, 8)}</span>
                      </div>
                    </div>
                    
                    <div className="relative overflow-hidden rounded-lg p-5 bg-gradient-to-r from-dream-background/40 to-dream-background/20 border border-dream-foreground/10">
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-dream-accent1/5 via-transparent to-transparent"></div>
                      
                      <div className="flex items-center justify-between mb-3 relative z-10">
                        <div className="flex items-center gap-2">
                          <img src="/lovable-uploads/5bea0b92-6460-4b88-890b-093867d1e680.png" className="w-6 h-6" alt="PXB" />
                          <h3 className="text-xl font-semibold text-dream-foreground">PXB Balance</h3>
                        </div>
                      </div>
                      
                      <p className="text-3xl font-bold text-dream-accent2 relative z-10">{profileData.pxbPoints.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </Card>
              
              {/* User Stats */}
              <Card className="p-6 mb-8 bg-dream-background/30 border border-dream-foreground/10 backdrop-blur-sm">
                <h2 className="text-xl font-bold text-dream-foreground mb-4 font-display">User Stats</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-dream-background/20 border border-dream-foreground/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-dream-foreground/70 text-sm">Total Bets</span>
                      <MessageSquare className="w-5 h-5 text-dream-accent1/70" />
                    </div>
                    <p className="text-2xl font-bold text-dream-foreground">{totalBets}</p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-dream-background/20 border border-dream-foreground/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-dream-foreground/70 text-sm">Win Rate</span>
                      <Percent className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-green-500">{winRate.toFixed(1)}%</p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-dream-background/20 border border-dream-foreground/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-dream-foreground/70 text-sm">Rank</span>
                      <Trophy className="w-5 h-5 text-yellow-500" />
                    </div>
                    <p className="text-2xl font-bold text-dream-foreground">
                      {userRank ? `#${userRank}` : 'N/A'}
                    </p>
                  </div>
                </div>
              </Card>
              
              {/* Bets History */}
              <Card className="bg-dream-background/30 border border-dream-foreground/10 backdrop-blur-sm">
                <div className="p-6 border-b border-dream-foreground/10">
                  <h2 className="text-xl font-bold text-dream-foreground font-display">{profileData.username}'s Betting History</h2>
                </div>
                <div className="p-6">
                  <PXBBetsHistory userId={userId} />
                </div>
              </Card>
            </div>
            
            <div className="lg:col-span-2">
              <div className="sticky top-24">
                <OnlineUsersSidebar className="mb-6" />
                
                <Card className="bg-dream-background/30 border border-dream-foreground/10 backdrop-blur-sm p-4">
                  <h3 className="font-display font-semibold text-lg mb-3">How to Earn PXB</h3>
                  <ul className="space-y-2 text-sm text-dream-foreground/80">
                    <li className="flex items-start">
                      <div className="w-5 h-5 rounded-full bg-dream-accent1/20 text-dream-accent1 flex items-center justify-center mr-2 mt-0.5">1</div>
                      <span>Place bets on tokens</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-5 h-5 rounded-full bg-dream-accent1/20 text-dream-accent1 flex items-center justify-center mr-2 mt-0.5">2</div>
                      <span>Participate in community discussions</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-5 h-5 rounded-full bg-dream-accent1/20 text-dream-accent1 flex items-center justify-center mr-2 mt-0.5">3</div>
                      <span>Invite friends with your referral code</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-5 h-5 rounded-full bg-dream-accent1/20 text-dream-accent1 flex items-center justify-center mr-2 mt-0.5">4</div>
                      <span>Complete daily tasks and challenges</span>
                    </li>
                  </ul>
                  
                  <div className="mt-4 pt-4 border-t border-dream-foreground/10">
                    <Link to="/">
                      <Button className="w-full bg-gradient-to-r from-dream-accent1 to-dream-accent2 hover:from-dream-accent1/90 hover:to-dream-accent2/90">
                        Start Earning PXB
                      </Button>
                    </Link>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default UserProfilePage;
