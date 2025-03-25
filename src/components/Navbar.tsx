import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Coins } from 'lucide-react';
import WalletConnectButton from './WalletConnectButton';
import ProfileButton from './ProfileButton';
import useSolanaBalance from '@/hooks/useSolanaBalance';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import EarlyUserBonusBanner from './EarlyUserBonusBanner';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();
  const {
    balance
  } = useSolanaBalance();
  const {
    userProfile,
    fetchUserProfile
  } = usePXBPoints();
  const [pxbPoints, setPxbPoints] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (userProfile) {
      setPxbPoints(userProfile.pxbPoints);
    }
  }, [userProfile]);

  useEffect(() => {
    if (!userProfile) return;
    const channel = supabase.channel('public:users').on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'users',
      filter: `id=eq.${userProfile.id}`
    }, payload => {
      console.log('User data updated:', payload);
      if (payload.new && 'points' in payload.new) {
        setPxbPoints(payload.new.points as number);
        fetchUserProfile();
      }
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile, fetchUserProfile]);

  return <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'backdrop-blur-lg bg-dream-background/80 shadow-lg' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-1.5">
          <Link to="/" className="flex items-center py-2">
            <img alt="PumpXBounty" className="h-14 filter drop-shadow-[0_0_8px_rgba(0,255,255,0.6)]" src="/lovable-uploads/e40f498f-c7e1-4571-9713-0a90008ed233.png" />
          </Link>
          
          <nav className="hidden md:flex space-x-4 items-center">
            <Link to="/betting" className={`nav-link flex items-center gap-1 ${location.pathname.includes('/betting') || location.pathname.includes('/token') ? 'text-green-400' : 'text-dream-foreground/70 hover:text-dream-foreground'}`}>
              <div className="w-12 h-12 flex items-center justify-center transition-transform hover:scale-105">
                <img src="/lovable-uploads/0ac8fb50-def8-4e80-8f31-1c24a76d49de.png" alt="Betting" className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(255,61,252,0.5)]" />
              </div>
              <span className="text-sm">Playground</span>
            </Link>
            <Link to="/betting/my-bets" className={`nav-link flex items-center gap-1 ${location.pathname === '/betting/my-bets' ? 'text-green-400' : 'text-dream-foreground/70 hover:text-dream-foreground'}`}>
              <div className="w-12 h-12 flex items-center justify-center transition-transform hover:scale-105">
                <img alt="My Bets" className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(123,97,255,0.5)]" src="/lovable-uploads/f4f0715a-b593-4250-b09f-b31137657bf2.png" />
              </div>
              <span className="text-sm">PXB Space</span>
            </Link>
            
            <ProfileButton />
            
            {pxbPoints !== null && pxbPoints > 0 ? <div className="glass-panel relative overflow-hidden py-1 px-2 flex items-center gap-1 text-yellow-400 group animate-pulse-subtle">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-600/10 opacity-70 group-hover:opacity-100 transition-opacity duration-300 py-[-7px]"></div>
                <div className="w-5 h-5 flex items-center justify-center">
                  <img alt="PXB Coin" className="w-6 h-6 filter drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]" src="/lovable-uploads/d1c82b81-d141-4bf8-a3d8-7cdbbe82785a.png" />
                </div>
                <span className="relative z-10 text-xs">{pxbPoints.toLocaleString()} PXB</span>
              </div> : userProfile && <div className="glass-panel py-1 px-2 flex items-center gap-1 text-yellow-400/70">
                <div className="w-5 h-5 flex items-center justify-center">
                  <img src="/lovable-uploads/be886d35-fbcb-4675-926c-38691ad3e311.png" alt="PXB Coin" className="w-6 h-6 filter drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
                </div>
                <span className="text-xs">0 PXB</span>
              </div>}
            
            {balance !== null}
            
            <WalletConnectButton />
          </nav>
          
          <div className="md:hidden flex items-center gap-3">
            {userProfile && pxbPoints !== null && <div className="glass-panel py-1 px-2 flex items-center gap-1 text-yellow-400">
                <div className="w-4 h-4 flex items-center justify-center">
                  <img src="/lovable-uploads/be886d35-fbcb-4675-926c-38691ad3e311.png" alt="PXB Coin" className="w-5 h-5 filter drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
                </div>
                <span className="text-xs">{pxbPoints.toLocaleString()}</span>
              </div>}
            
            <button className="text-dream-foreground" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      
      <EarlyUserBonusBanner />
      
      {isOpen && <div className="md:hidden glass-panel p-3">
          <nav className="flex flex-col space-y-2">
            <Link to="/" className="flex items-center justify-center mb-2">
              <img src="/lovable-uploads/c1eb3c6e-eec2-4e22-957e-f11585370fb6.png" alt="PumpXBounty" className="h-10 filter drop-shadow-[0_0_8px_rgba(0,255,255,0.6)]" />
            </Link>
            <Link to="/betting" className={`py-1 flex items-center gap-1.5 ${location.pathname.includes('/betting') || location.pathname.includes('/token') ? 'text-green-400' : 'text-dream-foreground/70'}`}>
              <div className="w-8 h-8 flex items-center justify-center transition-transform hover:scale-105">
                <img src="/lovable-uploads/0ac8fb50-def8-4e80-8f31-1c24a76d49de.png" alt="Betting" className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(255,61,252,0.5)]" />
              </div>
              <span className="text-sm">Playground</span>
            </Link>
            <Link to="/betting/my-bets" className={`py-1 flex items-center gap-1.5 ${location.pathname === '/betting/my-bets' ? 'text-green-400' : 'text-dream-foreground/70'}`}>
              <div className="w-8 h-8 flex items-center justify-center transition-transform hover:scale-105">
                <img src="/lovable-uploads/f4f0715a-b593-4250-b09f-b31137657bf2.png" alt="My Bets" className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(123,97,255,0.5)]" />
              </div>
              <span className="text-sm">PXB Space</span>
            </Link>
            
            <Link to="/profile" className={`py-1 flex items-center gap-1.5 ${location.pathname === '/profile' ? 'text-green-400' : 'text-dream-foreground/70'}`}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                <img src="/lovable-uploads/be6baddd-a67e-4583-b969-a471b47274e1.png" alt="Profile" className="w-full h-full object-cover" />
              </div>
              <span className="text-sm">Profile</span>
            </Link>
            
            {pxbPoints !== null && pxbPoints > 0 ? <div className="py-1 flex items-center gap-1.5 text-yellow-400 animate-pulse-subtle">
                <div className="w-8 h-8 flex items-center justify-center">
                  <img src="/lovable-uploads/be886d35-fbcb-4675-926c-38691ad3e311.png" alt="PXB Coin" className="w-10 h-10 filter drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
                </div>
                <span className="text-sm">{pxbPoints.toLocaleString()} PXB</span>
              </div> : userProfile && <div className="py-1 flex items-center gap-1.5 text-yellow-400/70">
                <div className="w-8 h-8 flex items-center justify-center">
                  <img src="/lovable-uploads/be886d35-fbcb-4675-926c-38691ad3e311.png" alt="PXB Coin" className="w-10 h-10 filter drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
                </div>
                <span className="text-sm">0 PXB</span>
              </div>}
            
            {balance !== null}
            
            <div className="py-1">
              <WalletConnectButton />
            </div>
          </nav>
        </div>}
    </header>;
};

export default Navbar;
