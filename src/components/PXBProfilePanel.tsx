
import React, { useState } from 'react';
import { UserProfile } from '@/types/pxb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit2, Copy, User } from 'lucide-react';
import { toast } from 'sonner';
import { PublicKey } from '@solana/web3.js';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { supabase } from '@/integrations/supabase/client';

interface PXBProfilePanelProps {
  userProfile: UserProfile | null;
  publicKey: PublicKey;
  localPxbPoints: number;
}

const PXBProfilePanel: React.FC<PXBProfilePanelProps> = ({ userProfile, publicKey, localPxbPoints }) => {
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState(userProfile?.username || '');
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const { generatePxbId, fetchUserProfile } = usePXBPoints();
  const [myPxbId, setMyPxbId] = useState<string>('');

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
      const { error } = await supabase
        .from('users')
        .update({ username: usernameInput })
        .eq('id', userProfile.id);

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

  return (
    <div className="glass-panel p-6 rounded-lg bg-gray-900/50 border border-gray-800">
      <h2 className="text-2xl font-bold mb-1">Profile</h2>
      <p className="text-gray-400 mb-6">Manage your personal information</p>

      {/* Wallet Address */}
      <div className="mb-6">
        <h3 className="text-sm text-gray-400 mb-2">Wallet Address</h3>
        <div className="bg-gray-800/70 p-3 rounded-lg flex items-center justify-between">
          <span className="text-white/80 text-sm font-mono truncate">
            {publicKey.toString()}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
            onClick={() => copyToClipboard(publicKey.toString(), 'Wallet address copied to clipboard')}
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Username */}
      <div className="mb-6">
        <h3 className="text-sm text-gray-400 mb-2 flex justify-between items-center">
          Username
          {!isEditingUsername && (
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
              onClick={() => setIsEditingUsername(true)}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          )}
        </h3>

        {isEditingUsername ? (
          <div className="space-y-2">
            <Input
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              className="bg-gray-800/70 border-gray-700"
            />
            <div className="flex gap-2">
              <Button 
                onClick={handleUpdateUsername} 
                disabled={isSavingUsername}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isSavingUsername ? 'Saving...' : 'Save'}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => {
                  setIsEditingUsername(false);
                  setUsernameInput(userProfile?.username || '');
                }}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800/70 p-3 rounded-lg flex items-center">
            <User className="text-gray-400 w-4 h-4 mr-2" />
            <span className="text-white/80">{userProfile?.username || 'Anonymous'}</span>
          </div>
        )}
      </div>

      {/* PXB ID */}
      <div className="mb-6">
        <h3 className="text-sm text-gray-400 mb-2">PXB ID</h3>
        <div className="bg-gray-800/70 p-3 rounded-lg flex items-center justify-between">
          <span className="text-white/80 text-sm font-mono truncate">
            {myPxbId || 'Generating...'}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
            onClick={() => copyToClipboard(myPxbId, 'PXB ID copied to clipboard')}
            disabled={!myPxbId}
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-1">Your permanent ID for receiving PXB points</p>
      </div>

      {/* PXB Points */}
      <div className="mt-8">
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-400/20 via-transparent to-transparent"></div>
          
          <div className="flex items-center mb-4 relative z-10">
            <div className="w-12 h-12 rounded-full bg-green-500/30 flex items-center justify-center mr-4">
              <img src="/lovable-uploads/be886d35-fbcb-4675-926c-38691ad3e311.png" alt="PXB Coin" className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-4xl font-bold text-white">{localPxbPoints.toLocaleString()}</h3>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm relative z-10">
            <p className="text-green-100">{userProfile?.username || 'User'}</p>
            <p className="text-green-100">#{userProfile?.id?.substring(0, 8) || ''}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PXBProfilePanel;
