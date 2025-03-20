
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2, ExternalLink, Sparkle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchTokenFromSolanaTracker } from '@/services/solanaTrackerService';
import { toast } from "sonner";
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const TokenSearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<{
    symbol: string;
    name: string;
    address: string;
    icon?: string;
    liquidity?: number;
    marketCap?: number;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  
  // Handle search query
  const handleSearch = async () => {
    setToken(null);
    setError(null);
    
    if (!query.trim()) {
      setError("Please enter a token name or symbol");
      return;
    }
    
    setIsSearching(true);
    const tokenData = await searchTokenFromSolanaTracker(query.trim());
    setIsSearching(false);
    
    if (tokenData) {
      setToken(tokenData);
    } else {
      setError("Token not found or error occurred. Please try a different search term.");
    }
  };
  
  // Handle key press (Enter to search)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  // Navigate to token detail page
  const navigateToToken = () => {
    if (token) {
      navigate(`/token/${token.address}`);
      setQuery('');
      setToken(null);
      setIsFocused(false);
      toast.success(`Navigating to ${token.name}`);
    }
  };
  
  // Clear search
  const clearSearch = () => {
    setQuery('');
    setToken(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // Effect to handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (inputRef.current) {
          inputRef.current.focus();
          setIsFocused(true);
        }
      }
      
      if (e.key === 'Escape') {
        setIsFocused(false);
        clearSearch();
        if (inputRef.current) {
          inputRef.current.blur();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return (
    <div className="relative z-20 max-w-xl w-full mx-auto">
      <div 
        className={cn(
          "flex items-center relative group/search transition-all duration-300 rounded-xl",
          isFocused ? "shadow-[0_0_15px_rgba(116,66,255,0.4)]" : "shadow-none"
        )}
      >
        <div className={cn(
          "absolute inset-0 rounded-xl overflow-hidden transition-opacity duration-300",
          isFocused ? "opacity-100" : "opacity-0"
        )}>
          <div className="absolute inset-0 bg-gradient-to-r from-dream-accent1/10 via-dream-accent2/15 to-dream-accent3/10"></div>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-dream-accent2/50 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-dream-accent1/50 to-transparent"></div>
        </div>
        
        <div className="flex-1 relative flex items-center glass-panel border border-white/10 rounded-xl overflow-hidden">
          <Search className={cn(
            "absolute left-3 w-5 h-5 transition-all duration-300",
            isFocused ? "text-dream-accent2" : "text-dream-foreground/40"
          )} />
          
          <Input
            ref={inputRef}
            className={cn(
              "pl-10 pr-10 py-6 h-14 bg-transparent border-none focus-visible:ring-0 text-dream-foreground placeholder:text-dream-foreground/30",
              error ? "text-red-400" : ""
            )}
            placeholder="Search for any Solana token by name or symbol..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyPress}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 100)}
          />
          
          {query && (
            <button 
              onClick={clearSearch}
              className="absolute right-3 p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-dream-foreground/50" />
            </button>
          )}
        </div>
        
        <motion.button
          className={cn(
            "ml-2 h-14 px-4 rounded-xl flex items-center justify-center gap-2 text-white transition-all",
            isSearching 
              ? "bg-dream-accent2/50 cursor-not-allowed" 
              : "bg-dream-accent2 hover:bg-dream-accent2/80"
          )}
          onClick={handleSearch}
          disabled={isSearching}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {isSearching ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Sparkle className="w-5 h-5" />
              <span>Find</span>
            </>
          )}
        </motion.button>
      </div>
      
      <AnimatePresence>
        {error && !token && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute w-full mt-2 bg-red-950/50 border border-red-500/30 rounded-lg p-3 backdrop-blur-lg text-sm flex items-center gap-2"
          >
            <AlertCircle className="text-red-400 w-4 h-4 flex-shrink-0" />
            <span className="text-red-300">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="absolute right-24 top-4 text-xs text-dream-foreground/30">
        Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded-md">Ctrl</kbd>+<kbd className="px-1.5 py-0.5 bg-white/10 rounded-md">K</kbd>
      </div>
      
      <AnimatePresence>
        {token && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute w-full mt-2 glass-panel border border-white/10 rounded-xl p-4 backdrop-blur-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {token.icon ? (
                  <img src={token.icon} alt={token.name} className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dream-accent1/30 to-dream-accent2/30 flex items-center justify-center">
                    <span className="text-lg font-bold">{token.symbol?.charAt(0) || '?'}</span>
                  </div>
                )}
                <div>
                  <h3 className="font-medium text-dream-foreground">{token.name || 'Unknown Token'}</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="text-sm text-dream-foreground/60">{token.symbol || '???'}</span>
                    {token.marketCap && (
                      <span className="text-xs text-dream-foreground/50">
                        Market Cap: ${(token.marketCap / 1000000).toFixed(2)}M
                      </span>
                    )}
                    {token.liquidity && (
                      <span className="text-xs text-dream-foreground/50">
                        Liquidity: ${(token.liquidity / 1000).toFixed(2)}K
                      </span>
                    )}
                    <a 
                      href={`https://solscan.io/token/${token.address}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-dream-accent2/80 hover:text-dream-accent2 inline-flex items-center gap-1 text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View on Solscan <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
              
              <motion.button
                className="bg-dream-accent2 hover:bg-dream-accent2/80 px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2"
                onClick={navigateToToken}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>Bet on this token</span>
                <ExternalLink className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TokenSearchBar;
