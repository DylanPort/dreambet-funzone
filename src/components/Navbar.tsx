import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Coins } from 'lucide-react';
import WalletConnectButton from './WalletConnectButton';
import ProfileButton from './ProfileButton';
import useSolanaBalance from '@/hooks/useSolanaBalance';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
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
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-xl font-display font-bold text-gradient mx-px px-[3px] my-[2px] py-[10px]">
            PumpXBounty
          </Link>
          
          <nav className="hidden md:flex space-x-8 items-center">
            <Link to="/betting" className={`nav-link flex items-center gap-1.5 ${location.pathname.includes('/betting') || location.pathname.includes('/token') ? 'text-dream-accent2' : 'text-dream-foreground/70 hover:text-dream-foreground'}`}>
              <div className="w-20 h-20 flex items-center justify-center transition-transform hover:scale-105">
                <img src="/lovable-uploads/0ac8fb50-def8-4e80-8f31-1c24a76d49de.png" alt="Betting" className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(255,61,252,0.5)]" />
              </div>
              <span>Playground</span>
            </Link>
            <Link to="/betting/my-bets" className={`nav-link flex items-center gap-1.5 ${location.pathname === '/betting/my-bets' ? 'text-dream-accent2' : 'text-dream-foreground/70 hover:text-dream-foreground'}`}>
              <div className="w-20 h-20 flex items-center justify-center transition-transform hover:scale-105">
                <img alt="My Bets" className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(123,97,255,0.5)]" src="/lovable-uploads/f4f0715a-b593-4250-b09f-b31137657bf2.png" />
              </div>
              <span>PXB Space</span>
            </Link>
            
            <ProfileButton />
            
            {pxbPoints !== null && pxbPoints > 0 ? <div className="glass-panel relative overflow-hidden py-1 px-3 flex items-center gap-1.5 text-yellow-400 group animate-pulse-subtle">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-600/10 opacity-70 group-hover:opacity-100 transition-opacity duration-300 py-[-7px]"></div>
                <div className="w-8 h-8 flex items-center justify-center">
                  <img src="/lovable-uploads/be886d35-fbcb-4675-926c-38691ad3e311.png" alt="PXB Coin" className="w-10 h-10 filter drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
                </div>
                <span className="relative z-10">{pxbPoints.toLocaleString()} PXB</span>
              </div> : userProfile && <div className="glass-panel py-1 px-3 flex items-center gap-1.5 text-yellow-400/70">
                <div className="w-8 h-8 flex items-center justify-center">
                  <img src="/lovable-uploads/be886d35-fbcb-4675-926c-38691ad3e311.png" alt="PXB Coin" className="w-10 h-10 filter drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
                </div>
                <span>0 PXB</span>
              </div>}
            
            {balance !== null}
            
            <WalletConnectButton />
          </nav>
          
          <button className="md:hidden text-dream-foreground" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      
      {isOpen && <div className="md:hidden glass-panel p-4">
          <nav className="flex flex-col space-y-4">
            <Link to="/betting" className={`py-2 flex items-center gap-2 ${location.pathname.includes('/betting') || location.pathname.includes('/token') ? 'text-dream-accent2' : 'text-dream-foreground/70'}`}>
              <div className="w-10 h-10 flex items-center justify-center transition-transform hover:scale-105">
                <img src="/lovable-uploads/0ac8fb50-def8-4e80-8f31-1c24a76d49de.png" alt="Betting" className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(255,61,252,0.5)]" />
              </div>
              <span>Betting</span>
            </Link>
            <Link to="/betting/my-bets" className={`py-2 flex items-center gap-2 ${location.pathname === '/betting/my-bets' ? 'text-dream-accent2' : 'text-dream-foreground/70'}`}>
              <div className="w-10 h-10 flex items-center justify-center transition-transform hover:scale-105">
                <img src="/lovable-uploads/e789c889-622a-41ff-8169-d6aadb9c09bf.png" alt="My Bets" className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(123,97,255,0.5)]" />
              </div>
              <span>PXB Space</span>
            </Link>
            
            <Link to="/profile" className={`py-2 flex items-center gap-2 ${location.pathname === '/profile' ? 'text-dream-accent2' : 'text-dream-foreground/70'}`}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                <img src="/lovable-uploads/be6baddd-a67e-4583-b969-a471b47274e1.png" alt="Profile" className="w-full h-full object-cover" />
              </div>
              <span>Profile</span>
            </Link>
            
            {pxbPoints !== null && pxbPoints > 0 ? <div className="py-2 flex items-center gap-2 text-yellow-400 animate-pulse-subtle">
                <div className="w-10 h-10 flex items-center justify-center">
                  <img src="/lovable-uploads/be886d35-fbcb-4675-926c-38691ad3e311.png" alt="PXB Coin" className="w-12 h-12 filter drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
                </div>
                <span>{pxbPoints.toLocaleString()} PXB</span>
              </div> : userProfile && <div className="py-2 flex items-center gap-2 text-yellow-400/70">
                <div className="w-10 h-10 flex items-center justify-center">
                  <img src="/lovable-uploads/be886d35-fbcb-4675-926c-38691ad3e311.png" alt="PXB Coin" className="w-12 h-12 filter drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
                </div>
                <span>0 PXB</span>
              </div>}
            
            {balance !== null && <div className="py-2 flex items-center gap-2 text-green-400">
                <div className="w-10 h-10 flex items-center justify-center">
                  <img src="/lovable-uploads/c84c898e-0b87-4eae-9d58-bc815b9da555.png" alt="Wallet" className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
                </div>
                <span>{balance.toFixed(2)} SOL</span>
              </div>}
            
            <div className="py-2">
              <WalletConnectButton />
            </div>
          </nav>
        </div>}
    </header>;
};
export default Navbar;