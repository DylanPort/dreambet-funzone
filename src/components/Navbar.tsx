import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Link, useNavigate } from 'react-router-dom';
import { usePXBPoints } from '@/contexts/pxb/PXBPointsContext';
import { 
  Home, 
  ChevronRightSquare, 
  User, 
  Users,
  LogOut,
  LogIn,
  Settings,
  Wallet
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { toast } from 'sonner';

const Navbar = () => {
  const { connected, publicKey, disconnect } = useWallet();
  const { userProfile, refreshUserProfile } = usePXBPoints();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      await disconnect();
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('username');
      refreshUserProfile();
      navigate('/');
      toast.success("Wallet disconnected successfully!");
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      toast.error("Failed to disconnect wallet. Please try again.");
    }
  };
  
  const navItems = [
    { 
      label: "Home", 
      href: "/",
      icon: Home,
    },
    { 
      label: "Betting", 
      href: "/betting",
      icon: ChevronRightSquare,
    },
    { 
      label: "Community", 
      href: "/community",
      icon: Users,
    },
    { 
      label: "Members", 
      href: "/users",
      icon: User,
    },
  ];
  
  return (
    <div className="bg-dream-background/70 backdrop-blur-md sticky top-0 z-50 border-b border-dream-foreground/5">
      <div className="container mx-auto py-4 px-6 flex items-center justify-between">
        {/* Logo and Navigation Links */}
        <div className="flex items-center space-x-6">
          <Link to="/" className="text-xl font-bold text-dream-foreground">
            PXB Game
          </Link>
          <nav className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              <Link key={item.label} to={item.href} className="flex items-center text-dream-foreground/80 hover:text-dream-foreground transition-colors">
                <item.icon className="w-4 h-4 mr-1" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        
        {/* Wallet Connect and User Profile */}
        <div className="flex items-center space-x-4">
          {connected ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://avatar.iran.liara.run/public/${userProfile?.username}`} alt={userProfile?.username || "Avatar"} />
                    <AvatarFallback>{userProfile?.username?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="h-4 w-4 mr-2" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/betting/my-bets')}>
                  <Wallet className="h-4 w-4 mr-2" />
                  <span>My Bets</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <Settings className="h-4 w-4 mr-2" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Log Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/profile">
              <Button>
                <LogIn className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
