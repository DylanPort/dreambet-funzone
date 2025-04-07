import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Menu } from "lucide-react"

const navLinkClass = ({ isActive }: { isActive: boolean }) => {
  return `group relative rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground data-[active]:bg-secondary data-[active]:text-secondary-foreground`;
};

const mobileNavLink = "block py-2 px-4 text-sm hover:bg-gray-100 dark:hover:bg-gray-800";

const Navbar = () => {
  const { connected, publicKey, disconnect } = useWallet();
  const { userProfile } = usePXBPoints();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  const closeMobileMenu = () => {
    setShowMobileMenu(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between py-4">
        <Link to="/" className="mr-4 flex items-center font-semibold">
          <span className="text-2xl font-bold">PXB</span>
        </Link>
      
        <nav className="hidden md:flex items-center gap-5 mr-5">
          <NavLink to="/" className={({ isActive }) => navLinkClass({ isActive })}>
            Home
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => navLinkClass({ isActive })}>
            Bets
          </NavLink>
          <NavLink to="/points-betting" className={({ isActive }) => navLinkClass({ isActive })}>
            PXB Bets
          </NavLink>
          <NavLink to="/trading" className={({ isActive }) => navLinkClass({ isActive })}>
            Trading
          </NavLink>
          <NavLink to="/community" className={({ isActive }) => navLinkClass({ isActive })}>
            Community
          </NavLink>
        </nav>
      
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="sm">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="sm:max-w-sm">
            <SheetHeader className="text-left">
              <SheetTitle>Menu</SheetTitle>
              <SheetDescription>
                Navigate the PXB ecosystem.
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-4 pt-4">
              <NavLink to="/" onClick={closeMobileMenu} className={mobileNavLink}>
                Home
              </NavLink>
              <NavLink to="/dashboard" onClick={closeMobileMenu} className={mobileNavLink}>
                Bets
              </NavLink>
              <NavLink to="/points-betting" onClick={closeMobileMenu} className={mobileNavLink}>
                PXB Bets
              </NavLink>
              <NavLink to="/trading" onClick={closeMobileMenu} className={mobileNavLink}>
                Trading
              </NavLink>
              <NavLink to="/community" onClick={closeMobileMenu} className={mobileNavLink}>
                Community
              </NavLink>
            </div>
          </SheetContent>
        </Sheet>
      
        {connected ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://avatars.dicebear.com/api/pixel-art-neutral/${publicKey?.toBase58()}.svg`} alt={userProfile?.username} />
                  <AvatarFallback>{userProfile?.username?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="absolute right-0 mt-2 w-40">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link to="/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/bets">My Bets</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => disconnect()}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button onClick={() => window.dispatchEvent(new Event('connectWallet'))}>
            Connect Wallet
          </Button>
        )}
      </div>
    </header>
  );
};

export default Navbar;
