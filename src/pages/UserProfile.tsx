import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import OrbitingParticles from '@/components/OrbitingParticles';
import { supabase } from '@/integrations/supabase/client';
import type { UserProfile as UserProfileType } from '@/types/pxb';
import TradeActivity from '@/components/TradeActivity';
import Loading from '@/components/Loading';
import TradePerformance from '@/components/TradePerformance';

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async (userId: string) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
      
      if (data) {
        return {
          id: data.id,
          username: data.username || 'Anonymous',
          displayName: data.display_name,
          walletAddress: data.wallet_address,
          pxbPoints: data.points || 0,
          createdAt: data.created_at,
          avatar: data.avatar_url,
          bio: data.bio
        } as UserProfileType;
      }
      
      return null;
    };
    
    fetchUserProfile(userId).then((data) => {
      if (data) {
        setProfile(data);
      }
    });
  }, [userId]);
  
  if (loading) {
    return (
      <>
        <Navbar />
        <OrbitingParticles />
        <main className="min-h-screen bg-[#080b16] bg-gradient-to-b from-[#0a0e1c] to-[#070a14]">
          <div className="max-w-7xl mx-auto px-4 md:px-8 pt-24 pb-16">
            <div className="flex justify-center items-center min-h-[50vh]">
              <div className="w-12 h-12 border-4 border-t-transparent border-indigo-500 rounded-full animate-spin"></div>
            </div>
          </div>
        </main>
      </>
    );
  }
  
  if (!profile) {
    return (
      <>
        <Navbar />
        <OrbitingParticles />
        <main className="min-h-screen bg-[#080b16] bg-gradient-to-b from-[#0a0e1c] to-[#070a14]">
          <div className="max-w-7xl mx-auto px-4 md:px-8 pt-24 pb-16">
            <div className="flex flex-col justify-center items-center min-h-[50vh]">
              <h1 className="text-2xl font-bold text-white mb-4">User Not Found</h1>
              <p className="text-gray-400 mb-8">The user profile you're looking for doesn't exist or has been removed.</p>
              <Link to="/" className="flex items-center text-indigo-400 hover:text-indigo-300 transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Home
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
      <OrbitingParticles />
      <main className="min-h-screen bg-[#080b16] bg-gradient-to-b from-[#0a0e1c] to-[#070a14]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-24 pb-16">
          <div className="mb-8">
            <Link to="/" className="flex items-center text-indigo-400 hover:text-indigo-300 transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4">
              <div className="bg-[#0f1628]/80 backdrop-blur-lg border border-indigo-900/30 rounded-xl p-6">
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4 overflow-hidden border-2 border-indigo-500/40">
                    {profile.avatar ? (
                      <img 
                        src={profile.avatar} 
                        alt={profile.username} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-indigo-400">
                        {profile.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  <h1 className="text-2xl font-bold text-white mb-1">
                    {profile.displayName || profile.username}
                  </h1>
                  
                  <p className="text-indigo-300/70 text-sm mb-4">@{profile.username}</p>
                  
                  {profile.bio && (
                    <p className="text-gray-400 text-center mb-4 border-t border-indigo-900/30 pt-4 w-full">
                      {profile.bio}
                    </p>
                  )}
                  
                  <div className="bg-indigo-900/20 w-full p-4 rounded-lg mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-indigo-300/70">PXB Points</span>
                      <span className="text-white font-bold text-xl">{profile.pxbPoints.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-indigo-300/50 mt-2">
                    Member since {new Date(profile.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-8">
              <div className="bg-[#0f1628]/80 backdrop-blur-lg border border-indigo-900/30 rounded-xl p-6">
                <TradeActivity 
                  userId={profile.id} 
                  title="Trading Activity"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default UserProfile;
