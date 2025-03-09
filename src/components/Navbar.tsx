
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, UserCircle } from 'lucide-react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isAuthenticated = false; // To be replaced with actual auth state

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link 
          to="/" 
          className="text-2xl font-display font-bold text-gradient"
        >
          DreamBet
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <div className="flex space-x-4">
            <Link
              to="/dashboard"
              className={`font-medium transition-all duration-300 ${
                location.pathname === '/dashboard'
                  ? 'text-dream-accent1 glow-text'
                  : 'text-dream-foreground/80 hover:text-dream-foreground'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/tokens"
              className={`font-medium transition-all duration-300 ${
                location.pathname === '/tokens' || location.pathname.startsWith('/token/')
                  ? 'text-dream-accent1 glow-text'
                  : 'text-dream-foreground/80 hover:text-dream-foreground'
              }`}
            >
              Tokens
            </Link>
          </div>

          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <Link to="/profile">
                <Button 
                  variant="outline" 
                  className="rounded-full border border-dream-accent1/50 hover:border-dream-accent1 hover:bg-dream-accent1/10"
                >
                  <UserCircle className="mr-2 h-4 w-4" />
                  Profile
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" className="border-dream-accent2/50 hover:border-dream-accent2 hover:bg-dream-accent2/10">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-gradient-to-r from-dream-accent1 to-dream-accent3 hover:shadow-neon text-white">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-dream-foreground"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden glass-panel animate-fade-in mt-2 py-4 px-6 rounded-lg">
          <div className="flex flex-col space-y-4">
            <Link
              to="/dashboard"
              className="font-medium py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              to="/tokens"
              className="font-medium py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Tokens
            </Link>
            <div className="pt-2 flex flex-col space-y-3">
              {isAuthenticated ? (
                <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full justify-center bg-dream-accent1/20 border border-dream-accent1/50 text-dream-foreground hover:bg-dream-accent1/30">
                    <UserCircle className="mr-2 h-4 w-4" />
                    Profile
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button 
                      variant="outline" 
                      className="w-full justify-center border-dream-accent2/50 hover:border-dream-accent2 hover:bg-dream-accent2/10"
                    >
                      Login
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                    <Button 
                      className="w-full justify-center bg-gradient-to-r from-dream-accent1 to-dream-accent3 hover:shadow-neon text-white"
                    >
                      Register
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
