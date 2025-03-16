import React, { useState, useEffect } from 'react';
import { Coins, PartyPopper, AlertCircle, CheckCircle, UserCheck } from 'lucide-react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import WalletConnectButton from './WalletConnectButton';
import { toast } from 'sonner';
import { updateUsername } from '@/services/userService';

const PXBOnboarding: React.FC = () => {
  const { mintPoints, isLoading, userProfile, fetchUserProfile } = usePXBPoints();
  const [username, setUsername] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [hasClaimedPoints, setHasClaimedPoints] = useState(false);
  const { connected, publicKey } = useWallet();

  useEffect(() => {
    if (connected && publicKey) {
      if (!username && userProfile?.username) {
        setUsername(userProfile.username);
      } else if (!username) {
        setUsername(publicKey.toString().substring(0, 8));
      }
      
      if (userProfile?.pxbPoints >= 500) {
        setAlreadyClaimed(true);
      }
    } else {
      setAlreadyClaimed(false);
    }
  }, [connected, publicKey, userProfile, username]);

  useEffect(() => {
    if (connected) {
      fetchUserProfile();
    }
  }, [connected, fetchUserProfile]);

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use wallet address as default username if none provided
    const walletAddress = publicKey ? publicKey.toString() : '';
    const defaultUsername = walletAddress.substring(0, 8);
    
    setHasClaimedPoints(true);
    
    try {
      await mintPoints(defaultUsername);
      setShowSuccess(true);
    } catch (error) {
      console.error('Error minting points:', error);
      setHasClaimedPoints(false);
    }
  };

  const handleSaveUsername = async () => {
    if (!connected || !publicKey) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!username.trim()) {
      toast.error("Username cannot be empty");
      return;
    }

    setIsUpdatingUsername(true);
    try {
      const walletAddress = publicKey.toString();
      const success = await updateUsername(walletAddress, username);
      
      if (success) {
        toast.success("Username updated successfully");
        await fetchUserProfile();
      }
    } catch (error) {
      console.error("Error updating username:", error);
      toast.error("Failed to update username");
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  return (
    <>
      <div className="glass-panel p-6 max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-dream-accent2/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Coins className="w-8 h-8 text-dream-accent2" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Get Started with PXB Points</h2>
          <p className="text-dream-foreground/70">
            {alreadyClaimed 
              ? "You've already claimed your PXB Points!"
              : "Claim 500 PXB Points and start betting on tokens!"}
          </p>
        </div>
        
        {!connected ? (
          <div className="space-y-4">
            <p className="text-center text-dream-foreground/70 mb-4">
              Connect your wallet to claim your PXB Points
            </p>
            <div className="flex justify-center">
              <WalletConnectButton />
            </div>
          </div>
        ) : alreadyClaimed ? (
          <div className="p-4 border border-green-500/20 rounded-lg bg-green-500/5 text-center">
            <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-dream-foreground/90 font-medium">
              You've already claimed your PXB Points!
            </p>
            <p className="text-dream-foreground/70 text-sm mt-2">
              Current balance: {userProfile?.pxbPoints || 0} PXB Points
            </p>
            
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="username-update" className="block text-sm text-dream-foreground/70 mb-1 text-left">
                  Your Username
                </label>
                <div className="flex gap-2">
                  <Input
                    id="username-update"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full bg-dream-foreground/5"
                  />
                  <Button 
                    onClick={handleSaveUsername}
                    disabled={isUpdatingUsername || username === userProfile?.username || !username.trim()}
                    className="bg-green-500/80 hover:bg-green-500 text-white"
                    title="Save username"
                  >
                    {isUpdatingUsername ? 
                      <div className="flex items-center">
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                        <span>Saving</span>
                      </div> : 
                      <UserCheck className="w-4 h-4" />
                    }
                  </Button>
                </div>
                {userProfile?.username !== username && username.trim() && (
                  <p className="text-xs text-dream-accent2 mt-1 text-left">
                    Click save to update your username
                  </p>
                )}
              </div>
              
              <Button 
                className="w-full bg-green-500/20 text-green-500 hover:bg-green-500/30 transition-all duration-300"
                disabled={true}
              >
                Points Already Claimed
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleMint} className="space-y-4">
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
              disabled={isLoading || hasClaimedPoints}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span>Claiming...</span>
                </div>
              ) : hasClaimedPoints ? 
                "Points Claimed!" : 
                'Claim 500 PXB Points'}
            </Button>
          </form>
        )}
        
        <div className="mt-6 text-sm text-dream-foreground/50 text-center">
          By claiming PXB Points, you can participate in the betting platform and grow your reputation.
        </div>
      </div>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 border-none text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-white">
              Congratulations!
            </DialogTitle>
            <DialogDescription className="text-white/80 text-center">
              You've successfully claimed your PXB Points!
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center py-6">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 260, 
                damping: 20,
                duration: 0.6 
              }}
              className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6"
            >
              <PartyPopper className="w-12 h-12 text-yellow-300" />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-center"
            >
              <h3 className="text-xl font-bold mb-2">You Just Minted</h3>
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Coins className="w-6 h-6 text-yellow-300" />
                <span className="text-3xl font-black text-white">500 PXB Points!</span>
              </div>
              <p className="text-white/80">Your points are now stored securely and ready to use!</p>
              <p className="text-white/80 mt-2">Username: <span className="font-bold">{userProfile?.username || 'User'}</span></p>
            </motion.div>
            
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 0.1 }}
            >
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-white"
                  initial={{
                    x: '50%',
                    y: '50%',
                    opacity: 1
                  }}
                  animate={{
                    x: `${Math.random() * 100}%`,
                    y: `${Math.random() * 100}%`,
                    opacity: 0
                  }}
                  transition={{
                    duration: 1.5,
                    delay: Math.random() * 0.5,
                    repeat: Infinity,
                    repeatDelay: Math.random() * 2
                  }}
                />
              ))}
            </motion.div>
            
            <Button
              onClick={() => {
                setShowSuccess(false);
                setHasClaimedPoints(false);
                window.location.reload(); // Reload the page to refresh the UI state
              }}
              className="mt-6 bg-white text-purple-600 hover:bg-white/90 hover:text-purple-700 transition-all"
            >
              Start Betting Now!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PXBOnboarding;
