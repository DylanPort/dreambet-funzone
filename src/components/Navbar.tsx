
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Coins } from 'lucide-react';
import WalletConnectButton from './WalletConnectButton';
import ProfileButton from './ProfileButton';
import useSolanaBalance from '@/hooks/useSolanaBalance';
import { usePXBPoints } from '@/contexts/PXBPointsContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { balance } = useSolanaBalance();
  const { userProfile } = usePXBPoints();

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

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'backdrop-blur-lg bg-dream-background/80 shadow-lg' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-xl font-display font-bold text-gradient mx-px px-[3px] my-[2px] py-[10px]">
            PumpXBounty
          </Link>
          
          <nav className="hidden md:flex space-x-8 items-center">
            <Link to="/dashboard" className={`nav-link flex items-center gap-1.5 ${location.pathname === '/dashboard' ? 'text-dream-accent2' : 'text-dream-foreground/70 hover:text-dream-foreground'}`}>
              <div className="w-10 h-10 flex items-center justify-center transition-transform hover:scale-105">
                <img src="/lovable-uploads/716d1861-1000-4986-ba2f-15693a5816af.png" alt="Bet-Scope" className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(0,238,255,0.5)]" />
              </div>
              <span>Bet-Scope</span>
            </Link>
            <Link to="/betting" className={`nav-link flex items-center gap-1.5 ${location.pathname.includes('/betting') || location.pathname.includes('/token') ? 'text-dream-accent2' : 'text-dream-foreground/70 hover:text-dream-foreground'}`}>
              <div className="w-10 h-10 flex items-center justify-center transition-transform hover:scale-105">
                <img src="/lovable-uploads/0ac8fb50-def8-4e80-8f31-1c24a76d49de.png" alt="Betting" className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(255,61,252,0.5)]" />
              </div>
              <span>Betting</span>
            </Link>
            <Link to="/betting/my-bets" className={`nav-link flex items-center gap-1.5 ${location.pathname === '/betting/my-bets' ? 'text-dream-accent2' : 'text-dream-foreground/70 hover:text-dream-foreground'}`}>
              <div className="w-10 h-10 flex items-center justify-center transition-transform hover:scale-105">
                <img src="/lovable-uploads/e789c889-622a-41ff-8169-d6aadb9c09bf.png" alt="My Bets" className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(123,97,255,0.5)]" />
              </div>
              <span>My Bets</span>
            </Link>
            
            <ProfileButton />
            
            {userProfile && (
              <div className="glass-panel relative overflow-hidden py-1 px-3 flex items-center gap-1.5 text-yellow-400 group">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-amber-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="w-4 h-4 flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
                <span className="relative z-10">{userProfile.pxbPoints.toLocaleString()} PXB</span>
              </div>
            )}
            
            {balance !== null && (
              <div className="glass-panel py-1 px-3 flex items-center gap-1.5 text-green-400">
                <div className="w-4 h-4 flex items-center justify-center">
                  <img src="/lovable-uploads/e789c889-622a-41ff-8169-d6aadb9c09bf.png" alt="Wallet" className="w-full h-full object-contain" />
                </div>
                <span>{balance.toFixed(2)} SOL</span>
              </div>
            )}
            
            <WalletConnectButton />
          </nav>
          
          <button className="md:hidden text-dream-foreground" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      
      {isOpen && (
        <div className="md:hidden glass-panel p-4">
          <nav className="flex flex-col space-y-4">
            <Link to="/dashboard" className={`py-2 flex items-center gap-2 ${location.pathname === '/dashboard' ? 'text-dream-accent2' : 'text-dream-foreground/70'}`}>
              <div className="w-10 h-10 flex items-center justify-center transition-transform hover:scale-105">
                <img src="/lovable-uploads/716d1861-1000-4986-ba2f-15693a5816af.png" alt="Bet-Scope" className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(0,238,255,0.5)]" />
              </div>
              <span>Bet-Scope</span>
            </Link>
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
              <span>My Bets</span>
            </Link>
            
            <Link to="/profile" className={`py-2 flex items-center gap-2 ${location.pathname === '/profile' ? 'text-dream-accent2' : 'text-dream-foreground/70'}`}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center overflow-hidden">
                <img src="/lovable-uploads/be6baddd-a67e-4583-b969-a471b47274e1.png" alt="Profile" className="w-full h-full object-cover" />
              </div>
              <span>Profile</span>
            </Link>
            
            {userProfile && (
              <div className="py-2 flex items-center gap-2 text-yellow-400">
                <div className="w-5 h-5 flex items-center justify-center">
                  <Coins className="w-5 h-5" />
                </div>
                <span>{userProfile.pxbPoints.toLocaleString()} PXB</span>
              </div>
            )}
            
            {balance !== null && (
              <div className="py-2 flex items-center gap-2 text-green-400">
                <div className="w-5 h-5 flex items-center justify-center">
                  <img src="/lovable-uploads/e789c889-622a-41ff-8169-d6aadb9c09bf.png" alt="Wallet" className="w-full h-full object-contain" />
                </div>
                <span>{balance.toFixed(2)} SOL</span>
              </div>
            )}
            
            <div className="py-2">
              <WalletConnectButton />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
