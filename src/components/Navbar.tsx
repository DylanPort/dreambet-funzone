import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { Button } from '@/components/ui/button';
import {
  Home,
  LayoutDashboard,
  User,
  LineChart,
  TrendingUp,
  Menu,
  X,
  LogIn,
  LogOut,
  Coins
} from 'lucide-react';

interface NavbarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  className?: string;
}

const NavbarLink: React.FC<NavbarLinkProps> = ({ to, icon, label, className }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/5 transition-colors ${isActive ? 'bg-white/10 font-medium' : ''} ${className || ''}`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
};

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { connected, publicKey } = useWallet();
  const { userProfile } = usePXBPoints();
  const navigate = useNavigate();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleConnectWallet = () => {
    navigate('/dashboard');
  };

  const renderAuthButtons = () => {
    if (connected) {
      return (
        <Button variant="outline" size="sm" onClick={() => {}}>
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </Button>
      );
    } else {
      return (
        <Button size="sm" onClick={handleConnectWallet}>
          <LogIn className="w-4 h-4 mr-2" />
          Connect Wallet
        </Button>
      );
    }
  };

  const renderNavLinks = () => {
    return (
      <div className="hidden md:flex items-center gap-1">
        <NavbarLink
          to="/"
          icon={<Home size={16} />}
          label="Home"
        />
        <NavbarLink
          to="/dashboard"
          icon={<LayoutDashboard size={16} />}
          label="Dashboard"
        />
        <NavbarLink
          to="/profile"
          icon={<User size={16} />}
          label="Profile"
        />
        <NavbarLink
          to="/token-betting"
          icon={<LineChart size={16} />}
          label="Tokens"
        />
        <NavbarLink
          to="/betting"
          icon={<TrendingUp size={16} />}
          label="Betting"
        />
        <NavbarLink 
          to="/bounties" 
          icon={<Coins size={16} />}
          label="Bounties"
        />
      </div>
    );
  };

  const renderMobileMenu = () => {
    if (!isMobileMenuOpen) return null;
    
    return (
      <div className="absolute top-full left-0 right-0 bg-[#12070e] border-y border-white/10 py-4 z-50">
        <div className="container px-4 flex flex-col space-y-2">
          <NavbarLink 
            to="/" 
            icon={<Home size={16} />} 
            label="Home" 
            className="py-2 px-3 rounded-md"
          />
          <NavbarLink 
            to="/dashboard" 
            icon={<LayoutDashboard size={16} />} 
            label="Dashboard" 
            className="py-2 px-3 rounded-md"
          />
          <NavbarLink 
            to="/profile" 
            icon={<User size={16} />} 
            label="Profile" 
            className="py-2 px-3 rounded-md"
          />
          <NavbarLink 
            to="/token-betting" 
            icon={<LineChart size={16} />} 
            label="Tokens" 
            className="py-2 px-3 rounded-md"
          />
          <NavbarLink 
            to="/betting" 
            icon={<TrendingUp size={16} />} 
            label="Betting" 
            className="py-2 px-3 rounded-md"
          />
          <NavbarLink 
            to="/bounties" 
            icon={<Coins size={16} />}
            label="Bounties" 
            className="py-2 px-3 rounded-md"
          />
        </div>
      </div>
    );
  };
  
  return (
    <nav className="relative bg-[#12070e] text-white/80 border-b border-white/10">
      <div className="container py-3 px-4 flex items-center justify-between">
        <Link to="/" className="font-bold text-xl">
          PXB
        </Link>

        {renderNavLinks()}

        <div className="flex items-center gap-2">
          {renderAuthButtons()}
          <Button variant="ghost" size="icon" onClick={toggleMobileMenu} className="md:hidden">
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {renderMobileMenu()}
    </nav>
  )
};

export default Navbar;
