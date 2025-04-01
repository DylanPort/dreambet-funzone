import React, { useState, useEffect } from 'react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { 
  User,
  Trophy,
  Users,
  Gem, 
  Link,
  Copy,
  Check,
  Share2,
  Tag,
  Copy as CopyIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { LeaderboardEntry } from '@/types/pxb';

interface PXBProfilePanelProps {
  userId?: string;
}

const PXBProfilePanel: React.FC<PXBProfilePanelProps> = ({ userId }) => {
  const { 
    userProfile,
    leaderboard,
    isLeaderboardLoading,
    fetchLeaderboard
  } = usePXBPoints();
  
  const [profileData, setProfileData] = useState<LeaderboardEntry | null>(null);
  const [referralLink, setReferralLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  
  // Generate a profile data object from various sources
  useEffect(() => {
    if (isLeaderboardLoading || !leaderboard) return;
    
    // If userId is provided, look for that user in the leaderboard
    if (userId) {
      const profile = leaderboard.find(user => user.id === userId);
      if (profile) {
        setProfileData(profile);
      }
    } 
    // Otherwise show current user profile
    else if (userProfile) {
      // Create a profile object from user profile data
      const currentUserInLeaderboard = leaderboard.find(user => user.id === userProfile.id);
      
      if (currentUserInLeaderboard) {
        setProfileData(currentUserInLeaderboard);
      } else {
        // Create a mock entry for the current user if not in leaderboard
        setProfileData({
          id: userProfile.id,
          user_id: userProfile.id,
          username: userProfile.username,
          points: userProfile.pxbPoints,
          pxbPoints: userProfile.pxbPoints,
          rank: 0, // Not ranked
          winRate: 0,
          betsWon: 0,
          betsLost: 0
        });
      }
    }
  }, [userProfile, leaderboard, userId, isLeaderboardLoading]);
  
  useEffect(() => {
    if (fetchLeaderboard) {
      fetchLeaderboard();
    }
  }, [fetchLeaderboard]);
  
  const createReferralLink = async () => {
    if (!userProfile?.referralCode) return;
    
    setIsCreatingLink(true);
    try {
      // Create a referral link
      const baseUrl = window.location.origin;
      const link = `${baseUrl}?ref=${userProfile.referralCode}`;
      setReferralLink(link);
    } catch (error) {
      console.error('Error creating referral link:', error);
      toast.error('Failed to create referral link');
    } finally {
      setIsCreatingLink(false);
    }
  };
  
  const copyReferralLink = () => {
    if (!referralLink) return;
    
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Referral link copied to clipboard');
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  
  if (!profileData) {
    return (
      <div className="glass-panel p-6">
        <div className="text-center py-4">
          <User className="w-12 h-12 mx-auto text-dream-foreground/20" />
          <p className="mt-2 text-dream-foreground/60">User profile not found</p>
        </div>
      </div>
    );
  }
  
  const isCurrentUser = userProfile && userProfile.id === profileData.id;
  
  return (
    <div className="glass-panel">
      <div className="p-6 border-b border-dream-foreground/10 flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full bg-dream-foreground/10 flex items-center justify-center mr-4">
            <User className="w-6 h-6 text-dream-foreground/60" />
          </div>
          <div>
            <h2 className="text-xl font-semibold flex items-center">
              {profileData.username || 'Anonymous User'}
              {profileData.rank > 0 && profileData.rank <= 10 && (
                <Badge className="ml-2 bg-amber-500/20 text-amber-400 border border-amber-500/20">
                  <Trophy className="w-3 h-3 mr-1" />
                  Top {profileData.rank}
                </Badge>
              )}
            </h2>
            <p className="text-sm text-dream-foreground/60">
              PXB Points: <span className="text-dream-accent2">{(profileData.pxbPoints || profileData.points).toLocaleString()}</span>
            </p>
          </div>
        </div>
      </div>
      
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-dream-foreground/70 mb-3 flex items-center">
            <Tag className="w-4 h-4 mr-2 text-dream-foreground/40" />
            User Information
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-dream-foreground/5 p-3 rounded-lg">
                <div className="text-xs text-dream-foreground/60 mb-1">Win Rate</div>
                <div className="text-lg font-semibold">
                  {profileData.winRate || 0}%
                </div>
              </div>
              
              <div className="bg-dream-foreground/5 p-3 rounded-lg">
                <div className="text-xs text-dream-foreground/60 mb-1">Ranking</div>
                <div className="text-lg font-semibold">
                  {profileData.rank > 0 ? `#${profileData.rank}` : 'Unranked'}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {isCurrentUser && (
          <div>
            <h3 className="text-sm font-medium text-dream-foreground/70 mb-3 flex items-center">
              <Users className="w-4 h-4 mr-2 text-dream-foreground/40" />
              Referrals
            </h3>
            
            <div className="space-y-4">
              {!referralLink ? (
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={createReferralLink}
                  disabled={isCreatingLink || !userProfile?.referralCode}
                >
                  <span>Generate Referral Link</span>
                  <Share2 className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <div className="flex items-center">
                  <Input
                    value={referralLink}
                    readOnly
                    className="text-xs bg-dream-foreground/5 border-dream-foreground/10"
                  />
                  <Button size="icon" variant="outline" className="ml-2" onClick={copyReferralLink}>
                    {copied ? <Check className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                  </Button>
                </div>
              )}
              
              <div className="bg-dream-foreground/5 p-3 rounded-lg">
                <div className="text-xs text-dream-foreground/60 mb-1">Referral Code</div>
                <div className="text-md font-mono font-semibold flex items-center">
                  {userProfile?.referralCode || 'No referral code yet'}
                  
                  {userProfile?.referralCode && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-2 h-6 px-2"
                      onClick={() => {
                        navigator.clipboard.writeText(userProfile.referralCode || '');
                        toast.success('Referral code copied');
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PXBProfilePanel;
