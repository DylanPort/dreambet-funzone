
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';
import Navbar from '@/components/Navbar';
import OrbitingParticles from '@/components/OrbitingParticles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile as UserProfileType } from '@/types/pxb';
import TradeActivity from '@/components/TradeActivity';
import Loading from '@/components/Loading';

// Rename the component to avoid naming conflict with the type
const UserProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) {
        setError('User ID is required');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          setError('Could not find user profile');
          return;
        }

        if (data) {
          // Map to the UserProfile type
          setProfile({
            id: data.id,
            username: data.username || 'Anonymous',
            displayName: data.display_name,
            walletAddress: data.wallet_address,
            pxbPoints: data.points || 0,
            createdAt: data.created_at,
            avatar: data.avatar_url,
            bio: data.bio,
            referralCode: data.referral_code
          });
        } else {
          setError('User not found');
        }
      } catch (error) {
        console.error('Error in fetchUserProfile:', error);
        setError('An error occurred while fetching the user profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  if (isLoading) {
    return (
      <>
        <OrbitingParticles />
        <Navbar />
        <main className="pt-24 min-h-screen overflow-hidden px-4 pb-16">
          <Loading message="Loading user profile..." />
        </main>
      </>
    );
  }

  if (error || !profile) {
    return (
      <>
        <OrbitingParticles />
        <Navbar />
        <main className="pt-24 min-h-screen overflow-hidden px-4 pb-16">
          <div className="max-w-md mx-auto text-center">
            <User className="w-16 h-16 mx-auto text-dream-foreground/30 mb-4" />
            <h1 className="text-2xl font-bold mb-2">User Not Found</h1>
            <p className="text-dream-foreground/60 mb-6">{error || 'The requested user profile could not be found'}</p>
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 bg-dream-accent1/20 hover:bg-dream-accent1/30 rounded-md text-dream-accent1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Home
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <OrbitingParticles />
      <Navbar />

      <main className="pt-24 min-h-screen overflow-hidden px-4 pb-16">
        <div className="max-w-5xl mx-auto">
          <Link to="/" className="inline-flex items-center text-dream-foreground/70 hover:text-dream-foreground mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="grid md:grid-cols-12 gap-6">
            {/* Left Column - Profile */}
            <div className="md:col-span-4 space-y-6">
              <Card className="bg-black/60 border-dream-accent1/30">
                <CardHeader>
                  <CardTitle>User Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-dream-accent1/30 mb-3">
                      <img
                        src={profile.avatar || "/lovable-uploads/be6baddd-a67e-4583-b969-a471b47274e1.png"}
                        alt={profile.username}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h2 className="text-xl font-semibold">{profile.displayName || profile.username}</h2>
                    <p className="text-sm text-dream-foreground/60 mt-1">
                      {profile.pxbPoints.toLocaleString()} PXB Points
                    </p>
                  </div>

                  {profile.bio && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-dream-foreground/70 mb-2">Bio</h3>
                      <p className="text-sm text-dream-foreground/80">{profile.bio}</p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-dream-foreground/70 mb-2">Wallet</h3>
                    <p className="text-xs font-mono text-dream-foreground/60 break-all">
                      {profile.walletAddress}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Activity */}
            <div className="md:col-span-8 space-y-6">
              <TradeActivity userId={profile.id} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default UserProfilePage;
