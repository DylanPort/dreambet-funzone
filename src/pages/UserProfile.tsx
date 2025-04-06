
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/pxb';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import TradeActivity from '@/components/TradeActivity';

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (error) {
          console.error('Error fetching user profile:', error);
          return;
        }
        
        if (data) {
          setProfile({
            id: data.id,
            username: data.username || `User-${data.id.substring(0, 6)}`,
            displayName: data.display_name,
            walletAddress: data.wallet_address || 'Unknown',
            pxbPoints: data.points || 0,
            createdAt: data.created_at,
            avatar: data.avatar_url,
            bio: data.bio
          });
        }
      } catch (error) {
        console.error('Unexpected error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [userId]);
  
  if (loading) {
    return (
      <>
        <Navbar />
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
