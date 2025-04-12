import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/types/pxb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit2, Copy, User, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { PublicKey } from '@solana/web3.js';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

interface PXBProfilePanelProps {
  userProfile: UserProfile | null;
  publicKey: PublicKey;
  localPxbPoints: number;
}

const PXBProfilePanel: React.FC<PXBProfilePanelProps> = ({
  userProfile,
  publicKey,
  localPxbPoints
}) => {
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState(userProfile?.username || '');
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const {
    generatePxbId,
    fetchUserProfile,
    leaderboard,
    fetchLeaderboard,
    generateReferralLink
  } = usePXBPoints();
  const [myPxbId, setMyPxbId] = useState<string>('');
  const [userRank, setUserRank] = useState<number | null>(null);
  const [referralLink, setReferralLink] = useState<string>('');

  // Fetch leaderboard on component mount
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Get user rank from leaderboard
  useEffect(() => {
    if (!userProfile || !leaderboard?.length) {
      setUserRank(null);
      return;
    }
    
    console.log("Finding rank for user ID:", userProfile.id);
    console.log("Leaderboard entries:", leaderboard);
    
    // Find the user in the leaderboard by matching ID
    const userEntry = leaderboard.find(entry => {
      const entryId = entry.id || entry.user_id;
      const userId = userProfile.id;
      
      console.log(`Comparing entry ID: ${entryId} with user ID: ${userId}`);
      return entryId === userId;
    });
    
    console.log("Found user entry:", userEntry);
    
    if (userEntry) {
      console.log("Setting user rank to:", userEntry.rank);
      setUserRank(userEntry.rank);
    } else {
      // If user not found in leaderboard, try to calculate rank based on points
      const userPoints = localPxbPoints || userProfile.pxbPoints || 0;
      const higherRankedUsers = leaderboard.filter(entry => {
        const entryPoints = entry.points || entry.pxbPoints || 0;
        return entryPoints > userPoints;
      });
      
      if (higherRankedUsers.length < leaderboard.length) {
        const estimatedRank = higherRankedUsers.length + 1;
        console.log("Estimated rank based on points:", estimatedRank);
        setUserRank(estimatedRank);
      } else {
        setUserRank(null);
      }
    }
  }, [userProfile, leaderboard, localPxbPoints]);

  React.useEffect(() => {
    if (userProfile && generatePxbId) {
      setMyPxbId(generatePxbId());
    }
  }, [userProfile, generatePxbId]);

  React.useEffect(() => {
    if (userProfile) {
      setUsernameInput(userProfile.username);
    }
  }, [userProfile]);

  const handleUpdateUsername = async () => {
    if (!usernameInput.trim() || !userProfile) {
      toast.error("Username cannot be empty");
      return;
    }
    setIsSavingUsername(true);
    try {
      const {
        error
      } = await supabase.from('users').update({
        username: usernameInput
      }).eq('id', userProfile.id);
      if (error) {
        console.error('Error updating username:', error);
        toast.error('Failed to update username');
      } else {
        fetchUserProfile();
        toast.success('Username updated successfully');
        setIsEditingUsername(false);
      }
    } catch (err) {
      console.error('Unexpected error updating username:', err);
      toast.error('An error occurred while updating username');
    } finally {
      setIsSavingUsername(false);
    }
  };

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  const handleGenerateReferralLink = async () => {
    try {
      const link = await generateReferralLink();
      setReferralLink(link);
      toast.success("Referral link generated successfully!");
    } catch (error) {
      console.error("Error generating referral link:", error);
      toast.error("Failed to generate referral link");
    }
  };

  return <div className="overflow-hidden rounded-xl border border-indigo-900/30 backdrop-blur-lg bg-[#010608]">
      <div className="p-6 border-b border-indigo-900/30 bg-black/0">
        <h2 className="text-2xl font-bold text-white">Profile</h2>
        <p className="text-indigo-300/70">Manage your account information</p>
      </div>

      <div className="p-6 space-y-6 bg-black">
        {/* Username */}
        <div>
          <h3 className="text-sm text-indigo-300/70 mb-2 flex justify-between items-center">
            Username
            {!isEditingUsername && <Button variant="ghost" size="sm" className="text-indigo-300/70 hover:text-white hover:bg-indigo-500/10" onClick={() => setIsEditingUsername(true)}>
                <Edit2 className="w-4 h-4" />
              </Button>}
          </h3>

          {isEditingUsername ? <div className="space-y-2">
              <Input value={usernameInput} onChange={e => setUsernameInput(e.target.value)} className="bg-indigo-900/10 border-indigo-900/30 text-white" />
              <div className="flex gap-2">
                <Button onClick={handleUpdateUsername} disabled={isSavingUsername} className="w-full bg-indigo-600 hover:bg-indigo-700">
                  {isSavingUsername ? 'Saving...' : 'Save'}
                </Button>
                <Button variant="outline" onClick={() => {
              setIsEditingUsername(false);
              setUsernameInput(userProfile?.username || '');
            }} className="w-full border-indigo-900/30 text-indigo-300/70 hover:text-white hover:bg-indigo-900/20">
                  Cancel
                </Button>
              </div>
            </div> : <div className="bg-indigo-900/10 p-3 rounded-lg flex items-center border border-indigo-900/30">
              <User className="text-indigo-300/70 w-4 h-4 mr-2" />
              <Link 
                to={userProfile ? `/profile/${userProfile.id}` : '#'} 
                className="text-white hover:text-cyan-400 transition-colors"
              >
                {userProfile?.username || 'Anonymous'}
              </Link>
            </div>}
        </div>

        {/* Wallet Address */}
        <div>
          <h3 className="text-sm text-indigo-300/70 mb-2">Wallet Address</h3>
          <div className="bg-indigo-900/10 p-3 rounded-lg flex items-center justify-between border border-indigo-900/30">
            <span className="text-white text-sm font-mono truncate">
              {publicKey.toString()}
            </span>
            <Button variant="ghost" size="sm" className="text-indigo-300/70 hover:text-white hover:bg-indigo-500/10" onClick={() => copyToClipboard(publicKey.toString(), 'Wallet address copied to clipboard')}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* PXB ID */}
        <div>
          <h3 className="text-sm text-indigo-300/70 mb-2">PXB ID</h3>
          <div className="bg-indigo-900/10 p-3 rounded-lg flex items-center justify-between border border-indigo-900/30">
            <span className="text-white text-sm font-mono truncate">
              {myPxbId || 'Generating...'}
            </span>
            <Button variant="ghost" size="sm" className="text-indigo-300/70 hover:text-white hover:bg-indigo-500/10" onClick={() => copyToClipboard(myPxbId, 'PXB ID copied to clipboard')} disabled={!myPxbId}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-indigo-300/50 mt-1">Your permanent ID for receiving PXB points</p>
        </div>

        {/* PXB Points Card */}
        <div className="mt-6">
          <div className="relative overflow-hidden rounded-lg p-6 bg-gradient-to-r from-[#131c36] to-[#1a2542] border border-indigo-500/20">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent"></div>
            
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mr-4 border border-indigo-500/20">
                  <img src="/lovable-uploads/b29e7031-78f0-44be-b383-e5d1dd184bb4.png" alt="PXB Logo" className="w-10 h-10 object-contain filter drop-shadow-[0_0_8px_rgba(0,255,255,0.6)]" />
                </div>
                <div>
                  <h3 className="text-4xl font-bold text-white">{localPxbPoints.toLocaleString()}</h3>
                </div>
              </div>
              
              {userRank !== null && (
                <div className="flex items-center bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30">
                  <Trophy className="w-4 h-4 text-yellow-400 mr-1" />
                  <span className="text-white font-medium">Rank #{userRank}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between text-sm relative z-10">
              <p className="text-indigo-300">{userProfile?.username || 'User'}</p>
              <p className="text-indigo-300">#{userProfile?.id?.substring(0, 8) || ''}</p>
            </div>
          </div>
        </div>

        {/* Referral Link */}
        <div>
          <h3 className="text-sm text-indigo-300/70 mb-2">Referral Link</h3>
          <div className="bg-indigo-900/10 p-3 rounded-lg flex items-center justify-between border border-indigo-900/30">
            <span className="text-white text-sm font-mono truncate">
              {referralLink || 'Generating...'}
            </span>
            <Button variant="ghost" size="sm" className="text-indigo-300/70 hover:text-white hover:bg-indigo-500/10" onClick={handleGenerateReferralLink}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-indigo-300/50 mt-1">Share this link to invite friends and earn more PXB points</p>
        </div>
      </div>
    </div>;
};

export default PXBProfilePanel;
