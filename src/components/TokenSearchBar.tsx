
import React, { useState, useRef } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const TokenSearchBar = () => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search by token name or passte contract address"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-[#0A1018] border border-[#1a2e44] text-gray-300 pl-12 pr-4 py-6 rounded-xl focus:outline-none focus:border-[#00E6FD]/50 transition-colors placeholder:text-gray-500"
        />
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
      </div>
    </div>
  );
};

export default TokenSearchBar;
