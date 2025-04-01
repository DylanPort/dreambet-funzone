
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/pxb';
import { User, Trophy, ArrowLeft } from 'lucide-react';
import PXBBetsHistory from '@/components/PXBBetsHistory';

const UserProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch the user profile data by ID
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching user profile:', error);
          toast.error('Failed to load user profile');
          return;
        }
        
        if (data) {
          // If this is the specific user with excessive points, set points to 0
          let points = data.points || 0;
          if (userId === '2a6e24c4-62f6-49de-9159-daf16afba1b8' && points > 100000000) {
            // Update user's points in the database
            await supabase
              .from('users')
              .update({ points: 0 })
              .eq('id', userId);
            
            // Record the points deduction in the history
            await supabase.from('points_history').insert({
              user_id: userId,
              amount: -points,
              action: 'admin_adjustment',
              reference_id: 'system',
              reference_name: 'Points balance reset'
            });
            
            points = 0; // Set local points to 0
            toast.success('User points have been reset');
          }
          
          setProfileData({
            id: data.id,
            username: data.username || `User_${data.id.substring(0, 8)}`,
            pxbPoints: points,
            createdAt: data.created_at,
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
        <main className="min-h-screen bg-[#080b16] bg-gradient-to-b from-[#0a0e1c] to-[#070a14]">
          <div className="max-w-7xl mx-auto px-4 md:px-8 pt-24 pb-16 flex justify-center items-center min-h-[80vh]">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-t-transparent border-indigo-500 rounded-full animate-spin mb-4"></div>
              <p className="text-indigo-300/70">Loading profile...</p>
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
        <main className="min-h-screen bg-[#080b16] bg-gradient-to-b from-[#0a0e1c] to-[#070a14]">
          <div className="max-w-7xl mx-auto px-4 md:px-8 pt-24 pb-16 flex justify-center items-center min-h-[80vh]">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">User Not Found</h2>
              <p className="text-indigo-300/70 mb-6">The user profile you're looking for doesn't exist or has been removed.</p>
              <Link to="/">
                <Button 
                  variant="default" 
                  className="bg-indigo-600 hover:bg-indigo-700"
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
      <main className="min-h-screen bg-[#080b16] bg-gradient-to-b from-[#0a0e1c] to-[#070a14]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-24 pb-16 space-y-8">
          {/* Back button */}
          <div>
            <Link to="/">
              <Button variant="ghost" className="text-indigo-300/70 hover:text-white">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>

          {/* User Profile */}
          <div className="rounded-xl border border-indigo-900/30 backdrop-blur-lg bg-[#010608]">
            <div className="p-6 border-b border-indigo-900/30">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <User className="mr-2 h-6 w-6" />
                {profileData.username}'s Profile
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {/* PXB Points Card */}
              <div className="relative overflow-hidden rounded-lg p-6 bg-gradient-to-r from-[#131c36] to-[#1a2542] border border-indigo-500/20">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent"></div>
                
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mr-4 border border-indigo-500/20">
                      <img src="/lovable-uploads/b29e7031-78f0-44be-b383-e5d1dd184bb4.png" alt="PXB Logo" className="w-10 h-10 object-contain filter drop-shadow-[0_0_8px_rgba(0,255,255,0.6)]" />
                    </div>
                    <div>
                      <h3 className="text-4xl font-bold text-white">{profileData.pxbPoints.toLocaleString()}</h3>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm relative z-10">
                  <p className="text-indigo-300">{profileData.username}</p>
                  <p className="text-indigo-300">Member since: {formatDate(profileData.createdAt)}</p>
                </div>
              </div>

              {/* User Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-indigo-900/10 p-4 rounded-lg border border-indigo-900/30 flex flex-col items-center justify-center">
                  <Trophy className="h-8 w-8 text-yellow-400 mb-2" />
                  <h3 className="text-white font-semibold">PXB Holder</h3>
                </div>
                
                <div className="bg-indigo-900/10 p-4 rounded-lg border border-indigo-900/30 flex flex-col items-center justify-center">
                  <div className="text-2xl font-bold text-white">{formatDate(profileData.createdAt)}</div>
                  <h3 className="text-indigo-300/70">Joined</h3>
                </div>
                
                <div className="bg-indigo-900/10 p-4 rounded-lg border border-indigo-900/30 flex flex-col items-center justify-center">
                  <div className="text-2xl font-bold text-white">{profileData.id.substring(0, 8)}</div>
                  <h3 className="text-indigo-300/70">User ID</h3>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bets History (reusing component) */}
          <div className="w-full">
            <div className="rounded-xl border border-indigo-900/30 backdrop-blur-lg bg-[#010608]">
              <div className="p-6 border-b border-indigo-900/30">
                <h2 className="text-2xl font-bold text-white">{profileData.username}'s Betting History</h2>
              </div>
              <div className="p-6">
                <PXBBetsHistory userId={userId} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default UserProfilePage;
