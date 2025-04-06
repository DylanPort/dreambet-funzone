import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Copy, Link2, RefreshCw, Wallet as WalletIcon, User, Nodes } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const PXBWallet = () => {
  const {
    userProfile,
    isLoading,
    generateReferralLink,
    referralStats,
    fetchReferralStats,
    isLoadingReferrals
  } = usePXBPoints();
  const {
    connected,
    publicKey
  } = useWallet();
  const [referralLink, setReferralLink] = useState('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  useEffect(() => {
    if (connected && publicKey && fetchReferralStats) {
      fetchReferralStats();
    }
  }, [connected, publicKey, fetchReferralStats]);

  const handleGenerateReferralLink = async () => {
    if (!generateReferralLink) return;
    
    setIsGeneratingLink(true);
    try {
      const link = await generateReferralLink();
      setReferralLink(link);
    } catch (error) {
      console.error('Error generating referral link:', error);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (isLoading) {
    return (
      <Card className="w-full bg-black/60 border-dream-accent1/30">
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-10">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!userProfile) {
    return (
      <Card className="w-full bg-black/60 border-dream-accent1/30">
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <p className="text-dream-foreground/60">Connect your wallet to view your profile</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-black/60 border-dream-accent1/30">
      <CardHeader>
        <CardTitle>Your Profile</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Avatar and Username */}
        <div className="flex items-center space-x-4 mb-6">
          <Avatar className="w-14 h-14">
            <AvatarImage src={userProfile.avatar || "/lovable-uploads/be6baddd-a67e-4583-b969-a471b47274e1.png"} alt={userProfile.username} />
            <AvatarFallback>{userProfile.username.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-semibold">{userProfile.username}</h2>
            <p className="text-sm text-dream-foreground/60">
              Wallet: {userProfile.walletAddress.substring(0, 6)}...{userProfile.walletAddress.substring(userProfile.walletAddress.length - 4)}
            </p>
          </div>
        </div>

        {/* PXB Points Balance */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <WalletIcon className="w-5 h-5 mr-2 text-blue-400" />
            PXB Points Balance
          </h3>
          <div className="glass-panel p-4 text-center">
            <p className="text-3xl font-display font-bold text-gradient">
              {userProfile.pxbPoints.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Referral Stats */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Nodes className="w-5 h-5 mr-2 text-purple-400" />
            Referral Stats
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel p-4 text-center">
              <p className="text-xs text-dream-foreground/60 mb-1">Total Referrals</p>
              <p className="text-xl font-semibold">
                {isLoadingReferrals ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  referralStats.totalReferrals || referralStats.referrals_count || 0
                )}
              </p>
            </div>
            
            <div className="glass-panel p-4 text-center">
              <p className="text-xs text-dream-foreground/60 mb-1">Points Earned</p>
              <p className="text-xl font-semibold">
                {isLoadingReferrals ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  referralStats.pointsEarned || referralStats.points_earned || 0
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Referral Link */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Link2 className="w-5 h-5 mr-2 text-green-400" />
            Referral Link
          </h3>
          <div className="flex items-center">
            <input
              type="text"
              value={referralLink}
              readOnly
              placeholder="Generate your referral link"
              className="w-full bg-dream-foreground/5 px-3 py-2 rounded-md text-sm text-dream-foreground"
            />
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-2"
              onClick={copyToClipboard}
              disabled={!referralLink}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-2"
              onClick={handleGenerateReferralLink}
              disabled={isGeneratingLink}
            >
              {isGeneratingLink ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PXBWallet;
