import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { LayoutDashboard, Zap, Wallet, BadgeDollarSign } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePXBPoints } from '@/contexts/pxb/PXBPointsContext';

const navLinkClass = 'flex items-center text-sm text-dream-foreground hover:text-dream-accent2 transition-colors';

const Navbar = () => {
  const { connected } = useWallet();
  const { userProfile } = usePXBPoints();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-lg border-b border-dream-foreground/10">
      <nav className="container mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center flex-1">
          <Link to="/" className="flex items-center mr-6 group">
            <span className="text-2xl font-bold text-dream-accent2">PumpFun</span>
          </Link>
          
          <div className="hidden md:flex space-x-1">
            <NavLink to="/dashboard" className={navLinkClass}>
              <LayoutDashboard className="w-4 h-4 mr-1" />
              Dashboard
            </NavLink>
            <NavLink to="/betting" className={navLinkClass}>
              <Zap className="w-4 h-4 mr-1" />
              Trade
            </NavLink>
            <NavLink to="/portfolio" className={navLinkClass}>
              <Wallet className="w-4 h-4 mr-1" />
              Portfolio
            </NavLink>
            <NavLink to="/bets" className={navLinkClass}>
              <BadgeDollarSign className="w-4 h-4 mr-1" />
              My Bets
            </NavLink>
          </div>
        </div>
        
        <div className="flex items-center">
          {connected ? (
            <span className="text-sm text-dream-foreground">Connected</span>
          ) : (
            <button className="bg-dream-accent2 text-white px-4 py-2 rounded">Connect Wallet</button>
          )}
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
