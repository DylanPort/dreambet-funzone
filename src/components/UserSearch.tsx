
import React, { useState, useEffect } from 'react';
import { Search, User, Wallet, Calendar, Award } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

interface UserResult {
  wallet_address: string;
  username: string;
  points: number;
  created_at: string;
  rank?: number;
}

const UserSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [noResults, setNoResults] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setNoResults(false);
    
    try {
      // Search by wallet address or username
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`wallet_address.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
        .order('points', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Add rank information based on points
        const resultsWithRanks = data.map((user, index) => ({
          ...user,
          rank: index + 1
        }));
        
        setSearchResults(resultsWithRanks);
        setNoResults(false);
      } else {
        setSearchResults([]);
        setNoResults(true);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setNoResults(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Format wallet address to show only start and end
  const formatWalletAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <motion.div 
        className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <User className="mr-2 h-5 w-5 text-purple-400" />
          User Search
        </h3>

        <div className="flex gap-2 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search by wallet address or username"
              className="pl-10 bg-black/50 border-gray-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyPress}
            />
          </div>
          <Button 
            onClick={handleSearch} 
            disabled={isSearching || !searchQuery.trim()}
            className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </div>

        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-3">
                {searchResults.map((user, index) => (
                  <motion.div
                    key={user.wallet_address}
                    className="bg-black/50 border border-white/5 rounded-lg p-4 hover:bg-white/5 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                          {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-medium text-white">{user.username || 'Anonymous User'}</p>
                          <p className="text-sm text-gray-400 flex items-center">
                            <Wallet className="h-3 w-3 mr-1" />
                            {formatWalletAddress(user.wallet_address)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-400">{user.points.toLocaleString()} PXB</p>
                        <p className="text-xs text-gray-400 flex items-center justify-end">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(user.created_at)}
                        </p>
                      </div>
                    </div>
                    {user.rank && (
                      <div className="mt-2 pt-2 border-t border-white/5 flex justify-between items-center">
                        <span className="text-xs text-gray-400">Rank</span>
                        <span className="flex items-center text-xs font-medium text-yellow-400">
                          <Award className="h-3 w-3 mr-1" /> 
                          #{user.rank}
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {noResults && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-6 text-gray-400"
            >
              <p>No users found matching your search.</p>
              <p className="text-sm mt-1">Try using a different wallet address or username.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default UserSearch;
