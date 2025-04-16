
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, User, Copy, ExternalLink, Wallet, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useToast } from '@/hooks/use-toast';

interface UserWallet {
  id: string;
  wallet_address: string;
  username?: string | null;
  display_name?: string | null;
  points: number;
  created_at: string;
}

const UserWalletSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserWallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();
  const usersPerPage = 5;
  
  // Fetch top users initially
  useEffect(() => {
    fetchTopUsers();
  }, [currentPage]);
  
  const fetchTopUsers = async () => {
    setLoading(true);
    try {
      // Count total users
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      if (count) {
        setTotalPages(Math.ceil(count / usersPerPage));
      }
      
      // Fetch users with pagination
      const { data, error } = await supabase
        .from('users')
        .select('id, wallet_address, username, display_name, points, created_at')
        .order('points', { ascending: false })
        .range((currentPage - 1) * usersPerPage, currentPage * usersPerPage - 1);
      
      if (error) throw error;
      
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchTopUsers();
      return;
    }
    
    setLoading(true);
    setIsSearching(true);
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, wallet_address, username, display_name, points, created_at')
        .or(`wallet_address.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`);
      
      if (error) throw error;
      
      setUsers(data || []);
      setTotalPages(1); // Reset pagination for search results
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    fetchTopUsers();
  };
  
  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Address Copied",
      description: "Wallet address copied to clipboard",
    });
  };
  
  const formatAddress = (address: string) => {
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="my-16">
      <motion.h2 
        className="text-3xl md:text-4xl font-bold text-center mb-8
          bg-gradient-to-r from-white via-purple-300 to-blue-300 bg-clip-text text-transparent
          flex justify-center items-center gap-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <User className="h-8 w-8 text-purple-500" />
        PXB Holders
      </motion.h2>
      
      <motion.div
        className="max-w-2xl mx-auto mb-8 relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="relative">
          <Input
            type="text"
            placeholder="Search by wallet address or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10 pr-28 py-6 bg-[#0f1628]/80 border-indigo-900/30 focus:border-indigo-500 focus:ring-indigo-500"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400/70 h-5 w-5" />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-2">
            {isSearching && (
              <Button
                size="sm"
                variant="ghost"
                onClick={clearSearch}
                className="h-8 text-xs"
              >
                Clear
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSearch}
              className="h-8 bg-indigo-600 hover:bg-indigo-700 text-xs"
            >
              Search
            </Button>
          </div>
        </div>
      </motion.div>
      
      <motion.div
        className="rounded-xl border border-indigo-900/30 bg-[#0f1628]/80 backdrop-blur-lg overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="p-5 border-b border-indigo-900/30 flex justify-between items-center">
          <h3 className="text-lg font-medium text-white">
            {isSearching ? "Search Results" : "Top PXB Holders"}
          </h3>
          <div className="text-sm text-indigo-300/70">
            Showing {users.length} {users.length === 1 ? "user" : "users"}
          </div>
        </div>
        
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="w-8 h-8 border-4 border-t-transparent border-indigo-500 rounded-full animate-spin"></div>
            </div>
          )}
          
          <Table>
            <TableHeader>
              <TableRow className="border-indigo-900/30 hover:bg-indigo-900/10">
                <TableHead className="text-indigo-300">User</TableHead>
                <TableHead className="text-indigo-300">Wallet</TableHead>
                <TableHead className="text-indigo-300 text-right">PXB Points</TableHead>
                <TableHead className="text-indigo-300 text-right">Joined</TableHead>
                <TableHead className="text-indigo-300 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user.id} className="border-indigo-900/30 hover:bg-indigo-900/10">
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-indigo-900/50 flex items-center justify-center mr-3">
                          <User className="h-4 w-4 text-indigo-400" />
                        </div>
                        <div>
                          <div className="text-white">
                            {user.display_name || user.username || "Anonymous"}
                          </div>
                          <div className="text-xs text-indigo-400/70">
                            {user.username ? `@${user.username}` : "No username"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Wallet className="h-4 w-4 text-indigo-400 mr-2" />
                        <span className="text-indigo-300/70 mr-2">{formatAddress(user.wallet_address)}</span>
                        <button 
                          onClick={() => handleCopyAddress(user.wallet_address)}
                          className="p-1 rounded hover:bg-indigo-900/50"
                        >
                          <Copy className="h-3 w-3 text-indigo-400/70" />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span className="text-yellow-500">{user.points.toLocaleString()}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-indigo-300/70">{formatDate(user.created_at)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/50"
                          asChild
                        >
                          <a href={`/profile/${user.id}`} target="_blank" rel="noopener noreferrer">
                            <span className="sr-only">View Profile</span>
                            <ChevronRight className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-indigo-300/70">
                    {isSearching 
                      ? "No users found matching your search. Try a different query." 
                      : "No users found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {!isSearching && totalPages > 1 && (
          <div className="p-4 border-t border-indigo-900/30">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  // Show pages: current-2, current-1, current, current+1, current+2
                  // Adjusted to fit within boundaries
                  const pageToShow = Math.min(
                    Math.max(
                      currentPage - 2 + i, 
                      1
                    ), 
                    totalPages
                  );
                  
                  // Skip duplicate numbers
                  if (i > 0 && pageToShow === Math.min(Math.max(currentPage - 2 + i - 1, 1), totalPages)) {
                    return null;
                  }
                  
                  return (
                    <PaginationItem key={i}>
                      <PaginationLink
                        onClick={() => setCurrentPage(pageToShow)}
                        isActive={currentPage === pageToShow}
                      >
                        {pageToShow}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default UserWalletSearch;
