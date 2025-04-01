
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import PXBBetsHistory from '@/components/PXBBetsHistory';
import PXBWallet from '@/components/PXBWallet';
import { Badge } from '@/components/ui/badge';
import { UserProfile } from '@/types/pxb';
import PXBProfilePanel from '@/components/PXBProfilePanel';
import PXBStatsPanel from '@/components/PXBStatsPanel';
import { ArrowUpRight, ArrowDownRight, Clock, BarChart3, User, History, Wallet, Star, Gift } from 'lucide-react';

const Profile = () => {
  const { publicKey, connected } = useWallet();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref');
  const { 
    userProfile, 
    isLoading, 
    generatePxbId, 
    mintPoints, 
    userBets, 
    fetchUserBets, 
    isLoadingBets, 
    mintingPoints,
    checkAndProcessReferral
  } = usePXBPoints();
  const [username, setUsername] = useState('');
  const [usernameSubmitting, setUsernameSubmitting] = useState(false);
  const [localPxbPoints, setLocalPxbPoints] = useState(0);

  // Check for referral code in the URL
  useEffect(() => {
    if (connected && userProfile && referralCode && checkAndProcessReferral) {
      const processReferral = async () => {
        try {
          await checkAndProcessReferral(referralCode);
          toast.success('Referral code applied successfully!');
          
          // Clear the referral parameter from URL
          navigate('/profile', { replace: true });
        } catch (error) {
          console.error('Error processing referral code:', error);
        }
      };
      
      processReferral();
    }
  }, [connected, userProfile, referralCode, checkAndProcessReferral, navigate]);

  // Fetch user profile and bets
  useEffect(() => {
    if (connected && fetchUserBets) {
      fetchUserBets();
    }
  }, [connected, fetchUserBets]);

  // Sync username state with user profile
  useEffect(() => {
    if (userProfile?.username) {
      setUsername(userProfile.username);
    }
  }, [userProfile]);

  // Update local points counter for animation
  useEffect(() => {
    if (userProfile) {
      setLocalPxbPoints(userProfile.pxbPoints);
    }
  }, [userProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    // Implementation omitted for brevity
  };

  if (!connected) {
    return (
      <div className="container max-w-screen-xl mx-auto px-4 py-12">
        <div className="text-center py-12">
          <div className="bg-dream-surface/20 backdrop-blur-lg border border-dream-foreground/10 p-8 rounded-xl max-w-lg mx-auto">
            <User className="w-16 h-16 text-dream-foreground/30 mx-auto mb-4" />
            <h2 className="text-2xl font-display font-bold mb-4">Connect Your Wallet</h2>
            <p className="mb-6 text-dream-foreground/70">
              Please connect your wallet to view your profile and manage your PXB points.
            </p>
            <Button onClick={() => document.getElementById('wallet-connect-button')?.click()}>
              Connect Wallet
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container max-w-screen-xl mx-auto px-4 py-12">
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dream-accent1"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-screen-xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold">
          Welcome, {userProfile?.username || 'Explorer'}!
        </h1>
        <p className="text-dream-foreground/70">
          Manage your profile, view your bets, and track your PXB points
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          {userProfile && publicKey && (
            <PXBProfilePanel 
              userProfile={userProfile} 
              publicKey={publicKey} 
              localPxbPoints={localPxbPoints} 
            />
          )}
        </div>
        
        <div>
          {userProfile && (
            <PXBStatsPanel userProfile={userProfile} />
          )}
        </div>
      </div>

      <Tabs defaultValue="bets" className="space-y-6">
        <TabsList className="bg-dream-surface/30 border border-dream-foreground/10">
          <TabsTrigger value="bets" className="data-[state=active]:bg-dream-accent1/20">
            <History className="h-4 w-4 mr-2" />
            My Bets
          </TabsTrigger>
          <TabsTrigger value="wallet" className="data-[state=active]:bg-dream-accent1/20">
            <Wallet className="h-4 w-4 mr-2" />
            Wallet
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-dream-accent1/20">
            <User className="h-4 w-4 mr-2" />
            Profile Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="bets" className="space-y-6">
          <Card className="bg-dream-surface/10 border-dream-foreground/10">
            <CardHeader>
              <CardTitle className="text-xl font-display flex items-center">
                <BarChart3 className="mr-2 h-5 w-5 text-dream-accent2" />
                Your Betting History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PXBBetsHistory userId={userProfile?.id} limit={10} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="wallet">
          <PXBWallet />
        </TabsContent>
        
        <TabsContent value="settings">
          <Card className="bg-dream-surface/10 border-dream-foreground/10">
            <CardHeader>
              <CardTitle className="text-xl font-display">Profile Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm text-dream-foreground/70">
                    Username
                  </label>
                  <Input 
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-dream-surface/20 border-dream-foreground/20"
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={!username || username === userProfile?.username || usernameSubmitting}
                  >
                    {usernameSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : 'Update Profile'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
