
import React, { useState, useRef } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { fetchTokenDataFromSolscan } from '@/services/solscanService';
import { toast } from 'sonner';

const TokenSearchBar = () => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const tokenData = await fetchTokenDataFromSolscan(query);
      
      if (tokenData) {
        toast.success(`Found token: ${tokenData.name} (${tokenData.symbol})`);
        // Clear input after successful search
        setQuery('');
      } else {
        toast.error('Token not found. Please check the address and try again.');
      }
    } catch (error) {
      toast.error('Error searching for token. Please try again.');
      console.error('Token search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search by token name or paste contract address"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-[#0A1018] border border-[#1a2e44] text-gray-300 pl-12 pr-4 py-6 rounded-xl focus:outline-none focus:border-[#00E6FD]/50 transition-colors placeholder:text-gray-500"
          disabled={isSearching}
        />
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
      </div>
    </form>
  );
};

export default TokenSearchBar;

