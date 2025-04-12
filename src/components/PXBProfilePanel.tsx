import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { usePXBPoints } from '@/contexts/pxb/PXBPointsContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowRight, Copy, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { UserProfile } from '@/types/pxb';
import { PublicKey } from '@solana/web3.js';

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
  const { 
    mintPoints, 
    generateReferralLink, 
    mintingPoints,
    fetchUserProfile
  } = usePXBPoints();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState<string>(userProfile?.username || '');
  const [bio, setBio] = useState<string>(userProfile?.bio || '');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [referralLink, setReferralLink] = useState<string>('');
  const [isGeneratingReferral, setIsGeneratingReferral] = useState<boolean>(false);
  
  useEffect(() => {
    if (userProfile) {
      setUsername(userProfile.username || '');
      setBio(userProfile.bio || '');
    }
  }, [userProfile]);
  
  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // Implement profile update logic here
      toast.success("Profile updated successfully!");
      setIsEditing(false);
      fetchUserProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleMintPoints = async () => {
    try {
      await mintPoints();
      toast.success("Points minted successfully!");
    } catch (error) {
      console.error("Error minting points:", error);
      toast.error("Failed to mint points");
    }
  };
  
  const handleGenerateReferral = async () => {
    try {
      setIsGeneratingReferral(true);
      const link = await generateReferralLink();
      setReferralLink(link);
      toast.success("Referral link generated successfully!");
    } catch (error) {
      console.error("Error generating referral link:", error);
      toast.error("Failed to generate referral link");
    } finally {
      setIsGeneratingReferral(false);
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Copied to clipboard");
    }).catch((err) => {
      console.error('Failed to copy: ', err);
      toast.error("Failed to copy to clipboard");
    });
  };
  
  const formatWalletAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  return (
    <div className="overflow-hidden rounded-xl border border-indigo-900/30 backdrop-blur-lg bg-[#010608]">
      <div className="p-6 border-b border-indigo-900/30">
        <h2 className="text-2xl font-bold text-white">Your Profile</h2>
      </div>
      
      <div className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="relative">
            <Avatar className="w-24 h-24 border-4 border-indigo-500/30">
              <AvatarImage src="/lovable-uploads/575dd9fd-27d8-443c-8167-0af64089b9cc.png" alt="Profile" />
              <AvatarFallback className="bg-indigo-500/20 text-indigo-300 text-xl">
                {username ? username.charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-2 bg-indigo-600 rounded-full p-1.5 border-2 border-[#010608]">
              <img src="/lovable-uploads/be886d35-fbcb-4675-926c-38691ad3e311.png" alt="PXB" className="w-5 h-5" />
            </div>
          </div>
          
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-1">Username</label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="bg-indigo-900/20 border-indigo-700/30 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-1">Bio</label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself"
                    className="bg-indigo-900/20 border-indigo-700/30 text-white h-24"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSaveProfile} 
                    disabled={isSaving}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {isSaving ? "Saving..." : "Save Profile"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    className="border-indigo-700/50 text-indigo-300 hover:bg-indigo-900/30"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-semibold text-white mb-1">
                  {username || "Unnamed User"}
                </h3>
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-indigo-300/70 text-sm flex items-center">
                    <span>{formatWalletAddress(publicKey.toString())}</span>
                    <button 
                      onClick={() => copyToClipboard(publicKey.toString())} 
                      className="ml-1 text-indigo-400 hover:text-indigo-300"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <a 
                    href={`https://solscan.io/account/${publicKey.toString()}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center"
                  >
                    <ExternalLink size={14} className="ml-1" />
                  </a>
                </div>
                <p className="text-indigo-300/70 mb-4">
                  {bio || "No bio provided yet."}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(true)}
                    className="border-indigo-700/50 text-indigo-300 hover:bg-indigo-900/30"
                  >
                    Edit Profile
                  </Button>
                  <Button 
                    onClick={handleMintPoints} 
                    disabled={mintingPoints}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {mintingPoints ? "Minting..." : "Mint Daily Points"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-6 p-4 rounded-lg bg-indigo-900/20 border border-indigo-700/30">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-white">PXB Points</h3>
            <div className="text-2xl font-bold text-yellow-400 flex items-center">
              <img src="/lovable-uploads/be886d35-fbcb-4675-926c-38691ad3e311.png" alt="PXB" className="w-6 h-6 mr-2" />
              {localPxbPoints.toLocaleString()}
            </div>
          </div>
          <p className="text-indigo-300/70 text-sm mb-3">
            Use your PXB points to place bets, participate in trading pools, and more.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => navigate('/betting')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Place Bets
              <ArrowRight size={16} className="ml-2" />
            </Button>
            <Button 
              variant="outline" 
              onClick={handleGenerateReferral}
              disabled={isGeneratingReferral}
              className="border-indigo-700/50 text-indigo-300 hover:bg-indigo-900/30"
            >
              {isGeneratingReferral ? "Generating..." : "Generate Referral Link"}
            </Button>
          </div>
          
          {referralLink && (
            <div className="mt-3 p-3 rounded bg-indigo-950/50 border border-indigo-700/30 flex items-center justify-between">
              <div className="text-sm text-indigo-300 truncate mr-2">
                {referralLink}
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => copyToClipboard(referralLink)}
                className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/30"
              >
                <Copy size={16} />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PXBProfilePanel;
