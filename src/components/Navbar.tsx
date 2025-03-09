import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, BarChart2 } from 'lucide-react';
import WalletConnectButton from './WalletConnectButton';
import ProfileButton from './ProfileButton';
import useSolanaBalance from '@/hooks/useSolanaBalance';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { balance } = useSolanaBalance();
  
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
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'backdrop-blur-lg bg-dream-background/80 shadow-lg' : ''
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-xl font-display font-bold text-gradient">
            PumpXBounty
          </Link>
          
          <nav className="hidden md:flex space-x-8 items-center">
            <Link to="/dashboard" className={`nav-link flex items-center gap-1.5 ${location.pathname === '/dashboard' ? 'text-dream-accent2' : 'text-dream-foreground/70 hover:text-dream-foreground'}`}>
              <BarChart2 size={18} />
              <span>Dashboard</span>
            </Link>
            <Link to="/betting" className={`nav-link flex items-center gap-1.5 ${location.pathname.includes('/betting') || location.pathname.includes('/token') ? 'text-dream-accent2' : 'text-dream-foreground/70 hover:text-dream-foreground'}`}>
              <div className="w-5 h-5 flex items-center justify-center">
                <img 
                  src="/lovable-uploads/0ac8fb50-def8-4e80-8f31-1c24a76d49de.png" 
                  alt="Betting" 
                  className="w-full h-full object-contain"
                />
              </div>
              <span>Betting</span>
            </Link>
            <Link to="/betting/my-bets" className={`nav-link flex items-center gap-1.5 ${location.pathname === '/betting/my-bets' ? 'text-dream-accent2' : 'text-dream-foreground/70 hover:text-dream-foreground'}`}>
              <div className="w-5 h-5 flex items-center justify-center">
                <img 
                  src="/lovable-uploads/e789c889-622a-41ff-8169-d6aadb9c09bf.png" 
                  alt="My Bets" 
                  className="w-full h-full object-contain"
                />
              </div>
              <span>My Bets</span>
            </Link>
            
            <ProfileButton />
            
            {balance !== null && (
              <div className="glass-panel py-1 px-3 flex items-center gap-1.5 text-green-400">
                <div className="w-4 h-4 flex items-center justify-center">
                  <img 
                    src="/lovable-uploads/e789c889-622a-41ff-8169-d6aadb9c09bf.png" 
                    alt="Wallet" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <span>{balance.toFixed(2)} SOL</span>
              </div>
            )}
            
            <WalletConnectButton />
          </nav>
          
          <button 
            className="md:hidden text-dream-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      
      {isOpen && (
        <div className="md:hidden glass-panel p-4">
          <nav className="flex flex-col space-y-4">
            <Link to="/dashboard" className={`py-2 flex items-center gap-2 ${location.pathname === '/dashboard' ? 'text-dream-accent2' : 'text-dream-foreground/70'}`}>
              <BarChart2 size={18} />
              <span>Dashboard</span>
            </Link>
            <Link to="/betting" className={`py-2 flex items-center gap-2 ${location.pathname.includes('/betting') || location.pathname.includes('/token') ? 'text-dream-accent2' : 'text-dream-foreground/70'}`}>
              <div className="w-5 h-5 flex items-center justify-center">
                <img 
                  src="/lovable-uploads/0ac8fb50-def8-4e80-8f31-1c24a76d49de.png" 
                  alt="Betting" 
                  className="w-full h-full object-contain"
                />
              </div>
              <span>Betting</span>
            </Link>
            <Link to="/betting/my-bets" className={`py-2 flex items-center gap-2 ${location.pathname === '/betting/my-bets' ? 'text-dream-accent2' : 'text-dream-foreground/70'}`}>
              <div className="w-5 h-5 flex items-center justify-center">
                <img 
                  src="/lovable-uploads/e789c889-622a-41ff-8169-d6aadb9c09bf.png" 
                  alt="My Bets" 
                  className="w-full h-full object-contain"
                />
              </div>
              <span>My Bets</span>
            </Link>
            <Link to="/profile" className={`py-2 flex items-center gap-2 ${location.pathname === '/profile' ? 'text-dream-accent2' : 'text-dream-foreground/70'}`}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center overflow-hidden">
                <img 
                  src="/lovable-uploads/be6baddd-a67e-4583-b969-a471b47274e1.png" 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
              <span>Profile</span>
            </Link>
            
            {balance !== null && (
              <div className="py-2 flex items-center gap-2 text-green-400">
                <div className="w-5 h-5 flex items-center justify-center">
                  <img 
                    src="/lovable-uploads/e789c889-622a-41ff-8169-d6aadb9c09bf.png" 
                    alt="Wallet" 
                    className="w-full h-full object-contain"
                  />
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
