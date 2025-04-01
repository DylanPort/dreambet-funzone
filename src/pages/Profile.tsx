
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from '@/components/Navbar';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePXBPoints } from '@/contexts/pxb/PXBPointsContext';
import { toast } from 'sonner';
import { Copy, BarChart2, RefreshCw, Users } from 'lucide-react';
import TokenPortfolio from '@/components/TokenPortfolio';
import TokenTransactions from '@/components/TokenTransactions';

const Profile = () => {
  const { publicKey, connected } = useWallet();
  const navigate = useNavigate();
  const { userProfile, mintPoints, fetchUserProfile, mintingPoints, leaderboard, fetchLeaderboard, isLeaderboardLoading } = usePXBPoints();
  const [referralLink, setReferralLink] = useState<string>('');
  
  useEffect(() => {
    if (!connected && publicKey === null) {
      // Fix: Using the correct format for Sonner toast without variant
      toast.error("Please connect your wallet to view your profile.");
    }
  }, [connected, publicKey]);
  
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);
  
  useEffect(() => {
    if (userProfile?.referral_code) {
      const baseUrl = window.location.origin;
      setReferralLink(`${baseUrl}/?ref=${userProfile.referral_code}`);
    }
  }, [userProfile]);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(publicKey?.toString() || '');
    toast("Your Solana wallet address has been copied to clipboard.");
  };
  
  const handleCopyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast("Your referral link has been copied to clipboard.");
  };
  
  const renderUserRank = () => {
    if (!userProfile || !leaderboard || leaderboard.length === 0) return null;
    
    const userInLeaderboard = leaderboard.find(entry => entry.user_id === userProfile.id);
    if (!userInLeaderboard) return null;
    
    return (
      <div className="text-sm text-dream-foreground/70 mt-1">
        Rank: #{userInLeaderboard.rank} on leaderboard
      </div>
    );
  };
  
  if (!connected) {
    return (
      <>
        <Navbar />
        <div className="pt-24 min-h-screen px-4">
          <div className="max-w-3xl mx-auto text-center py-12">
            <h1 className="text-2xl font-display font-bold mb-4">Connect Your Wallet</h1>
            <p className="mb-6 text-dream-foreground/70">
              Please connect your wallet to view your profile.
            </p>
          </div>
        </div>
      </>
    );
  }
  
  return (
    <>
      <Navbar />
      
      <div className="pt-24 min-h-screen px-4 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <Card className="glass-panel border border-dream-accent1/20 overflow-hidden">
                <div className="h-20 bg-gradient-to-r from-dream-accent1/30 to-dream-accent3/30"></div>
                <CardContent className="-mt-10 relative">
                  <div className="w-20 h-20 rounded-full bg-dream-background flex items-center justify-center text-3xl shadow-lg border-4 border-dream-background">
                    {userProfile?.username?.charAt(0) || '👤'}
                  </div>
                  
                  <h2 className="text-xl font-display font-bold mt-3">
                    {userProfile?.username || 'PXB User'}
                  </h2>
                  
                  {renderUserRank()}
                  
                  <div className="mt-3 flex items-center text-sm text-dream-foreground/70">
                    <span className="truncate w-32">{publicKey?.toString().substring(0, 8)}...{publicKey?.toString().substring(publicKey.toString().length - 6)}</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-1" onClick={handleCopy}>
                      <Copy size={12} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-panel border border-dream-accent1/20">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-display">PXB Points</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0" 
                      onClick={fetchUserProfile} 
                      disabled={mintingPoints}
                    >
                      <RefreshCw className={`h-4 w-4 ${mintingPoints ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  <CardDescription>Your PXB balance and stats</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 mr-2">
                        <img src="/lovable-uploads/be886d35-fbcb-4675-926c-38691ad3e311.png" alt="PXB Coin" className="w-full h-full filter drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{userProfile?.pxbPoints?.toLocaleString() || 0}</div>
                        <div className="text-xs text-dream-foreground/70">PXB Points</div>
                      </div>
                    </div>
                    
                    <Button 
                      size="sm" 
                      onClick={() => mintPoints(1000)} 
                      disabled={mintingPoints}
                      className="bg-gradient-to-r from-dream-accent1 to-dream-accent3 hover:from-dream-accent1/90 hover:to-dream-accent3/90"
                    >
                      {mintingPoints ? 'Minting...' : 'Mint PXB'}
                    </Button>
                  </div>
                  
                  {userProfile?.referral_code && (
                    <div className="mt-4 p-3 bg-dream-accent2/10 rounded-md">
                      <div className="text-sm mb-1">Referral Link</div>
                      <div className="flex items-center">
                        <div className="text-xs text-dream-foreground/70 truncate flex-1">
                          {referralLink}
                        </div>
                        <Button variant="ghost" size="sm" className="h-6 p-1 ml-1" onClick={handleCopyReferralLink}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-3 space-y-6">
              <Tabs defaultValue="portfolio">
                <TabsList className="w-full mb-6">
                  <TabsTrigger value="portfolio" className="flex-1">Portfolio</TabsTrigger>
                  <TabsTrigger value="transactions" className="flex-1">Transactions</TabsTrigger>
                  <TabsTrigger value="bets" className="flex-1">My Bets</TabsTrigger>
                </TabsList>
                
                <TabsContent value="portfolio" className="space-y-6">
                  <TokenPortfolio />
                </TabsContent>
                
                <TabsContent value="transactions">
                  <TokenTransactions limit={20} />
                </TabsContent>
                
                <TabsContent value="bets">
                  <Card className="glass-panel border border-dream-accent1/20">
                    <CardHeader>
                      <CardTitle>My Bets</CardTitle>
                      <CardDescription>Track all your PXB token bets</CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="text-center py-4">
                        <Button onClick={() => navigate('/betting/my-bets')}>
                          Go to My Bets
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
