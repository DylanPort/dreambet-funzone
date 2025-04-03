
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { User } from 'lucide-react';
import { toast } from 'sonner';

const ProfileButton = () => {
  const { userProfile, addPointsToUser, checkAndProcessReferral } = usePXBPoints();
  const { publicKey, connected } = useWallet();
  const [hasClaimedBonus, setHasClaimedBonus] = useState(false);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isActive = location.pathname === '/profile';
  
  // Show username if available, otherwise show wallet address or default text
  const displayName = userProfile?.username || 
                     (publicKey ? publicKey.toString().substring(0, 8) + '...' : 'Profile');

  useEffect(() => {
    // Check if the user has already claimed the bonus
    const profileBonusClaimed = localStorage.getItem('profile-bonus-claimed');
    if (profileBonusClaimed) {
      setHasClaimedBonus(true);
    }
  }, []);

  // Check for referral parameter
  useEffect(() => {
    if (connected && userProfile) {
      const referralCode = searchParams.get('ref');
      if (referralCode) {
        checkAndProcessReferral(referralCode);
      }
    }
  }, [connected, userProfile, searchParams, checkAndProcessReferral]);

  const handleProfileClick = async () => {
    if (connected && userProfile && !hasClaimedBonus) {
      try {
        // Only award bonus points if user hasn't claimed them before
        await addPointsToUser(2000, "Profile visit bonus");
        toast.success("You've earned 2000 PXB points for visiting your profile!");
        localStorage.setItem('profile-bonus-claimed', 'true');
        setHasClaimedBonus(true);
      } catch (error) {
        console.error("Error awarding profile visit bonus:", error);
      }
    }
  };

  return (
    <Link to="/profile" onClick={handleProfileClick}>
      <Button 
        variant="ghost"
        className={`flex items-center gap-2 transition-all duration-300 hover:bg-white/10 ${isActive ? 'text-green-400' : 'text-white/90 hover:text-white'}`}
      >
        <div className="w-5 h-5 rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-r from-dream-accent1/20 to-dream-accent3/20">
          <img 
            src="/lovable-uploads/be6baddd-a67e-4583-b969-a471b47274e1.png" 
            alt="Profile" 
            className="w-full h-full object-contain"
          />
        </div>
        <span>{connected ? displayName : 'Profile'}</span>
      </Button>
    </Link>
  );
};

export default ProfileButton;
