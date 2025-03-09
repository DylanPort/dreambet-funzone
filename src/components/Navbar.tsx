
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import WalletConnectButton from './WalletConnectButton';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  
  // Handle scroll effect
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
  
  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);
  
  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'backdrop-blur-lg bg-dream-background/80 shadow-lg' : ''
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="text-xl font-display font-bold text-gradient">
            DreamBet
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8 items-center">
            <Link to="/" className={`nav-link ${location.pathname === '/' ? 'text-dream-accent2' : 'text-dream-foreground/70 hover:text-dream-foreground'}`}>
              Home
            </Link>
            <Link to="/betting" className={`nav-link ${location.pathname.includes('/betting') || location.pathname.includes('/token') ? 'text-dream-accent2' : 'text-dream-foreground/70 hover:text-dream-foreground'}`}>
              Betting
            </Link>
            <WalletConnectButton />
          </nav>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-dream-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden glass-panel p-4">
          <nav className="flex flex-col space-y-4">
            <Link to="/" className={`py-2 ${location.pathname === '/' ? 'text-dream-accent2' : 'text-dream-foreground/70'}`}>
              Home
            </Link>
            <Link to="/betting" className={`py-2 ${location.pathname.includes('/betting') || location.pathname.includes('/token') ? 'text-dream-accent2' : 'text-dream-foreground/70'}`}>
              Betting
            </Link>
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
