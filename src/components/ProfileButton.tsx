
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { User } from 'lucide-react';

const ProfileButton = () => {
  const { userProfile } = usePXBPoints();
  const { publicKey } = useWallet();
  const location = useLocation();
  
  // Show username if available, otherwise show wallet address or default text
  const displayName = userProfile?.username || 
                     (publicKey ? publicKey.toString().substring(0, 8) : 'Profile');

  return (
    <Link to="/profile">
      <Button 
        variant="ghost"
        className={`flex items-center gap-2 transition-all duration-300 hover:bg-white/10 ${
          location.pathname === '/profile' ? 'text-green-400' : 'text-white/90 hover:text-white'
        }`}
      >
        <div className="w-5 h-5 rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-r from-dream-accent1/20 to-dream-accent3/20">
          <img 
            src="/lovable-uploads/be6baddd-a67e-4583-b969-a471b47274e1.png" 
            alt="Profile" 
            className="w-full h-full object-contain"
          />
        </div>
        <span>{displayName}</span>
      </Button>
    </Link>
  );
};

export default ProfileButton;
